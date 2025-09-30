import {
  AnaliseTrimestreData,
  CanonicalMetricKey,
  DadosExtraidosPDF,
  FinancialMetricDeltaBasis,
  FinancialMetricDynamicEntry,
  MetricaTrimestreData,
  MetricExtractionItem,
  MetricNormalizationRule,
  NormalizedMetricExtraction,
  ParseConfidence
} from '@/types/quarterly-metrics';

export const slugifyMetric = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const formatNumberPtBr = (value: number, fractionDigits = 2): string => {
  const abs = Math.abs(value);
  const maximumFractionDigits = abs < 1 ? Math.max(2, fractionDigits + 2) : fractionDigits;

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  });
};

export const formatValueWithUnit = (value: number, unit?: string | null): string => {
  const formattedNumber = formatNumberPtBr(value);
  if (!unit) {
    return formattedNumber;
  }

  if (unit.startsWith('R$')) {
    const parts = unit.split(' ').filter(Boolean);
    if (parts.length > 1) {
      const [currency, ...rest] = parts;
      return `${currency} ${formattedNumber} ${rest.join(' ')}`.trim();
    }
    return `${unit} ${formattedNumber}`.trim();
  }

  return `${formattedNumber} ${unit}`.trim();
};

export const combineConfidence = (
  ...levels: Array<ParseConfidence | undefined>
): ParseConfidence => {
  if (levels.some(level => level === 'low')) {
    return 'low';
  }

  if (levels.some(level => level === 'medium')) {
    return 'medium';
  }

  return 'high';
};

export const normalizeConfidenceLevel = (value: any): ParseConfidence => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value >= 0.75) return 'high';
    if (value >= 0.4) return 'medium';
    return 'low';
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['alto', 'alta', 'high', 'elevado', 'seguro'].includes(normalized)) return 'high';
    if (['medio', 'médio', 'medium', 'moderado'].includes(normalized)) return 'medium';
    if (['baixo', 'baixa', 'low', 'incerto'].includes(normalized)) return 'low';
  }

  return 'medium';
};

export const normalizeText = (value: string | null | undefined): string => {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9%$]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const normalizeDeltaBasisValue = (
  value: any
): FinancialMetricDeltaBasis | null => {
  if (!value && value !== 0) return null;
  const normalized = normalizeText(String(value));

  if (!normalized) return null;
  if (/(yoy|ano|a\/a)/.test(normalized)) return 'yoy';
  if (/(qoq|t\/t|trim|sequencial)/.test(normalized)) return 'qoq';
  if (/(pp|ponto)/.test(normalized)) return 'pp';
  if (/(abs|absol)/.test(normalized)) return 'abs';
  return null;
};

