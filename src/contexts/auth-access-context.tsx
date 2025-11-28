'use client';

import * as React from 'react';

import type { User } from '@/types/user';
import type { AdminPermissions } from '@/lib/permissions';
import { PLAN_PERMISSIONS } from '@/lib/permissions';
import { normalizeCustomPermissions as normalizeUserCustomPermissions } from '@/lib/custom-permissions';
import { useUser } from '@/hooks/use-user';

export interface AuthAccessPlanInfo {
  displayName: string;
  pages: string[];
  isAdmin: boolean;
  adminPermissions: AdminPermissions | null;
  activeEntitlements: string[];
}

interface AuthAccessContextValue {
  planInfo: AuthAccessPlanInfo;
  loading: boolean;
  hasAccessSync: (page: string) => boolean;
  hasContentAccess: (contentId: string) => boolean;
  hasInstagramAdminAccess: () => boolean;
  hasRenovacoesAdminAccess: () => boolean;
  hasRelatorioSemanalAdminAccess: () => boolean;
  hasAnalisesTrimesestraisAdminAccess: () => boolean;
  hasCentralDuvidasAdminAccess: () => boolean;
  user: User | null;
  debugInfo: {
    userPlan: string | undefined;
    customPermissions: string[] | undefined;
    activeEntitlements: string[] | undefined;
    allPages: string[];
    isAdmin: boolean;
    hasInstagramAccess: boolean;
    hasRenovacoesAccess: boolean;
    hasRelatorioSemanalAdminAccess: boolean;
    hasAnalisesTrimesestraisAdminAccess: boolean;
    hasCentralDuvidasAdminAccess: boolean;
  };
}

const GUARANTEED_PAGES = ['recursos-suporte'] as const;
const DEFAULT_OPEN_PAGES = ['relatorio-semanal', 'cf-renda-turbinada-carteira'] as const;

function normalizeCustomPermissions(value: unknown): string[] {
  if (!value) {
    return [];
  }

  const normalize = (permission: unknown): string => String(permission).trim();

  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map(normalize)
          .filter(permission => permission.length > 0)
      )
    );
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return Array.from(
          new Set(
            parsed
              .map(normalize)
              .filter(permission => permission.length > 0)
          )
        );
      }
    } catch (error) {
      // Não é JSON válido – tratar como permissão única
    }

    const normalized = normalize(trimmed);
    return normalized ? [normalized] : [];
  }

  return [];
}

const FALLBACK_PLAN_INFO: AuthAccessPlanInfo = {
  displayName: 'Visitante',
  pages: [...GUARANTEED_PAGES],
  isAdmin: false,
  adminPermissions: null,
  activeEntitlements: [],
};

interface EnsureGuaranteedPagesOptions {
  planKey?: string;
}

function ensureGuaranteedPages(pages: string[], options: EnsureGuaranteedPagesOptions = {}): string[] {
  const pageSet = new Set<string>([...GUARANTEED_PAGES, ...pages]);

  const { planKey } = options;
  const shouldIncludeDefaultOpenPages = !planKey || (planKey !== 'RENDA_TURBINADA' && planKey !== 'RENDA_TURBINADA_T2');

  if (shouldIncludeDefaultOpenPages) {
    DEFAULT_OPEN_PAGES.forEach(page => pageSet.add(page));
  }

  return Array.from(pageSet);
}

function getActiveEntitlements(user: User | null): string[] {
  if (!user) {
    return [];
  }

  if (Array.isArray(user.activeEntitlements)) {
    return user.activeEntitlements;
  }

  if (!Array.isArray(user.entitlements)) {
    return [];
  }

  const now = Date.now();
  return user.entitlements
    .filter(entitlement => {
      if (!entitlement?.code) {
        return false;
      }

      if (entitlement.status && entitlement.status !== 'ACTIVE') {
        return false;
      }

      if (entitlement.expiresAt) {
        const expiresAt = new Date(entitlement.expiresAt).getTime();
        if (!Number.isNaN(expiresAt) && expiresAt < now) {
          return false;
        }
      }

      return true;
    })
    .map(entitlement => entitlement.code);
}

function derivePlanInfo(user: User | null): AuthAccessPlanInfo {
  if (!user) {
    return FALLBACK_PLAN_INFO;
  }

  const planKey = user.plan as keyof typeof PLAN_PERMISSIONS | undefined;
  const planConfig = planKey ? PLAN_PERMISSIONS[planKey] : undefined;
  const activeEntitlements = getActiveEntitlements(user);
  const entitlementConfigs = activeEntitlements
    .map(code => PLAN_PERMISSIONS[code as keyof typeof PLAN_PERMISSIONS])
    .filter((config): config is (typeof PLAN_PERMISSIONS)[keyof typeof PLAN_PERMISSIONS] => Boolean(config));

  const displayNameParts: string[] = [];
  if (planConfig?.displayName) {
    displayNameParts.push(planConfig.displayName);
  } else if (user.plan) {
    displayNameParts.push(user.plan);
  }

  entitlementConfigs.forEach(config => {
    if (config.displayName) {
      displayNameParts.push(config.displayName);
    }
  });

  const displayName = displayNameParts.length > 0 ? displayNameParts.join(' + ') : FALLBACK_PLAN_INFO.displayName;
  const basePages = planConfig?.pages ?? [];
  const addonPages = entitlementConfigs.flatMap(config => config.pages ?? []);
  const allConfigs = [planConfig, ...entitlementConfigs].filter(Boolean);
  const adminPermissions = allConfigs.find(config => config?.adminPermissions)?.adminPermissions ?? null;
  const isAdmin = allConfigs.some(config => config?.isAdmin);
  const customPermissions = normalizeUserCustomPermissions(user.customPermissions);

  const pages = ensureGuaranteedPages([...basePages, ...addonPages, ...customPermissions], { planKey: user.plan });

  return {
    displayName,
    pages,
    isAdmin,
    adminPermissions,
    activeEntitlements,
  };
}

