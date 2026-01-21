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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const targetPlan = searchParams.get('target') ?? 'VIP';

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
      return NextResponse.json({ error: 'Nenhuma compra encontrada para simular a migração.' }, { status: 404 });
    }

    const simulation = buildMigrationSimulation({
      user,
      purchase,
      targetPlan,
    });

    return NextResponse.json({ simulation });
  } catch (error) {
    console.error('❌ Erro ao simular migração (admin):', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 400 }
    );
  }
}
