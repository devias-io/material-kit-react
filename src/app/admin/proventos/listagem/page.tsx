'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TableSortLabel,
  LinearProgress,
  Paper,
} from '@mui/material';
import { useProventos } from '@/hooks/useProventos';

const tipoOptions = [
  { label: 'Todos', value: '' },
  { label: 'Dividendo', value: 'DIVIDENDO' },
  { label: 'JCP', value: 'JCP' },
];

const origemOptions = [
  { label: 'Todos', value: '' },
  { label: 'BRAPI', value: 'BRAPI' },
  { label: 'CSV', value: 'CSV' },
];

const badgeTipoColor: Record<string, 'primary' | 'success' | 'default'> = {
  DIVIDENDO: 'primary',
  JCP: 'success',
};

const badgeOrigemColor: Record<string, 'secondary' | 'warning' | 'default'> = {
  BRAPI: 'secondary',
  CSV: 'warning',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
}

export default function ListagemProventosPage() {
  const {
    proventos,
    pagination,
    order,
    loading,
    error,
    estatisticas,
    loadingStats,
    applyFilters,
    clearFilters,
    goToPage,
    toggleOrder,
    range,
  } = useProventos();

  const [tickerInput, setTickerInput] = useState('');
  const [tipoInput, setTipoInput] = useState('');
  const [origemInput, setOrigemInput] = useState('');

  const filtersActive = useMemo(
    () => Boolean(tickerInput || tipoInput || origemInput),
    [origemInput, tickerInput, tipoInput]
  );

  const handleApplyFilters = () => {
    applyFilters({
      ticker: tickerInput.trim().toUpperCase() || undefined,
      tipo: (tipoInput as typeof tipoOptions[number]['value']) || undefined,
      origem: (origemInput as typeof origemOptions[number]['value']) || undefined,
    });
  };

  const handleClearFilters = () => {
    setTickerInput('');
    setTipoInput('');
    setOrigemInput('');
    clearFilters();
  };

  const statsCards = useMemo(() => {
    if (!estatisticas) return [];
    return [
      {
        title: 'Total de Proventos',
        value: estatisticas.totalProventos.toLocaleString('pt-BR'),
      },
      {
        title: 'Tickers Únicos',
        value: estatisticas.totalEmpresas.toLocaleString('pt-BR'),
      },
      {
        title: 'Soma de Valores',
        value: formatCurrency(estatisticas.valorTotal),
      },
      {
        title: 'Último Upload',
        value: estatisticas.dataUltimoUpload
          ? formatDate(estatisticas.dataUltimoUpload)
          : '—',
      },
    ];
  }, [estatisticas]);

  return (
    <Box
      sx={{
        p: { xs: 3, md: 4 },
        maxWidth: 1400,
        mx: 'auto',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Stack spacing={3}>
        <Card
          sx={{
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                  📑 Listagem de Proventos
                </Typography>
                <Typography variant="body1" sx={{ color: '#475569' }}>
                  Consulte proventos, filtre por ticker, tipo ou origem e navegue pelos últimos lançamentos.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={toggleOrder}
                sx={{
                  alignSelf: { xs: 'flex-start', md: 'center' },
                  borderRadius: '12px',
                  borderColor: '#cbd5e1',
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#0f172a',
                  '&:hover': { backgroundColor: '#f8fafc', borderColor: '#94a3b8' },
                }}
              >
                Ordenar por data {order === 'desc' ? '▼' : '▲'}
              </Button>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Ticker"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value)}
                  placeholder="VALE3"
                  fullWidth
                  size="small"
                  sx={{ backgroundColor: '#fff', borderRadius: '12px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Tipo"
                  value={tipoInput}
                  onChange={(e) => setTipoInput(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ backgroundColor: '#fff', borderRadius: '12px' }}
                >
                  {tipoOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Origem"
                  value={origemInput}
                  onChange={(e) => setOrigemInput(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ backgroundColor: '#fff', borderRadius: '12px' }}
                >
                  {origemOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={3} justifyContent="flex-end">
              <Button
                onClick={handleApplyFilters}
                variant="contained"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 3,
                  fontWeight: 700,
                  boxShadow: '0 10px 15px -3px rgba(99,102,241,0.25)',
                }}
              >
                Filtrar
              </Button>
              <Button
                onClick={handleClearFilters}
                variant="outlined"
                disabled={loading || !filtersActive}
                sx={{
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 3,
                  fontWeight: 700,
                  borderColor: '#cbd5e1',
                  color: '#0f172a',
                  '&:hover': { backgroundColor: '#f8fafc', borderColor: '#94a3b8' },
                }}
              >
                Limpar filtros
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {loadingStats && (
              <Box mb={2}>
                <LinearProgress />
              </Box>
            )}
            <Grid container spacing={2}>
              {statsCards.map((card) => (
                <Grid key={card.title} item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: '14px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {card.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} mb={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Resultados
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Mostrando {range.start || 0}-{range.end || 0} de {pagination.total.toLocaleString('pt-BR')}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                Ordenação: {order === 'desc' ? 'Mais recentes' : 'Mais antigos'}
              </Typography>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Ticker</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Valor</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>
                      <TableSortLabel
                        active
                        direction={order === 'desc' ? 'desc' : 'asc'}
                        onClick={toggleOrder}
                      >
                        Data COM
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Data Pagamento</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Origem</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Descrição</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <LinearProgress />
                      </TableCell>
                    </TableRow>
                  ) : proventos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: '#64748b' }}>
                        Nenhum provento encontrado com os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    proventos.map((provento) => (
                      <TableRow key={provento.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{provento.ticker}</TableCell>
                        <TableCell>
                          <Chip
                            label={provento.tipo}
                            color={badgeTipoColor[provento.tipo] || 'default'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {formatCurrency(provento.valor)}
                        </TableCell>
                        <TableCell sx={{ color: '#334155' }}>
                          {formatDate(provento.dataCom || provento.dataObj)}
                        </TableCell>
                        <TableCell sx={{ color: '#334155' }}>{formatDate(provento.dataPagamento)}</TableCell>
                        <TableCell>
                          <Chip
                            label={provento.origem || '—'}
                            color={badgeOrigemColor[provento.origem || ''] || 'default'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#475569', maxWidth: 280 }}>
                          {provento.observacoes || '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 3 }} />

            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" spacing={2}>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                Mostrando {range.start || 0}-{range.end || 0} de {pagination.total.toLocaleString('pt-BR')}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  variant="outlined"
                  onClick={() => goToPage(Math.max(pagination.page - 1, 1))}
                  disabled={pagination.page <= 1 || loading}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '12px',
                    fontWeight: 700,
                    borderColor: '#cbd5e1',
                    color: '#0f172a',
                    '&:hover': { backgroundColor: '#f8fafc', borderColor: '#94a3b8' },
                  }}
                >
                  Anterior
                </Button>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Página {pagination.page} de {Math.max(pagination.totalPages, 1)}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '12px',
                    fontWeight: 700,
                    borderColor: '#cbd5e1',
                    color: '#0f172a',
                    '&:hover': { backgroundColor: '#f8fafc', borderColor: '#94a3b8' },
                  }}
                >
                  Próximo
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
