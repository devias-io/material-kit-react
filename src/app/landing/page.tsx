import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { Layout } from '@/components/auth/layout';


export const metadata = { title: `Landing | ${config.site.name}` } satisfies Metadata;

export default function LandingPage(): React.JSX.Element {
  return (
    <Layout>
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Welcome to StakeReloadXS</h1>
        <p>Our website is under construction. Stay tuned for updates!</p>
       <h2>Coming Soon </h2>
      </div>
    </Layout>
  );
}
