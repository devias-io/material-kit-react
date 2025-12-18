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

type Dividendo = {
  date: number;
  valor: number;
};

type SeriePreparada = {
  name: string;
  color: string;
  data: { x: number; y: number }[];
  retornoSemDividendos: number;
  retornoComDividendos: number;
  tipo: SerieTipo;
  totalDividendos: number;
};

type HistoricoBruto = Array<{
  date?: string;
  pricedAt?: string;
  close?: number;
  adjClose?: number;
  price?: number;
  value?: number;
}>;

type DividendoBruto = Array<{
  paymentDate?: string;
  date?: string;
  rate?: number;
  value?: number;
}>;

const INVESTIMENTO_BASE = 1000;

const RANGE_CONFIG: Record<RangeKey, { label: string; range: string; interval: string; diasAtras: number }> = {
  '2y': { label: '2 anos', range: '2y', interval: '1mo', diasAtras: 730 },
  '5y': { label: '5 anos', range: '5y', interval: '1mo', diasAtras: 1825 },
  '10y': { label: '10 anos', range: '10y', interval: '1mo', diasAtras: 3650 }
};

const INDICES_CONFIG = [
  { ticker: '^BVSP', label: 'IBOV', color: '#0ea5e9', tipo: 'indice' as SerieTipo },
  { ticker: 'IFIX.SA', label: 'IFIX', color: '#16a34a', tipo: 'indice' as SerieTipo },
  { ticker: 'IVVB11', label: 'IVVB11', color: '#a855f7', tipo: 'indice' as SerieTipo }
];

// ✅ Extrair histórico de preços
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

// ✅ Extrair dividendos
const extrairDividendos = (dados: DividendoBruto, dataInicio: number, dataFim: number): Dividendo[] => {
  if (!Array.isArray(dados)) return [];

  return dados
    .map(item => {
      const dateStr = item.paymentDate || item.date;
      if (!dateStr) return null;

      const date = new Date(dateStr).getTime();
      const valor = item.rate ?? item.value ?? 0;

      if (date < dataInicio || date > dataFim || valor <= 0) return null;

      return { date, valor };
    })
    .filter(Boolean)
    .sort((a, b) => a!.date - b!.date) as Dividendo[];
};

// ✅ Buscar histórico + dividendos
const buscarDadosCompletos = async (
  ticker: string,
  range: RangeKey,
  signal?: AbortSignal
): Promise<{ historico: HistoricoPonto[]; dividendos: Dividendo[] }> => {
  const { range: rangeParam, interval, diasAtras } = RANGE_CONFIG[range];
  
  const url = `${API_CONFIG.ENDPOINTS.BRAPI_HISTORICAL}/${ticker}?range=${rangeParam}&interval=${interval}&dividends=true&token=${API_CONFIG.BRAPI_TOKEN}`;

  const resposta = await fetch(url, {
    method: 'GET',
    headers: API_CONFIG.DEFAULT_HEADERS,
    signal
  });

  if (!resposta.ok) {
    throw new Error(`BRAPI ${ticker}: ${resposta.status}`);
  }

  const payload = await resposta.json();
  const resultado = payload?.results?.[0];

  if (!resultado) {
    throw new Error(`Sem dados para ${ticker}`);
  }

  // Histórico de preços
  const historicoBruto =
    resultado.historicalDataPrice ||
    resultado.historicalData ||
    resultado.prices ||
    [];

  const historico = extrairHistorico(historicoBruto);

  // Dividendos
  const dataInicio = Date.now() - diasAtras * 24 * 60 * 60 * 1000;
  const dataFim = Date.now();

  const dividendosBruto =
    resultado.dividendsData?.cashDividends ||
    resultado.dividends ||
    [];

  const dividendos = extrairDividendos(dividendosBruto, dataInicio, dataFim);

  return { historico, dividendos };
};

// 🔥 ALGORITMO DE REINVESTIMENTO DE DIVIDENDOS
const calcularRetornoComReinvestimento = (
  historico: HistoricoPonto[],
  dividendos: Dividendo[],
  investimentoInicial: number
): { retornoComDividendos: number; retornoSemDividendos: number; totalDividendos: number } => {
  if (historico.length < 2) {
    return { retornoComDividendos: 0, retornoSemDividendos: 0, totalDividendos: 0 };
  }

  const precoInicial = historico[0].close;
  const precoFinal = historico[historico.length - 1].close;

  // Retorno sem dividendos (só price appreciation)
  const retornoSemDividendos = ((precoFinal - precoInicial) / precoInicial) * 100;

  // Simular compra inicial
  let cotas = investimentoInicial / precoInicial;
  let totalDividendosRecebidos = 0;

  // Para cada dividendo pago
  for (const div of dividendos) {
    // Encontrar preço na data do dividendo (ou mais próximo)
    const pontoMaisProximo = historico.reduce((prev, curr) => {
      return Math.abs(curr.date - div.date) < Math.abs(prev.date - div.date) ? curr : prev;
    });

    const precoNaData = pontoMaisProximo.close;
    
    // Dividendo total = dividendo por cota * número de cotas
    const dividendoTotal = div.valor * cotas;
    totalDividendosRecebidos += dividendoTotal;

    // Reinvestir: comprar mais cotas com o dividendo
    const novasCotas = dividendoTotal / precoNaData;
    cotas += novasCotas;
  }

  // Patrimônio final = cotas totais * preço final
  const patrimonioFinal = cotas * precoFinal;
  const retornoComDividendos = ((patrimonioFinal - investimentoInicial) / investimentoInicial) * 100;

  return {
    retornoComDividendos,
    retornoSemDividendos,
    totalDividendos: totalDividendosRecebidos
  };
};

