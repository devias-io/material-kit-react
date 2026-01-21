import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { fetchPlatformProducts } from '@/lib/migration-products';

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

const SUPPORTED_PLATFORMS = ['HOTMART', 'KIWIFY', 'EDUZZ'];

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const platform = body?.platform?.toUpperCase();

    const platformsToSync = platform ? [platform] : SUPPORTED_PLATFORMS;
    const results = [];

    for (const platformToSync of platformsToSync) {
      if (!SUPPORTED_PLATFORMS.includes(platformToSync)) {
        continue;
      }

      const products = await fetchPlatformProducts(platformToSync);

      const upserts = await Promise.all(
        products.map((product) =>
          prisma.migrationProduct.upsert({
            where: {
              platform_externalId: {
                platform: product.platform,
                externalId: product.externalId,
              },
            },
            update: {
              name: product.name,
            },
            create: {
              platform: product.platform,
              externalId: product.externalId,
              name: product.name,
            },
          })
        )
      );

      results.push({
        platform: platformToSync,
        synced: upserts.length,
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('❌ Erro ao sincronizar produtos:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno ao sincronizar produtos' },
      { status: 500 }
    );
  }
}
