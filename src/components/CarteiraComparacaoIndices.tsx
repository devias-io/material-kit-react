'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';

import { Chart } from '@/components/core/chart';
import { API_CONFIG } from '@/config/apiConfig';

interface DataPoint {
  x: number;
  y: number;
}

interface Serie {
  name: string;
  color: string;
  data: DataPoint[];
  retorno: number;
}

type IndiceConfig = {
  ticker: string;
  label: string;
  color: string;
  tipo: 'historico' | 'cdi';
};

type RangeKey = '2y' | '5y' | '10y';

type HistoricoPonto = {
  date: number;
  close: number;
};

type DividendoPonto = {
  date: number;
  valor: number;
};

type HistoricoBruto = Array<{
  date?: string;
  pricedAt?: string;
  close?: number;
  adjClose?: number;
  price?: number;
  value?: number;
}>;

type ProventoAPI = {
  valor: number;
  data: Date | string;
  tipo: string;
};

interface CarteiraComparacaoIndicesProps {
  ativosAtualizados: any[];
  proventosCompletos: Map<string, ProventoAPI[]>;
  isMobile: boolean;
  formatCurrency: (valor: number) => string;
  indicesPersonalizados?: IndiceConfig[];
}

const RANGE_CONFIG: Record<RangeKey, { label: string; range: string }> = {
  '2y': { label: '2 anos', range: '2y' },
  '5y': { label: '5 anos', range: '5y' },
  '10y': { label: '10 anos', range: '10y' }
};

const SERIES_COLORS = {
  carteira: '#ef4444',
  smll: '#f59e0b',
  ibov: '#0ea5e9',
  cdi: '#0f766e',
  ifix: '#16a34a',
  sp500: '#6366f1'
};

const DEFAULT_INDICES: IndiceConfig[] = [
  { ticker: 'SMAL11', label: 'SMLL', color: SERIES_COLORS.smll, tipo: 'historico' },
  { ticker: '^BVSP', label: 'IBOV', color: SERIES_COLORS.ibov, tipo: 'historico' },
  { ticker: 'XFIX11', label: 'IFIX', color: SERIES_COLORS.ifix, tipo: 'historico' },
  { ticker: 'CDI', label: 'CDI', color: SERIES_COLORS.cdi, tipo: 'cdi' }
];

const INVESTIMENTO_BASE = 1000;

const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Map<string, { data: any; timestamp: number }>();

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
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

const converterDataBR = (dataBR: string): number => {
  const [dia, mes, ano] = dataBR.split('/');
  return new Date(`${ano}-${mes}-${dia}`).getTime();
};

const calcularRange = (dataMaisAntiga: number): RangeKey => {
  const anosAtras = (Date.now() - dataMaisAntiga) / (365 * 24 * 60 * 60 * 1000);

  if (anosAtras <= 2) return '2y';
  if (anosAtras <= 5) return '5y';
  return '10y';
};

const extrairHistorico = (dados?: HistoricoBruto | null): HistoricoPonto[] => {
  if (!Array.isArray(dados)) return [];

  return dados
    .map(item => ({
      date: normalizarData(item.date ?? item.pricedAt),
      close: item.close ?? item.adjClose ?? item.price ?? item.value
    }))
    .filter(ponto => typeof ponto.date === 'number' && typeof ponto.close === 'number' && ponto.close > 0)
    .sort((a, b) => a.date - b.date) as HistoricoPonto[];
};

