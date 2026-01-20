export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isLifetimePlan } from '@/lib/lifetime-plans';
import { getHotmartBuyerPhone } from '@/lib/phone';

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

// Calcular data de expiração
function calculateExpirationDate(plan: string): Date | null {
  if (isLifetimePlan(plan)) {
    console.log(`🎉 Plano ${plan}: acesso vitalício (sem data de expiração).`);
    return null;
  }

  const expirationMap: Record<string, number> = {
    'VIP': 365,
    'LITE': 365,
    'AMERICA': 365
  };

  const days = expirationMap[plan as keyof typeof expirationMap] ?? 365;

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  return expirationDate;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook Hotmart recebido');
    
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
    
    console.log('📦 Dados completos recebidos:', JSON.stringify(webhookData, null, 2));
    
    // Extrair dados de forma flexível - tentar diferentes estruturas
    let event, productData, buyerData, purchaseData;
    
    // Estrutura 1: webhook.event, webhook.data
    if (webhookData.event && webhookData.data) {
      event = webhookData.event;
      productData = webhookData.data.product || webhookData.data;
      buyerData = webhookData.data.buyer || webhookData.data;
      purchaseData = webhookData.data.purchase || webhookData.data;
    }
    // Estrutura 2: dados diretos
    else {
      event = webhookData.event || 'PURCHASE_APPROVED';
      productData = webhookData.product || webhookData;
      buyerData = webhookData.buyer || webhookData;
      purchaseData = webhookData.purchase || webhookData;
    }
    
    console.log('📋 Dados extraídos:', { event, productData, buyerData, purchaseData });
    
    // Extrair informações essenciais com fallbacks
    const productId = productData?.ucode || productData?.id || productData?.product_id || 'unknown';
    const productName = productData?.name || productData?.product_name || 'Produto Hotmart';
    
    const buyerEmail = buyerData?.email || webhookData.email || null;
    const buyerName = buyerData?.name || buyerData?.full_name || webhookData.name || 'Cliente Hotmart';
    const buyerPhone = getHotmartBuyerPhone(webhookData, buyerData);
    
    const transactionId = purchaseData?.transaction || purchaseData?.transaction_id || 
                         webhookData.transaction || `TXN_${Date.now()}`;
    const amount = purchaseData?.price?.value || purchaseData?.amount || 
                   webhookData.price || 0;
    
    console.log('🔍 Informações finais:', {
      event, productId, productName, buyerEmail, buyerName, transactionId, amount
    });
    
    // Validação mínima
    if (!buyerEmail || !buyerEmail.includes('@')) {
      console.log('❌ Email inválido ou ausente:', buyerEmail);
      return NextResponse.json({
        error: 'Email do comprador é obrigatório e deve ser válido',
        received_email: buyerEmail
      }, { status: 400 });
    }
    
    // Mapear produto para plano - ACEITA QUALQUER PRODUTO
    const PRODUCT_PLAN_MAPPING: Record<string, string> = {
      'fb056612-bcc6-4217-9e6d-2a5d1110ac2f': 'VIP',
      'vip-plan': 'VIP',
      'lite-plan': 'LITE',
      'renda-passiva': 'RENDA_PASSIVA',
      'fiis': 'FIIS',
      'america': 'AMERICA'
    };
    
    // SEMPRE usar VIP como padrão - aceita qualquer produto
    const plan = PRODUCT_PLAN_MAPPING[productId] || 'VIP';
    console.log(`✅ Produto "${productId}" → Plano ${plan} ${PRODUCT_PLAN_MAPPING[productId] ? '(mapeado)' : '(padrão VIP)'}`);
    
    // REMOVER validação de produto - aceitar todos
    // Qualquer produto da Hotmart vai criar usuário VIP
    
    // Conectar ao banco
    await prisma.$connect();
    
    // Verificar se usuário já existe
    const email = buyerEmail.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (user) {
      // ATUALIZAR usuário existente
      console.log(`🔄 Atualizando usuário existente: ${email}`);

      const phonePayload = buyerPhone && !user.phone ? { phone: buyerPhone } : {};
      
      user = await prisma.user.update({
        where: { email },
        data: {
          plan: plan,
          status: 'ACTIVE',
          hotmartCustomerId: transactionId,
          expirationDate: calculateExpirationDate(plan),
          ...phonePayload,
          // Manter senha existente se houver
          ...(user.password ? {} : { 
            password: generateSecurePassword(),
            passwordCreatedAt: new Date(),
            mustChangePassword: true 
          })
        }
      });
      
      console.log(`✅ Usuário atualizado: ${email} → ${plan}`);
      
    } else {
      // CRIAR novo usuário
      console.log(`➕ Criando novo usuário: ${email}`);
      
      const nameParts = buyerName.split(' ');
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'Hotmart';
      
      user = await prisma.user.create({
        data: {
          email: email,
          firstName: firstName,
          lastName: lastName,
          phone: buyerPhone ?? null,
          plan: plan,
          status: 'ACTIVE',
          hotmartCustomerId: transactionId,
          expirationDate: calculateExpirationDate(plan),
          password: generateSecurePassword(),
          passwordCreatedAt: new Date(),
          mustChangePassword: true,
          customPermissions: '[]'
        }
      });
      
      console.log(`✅ Novo usuário criado: ${email} → ${plan}`);
    }
    
    // Registrar compra
    try {
      await prisma.purchase.create({
        data: {
          userId: user.id,
          amount: amount || 0,
          productName: productName,
          hotmartTransactionId: transactionId,
          status: 'COMPLETED'
        }
      });
      console.log(`💰 Compra registrada: ${amount}`);
    } catch (purchaseError) {
      console.error('⚠️ Erro ao registrar compra (não crítico):', purchaseError);
    }
    
    await prisma.$disconnect();
    
    const response = {
      success: true,
      message: 'Webhook processado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        status: user.status,
        isNewUser: !user.password
      },
      transaction: {
        id: transactionId,
        amount: amount,
        product: productName
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('🎉 Webhook processado com sucesso:', response);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Erro no webhook Hotmart:', error);
    
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('❌ Erro ao desconectar:', disconnectError);
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook Hotmart ativo e funcionando',
    timestamp: new Date().toISOString(),
    status: 'ready',
    endpoints: {
      POST: 'Receber webhooks da Hotmart',
      GET: 'Status da API'
    }
  });
}
