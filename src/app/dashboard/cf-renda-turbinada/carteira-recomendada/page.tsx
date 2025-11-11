'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, TrendingUp, AlertCircle } from 'lucide-react';

import { useAuthAccess } from '@/hooks/use-auth-access';
import { useDataStore } from '@/hooks/useDataStore';

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

const quickTips = [
  'Configure alertas de margem no Profit para acompanhar suas posições',
  'Sempre valide os preços antes de executar a operação',
  'Dúvidas? Acesse o grupo ou reveja a aula correspondente'
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

    const agregados = operacoesProcessadas.reduce(
      (acc, operacao) => {
        if (operacao.premio !== null && !Number.isNaN(operacao.premio)) {
          acc.totalPremio += operacao.premio * 100;
          acc.countPremio += 1;
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
        totalRenda: 0,
        countRenda: 0
      }
    );

    const premioMedio = agregados.countPremio > 0
      ? agregados.totalPremio / agregados.countPremio
      : null;
    const rendaMedia = agregados.countRenda > 0
      ? agregados.totalRenda / agregados.countRenda
      : null;

    return [
      {
        label: 'Operações em aberto',
        value: abertas.toString()
      },
      {
        label: 'Prêmio médio/contrato',
        value: formatCurrency(premioMedio)
      },
      {
        label: 'Renda média estimada',
        value: formatPercentage(rendaMedia)
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
            Acesso Restrito
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
        padding: isMobile ? '16px' : '24px'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Header */}
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
              gap: '6px',
              padding: 0
            }}
          >
            ← Voltar
          </button>

          <div>
            <h1
              style={{
                fontSize: isMobile ? '28px' : '36px',
                fontWeight: 800,
                color: '#1e293b',
                margin: '0 0 8px 0'
              }}
            >
              Carteira Recomendada
            </h1>
            <p
              style={{
                color: '#64748b',
                fontSize: '16px',
                margin: 0,
                lineHeight: 1.5
              }}
            >
              Operações atualizadas semanalmente com códigos, prêmios e garantias
            </p>
          </div>
        </div>

        {/* Cards de resumo */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '16px'
          }}
        >
          {totaisCarteira.map((item) => (
            <div
              key={item.label}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px'
              }}
            >
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Banner de informação */}
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}
        >
          <AlertCircle size={20} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '14px', color: '#1e40af', lineHeight: 1.6 }}>
            <strong>Como funciona:</strong> As recomendações são inseridas automaticamente via painel de gerenciamento.
            Valide os preços antes de executar no Profit e configure alertas de margem para cada posição.
          </div>
        </div>

        {/* Tabela de operações */}
        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '16px',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                Operações Recomendadas
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                Acompanhe as posições e execute no momento adequado
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/dashboard/gerenciamento')}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Gerenciar operações
            </button>
          </div>

          <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {isLoadingCarteira ? (
              <div
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '14px'
                }}
              >
                Carregando operações...
              </div>
            ) : carteiraVazia ? (
              <div
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  border: '2px dashed #e2e8f0',
                  borderRadius: '12px'
                }}
              >
                <TrendingUp size={48} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                  Nenhuma operação cadastrada. Use o painel de gerenciamento para adicionar recomendações.
                </p>
              </div>
            ) : isMobile ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {operacoesProcessadas.map((operacao) => (
                  <div
                    key={operacao.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '16px',
                      backgroundColor: operacao.status === 'Encerrada' ? '#f8fafc' : '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>
                          {operacao.ativoBase}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                          {operacao.codigoOpcao}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: operacao.status === 'Encerrada' ? '#dc2626' : '#16a34a',
                          backgroundColor: operacao.status === 'Encerrada' ? '#fee2e2' : '#dcfce7',
                          padding: '4px 10px',
                          borderRadius: '999px'
                        }}
                      >
                        {operacao.status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '4px' }}>Strike</div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(operacao.strike)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '4px' }}>Prêmio</div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(operacao.premio)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '4px' }}>Renda</div>
                        <div style={{ fontWeight: 600, color: '#16a34a' }}>{formatPercentage(operacao.rendaPercentual)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '4px' }}>Garantia</div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(operacao.garantia)}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#64748b' }}>
                      {operacao.tipoOperacao} • Venc. {operacao.vencimento}
                    </div>

                    {operacao.observacao && (
                      <div style={{ marginTop: '12px', fontSize: '12px', color: '#475569', lineHeight: 1.5, backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                        💡 {operacao.observacao}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ativo</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Opção</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Strike</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prêmio</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Renda</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Garantia</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vencimento</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operacoesProcessadas.map((operacao, idx) => (
                      <tr
                        key={operacao.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: operacao.status === 'Encerrada' ? '#f8fafc' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{operacao.ativoBase}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            Ref: {formatCurrency(operacao.precoReferencia)}
                          </div>
                        </td>
                        <td style={{ padding: '16px', color: '#0f172a', fontSize: '14px', fontFamily: 'monospace' }}>
                          {operacao.codigoOpcao}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>
                          {formatCurrency(operacao.strike)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>
                          {formatCurrency(operacao.premio)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', color: '#16a34a', fontSize: '14px', fontWeight: 700 }}>
                          {formatPercentage(operacao.rendaPercentual)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>
                          {formatCurrency(operacao.garantia)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                          {operacao.vencimento}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: operacao.status === 'Encerrada' ? '#dc2626' : '#16a34a',
                              backgroundColor: operacao.status === 'Encerrada' ? '#fee2e2' : '#dcfce7'
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

        {/* Dicas rápidas */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px'
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            Dicas de execução
          </h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {quickTips.map((tip, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '10px',
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: 1.5
                }}
              >
                <span style={{ color: '#2563eb' }}>•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
