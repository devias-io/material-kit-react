export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EDUZZ_TOKEN_MAPPING } from '@/data/integrations';
import { activateEntitlement, deactivateEntitlement, getActiveEntitlementCodes, isAddonPlan } from '@/lib/entitlements';
import { isLifetimePlan } from '@/lib/lifetime-plans';

// 🔍 FUNÇÃO PARA DETECTAR PLANO AUTOMATICAMENTE PELOS SEUS PRODUTOS EDUZZ
function detectarPlanoEduzz(webhookData: any): { plan: string; productName: string } {
  try {
    console.log('🔍 Detectando plano do produto Eduzz:', webhookData);
    
    // Extrair nome do produto de diferentes campos possíveis da Eduzz
    const productName = webhookData.product_name || 
                       webhookData.product?.name ||
                       webhookData.produto?.nome ||
                       webhookData.sale?.product_name ||
                       webhookData.venda?.produto ||
                       webhookData.name ||
                       '';
    
    console.log(`📋 Nome do produto Eduzz recebido: "${productName}"`);
    
    // 🔍 DETECTAR POR NOME (seus 2 produtos na Eduzz)
    const produtoLower = productName.toLowerCase();
    
    // 🌟 CLOSE FRIENDS LITE 2.0 (detectar PRIMEIRO - mais específico)
    if (produtoLower.includes('close friends lite 2.0') || 
        produtoLower.includes('cf lite 2.0') ||
        produtoLower.includes('lite 2.0')) {
      return { 
        plan: 'LITE_V2', 
        productName: `Close Friends LITE 2.0 Eduzz - ${productName}` 
      };
    }
    
    // ⭐ CLOSE FRIENDS LITE ORIGINAL
    if (produtoLower.includes('close friends lite') || 
        produtoLower.includes('cf lite') ||
        (produtoLower.includes('lite') && !produtoLower.includes('2.0'))) {
      return { 
        plan: 'LITE', 
        productName: `Close Friends LITE Eduzz - ${productName}` 
      };
    }
    
    // 👑 CLOSE FRIENDS VIP
    if (produtoLower.includes('close friends vip') || 
        produtoLower.includes('cf vip') ||
        produtoLower.includes('vip')) {
      return { 
        plan: 'VIP', 
        productName: `Close Friends VIP Eduzz - ${productName}` 
      };
    }
    
    // 🔢 FALLBACK POR VALOR (se não conseguir pelo nome)
    const valor = webhookData.value || webhookData.valor || webhookData.amount || 0;
    console.log(`💰 Valor da compra Eduzz: R$ ${valor}`);
    
    if (valor > 0) {
      // Ajustar valores conforme seus preços na Eduzz
      if (valor >= 150) {
        return { plan: 'VIP', productName: `Produto VIP Eduzz - R$ ${valor}` };
      } else {
        // Para valores menores, assumir LITE_V2 como padrão
        return { plan: 'LITE_V2', productName: `Close Friends LITE 2.0 Eduzz - R$ ${valor}` };
      }
    }
    
    // 🎯 FALLBACK FINAL: VIP como padrão mais seguro
    console.log(`⚠️ Não foi possível detectar o plano Eduzz específico, usando VIP como padrão`);
    return { 
      plan: 'VIP', 
      productName: `Produto Não Identificado Eduzz - ${productName || 'Sem Nome'}` 
    };
    
  } catch (error) {
    console.error('❌ Erro ao detectar plano Eduzz:', error);
    return { 
      plan: 'VIP', 
      productName: 'Produto com Erro de Detecção Eduzz'
    };
  }
}

