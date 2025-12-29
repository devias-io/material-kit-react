'use client';

import { useState } from 'react';
import {
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Paper,
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
    <Box sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Sincronização de Proventos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sincronize proventos da API BRAPI automaticamente
          </Typography>
        </Box>

        {estatisticas && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total Sincronizações
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {estatisticas.totalSincronizacoes}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Proventos Novos
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {estatisticas.totalProventosNovos.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Proventos Atualizados
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    {estatisticas.totalProventosAtualizados.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total Erros
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {estatisticas.totalErros}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Card elevation={1}>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Sincronizar Agora
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inicie uma sincronização completa ou selecione tickers específicos.
                </Typography>
              </Box>

              <Stack spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleSincronizarTudo}
                  disabled={sincronizando || isEmProgresso}
                  size="large"
                >
                  {sincronizando ? 'Iniciando...' : 'Sincronizar Todos os Tickers'}
                </Button>

                <Divider>ou</Divider>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                  <TextField
                    label="Tickers (separados por vírgula)"
                    fullWidth
                    value={tickersCustom}
                    onChange={(e) => setTickersCustom(e.target.value)}
                    placeholder="PETR4, VALE3, ITUB4"
                    disabled={sincronizando || isEmProgresso}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleSincronizarCustom}
                    disabled={sincronizando || isEmProgresso || !tickersCustom.trim()}
                  >
                    Sincronizar Selecionados
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

                {erroSincronizar && (
                  <Alert severity="error">{erroSincronizar}</Alert>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {status && isEmProgresso && (
          <Card elevation={1}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                  Sincronização em Andamento
                </Typography>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Progresso
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {status.porcentagem}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={status.porcentagem}
                    sx={{ mt: 1.5, borderRadius: 1 }}
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
                    <Card elevation={0} variant="outlined">
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">
                          Novos
                        </Typography>
                        <Typography variant="h6" color="success.main" fontWeight={700}>
                          {status.metricas?.totalNovos || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card elevation={0} variant="outlined">
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">
                          Atualizados
                        </Typography>
                        <Typography variant="h6" color="primary.main" fontWeight={700}>
                          {status.metricas?.totalAtualizados || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card elevation={0} variant="outlined">
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">
                          Erros
                        </Typography>
                        <Typography variant="h6" color="error.main" fontWeight={700}>
                          {status.metricas?.totalErros || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        )}

        <Card elevation={1}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>
                Histórico de Sincronizações
              </Typography>
              <Button variant="text" onClick={refetch} size="small">
                Atualizar
              </Button>
            </Stack>

            {loadingHistorico ? (
              <Typography color="text.secondary">Carregando histórico...</Typography>
            ) : historico.length === 0 ? (
              <Typography color="text.secondary">Nenhuma sincronização encontrada</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
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
                        <TableCell>#{sync.id}</TableCell>
                        <TableCell>{sync.ticker.length > 30 ? `${sync.ticker.substring(0, 30)}...` : sync.ticker}</TableCell>
                        <TableCell>
                          <Chip
                            label={sync.status}
                            color={statusChipColor[sync.status] || 'default'}
                            size="small"
                          />
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
