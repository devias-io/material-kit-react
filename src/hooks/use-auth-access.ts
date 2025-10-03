'use client';

import * as React from 'react';

import { AuthAccessContext } from '@/contexts/auth-access-context';

export function useAuthAccess() {
  const context = React.useContext(AuthAccessContext);

  if (!context) {
    throw new Error('useAuthAccess must be used within an AuthAccessProvider');
  }

  return context;
}
