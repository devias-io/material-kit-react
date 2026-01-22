'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, TrendingUp, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAuthAccess } from '@/hooks/use-auth-access';

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
    codigoOpcao: 'BBSEX352',
    strike: 33.26,
    premio: null,
    premioCustom: 'R$ 0,44 e R$ 0,47',
    rendaPercentual: 1.31,
    garantia: 3326.00,
    precoReferencia: 33.26,
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
    codigoOpcao: 'PETRX326',
    strike: 32.00,
    premio: null,
    premioCustom: 'R$ 0,62 e R$ 0,65',
    rendaPercentual: 1.95,
    garantia: 3200.00,
    precoReferencia: 32.00,
    vencimento: '19/12/2025',
    tipoOperacao: 'PUT',
    status: 'Aberta'
  },
  {
    id: 'put-4',
    ordem: 4,
    ativoBase: 'BBAS3',
    codigoOpcao: 'BBASX228',
    strike: 22.44,
    premio: null,
    premioCustom: 'R$ 0,59 e R$ 0,63',
    rendaPercentual: 2.69,
    garantia: 2244.00,
    precoReferencia: 22.44,
    vencimento: '19/12/2025',
    tipoOperacao: 'PUT',
    status: 'Aberta'
  }
];

// Dados fixos das operações de CALLs - TODAS ENCERRADAS
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
    status: 'Encerrada'
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
    status: 'Encerrada'
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
    status: 'Encerrada'
  },
  {
    id: 'call-4',
    ordem: 4,
    ativoBase: 'VALE3',
    codigoOpcao: 'VALEL69',
    strike: 65.79,
    premio: null,
    premioCustom: 'R$ 1,35 a R$ 1,38',
    rendaPercentual: 2.08,
    garantia: null, // 1 LOTE
    precoReferencia: 65.79,
    vencimento: '19/12/2025',
    tipoOperacao: 'CALL',
    status: 'Aberta'
  },
  {
    id: 'call-5',
    ordem: 5,
    ativoBase: 'B3SA3',
    codigoOpcao: 'B3SAL149',
    strike: 14.77,
    premio: null,
    premioCustom: 'R$ 0,31 a R$ 0,34',
    rendaPercentual: 2.26,
    garantia: null, // 1 LOTE
    precoReferencia: 14.77,
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

const formatGarantia = (
  value: number | null | undefined,
  tipoOperacao: 'PUT' | 'CALL'
): string => {
  // 🔍 ADICIONE ESTE LOG TEMPORÁRIO
  console.log('formatGarantia chamada:', { value, tipoOperacao });
  
  if (tipoOperacao === 'CALL') {
    const lotes = typeof value === 'number' && !Number.isNaN(value) ? value : 1;
    const label = lotes === 1 ? 'LOTE' : 'LOTES';
    return `${lotes} ${label}`;
  }
  
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
  const { loading: authLoading, hasAccessSync, planInfo, user } = useAuthAccess();
  const hasCarteiraAccess = hasAccessSync('cf-renda-turbinada-carteira');
  const isMobile = useDeviceDetection();
  const isAdmin = planInfo?.isAdmin ?? false;
  const releaseDateTurma3 = new Date('2026-01-30T00:00:00-03:00');
  const isTurma3 = user?.plan === 'RENDA_TURBINADA_T3';
  const isTurma3ReleaseBlocked = !isAdmin && isTurma3 && new Date() < releaseDateTurma3;

  const [operacoesPUT, setOperacoesPUT] = React.useState<CarteiraOperacao[]>(operacoesPUTFixas);
  const [operacoesCALL, setOperacoesCALL] = React.useState<CarteiraOperacao[]>(operacoesCALLFixas);
  const [loadingOperacoes, setLoadingOperacoes] = React.useState(true);
  const [salvandoOperacoes, setSalvandoOperacoes] = React.useState(false);
  const [erroCarregarOperacoes, setErroCarregarOperacoes] = React.useState<string | null>(null);

  const [modoEdicao, setModoEdicao] = React.useState<
    | { tipo: 'PUT' | 'CALL'; operacao?: CarteiraOperacao | null }
    | null
  >(null);

  const initialFormState = React.useMemo(
    () => ({
      id: null as string | null,
      ativoBase: '',
      codigoOpcao: '',
      strike: '',
      premio: '',
      premioCustom: '',
      rendaPercentual: '',
      garantia: '',
      precoReferencia: '',
      vencimento: '',
      status: 'Aberta' as CarteiraOperacao['status'],
      ordem: ''
    }),
    []
  );

  const [formData, setFormData] = React.useState(initialFormState);

  React.useEffect(() => {
    let isMounted = true;

    const carregarOperacoes = async () => {
      setLoadingOperacoes(true);
      setErroCarregarOperacoes(null);

      try {
        const response = await fetch('/api/cf-renda-turbinada/carteira');

        if (!response.ok) {
          throw new Error('Falha ao carregar operações');
        }

        const data = await response.json();

        if (!isMounted) return;

        setOperacoesPUT(Array.isArray(data.puts) ? data.puts : operacoesPUTFixas);
        setOperacoesCALL(Array.isArray(data.calls) ? data.calls : operacoesCALLFixas);
      } catch (error) {
        console.error('Erro ao buscar operações:', error);
        if (!isMounted) return;
        setOperacoesPUT(operacoesPUTFixas);
        setOperacoesCALL(operacoesCALLFixas);
        setErroCarregarOperacoes('Não foi possível carregar as operações atualizadas. Exibindo valores padrão.');
      } finally {
        if (isMounted) {
          setLoadingOperacoes(false);
        }
      }
    };

    void carregarOperacoes();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistirOperacoes = async (
    puts: CarteiraOperacao[],
    calls: CarteiraOperacao[]
  ) => {
    if (!isAdmin) return;

    setSalvandoOperacoes(true);

    try {
      const response = await fetch('/api/cf-renda-turbinada/carteira', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puts, calls })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar operações');
      }

      const data = await response.json();
      setOperacoesPUT(Array.isArray(data.puts) ? data.puts : puts);
      setOperacoesCALL(Array.isArray(data.calls) ? data.calls : calls);
    } catch (error) {
      console.error('Falha ao persistir operações:', error);
    } finally {
      setSalvandoOperacoes(false);
    }
  };

  const ordenarOperacoes = (operacoes: CarteiraOperacao[]) => {
    return [...operacoes].sort((a, b) => {
      if (a.status === 'Aberta' && b.status !== 'Aberta') return -1;
      if (a.status !== 'Aberta' && b.status === 'Aberta') return 1;
      return a.ordem - b.ordem;
    });
  };

  const operacoesProcessadas = [...operacoesPUT, ...operacoesCALL];

  const iniciarCadastro = (tipo: 'PUT' | 'CALL') => {
    setModoEdicao({ tipo, operacao: null });
    setFormData({
      ...initialFormState,
      ordem: (tipo === 'PUT' ? operacoesPUT.length + 1 : operacoesCALL.length + 1).toString()
    });
  };

  const iniciarEdicao = (operacao: CarteiraOperacao) => {
    setModoEdicao({ tipo: operacao.tipoOperacao, operacao });
    setFormData({
      id: operacao.id,
      ativoBase: operacao.ativoBase,
      codigoOpcao: operacao.codigoOpcao,
      strike: operacao.strike?.toString() ?? '',
      premio: operacao.premio?.toString() ?? '',
      premioCustom: operacao.premioCustom ?? '',
      rendaPercentual: operacao.rendaPercentual?.toString() ?? '',
      garantia: operacao.garantia?.toString() ?? '',
      precoReferencia: operacao.precoReferencia?.toString() ?? '',
      vencimento: operacao.vencimento,
      status: operacao.status,
      ordem: operacao.ordem?.toString() ?? ''
    });
  };

  const removerOperacao = (id: string, tipo: 'PUT' | 'CALL') => {
    if (!isAdmin) return;

    if (tipo === 'PUT') {
      setOperacoesPUT(prev => {
        const atualizadas = prev.filter(op => op.id !== id);
        void persistirOperacoes(atualizadas, operacoesCALL);
        return atualizadas;
      });
    } else {
      setOperacoesCALL(prev => {
        const atualizadas = prev.filter(op => op.id !== id);
        void persistirOperacoes(operacoesPUT, atualizadas);
        return atualizadas;
      });
    }
  };

  const salvarOperacao = (event: React.FormEvent) => {
    event.preventDefault();
    if (!modoEdicao) return;

    const isEdicao = Boolean(formData.id);
    const baseLista = modoEdicao.tipo === 'PUT' ? operacoesPUT : operacoesCALL;
    const garantiaValor = parseNumber(formData.garantia);

    const novaOperacao: CarteiraOperacao = {
      id: formData.id ?? `${modoEdicao.tipo.toLowerCase()}-${Date.now()}`,
      ordem: parseNumber(formData.ordem) ?? baseLista.length + 1,
      ativoBase: formData.ativoBase.trim().toUpperCase(),
      codigoOpcao: formData.codigoOpcao.trim().toUpperCase(),
      strike: parseNumber(formData.strike),
      premio: parseNumber(formData.premio),
      premioCustom: formData.premioCustom || undefined,
      rendaPercentual: parseNumber(formData.rendaPercentual),
      garantia: modoEdicao.tipo === 'CALL' ? garantiaValor ?? 1 : garantiaValor,
      precoReferencia: parseNumber(formData.precoReferencia),
      vencimento: formData.vencimento,
      tipoOperacao: modoEdicao.tipo,
      status: formData.status
    };

    const atualizarLista = (lista: CarteiraOperacao[]) => {
      if (isEdicao) {
        return lista.map(op => (op.id === novaOperacao.id ? novaOperacao : op));
      }
      return [...lista, novaOperacao];
    };

    if (modoEdicao.tipo === 'PUT') {
      const novasPUT = atualizarLista(operacoesPUT);
      setOperacoesPUT(novasPUT);
      void persistirOperacoes(novasPUT, operacoesCALL);
    } else {
      const novasCALL = atualizarLista(operacoesCALL);
      setOperacoesCALL(novasCALL);
      void persistirOperacoes(operacoesPUT, novasCALL);
    }

    setModoEdicao(null);
    setFormData(initialFormState);
  };

  const cancelarEdicao = () => {
    setModoEdicao(null);
    setFormData(initialFormState);
  };

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderAdminPanel = () => {
    if (!isAdmin) return null;

    return (
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto 24px',
          background: 'white',
          borderRadius: '12px',
          padding: isMobile ? '16px' : '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            gap: '12px',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: '12px'
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>
              Painel administrativo
            </h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
              Gerencie as operações diretamente desta página. As alterações são persistidas no
              banco de dados (Prisma) e ficam visíveis para todos os usuários, enquanto o
              controle de edição permanece restrito a administradores.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => iniciarCadastro('PUT')}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #3b82f6',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ➕ Nova PUT
            </button>
            <button
              type="button"
              onClick={() => iniciarCadastro('CALL')}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #10b981',
                background: '#ecfdf3',
                color: '#0f766e',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ➕ Nova CALL
            </button>
          </div>
        </div>

        {erroCarregarOperacoes ? (
          <div
            style={{
              marginBottom: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              color: '#92400e',
              fontSize: '14px'
            }}
          >
            {erroCarregarOperacoes}
          </div>
        ) : null}

        {salvandoOperacoes ? (
          <div
            style={{
              marginBottom: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontSize: '14px'
            }}
          >
            Salvando alterações na carteira...
          </div>
        ) : null}

        {modoEdicao ? (
          <form onSubmit={salvarOperacao} style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#475569', fontSize: '13px', fontWeight: 600 }}>Ativo base</span>
                <input
                  value={formData.ativoBase}
                  onChange={(e) => handleFormChange('ativoBase', e.target.value)}
                  required
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#475569', fontSize: '13px', fontWeight: 600 }}>Código da opção</span>
                <input
                  value={formData.codigoOpcao}
                  onChange={(e) => handleFormChange('codigoOpcao', e.target.value)}
                  required
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#475569', fontSize: '13px', fontWeight: 600 }}>Vencimento</span>
                <input
                  value={formData.vencimento}
                  onChange={(e) => handleFormChange('vencimento', e.target.value)}
                  placeholder="19/12/2025"
                  required
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#475569', fontSize: '13px', fontWeight: 600 }}>Strike</span>
                <input
                  value={formData.strike}
                  onChange={(e) => handleFormChange('strike', e.target.value)}
                  placeholder="66,29"
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#475569', fontSize: '13px', fontWeight: 600 }}>Prêmio</span>
                <input
                  value={formData.premio}
                  onChange={(e) => handleFormChange('premio', e.target.value)}
                  placeholder="1,52"
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#475569', fontSize: '13px', fontWeight: 600 }}>Prêmio customizado</span>
                <input
                  value={formData.premioCustom}
                  onChange={(e) => handleFormChange('premioCustom', e.target.value)}
                  placeholder="R$ 0,44 e R$ 0,47"
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#475569', fontSize: '13px', fontWeight: 600 }}>Renda %</span>
                <input
                  value={formData.rendaPercentual}
                  onChange={(e) => handleFormChange('rendaPercentual', e.target.value)}
                  placeholder="2,10"
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#475569', fontSize: '13px', fontWeight: 600 }}>
                  Garantia
                  {modoEdicao?.tipo === 'CALL' ? ' (quantidade de lotes)' : ''}
                </span>
                <input
                  value={formData.garantia}
                  onChange={(e) => handleFormChange('garantia', e.target.value)}
                  placeholder={modoEdicao?.tipo === 'CALL' ? '2 (lotes)' : '3326'}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                {modoEdicao?.tipo === 'CALL' && (
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                    Informe quantos lotes serão usados como garantia (ex.: 1, 2, 3).
                  </span>
                )}
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#475569', fontSize: '13px', fontWeight: 600 }}>Preço de referência</span>
                <input
                  value={formData.precoReferencia}
                  onChange={(e) => handleFormChange('precoReferencia', e.target.value)}
                  placeholder="65,79"
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#475569', fontSize: '13px', fontWeight: 600 }}>Ordem</span>
                <input
                  value={formData.ordem}
                  onChange={(e) => handleFormChange('ordem', e.target.value)}
                  placeholder="1"
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px', alignItems: 'center' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ color: '#475569', fontSize: '13px', fontWeight: 600 }}>Status</span>
                <select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value as CarteiraOperacao['status'])}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white' }}
                >
                  <option value="Aberta">Aberta</option>
                  <option value="Fechada">Fechada</option>
                  <option value="Encerrada">Encerrada</option>
                </select>
              </label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
                <button
                  type="button"
                  onClick={cancelarEdicao}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {modoEdicao.operacao ? 'Salvar alterações' : `Adicionar ${modoEdicao.tipo}`}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div
            style={{
              marginTop: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: '#f8fafc',
              color: '#475569',
              fontSize: '14px'
            }}
          >
            Clique em “Nova PUT” ou “Nova CALL” para adicionar, ou use os botões de editar nos cards.
          </div>
        )}
      </div>
    );
  };

  const totaisCarteira = React.useMemo(() => {
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

  if (!authLoading && (!hasCarteiraAccess || isTurma3ReleaseBlocked)) {
    const titulo = isTurma3ReleaseBlocked ? 'Disponível em breve' : 'Acesso Restrito';
    const descricao = isTurma3ReleaseBlocked
      ? (
        <>
          Esta página será liberada para o plano Renda Turbinada 3 em <strong>30/01/2026</strong>.
          <br />
          Até lá, continue acompanhando os demais conteúdos disponíveis no seu plano.
        </>
      )
      : (
        <>
          Esta página é exclusiva para assinantes do CF Renda Turbinada.
          <br />
          Solicite o upgrade com o nosso time de suporte para acompanhar as
          operações recomendadas.
        </>
      );

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
            {titulo}
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: '#64748b',
              lineHeight: '1.6',
              marginBottom: '32px'
            }}
          >
            {descricao}
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
    const operacoesOrdenadas = ordenarOperacoes(operacoes);
    if (operacoesOrdenadas.length === 0) {
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
          {operacoesOrdenadas.map((operacao) => { 
            const statusStyle = getStatusStyle(operacao.status);
            return (
              <div
                key={operacao.id}
                style={{
                  background: operacao.status === 'Encerrada' ? '#fafafa' : 'white',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: operacao.status === 'Encerrada' ? '2px solid #e2e8f0' : '1px solid #e2e8f0',
                  opacity: operacao.status === 'Encerrada' ? 0.5 : 1
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
                    {formatGarantia(operacao.garantia, operacao.tipoOperacao)}
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

                {isAdmin && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px dashed #e2e8f0'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => iniciarEdicao(operacao)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #3b82f6',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => removerOperacao(operacao.id, operacao.tipoOperacao)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #ef4444',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Excluir
                    </button>
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
              {isAdmin && (
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
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {operacoesOrdenadas.map((operacao) => { 
              const statusStyle = getStatusStyle(operacao.status);
              return (
                <tr
                  key={operacao.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.2s',
                    background: operacao.status === 'Encerrada' ? '#fafafa' : 'transparent',
                    opacity: operacao.status === 'Encerrada' ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (operacao.status !== 'Encerrada') {
                      e.currentTarget.style.background = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = operacao.status === 'Encerrada' ? '#fafafa' : 'transparent';
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
                    {formatGarantia(operacao.garantia, operacao.tipoOperacao)}
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
                  {isAdmin && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(operacao)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #3b82f6',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => removerOperacao(operacao.id, operacao.tipoOperacao)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #ef4444',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  )}
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

        {loadingOperacoes ? (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontSize: '14px'
            }}
          >
            Carregando operações atualizadas...
          </div>
        ) : null}
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

      {renderAdminPanel()}

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
