import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { buildMigrationSimulation } from '@/lib/migration';

async function verifyAdmin() {
  try {
    const session = await auth();
    if (session?.user?.plan === 'ADMIN') {
      return session.user;
    }
    return null;
  } catch (error) {
    console.error('❌ Erro na verificação admin:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const targetPlan = body?.target ?? 'VIP';

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        plan: true,
        expirationDate: true,
        origin: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: user.id,
        status: 'COMPLETED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        amount: true,
        totalPaid: true,
        installmentsTotal: true,
        platform: true,
        productExternalId: true,
        productName: true,
        createdAt: true,
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Nenhuma compra encontrada para gerar migração.' }, { status: 404 });
    }

    const simulation = buildMigrationSimulation({
      user,
      purchase,
      targetPlan,
    });

    const platform = purchase.platform ?? user.origin ?? 'MANUAL';
    const normalizedName = purchase.productName?.trim();

    const orFilters = [];
    if (purchase.productExternalId) {
      orFilters.push({ externalId: purchase.productExternalId });
    }
    if (normalizedName) {
      orFilters.push({ name: { equals: normalizedName, mode: 'insensitive' } });
    }

    const migrationProduct = await prisma.migrationProduct.findFirst({
      where: {
        platform: { equals: platform, mode: 'insensitive' },
        isActive: true,
        ...(orFilters.length ? { OR: orFilters } : {}),
      },
    });

    if (!migrationProduct?.migrationCheckoutUrl) {
      return NextResponse.json(
        { error: 'Link de migração não configurado para o produto deste usuário.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ paymentUrl: migrationProduct.migrationCheckoutUrl, simulation });
  } catch (error) {
    console.error('❌ Erro ao gerar link de migração (admin):', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 400 }
    );
  }
}
