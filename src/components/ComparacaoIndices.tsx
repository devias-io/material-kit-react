'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import { Chart } from '@/components/core/chart';
import { API_CONFIG } from '@/config/apiConfig';

type RangeKey = '2y' | '5y' | '10y';

type SerieTipo = 'ativo' | 'indice';

type HistoricoPonto = {
  date: number;
  close: number;
};

type DividendoPonto = {
  date: number;
  valor: number;
};

type SeriePreparada = {
  name: string;
  color: string;
  data: { x: number; y: number }[];
  retorno: number;
  tipo: SerieTipo;
};

type HistoricoBruto = Array<{
  date?: string;
  pricedAt?: string;
  close?: number;
  adjClose?: number;
  price?: number;
  value?: number;
}>;

type IndiceStatus = {
  ticker: string;
  sucesso: boolean;
  pontos: number;
  erro?: string;
  primeiraData?: string;
  ultimaData?: string;
};

// ✅ CORREÇÃO 1: Validação rigorosa de números para evitar NaN/Infinity/undefined
const ehNumeroValido = (valor: any): valor is number => {
  return typeof valor === 'number' && !Number.isNaN(valor) && Number.isFinite(valor) && valor > 0;
};

// ✅ CORREÇÃO 2: Validação de ponto de histórico completo
const pontoEhValido = (ponto: any): ponto is HistoricoPonto => {
  return (
    ponto &&
    typeof ponto === 'object' &&
    ehNumeroValido(ponto.date) &&
    ehNumeroValido(ponto.close)
  );
};

const normalizarData = (valor?: string | number): number | undefined => {
  if (!valor) return undefined;

  if (typeof valor === 'number' && !Number.isNaN(valor)) {
    const ehTimestampEmSegundos = valor < 1_000_000_000_000;
    return ehTimestampEmSegundos ? valor * 1000 : valor;
  }

  const parsed = new Date(valor).getTime();
  return Number.isNaN(parsed) ? undefined : parsed;
};

const INVESTIMENTO_BASE = 1000;

const RANGE_CONFIG: Record<RangeKey, { label: string; range: string; interval: string }> = {
  '2y': { label: '2 anos', range: '2y', interval: '1mo' },
  '5y': { label: '5 anos', range: '5y', interval: '1mo' },
  '10y': { label: '10 anos', range: '10y', interval: '1mo' }
};

type FonteIndice = 'brapi-historical' | 'brapi-v2-prime' | 'brapi-v2-inflation' | 'bcb';

const INDICES_PADRAO: Array<{
  ticker: string;
  label: string;
  color: string;
  fonte: FonteIndice;
}> = [
  { ticker: '^BVSP', label: 'IBOV', color: '#0ea5e9', fonte: 'brapi-historical' },
  { ticker: 'XFIX11', label: 'IFIX', color: '#16a34a', fonte: 'brapi-historical' },
  { ticker: 'IVVB11', label: 'IVVB11', color: '#a855f7', fonte: 'brapi-historical' },
  { ticker: 'SMAL11', label: 'SMLL', color: '#f59e0b', fonte: 'brapi-historical' },
  { ticker: 'CDI', label: 'CDI', color: '#0f766e', fonte: 'bcb' },
  { ticker: 'DIVO11', label: 'IDIV', color: '#ea580c', fonte: 'brapi-historical' },
  { ticker: 'SELIC', label: 'SELIC', color: '#2563eb', fonte: 'brapi-v2-prime' }
];

const extrairHistorico = (dados: HistoricoBruto): HistoricoPonto[] => {
  if (!Array.isArray(dados)) return [];

  return dados
    .map(item => ({
      date: normalizarData(item.date ?? item.pricedAt),
      close: item.close ?? item.adjClose ?? item.price ?? item.value
    }))
    .filter(pontoEhValido) // ✅ Usa validação rigorosa
    .sort((a, b) => a.date - b.date);
};

