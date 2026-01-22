import 'server-only';
import { prisma } from '@/lib/prisma';

export type MigrationProductPayload = {
  platform: string;
  externalId: string;
  name: string;
};

type PriceTier = {
  min: number;
  max: number;
  price?: number | null;
  checkoutUrl: string;
};

type MigrationProductWithTiers = {
  migrationCheckoutUrl: string | null;
  priceTiers?: unknown;
};

function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function buildNameBasedExternalId(platform: string, name: string): string {
  const slug = slugifyProductName(name);
  const hash = hashString(name);
  const safeSlug = slug.length > 0 ? slug : 'produto';
  return `${platform.toLowerCase()}-${safeSlug}-${hash}`;
}

export function selectMigrationCheckoutUrl(
  product: MigrationProductWithTiers,
  finalPrice: number
): string | null {
  const tiers = Array.isArray(product.priceTiers)
    ? (product.priceTiers as PriceTier[])
        .filter((tier) => Number.isFinite(tier?.min) && Number.isFinite(tier?.max) && tier?.checkoutUrl)
        .sort((a, b) => a.min - b.min)
    : [];

  const matchedTier = tiers.find((tier) => finalPrice >= tier.min && finalPrice <= tier.max);

  return matchedTier?.checkoutUrl ?? null;
}

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

// ✅ NOVA FUNÇÃO - Normaliza nome do produto removendo variações
function normalizeProductName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\s*-\s*REEMBOLSO/gi, '')
    .replace(/\s*\(RENOVAÇÃO\s*-?\s*\d*\)/gi, '')
    .replace(/\s*-\s*PRODUTO\s+\d+/gi, '')
    .replace(/^CLOSE FRIENDS LITE \d+\.\d+\s+HOTMART\s*-\s*/gi, '')
    .replace(/^CLOSE FRIENDS LITE\s+HOTMART\s*-\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
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

// ✅ FUNÇÃO CORRIGIDA - Busca produtos da tabela Purchase e agrupa corretamente
export async function fetchPlatformProducts(platform: string): Promise<MigrationProductPayload[]> {
  console.log(`[SYNC] Buscando produtos da tabela Purchase para: ${platform}`);
  
  try {
    // Buscar TODOS os produtos (sem distinct para não perder produtos com externalId NULL)
    const purchases = await prisma.purchase.findMany({
      where: {
        platform: { equals: platform, mode: 'insensitive' },
        productName: { not: null },
        NOT: { productName: { contains: 'VIP', mode: 'insensitive' } },
        OR: [
          { productName: { contains: 'LITE', mode: 'insensitive' } },
          { productName: { contains: 'RENDA PASSIVA', mode: 'insensitive' } },
          { productName: { contains: 'RENDA TURBINADA', mode: 'insensitive' } },
          { productName: { contains: 'PROJETO AMERICA', mode: 'insensitive' } },
          { productName: { contains: 'PROJETO AMÉRICA', mode: 'insensitive' } },
          { productName: { contains: 'PROJETO TRUMP', mode: 'insensitive' } },
          { productName: { contains: 'PROJETO FIIS', mode: 'insensitive' } },
        ],
      },
      select: {
        productName: true,
        productExternalId: true,
        platform: true
      },
      // ❌ REMOVIDO: distinct - estava agrupando produtos NULL incorretamente
    });

    console.log(`[SYNC] Total de compras encontradas para ${platform}:`, purchases.length);

    // Mapear para o formato esperado
    const platformKey = platform.toUpperCase();
    const productMap = new Map<string, MigrationProductPayload>();

    purchases.forEach((purchase) => {
      const rawName = normalizeName(purchase.productName);
      if (!rawName) return;

      // Normalizar nome (remover RENOVAÇÃO, REEMBOLSO, etc)
      const normalizedName = normalizeProductName(rawName);
      const externalId = normalizeExternalId(purchase.productExternalId);
      
      if (!externalId) {
        // Sem externalId: gerar baseado no nome normalizado (Kiwify/Eduzz)
        const generatedId = buildNameBasedExternalId(platformKey, normalizedName);
        const mapKey = `${platformKey}::${generatedId}`;
        
        if (!productMap.has(mapKey)) {
          productMap.set(mapKey, {
            platform: platformKey,
            externalId: generatedId,
            name: normalizedName,
          });
        }
      } else {
        // Com externalId: agrupar por ID (Hotmart)
        const mapKey = `${platformKey}::${externalId}`;
        
        if (!productMap.has(mapKey)) {
          productMap.set(mapKey, {
            platform: platformKey,
            externalId,
            name: normalizedName,
          });
        }
      }
    });

    const products = Array.from(productMap.values());

    if (products.length === 0) {
      console.log(`[SYNC] ⚠️ Nenhum produto encontrado na tabela Purchase para ${platform}`);
      return [];
    }

    console.log(`[SYNC] ✅ ${products.length} produtos únicos mapeados para ${platform}:`);
    products.forEach(p => console.log(`  - ${p.externalId}: ${p.name}`));
    
    return products;
  } catch (error) {
    console.error(`[SYNC] ❌ Erro ao buscar produtos da Purchase para ${platform}:`, error);
    throw new Error(`Erro ao buscar produtos para ${platform}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}
