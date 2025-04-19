'use client';

import * as React from 'react';
import type { Viewport } from 'next';

import '@/styles/global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';

export const viewport = { width: 'device-width', initialScale: 1 } satisfies Viewport;

interface LayoutProps {
  children: React.ReactNode;
}
const queryClient = new QueryClient();

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <LocalizationProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </LocalizationProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
