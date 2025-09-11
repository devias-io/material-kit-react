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
  const { user, checkSession, isLoading } = useUser();

  const handleProfileUpdate = async (updatedData: any) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        const result = await response.json();

        await checkSession?.();

        // Atualizar localStorage
        const currentUserData = localStorage.getItem('user-data');
        if (currentUserData) {
          const userData = JSON.parse(currentUserData);
          const updatedUserData = { ...userData, ...result.user };
          localStorage.setItem('user-data', JSON.stringify(updatedUserData));
        }

        // Disparar evento para outros componentes
        window.dispatchEvent(new Event('storage'));

      } else {
        console.error('❌ Erro na API:', await response.text());
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
    }
  };

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
            <AccountInfo
              user={user}
              onUpdate={handleProfileUpdate}
            />
            <AccountSubscription
              user={user}
            />
          </Stack>
        </Grid>

        <Grid lg={8} md={6} xs={12}>
          <Stack spacing={3}>
            <AccountDetailsForm
              user={user}
              onUpdate={handleProfileUpdate}
            />
            <AccountSecurity
              user={user}
            />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}