/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use client';

import * as React from 'react';
import { GraficosEvolucao } from './graficos-evolucao';
import { AgendaDividendos } from './agenda-dividendos';
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
  Alert,
  Button,
  Divider,
  Avatar
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  CurrencyDollar,
  TrendUp,
  TrendDown,
  ChartLine,
  Buildings,
  Target,
  Percent,
  Calendar,
  Trophy,
  Calculator
} from '@phosphor-icons/react/dist/ssr';
import { isTickerFII } from '@/utils/tickers';

// 🏗️ SEUS DADOS REAIS INTEGRADOS
interface AtivoEducacional {
  id: string;
  ticker: string;
  setor: string;
  dataEntrada: string;
  precoEntrada: string;
  precoAtual: string;
  dy: string;
  precoTeto: string;
  vies: string;
  
  // Calculados automaticamente
  valorInvestidoSimulado: number;
  valorAtualSimulado: number;
  rentabilidadeCapital: number;
  dividendosRecebidosSimulados: number;
  rentabilidadeTotal: number;
  tempoInvestido: number;
  dyRealizado: number;
}

interface CarteiraEducacional {
  id: string;
  nome: string;
  descricao: string;
  icone: React.ReactNode;
  cor: string;
  ativos: AtivoEducacional[];
  
  // Totais da carteira
  valorInicialTotal: number;
  valorAtualTotal: number;
  dividendosTotais: number;
  rentabilidadeTotal: number;
  dyMedio: number;
  
  // Performance
  melhorAtivo: string;
  piorAtivo: string;
  ativoMaiorDividendo: string;
  
  // Métricas educacionais
  quantidadeAtivos: number;
  setorMaisPresentente: string;
  recomendacao: 'Forte' | 'Moderada' | 'Cuidado';
}

