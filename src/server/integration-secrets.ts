import 'server-only';

import {
  EDUZZ_PUBLIC_INTEGRATIONS,
  KIWIFY_PUBLIC_INTEGRATIONS,
  HOTMART_INTEGRATIONS,
  type PlatformIntegrationConfig,
  type PublicTokenIntegrationConfig,
  type TokenIntegrationConfig,
} from '@/data/integrations';

type TokenSecret = {
  integrationId: string;
  envName: string;
};

function resolveToken(envName: string): string | undefined {
  const token = process.env[envName];

  if (!token) {
    console.warn(`⚠️ Token não configurado para a variável ${envName}`);
  }

  return token;
}

function attachTokens(
  publicConfigs: PublicTokenIntegrationConfig[],
  secrets: TokenSecret[],
): TokenIntegrationConfig[] {
  return publicConfigs.map((integration) => {
    const secret = secrets.find((entry) => entry.integrationId === integration.id);

    return {
      ...integration,
      token: secret ? resolveToken(secret.envName) ?? '' : '',
    } satisfies TokenIntegrationConfig;
  });
}

const KIWIFY_SECRETS: TokenSecret[] = [
  { integrationId: 'KW001', envName: 'KIWIFY_TOKEN_KW001' },
  { integrationId: 'KWVIP06', envName: 'KIWIFY_TOKEN_KWVIP06' },
];

const EDUZZ_SECRETS: TokenSecret[] = [
  { integrationId: 'ED001', envName: 'EDUZZ_TOKEN_ED001' },
  { integrationId: 'ED002', envName: 'EDUZZ_TOKEN_ED002' },
];

export function getKiwifyIntegrations(): TokenIntegrationConfig[] {
  return attachTokens(KIWIFY_PUBLIC_INTEGRATIONS, KIWIFY_SECRETS);
}

export function getEduzzIntegrations(): TokenIntegrationConfig[] {
  return attachTokens(EDUZZ_PUBLIC_INTEGRATIONS, EDUZZ_SECRETS);
}

export function getKiwifyTokenMapping(): Record<string, { name: string; plan: string; integrationId: string }> {
  return getKiwifyIntegrations().reduce<Record<string, { name: string; plan: string; integrationId: string }>>(
    (acc, integration) => {
      if (!integration.token) return acc;

      acc[integration.token] = {
        name: integration.productName,
        plan: integration.plan,
        integrationId: integration.id,
      };

      return acc;
    },
    {},
  );
}

export function getEduzzTokenMapping(): Record<string, { name: string; plan: string; integrationId: string }> {
  return getEduzzIntegrations().reduce<Record<string, { name: string; plan: string; integrationId: string }>>(
    (acc, integration) => {
      if (!integration.token) return acc;

      acc[integration.token] = {
        name: integration.productName,
        plan: integration.plan,
        integrationId: integration.id,
      };

      return acc;
    },
    {},
  );
}

export function getIntegrationsByPlatform(slug: 'hotmart' | 'kiwify' | 'eduzz'): ReadonlyArray<PlatformIntegrationConfig> {
  switch (slug) {
    case 'hotmart':
      return HOTMART_INTEGRATIONS;
    case 'kiwify':
      return getKiwifyIntegrations();
    case 'eduzz':
      return getEduzzIntegrations();
    default:
      return [];
  }
}
