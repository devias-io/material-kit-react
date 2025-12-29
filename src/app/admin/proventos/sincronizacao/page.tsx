'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  LinearProgress,
  Paper,
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
import {
  useSincronizarProventos,
  useStatusSincronizacao,
  useHistoricoSincronizacao,
} from '@/hooks/useProventosSync';

const statusChipColor: Record<string, 'primary' | 'success' | 'error' | 'default'> = {
  EM_PROGRESSO: 'primary',
  CONCLUIDO: 'success',
  ERRO: 'error',
};

export default function SincronizacaoProventosPage() {
  const [syncId, setSyncId] = useState<number | null>(null);
  const [tickersCustom, setTickersCustom] = useState('');
  const [forcarAtualizacao, setForcarAtualizacao] = useState(false);

  const { sincronizar, loading: sincronizando, error: erroSincronizar } = useSincronizarProventos();
  const { data: status, isEmProgresso } = useStatusSincronizacao(syncId);
  const { historico, loading: loadingHistorico, estatisticas, refetch } = useHistoricoSincronizacao({ limit: 10 });

  const estatisticasCards = useMemo(
    () => (
      estatisticas && [
        {
          title: 'Total Sincronizações',
          value: estatisticas.totalSincronizacoes.toLocaleString('pt-BR'),
          color: '#1e293b',
        },
        {
          title: 'Proventos Novos',
          value: estatisticas.totalProventosNovos.toLocaleString('pt-BR'),
          color: '#16a34a',
        },
        {
          title: 'Proventos Atualizados',
          value: estatisticas.totalProventosAtualizados.toLocaleString('pt-BR'),
          color: '#2563eb',
        },
        {
          title: 'Total Erros',
          value: estatisticas.totalErros.toLocaleString('pt-BR'),
          color: '#dc2626',
        },
      ]
    ),
    [estatisticas]
  );

  const handleSincronizarTudo = async () => {
    try {
      const resultado = await sincronizar({ forcarAtualizacao });
      if (resultado?.syncId) {
        setSyncId(resultado.syncId);
      }
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSincronizarCustom = async () => {
    if (!tickersCustom.trim()) {
      return;
    }

    const tickers = tickersCustom
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0);

    if (tickers.length === 0) {
      return;
    }

    try {
      const resultado = await sincronizar({ tickers, forcarAtualizacao });
      if (resultado?.syncId) {
        setSyncId(resultado.syncId);
      }
      setTickersCustom('');
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

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
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'flex-start' }} spacing={2} mb={3}>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: '#1e293b', mb: 1, fontSize: { xs: '1.75rem', md: '2rem' } }}
                >
                  🔄 Sincronização de Proventos
                </Typography>
                <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400, fontSize: '1rem' }}>
                  Traga proventos da BRAPI com priorização do CSV quando necessário.
                </Typography>
              </Box>
              <Button
                onClick={refetch}
                variant="outlined"
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
                Atualizar histórico
              </Button>
            </Stack>

            {estatisticasCards && (
              <Grid container spacing={2}>
                {estatisticasCards.map((card) => (
                  <Grid key={card.title} item xs={12} sm={6} md={3}>
                    <Box
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
                      <Typography variant="h5" sx={{ fontWeight: 800, color: card.color }}>
                        {card.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                      Iniciar sincronização
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sincronize todos os tickers ou informe uma lista separada por vírgula.
                    </Typography>
                  </Box>

                  <Stack spacing={1.5}>
                    <Button
                      variant="contained"
                      onClick={handleSincronizarTudo}
                      disabled={sincronizando || isEmProgresso}
                      sx={{
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        boxShadow: '0px 10px 15px -3px rgba(59, 130, 246, 0.3)',
                        '&:disabled': { backgroundColor: '#cbd5e1', boxShadow: 'none' },
                      }}
                    >
                      {sincronizando ? 'Iniciando...' : 'Sincronizar todos os tickers'}
                    </Button>

                    <Divider>ou</Divider>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                      <TextField
                        label="Tickers (separados por vírgula)"
                        fullWidth
                        value={tickersCustom}
                        onChange={(e) => setTickersCustom(e.target.value)}
                        placeholder="PETR4, VALE3, ITUB4"
                        disabled={sincronizando || isEmProgresso}
                        size="small"
                      />
                      <Button
                        variant="outlined"
                        onClick={handleSincronizarCustom}
                        disabled={sincronizando || isEmProgresso || !tickersCustom.trim()}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: '10px',
                          height: 40,
                        }}
                      >
                        Sincronizar seleção
                      </Button>
                    </Stack>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={forcarAtualizacao}
                          onChange={(e) => setForcarAtualizacao(e.target.checked)}
                          disabled={sincronizando || isEmProgresso}
                        />
                      }
                      label="Forçar atualização (sobrescrever dados CSV)"
                    />

                    {erroSincronizar && <Alert severity="error">{erroSincronizar}</Alert>}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                {status && isEmProgresso ? (
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      Sincronização em andamento
                    </Typography>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Progresso
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          {status.porcentagem}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={status.porcentagem}
                        sx={{
                          mt: 1.5,
                          height: 10,
                          borderRadius: 2,
                          backgroundColor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': { backgroundColor: '#3b82f6' },
                        }}
                      />
                      {status.progresso !== undefined && status.total !== undefined && (
                        <Typography variant="body2" color="text.secondary" mt={1.5}>
                          Processando {status.progresso} de {status.total} tickers
                        </Typography>
                      )}
                      {status.tickerAtual && (
                        <Typography variant="body2" color="text.secondary">
                          Ticker atual: <strong>{status.tickerAtual}</strong>
                        </Typography>
                      )}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Novos
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#16a34a', fontWeight: 800 }}>
                            {status.metricas?.totalNovos || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Atualizados
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#2563eb', fontWeight: 800 }}>
                            {status.metricas?.totalAtualizados || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Erros
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#dc2626', fontWeight: 800 }}>
                            {status.metricas?.totalErros || 0}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Stack>
                ) : (
                  <Stack spacing={2} alignItems="center" textAlign="center">
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      Aguardando sincronização
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Inicie uma sincronização para acompanhar o progresso e métricas em tempo real.
                    </Typography>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card
          sx={{
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5} mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Histórico de sincronizações
              </Typography>
              <Button
                variant="text"
                onClick={refetch}
                size="small"
                sx={{ textTransform: 'none', fontWeight: 700, color: '#2563eb' }}
              >
                Atualizar
              </Button>
            </Stack>

            {loadingHistorico ? (
              <Typography color="text.secondary">Carregando histórico...</Typography>
            ) : historico.length === 0 ? (
              <Typography color="text.secondary">Nenhuma sincronização encontrada</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Ticker(s)</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Duração</TableCell>
                      <TableCell align="right">Novos</TableCell>
                      <TableCell align="right">Atualizados</TableCell>
                      <TableCell align="right">Erros</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historico.map((sync) => (
                      <TableRow key={sync.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>#{sync.id}</TableCell>
                        <TableCell>{sync.ticker.length > 30 ? `${sync.ticker.substring(0, 30)}...` : sync.ticker}</TableCell>
                        <TableCell>
                          <Chip label={sync.status} color={statusChipColor[sync.status] || 'default'} size="small" />
                        </TableCell>
                        <TableCell>{new Date(sync.dataInicio).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{sync.duracao || '-'}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 700 }}>
                          {sync.metricas.totalNovos}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 700 }}>
                          {sync.metricas.totalAtualizados}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: 700 }}>
                          {sync.metricas.totalErros}
                        </TableCell>
                        <TableCell>
                          {sync.temErros && (
                            <Button
                              variant="text"
                              color="error"
                              size="small"
                              onClick={() => alert(JSON.stringify(sync.erros, null, 2))}
                              sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                              Ver erros
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
