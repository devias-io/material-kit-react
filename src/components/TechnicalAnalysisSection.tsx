'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, ExternalLink, RefreshCcw, ShieldAlert } from 'lucide-react';

import { useMediaQuery } from '@/hooks/use-media-query';

interface AutorInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  email: string | null;
}

interface AnaliseTecnica {
  id: string;
  ticker: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo: string;
  imagemCapa: string | null;
  fonte: string | null;
  publicado: boolean;
  destaque: boolean;
  createdAt: string;
  updatedAt: string;
  autor?: AutorInfo | null;
}

interface TechnicalAnalysisSectionProps {
  ticker: string;
}

const formataData = (dataISO: string) => {
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Erro ao formatar data de análise técnica:', error);
    return '';
  }
};

const fallbackResumo = (conteudo: string, limite = 280) => {
  if (!conteudo) {
    return '';
  }

  const texto = conteudo
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (texto.length <= limite) {
    return texto;
  }

  return `${texto.slice(0, limite).trim()}...`;
};

export default function TechnicalAnalysisSection({ ticker }: TechnicalAnalysisSectionProps) {
  const [analises, setAnalises] = useState<AnaliseTecnica[]>([]);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [expanded, setExpanded] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isMobile = useMediaQuery('(max-width: 640px)');

  const carregarAnalises = useCallback(async () => {
    if (!ticker) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ ticker, publicado: 'true', limit: '5' });
      const response = await fetch(`/api/analises-tecnicas?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Falha ao carregar análises técnicas (${response.status})`);
      }

      const data = await response.json();
      const lista: AnaliseTecnica[] = Array.isArray(data?.analises) ? data.analises : [];

      setAnalises(lista);
      setSelecionadaId(lista[0]?.id ?? null);
      setExpanded(false);
    } catch (err) {
      console.error('Erro ao carregar análises técnicas:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a análise técnica.');
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    carregarAnalises();
  }, [carregarAnalises]);

  const analiseSelecionada = useMemo(() => {
    if (!selecionadaId) {
      return analises[0] ?? null;
    }

    return analises.find(item => item.id === selecionadaId) ?? analises[0] ?? null;
  }, [analises, selecionadaId]);

  useEffect(() => {
    if (!contentRef.current) {
      return;
    }

    const container = contentRef.current;

    const images = container.querySelectorAll<HTMLImageElement>('img');
    images.forEach(img => {
      img.style.maxWidth = '100%';
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.margin = '16px auto';
      img.style.borderRadius = '12px';
      img.style.objectFit = 'contain';
    });

    const tables = container.querySelectorAll<HTMLTableElement>('table');
    tables.forEach(table => {
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.display = 'block';
      table.style.boxSizing = 'border-box';

      if (table.dataset.taWrapped !== 'true') {
        const wrapper = document.createElement('div');
        wrapper.style.overflowX = 'auto';
        wrapper.style.setProperty('-webkit-overflow-scrolling', 'touch');
        wrapper.style.margin = isMobile ? '12px 0' : '16px 0';
        wrapper.style.borderRadius = '12px';
        wrapper.style.border = '1px solid #e2e8f0';
        wrapper.style.background = '#ffffff';
        wrapper.style.padding = isMobile ? '0 8px' : '0 12px';
        wrapper.style.boxSizing = 'border-box';
        wrapper.dataset.taWrapper = 'true';

        const parent = table.parentElement;
        if (parent) {
          parent.insertBefore(wrapper, table);
          wrapper.appendChild(table);
          table.dataset.taWrapped = 'true';
        }
      }
    });

    const iframes = container.querySelectorAll<HTMLIFrameElement>('iframe');
    iframes.forEach(iframe => {
      iframe.style.width = '100%';
      iframe.style.minHeight = isMobile ? '220px' : '320px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';
      iframe.style.boxSizing = 'border-box';
      iframe.setAttribute('allowfullscreen', 'true');
    });

    const paragraphs = container.querySelectorAll<HTMLParagraphElement>('p');
    paragraphs.forEach(paragraph => {
      if (!paragraph.style.lineHeight) {
        paragraph.style.lineHeight = '1.7';
      }

      if (!paragraph.style.marginBottom) {
        paragraph.style.marginBottom = '1rem';
      }
    });
  }, [analiseSelecionada, expanded, isMobile]);

  const headerPadding = isMobile ? '20px 18px' : isTablet ? '24px 24px' : '28px 32px';
  const containerPadding = isMobile ? '20px 16px' : isTablet ? '24px 24px' : '28px 32px';
  const articlePadding = isMobile ? '18px' : isTablet ? '22px' : '24px';
  const accentBlockPadding = isMobile ? '16px' : '20px';
  const supplementaryPadding = isMobile ? '18px' : '20px';
  const sectionMaxWidth = isTablet ? '100%' : '960px';

  if (!ticker) {
    return null;
  }

  return (
    <section
      style={{
        margin: isMobile ? '16px auto 24px' : '24px auto 32px',
        width: '100%',
        maxWidth: sectionMaxWidth,
        borderRadius: isMobile ? '16px' : '18px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: isTablet ? 'column' : 'row',
          alignItems: isTablet ? 'stretch' : 'center',
          justifyContent: isTablet ? 'flex-start' : 'space-between',
          gap: '18px',
          padding: headerPadding,
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 60%, #111827 100%)',
          color: '#f8fafc',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: isMobile ? '12px' : '16px',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              borderRadius: isMobile ? '10px' : '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(77, 251, 1, 0.12)',
              color: '#4dfb01',
            }}
          >
            <BarChart3 size={isMobile ? 22 : 26} strokeWidth={1.6} />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: isMobile ? '12px' : '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'rgba(248, 250, 252, 0.7)',
                fontWeight: 600,
              }}
            >
              Análise técnica
            </p>
            <h2
              style={{
                margin: isMobile ? '2px 0 0 0' : '4px 0 0 0',
                fontSize: isMobile ? 'clamp(20px, 6vw, 26px)' : '28px',
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              Insights profissionais para {ticker.toUpperCase()}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={carregarAnalises}
          style={{
            background: 'rgba(248, 250, 252, 0.08)',
            border: '1px solid rgba(248, 250, 252, 0.18)',
            color: '#f8fafc',
            borderRadius: '10px',
            padding: isMobile ? '10px 14px' : '10px 16px',
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            justifyContent: 'center',
            width: isTablet ? '100%' : 'auto',
          }}
        >
          <RefreshCcw size={16} /> Atualizar
        </button>
      </header>

      <div
        style={{
          padding: containerPadding,
          display: 'grid',
          gap: isMobile ? '18px' : '24px',
        }}
      >
        {loading ? (
          <div style={{ display: 'grid', gap: '18px' }}>
            <div
              style={{
                height: isMobile ? '180px' : '220px',
                borderRadius: '16px',
                background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%)',
                backgroundSize: '400% 100%',
                animation: 'pulse 1.6s ease infinite',
              }}
            />
            <div
              style={{
                height: '18px',
                width: isMobile ? '160px' : '220px',
                borderRadius: '6px',
                background: '#e2e8f0',
              }}
            />
            <div
              style={{
                height: '14px',
                width: isMobile ? '220px' : '320px',
                borderRadius: '6px',
                background: '#e2e8f0',
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, height: '12px', background: '#e2e8f0', borderRadius: '6px' }} />
              <div style={{ flex: 1, height: '12px', background: '#e2e8f0', borderRadius: '6px' }} />
            </div>
          </div>
        ) : error ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: isMobile ? '20px' : '24px',
              border: '1px solid #fecaca',
              borderRadius: isMobile ? '14px' : '16px',
              background: '#fef2f2',
              color: '#b91c1c',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldAlert size={20} />
              <strong>Não foi possível carregar a análise técnica</strong>
            </div>
            <span>{error}</span>
          </div>
        ) : !analiseSelecionada ? (
          <div
            style={{
              padding: isMobile ? '24px' : '32px',
              border: '2px dashed #cbd5f5',
              borderRadius: isMobile ? '14px' : '16px',
              background: '#f8fafc',
              textAlign: 'center',
              color: '#475569',
            }}
          >
            <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              Nenhuma análise técnica publicada para este ativo ainda
            </p>
            <p style={{ margin: 0, fontSize: '14px' }}>
              As análises cadastradas pelo time aparecem automaticamente aqui.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: isMobile ? '20px' : '24px' }}>
            <article
              style={{
                borderRadius: isMobile ? '14px' : '16px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
              }}
            >
              {analiseSelecionada.imagemCapa && (
                <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                  <img
                    src={analiseSelecionada.imagemCapa}
                    alt={`Imagem ilustrativa da análise técnica ${analiseSelecionada.titulo}`}
                    style={{
                      display: 'block',
                      width: '100%',
                      maxHeight: isMobile ? '220px' : isTablet ? '300px' : '360px',
                      objectFit: 'cover',
                    }}
                  />
                  {analiseSelecionada.destaque && (
                    <span
                      style={{
                        position: 'absolute',
                        top: isMobile ? '12px' : '18px',
                        right: isMobile ? '12px' : '18px',
                        background: 'rgba(77, 251, 1, 0.85)',
                        color: '#0f172a',
                        padding: isMobile ? '5px 10px' : '6px 12px',
                        borderRadius: '999px',
                        fontSize: isMobile ? '11px' : '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Destaque
                    </span>
                  )}
                </div>
              )}

              <div
                style={{
                  padding: articlePadding,
                  display: 'grid',
                  gap: isMobile ? '16px' : '18px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: isMobile ? '10px' : '12px',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '999px',
                      background: '#f1f5f9',
                      color: '#0f172a',
                      fontWeight: 600,
                      fontSize: '12px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {ticker.toUpperCase()}
                  </span>
                  <span style={{ fontSize: isMobile ? '12px' : '13px', color: '#64748b' }}>
                    Atualizado em {formataData(analiseSelecionada.updatedAt)}
                  </span>
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: isMobile ? 'clamp(20px, 6vw, 24px)' : '24px',
                      lineHeight: 1.3,
                      margin: 0,
                      color: '#0f172a',
                      fontWeight: 700,
                    }}
                  >
                    {analiseSelecionada.titulo}
                  </h3>
                  <p
                    style={{
                      margin: '12px 0 0 0',
                      color: '#475569',
                      fontSize: isMobile ? '15px' : '16px',
                      lineHeight: 1.6,
                    }}
                  >
                    {analiseSelecionada.resumo || fallbackResumo(analiseSelecionada.conteudo)}
                  </p>
                </div>

                <div
                  style={{
                    borderRadius: isMobile ? '12px' : '14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: accentBlockPadding,
                  }}
                >
                  <div
                    ref={contentRef}
                    style={{
                      display: expanded ? 'block' : '-webkit-box',
                      WebkitLineClamp: expanded ? 'none' : 6,
                      WebkitBoxOrient: 'vertical',
                      overflowY: expanded ? 'visible' : 'hidden',
                      overflowX: 'hidden',
                      color: '#1e293b',
                      lineHeight: 1.7,
                      fontSize: isMobile ? '14px' : '15px',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      maxWidth: '100%',
                      width: '100%',
                      paddingBottom: expanded ? '4px' : '0',
                    }}
                    dangerouslySetInnerHTML={{ __html: analiseSelecionada.conteudo }}
                  />

                  {analiseSelecionada.conteudo && analiseSelecionada.conteudo.length > 480 && (
                    <button
                      type="button"
                      onClick={() => setExpanded(prev => !prev)}
                      style={{
                        marginTop: '16px',
                        background: '#0f172a',
                        color: '#f8fafc',
                        border: 'none',
                        borderRadius: '999px',
                        padding: isMobile ? '10px 16px' : '10px 18px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: isMobile ? '12px' : '13px',
                        width: isMobile ? '100%' : 'auto',
                      }}
                    >
                      {expanded ? 'Mostrar menos' : 'Ver análise completa'}
                    </button>
                  )}
                </div>
              </div>
            </article>

            {analises.length > 1 && (
              <div
                style={{
                  display: 'grid',
                  gap: isMobile ? '14px' : '16px',
                  padding: supplementaryPadding,
                  borderRadius: isMobile ? '14px' : '16px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                }}
              >
                <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: '#1e293b' }}>
                  Outras leituras técnicas recentes
                </span>

                <div
                  style={{
                    display: 'grid',
                    gap: isMobile ? '10px' : '12px',
                    gridTemplateColumns: isMobile
                      ? '1fr'
                      : 'repeat(auto-fit, minmax(220px, 1fr))',
                  }}
                >
                  {analises.map(analise => (
                    <button
                      key={analise.id}
                      type="button"
                      onClick={() => {
                        setSelecionadaId(analise.id);
                        setExpanded(false);
                      }}
                      style={{
                        textAlign: 'left',
                        borderRadius: isMobile ? '12px' : '14px',
                        padding: isMobile ? '14px' : '16px',
                        border:
                          analiseSelecionada?.id === analise.id
                            ? '2px solid rgba(77, 251, 1, 0.6)'
                            : '1px solid transparent',
                        background:
                          analiseSelecionada?.id === analise.id ? '#ecfccb' : 'rgba(15, 23, 42, 0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        display: 'grid',
                        gap: isMobile ? '6px' : '8px',
                      }}
                    >
                      <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#64748b' }}>
                        {formataData(analise.updatedAt)}
                      </span>
                      <strong
                        style={{
                          fontSize: isMobile ? '14px' : '15px',
                          color: '#0f172a',
                          lineHeight: 1.4,
                        }}
                      >
                        {analise.titulo}
                      </strong>
                      <span style={{ fontSize: isMobile ? '12px' : '13px', color: '#475569' }}>
                        {analise.resumo || fallbackResumo(analise.conteudo, 120)}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: isMobile ? '11px' : '12px',
                          color: '#0f172a',
                          fontWeight: 600,
                        }}
                      >
                        Ler análise <ExternalLink size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
