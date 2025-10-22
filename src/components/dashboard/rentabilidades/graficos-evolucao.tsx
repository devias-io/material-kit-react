/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use client';

import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  ButtonGroup,
  Button
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts';
import { TrendUp, Calendar, ChartLine, CurrencyDollar } from '@phosphor-icons/react/dist/ssr';

// 🎯 INTERFACE PARA DADOS DE EVOLUÇÃO
interface DadosEvolucao {
  mes: string;
  mesLabel: string;
  valorCarteira: number;
  dividendosAcumulados: number;
  valorTotal: number;
  rentabilidade: number;
  benchmark: number;
}

interface DadosDividendosMensais {
  mes: string;
  mesLabel: string;
  dividendos: number;
  quantidade: number;
  dyMedio: number;
}

interface DadosSetoriais {
  setor: string;
  valor: number;
  percentual: number;
  cor: string;
  quantidade: number;
}

// 🎨 CORES PARA GRÁFICOS
const CORES_GRAFICOS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6'
};

const CORES_SETORES = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
];

// 🧮 FUNÇÃO PARA GERAR DADOS DE EVOLUÇÃO
function gerarDadosEvolucao(carteira: any, meses: number = 24): DadosEvolucao[] {
  const dados: DadosEvolucao[] = [];
  const hoje = new Date();
  
  for (let i = meses; i >= 0; i--) {
    const data = new Date(hoje);
    data.setMonth(data.getMonth() - i);
    
    const mesLabel = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    const progresso = (meses - i) / meses;
    
    // Simular evolução gradual baseada na performance final
    const valorCarteira = carteira.valorInicialTotal + 
      (carteira.valorAtualTotal - carteira.valorInicialTotal) * progresso;
    
    const dividendosAcumulados = carteira.dividendosTotais * progresso;
    const valorTotal = valorCarteira + dividendosAcumulados;
    
    const rentabilidade = ((valorTotal - carteira.valorInicialTotal) / carteira.valorInicialTotal) * 100;
    
    // Benchmark simulado (mais conservador)
    const benchmark = progresso * 15; // 15% de rentabilidade de referência
    
    dados.push({
      mes: data.toISOString().slice(0, 7),
      mesLabel,
      valorCarteira: Math.round(valorCarteira),
      dividendosAcumulados: Math.round(dividendosAcumulados),
      valorTotal: Math.round(valorTotal),
      rentabilidade: Number(rentabilidade.toFixed(1)),
      benchmark: Number(benchmark.toFixed(1))
    });
  }
  
  return dados;
}

// 💰 FUNÇÃO PARA GERAR DIVIDENDOS MENSAIS
function gerarDividendosMensais(carteira: any, meses: number = 12): DadosDividendosMensais[] {
  const dados: DadosDividendosMensais[] = [];
  const hoje = new Date();
  const isFII = carteira.id === 'fiis';
  
  for (let i = meses; i >= 1; i--) {
    const data = new Date(hoje);
    data.setMonth(data.getMonth() - i);
    
    const mesLabel = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    // Simular dividendos mensais
    let dividendos = 0;
    let quantidade = 0;
    
    if (isFII) {
      // FIIs pagam mensalmente
      dividendos = (carteira.dividendosTotais / 12) * (0.8 + Math.random() * 0.4);
      quantidade = Math.floor(carteira.quantidadeAtivos * (0.7 + Math.random() * 0.3));
    } else {
      // Small Caps pagam esporadicamente
      if (Math.random() > 0.7) { // 30% chance de pagamento
        dividendos = (carteira.dividendosTotais / 4) * (0.5 + Math.random() * 1.0);
        quantidade = Math.floor(carteira.quantidadeAtivos * (0.1 + Math.random() * 0.2));
      }
    }
    
    const dyMedio = dividendos > 0 ? (dividendos / carteira.valorInicialTotal * 12) * 100 : 0;
    
    dados.push({
      mes: data.toISOString().slice(0, 7),
      mesLabel,
      dividendos: Math.round(dividendos),
      quantidade,
      dyMedio: Number(dyMedio.toFixed(1))
    });
  }
  
  return dados;
}

