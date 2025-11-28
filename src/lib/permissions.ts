// lib/permissions.ts

export const PLAN_PERMISSIONS = {
  'VIP': {
    displayName: 'Close Friends VIP',
    isAdmin: false,
    pages: [
      'relatorio-semanal',
      'small-caps', 'micro-caps', 'dividendos', 'fundos-imobiliarios', 'rentabilidades',
      'internacional', 'internacional-etfs', 'internacional-stocks', 'internacional-dividendos',
      'recursos-exclusivos', 'recursos-dicas', 'recursos-analise', 'recursos-ebooks',
      'recursos-imposto', 'recursos-lives', 'recursos-milhas', 'recursos-planilhas', 'recursos-telegram',
      'recursos-reserva', 'recursos-suporte'
    ]
  },
  'LITE': {
    displayName: 'Close Friends LITE',
    isAdmin: false,
    pages: [
      'relatorio-semanal',
      'small-caps', 'dividendos', 'fundos-imobiliarios', 'rentabilidades',
      'internacional', 'internacional-etfs', 'internacional-stocks', // LITE original tem internacional
      'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-planilhas', 'recursos-telegram',
      'recursos-reserva', 'recursos-suporte'
    ]
  },
  'LITE_V2': {
    displayName: 'Close Friends LITE 2.0',
    isAdmin: false,
    pages: [
      'relatorio-semanal',
      'small-caps', 'dividendos', 'fundos-imobiliarios', 'rentabilidades',
      // LITE_V2 NÃO tem internacional (diferença principal)
      'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-planilhas', 'recursos-telegram',
      'recursos-reserva', 'recursos-suporte'
    ]
  },
  'RENDA_PASSIVA': {
    displayName: 'Projeto Renda Passiva',
    isAdmin: false,
    pages: [
      'dividendos', 'fundos-imobiliarios', 'rentabilidades'
    ]
  },
  'FIIS': {
    displayName: 'Projeto FIIs',
    isAdmin: false,
    pages: [
      'relatorio-semanal',
      'fundos-imobiliarios', 'rentabilidades',
      'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-planilhas', 'recursos-telegram',
      'recursos-reserva', 'recursos-suporte'
    ]
  },
  'RENDA_TURBINADA': {
    displayName: 'CF Renda Turbinada',
    isAdmin: false,
    pages: [
      'cf-renda-turbinada',
      'cf-renda-turbinada-aulas',
      'cf-renda-turbinada-bastidores',
      'cf-renda-turbinada-carteira',
      'recursos-exclusivos',
      'recursos-telegram',
      'recursos-suporte'
    ]
  },
  'RENDA_TURBINADA_T2': {
    displayName: 'CF Renda Turbinada - Turma 2',
    isAdmin: false,
    pages: [
      'cf-renda-turbinada',
      'cf-renda-turbinada-aulas',
      'cf-renda-turbinada-bastidores',
      'cf-renda-turbinada-carteira',
      'recursos-exclusivos',
      'recursos-telegram',
      'recursos-suporte'
    ]
  },
  'AMERICA': {
    displayName: 'Projeto América',
    isAdmin: false,
    pages: [
      'relatorio-semanal',
      'internacional', 'internacional-projeto-america',
      'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-lives', 'recursos-planilhas', 'recursos-telegram',
      'recursos-reserva', 'recursos-suporte'
    ]
  },
  'ANALISTA': {
    displayName: 'Analista',
    isAdmin: false,
    pages: [
      // Acesso à central administrativa de dúvidas para responder perguntas
      'admin-central-duvidas'
    ]
  },
  'ADMIN': {
    displayName: 'Administrador',
    isAdmin: true,
    pages: [
      // Páginas de usuário
      'relatorio-semanal',
      'small-caps', 'micro-caps', 'dividendos', 'fundos-imobiliarios', 'rentabilidades',
      'internacional', 'internacional-etfs', 'internacional-stocks', 'internacional-dividendos', 'internacional-projeto-america',
      'cf-renda-turbinada', 'cf-renda-turbinada-aulas', 'cf-renda-turbinada-bastidores', 'cf-renda-turbinada-carteira',
      'recursos-exclusivos', 'recursos-dicas', 'recursos-analise', 'recursos-ebooks',
      'recursos-imposto', 'recursos-lives', 'recursos-milhas', 'recursos-planilhas', 'recursos-telegram',
      'recursos-reserva', 'recursos-suporte',

      // Páginas administrativas
      'admin', 'admin-dashboard', 'admin-usuarios', 'admin-instagram', 'admin-empresas', 'admin-proventos',
      'admin-relatorios', 'admin-relatorio-semanal', 'admin-analises-trimesestrais', 'admin-analise-tecnica', 'admin-integracoes',
      'admin-renovacoes', 'admin-settings', 'admin-carteiras', 'admin-central-duvidas'
    ],
    adminPermissions: {
      canManageUsers: true,
      canManageCompanies: true,
      canManageProventos: true,
      canViewReports: true,
      canManageIntegrations: true,
      canExportData: true,
      canViewAnalytics: true,
      canManageSettings: true,
      canViewLogs: true
    }
  }
} as const;

