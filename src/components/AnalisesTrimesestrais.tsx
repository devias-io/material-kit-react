/*
 * COMPONENTE ANÁLISES TRIMESTRAIS - MOBILE RESPONSIVO
 *
 * Melhorias implementadas para mobile:
 * - Modal em tela cheia no mobile (bottom sheet)
 * - Layout em coluna para pontos favoráveis/atenção no mobile
 * - Métricas em coluna vertical no mobile
 * - Cards mais compactos com padding reduzido
 * - Fontes menores e mais adequadas para mobile
 * - Botões com largura completa no mobile
 * - Hook useIsMobile para detectar mobile sem causar problemas de hidratação
 * - Smooth scrolling no modal
 */

'use client';

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Eye, TrendingUp, TrendingDown, BarChart3, Target, AlertCircle, ExternalLink, Download, FileText } from 'lucide-react';

// Interfaces corrigidas para compatibilidade
interface MetricaTrimestreData {
  valor: number;
  unidade: string;
  variacao?: number;      // Variação trimestre vs trimestre anterior
  variacaoYoY?: number;   // Variação ano vs ano (principal campo usado)
  margem?: number;
}

type FinancialMetricDeltaBasis = 'yoy' | 'qoq' | 'pp' | 'abs';

interface FinancialMetricDynamicEntry {
  id?: string;
  slug?: string;
  label?: string | null;
  canonicalLabel?: string | null;
  rawLabel?: string | null;
  value?: number | string | null;
  formattedValue?: string | null;
  unit?: string | null;
  deltaValue?: number | string | null;
  deltaUnit?: string | null;
  deltaBasis?: FinancialMetricDeltaBasis | null;
  parseConfidence?: string | null;
  evidence?: string | null;
}

interface NormalizedMetricExtraction {
  slug?: string | null;
  normalized_label?: string | null;
  raw_label?: string | null;
  value?: number | string | null;
  value_num?: number | null;
  unit?: string | null;
  delta_value?: number | string | null;
  delta_unit?: string | null;
  delta_basis?: FinancialMetricDeltaBasis | null;
  formatted_value?: string | null;
  original?: {
    raw_label?: string | null;
  } | null;
  [key: string]: unknown;
}

interface AnaliseTrimestreData {
  id?: string;
  ticker: string;
  empresa: string;
  trimestre: string;
  dataPublicacao: string;
  autor: string;
  categoria: 'resultado_trimestral' | 'analise_setorial' | 'tese_investimento';
  
  // Conteúdo principal
  titulo: string;
  analiseCompleta: string;
  
  // Métricas do trimestre
  metricas: {
    receita?: MetricaTrimestreData;
    ebitda?: MetricaTrimestreData;
    lucroLiquido?: MetricaTrimestreData;
    roe?: MetricaTrimestreData;
    other_metrics?: FinancialMetricDynamicEntry[];
    otherMetrics?: FinancialMetricDynamicEntry[];
    metricasNormalizadas?: NormalizedMetricExtraction[];
    metricas_normalizadas?: NormalizedMetricExtraction[];
    [key: string]: any;
  };
  
  // Análise
  pontosFavoraveis: string;
  pontosAtencao: string;
  
  // Recomendação
  recomendacao: 'COMPRA' | 'VENDA' | 'MANTER';
nota?: number;

  
  // Links externos
  linkResultado?: string;
  linkConferencia?: string;

  status: 'draft' | 'published';
  otherMetrics?: FinancialMetricDynamicEntry[];
  other_metrics?: FinancialMetricDynamicEntry[];
  metricasNormalizadas?: NormalizedMetricExtraction[];
  metricas_normalizadas?: NormalizedMetricExtraction[];
}

// Função para formatar valores - corrigida
const formatarValorMetrica = (metrica: MetricaTrimestreData | undefined): string => {
  if (!metrica || !metrica.valor) return 'N/A';

  const valor = metrica.valor;
  const unidade = metrica.unidade === 'bilhões' ? 'bi' : 'mi';

  if (valor >= 1000 && unidade === 'mi') {
    return `R$ ${(valor / 1000).toFixed(1)} bi`;
  }

  return `R$ ${valor.toFixed(1)} ${unidade}`;
};

