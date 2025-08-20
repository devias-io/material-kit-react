'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CampaignsList } from '@/app/dashboard/campaigns/campaigns-list';

export default function CampaignsPage(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Campaigns</Typography>
      </div>
      <CampaignsList />
    </Stack>
  );
}