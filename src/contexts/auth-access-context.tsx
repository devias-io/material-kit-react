'use client';

import * as React from 'react';

import type { User } from '@/types/user';
import type { AdminPermissions } from '@/lib/permissions';
import { PLAN_PERMISSIONS } from '@/lib/permissions';
import { useUser } from '@/hooks/use-user';

export interface AuthAccessPlanInfo {
  displayName: string;
  pages: string[];
  isAdmin: boolean;
  adminPermissions: AdminPermissions | null;
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
    allPages: string[];
    isAdmin: boolean;
    hasInstagramAccess: boolean;
    hasRenovacoesAccess: boolean;
    hasRelatorioSemanalAdminAccess: boolean;
    hasAnalisesTrimesestraisAdminAccess: boolean;
    hasCentralDuvidasAdminAccess: boolean;
  };
}

const GUARANTEED_PAGES = ['relatorio-semanal', 'recursos-suporte'] as const;

const FALLBACK_PLAN_INFO: AuthAccessPlanInfo = {
  displayName: 'Visitante',
  pages: [...GUARANTEED_PAGES],
  isAdmin: false,
  adminPermissions: null,
};

function ensureGuaranteedPages(pages: string[]): string[] {
  const pageSet = new Set<string>([...GUARANTEED_PAGES, ...pages]);
  return Array.from(pageSet);
}

function derivePlanInfo(user: User | null): AuthAccessPlanInfo {
  if (!user) {
    return FALLBACK_PLAN_INFO;
  }

  const planKey = user.plan as keyof typeof PLAN_PERMISSIONS | undefined;
  const planConfig = planKey ? PLAN_PERMISSIONS[planKey] : undefined;

  const displayName = planConfig?.displayName ?? user.plan ?? FALLBACK_PLAN_INFO.displayName;
  const basePages = planConfig?.pages ?? [];
  const adminPermissions = planConfig?.adminPermissions ?? null;
  const isAdmin = Boolean(planConfig?.isAdmin);
  const customPermissions = user.customPermissions ?? [];

  const pages = ensureGuaranteedPages([...basePages, ...customPermissions]);

  return {
    displayName,
    pages,
    isAdmin,
    adminPermissions,
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
  const customPermissions = user?.customPermissions;

  const hasInstagramAdminAccess = React.useCallback(() => {
    if (!userEmail) {
      return planInfo.isAdmin;
    }
    return planInfo.isAdmin || userEmail === 'jacbdias@gmail.com';
  }, [planInfo.isAdmin, userEmail]);

  const hasRenovacoesAdminAccess = React.useCallback(() => planInfo.isAdmin, [planInfo.isAdmin]);

  const hasRelatorioSemanalAdminAccess = React.useCallback(() => planInfo.isAdmin, [planInfo.isAdmin]);

  const hasAnalisesTrimesestraisAdminAccess = React.useCallback(() => planInfo.isAdmin, [planInfo.isAdmin]);

  const hasCentralDuvidasAdminAccess = React.useCallback(() => planInfo.isAdmin, [planInfo.isAdmin]);

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
