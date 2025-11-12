'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, TrendingUp, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAuthAccess } from '@/hooks/use-auth-access';
import { useDataStore } from '@/hooks/useDataStore';

type CarteiraResumo = {
  label: string;
  value: string;
};

type CarteiraOperacao = {
  id: string;
  ordem: number;
  ativoBase: string;
  codigoOpcao: string;
  strike: number | null;
  premio: number | null;
  premioCustom?: string;
  rendaPercentual: number | null;
  garantia: number | null;
  precoReferencia: number | null;
  vencimento: string;
  tipoOperacao: 'PUT' | 'CALL';
  status: 'Aberta' | 'Fechada' | 'Encerrada';
  observacao?: string;
};

// Dados fixos das operações de PUTs
const operacoesPUTFixas: CarteiraOperacao[] = [
  {
    id: 'put-1',
    ordem: 1,
    ativoBase: 'BBSE3',
    codigoOpcao: 'BBSEX354',
    strike: 33.51,
    premio: null,
    premioCustom: 'R$ 0,44 e R$ 0,47',
    rendaPercentual: 1.40,
    garantia: 3351.00,
    precoReferencia: 33.51,
    vencimento: '19/12/2025',
    tipoOperacao: 'PUT',
    status: 'Aberta'
  },
  {
    id: 'put-2',
    ordem: 2,
    ativoBase: 'B3SA3',
    codigoOpcao: 'B3SAX132',
    strike: 13.02,
    premio: 0.28,
    rendaPercentual: 2.08,
    garantia: 1302.00,
    precoReferencia: 13.02,
    vencimento: '19/12/2025',
    tipoOperacao: 'PUT',
    status: 'Fechada'
  },
  {
    id: 'put-3',
    ordem: 3,
    ativoBase: 'PETR4',
    codigoOpcao: 'PETRX330',
    strike: 32.50,
    premio: null,
    premioCustom: 'R$ 0,62 e R$ 0,65',
    rendaPercentual: 1.38,
    garantia: 3250.00,
    precoReferencia: 32.50,
    vencimento: '19/12/2025',
    tipoOperacao: 'PUT',
    status: 'Aberta'
  },
  {
    id: 'put-4',
    ordem: 4,
    ativoBase: 'BBAS3',
    codigoOpcao: 'BBASX233',
    strike: 22.94,
    premio: null,
    premioCustom: 'R$ 0,59 e R$ 0,63',
    rendaPercentual: 2.20,
    garantia: 2294.00,
    precoReferencia: 22.94,
    vencimento: '19/12/2025',
    tipoOperacao: 'PUT',
    status: 'Aberta'
  }
];