export const AuthAccessContext = React.createContext<AuthAccessContextValue | undefined>(undefined);

export interface AuthAccessProviderProps {
  children: React.ReactNode;
}

export function AuthAccessProvider({ children }: AuthAccessProviderProps): React.JSX.Element {
  const { user, isLoading } = useUser();

  const planInfo = React.useMemo(() => derivePlanInfo(user), [user]);
  const userEmail = user?.email ?? null;
  const userPlan = user?.plan;
  const customPermissions = normalizeUserCustomPermissions(user?.customPermissions);
  const activeEntitlements = user?.activeEntitlements ?? planInfo.activeEntitlements;

  const hasInstagramAdminAccess = React.useCallback(() => {
    if (!userEmail) {
      return planInfo.isAdmin;
    }
    return planInfo.isAdmin || userEmail === 'jacbdias@gmail.com';
  }, [planInfo.isAdmin, userEmail]);

  const hasRenovacoesAdminAccess = React.useCallback(() => planInfo.isAdmin, [planInfo.isAdmin]);

  const hasRelatorioSemanalAdminAccess = React.useCallback(() => planInfo.isAdmin, [planInfo.isAdmin]);

  const hasAnalisesTrimesestraisAdminAccess = React.useCallback(() => planInfo.isAdmin, [planInfo.isAdmin]);

  const hasCentralDuvidasAdminAccess = React.useCallback(() => {
    if (planInfo.isAdmin) {
      return true;
    }

    return planInfo.pages.includes('admin-central-duvidas');
  }, [planInfo.isAdmin, planInfo.pages]);

  const hasAccessSync = React.useCallback(
    (page: string): boolean => {
      if (!page) {
        return true;
      }

      if (isLoading) {
        return true;
      }

      if (page === 'admin-instagram') {
        return hasInstagramAdminAccess();
      }

      if (page === 'admin-renovacoes') {
        return hasRenovacoesAdminAccess();
      }

      if (page === 'admin-relatorio-semanal') {
        return hasRelatorioSemanalAdminAccess();
      }

      if (page === 'admin-analises-trimesestrais') {
        return hasAnalisesTrimesestraisAdminAccess();
      }

      if (page === 'admin-central-duvidas') {
        return hasCentralDuvidasAdminAccess();
      }

      if (page.startsWith('admin')) {
        return planInfo.isAdmin && planInfo.pages.includes(page);
      }

      return planInfo.pages.includes(page);
    },
    [
      planInfo.isAdmin,
      planInfo.pages,
      hasAnalisesTrimesestraisAdminAccess,
      hasCentralDuvidasAdminAccess,
      hasInstagramAdminAccess,
      hasRelatorioSemanalAdminAccess,
      hasRenovacoesAdminAccess,
      isLoading,
    ]
  );

  const hasContentAccess = React.useCallback(
    (contentId: string): boolean => {
      if (!contentId) {
        return false;
      }

      if (isLoading) {
        return false;
      }

      if (planInfo.isAdmin) {
        return true;
      }

      return planInfo.pages.includes(contentId);
    },
    [planInfo.isAdmin, planInfo.pages, isLoading]
  );

  const value = React.useMemo<AuthAccessContextValue>(
    () => ({
      planInfo,
      loading: isLoading,
      hasAccessSync,
      hasContentAccess,
      hasInstagramAdminAccess,
      hasRenovacoesAdminAccess,
      hasRelatorioSemanalAdminAccess,
      hasAnalisesTrimesestraisAdminAccess,
      hasCentralDuvidasAdminAccess,
      user,
      debugInfo: {
        userPlan,
        customPermissions,
        activeEntitlements,
        allPages: planInfo.pages,
        isAdmin: planInfo.isAdmin,
        hasInstagramAccess: hasInstagramAdminAccess(),
        hasRenovacoesAccess: hasRenovacoesAdminAccess(),
        hasRelatorioSemanalAdminAccess: hasRelatorioSemanalAdminAccess(),
        hasAnalisesTrimesestraisAdminAccess: hasAnalisesTrimesestraisAdminAccess(),
        hasCentralDuvidasAdminAccess: hasCentralDuvidasAdminAccess(),
      },
    }),
    [
      customPermissions,
      activeEntitlements,
      hasAccessSync,
      hasAnalisesTrimesestraisAdminAccess,
      hasCentralDuvidasAdminAccess,
      hasContentAccess,
      hasInstagramAdminAccess,
      hasRelatorioSemanalAdminAccess,
      hasRenovacoesAdminAccess,
      isLoading,
      planInfo,
      user,
      userPlan,
    ]
  );

  return <AuthAccessContext.Provider value={value}>{children}</AuthAccessContext.Provider>;
}

export function useAuthAccessContext(): AuthAccessContextValue {
  const context = React.useContext(AuthAccessContext);

  if (!context) {
    throw new Error('useAuthAccessContext must be used within an AuthAccessProvider');
  }

  return context;
}
