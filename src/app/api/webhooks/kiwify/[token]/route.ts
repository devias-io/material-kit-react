export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { enviarEmailCredenciais } from '@/lib/auth/email'; // ✅ ADICIONADO
import { hashPassword } from '@/lib/auth/password'; // ✅ ADICIONADO
import { KIWIFY_TOKEN_MAPPING } from '@/data/integrations';

const prisma = new PrismaClient();

function extractString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  return '';
}

function formatProductLabel(prefix: string, displayName: string): string {
  const normalizedDisplay = displayName.trim();
  if (!normalizedDisplay) {
    return `${prefix} - Sem Nome`;
  }

  if (normalizedDisplay.toLowerCase().includes(prefix.toLowerCase())) {
    return normalizedDisplay;
  }

  return `${prefix} - ${normalizedDisplay}`;
}

function parseKiwifyAmount(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function extractProductNameFromKiwifyPayload(webhookData: any): { rawName: string; cleanedName: string } {
  const orderData = webhookData?.order || webhookData?.data?.order || webhookData?.data || {};

  const productCandidates: unknown[] = [
    webhookData?.product_name,
    webhookData?.product?.name,
    webhookData?.Product?.product_name,
    webhookData?.Product?.name,
    webhookData?.name,
    webhookData?.title,
    orderData?.product_name,
    orderData?.product_title,
    orderData?.product?.name,
    orderData?.Product?.product_name,
    orderData?.Product?.name,
    orderData?.name,
    orderData?.offer_name,
    orderData?.Product?.title,
    orderData?.plan?.name,
    orderData?.Subscription?.plan?.name,
    webhookData?.data?.product_name,
    webhookData?.data?.product?.name,
    webhookData?.payload?.product_name,
    webhookData?.payload?.product?.name,
  ];

  if (Array.isArray(orderData?.products)) {
    for (const product of orderData.products) {
      productCandidates.push(product?.name, product?.product_name, product?.title);
    }
  }

  if (Array.isArray(webhookData?.products)) {
    for (const product of webhookData.products) {
      productCandidates.push(product?.name, product?.product_name, product?.title);
    }
  }

  const rawName = productCandidates
    .map(extractString)
    .find((candidate) => candidate.length > 0) || '';

  return { rawName, cleanedName: rawName.toLowerCase() };
}

// 🔍 FUNÇÃO PARA DETECTAR PLANO AUTOMATICAMENTE PELOS SEUS PRODUTOS
function detectarPlanoKiwify(webhookData: any): { plan: string; productName: string; rawProductName: string } {
  try {
    console.log('🔍 Detectando plano do produto Kiwify:', webhookData);

    // Extrair nome do produto de diferentes campos possíveis
    const { rawName: productName, cleanedName: produtoLower } = extractProductNameFromKiwifyPayload(webhookData);
    const displayName = productName || 'Sem Nome';

    const orderData = webhookData?.order || webhookData?.data?.order || webhookData?.data || {};

    console.log(`📋 Nome do produto recebido: "${displayName}"`);

    // 🔍 DETECTAR POR NOME (seus produtos reais) - ORDEM IMPORTA!
    if (produtoLower.includes('close friends lite 2.0') ||
        produtoLower.includes('cf lite 2.0') ||
        produtoLower.includes('lite 2.0')) {
      return {
        plan: 'LITE_V2',
        productName: formatProductLabel('Close Friends LITE 2.0', displayName),
        rawProductName: productName
      };
    }

    // ⭐ CLOSE FRIENDS LITE ORIGINAL (detectar depois - menos específico)
    if (produtoLower.includes('close friends lite') ||
        produtoLower.includes('cf lite') ||
        (produtoLower.includes('lite') && !produtoLower.includes('2.0'))) {
      return {
        plan: 'LITE',
        productName: formatProductLabel('Close Friends LITE', displayName),
        rawProductName: productName
      };
    }

    // 🔄 MIGRAÇÃO CF LITE (provavelmente é LITE original)
    if (produtoLower.includes('migração') && produtoLower.includes('lite')) {
      return {
        plan: 'LITE',
        productName: formatProductLabel('Migração CF LITE', displayName),
        rawProductName: productName
      };
    }

    // 👑 CLOSE FRIENDS VIP (todas as turmas)
    if (produtoLower.includes('close friends vip') ||
        produtoLower.includes('cf vip') ||
        produtoLower.includes('vip') ||
        produtoLower.includes('turma')) {
      return {
        plan: 'VIP',
        productName: formatProductLabel('Close Friends VIP', displayName),
        rawProductName: productName
      };
    }

    // 🏢 PROJETO FIIs
    if (produtoLower.includes('projeto fiis') ||
        produtoLower.includes('fiis') ||
        produtoLower.includes('fii')) {
      return {
        plan: 'FIIS',
        productName: formatProductLabel('Projeto FIIs', displayName),
        rawProductName: productName
      };
    }

    // 📹 ANÁLISE EM VÍDEO (qual versão do LITE?)
    if (produtoLower.includes('análise') && produtoLower.includes('vídeo')) {
      // Por padrão, análise em vídeo = LITE original (você pode ajustar)
      return {
        plan: 'LITE',
        productName: formatProductLabel('Análise em Vídeo', displayName),
        rawProductName: productName
      };
    }

    // 🔢 FALLBACK POR VALOR (se não conseguir pelo nome)
    const valorCandidates = [
      webhookData?.amount,
      webhookData?.total_value,
      webhookData?.value,
      orderData?.total_value,
      orderData?.amount,
      orderData?.value,
      orderData?.price,
      orderData?.payment_value,
      orderData?.transaction_amount,
      orderData?.gross_amount,
      orderData?.charge_amount,
      orderData?.Commissions?.charge_amount,
      orderData?.Commissions?.product_base_price,
    ];

    const valor = valorCandidates
      .map(parseKiwifyAmount)
      .find((candidate) => typeof candidate === 'number' && candidate > 0);

    console.log(`💰 Valor da compra: R$ ${valor ?? 0}`);

    if (valor && valor > 0) {
      // Ajustar valores conforme seus preços reais
      if (valor >= 150) {
        return { plan: 'VIP', productName: `Produto VIP - R$ ${valor}`, rawProductName: productName };
      } else if (valor >= 100) {
        return { plan: 'FIIS', productName: `Projeto FIIs - R$ ${valor}`, rawProductName: productName };
      } else {
        // Para LITE, como diferenciar V1 de V2 por valor?
        // Assumir V2 como padrão para novos produtos
        return { plan: 'LITE_V2', productName: `Close Friends LITE 2.0 - R$ ${valor}`, rawProductName: productName };
      }
    }

    // 🎯 FALLBACK FINAL: LITE V2 como padrão mais seguro (produto mais recente)
    console.log(`⚠️ Não foi possível detectar o plano específico, usando LITE V2 como padrão`);
    return {
      plan: 'LITE_V2',
      productName: formatProductLabel('Produto Não Identificado', displayName),
      rawProductName: productName
    };

  } catch (error) {
    console.error('❌ Erro ao detectar plano:', error);
    return {
      plan: 'LITE_V2',
      productName: 'Produto com Erro de Detecção',
      rawProductName: ''
    };
  }
}

// Função para gerar senha segura
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const symbols = '!@#$%&*';
  let password = '';
  
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < 2; i++) {
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Calcular data de expiração - TODOS OS PLANOS = 1 ANO
function calculateExpirationDate(): Date {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 365);
  return expirationDate;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    console.log(`🥝 Webhook Kiwify recebido para token: ${token}`);

    // Verificar se o token existe
    const integration = KIWIFY_TOKEN_MAPPING[token];
    if (!integration) {
      console.log(`❌ Token Kiwify ${token} não encontrado`);
      return NextResponse.json(
        { error: `Token Kiwify ${token} não configurado` },
        { status: 404 }
      );
    }

    let webhookData;
    try {
      webhookData = await request.json();
    } catch (jsonError) {
      console.error('❌ Erro ao parsear JSON:', jsonError);
      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      );
    }

    console.log('📦 Dados do webhook Kiwify:', JSON.stringify(webhookData, null, 2));

    // 🔍 DETECTAR PLANO AUTOMATICAMENTE (AGORA DEPOIS DO PARSE)
    const { plan: planoDetectado, productName: nomeDetectado, rawProductName } = detectarPlanoKiwify(webhookData);
    
    // ✅ SOBRESCREVER DADOS DA INTEGRAÇÃO COM DETECÇÃO AUTOMÁTICA
    const integrationData = {
      name: nomeDetectado,
      plan: planoDetectado,
      integrationId: integration.integrationId
    };

    console.log(`✅ Integração Kiwify encontrada: ${integrationData.name} → Plano ${integrationData.plan}`);

    // Extrair evento (Kiwify usa diferentes eventos)
    const event = webhookData.event || webhookData.type || 'order.paid';
    console.log(`🎯 Evento Kiwify recebido: ${event}`);

    // Extrair informações do Kiwify (estrutura diferente do Hotmart)
    const orderData = webhookData.order || webhookData.data || webhookData;
    const customerData = orderData.Customer || orderData.customer || orderData;
    
    const buyerEmail = customerData?.email || orderData?.email || webhookData.email;
    const buyerName = customerData?.name || customerData?.full_name || orderData?.customer_name || 'Cliente Kiwify';
    const transactionId = orderData?.order_id || orderData?.id || webhookData.order_id || `KW_${Date.now()}`;
    const amountCandidates = [
      orderData?.total_value,
      orderData?.amount,
      orderData?.value,
      orderData?.price,
      orderData?.payment_value,
      orderData?.transaction_amount,
      orderData?.gross_amount,
      orderData?.charge_amount,
      orderData?.Commissions?.charge_amount,
      orderData?.Commissions?.product_base_price,
      webhookData?.amount,
      webhookData?.total_value,
      webhookData?.value,
    ];

    const amount = amountCandidates
      .map(parseKiwifyAmount)
      .find((candidate) => typeof candidate === 'number') || 0;

    console.log('🔍 Dados extraídos do Kiwify:', {
      event, buyerEmail, buyerName, transactionId, amount,
      plan: integrationData.plan, // ✅ CORRIGIDO
      integrationName: integrationData.name, // ✅ CORRIGIDO
      token: token
    });

    // Processar diferentes tipos de eventos Kiwify
    if (event === 'order.refunded' || event === 'order.cancelled' || event === 'order.chargeback') {
      // REEMBOLSO/CANCELAMENTO - BLOQUEAR USUÁRIO
      console.log(`🚫 Evento de ${event} no Kiwify - bloqueando usuário`);
      
      if (!buyerEmail || !buyerEmail.includes('@')) {
        console.log('❌ Email inválido para reembolso Kiwify:', buyerEmail);
        return NextResponse.json({
          error: 'Email do comprador é obrigatório para processar reembolso',
          received_email: buyerEmail
        }, { status: 400 });
      }

      await prisma.$connect();

      const email = buyerEmail.toLowerCase().trim();
      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        // BLOQUEAR usuário por reembolso
        user = await prisma.user.update({
          where: { email },
          data: {
            status: 'INACTIVE',
            expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ontem
            origin: 'KIWIFY'
          }
        });

        // Registrar reembolso
        try {
          await prisma.purchase.create({
            data: {
              userId: user.id,
              amount: -(amount || 0),
              productName: `${integrationData.name} - REEMBOLSO`,
              hotmartTransactionId: transactionId,
              status: 'REFUNDED'
            }
          });
          console.log(`💸 Reembolso Kiwify registrado: -${amount} - ${integrationData.name}`);
        } catch (purchaseError) {
          console.error('⚠️ Erro ao registrar reembolso Kiwify:', purchaseError);
        }

        await prisma.$disconnect();

        return NextResponse.json({
          success: true,
          message: `Reembolso Kiwify processado - usuário bloqueado`,
          platform: 'Kiwify',
          event: event,
          user: { id: user.id, email: user.email, status: user.status, blocked: true }
        });
      }
    }

    // EVENTOS DE COMPRA (order.paid, order.approved, etc.)
    if (!['order.paid', 'order.approved', 'order.completed'].includes(event)) {
      console.log(`📝 Evento Kiwify ${event} não processado pelo sistema`);
      return NextResponse.json({
        success: true,
        message: `Evento Kiwify ${event} recebido mas não processado`,
        platform: 'Kiwify',
        event: event
      });
    }

    console.log(`✅ Processando evento de compra Kiwify: ${event}`);

    // Validação mínima
    if (!buyerEmail || !buyerEmail.includes('@')) {
      console.log('❌ Email inválido:', buyerEmail);
      return NextResponse.json({
        error: 'Email do comprador é obrigatório e deve ser válido',
        received_email: buyerEmail
      }, { status: 400 });
    }

    // Conectar ao banco
    await prisma.$connect();

    // Verificar se usuário já existe
    const email = buyerEmail.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email }
    });

    let isNewUser = false;
    let tempPassword = '';

    if (user) {
      // ATUALIZAR usuário existente
      console.log(`🔄 Atualizando usuário existente: ${email}`);
      
      user = await prisma.user.update({
        where: { email },
        data: {
          plan: integrationData.plan, // 🔥 PLANO DETECTADO AUTOMATICAMENTE
          status: 'ACTIVE',
          hotmartCustomerId: transactionId,
          expirationDate: calculateExpirationDate(),
          origin: 'KIWIFY'
        }
      });
      
      console.log(`✅ Usuário atualizado via Kiwify: ${email} → ${integrationData.plan}`);
      
    } else {
      // CRIAR novo usuário
      isNewUser = true;
      tempPassword = generateSecurePassword();
      const hashedPassword = await hashPassword(tempPassword);
      
      console.log(`➕ Criando novo usuário via Kiwify: ${email}`);
      
      const nameParts = buyerName.split(' ');
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'Kiwify';
      
      user = await prisma.user.create({
        data: {
          email: email,
          firstName: firstName,
          lastName: lastName,
          plan: integrationData.plan, // 🔥 PLANO DETECTADO AUTOMATICAMENTE
          status: 'ACTIVE',
          hotmartCustomerId: transactionId,
          expirationDate: calculateExpirationDate(),
          origin: 'KIWIFY',
          password: hashedPassword, // ✅ USANDO HASH SEGURO
          passwordCreatedAt: new Date(),
          mustChangePassword: true,
          customPermissions: '[]'
        }
      });
      
      console.log(`✅ Novo usuário criado via Kiwify: ${email} → ${integrationData.plan}`);
    }

    // Registrar compra
    try {
      await prisma.purchase.create({
        data: {
          userId: user.id,
          amount: amount || 0,
          productName: integrationData.name, // 🔥 NOME DETECTADO
          hotmartTransactionId: transactionId,
          status: 'COMPLETED'
        }
      });
      console.log(`💰 Compra Kiwify registrada: ${amount} - ${integrationData.name}`);
    } catch (purchaseError) {
      console.error('⚠️ Erro ao registrar compra Kiwify:', purchaseError);
    }

    // ❌ REMOVIDO ENVIO DE EMAIL (TEMPORARIAMENTE)
    // let emailSent = false;
    // let emailError = null;
    
    // if (isNewUser && tempPassword) {
    //   try {
    //     console.log(`📧 Enviando email de boas-vindas para ${email}...`);
    //     await enviarEmailCredenciais(email, user.firstName || buyerName, tempPassword);
    //     emailSent = true;
    //     console.log('✅ Email enviado com sucesso via Kiwify!');
    //   } catch (error: any) {
    //     emailError = error.message;
    //     console.error('❌ Erro ao enviar email via Kiwify:', error);
    //   }
    // }

    await prisma.$disconnect();

    const response = {
      success: true,
      message: `Webhook Kiwify processado com sucesso`,
      platform: 'Kiwify',
      integration: {
        id: integrationData.integrationId,
        name: integrationData.name,
        plan: integrationData.plan,
        token: token
      },
      productDetection: {
        detectedPlan: integrationData.plan,
        detectedProductName: integrationData.name,
        originalProductName: rawProductName || webhookData.product_name || webhookData.name || 'N/A',
        amount: amount
      },
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        status: user.status,
        isNewUser: isNewUser,
        tempPassword: isNewUser ? tempPassword : undefined // ✅ Mostra senha para debug
      },
      transaction: {
        id: transactionId,
        amount: amount,
        product: integrationData.name
      },
      timestamp: new Date().toISOString()
    };

    console.log(`🥝 Webhook Kiwify ${token} processado com sucesso:`, response);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`❌ Erro no webhook Kiwify ${params.token}:`, error);

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('❌ Erro ao desconectar:', disconnectError);
    }

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        platform: 'Kiwify',
        token: params.token,
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET para status da integração Kiwify
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  const integration = KIWIFY_TOKEN_MAPPING[token];

  if (!integration) {
    return NextResponse.json(
      { error: `Token Kiwify ${token} não encontrado` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    platform: 'Kiwify',
    integration: {
      id: integration.integrationId,
      name: 'Detecção Automática de Produtos',
      plan: 'DETECTADO_AUTOMATICAMENTE',
      token: token,
      status: 'ACTIVE',
      webhookUrl: `${new URL(request.url).origin}/api/webhooks/kiwify/${token}`,
      supportedProducts: [
        'Close Friends LITE 2.0',
        'Close Friends VIP - Turma 7',
        'Close Friends VIP - Turma 6',
        'Close Friends VIP - Turma 5',
        'Close Friends VIP - Turma 4', 
        'Close Friends VIP - Turma 3',
        'Close Friends VIP - Turma 2',
        'Close Friends LITE',
        'Projeto FIIs - Assinatura anual',
        'Análise em vídeo - até 30 minutos',
        'Migração CF Lite'
      ]
    },
    message: `Integração Kiwify com detecção automática de ${11} produtos`,
    timestamp: new Date().toISOString()
  });
}
