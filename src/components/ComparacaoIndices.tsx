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

const INVESTIMENTO_BASE = 1000;

const RANGE_CONFIG: Record<RangeKey, { label: string; range: string; interval: string }> = {
  '2y': { label: '2 anos', range: '2y', interval: '1mo' },
  '5y': { label: '5 anos', range: '5y', interval: '1mo' },
  '10y': { label: '10 anos', range: '10y', interval: '1mo' }
};

const INDICES_PADRAO = [
  { ticker: 'IBOV', label: 'IBOV', color: '#0ea5e9' },
  { ticker: 'IFIX', label: 'IFIX', color: '#16a34a' },
  { ticker: 'IVVB11', label: 'IVVB11', color: '#a855f7' }
];

const extrairHistorico = (dados: HistoricoBruto): HistoricoPonto[] => {
  if (!Array.isArray(dados)) return [];

  return dados
    .map(item => ({
      date: item.date ? new Date(item.date).getTime() : item.pricedAt ? new Date(item.pricedAt).getTime() : undefined,
      close: item.close ?? item.adjClose ?? item.price ?? item.value
    }))
    .filter(ponto => typeof ponto.date === 'number' && typeof ponto.close === 'number' && ponto.close > 0)
    .sort((a, b) => a.date - b.date) as HistoricoPonto[];
};

const buscarHistorico = async (ticker: string, range: RangeKey, signal?: AbortSignal): Promise<HistoricoPonto[]> => {
  const { range: rangeParam, interval } = RANGE_CONFIG[range];
  const url = `${API_CONFIG.ENDPOINTS.BRAPI_HISTORICAL}/${ticker}?range=${rangeParam}&interval=${interval}&token=${API_CONFIG.BRAPI_TOKEN}`;

  const resposta = await fetch(url, {
    method: 'GET',
    headers: API_CONFIG.DEFAULT_HEADERS,
    signal
  });

  if (!resposta.ok) {
    throw new Error(`BRAPI ${ticker}: ${resposta.status}`);
  }

  const payload = await resposta.json();
  const historico =
    payload?.results?.[0]?.historicalDataPrice || payload?.results?.[0]?.historicalData || payload?.results?.[0]?.prices;

  return extrairHistorico(historico);
};

const prepararSeriesAlinhadas = (series: Array<{ name: string; color: string; tipo: SerieTipo; pontos: HistoricoPonto[] }>): SeriePreparada[] => {
  const datasIniciais = series
    .map(serie => (serie.pontos.length > 0 ? serie.pontos[0].date : 0))
    .filter(valor => valor > 0);

  const inicioComum = datasIniciais.length > 0 ? Math.max(...datasIniciais) : 0;

  return series
    .map(serie => {
      const pontosValidos = serie.pontos.filter(ponto => ponto.date >= inicioComum);
      if (pontosValidos.length < 2) return null;

      const base = pontosValidos[0].close;
      if (!base) return null;

      const data = pontosValidos.map(ponto => ({
        x: ponto.date,
        y: ((ponto.close - base) / base) * 100
      }));

      const ultimo = pontosValidos[pontosValidos.length - 1];
      const retorno = ((ultimo.close - base) / base) * 100;

      return {
        name: serie.name,
        color: serie.color,
        data,
        retorno,
        tipo: serie.tipo
      } as SeriePreparada;
    })
    .filter(Boolean) as SeriePreparada[];
};

const formatarPercentual = (valor: number) => `${valor >= 0 ? '+' : ''}${valor.toFixed(2)}%`;

const formatarData = (valor: number) => dayjs(valor).format('DD/MM/YY');

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

  useEffect(() => {
    if (!ticker) return;

    const controller = new AbortController();
    const carregar = async () => {
      setLoading(true);
      setErro(null);

      const ativosParaBuscar = [
        { ticker, label: ticker, color: corAtivo, tipo: 'ativo' as SerieTipo },
        ...INDICES_PADRAO
      ];

      const resultados = await Promise.allSettled(
        ativosParaBuscar.map(async item => {
          const pontos = await buscarHistorico(item.ticker, range, controller.signal);
          return { name: item.label, color: item.color, tipo: item.tipo, pontos };
        })
      );

      const seriesProcessadas = prepararSeriesAlinhadas(
        resultados
          .filter((resultado): resultado is PromiseFulfilledResult<{ name: string; color: string; tipo: SerieTipo; pontos: HistoricoPonto[] }> =>
            resultado.status === 'fulfilled'
          )
          .map(resultado => resultado.value)
      );

      if (!controller.signal.aborted) {
        setSeries(seriesProcessadas);

        if (seriesProcessadas.length === 0) {
          setErro('Não encontramos histórico suficiente para comparar este ativo.');
        }
      }
    };

    carregar().catch(error => {
      if (!controller.signal.aborted) {
        console.error('Erro ao carregar comparação com índices:', error);
        setErro('Não conseguimos carregar o comparativo agora. Tente novamente em instantes.');
        setSeries([]);
      }
    }).finally(() => {
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
          style: { fontSize: isMobile ? '10px' : '12px' }
        }
      },
      yaxis: {
        labels: {
          formatter: (valor: number) => `${valor.toFixed(0)}%`,
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
    [series, isMobile]
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
            Acompanhe como o ativo performou frente aos principais benchmarks da bolsa.
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
        ) : series.length > 0 ? (
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
