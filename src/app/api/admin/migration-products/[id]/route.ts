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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : undefined;
    const platform =
      typeof body?.platform === 'string' ? body.platform.trim().toLowerCase() : undefined;
    const migrationCheckoutUrl =
      typeof body?.migrationCheckoutUrl === 'string'
        ? body.migrationCheckoutUrl.trim() || null
        : undefined;
    const isActive = typeof body?.isActive === 'boolean' ? body.isActive : undefined;
    const priceTiers = normalizePriceTiers(body?.priceTiers);

    const updateData: {
      name?: string;
      platform?: string;
      migrationCheckoutUrl?: string | null;
      isActive?: boolean;
      priceTiers?: unknown;
    } = {};

    if (name) updateData.name = name;
    if (platform) updateData.platform = platform;
    if (migrationCheckoutUrl !== undefined) updateData.migrationCheckoutUrl = migrationCheckoutUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (priceTiers !== undefined) updateData.priceTiers = priceTiers;

    const product = await prisma.migrationProduct.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('❌ Erro ao atualizar produto de migração:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 400 }
    );
  }
}

type PriceTierInput = {
  min: number;
  max: number;
  price?: number | null;
  checkoutUrl: string;
};

function normalizePriceTiers(input: unknown): PriceTierInput[] | null | undefined {
  if (input === undefined) {
    return undefined;
  }

  if (!Array.isArray(input)) {
    return null;
  }

  const tiers = input
    .map((tier) => {
      const min = Number(tier?.min);
      const max = Number(tier?.max);
      const price = tier?.price === null || tier?.price === undefined ? null : Number(tier?.price);
      const checkoutUrl = typeof tier?.checkoutUrl === 'string' ? tier.checkoutUrl.trim() : '';

      if (!Number.isFinite(min) || !Number.isFinite(max) || !checkoutUrl) {
        return null;
      }

      return {
        min,
        max,
        price: Number.isFinite(price ?? NaN) ? price : null,
        checkoutUrl,
      } as PriceTierInput;
    })
    .filter(Boolean) as PriceTierInput[];

  return tiers.length > 0 ? tiers : null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.migrationProduct.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao deletar produto de migração:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 400 }
    );
  }
}