export const normalizeUnitString = (unit: string | null | undefined): string | null => {
  if (unit === null || unit === undefined) return null;
  const trimmed = unit.toString().replace(/\s+/g, ' ').trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const ensureUniqueMetricSlug = (
  candidate: string,
  fallback: string,
  usedSlugs: Set<string>
): string => {
  const baseCandidate = slugifyMetric(candidate) || slugifyMetric(fallback) || 'metrica';
  let slug = baseCandidate || 'metrica';
  let counter = 2;

  while (usedSlugs.has(slug) || !slug) {
    slug = `${baseCandidate || 'metrica'}-${counter++}`;
  }

  usedSlugs.add(slug);
  return slug;
};

export const METRIC_NORMALIZATION_RULES: MetricNormalizationRule[] = [
  {
    canonicalSlug: 'receita-liquida',
    canonicalLabel: 'Receita Líquida',
    canonicalKey: 'receita',
    defaultUnit: 'R$ mi',
    synonyms: [
      'receita líquida',
      'receita liquida',
      'receita operacional líquida',
      'receita operacional liquida',
      'receita consolidada',
      'receita total',
      'net revenue',
      'revenue',
      'sales revenue'
    ]
  },
  {
    canonicalSlug: 'ebitda-ajustado',
    canonicalLabel: 'EBITDA Ajustado',
    canonicalKey: 'ebitda',
    defaultUnit: 'R$ mi',
    synonyms: [
      'ebitda ajustado',
      'ebitda',
      'ebitda recorrente',
      'ebitda consolidado',
      'ebitda total',
      'ajusted ebitda'
    ]
  },
  {
    canonicalSlug: 'lucro-liquido',
    canonicalLabel: 'Lucro Líquido',
    canonicalKey: 'lucroLiquido',
    defaultUnit: 'R$ mi',
    synonyms: [
      'lucro líquido',
      'lucro liquido',
      'lucro líquido ajustado',
      'lucro liquido ajustado',
      'lucro líquido consolidado',
      'lucro atribuível',
      'net income',
      'net profit'
    ]
  },
  {
    canonicalSlug: 'roe',
    canonicalLabel: 'ROE',
    canonicalKey: 'roe',
    defaultUnit: '%',
    synonyms: [
      'roe',
      'return on equity',
      'retorno sobre patrimônio líquido',
      'retorno sobre patrimonio liquido'
    ]
  },
  {
    canonicalSlug: 'roa',
    canonicalLabel: 'ROA',
    canonicalKey: 'roa',
    defaultUnit: '%',
    synonyms: [
      'roa',
      'return on assets',
      'retorno sobre ativos'
    ]
  },
  {
    canonicalSlug: 'endividamento-liquido',
    canonicalLabel: 'Endividamento Líquido',
    canonicalKey: 'endividamento',
    defaultUnit: '%',
    synonyms: [
      'endividamento',
      'alavancagem',
      'alavancagem líquida',
      'alavancagem liquida',
      'net debt to ebitda',
      'dívida líquida/ebitda',
      'divida liquida/ebitda'
    ]
  },
  {
    canonicalSlug: 'margem-ebitda',
    canonicalLabel: 'Margem EBITDA',
    attachesMarginTo: 'ebitda',
    defaultUnit: '%',
    synonyms: [
      'margem ebitda',
      'ebitda margin',
      'margem operacional ebitda'
    ]
  },
  {
    canonicalSlug: 'margem-liquida',
    canonicalLabel: 'Margem Líquida',
    attachesMarginTo: 'lucroLiquido',
    defaultUnit: '%',
    synonyms: [
      'margem líquida',
      'margem liquida',
      'net margin',
      'margem de lucro líquida',
      'margem de lucro liquida'
    ]
  }
];

export const findMetricRule = (
  metric: MetricExtractionItem
): MetricNormalizationRule | undefined => {
  const normalizedCandidates = [
    normalizeText(metric.normalized_label),
    normalizeText(metric.raw_label),
    normalizeText(metric.slug)
  ].filter(Boolean);

  for (const rule of METRIC_NORMALIZATION_RULES) {
    const normalizedSynonyms = rule.synonyms.map(normalizeText);

    if (
      normalizedCandidates.some(candidate =>
        normalizedSynonyms.some(syn => candidate.includes(syn) || syn.includes(candidate))
      )
    ) {
      return rule;
    }
  }

  return undefined;
};

export const convertLegacyFinancialsToMetricItems = (
  dadosFinanceiros: NonNullable<DadosExtraidosPDF['dadosFinanceiros']>
): MetricExtractionItem[] => {
  const items: MetricExtractionItem[] = [];

  const pushMetric = (
    rawLabel: string,
    normalizedLabel: string,
    slug: string,
    value: number,
    unit: string,
    deltaAA?: number | null,
    deltaTT?: number | null
  ) => {
    items.push({
      raw_label: rawLabel,
      normalized_label: normalizedLabel,
      slug,
      value: `${unit} ${formatNumberPtBr(value)}`.trim(),
      unit,
      delta_value: deltaAA ?? null,
      delta_unit: deltaAA !== null && deltaAA !== undefined ? '%' : null,
      delta_basis: deltaAA !== null && deltaAA !== undefined ? 'yoy' : null,
      value_num: value,
      parse_confidence: 'medium',
      evidence: null
    });

    if (deltaTT !== undefined && deltaTT !== null) {
      items.push({
        raw_label: `${rawLabel} QoQ`,
        normalized_label: `${normalizedLabel} QoQ`,
        slug: `${slug}-qoq`,
        value: `${unit} ${formatNumberPtBr(value)}`.trim(),
        unit,
        delta_value: deltaTT,
        delta_unit: '%',
        delta_basis: 'qoq',
        value_num: value,
        parse_confidence: 'medium',
        evidence: null
      });
    }
  };

  if (dadosFinanceiros.receita?.valor !== undefined) {
    pushMetric(
      'Receita Líquida',
      'Receita Líquida',
      'receita-liquida',
      dadosFinanceiros.receita.valor,
      'R$ mi',
      dadosFinanceiros.receita.variacaoAA ?? null,
      dadosFinanceiros.receita.variacaoTT ?? null
    );
  }

  if (dadosFinanceiros.ebitda?.valor !== undefined) {
    pushMetric(
      'EBITDA',
      'EBITDA',
      'ebitda',
      dadosFinanceiros.ebitda.valor,
      'R$ mi',
      dadosFinanceiros.ebitda.variacaoAA ?? null,
      dadosFinanceiros.ebitda.variacaoTT ?? null
    );

    if (dadosFinanceiros.ebitda.margem !== undefined) {
      items.push({
        raw_label: 'Margem EBITDA',
        normalized_label: 'Margem EBITDA',
        slug: 'margem-ebitda',
        value: `${formatNumberPtBr(dadosFinanceiros.ebitda.margem)} %`,
        unit: '%',
        delta_value: null,
        delta_unit: null,
        delta_basis: null,
        value_num: dadosFinanceiros.ebitda.margem,
        parse_confidence: 'medium',
        evidence: null
      });
    }
  }

  if (dadosFinanceiros.lucroLiquido?.valor !== undefined) {
    pushMetric(
      'Lucro Líquido',
      'Lucro Líquido',
      'lucro-liquido',
      dadosFinanceiros.lucroLiquido.valor,
      'R$ mi',
      dadosFinanceiros.lucroLiquido.variacaoAA ?? null,
      dadosFinanceiros.lucroLiquido.variacaoTT ?? null
    );

    if (dadosFinanceiros.lucroLiquido.margem !== undefined) {
      items.push({
        raw_label: 'Margem Líquida',
        normalized_label: 'Margem Líquida',
        slug: 'margem-liquida',
        value: `${formatNumberPtBr(dadosFinanceiros.lucroLiquido.margem)} %`,
        unit: '%',
        delta_value: null,
        delta_unit: null,
        delta_basis: null,
        value_num: dadosFinanceiros.lucroLiquido.margem,
        parse_confidence: 'medium',
        evidence: null
      });
    }
  }

  if (dadosFinanceiros.roe?.valor !== undefined) {
    items.push({
      raw_label: 'ROE',
      normalized_label: 'ROE',
      slug: 'roe',
      value: `${formatNumberPtBr(dadosFinanceiros.roe.valor)} %`,
      unit: '%',
      delta_value: dadosFinanceiros.roe.variacaoAA ?? null,
      delta_unit: dadosFinanceiros.roe.variacaoAA !== undefined ? 'p.p.' : null,
      delta_basis: dadosFinanceiros.roe.variacaoAA !== undefined ? 'pp' : null,
      value_num: dadosFinanceiros.roe.valor,
      parse_confidence: 'medium',
      evidence: null
    });
  }

  return items;
};

export const normalizeNumericString = (value: string): string => {
  let cleaned = value.replace(/\s+/g, '');
  const hasParentheses = cleaned.includes('(') && cleaned.includes(')');
  cleaned = cleaned.replace(/[()]/g, '');

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }

  if (hasParentheses && !cleaned.startsWith('-')) {
    cleaned = `-${cleaned}`;
  }

  return cleaned;
};

