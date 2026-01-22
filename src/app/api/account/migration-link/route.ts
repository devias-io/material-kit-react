import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { buildMigrationSimulation } from '@/lib/migration';
import { selectMigrationCheckoutUrl } from '@/lib/migration-products';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const targetPlan = body?.target ?? 'VIP';

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    console.log('🔍 [DEBUG] Purchase encontrada:', {
      platform: purchase.platform,
      productExternalId: purchase.productExternalId,
      productName: purchase.productName,
      amount: purchase.amount,
    });

    const simulation = buildMigrationSimulation({
      user,
      purchase,
      targetPlan,
    });

    console.log('💰 [DEBUG] Simulação:', {
      finalPrice: simulation?.finalPrice,
      monthsUsed: simulation?.monthsUsed,
      monthsRemaining: simulation?.monthsRemaining,
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

    console.log('🔎 [DEBUG] Buscando produto com:', {
      platform,
      normalizedPlatform: platform.toUpperCase(),
      orFilters,
    });

    const migrationProduct = await prisma.migrationProduct.findFirst({
      where: {
        platform: { equals: platform, mode: 'insensitive' },
        isActive: true,
        ...(orFilters.length ? { OR: orFilters } : {}),
      },
    });

    console.log('📦 [DEBUG] Produto encontrado:', migrationProduct ? {
      id: migrationProduct.id,
      externalId: migrationProduct.externalId,
      name: migrationProduct.name,
      hasPriceTiers: !!migrationProduct.priceTiers,
      priceTiers: migrationProduct.priceTiers,
    } : 'NENHUM PRODUTO ENCONTRADO');

    const paymentUrl =
      migrationProduct && simulation
        ? selectMigrationCheckoutUrl(migrationProduct, simulation.finalPrice)
        : null;

    console.log('🔗 [DEBUG] Link gerado:', paymentUrl ? 'SIM' : 'NÃO');

    if (!paymentUrl) {
      console.error('❌ [DEBUG] Falha ao gerar link:', {
        temProduto: !!migrationProduct,
        temSimulacao: !!simulation,
        finalPrice: simulation?.finalPrice,
      });
      
      return NextResponse.json(
        { error: 'Link de migração não configurado para o seu produto.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ paymentUrl, simulation });
  } catch (error) {
    console.error('❌ Erro ao gerar link de migração (account):', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 400 }
    );
  }
}
