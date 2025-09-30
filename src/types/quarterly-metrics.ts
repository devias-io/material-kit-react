export type ParseConfidence = 'high' | 'medium' | 'low';

export type FinancialMetricDeltaBasis = 'yoy' | 'qoq' | 'pp' | 'abs';

export interface MetricExtractionItem {
  raw_label: string;
  normalized_label: string;
  slug: string;
  value: string | number | null;
  unit: string | null;
  delta_value: string | number | null;
  delta_unit: string | null;
  delta_basis: FinancialMetricDeltaBasis | null;
  value_num: number | null;
  parse_confidence: ParseConfidence;
  evidence: string | null;
}

export interface NormalizedMetricExtraction extends MetricExtractionItem {
  original?: MetricExtractionItem;
}

export interface MetricaTrimestreData {
  valor: number;
  unidade: string;
  variacao?: number;
  variacaoYoY?: number;
  margem?: number;
}

export interface FinancialMetricDynamicEntry {
  id: string;
  slug: string;
  label: string;
  value: number | null;
  unit: string | null;
  formattedValue?: string | null;
  deltaValue?: number | null;
  deltaUnit?: string | null;
  deltaBasis?: FinancialMetricDeltaBasis | null;
  parseConfidence: ParseConfidence;
  evidence?: string | null;
}

export interface DadosExtraidosPDF {
  empresa?: string;
  ticker?: string;
  trimestre?: string;
  dataReferencia?: string;
  metricas?: MetricExtractionItem[];
  metricasExtraidas?: MetricExtractionItem[];
  metricasMap?: Record<string, MetricExtractionItem>;
  metricasNormalizadas?: NormalizedMetricExtraction[];
  canonicalMetrics?: Partial<Record<CanonicalMetricKey, MetricaTrimestreData>>;
  otherMetrics?: FinancialMetricDynamicEntry[];
  dadosFinanceiros?: {
    lucroLiquido?: { valor: number; variacaoAA?: number; variacaoTT?: number; margem?: number };
    receita?: { valor: number; variacaoAA?: number; variacaoTT?: number };
    ebitda?: { valor: number; variacaoAA?: number; variacaoTT?: number; margem?: number };
    roe?: { valor: number; variacaoAA?: number };
    roa?: { valor: number; variacaoAA?: number };
    endividamento?: { valor: number; variacaoAA?: number };
    outrasMetricas?: Array<{ nome: string; valor: string; variacao?: string }>;
  };
  relatorioGerado?: {
    titulo: string;
    destaques: string[];
    pontosAtencao: string[];
    conclusao: string;
    recomendacao: 'COMPRA' | 'VENDA' | 'MANTER';
    nota?: number;
  };
  contextoMercado?: string;
  outlook?: string;
  conteudoCompleto?: string;
  success?: boolean;
  error?: string;
}

export type CanonicalMetricKey =
  | 'receita'
  | 'ebitda'
  | 'lucroLiquido'
  | 'roe'
  | 'roa'
  | 'endividamento';

export interface MetricNormalizationRule {
  canonicalSlug: string;
  canonicalLabel: string;
  synonyms: string[];
  canonicalKey?: CanonicalMetricKey;
  attachesMarginTo?: CanonicalMetricKey;
  defaultUnit?: string;
}

export interface AnaliseTrimestreData {
  id?: string;
  ticker: string;
  empresa: string;
  trimestre: string;
  dataPublicacao: string;
  autor: string;
  categoria: 'resultado_trimestral' | 'analise_setorial' | 'tese_investimento';
  titulo: string;
  analiseCompleta: string;
  metricas: {
    receita?: MetricaTrimestreData;
    ebitda?: MetricaTrimestreData;
    lucroLiquido?: MetricaTrimestreData;
    roe?: MetricaTrimestreData;
  };
  otherMetrics?: FinancialMetricDynamicEntry[];
  dadosExtraidos?: DadosExtraidosPDF;
  fonteDados?: 'manual' | 'pdf' | 'misto';
  nomeArquivoPDF?: string;
  dataProcessamentoPDF?: string;
  pontosFavoraveis: string;
  pontosAtencao: string;
  recomendacao: 'COMPRA' | 'VENDA' | 'MANTER';
  precoAlvo?: number;
  risco: 'BAIXO' | 'MÉDIO' | 'ALTO';
  linkResultado?: string;
  linkConferencia?: string;
  status: 'draft' | 'published';
}