const buscarHistorico = async (
  ticker: string,
  range: RangeKey,
  signal?: AbortSignal
): Promise<{ historico: HistoricoPonto[]; dividendos: DividendoPonto[] }> => {
  // BRAPI mudou: apenas 'max' retorna dados históricos consistentemente
  // Buscamos todos os dados e filtramos no client-side pelo range solicitado
  const { range: rangeParam } = RANGE_CONFIG[range];
  const historicoUrl = `/api/brapi/quote?tickers=${ticker}&range=max&interval=1d`;
  const dividendosUrl = `/api/brapi/quote?tickers=${ticker}&fundamental=true&dividends=true`;

  const [historicoResp, dividendosResp] = await Promise.all([
    fetch(historicoUrl, {
      method: 'GET',
      headers: API_CONFIG.DEFAULT_HEADERS,
      signal
    }),
    fetch(dividendosUrl, {
      method: 'GET',
      headers: API_CONFIG.DEFAULT_HEADERS,
      signal
    })
  ]);

  if (!historicoResp.ok) {
    throw new Error(`BRAPI ${ticker} histórico: ${historicoResp.status}`);
  }

  const payloadHistorico = await historicoResp.json();
  const historico =
    payloadHistorico?.results?.[0]?.historicalDataPrice ||
    payloadHistorico?.results?.[0]?.historicalData ||
    payloadHistorico?.results?.[0]?.prices;

  let dividendos: DividendoPonto[] = [];
  if (dividendosResp.ok) {
    const payloadDividendos = await dividendosResp.json();
    const dividendosBrutos =
      payloadDividendos?.results?.[0]?.dividendsData ||
      payloadDividendos?.results?.[0]?.dividends ||
      payloadDividendos?.results?.[0]?.cashDividends ||
      [];

    dividendos = Array.isArray(dividendosBrutos)
      ? dividendosBrutos
          .map((item: any) => {
            const dataDividendos =
              item.paymentDate || item.date || item.approvedOn || item.referenceDate || item.lastDatePrior || item.payDate;
            const valorDividendos =
              item.cashValue || item.rate || item.value || item.amount || item.dividend || item.netValue || item.grossValue;
            const parsedDate = normalizarData(dataDividendos);

            if (!parsedDate || !valorDividendos || Number.isNaN(Number(valorDividendos))) return null;

            return { date: parsedDate, valor: Number(valorDividendos) } as DividendoPonto;
          })
          .filter(Boolean)
          .sort((a: DividendoPonto, b: DividendoPonto) => a.date - b.date)
      : [];
  }

  const historicoExtraido = extrairHistorico(historico);

  // Filtrar dados pelo range solicitado (2y, 5y, 10y)
  const agora = Date.now();
  const anosEmMillis = rangeParam === '2y' ? 2 * 365 * 24 * 60 * 60 * 1000 :
                      rangeParam === '5y' ? 5 * 365 * 24 * 60 * 60 * 1000 :
                      rangeParam === '10y' ? 10 * 365 * 24 * 60 * 60 * 1000 :
                      Infinity;

  const dataCorte = agora - anosEmMillis;
  const historicoFiltrado = historicoExtraido.filter(ponto => ponto.date >= dataCorte);

  return { historico: historicoFiltrado, dividendos };
};

// Converter datas DD/MM/YYYY para timestamp
const converterDataBR = (dataBR: string): number => {
  const [dia, mes, ano] = dataBR.split('/');
  return new Date(`${ano}-${mes}-${dia}`).getTime();
};

// Gerar datas para requisições baseado no range
const gerarDatasRange = (range: RangeKey): { dataInicial: string; dataFinal: string } => {
  const hoje = new Date();
  const dataFinal = dayjs(hoje).format('DD/MM/YYYY');

  let dataInicial = hoje;
  switch (range) {
    case '2y':
      dataInicial = dayjs(hoje).subtract(2, 'year').toDate();
      break;
    case '5y':
      dataInicial = dayjs(hoje).subtract(5, 'year').toDate();
      break;
    case '10y':
      dataInicial = dayjs(hoje).subtract(10, 'year').toDate();
      break;
    default:
      break;
  }

  return {
    dataInicial: dayjs(dataInicial).format('DD/MM/YYYY'),
    dataFinal
  };
};

