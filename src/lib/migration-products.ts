import 'server-only';

import {
  EDUZZ_PUBLIC_INTEGRATIONS,
  HOTMART_INTEGRATIONS,
  KIWIFY_PUBLIC_INTEGRATIONS,
} from '@/data/integrations';

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

function getPlatformConfig(platform: string): PlatformConfig | undefined {
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

export async function fetchPlatformProducts(platform: string): Promise<MigrationProductPayload[]> {
  const config = getPlatformConfig(platform);
  if (!config?.endpoint) {
    return getFallbackProducts(platform);
  }

  const headers = new Headers();
  if (config.token) {
    headers.set('Authorization', `Bearer ${config.token}`);
  }

  const response = await fetch(config.endpoint, { headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao sincronizar ${platform}: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const list = extractListFromResponse(payload);

  const mapped = list
    .map((item) => mapProductItem(platform, item))
    .filter((item): item is MigrationProductPayload => Boolean(item));

  if (mapped.length === 0) {
    return getFallbackProducts(platform);
  }

  return mapped;
}

function getFallbackProducts(platform: string): MigrationProductPayload[] {
  const normalizedPlatform = platform.toUpperCase();

  if (normalizedPlatform === 'HOTMART') {
    return HOTMART_INTEGRATIONS.map((integration) => ({
      platform: 'HOTMART',
      externalId: integration.productId,
      name: integration.productName,
    }));
  }

  if (normalizedPlatform === 'KIWIFY') {
    return KIWIFY_PUBLIC_INTEGRATIONS.map((integration) => ({
      platform: 'KIWIFY',
      externalId: integration.id,
      name: integration.productName,
    }));
  }

  if (normalizedPlatform === 'EDUZZ') {
    return EDUZZ_PUBLIC_INTEGRATIONS.map((integration) => ({
      platform: 'EDUZZ',
      externalId: integration.id,
      name: integration.productName,
    }));
  }

  return [];
}