// 🎯 SEUS DADOS REAIS DOS FIIs
const dadosFIIsReais = [
  { id: "1", ticker: "MALL11", setor: "Shopping", dataEntrada: "26/01/2022", precoEntrada: "R$ 118,37", precoAtual: "R$ 103,53", dy: "8.40%", precoTeto: "R$ 103,68", vies: "Compra" },
  { id: "2", ticker: "KNSC11", setor: "Papel", dataEntrada: "24/05/2022", precoEntrada: "R$ 9,31", precoAtual: "R$ 8,87", dy: "10.98%", precoTeto: "R$ 9,16", vies: "Compra" },
  { id: "3", ticker: "KNHF11", setor: "Hedge Fund", dataEntrada: "20/12/2024", precoEntrada: "R$ 76,31", precoAtual: "R$ 91,05", dy: "15.00%", precoTeto: "R$ 90,50", vies: "Compra" },
  { id: "4", ticker: "HGBS11", setor: "Shopping", dataEntrada: "02/01/2025", precoEntrada: "R$ 186,08", precoAtual: "R$ 199,60", dy: "10.50%", precoTeto: "R$ 192,00", vies: "Compra" },
  { id: "5", ticker: "RURA11", setor: "Fiagro", dataEntrada: "14/02/2023", precoEntrada: "R$ 10,25", precoAtual: "R$ 8,47", dy: "13.21%", precoTeto: "R$ 8,70", vies: "Compra" },
  { id: "6", ticker: "BCIA11", setor: "FoF", dataEntrada: "12/04/2023", precoEntrada: "R$ 82,28", precoAtual: "R$ 85,75", dy: "9.77%", precoTeto: "R$ 86,00", vies: "Compra" },
  { id: "7", ticker: "BPFF11", setor: "FoF", dataEntrada: "08/01/2024", precoEntrada: "R$ 72,12", precoAtual: "R$ 60,40", dy: "11.00%", precoTeto: "R$ 66,34", vies: "Compra" },
  { id: "8", ticker: "HGFF11", setor: "FoF", dataEntrada: "03/04/2023", precoEntrada: "R$ 69,15", precoAtual: "R$ 71,40", dy: "9.25%", precoTeto: "R$ 73,59", vies: "Compra" },
  { id: "9", ticker: "BRCO11", setor: "Logística", dataEntrada: "09/05/2022", precoEntrada: "R$ 99,25", precoAtual: "R$ 108,66", dy: "8.44%", precoTeto: "R$ 109,89", vies: "Compra" },
  { id: "10", ticker: "XPML11", setor: "Shopping", dataEntrada: "16/02/2022", precoEntrada: "R$ 93,32", precoAtual: "R$ 104,80", dy: "8.44%", precoTeto: "R$ 136,00", vies: "Compra" },
  { id: "11", ticker: "HGLG11", setor: "Logística", dataEntrada: "20/06/2022", precoEntrada: "R$ 161,80", precoAtual: "R$ 159,72", dy: "8.44%", precoTeto: "R$ 148,67", vies: "Compra" },
  { id: "12", ticker: "HSML11", setor: "Shopping", dataEntrada: "14/06/2022", precoEntrada: "R$ 78,00", precoAtual: "R$ 84,47", dy: "8.91%", precoTeto: "R$ 93,40", vies: "Compra" },
  { id: "13", ticker: "VGIP11", setor: "Papel", dataEntrada: "02/12/2021", precoEntrada: "R$ 96,99", precoAtual: "R$ 81,61", dy: "13.67%", precoTeto: "R$ 93,30", vies: "Compra" },
  { id: "14", ticker: "AFHI11", setor: "Papel", dataEntrada: "05/07/2022", precoEntrada: "R$ 99,91", precoAtual: "R$ 92,79", dy: "13.08%", precoTeto: "R$ 93,30", vies: "Compra" },
  { id: "15", ticker: "BTLG11", setor: "Logística", dataEntrada: "05/01/2022", precoEntrada: "R$ 103,14", precoAtual: "R$ 100,20", dy: "8.42%", precoTeto: "R$ 104,09", vies: "Compra" },
  { id: "16", ticker: "VRTA11", setor: "Papel", dataEntrada: "27/12/2022", precoEntrada: "R$ 88,30", precoAtual: "R$ 81,86", dy: "9.66%", precoTeto: "R$ 54,23", vies: "Compra" },
  { id: "17", ticker: "LVBI11", setor: "Logística", dataEntrada: "18/10/2022", precoEntrada: "R$ 113,85", precoAtual: "R$ 102,67", dy: "7.90%", precoTeto: "R$ 120,25", vies: "Compra" },
  { id: "18", ticker: "HGRU11", setor: "Renda Urbana", dataEntrada: "17/05/2022", precoEntrada: "R$ 115,00", precoAtual: "R$ 124,94", dy: "8.44%", precoTeto: "R$ 138,57", vies: "Compra" },
  { id: "19", ticker: "ALZR11", setor: "Híbrido", dataEntrada: "02/02/2022", precoEntrada: "R$ 115,89", precoAtual: "R$ 100,70", dy: "8.44%", precoTeto: "R$ 110,16", vies: "Compra" }
];

