import React from 'react';
import { renderToString } from 'react-dom/server';

import { AuthAccessProvider } from './auth-access-context';
import { useAuthAccess } from '@/hooks/use-auth-access';
import { authClient } from '@/lib/auth/client';

jest.mock('@/hooks/use-user', () => ({
  useUser: jest.fn(),
}));

jest.mock('@/lib/auth/client', () => ({
  authClient: {
    getPlanInfo: jest.fn(),
  },
}));

const { useUser } = require('@/hooks/use-user');
const useUserMock = useUser as jest.Mock;

describe('AuthAccessProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides a safe fallback for visitors', () => {
    useUserMock.mockReturnValue({
      user: null,
      isLoading: false,
    });

    let received: ReturnType<typeof useAuthAccess> | undefined;

    const Consumer = () => {
      received = useAuthAccess();
      return null;
    };

    renderToString(
      <AuthAccessProvider>
        <Consumer />
      </AuthAccessProvider>
    );

    expect(received?.planInfo.displayName).toBe('Visitante');
    expect(received?.planInfo.pages).toEqual(['relatorio-semanal', 'recursos-suporte']);
    expect(received?.hasAccessSync('relatorio-semanal')).toBe(true);
    expect(received?.hasAccessSync('recursos-suporte')).toBe(true);
    expect(received?.hasAccessSync('small-caps')).toBe(false);
  });

  it('does not trigger duplicate plan info requests for multiple consumers', () => {
    useUserMock.mockReturnValue({
      user: {
        plan: 'VIP',
        customPermissions: ['extra-page'],
        email: 'user@example.com',
        activeEntitlements: [],
      },
      isLoading: false,
    });

    const Consumer = () => {
      useAuthAccess();
      return null;
    };

    renderToString(
      <AuthAccessProvider>
        <Consumer />
        <Consumer />
      </AuthAccessProvider>
    );

    expect(authClient.getPlanInfo).not.toHaveBeenCalled();
  });

  it('does not expose add-on pages when there is no entitlement', () => {
    useUserMock.mockReturnValue({
      user: {
        plan: 'VIP',
        customPermissions: [],
        email: 'novipaddon@example.com',
        activeEntitlements: [],
      },
      isLoading: false,
    });

    let received: ReturnType<typeof useAuthAccess> | undefined;

    const Consumer = () => {
      received = useAuthAccess();
      return null;
    };

    renderToString(
      <AuthAccessProvider>
        <Consumer />
      </AuthAccessProvider>
    );

    expect(received?.planInfo.pages).not.toContain('internacional-projeto-america');
  });

  it('combines base plan and entitlement permissions', () => {
    useUserMock.mockReturnValue({
      user: {
        plan: 'VIP',
        activeEntitlements: ['AMERICA'],
        customPermissions: [],
        email: 'addon@example.com',
      },
      isLoading: false,
    });

    let received: ReturnType<typeof useAuthAccess> | undefined;

    const Consumer = () => {
      received = useAuthAccess();
      return null;
    };

    renderToString(
      <AuthAccessProvider>
        <Consumer />
      </AuthAccessProvider>
    );

    expect(received?.planInfo.displayName).toBe('Close Friends VIP + Projeto América');
    expect(received?.planInfo.pages).toEqual(
      expect.arrayContaining([
        'small-caps',
        'internacional-projeto-america',
      ])
    );
  });
});