const parseNumericValue = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const sanitized = trimmed.replace(/[^0-9,.\-+]/g, '');
    if (!sanitized) return null;
    const hasComma = sanitized.includes(',');
    const hasDot = sanitized.includes('.');
    let normalized = sanitized;
    if (hasComma && hasDot) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
      normalized = normalized.replace(',', '.');
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getNormalizedMetricExtractions = (analise: AnaliseTrimestreData): NormalizedMetricExtraction[] => {
  const candidates: unknown[] = [
    analise.metricasNormalizadas,
    analise.metricas_normalizadas,
    analise.metricas?.metricasNormalizadas,
    analise.metricas?.metricas_normalizadas,
    (analise as any)?.dadosExtraidos?.metricasNormalizadas,
    (analise as any)?.dadosExtraidos?.metricas_normalizadas
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate as NormalizedMetricExtraction[];
    }
  }

  return [];
};

interface NormalizedMetricLookup {
  bySlug: Record<string, NormalizedMetricExtraction>;
  byLabel: Record<string, NormalizedMetricExtraction>;
}

const buildNormalizedMetricLookup = (analise: AnaliseTrimestreData): NormalizedMetricLookup => {
  const lookup: NormalizedMetricLookup = { bySlug: {}, byLabel: {} };
  const normalizedMetrics = getNormalizedMetricExtractions(analise);

  normalizedMetrics.forEach(metric => {
    const slugKey = typeof metric.slug === 'string' && metric.slug.trim()
      ? metric.slug.trim()
      : undefined;
    const normalizedLabelKey = typeof metric.normalized_label === 'string' && metric.normalized_label.trim()
      ? metric.normalized_label.trim()
      : undefined;

    if (slugKey) {
      lookup.bySlug[slugKey] = metric;
    }

    if (normalizedLabelKey) {
      lookup.byLabel[normalizedLabelKey] = metric;
    }
  });

  return lookup;
};

const extractDynamicMetricEntries = (analise: AnaliseTrimestreData): FinancialMetricDynamicEntry[] => {
  const candidates: unknown[] = [
    analise.otherMetrics,
    analise.other_metrics,
    analise.metricas?.otherMetrics,
    analise.metricas?.other_metrics
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate as FinancialMetricDynamicEntry[];
    }
  }

  const normalizedExtractions = getNormalizedMetricExtractions(analise);
  if (normalizedExtractions.length > 0) {
    return normalizedExtractions.map((metric, index) => {
      const slugCandidate = typeof metric.slug === 'string' && metric.slug.trim()
        ? metric.slug.trim()
        : typeof metric.normalized_label === 'string' && metric.normalized_label.trim()
          ? metric.normalized_label.trim()
          : typeof metric.raw_label === 'string' && metric.raw_label.trim()
            ? metric.raw_label.trim()
            : `metric-${index}`;

      const parsedValue = parseNumericValue(metric.value_num ?? metric.value);
      const parsedDelta = parseNumericValue(metric.delta_value);
      const formattedValue = typeof metric.value === 'string' && metric.value.trim()
        ? metric.value.trim()
        : typeof metric.formatted_value === 'string' && metric.formatted_value.trim()
          ? metric.formatted_value.trim()
          : undefined;
      const rawLabel = typeof metric.raw_label === 'string' && metric.raw_label.trim()
        ? metric.raw_label.trim()
        : typeof metric.original?.raw_label === 'string' && metric.original.raw_label.trim()
          ? metric.original.raw_label.trim()
          : undefined;

      return {
        id: slugCandidate,
        slug: slugCandidate,
        label: typeof metric.normalized_label === 'string' && metric.normalized_label.trim()
          ? metric.normalized_label.trim()
          : undefined,
        rawLabel,
        value: parsedValue !== null
          ? parsedValue
          : typeof metric.value === 'number'
            ? metric.value
            : formattedValue ?? null,
        formattedValue,
        unit: typeof metric.unit === 'string' ? metric.unit : undefined,
        deltaValue: parsedDelta !== null ? parsedDelta : metric.delta_value ?? null,
        deltaUnit: typeof metric.delta_unit === 'string' ? metric.delta_unit : undefined,
        deltaBasis: metric.delta_basis ?? null
      } satisfies FinancialMetricDynamicEntry;
    });
  }

  return [];
};

interface DeltaPresentation {
  arrow: string;
  color: string;
  text: string;
}

interface DisplayMetricEntry {
  key: string;
  label: string;
  valueText: string;
  deltaInfo: DeltaPresentation | null;
}

