/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use client';

import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Avatar,
  Divider,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Badge
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  Calendar,
  CurrencyDollar,
  TrendUp,
  Clock,
  CheckCircle,
  Info,
  Target,
  Percent
} from '@phosphor-icons/react/dist/ssr';
import { isTickerFII } from '@/utils/tickers';

// 📅 INTERFACES PARA DIVIDENDOS
interface DividendoAgendado {
  id: string;
  ticker: string;
  nome: string;
  setor: string;
  tipo: 'DIVIDENDO' | 'JCP' | 'RENDIMENTO';
  
  // Datas importantes
  dataComEx: string;
  dataPagamento: string;
  dataAprovacao?: string;
  
  // Valores
  valorPorCota: number;
  valorTotalEstimado: number;
  dyEstimado: number;
  
  // Status
  status: 'PREVISTO' | 'CONFIRMADO' | 'PAGO' | 'EM_ANALISE';
  confiabilidade: 'ALTA' | 'MEDIA' | 'BAIXA';
  
  // Histórico
  ultimoPagamento?: number;
  mediaUltimosTres?: number;
  frequenciaPagamento: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'IRREGULAR';
}

interface ResumoMensal {
  mes: string;
  mesLabel: string;
  totalDividendos: number;
  quantidadePagamentos: number;
  dyMedioMes: number;
  statusDistribuicao: {
    confirmados: number;
    previstos: number;
    pagos: number;
  };
}

// 📊 DADOS SIMULADOS DE AGENDA
function gerarAgendaDividendos(carteira: any): DividendoAgendado[] {
  const agenda: DividendoAgendado[] = [];
  const hoje = new Date();
  
  carteira.ativos.forEach((ativo: any, index: number) => {
    const isFII = isTickerFII(ativo.ticker);
    const valorEstimadoPorCota = isFII ? 
      parseFloat(ativo.dy.replace('%', '')) * (ativo.valorInvestidoSimulado / 12 / 100) :
      parseFloat(ativo.dy.replace('%', '')) * (ativo.valorInvestidoSimulado / 100);
    
    // Gerar próximos pagamentos
    for (let i = 1; i <= (isFII ? 6 : 2); i++) {
      const dataComEx = new Date(hoje);
      const dataPagamento = new Date(hoje);
      
      if (isFII) {
        // FIIs: pagamento mensal, com ex no dia 15
        dataComEx.setMonth(dataComEx.getMonth() + i);
        dataComEx.setDate(15);
        dataPagamento.setMonth(dataPagamento.getMonth() + i);
        dataPagamento.setDate(15);
        dataPagamento.setDate(dataPagamento.getDate() + 30); // Paga 30 dias após ex
      } else {
        // Ações: pagamento semestral/anual
        dataComEx.setMonth(dataComEx.getMonth() + (i * 6));
        dataPagamento.setMonth(dataPagamento.getMonth() + (i * 6));
        dataPagamento.setDate(dataPagamento.getDate() + 45); // Paga 45 dias após ex
      }
      
      const status = i === 1 ? 'CONFIRMADO' : i === 2 ? 'PREVISTO' : 'EM_ANALISE';
      const confiabilidade = isFII ? 'ALTA' : i === 1 ? 'MEDIA' : 'BAIXA';
      
      agenda.push({
        id: `${ativo.ticker}-${i}`,
        ticker: ativo.ticker,
        nome: ativo.ticker,
        setor: ativo.setor,
        tipo: isFII ? 'RENDIMENTO' : 'DIVIDENDO',
        dataComEx: dataComEx.toISOString().split('T')[0],
        dataPagamento: dataPagamento.toISOString().split('T')[0],
        valorPorCota: valorEstimadoPorCota,
        valorTotalEstimado: valorEstimadoPorCota * (ativo.valorInvestidoSimulado / parseFloat(ativo.precoAtual.replace('R$ ', '').replace(',', '.'))),
        dyEstimado: parseFloat(ativo.dy.replace('%', '')) / (isFII ? 12 : 1),
        status,
        confiabilidade,
        ultimoPagamento: valorEstimadoPorCota * 0.9,
        mediaUltimosTres: valorEstimadoPorCota * 0.95,
        frequenciaPagamento: isFII ? 'MENSAL' : 'SEMESTRAL'
      });
    }
  });
  
  return agenda.sort((a, b) => new Date(a.dataComEx).getTime() - new Date(b.dataComEx).getTime());
}

