'use client'; // <-- 1. Add this to use hooks

import * as React from 'react';
import { usePathname } from 'next/navigation'; // <-- 2. Import the hook
import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';

import { AuthGuard } from '@/components/auth/auth-guard';
import { MainNav } from '@/components/dashboard/layout/main-nav';
import { SideNav } from '@/components/dashboard/layout/side-nav';

interface LayoutProps {
  children: React.ReactNode;
}

// 3. Define the routes that should take up the full page
const fullPageRoutes = ['/signin', '/signup', '/forgot-password'];

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  const pathname = usePathname(); // Get the current URL path

  // 4. Check if the current path is a full-page route
  const isFullPage = fullPageRoutes.includes(pathname);

  // If it's a full-page route, render only the children inside the AuthGuard
  if (isFullPage) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  // Otherwise, render the standard dashboard layout
  return (
    <AuthGuard>
      <GlobalStyles
        styles={{
          body: {
            '--MainNav-height': '56px',
            '--SideNav-width': '260px',
          },
        }}
      />
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar */}
        <SideNav />

        {/* Main content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            pl: { lg: 'var(--SideNav-width)' },
          }}
        >
          {/* Top bar */}
          <MainNav />

          {/* Dashboard content */}
          <Box
            component="main"
            sx={{
              flex: 1,
              p: 3,
              bgcolor: 'var(--mui-palette-background-default)',
              overflowY: 'auto',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </AuthGuard>
  );
}