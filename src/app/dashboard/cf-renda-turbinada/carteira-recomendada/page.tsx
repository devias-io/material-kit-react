'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

import { useAuthAccess } from '@/hooks/use-auth-access';
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

type CarteiraOperacao = {
  id: string;
  ordem: number;
  ativoBase: string;
  codigoOpcao: string;
  strike: number | null;
  premio: number | null;
  rendaPercentual: number | null;
  garantia: number | null;
  precoReferencia: number | null;
  vencimento: string;
  tipoOperacao: string;
  status: 'Aberta' | 'Encerrada';
  observacao?: string;
};

const weeklySteps: StepCard[] = [
  {
    title: 'Segunda-feira – Preparação do Terreno',
    description:
      'Reúna os insumos para a semana de operações, garantindo que capital, garantias e plataformas estejam prontos.',
    items: [
      'Checar agenda de eventos relevantes (resultados, dividendos, FED).',
      'Atualizar watchlist com ativos elegíveis, strikes preferenciais e margens necessárias.',
      'Validar garantias disponíveis e separar o capital destinado às operações da carteira.'
    ]
  },
  {
    title: 'Terça a Quinta-feira – Execução das Recomendações',
    description:
      'Acompanhe as recomendações liberadas e ajuste o preço de entrada conforme o mercado.',
    items: [
      'Abrir posições recomendadas respeitando os limites de margem informados.',
      'Atualizar o controle de operações com prêmio recebido, ponto de ajuste e plano de recompra.',
      'Configurar alertas no Profit para cada ponto de atenção (stop, ajuste, rolagem).'
    ]
  },
  {
    title: 'Sexta-feira – Revisão e Planejamento',
    description:
      'Encerramento das operações, avaliação de riscos e preparação para o próximo ciclo.',
    items: [
      'Revisar posições abertas e decidir entre manter, ajustar ou encerrar.',
      'Registrar prêmios recebidos, garantias utilizadas e lições aprendidas na semana.',
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

const reportHighlights = [
  {
    title: 'Estratégias de Opções de Mercado',
    summary:
      'Venda estruturada de puts e calls em um cenário de alta, priorizando ativos baratos e de qualidade. Reforço para iniciar com posições pequenas e utilizar os códigos enviados para operar em qualquer corretora.'
  },
  {
    title: 'Procedimentos de Opções Financeiras',
    summary:
      'São necessárias cinco operações mensais, executadas em dias diferentes. Para vender put é preciso manter a garantia na Clear; para calls, o ativo deve estar custodiado.'
  },
  {
    title: 'Opções e Estratégias de Venda',
    summary:
      'Encerrar a operação exige recompra das opções antes do vencimento, que costuma ocorrer a cada vinte dias úteis. As taxas variam conforme o patrimônio e podem ser negociadas com o assessor.'
  },
  {
    title: 'Estratégia de Opções Financeiras',
    summary:
      'Exemplo prático: ativo de R$30 para R$32 com put desvalorizando de R$1 para R$0,30, garantindo lucro de R$0,70 sem a taxa de exercício de 0,5%. Recomendações são enviadas após a atualização dos preços.'
  },
  {
    title: 'Profit Pro – Compra e Venda de Opções',
    summary:
      'Demonstração de uso do Profit Pro, incluindo Delta 30 e comparação com outras plataformas como Oblab e Opçõesnet. O sistema acompanha rentabilidade, mas stops devem ser configurados manualmente.'
  }
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
  const { loading: authLoading, hasAccessSync } = useAuthAccess();
  const hasCarteiraAccess = hasAccessSync('cf-renda-turbinada-carteira');
  const {
    dados,
    cotacoes,
    buscarCotacoes,
    loading,
    isLoading
  } = useDataStore();

  const isMobile = useDeviceDetection();

  const ativosOriginais = React.useMemo(() => {
    if (!hasCarteiraAccess) {
      return [];
    }

    return Array.isArray(dados?.cfRendaTurbinada) ? dados.cfRendaTurbinada : [];
  }, [dados?.cfRendaTurbinada, hasCarteiraAccess]);

  React.useEffect(() => {
    if (!hasCarteiraAccess) {
      return;
    }

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
  }, [ativosOriginais, buscarCotacoes, hasCarteiraAccess]);

  const operacoesProcessadas = React.useMemo<CarteiraOperacao[]>(() => {
    return ativosOriginais
      .map((ativo: any, index: number) => {
        const precoReferenciaInformado = parseNumber(
          ativo?.precoReferencia ?? ativo?.precoEntrada
        );
        const precoReferenciaCotacao = ativo?.ticker
          ? parseNumber(cotacoes?.[ativo.ticker])
          : null;
        const precoReferencia = precoReferenciaInformado ?? precoReferenciaCotacao ?? null;

        const garantiaInformada = parseNumber(
          ativo?.garantia ?? ativo?.garantiaRequerida ?? ativo?.margemRequerida ?? ativo?.valorGarantia
        );
        const garantiaCalculada = precoReferencia !== null ? precoReferencia * 100 : null;
        const garantia = garantiaInformada ?? garantiaCalculada;

        const premioEntrada = parseNumber(ativo?.premioEntrada ?? ativo?.premio);
        const premioTotal = premioEntrada !== null ? premioEntrada * 100 : null;

        const rendaInformada = parseNumber(
          ativo?.renda ?? ativo?.retorno ?? ativo?.yield ?? ativo?.rendaPercentual
        );
        const rendaPercentual = rendaInformada !== null
          ? rendaInformada
          : premioTotal !== null && garantia
            ? (premioTotal / garantia) * 100
            : null;

        const strike = parseNumber(ativo?.strike ?? ativo?.strikePreco ?? ativo?.precoStrike);

        const codigoOpcao =
          ativo?.codigoOpcao ??
          ativo?.tickerOpcao ??
          ativo?.optionTicker ??
          ativo?.opcao ??
          ativo?.option ??
          '';

        return {
          id: ativo?.id ?? `cf-${index}`,
          ordem: Number(ativo?.posicaoExibicao ?? ativo?.ordem ?? index + 1) || index + 1,
          ativoBase:
            ativo?.ativoBase ??
            ativo?.ativo ??
            ativo?.tickerBase ??
            ativo?.subjacente ??
            ativo?.ticker ??
            '--',
          codigoOpcao: codigoOpcao || '--',
          strike,
          premio: premioEntrada,
          rendaPercentual,
          garantia,
          precoReferencia,
          vencimento: ativo?.vencimento || ativo?.dataVencimento || '--',
          tipoOperacao: ativo?.tipoOperacao || ativo?.estrategia || 'Venda de opções',
          status: ativo?.posicaoEncerrada ? 'Encerrada' : 'Aberta',
          observacao: ativo?.observacao ?? ativo?.comentario ?? ativo?.notas ?? undefined
        };
      })
      .sort((a, b) => a.ordem - b.ordem);
  }, [ativosOriginais, cotacoes]);

  const totaisCarteira = React.useMemo<CarteiraResumo[]>(() => {
    const totalOperacoes = operacoesProcessadas.length;
    const abertas = operacoesProcessadas.filter((op) => op.status === 'Aberta').length;
    const encerradas = totalOperacoes - abertas;

    const agregados = operacoesProcessadas.reduce(
      (acc, operacao) => {
        if (operacao.premio !== null && !Number.isNaN(operacao.premio)) {
          acc.totalPremio += operacao.premio * 100;
          acc.countPremio += 1;
        }

        if (operacao.garantia !== null && !Number.isNaN(operacao.garantia)) {
          acc.totalGarantia += operacao.garantia;
          acc.countGarantia += 1;
        }

        if (
          operacao.rendaPercentual !== null &&
          !Number.isNaN(operacao.rendaPercentual)
        ) {
          acc.totalRenda += operacao.rendaPercentual;
          acc.countRenda += 1;
        }

        return acc;
      },
      {
        totalPremio: 0,
        countPremio: 0,
        totalGarantia: 0,
        countGarantia: 0,
        totalRenda: 0,
        countRenda: 0
      }
    );

    const premioMedio = agregados.countPremio > 0
      ? agregados.totalPremio / agregados.countPremio
      : null;
    const garantiaMedia = agregados.countGarantia > 0
      ? agregados.totalGarantia / agregados.countGarantia
      : null;
    const rendaMedia = agregados.countRenda > 0
      ? agregados.totalRenda / agregados.countRenda
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
        helper: 'Inclui rolagens já concluídas'
      },
      {
        label: 'Prêmio médio por contrato',
        value: formatCurrency(premioMedio),
        helper: 'Considerando lote padrão de 100 ações'
      },
      {
        label: 'Renda média estimada',
        value: formatPercentage(rendaMedia),
        helper: 'Baseada em prêmio total ÷ garantia'
      }
    ];
  }, [operacoesProcessadas]);

  const isLoadingCarteira = loading || isLoading;
  const carteiraVazia = !isLoadingCarteira && operacoesProcessadas.length === 0;

  if (!authLoading && !hasCarteiraAccess) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
            border: '1px solid #e2e8f0'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '88px',
              height: '88px',
              borderRadius: '9999px',
              backgroundColor: '#fee2e2',
              marginBottom: '24px'
            }}
          >
            <Lock size={40} style={{ color: '#dc2626' }} />
          </div>

          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '16px'
            }}
          >
            Em breve
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: '#1f2937',
              marginBottom: '12px',
              lineHeight: 1.6
            }}
          >
            Esta página é exclusiva para assinantes do CF Renda Turbinada.
          </p>

          <p
            style={{
              fontSize: '16px',
              color: '#4b5563',
              lineHeight: 1.6
            }}
          >
            Solicite o upgrade com o nosso time de suporte para acompanhar as operações recomendadas.
          </p>
        </div>
      </div>
    );
  }

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
              Carteira Recomendada de Opções
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
              Acompanhe as vendas cobertas de puts e calls indicadas pelo CF Renda Turbinada. Aqui você encontra os códigos,
              prêmios, garantias e orientações para executar cada operação com confiança.
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
              Resumo do relatório
            </h2>
            <p style={{ margin: 0, color: '#475569', fontSize: '15px', lineHeight: 1.6 }}>
              Destaques da última sessão com Davi e Caio para orientar a execução das estratégias com opções.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {reportHighlights.map((highlight) => (
              <div
                key={highlight.title}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#f8fafc'
                }}
              >
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  {highlight.title}
                </h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>{highlight.summary}</p>
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
                {operacoesProcessadas.map((operacao) => (
                  <div
                    key={operacao.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>{operacao.ativoBase}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          {operacao.codigoOpcao !== '--' ? `Opção ${operacao.codigoOpcao}` : 'Código da opção a confirmar'}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          color: operacao.status === 'Encerrada' ? '#ef4444' : '#0ea5e9',
                          fontWeight: 600,
                          backgroundColor: operacao.status === 'Encerrada' ? '#fee2e2' : '#e0f2fe',
                          padding: '2px 8px',
                          borderRadius: '999px'
                        }}
                      >
                        {operacao.status}
                      </span>
                    </div>
                    <div style={{ color: '#475569', fontSize: '12px', marginTop: '8px' }}>
                      {operacao.tipoOperacao} • Vencimento {operacao.vencimento}
                    </div>
                    <div style={{ display: 'grid', gap: '8px', marginTop: '12px', fontSize: '13px', color: '#0f172a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Strike</span>
                        <strong>{formatCurrency(operacao.strike)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Prêmio (por ação)</span>
                        <strong>{formatCurrency(operacao.premio)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Renda estimada</span>
                        <strong>{formatPercentage(operacao.rendaPercentual)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Garantia</span>
                        <strong>{formatCurrency(operacao.garantia)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Preço de referência</span>
                        <strong>{formatCurrency(operacao.precoReferencia)}</strong>
                      </div>
                    </div>
                    {operacao.observacao ? (
                      <div style={{ marginTop: '12px', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                        <strong>Observações:</strong> {operacao.observacao}
                      </div>
                    ) : null}
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
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>OPÇÃO</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>STRIKE</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>VENCIMENTO</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>PRÊMIO (R$)</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>RENDA</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>GARANTIA</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>TIPO</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: '14px' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operacoesProcessadas.map((operacao) => (
                      <tr
                        key={operacao.id}
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
                            {operacao.ordem}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{operacao.ativoBase}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Preço ref.: {formatCurrency(operacao.precoReferencia)}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>
                          {operacao.codigoOpcao}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>
                          {formatCurrency(operacao.strike)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>
                          {operacao.vencimento}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>
                          {formatCurrency(operacao.premio)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>
                          {formatPercentage(operacao.rendaPercentual)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>
                          {formatCurrency(operacao.garantia)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>
                          {operacao.tipoOperacao}
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
                              color: operacao.status === 'Encerrada' ? '#b91c1c' : '#0f766e',
                              backgroundColor: operacao.status === 'Encerrada' ? '#fee2e2' : '#ccfbf1'
                            }}
                          >
                            {operacao.status}
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
