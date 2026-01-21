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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
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
  isActive: boolean;
  priceTiers?: Array<{
    min: number;
    max: number;
    price?: number | null;
    checkoutUrl: string;
  }> | null;
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
  const [syncNotice, setSyncNotice] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<MigrationProduct | null>(null);
  const [formState, setFormState] = React.useState({
    name: '',
    platform: 'hotmart',
    migrationCheckoutUrl: '',
    isActive: true,
    priceTiers: [] as Array<{
      min: string;
      max: string;
      price: string;
      checkoutUrl: string;
    }>,
  });

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
      setSyncNotice(null);
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
      const results = Array.isArray(data?.results) ? data.results : [];
      const failures = results.filter((result: { success?: boolean }) => result.success === false);
      if (failures.length > 0) {
        const message = failures
          .map((result: { platform: string; errors?: string[] }) => `${result.platform}: ${result.errors?.join(', ')}`)
          .join(' | ');
        setError(`Falha ao sincronizar: ${message}`);
      } else {
        setSyncNotice('✅ Produtos sincronizados com sucesso.');
      }
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar produtos.');
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormState({
      name: '',
      platform: 'hotmart',
      migrationCheckoutUrl: '',
      isActive: true,
      priceTiers: [],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (product: MigrationProduct) => {
    setEditingProduct(product);
    setFormState({
      name: product.name,
      platform: product.platform.toLowerCase(),
      migrationCheckoutUrl: product.migrationCheckoutUrl || '',
      isActive: product.isActive,
      priceTiers:
        product.priceTiers?.map((tier) => ({
          min: String(tier.min ?? ''),
          max: String(tier.max ?? ''),
          price: tier.price !== null && tier.price !== undefined ? String(tier.price) : '',
          checkoutUrl: tier.checkoutUrl ?? '',
        })) || [],
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmitProduct = async () => {
    try {
      setError(null);
      const normalizedPriceTiers = formState.priceTiers
        .map((tier) => ({
          min: Number(tier.min),
          max: Number(tier.max),
          price: tier.price.trim() ? Number(tier.price) : null,
          checkoutUrl: tier.checkoutUrl.trim(),
        }))
        .filter(
          (tier) =>
            Number.isFinite(tier.min) &&
            Number.isFinite(tier.max) &&
            tier.checkoutUrl.length > 0
        );
      const payload = {
        name: formState.name.trim(),
        platform: formState.platform,
        migrationCheckoutUrl: formState.migrationCheckoutUrl.trim() || null,
        isActive: formState.isActive,
        priceTiers: normalizedPriceTiers.length > 0 ? normalizedPriceTiers : null,
      };
      const response = await fetch(
        editingProduct
          ? `/api/admin/migration-products/${editingProduct.id}`
          : '/api/admin/migration-products',
        {
          method: editingProduct ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao salvar produto.');
      }
      if (editingProduct) {
        setProducts((prev) =>
          prev.map((product) => (product.id === editingProduct.id ? data.product : product))
        );
      } else {
        setProducts((prev) => [data.product, ...prev]);
      }
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja deletar este produto?');
    if (!confirmed) return;

    try {
      setError(null);
      const response = await fetch(`/api/admin/migration-products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao deletar produto.');
      }
      setProducts((prev) => prev.filter((product) => product.id !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar produto.');
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
              <Button
                variant="outlined"
                onClick={handleOpenCreate}
                sx={{ textTransform: 'none' }}
              >
                Adicionar Produto Manualmente
              </Button>
            </Stack>

            {error && (
              <Alert severity="warning" sx={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                {error}
              </Alert>
            )}
            {syncNotice && (
              <Alert severity="success" sx={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                {syncNotice}
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
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Origem</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Elegível</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>ID externo</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Link de migração</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => {
                      const platformKey = product.platform.toUpperCase();
                      const isManual = product.externalId.startsWith('manual-');
                      const isEligible = product.isActive && Boolean(product.migrationCheckoutUrl);
                      return (
                        <TableRow key={product.id} hover>
                        <TableCell>
                          <Chip
                            label={PLATFORM_LABELS[platformKey] || product.platform}
                            size="small"
                            sx={{ backgroundColor: '#EEF2FF', color: '#4338CA', fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#1E293B' }}>{product.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={isManual ? 'Manual' : 'Sincronizado'}
                            size="small"
                            sx={{
                              backgroundColor: isManual ? '#FEF3C7' : '#DBEAFE',
                              color: isManual ? '#92400E' : '#1D4ED8',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={product.isActive ? 'Ativo' : 'Inativo'}
                            size="small"
                            sx={{
                              backgroundColor: product.isActive ? '#ECFDF5' : '#FEE2E2',
                              color: product.isActive ? '#047857' : '#B91C1C',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isEligible ? 'Pronto' : 'Pendente'}
                            size="small"
                            sx={{
                              backgroundColor: isEligible ? '#DCFCE7' : '#FFE4E6',
                              color: isEligible ? '#166534' : '#BE123C',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{product.externalId}</TableCell>
                        <TableCell>
                          <Typography sx={{ color: '#475569', wordBreak: 'break-all' }} variant="body2">
                            {product.migrationCheckoutUrl || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="outlined"
                              onClick={() => handleOpenEdit(product)}
                              sx={{ textTransform: 'none' }}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="text"
                              color="error"
                              onClick={() => handleDeleteProduct(product.id)}
                              sx={{ textTransform: 'none' }}
                            >
                              Excluir
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                    {products.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ textAlign: 'center', color: '#64748B' }}>
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

      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Editar produto de migração' : 'Adicionar produto manual'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nome do Produto"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel id="platform-label">Plataforma</InputLabel>
              <Select
                labelId="platform-label"
                label="Plataforma"
                value={formState.platform}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, platform: event.target.value as string }))
                }
              >
                <MenuItem value="hotmart">Hotmart</MenuItem>
                <MenuItem value="kiwify">Kiwify</MenuItem>
                <MenuItem value="eduzz">Eduzz</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Link de Checkout de Migração"
              value={formState.migrationCheckoutUrl}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, migrationCheckoutUrl: event.target.value }))
              }
              fullWidth
              placeholder="https://checkout..."
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formState.isActive}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, isActive: event.target.checked }))
                  }
                />
              }
              label={formState.isActive ? 'Status: Ativo' : 'Status: Inativo'}
            />
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ color: '#475569' }}>
                Faixas de preço para migração
              </Typography>
              {formState.priceTiers.map((tier, index) => (
                <Stack key={`${tier.checkoutUrl}-${index}`} direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Mínimo"
                    type="number"
                    value={tier.min}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        priceTiers: prev.priceTiers.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, min: event.target.value } : item
                        ),
                      }))
                    }
                  />
                  <TextField
                    label="Máximo"
                    type="number"
                    value={tier.max}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        priceTiers: prev.priceTiers.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, max: event.target.value } : item
                        ),
                      }))
                    }
                  />
                  <TextField
                    label="Preço do link"
                    type="number"
                    value={tier.price}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        priceTiers: prev.priceTiers.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, price: event.target.value } : item
                        ),
                      }))
                    }
                  />
                  <TextField
                    label="Link de checkout"
                    value={tier.checkoutUrl}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        priceTiers: prev.priceTiers.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, checkoutUrl: event.target.value } : item
                        ),
                      }))
                    }
                    fullWidth
                  />
                  <Button
                    variant="text"
                    color="error"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        priceTiers: prev.priceTiers.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                    sx={{ textTransform: 'none' }}
                  >
                    Remover
                  </Button>
                </Stack>
              ))}
              <Button
                variant="outlined"
                onClick={() =>
                  setFormState((prev) => ({
                    ...prev,
                    priceTiers: [
                      ...prev.priceTiers,
                      { min: '', max: '', price: '', checkoutUrl: '' },
                    ],
                  }))
                }
                sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
              >
                Adicionar faixa de preço
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseModal} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitProduct}
            variant="contained"
            sx={{ textTransform: 'none' }}
            disabled={!formState.name.trim()}
          >
            {editingProduct ? 'Salvar alterações' : 'Cadastrar produto'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
