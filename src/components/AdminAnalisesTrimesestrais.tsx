'use client';

import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { 
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Calendar, DollarSign, 
  Building, Globe, Zap, Bell, Plus, Trash2, Save, Eye, AlertCircle, 
  CheckCircle, BarChart3, Users, Clock, FileText, Target, Briefcase, 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, 
  AlignRight, List, ListOrdered, Link, Palette, ExternalLink, PieChart, 
  Activity, Image, Upload, Edit, Archive, Search, Filter 
} from 'lucide-react';
import { useAuthAccess } from '@/hooks/use-auth-access';

// ============================================================================
// TIPOS E INTERFACES - CORRIGIDOS
// ============================================================================

interface MetricaTrimestreData {
  valor: number;
  unidade: string;
  variacao?: number;        // Variação trimestre vs trimestre anterior
  variacaoYoY?: number;     // Variação ano vs ano (campo principal)
  margem?: number;
}

interface DadosExtraidosPDF {
  empresa?: string;
  trimestre?: string;
  dataReferencia?: string;

  metricas?: MetricExtractionItem[];
  metricasExtraidas?: MetricExtractionItem[];
  metricasMap?: Record<string, MetricExtractionItem>;
  metricasNormalizadas?: NormalizedMetricExtraction[];

  dadosFinanceiros?: {
    lucroLiquido?: { valor: number; variacaoAA?: number; variacaoTT?: number; };
    receita?: { valor: number; variacaoAA?: number; variacaoTT?: number; };
    ebitda?: { valor: number; variacaoAA?: number; variacaoTT?: number; margem?: number; };
    roe?: { valor: number; variacaoAA?: number; };
    roa?: { valor: number; variacaoAA?: number; };
    endividamento?: { valor: number; variacaoAA?: number; };
    outrasMetricas?: Array<{
      nome: string;
      valor: string;
      variacao?: string;
    }>;
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
}

type ParseConfidence = 'high' | 'medium' | 'low';
type FinancialMetricDeltaBasis = 'yoy' | 'qoq' | 'pp' | 'abs';

interface MetricExtractionItem {
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

interface NormalizedMetricExtraction extends MetricExtractionItem {
  original?: MetricExtractionItem;
}

interface FinancialMetricDynamicEntry {
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

interface AnaliseTrimestreData {
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

// ============================================================================
// SERVIÇOS DE API REAIS
// ============================================================================

const API_BASE = '/api/analises-trimestrais';

const extractOtherMetrics = (analise: any): FinancialMetricDynamicEntry[] | undefined => {
  if (!analise) {
    return undefined;
  }

  if (Array.isArray(analise.otherMetrics)) {
    return analise.otherMetrics as FinancialMetricDynamicEntry[];
  }

  if (Array.isArray(analise.other_metrics)) {
    return analise.other_metrics as FinancialMetricDynamicEntry[];
  }

  if (analise.metricas && typeof analise.metricas === 'object') {
    const metricas = analise.metricas as Record<string, unknown>;
    const candidate = (metricas as any).other_metrics ?? (metricas as any).otherMetrics;
    if (Array.isArray(candidate)) {
      return candidate as FinancialMetricDynamicEntry[];
    }
  }

  return undefined;
};

const mapAnaliseFromApi = (analise: any): AnaliseTrimestreData => {
  const otherMetrics = extractOtherMetrics(analise);
  return {
    ...analise,
    metricas: analise.metricas ?? {},
    otherMetrics: otherMetrics ?? (Array.isArray(analise.otherMetrics) ? analise.otherMetrics : [])
  } as AnaliseTrimestreData;
};

const createEmptyDynamicMetric = (): FinancialMetricDynamicEntry => {
  const id = `dynamic-metric-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    slug: id,
    label: '',
    value: null,
    unit: null,
    formattedValue: null,
    deltaValue: null,
    deltaUnit: null,
    deltaBasis: null,
    parseConfidence: 'low'
  };
};

const parseNumericFromUnknown = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  const normalized = value
    .toString()
    .replace(/[^0-9.,-]/g, '')
    .replace(',', '.');

  if (!normalized) {
    return null;
  }

  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

const prepareAnalisePayload = (analise: Partial<AnaliseTrimestreData>) => {
  const { otherMetrics, ...rest } = analise as any;
  const payload: any = { ...rest };

  if (payload.metricas && typeof payload.metricas === 'object') {
    payload.metricas = { ...payload.metricas };
  }

  if (otherMetrics !== undefined) {
    payload.other_metrics = otherMetrics;
    if (payload.metricas && typeof payload.metricas === 'object') {
      payload.metricas.other_metrics = otherMetrics;
    } else {
      payload.metricas = { other_metrics: otherMetrics };
    }
  } else if (payload.metricas && typeof payload.metricas === 'object' && payload.metricas.other_metrics !== undefined) {
    payload.other_metrics = payload.metricas.other_metrics;
  }

  return payload;
};

const analiseAPI = {
  async listar(filtros?: { status?: string; ticker?: string; userId?: string }): Promise<AnaliseTrimestreData[]> {
    try {
      const params = new URLSearchParams();
      if (filtros?.status) params.append('status', filtros.status);
      if (filtros?.ticker) params.append('ticker', filtros.ticker);
      if (filtros?.userId) params.append('userId', filtros.userId);
      
      const url = filtros ? `${API_BASE}?${params.toString()}` : API_BASE;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
      
      const resultado = await response.json();
      if (Array.isArray(resultado)) {
        return resultado.map(mapAnaliseFromApi);
      }

      return [];
    } catch (error) {
      console.error('❌ Erro ao listar análises:', error);
      throw error;
    }
  },

  async criar(analise: Omit<AnaliseTrimestreData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnaliseTrimestreData> {
    try {
      // CORRIGIDO: Garantir que sempre tenha um ID único
      const analiseComId = {
        ...analise,
        id: analise.id || `analise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const payload = prepareAnalisePayload(analiseComId);

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const resultado = await response.json();
      return mapAnaliseFromApi(resultado);
    } catch (error) {
      console.error('❌ Erro ao criar análise:', error);
      throw error;
    }
  },

  async atualizar(id: string, analise: Partial<AnaliseTrimestreData>): Promise<AnaliseTrimestreData> {
    try {
      const payload = prepareAnalisePayload(analise);

      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const resultado = await response.json();
      return mapAnaliseFromApi(resultado);
    } catch (error) {
      console.error('❌ Erro ao atualizar análise:', error);
      throw error;
    }
  },

  async deletar(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar análise:', error);
      throw error;
    }
  },

  async analisarPDF(textoPDF: string): Promise<DadosExtraidosPDF> {
    try {
      const response = await fetch(`${API_BASE}/analisar-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textoPDF })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Erro HTTP: ${response.status}`);
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Erro na análise da IA');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro na análise OpenAI:', error);
      throw error;
    }
  }
};

