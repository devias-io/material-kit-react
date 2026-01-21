import 'server-only';
import { prisma } from '@/lib/prisma';

export type MigrationProductPayload = {
  platform: string;
  externalId: string;
  name: string;
};

type PlatformConfig = {
  platform: string;
  endpoint?: string;
  token?: string;
};

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    platform: 'HOTMART',
    endpoint: process.env.MIGRATION_PRODUCTS_HOTMART_URL,
    token: process.env.MIGRATION_PRODUCTS_HOTMART_TOKEN,
  },
  {
    platform: 'KIWIFY',
    endpoint: process.env.MIGRATION_PRODUCTS_KIWIFY_URL,
    token: process.env.MIGRATION_PRODUCTS_KIWIFY_TOKEN,
  },
  {
    platform: 'EDUZZ',
    endpoint: process.env.MIGRATION_PRODUCTS_EDUZZ_URL,
    token: process.env.MIGRATION_PRODUCTS_EDUZZ_TOKEN,
  },
];

export function getPlatformSyncConfig(platform: string): PlatformConfig | undefined {
  return PLATFORM_CONFIGS.find((entry) => entry.platform === platform.toUpperCase());
}

function normalizeExternalId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

function normalizeName(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

function extractListFromResponse(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;
  return [];
}

function mapProductItem(platform: string, item: any): MigrationProductPayload | null {
  const externalId = normalizeExternalId(
    item?.id ??
      item?.product_id ??
      item?.productId ??
      item?.ucode ??
      item?.code ??
      item?.offer_id ??
      item?.identifier
  );
  const name = normalizeName(item?.name ?? item?.product_name ?? item?.title ?? item?.display_name);
  if (!externalId || !name) {
    return null;
  }
  return {
    platform,
    externalId,
    name,
  };
}

// ✅ FUNÇÃO MODIFICADA - Busca produtos da tabela Purchase
export async function fetchPlatformProducts(platform: string): Promise<MigrationProductPayload[]> {
  console.log(`[SYNC] Buscando produtos da tabela Purchase para: ${platform}`);
  
  try {
    // Buscar produtos únicos da tabela Purchase
    const purchases = await prisma.purchase.findMany({
      where: {
        platform: platform.toLowerCase(),
        productName: { not: null }
      },
      select: {
        productName: true,
        platform: true
      },
      distinct: ['productName']
    });

    console.log(`[SYNC] Produtos encontrados na Purchase para ${platform}:`, purchases.length);

    // Mapear para o formato esperado
    const products: MigrationProductPayload[] = purchases
      .filter(p => p.productName)
      .map((purchase, index) => ({
        platform: platform.toUpperCase(),
        externalId: `${platform.toLowerCase()}-${index + 1}`, // ID fictício mas único
        name: purchase.productName!
      }));

    if (products.length === 0) {
      console.log(`[SYNC] ⚠️ Nenhum produto encontrado na tabela Purchase para ${platform}`);
      return []; // Retorna array vazio ao invés de lançar erro
    }

    console.log(`[SYNC] ✅ ${products.length} produtos mapeados para ${platform}`);
    return products;
  } catch (error) {
    console.error(`[SYNC] ❌ Erro ao buscar produtos da Purchase para ${platform}:`, error);
    throw new Error(`Erro ao buscar produtos para ${platform}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}