export const normalizeMetricExtractionItems = (
  dadosPDF: DadosExtraidosPDF
): NormalizedMetricExtraction[] => {
  const usedSlugs = new Set<string>();
  const normalizedItems: NormalizedMetricExtraction[] = [];

  const pushItem = (item: any) => {
    if (!item || typeof item !== 'object') return;

    const rawLabelSource = item.raw_label ?? item.nome ?? item.label ?? item.normalized_label ?? item.slug;
    const rawLabel =
      typeof rawLabelSource === 'string' && rawLabelSource.trim() ? rawLabelSource.trim() : 'Métrica Identificada';

    const normalizedLabelSource = item.normalized_label ?? item.label ?? rawLabel;
    const normalizedLabel =
      typeof normalizedLabelSource === 'string' && normalizedLabelSource.trim() ? normalizedLabelSource.trim() : rawLabel;

    const slugCandidate = typeof item.slug === 'string' && item.slug.trim() ? item.slug.trim() : normalizedLabel;

    const slug = ensureUniqueMetricSlug(slugCandidate, normalizedLabel, usedSlugs);

    let valueNum: number | null = null;
    if (typeof item.value_num === 'number' && Number.isFinite(item.value_num)) {
      valueNum = item.value_num;
    } else if (typeof item.value_num === 'string') {
      const normalized = normalizeNumericString(item.value_num);
      const parsed = parseFloat(normalized);
      valueNum = Number.isFinite(parsed) ? parsed : null;
    } else if (typeof item.valueNum === 'number' && Number.isFinite(item.valueNum)) {
      valueNum = item.valueNum;
    } else if (typeof item.valor === 'number') {
      valueNum = item.valor;
    }

    const unit = normalizeUnitString(item.unit ?? item.unidade ?? item.currency ?? null);
    const deltaValue = item.delta_value ?? item.deltaValue ?? item.variacao ?? null;
    const deltaUnit = normalizeUnitString(item.delta_unit ?? item.deltaUnit ?? null);
    const deltaBasis = normalizeDeltaBasisValue(item.delta_basis ?? item.deltaBasis ?? null);

    const normalized: NormalizedMetricExtraction = {
      raw_label: rawLabel,
      normalized_label: normalizedLabel,
      slug,
      value: item.value ?? item.valorFormatado ?? item.formattedValue ?? null,
      unit: unit,
      delta_value: deltaValue,
      delta_unit: deltaUnit,
      delta_basis: deltaBasis,
      value_num: valueNum,
      parse_confidence: normalizeConfidenceLevel(
        item.parse_confidence ?? item.parseConfidence ?? item.confidence ?? null
      ),
      evidence: item.evidence ? String(item.evidence) : typeof item.value === 'string' ? item.value : null,
      original: item as MetricExtractionItem
    };

    normalizedItems.push(normalized);
  };

  const candidateArrays: Array<any[] | undefined> = [
    dadosPDF.metricasNormalizadas as any,
    dadosPDF.metricas as any,
    dadosPDF.metricasExtraidas as any,
    dadosPDF.metricasMap ? Object.values(dadosPDF.metricasMap) : undefined
  ];

  candidateArrays.forEach(list => {
    if (Array.isArray(list)) {
      list.forEach(pushItem);
    }
  });

  if (normalizedItems.length === 0 && dadosPDF.dadosFinanceiros) {
    convertLegacyFinancialsToMetricItems(dadosPDF.dadosFinanceiros).forEach(pushItem);
  }

  return normalizedItems;
};