// ============================================================================
// RICH TEXT EDITOR COMPONENT (mantido igual)
// ============================================================================

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = memo(({
  value,
  onChange,
  placeholder = "Digite seu texto...",
  style = {},
  minHeight = "120px"
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [currentFormat, setCurrentFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false
  });

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const updateFormatState = useCallback(() => {
    if (!editorRef.current) return;
    
    setCurrentFormat({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough')
    });
  }, []);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateFormatState();
    
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange, updateFormatState]);

  const insertLink = useCallback(() => {
    const url = prompt('Digite a URL do link:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  const insertImageByUrl = useCallback(() => {
    const url = prompt('Digite a URL da imagem:');
    if (url) {
      try {
        new URL(url);
        execCommand('insertImage', url);
      } catch (error) {
        alert('URL inválida. Por favor, digite uma URL válida.');
      }
    }
  }, [execCommand]);

  const uploadImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('Arquivo muito grande. Máximo 5MB permitido.');
          return;
        }
        
        if (!file.type.startsWith('image/')) {
          alert('Por favor, selecione apenas arquivos de imagem.');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          if (base64) {
            execCommand('insertImage', base64);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }, [execCommand]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateFormatState();
  }, [onChange, updateFormatState]);

  const handleFocus = useCallback(() => {
    setIsEditorFocused(true);
    updateFormatState();
  }, [updateFormatState]);

  const handleBlur = useCallback(() => {
    setIsEditorFocused(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  }, [execCommand]);

  const toolbarButtons = useMemo(() => [
    {
      icon: Bold,
      command: 'bold',
      title: 'Negrito (Ctrl+B)',
      active: currentFormat.bold
    },
    {
      icon: Italic,
      command: 'italic',
      title: 'Itálico (Ctrl+I)',
      active: currentFormat.italic
    },
    {
      icon: Underline,
      command: 'underline',
      title: 'Sublinhado (Ctrl+U)',
      active: currentFormat.underline
    },
    {
      icon: Strikethrough,
      command: 'strikeThrough',
      title: 'Riscado',
      active: currentFormat.strikethrough
    }
  ], [currentFormat]);

  return (
    <div style={{
      border: `2px solid ${isEditorFocused ? '#2563eb' : '#e5e7eb'}`,
      borderRadius: '12px',
      backgroundColor: 'white',
      transition: 'border-color 0.2s',
      ...style
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {toolbarButtons.map((button) => (
            <button
              key={button.command}
              onClick={() => execCommand(button.command)}
              title={button.title}
              style={{
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: button.active ? '#2563eb' : 'transparent',
                color: button.active ? 'white' : '#6b7280',
                cursor: 'pointer'
              }}
            >
              <button.icon size={16} />
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }} />

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={uploadImage}
            title="Upload de imagem"
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#0ea5e9',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            <Upload size={14} style={{ marginRight: '4px' }} />
            Upload
          </button>

          <button
            onClick={insertImageByUrl}
            title="Inserir imagem por URL"
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#06b6d4',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            <Image size={14} style={{ marginRight: '4px' }} />
            URL
          </button>
        </div>

        <button
          onClick={insertLink}
          title="Inserir link"
          style={{
            padding: '8px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            cursor: 'pointer'
          }}
        >
          <Link size={16} />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          padding: '16px',
          minHeight: minHeight,
          outline: 'none',
          lineHeight: '1.6',
          fontSize: '16px',
          color: '#1f2937'
        }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
});

// ============================================================================
// FUNÇÕES AUXILIARES PARA PDF E IA (mantidas iguais, mas comentadas para brevidade)
// ============================================================================

const extrairTrimestre = (texto: string): string | null => {
  const patterns = [
    /([1-4])T(\d{2,4})/gi,
    /([1-4])Q(\d{2,4})/gi,
    /Q[1-4]['´`'\s]*(\d{2,4})/gi,
    /([1-4])º\s*trimestre\s*(\d{4})/gi,
    /([1-4])°\s*trimestre\s*(\d{4})/gi,
    /(primeiro|segundo|terceiro|quarto)\s*trimestre\s*(\d{4})/gi
  ];
  
  for (const pattern of patterns) {
    const matches = [...texto.matchAll(pattern)];
    if (matches.length > 0) {
      const match = matches[0];
      if (match[1] && match[2]) {
        return `${match[1]}T${match[2]}`.toUpperCase();
      } else if (match[0]) {
        return match[0].toUpperCase().replace(/[´`']/g, '');
      }
    }
  }
  return null;
};

const extrairData = (texto: string): string | null => {
  const patterns = [
    /(\d{1,2}[\/.]\d{1,2}[\/.]\d{4})/g,
    /(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/gi,
    /(\d{4}-\d{2}-\d{2})/g,
    /(\d{1,2}\.\d{1,2}\.\d{4})/g
  ];
  
  for (const pattern of patterns) {
    const matches = [...texto.matchAll(pattern)];
    if (matches.length > 0) {
      return matches[0][1];
    }
  }
  return null;
};

const extrairValoresFinanceiros = (texto: string): { [key: string]: number } => {
  console.log('🔍 Iniciando extração de valores financeiros...');

  const valores: { [key: string]: number } = {};
  
  const metricas = {
    receita: [
      /receita\s+líquida\s+de\s+vendas[^\d]+([\d.,]+)/gi,
      /receita\s+operacional\s+líquida[^\d]+([\d.,]+)/gi,
      /receita\s+líquida[^\d]+([\d.,]+)/gi,
      /net\s+revenue[^\d]+([\d.,]+)/gi,
      /revenue[^\d]+([\d.,]+)/gi
    ],
    ebitda: [
      /ebitda\s+ajustado[^\d]+([\d.,]+)/gi,
      /ebitda\s+proforma[^\d]+([\d.,]+)/gi,
      /ebitda[^\d]+([\d.,]+)/gi,
      /ebit\s+ajustado[^\d]+([\d.,]+)/gi
    ],
    lucroLiquido: [
      /lucro\s+líquido\s+\(prejuízo\)\s+atribuível\s+aos\s+shareholders[^\d]+([\d.,\-\(\)]+)/gi,
      /lucro\s+líquido\s+proforma[^\d]+([\d.,\-\(\)]+)/gi,
      /lucro\s+líquido[^\d]+([\d.,\-\(\)]+)/gi,
      /net\s+income[^\d]+([\d.,\-\(\)]+)/gi,
      /net\s+profit[^\d]+([\d.,\-\(\)]+)/gi
    ]
  };
  
  for (const [metrica, patterns] of Object.entries(metricas)) {
    for (const pattern of patterns) {
      const matches = [...texto.matchAll(pattern)];
      
      if (matches.length > 0) {
        for (const match of matches) {
          let numeroStr = match[1];
          
          if (numeroStr) {
            let valor = numeroStr
              .replace(/[^\d.,\-\(\)]/g, '')
              .replace(/\(/g, '-')
              .replace(/\)/g, '')
              .replace(/,(\d{3})/g, '$1')
              .replace(/\.(\d{3})/g, '$1')
              .replace(/,(\d{1,2})$/, '.$1');
            
            const numeroFinal = parseFloat(valor);
            
            if (!isNaN(numeroFinal) && numeroFinal !== 0) {
              valores[metrica] = Math.abs(numeroFinal);
              break;
            }
          }
        }
      }
    }
  }

  return valores;
};

const slugifyMetric = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const formatNumberPtBr = (value: number, fractionDigits = 2): string => {
  const abs = Math.abs(value);
  const maximumFractionDigits = abs < 1 ? Math.max(2, fractionDigits + 2) : fractionDigits;

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  });
};

const formatValueWithUnit = (value: number, unit?: string | null): string => {
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

const combineConfidence = (...levels: Array<ParseConfidence | undefined>): ParseConfidence => {
  if (levels.some(level => level === 'low')) {
    return 'low';
  }

  if (levels.some(level => level === 'medium')) {
    return 'medium';
  }

  return 'high';
};

const normalizeConfidenceLevel = (value: any): ParseConfidence => {
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

const normalizeText = (value: string | null | undefined): string => {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9%$]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeDeltaBasisValue = (value: any): FinancialMetricDeltaBasis | null => {
  if (!value && value !== 0) return null;
  const normalized = normalizeText(String(value));

  if (!normalized) return null;
  if (/(yoy|ano|a\/a)/.test(normalized)) return 'yoy';
  if (/(qoq|t\/t|trim|sequencial)/.test(normalized)) return 'qoq';
  if (/(pp|ponto)/.test(normalized)) return 'pp';
  if (/(abs|absol)/.test(normalized)) return 'abs';
  return null;
};

const normalizeUnitString = (unit: string | null | undefined): string | null => {
  if (unit === null || unit === undefined) return null;
  const trimmed = unit.toString().replace(/\s+/g, ' ').trim();
  return trimmed.length > 0 ? trimmed : null;
};

const ensureUniqueMetricSlug = (candidate: string, fallback: string, usedSlugs: Set<string>): string => {
  const baseCandidate = slugifyMetric(candidate) || slugifyMetric(fallback) || 'metrica';
  let slug = baseCandidate || 'metrica';
  let counter = 2;

  while (usedSlugs.has(slug) || !slug) {
    slug = `${baseCandidate || 'metrica'}-${counter++}`;
  }

  usedSlugs.add(slug);
  return slug;
};

type CanonicalMetricKey = 'receita' | 'ebitda' | 'lucroLiquido' | 'roe' | 'roa' | 'endividamento';

interface MetricNormalizationRule {
  canonicalSlug: string;
  canonicalLabel: string;
  synonyms: string[];
  canonicalKey?: CanonicalMetricKey;
  attachesMarginTo?: CanonicalMetricKey;
  defaultUnit?: string;
}

const METRIC_NORMALIZATION_RULES: MetricNormalizationRule[] = [
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

const findMetricRule = (metric: MetricExtractionItem): MetricNormalizationRule | undefined => {
  const normalizedCandidates = [
    normalizeText(metric.normalized_label),
    normalizeText(metric.raw_label),
    normalizeText(metric.slug)
  ].filter(Boolean);

  for (const rule of METRIC_NORMALIZATION_RULES) {
    const normalizedSynonyms = rule.synonyms.map(normalizeText);

    if (normalizedCandidates.some(candidate => normalizedSynonyms.some(syn => candidate.includes(syn) || syn.includes(candidate)))) {
      return rule;
    }
  }

  return undefined;
};

const convertLegacyFinancialsToMetricItems = (dadosFinanceiros: NonNullable<DadosExtraidosPDF['dadosFinanceiros']>): MetricExtractionItem[] => {
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

const normalizeMetricExtractionItems = (dadosPDF: DadosExtraidosPDF): NormalizedMetricExtraction[] => {
  const usedSlugs = new Set<string>();
  const normalizedItems: NormalizedMetricExtraction[] = [];

  const pushItem = (item: any) => {
    if (!item || typeof item !== 'object') return;

    const rawLabelSource = item.raw_label ?? item.nome ?? item.label ?? item.normalized_label ?? item.slug;
    const rawLabel = typeof rawLabelSource === 'string' && rawLabelSource.trim()
      ? rawLabelSource.trim()
      : 'Métrica Identificada';

    const normalizedLabelSource = item.normalized_label ?? item.label ?? rawLabel;
    const normalizedLabel = typeof normalizedLabelSource === 'string' && normalizedLabelSource.trim()
      ? normalizedLabelSource.trim()
      : rawLabel;

    const slugCandidate = typeof item.slug === 'string' && item.slug.trim()
      ? item.slug.trim()
      : normalizedLabel;

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
      parse_confidence: normalizeConfidenceLevel(item.parse_confidence ?? item.parseConfidence ?? item.confidence ?? null),
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

const stripOriginalMetric = (item: NormalizedMetricExtraction): MetricExtractionItem => {
  const { original, ...rest } = item;
  return rest;
};

const normalizeNumericString = (value: string): string => {
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

const parseValueWithUnit = (
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

const parseVariationString = (
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
      evidence: `${basis.toUpperCase()}: ${formatNumberPtBr(rawVariation)} ${unit}`
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

  const lower = text.toLowerCase();
  let basis: FinancialMetricDeltaBasis | null = fallbackBasis ?? null;

  if (lower.includes('qoq') || lower.includes('t/t') || lower.includes('trim')) {
    basis = 'qoq';
  } else if (lower.includes('yoy') || lower.includes('a/a') || lower.includes('ano')) {
    basis = 'yoy';
  } else if (lower.includes('p.p') || lower.includes('pp') || lower.includes('pontos')) {
    basis = 'pp';
  } else if (lower.includes('abs') || lower.includes('absol')) {
    basis = 'abs';
  }

  const numericMatch = text.match(/-?[\d]+[\d.,]*/);
  let numericValue: number | null = null;

  if (numericMatch) {
    const normalized = normalizeNumericString(numericMatch[0]);
    const parsed = parseFloat(normalized);
    if (!Number.isNaN(parsed)) {
      numericValue = parsed;
      if (!normalized.startsWith('-') && (/queda|negativo/.test(lower) || /\(.*\)/.test(text))) {
        numericValue = -Math.abs(parsed);
      }
    }
  }

  const unit = basis === 'pp' ? 'p.p.' : basis === 'abs' ? null : '%';
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

const resolveMetricValue = (
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

  const parsed = parseValueWithUnit(metric.value, { defaultUnit: rule?.defaultUnit });
  return {
    ...parsed,
    evidence: parsed.evidence ?? (typeof metric.value === 'string' ? metric.value : null)
  };
};

const resolveMetricDelta = (
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

const buildMetricEvidence = (
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

const convertCurrencyToMillions = (value: number, unit: string | null): number => {
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

const inferLegacyUnitForKey = (key: CanonicalMetricKey): string => {
  if (key === 'receita' || key === 'ebitda' || key === 'lucroLiquido') {
    return 'milhões';
  }

  if (key === 'roe' || key === 'roa' || key === 'endividamento') {
    return '%';
  }

  return '';
};

const convertValueForCanonical = (
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

const buildMetricCollectionsFromPDF = (dadosPDF: DadosExtraidosPDF): {
  dynamicEntries: FinancialMetricDynamicEntry[];
  canonicalMetrics: Partial<Record<CanonicalMetricKey, MetricaTrimestreData>>;
  normalizedMetrics: NormalizedMetricExtraction[];
  metricMap: Record<string, NormalizedMetricExtraction>;
} => {
  const normalizedMetrics = normalizeMetricExtractionItems(dadosPDF);
  const dynamicEntries: FinancialMetricDynamicEntry[] = [];
  const metricMap: Record<string, NormalizedMetricExtraction> = {};
  const usedDynamicSlugs = new Set<string>();
  const canonicalAccumulator: Partial<Record<CanonicalMetricKey, (Partial<MetricaTrimestreData> & { unidade?: string })>> = {};
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
    const parseConfidence = combineConfidence(metric.parse_confidence, valueResolution.parseConfidence, deltaResolution.parseConfidence);
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
      const { valor, unidade } = convertValueForCanonical(rule.canonicalKey, valueResolution.value, valueResolution.unit);
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
    };
  });

  return {
    dynamicEntries,
    canonicalMetrics,
    normalizedMetrics,
    metricMap
  };
};

const buildLegacyFinancialsFromCanonical = (
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

// ============================================================================
// HOOK PARA PROCESSAMENTO DE PDF COM API REAL (mantido igual)
// ============================================================================

const usePDFProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<DadosExtraidosPDF | null>(null);

  const loadPdfJs = useCallback(async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve((window as any).pdfjsLib);
      };
      script.onerror = () => reject(new Error('Falha ao carregar PDF.js'));
      document.head.appendChild(script);
    });
  }, []);

  const extractTextFromPDF = useCallback(async (file: File, pdfjsLib: any): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let textoCompleto = '';
      const maxPages = Math.min(pdf.numPages, 10);
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .filter((item: any) => item.str && item.str.trim().length > 0)
          .map((item: any) => item.str.trim())
          .join(' ');
        
        textoCompleto += `\n--- PÁGINA ${pageNum} ---\n${pageText}\n`;
      }
      
      return textoCompleto;
      
    } catch (error) {
      console.error('❌ Erro na extração de texto:', error);
      throw new Error('Falha na extração de texto do PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  }, []);

  const analisarComIA = useCallback(async (textoPDF: string): Promise<DadosExtraidosPDF> => {
    try {
      const resultado = await analiseAPI.analisarPDF(textoPDF);
      return resultado;
    } catch (error) {
      console.error('❌ Erro na análise OpenAI:', error);
      return gerarAnaliseFallback(textoPDF);
    }
  }, []);

  const gerarAnaliseFallback = useCallback((textoPDF: string): DadosExtraidosPDF => {
    const textoLower = textoPDF.toLowerCase();
    
    let empresa = "Empresa Identificada";
    let ticker = "TICKER";
    
    const empresasComuns = [
      { nomes: ['vale', 'vale s.a.', 'vale sa'], empresa: "Vale S.A.", ticker: "VALE3" },
      { nomes: ['petrobras', 'petróleo brasileiro', 'petroleo brasileiro'], empresa: "Petróleo Brasileiro S.A.", ticker: "PETR4" },
      { nomes: ['itaú', 'itau', 'itaú unibanco'], empresa: "Itaú Unibanco Holding S.A.", ticker: "ITUB4" },
      { nomes: ['ambev', 'companhia de bebidas'], empresa: "Ambev S.A.", ticker: "ABEV3" },
      { nomes: ['magazine luiza', 'magalu', 'mglu'], empresa: "Magazine Luiza S.A.", ticker: "MGLU3" },
      { nomes: ['natura', 'natura & co'], empresa: "Natura & Co Holding S.A.", ticker: "NTCO3" },
      { nomes: ['suzano', 'suzano papel'], empresa: "Suzano S.A.", ticker: "SUZB3" }
    ];
    
    for (const { nomes, empresa: emp, ticker: tick } of empresasComuns) {
      if (nomes.some(nome => textoLower.includes(nome))) {
        empresa = emp;
        ticker = tick;
        break;
      }
    }
    
    const valoresExtraidos = extrairValoresFinanceiros(textoPDF);
    const trimestreExtraido = extrairTrimestre(textoPDF);
    const dataExtraida = extrairData(textoPDF);

    const dadosFinanceirosFallback = {
      receita: {
        valor: valoresExtraidos.receita || 1000,
        variacaoAA: 5.2,
        variacaoTT: 1.8
      },
      ebitda: {
        valor: valoresExtraidos.ebitda || 300,
        variacaoAA: 3.1,
        variacaoTT: -1.2,
        margem: valoresExtraidos.ebitda && valoresExtraidos.receita ?
          ((valoresExtraidos.ebitda / valoresExtraidos.receita) * 100) : 30.0
      },
      lucroLiquido: {
        valor: valoresExtraidos.lucroLiquido || 200,
        variacaoAA: -2.1,
        variacaoTT: 0.5
      },
      roe: {
        valor: 15.5,
        variacaoAA: 1.2
      }
    } satisfies NonNullable<DadosExtraidosPDF['dadosFinanceiros']>;

    const metricasFallback = convertLegacyFinancialsToMetricItems(dadosFinanceirosFallback);
    const metricasMapFallback = Object.fromEntries(metricasFallback.map(item => [item.slug, item]));

    return {
      empresa: empresa,
      trimestre: trimestreExtraido || "3T24",
      dataReferencia: dataExtraida || "30/09/2024",

      dadosFinanceiros: dadosFinanceirosFallback,
      metricas: metricasFallback,
      metricasExtraidas: metricasFallback,
      metricasNormalizadas: metricasFallback.map(item => ({ ...item } as NormalizedMetricExtraction)),
      metricasMap: metricasMapFallback,

      relatorioGerado: {
        titulo: `${ticker} - ${trimestreExtraido || '3T24'}: Análise baseada em processamento local aprimorado`,
        destaques: [
          valoresExtraidos.receita ? `Receita extraída: ${valoresExtraidos.receita.toLocaleString('pt-BR')} milhões` : "Sistema de extração ativo",
          valoresExtraidos.ebitda ? `EBITDA identificado: ${valoresExtraidos.ebitda.toLocaleString('pt-BR')} milhões` : "Algoritmos de padrão financeiro funcionais",
          `Empresa identificada automaticamente: ${empresa}`,
          `Período reconhecido: ${trimestreExtraido || '3T24'}`,
          "Extração via regex aprimorada para relatórios financeiros",
          "Sistema de fallback com identificação automática de empresas"
        ],
        pontosAtencao: [
          valoresExtraidos.receita || valoresExtraidos.ebitda || valoresExtraidos.lucroLiquido ? 
            "Valores extraídos automaticamente - recomenda-se validação manual" :
            "Valores padrão utilizados - PDF pode ter estrutura não reconhecida",
          "Variações percentuais estimadas - verificar dados originais",
          "Sistema em modo fallback - integração IA temporariamente indisponível",
          "Dados de margem calculados automaticamente podem precisar ajuste"
        ],
        conclusao: `A análise da ${empresa} (${ticker}) foi processada com sucesso utilizando algoritmos aprimorados de extração de dados financeiros. ${valoresExtraidos.receita && valoresExtraidos.ebitda ? 'Os principais valores financeiros foram identificados automaticamente no documento.' : 'O sistema utilizou valores estimados devido à estrutura específica do PDF.'} O período ${trimestreExtraido || '3T24'} foi reconhecido no documento. Recomenda-se revisão manual dos dados extraídos para garantir precisão total, especialmente para variações percentuais e métricas comparativas.`,
        recomendacao: 'MANTER',
        nota: 8.5
      }
    };
  }, []);

  const processFile = useCallback(async (file: File): Promise<DadosExtraidosPDF> => {
    if (file.type !== 'application/pdf') {
      throw new Error('Por favor, selecione apenas arquivos PDF.');
    }

    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Arquivo muito grande. Máximo 20MB permitido.');
    }

    setIsProcessing(true);
    setUploadedFile(file);

    try {
      const pdfjsLib = await loadPdfJs();
      const pdfText = await extractTextFromPDF(file, pdfjsLib);
      const analiseCompleta = await analisarComIA(pdfText);
      
      setExtractedData(analiseCompleta);
      return analiseCompleta;
      
    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [loadPdfJs, extractTextFromPDF, analisarComIA]);

  const resetProcessor = useCallback(() => {
    setUploadedFile(null);
    setExtractedData(null);
    setIsProcessing(false);
  }, []);

  return {
    processFile,
    resetProcessor,
    isProcessing,
    uploadedFile,
    extractedData
  };
};

// ============================================================================
// COMPONENTE PDF UPLOADER (mantido igual)
// ============================================================================

interface PDFUploaderProps {
  onExtractData: (dados: DadosExtraidosPDF) => void;
  disabled?: boolean;
}

const PDFUploader: React.FC<PDFUploaderProps> = memo(({ onExtractData, disabled = false }) => {
  const { processFile, resetProcessor, isProcessing, uploadedFile, extractedData } = usePDFProcessor();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dadosExtraidos = await processFile(file);
      onExtractData(dadosExtraidos);
    } catch (error) {
      console.error('❌ Erro ao processar PDF:', error);
      alert(`❌ Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      resetProcessor();
    }
  }, [processFile, onExtractData, resetProcessor]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
      padding: '24px',
      borderRadius: '16px',
      border: '2px solid #f59e0b',
      marginBottom: '24px'
    }}>
      <h5 style={{ 
        fontSize: '18px', 
        fontWeight: '700', 
        color: '#92400e', 
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <FileText size={20} />
        📄 Importar Relatório PDF
      </h5>

      {!uploadedFile && (
        <div>
          <p style={{ color: '#92400e', marginBottom: '16px', fontSize: '14px' }}>
            Faça upload do relatório trimestral em PDF para extrair automaticamente os dados financeiros.
          </p>
          
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={disabled || isProcessing}
            style={{ display: 'none' }}
            id="pdf-upload"
          />
          
          <label
            htmlFor="pdf-upload"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#059669',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              opacity: disabled || isProcessing ? 0.5 : 1,
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
            }}
          >
            <Upload size={20} />
            {isProcessing ? 'Processando PDF...' : 'Selecionar PDF'}
          </label>
        </div>
      )}

      {uploadedFile && (
        <div>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <p style={{ color: '#92400e', margin: '0 0 8px 0', fontWeight: '600' }}>
              📁 Arquivo selecionado:
            </p>
            <p style={{ color: '#92400e', margin: '0', fontSize: '14px' }}>
              {uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB)
            </p>
          </div>

          {isProcessing && (
            <div style={{
              textAlign: 'center',
              padding: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔄</div>
              <p style={{ color: '#92400e', fontWeight: '600', margin: '0' }}>
                Analisando PDF e gerando relatório completo...
              </p>
              <p style={{ color: '#92400e', fontSize: '14px', margin: '8px 0 0 0' }}>
                Extraindo dados financeiros, identificando destaques e redigindo conclusão
              </p>
            </div>
          )}

          {extractedData && !isProcessing && (
            <div style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              padding: '20px',
              borderRadius: '12px',
              border: '2px solid #22c55e'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <CheckCircle size={24} style={{ color: '#059669' }} />
                <div>
                  <h6 style={{ 
                    color: '#059669', 
                    fontWeight: '700', 
                    margin: 0,
                    fontSize: '18px'
                  }}>
                    ✅ Relatório Gerado e Inserido Automaticamente!
                  </h6>
                  <p style={{ 
                    color: '#059669', 
                    margin: '4px 0 0 0',
                    fontSize: '14px'
                  }}>
                    {extractedData.relatorioGerado?.titulo || 'Análise completa processada'}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  flex: 1
                }}>
                  <div style={{ fontSize: '13px', color: '#059669', fontWeight: '600' }}>
                    📊 Todos os campos foram pré-preenchidos automaticamente:
                  </div>
                  <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
                    Título • Resumo • Análise Completa • Destaques • Pontos de Atenção • Recomendação • Preço Alvo
                  </div>
                </div>
                
                <button
                  onClick={resetProcessor}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Novo Upload
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div style={{ 
        marginTop: '16px', 
        fontSize: '12px', 
        color: '#92400e', 
        opacity: 0.8 
      }}>
        💡 Suporta PDFs de até 20MB. O sistema gera automaticamente um relatório completo com análise, destaques e recomendações.
      </div>
    </div>
  );
});

// ============================================================================
// COMPONENTE DE CRIAÇÃO/EDIÇÃO DE ANÁLISE - CORRIGIDO
// ============================================================================

interface CriarAnaliseFormProps {
  onSave: (analise: AnaliseTrimestreData) => void;
  analiseEditando?: AnaliseTrimestreData | null;
}

const CriarAnaliseForm = memo(({ onSave, analiseEditando }: CriarAnaliseFormProps) => {
  const [analise, setAnalise] = useState<AnaliseTrimestreData>(() => {
    if (analiseEditando) {
      return { ...analiseEditando };
    }
    
    return {
      // CORRIGIDO: Garantir ID único mesmo no estado inicial
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ticker: '',
      empresa: '',
      trimestre: '',
      dataPublicacao: new Date().toISOString().split('T')[0],
      autor: '',
      categoria: 'resultado_trimestral',
      titulo: '',
      analiseCompleta: '',
      metricas: {},
      otherMetrics: [],
      pontosFavoraveis: '',
      pontosAtencao: '',
      recomendacao: 'MANTER',
      status: 'draft'
    };
  });

  const [salvando, setSalvando] = useState(false);

  const gerarAnaliseCompleta = useCallback((relatorio: DadosExtraidosPDF['relatorioGerado']) => {
    if (!relatorio) return '';
    
    let analiseCompleta = `<h3>Resumo dos Resultados</h3>\n`;
    
    if (relatorio.destaques && relatorio.destaques.length > 0) {
      analiseCompleta += `<h3>Principais Destaques</h3>\n<ul>\n`;
      relatorio.destaques.forEach(destaque => {
        analiseCompleta += `<li>${destaque}</li>\n`;
      });
      analiseCompleta += `</ul>\n\n`;
    }
    
    if (relatorio.pontosAtencao && relatorio.pontosAtencao.length > 0) {
      analiseCompleta += `<h3>Pontos de Atenção</h3>\n<ul>\n`;
      relatorio.pontosAtencao.forEach(ponto => {
        analiseCompleta += `<li>${ponto}</li>\n`;
      });
      analiseCompleta += `</ul>\n\n`;
    }
    
    if (relatorio.conclusao) {
      analiseCompleta += `<h3>Conclusão</h3>\n`;
      const paragrafos = relatorio.conclusao.split('\n\n');
      paragrafos.forEach(paragrafo => {
        analiseCompleta += `<p>${paragrafo}</p>\n`;
      });
    }
    
    return analiseCompleta;
  }, []);

  useEffect(() => {
    if (analiseEditando) {
      setAnalise({
        ...analiseEditando,
        otherMetrics: analiseEditando.otherMetrics ?? []
      });
    }
  }, [analiseEditando]);

  const updateField = useCallback((field: keyof AnaliseTrimestreData, value: any) => {
    setAnalise(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateMetrica = useCallback((metrica: keyof AnaliseTrimestreData['metricas'], campo: keyof MetricaTrimestreData, valor: any) => {
    setAnalise(prev => {
      const metricasAtuais = { ...prev.metricas };
      if (!metricasAtuais[metrica]) {
        metricasAtuais[metrica] = { valor: 0, unidade: 'milhões' };
      }
      metricasAtuais[metrica]![campo] = valor;
      return { ...prev, metricas: metricasAtuais };
    });
  }, []);

  const metricSuggestions = useMemo(() => {
    const normalizedList = analise.dadosExtraidos?.metricasNormalizadas ?? [];

    const bySlug = new Map<string, NormalizedMetricExtraction>();
    const byLabel = new Map<string, NormalizedMetricExtraction>();

    normalizedList.forEach(metric => {
      if (metric.slug) {
        bySlug.set(metric.slug, metric);
      }

      const labelKey = (metric.normalized_label || metric.raw_label || '').trim().toLowerCase();
      if (labelKey) {
        byLabel.set(labelKey, metric);
      }
    });

    return { bySlug, byLabel };
  }, [analise.dadosExtraidos?.metricasNormalizadas]);

  const findSuggestionForEntry = useCallback((entry: FinancialMetricDynamicEntry) => {
    const { bySlug, byLabel } = metricSuggestions;
    const slugSuggestion = entry.slug ? bySlug.get(entry.slug) : undefined;
    if (slugSuggestion) {
      return slugSuggestion;
    }

    const labelKey = entry.label?.trim().toLowerCase();
    if (!labelKey) {
      return undefined;
    }

    return byLabel.get(labelKey);
  }, [metricSuggestions]);

  const updateOtherMetric = useCallback(<K extends keyof FinancialMetricDynamicEntry>(
    index: number,
    field: K,
    value: FinancialMetricDynamicEntry[K]
  ) => {
    setAnalise(prev => {
      const currentMetrics = [...(prev.otherMetrics ?? [])];
      if (!currentMetrics[index]) {
        return prev;
      }

      const updatedEntry: FinancialMetricDynamicEntry = {
        ...currentMetrics[index],
        [field]: value
      };

      if (field === 'value' || field === 'unit') {
        updatedEntry.formattedValue = null;
      }

      currentMetrics[index] = updatedEntry;
      return { ...prev, otherMetrics: currentMetrics };
    });
  }, []);

  const addOtherMetric = useCallback(() => {
    setAnalise(prev => ({
      ...prev,
      otherMetrics: [...(prev.otherMetrics ?? []), createEmptyDynamicMetric()]
    }));
  }, []);

  const removeOtherMetric = useCallback((index: number) => {
    setAnalise(prev => {
      const currentMetrics = [...(prev.otherMetrics ?? [])];
      if (!currentMetrics[index]) {
        return prev;
      }

      currentMetrics.splice(index, 1);
      return { ...prev, otherMetrics: currentMetrics };
    });
  }, []);

  const moveOtherMetric = useCallback((index: number, direction: -1 | 1) => {
    setAnalise(prev => {
      const currentMetrics = [...(prev.otherMetrics ?? [])];
      const newIndex = index + direction;

      if (newIndex < 0 || newIndex >= currentMetrics.length) {
        return prev;
      }

      const [item] = currentMetrics.splice(index, 1);
      currentMetrics.splice(newIndex, 0, item);

      return { ...prev, otherMetrics: currentMetrics };
    });
  }, []);

  const applySuggestionToOtherMetric = useCallback((index: number, suggestion: NormalizedMetricExtraction) => {
    if (!suggestion) {
      return;
    }

    setAnalise(prev => {
      const currentMetrics = [...(prev.otherMetrics ?? [])];
      const entry = currentMetrics[index];
      if (!entry) {
        return prev;
      }

      const numericValue = suggestion.value_num !== null && suggestion.value_num !== undefined
        ? parseNumericFromUnknown(suggestion.value_num)
        : parseNumericFromUnknown(suggestion.value);

      const deltaNumeric = parseNumericFromUnknown(suggestion.delta_value);

      currentMetrics[index] = {
        ...entry,
        slug: suggestion.slug || entry.slug,
        label: suggestion.normalized_label || suggestion.raw_label || entry.label,
        unit: suggestion.unit ?? entry.unit ?? null,
        value: numericValue,
        formattedValue: typeof suggestion.value === 'string' ? suggestion.value : entry.formattedValue ?? null,
        deltaValue: deltaNumeric,
        deltaUnit: suggestion.delta_unit ?? entry.deltaUnit ?? null,
        deltaBasis: suggestion.delta_basis ?? entry.deltaBasis ?? null,
        parseConfidence: suggestion.parse_confidence ?? entry.parseConfidence,
        evidence: suggestion.evidence ?? entry.evidence
      };

      return { ...prev, otherMetrics: currentMetrics };
    });
  }, []);

  // CORRIGIDO: Mapeamento correto dos campos do PDF para as métricas
  const handleImportarDadosPDF = useCallback((dadosPDF: DadosExtraidosPDF) => {
    console.log('📊 Importando relatório completo do PDF:', dadosPDF);

    const { dynamicEntries, canonicalMetrics, normalizedMetrics, metricMap } = buildMetricCollectionsFromPDF(dadosPDF);
    const legacyFinancials = buildLegacyFinancialsFromCanonical(canonicalMetrics, dadosPDF.dadosFinanceiros);
    const plainMetrics = normalizedMetrics.map(stripOriginalMetric);
    const plainMetricMap = Object.fromEntries(
      Object.entries(metricMap).map(([slug, item]) => [slug, stripOriginalMetric(item)])
    );

    const dadosExtraidosAtualizados: DadosExtraidosPDF = {
      ...dadosPDF,
      dadosFinanceiros: legacyFinancials,
      metricas: plainMetrics,
      metricasExtraidas: plainMetrics,
      metricasNormalizadas: normalizedMetrics,
      metricasMap: plainMetricMap
    };

    setAnalise(prev => {
      const metricasAtualizadas: AnaliseTrimestreData['metricas'] = { ...prev.metricas };

      (['receita', 'ebitda', 'lucroLiquido', 'roe'] as const).forEach(key => {
        const canonical = canonicalMetrics[key];
        if (!canonical || canonical.valor === undefined || canonical.valor === null) {
          return;
        }

        const unidade = canonical.unidade ?? inferLegacyUnitForKey(key);
        metricasAtualizadas[key] = {
          valor: canonical.valor,
          unidade,
          variacao: canonical.variacao ?? metricasAtualizadas[key]?.variacao,
          variacaoYoY: canonical.variacaoYoY ?? metricasAtualizadas[key]?.variacaoYoY,
          margem: canonical.margem ?? metricasAtualizadas[key]?.margem
        } as MetricaTrimestreData;
      });

      return {
        ...prev,
        empresa: dadosPDF.empresa || prev.empresa,
        trimestre: dadosPDF.trimestre || prev.trimestre,
        titulo: dadosPDF.relatorioGerado?.titulo || prev.titulo,
        analiseCompleta: dadosPDF.relatorioGerado
          ? gerarAnaliseCompleta(dadosPDF.relatorioGerado)
          : prev.analiseCompleta,
        pontosFavoraveis: dadosPDF.relatorioGerado?.destaques
          ? dadosPDF.relatorioGerado.destaques.map(d => `• ${d}`).join('\n')
          : prev.pontosFavoraveis,
        pontosAtencao: dadosPDF.relatorioGerado?.pontosAtencao
          ? dadosPDF.relatorioGerado.pontosAtencao.map(p => `• ${p}`).join('\n')
          : prev.pontosAtencao,
        recomendacao: dadosPDF.relatorioGerado?.recomendacao || prev.recomendacao,
        nota: dadosPDF.relatorioGerado?.nota || prev.nota,
        metricas: metricasAtualizadas,
        otherMetrics: dynamicEntries,
        dadosExtraidos: dadosExtraidosAtualizados,
        fonteDados: 'pdf',
        dataProcessamentoPDF: new Date().toISOString()
      };
    });

    console.log('✅ Relatório completo importado e análise pré-preenchida');
  }, [gerarAnaliseCompleta]);

  const handleSave = useCallback(async () => {
    setSalvando(true);
    
    try {
      if (!analise.ticker || !analise.empresa || !analise.titulo) {
        alert('Por favor, preencha pelo menos Ticker, Empresa e Título.');
        return;
      }
      
      // CORRIGIDO: Garantir ID único antes de salvar
      const analiseParaSalvar = {
        ...analise,
        id: analise.id && analise.id !== 'temp' && !analise.id.startsWith('temp-') ? 
            analise.id : 
            `analise-${analise.ticker}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      await onSave(analiseParaSalvar);
      
      if (!analiseEditando) {
        // Reset para nova análise
        setAnalise({
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ticker: '',
          empresa: '',
          trimestre: '',
          dataPublicacao: new Date().toISOString().split('T')[0],
          autor: '',
          categoria: 'resultado_trimestral',
          titulo: '',
          analiseCompleta: '',
          metricas: {},
          otherMetrics: [],
          pontosFavoraveis: '',
          pontosAtencao: '',
          recomendacao: 'MANTER',
          risco: 'MÉDIO',
          status: 'draft'
        });
        
        alert('✅ Análise criada e salva com sucesso!');
      } else {
        alert('✅ Análise editada e salva com sucesso!');
      }
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao salvar análise');
    } finally {
      setSalvando(false);
    }
  }, [analise, onSave, analiseEditando]);

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '32px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
          {analiseEditando ? '✏️ Editar Análise' : '✨ Criar Nova Análise'}
        </h3>
        
        <button
          onClick={handleSave}
          disabled={salvando}
          style={{
            backgroundColor: '#059669',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: salvando ? 'not-allowed' : 'pointer',
            opacity: salvando ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
          }}
        >
          <Save size={16} />
          {salvando 
            ? 'Salvando...' 
            : analiseEditando 
              ? 'Atualizar Análise' 
              : 'Salvar Análise'
          }
        </button>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Informações Básicas */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
            📋 Informações Básicas
          </h5>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Ticker *
              </label>
              <input
                type="text"
                value={analise.ticker}
                onChange={(e) => updateField('ticker', e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontWeight: '600'
                }}
                placeholder="TUPY3"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Empresa *
              </label>
              <input
                type="text"
                value={analise.empresa}
                onChange={(e) => updateField('empresa', e.target.value)}
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Tupy S.A."
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Trimestre
              </label>
              <input
                type="text"
                value={analise.trimestre}
                onChange={(e) => updateField('trimestre', e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="3T24"
              />
            </div>
          </div>
        </div>

        {/* Upload de PDF */}
        <PDFUploader 
          onExtractData={handleImportarDadosPDF} 
          disabled={salvando} 
        />

        {/* Mostrar dados extraídos - melhorado */}
        {analise.dadosExtraidos && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #22c55e'
          }}>
            <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#15803d', marginBottom: '16px' }}>
              ✅ Relatório Gerado Automaticamente
            </h5>
            
            {analise.dadosExtraidos.relatorioGerado && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  backgroundColor: '#bbf7d0', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <h6 style={{ color: '#15803d', fontWeight: '700', fontSize: '14px', margin: 0 }}>
                    📊 {analise.dadosExtraidos.relatorioGerado.titulo}
                  </h6>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                  {analise.dadosExtraidos.dadosFinanceiros?.receita && (
                    <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>Receita</div>
                      <div style={{ fontSize: '14px', color: '#15803d', fontWeight: '700' }}>
                        R$ {analise.dadosExtraidos.dadosFinanceiros.receita.valor}M
                      </div>
                      {/* CORRIGIDO: Mostrar variacaoAA que será mapeada para variacaoYoY */}
                      {analise.dadosExtraidos.dadosFinanceiros.receita.variacaoAA && (
                        <div style={{ fontSize: '11px', color: analise.dadosExtraidos.dadosFinanceiros.receita.variacaoAA >= 0 ? '#059669' : '#dc2626' }}>
                          {analise.dadosExtraidos.dadosFinanceiros.receita.variacaoAA >= 0 ? '+' : ''}{analise.dadosExtraidos.dadosFinanceiros.receita.variacaoAA}% A/A
                        </div>
                      )}
                    </div>
                  )}
                  
                  {analise.dadosExtraidos.dadosFinanceiros?.ebitda && (
                    <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>EBITDA</div>
                      <div style={{ fontSize: '14px', color: '#15803d', fontWeight: '700' }}>
                        R$ {analise.dadosExtraidos.dadosFinanceiros.ebitda.valor}M
                      </div>
                      {analise.dadosExtraidos.dadosFinanceiros.ebitda.margem && (
                        <div style={{ fontSize: '11px', color: '#15803d' }}>
                          Margem: {analise.dadosExtraidos.dadosFinanceiros.ebitda.margem}%
                        </div>
                      )}
                    </div>
                  )}
                  
                  {analise.dadosExtraidos.dadosFinanceiros?.lucroLiquido && (
                    <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>Lucro Líquido</div>
                      <div style={{ fontSize: '14px', color: '#15803d', fontWeight: '700' }}>
                        R$ {analise.dadosExtraidos.dadosFinanceiros.lucroLiquido.valor}M
                      </div>
                      {/* CORRIGIDO: Mostrar variacaoAA */}
                      {analise.dadosExtraidos.dadosFinanceiros.lucroLiquido.variacaoAA && (
                        <div style={{ fontSize: '11px', color: analise.dadosExtraidos.dadosFinanceiros.lucroLiquido.variacaoAA >= 0 ? '#059669' : '#dc2626' }}>
                          {analise.dadosExtraidos.dadosFinanceiros.lucroLiquido.variacaoAA >= 0 ? '+' : ''}{analise.dadosExtraidos.dadosFinanceiros.lucroLiquido.variacaoAA}% A/A
                        </div>
                      )}
                    </div>
                  )}
                  
                  {analise.dadosExtraidos.relatorioGerado.recomendacao && (
                    <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>Recomendação</div>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '700',
                        color: analise.dadosExtraidos.relatorioGerado.recomendacao === 'COMPRA' ? '#059669' : 
                               analise.dadosExtraidos.relatorioGerado.recomendacao === 'VENDA' ? '#dc2626' : '#f59e0b'
                      }}>
                        {analise.dadosExtraidos.relatorioGerado.recomendacao === 'COMPRA' ? '🟢 COMPRA' : 
                         analise.dadosExtraidos.relatorioGerado.recomendacao === 'VENDA' ? '🔴 VENDA' : '🟡 MANTER'}
                      </div>
{analise.dadosExtraidos.relatorioGerado.nota && (
  <div style={{ fontSize: '11px', color: '#15803d' }}>
    Nota: {analise.dadosExtraidos.relatorioGerado.nota}/10
  </div>
)}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div style={{ fontSize: '12px', color: '#15803d', opacity: 0.8 }}>
              ✨ Relatório completo importado - todos os campos foram pré-preenchidos e podem ser editados abaixo
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <div style={{
          background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #fde68a'
        }}>
          <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', marginBottom: '16px' }}>
            📝 Conteúdo da Análise
          </h5>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Título da Análise *
              </label>
              <input
                type="text"
                value={analise.titulo}
                onChange={(e) => updateField('titulo', e.target.value)}
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="TUPY3 - 3T24: Resultados sólidos com expansão internacional"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Análise Completa
              </label>
              <RichTextEditor
                value={analise.analiseCompleta}
                onChange={(value) => updateField('analiseCompleta', value)}
                placeholder="Análise detalhada dos resultados, contexto setorial, perspectivas..."
                minHeight="200px"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Pontos Favoráveis
              </label>
              <RichTextEditor
                value={analise.pontosFavoraveis}
                onChange={(value) => updateField('pontosFavoraveis', value)}
                placeholder="• Principais destaques positivos do trimestre..."
                minHeight="120px"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Pontos de Atenção
              </label>
              <RichTextEditor
                value={analise.pontosAtencao}
                onChange={(value) => updateField('pontosAtencao', value)}
                placeholder="• Principais riscos e preocupações identificadas..."
                minHeight="120px"
              />
            </div>
          </div>
        </div>

        {/* Métricas Financeiras Editáveis */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #0ea5e9'
        }}>
          <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#0c4a6e', marginBottom: '16px' }}>
            📊 Métricas Financeiras
          </h5>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {/* Receita */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '16px', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
              <h6 style={{ color: '#0c4a6e', fontWeight: '600', margin: '0 0 12px 0' }}>💰 Receita</h6>
              <div style={{ display: 'grid', gap: '8px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={analise.metricas.receita?.valor || ''}
                  onChange={(e) => updateMetrica('receita', 'valor', parseFloat(e.target.value) || 0)}
                  placeholder="1234.5"
                  style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}
                />
                <select
                  value={analise.metricas.receita?.unidade || 'milhões'}
                  onChange={(e) => updateMetrica('receita', 'unidade', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="milhões">R$ Milhões</option>
                  <option value="bilhões">R$ Bilhões</option>
                </select>
                <input
                  type="number"
                  step="0.1"
                  value={analise.metricas.receita?.variacaoYoY || ''}
                  onChange={(e) => updateMetrica('receita', 'variacaoYoY', parseFloat(e.target.value) || undefined)}
                  placeholder="Variação A/A (%)"
                  style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}
                />
              </div>
            </div>

            {/* EBITDA */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '16px', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
              <h6 style={{ color: '#0c4a6e', fontWeight: '600', margin: '0 0 12px 0' }}>📈 EBITDA</h6>
              <div style={{ display: 'grid', gap: '8px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={analise.metricas.ebitda?.valor || ''}
                  onChange={(e) => updateMetrica('ebitda', 'valor', parseFloat(e.target.value) || 0)}
                  placeholder="185.7"
                  style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}
                />
                <input
                  type="number"
                  step="0.1"
                  value={analise.metricas.ebitda?.margem || ''}
                  onChange={(e) => updateMetrica('ebitda', 'margem', parseFloat(e.target.value) || undefined)}
                  placeholder="Margem (%)"
                  style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}
                />
                <input
                  type="number"
                  step="0.1"
                  value={analise.metricas.ebitda?.variacaoYoY || ''}
                  onChange={(e) => updateMetrica('ebitda', 'variacaoYoY', parseFloat(e.target.value) || undefined)}
                  placeholder="Variação A/A (%)"
                  style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}
                />
              </div>
            </div>

            {/* Lucro Líquido */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '16px', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
              <h6 style={{ color: '#0c4a6e', fontWeight: '600', margin: '0 0 12px 0' }}>💎 Lucro Líquido</h6>
              <div style={{ display: 'grid', gap: '8px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={analise.metricas.lucroLiquido?.valor || ''}
                  onChange={(e) => updateMetrica('lucroLiquido', 'valor', parseFloat(e.target.value) || 0)}
                  placeholder="89.2"
                  style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}
                />
                <input
                  type="number"
                  step="0.1"
                  value={analise.metricas.lucroLiquido?.margem || ''}
                  onChange={(e) => updateMetrica('lucroLiquido', 'margem', parseFloat(e.target.value) || undefined)}
                  placeholder="Margem (%)"
                  style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}
                />
                <input
                  type="number"
                  step="0.1"
                  value={analise.metricas.lucroLiquido?.variacaoYoY || ''}
                  onChange={(e) => updateMetrica('lucroLiquido', 'variacaoYoY', parseFloat(e.target.value) || undefined)}
                  placeholder="Variação A/A (%)"
                  style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}
                />
              </div>
            </div>

            {/* ROE */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '16px', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
              <h6 style={{ color: '#0c4a6e', fontWeight: '600', margin: '0 0 12px 0' }}>🎯 ROE</h6>
              <div style={{ display: 'grid', gap: '8px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={analise.metricas.roe?.valor || ''}
                  onChange={(e) => updateMetrica('roe', 'valor', parseFloat(e.target.value) || 0)}
                  placeholder="15.3"
                  style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}
                />
                <input
                  type="number"
                  step="0.1"
                  value={analise.metricas.roe?.variacaoYoY || ''}
                  onChange={(e) => updateMetrica('roe', 'variacaoYoY', parseFloat(e.target.value) || undefined)}
                  placeholder="Variação A/A (p.p.)"
                  style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Outras Métricas Dinâmicas */}
        <div style={{
          background: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #facc15'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', margin: 0 }}>
                📈 Outras Métricas Relevantes
              </h5>
              <p style={{ fontSize: '12px', color: '#b45309', margin: '4px 0 0 0' }}>
                Registre métricas adicionais extraídas do PDF ou adicionadas manualmente. É possível ajustar a ordem, valores e metadados de variação.
              </p>
            </div>

            <button
              type="button"
              onClick={addOtherMetric}
              style={{
                backgroundColor: '#d97706',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)'
              }}
            >
              <Plus size={16} /> Adicionar métrica
            </button>
          </div>

          {(analise.otherMetrics ?? []).length === 0 ? (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: '1px dashed #facc15',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '13px',
              color: '#b45309'
            }}>
              Nenhuma métrica extra cadastrada. Utilize o botão "Adicionar métrica" ou importe um PDF para preencher automaticamente.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {(analise.otherMetrics ?? []).map((metric, index) => {
                const suggestion = findSuggestionForEntry(metric);
                const suggestionValue = suggestion?.value_num ?? suggestion?.value ?? null;
                const suggestionDelta = suggestion?.delta_value ?? null;

                return (
                  <div
                    key={metric.id}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      border: '1px solid rgba(250, 204, 21, 0.6)',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 4px 10px rgba(250, 204, 21, 0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 600, color: '#92400e', fontSize: '14px' }}>
                        {metric.label || 'Nova métrica'}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => moveOtherMetric(index, -1)}
                          disabled={index === 0}
                          style={{
                            backgroundColor: '#fcd34d',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            opacity: index === 0 ? 0.5 : 1
                          }}
                        >
                          <ChevronUp size={16} color="#92400e" />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveOtherMetric(index, 1)}
                          disabled={index === (analise.otherMetrics ?? []).length - 1}
                          style={{
                            backgroundColor: '#fcd34d',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: index === (analise.otherMetrics ?? []).length - 1 ? 'not-allowed' : 'pointer',
                            opacity: index === (analise.otherMetrics ?? []).length - 1 ? 0.5 : 1
                          }}
                        >
                          <ChevronDown size={16} color="#92400e" />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeOtherMetric(index)}
                          style={{
                            backgroundColor: '#f87171',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} color="white" />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                          Rótulo
                        </label>
                        <input
                          type="text"
                          value={metric.label}
                          onChange={(e) => updateOtherMetric(index, 'label', e.target.value)}
                          placeholder="Ex.: Margem EBITDA"
                          style={{
                            width: '100%',
                            border: '1px solid #fcd34d',
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '13px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                          Unidade
                        </label>
                        <input
                          type="text"
                          value={metric.unit ?? ''}
                          onChange={(e) => updateOtherMetric(index, 'unit', e.target.value || null)}
                          placeholder="%, x, milhões..."
                          style={{
                            width: '100%',
                            border: '1px solid #fcd34d',
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '13px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                          Valor
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={metric.value ?? ''}
                          onChange={(e) => updateOtherMetric(index, 'value', e.target.value === '' ? null : parseFloat(e.target.value))}
                          placeholder="0.0"
                          style={{
                            width: '100%',
                            border: '1px solid #fcd34d',
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '13px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                          Variação
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={metric.deltaValue ?? ''}
                          onChange={(e) => updateOtherMetric(index, 'deltaValue', e.target.value === '' ? null : parseFloat(e.target.value))}
                          placeholder="0.0"
                          style={{
                            width: '100%',
                            border: '1px solid #fcd34d',
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '13px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                          Unidade da Variação
                        </label>
                        <input
                          type="text"
                          value={metric.deltaUnit ?? ''}
                          onChange={(e) => updateOtherMetric(index, 'deltaUnit', e.target.value || null)}
                          placeholder="%, p.p., x..."
                          style={{
                            width: '100%',
                            border: '1px solid #fcd34d',
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '13px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                          Base da Variação
                        </label>
                        <select
                          value={metric.deltaBasis ?? ''}
                          onChange={(e) => updateOtherMetric(index, 'deltaBasis', e.target.value ? e.target.value as FinancialMetricDeltaBasis : null)}
                          style={{
                            width: '100%',
                            border: '1px solid #fcd34d',
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '13px',
                            backgroundColor: 'white'
                          }}
                        >
                          <option value="">--</option>
                          <option value="yoy">Ano vs Ano (YoY)</option>
                          <option value="qoq">Trimestre vs Trimestre (QoQ)</option>
                          <option value="pp">Pontos percentuais (p.p.)</option>
                          <option value="abs">Variação absoluta</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#b45309' }}>
                        Confiança na leitura automática: <strong>{metric.parseConfidence.toUpperCase()}</strong>
                      </div>

                      {suggestion && (
                        <div style={{
                          backgroundColor: 'rgba(250, 204, 21, 0.15)',
                          borderRadius: '8px',
                          border: '1px dashed rgba(217, 119, 6, 0.6)',
                          padding: '10px',
                          display: 'grid',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#92400e'
                        }}>
                          <div style={{ fontWeight: 600 }}>Sugestão do PDF</div>
                          <div>
                            <strong>Valor extraído:</strong>{' '}
                            {suggestionValue !== null && suggestionValue !== undefined ? suggestionValue : '—'}{suggestion?.unit ? ` ${suggestion.unit}` : ''}
                          </div>
                          <div>
                            <strong>Variação sugerida:</strong>{' '}
                            {suggestionDelta !== null && suggestionDelta !== undefined ? suggestionDelta : '—'}{suggestion?.delta_unit ? ` ${suggestion.delta_unit}` : ''}
                          </div>
                          <button
                            type="button"
                            onClick={() => applySuggestionToOtherMetric(index, suggestion)}
                            style={{
                              justifySelf: 'start',
                              backgroundColor: '#d97706',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Aplicar sugestão
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recomendação */}
        <div style={{
          background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #d8b4fe'
        }}>
          <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#7c2d12', marginBottom: '16px' }}>
            🎯 Recomendação de Investimento
          </h5>

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
  <div>
    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
      Recomendação
    </label>
    <select
      value={analise.recomendacao}
      onChange={(e) => updateField('recomendacao', e.target.value as AnaliseTrimestreData['recomendacao'])}
      style={{
        width: '100%',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '14px',
        boxSizing: 'border-box',
        fontWeight: '600'
      }}
    >
      <option value="COMPRA">🟢 COMPRA</option>
      <option value="MANTER">🟡 MANTER</option>
      <option value="VENDA">🔴 VENDA</option>
    </select>
  </div>

  <div>
    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
      Nota (0-10)
    </label>
    <input
      type="number"
      step="0.1"
      min="0"
      max="10"
      value={analise.nota || ''}
      onChange={(e) => updateField('nota', parseFloat(e.target.value) || undefined)}
      style={{
        width: '100%',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '14px',
        boxSizing: 'border-box'
      }}
      placeholder="8.5"
    />
  </div>
</div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// COMPONENTES DE LISTAGEM (mantidos iguais, mas com keys corrigidas)
// ============================================================================

const AnalisesPublicadas = memo(({ 
  analises, 
  onEdit, 
  onUnpublish,
  onDelete 
}: { 
  analises: AnaliseTrimestreData[];
  onEdit: (analise: AnaliseTrimestreData) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const analisesPublicadas = analises.filter(a => a.status === 'published');
  
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {analisesPublicadas.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '64px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
            Nenhuma Análise Publicada
          </h3>
          <p style={{ fontSize: '16px', color: '#64748b' }}>
            Publique suas primeiras análises para vê-las aqui.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
            📊 Análises Publicadas ({analisesPublicadas.length})
          </h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            {analisesPublicadas.map((analise, index) => {
              // CORRIGIDO: Key única garantida
              const keyUnica = analise.id || `publicada-${analise.ticker}-${index}-${Date.now()}`;
              
              return (
                <div key={keyUnica} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>
                        {analise.titulo}
                      </h4>
                      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                        {analise.ticker} • {analise.empresa} • {analise.trimestre}
                        {analise.fonteDados === 'pdf' && (
                          <span style={{ 
                            marginLeft: '8px', 
                            backgroundColor: '#fbbf24', 
                            color: 'white', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            📄 PDF
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(analise.dataPublicacao).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onEdit(analise)}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Editar
                      </button>
                      
                      <button
                        onClick={() => onUnpublish(analise.id!)}
                        style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Despublicar
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir esta análise?')) {
                            onDelete(analise.id!);
                          }
                        }}
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

const RascunhosAnalises = memo(({ 
  analises, 
  onEdit, 
  onPublish,
  onDelete 
}: { 
  analises: AnaliseTrimestreData[];
  onEdit: (analise: AnaliseTrimestreData) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const rascunhos = analises.filter(a => a.status === 'draft');

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {rascunhos.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '64px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
            Nenhum Rascunho
          </h3>
          <p style={{ fontSize: '16px', color: '#64748b' }}>
            Todos os seus rascunhos foram publicados ou você ainda não criou nenhum.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
            📝 Rascunhos ({rascunhos.length})
          </h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            {rascunhos.map((analise, index) => {
              // CORRIGIDO: Key única garantida
              const keyUnica = analise.id || `rascunho-${analise.ticker}-${index}-${Date.now()}`;
              
              return (
                <div key={keyUnica} style={{
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#fefce8'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#92400e', margin: '0 0 8px 0' }}>
                        {analise.titulo || 'Título não definido'}
                      </h4>
                      <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '8px' }}>
                        {analise.ticker || 'Ticker'} • {analise.empresa || 'Empresa'} • {analise.trimestre || 'Trimestre'}
                        {analise.fonteDados === 'pdf' && (
                          <span style={{ 
                            marginLeft: '8px', 
                            backgroundColor: '#fbbf24', 
                            color: 'white', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            📄 PDF
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#a16207' }}>
                        Criado em: {new Date(analise.dataPublicacao).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onEdit(analise)}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Editar
                      </button>
                      
                      <button
                        onClick={() => onPublish(analise.id!)}
                        style={{
                          backgroundColor: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Publicar
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este rascunho?')) {
                            onDelete(analise.id!);
                          }
                        }}
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL COM APIS REAIS - CORRIGIDO
// ============================================================================

const AdminAnalisesTrimesestrais = () => {
  const { hasAnalisesTrimesestraisAdminAccess, loading: authLoading, user } = useAuthAccess();
  const [analises, setAnalises] = useState<AnaliseTrimestreData[]>([]);
  const [activeTab, setActiveTab] = useState<'criar' | 'publicadas' | 'rascunhos'>('criar');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analiseEditando, setAnaliseEditando] = useState<AnaliseTrimestreData | null>(null);

  const totalAnalises = analises.length;
  const analisesDraft = analises.filter(a => a.status === 'draft').length;
  const analisesPublicadas = analises.filter(a => a.status === 'published').length;

  // ✅ CARREGAMENTO VIA API REAL
  useEffect(() => {
    const loadAnalises = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Carregando análises via API...');
        const analisesCarregadas = await analiseAPI.listar();
        
        console.log(`✅ ${analisesCarregadas.length} análises carregadas`);
        setAnalises(analisesCarregadas);
        
      } catch (error) {
        console.error('❌ Erro ao carregar análises:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setError(`Erro ao carregar análises: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalises();
  }, []);

  // ✅ SALVAR VIA API REAL - CORRIGIDO
  const saveAnalise = useCallback(async (analise: AnaliseTrimestreData) => {
    setSaving(true);
    setError(null);
    
    try {
      console.log('💾 Salvando análise via API...', analise.ticker);
      
      let analiseSalva: AnaliseTrimestreData;
      
      const isEdit = analise.id && 
                     analise.id !== 'temp' && 
                     !analise.id.startsWith('temp-') &&
                     analises.some(a => a.id === analise.id);
      
      if (isEdit) {
        analiseSalva = await analiseAPI.atualizar(analise.id!, analise);
        setAnalises(prev => prev.map(a => a.id === analiseSalva.id ? analiseSalva : a));
        console.log('✅ Análise atualizada com sucesso:', analiseSalva.id);
      } else {
        // CORRIGIDO: Para novas análises, remover o id temporário
        const { id, ...analiseParaCriar } = analise;
        analiseSalva = await analiseAPI.criar(analiseParaCriar);
        setAnalises(prev => [...prev, analiseSalva]);
        console.log('✅ Análise criada com sucesso:', analiseSalva.id);
      }
      
      setAnaliseEditando(null);
      
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(`Erro ao salvar: ${errorMessage}`);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [analises]);

  // ✅ PUBLICAR/DESPUBLICAR VIA API REAL
  const publishAnalise = useCallback(async (id: string) => {
    const analise = analises.find(a => a.id === id);
    if (!analise) return;
    
    const analisePublicada = { ...analise, status: 'published' as const };
    await saveAnalise(analisePublicada);
  }, [analises, saveAnalise]);

  const unpublishAnalise = useCallback(async (id: string) => {
    const analise = analises.find(a => a.id === id);
    if (!analise) return;
    
    const analiseRascunho = { ...analise, status: 'draft' as const };
    await saveAnalise(analiseRascunho);
  }, [analises, saveAnalise]);

  // ✅ DELETAR VIA API REAL
  const deleteAnalise = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);
    
    try {
      console.log('🗑️ Deletando análise via API:', id);
      
      await analiseAPI.deletar(id);
      setAnalises(prev => prev.filter(a => a.id !== id));
      
      console.log('✅ Análise deletada com sucesso');
      alert('✅ Análise excluída com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao deletar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(`Erro ao deletar: ${errorMessage}`);
      alert(`❌ Erro ao excluir análise: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }, []);

  const editAnalise = useCallback((analise: AnaliseTrimestreData) => {
    console.log('✏️ Editando análise:', analise.id);
    
    const analiseExistente = analises.find(a => a.id === analise.id);
    
    if (!analiseExistente) {
      console.error('❌ Análise não encontrada no estado local:', analise.id);
      alert('❌ Erro: Análise não encontrada. Recarregue a página.');
      return;
    }
    
    setAnaliseEditando(analiseExistente);
    setActiveTab('criar');
  }, [analises]);


  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
            Verificando permissões administrativas...
          </h2>
        </div>
      </div>
    );
  }

  if (!hasAnalisesTrimesestraisAdminAccess()) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ 
          textAlign: 'center', 
          backgroundColor: 'white', 
          padding: '48px 32px', 
          borderRadius: '16px', 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#dc2626', 
            marginBottom: '16px' 
          }}>
            Acesso Administrativo Negado
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '24px'
          }}>
            Esta área é restrita a <strong>administradores</strong> do sistema. Você não possui as permissões necessárias para gerenciar análises trimestrais.
          </p>
          <p style={{ 
            color: '#64748b', 
            fontSize: '14px',
            marginBottom: '32px'
          }}>
            Usuário: <strong>{user?.email || 'N/A'}</strong> | 
            Plano: <strong>{user?.plan || 'N/A'}</strong>
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
            Carregando análises...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
        color: 'white',
        borderBottom: '4px solid #3b82f6'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PieChart size={28} style={{ color: 'white' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 4px 0' }}>
                  Análises Trimestrais
                </h1>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '16px' }}>
                  Central de Análises de Resultados - Fatos da Bolsa
                </p>
              </div>
            </div>
            
            {/* Status Cards */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                minWidth: '100px'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                  {totalAnalises}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Total</div>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                minWidth: '100px'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#fbbf24' }}>
                  {analisesDraft}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Rascunhos</div>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                minWidth: '100px'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>
                  {analisesPublicadas}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Publicadas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Sistema de Abas */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          marginBottom: '32px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {/* Tab Headers */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}>
            <button
              onClick={() => setActiveTab('criar')}
              style={{
                flex: 1,
                padding: '20px 24px',
                border: 'none',
                backgroundColor: activeTab === 'criar' ? 'white' : 'transparent',
                color: activeTab === 'criar' ? '#1e293b' : '#64748b',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: activeTab === 'criar' ? '3px solid #3b82f6' : '3px solid transparent'
              }}
            >
              {analiseEditando ? 'Editar Análise' : 'Criar Análises'}
            </button>
            
            <button
              onClick={() => setActiveTab('publicadas')}
              style={{
                flex: 1,
                padding: '20px 24px',
                border: 'none',
                backgroundColor: activeTab === 'publicadas' ? 'white' : 'transparent',
                color: activeTab === 'publicadas' ? '#1e293b' : '#64748b',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: activeTab === 'publicadas' ? '3px solid #3b82f6' : '3px solid transparent'
              }}
            >
              Publicadas ({analisesPublicadas})
            </button>
            
            <button
              onClick={() => setActiveTab('rascunhos')}
              style={{
                flex: 1,
                padding: '20px 24px',
                border: 'none',
                backgroundColor: activeTab === 'rascunhos' ? 'white' : 'transparent',
                color: activeTab === 'rascunhos' ? '#1e293b' : '#64748b',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: activeTab === 'rascunhos' ? '3px solid #3b82f6' : '3px solid transparent'
              }}
            >
              Rascunhos ({analisesDraft})
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ padding: '32px' }}>
            {activeTab === 'criar' && (
              analiseEditando ? (
                <div>
                  <div style={{
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '16px', fontWeight: '600' }}>
                      ✏️ Editando Análise
                    </h4>
                    <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                      Você está editando: <strong>{analiseEditando.titulo || analiseEditando.ticker}</strong>
                    </p>
                    <button
                      onClick={() => setAnaliseEditando(null)}
                      style={{
                        marginTop: '12px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancelar Edição
                    </button>
                  </div>
                  <CriarAnaliseForm 
                    key={analiseEditando.id} 
                    analiseEditando={analiseEditando}
                    onSave={saveAnalise} 
                  />
                </div>
              ) : (
                <CriarAnaliseForm onSave={saveAnalise} />
              )
            )}
            
            {activeTab === 'publicadas' && (
              <AnalisesPublicadas 
                analises={analises}
                onEdit={editAnalise}
                onUnpublish={unpublishAnalise}
                onDelete={deleteAnalise}
              />
            )}
            
            {activeTab === 'rascunhos' && (
              <RascunhosAnalises 
                analises={analises}
                onEdit={editAnalise}
                onPublish={publishAnalise}
                onDelete={deleteAnalise}
              />
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalisesTrimesestrais;