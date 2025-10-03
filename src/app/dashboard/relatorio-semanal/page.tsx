'use client';

/**
 * RELATÓRIO SEMANAL - VISUALIZAÇÃO COM ANÁLISES TRIMESTRAIS VINCULADAS
 * 
 * ✅ Funcionalidades implementadas:
 * - Internacional separado em 4 subcategorias
 * - Proventos integrados em cada seção
 * - Permissões granulares por plano
 * - 🆕 Análises trimestrais vinculadas
 * - Modal para visualizar análises completas
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { Calendar, DollarSign, TrendingUp, Globe, Building, Zap, AlertCircle, CheckCircle, BarChart3, Lock, PieChart, LineChart, Coins, Target, ExternalLink, Eye, FileText } from 'lucide-react';

import { AnaliseTrimestreData } from '@/types/quarterly-metrics';
// Interface unificada para items
interface ItemRelatorio {
  ticker: string;
  empresa?: string;
  company?: string; // compatibilidade
  
  // Identificador de tipo
  isProvento?: boolean;
  
  // Campos para notícias
  titulo?: string;
  title?: string; // compatibilidade
  news?: string; // compatibilidade
  resumo?: string;
  summary?: string; // compatibilidade
  analise?: string;
  impacto?: 'positivo' | 'negativo' | 'neutro';
  impact?: 'positive' | 'negative' | 'neutral'; // compatibilidade
  highlight?: string;
  destaque?: string;
  recomendacao?: 'COMPRA' | 'VENDA' | 'MANTER';
  precoAlvo?: number;
  
  // 🆕 Análise Trimestral Vinculada
  temAnaliseTrismestral?: boolean;
  analiseTrismestralId?: string;
  analiseTrismestralTicker?: string;
  analiseTrismestralTitulo?: string;
  analiseTrismestralTrimestre?: string;
  
  // Campos para proventos
  tipoProvento?: 'Dividendo' | 'JCP' | 'Bonificação';
  type?: string; // compatibilidade
  valor?: string;
  value?: string; // compatibilidade
  dy?: string;
  datacom?: string;
  exDate?: string; // compatibilidade
  pagamento?: string;
  payDate?: string; // compatibilidade
}

interface RelatorioData {
  id?: string;
  date: string;
  weekOf?: string;
  semana?: string;
  titulo?: string;
  status: 'draft' | 'published';
  
  // Seções nacionais
  macro: ItemRelatorio[];
  dividendos: ItemRelatorio[];
  smallCaps: ItemRelatorio[];
  microCaps: ItemRelatorio[];
  
  // Internacional separado
  exteriorStocks?: ItemRelatorio[];
  exteriorETFs?: ItemRelatorio[];
  exteriorDividendos?: ItemRelatorio[];
  exteriorProjetoAmerica?: ItemRelatorio[];
  
  // Campo legado
  exterior?: ItemRelatorio[];
}

interface HistoricoRelatorio {
  id: string;
  dataPublicacao: string | null;
  semana: string | null;
  titulo?: string | null;
}

// Import do hook de autenticação
import { useAuthAccess } from '@/hooks/use-auth-access';

// 🆕 MAPEAMENTO ATUALIZADO COM INTERNACIONAL SEPARADO
const mapearSecaoParaPermissao = (sectionKey: string, userPermissions: string[]): boolean => {
  // Macro é sempre visível
  if (sectionKey === 'macro') return true;
  
  // Mapeamento nacional
  const mapeamentoNacional: Record<string, string> = {
    'dividendos': 'dividendos',
    'smallCaps': 'small-caps',
    'microCaps': 'micro-caps'
  };
  
  // Se é seção nacional, verificar permissão direta
  if (mapeamentoNacional[sectionKey]) {
    return userPermissions.includes(mapeamentoNacional[sectionKey]);
  }
  
  // 🆕 MAPEAMENTO INTERNACIONAL GRANULAR
  if (sectionKey === 'exteriorStocks' || sectionKey === 'exteriorETFs') {
    // LITE, VIP e AMERICA podem ver Stocks e ETFs
    return userPermissions.includes('internacional') || 
           userPermissions.includes('internacional-stocks') ||
           userPermissions.includes('internacional-etfs');
  }
  
  if (sectionKey === 'exteriorDividendos') {
    // Apenas VIP e AMERICA podem ver dividendos internacionais
    return userPermissions.includes('internacional-dividendos') ||
           (userPermissions.includes('internacional') && !userPermissions.includes('internacional-stocks')); // VIP tem 'internacional' completo
  }
  
  if (sectionKey === 'exteriorProjetoAmerica') {
    // Apenas AMERICA pode ver Projeto América
    return userPermissions.includes('internacional-projeto-america');
  }
  
  // Campo legado 'exterior' - usar lógica antiga
  if (sectionKey === 'exterior') {
    return userPermissions.includes('internacional');
  }
  
  return false;
};

// Componente para renderizar HTML com segurança
const HTMLContent: React.FC<{ content: string; style?: React.CSSProperties }> = ({ content, style = {} }) => {
  if (!content) return null;

  const sanitizeHTML = (html: string) => {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  };

  const enforceResponsiveImages = (html: string) => {
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
      return html;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = Array.from(doc.getElementsByTagName('img'));

    images.forEach((img) => {
      img.removeAttribute('width');
      img.removeAttribute('height');

      const existingStyle = img.getAttribute('style') || '';
      const filteredStyle = existingStyle
        .split(';')
        .map((styleRule) => styleRule.trim())
        .filter((styleRule) => styleRule && !/^width\s*:/i.test(styleRule) && !/^height\s*:/i.test(styleRule))
        .join('; ');

      const responsiveStyles = 'max-width:100%; height:auto; display:block;';
      const combinedStyles = [filteredStyle, responsiveStyles]
        .filter(Boolean)
        .join(filteredStyle ? '; ' : '')
        .trim();

      img.setAttribute('style', combinedStyles);
    });

    return doc.body.innerHTML;
  };

  const sanitized = sanitizeHTML(content);
  const normalized = enforceResponsiveImages(sanitized);

  return (
    <div
      style={{
        lineHeight: '1.6',
        fontSize: '16px',
        color: '#4b5563',
        ...style
      }}
      dangerouslySetInnerHTML={{ __html: normalized }}
    />
  );
};

// 🆕 MODAL DE ANÁLISE TRIMESTRAL (simplificado para a visualização pública)
const ModalAnaliseCompleta = memo(({ 
  analise, 
  isOpen, 
  onClose 
}: { 
  analise: AnaliseTrimestreData | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
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

  const formatarValorMetrica = (metrica: any): string => {
    if (!metrica || !metrica.valor) return 'N/A';
    
    const valor = metrica.valor;
    const unidade = metrica.unidade === 'bilhões' ? 'bi' : 'mi';
    
    if (valor >= 1000 && unidade === 'mi') {
      return `R$ ${(valor / 1000).toFixed(1)} bi`;
    }
    
    return `R$ ${valor.toFixed(1)} ${unidade}`;
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
        borderRadius: window.innerWidth < 768 ? '16px 16px 0 0' : '16px',
        width: window.innerWidth < 768 ? '100%' : '90%',
        height: window.innerWidth < 768 ? '95%' : '90%',
        maxWidth: window.innerWidth < 768 ? 'none' : '1200px',
        maxHeight: window.innerWidth < 768 ? 'none' : '800px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        position: window.innerWidth < 768 ? 'fixed' : 'relative',
        bottom: window.innerWidth < 768 ? '0' : 'auto',
        left: window.innerWidth < 768 ? '0' : 'auto'
      }}>
        {/* Header do Modal */}
        <div style={{
          padding: window.innerWidth < 768 ? '16px 20px' : '24px 32px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: window.innerWidth < 768 ? '8px' : '12px', 
                marginBottom: '8px',
                flexWrap: 'wrap'
              }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: window.innerWidth < 768 ? '20px' : '24px', 
                  fontWeight: '700', 
                  color: '#1e293b' 
                }}>
                  {analise.ticker}
                </h2>
                <span style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: window.innerWidth < 768 ? '3px 8px' : '4px 12px',
                  borderRadius: '8px',
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  fontWeight: '600'
                }}>
                  {analise.trimestre}
                </span>
                <span style={{
                  backgroundColor: '#e2e8f0',
                  color: '#64748b',
                  padding: window.innerWidth < 768 ? '2px 6px' : '4px 8px',
                  borderRadius: '6px',
                  fontSize: window.innerWidth < 768 ? '10px' : '12px',
                  fontWeight: '500'
                }}>
                  {analise.categoria.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontSize: window.innerWidth < 768 ? '16px' : '18px', 
                fontWeight: '600', 
                color: '#374151',
                lineHeight: '1.4'
              }}>
                {analise.titulo}
              </h3>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: window.innerWidth < 768 ? '12px' : '16px', 
                fontSize: window.innerWidth < 768 ? '12px' : '14px', 
                color: '#64748b',
                flexWrap: 'wrap'
              }}>
                <span>{new Date(analise.dataPublicacao).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: window.innerWidth < 768 ? '20px' : '24px',
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
          
        </div>

        {/* Conteúdo Scrollável */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: window.innerWidth < 768 ? '20px 16px' : '32px',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Métricas do Trimestre - COMPLETAS */}
          {Object.keys(analise.metricas).length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📊 Métricas do Trimestre
              </h4>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px' 
              }}>
                {analise.metricas.receita && analise.metricas.receita.valor !== undefined && (
                  <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#15803d', fontWeight: '600' }}>💰 Receita</h5>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#166534' }}>
                      {formatarValorMetrica(analise.metricas.receita)}
                    </div>
                    {analise.metricas.receita.variacaoYoY !== undefined && typeof analise.metricas.receita.variacaoYoY === 'number' && (
                      <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
                        {analise.metricas.receita.variacaoYoY >= 0 ? '↗' : '↘'} {analise.metricas.receita.variacaoYoY.toFixed(1)}% A/A
                      </div>
                    )}
                  </div>
                )}

                {analise.metricas.ebitda && analise.metricas.ebitda.valor !== undefined && (
                  <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', border: '1px solid #7dd3fc' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0c4a6e', fontWeight: '600' }}>📊 EBITDA</h5>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0369a1' }}>
                      {formatarValorMetrica(analise.metricas.ebitda)}
                    </div>
                    {analise.metricas.ebitda.margem !== undefined && typeof analise.metricas.ebitda.margem === 'number' && (
                      <div style={{ fontSize: '12px', color: '#0c4a6e', marginTop: '4px' }}>
                        Margem: {analise.metricas.ebitda.margem.toFixed(1)}%
                      </div>
                    )}
                    {analise.metricas.ebitda.variacaoYoY !== undefined && typeof analise.metricas.ebitda.variacaoYoY === 'number' && (
                      <div style={{ fontSize: '11px', color: '#0c4a6e', marginTop: '2px' }}>
                        {analise.metricas.ebitda.variacaoYoY >= 0 ? '↗' : '↘'} {analise.metricas.ebitda.variacaoYoY.toFixed(1)}% A/A
                      </div>
                    )}
                  </div>
                )}

                {analise.metricas.lucroLiquido && analise.metricas.lucroLiquido.valor !== undefined && (
                  <div style={{ backgroundColor: '#fdf4ff', padding: '16px', borderRadius: '8px', border: '1px solid #d8b4fe' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#7c2d12', fontWeight: '600' }}>💎 Lucro Líquido</h5>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#92400e' }}>
                      {formatarValorMetrica(analise.metricas.lucroLiquido)}
                    </div>
                    {analise.metricas.lucroLiquido.variacaoYoY !== undefined && typeof analise.metricas.lucroLiquido.variacaoYoY === 'number' && (
                      <div style={{ fontSize: '12px', color: '#7c2d12', marginTop: '4px' }}>
                        {analise.metricas.lucroLiquido.variacaoYoY >= 0 ? '↗' : '↘'} {analise.metricas.lucroLiquido.variacaoYoY.toFixed(1)}% A/A
                      </div>
                    )}
                  </div>
                )}

                {analise.metricas.roe && analise.metricas.roe.valor !== undefined && (
                  <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#991b1b', fontWeight: '600' }}>🎯 ROE</h5>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                      {typeof analise.metricas.roe.valor === 'number' ? analise.metricas.roe.valor.toFixed(1) : analise.metricas.roe.valor}%
                    </div>
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
                📝 Análise Qualitativa
              </h4>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                gap: '16px'
              }}>
                {analise.pontosFavoraveis && (
                  <div style={{ 
                    backgroundColor: '#f0fdf4', 
                    padding: window.innerWidth < 768 ? '16px' : '20px', 
                    borderRadius: '12px', 
                    border: '1px solid #bbf7d0',
                    flex: 1
                  }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#15803d' }}>
                      ✅ Pontos Favoráveis
                    </h5>
                    <div 
                      style={{ lineHeight: '1.6', color: '#166534', fontSize: window.innerWidth < 768 ? '14px' : '16px' }}
                      dangerouslySetInnerHTML={{ __html: analise.pontosFavoraveis }}
                    />
                  </div>
                )}

                {analise.pontosAtencao && (
                  <div style={{ 
                    backgroundColor: '#fef3c7', 
                    padding: window.innerWidth < 768 ? '16px' : '20px', 
                    borderRadius: '12px', 
                    border: '1px solid #fde68a',
                    flex: 1
                  }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                      ⚠️ Pontos de Atenção
                    </h5>
                    <div 
                      style={{ lineHeight: '1.6', color: '#92400e', fontSize: window.innerWidth < 768 ? '14px' : '16px' }}
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
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                🔗 Materiais Oficiais
              </h4>
              
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {analise.linkResultado && (
                  <a
                    href={analise.linkResultado}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#374151',
                      color: 'white',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    <FileText size={16} />
                    Release de Resultados
                    <ExternalLink size={14} />
                  </a>
                )}

                {analise.linkConferencia && (
                  <a
                    href={analise.linkConferencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#059669',
                      color: 'white',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    <Building size={16} />
                    Conference Call
                    <ExternalLink size={14} />
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

// Header do relatório
const ReportHeader = ({ relatorio, userInfo }: { relatorio: RelatorioData | null; userInfo?: { planName: string, permissions: string[] } }) => (
  <div style={{
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 25%, #2d2d2d 75%, #000000 100%)',
    color: 'white',
    padding: '20px 16px 30px',
    textAlign: 'center',
    position: 'relative'
  }}>
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto',
      position: 'relative',
      zIndex: 10
    }}>
      {userInfo?.planName && (
        <div style={{
          background: '#4cfa00',
          color: 'black',
          padding: '4px 12px',
          borderRadius: '12px',
          display: 'inline-block',
          fontSize: '11px',
          fontWeight: '600',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {userInfo.planName}
        </div>
      )}
      
      <h1 style={{
        fontSize: 'clamp(20px, 5vw, 32px)',
        fontWeight: '700',
        margin: '0 0 8px 0',
        lineHeight: '1.2'
      }}>
        Relatório de Atualização Semanal
      </h1>
      
      <p style={{
        fontSize: 'clamp(12px, 3vw, 14px)',
        color: '#94a3b8',
        margin: '0 0 16px 0',
        fontWeight: '500',
        letterSpacing: '1px',
        textTransform: 'uppercase'
      }}>
        {relatorio?.semana || relatorio?.weekOf || 'Carregando...'}
      </p>
      
      <div style={{
        fontSize: 'clamp(14px, 3.5vw, 18px)',
        fontWeight: '600',
        color: '#4cfa00'
      }}>
        {relatorio?.date ? new Date(relatorio.date).toLocaleDateString('pt-BR', { 
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : 'Carregando...'}
      </div>
      
      <div style={{
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: '#4cfa00',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <BarChart3 size={18} style={{ color: 'black' }} />
        </div>
        <span style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#e2e8f0'
        }}>
          FATOS DA BOLSA
        </span>
      </div>
    </div>
  </div>
);

// Seção bloqueada
const BlockedSection = ({ title }: { title: string }) => (
  <div style={{
    backgroundColor: '#f8fafc',
    border: '2px dashed #e2e8f0',
    borderRadius: '12px',
    padding: 'clamp(24px, 3vw, 32px) 16px',
    marginBottom: '20px',
    textAlign: 'center',
    position: 'relative'
  }}>
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 'clamp(48px, 6vw, 56px)',
      height: 'clamp(48px, 6vw, 56px)',
      borderRadius: '12px',
      backgroundColor: '#fee2e2',
      marginBottom: 'clamp(12px, 2vw, 16px)'
    }}>
      <Lock size={26} style={{ color: '#dc2626' }} />
    </div>
    
    <h3 style={{
      fontSize: 'clamp(18px, 4vw, 24px)',
      fontWeight: '600',
      color: '#374151',
      margin: '0 0 10px 0'
    }}>
      {title}
    </h3>
    
    <p style={{
      fontSize: 'clamp(14px, 2.5vw, 16px)',
      color: '#6b7280',
      margin: 0
    }}>
      🔒 Conteúdo exclusivo - Upgrade necessário
    </p>
  </div>
);

// Header de seção
const SectionHeader = ({ icon: Icon, title, color, count, proventosCount, noticiasCount, analisesCount }: { 
  icon: any, 
  title: string, 
  color: string, 
  count: number,
  proventosCount?: number,
  noticiasCount?: number,
  analisesCount?: number
}) => (
  <div style={{
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
    color: 'white',
    borderRadius: '12px',
    padding: 'clamp(20px, 3vw, 28px) clamp(16px, 2.5vw, 24px)',
    marginBottom: 'clamp(16px, 2.5vw, 24px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    border: '1px solid #333'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <h2 style={{
        fontSize: 'clamp(24px, 5vw, 32px)',
        fontWeight: '900',
        color: 'white',
        margin: 0,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontFamily: 'Arial Black, sans-serif'
      }}>
        {title}
      </h2>
      
      {/* Padrão de quadradinhos logo após o texto */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 6px)',
        gridTemplateRows: 'repeat(2, 6px)',
        gap: '2px'
      }}>
        <div style={{ backgroundColor: '#4cfa00' }}></div>
        <div style={{ backgroundColor: 'transparent' }}></div>
        <div style={{ backgroundColor: '#4cfa00' }}></div>
        <div style={{ backgroundColor: 'transparent' }}></div>
        <div style={{ backgroundColor: 'transparent' }}></div>
        <div style={{ backgroundColor: '#4cfa00' }}></div>
        <div style={{ backgroundColor: 'transparent' }}></div>
        <div style={{ backgroundColor: '#4cfa00' }}></div>
      </div>
    </div>
  </div>
);

// Cache para logos das empresas
const logoCache = new Map<string, string>();

// Função para buscar logo da empresa
const fetchCompanyLogo = async (ticker: string): Promise<string | null> => {
  try {
    if (logoCache.has(ticker)) {
      return logoCache.get(ticker) || null;
    }

    const response = await fetch(
      `https://brapi.dev/api/quote/${ticker}?token=jJrMYVy9MATGEicx3GxBp8&fundamental=false&dividends=false`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data?.results?.[0]?.logourl) {
      const logoUrl = data.results[0].logourl;
      logoCache.set(ticker, logoUrl);
      return logoUrl;
    }
    
    logoCache.set(ticker, '');
    return null;
    
  } catch (error) {
    console.log(`❌ [BRAPI] Erro ao buscar logo para ${ticker}:`, error);
    logoCache.set(ticker, '');
    return null;
  }
};

// Componente para exibir logo da empresa
const CompanyLogo = ({ ticker, fallbackColor, isProvento, temAnalise }: { ticker: string, fallbackColor: string, isProvento?: boolean, temAnalise?: boolean }) => {
  const [logoSrc, setLogoSrc] = useState<string>('');
  const [logoError, setLogoError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker) {
      setLoading(false);
      return;
    }

    const loadLogo = async () => {
      try {
        const logoUrl = await fetchCompanyLogo(ticker);
        
        if (logoUrl) {
          setLogoSrc(logoUrl);
        } else {
          setLogoError(true);
        }
      } catch (error) {
        setLogoError(true);
      } finally {
        setLoading(false);
      }
    };

    loadLogo();
  }, [ticker]);

  if (loading) {
    return (
      <div style={{
        width: '40px',
        height: '40px',
        background: `${fallbackColor}10`,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${fallbackColor}20`,
        position: 'relative'
      }}>
        <div style={{
          width: '16px',
          height: '16px',
          border: `2px solid ${fallbackColor}30`,
          borderTop: `2px solid ${fallbackColor}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (logoError || !logoSrc) {
    return (
      <div style={{
        width: '40px',
        height: '40px',
        backgroundColor: isProvento ? '#fbbf24' : fallbackColor,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '20px',
        fontWeight: 'bold',
        position: 'relative'
      }}>
        {isProvento ? '💰' : '📰'}

      </div>
    );
  }

  return (
    <div style={{
      width: '40px',
      height: '40px',
      backgroundColor: 'white',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${fallbackColor}20`,
      overflow: 'hidden',
      position: 'relative'
    }}>
      <img 
        src={logoSrc}
        alt={`Logo ${ticker}`}
        style={{
          width: '32px',
          height: '32px',
          objectFit: 'contain'
        }}
        onError={() => {
          setLogoError(true);
        }}
      />
      {/* Badge de provento */}
      {isProvento && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: temAnalise ? '12px' : '-4px',
          width: '18px',
          height: '18px',
          backgroundColor: '#fbbf24',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}>
          💰
        </div>
      )}
    </div>
  );
};

// 🆕 Card unificado para notícias e proventos COM ANÁLISES TRIMESTRAIS
const ItemCard = ({ item, sectionColor, onOpenAnalise }: { 
  item: ItemRelatorio, 
  sectionColor: string,
  onOpenAnalise?: (analiseId: string) => void
}) => {
  // Normalizar campos para compatibilidade
  const ticker = item.ticker;
  const empresa = item.empresa || item.company || '';
  const isProvento = item.isProvento || item.type || item.tipoProvento || item.value || item.valor;
  const temAnalise = item.temAnaliseTrismestral && item.analiseTrismestralId;

  // Verificar se é item do Panorama Macro (sem ticker/empresa)
  const isPanoramaMacro = !ticker && !empresa && (item.titulo || item.analise);
  const noticiaConteudoPrincipal = item.resumo || item.analise || item.summary;
  
  return (
    <div style={{
      backgroundColor: isProvento ? '#fefce8' : 'white',
      borderRadius: '12px',
      padding: 'clamp(16px, 2.5vw, 24px)',
      marginBottom: 'clamp(12px, 2vw, 20px)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: `1px solid ${isProvento ? '#fde68a' : `${sectionColor}15`}`,
      position: 'relative'
    }}>
      {/* 🆕 Badge de análise trimestral vinculada */}
{temAnalise && (
  <div style={{
    position: 'absolute',
    top: '-8px',
    right: '16px',
    backgroundColor: '#374151',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(55, 65, 81, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }}>
    📊 ANÁLISE DISPONÍVEL
  </div>
)}

{/* Header - condicional para Panorama Macro */}
{isPanoramaMacro ? (
  // Renderização simplificada para Panorama Macro
  <div style={{ 
    display: 'flex', 
    alignItems: 'center',
    marginBottom: 'clamp(12px, 2vw, 18px)',
    gap: 'clamp(12px, 2vw, 16px)'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      backgroundColor: sectionColor,
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '20px'
    }}>
      🌍
    </div>
    <h3 style={{
      fontSize: 'clamp(18px, 3vw, 22px)',
      fontWeight: '700',
      color: '#1f2937',
      margin: 0
    }}>
      Notícia Macro
    </h3>
  </div>
) : (
  // Renderização normal com ticker e empresa
  <div style={{ 
    display: 'flex', 
    alignItems: 'flex-start', 
    marginBottom: 'clamp(12px, 2vw, 18px)',
    gap: 'clamp(12px, 2vw, 16px)'
  }}>
    <CompanyLogo 
      ticker={ticker} 
      fallbackColor={sectionColor} 
      isProvento={isProvento} 
      temAnalise={temAnalise}
    />
    
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '6px',
        flexWrap: 'wrap'
      }}>
        <h3 style={{
          fontSize: 'clamp(18px, 3vw, 22px)',
          fontWeight: '700',
          color: '#1f2937',
          margin: 0
        }}>
          {ticker}
        </h3>
        
        {/* Badge de tipo */}
        {isProvento && (
          <span style={{
            fontSize: 'clamp(10px, 1.5vw, 12px)',
            fontWeight: '600',
            color: '#92400e',
            backgroundColor: '#fef3c7',
            padding: '3px 8px',
            borderRadius: '4px'
          }}>
            {item.tipoProvento || item.type || 'Provento'}
          </span>
        )}
     
      </div>
      
      <p style={{
        fontSize: 'clamp(14px, 2.2vw, 16px)',
        color: '#6b7280',
        margin: 0,
        fontWeight: '500'
      }}>
        {empresa}
      </p>
    </div>
  </div>
)}      
{/* Conteúdo específico baseado no tipo */}
      {isProvento ? (
        // 💰 LAYOUT PARA PROVENTO
        <div>
          <h4 style={{
            fontSize: 'clamp(16px, 2.8vw, 20px)',
            fontWeight: '600',
            color: '#92400e',
            margin: '0 0 12px 0',
            lineHeight: '1.4'
          }}>
            {item.titulo || item.title || item.news || `${item.tipoProvento || item.type || 'Provento'} anunciado`}
          </h4>

          {(item.resumo || item.summary) && (
            <HTMLContent
              content={item.resumo || item.summary || ''}
              style={{
                fontSize: 'clamp(14px, 2.2vw, 16px)',
                color: '#92400e',
                lineHeight: '1.6',
                margin: '0 0 16px 0'
              }}
            />
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 'clamp(12px, 2vw, 20px)',
            padding: '16px',
            backgroundColor: '#fffbeb',
            borderRadius: '8px',
            border: '1px solid #fde68a'
          }}>
            {(item.valor || item.value) && (
              <div>
                <div style={{ 
                  fontSize: 'clamp(11px, 1.8vw, 13px)', 
                  color: '#92400e', 
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  Valor
                </div>
                <div style={{ 
                  fontSize: 'clamp(16px, 2.5vw, 18px)', 
                  fontWeight: '700', 
                  color: '#78350f' 
                }}>
                  {item.valor || item.value}
                </div>
              </div>
            )}
            
            {item.dy && (
              <div>
                <div style={{ 
                  fontSize: 'clamp(11px, 1.8vw, 13px)', 
                  color: '#92400e', 
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  Dividend Yield
                </div>
                <div style={{ 
                  fontSize: 'clamp(16px, 2.5vw, 18px)',
                  fontWeight: '700', 
                  color: '#10b981' 
                }}>
                  {item.dy}
                </div>
              </div>
            )}
            
            {(item.datacom || item.exDate) && (
              <div>
                <div style={{ 
                  fontSize: 'clamp(11px, 1.8vw, 13px)', 
                  color: '#92400e', 
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  Data-com
                </div>
                <div style={{ 
                  fontSize: 'clamp(14px, 2.2vw, 16px)',
                  fontWeight: '600', 
                  color: '#78350f' 
                }}>
                  {new Date(item.datacom || item.exDate || '').toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}
            
            {(item.pagamento || item.payDate) && (
              <div>
                <div style={{ 
                  fontSize: 'clamp(11px, 1.8vw, 13px)', 
                  color: '#92400e', 
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  Pagamento
                </div>
                <div style={{ 
                  fontSize: 'clamp(14px, 2.2vw, 16px)',
                  fontWeight: '600', 
                  color: '#78350f' 
                }}>
                  {new Date(item.pagamento || item.payDate || '').toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // 📰 LAYOUT PARA NOTÍCIA
        <div>
          <h4 style={{
            fontSize: 'clamp(16px, 2.8vw, 20px)',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0 0 12px 0',
            lineHeight: '1.4'
          }}>
            {item.titulo || item.title || item.news}
          </h4>

          {noticiaConteudoPrincipal && (
            <HTMLContent
              content={noticiaConteudoPrincipal || ''}
              style={{
                fontSize: 'clamp(14px, 2.2vw, 17px)',
                color: '#4b5563',
                lineHeight: '1.6',
                margin: '0 0 16px 0'
              }}
            />
          )}

          {(item.destaque || item.highlight) && (
            <div style={{
              padding: 'clamp(12px, 2vw, 16px)',
              margin: '12px 0',
              borderLeft: `3px solid ${sectionColor}`,
              backgroundColor: `${sectionColor}08`,
              borderRadius: '0 6px 6px 0'
            }}>
              <div style={{
                fontSize: 'clamp(11px, 1.8vw, 13px)',
                fontWeight: '600',
                color: sectionColor,
                marginBottom: '6px',
                textTransform: 'uppercase'
              }}>
                💡 Destaque
              </div>
              <HTMLContent 
                content={item.destaque || item.highlight || ''}
                style={{
                  fontSize: 'clamp(14px, 2.2vw, 16px)',
                  color: '#374151',
                  margin: 0,
                  fontWeight: '500'
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* 🆕 BOTÃO PARA ANÁLISE TRIMESTRAL */}
      {temAnalise && onOpenAnalise && (
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'center'
        }}>
<button
  onClick={() => onOpenAnalise(item.analiseTrismestralId!)}
  style={{
    backgroundColor: '#374151',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: 'clamp(14px, 2.2vw, 16px)',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(55, 65, 81, 0.3)',
              transition: 'all 0.2s ease',
              width: '100%',
              maxWidth: '300px',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(55, 65, 81, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(55, 65, 81, 0.3)';
            }}
          >
            <span>Ver Análise Trimestral</span>
            <ExternalLink size={14} />
          </button>
        </div>
      )}

    </div>
  );
};

// Componente principal
export default function RelatorioSemanalPage() {
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historico, setHistorico] = useState<HistoricoRelatorio[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showHistorico, setShowHistorico] = useState(false);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [historicoError, setHistoricoError] = useState<string | null>(null);

  // 🆕 Estados para o modal de análise trimestral
  const [analiseModalAberta, setAnaliseModalAberta] = useState<AnaliseTrimestreData | null>(null);
  const [carregandoAnalise, setCarregandoAnalise] = useState(false);

  const formatarDataHistorico = (data: string | null | undefined) => {
    if (!data) return 'Data indisponível';

    const parsedDate = new Date(data);

    if (Number.isNaN(parsedDate.getTime())) {
      return data;
    }

    return parsedDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Hook de autenticação e permissões
  let userPermissions: string[] = [];
  let planName: string = 'Carregando...';
  
  try {
    const authResult = useAuthAccess();
    
    if (authResult && authResult.planInfo) {
      userPermissions = authResult.planInfo.pages || [];
      planName = authResult.planInfo.displayName || 'Plano Padrão';
      
      // Se for admin, dar todas as permissões
      if (authResult.user?.plan === 'ADMIN') {
        userPermissions = [
          'small-caps', 'micro-caps', 'dividendos', 
          'fundos-imobiliarios', 'internacional',
          'internacional-stocks', 'internacional-etfs',
          'internacional-dividendos', 'internacional-projeto-america'
        ];
        planName = 'Administrador';
      }
      // 🆕 CONFIGURAÇÃO ESPECÍFICA PARA LITE
      else if (authResult.user?.plan === 'LITE' || authResult.user?.plan === 'LITE_V2') {
        // LITE tem acesso limitado ao internacional
        if (!userPermissions.includes('internacional-stocks')) {
          userPermissions.push('internacional-stocks', 'internacional-etfs');
        }
        // Remover acesso a dividendos internacionais e projeto américa se existir
        userPermissions = userPermissions.filter(p => 
          !p.includes('internacional-dividendos') && 
          !p.includes('internacional-projeto-america')
        );
      }
      
    } else {
      throw new Error('Hook retornou dados inválidos');
    }
    
  } catch (error) {
    console.warn('⚠️ Hook useAuthAccess falhou, usando fallback:', error);
    
    // Fallback para testes
    userPermissions = ['small-caps', 'dividendos', 'internacional-stocks', 'internacional-etfs'];
    planName = 'Fallback';
  }

  // 🆕 Função para abrir análise trimestral
  const abrirAnalise = useCallback(async (analiseId: string) => {
    setCarregandoAnalise(true);

    try {
      console.log('🔍 Buscando análise trimestral:', analiseId);
      const response = await fetch('/api/analises-trimestrais');
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const todasAnalises = await response.json();
      const analiseEncontrada = todasAnalises.find((a: any) => a.id === analiseId);
      
      if (analiseEncontrada) {
        setAnaliseModalAberta(analiseEncontrada);
      } else {
        console.error('❌ Análise não encontrada:', analiseId);
        alert('Análise não encontrada. Pode ter sido removida ou está indisponível.');
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar análise:', error);
      alert('Erro ao carregar análise trimestral. Tente novamente.');
    } finally {
      setCarregandoAnalise(false);
    }
  }, []);

  const fecharModalAnalise = useCallback(() => {
    setAnaliseModalAberta(null);
  }, []);

  const loadRelatorio = useCallback(async ({ reportId, date, semana }: { reportId?: string; date?: string; semana?: string } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (reportId) {
        params.set('id', reportId);
      } else {
        if (date) params.set('date', date);
        if (semana) params.set('semana', semana);
      }

      const queryString = params.toString();
      const response = await fetch(`/api/relatorio-semanal${queryString ? `?${queryString}` : ''}`);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const relatorioResponse = await response.json();

      if (relatorioResponse) {
        if (relatorioResponse.exterior && !relatorioResponse.exteriorStocks) {
          relatorioResponse.exteriorStocks = relatorioResponse.exterior;
          relatorioResponse.exteriorETFs = [];
          relatorioResponse.exteriorDividendos = [];
          relatorioResponse.exteriorProjetoAmerica = [];
        }

        setRelatorio(relatorioResponse);
        setSelectedReportId(relatorioResponse.id ?? null);
        setError(null);
      } else {
        setRelatorio(null);
        setError('Nenhum relatório publicado disponível');
        setSelectedReportId(null);
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      setRelatorio(null);
      setError('Erro ao carregar relatório');
      setSelectedReportId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarHistorico = useCallback(async () => {
    try {
      setLoadingHistorico(true);
      setHistoricoError(null);

      const response = await fetch('/api/relatorio-semanal?list=true');

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const historicoResponse = await response.json();

      if (Array.isArray(historicoResponse)) {
        setHistorico(historicoResponse);
      } else {
        setHistorico([]);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de relatórios:', error);
      setHistorico([]);
      setHistoricoError('Não foi possível carregar o histórico de relatórios.');
    } finally {
      setLoadingHistorico(false);
    }
  }, []);

  const handleSelectHistorico = useCallback(async (entry: HistoricoRelatorio) => {
    setShowHistorico(false);

    await loadRelatorio({
      reportId: entry.id,
      date: entry.dataPublicacao ?? undefined,
      semana: entry.semana ?? undefined
    });
  }, [loadRelatorio]);

  useEffect(() => {
    loadRelatorio();
  }, [loadRelatorio]);

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '300px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #e5e7eb', 
            borderTop: '3px solid #10b981', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1f2937', 
            marginBottom: '8px' 
          }}>
            Carregando Relatório
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Buscando o relatório semanal mais recente...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !relatorio) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ 
          textAlign: 'center', 
          backgroundColor: 'white', 
          padding: '32px 20px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px'
        }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            color: '#1f2937', 
            marginBottom: '8px' 
          }}>
            {error || 'Relatório Não Disponível'}
          </h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {error === 'Nenhum relatório publicado disponível' 
              ? 'Ainda não há relatórios publicados. Aguarde a publicação do próximo relatório.'
              : 'Ocorreu um erro ao carregar o relatório. Tente novamente mais tarde.'}
          </p>
        </div>
      </div>
    );
  }

  // 🆕 Configuração das seções com internacional separado
  const sections = [
    { 
      key: 'macro', 
      data: relatorio.macro, 
      title: 'Panorama Macro', 
      icon: Globe, 
      color: '#2563eb',
      alwaysVisible: true 
    },
    { 
      key: 'dividendos', 
      data: relatorio.dividendos, 
      title: 'Dividendos', 
      icon: DollarSign, 
      color: '#059669' 
    },
    { 
      key: 'smallCaps', 
      data: relatorio.smallCaps, 
      title: 'Small Caps', 
      icon: Building, 
      color: '#2563eb' 
    },
    { 
      key: 'microCaps', 
      data: relatorio.microCaps, 
      title: 'Micro Caps', 
      icon: Zap, 
      color: '#ea580c' 
    }
  ];

  // 🆕 Seções internacionais separadas
  const internationalSections = [
    { 
      key: 'exteriorStocks', 
      data: relatorio.exteriorStocks, 
      title: 'Internacional - Stocks', 
      icon: TrendingUp, 
      color: '#7c3aed',
      description: 'Ações internacionais individuais'
    },
    { 
      key: 'exteriorETFs', 
      data: relatorio.exteriorETFs, 
      title: 'Internacional - ETFs', 
      icon: LineChart, 
      color: '#6366f1',
      description: 'ETFs internacionais'
    },
    { 
      key: 'exteriorDividendos', 
      data: relatorio.exteriorDividendos, 
      title: 'Internacional - Dividendos', 
      icon: Coins, 
      color: '#0ea5e9',
      description: 'Empresas internacionais pagadoras de dividendos'
    },
    { 
      key: 'exteriorProjetoAmerica', 
      data: relatorio.exteriorProjetoAmerica, 
      title: 'Projeto América', 
      icon: Target, 
      color: '#dc2626',
      description: 'Conteúdo exclusivo do Projeto América'
    }
  ];

  // Se ainda tem dados no campo legado 'exterior', adicionar como fallback
  if (relatorio.exterior && relatorio.exterior.length > 0 && 
      (!relatorio.exteriorStocks || relatorio.exteriorStocks.length === 0)) {
    internationalSections.push({
      key: 'exterior' as any,
      data: relatorio.exterior,
      title: 'Internacional',
      icon: Globe,
      color: '#7c3aed',
      description: 'Notícias internacionais'
    });
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <ReportHeader 
        relatorio={relatorio} 
        userInfo={{ 
          planName: planName,
          permissions: userPermissions
        }} 
      />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(24px, 4vw, 40px) clamp(20px, 3vw, 30px)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 'clamp(16px, 3vw, 24px)'
        }}>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowHistorico((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: '999px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.25)'
              }}
              aria-expanded={showHistorico}
              aria-haspopup="listbox"
            >
              <Calendar size={16} />
              {selectedReportId ? 'Histórico de relatórios' : 'Selecionar data'}
            </button>

            {showHistorico && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 20px 45px rgba(15, 23, 42, 0.2)',
                  border: '1px solid #e2e8f0',
                  width: 'min(320px, 80vw)',
                  zIndex: 50,
                  padding: '16px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}
                >
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>Selecione uma data</strong>
                  {loadingHistorico && (
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Carregando...</span>
                  )}
                </div>

                {historicoError && (
                  <p style={{ fontSize: '12px', color: '#dc2626' }}>{historicoError}</p>
                )}

                {!historicoError && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '260px',
                      overflowY: 'auto'
                    }}
                  >
                    {historico.length === 0 && !loadingHistorico && (
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        Nenhum relatório publicado encontrado.
                      </span>
                    )}

                    {historico.map((item) => {
                      const isSelected = selectedReportId === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectHistorico(item)}
                          style={{
                            textAlign: 'left',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: isSelected ? '#0ea5e9' : 'transparent',
                            backgroundColor: isSelected ? '#0ea5e9' : '#f8fafc',
                            color: isSelected ? 'white' : '#0f172a',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>
                            {formatarDataHistorico(item.dataPublicacao ?? relatorio.date)}
                          </span>
                          {item.semana && (
                            <span
                              style={{
                                fontSize: '12px',
                                color: isSelected ? 'rgba(255, 255, 255, 0.8)' : '#475569'
                              }}
                            >
                              {item.semana}
                            </span>
                          )}
                          {item.titulo && (
                            <span
                              style={{
                                fontSize: '12px',
                                color: isSelected ? 'rgba(255, 255, 255, 0.75)' : '#94a3b8'
                              }}
                            >
                              {item.titulo}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Seções nacionais */}
        {sections.map((section) => {
          const hasAccess = section.alwaysVisible || mapearSecaoParaPermissao(section.key, userPermissions);
          const hasData = section.data && section.data.length > 0;
          
          if (!hasData) return null;
          
          // Contar proventos, notícias e análises
          const proventosCount = section.data.filter(item => 
            item.isProvento || item.type || item.tipoProvento || item.value || item.valor
          ).length;
          const noticiasCount = section.data.length - proventosCount;
          const analisesCount = section.data.filter(item => 
            item.temAnaliseTrismestral && item.analiseTrismestralId
          ).length;
          
          if (!hasAccess) {
            return (
              <section key={section.key} style={{ marginBottom: 'clamp(32px, 5vw, 48px)' }}>
                <SectionHeader 
                  icon={section.icon}
                  title={section.title}
                  color={section.color}
                  count={section.data.length}
                  proventosCount={proventosCount}
                  noticiasCount={noticiasCount}
                  analisesCount={analisesCount}
                />
                <BlockedSection title={section.title} />
              </section>
            );
          }
          
          return (
            <section key={section.key} style={{ marginBottom: 'clamp(32px, 5vw, 48px)' }}>
              <SectionHeader 
                icon={section.icon}
                title={section.title}
                color={section.color}
                count={section.data.length}
                proventosCount={proventosCount}
                noticiasCount={noticiasCount}
                analisesCount={analisesCount}
              />
              
              <div>
                {section.data.map((item, index) => (
                  <ItemCard 
                    key={index} 
                    item={item} 
                    sectionColor={section.color}
                    onOpenAnalise={abrirAnalise}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* 🆕 Seções internacionais */}
        {internationalSections.some(s => s.data && s.data.length > 0) && (
          <>
            <div style={{
              backgroundColor: '#faf5ff',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              border: '1px solid #e9d5ff'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#6b21a8',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🌎 Mercado Internacional
              </h3>
            </div>

            {internationalSections.map((section) => {
              const hasAccess = mapearSecaoParaPermissao(section.key, userPermissions);
              const hasData = section.data && section.data.length > 0;
              
              if (!hasData) return null;
              
              // Contar proventos, notícias e análises
              const proventosCount = section.data.filter(item => 
                item.isProvento || item.type || item.tipoProvento || item.value || item.valor
              ).length;
              const noticiasCount = section.data.length - proventosCount;
              const analisesCount = section.data.filter(item => 
                item.temAnaliseTrismestral && item.analiseTrismestralId
              ).length;
              
              if (!hasAccess) {
                return (
                  <section key={section.key} style={{ marginBottom: 'clamp(32px, 5vw, 48px)' }}>
                    <SectionHeader 
                      icon={section.icon}
                      title={section.title}
                      color={section.color}
                      count={section.data.length}
                      proventosCount={proventosCount}
                      noticiasCount={noticiasCount}
                      analisesCount={analisesCount}
                    />
                    <BlockedSection title={section.title} />
                  </section>
                );
              }
              
              return (
                <section key={section.key} style={{ marginBottom: 'clamp(32px, 5vw, 48px)' }}>
                  <SectionHeader 
                    icon={section.icon}
                    title={section.title}
                    color={section.color}
                    count={section.data.length}
                    proventosCount={proventosCount}
                    noticiasCount={noticiasCount}
                    analisesCount={analisesCount}
                  />
                  
                  {section.description && (
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '-8px 0 16px 0',
                      paddingLeft: '64px'
                    }}>
                      {section.description}
                    </p>
                  )}
                  
                  <div>
                    {section.data.map((item, index) => (
                      <ItemCard 
                        key={index} 
                        item={item} 
                        sectionColor={section.color}
                        onOpenAnalise={abrirAnalise}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}

<section>
  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
    <AlertCircle size={20} style={{ color: '#f59e0b' }} />
    Disclosure 
  </h3>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#475569', fontSize: '14px', lineHeight: 1.7 }}>
    <p style={{ margin: 0 }}>
      A análise apresentada foi elaborada pelo analista de valores mobiliários autônomo Marcos Schilling Machado (CNPI nº 2529), nos termos da Resolução CVM Nº20/2021.
    </p>
    <p style={{ margin: 0 }}>
      De acordo com a exigência regulatória do artigo 21 previsto na Resolução CVM nº 20, de 25 de fevereiro de 2021, o analista de valores mobiliários, responsável principal por este relatório, declara: (i) que as recomendações contidas neste relatório refletem única e exclusivamente sua opinião pessoal sobre a companhia analisada e seus valores mobiliários e foram elaborados de forma independente e autônoma; (ii) que as informações, opiniões, estimativas e projeções contidas neste documento referem-se à data presente e estão sujeitas a mudanças, não implicando necessariamente na obrigação de qualquer comunicação no sentido de atualização ou revisão com respeito a tal mudança.
    </p>
    <p style={{ margin: 0 }}>
      O material produzido é baseado em informações públicas, consideradas fidedignas na data de sua publicação, portanto as estimativas, opiniões e recomendações estão sujeitas a mudanças sem aviso prévio. O conteúdo do relatório não pode ser reproduzido ou distribuído, do todo ou em parte dos relatórios, a terceiros, sem prévia e expressa autorização sob nenhuma forma, no todo ou em parte, sob pena da adoção de medidas cíveis e criminais, incluindo a obrigação de reparação de todas as perdas e danos causados, nos termos da Lei nº 9.610/98 e de outras aplicáveis.
    </p>
    <p style={{ margin: 0 }}>
      Os relatórios disponibilizados aos seguidores e/ou assinantes da @fatosdabolsa não representam ofertas, negociação de valores mobiliários ou de outros instrumentos financeiros. As opiniões e recomendações dos analistas não implicam em quaisquer concessões de crédito e/ou promessa de rendimentos aos clientes. A Fatos da Bolsa e os analistas signatários não podem garantir que os investidores obterão lucros. Além disso, a Fatos da Bolsa e os analistas não compartilharão quaisquer ganhos de investimento com os investidores, nem assumirão qualquer responsabilidade por perdas incorridas.
    </p>
    <p style={{ margin: 0 }}>
      Investimentos envolvem riscos e os investidores devem ser prudentes ao tomar suas decisões de investimento. A Fatos da Bolsa e os analistas signatários não possuem obrigações fiduciárias para com os destinatários deste relatório e, ao divulgá-lo, não estão agindo como um fiduciário. As decisões de investimentos e estratégias financeiras devem ser realizadas pelos próprios leitores, não sendo de responsabilidade dos analistas eventuais perdas que as recomendações possam gerar aos clientes.
    </p>
    <p style={{ margin: 0 }}>
      Mais informações podem ser obtidas na Resolução CVM nº 20/2021, e no Código de Conduta da APIMEC para o Analista de Valores Mobiliários. Fonte: RI das empresas.
    </p>
    <p style={{ margin: 0 }}>
      Data de elaboração do relatório de análise: {new Date("2025-09-29").toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })}
      .
    </p>
  </div>
</section>

        {/* Rodapé */}
        <div style={{
          textAlign: 'center',
          padding: '24px 16px',
          borderTop: '1px solid #e5e7eb',
          marginTop: '48px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              backgroundColor: '#4cfa00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={14} style={{ color: 'white' }} />
            </div>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              FATOS DA BOLSA
            </span>
          </div>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '12px',
            margin: '0 0 4px 0'
          }}>
            © Fatos da Bolsa - contato@fatosdabolsa.com.br
          </p>
          <p style={{ 
            color: '#9ca3af', 
            fontSize: '11px',
            margin: 0
          }}>
            Última atualização: {new Date(relatorio.date).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* 🆕 MODAL DE ANÁLISE TRIMESTRAL */}
      <ModalAnaliseCompleta 
        analise={analiseModalAberta}
        isOpen={!!analiseModalAberta}
        onClose={fecharModalAnalise}
      />

      {/* Loading overlay para análises */}
      {carregandoAnalise && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid #e5e7eb', 
              borderTop: '3px solid #22c55e', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ margin: 0, color: '#374151', fontSize: '16px', fontWeight: '600' }}>
              Carregando análise trimestral...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
