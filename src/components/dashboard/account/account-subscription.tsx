'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useUser } from '@/hooks/use-user';
import type { User } from '@/types/user';

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

function parseDate(dateInput?: string | null): Date | null {
  if (!dateInput) {
    return null;
  }

  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function formatDate(dateInput?: string | null): string {
  const parsed = parseDate(dateInput);

  if (!parsed) {
    return 'Não disponível';
  }

  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function calculateFallbackExpiration(user: User | null | undefined): string | undefined {
  if (user?.expirationDate) {
    return user.expirationDate;
  }

  const lastValidPurchase = user?.recentPurchases?.find(
    (purchase) => purchase.status === 'COMPLETED' && purchase.createdAt
  );

  if (!lastValidPurchase?.createdAt) {
    return undefined;
  }

  const purchaseDate = parseDate(lastValidPurchase.createdAt);
  if (!purchaseDate) {
    return undefined;
  }

  const fallback = new Date(purchaseDate);
  fallback.setDate(fallback.getDate() + 365);

  return fallback.toISOString();
}

export function AccountSubscription(): React.JSX.Element {
  const { user } = useUser();
  const effectiveExpiration = React.useMemo(() => calculateFallbackExpiration(user), [user]);

  const isExpired = React.useCallback((expirationDate?: string | null) => {
    const parsed = parseDate(expirationDate ?? effectiveExpiration);
    if (!parsed) {
      return false;
    }

    const endOfDay = new Date(parsed);
    endOfDay.setHours(23, 59, 59, 999);

    return endOfDay.getTime() < Date.now();
  }, [effectiveExpiration]);

  const getStatusInfo = React.useCallback(() => {
    const expirationForStatus = effectiveExpiration ?? user?.expirationDate ?? null;

    if (!expirationForStatus) {
      return {
        label: user?.plan === 'ADMIN' ? 'Acesso administrativo' : 'Ativo',
        color: user?.plan === 'ADMIN' ? 'info' as const : 'success' as const,
        icon: user?.plan === 'ADMIN' ? '🛡️' : '✅'
      };
    }

    const expired = isExpired(expirationForStatus);
    if (expired) {
      return {
        label: 'Expirado',
        color: 'error' as const,
        icon: '🔴'
      };
    }

    const expirationDate = parseDate(expirationForStatus);
    if (!expirationDate) {
      return {
        label: 'Ativo',
        color: 'success' as const,
        icon: '✅'
      };
    }

    const daysLeft = Math.ceil((expirationDate.getTime() - Date.now()) / ONE_DAY_IN_MS);

    if (daysLeft <= 7) {
      return {
        label: `Expira em ${daysLeft} dias`,
        color: 'warning' as const,
        icon: '⚠️'
      };
    }

    return {
      label: 'Ativo',
      color: 'success' as const,
      icon: '✅'
    };
  }, [effectiveExpiration, isExpired, user?.plan, user?.expirationDate]);

  const statusInfo = getStatusInfo();
  const expirationToDisplay = effectiveExpiration ?? user?.expirationDate ?? null;
  const formattedExpiration = React.useMemo(() => {
    if (expirationToDisplay) {
      return formatDate(expirationToDisplay);
    }

    if (user?.expirationDate === null) {
      return 'Acesso vitalício';
    }

    return 'Não disponível';
  }, [expirationToDisplay, user?.expirationDate]);

  return (
    <Card sx={{ 
      backgroundColor: '#FFFFFF', 
      borderRadius: 3, 
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <CardHeader 
        title="Assinatura"
        sx={{
          '& .MuiCardHeader-title': {
            color: '#1E293B',
            fontWeight: '600',
            fontSize: '1.1rem'
          }
        }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 1 }}>
              Status
            </Typography>
            <Chip
              icon={<span>{statusInfo.icon}</span>}
              label={statusInfo.label}
              color={statusInfo.color}
              sx={{ fontWeight: '500' }}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 1 }}>
              Vencimento
            </Typography>
            <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: '500' }}>
              {formattedExpiration}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 1 }}>
              Membro desde
            </Typography>
            <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: '500' }}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric'
              }) : 'N/A'}
            </Typography>
          </Box>

          {user?.totalPurchases > 0 && (
            <Box>
              <Typography variant="body2" sx={{ color: '#64748B', mb: 1 }}>
                Total investido
              </Typography>
              <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: '500' }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(user.totalPurchases)}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}