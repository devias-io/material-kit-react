'use client';

import React, { Suspense } from 'react';

import AdminAnaliseTecnicaManager from '@/components/AdminAnaliseTecnicaManager';

export const dynamic = 'force-dynamic';

export default function AdminAnaliseTecnicaPage() {
  return (
    <Suspense fallback={null}>
      <AdminAnaliseTecnicaManager />
    </Suspense>
  );
}
