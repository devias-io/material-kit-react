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
  rendaPercentual: number | null;
  garantia: number | null;
  precoReferencia: number | null;
  vencimento: string;
  tipoOperacao: 'PUT' | 'CALL';
  status: 'Aberta' | 'Encerrada';
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
    premio: 0.47,
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
    status: 'Aberta'
  },
  {
    id: 'put-3',
    ordem: 3,
    ativoBase: 'PETR4',
    codigoOpcao: 'PETRX330',
    strike: 32.50,
    premio: 0.46,
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
    premio: 0.51,
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

export default function CfRendaTurbinadaCarteiraPage(): React.JSX.Element {
  const router = useRouter();
  const { loading: authLoading, hasAccessSync } = useAuthAccess();
  const hasCarteiraAccess = hasAccessSync('cf-renda-turbinada-carteira');

  const isMobile = useDeviceDetection();

  // Usar os dados fixos diretamente
  const operacoesPUT = operacoesPUTFixas;
  const operacoesCALL = operacoesCALLFixas;
  const operacoesProcessadas = [...operacoesPUTFixas, ...operacoesCALLFixas];

  const totaisCarteira = React.useMemo<CarteiraResumo[]>(() => {
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
        label: 'PUTs em aberto',
        value: putAbertas.toString()
      },
      {
        label: 'CALLs em aberto',
        value: callAbertas.toString()
      },
      {
        label: 'Renda média estimada',
        value: formatPercentage(rendaMedia)
      }
    ];
  }, [operacoesProcessadas, operacoesPUT, operacoesCALL]);

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

  const renderOperacoesTable = (operacoes: CarteiraOperacao[], tipo: 'PUT' | 'CALL') => {
    if (operacoes.length === 0) {
      return (
        <div
          style={{
            padding: '32px',
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
        <div style={{ display: 'grid', gap: '12px' }}>
          {operacoes.map((operacao) => (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Logo do Ativo */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e2e8f0',
                    flexShrink: 0
                  }}>
                    <img 
                      src={`https://www.ivalor.com.br/media/emp/logos/${operacao.ativoBase.replace(/\d+$/, '')}.png`}
                      alt={`Logo ${operacao.ativoBase}`}
                      style={{
                        width: '32px',
                        height: '32px',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.style.backgroundColor = operacao.status === 'Encerrada' ? '#e2e8f0' : '#dbeafe';
                          parent.style.color = operacao.status === 'Encerrada' ? '#64748b' : '#1e40af';
                          parent.style.fontWeight = '700';
                          parent.style.fontSize = '14px';
                          parent.textContent = operacao.ativoBase.slice(0, 2);
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>
                      {operacao.ativoBase}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      {operacao.codigoOpcao}
                    </div>
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
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatGarantia(operacao.garantia)}</div>
                </div>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#64748b' }}>
                Vencimento: {operacao.vencimento}
              </div>

              {operacao.observacao && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#475569', lineHeight: 1.5, backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                  💡 {operacao.observacao}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
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
            {operacoes.map((operacao) => (
              <tr
                key={operacao.id}
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: operacao.status === 'Encerrada' ? '#f8fafc' : 'transparent'
                }}
              >
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Logo do Ativo */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e2e8f0',
                      flexShrink: 0
                    }}>
                      <img 
                        src={`https://www.ivalor.com.br/media/emp/logos/${operacao.ativoBase.replace(/\d+$/, '')}.png`}
                        alt={`Logo ${operacao.ativoBase}`}
                        style={{
                          width: '32px',
                          height: '32px',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.style.backgroundColor = operacao.status === 'Encerrada' ? '#e2e8f0' : '#dbeafe';
                            parent.style.color = operacao.status === 'Encerrada' ? '#64748b' : '#1e40af';
                            parent.style.fontWeight = '700';
                            parent.style.fontSize = '14px';
                            parent.textContent = operacao.ativoBase.slice(0, 2);
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{operacao.ativoBase}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        Ref: {formatCurrency(operacao.precoReferencia)}
                      </div>
                    </div>
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
                  {formatGarantia(operacao.garantia)}
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
    );
  };

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
              Estratégias de venda de opções para geração de renda adicional
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
            <strong>Diretrizes para zeragem:</strong> Com lucros a partir de 70% nessas operações já é válido embolsar o lucro para montagem de novas posições.
          </div>
        </div>

        {/* Seção PUTs */}
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
              backgroundColor: '#fef3c7'
            }}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
              Venda de PUTs
            </h2>
            <p style={{ margin: 0, color: '#78716c', fontSize: '14px', lineHeight: 1.6 }}>
              Ideal para quem possui capital suficiente e deseja gerar renda assumindo o compromisso de comprar as ações pelo preço do strike em caso de exercício.
            </p>
          </div>

          <div style={{ padding: '24px' }}>
            {renderOperacoesTable(operacoesPUT, 'PUT')}
          </div>

          {/* Alerta de risco PUTs */}
          <div
            style={{
              padding: '16px 24px',
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              borderLeft: '4px solid #f97316',
              margin: '0 24px 24px 24px',
              borderRadius: '8px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}
          >
            <AlertTriangle size={18} style={{ color: '#f97316', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13px', color: '#7c2d12', lineHeight: 1.6 }}>
              <strong>Importante:</strong> O lançador de PUT assume a obrigação de adquirir o ativo pelo preço de exercício (Strike) no vencimento. 
              É necessário ter como garantia, no mínimo, o valor necessário para comprar a quantidade de ações correspondentes às PUTs vendidas.
            </div>
          </div>
        </section>

        {/* Seção CALLs */}
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
              backgroundColor: '#dbeafe'
            }}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
              Venda Coberta de CALLs
            </h2>
            <p style={{ margin: 0, color: '#1e3a8a', fontSize: '14px', lineHeight: 1.6 }}>
              Ideal para gerar renda sobre ações já mantidas em carteira (dividendo sintético), assumindo o risco de ter que vender tais ações pelo preço do strike no vencimento.
            </p>
          </div>

          <div style={{ padding: '24px' }}>
            {renderOperacoesTable(operacoesCALL, 'CALL')}
          </div>

          {/* Alerta de risco CALLs */}
          <div
            style={{
              padding: '16px 24px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderLeft: '4px solid #dc2626',
              margin: '0 24px 24px 24px',
              borderRadius: '8px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}
          >
            <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13px', color: '#7f1d1d', lineHeight: 1.6 }}>
              <strong>Importante:</strong> Para realizar a venda coberta de CALL é necessário ter como garantia, no mínimo, a quantidade de ações em carteira 
              correspondentes às CALLs vendidas. Evite realizar operações envolvendo ações que não estejam em sua posse para não ficar exposto sem cobertura.
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            fontSize: '12px',
            color: '#64748b',
            lineHeight: 1.6
          }}
        >
          <strong>Disclaimer:</strong> As análises e recomendações contidas nesta página foram elaboradas pelo analista Caio Gomes (CNPI T-3793). 
          O analista declara que as recomendações aqui veiculadas são preparadas de acordo com o estabelecido na Instrução CVM nº 20/2021. 
          A rentabilidade obtida no passado não representa garantia de resultados futuros. O investimento em opções não é garantido pelo Fundo Garantidor 
          de Crédito (FGC). A rentabilidade divulgada não é líquida de impostos.
        </div>
      </div>
    </div>
  );
}
