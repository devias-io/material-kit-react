'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDataStore } from '@/hooks/useDataStore';

type StepCard = {
  title: string;
  description: string;
  items: string[];
};

type CarteiraResumo = {
  label: string;
  value: string;
  helper?: string;
};

const weeklySteps: StepCard[] = [
  {
    title: 'Segunda-feira – Preparação',
    description:
      'Revise o panorama do índice, volatilidade implícita e o calendário da semana.',
    items: [
      'Checar agenda de eventos relevantes (resultados, dividendos, FED).',
      'Atualizar watchlist com ativos elegíveis e strikes preferenciais.',
      'Definir o capital disponível e a meta de prêmio para a semana.'
    ]
  },
  {
    title: 'Terça a Quinta-feira – Execução',
    description:
      'Acompanhe as recomendações liberadas e ajuste o preço de entrada conforme o mercado.',
    items: [
      'Abrir posições recomendadas respeitando os limites de margem informados.',
      'Atualizar o controle de operações com preço de disparo, alvo e plano de ajuste.',
      'Configurar alertas no Profit para cada ponto de atenção (stop, ajuste, rolagem).'
    ]
  },
  {
    title: 'Sexta-feira – Revisão',
    description:
      'Encerramento das operações e planejamento para o próximo ciclo.',
    items: [
      'Revisar posições abertas e decidir entre manter, ajustar ou encerrar.',
      'Registrar resultados, prêmios recebidos e lições aprendidas na semana.',
      'Enviar dúvidas com prints/timestamps das aulas para receber orientação personalizada.'
    ]
  }
];

const quickActions = [
  'Configurar alertas de margem para não ser pego de surpresa pelo corretor.',
  'Utilizar a planilha de controle (download disponível no grupo) para registrar cada operação.',
  'Rever a aula correspondente sempre que surgir uma situação não prevista.',
  'Avisar o suporte em até 30 minutos após um evento inesperado para receber plano de ação.'
];

const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 900);
    update();

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return isMobile;
};

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9,-]/g, '').replace(',', '.');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }

  const rounded = Number(value.toFixed(2));
  return `${rounded.toString().replace('.', ',')}%`;
};

