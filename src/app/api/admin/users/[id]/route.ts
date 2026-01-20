import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getActiveEntitlementCodes } from '@/lib/entitlements';
import { isLifetimePlan } from '@/lib/lifetime-plans';
import { normalizeCustomPermissions, serializeCustomPermissions } from '@/lib/custom-permissions';

async function verifyAuth() {
  try {
    const session = await auth();

    if (session?.user?.plan === 'ADMIN') {
      return session.user;
    }

    return null;
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return null;
  }
}

// GET - Buscar dados do usuário + compras
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    console.log('🔍 Buscando usuário com ID:', userId);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        entitlements: true,
      },
    });

    if (!user) {
      console.log('❌ Usuário não encontrado:', userId);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    console.log('✅ Usuário encontrado:', user.email);

    // Buscar também as compras do usuário
    const purchases = await prisma.purchase.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // Buscar dados das integrações (Hotmart/Kiwify/Eduzz) para telefone
    let hotmartData: any = null;
    let kiwifyData: any = null;
    let eduzzData: any = null;

    try {
      hotmartData = await (prisma as any).hotmartData?.findUnique?.({ where: { userId } });
    } catch (error: any) {
      console.warn('⚠️ Erro ao buscar dados Hotmart para telefone:', error.message);
    }

    try {
      kiwifyData = await (prisma as any).kiwifyData?.findUnique?.({ where: { userId } });
    } catch (error: any) {
      console.warn('⚠️ Erro ao buscar dados Kiwify para telefone:', error.message);
    }

    try {
      eduzzData = await (prisma as any).eduzzData?.findUnique?.({ where: { userId } });
    } catch (error: any) {
      console.warn('⚠️ Erro ao buscar dados Eduzz para telefone:', error.message);
    }

    const formattedPurchases = purchases.map(purchase => ({
      id: purchase.id,
      amount: purchase.amount,
      date: purchase.createdAt.toISOString(),
      product: purchase.productName || 'Produto não especificado',
      status: purchase.status,
      hotmartTransactionId: purchase.hotmartTransactionId
    }));

    // Formatar os dados do usuário conforme esperado pelo frontend
    const activeEntitlements = getActiveEntitlementCodes(user.entitlements ?? []);

    const formattedUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar || undefined,
      plan: user.plan,
      status: user.status,
      hotmartCustomerId: user.hotmartCustomerId || undefined,
      phone: user.phone || hotmartData?.phone || kiwifyData?.phone || eduzzData?.phone,
      hotmartPhone: hotmartData?.phone,
      kiwifyPhone: kiwifyData?.phone,
      eduzzPhone: eduzzData?.phone,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      totalPurchases: user.totalPurchases || 0,
      purchaseCount: user.purchaseCount || 0,
      expirationDate: user.expirationDate?.toISOString(),
      customPermissions: normalizeCustomPermissions(user.customPermissions),
      origin: user.origin,
      entitlements: user.entitlements.map(entitlement => ({
        id: entitlement.id,
        code: entitlement.code,
        status: entitlement.status,
        expiresAt: entitlement.expiresAt?.toISOString(),
        origin: entitlement.origin,
        createdAt: entitlement.createdAt.toISOString(),
        updatedAt: entitlement.updatedAt.toISOString(),
      })),
      activeEntitlements,
    };

    console.log(`✅ Encontradas ${purchases.length} compras para o usuário`);

    return NextResponse.json({ 
      user: formattedUser,
      purchases: formattedPurchases 
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar dados do usuário
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const userData = await request.json();
    
    console.log('🔄 Atualizando usuário:', userId);

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: any = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      plan: userData.plan,
      status: userData.status,
      customPermissions: serializeCustomPermissions(userData.customPermissions)
    };

    // Garantir acesso vitalício para planos específicos
    if (isLifetimePlan(userData.plan)) {
      updateData.expirationDate = null;
    } else if (userData.expirationDate) {
      updateData.expirationDate = new Date(userData.expirationDate);
    } else if (userData.expirationDate === null || userData.expirationDate === '') {
      updateData.expirationDate = null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        entitlements: true,
      },
    });

    console.log('✅ Usuário atualizado:', updatedUser.email);

    // Formatar resposta
    const activeEntitlements = getActiveEntitlementCodes(updatedUser.entitlements ?? []);

    const formattedUser = {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      avatar: updatedUser.avatar || undefined,
      plan: updatedUser.plan,
      status: updatedUser.status,
      hotmartCustomerId: updatedUser.hotmartCustomerId || undefined,
      createdAt: updatedUser.createdAt.toISOString(),
      lastLogin: updatedUser.lastLogin?.toISOString(),
      totalPurchases: updatedUser.totalPurchases || 0,
      purchaseCount: updatedUser.purchaseCount || 0,
      expirationDate: updatedUser.expirationDate?.toISOString(),
      customPermissions: normalizeCustomPermissions(updatedUser.customPermissions),
      origin: updatedUser.origin,
      entitlements: updatedUser.entitlements.map(entitlement => ({
        id: entitlement.id,
        code: entitlement.code,
        status: entitlement.status,
        expiresAt: entitlement.expiresAt?.toISOString(),
        origin: entitlement.origin,
        createdAt: entitlement.createdAt.toISOString(),
        updatedAt: entitlement.updatedAt.toISOString(),
      })),
      activeEntitlements,
    };

    return NextResponse.json({ user: formattedUser });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir usuário
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    console.log('🗑️ Excluindo usuário:', userId);

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Excluir relacionamentos primeiro (se necessário)
    await prisma.purchase.deleteMany({ where: { userId } });
    await prisma.userEntitlement.deleteMany({ where: { userId } });
    
    // Excluir usuário
    await prisma.user.delete({
      where: { id: userId }
    });

    console.log('✅ Usuário excluído:', existingUser.email);

    return NextResponse.json({ message: 'Usuário excluído com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
