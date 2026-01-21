import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { fetchPlatformProducts, getPlatformSyncConfig } from '@/lib/migration-products';

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
    const results: Array<{
      success: boolean;
      platform: string;
      total: number;
      created: number;
      updated: number;
      errors: string[];
    }> = [];

    for (const platformToSync of platformsToSync) {
      if (!SUPPORTED_PLATFORMS.includes(platformToSync)) {
        continue;
      }

      console.log('[SYNC] Iniciando sincronização para:', platformToSync);

      try {
        const syncConfig = getPlatformSyncConfig(platformToSync);
        if (!syncConfig?.endpoint) {
          throw new Error(`Endpoint de sincronização não configurado para ${platformToSync}.`);
        }
        if (!syncConfig.token) {
          throw new Error(`Token da plataforma ${platformToSync} não configurado.`);
        }

        const products = await fetchPlatformProducts(platformToSync);
        console.log('[SYNC] Produtos encontrados:', products.length);

        let created = 0;
        let updated = 0;

        for (const product of products) {
          console.log('[SYNC] Salvando produto:', product.name);
          const existing = await prisma.migrationProduct.findUnique({
            where: {
              platform_externalId: {
                platform: product.platform,
                externalId: product.externalId,
              },
            },
          });

          if (existing) {
            await prisma.migrationProduct.update({
              where: { id: existing.id },
              data: { name: product.name },
            });
            updated += 1;
          } else {
            await prisma.migrationProduct.create({
              data: {
                platform: product.platform,
                externalId: product.externalId,
                name: product.name,
              },
            });
            created += 1;
          }
        }

        results.push({
          success: true,
          platform: platformToSync,
          total: products.length,
          created,
          updated,
          errors: [],
        });
      } catch (error) {
        console.log('[SYNC] Erro ao sincronizar:', error);
        const message = error instanceof Error ? error.message : 'Erro ao sincronizar produtos.';
        results.push({
          success: false,
          platform: platformToSync,
          total: 0,
          created: 0,
          updated: 0,
          errors: [message],
        });
      }
    }

    const success = results.every((result) => result.success);
    return NextResponse.json({ success, results });
  } catch (error) {
    console.error('❌ Erro ao sincronizar produtos:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno ao sincronizar produtos' },
      { status: 500 }
    );
  }
}