const resolveMetricLabel = (entry: FinancialMetricDynamicEntry, lookup: NormalizedMetricLookup): string => {
  const candidates = [
    entry.label,
    entry.canonicalLabel,
    entry.slug ? lookup.bySlug[entry.slug]?.normalized_label : undefined,
    entry.slug ? lookup.bySlug[entry.slug]?.raw_label : undefined,
    entry.label ? lookup.byLabel[entry.label]?.normalized_label : undefined,
    entry.label ? lookup.byLabel[entry.label]?.raw_label : undefined,
    entry.rawLabel,
    entry.slug
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return 'Métrica';
};

const formatDynamicMetricValue = (entry: FinancialMetricDynamicEntry): string => {
  if (!entry) return 'N/A';
  if (typeof entry.formattedValue === 'string' && entry.formattedValue.trim()) {
    return entry.formattedValue.trim();
  }

  if (entry.value === null || entry.value === undefined) {
    return 'N/A';
  }

  if (typeof entry.value === 'string') {
    const trimmed = entry.value.trim();
    return trimmed || 'N/A';
  }

  if (typeof entry.value !== 'number' || !Number.isFinite(entry.value)) {
    return 'N/A';
  }

  const unit = typeof entry.unit === 'string' ? entry.unit.trim() : '';
  if (unit === '%') {
    return `${entry.value.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })}%`;
  }

  if (unit.toLowerCase() === 'pp' || unit.toLowerCase() === 'p.p.' || unit.toLowerCase() === 'p.p') {
    return `${entry.value.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })} ${unit}`;
  }

  const decimals = unit.includes('%')
    ? 1
    : Math.abs(entry.value) < 10
      ? 2
      : 1;

  const formattedNumber = entry.value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  if (!unit) {
    return formattedNumber;
  }

  if (unit.toLowerCase().includes('r$')) {
    const normalizedUnit = unit.replace(/r\$/gi, 'R$').trim();
    const parts = normalizedUnit.split(' ');
    if (parts[0] === 'R$') {
      const suffix = parts.slice(1).join(' ');
      return `R$ ${formattedNumber}${suffix ? ` ${suffix}` : ''}`;
    }
    return `${normalizedUnit} ${formattedNumber}`.trim();
  }

  return `${formattedNumber} ${unit}`.trim();
};

const resolveDeltaPresentation = (entry: FinancialMetricDynamicEntry): DeltaPresentation | null => {
  const numericDelta = parseNumericValue(entry.deltaValue);
  if (numericDelta === null) return null;

  const resolvedUnit = (() => {
    if (typeof entry.deltaUnit === 'string' && entry.deltaUnit.trim()) {
      return entry.deltaUnit.trim();
    }
    if (entry.deltaBasis === 'pp') {
      return 'pp';
    }
    if (entry.deltaBasis === 'abs') {
      return '';
    }
    if ((entry.deltaBasis === 'yoy' || entry.deltaBasis === 'qoq') && typeof entry.unit === 'string' && entry.unit.includes('%')) {
      return '%';
    }
    return '';
  })();

  const decimals = Math.abs(numericDelta) < 10 ? 1 : 0;
  const formattedMagnitude = Math.abs(numericDelta).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  const prefix = numericDelta > 0 ? '+' : numericDelta < 0 ? '-' : '';
  const unitSuffix = resolvedUnit ? (resolvedUnit === '%' ? resolvedUnit : ` ${resolvedUnit}`) : '';
  const basisLabel = (() => {
    switch (entry.deltaBasis) {
      case 'yoy':
        return 'YoY';
      case 'qoq':
        return 'QoQ';
      case 'abs':
        return 'Abs';
      default:
        return '';
    }
  })();

  const text = `${prefix}${formattedMagnitude}${unitSuffix}${basisLabel ? ` ${basisLabel}` : ''}`.trim();
  const arrow = numericDelta > 0 ? '↗' : numericDelta < 0 ? '↘' : '→';
  const color = numericDelta > 0 ? '#059669' : numericDelta < 0 ? '#dc2626' : '#64748b';

  return { arrow, color, text };
};

const buildMetricsForDisplay = (analise: AnaliseTrimestreData): DisplayMetricEntry[] => {
  const dynamicEntries = extractDynamicMetricEntries(analise);
  if (!dynamicEntries || dynamicEntries.length === 0) {
    return [];
  }

  const lookup = buildNormalizedMetricLookup(analise);

  return dynamicEntries
    .map((entry, index) => {
      const label = resolveMetricLabel(entry, lookup);
      const valueText = formatDynamicMetricValue(entry);
      const deltaInfo = resolveDeltaPresentation(entry);
      const hasValue = valueText !== 'N/A' || deltaInfo !== null;

      if (!hasValue) {
        return null;
      }

      const key = typeof entry.id === 'string' && entry.id.trim()
        ? entry.id.trim()
        : typeof entry.slug === 'string' && entry.slug.trim()
          ? entry.slug.trim()
          : `${label}-${index}`;

      return {
        key,
        label,
        valueText,
        deltaInfo
      } satisfies DisplayMetricEntry;
    })
    .filter((metric): metric is DisplayMetricEntry => metric !== null);
};

// Hook para detectar mobile - evita problemas de hidratação
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check inicial
    checkIsMobile();
    
    // Listener para mudanças
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return isMobile;
};

