import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const platform = searchParams.get('platform')?.toUpperCase();

    const products = await prisma.migrationProduct.findMany({
      where: platform ? { platform: { equals: platform, mode: 'insensitive' } } : undefined,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('❌ Erro ao listar produtos de migração:', error);
    return NextResponse.json(
      { error: 'Erro interno ao listar produtos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const platform = typeof body?.platform === 'string' ? body.platform.trim().toLowerCase() : '';
    const migrationCheckoutUrl =
      typeof body?.migrationCheckoutUrl === 'string' && body.migrationCheckoutUrl.trim().length > 0
        ? body.migrationCheckoutUrl.trim()
        : null;
    const isActive = typeof body?.isActive === 'boolean' ? body.isActive : true;

    if (!name) {
      return NextResponse.json({ error: 'Nome do produto é obrigatório.' }, { status: 400 });
    }
    if (!platform) {
      return NextResponse.json({ error: 'Plataforma é obrigatória.' }, { status: 400 });
    }

    const product = await prisma.migrationProduct.create({
      data: {
        name,
        platform,
        externalId: `manual-${Date.now()}`,
        migrationCheckoutUrl,
        isActive,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('❌ Erro ao criar produto de migração:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno ao criar produto' },
      { status: 400 }
    );
  }
}
