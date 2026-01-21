export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEduzzTokenMapping } from '@/server/integration-secrets';
import { activateEntitlement, deactivateEntitlement, getActiveEntitlementCodes, isAddonPlan } from '@/lib/entitlements';
import { isLifetimePlan } from '@/lib/lifetime-plans';
import { hashPassword } from '@/lib/auth/password';
import { normalizePaymentMethod, normalizeInstallments } from '@/lib/payment-normalization';

const EDUZZ_TOKEN_MAPPING = getEduzzTokenMapping();

// 🔍 FUNÇÃO PARA DETECTAR PLANO AUTOMATICAMENTE PELOS SEUS PRODUTOS EDUZZ
function detectarPlanoEduzz(webhookData: any): { plan: string; productName: string } {
  try {
    console.log('🔍 Detectando plano do produto Eduzz:', webhookData);
    
    // ✅ CORRETO - Eduzz envia product_name direto no root
    const productName = webhookData.product_name || '';
    
    console.log(`📋 Nome do produto Eduzz recebido: "${productName}"`);
    
    // 🔍 DETECTAR POR NOME (seus produtos na Eduzz)
    const produtoLower = productName.toLowerCase();
    
    // 🌟 CLOSE FRIENDS LITE 2.0 (detectar PRIMEIRO - mais específico)
    if (produtoLower.includes('close friends lite 2.0') || 
        produtoLower.includes('cf lite 2.0') ||
        produtoLower.includes('lite 2.0')) {
      return { 
        plan: 'LITE_V2', 
        productName: `Close Friends LITE 2.0 - ${productName}` 
      };
    }
    
    // ⭐ CLOSE FRIENDS LITE ORIGINAL
    if (produtoLower.includes('close friends lite') || 
        produtoLower.includes('cf lite') ||
        (produtoLower.includes('lite') && !produtoLower.includes('2.0'))) {
      return { 
        plan: 'LITE', 
        productName: `Close Friends LITE - ${productName}` 
      };
    }
    
    // 👑 CLOSE FRIENDS VIP
    if (produtoLower.includes('close friends vip') || 
        produtoLower.includes('cf vip') ||
        produtoLower.includes('vip') ||
        produtoLower.includes('turma')) {
      return { 
        plan: 'VIP', 
        productName: `Close Friends VIP - ${productName}` 
      };
    }
    
    // 🏢 PROJETO FIIs
    if (produtoLower.includes('projeto fiis') ||
        produtoLower.includes('fiis') ||
        produtoLower.includes('fii')) {
      return {
        plan: 'FIIS',
        productName: `Projeto FIIs - ${productName}`
      };
    }
    
    // 🔢 FALLBACK POR VALOR (se não conseguir pelo nome)
    const valor = webhookData.trans_value || 0; // ✅ Campo correto da Eduzz
    console.log(`💰 Valor da compra Eduzz: R$ ${valor}`);
    
    if (valor > 0) {
      // Ajustar valores conforme seus preços na Eduzz
      if (valor >= 400) {
        return { plan: 'VIP', productName: `Produto VIP - R$ ${valor}` };
      } else {
        // Para valores menores, assumir LITE_V2 como padrão
        return { plan: 'LITE_V2', productName: `Close Friends LITE 2.0 - R$ ${valor}` };
      }
    }
    
    // 🎯 FALLBACK FINAL: LITE_V2 como padrão mais seguro
    console.log(`⚠️ Não foi possível detectar o plano Eduzz específico, usando LITE_V2 como padrão`);
    return { 
      plan: 'LITE_V2', 
      productName: `Produto Não Identificado - ${productName || 'Sem Nome'}` 
    };
    
  } catch (error) {
    console.error('❌ Erro ao detectar plano Eduzz:', error);
    return { 
      plan: 'LITE_V2', 
      productName: 'Produto com Erro de Detecção'
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

// Calcular data de expiração considerando planos vitalícios
function calculateExpirationDate(plan: string): Date | null {
  if (isLifetimePlan(plan)) {
    console.log(`🎉 Plano ${plan}: acesso vitalício (sem data de expiração).`);
    return null;
  }

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 365);
  return expirationDate;
}

// ✅ Normalizar telefone brasileiro
function normalizeBrazilPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove tudo exceto números
  const cleaned = phone.replace(/\D/g, '');
  
  // Valida se tem pelo menos 10 dígitos
  if (cleaned.length < 10) return null;
  
  // Remove código do país se existir (55)
  const withoutCountry = cleaned.startsWith('55') ? cleaned.slice(2) : cleaned;
  
  // Adiciona código do país de volta
  return `55${withoutCountry}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    console.log(`📚 Webhook Eduzz recebido para token: ${token}`);

    // Verificar se o token existe
    const integration = EDUZZ_TOKEN_MAPPING[token];
    if (!integration) {
      console.log(`❌ Token Eduzz ${token} não encontrado`);
      return NextResponse.json(
        { error: `Token Eduzz ${token} não configurado` },
        { status: 404 }
      );
    }

    console.log(`✅ Integração Eduzz encontrada: ${integration.name} → Plano ${integration.plan}`);

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

    console.log('📦 Dados do webhook Eduzz:', JSON.stringify(webhookData, null, 2));

    // 🔍 DETECTAR PLANO AUTOMATICAMENTE (DEPOIS DO PARSE)
    const { plan: planoDetectado, productName: nomeDetectado } = detectarPlanoEduzz(webhookData);
    
    // ✅ SOBRESCREVER DADOS DA INTEGRAÇÃO COM DETECÇÃO AUTOMÁTICA
    const integrationData = {
      name: nomeDetectado,
      plan: planoDetectado,
      integrationId: integration.integrationId
    };

    console.log(`✅ Plano Eduzz detectado: ${integrationData.name} → ${integrationData.plan}`);

    const isAddonPurchase = isAddonPlan(integrationData.plan);

    // ✅ CORRETO - Extrair evento usando event_name (documentação oficial Eduzz)
    const event = webhookData.event_name || '';
    console.log(`🎯 Evento Eduzz recebido: ${event}`);

    // ✅ CORRETO - Extrair informações DIRETAMENTE do webhookData (Eduzz não usa estrutura aninhada)
    const buyerEmail = webhookData.cus_email || '';
    const buyerName = webhookData.cus_name || 'Cliente Eduzz';
    const buyerPhone = normalizeBrazilPhone(webhookData.cus_cel || webhookData.cus_tel);
    const transactionId = webhookData.trans_cod || `ED_${Date.now()}`;
    const amount = webhookData.trans_value || 0;
    const productName = webhookData.product_name || '';

    // 💳 Extrair dados de pagamento
    const paymentData = webhookData.payment || {};
    const paymentMethod = paymentData?.method || null;
    const installments = normalizeInstallments(
      paymentData?.totalOfInstallments || 1
    );

    console.log('🔍 Dados extraídos do Eduzz:', {
      event,
      buyerEmail,
      buyerName,
      buyerPhone,
      transactionId,
      amount,
      productName,
      plan: integrationData.plan,
      integrationName: integrationData.name,
      token: token,
      paymentMethod,
      installments
    });

    // ✅ CORRETO - Processar eventos de REEMBOLSO/CANCELAMENTO (nomes oficiais Eduzz)
    if (event === 'invoice_refunded' || event === 'invoice_canceled') {
      console.log(`🚫 Evento de ${event} no Eduzz - revogando acesso`);
      
      if (!buyerEmail || !buyerEmail.includes('@')) {
        console.log('❌ Email inválido para reembolso Eduzz:', buyerEmail);
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
        const treatAsAddon = isAddonPurchase && user.plan !== integrationData.plan;
        let updatedUser = user;

        console.log(`♻️ Revogando acesso do produto ${integrationData.plan} (Eduzz)`);
        await deactivateEntitlement(prisma, {
          userId: user.id,
          code: integrationData.plan,
          origin: 'EDUZZ',
        });

        const otherActiveEntitlements = await prisma.userEntitlement.findMany({
          where: {
            userId: user.id,
            status: 'ACTIVE',
            NOT: { code: integrationData.plan },
          },
          select: { code: true, status: true, expiresAt: true },
        });

        const hasAnotherActivePlan = getActiveEntitlementCodes(otherActiveEntitlements).length > 0;
        const shouldDeactivatePrimaryPlan = !treatAsAddon && user.plan === integrationData.plan && !hasAnotherActivePlan;

        if (treatAsAddon) {
          console.log(`✅ Complemento ${integrationData.plan} removido sem afetar outros produtos`);
        } else if (shouldDeactivatePrimaryPlan) {
          console.log('🚫 Revogando plano principal sem bloquear demais produtos do usuário');
          updatedUser = await prisma.user.update({
            where: { email },
            data: {
              status: 'INACTIVE',
              plan: user.plan === integrationData.plan ? 'CANCELLED' : user.plan,
              expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ontem
              origin: 'EDUZZ'
            }
          });
        } else {
          console.log('ℹ️ Outro plano ativo encontrado; mantendo usuário ativo.');
        }

        // Registrar reembolso
        try {
          await prisma.purchase.create({
            data: {
              userId: user.id,
              amount: -(amount || 0),
              productName: `${integrationData.name} - REEMBOLSO`,
              hotmartTransactionId: transactionId,
              status: 'REFUNDED',
              paymentMethod: normalizePaymentMethod(paymentMethod),
              installments: installments,
              platform: 'EDUZZ'
            }
          });
          console.log(`💸 Reembolso Eduzz registrado: -${amount} - ${integrationData.name}`);
        } catch (purchaseError) {
          console.error('⚠️ Erro ao registrar reembolso Eduzz:', purchaseError);
        }

        await prisma.$disconnect();

        return NextResponse.json({
          success: true,
          message: treatAsAddon
            ? `Reembolso Eduzz processado - complemento ${integrationData.plan} removido`
            : `Reembolso Eduzz processado - produto principal revogado`,
          platform: 'Eduzz',
          event: event,
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            status: updatedUser.status,
            blocked: false,
          },
          entitlementRemoved: treatAsAddon,
        });
      } else {
        await prisma.$disconnect();

        return NextResponse.json({
          success: true,
          message: 'Usuário não encontrado - reembolso registrado',
          platform: 'Eduzz',
          email: email,
          event: event,
        });
      }
    }

    // ✅ CORRETO - Processar eventos de COMPRA (nome oficial Eduzz)
    if (event !== 'invoice_paid') {
      console.log(`📝 Evento Eduzz ${event} não processado pelo sistema`);
      return NextResponse.json({
        success: true,
        message: `Evento Eduzz ${event} recebido mas não processado`,
        platform: 'Eduzz',
        event: event
      });
    }

    console.log(`✅ Processando evento de compra Eduzz: ${event}`);

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
    let treatedAsAddon = false;
    let entitlementExpiration: Date | null = null;

    if (user) {
      // ATUALIZAR usuário existente
      console.log(`🔄 Atualizando usuário existente: ${email}`);

      treatedAsAddon = isAddonPurchase && user.plan !== integrationData.plan;
      const phonePayload = buyerPhone && !user.phone ? { phone: buyerPhone } : {};

      if (treatedAsAddon) {
        console.log(`➕ Ativando complemento ${integrationData.plan} para ${email} via Eduzz`);
        entitlementExpiration = calculateExpirationDate(integrationData.plan);
        user = await prisma.user.update({
          where: { email },
          data: {
            status: 'ACTIVE',
            hotmartCustomerId: transactionId,
            origin: 'EDUZZ',
            ...phonePayload
          }
        });
      } else {
        const nextExpiration = calculateExpirationDate(integrationData.plan);
        entitlementExpiration = isAddonPurchase ? nextExpiration : entitlementExpiration;

        user = await prisma.user.update({
          where: { email },
          data: {
            plan: integrationData.plan,
            status: 'ACTIVE',
            hotmartCustomerId: transactionId,
            expirationDate: nextExpiration,
            origin: 'EDUZZ',
            ...phonePayload
          }
        });
      }

      console.log(`✅ Usuário atualizado via Eduzz: ${email} → ${integrationData.plan}`);

    } else {
      // CRIAR novo usuário
      isNewUser = true;
      tempPassword = generateSecurePassword();
      const hashedPassword = await hashPassword(tempPassword);

      console.log(`➕ Criando novo usuário via Eduzz: ${email}`);

      const nameParts = buyerName.split(' ');
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'Eduzz';

      const nextExpiration = calculateExpirationDate(integrationData.plan);
      entitlementExpiration = isAddonPurchase ? nextExpiration : entitlementExpiration;

      user = await prisma.user.create({
        data: {
          email: email,
          firstName: firstName,
          lastName: lastName,
          phone: buyerPhone ?? null,
          plan: integrationData.plan,
          status: 'ACTIVE',
          hotmartCustomerId: transactionId,
          expirationDate: nextExpiration,
          origin: 'EDUZZ',
          password: hashedPassword,
          passwordCreatedAt: new Date(),
          mustChangePassword: true,
          customPermissions: '[]'
        }
      });

      console.log(`✅ Novo usuário criado via Eduzz: ${email} → ${integrationData.plan}`);
    }

    if (isAddonPurchase) {
      const expiresAt = entitlementExpiration ?? calculateExpirationDate(integrationData.plan);
      await activateEntitlement(prisma, {
        userId: user.id,
        code: integrationData.plan,
        origin: 'EDUZZ',
        expiresAt,
      });
      if (expiresAt) {
        console.log(`🎁 Complemento ${integrationData.plan} ativo até ${expiresAt.toISOString()} via Eduzz`);
      } else {
        console.log(`🎁 Complemento ${integrationData.plan} ativado com acesso vitalício via Eduzz.`);
      }
    }

    // Registrar compra
    try {
      await prisma.purchase.create({
        data: {
          userId: user.id,
          amount: amount || 0,
          productName: integrationData.name,
          hotmartTransactionId: transactionId,
          status: 'COMPLETED',
          paymentMethod: normalizePaymentMethod(paymentMethod),
          installments: installments,
          platform: 'EDUZZ'
        }
      });
      console.log(`💰 Compra Eduzz registrada: ${amount} - ${integrationData.name} (${normalizePaymentMethod(paymentMethod)}, ${installments}x)`);
    } catch (purchaseError) {
      console.error('⚠️ Erro ao registrar compra Eduzz:', purchaseError);
    }

    await prisma.$disconnect();

    const response = {
      success: true,
      message: `Webhook Eduzz processado com sucesso`,
      platform: 'Eduzz',
      integration: {
        id: integrationData.integrationId,
        name: integrationData.name,
        plan: integrationData.plan,
        token: token
      },
      productDetection: {
        detectedPlan: integrationData.plan,
        detectedProductName: integrationData.name,
        originalProductName: productName,
        amount: amount
      },
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        status: user.status,
        isNewUser: isNewUser,
        tempPassword: isNewUser ? tempPassword : undefined,
        addonGranted: isAddonPurchase,
        treatedAsAddon,
      },
      transaction: {
        id: transactionId,
        amount: amount,
        product: integrationData.name
      },
      timestamp: new Date().toISOString()
    };

    console.log(`📚 Webhook Eduzz ${token} processado com sucesso:`, response);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`❌ Erro no webhook Eduzz ${params.token}:`, error);

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('❌ Erro ao desconectar:', disconnectError);
    }

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        platform: 'Eduzz',
        token: params.token,
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET para status da integração Eduzz
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  const integration = EDUZZ_TOKEN_MAPPING[token];

  if (!integration) {
    return NextResponse.json(
      { error: `Token Eduzz ${token} não encontrado` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    platform: 'Eduzz',
    integration: {
      id: integration.integrationId,
      name: 'Detecção Automática de Produtos',
      plan: 'DETECTADO_AUTOMATICAMENTE',
      token: token,
      status: 'ACTIVE',
      webhookUrl: `${new URL(request.url).origin}/api/webhooks/eduzz/${token}`,
      supportedEvents: [
        'invoice_paid',      // Fatura paga
        'invoice_refunded',  // Fatura reembolsada
        'invoice_canceled'   // Fatura cancelada
      ],
      supportedProducts: [
        'Close Friends LITE 2.0',
        'Close Friends VIP',
        'Close Friends LITE',
        'Projeto FIIs'
      ]
    },
    message: `Integração Eduzz ativa com detecção automática de produtos`,
    documentation: 'https://atendimento.eduzz.com/portal/pt/kb/articles/documenta%C3%A7%C3%A3o-de-eventos-de-altera%C3%A7%C3%A3o-no-status-da-fatura',
    timestamp: new Date().toISOString()
  });
}
