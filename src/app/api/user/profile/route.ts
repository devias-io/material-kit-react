export const dynamic = 'force-dynamic'; // 👈 ADICIONAR ESTA LINHA AQUI

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getActiveEntitlementCodes } from '@/lib/entitlements';
import { normalizeCustomPermissions } from '@/lib/custom-permissions';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }

    // Buscar dados completos do usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        purchases: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Últimas 5 compras
        },
        entitlements: true,
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }

    // Formatar dados para retorno
    const activeEntitlements = getActiveEntitlementCodes(user.entitlements ?? []);

    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
      status: user.status,
      customPermissions: normalizeCustomPermissions(user.customPermissions),
      expirationDate: user.expirationDate,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      mustChangePassword: user.mustChangePassword,
      entitlements: user.entitlements.map(entitlement => ({
        id: entitlement.id,
        code: entitlement.code,
        status: entitlement.status,
        expiresAt: entitlement.expiresAt,
        origin: entitlement.origin,
        createdAt: entitlement.createdAt,
        updatedAt: entitlement.updatedAt,
      })),
      activeEntitlements,
      totalPurchases: user.purchases.reduce((sum, p) => sum + p.amount, 0),
      purchaseCount: user.purchases.length,
      recentPurchases: user.purchases.map(p => ({
        id: p.id,
        amount: p.amount,
        productName: p.productName,
        createdAt: p.createdAt,
        status: p.status
      }))
    };

    return NextResponse.json({ user: userData });

  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const { firstName, lastName, avatar } = await request.json();

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }

    // Atualizar dados do usuário (apenas nome e avatar)
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        avatar,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        avatar: updatedUser.avatar
      }
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}