// 🎯 TIPOS E INTERFACES PARA MICRO CAPS
export interface Ativo {
  id: string;
  ticker: string;
  setor: string;
  dataEntrada: string;
  precoEntrada: number;
  precoTeto?: number;
  precoAtual: number;
  performance: number;
  performanceAcao: number;
  performanceProventos: number;
  proventosAtivo: number;
  variacao: number;
  variacaoPercent: number;
  volume: number;
  vies: 'Compra' | 'Aguardar' | 'Manter';
  viesOverride: 'AUTO' | 'MANTER';
  dy: string;
  statusApi: 'success' | 'error' | 'loading';
  nomeCompleto: string;
  rank: string;
}

export interface Cotacao {
  precoAtual: number;
  variacao: number;
  variacaoPercent: number;
  volume: number;
  nome: string;
}

export interface SmllData {
  valor: number;
  valorFormatado: string;
  variacao: number;
  variacaoPercent: number;
  trend: 'up' | 'down';
  timestamp: string;
  fonte: string;
}

export interface IbovespaData {
  valor: number;
  valorFormatado: string;
  variacao: number;
  variacaoPercent: number;
  trend: 'up' | 'down';
  timestamp: string;
  fonte: string;
}

export interface IbovespaPeriodo {
  performancePeriodo: number;
  dataInicial: string;
  ibovInicial: number;
  ibovAtual: number;
  anoInicial: number;
  diasNoPeriodo: number;
  dataEntradaCompleta: string;
  isEstimativa?: boolean;
}

export interface CarteiraMetricas {
  valorInicial: number;
  valorAtual: number;
  rentabilidadeTotal: number;
  quantidadeAtivos: number;
  melhorAtivo: Ativo | null;
  piorAtivo: Ativo | null;
  dyMedio: number;
  ativosPositivos: number;
  ativosNegativos: number;
}

export interface ApiStrategy {
  fetchQuotes: (tickers: string[]) => Promise<Map<string, Cotacao>>;
  fetchDividendYields: (tickers: string[]) => Promise<Map<string, string>>;
}

export interface ResponsiveInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
}