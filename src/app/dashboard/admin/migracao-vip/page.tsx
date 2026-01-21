'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';

type MigrationProduct = {
  id: string;
  platform: string;
  externalId: string;
  name: string;
  migrationCheckoutUrl: string | null;
};

const PLATFORM_LABELS: Record<string, string> = {
  HOTMART: 'Hotmart',
  KIWIFY: 'Kiwify',
  EDUZZ: 'Eduzz',
};

export default function MigrationVipConfigPage(): React.JSX.Element {
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [products, setProducts] = React.useState<MigrationProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editingLinks, setEditingLinks] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (currentUser && 'plan' in currentUser && currentUser.plan !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const loadProducts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/migration-products', {
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao carregar produtos.');
      }
      setProducts(data.products || []);
      setEditingLinks(
        (data.products || []).reduce((acc: Record<string, string>, product: MigrationProduct) => {
          acc[product.id] = product.migrationCheckoutUrl || '';
          return acc;
        }, {})
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSync = async (platform?: string) => {
    try {
      setSyncing(true);
      setError(null);
      const response = await fetch('/api/admin/migration-products/sync', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platform ? { platform } : {}),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao sincronizar produtos.');
      }
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar produtos.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveLink = async (productId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/migration-products/${productId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ migrationCheckoutUrl: editingLinks[productId] }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao salvar link.');
      }
      setProducts((prev) =>
        prev.map((product) => (product.id === productId ? data.product : product))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar link.');
    }
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <Box mb={4}>
        <Typography variant="h4" sx={{ color: '#1E293B', fontWeight: 700 }}>
          🔗 Migração VIP — Configuração de Produtos
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B', mt: 1 }}>
          Sincronize produtos das plataformas e configure o link de checkout de migração para cada item.
        </Typography>
      </Box>

      <Card sx={{ backgroundColor: '#FFFFFF', borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Button
                variant="contained"
                onClick={() => handleSync()}
                disabled={syncing}
                sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' }, textTransform: 'none' }}
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar todos os produtos'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleSync('HOTMART')}
                disabled={syncing}
                sx={{ textTransform: 'none' }}
              >
                Hotmart
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleSync('KIWIFY')}
                disabled={syncing}
                sx={{ textTransform: 'none' }}
              >
                Kiwify
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleSync('EDUZZ')}
                disabled={syncing}
                sx={{ textTransform: 'none' }}
              >
                Eduzz
              </Button>
            </Stack>

            {error && (
              <Alert severity="warning" sx={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                {error}
              </Alert>
            )}

            <Divider />

            {loading ? (
              <Typography sx={{ color: '#64748B' }}>Carregando produtos...</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Plataforma</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Produto</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>ID externo</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Link de migração</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          <Chip
                            label={PLATFORM_LABELS[product.platform] || product.platform}
                            size="small"
                            sx={{ backgroundColor: '#EEF2FF', color: '#4338CA', fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#1E293B' }}>{product.name}</TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{product.externalId}</TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={editingLinks[product.id] ?? ''}
                            placeholder="https://checkout..."
                            onChange={(event) =>
                              setEditingLinks((prev) => ({
                                ...prev,
                                [product.id]: event.target.value,
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            onClick={() => handleSaveLink(product.id)}
                            sx={{ textTransform: 'none' }}
                          >
                            Salvar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {products.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', color: '#64748B' }}>
                          Nenhum produto sincronizado ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