// ✅ Preparar séries com reinvestimento
const prepararSeriesComReinvestimento = (
  series: Array<{
    name: string;
    color: string;
    tipo: SerieTipo;
    historico: HistoricoPonto[];
    dividendos: Dividendo[];
  }>
): SeriePreparada[] => {
  // Encontrar data inicial comum
  const datasIniciais = series
    .map(s => (s.historico.length > 0 ? s.historico[0].date : 0))
    .filter(v => v > 0);

  const inicioComum = datasIniciais.length > 0 ? Math.max(...datasIniciais) : 0;

  return series
    .map(serie => {
      const historicoAlinhado = serie.historico.filter(p => p.date >= inicioComum);
      
      if (historicoAlinhado.length < 2) return null;

      const base = historicoAlinhado[0].close;
      
      // Calcular retornos
      const { retornoComDividendos, retornoSemDividendos, totalDividendos } =
        calcularRetornoComReinvestimento(
          historicoAlinhado,
          serie.dividendos,
          INVESTIMENTO_BASE
        );

      // Gerar série normalizada (usando retorno COM dividendos)
      const data = historicoAlinhado.map(ponto => ({
        x: ponto.date,
        y: ((ponto.close - base) / base) * 100 // Aproximação visual
      }));

      // Ajustar último ponto para refletir retorno real com dividendos
      if (data.length > 0) {
        data[data.length - 1].y = retornoComDividendos;
      }

      return {
        name: serie.name,
        color: serie.color,
        data,
        retornoSemDividendos,
        retornoComDividendos,
        tipo: serie.tipo,
        totalDividendos
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
        ...INDICES_CONFIG
      ];

      const resultados = await Promise.allSettled(
        ativosParaBuscar.map(async item => {
          const { historico, dividendos } = await buscarDadosCompletos(
            item.ticker,
            range,
            controller.signal
          );
          
          return {
            name: item.label,
            color: item.color,
            tipo: item.tipo,
            historico,
            dividendos
          };
        })
      );

      const seriesProcessadas = prepararSeriesComReinvestimento(
        resultados
          .filter(
            (resultado): resultado is PromiseFulfilledResult<{
              name: string;
              color: string;
              tipo: SerieTipo;
              historico: HistoricoPonto[];
              dividendos: Dividendo[];
            }> => resultado.status === 'fulfilled'
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

    carregar()
      .catch(error => {
        if (!controller.signal.aborted) {
          console.error('Erro ao carregar comparação:', error);
          setErro('Não conseguimos carregar o comparativo. Tente novamente.');
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
          retornoComDividendos: item.retornoComDividendos,
          retornoSemDividendos: item.retornoSemDividendos,
          valorFinal: INVESTIMENTO_BASE * (1 + item.retornoComDividendos / 100),
          totalDividendos: item.totalDividendos,
          tipo: item.tipo
        }))
        .sort((a, b) => b.retornoComDividendos - a.retornoComDividendos),
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
      {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                background: '#dcfce7',
                color: '#166534',
                borderRadius: '999px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              🔄 Reinvestindo dividendos
            </span>
          </div>
          <p
            style={{
              margin: '6px 0 0',
              color: '#475569',
              fontSize: isMobile ? '12px' : '13px'
            }}
          >
            Retorno total incluindo reinvestimento automático de todos os dividendos recebidos.
          </p>
        </div>

        {/* Filtros de período */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* Erro */}
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

      {/* Gráfico */}
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

      {/* Resumo de investimento */}
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
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '10px'
            }}
          >
            {resumoInvestimento.map(item => (
              <div
                key={item.name}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  background: '#f8fafc',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '12px',
                    flexShrink: 0
                  }}
                >
                  {item.name.slice(0, 4).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px'
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
                        color: item.retornoComDividendos >= 0 ? '#16a34a' : '#dc2626',
                        fontSize: '14px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formatarPercentual(item.retornoComDividendos)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '4px 0 0',
                      color: '#475569',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  >
                    {formatCurrency(item.valorFinal, moeda)} hoje
                  </p>

                  {item.totalDividendos > 0 && (
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '11px',
                        color: '#059669',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>💰</span>
                      <span>
                        {formatCurrency(item.totalDividendos, moeda)} em dividendos reinvestidos
                      </span>
                    </div>
                  )}

                  {/* Comparativo: com vs sem dividendos */}
                  {Math.abs(item.retornoComDividendos - item.retornoSemDividendos) > 1 && (
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '11px',
                        color: '#64748b',
                        fontStyle: 'italic'
                      }}
                    >
                      Sem reinvestir: {formatarPercentual(item.retornoSemDividendos)}
                    </div>
                  )}
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