// 🥧 FUNÇÃO PARA GERAR DADOS SETORIAIS
function gerarDadosSetoriais(carteira: any): DadosSetoriais[] {
  const setores = carteira.ativos.reduce((acc: any, ativo: any) => {
    if (!acc[ativo.setor]) {
      acc[ativo.setor] = {
        valor: 0,
        quantidade: 0
      };
    }
    acc[ativo.setor].valor += ativo.valorAtualSimulado;
    acc[ativo.setor].quantidade += 1;
    return acc;
  }, {});
  
  return Object.entries(setores).map(([setor, dados]: [string, any], index) => ({
    setor,
    valor: Math.round(dados.valor),
    percentual: Number(((dados.valor / carteira.valorAtualTotal) * 100).toFixed(1)),
    cor: CORES_SETORES[index % CORES_SETORES.length],
    quantidade: dados.quantidade
  })).sort((a, b) => b.valor - a.valor);
}

// 📊 COMPONENTE DE TOOLTIP CUSTOMIZADO
const TooltipCustomizado = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 2,
        p: 2,
        boxShadow: 2
      }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          {label}
        </Typography>
        {payload.map((entry: any, index: number) => {
          const label = typeof entry.name === 'string'
            ? entry.name
            : String(entry.name ?? entry.dataKey ?? '');

          const dataKey = typeof entry.dataKey === 'string'
            ? entry.dataKey.toLowerCase()
            : '';

          const isPercentual = ['percent', 'rentab', 'benchmark']
            .some((token) => dataKey.includes(token));

          const valorNumerico = typeof entry.value === 'number'
            ? entry.value
            : Number(entry.value);

          const valorFormatado = Number.isFinite(valorNumerico)
            ? isPercentual
              ? `${valorNumerico.toFixed(2)}%`
              : `R$ ${valorNumerico.toLocaleString('pt-BR')}`
            : entry.value;

          return (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color, fontSize: '0.875rem' }}
            >
              {label}: {valorFormatado}
            </Typography>
          );
        })}
      </Box>
    );
  }
  return null;
};

// 📈 COMPONENTE PRINCIPAL DOS GRÁFICOS
interface GraficosEvolucaoProps {
  carteira: any;
}