// Dados fixos das operações de CALLs
const operacoesCALLFixas: CarteiraOperacao[] = [
  {
    id: 'call-1',
    ordem: 1,
    ativoBase: 'VALE3',
    codigoOpcao: 'VALEL70',
    strike: 66.29,
    premio: 1.52,
    rendaPercentual: 2.33,
    garantia: null, // 1 LOTE
    precoReferencia: 66.29,
    vencimento: '19/12/2025',
    tipoOperacao: 'CALL',
    status: 'Aberta'
  },
  {
    id: 'call-2',
    ordem: 2,
    ativoBase: 'PETR4',
    codigoOpcao: 'PETRL41',
    strike: 34.25,
    premio: 0.70,
    rendaPercentual: 2.10,
    garantia: null, // 1 LOTE
    precoReferencia: 34.25,
    vencimento: '19/12/2025',
    tipoOperacao: 'CALL',
    status: 'Aberta'
  },
  {
    id: 'call-3',
    ordem: 3,
    ativoBase: 'SANB11',
    codigoOpcao: 'SANBL345',
    strike: 34.10,
    premio: 0.66,
    rendaPercentual: 2.00,
    garantia: null, // 1 LOTE
    precoReferencia: 34.10,
    vencimento: '19/12/2025',
    tipoOperacao: 'CALL',
    status: 'Aberta'
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

const formatGarantia = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '1 LOTE';
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

const getStatusStyle = (status: 'Aberta' | 'Fechada' | 'Encerrada') => {
  switch (status) {
    case 'Aberta':
      return { background: '#dbeafe', color: '#1e40af' };
    case 'Fechada':
      return { background: '#fef3c7', color: '#92400e' };
    case 'Encerrada':
      return { background: '#f1f5f9', color: '#64748b' };
  }
};

export default function CfRendaTurbinadaCarteiraPage(): React.JSX.Element {
  const router = useRouter();
  const { loading: authLoading, hasAccessSync } = useAuthAccess();
  const hasCarteiraAccess = hasAccessSync('cf-renda-turbinada-carteira');
  const isMobile = useDeviceDetection();

  // Usar os dados fixos diretamente
  const operacoesPUT = operacoesPUTFixas;
  const operacoesCALL = operacoesCALLFixas;
  const operacoesProcessadas = [...operacoesPUTFixas, ...operacoesCALLFixas];

  const totaisCarteira = React.useMemo(() => {
    const abertas = operacoesProcessadas.filter((op) => op.status === 'Aberta').length;
    const putAbertas = operacoesPUT.filter((op) => op.status === 'Aberta').length;
    const callAbertas = operacoesCALL.filter((op) => op.status === 'Aberta').length;

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
      { totalPremio: 0, countPremio: 0, totalRenda: 0, countRenda: 0 }
    );

    const premioMedio =
      agregados.countPremio > 0
        ? agregados.totalPremio / agregados.countPremio
        : null;
    const rendaMedia =
      agregados.countRenda > 0 ? agregados.totalRenda / agregados.countRenda : null;

    return [
      { label: 'PUTs em aberto', value: putAbertas.toString() },
      { label: 'CALLs em aberto', value: callAbertas.toString() },
      { label: 'Renda média estimada', value: formatPercentage(rendaMedia) }
    ];
  }, [operacoesProcessadas, operacoesPUT, operacoesCALL]);

  if (!authLoading && !hasCarteiraAccess) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px'
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '48px 32px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}
          >
            <Lock size={40} color="white" />
          </div>
          <h2
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '16px'
            }}
          >
            Acesso Restrito
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: '#64748b',
              lineHeight: '1.6',
              marginBottom: '32px'
            }}
          >
            Esta página é exclusiva para assinantes do CF Renda Turbinada.
            <br />
            Solicite o upgrade com o nosso time de suporte para acompanhar as
            operações recomendadas.
          </p>
          <button
            onClick={() => router.push('/dashboard/cf-renda-turbinada')}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const renderOperacoesTable = (operacoes: CarteiraOperacao[], tipo: 'PUT' | 'CALL') => {
    if (operacoes.length === 0) {
      return (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '14px'
          }}
        >
          Nenhuma operação de {tipo} cadastrada
        </div>
      );
    }

    if (isMobile) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {operacoes.map((operacao) => {
            const statusStyle = getStatusStyle(operacao.status);
            return (
              <div
                key={operacao.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid #e2e8f0'
                }}
              >
                {/* Logo do Ativo */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f8fafc',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={`https://raw.githubusercontent.com/thefintz/icones-b3/main/icones/${operacao.ativoBase}.png`}
                      alt={operacao.ativoBase}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const style = getStatusStyle(operacao.status);
                          parent.style.backgroundColor = style.background;
                          parent.style.color = style.color;
                          parent.style.fontWeight = '700';
                          parent.style.fontSize = '14px';
                          parent.textContent = operacao.ativoBase.slice(0, 2);
                        }
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#1e293b',
                        marginBottom: '4px'
                      }}
                    >
                      {operacao.ativoBase}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {operacao.codigoOpcao}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: statusStyle.background,
                      color: statusStyle.color
                    }}
                  >
                    {operacao.status}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Strike</span>
                  <strong style={{ fontSize: '14px' }}>{formatCurrency(operacao.strike)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Prêmio</span>
                  <strong style={{ fontSize: '14px' }}>
                    {operacao.premioCustom || formatCurrency(operacao.premio)}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Renda</span>
                  <strong style={{ fontSize: '14px', color: '#10b981' }}>
                    {formatPercentage(operacao.rendaPercentual)}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Garantia</span>
                  <strong style={{ fontSize: '14px' }}>
                    {formatGarantia(operacao.garantia)}
                  </strong>
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f1f5f9',
                    fontSize: '13px',
                    color: '#64748b',
                    textAlign: 'center'
                  }}
                >
                  Vencimento: {operacao.vencimento}
                </div>

                {operacao.observacao && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#fef3c7',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#92400e',
                      lineHeight: '1.5'
                    }}
                  >
                    💡 {operacao.observacao}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th
                style={{
                  padding: '16px 12px',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Ativo
              </th>
              <th
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Opção
              </th>
              <th
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Strike
              </th>
              <th
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Prêmio
              </th>
              <th
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Renda
              </th>
              <th
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Garantia
              </th>
              <th
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Vencimento
              </th>
              <th
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {operacoes.map((operacao) => {
              const statusStyle = getStatusStyle(operacao.status);
              return (
                <tr
                  key={operacao.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Logo do Ativo */}
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f8fafc',
                          flexShrink: 0
                        }}
                      >
                        <img
                          src={`https://raw.githubusercontent.com/thefintz/icones-b3/main/icones/${operacao.ativoBase}.png`}
                          alt={operacao.ativoBase}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const style = getStatusStyle(operacao.status);
                              parent.style.backgroundColor = style.background;
                              parent.style.color = style.color;
                              parent.style.fontWeight = '700';
                              parent.style.fontSize = '14px';
                              parent.textContent = operacao.ativoBase.slice(0, 2);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1e293b',
                            marginBottom: '2px'
                          }}
                        >
                          {operacao.ativoBase}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Ref: {formatCurrency(operacao.precoReferencia)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                    {operacao.codigoOpcao}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    {formatCurrency(operacao.strike)}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#0ea5e9'
                    }}
                  >
                    {operacao.premioCustom || formatCurrency(operacao.premio)}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#10b981'
                    }}
                  >
                    {formatPercentage(operacao.rendaPercentual)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                    {formatGarantia(operacao.garantia)}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: '#64748b'
                    }}
                  >
                    {operacao.vencimento}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: statusStyle.background,
                        color: statusStyle.color
                      }}
                    >
                      {operacao.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)',
        padding: isMobile ? '20px' : '40px 20px'
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          marginBottom: '32px'
        }}
      >
        <button
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

        <h1
          style={{
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '8px',
            marginTop: '16px'
          }}
        >
          Carteira Recomendada
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: '#64748b',
            margin: 0
          }}
        >
          Estratégias de venda de opções para geração de renda adicional
        </p>
      </div>

      {/* Cards de resumo */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto 32px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '16px'
        }}
      >
        {totaisCarteira.map((item) => (
          <div
            key={item.label}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}
          >
            <div
              style={{
                fontSize: '13px',
                color: '#64748b',
                marginBottom: '8px',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.5px'
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#1e293b'
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Banner de informação */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto 32px',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)'
        }}
      >
        <TrendingUp size={32} color="white" style={{ flexShrink: 0 }} />
        <p
          style={{
            margin: 0,
            color: 'white',
            fontSize: '15px',
            fontWeight: '500',
            lineHeight: '1.5'
          }}
        >
          <strong>Diretrizes para zeragem:</strong> Com lucros a partir de 70% nessas
          operações já é válido embolsar o lucro para montagem de novas posições.
        </p>
      </div>

      {/* Seção PUTs */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto 40px'
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: isMobile ? '20px' : '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '8px'
            }}
          >
            🔻 Venda de PUTs
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#64748b',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}
          >
            Ideal para quem possui capital suficiente e deseja gerar renda assumindo o
            compromisso de comprar as ações pelo preço do strike em caso de exercício.
          </p>

          {renderOperacoesTable(operacoesPUT, 'PUT')}
        </div>

        {/* Alerta de risco PUTs */}
        <div
          style={{
            maxWidth: '1400px',
            margin: '16px auto 0',
            background: '#fef3c7',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            gap: '12px',
            border: '1px solid #fde68a'
          }}
        >
          <AlertTriangle
            size={20}
            color="#f59e0b"
            style={{ flexShrink: 0, marginTop: '2px' }}
          />
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: '#92400e',
              lineHeight: '1.6'
            }}
          >
            <strong>Importante:</strong> O lançador de PUT assume a obrigação de adquirir
            o ativo pelo preço de exercício (Strike) no vencimento. É necessário ter como
            garantia, no mínimo, o valor necessário para comprar a quantidade de ações
            correspondentes às PUTs vendidas.
          </p>
        </div>
      </div>

      {/* Seção CALLs */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto 40px'
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: isMobile ? '20px' : '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '8px'
            }}
          >
            🔺 Venda Coberta de CALLs
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#64748b',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}
          >
            Ideal para gerar renda sobre ações já mantidas em carteira (dividendo
            sintético), assumindo o risco de ter que vender tais ações pelo preço do
            strike no vencimento.
          </p>

          {renderOperacoesTable(operacoesCALL, 'CALL')}
        </div>

        {/* Alerta de risco CALLs */}
        <div
          style={{
            maxWidth: '1400px',
            margin: '16px auto 0',
            background: '#fef3c7',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            gap: '12px',
            border: '1px solid #fde68a'
          }}
        >
          <AlertTriangle
            size={20}
            color="#f59e0b"
            style={{ flexShrink: 0, marginTop: '2px' }}
          />
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: '#92400e',
              lineHeight: '1.6'
            }}
          >
            <strong>Importante:</strong> Para realizar a venda coberta de CALL é
            necessário ter como garantia, no mínimo, a quantidade de ações em carteira
            correspondentes às CALLs vendidas. Evite realizar operações envolvendo ações
            que não estejam em sua posse para não ficar exposto sem cobertura.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '20px 24px',
          border: '1px solid #e2e8f0'
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: '#64748b',
            lineHeight: '1.7'
          }}
        >
          <strong>Disclaimer:</strong> As análises e recomendações contidas nesta página
          foram elaboradas pelo analista Caio Gomes (CNPI T-3793). O analista declara que
          as recomendações aqui veiculadas são preparadas de acordo com o estabelecido na
          Instrução CVM nº 20/2021. A rentabilidade obtida no passado não representa
          garantia de resultados futuros. O investimento em opções não é garantido pelo
          Fundo Garantidor de Crédito (FGC). A rentabilidade divulgada não é líquida de
          impostos.
        </p>
      </div>
    </div>
  );
}