const buscarHistorico = async (
  ticker: string,
  range: RangeKey,
  signal?: AbortSignal
): Promise<HistoricoPonto[]> => {
  const cacheKey = `historico:${ticker}:${range}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const historicoUrl = `/api/brapi/quote?tickers=${ticker}&range=max&interval=1d`;
  const response = await fetch(historicoUrl, {
    method: 'GET',
    headers: API_CONFIG.DEFAULT_HEADERS,
    signal
  });

  if (!response.ok) throw new Error(`BRAPI ${ticker} histórico: ${response.status}`);

  const payloadHistorico = await response.json();
  const historicoRaw =
    payloadHistorico?.results?.[0]?.historicalDataPrice ||
    payloadHistorico?.results?.[0]?.historicalData ||
    payloadHistorico?.results?.[0]?.prices ||
    [];

  if (!Array.isArray(historicoRaw)) {
    console.warn('Histórico retornou dados inválidos');
    return [];
  }

  const historico = extrairHistorico(historicoRaw);

  const agora = Date.now();
  const anosEmMillis =
    range === '2y'
      ? 2 * 365 * 24 * 60 * 60 * 1000
      : range === '5y'
        ? 5 * 365 * 24 * 60 * 60 * 1000
        : 10 * 365 * 24 * 60 * 60 * 1000;

  const dataCorte = agora - anosEmMillis;
  const historicoFiltrado = historico.filter(ponto => ponto.date >= dataCorte);

  setCachedData(cacheKey, historicoFiltrado);
  return historicoFiltrado;
};

const buscarHistoricoComDividendos = async (
  ticker: string,
  range: RangeKey,
  signal?: AbortSignal
): Promise<{ historico: HistoricoPonto[]; dividendos: DividendoPonto[] }> => {
  const cacheKey = `historico-div:${ticker}:${range}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

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
  const historicoRaw =
    payloadHistorico?.results?.[0]?.historicalDataPrice ||
    payloadHistorico?.results?.[0]?.historicalData ||
    payloadHistorico?.results?.[0]?.prices ||
    [];

  if (!Array.isArray(historicoRaw)) {
    console.warn('Histórico retornou dados inválidos');
    const resultadoInvalido = { historico: [], dividendos };
    setCachedData(cacheKey, resultadoInvalido);
    return resultadoInvalido;
  }

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

  const historicoExtraido = extrairHistorico(historicoRaw);
  const agora = Date.now();
  const anosEmMillis =
    range === '2y'
      ? 2 * 365 * 24 * 60 * 60 * 1000
      : range === '5y'
        ? 5 * 365 * 24 * 60 * 60 * 1000
        : 10 * 365 * 24 * 60 * 60 * 1000;

  const dataCorte = agora - anosEmMillis;
  const historicoFiltrado = historicoExtraido.filter(ponto => ponto.date >= dataCorte);

  const resultado = { historico: historicoFiltrado, dividendos };
  setCachedData(cacheKey, resultado);
  return resultado;
};