export const stripOriginalMetric = (
  item: NormalizedMetricExtraction
): MetricExtractionItem => {
  const { original, ...rest } = item;
  return rest;
};

export const parseValueWithUnit = (
  rawValue: number | string | null | undefined,
  options?: { defaultUnit?: string }
): {
  value: number | null;
  unit: string | null;
  formattedValue: string | null;
  parseConfidence: ParseConfidence;
  evidence: string | null;
} => {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return {
      value: null,
      unit: options?.defaultUnit ?? null,
      formattedValue: null,
      parseConfidence: 'low',
      evidence: null
    };
  }

  if (typeof rawValue === 'number' && !Number.isNaN(rawValue)) {
    const unit = options?.defaultUnit ?? null;
    const formattedValue = formatValueWithUnit(rawValue, unit);
    return {
      value: rawValue,
      unit,
      formattedValue,
      parseConfidence: 'high',
      evidence: formattedValue
    };
  }

  const text = String(rawValue).trim();
  if (!text) {
    return {
      value: null,
      unit: options?.defaultUnit ?? null,
      formattedValue: null,
      parseConfidence: 'low',
      evidence: null
    };
  }

  const lower = text.toLowerCase();
  let unit = options?.defaultUnit ?? null;
  let currencyPrefix = '';

  if (lower.includes('r$')) {
    currencyPrefix = 'R$';
  }

  if (/p\.?p\.?/i.test(lower)) {
    unit = 'p.p.';
  } else if (/%/.test(lower)) {
    unit = '%';
  } else if (/\b(bilh(?:ões|oes|ão|ao)?|bi)\b/.test(lower)) {
    unit = currencyPrefix ? `${currencyPrefix} bi` : 'bi';
  } else if (/\b(milh(?:ões|oes|ão|ao|o|oes)|mi)\b/.test(lower)) {
    unit = currencyPrefix ? `${currencyPrefix} mi` : 'mi';
  } else if (/\bmil\b/.test(lower)) {
    unit = currencyPrefix ? `${currencyPrefix} mil` : 'mil';
  } else if (currencyPrefix && !unit) {
    unit = currencyPrefix;
  }

  const numericMatch = text.match(/-?[\d]+[\d.,]*/);
  let numericValue: number | null = null;

  if (numericMatch) {
    const normalized = normalizeNumericString(numericMatch[0]);
    const parsed = parseFloat(normalized);
    if (!Number.isNaN(parsed)) {
      numericValue = parsed;
      if (!normalized.startsWith('-') && (/queda|negativo|redução/.test(lower) || /\(.*\)/.test(text))) {
        numericValue = -Math.abs(parsed);
      }
    }
  }

  const parseConfidence: ParseConfidence = numericValue === null ? 'low' : 'medium';
  const formattedValue = numericValue !== null ? formatValueWithUnit(numericValue, unit) : null;

  return {
    value: numericValue,
    unit,
    formattedValue,
    parseConfidence,
    evidence: text
  };
};