// 📊 FUNÇÃO PARA GERAR RESUMO MENSAL
function gerarResumoMensal(agenda: DividendoAgendado[]): ResumoMensal[] {
  const resumoPorMes = agenda.reduce((acc, dividendo) => {
    const dataPagamento = new Date(dividendo.dataPagamento);
    const mesChave = dataPagamento.toISOString().slice(0, 7);
    const mesLabel = dataPagamento.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    if (!acc[mesChave]) {
      acc[mesChave] = {
        mes: mesChave,
        mesLabel,
        totalDividendos: 0,
        quantidadePagamentos: 0,
        dyMedioMes: 0,
        statusDistribuicao: { confirmados: 0, previstos: 0, pagos: 0 }
      };
    }
    
    acc[mesChave].totalDividendos += dividendo.valorTotalEstimado;
    acc[mesChave].quantidadePagamentos += 1;
    acc[mesChave].dyMedioMes += dividendo.dyEstimado;
    acc[mesChave].statusDistribuicao[
      dividendo.status === 'CONFIRMADO' ? 'confirmados' :
      dividendo.status === 'PAGO' ? 'pagos' : 'previstos'
    ] += 1;
    
    return acc;
  }, {} as Record<string, ResumoMensal>);
  
  return Object.values(resumoPorMes).map(resumo => ({
    ...resumo,
    dyMedioMes: resumo.dyMedioMes / resumo.quantidadePagamentos
  }));
}

// 🎨 COMPONENTE DE CARD DE DIVIDENDO
interface DividendoCardProps {
  dividendo: DividendoAgendado;
}

