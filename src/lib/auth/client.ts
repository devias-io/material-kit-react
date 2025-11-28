'use client';
import type { User } from '@/types/user';

const planPermissions = {
  'VIP': {
    displayName: 'Close Friends VIP',
    isAdmin: false,
    pages: [
      'small-caps', 'micro-caps', 'dividendos', 'fundos-imobiliarios', 'rentabilidades',
      'internacional', 'internacional-etfs', 'internacional-stocks', 'internacional-dividendos',
      'recursos-exclusivos', 'recursos-dicas', 'recursos-analise', 'recursos-ebooks',
      'recursos-imposto', 'recursos-lives', 'recursos-milhas', 'recursos-planilhas', 'recursos-telegram',
      'recursos-reserva'
    ]
  },
  'LITE': {
    displayName: 'Close Friends LITE',
    isAdmin: false,
    pages: [
      'small-caps', 'dividendos', 'fundos-imobiliarios', 'rentabilidades',
      'internacional', 'internacional-etfs', 'internacional-stocks',
      'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-planilhas', 'recursos-telegram',
      'recursos-reserva'
    ]
  },
  'RENDA_PASSIVA': {
    displayName: 'Projeto Renda Passiva',
    isAdmin: false,
    pages: [
      'dividendos', 'fundos-imobiliarios', 'rentabilidades',
      'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-planilhas', 'recursos-telegram',
      'recursos-reserva'
    ]
  },
  'FIIS': {
    displayName: 'Projeto FIIs',
    isAdmin: false,
    pages: [
      'fundos-imobiliarios', 'rentabilidades',
      'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-planilhas', 'recursos-telegram',
      'recursos-reserva'
    ]
  },
  'RENDA_TURBINADA': {
    displayName: 'CF Renda Turbinada',
    isAdmin: false,
    pages: [
      'cf-renda-turbinada', 'cf-renda-turbinada-aulas', 'cf-renda-turbinada-bastidores', 'cf-renda-turbinada-carteira',
      'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-planilhas', 'recursos-telegram',
      'recursos-reserva'
    ]
  },
  'RENDA_TURBINADA_T2': {
    displayName: 'CF Renda Turbinada - Turma 2',
    isAdmin: false,
    pages: [
      'cf-renda-turbinada-turma-2', 'cf-renda-turbinada-turma-2-aulas', 'cf-renda-turbinada-turma-2-bastidores', 'cf-renda-turbinada-turma-2-carteira',
      'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-planilhas', 'recursos-telegram',
      'recursos-reserva'
    ]
  },
  'AMERICA': {
    displayName: 'Projeto América',
    isAdmin: false,
    pages: [
      'internacional', 'internacional-projeto-america',
      'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-lives', 'recursos-planilhas', 'recursos-telegram',
      'recursos-reserva'
    ]
  },
    'ADMIN': {
      displayName: 'Administrador',
      isAdmin: true,
      pages: [
        'small-caps', 'micro-caps', 'dividendos', 'fundos-imobiliarios', 'rentabilidades',
        'internacional', 'internacional-etfs', 'internacional-stocks', 'internacional-dividendos', 'internacional-projeto-america',
        'cf-renda-turbinada', 'cf-renda-turbinada-aulas', 'cf-renda-turbinada-bastidores', 'cf-renda-turbinada-carteira',
        'cf-renda-turbinada-turma-2', 'cf-renda-turbinada-turma-2-aulas', 'cf-renda-turbinada-turma-2-bastidores', 'cf-renda-turbinada-turma-2-carteira',
        'recursos-exclusivos', 'recursos-dicas', 'recursos-analise', 'recursos-ebooks',
        'recursos-imposto', 'recursos-lives', 'recursos-milhas', 'recursos-planilhas', 'recursos-telegram',
        'recursos-reserva',
      'admin', 'admin-dashboard', 'admin-usuarios', 'admin-empresas', 'admin-proventos',
      'admin-relatorios', 'admin-integracoes', 'admin-settings', 'admin-carteiras'
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

export interface SignUpParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignInWithOAuthParams {
  provider: 'google' | 'discord';
}

export interface SignInWithPasswordParams {
  email: string;
  password: string;
}

export interface SignInWithPasswordSuccessResponse {
  message?: string;
  user?: (User & { mustChangePassword?: boolean }) | null;
}

export interface ResetPasswordParams {
  email: string;
}

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

class AuthClient {
  async signUp(_: SignUpParams): Promise<{ error?: string }> {
    return { error: null };
  }

  async signInWithOAuth(_: SignInWithOAuthParams): Promise<{ error?: string }> {
    return { error: 'Social authentication not implemented' };
  }

  async signInWithPassword(
    params: SignInWithPasswordParams
  ): Promise<{ data?: SignInWithPasswordSuccessResponse; error?: string }> {
    const { email, password } = params;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = (await response.json()) as SignInWithPasswordSuccessResponse;
        return { data };
      }

      const errorData = await response.json();
      return { error: errorData.error || 'Credenciais inválidas' };
    } catch (error) {
      console.error('Erro na chamada da API:', error);
      return { error: 'Erro de conexão. Tente novamente.' };
    }
  }

  async resetPassword(params: ResetPasswordParams): Promise<{ error?: string }> {
    try {
      console.log('🔑 Solicitando reset para:', params.email);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: params.email }),
      });

      if (response.ok) {
        await response.json();
        console.log('✅ Reset solicitado com sucesso');
        return { error: null };
      } else {
        const errorData = await response.json();
        console.log('❌ Erro no reset:', errorData);
        return { error: errorData.error || 'Erro ao solicitar reset' };
      }
    } catch (error) {
      console.error('💥 Erro na solicitação de reset:', error);
      return { error: 'Erro de conexão. Tente novamente.' };
    }
  }

  async updatePassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Update reset not implemented' };
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (!response.ok) {
        return { data: null };
      }
      const data = await response.json();
      return { data: data.user };
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      return { error: 'Erro ao obter usuário' };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });

      if (!response.ok) {
        let errorMessage = 'Erro ao sair';

        try {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Erro ao interpretar resposta de logout:', parseError);
        }

        console.error('Falha ao sair:', response.statusText);
        return { error: errorMessage };
      }
    } catch (error) {
      console.error('Erro ao sair:', error);
      return { error: 'Erro ao sair' };
    }
    return { error: null };
  }

  async hasAccess(page: string): Promise<boolean> {
    const { data: user } = await this.getUser();
    if (!user || !('plan' in user)) return false;

    const userPlan = (user as any).plan;
    return planPermissions[userPlan]?.pages.includes(page) || false;
  }

  async isAdmin(): Promise<boolean> {
    const { data: user } = await this.getUser();
    if (!user || !('plan' in user)) return false;

    const userPlan = (user as any).plan;
    return planPermissions[userPlan]?.isAdmin || false;
  }

  async getAdminPermissions(): Promise<AdminPermissions | null> {
    const { data: user } = await this.getUser();
    if (!user || !('plan' in user)) return null;

    const userPlan = (user as any).plan;
    const plan = planPermissions[userPlan];

    return plan?.adminPermissions || null;
  }

  async hasAdminPermission(permission: keyof AdminPermissions): Promise<boolean> {
    const permissions = await this.getAdminPermissions();
    return permissions?.[permission] || false;
  }

  async getPlanInfo(): Promise<{
    displayName: string;
    pages: string[];
    isAdmin: boolean;
    adminPermissions?: AdminPermissions;
  } | null> {
    const { data: user } = await this.getUser();
    if (!user || !('plan' in user)) return null;

    const userPlan = (user as any).plan;
    const plan = planPermissions[userPlan];

    if (!plan) return null;

    return {
      displayName: plan.displayName,
      pages: plan.pages,
      isAdmin: plan.isAdmin || false,
      adminPermissions: plan.adminPermissions,
    };
  }
}

export const authClient = new AuthClient();

if (typeof window !== 'undefined') {
  (window as any).authClient = authClient;
}