// 🎯 SEUS DADOS REAIS DE SMALL CAPS
const dadosSmallCapsReais = [
  { id: "1", ticker: "ALOS3", setor: "Shoppings", dataEntrada: "15/01/2021", precoEntrada: "R$ 26,68", precoAtual: "R$ 21,67", dy: "5,95%", precoTeto: "R$ 23,76", vies: "Compra" },
  { id: "2", ticker: "TUPY3", setor: "Industrial", dataEntrada: "04/11/2020", precoEntrada: "R$ 20,36", precoAtual: "R$ 18,93", dy: "1,71%", precoTeto: "R$ 31,50", vies: "Compra" },
  { id: "3", ticker: "RECV3", setor: "Petróleo", dataEntrada: "23/07/2023", precoEntrada: "R$ 22,29", precoAtual: "R$ 13,97", dy: "11,07%", precoTeto: "R$ 31,37", vies: "Compra" },
  { id: "4", ticker: "CSED3", setor: "Educação", dataEntrada: "10/12/2023", precoEntrada: "R$ 4,49", precoAtual: "R$ 5,12", dy: "4,96%", precoTeto: "R$ 8,35", vies: "Compra" },
  { id: "5", ticker: "PRIO3", setor: "Petróleo", dataEntrada: "04/08/2022", precoEntrada: "R$ 23,35", precoAtual: "R$ 38,80", dy: "0,18%", precoTeto: "R$ 48,70", vies: "Compra" },
  { id: "6", ticker: "RAPT4", setor: "Industrial", dataEntrada: "16/09/2021", precoEntrada: "R$ 16,69", precoAtual: "R$ 8,25", dy: "4,80%", precoTeto: "R$ 14,00", vies: "Compra" },
  { id: "7", ticker: "SMTO3", setor: "Sucroenergetico", dataEntrada: "10/11/2022", precoEntrada: "R$ 28,20", precoAtual: "R$ 20,97", dy: "3,51%", precoTeto: "R$ 35,00", vies: "Compra" },
  { id: "8", ticker: "FESA4", setor: "Commodities", dataEntrada: "11/12/2020", precoEntrada: "R$ 4,49", precoAtual: "R$ 6,92", dy: "5,68%", precoTeto: "R$ 14,07", vies: "Compra" },
  { id: "9", ticker: "UNIP6", setor: "Químico", dataEntrada: "08/12/2020", precoEntrada: "R$ 42,41", precoAtual: "R$ 61,00", dy: "6,77%", precoTeto: "R$ 117,90", vies: "Compra" },
  { id: "10", ticker: "FLRY3", setor: "Saúde", dataEntrada: "19/05/2022", precoEntrada: "R$ 14,63", precoAtual: "R$ 12,59", dy: "5,20%", precoTeto: "R$ 17,50", vies: "Compra" },
  { id: "11", ticker: "EZTC3", setor: "Construção Civil", dataEntrada: "07/10/2022", precoEntrada: "R$ 22,61", precoAtual: "R$ 13,17", dy: "7,83%", precoTeto: "R$ 30,00", vies: "Compra" },
  { id: "12", ticker: "JALL3", setor: "Sucroenergetico", dataEntrada: "17/06/2022", precoEntrada: "R$ 8,36", precoAtual: "R$ 4,32", dy: "1,15%", precoTeto: "R$ 11,90", vies: "Compra" },
  { id: "13", ticker: "YDUQ3", setor: "Educação", dataEntrada: "11/11/2020", precoEntrada: "R$ 27,16", precoAtual: "R$ 15,54", dy: "2,64%", precoTeto: "R$ 15,00", vies: "Aguardar" },
  { id: "14", ticker: "SIMH3", setor: "Logística", dataEntrada: "03/12/2020", precoEntrada: "R$ 7,98", precoAtual: "R$ 4,70", dy: "0,00%", precoTeto: "R$ 10,79", vies: "Compra" },
  { id: "15", ticker: "ALUP11", setor: "Energia", dataEntrada: "25/11/2020", precoEntrada: "R$ 24,40", precoAtual: "R$ 30,53", dy: "4,46%", precoTeto: "R$ 29,00", vies: "Aguardar" },
  { id: "16", ticker: "NEOE3", setor: "Energia", dataEntrada: "04/05/2021", precoEntrada: "R$ 15,94", precoAtual: "R$ 24,40", dy: "4,29%", precoTeto: "R$ 21,00", vies: "Aguardar" }
];