// Converter taxas mensais para índice acumulado (base 100)
// CDI, SELIC e IPCA são taxas mensais que precisam ser compostas
const calcularIndiceAcumulado = (taxasMensais: { date: number; value: number }[]): HistoricoPonto[] => {
  let indice = 100;
  const taxasOrdenadas = [...taxasMensais].sort((a, b) => a.date - b.date);

  return taxasOrdenadas
    .map(ponto => {
      indice = indice * (1 + ponto.value / 100);
      return { date: ponto.date, close: indice };
    })
    .filter(pontoEhValido); // ✅ CORREÇÃO 3: Valida após cálculo acumulado
};

const agruparUltimoValorMensal = (pontos: { date: number; value: number }[]): { date: number; value: number }[] => {
  const pontosValidos = pontos
    .filter(ponto => typeof ponto.date === 'number' && !Number.isNaN(ponto.date) && typeof ponto.value === 'number')
    .sort((a, b) => a.date - b.date);

  const ultimoPorMes = new Map<string, { date: number; value: number }>();

  pontosValidos.forEach(ponto => {
    const chaveMes = dayjs(ponto.date).format('YYYY-MM');
    const existente = ultimoPorMes.get(chaveMes);
    if (!existente || ponto.date > existente.date) {
      ultimoPorMes.set(chaveMes, ponto);
    }
  });

  return Array.from(ultimoPorMes.values()).sort((a, b) => a.date - b.date);
};

const converterTaxaAnualParaMensal = (pontos: { date: number; value: number }[]): { date: number; value: number }[] =>
  pontos.map(ponto => ({
    date: ponto.date,
    value: (Math.pow(1 + ponto.value / 100, 1 / 12) - 1) * 100
  }));