const useActionButtonStyle = (isMobile: boolean) =>
  useMemo<React.CSSProperties>(() => ({
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '10px 14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: isMobile ? '100%' : 'auto',
    justifyContent: 'center'
  }), [isMobile]);

// Função para validar se a análise tem dados mínimos
const isAnaliseValida = (analise: AnaliseTrimestreData): boolean => {
  return !!(
    analise.id &&
    analise.ticker &&
    analise.titulo &&
    analise.dataPublicacao
  );
};

// Componente do Modal de Análise Completa - melhorado e responsivo
const ModalAnaliseCompleta = memo(({ 
  analise, 
  isOpen, 
  onClose 
}: { 
  analise: AnaliseTrimestreData | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const isMobile = useIsMobile();
  const actionButtonStyle = useActionButtonStyle(isMobile);
  
  if (!isOpen || !analise) return null;

  const getBadgeRecomendacao = (recomendacao: string) => {
    const cores = {
      'COMPRA': { bg: '#dcfce7', color: '#166534', emoji: '🟢' },
      'VENDA': { bg: '#fef2f2', color: '#dc2626', emoji: '🔴' },
      'MANTER': { bg: '#fef3c7', color: '#92400e', emoji: '🟡' }
    };
    
    const config = cores[recomendacao as keyof typeof cores] || cores.MANTER;
    
    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '700',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {config.emoji} {recomendacao}
      </span>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: isMobile ? '16px 16px 0 0' : '16px',
        width: isMobile ? '100%' : '90%',
        height: isMobile ? '95%' : '90%',
        maxWidth: isMobile ? 'none' : '1200px',
        maxHeight: isMobile ? 'none' : '800px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        position: isMobile ? 'fixed' : 'relative',
        bottom: isMobile ? '0' : 'auto',
        left: isMobile ? '0' : 'auto'
      }}>
        {/* Header do Modal - RESPONSIVO */}
        <div style={{
          padding: isMobile ? '16px 20px' : '24px 32px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: isMobile ? '8px' : '12px', 
                marginBottom: '8px',
                flexWrap: 'wrap'
              }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '20px' : '24px', 
                  fontWeight: '700', 
                  color: '#1e293b' 
                }}>
                  {analise.ticker}
                </h2>
                <span style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: isMobile ? '3px 8px' : '4px 12px',
                  borderRadius: '8px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '600'
                }}>
                  {analise.trimestre}
                </span>
                <span style={{
                  backgroundColor: '#e2e8f0',
                  color: '#64748b',
                  padding: isMobile ? '2px 6px' : '4px 8px',
                  borderRadius: '6px',
                  fontSize: isMobile ? '10px' : '12px',
                  fontWeight: '500'
                }}>
                  {analise.categoria.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontSize: isMobile ? '16px' : '18px', 
                fontWeight: '600', 
                color: '#374151',
                lineHeight: '1.4'
              }}>
                {analise.titulo}
              </h3>
              
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '12px' : '16px',
                  fontSize: isMobile ? '12px' : '14px',
                  color: '#64748b',
                  flexWrap: 'wrap'
                }}
              >
                <span>{new Date(analise.dataPublicacao).toLocaleDateString('pt-BR')}</span>
                <span>{analise.autor}</span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: isMobile ? '20px' : '24px',
                cursor: 'pointer',
                color: '#64748b',
                padding: '8px',
                borderRadius: '8px',
                marginLeft: '8px'
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Recomendação e Risco - RESPONSIVO */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? '8px' : '16px', 
            flexWrap: 'wrap' 
          }}>
            {getBadgeRecomendacao(analise.recomendacao)}
{analise.nota && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span style={{ fontSize: isMobile ? '12px' : '14px', color: '#64748b' }}>Nota:</span>
    <span style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '600', color: '#1e293b' }}>
      {analise.nota}/10
    </span>
  </div>
)}
          </div>
        </div>

        {/* Conteúdo Scrollável - RESPONSIVO */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: isMobile ? '20px 16px' : '32px',
          WebkitOverflowScrolling: 'touch'
        }}>

          {/* Métricas do Trimestre - CORRIGIDO */}
          {Object.keys(analise.metricas).length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h4
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '12px'
                }}
              >
                Métricas do Trimestre
              </h4>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px' 
              }}>
                {analise.metricas.receita && analise.metricas.receita.valor !== undefined && (
                  <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#15803d', fontWeight: '600' }}>Receita</h5>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#166534' }}>
                      {formatarValorMetrica(analise.metricas.receita)}
                    </div>
                    {/* CORRIGIDO: Usar variacaoYoY em vez de variacao */}
                    {analise.metricas.receita.variacaoYoY !== undefined && typeof analise.metricas.receita.variacaoYoY === 'number' && (
                      <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
                        {analise.metricas.receita.variacaoYoY >= 0 ? '↗' : '↘'} {analise.metricas.receita.variacaoYoY.toFixed(1)}% A/A
                      </div>
                    )}
                  </div>
                )}

                {analise.metricas.ebitda && analise.metricas.ebitda.valor !== undefined && (
                  <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', border: '1px solid #7dd3fc' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0c4a6e', fontWeight: '600' }}>EBITDA</h5>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0369a1' }}>
                      {formatarValorMetrica(analise.metricas.ebitda)}
                    </div>
                    {analise.metricas.ebitda.margem !== undefined && typeof analise.metricas.ebitda.margem === 'number' && (
                      <div style={{ fontSize: '12px', color: '#0c4a6e', marginTop: '4px' }}>
                        Margem: {analise.metricas.ebitda.margem.toFixed(1)}%
                      </div>
                    )}
                    {/* CORRIGIDO: Usar variacaoYoY */}
                    {analise.metricas.ebitda.variacaoYoY !== undefined && typeof analise.metricas.ebitda.variacaoYoY === 'number' && (
                      <div style={{ fontSize: '11px', color: '#0c4a6e', marginTop: '2px' }}>
                        {analise.metricas.ebitda.variacaoYoY >= 0 ? '↗' : '↘'} {analise.metricas.ebitda.variacaoYoY.toFixed(1)}% A/A
                      </div>
                    )}
                  </div>
                )}

                {analise.metricas.lucroLiquido && analise.metricas.lucroLiquido.valor !== undefined && (
                  <div style={{ backgroundColor: '#fdf4ff', padding: '16px', borderRadius: '8px', border: '1px solid #d8b4fe' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#7c2d12', fontWeight: '600' }}>Lucro Líquido</h5>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#92400e' }}>
                      {formatarValorMetrica(analise.metricas.lucroLiquido)}
                    </div>
                    {/* CORRIGIDO: Usar variacaoYoY */}
                    {analise.metricas.lucroLiquido.variacaoYoY !== undefined && typeof analise.metricas.lucroLiquido.variacaoYoY === 'number' && (
                      <div style={{ fontSize: '12px', color: '#7c2d12', marginTop: '4px' }}>
                        {analise.metricas.lucroLiquido.variacaoYoY >= 0 ? '↗' : '↘'} {analise.metricas.lucroLiquido.variacaoYoY.toFixed(1)}% A/A
                      </div>
                    )}
                  </div>
                )}

                {analise.metricas.roe && analise.metricas.roe.valor !== undefined && (
                  <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#991b1b', fontWeight: '600' }}>ROE</h5>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                      {typeof analise.metricas.roe.valor === 'number' ? analise.metricas.roe.valor.toFixed(1) : analise.metricas.roe.valor}%
                    </div>
                    {/* CORRIGIDO: Usar variacaoYoY para ROE também */}
                    {analise.metricas.roe.variacaoYoY !== undefined && typeof analise.metricas.roe.variacaoYoY === 'number' && (
                      <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>
                        {analise.metricas.roe.variacaoYoY >= 0 ? '↗' : '↘'} {analise.metricas.roe.variacaoYoY.toFixed(1)}p.p. A/A
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Análise Completa */}
          {analise.analiseCompleta && (
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} />
                Análise Completa
              </h4>
              <div 
                style={{
                  lineHeight: '1.7',
                  color: '#374151'
                }}
                dangerouslySetInnerHTML={{ __html: analise.analiseCompleta }}
              />
            </div>
          )}

          {/* Pontos Favoráveis vs Atenção */}
          {(analise.pontosFavoraveis || analise.pontosAtencao) && (
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                Análise Qualitativa
              </h4>
              
              {/* MOBILE FIRST: Stack vertical em telas pequenas, grid em telas grandes */}
              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: '16px'
              }}>
                {analise.pontosFavoraveis && (
                  <div style={{ 
                    backgroundColor: '#f0fdf4', 
                    padding: isMobile ? '16px' : '20px', 
                    borderRadius: '12px', 
                    border: '1px solid #bbf7d0',
                    flex: 1
                  }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#15803d' }}>
                      Pontos Favoráveis
                    </h5>
                    <div 
                      style={{ lineHeight: '1.6', color: '#166534', fontSize: isMobile ? '14px' : '16px' }}
                      dangerouslySetInnerHTML={{ __html: analise.pontosFavoraveis }}
                    />
                  </div>
                )}

                {analise.pontosAtencao && (
                  <div style={{ 
                    backgroundColor: '#fef3c7', 
                    padding: isMobile ? '16px' : '20px', 
                    borderRadius: '12px', 
                    border: '1px solid #fde68a',
                    flex: 1
                  }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                      Pontos de Atenção
                    </h5>
                    <div 
                      style={{ lineHeight: '1.6', color: '#92400e', fontSize: isMobile ? '14px' : '16px' }}
                      dangerouslySetInnerHTML={{ __html: analise.pontosAtencao }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Links Externos */}
          {(analise.linkResultado || analise.linkConferencia) && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
                Materiais Oficiais
              </h4>

              <div
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                {analise.linkResultado && (
                  <a
                    href={analise.linkResultado}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    style={{ ...actionButtonStyle }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                  >
                    <Download size={16} />
                    Baixar PDF
                  </a>
                )}

                {analise.linkConferencia && (
                  <a
                    href={analise.linkConferencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    style={{ ...actionButtonStyle }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                  >
                    <ExternalLink size={16} />
                    Abrir no site
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Componente Principal - CORRIGIDO E RESPONSIVO
const AnalisesTrimesestrais = memo(({ ticker }: { ticker: string }) => {
  const [analises, setAnalises] = useState<AnaliseTrimestreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analiseModalAberta, setAnaliseModalAberta] = useState<AnaliseTrimestreData | null>(null);
  const isMobile = useIsMobile();
  const actionButtonStyle = useActionButtonStyle(isMobile);

  // Carregar análises da API - MELHORADO
  useEffect(() => {
    const loadAnalises = async () => {
      if (!ticker) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔍 Buscando análises para ${ticker} via API...`);
        
        // 🚀 CHAMADA PARA API REAL
        const response = await fetch('/api/analises-trimestrais');
        
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const todasAnalises: AnaliseTrimestreData[] = await response.json();
        console.log(`✅ Total de análises carregadas da API: ${todasAnalises.length}`);
        
        // Filtrar por ticker (case-insensitive) e validar dados
        const analisesEncontradas = todasAnalises.filter((analise: AnaliseTrimestreData) => {
          if (!analise.ticker || !isAnaliseValida(analise)) return false;
          return analise.ticker.toUpperCase() === ticker.toUpperCase();
        });
        
        console.log(`✅ ${analisesEncontradas.length} análises válidas encontradas para ${ticker}`);
        
        // Filtrar apenas análises publicadas e ordenar por data
        const analisesPublicadas = analisesEncontradas
          .filter((analise: AnaliseTrimestreData) => analise.status === 'published')
          .sort((a: AnaliseTrimestreData, b: AnaliseTrimestreData) => {
            const dataA = new Date(a.dataPublicacao).getTime();
            const dataB = new Date(b.dataPublicacao).getTime();
            return dataB - dataA; // Mais recente primeiro
          });
        
        console.log(`📊 ${analisesPublicadas.length} análises publicadas para ${ticker}`);
        setAnalises(analisesPublicadas);
        
      } catch (error) {
        console.error('❌ Erro ao carregar análises:', error);
        setError(error instanceof Error ? error.message : 'Erro ao carregar análises');
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalises();
  }, [ticker]);

  const abrirModal = useCallback((analise: AnaliseTrimestreData) => {
    if (isAnaliseValida(analise)) {
      setAnaliseModalAberta(analise);
    }
  }, []);

  const fecharModal = useCallback(() => {
    setAnaliseModalAberta(null);
  }, []);

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0 0 20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          Análises Trimestrais
        </h3>
        
        <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p>Carregando análises de {ticker}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0 0 20px 0'
        }}>
          Análises Trimestrais
        </h3>
        
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <p style={{ color: '#dc2626', marginBottom: '16px' }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (analises.length === 0) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0 0 20px 0'
        }}>
          Análises Trimestrais
        </h3>
        
        <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <h4 style={{ marginBottom: '8px', color: '#1e293b' }}>
            Nenhuma análise encontrada
          </h4>
          <p style={{ marginBottom: '16px' }}>
            Ainda não há análises trimestrais para <strong>{ticker}</strong>
          </p>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            💡 As análises aparecerão aqui após serem publicadas
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Análises Trimestrais
          </h3>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          {analises.slice(0, 4).map((analise, index) => {
            const isRecente = index === 0;
            // CORRIGIDO: Garantir ID único
            const analiseKey = analise.id || `analise-${ticker}-${index}-${Date.now()}`;
            const displayMetrics = buildMetricsForDisplay(analise);
            const hasNormalizedMetrics = displayMetrics.length > 0;
            const legacyMetricas = (analise.metricas ?? {}) as AnaliseTrimestreData['metricas'];
            const hasLegacyMetrics = Boolean(
              (legacyMetricas?.receita && legacyMetricas.receita.valor !== undefined) ||
              (legacyMetricas?.ebitda && legacyMetricas.ebitda.valor !== undefined) ||
              (legacyMetricas?.roe && legacyMetricas.roe.valor !== undefined)
            );

            return (
              <div key={analiseKey} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '20px',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={() => abrirModal(analise)}>
                
                {isRecente && (
                  <div style={{
                    position: 'absolute',
                    top: isMobile ? '-6px' : '-8px',
                    right: isMobile ? '12px' : '16px',
                    backgroundColor: '#374151',
                    color: 'white',
                    padding: isMobile ? '3px 8px' : '4px 12px',
                    borderRadius: '12px',
                    fontSize: isMobile ? '10px' : '12px',
                    fontWeight: '600'
                  }}>
                    {isMobile ? 'RECENTE' : 'MAIS RECENTE'}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'stretch' : 'flex-start',
                    marginBottom: '12px',
                    gap: isMobile ? '12px' : '0'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <h4 style={{
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: '700',
                        color: '#1e293b',
                        margin: 0,
                        lineHeight: '1.3'
                      }}>
                        {analise.titulo}
                      </h4>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <span style={{
                        backgroundColor: '#374151',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        fontSize: isMobile ? '10px' : '12px',
                        fontWeight: '600'
                      }}>
                        {analise.trimestre}
                      </span>
                    </div>

                  </div>

                  <div style={{ 
                    textAlign: isMobile ? 'left' : 'right',
                    minWidth: isMobile ? 'auto' : '120px',
                    marginLeft: isMobile ? '0' : '20px',
                    display: 'flex',
                    flexDirection: isMobile ? 'row' : 'column',
                    alignItems: isMobile ? 'center' : 'flex-end',
                    gap: isMobile ? '12px' : '8px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: (() => {
                        switch (analise.recomendacao) {
                          case 'COMPRA': return '#dcfce7';
                          case 'VENDA': return '#fef2f2';
                          default: return '#fef3c7';
                        }
                      })(),
                      color: (() => {
                        switch (analise.recomendacao) {
                          case 'COMPRA': return '#166534';
                          case 'VENDA': return '#dc2626';
                          default: return '#92400e';
                        }
                      })(),
                      padding: isMobile ? '4px 8px' : '6px 12px',
                      borderRadius: '8px',
                      fontSize: isMobile ? '10px' : '12px',
                      fontWeight: '700'
                    }}>
                      {analise.recomendacao === 'COMPRA' ? '🟢' : analise.recomendacao === 'VENDA' ? '🔴' : '🟡'} {analise.recomendacao}
                    </div>
                    
{analise.nota && (
  <div style={{ fontSize: isMobile ? '12px' : '14px', color: '#64748b' }}>
    Nota: {analise.nota}/10
  </div>
)}
                  </div>
                </div>

                {/* Métricas Resumidas - MOBILE FRIENDLY */}
                {hasNormalizedMetrics ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? '8px' : '12px',
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #e2e8f0'
                    }}
                  >
                    {displayMetrics.map(metric => (
                      <div
                        key={metric.key}
                        style={{
                          fontSize: isMobile ? '11px' : '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span style={{ color: '#64748b' }}>{metric.label}:</span>
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{metric.valueText}</span>
                        {metric.deltaInfo && (
                          <span
                            style={{
                              color: metric.deltaInfo.color,
                              marginLeft: '4px',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {metric.deltaInfo.arrow} {metric.deltaInfo.text}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : hasLegacyMetrics ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? '8px' : '12px',
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #e2e8f0'
                    }}
                  >
                    {legacyMetricas.receita && legacyMetricas.receita.valor !== undefined && (
                      <div style={{ fontSize: isMobile ? '11px' : '12px' }}>
                        <span style={{ color: '#64748b' }}>Receita: </span>
                        <span style={{ fontWeight: '600', color: '#059669' }}>
                          {formatarValorMetrica(legacyMetricas.receita)}
                        </span>
                        {legacyMetricas.receita.variacaoYoY !== undefined && typeof legacyMetricas.receita.variacaoYoY === 'number' && (
                          <span style={{ color: legacyMetricas.receita.variacaoYoY >= 0 ? '#059669' : '#dc2626', marginLeft: '4px' }}>
                            ({legacyMetricas.receita.variacaoYoY >= 0 ? '+' : ''}{legacyMetricas.receita.variacaoYoY.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    )}

                    {legacyMetricas.ebitda && legacyMetricas.ebitda.valor !== undefined && (
                      <div style={{ fontSize: isMobile ? '11px' : '12px' }}>
                        <span style={{ color: '#64748b' }}>EBITDA: </span>
                        <span style={{ fontWeight: '600', color: '#0ea5e9' }}>
                          {formatarValorMetrica(legacyMetricas.ebitda)}
                        </span>
                        {legacyMetricas.ebitda.margem !== undefined && typeof legacyMetricas.ebitda.margem === 'number' && (
                          <span style={{ color: '#0ea5e9', marginLeft: '4px' }}>
                            ({legacyMetricas.ebitda.margem.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    )}

                    {legacyMetricas.roe && legacyMetricas.roe.valor !== undefined && (
                      <div style={{ fontSize: isMobile ? '11px' : '12px' }}>
                        <span style={{ color: '#64748b' }}>ROE: </span>
                        <span style={{ fontWeight: '600', color: '#dc2626' }}>
                          {typeof legacyMetricas.roe.valor === 'number' ? legacyMetricas.roe.valor.toFixed(1) : legacyMetricas.roe.valor}%
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e2e8f0'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      color: '#64748b',
                      fontSize: isMobile ? '12px' : '13px'
                    }}
                  >
                    <span>{new Date(analise.dataPublicacao).toLocaleDateString('pt-BR')}</span>
                    <span>{analise.autor}</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: 'center',
                      justifyContent: isMobile ? 'stretch' : 'flex-end',
                      gap: '12px',
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        abrirModal(analise);
                      }}
                      style={{ ...actionButtonStyle }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.backgroundColor = '#f1f5f9';
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                    >
                      <Eye size={16} />
                      Abrir análise
                    </button>

                    {analise.linkResultado && (
                      <a
                        href={analise.linkResultado}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        style={{ ...actionButtonStyle }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor = '#f1f5f9';
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                      >
                        <Download size={16} />
                        Baixar PDF
                      </a>
                    )}

                    {analise.linkConferencia && (
                      <a
                        href={analise.linkConferencia}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        style={{ ...actionButtonStyle }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor = '#f1f5f9';
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                      >
                        <ExternalLink size={16} />
                        Abrir no site
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {analises.length > 4 && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0' }}>
              Mostrando as 4 análises mais recentes • Total: {analises.length}
            </p>
          </div>
        )}
      </div>

      {/* Modal de Análise Completa */}
      <ModalAnaliseCompleta 
        analise={analiseModalAberta}
        isOpen={!!analiseModalAberta}
        onClose={fecharModal}
      />
    </>
  );
});

export default AnalisesTrimesestrais;