export default function CfRendaTurbinadaCarteiraPage(): React.JSX.Element {
  const router = useRouter();
  const {
    dados,
    cotacoes,
    buscarCotacoes,
    loading,
    isLoading
  } = useDataStore();

  const isMobile = useDeviceDetection();

  const ativosOriginais = React.useMemo(() => {
    return Array.isArray(dados?.cfRendaTurbinada) ? dados.cfRendaTurbinada : [];
  }, [dados?.cfRendaTurbinada]);

  React.useEffect(() => {
    const tickers = Array.from(
      new Set(
        ativosOriginais
          .map((ativo: any) => ativo?.ticker)
          .filter((ticker): ticker is string => Boolean(ticker))
      )
    );

    if (tickers.length > 0) {
      buscarCotacoes(tickers);
    }
  }, [ativosOriginais, buscarCotacoes]);

  const ativosProcessados = React.useMemo(() => {
    return ativosOriginais
      .map((ativo: any, index: number) => {
        const precoEntrada = parseNumber(ativo?.precoEntrada);
        const precoAtualCotacao = ativo?.ticker ? parseNumber(cotacoes?.[ativo.ticker]) : null;
        const precoAtualInformado = parseNumber(ativo?.precoAtual);
        const precoAtual = precoAtualCotacao ?? precoAtualInformado ?? null;
        const precoTeto = parseNumber(ativo?.precoTeto);
        const dy = ativo?.dy ?? ativo?.dy12m ?? null;
        const vies = ativo?.vies ?? ativo?.viés ?? ativo?.bias ?? null;

        let performance: number | null = null;
        if (precoEntrada && precoAtual) {
          performance = ((precoAtual - precoEntrada) / precoEntrada) * 100;
        }

        return {
          id: ativo?.id ?? `cf-${index}`,
          posicao: ativo?.posicaoExibicao ?? ativo?.ordem ?? index + 1,
          ticker: ativo?.ticker || '--',
          setor: ativo?.setor || 'N/A',
          dataEntrada: ativo?.dataEntrada || '--',
          precoEntrada,
          precoAtual,
          precoTeto,
          performance,
          dy,
          vies,
          posicaoEncerrada: Boolean(ativo?.posicaoEncerrada)
        };
      })
      .sort((a, b) => a.posicao - b.posicao);
  }, [ativosOriginais, cotacoes]);

  const totaisCarteira = React.useMemo<CarteiraResumo[]>(() => {
    const totalOperacoes = ativosProcessados.length;
    const abertas = ativosProcessados.filter((ativo) => !ativo.posicaoEncerrada).length;
    const encerradas = totalOperacoes - abertas;
    const mediaPerformance = ativosProcessados.reduce<
      { soma: number; count: number }
    >(
      (acc, ativo) => {
        if (ativo.performance !== null && !Number.isNaN(ativo.performance)) {
          acc.soma += ativo.performance;
          acc.count += 1;
        }
        return acc;
      },
      { soma: 0, count: 0 }
    );

    const performanceMedia = mediaPerformance.count > 0
      ? mediaPerformance.soma / mediaPerformance.count
      : null;

    return [
      {
        label: 'Operações abertas',
        value: abertas.toString(),
        helper: 'Posições em acompanhamento nesta semana'
      },
      {
        label: 'Operações encerradas',
        value: encerradas.toString(),
        helper: 'Com controle de rolagens e encerramentos'
      },
      {
        label: 'Performance média',
        value: formatPercentage(performanceMedia),
        helper: 'Calculada sobre entradas com preço atualizado'
      }
    ];
  }, [ativosProcessados]);

  const isLoadingCarteira = loading || isLoading;
  const carteiraVazia = !isLoadingCarteira && ativosProcessados.length === 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '24px'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard/cf-renda-turbinada')}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← Voltar para o plano
          </button>

          <div>
            <h1
              style={{
                fontSize: '42px',
                fontWeight: 800,
                color: '#1e293b',
                margin: '0 0 12px 0'
              }}
            >
              Carteira Recomendada
            </h1>
            <p
              style={{
                color: '#64748b',
                fontSize: '18px',
                margin: 0,
                maxWidth: '760px',
                lineHeight: 1.6
              }}
            >
              Acompanhe as operações sugeridas semanalmente para gerar renda com opções. Este painel concentra o status
              das posições, métricas de performance e os próximos passos para execução disciplinada.
            </p>
          </div>
        </div>

        <section
          style={{
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '24px',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ maxWidth: isMobile ? '100%' : '55%' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Como funciona a carteira</h2>
            <p style={{ margin: '12px 0 0 0', fontSize: '16px', lineHeight: 1.6 }}>
              Todo ciclo começa com a análise macro + técnica apresentada nas aulas. As recomendações ficam disponíveis nos
              canais oficiais do CF e são atualizadas sempre que houver oportunidade melhor ou necessidade de ajuste.
            </p>
            <ul style={{ margin: '16px 0 0 16px', padding: 0, fontSize: '14px', lineHeight: 1.6 }}>
              <li>Operações priorizam riscos conhecidos, com foco em geração de prêmio consistente.</li>
              <li>Você recebe aviso sempre que uma posição for aberta, ajustada ou encerrada.</li>
              <li>Atenção ao limite de contratos indicado para evitar alavancagem excessiva.</li>
            </ul>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '12px',
              minWidth: isMobile ? '100%' : '320px'
            }}
          >
            {totaisCarteira.map((item) => (
              <div
                key={item.label}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.45)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '12px',
                  padding: '16px'
                }}
              >
                <div style={{ fontSize: '12px', textTransform: 'uppercase', opacity: 0.8 }}>{item.label}</div>
                <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{item.value}</div>
                {item.helper && (
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px', lineHeight: 1.4 }}>{item.helper}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
              Rotina semanal sugerida
            </h2>
            <p style={{ margin: 0, color: '#475569', fontSize: '15px' }}>
              Siga este checklist para manter a disciplina e aproveitar cada operação com tranquilidade.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {weeklySteps.map((step) => (
              <div
                key={step.title}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#f8fafc'
                }}
              >
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{step.title}</h3>
                <p style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                  {step.description}
                </p>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#1f2937', fontSize: '14px', lineHeight: 1.6 }}>
                  {step.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
                Operações do CF Renda Turbinada
              </h2>
              <p style={{ margin: '6px 0 0 0', color: '#475569', fontSize: '14px' }}>
                Inseridas automaticamente via <strong>Dashboard &gt; Gerenciamento</strong>. Utilize esse painel para validar preços
                antes de executar no Profit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/dashboard/gerenciamento')}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '999px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)'
              }}
            >
              Ir para gerenciamento →
            </button>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            {isLoadingCarteira ? (
              <div
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '14px'
                }}
              >
                Carregando operações do plano...
              </div>
            ) : carteiraVazia ? (
              <div
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '14px',
                  border: '1px dashed #cbd5f5',
                  borderRadius: '12px'
                }}
              >
                Nenhuma operação cadastrada ainda. Cadastre no painel de gerenciamento para ativar esta visualização.
              </div>
            ) : isMobile ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                {ativosProcessados.map((ativo) => (
                  <div
                    key={ativo.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>{ativo.ticker}</div>
                      <span
                        style={{
                          fontSize: '12px',
                          color: ativo.posicaoEncerrada ? '#ef4444' : '#0ea5e9',
                          fontWeight: 600,
                          backgroundColor: ativo.posicaoEncerrada ? '#fee2e2' : '#e0f2fe',
                          padding: '2px 8px',
                          borderRadius: '999px'
                        }}
                      >
                        {ativo.posicaoEncerrada ? 'Encerrada' : 'Aberta'}
                      </span>
                    </div>
                    <div style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>{ativo.setor}</div>
                    <div style={{ display: 'grid', gap: '8px', marginTop: '12px', fontSize: '13px', color: '#0f172a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Entrada</span>
                        <strong>{ativo.dataEntrada}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Preço inicial</span>
                        <strong>{formatCurrency(ativo.precoEntrada)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Preço atual</span>
                        <strong>{formatCurrency(ativo.precoAtual)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Preço teto</span>
                        <strong>{formatCurrency(ativo.precoTeto)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Performance</span>
                        <strong
                          style={{
                            color: ativo.performance !== null && ativo.performance < 0 ? '#ef4444' : '#10b981'
                          }}
                        >
                          {formatPercentage(ativo.performance)}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>DY 12M</span>
                        <strong>{typeof ativo.dy === 'string' ? ativo.dy : formatPercentage(parseNumber(ativo.dy))}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Viés</span>
                        <strong>{ativo.vies || '--'}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>#</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: '14px' }}>ATIVO</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>ENTRADA</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>PREÇO INICIAL</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>PREÇO ATUAL</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>PREÇO TETO</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>
                        PERFORMANCE TOTAL
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>DY 12M</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>VIÉS</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ativosProcessados.map((ativo) => (
                      <tr
                        key={ativo.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '14px',
                              color: '#64748b',
                              margin: '0 auto'
                            }}
                          >
                            {ativo.posicao}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{ativo.ticker}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{ativo.setor}</div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>{ativo.dataEntrada}</td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>
                          {formatCurrency(ativo.precoEntrada)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>
                          {formatCurrency(ativo.precoAtual)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>
                          {formatCurrency(ativo.precoTeto)}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center',
                          fontSize: '14px',
                          fontWeight: 700,
                          color: ativo.performance !== null && ativo.performance < 0 ? '#ef4444' : '#10b981'
                        }}>
                          {formatPercentage(ativo.performance)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>
                          {typeof ativo.dy === 'string' ? ativo.dy : formatPercentage(parseNumber(ativo.dy))}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>
                          {ativo.vies || '--'}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: ativo.posicaoEncerrada ? '#b91c1c' : '#0f766e',
                              backgroundColor: ativo.posicaoEncerrada ? '#fee2e2' : '#ccfbf1'
                            }}
                          >
                            {ativo.posicaoEncerrada ? 'Encerrada' : 'Aberta'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section
          style={{
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Checklist de execução rápida</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {quickActions.map((action) => (
              <div
                key={action}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.55)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  fontSize: '14px',
                  lineHeight: 1.6
                }}
              >
                {action}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