/**
 * Interface para permissões administrativas
 */
export interface AdminPermissions {
  canManageUsers: boolean;
  canManageCompanies: boolean;
  canManageProventos: boolean;
  canViewReports: boolean;
  canManageIntegrations: boolean;
  canExportData: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  canViewLogs: boolean;
}

/**
 * Calcula as permissões finais do usuário
 * Combina permissões do plano base + customizadas do banco
 */
export function getUserPermissions(plan: string, customPermissions?: string[], entitlements?: string[]): string[] {
  const basePlan = PLAN_PERMISSIONS[plan as keyof typeof PLAN_PERMISSIONS];
  const basePermissions = basePlan?.pages || [];
  const entitlementPermissions = (entitlements || [])
    .map(code => PLAN_PERMISSIONS[code as keyof typeof PLAN_PERMISSIONS])
    .filter((config): config is (typeof PLAN_PERMISSIONS)[keyof typeof PLAN_PERMISSIONS] => Boolean(config))
    .flatMap(config => config.pages || []);
  const customPerms = customPermissions || [];

  // Combinar sem duplicatas
  const allPermissions = [...new Set([...basePermissions, ...entitlementPermissions, ...customPerms])];

  return allPermissions;
}

/**
 * Verifica se o usuário tem acesso a uma página específica
 */
export function hasPageAccess(userPermissions: string[], page: string): boolean {
  // Admin sempre tem acesso total
  if (userPermissions.some(p => p.startsWith('admin'))) {
    return true;
  }
  
  // Verificar permissão específica
  return userPermissions.includes(page);
}

/**
 * Verifica se o usuário é administrador
 */
export function isUserAdmin(userPermissions: string[]): boolean {
  return userPermissions.includes('admin-dashboard');
}

/**
 * Obtém informações do plano
 */
export function getPlanInfo(plan: string) {
  return PLAN_PERMISSIONS[plan as keyof typeof PLAN_PERMISSIONS] || null;
}

/**
 * Obtém nome amigável do plano
 */
export function getPlanDisplayName(plan?: string): string {
  if (!plan) return 'Plano Não Identificado';
  
  const planInfo = getPlanInfo(plan);
  return planInfo?.displayName || plan;
}

/**
 * Obtém permissões administrativas
 */
export function getAdminPermissions(plan: string): AdminPermissions | null {
  const planInfo = getPlanInfo(plan);
  return planInfo?.adminPermissions || null;
}

/**
 * Verifica permissão administrativa específica
 */
export function hasAdminPermission(plan: string, permission: keyof AdminPermissions): boolean {
  const adminPerms = getAdminPermissions(plan);
  return adminPerms?.[permission] || false;
}

/**
 * Valida se uma página existe no sistema
 */
export function isValidPage(page: string): boolean {
  const allPages = new Set(
    Object.values(PLAN_PERMISSIONS).flatMap(p => p.pages)
  );
  return allPages.has(page);
}

/**
 * Debug: informações completas de um plano
 */
export function getDebugInfo(plan: string, customPermissions?: string[], entitlements?: string[]) {
  const planInfo = getPlanInfo(plan);
  const finalPermissions = getUserPermissions(plan, customPermissions, entitlements);

  return {
    plan,
    planDisplayName: getPlanDisplayName(plan),
    basePermissions: planInfo?.pages || [],
    customPermissions: customPermissions || [],
    entitlements: entitlements || [],
    finalPermissions,
    isAdmin: isUserAdmin(finalPermissions),
    adminPermissions: getAdminPermissions(plan),
    totalPermissions: finalPermissions.length,
    validPlan: !!planInfo
  };
}