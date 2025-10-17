export type IntegrationStatus = 'ACTIVE' | 'INACTIVE';

export type PlatformSlug = 'hotmart' | 'kiwify' | 'eduzz';

export interface PlatformMetadata {
  slug: PlatformSlug;
  name: string;
  emoji: string;
  color: string;
  description: string;
  status: 'active' | 'inactive' | 'coming-soon';
}

interface BaseIntegrationConfig {
  id: string;
  productName: string;
  plan: string;
  status: IntegrationStatus;
  createdAt: string;
  totalSales: number;
}

export interface HotmartIntegrationConfig extends BaseIntegrationConfig {
  productId: string;
}

export interface TokenIntegrationConfig extends BaseIntegrationConfig {
  token: string;
}

export type PlatformIntegrationConfig = HotmartIntegrationConfig | TokenIntegrationConfig;

export const PLATFORM_SLUGS: PlatformSlug[] = ['hotmart', 'kiwify', 'eduzz'];

export const PLATFORM_METADATA: Record<PlatformSlug, PlatformMetadata> = {
  hotmart: {
    slug: 'hotmart',
    name: 'Hotmart',
    emoji: '🔥',
    color: '#FF6B35',
    description: 'Maior plataforma de produtos digitais do Brasil',
    status: 'active',
  },
  kiwify: {
    slug: 'kiwify',
    name: 'Kiwify',
    emoji: '🥝',
    color: '#4ECDC4',
    description: 'Plataforma moderna para criadores de infoprodutos',
    status: 'active',
  },
  eduzz: {
    slug: 'eduzz',
    name: 'Eduzz',
    emoji: '📚',
    color: '#3D5AFE',
    description: 'Marketplace de cursos e infoprodutos',
    status: 'active',
  },
};

export const HOTMART_INTEGRATIONS: HotmartIntegrationConfig[] = [
  {
    id: '124159',
    productId: 'fb056612-bcc6-4217-9e6d-2a5d1110ac2f',
    productName: 'Projeto Trump',
    plan: 'VIP',
    status: 'ACTIVE',
    createdAt: '2024-01-15',
    totalSales: 45,
  },
  {
    id: '99519',
    productId: 'upgrade-vip-2024',
    productName: 'Troca de Plano - VIP',
    plan: 'VIP',
    status: 'ACTIVE',
    createdAt: '2024-02-20',
    totalSales: 23,
  },
  {
    id: '99516',
    productId: 'projeto-fiis-2024',
    productName: 'Projeto FIIs',
    plan: 'FIIS',
    status: 'ACTIVE',
    createdAt: '2024-03-10',
    totalSales: 67,
  },
];

export const KIWIFY_INTEGRATIONS: TokenIntegrationConfig[] = [
  {
    id: 'KW001',
    productName: 'Produto Fatos da Bolsa',
    token: '27419sqm9vm',
    plan: 'VIP',
    status: 'ACTIVE',
    createdAt: '2024-07-16',
    totalSales: 1,
  },
  {
    id: 'KWVIP06',
    productName: 'Close Friends VIP - Turma 6',
    token: 'KWiChuFSyPUjAgdJs',
    plan: 'VIP',
    status: 'INACTIVE',
    createdAt: '2024-07-16',
    totalSales: 0,
  },
];

export const EDUZZ_INTEGRATIONS: TokenIntegrationConfig[] = [
  {
    id: 'ED001',
    productName: 'Produto Fatos da Bolsa Eduzz',
    token: 'EDm2rYeqZWZHmCVmA',
    plan: 'VIP',
    status: 'INACTIVE',
    createdAt: '2024-07-16',
    totalSales: 0,
  },
  {
    id: 'ED002',
    productName: 'Produto Fatos da Bolsa Eduzz',
    token: 'EDgZhmhuBZN4CP4uD',
    plan: 'VIP',
    status: 'ACTIVE',
    createdAt: '2024-07-16',
    totalSales: 0,
  },
];

export const KIWIFY_TOKEN_MAPPING: Record<string, { name: string; plan: string; integrationId: string }> =
  KIWIFY_INTEGRATIONS.reduce(
    (acc, integration) => {
      acc[integration.token] = {
        name: integration.productName,
        plan: integration.plan,
        integrationId: integration.id,
      };
      return acc;
    },
    {} as Record<string, { name: string; plan: string; integrationId: string }>,
  );

export const EDUZZ_TOKEN_MAPPING: Record<string, { name: string; plan: string; integrationId: string }> =
  EDUZZ_INTEGRATIONS.reduce(
    (acc, integration) => {
      acc[integration.token] = {
        name: integration.productName,
        plan: integration.plan,
        integrationId: integration.id,
      };
      return acc;
    },
    {} as Record<string, { name: string; plan: string; integrationId: string }>,
  );

export function getIntegrationsByPlatform(
  slug: PlatformSlug,
): ReadonlyArray<PlatformIntegrationConfig> {
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
