// src/app/api/webhooks/hotmart/[id]/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { activateEntitlement, deactivateEntitlement, getActiveEntitlementCodes, isAddonPlan } from '@/lib/entitlements';
import { enviarEmailCredenciais } from '@/lib/auth/email'; // ✅ ADICIONAR ENVIO DE EMAIL
import { isLifetimePlan } from '@/lib/lifetime-plans';
import { getHotmartBuyerPhone } from '@/lib/phone';

// ✅ TOKEN ÚNICO DA HOTMART CONFIGURADO
const TOKEN_MAPPING: Record<string, { name: string; plan: string; integrationId: string }> = {
  'TokendYNZMSBlDXyWPST3VZPSsaqe3JfKYJ': { name: 'Produto Fatos da Bolsa Hotmart', plan: 'VIP', integrationId: 'HM001' },
};

// 🔍 FUNÇÃO PARA DETECTAR PLANO AUTOMATICAMENTE PELOS SEUS PRODUTOS HOTMART
const HOTMART_PRODUCT_IDS = {
  LITE: new Set(['3129181']),
  LITE_V2: new Set(['5060609', '1874171', '3671256']),
  VIP: new Set(['1128762', '1762716', '2163067', '5060349', '1650879', '3670772', '2947386']),
  FIIS: new Set(['4218223']),
  RENDA_PASSIVA: new Set(['3547657']),
  AMERICA: new Set(['5325106']),
  RENDA_TURBINADA: new Set(['6558190'])
};

const RENDA_TURBINADA_TURMA2_START = new Date('2025-11-28T00:00:00Z');
const RENDA_TURBINADA_TURMA3_START = new Date('2026-01-20T00:00:00Z');

// ✅ IDs DOS PRODUTOS QUE DEVEM ENVIAR EMAIL AUTOMÁTICO
const PRODUTOS_COM_EMAIL_AUTOMATICO = new Set([
  '6558190',  // CF Renda Turbinada
  // Adicione outros IDs aqui se precisar no futuro:
  // '4218223',  // Projeto FIIs
  // '5325106',  // Projeto América
]);

