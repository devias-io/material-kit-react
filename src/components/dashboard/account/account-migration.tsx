'use client';

import * as React from 'react';
import { Alert, Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';

type MigrationSimulation = {
  fromPlan: string;
  toPlan: string;
  totalPaid: number;
  installmentsTotal: number | null;
  monthsRemaining: number;
  credit: number;
  vipPrice: number;
  finalPrice: number;
  notices: string[];
  purchaseDate: string;
  expirationDate: string | null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function AccountMigration(): React.JSX.Element {
  const [simulation, setSimulation] = React.useState<MigrationSimulation | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [linkLoading, setLinkLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSimulate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/account/migration-simulation?target=VIP', {
        method: 'GET',
        credentials: 'include',
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Não foi possível simular a migração.');
      }

      setSimulation(payload.simulation);
    } catch (err) {
      setSimulation(null);
      setError(err instanceof Error ? err.message : 'Erro ao simular migração.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    try {
      setLinkLoading(true);
      setError(null);

      const response = await fetch('/api/account/migration-link', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'VIP' }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Não foi possível gerar o link de pagamento.');
      }

      if (payload?.paymentUrl) {
        window.location.href = payload.paymentUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar o link de pagamento.');
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <Card
      sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: 3,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600 }}>
              👑 Migração para VIP
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
              Simule o valor de upgrade e finalize a migração quando desejar.
            </Typography>
          </Box>

          {error && (
            <Alert severity="warning" sx={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              {error}
            </Alert>
          )}

          {!simulation && (
            <Button
              variant="contained"
              onClick={handleSimulate}
              disabled={loading}
              sx={{
                bgcolor: '#3B82F6',
                color: '#FFFFFF',
                fontWeight: 600,
                '&:hover': { bgcolor: '#2563EB' },
                textTransform: 'none',
              }}
            >
              {loading ? 'Calculando...' : 'Simular migração'}
            </Button>
          )}

          {simulation && (
            <Stack spacing={2}>
              <Divider />
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  <strong>Plano atual:</strong> {simulation.fromPlan}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  <strong>Última compra:</strong>{' '}
                  {new Date(simulation.purchaseDate).toLocaleDateString('pt-BR')}
                </Typography>
                {simulation.expirationDate && (
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    <strong>Vencimento atual:</strong>{' '}
                    {new Date(simulation.expirationDate).toLocaleDateString('pt-BR')}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  <strong>Meses restantes:</strong> {simulation.monthsRemaining}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  <strong>Total pago:</strong> {formatCurrency(simulation.totalPaid)}
                </Typography>
                {simulation.installmentsTotal && (
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    <strong>Parcelas escolhidas:</strong> {simulation.installmentsTotal}x
                  </Typography>
                )}
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography variant="body2" sx={{ color: '#1E293B' }}>
                  <strong>Valor do VIP:</strong> {formatCurrency(simulation.vipPrice)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#1E293B' }}>
                  <strong>Crédito abatido:</strong> {formatCurrency(simulation.credit)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#1E293B' }}>
                  <strong>Total a pagar:</strong> {formatCurrency(simulation.finalPrice)}
                </Typography>
              </Stack>

              <Stack spacing={1}>
                {simulation.notices.map((notice) => (
                  <Alert
                    key={notice}
                    severity="info"
                    sx={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}
                  >
                    {notice}
                  </Alert>
                ))}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="outlined"
                  onClick={handleSimulate}
                  disabled={loading}
                  sx={{ textTransform: 'none' }}
                >
                  Recalcular
                </Button>
                <Button
                  variant="contained"
                  onClick={handleGenerateLink}
                  disabled={linkLoading}
                  sx={{
                    bgcolor: '#10B981',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#059669' },
                    textTransform: 'none',
                  }}
                >
                  {linkLoading ? 'Gerando link...' : 'Fazer migração'}
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
