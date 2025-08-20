'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ApiKeysForm } from '@/app/dashboard/system-settings/api-keys-form';
import { MaintenanceModeCard } from '@/app/dashboard/system-settings/maintenance-mode-card';

export default function SystemSettingsPage(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">System Settings</Typography>
      </div>
      <form onSubmit={(event) => event.preventDefault()}>
        <Stack spacing={3}>
          <ApiKeysForm />
          <MaintenanceModeCard />
        </Stack>
      </form>
    </Stack>
  );
}