export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  EDUZZ_INTEGRATIONS,
  HOTMART_INTEGRATIONS,
  KIWIFY_INTEGRATIONS,
  PLATFORM_METADATA,
  PLATFORM_SLUGS,
  type PlatformIntegrationConfig,
  type PlatformSlug,
} from '@/data/integrations';

interface IntegrationSummary {
  id: string;
  productName: string;
  plan: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalSales: number;
  webhookUrl: string;
  token?: string;
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

function buildWebhookUrl(origin: string, slug: PlatformSlug, integration: PlatformIntegrationConfig): string {
  if ('token' in integration) {
    return `${origin}/api/webhooks/${slug}/${integration.token}`;
  }
  return `${origin}/api/webhooks/hotmart/${integration.id}`;
}

function normaliseIntegrations(
  origin: string,
  slug: PlatformSlug,
  integrations: readonly PlatformIntegrationConfig[],
): IntegrationSummary[] {
  return integrations.map(integration => ({
    id: integration.id,
    productName: integration.productName,
    plan: integration.plan,
    status: integration.status,
    totalSales: integration.totalSales,
    webhookUrl: buildWebhookUrl(origin, slug, integration),
    ...('token' in integration ? { token: integration.token } : { productId: integration.productId }),
  }));
}

function computePlatformPayload(origin: string, slug: PlatformSlug): PlatformPayload {
  const meta = PLATFORM_METADATA[slug];
  const integrations = getIntegrations(slug);
  const summaries = normaliseIntegrations(origin, slug, integrations);
  const activeIntegrations = integrations.filter(integration => integration.status === 'ACTIVE').length;
  const totalSales = integrations.reduce((sum, integration) => sum + integration.totalSales, 0);

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

function getIntegrations(slug: PlatformSlug): readonly PlatformIntegrationConfig[] {
  switch (slug) {
    case 'hotmart':
      return HOTMART_INTEGRATIONS;
    case 'kiwify':
      return KIWIFY_INTEGRATIONS;
    case 'eduzz':
      return EDUZZ_INTEGRATIONS;
    default:
      return [];
  }
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
  const platforms = PLATFORM_SLUGS.map(slug => computePlatformPayload(origin, slug));

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