export const parseVariationString = (
  rawVariation: number | string | null | undefined,
  fallbackBasis?: FinancialMetricDeltaBasis
): {
  value: number | null;
  unit: string | null;
  basis: FinancialMetricDeltaBasis | null;
  parseConfidence: ParseConfidence;
  evidence: string | null;
} => {
  if (rawVariation === null || rawVariation === undefined || rawVariation === '') {
    return {
      value: null,
      unit: null,
      basis: fallbackBasis ?? null,
      parseConfidence: 'low',
      evidence: null
    };
  }

  if (typeof rawVariation === 'number' && !Number.isNaN(rawVariation)) {
    const basis = fallbackBasis ?? 'yoy';
    const unit = basis === 'pp' ? 'p.p.' : basis === 'abs' ? null : '%';
    return {
      value: rawVariation,
      unit,
      basis,
      parseConfidence: 'high',
      evidence: typeof rawVariation === 'string' ? rawVariation : null
    };
  }

  const text = String(rawVariation).trim();
  if (!text) {
    return {
      value: null,
      unit: null,
      basis: fallbackBasis ?? null,
      parseConfidence: 'low',
      evidence: null
    };
  }

  const basis = normalizeDeltaBasisValue(rawVariation) ?? fallbackBasis ?? null;
  const unit = basis === 'pp' ? 'p.p.' : basis === 'abs' ? null : '%';
  const numericMatch = text.match(/-?[\d]+[\d.,]*/);
  let numericValue: number | null = null;

  if (numericMatch) {
    const normalized = normalizeNumericString(numericMatch[0]);
    const parsed = parseFloat(normalized);
    if (!Number.isNaN(parsed)) {
      numericValue = parsed;
      if (!normalized.startsWith('-') && (/queda|negativo/.test(text.toLowerCase()) || /\(.*\)/.test(text))) {
        numericValue = -Math.abs(parsed);
      }
    }
  }

  const parseConfidence: ParseConfidence = numericValue === null ? 'low' : 'medium';

  return {
    value: numericValue,
    unit,
    basis,
    parseConfidence,
    evidence: text
  };
};

