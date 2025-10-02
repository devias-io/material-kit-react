import React from 'react';
import { renderToString } from 'react-dom/server';

import AtivoPage from './page';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn()
}));

jest.mock('../../../../hooks/useDataStore', () => ({
  useDataStore: jest.fn()
}));

jest.mock('@/hooks/use-auth-access', () => ({
  useAuthAccess: jest.fn()
}));

jest.mock('@/hooks/ativo/useAgendaCorporativaTicker', () => ({
  useAgendaCorporativaTicker: () => ({ eventos: [], loading: false, error: null })
}));

jest.mock('@/hooks/ativo/useDividendYieldIntegrado', () => ({
  useDividendYieldIntegrado: () => ({
    dy12Meses: 0,
    dyFormatado: '0%',
    loading: false,
    fonte: ''
  })
}));

jest.mock('../../../../hooks/ativo/useProventosIntegrado', () => ({
  useProventosIntegrado: () => ({
    valorProventos: 0,
    performanceProventos: 0,
    loading: false,
    fonte: ''
  })
}));

jest.mock('../../../../hooks/ativo/useBDRDataAPI', () => ({
  useBDRDataAPI: () => ({ bdrData: null, bdrLoading: false })
}));

jest.mock('../../../../hooks/ativo/useHGBrasilFII', () => ({
  useHGBrasilFII: () => ({ dadosFII: null, loading: false })
}));

jest.mock('../../../../hooks/ativo/useCotacaoCompleta', () => ({
  useCotacaoCompleta: () => ({ cotacaoCompleta: null, loading: false, error: null })
}));

jest.mock('@/hooks/useBRAPIETF', () => ({
  useBRAPIETF: () => ({ etfData: null, loading: false })
}));

jest.mock('@/hooks/useRelatoriosAPI', () => ({
  useRelatoriosEstatisticas: () => ({
    estatisticas: { relatorios: [] },
    loading: false,
    error: null,
    carregarEstatisticas: jest.fn()
  })
}));

jest.mock('../../../../hooks/useAtivoDetalhes', () => ({
  useDadosFinanceiros: () => ({
    dadosFinanceiros: null,
    loading: false,
    error: null,
    ultimaAtualizacao: null,
    refetch: jest.fn()
  }),
  useDadosFII: () => ({ dadosFII: null, loading: false }),
  useDadosBDR: () => ({ bdrData: null, bdrLoading: false }),
  useHGBrasilAcoes: () => ({ dadosHGBrasil: null, loading: false }),
  useYahooFinanceInternacional: () => ({ dadosYahoo: null, loading: false }),
  useCotacaoUSD: () => ({
    cotacaoUSD: 5,
    loading: false,
    ultimaAtualizacao: null,
    refetch: jest.fn()
  }),
  formatCurrency: (value: number) => `R$ ${value}`,
  formatarValor: (value: number) => value,
  isBDREstrangeiro: () => false,
  getEstrangeiroFromBDR: () => null,
  getMercadoOrigem: () => 'B3',
  DadosFinanceiros: {},
  DadosFII: {},
  Relatorio: {}
}));

jest.mock('@/components/AnalisesTrimesestrais', () => () => null);
jest.mock('@/components/ETFHoldings', () => () => null);
jest.mock('@/components/ETFMetricCards', () => () => null);

const { useParams, useRouter } = require('next/navigation');
const { useDataStore } = require('../../../../hooks/useDataStore');
const { useAuthAccess } = require('@/hooks/use-auth-access');

describe('AtivoPage - acesso', () => {
  beforeAll(() => {
    const storage: Record<string, string> = {};

    (global as any).window = {
      innerWidth: 1024,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    (global as any).document = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    (global as any).navigator = { userAgent: 'node.js' };

    (global as any).sessionStorage = {
      getItem: (key: string) => (key in storage ? storage[key] : null),
      setItem: (key: string, value: string) => {
        storage[key] = String(value);
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach(key => delete storage[key]);
      }
    };

    (global as any).IntersectionObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();

    (useParams as jest.Mock).mockReturnValue({ ticker: 'DEXP3' });
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });

    (useAuthAccess as jest.Mock).mockReturnValue({
      planInfo: {
        pages: ['relatorio-semanal', 'small-caps', 'dividendos', 'fundos-imobiliarios']
      },
      loading: false
    });

    (useDataStore as jest.Mock).mockReturnValue({
      dados: {},
      CARTEIRAS_CONFIG: {
        microCaps: { nome: 'Micro Caps' },
        smallCaps: { nome: 'Small Caps' },
        dividendos: { nome: 'Dividendos' },
        fiis: { nome: 'FIIs' },
        dividendosInternacional: { nome: 'Div Internacional' },
        etfs: { nome: 'ETFs' },
        projetoAmerica: { nome: 'Projeto América' },
        exteriorStocks: { nome: 'Exterior Stocks' }
      },
      cotacoes: {},
      buscarCotacoes: jest.fn()
    });
  });

  it('exibe mensagem de acesso negado para microcap em plano LITE_V2', () => {
    const html = renderToString(<AtivoPage />);

    expect(html).toContain('Acesso negado ao ativo');
    expect(html).toContain('DEXP3');
  });
});