// Função para gerar senha segura
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
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

    // Extrair evento (Eduzz usa diferentes eventos)
    const event = webhookData.event_type || webhookData.event || webhookData.tipo_evento || 'venda_aprovada';
    console.log(`🎯 Evento Eduzz recebido: ${event}`);

    // Extrair informações do Eduzz (estrutura pode variar)
    const saleData = webhookData.sale || webhookData.venda || webhookData.data || webhookData;
    const customerData = saleData.customer || saleData.cliente || saleData;
    
    const buyerEmail = customerData?.email || saleData?.email || webhookData.email;
    const buyerName = customerData?.name || customerData?.nome || saleData?.customer_name || 'Cliente Eduzz';
    const transactionId = saleData?.transaction_id || saleData?.id_transacao || saleData?.id || webhookData.transaction_id || `ED_${Date.now()}`;
    const amount = saleData?.value || saleData?.valor || saleData?.amount || 0;

    console.log('🔍 Dados extraídos do Eduzz:', {
      event, buyerEmail, buyerName, transactionId, amount,
      plan: integrationData.plan, // ✅ CORRIGIDO
      integrationName: integrationData.name, // ✅ CORRIGIDO
      token: token
    });

    // Processar diferentes tipos de eventos Eduzz
    if (event === 'venda_cancelada' || event === 'venda_estornada' || event === 'refund' || event === 'chargeback') {
      // REEMBOLSO/CANCELAMENTO - BLOQUEAR USUÁRIO
      console.log(`🚫 Evento de ${event} no Eduzz - bloqueando usuário`);
      
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
              productName: `${integrationData.name} - REEMBOLSO`, // ✅ CORRIGIDO
              hotmartTransactionId: transactionId,
              status: 'REFUNDED'
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

    // EVENTOS DE COMPRA (venda_aprovada, venda_finalizada, etc.)
    if (!['venda_aprovada', 'venda_finalizada', 'venda_confirmada', 'payment_confirmed'].includes(event)) {
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

      if (treatedAsAddon) {
        console.log(`➕ Ativando complemento ${integrationData.plan} para ${email} via Eduzz`);
        entitlementExpiration = calculateExpirationDate(integrationData.plan);
        user = await prisma.user.update({
          where: { email },
          data: {
            status: 'ACTIVE',
            hotmartCustomerId: transactionId,
            origin: 'EDUZZ'
          }
        });
      } else {
        const nextExpiration = calculateExpirationDate(integrationData.plan);
        entitlementExpiration = isAddonPurchase ? nextExpiration : entitlementExpiration;

        user = await prisma.user.update({
          where: { email },
          data: {
            plan: integrationData.plan, // 🔥 PLANO DETECTADO AUTOMATICAMENTE
            status: 'ACTIVE',
            hotmartCustomerId: transactionId,
            expirationDate: nextExpiration,
            origin: 'EDUZZ'
          }
        });
      }

      console.log(`✅ Usuário atualizado via Eduzz: ${email} → ${integrationData.plan}`);

    } else {
      // CRIAR novo usuário
      isNewUser = true;
      tempPassword = generateSecurePassword();
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
          plan: integrationData.plan, // 🔥 PLANO DETECTADO AUTOMATICAMENTE
          status: 'ACTIVE',
          hotmartCustomerId: transactionId,
          expirationDate: nextExpiration,
          origin: 'EDUZZ',
          password: tempPassword, // ⚠️ SENHA SEM HASH (deve ser corrigido em produção)
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
          productName: integrationData.name, // 🔥 NOME DETECTADO
          hotmartTransactionId: transactionId,
          status: 'COMPLETED'
        }
      });
      console.log(`💰 Compra Eduzz registrada: ${amount} - ${integrationData.name}`);
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
        originalProductName: webhookData.product_name || webhookData.name || 'N/A',
        amount: amount
      },
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        status: user.status,
        isNewUser: isNewUser,
        tempPassword: isNewUser ? tempPassword : undefined, // ✅ Para debug
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
      name: integration.name,
      plan: integration.plan,
      token: token,
      status: 'ACTIVE',
      webhookUrl: `${new URL(request.url).origin}/api/webhooks/eduzz/${token}`
    },
    message: `Integração Eduzz ${integration.name} ativa e funcionando`,
    timestamp: new Date().toISOString()
  });
}