const inferDefaultUnitFromLabel = (label: string): string | undefined => {
  const lower = label.toLowerCase();
  if (lower.includes('%') || lower.includes('margem') || lower.includes('taxa') || lower.includes('roe') || lower.includes('roa')) {
    return '%';
  }

  if (lower.includes('preço') || lower.includes('ticket') || lower.includes('receita') || lower.includes('lucro') || lower.includes('ebitda')) {
    return 'R$ mi';
  }

  return undefined;
};

export const resolveMetricValue = (
  metric: NormalizedMetricExtraction,
  rule?: MetricNormalizationRule
): {
  value: number | null;
  unit: string | null;
  formattedValue: string | null;
  parseConfidence: ParseConfidence;
  evidence: string | null;
} => {
  if (metric.value_num !== null && Number.isFinite(metric.value_num)) {
    const unit = normalizeUnitString(metric.unit ?? rule?.defaultUnit ?? null);
    const formattedValue = unit ? formatValueWithUnit(metric.value_num, unit) : formatNumberPtBr(metric.value_num);
    return {
      value: metric.value_num,
      unit,
      formattedValue,
      parseConfidence: 'high',
      evidence: metric.value ? String(metric.value) : formattedValue
    };
  }

  if (typeof metric.value === 'number' && Number.isFinite(metric.value)) {
    const unit = normalizeUnitString(metric.unit ?? rule?.defaultUnit ?? null);
    const formattedValue = unit ? formatValueWithUnit(metric.value, unit) : formatNumberPtBr(metric.value);
    return {
      value: metric.value,
      unit,
      formattedValue,
      parseConfidence: 'high',
      evidence: formattedValue
    };
  }

  const parsed = parseValueWithUnit(metric.value, { defaultUnit: rule?.defaultUnit ?? inferDefaultUnitFromLabel(metric.raw_label) });
  return {
    ...parsed,
    evidence: parsed.evidence ?? (typeof metric.value === 'string' ? metric.value : null)
  };
};

export const resolveMetricDelta = (
  metric: NormalizedMetricExtraction
): {
  value: number | null;
  unit: string | null;
  basis: FinancialMetricDeltaBasis | null;
  parseConfidence: ParseConfidence;
  evidence: string | null;
} => {
  const providedBasis = metric.delta_basis ?? null;
  const fallbackBasis = providedBasis ?? undefined;
  const rawDelta = metric.delta_value;

  if (typeof rawDelta === 'number' && Number.isFinite(rawDelta)) {
    const unit = metric.delta_unit ?? (providedBasis === 'pp' ? 'p.p.' : providedBasis === 'abs' ? null : '%');
    return {
      value: rawDelta,
      unit,
      basis: providedBasis ?? null,
      parseConfidence: 'high',
      evidence: typeof metric.delta_value === 'string' ? metric.delta_value : null
    };
  }

  const parsed = parseVariationString(rawDelta, fallbackBasis);
  const basis = parsed.basis ?? providedBasis ?? null;
  const unit = metric.delta_unit ?? parsed.unit ?? (basis === 'pp' ? 'p.p.' : basis === 'abs' ? null : '%');

  return {
    value: parsed.value,
    unit,
    basis,
    parseConfidence: parsed.parseConfidence,
    evidence: parsed.evidence ?? (typeof rawDelta === 'string' ? rawDelta : null)
  };
};

export const buildMetricEvidence = (
  metric: NormalizedMetricExtraction,
  valueResolution: ReturnType<typeof resolveMetricValue>,
  deltaResolution: ReturnType<typeof resolveMetricDelta>
): string | null => {
  const pieces = [
    metric.evidence,
    typeof metric.value === 'string' ? metric.value : null,
    valueResolution.evidence,
    deltaResolution.evidence
  ].filter((value, index, array) => value && array.indexOf(value) === index) as string[];

  return pieces.length > 0 ? pieces.join(' | ') : null;
};

