'use client';
import * as React from 'react';
import type { User } from '@/types/user';
import { logger } from '@/lib/default-logger';

export interface UserContextValue {
  user: User | null;
  error: string | null;
  isLoading: boolean;
  checkSession?: () => Promise<void>;
  refreshProfile?: () => Promise<void>;
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps): React.JSX.Element {
  const [state, setState] = React.useState<{ user: User | null; error: string | null; isLoading: boolean }>({
    user: null,
    error: null,
    isLoading: true,
  });
  const refreshProfile = React.useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/user/profile', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({ ...prev, user: data.user ?? prev.user }));
        if (typeof window !== 'undefined' && data.user) {
          localStorage.setItem('user-data', JSON.stringify(data.user));
        }
      }
    } catch (err) {
      logger.error(err);
    }
  }, []);

  const checkSession = React.useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    let nextUser: User | null | undefined;
    let nextError: string | null | undefined;

    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          nextUser = data.user;
          nextError = null;
          void refreshProfile();
        } else {
          nextUser = null;
          nextError = null;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user-data');
          }
        }
      } else {
        nextUser = null;
        nextError = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-data');
        }
      }
    } catch (err) {
      logger.error(err);
      nextUser = null;
      nextError = 'Something went wrong';
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user-data');
      }
    } finally {
      setState(prev => ({
        ...prev,
        user: nextUser ?? prev.user,
        error: nextError ?? prev.error,
        isLoading: false,
      }));
    }
  }, [refreshProfile]);

  React.useEffect(() => {
    checkSession().catch((err: unknown) => {
      logger.error(err);
    });
  }, [checkSession]);

  return <UserContext.Provider value={{ ...state, checkSession, refreshProfile }}>{children}</UserContext.Provider>;
}

export const UserConsumer = UserContext.Consumer;