// 🧮 FUNÇÃO PARA PROCESSAR CARTEIRA - VERSÃO CORRIGIDA E AUDITADA
function processarCarteira(dadosRaw: any[], valorInvestimentoSimulado: number = 50000): CarteiraEducacional {
  console.log('🔍 AUDITANDO CÁLCULOS DA CARTEIRA...');
  console.log('💰 Valor total simulado:', valorInvestimentoSimulado);
  console.log('📊 Quantidade de ativos:', dadosRaw.length);
  
  const ativosProcessados = dadosRaw.map(ativo => {
    // Converter strings para números
    const precoEntrada = parseFloat(ativo.precoEntrada.replace('R$ ', '').replace(',', '.'));
    const precoAtual = parseFloat(ativo.precoAtual.replace('R$ ', '').replace(',', '.'));
    const dyAnual = parseFloat(ativo.dy.replace('%', '').replace(',', '.'));
    
    // CORREÇÃO: Simular investimento igual para todos os ativos
    const valorPorAtivo = valorInvestimentoSimulado / dadosRaw.length;
    const quantidadeCotasSimulada = valorPorAtivo / precoEntrada;
    const valorAtualSimulado = quantidadeCotasSimulada * precoAtual;
    
    // Calcular tempo investido em anos
    const partesData = ativo.dataEntrada.split('/');
    const dataEntrada = new Date(parseInt(partesData[2]), parseInt(partesData[1]) - 1, parseInt(partesData[0]));
    const hoje = new Date();
    const tempoInvestidoAnos = (hoje.getTime() - dataEntrada.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    
    // CORREÇÃO: Cálculo de dividendos mais realista
    let dividendosSimulados = 0;
    
    if (dyAnual > 0) {
      if (isTickerFII(ativo.ticker)) {
        // FIIs: pagam mensalmente
        dividendosSimulados = (valorPorAtivo * dyAnual / 100) * tempoInvestidoAnos;
      } else {
        // Small Caps: pagam anualmente (se pagam)
        const anosCompletos = Math.floor(tempoInvestidoAnos);
        dividendosSimulados = (valorPorAtivo * dyAnual / 100) * anosCompletos;
        
        // Adicionar proporção do ano atual
        const mesesNoAnoAtual = (tempoInvestidoAnos - anosCompletos) * 12;
        if (mesesNoAnoAtual >= 6) {
          dividendosSimulados += (valorPorAtivo * dyAnual / 100) * 0.5;
        }
      }
    }
    
    // CORREÇÃO: Rentabilidades
    const rentabilidadeCapital = ((valorAtualSimulado - valorPorAtivo) / valorPorAtivo) * 100;
    const rentabilidadeDividendos = valorPorAtivo > 0 ? (dividendosSimulados / valorPorAtivo) * 100 : 0;
    const rentabilidadeTotal = rentabilidadeCapital + rentabilidadeDividendos;
    
    // CORREÇÃO: DY realizado anualizado
    const dyRealizado = tempoInvestidoAnos > 0 ? (dividendosSimulados / valorPorAtivo / tempoInvestidoAnos) * 100 : 0;
    
    // Log para auditoria
    console.log(`📊 ${ativo.ticker}:`, {
      investido: `R$ ${valorPorAtivo.toFixed(0)}`,
      atual: `R$ ${valorAtualSimulado.toFixed(0)}`,
      dividendos: `R$ ${dividendosSimulados.toFixed(0)}`,
      rentabCapital: `${rentabilidadeCapital.toFixed(1)}%`,
      rentabTotal: `${rentabilidadeTotal.toFixed(1)}%`,
      tempo: `${tempoInvestidoAnos.toFixed(1)} anos`,
      dyOriginal: `${dyAnual}%`,
      dyRealizado: `${dyRealizado.toFixed(1)}%`
    });
    
    return {
      ...ativo,
      valorInvestidoSimulado: valorPorAtivo,
      valorAtualSimulado,
      rentabilidadeCapital,
      dividendosRecebidosSimulados: dividendosSimulados,
      rentabilidadeTotal,
      tempoInvestido: tempoInvestidoAnos,
      dyRealizado
    };
  });
  
  // AUDITORIA: Calcular totais
  const valorInicialTotal = ativosProcessados.reduce((sum, ativo) => sum + ativo.valorInvestidoSimulado, 0);
  const valorAtualTotal = ativosProcessados.reduce((sum, ativo) => sum + ativo.valorAtualSimulado, 0);
  const dividendosTotais = ativosProcessados.reduce((sum, ativo) => sum + ativo.dividendosRecebidosSimulados, 0);
  
  // CORREÇÃO: Rentabilidade total da carteira
  const rentabilidadeTotal = ((valorAtualTotal + dividendosTotais - valorInicialTotal) / valorInicialTotal) * 100;
  
  // CORREÇÃO: DY médio ponderado por valor
  const dyMedio = valorInicialTotal > 0 ? 
    ativosProcessados.reduce((sum, ativo) => {
      const peso = ativo.valorInvestidoSimulado / valorInicialTotal;
      return sum + (ativo.dyRealizado * peso);
    }, 0) : 0;
  
  console.log('📈 TOTAIS DA CARTEIRA:');
  console.log('💰 Valor inicial:', `R$ ${valorInicialTotal.toFixed(0)}`);
  console.log('💰 Valor atual:', `R$ ${valorAtualTotal.toFixed(0)}`);
  console.log('💵 Dividendos:', `R$ ${dividendosTotais.toFixed(0)}`);
  console.log('📊 Rentabilidade total:', `${rentabilidadeTotal.toFixed(1)}%`);
  console.log('📊 DY médio:', `${dyMedio.toFixed(1)}%`);
  
  // Encontrar extremos
  const melhorAtivo = ativosProcessados.reduce((prev, current) => 
    current.rentabilidadeTotal > prev.rentabilidadeTotal ? current : prev
  ).ticker;
  
  const piorAtivo = ativosProcessados.reduce((prev, current) => 
    current.rentabilidadeTotal < prev.rentabilidadeTotal ? current : prev
  ).ticker;
  
  const ativoMaiorDividendo = ativosProcessados.reduce((prev, current) => 
    current.dividendosRecebidosSimulados > prev.dividendosRecebidosSimulados ? current : prev
  ).ticker;
  
  // CORREÇÃO: Setor mais presente
  const contadorSetores = ativosProcessados.reduce((acc, ativo) => {
    acc[ativo.setor] = (acc[ativo.setor] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const setorMaisFrequente = Object.entries(contadorSetores).reduce((a, b) => 
    a[1] > b[1] ? a : b
  )[0];
  
  // CORREÇÃO: Recomendação baseada em performance e risco
  let recomendacao: 'Forte' | 'Moderada' | 'Cuidado' = 'Moderada';
  if (rentabilidadeTotal > 20) recomendacao = 'Forte';
  else if (rentabilidadeTotal < 0) recomendacao = 'Cuidado';
  
  console.log('🏆 ANÁLISE FINAL:');
  console.log('- Melhor ativo:', melhorAtivo);
  console.log('- Pior ativo:', piorAtivo);
  console.log('- Maior dividendo:', ativoMaiorDividendo);
  console.log('- Setor dominante:', setorMaisFrequente);
  console.log('- Recomendação:', recomendacao);
  
  return {
    id: dadosRaw === dadosFIIsReais ? 'fiis' : 'small-caps',
    nome: dadosRaw === dadosFIIsReais ? 'Fundos Imobiliários' : 'Small Caps',
    descricao: dadosRaw === dadosFIIsReais ? 
      'Carteira focada em renda passiva através de FIIs diversificados' : 
      'Carteira de crescimento com empresas de pequeno porte',
    icone: dadosRaw === dadosFIIsReais ? <Buildings /> : <TrendUp />,
    cor: dadosRaw === dadosFIIsReais ? '#10b981' : '#3b82f6',
    ativos: ativosProcessados,
    valorInicialTotal,
    valorAtualTotal,
    dividendosTotais,
    rentabilidadeTotal,
    dyMedio,
    melhorAtivo,
    piorAtivo,
    ativoMaiorDividendo,
    quantidadeAtivos: ativosProcessados.length,
    setorMaisPresentente: setorMaisFrequente,
    recomendacao
  };
}

// 📊 COMPONENTE DE CARD EDUCACIONAL
interface CardEducacionalProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

function CardEducacional({ title, value, subtitle, icon, color, trend, description }: CardEducacionalProps) {
  return (
    <Card sx={{ 
      height: '100%',
      borderLeft: `4px solid ${color}`,
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: 3,
        transform: 'translateY(-4px)'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" sx={{ 
              fontWeight: 700, 
              textTransform: 'uppercase',
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}>
              {title}
            </Typography>
            <Box sx={{ 
              color: color,
              backgroundColor: `${color}15`,
              p: 1,
              borderRadius: 1.5
            }}>
              {React.cloneElement(icon as React.ReactElement, { size: 20 })}
            </Box>
          </Stack>
          
          <Typography variant="h4" sx={{ 
            fontWeight: 800,
            color: trend === 'down' ? 'error.main' : trend === 'up' ? 'success.main' : 'text.primary'
          }}>
            {value}
          </Typography>
          
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          
          {description && (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {description}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

// 🎓 COMPONENTE PRINCIPAL DO DASHBOARD EDUCACIONAL
export function DashboardEducacionalIntegrado() {
  const [carteiraSelecionada, setCarteiraSelecionada] = React.useState('fiis');
  const [valorSimulacao, setValorSimulacao] = React.useState(50000);
  
  // Processar carteiras
  const carteiraFIIs = React.useMemo(() => 
    processarCarteira(dadosFIIsReais, valorSimulacao), [valorSimulacao]
  );
  
  const carteiraSmallCaps = React.useMemo(() => 
    processarCarteira(dadosSmallCapsReais, valorSimulacao), [valorSimulacao]
  );
  
  const carteiras = { fiis: carteiraFIIs, 'small-caps': carteiraSmallCaps };
  const carteira = carteiras[carteiraSelecionada];
  
  // Para passar para os novos componentes
  const carteiraCompleta = carteira;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };
  
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };
  
  return (
    <Box sx={{ py: 3 }}>
      <Grid container spacing={3}>
        {/* Header Educacional */}
        <Grid xs={12}>
          <Alert severity="info" sx={{ mb: 3 }}>
            🎓 <strong>Simulação Educacional:</strong> Estes dados mostram como seria a performance se você tivesse investido nas carteiras recomendadas. 
            Valores baseados nos preços reais de entrada e atuais.
          </Alert>
        </Grid>
        
        {/* Seletores */}
        <Grid xs={12}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Carteira Recomendada</InputLabel>
                <Select
                  value={carteiraSelecionada}
                  label="Carteira Recomendada"
                  onChange={(e) => setCarteiraSelecionada(e.target.value)}
                >
                  <MenuItem value="fiis">🏢 Fundos Imobiliários</MenuItem>
                  <MenuItem value="small-caps">📈 Small Caps</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Valor Simulado</InputLabel>
                <Select
                  value={valorSimulacao}
                  label="Valor Simulado"
                  onChange={(e) => setValorSimulacao(Number(e.target.value))}
                >
                  <MenuItem value={10000}>R$ 10.000</MenuItem>
                  <MenuItem value={25000}>R$ 25.000</MenuItem>
                  <MenuItem value={50000}>R$ 50.000</MenuItem>
                  <MenuItem value={100000}>R$ 100.000</MenuItem>
                </Select>
              </FormControl>
              
              <Chip 
                label={`${carteira.quantidadeAtivos} ativos`}
                color="primary"
                variant="outlined"
              />
              
              <Chip 
                label={`Recomendação: ${carteira.recomendacao}`}
                color={carteira.recomendacao === 'Forte' ? 'success' : carteira.recomendacao === 'Moderada' ? 'warning' : 'error'}
              />
            </Stack>
          </Card>
        </Grid>
        
        {/* Cards de Performance */}
        <Grid xs={12} sm={6} md={3}>
          <CardEducacional
            title="VALOR TOTAL"
            value={formatCurrency(carteira.valorAtualTotal)}
            subtitle={`Investido: ${formatCurrency(carteira.valorInicialTotal)}`}
            icon={<CurrencyDollar />}
            color={carteira.cor}
            description="Valor atual da simulação"
          />
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <CardEducacional
            title="RENTABILIDADE TOTAL"
            value={formatPercentage(carteira.rentabilidadeTotal)}
            subtitle="Capital + Dividendos"
            icon={<ChartLine />}
            color={carteira.rentabilidadeTotal >= 0 ? '#10b981' : '#ef4444'}
            trend={carteira.rentabilidadeTotal >= 0 ? 'up' : 'down'}
            description="Performance completa da estratégia"
          />
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <CardEducacional
            title="DIVIDENDOS SIMULADOS"
            value={formatCurrency(carteira.dividendosTotais)}
            subtitle={`DY Médio: ${carteira.dyMedio.toFixed(1)}%`}
            icon={<Percent />}
            color="#3b82f6"
            trend="up"
            description="Renda passiva gerada no período"
          />
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <CardEducacional
            title="MELHOR ATIVO"
            value={carteira.melhorAtivo}
            subtitle={`Setor: ${carteira.setorMaisPresentente}`}
            icon={<Trophy />}
            color="#f59e0b"
            description="Ativo com melhor performance"
          />
        </Grid>
        
        {/* Tabela de Ativos */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                📊 Performance Individual - {carteira.nome}
              </Typography>
              
              <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  <Box component="thead">
                    <Box component="tr" sx={{ backgroundColor: '#f8fafc' }}>
                      <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Ativo</Box>
                      <Box component="th" sx={{ p: 2, textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Setor</Box>
                      <Box component="th" sx={{ p: 2, textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Data Entrada</Box>
                      <Box component="th" sx={{ p: 2, textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Valor Investido</Box>
                      <Box component="th" sx={{ p: 2, textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Valor Atual</Box>
                      <Box component="th" sx={{ p: 2, textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Rentab. Capital</Box>
                      <Box component="th" sx={{ p: 2, textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Dividendos</Box>
                      <Box component="th" sx={{ p: 2, textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Rentab. Total</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {carteira.ativos.map((ativo, index) => (
                      <Box component="tr" key={ativo.id} sx={{ 
                        borderBottom: '1px solid #f1f5f9',
                        '&:hover': { backgroundColor: '#f8fafc' }
                      }}>
                        <Box component="td" sx={{ p: 2 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, backgroundColor: carteira.cor + '20', color: carteira.cor }}>
                              {ativo.ticker.slice(0, 2)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {ativo.ticker}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {ativo.tempoInvestido.toFixed(1)} anos
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                        <Box component="td" sx={{ p: 2, textAlign: 'center' }}>
                          <Chip label={ativo.setor} size="small" variant="outlined" />
                        </Box>
                        <Box component="td" sx={{ p: 2, textAlign: 'center' }}>
                          {ativo.dataEntrada}
                        </Box>
                        <Box component="td" sx={{ p: 2, textAlign: 'center', fontWeight: 600 }}>
                          {formatCurrency(ativo.valorInvestidoSimulado)}
                        </Box>
                        <Box component="td" sx={{ p: 2, textAlign: 'center', fontWeight: 600 }}>
                          {formatCurrency(ativo.valorAtualSimulado)}
                        </Box>
                        <Box component="td" sx={{ 
                          p: 2, 
                          textAlign: 'center', 
                          fontWeight: 700,
                          color: ativo.rentabilidadeCapital >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          {formatPercentage(ativo.rentabilidadeCapital)}
                        </Box>
                        <Box component="td" sx={{ p: 2, textAlign: 'center', fontWeight: 600, color: '#3b82f6' }}>
                          {formatCurrency(ativo.dividendosRecebidosSimulados)}
                        </Box>
                        <Box component="td" sx={{ 
                          p: 2, 
                          textAlign: 'center', 
                          fontWeight: 700,
                          color: ativo.rentabilidadeTotal >= 0 ? '#10b981' : '#ef4444',
                          backgroundColor: ativo.rentabilidadeTotal >= 0 ? '#f0fdf4' : '#fef2f2'
                        }}>
                          {formatPercentage(ativo.rentabilidadeTotal)}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Insights Educacionais */}
        <Grid xs={12}>
          <Card sx={{ backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#0c4a6e' }}>
                💡 Insights Educacionais
              </Typography>
              
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>🏆 Melhor Performance:</strong> {carteira.melhorAtivo} está liderando a carteira
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>💰 Maior Gerador de Renda:</strong> {carteira.ativoMaiorDividendo} pagou mais dividendos
                  </Typography>
                  <Typography variant="body1">
                    <strong>🎯 Setor Dominante:</strong> {carteira.setorMaisPresentente} é o mais presente na carteira
                  </Typography>
                </Grid>
                <Grid xs={12} md={6}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>📈 Rentabilidade Total:</strong> {formatPercentage(carteira.rentabilidadeTotal)} incluindo dividendos
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>💵 Renda Passiva:</strong> {formatCurrency(carteira.dividendosTotais)} gerados no período
                  </Typography>
                  <Typography variant="body1">
                    <strong>⏱️ Estratégia:</strong> {carteira.descricao}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>🎓 Aprendizado:</strong> Esta simulação mostra como a diversificação e o foco em dividendos podem gerar renda passiva consistente. 
                  O investimento de {formatCurrency(valorSimulacao)} teria se tornado {formatCurrency(carteira.valorAtualTotal + carteira.dividendosTotais)} 
                  considerando a valorização das cotas e os dividendos recebidos.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Comparação entre Carteiras */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                ⚖️ Comparação entre Estratégias
              </Typography>
              
              <Grid container spacing={3}>
                <Grid xs={12} md={6}>
                  <Box sx={{ p: 3, backgroundColor: '#f0fdf4', borderRadius: 2, border: '1px solid #10b981' }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <Buildings size={24} color="#10b981" />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                        Fundos Imobiliários
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ mb: 2, color: '#065f46' }}>
                      Estratégia focada em renda passiva consistente através de dividendos mensais
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        • <strong>Rentabilidade:</strong> {formatPercentage(carteiraFIIs.rentabilidadeTotal)}
                      </Typography>
                      <Typography variant="body2">
                        • <strong>Dividendos:</strong> {formatCurrency(carteiraFIIs.dividendosTotais)}
                      </Typography>
                      <Typography variant="body2">
                        • <strong>DY Médio:</strong> {carteiraFIIs.dyMedio.toFixed(1)}% ao ano
                      </Typography>
                      <Typography variant="body2">
                        • <strong>Risco:</strong> Baixo a Moderado
                      </Typography>
                    </Stack>
                  </Box>
                </Grid>
                
                <Grid xs={12} md={6}>
                  <Box sx={{ p: 3, backgroundColor: '#eff6ff', borderRadius: 2, border: '1px solid #3b82f6' }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <TrendUp size={24} color="#3b82f6" />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                        Small Caps
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ mb: 2, color: '#1e40af' }}>
                      Estratégia de crescimento com empresas de pequeno porte e alto potencial
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        • <strong>Rentabilidade:</strong> {formatPercentage(carteiraSmallCaps.rentabilidadeTotal)}
                      </Typography>
                      <Typography variant="body2">
                        • <strong>Dividendos:</strong> {formatCurrency(carteiraSmallCaps.dividendosTotais)}
                      </Typography>
                      <Typography variant="body2">
                        • <strong>DY Médio:</strong> {carteiraSmallCaps.dyMedio.toFixed(1)}% ao ano
                      </Typography>
                      <Typography variant="body2">
                        • <strong>Risco:</strong> Moderado a Alto
                      </Typography>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 📈 GRÁFICOS DE EVOLUÇÃO */}
        <Grid xs={12}>
          <GraficosEvolucao carteira={carteiraCompleta} />
        </Grid>
        
        {/* 📅 AGENDA DE DIVIDENDOS */}
        <Grid xs={12}>
          <AgendaDividendos carteira={carteiraCompleta} />
        </Grid>
        
        {/* Próximos Passos */}
        <Grid xs={12}>
          <Card sx={{ backgroundColor: '#fefbef', border: '1px solid #f59e0b' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#92400e' }}>
                🚀 Funcionalidades Integradas
              </Typography>
              
              <Grid container spacing={2}>
                <Grid xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <ChartLine size={32} color="#f59e0b" />
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                      ✅ Gráficos de Evolução
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Timeline da performance
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Calculator size={32} color="#f59e0b" />
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                      ✅ Simulação TIR
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Taxa interna de retorno
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Calendar size={32} color="#f59e0b" />
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                      ✅ Agenda de Dividendos
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Próximos pagamentos
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Target size={32} color="#10b981" />
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                      💡 Análise Avançada
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Insights educacionais
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Alert severity="success">
                  <Typography variant="body2">
                    <strong>🎉 Dashboard Educacional Completo!</strong> Análises detalhadas da carteira, 
                    gráficos de evolução temporal e agenda completa de dividendos já integrados.
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