const buscarSelic = async (range: RangeKey, signal?: AbortSignal): Promise<HistoricoPonto[]> => {
  const { dataInicial, dataFinal } = gerarDatasRange(range);
  const url = `/api/brapi/prime-rate?country=brazil&historical=true&start=${dataInicial}&end=${dataFinal}`;

  const response = await fetch(url, { signal, headers: API_CONFIG.DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`SELIC: ${response.status}`);

  const data = await response.json();
  const taxas = data['prime-rate'].map((item: { date: string | number; value: string }) => ({
    date: normalizarData(item.date) || converterDataBR(String(item.date)),
    value: parseFloat(item.value)
  }));

  const taxasMensais = converterTaxaAnualParaMensal(agruparUltimoValorMensal(taxas));

  return calcularIndiceAcumulado(taxasMensais);
};

const buscarIPCA = async (range: RangeKey, signal?: AbortSignal): Promise<HistoricoPonto[]> => {
  const { dataInicial, dataFinal } = gerarDatasRange(range);
  const url = `/api/brapi/inflation?country=brazil&historical=true&start=${dataInicial}&end=${dataFinal}`;

  const response = await fetch(url, { signal, headers: API_CONFIG.DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`IPCA: ${response.status}`);

  const data = await response.json();
  const taxas = data.inflation.map((item: { date: string | number; value: string }) => ({
    date: normalizarData(item.date) || converterDataBR(String(item.date)),
    value: parseFloat(item.value)
  }));

  const taxasMensais = agruparUltimoValorMensal(taxas);

  return calcularIndiceAcumulado(taxasMensais);
};

const buscarCDI = async (range: RangeKey, signal?: AbortSignal): Promise<HistoricoPonto[]> => {
  const { dataInicial, dataFinal } = gerarDatasRange(range);
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`CDI: ${response.status}`);

  const data = await response.json();
  const taxas = data.map((item: { data: string; valor: string }) => ({
    date: converterDataBR(item.data),
    value: parseFloat(item.valor)
  }));

  return calcularIndiceAcumulado(taxas);
};

// ✅ CORREÇÃO 4: Proteção completa contra divisão por zero e valores inválidos
const aplicarDividendosComReinvestimento = (historico: HistoricoPonto[], dividendos: DividendoPonto[]) => {
  // Valida histórico antes de processar
  const historicoValido = historico.filter(pontoEhValido);
  
  if (historicoValido.length === 0) {
    return { data: [], retornoFinal: 0 };
  }

  const precoInicial = historicoValido[0].close;
  
  // ✅ PROTEÇÃO CRÍTICA: Se preço inicial for inválido, retorna vazio
  if (!ehNumeroValido(precoInicial)) {
    console.warn('⚠️ Preço inicial inválido:', precoInicial);
    return { data: [], retornoFinal: 0 };
  }

  const dividendosOrdenados = [...dividendos].sort((a, b) => a.date - b.date);
  let indiceDividendo = 0;
  let cotas = 1;

  const data = historicoValido.map(ponto => {
    while (indiceDividendo < dividendosOrdenados.length && dividendosOrdenados[indiceDividendo].date <= ponto.date) {
      const valorDividendo = dividendosOrdenados[indiceDividendo].valor;
      if (valorDividendo && ponto.close > 0) {
        const novasCotas = valorDividendo / ponto.close;
        cotas += novasCotas;
      }
      indiceDividendo += 1;
    }

    const valorAtual = ponto.close * cotas;
    const retornoPercentual = ((valorAtual - precoInicial) / precoInicial) * 100;

    // ✅ PROTEÇÃO: Só retorna se o valor calculado for válido
    if (!ehNumeroValido(retornoPercentual)) {
      return null;
    }

    return { x: ponto.date, y: retornoPercentual };
  }).filter(Boolean) as { x: number; y: number }[]; // Remove nulls

  const ultimoPonto = historicoValido[historicoValido.length - 1];
  const ultimoValor = ultimoPonto.close * cotas;
  const retornoFinal = ((ultimoValor - precoInicial) / precoInicial) * 100;

  return { 
    data, 
    retornoFinal: ehNumeroValido(retornoFinal) ? retornoFinal : 0 
  };
};

// 🎯 Alinhamento flexível de séries
const prepararSeriesAlinhadasFlexivel = (
  series: Array<{ name: string; color: string; tipo: SerieTipo; pontos: HistoricoPonto[]; dividendos: DividendoPonto[] }>
): SeriePreparada[] => {
  // Filtra séries que tem pontos válidos
  const seriesValidas = series.filter(s => s.pontos.length > 0);
  
  if (seriesValidas.length === 0) return [];

  // Usa a data mais ANTIGA se houver pelo menos 2 séries com dados
  const datasIniciais = seriesValidas
    .map(serie => serie.pontos[0].date)
    .sort((a, b) => a - b);

  const inicioComum = datasIniciais.length >= 2 ? datasIniciais[0] : datasIniciais[0];

  return seriesValidas
    .map(serie => {
      const pontosValidos = serie.pontos.filter(ponto => ponto.date >= inicioComum && pontoEhValido(ponto));
      
      // Reduz o mínimo de pontos para 1
      if (pontosValidos.length < 1) return null;

      const { data, retornoFinal } = aplicarDividendosComReinvestimento(pontosValidos, serie.dividendos);
      
      // ✅ CORREÇÃO 5: Valida se os dados processados são válidos
      const dadosValidos = data.filter(ponto => 
        ponto && 
        ehNumeroValido(ponto.x) && 
        ehNumeroValido(ponto.y)
      );

      if (dadosValidos.length === 0) return null;

      return {
        name: serie.name,
        color: serie.color,
        data: dadosValidos,
        retorno: retornoFinal,
        tipo: serie.tipo
      } as SeriePreparada;
    })
    .filter(Boolean) as SeriePreparada[];
};

const formatarPercentual = (valor: number) => {
  // ✅ CORREÇÃO 6: Protege formatação contra valores inválidos
  if (!ehNumeroValido(valor)) return '0.00%';
  return `${valor >= 0 ? '+' : ''}${valor.toFixed(2)}%`;
};

const formatarData = (valor: number) => {
  // ✅ CORREÇÃO 7: Protege formatação de data
  if (!ehNumeroValido(valor)) return 'Data inválida';
  return dayjs(valor).format('DD/MM/YY');
};

interface ComparacaoIndicesProps {
  ticker: string;
  moeda?: string;
  corAtivo?: string;
  isMobile?: boolean;
  formatCurrency: (valor: number, moeda?: string) => string;
}

const ComparacaoIndices: React.FC<ComparacaoIndicesProps> = ({
  ticker,
  moeda = 'BRL',
  corAtivo = '#ef4444',
  isMobile = false,
  formatCurrency
}) => {
  const [range, setRange] = useState<RangeKey>('5y');
  const [series, setSeries] = useState<SeriePreparada[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [indicesStatus, setIndicesStatus] = useState<IndiceStatus[]>([]);

  useEffect(() => {
    if (!ticker) return;

    const controller = new AbortController();
    const carregar = async () => {
      setLoading(true);
      setErro(null);

      const ativosParaBuscar = [
        { ticker, label: ticker, color: corAtivo, tipo: 'ativo' as SerieTipo, fonte: 'brapi-historical' as FonteIndice },
        ...INDICES_PADRAO.map(idx => ({ ...idx, tipo: 'indice' as SerieTipo }))
      ];

      console.log('🔍 === INICIANDO BUSCA DE ÍNDICES ===');
      console.log(`Range selecionado: ${range} (${RANGE_CONFIG[range].label})`);

      const resultados = await Promise.allSettled(
        ativosParaBuscar.map(async item => {
          try {
            let historico: HistoricoPonto[] = [];
            let dividendos: DividendoPonto[] = [];

            if (item.fonte === 'brapi-historical') {
              const resultadoHistorico = await buscarHistorico(item.ticker, range, controller.signal);
              historico = resultadoHistorico.historico;
              dividendos = resultadoHistorico.dividendos;
            } else if (item.fonte === 'brapi-v2-prime') {
              historico = await buscarSelic(range, controller.signal);
            } else if (item.fonte === 'brapi-v2-inflation') {
              historico = await buscarIPCA(range, controller.signal);
            } else if (item.fonte === 'bcb') {
              historico = await buscarCDI(range, controller.signal);
            }

            console.log(`✅ ${item.ticker}:`, {
              pontos: historico.length,
              dividendos: dividendos.length,
              primeiraData: historico[0]?.date ? new Date(historico[0].date).toLocaleDateString('pt-BR') : 'N/A',
              ultimaData: historico[historico.length - 1]?.date
                ? new Date(historico[historico.length - 1].date).toLocaleDateString('pt-BR')
                : 'N/A'
            });

            return { name: item.label, color: item.color, tipo: item.tipo, pontos: historico, dividendos };
          } catch (error) {
            console.error(`❌ ${item.ticker} FALHOU:`, error);
            throw error;
          }
        })
      );

      // 🔍 Gera relatório de status
      const status: IndiceStatus[] = resultados.map((resultado, index) => {
        const ativo = ativosParaBuscar[index];
        
        if (resultado.status === 'fulfilled') {
          const { pontos } = resultado.value;
          return {
            ticker: ativo.ticker,
            sucesso: pontos.length > 0,
            pontos: pontos.length,
            primeiraData: pontos[0]?.date ? new Date(pontos[0].date).toLocaleDateString('pt-BR') : undefined,
            ultimaData: pontos[pontos.length - 1]?.date 
              ? new Date(pontos[pontos.length - 1].date).toLocaleDateString('pt-BR') 
              : undefined
          };
        } else {
          return {
            ticker: ativo.ticker,
            sucesso: false,
            pontos: 0,
            erro: resultado.reason?.message || 'Erro desconhecido'
          };
        }
      });

      setIndicesStatus(status);

      console.log('📊 === RELATÓRIO DE STATUS ===');
      status.forEach(s => {
        if (s.sucesso) {
          console.log(`✅ ${s.ticker}: ${s.pontos} pontos (${s.primeiraData} → ${s.ultimaData})`);
        } else {
          console.log(`❌ ${s.ticker}: ${s.erro || 'Sem dados'}`);
        }
      });

      const seriesProcessadas = prepararSeriesAlinhadasFlexivel(
        resultados
          .filter(
            (
              resultado
            ): resultado is PromiseFulfilledResult<{
              name: string;
              color: string;
              tipo: SerieTipo;
              pontos: HistoricoPonto[];
              dividendos: DividendoPonto[];
            }> =>
            resultado.status === 'fulfilled' && resultado.value.pontos.length > 0
          )
          .map(resultado => resultado.value)
      );

      console.log(`📈 Séries processadas com sucesso: ${seriesProcessadas.length}`);
      console.log('=== FIM DO DEBUG ===\n');

      if (!controller.signal.aborted) {
        setSeries(seriesProcessadas);

        if (seriesProcessadas.length === 0) {
          setErro('Não encontramos histórico suficiente para comparar este ativo.');
        } else if (seriesProcessadas.length === 1) {
          setErro('Conseguimos carregar apenas o ativo principal. Os índices de comparação não estão disponíveis.');
        }
      }
    };

    carregar()
      .catch(error => {
        if (!controller.signal.aborted) {
          console.error('❌ Erro geral ao carregar comparação:', error);
          setErro('Não conseguimos carregar o comparativo agora. Tente novamente em instantes.');
          setSeries([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [ticker, corAtivo, range]);

  const resumoInvestimento = useMemo(
    () =>
      series
        .map(item => ({
          name: item.name,
          color: item.color,
          retorno: item.retorno,
          valorFinal: INVESTIMENTO_BASE * (1 + item.retorno / 100),
          tipo: item.tipo
        }))
        .sort((a, b) => b.retorno - a.retorno),
    [series]
  );

  const chartSeries = useMemo(
    () => series.map(serie => ({ name: serie.name, data: serie.data })),
    [series]
  );

  // ✅ CORREÇÃO 8: Formatters com proteção completa contra valores inválidos
  const chartOptions = useMemo(
    () => ({
      chart: {
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      },
      stroke: { curve: 'smooth', width: 2.5 },
      dataLabels: { enabled: false },
      colors: series.map(item => item.color),
      markers: { size: 0 },
      xaxis: {
        type: 'datetime',
        labels: {
          format: 'MM/yy',
          style: { fontSize: isMobile ? '10px' : '12px' },
          formatter: (valor: any) => {
            // ✅ Protege contra valores inválidos no eixo X
            if (!valor || !ehNumeroValido(Number(valor))) return '';
            return dayjs(Number(valor)).format('MM/YY');
          }
        }
      },
      yaxis: {
        labels: {
          formatter: (valor: any) => {
            // ✅ Protege contra valores inválidos no eixo Y
            if (valor === null || valor === undefined || Number.isNaN(valor) || !Number.isFinite(valor)) {
              return '0%';
            }
            return `${Number(valor).toFixed(0)}%`;
          },
          style: { fontSize: isMobile ? '10px' : '12px' }
        }
      },
      grid: { strokeDashArray: 4 },
      tooltip: {
        shared: true,
        intersect: false,
        x: { 
          formatter: (valor: any) => {
            // ✅ Protege tooltip X
            if (!valor || !ehNumeroValido(Number(valor))) return 'Data inválida';
            return formatarData(Number(valor));
          }
        },
        y: { 
          formatter: (valor: any) => {
            // ✅ Protege tooltip Y
            if (valor === null || valor === undefined || Number.isNaN(valor) || !Number.isFinite(valor)) {
              return '0.00%';
            }
            return formatarPercentual(Number(valor));
          }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: isMobile ? '11px' : '12px',
        markers: { width: 12, height: 12 }
      }
    }),
    [series, isMobile]
  );

  // ✅ CORREÇÃO 9: Validação final antes de renderizar o Chart
  const dadosValidosParaGrafico = useMemo(() => {
    return chartSeries.every(serie => 
      Array.isArray(serie.data) && 
      serie.data.length > 0 &&
      serie.data.every(ponto => 
        ponto && 
        ehNumeroValido(ponto.x) && 
        ehNumeroValido(ponto.y)
      )
    );
  }, [chartSeries]);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.2)',
        padding: isMobile ? '16px' : '24px',
        marginBottom: '28px'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center'
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: 800,
                color: '#0f172a'
              }}
            >
              Comparação de {ticker} com índices
            </h3>
            <span
              style={{
                background: '#e2e8f0',
                color: '#334155',
                borderRadius: '999px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              Retorno percentual
            </span>
          </div>
          <p
            style={{
              margin: '6px 0 0',
              color: '#475569',
              fontSize: isMobile ? '12px' : '13px'
            }}
          >
            Acompanhe como o ativo performou frente aos principais benchmarks da bolsa (retorno total com reinvestimento de dividendos).
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {Object.entries(RANGE_CONFIG).map(([chave, config]) => (
            <button
              key={chave}
              onClick={() => setRange(chave as RangeKey)}
              style={{
                border: '1px solid #e2e8f0',
                background: range === chave ? '#0f172a' : '#f8fafc',
                color: range === chave ? '#ffffff' : '#0f172a',
                borderRadius: '10px',
                padding: isMobile ? '8px 10px' : '10px 14px',
                fontWeight: 700,
                fontSize: isMobile ? '12px' : '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: range === chave ? '0 10px 20px -12px rgba(15, 23, 42, 0.35)' : 'none'
              }}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: '10px',
            fontWeight: 600
          }}
        >
          {erro}
        </div>
      )}

      {/* 🆕 Painel de Status dos Índices */}
      {indicesStatus.length > 0 && (
        <details
          style={{
            marginTop: '16px',
            padding: '12px 14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '12px'
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: 700,
              color: '#0f172a',
              userSelect: 'none'
            }}
          >
            📊 Status dos Índices ({indicesStatus.filter(s => s.sucesso).length}/{indicesStatus.length} disponíveis)
          </summary>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {indicesStatus.map(status => (
              <div
                key={status.ticker}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  background: status.sucesso ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              >
                <span style={{ fontWeight: 700, color: status.sucesso ? '#166534' : '#991b1b' }}>
                  {status.sucesso ? '✅' : '❌'} {status.ticker}
                </span>
                <span style={{ color: '#64748b' }}>
                  {status.sucesso
                    ? `${status.pontos} pontos (${status.primeiraData} → ${status.ultimaData})`
                    : status.erro || 'Sem dados'}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      <div style={{ marginTop: '16px' }}>
        {loading ? (
          <div
            style={{
              height: isMobile ? '240px' : '300px',
              background: 'linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)',
              backgroundSize: '200% 100%',
              animation: 'pulse 1.5s ease-in-out infinite',
              borderRadius: '10px'
            }}
          />
        ) : series.length > 0 && dadosValidosParaGrafico ? (
          <Chart type="line" height={isMobile ? 260 : 320} options={chartOptions} series={chartSeries} />
        ) : (
          <div
            style={{
              height: isMobile ? '240px' : '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontWeight: 600,
              border: '1px dashed #cbd5e1',
              borderRadius: '10px'
            }}
          >
            {series.length > 0 && !dadosValidosParaGrafico 
              ? 'Os dados carregados contêm valores inválidos e não podem ser exibidos.'
              : 'Sem dados suficientes para exibir o gráfico.'}
          </div>
        )}
      </div>

      {resumoInvestimento.length > 0 && (
        <div style={{ marginTop: '18px' }}>
          <h4
            style={{
              margin: 0,
              fontSize: isMobile ? '14px' : '15px',
              fontWeight: 800,
              color: '#0f172a'
            }}
          >
            Se você tivesse investido {formatCurrency(INVESTIMENTO_BASE, moeda)}
          </h4>

          <div
            style={{
              marginTop: '12px',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '10px'
            }}
          >
            {resumoInvestimento.map(item => (
              <div
                key={item.name}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '12px'
                  }}
                >
                  {item.name.slice(0, 4).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 800,
                        color: '#0f172a',
                        fontSize: '14px'
                      }}
                    >
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontWeight: 800,
                        color: item.retorno >= 0 ? '#16a34a' : '#dc2626'
                      }}
                    >
                      {formatarPercentual(item.retorno)}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: '4px 0 0',
                      color: '#475569',
                      fontSize: '13px'
                    }}
                  >
                    {formatCurrency(item.valorFinal, moeda)} após o período selecionado.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparacaoIndices;
