'use client';
import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { AccountDetailsForm } from '@/components/dashboard/account/account-details-form';
import { AccountInfo } from '@/components/dashboard/account/account-info';
import { AccountSecurity } from '@/components/dashboard/account/account-security';
import { AccountSubscription } from '@/components/dashboard/account/account-subscription';
import { useUser } from '@/hooks/use-user';

export default function Page(): React.JSX.Element {

  if (isLoading || !user) {
    return (
      <Stack spacing={3}>
        <Typography variant="h4" sx={{ color: '#1E293B', fontWeight: '700' }}>
          Carregando...
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={4} sx={{ p: 3 }}>
      <div>
        <Typography variant="h4" sx={{ color: '#1E293B', fontWeight: '700' }}>
          Minha Conta
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B', mt: 1 }}>
          Gerencie suas informações pessoais e configurações de segurança
        </Typography>
      </div>

      <Grid container spacing={3}>
        <Grid lg={4} md={6} xs={12}>
          <Stack spacing={3}>
          </Stack>
        </Grid>

        <Grid lg={8} md={6} xs={12}>
          <Stack spacing={3}>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}