export const convertCurrencyToMillions = (
  value: number,
  unit: string | null
): number => {
  if (!Number.isFinite(value)) {
    return value;
  }

  const normalizedUnit = unit ? unit.toLowerCase() : '';

  if (normalizedUnit.includes('bi')) {
    return value * 1000;
  }

  if (normalizedUnit.includes('milhões') || normalizedUnit.includes('milhao') || normalizedUnit.includes('mi')) {
    return value;
  }

  if (normalizedUnit.includes('mil ') && !normalizedUnit.includes('milhão') && !normalizedUnit.includes('milhao')) {
    return value / 1000;
  }

  if (normalizedUnit.includes('r$') || normalizedUnit.includes('$')) {
    if (Math.abs(value) >= 1_000_000) {
      return value / 1_000_000;
    }
    if (Math.abs(value) >= 1_000) {
      return value / 1_000;
    }
    return value;
  }

  if (!normalizedUnit && Math.abs(value) >= 1_000_000) {
    return value / 1_000_000;
  }

  return value;
};

export const inferLegacyUnitForKey = (key: CanonicalMetricKey): string => {
  if (key === 'receita' || key === 'ebitda' || key === 'lucroLiquido') {
    return 'milhões';
  }

  if (key === 'roe' || key === 'roa' || key === 'endividamento') {
    return '%';
  }

  return '';
};

export const convertValueForCanonical = (
  key: CanonicalMetricKey,
  value: number | null,
  unit: string | null
): { valor: number | null; unidade: string | null } => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return { valor: null, unidade: unit };
  }

  if (key === 'receita' || key === 'ebitda' || key === 'lucroLiquido') {
    return {
      valor: convertCurrencyToMillions(value, unit),
      unidade: 'milhões'
    };
  }

  if (key === 'endividamento') {
    if (unit && unit.toLowerCase().includes('x')) {
      return { valor: value, unidade: 'x' };
    }
    return { valor: value, unidade: '%' };
  }

  if (key === 'roe' || key === 'roa') {
    return { valor: value, unidade: '%' };
  }

  return { valor: value, unidade: unit };
};

export const buildMetricCollectionsFromPDF = (
  dadosPDF: DadosExtraidosPDF
): {
  dynamicEntries: FinancialMetricDynamicEntry[];
  canonicalMetrics: Partial<Record<CanonicalMetricKey, MetricaTrimestreData>>;
  normalizedMetrics: NormalizedMetricExtraction[];
  metricMap: Record<string, NormalizedMetricExtraction>;
} => {
  const normalizedMetrics = normalizeMetricExtractionItems(dadosPDF);
  const dynamicEntries: FinancialMetricDynamicEntry[] = [];
  const metricMap: Record<string, NormalizedMetricExtraction> = {};
  const usedDynamicSlugs = new Set<string>();
  const canonicalAccumulator: Partial<
    Record<CanonicalMetricKey, Partial<MetricaTrimestreData> & { unidade?: string }>
  > = {};
  const pendingMargins: Partial<Record<CanonicalMetricKey, number>> = {};

  const ensureAccumulator = (key: CanonicalMetricKey) => {
    if (!canonicalAccumulator[key]) {
      canonicalAccumulator[key] = {};
    }
    return canonicalAccumulator[key]!;
  };

  normalizedMetrics.forEach(metric => {
    metricMap[metric.slug] = metric;
    const rule = findMetricRule(metric);
    const label = rule?.canonicalLabel ?? metric.normalized_label ?? metric.raw_label;
    const slug = ensureUniqueMetricSlug(metric.slug, label, usedDynamicSlugs);
    const valueResolution = resolveMetricValue(metric, rule);
    const deltaResolution = resolveMetricDelta(metric);
    const parseConfidence = combineConfidence(
      metric.parse_confidence,
      valueResolution.parseConfidence,
      deltaResolution.parseConfidence
    );
    const evidence = buildMetricEvidence(metric, valueResolution, deltaResolution);

    dynamicEntries.push({
      id: slug,
      slug,
      label,
      value: valueResolution.value,
      unit: valueResolution.unit,
      formattedValue: valueResolution.formattedValue,
      deltaValue: deltaResolution.value,
      deltaUnit: deltaResolution.unit,
      deltaBasis: deltaResolution.basis,
      parseConfidence,
      evidence
    });

    if (rule?.canonicalKey) {
      const { valor, unidade } = convertValueForCanonical(
        rule.canonicalKey,
        valueResolution.value,
        valueResolution.unit
      );
      if (valor !== null && valor !== undefined) {
        const accumulator = ensureAccumulator(rule.canonicalKey);
        accumulator.valor = valor;
        accumulator.unidade = unidade ?? accumulator.unidade ?? inferLegacyUnitForKey(rule.canonicalKey);
      }

      if (deltaResolution.value !== null && deltaResolution.value !== undefined) {
        const accumulator = ensureAccumulator(rule.canonicalKey);
        if (deltaResolution.basis === 'qoq') {
          accumulator.variacao = deltaResolution.value;
        } else {
          accumulator.variacaoYoY = deltaResolution.value;
        }
      }
    }

    if (rule?.attachesMarginTo && valueResolution.value !== null && valueResolution.value !== undefined) {
      pendingMargins[rule.attachesMarginTo] = valueResolution.value;
    }
  });

  Object.entries(pendingMargins).forEach(([key, margin]) => {
    if (margin === undefined || margin === null) return;
    const canonicalKey = key as CanonicalMetricKey;
    const accumulator = canonicalAccumulator[canonicalKey];
    if (accumulator) {
      accumulator.margem = margin;
    }
  });

  const canonicalMetrics: Partial<Record<CanonicalMetricKey, MetricaTrimestreData>> = {};
  (Object.keys(canonicalAccumulator) as CanonicalMetricKey[]).forEach(key => {
    const accumulator = canonicalAccumulator[key];
    if (!accumulator) return;
    if (accumulator.valor === undefined || accumulator.valor === null) return;

    canonicalMetrics[key] = {
      valor: accumulator.valor,
      unidade: accumulator.unidade ?? inferLegacyUnitForKey(key),
      variacao: accumulator.variacao,
      variacaoYoY: accumulator.variacaoYoY,
      margem: accumulator.margem
    } as MetricaTrimestreData;
  });

  return {
    dynamicEntries,
    canonicalMetrics,
    normalizedMetrics,
    metricMap
  };
};

