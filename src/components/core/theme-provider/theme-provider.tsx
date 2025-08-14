'use client';

import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import { createTheme } from '@/styles/theme/create-theme';

import EmotionCache from './emotion-cache';

export interface ThemeProviderProps {
  children: React.ReactNode;
}

function CustomThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const theme = createTheme();

  return (
    <EmotionCache options={{ key: 'mui' }}>
      <ThemeProvider disableTransitionOnChange theme={theme} defaultMode="dark">
        <CssBaseline />
        {children}
      </ThemeProvider>
    </EmotionCache>
  );
}

export { CustomThemeProvider as ThemeProvider };
