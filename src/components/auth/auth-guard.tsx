'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { paths } from '@/paths';
import { useAuth } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';

export interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): React.JSX.Element | null {
  const router = useRouter();
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = React.useState<boolean>(true);

  const checkPermissions = async (): Promise<void> => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !currentUser) {
      logger.debug('[AuthGuard]: User is not logged in, redirecting to sign in');
      router.replace(paths.auth.signIn);
      return;
    }

    setIsChecking(false);
  };

  React.useEffect(() => {
    checkPermissions().catch(() => {
      // noop
    });
  }, [currentUser, isLoading, isAuthenticated]);

  if (isChecking || isLoading) {
    return null;
  }

  return <React.Fragment>{children}</React.Fragment>;
}
