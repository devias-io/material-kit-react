import * as React from 'react';
import type { Viewport } from 'next';
import '@/styles/global.css';
import { UserProvider } from '@/contexts/user-context';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { AuthAccessProvider } from '@/contexts/auth-access-context';

// 🔥 IMPORTS DOS PROVIDERS
import { QueryProvider } from '@/components/providers/query-provider';
import { NotificationsProvider } from '@/hooks/useNotifications';

export const viewport = { width: 'device-width', initialScale: 1 } satisfies Viewport;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <LocalizationProvider>
          <UserProvider>
            <AuthAccessProvider>
              {/* 🔥 QUERY PROVIDER (Client Component) */}
              <QueryProvider>
                <ThemeProvider>
                  <NotificationsProvider>
                    {children}
                  </NotificationsProvider>
                </ThemeProvider>
              </QueryProvider>
            </AuthAccessProvider>
          </UserProvider>
        </LocalizationProvider>
      </body>
    </html>
  );
}
