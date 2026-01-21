export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
  PLATFORM_METADATA,
  PLATFORM_SLUGS,
  getPublicIntegrationsByPlatform,
  type PublicPlatformIntegrationConfig,
  type PlatformSlug,
} from '@/data/integrations';

interface IntegrationSummary {
  id: string;
  productName: string;
  plan: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalSales: number;
  webhookUrl: string;
  productId?: string;
}

interface PlatformPayload {
  slug: PlatformSlug;
  name: string;
  emoji: string;
  color: string;
  description: string;
  status: 'active' | 'inactive' | 'coming-soon';
  integrations: IntegrationSummary[];
  totals: {
    totalIntegrations: number;
    activeIntegrations: number;
    totalSales: number;
  };
}

function buildWebhookUrl(origin: string, slug: PlatformSlug, integration: PublicPlatformIntegrationConfig): string {
  if (slug === 'hotmart') {
    return `${origin}/api/webhooks/hotmart/${integration.id}`;
  }

  return `${origin}/api/webhooks/${slug}/{token}`;
}

function normaliseIntegrations(
  origin: string,
  slug: PlatformSlug,
  integrations: readonly PublicPlatformIntegrationConfig[],
  salesByProductName: Map<string, number>,
): IntegrationSummary[] {
  return integrations.map(integration => ({
    id: integration.id,
    productName: integration.productName,
    plan: integration.plan,
    status: integration.status,
    totalSales: salesByProductName.get(integration.productName) ?? 0,
    webhookUrl: buildWebhookUrl(origin, slug, integration),
    ...('productId' in integration ? { productId: integration.productId } : {}),
  }));
}

function detectPlatformByProductName(productName?: string | null): PlatformSlug | null {
  if (!productName) return null;
  const normalized = productName.toLowerCase();

  if (normalized.includes('hotmart')) return 'hotmart';
  if (normalized.includes('kiwify')) return 'kiwify';
  if (normalized.includes('eduzz')) return 'eduzz';

  return null;
}

function detectPlatformByOrigin(origin?: string | null): PlatformSlug | null {
  if (!origin) return null;
  const normalized = origin.toLowerCase();

  if (normalized.includes('hotmart')) return 'hotmart';
  if (normalized.includes('kiwify')) return 'kiwify';
  if (normalized.includes('eduzz')) return 'eduzz';

  return null;
}

function computePlatformPayload(
  origin: string,
  slug: PlatformSlug,
  salesByProductName: Map<string, number>,
  salesByPlatform: Record<PlatformSlug, number>,
): PlatformPayload {
  const meta = PLATFORM_METADATA[slug];
  const integrations = getPublicIntegrationsByPlatform(slug);
  const summaries = normaliseIntegrations(origin, slug, integrations, salesByProductName);
  const activeIntegrations = integrations.filter(integration => integration.status === 'ACTIVE').length;
  const totalSales = salesByPlatform[slug] ?? 0;

  return {
    slug,
    name: meta.name,
    emoji: meta.emoji,
    color: meta.color,
    description: meta.description,
    status: activeIntegrations > 0 ? 'active' : meta.status,
    integrations: summaries,
    totals: {
      totalIntegrations: integrations.length,
      activeIntegrations,
      totalSales,
    },
  };
}

async function getSalesAggregates() {
  const purchases = await prisma.purchase.findMany({
    where: {
      status: 'COMPLETED',
    },
    select: {
      productName: true,
      user: {
        select: {
          origin: true,
        },
      },
    },
  });

  const salesByProductName = new Map<string, number>();
  const salesByPlatform: Record<PlatformSlug, number> = {
    hotmart: 0,
    kiwify: 0,
    eduzz: 0,
  };

  for (const purchase of purchases) {
    if (purchase.productName) {
      const key = purchase.productName.trim();
      salesByProductName.set(key, (salesByProductName.get(key) ?? 0) + 1);
    }

    const platformFromName = detectPlatformByProductName(purchase.productName);
    const platformFromOrigin = detectPlatformByOrigin(purchase.user?.origin ?? null);
    const platform = platformFromName ?? platformFromOrigin;

    if (platform) {
      salesByPlatform[platform] += 1;
    }
  }

  return { salesByProductName, salesByPlatform };
}

async function verifyAuth() {
  try {
    const session = await auth();
    if (session?.user?.plan === 'ADMIN') {
      return session.user;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar autenticação das integrações:', error);
  }
  return null;
}

export async function GET(request: NextRequest) {
  const admin = await verifyAuth();

  if (!admin) {
    return NextResponse.json(
      {
        success: false,
        error: 'Acesso negado. É necessário ser administrador para visualizar as integrações.',
      },
      { status: 401 },
    );
  }

  const origin = new URL(request.url).origin;
  const { salesByProductName, salesByPlatform } = await getSalesAggregates();
  const platforms = PLATFORM_SLUGS.map(slug =>
    computePlatformPayload(origin, slug, salesByProductName, salesByPlatform),
  );

  const totals = platforms.reduce(
    (acc, platform) => {
      acc.totalIntegrations += platform.totals.totalIntegrations;
      acc.activeIntegrations += platform.totals.activeIntegrations;
      acc.totalSales += platform.totals.totalSales;
      return acc;
    },
    { totalIntegrations: 0, activeIntegrations: 0, totalSales: 0 },
  );

  return NextResponse.json({
    success: true,
    platforms,
    totals,
    generatedAt: new Date().toISOString(),
  });
}