export const buildLegacyFinancialsFromCanonical = (
  canonical: Partial<Record<CanonicalMetricKey, MetricaTrimestreData>>,
  original?: DadosExtraidosPDF['dadosFinanceiros']
): DadosExtraidosPDF['dadosFinanceiros'] | undefined => {
  const legacy: DadosExtraidosPDF['dadosFinanceiros'] = original ? { ...original } : {};

  const applyMetric = (
    key: CanonicalMetricKey,
    target: keyof NonNullable<DadosExtraidosPDF['dadosFinanceiros']>
  ) => {
    const canonicalMetric = canonical[key];
    if (!canonicalMetric) return;

    const current = (legacy?.[target] as any) ?? {};

    if (canonicalMetric.valor !== undefined) {
      current.valor = canonicalMetric.valor;
    }

    if (canonicalMetric.variacao !== undefined) {
      current.variacaoTT = canonicalMetric.variacao;
    }

    if (canonicalMetric.variacaoYoY !== undefined) {
      current.variacaoAA = canonicalMetric.variacaoYoY;
    }

    if (canonicalMetric.margem !== undefined) {
      current.margem = canonicalMetric.margem;
    }

    (legacy as any)[target] = current;
  };

  applyMetric('receita', 'receita');
  applyMetric('ebitda', 'ebitda');
  applyMetric('lucroLiquido', 'lucroLiquido');
  applyMetric('roe', 'roe');
  applyMetric('roa', 'roa');
  applyMetric('endividamento', 'endividamento');

  return Object.keys(legacy ?? {}).length > 0 ? legacy : original;
};

export type MetricCollections = ReturnType<typeof buildMetricCollectionsFromPDF>;

export const mergeAnaliseWithMetrics = (
  analise: AnaliseTrimestreData,
  collections: MetricCollections
): AnaliseTrimestreData => {
  const { canonicalMetrics, dynamicEntries, normalizedMetrics } = collections;

  return {
    ...analise,
    metricas: {
      ...analise.metricas,
      ...canonicalMetrics
    },
    otherMetrics: dynamicEntries,
    dadosExtraidos: {
      ...(analise.dadosExtraidos ?? {}),
      metricasNormalizadas: normalizedMetrics
    }
  };
};