function parseHotmartDate(value: any): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPurchaseDate(webhookData: any): Date | null {
  const purchaseData = webhookData.data?.purchase || webhookData.purchase || webhookData;
  const candidateDates = [
    purchaseData?.approved_date,
    purchaseData?.approvedDate,
    purchaseData?.purchase_date,
    purchaseData?.paid_at,
    purchaseData?.paidDate,
    purchaseData?.created_at,
    webhookData.data?.subscription?.approved_date,
    webhookData.event_date,
    webhookData.created_at,
    webhookData.timestamp,
  ];

  for (const candidate of candidateDates) {
    const parsed = parseHotmartDate(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function resolveRendaTurbinadaPlan(webhookData: any): { plan: 'RENDA_TURBINADA' | 'RENDA_TURBINADA_T2' | 'RENDA_TURBINADA_T3'; label: string; purchaseDate: Date | null } {
  const purchaseDate = getPurchaseDate(webhookData);
  const isTurma3 = !purchaseDate || purchaseDate >= RENDA_TURBINADA_TURMA3_START;
  const isTurma2 = !isTurma3 && purchaseDate >= RENDA_TURBINADA_TURMA2_START;

  return {
    plan: isTurma3 ? 'RENDA_TURBINADA_T3' : isTurma2 ? 'RENDA_TURBINADA_T2' : 'RENDA_TURBINADA',
    label: isTurma3 ? 'CF Renda Turbinada - Turma 3' : isTurma2 ? 'CF Renda Turbinada - Turma 2' : 'CF Renda Turbinada',
    purchaseDate,
  };
}

function normalizarIdHotmart(valor: any): string | null {
  if (!valor && valor !== 0) return null;

  if (typeof valor === 'number') {
    return valor.toString();
  }

  if (typeof valor === 'string') {
    const trimmed = valor.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

function detectarPlanoHotmart(webhookData: any): { plan: string; productName: string } {
  try {
    console.log('🔍 Detectando plano do produto Hotmart:', webhookData);

    const productData = webhookData.data?.product || webhookData.product || {};
    const productName = productData?.name || 
                       productData?.product_name ||
                       productData?.title ||
                       webhookData.product_name ||
                       webhookData.name ||
                       '';
    
    const productId = normalizarIdHotmart(
      productData?.id ||
      productData?.product_id ||
      productData?.prod ||
      webhookData.product_id ||
      webhookData.prod ||
      webhookData.id
    );

    console.log(`📋 Nome do produto Hotmart recebido: "${productName}"`);
    console.log(`🆔 ID do produto Hotmart recebido: "${productId ?? 'desconhecido'}"`);

    if (productId) {
      if (HOTMART_PRODUCT_IDS.LITE.has(productId)) {
        return {
          plan: 'LITE',
          productName: `Close Friends LITE Hotmart - Produto ${productId}`
        };
      }

      if (HOTMART_PRODUCT_IDS.LITE_V2.has(productId)) {
        return {
          plan: 'LITE_V2',
          productName: `Close Friends LITE 2.0 Hotmart - Produto ${productId}`
        };
      }

      if (HOTMART_PRODUCT_IDS.VIP.has(productId)) {
        return {
          plan: 'VIP',
          productName: `Close Friends VIP Hotmart - Produto ${productId}`
        };
      }

      if (HOTMART_PRODUCT_IDS.FIIS.has(productId)) {
        return {
          plan: 'FIIS',
          productName: `Projeto FIIs Hotmart - Produto ${productId}`
        };
      }

      if (HOTMART_PRODUCT_IDS.RENDA_PASSIVA.has(productId)) {
        return {
          plan: 'RENDA_PASSIVA',
          productName: `Projeto Renda Passiva Hotmart - Produto ${productId}`
        };
      }

      if (HOTMART_PRODUCT_IDS.AMERICA.has(productId)) {
        return {
          plan: 'AMERICA',
          productName: `Projeto Trump (América) Hotmart - Produto ${productId}`
        };
      }

      if (HOTMART_PRODUCT_IDS.RENDA_TURBINADA.has(productId)) {
        const rendaTurbinada = resolveRendaTurbinadaPlan(webhookData);
        return {
          plan: rendaTurbinada.plan,
          productName: `${rendaTurbinada.label} Hotmart - Produto ${productId}`
        };
      }
    }

    const produtoLower = productName.toLowerCase();

    if (produtoLower.includes('close friends lite 2.0') || 
        produtoLower.includes('cf lite 2.0') ||
        produtoLower.includes('lite 2.0') ||
        produtoLower.includes('lite v2')) {
      return { 
        plan: 'LITE_V2', 
        productName: `Close Friends LITE 2.0 Hotmart - ${productName}` 
      };
    }
    
    if (produtoLower.includes('close friends lite') || 
        produtoLower.includes('cf lite') ||
        (produtoLower.includes('lite') && !produtoLower.includes('2.0') && !produtoLower.includes('v2'))) {
      return { 
        plan: 'LITE', 
        productName: `Close Friends LITE Hotmart - ${productName}` 
      };
    }
    
    if (produtoLower.includes('close friends vip') ||
        produtoLower.includes('cf vip') ||
        produtoLower.includes('vip')) {
      return {
        plan: 'VIP',
        productName: `Close Friends VIP Hotmart - ${productName}`
      };
    }

    if (produtoLower.includes('renda turbinada') ||
        produtoLower.includes('cf renda')) {
      const rendaTurbinada = resolveRendaTurbinadaPlan(webhookData);
      return {
        plan: rendaTurbinada.plan,
        productName: `${rendaTurbinada.label} Hotmart - ${productName}`
      };
    }
    
    if (produtoLower.includes('projeto fiis') || 
        produtoLower.includes('fiis') ||
        produtoLower.includes('fii')) {
      return { 
        plan: 'FIIS', 
        productName: `Projeto FIIs Hotmart - ${productName}` 
      };
    }
    
    if (produtoLower.includes('renda passiva') || 
        produtoLower.includes('dividendos')) {
      return { 
        plan: 'RENDA_PASSIVA', 
        productName: `Projeto Renda Passiva Hotmart - ${productName}` 
      };
    }
    
    if (produtoLower.includes('projeto trump') || 
        produtoLower.includes('trump') ||
        produtoLower.includes('projeto américa') || 
        produtoLower.includes('america')) {
      return { 
        plan: 'AMERICA', 
        productName: `Projeto Trump (América) Hotmart - ${productName}` 
      };
    }
    
    const purchaseData = webhookData.data?.purchase || webhookData.purchase || {};
    const priceData = purchaseData?.price || {};
    const valor = priceData?.value || purchaseData?.amount || webhookData.price || 0;
    console.log(`💰 Valor da compra Hotmart: R$ ${valor}`);
    
    if (valor > 0) {
      if (valor >= 200) {
        return { plan: 'VIP', productName: `Produto VIP Hotmart - R$ ${valor}` };
      } else if (valor >= 150) {
        return { plan: 'FIIS', productName: `Projeto FIIs Hotmart - R$ ${valor}` };
      } else if (valor >= 100) {
        return { plan: 'AMERICA', productName: `Projeto América Hotmart - R$ ${valor}` };
      } else if (valor >= 50) {
        return { plan: 'LITE_V2', productName: `Close Friends LITE 2.0 Hotmart - R$ ${valor}` };
      } else {
        return { plan: 'LITE', productName: `Close Friends LITE Hotmart - R$ ${valor}` };
      }
    }
    
    const createdAt = webhookData.data?.created_at || webhookData.created_at;
    if (createdAt) {
      const productDate = new Date(createdAt);
      const cutoffDate = new Date('2023-01-01');
      
      if (productDate < cutoffDate) {
        console.log(`📅 Produto criado em ${productDate.toISOString().split('T')[0]} (antes de 2023) → LITE original`);
        return { 
          plan: 'LITE', 
          productName: `Close Friends LITE Original Hotmart - ${productName || 'Produto 2022 ou anterior'}` 
        };
      } else {
        console.log(`📅 Produto criado em ${productDate.toISOString().split('T')[0]} (2023 ou depois) → LITE 2.0`);
        return { 
          plan: 'LITE_V2', 
          productName: `Close Friends LITE 2.0 Hotmart - ${productName || 'Produto Recente'}` 
        };
      }
    }
    
    console.log(`⚠️ Não foi possível detectar o plano Hotmart específico, usando VIP como padrão`);
    return { 
      plan: 'VIP', 
      productName: `Produto Não Identificado Hotmart - ${productName || 'Sem Nome'}` 
    };
    
  } catch (error) {
    console.error('❌ Erro ao detectar plano Hotmart:', error);
    return { 
      plan: 'VIP', 
      productName: 'Produto com Erro de Detecção Hotmart'
    };
  }
}

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

function calculateExpirationDate(plan: string): Date | null {
  if (isLifetimePlan(plan)) {
    console.log(`🎉 Plano ${plan}: acesso vitalício (sem data de expiração).`);
    return null;
  }

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 365);

  console.log(`📅 Plano ${plan}: Expira em ${expirationDate.toISOString().split('T')[0]} (365 dias a partir de hoje)`);

  return expirationDate;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = params.id;
    console.log(`🔔 Webhook Hotmart recebido para token: ${token}`);

    const integration = TOKEN_MAPPING[token];
    if (!integration) {
      console.log(`❌ Token Hotmart ${token} não encontrado`);
      return NextResponse.json(
        { error: `Token Hotmart ${token} não configurado` },
        { status: 404 }
      );
    }

    console.log(`✅ Integração Hotmart encontrada: ${integration.name} → Plano ${integration.plan}`);

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

    console.log('📦 Dados do webhook Hotmart:', JSON.stringify(webhookData, null, 2));

    const { plan: planoDetectado, productName: nomeDetectado } = detectarPlanoHotmart(webhookData);
    
    const integrationData = {
      name: nomeDetectado,
      plan: planoDetectado,
      integrationId: integration.integrationId
    };

    console.log(`✅ Plano Hotmart detectado: ${integrationData.name} → ${integrationData.plan}`);

    const isAddonPurchase = isAddonPlan(integrationData.plan);

    const event = webhookData.event || 'PURCHASE_APPROVED';
    console.log(`🎯 Evento Hotmart recebido: ${event}`);

    const buyerData = webhookData.data?.buyer || webhookData.buyer || webhookData;
    const purchaseData = webhookData.data?.purchase || webhookData.purchase || webhookData;
    const productData = webhookData.data?.product || webhookData.product || webhookData;
    const buyerEmail = buyerData?.email || webhookData.email;
    const buyerName = buyerData?.name || buyerData?.full_name || webhookData.name || 'Cliente Hotmart';
    const buyerPhone = getHotmartBuyerPhone(webhookData, buyerData);
    const transactionId = purchaseData?.transaction || purchaseData?.transaction_id || 
                         webhookData.transaction || `TXN_${integration.integrationId}_${Date.now()}`;
    const amount = purchaseData?.price?.value || purchaseData?.amount || webhookData.price || 0;

    console.log('🔍 Dados extraídos da Hotmart:', {
      event, buyerEmail, buyerName, transactionId, amount,
      plan: integrationData.plan,
      integrationName: integrationData.name,
      token: token
    });

    if (event === 'PURCHASE_REFUNDED' || event === 'PURCHASE_CANCELLED' || event === 'PURCHASE_CHARGEBACK') {
      console.log(`🚫 Evento de ${event} na Hotmart - avaliando revogação`);

      if (!buyerEmail || !buyerEmail.includes('@')) {
        console.log('❌ Email inválido para reembolso Hotmart:', buyerEmail);
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

        console.log(`♻️ Revogando acesso do produto ${integrationData.plan} (Hotmart)`);
        await deactivateEntitlement(prisma, {
          userId: user.id,
          code: integrationData.plan,
          origin: 'HOTMART',
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
              expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
              origin: 'HOTMART'
            }
          });
        } else {
          console.log('ℹ️ Outro plano ativo encontrado; mantendo usuário ativo.');
        }

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
          console.log(`💸 Reembolso Hotmart registrado: -${amount} - ${integrationData.name}`);
        } catch (purchaseError) {
          console.error('⚠️ Erro ao registrar reembolso Hotmart:', purchaseError);
        }

        await prisma.$disconnect();

        return NextResponse.json({
          success: true,
          message: treatAsAddon
            ? `Reembolso Hotmart processado - complemento ${integrationData.plan} removido`
            : `Reembolso Hotmart processado - produto principal revogado`,
          platform: 'Hotmart',
          event: event,
          integration: {
            id: integrationData.integrationId,
            name: integrationData.name,
            plan: integrationData.plan,
            token: token
          },
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            status: updatedUser.status,
            blocked: false
          },
          refund: {
            id: transactionId,
            amount: amount,
            product: integrationData.name
          },
          entitlementRemoved: treatAsAddon,
          timestamp: new Date().toISOString()
        });

      } else {
        await prisma.$disconnect();
        console.log(`⚠️ Usuário ${email} não encontrado para reembolso Hotmart`);
        
        return NextResponse.json({
          success: true,
          message: 'Usuário não encontrado - reembolso registrado',
          platform: 'Hotmart',
          email: email,
          event: event
        });
      }
    }

    if (!['PURCHASE_APPROVED', 'PURCHASE_COMPLETE', 'PURCHASE_PAID'].includes(event)) {
      console.log(`📝 Evento Hotmart ${event} não processado pelo sistema`);
      return NextResponse.json({
        success: true,
        message: `Evento Hotmart ${event} recebido mas não processado`,
        platform: 'Hotmart',
        event: event
      });
    }

    console.log(`✅ Processando evento de compra Hotmart: ${event}`);

    if (!buyerEmail || !buyerEmail.includes('@')) {
      console.log('❌ Email inválido:', buyerEmail);
      return NextResponse.json({
        error: 'Email do comprador é obrigatório e deve ser válido',
        received_email: buyerEmail
      }, { status: 400 });
    }

    await prisma.$connect();

    const email = buyerEmail.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email }
    });

    let isNewUser = false;
    let tempPassword = '';
    let treatedAsAddon = false;
    let entitlementExpiration: Date | null = null;

    if (user) {
      console.log(`🔄 Atualizando usuário existente: ${email}`);

      treatedAsAddon = isAddonPurchase && user.plan !== integrationData.plan;
      const phonePayload = buyerPhone && !user.phone ? { phone: buyerPhone } : {};

      if (treatedAsAddon) {
        console.log(`➕ Ativando complemento ${integrationData.plan} para ${email}`);
        entitlementExpiration = calculateExpirationDate(integrationData.plan);
        user = await prisma.user.update({
          where: { email },
          data: {
            status: 'ACTIVE',
            hotmartCustomerId: transactionId,
            origin: 'HOTMART',
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
            origin: 'HOTMART',
            ...phonePayload
          }
        });
      }

      console.log(`✅ Usuário atualizado via Hotmart: ${email} → ${integrationData.plan} via token ${token}`);

    } else {
      isNewUser = true;
      tempPassword = generateSecurePassword();
      const hashedPassword = await hashPassword(tempPassword);

      console.log(`➕ Criando novo usuário via Hotmart: ${email}`);

      const nameParts = buyerName.split(' ');
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'Hotmart';

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
          origin: 'HOTMART',
          password: hashedPassword,
          passwordCreatedAt: new Date(),
          mustChangePassword: true,
          customPermissions: '[]'
        }
      });

      console.log(`✅ Novo usuário criado via Hotmart: ${email} → ${integrationData.plan} via token ${token}`);
      
      // ✅✅✅ ENVIAR EMAIL APENAS PARA PRODUTOS ESPECÍFICOS ✅✅✅
      if (tempPassword) {
        // Extrair ID do produto
        const productId = normalizarIdHotmart(
          productData?.id ||
          productData?.product_id ||
          productData?.prod ||
          webhookData.product_id ||
          webhookData.prod ||
          webhookData.id
        );
        
        console.log(`🔍 Produto ID: ${productId} | Verificando se deve enviar email...`);
        
        if (productId && PRODUTOS_COM_EMAIL_AUTOMATICO.has(productId)) {
          try {
            console.log(`📧 Produto ${productId} (${integrationData.plan}) está na lista de envio automático`);
            console.log(`📧 Enviando email de boas-vindas para: ${email}`);
            
            await enviarEmailCredenciais(
              email,
              firstName,
              tempPassword,
              integrationData.plan
            );
            
            console.log(`✅ Email de boas-vindas enviado com sucesso para: ${email}`);
          } catch (emailError: any) {
            console.error(`❌ Erro ao enviar email para ${email}:`, emailError.message);
            console.error(`Stack trace:`, emailError.stack);
            // Não falhar o webhook por causa de erro no email
          }
        } else {
          console.log(`⏭️ Produto ${productId} não está configurado para envio automático de email`);
          console.log(`ℹ️ Produtos com email automático: ${Array.from(PRODUTOS_COM_EMAIL_AUTOMATICO).join(', ')}`);
        }
      }
      // ✅✅✅ FIM DO BLOCO DE ENVIO DE EMAIL ✅✅✅
    }

    if (isAddonPurchase) {
      const expiresAt = entitlementExpiration ?? calculateExpirationDate(integrationData.plan);
      await activateEntitlement(prisma, {
        userId: user.id,
        code: integrationData.plan,
        origin: 'HOTMART',
        expiresAt,
      });
      if (expiresAt) {
        console.log(`🎁 Complemento ${integrationData.plan} ativo até ${expiresAt.toISOString()}`);
      } else {
        console.log(`🎁 Complemento ${integrationData.plan} ativado com acesso vitalício.`);
      }
    }

    try {
      await prisma.purchase.create({
        data: {
          userId: user.id,
          amount: amount || 0,
          productName: integrationData.name,
          hotmartTransactionId: transactionId,
          status: 'COMPLETED'
        }
      });
      console.log(`💰 Compra Hotmart registrada: ${amount} - ${integrationData.name}`);
    } catch (purchaseError) {
      console.error('⚠️ Erro ao registrar compra Hotmart:', purchaseError);
    }

    await prisma.$disconnect();

    const response = {
      success: true,
      message: `Webhook Hotmart processado com sucesso via token ${token}`,
      platform: 'Hotmart',
      integration: {
        id: integrationData.integrationId,
        name: integrationData.name,
        plan: integrationData.plan,
        token: token
      },
      productDetection: {
        detectedPlan: integrationData.plan,
        detectedProductName: integrationData.name,
        originalProductName: webhookData.data?.product?.name || webhookData.product_name || 'N/A',
        amount: amount
      },
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        status: user.status,
        isNewUser: isNewUser,
        emailSent: isNewUser && tempPassword ? 'Verificar logs' : 'N/A',
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

    console.log(`🔥 Webhook Hotmart ${token} processado com sucesso:`, response);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`❌ Erro no webhook Hotmart ${params.id}:`, error);

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('❌ Erro ao desconectar:', disconnectError);
    }

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        platform: 'Hotmart',
        token: params.id,
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = params.id;
  const integration = TOKEN_MAPPING[token];

  if (!integration) {
    return NextResponse.json(
      { error: `Token Hotmart ${token} não encontrado` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    platform: 'Hotmart',
    integration: {
      id: integration.integrationId,
      name: integration.name,
      plan: integration.plan,
      token: token,
      status: 'ACTIVE',
      webhookUrl: `${new URL(request.url).origin}/api/webhooks/hotmart/${token}`
    },
    emailConfig: {
      autoSendEnabled: true,
      productsWithAutoEmail: Array.from(PRODUTOS_COM_EMAIL_AUTOMATICO),
      productsInfo: {
        '6558190': 'CF Renda Turbinada (EMAIL AUTOMÁTICO ATIVO)'
      }
    },
    message: `Integração Hotmart ${integration.name} ativa e funcionando`,
    timestamp: new Date().toISOString()
  });
}