const buscarCDI = async (range: RangeKey, signal?: AbortSignal): Promise<HistoricoPonto[]> => {
  const cacheKey = `cdi:${range}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const hoje = new Date();
  const dataFinal = dayjs(hoje).format('DD/MM/YYYY');
  const dataInicial = dayjs(hoje).subtract(range === '2y' ? 2 : range === '5y' ? 5 : 10, 'year').format('DD/MM/YYYY');

  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`CDI: ${response.status}`);

  const data = await response.json();
  const taxas = data.map((item: { data: string; valor: string }) => ({
    date: converterDataBR(item.data),
    value: parseFloat(item.valor)
  }));

  let indice = 100;
  const historico = taxas
    .sort((a: { date: number }, b: { date: number }) => a.date - b.date)
    .map((ponto: { date: number; value: number }) => {
      indice = indice * (1 + ponto.value / 100);
      return { date: ponto.date, close: indice } as HistoricoPonto;
    });

  setCachedData(cacheKey, historico);
  return historico;
};

const aplicarDividendosComReinvestimento = (historico: HistoricoPonto[], dividendos: DividendoPonto[]) => {
  if (historico.length === 0) return { data: [], retornoFinal: 0 };

  const dividendosOrdenados = [...dividendos].sort((a, b) => a.date - b.date);
  let indiceDividendo = 0;
  let cotas = 1;
  const precoInicial = historico[0].close;

  const data = historico.map(ponto => {
    while (indiceDividendo < dividendosOrdenados.length && dividendosOrdenados[indiceDividendo].date <= ponto.date) {
      const valorDividendo = dividendosOrdenados[indiceDividendo].valor;
      if (valorDividendo && ponto.close > 0) {
        cotas += valorDividendo / ponto.close;
      }
      indiceDividendo += 1;
    }

    const valorAtual = ponto.close * cotas;
    const retornoPercentual = ((valorAtual - precoInicial) / precoInicial) * 100;
    return { x: ponto.date, y: retornoPercentual };
  });

  const ultimoValor = historico[historico.length - 1].close * cotas;
  const retornoFinal = ((ultimoValor - precoInicial) / precoInicial) * 100;

  return { data, retornoFinal };
};

const calcularRetornoSerie = (historico: HistoricoPonto[]) => {
  if (historico.length === 0) return { data: [], retornoFinal: 0 };
  const precoInicial = historico[0].close;
  const data = historico.map(ponto => ({
    x: ponto.date,
    y: ((ponto.close - precoInicial) / precoInicial) * 100
  }));
  const retornoFinal = ((historico[historico.length - 1].close - precoInicial) / precoInicial) * 100;

  return { data, retornoFinal };
};

const obterUltimoPontoMensal = (pontos: DataPoint[]): DataPoint[] => {
  const ultimoPorMes = new Map<string, DataPoint>();

  pontos.forEach(ponto => {
    const chaveMes = dayjs(ponto.x).format('YYYY-MM');
    const existente = ultimoPorMes.get(chaveMes);
    if (!existente || ponto.x > existente.x) {
      ultimoPorMes.set(chaveMes, ponto);
    }
  });

  return Array.from(ultimoPorMes.values()).sort((a, b) => a.x - b.x);
};

const gerarMeses = (inicio: number, fim: number): number[] => {
  const meses: number[] = [];
  let cursor = dayjs(inicio).startOf('month');
  const fimDate = dayjs(fim).endOf('month');

  while (cursor.isBefore(fimDate) || cursor.isSame(fimDate)) {
    meses.push(cursor.endOf('month').valueOf());
    cursor = cursor.add(1, 'month');
  }

  return meses;
};

const alinharSeries = (series: Serie[]): Serie[] => {
  if (series.length === 0) return series;

  const inicioComum = Math.max(...series.map(serie => (serie.data || [])[0]?.x ?? 0));

  return series
    .map(serie => {
      const dataFiltrada = (serie.data || []).filter(ponto => ponto.x >= inicioComum);
      if (dataFiltrada.length === 0) return null;

      return {
        ...serie,
        data: dataFiltrada,
        retorno: dataFiltrada[dataFiltrada.length - 1]?.y ?? 0
      } as Serie;
    })
    .filter(Boolean) as Serie[];
};

const formatarPercentual = (valor?: number | null) => {
  if (typeof valor !== 'number' || Number.isNaN(valor)) return '';
  return `${valor >= 0 ? '+' : ''}${valor.toFixed(2)}%`;
};

const formatarData = (valor?: number | null) => {
  if (typeof valor !== 'number' || Number.isNaN(valor)) return '';
  return dayjs(valor).format('DD/MM/YY');
};

const obterLabelIndice = (indice: IndiceConfig) => {
  const label = typeof indice.label === 'string' ? indice.label.trim() : '';
  return label || indice.ticker;
};

const calcularPerformanceHistoricaCarteira = async (
  ativosAtualizados: any[],
  proventosCompletos: Map<string, ProventoAPI[]>,
  range: RangeKey,
  signal?: AbortSignal
): Promise<DataPoint[]> => {
  if (!Array.isArray(ativosAtualizados)) return [];
  const ativosAtivos = ativosAtualizados.filter(ativo => !ativo.posicaoEncerrada);
  if (ativosAtivos.length === 0) return [];

  const resultados = await Promise.allSettled(
    ativosAtivos.map(async ativo => {
      const historico = await buscarHistorico(ativo.ticker, range, signal);
      const dataEntrada = converterDataBR(ativo.dataEntrada);
      const historicoFiltrado = historico.filter(ponto => ponto.date >= dataEntrada);

      const proventosHistorico = proventosCompletos.get(ativo.ticker) || [];
      const dividendos: DividendoPonto[] = proventosHistorico
        .map(provento => {
          const data = typeof provento.data === 'string' ? normalizarData(provento.data) : provento.data.getTime();
          if (!data || Number.isNaN(data)) return null;
          return { date: data, valor: provento.valor } as DividendoPonto;
        })
        .filter(Boolean) as DividendoPonto[];

      const { data } = aplicarDividendosComReinvestimento(historicoFiltrado, dividendos);
      const dadosMensais = obterUltimoPontoMensal(data);

      return {
        ticker: ativo.ticker,
        dataEntrada,
        data: dadosMensais
      };
    })
  );

  const seriesAtivos = resultados
    .filter(
      (resultado): resultado is PromiseFulfilledResult<{ ticker: string; dataEntrada: number; data: DataPoint[] }> =>
        resultado.status === 'fulfilled' && resultado.value.data.length > 0
    )
    .map(resultado => resultado.value);

  if (seriesAtivos.length === 0) return [];

  const dataMaisAntiga = Math.min(...seriesAtivos.map(serie => serie.dataEntrada));
  const meses = gerarMeses(dataMaisAntiga, Date.now());

  return meses.map(mesTimestamp => {
    let soma = 0;
    let count = 0;

    seriesAtivos.forEach(serie => {
      if (serie.dataEntrada > mesTimestamp) return;

      const ponto = [...(serie.data || [])]
        .filter(item => item.x <= mesTimestamp)
        .slice(-1)[0];

      if (ponto) {
        soma += ponto.y;
        count += 1;
      }
    });

    return {
      x: mesTimestamp,
      y: count > 0 ? soma / count : 0
    };
  });
};

const CarteiraComparacaoIndices: React.FC<CarteiraComparacaoIndicesProps> = ({
  ativosAtualizados = [],
  proventosCompletos,
  isMobile,
  formatCurrency,
  indicesPersonalizados
}) => {
  const ativosValidados = Array.isArray(ativosAtualizados) ? ativosAtualizados : [];
  const ativosAtivos = useMemo(
    () => ativosValidados.filter(ativo => !ativo.posicaoEncerrada),
    [ativosValidados]
  );

  const dataMaisAntiga = useMemo(() => {
    const datas = ativosAtivos
      .filter(ativo => ativo.dataEntrada)
      .map(ativo => converterDataBR(ativo.dataEntrada))
      .filter(timestamp => !Number.isNaN(timestamp));

    if (datas.length === 0) return Date.now();

    return Math.min(...datas);
  }, [ativosAtivos]);

  const rangePadrao = useMemo(() => calcularRange(dataMaisAntiga), [dataMaisAntiga]);

  const [range, setRange] = useState<RangeKey>(rangePadrao);
  const [series, setSeries] = useState<Serie[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [indicesStatus, setIndicesStatus] = useState<Array<{ ticker: string; sucesso: boolean }>>([]);

  const rangeRef = useRef<RangeKey>('2y');
  const indicesParaBuscar = useMemo(() => indicesPersonalizados ?? DEFAULT_INDICES, [indicesPersonalizados]);

  useEffect(() => {
    if (rangeRef.current !== rangePadrao) {
      rangeRef.current = rangePadrao;
      setRange(rangePadrao);
    }
  }, [rangePadrao]);

  useEffect(() => {
    if (ativosAtivos.length === 0) return;

    const controller = new AbortController();

    const carregar = async () => {
      setLoading(true);
      setErro(null);
      setAviso(null);

      try {
        const carteiraSeries = await calcularPerformanceHistoricaCarteira(
          ativosAtivos,
          proventosCompletos,
          range,
          controller.signal
        );

        const resultados = await Promise.allSettled(
          indicesParaBuscar.map(async indice => {
            if (indice.tipo === 'cdi') {
              const historico = await buscarCDI(range, controller.signal);
              return {
                name: obterLabelIndice(indice),
                color: indice.color,
                data: calcularRetornoSerie(historico).data
              };
            }

            const { historico, dividendos } = await buscarHistoricoComDividendos(
              indice.ticker,
              range,
              controller.signal
            );
            const { data } = aplicarDividendosComReinvestimento(historico, dividendos);
            return { name: obterLabelIndice(indice), color: indice.color, data };
          })
        );

        const status = resultados.map((resultado, index) => ({
          ticker: obterLabelIndice(indicesParaBuscar[index]),
          sucesso: resultado.status === 'fulfilled' && resultado.value.data.length > 0
        }));

        setIndicesStatus(status);

        const seriesIndices = resultados
          .filter(
            (resultado): resultado is PromiseFulfilledResult<{ name: string; color: string; data: DataPoint[] }> =>
              resultado.status === 'fulfilled' && resultado.value.data.length > 0
          )
          .map(resultado => ({
            name: resultado.value.name,
            color: resultado.value.color,
            data: resultado.value.data,
            retorno: resultado.value.data[resultado.value.data.length - 1].y
          }));

        const seriesCompletas = alinharSeries([
          {
            name: 'Carteira',
            color: SERIES_COLORS.carteira,
            data: carteiraSeries,
            retorno: carteiraSeries[carteiraSeries.length - 1]?.y ?? 0
          },
          ...seriesIndices
        ]);

        if (seriesCompletas.length === 0) {
          setErro('Não encontramos histórico suficiente para comparar a carteira.');
          setSeries([]);
        } else {
          if (seriesCompletas.length < indicesParaBuscar.length + 1) {
            setAviso('Alguns índices não estão disponíveis no momento.');
          }
          setSeries(seriesCompletas);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setErro('Não conseguimos carregar o comparativo agora. Tente novamente em instantes.');
          setSeries([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    carregar();

    return () => controller.abort();
  }, [ativosAtivos, proventosCompletos, range, indicesParaBuscar]);

  const resumoInvestimento = useMemo(
    () =>
      series
        .map(item => ({
          name: item.name,
          color: item.color,
          retorno: item.retorno,
          valorFinal: INVESTIMENTO_BASE * (1 + item.retorno / 100)
        }))
        .sort((a, b) => b.retorno - a.retorno),
    [series]
  );

  const chartSeries = useMemo(
    () =>
      series
        .filter(serie => serie && Array.isArray(serie.data) && serie.data.length > 0)
        .map(serie => ({
          name: serie.name,
          data: serie.data.filter(ponto => ponto && Number.isFinite(ponto.x) && Number.isFinite(ponto.y))
        }))
        .filter(serie => serie.data.length > 0),
    [series]
  );

  const chartColors = useMemo(() => {
    const seriesNames = chartSeries.map(s => s.name);
    return series
      .filter(item => seriesNames.includes(item.name))
      .map(item => item.color)
      .filter(c => typeof c === 'string');
  }, [series, chartSeries]);

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
      colors: chartColors,
      markers: { size: 0 },
      xaxis: {
        type: 'datetime',
        labels: {
          format: 'MM/yy',
          style: { fontSize: isMobile ? '10px' : '12px' }
        }
      },
      yaxis: {
        labels: {
          formatter: (valor: number) => {
            if (typeof valor !== 'number' || Number.isNaN(valor)) return '';
            return `${valor.toFixed(0)}%`;
          },
          style: { fontSize: isMobile ? '10px' : '12px' }
        }
      },
      grid: { strokeDashArray: 4 },
      tooltip: {
        shared: true,
        intersect: false,
        x: { formatter: (valor: number) => formatarData(valor) },
        y: { formatter: (valor: number) => formatarPercentual(valor) }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: isMobile ? '11px' : '12px',
        markers: { width: 12, height: 12 }
      }
    }),
    [chartColors, isMobile]
  );

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
              Comparação da Carteira com Índices
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
            Acompanhe como a carteira performou frente aos principais benchmarks (retorno total com reinvestimento de dividendos).
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

      {aviso && !erro && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 14px',
            background: '#fffbeb',
            border: '1px solid #fed7aa',
            color: '#9a3412',
            borderRadius: '10px',
            fontWeight: 600
          }}
        >
          {aviso}
        </div>
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
        ) : chartSeries.length > 0 ? (
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
            Sem dados suficientes para exibir o gráfico.
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
            Se você tivesse investido {formatCurrency(INVESTIMENTO_BASE)}
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
                  {(item.name || 'IDX').slice(0, 4).toUpperCase()}
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
                      {item.name || 'Índice'}
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
                    {formatCurrency(item.valorFinal)} após o período selecionado.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {indicesStatus.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            color: '#64748b',
            fontSize: '12px'
          }}
        >
          {indicesStatus.some(status => !status.sucesso)
            ? 'Alguns índices não estão disponíveis no momento.'
            : 'Todos os índices estão disponíveis.'}
        </div>
      )}
    </div>
  );
};

export default CarteiraComparacaoIndices;