function DividendoCard({ dividendo }: DividendoCardProps) {
  const dataComEx = new Date(dividendo.dataComEx);
  const dataPagamento = new Date(dividendo.dataPagamento);
  const hoje = new Date();
  
  const diasParaComEx = Math.ceil((dataComEx.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  const diasParaPagamento = Math.ceil((dataPagamento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMADO': return '#10b981';
      case 'PREVISTO': return '#f59e0b';
      case 'PAGO': return '#3b82f6';
      default: return '#64748b';
    }
  };
  
  const getConfiabilidadeColor = (conf: string) => {
    switch (conf) {
      case 'ALTA': return '#10b981';
      case 'MEDIA': return '#f59e0b';
      default: return '#ef4444';
    }
  };
  
  return (
    <Card sx={{
      border: '1px solid #e2e8f0',
      borderRadius: 2,
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: 3,
        transform: 'translateY(-2px)',
        borderColor: getStatusColor(dividendo.status)
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{
                width: 40,
                height: 40,
                backgroundColor: `${getStatusColor(dividendo.status)}20`,
                color: getStatusColor(dividendo.status)
              }}>
                {dividendo.ticker.slice(0, 2)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {dividendo.ticker}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dividendo.setor}
                </Typography>
              </Box>
            </Stack>
            
            <Stack spacing={1} alignItems="flex-end">
              <Chip
                label={dividendo.status}
                size="small"
                sx={{
                  backgroundColor: `${getStatusColor(dividendo.status)}20`,
                  color: getStatusColor(dividendo.status),
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
              <Chip
                label={dividendo.confiabilidade}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: getConfiabilidadeColor(dividendo.confiabilidade),
                  color: getConfiabilidadeColor(dividendo.confiabilidade),
                  fontSize: '0.65rem'
                }}
              />
            </Stack>
          </Stack>
          
          {/* Valores */}
          <Box sx={{
            p: 2,
            backgroundColor: '#f8fafc',
            borderRadius: 2,
            border: '1px solid #e2e8f0'
          }}>
            <Grid container spacing={2}>
              <Grid xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Valor Total Estimado:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>
                  R$ {dividendo.valorTotalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="caption" color="text.secondary">
                  DY do Período:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                  {dividendo.dyEstimado.toFixed(2)}%
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          {/* Datas */}
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Calendar size={16} color="#64748b" />
                <Typography variant="body2" color="text.secondary">
                  Data Com Ex:
                </Typography>
              </Stack>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {dataComEx.toLocaleDateString('pt-BR')}
                </Typography>
              </Box>
            </Stack>
            
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <CurrencyDollar size={16} color="#64748b" />
                <Typography variant="body2" color="text.secondary">
                  Pagamento:
                </Typography>
              </Stack>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {dataPagamento.toLocaleDateString('pt-BR')}
                </Typography>
                <Typography variant="caption" color={diasParaPagamento > 0 ? 'success.main' : 'error.main'}>
                  {diasParaPagamento > 0 ? `Em ${diasParaPagamento} dias` : 'Atrasado'}
                </Typography>
              </Box>
            </Stack>
          </Stack>
          
          {/* Histórico */}
          {dividendo.ultimoPagamento && (
            <Box sx={{
              p: 2,
              backgroundColor: '#fffbeb',
              borderRadius: 2,
              border: '1px solid #fde68a'
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                📊 Histórico:
              </Typography>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Último: R$ {dividendo.ultimoPagamento.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Média 3m: R$ {dividendo.mediaUltimosTres?.toFixed(2)}
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

// 📅 COMPONENTE PRINCIPAL DA AGENDA
interface AgendaDividendosProps {
  carteira: any;
}

export function AgendaDividendos({ carteira }: AgendaDividendosProps) {
  const [filtroStatus, setFiltroStatus] = React.useState<string>('TODOS');
  const [filtroTipo, setFiltroTipo] = React.useState<string>('TODOS');
  const [abaSelecionada, setAbaSelecionada] = React.useState(0);
  
  const agendaCompleta = React.useMemo(() => 
    gerarAgendaDividendos(carteira), [carteira]
  );
  
  const resumoMensal = React.useMemo(() => 
    gerarResumoMensal(agendaCompleta), [agendaCompleta]
  );
  
  const agendaFiltrada = React.useMemo(() => {
    return agendaCompleta.filter(dividendo => {
      const statusMatch = filtroStatus === 'TODOS' || dividendo.status === filtroStatus;
      const tipoMatch = filtroTipo === 'TODOS' || dividendo.tipo === filtroTipo;
      return statusMatch && tipoMatch;
    });
  }, [agendaCompleta, filtroStatus, filtroTipo]);
  
  const proximosDividendos = agendaFiltrada.slice(0, 5);
  const dividendosProximoMes = agendaFiltrada.filter(d => {
    const dataPagamento = new Date(d.dataPagamento);
    const proximoMes = new Date();
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    return dataPagamento <= proximoMes;
  });
  
  const totalProximoMes = dividendosProximoMes.reduce((sum, d) => sum + d.valorTotalEstimado, 0);
  const confirmadosProximoMes = dividendosProximoMes.filter(d => d.status === 'CONFIRMADO').length;
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Header com Resumo */}
        <Grid xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    📅 Agenda de Dividendos - {carteira.nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Próximos pagamentos e cronograma de recebimentos
                  </Typography>
                </Box>
                
                <Grid container spacing={2} sx={{ maxWidth: 400 }}>
                  <Grid xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f0fdf4', borderRadius: 2 }}>
                      <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                        R$ {totalProximoMes.toLocaleString('pt-BR')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Próximo Mês
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#eff6ff', borderRadius: 2 }}>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                        {dividendosProximoMes.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pagamentos
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fefbef', borderRadius: 2 }}>
                      <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700 }}>
                        {confirmadosProximoMes}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Confirmados
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Alertas */}
        <Grid xs={12}>
          <Stack spacing={2} sx={{ mb: 3 }}>
            {dividendosProximoMes.filter(d => d.status === 'CONFIRMADO').length > 0 && (
              <Alert severity="success" icon={<CheckCircle />}>
                <Typography variant="body2">
                  <strong>{confirmadosProximoMes} dividendos confirmados</strong> para o próximo mês: 
                  R$ {dividendosProximoMes.filter(d => d.status === 'CONFIRMADO').reduce((sum, d) => sum + d.valorTotalEstimado, 0).toLocaleString('pt-BR')}
                </Typography>
              </Alert>
            )}
            
            <Alert severity="info" icon={<Info />}>
              <Typography variant="body2">
                💡 <strong>Dica:</strong> As datas e valores são estimativas baseadas no histórico. 
                Acompanhe os sites das empresas para confirmações oficiais.
              </Typography>
            </Alert>
          </Stack>
        </Grid>
        
        {/* Filtros */}
        <Grid xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Filtros:
                  </Typography>
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filtroStatus}
                      label="Status"
                      onChange={(e) => setFiltroStatus(e.target.value)}
                    >
                      <MenuItem value="TODOS">Todos</MenuItem>
                      <MenuItem value="CONFIRMADO">Confirmados</MenuItem>
                      <MenuItem value="PREVISTO">Previstos</MenuItem>
                      <MenuItem value="EM_ANALISE">Em Análise</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={filtroTipo}
                      label="Tipo"
                      onChange={(e) => setFiltroTipo(e.target.value)}
                    >
                      <MenuItem value="TODOS">Todos</MenuItem>
                      <MenuItem value="DIVIDENDO">Dividendos</MenuItem>
                      <MenuItem value="JCP">JCP</MenuItem>
                      <MenuItem value="RENDIMENTO">Rendimentos</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ flex: 1 }} />
                
                <Typography variant="body2" color="text.secondary">
                  {agendaFiltrada.length} pagamentos encontrados
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Tabs */}
        <Grid xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={abaSelecionada} onChange={(_, newValue) => setAbaSelecionada(newValue)}>
              <Tab 
                label={
                  <Badge badgeContent={proximosDividendos.length} color="primary">
                    Próximos Pagamentos
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={resumoMensal.length} color="secondary">
                    Cronograma Mensal
                  </Badge>
                } 
              />
              <Tab label="Todos os Dividendos" />
            </Tabs>
          </Box>
        </Grid>
        
        {/* Conteúdo das Tabs */}
        {abaSelecionada === 0 && (
          <Grid xs={12}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              🚀 Próximos 5 Pagamentos
            </Typography>
            <Grid container spacing={3}>
              {proximosDividendos.map((dividendo) => (
                <Grid key={dividendo.id} xs={12} md={6} lg={4}>
                  <DividendoCard dividendo={dividendo} />
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}
        
        {abaSelecionada === 1 && (
          <Grid xs={12}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              📊 Resumo Mensal
            </Typography>
            <Grid container spacing={3}>
              {resumoMensal.slice(0, 6).map((resumo) => (
                <Grid key={resumo.mes} xs={12} sm={6} md={4}>
                  <Card>
                    <CardContent>
                      <Stack spacing={2}>
                        <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center' }}>
                          {resumo.mesLabel}
                        </Typography>
                        
                        <Box sx={{
                          p: 3,
                          backgroundColor: '#f0fdf4',
                          borderRadius: 2,
                          textAlign: 'center'
                        }}>
                          <Typography variant="h4" color="success.main" sx={{ fontWeight: 800 }}>
                            R$ {resumo.totalDividendos.toLocaleString('pt-BR')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total do Mês
                          </Typography>
                        </Box>
                        
                        <Divider />
                        
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">Pagamentos:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {resumo.quantidadePagamentos}
                            </Typography>
                          </Stack>
                          
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">DY Médio:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {resumo.dyMedioMes.toFixed(2)}%
                            </Typography>
                          </Stack>
                          
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">Confirmados:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {resumo.statusDistribuicao.confirmados}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}
        
        {abaSelecionada === 2 && (
          <Grid xs={12}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              📋 Todos os Dividendos ({agendaFiltrada.length})
            </Typography>
            <Grid container spacing={2}>
              {agendaFiltrada.map((dividendo) => (
                <Grid key={dividendo.id} xs={12} md={6} lg={4}>
                  <DividendoCard dividendo={dividendo} />
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}
        
        {/* Dicas Educacionais */}
        <Grid xs={12}>
          <Card sx={{ backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9', mt: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#0c4a6e' }}>
                💡 Dicas sobre Dividendos
              </Typography>
              
              <Grid container spacing={3}>
                <Grid xs={12} md={6}>
                  <Stack spacing={2}>
                    <Typography variant="body2">
                      <strong>📅 Data Com Ex:</strong> Último dia para comprar e ter direito ao dividendo
                    </Typography>
                    <Typography variant="body2">
                      <strong>💰 Data de Pagamento:</strong> Quando o dinheiro cai na sua conta
                    </Typography>
                    <Typography variant="body2">
                      <strong>🎯 Status Confirmado:</strong> Empresa já anunciou oficialmente
                    </Typography>
                  </Stack>
                </Grid>
                <Grid xs={12} md={6}>
                  <Stack spacing={2}>
                    <Typography variant="body2">
                      <strong>📊 DY do Período:</strong> Yield específico daquele pagamento
                    </Typography>
                    <Typography variant="body2">
                      <strong>🔮 Previsões:</strong> Baseadas no histórico, podem variar
                    </Typography>
                    <Typography variant="body2">
                      <strong>⚠️ Importante:</strong> Sempre confirme nos sites oficiais das empresas
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