export function GraficosEvolucao({ carteira }: GraficosEvolucaoProps) {
  const [periodoGrafico, setPeriodoGrafico] = React.useState<'6M' | '1Y' | '2Y'>('1Y');
  const [tipoVisualizacao, setTipoVisualizacao] = React.useState<'absoluto' | 'percentual'>('absoluto');
  
  const mesesParaExibir = periodoGrafico === '6M' ? 6 : periodoGrafico === '1Y' ? 12 : 24;
  
  const dadosEvolucao = React.useMemo(() => 
    gerarDadosEvolucao(carteira, mesesParaExibir), [carteira, mesesParaExibir]
  );
  
  const dividendosMensais = React.useMemo(() => 
    gerarDividendosMensais(carteira, 12), [carteira]
  );
  
  const dadosSetoriais = React.useMemo(() => 
    gerarDadosSetoriais(carteira), [carteira]
  );
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Header dos Gráficos */}
        <Grid xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    📈 Análise Temporal - {carteira.nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Evolução da performance ao longo do tempo
                  </Typography>
                </Box>
                
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Período</InputLabel>
                    <Select
                      value={periodoGrafico}
                      label="Período"
                      onChange={(e) => setPeriodoGrafico(e.target.value as any)}
                    >
                      <MenuItem value="6M">6 Meses</MenuItem>
                      <MenuItem value="1Y">1 Ano</MenuItem>
                      <MenuItem value="2Y">2 Anos</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <ButtonGroup size="small">
                    <Button
                      variant={tipoVisualizacao === 'absoluto' ? 'contained' : 'outlined'}
                      onClick={() => setTipoVisualizacao('absoluto')}
                    >
                      R$
                    </Button>
                    <Button
                      variant={tipoVisualizacao === 'percentual' ? 'contained' : 'outlined'}
                      onClick={() => setTipoVisualizacao('percentual')}
                    >
                      %
                    </Button>
                  </ButtonGroup>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Gráfico Principal - Evolução Patrimonial */}
        <Grid xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                💰 Evolução do Patrimônio
              </Typography>
              
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {tipoVisualizacao === 'absoluto' ? (
                    <AreaChart data={dadosEvolucao}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="mesLabel" 
                        tick={{ fontSize: 12 }}
                        stroke="#64748b"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#64748b"
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<TooltipCustomizado />} />
                      <Legend />
                      
                      <Area
                        type="monotone"
                        dataKey="valorCarteira"
                        stackId="1"
                        stroke={CORES_GRAFICOS.primary}
                        fill={CORES_GRAFICOS.primary}
                        fillOpacity={0.6}
                        name="Valor da Carteira"
                      />
                      <Area
                        type="monotone"
                        dataKey="dividendosAcumulados"
                        stackId="1"
                        stroke={CORES_GRAFICOS.success}
                        fill={CORES_GRAFICOS.success}
                        fillOpacity={0.8}
                        name="Dividendos Acumulados"
                      />
                    </AreaChart>
                  ) : (
                    <LineChart data={dadosEvolucao}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="mesLabel" 
                        tick={{ fontSize: 12 }}
                        stroke="#64748b"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#64748b"
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip content={<TooltipCustomizado />} />
                      <Legend />
                      
                      <Line
                        type="monotone"
                        dataKey="rentabilidade"
                        stroke={CORES_GRAFICOS.primary}
                        strokeWidth={3}
                        dot={{ fill: CORES_GRAFICOS.primary, strokeWidth: 2, r: 4 }}
                        name="Minha Carteira"
                      />
                      <Line
                        type="monotone"
                        dataKey="benchmark"
                        stroke={CORES_GRAFICOS.warning}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: CORES_GRAFICOS.warning, strokeWidth: 2, r: 3 }}
                        name="Benchmark"
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Gráfico de Pizza - Diversificação */}
        <Grid xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                🥧 Diversificação por Setor
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosSetoriais}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                      label={({ setor, percentual }) => `${setor}: ${percentual}%`}
                      labelLine={false}
                    >
                      {dadosSetoriais.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipCustomizado />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              
              <Stack spacing={1} sx={{ mt: 2 }}>
                {dadosSetoriais.slice(0, 5).map((setor, index) => (
                  <Stack key={setor.setor} direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: setor.cor
                      }}
                    />
                    <Typography variant="body2" sx={{ flex: 1, fontSize: '0.875rem' }}>
                      {setor.setor}
                    </Typography>
                    <Chip
                      label={`${setor.percentual}%`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Gráfico de Barras - Dividendos Mensais */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                💵 Histórico de Dividendos Mensais
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dividendosMensais}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="mesLabel" 
                      tick={{ fontSize: 12 }}
                      stroke="#64748b"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="#64748b"
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip content={<TooltipCustomizado />} />
                    <Legend />
                    
                    <Bar 
                      dataKey="dividendos" 
                      fill={CORES_GRAFICOS.success}
                      name="Dividendos Recebidos"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f0fdf4', borderRadius: 2 }}>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                      R$ {carteira.dividendosTotais.toLocaleString('pt-BR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Recebido
                    </Typography>
                  </Box>
                </Grid>
                <Grid xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#eff6ff', borderRadius: 2 }}>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                      {carteira.dyMedio.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      DY Médio Realizado
                    </Typography>
                  </Box>
                </Grid>
                <Grid xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fefbef', borderRadius: 2 }}>
                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700 }}>
                      R$ {Math.round(carteira.dividendosTotais / 12).toLocaleString('pt-BR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Média Mensal
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
