import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { GuestGuard } from '@/components/auth/guest-guard';
import { Layout } from '@/components/auth/layout';

export const metadata = { title: `Sign in | Auth | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <Layout>
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>StakeReloadXS</h1>
        <p>Our page is under construction. Stay tuned!</p>
      </div>
    </Layout>
  );
}
