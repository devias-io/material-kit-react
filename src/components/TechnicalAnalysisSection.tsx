'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, ShieldAlert } from 'lucide-react';

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
};

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

const TECHNICAL_ANALYSIS_DISCLOSURE_BASE =
  [
    'A análise apresentada foi elaborada pelo analista de valores mobiliários autônomo Marcos Schilling Machado (CNPI nº 7521), nos termos da Resolução CVM Nº20/2021.',
    'De acordo com a exigência regulatória do artigo 21 previsto na Resolução CVM nº 20, de 25 de fevereiro de 2021, o analista de valores mobiliários, responsável principal por este relatório, declara: (i) que as recomendações contidas neste relatório refletem única e exclusivamente sua opinião pessoal sobre a companhia analisada e seus valores mobiliários e foram elaborados de forma independente e autônoma; (ii) que as informações, opiniões, estimativas e projeções contidas neste documento referem-se à data presente e estão sujeitas a mudanças, não implicando necessariamente na obrigação de qualquer comunicação no sentido de atualização ou revisão com respeito a tal mudança.',
    'O material produzido é baseado em informações públicas, consideradas fidedignas na data de sua publicação, portanto as estimativas, opiniões e recomendações estão sujeitas a mudanças sem aviso prévio.',
    'O conteúdo do relatório não pode ser reproduzido ou distribuído, do todo ou em parte dos relatórios, a terceiros, sem prévia e expressa autorização sob nenhuma forma, no todo ou em parte, sob pena da adoção de medidas cíveis e criminais, incluindo a obrigação de reparação de todas as perdas e danos causados, nos termos da Lei nº 9.610/98 e de outras aplicáveis.',
    'Os relatórios disponibilizados aos seguidores e/ou assinantes da @fatosdabolsa não representam ofertas, negociação de valores mobiliários ou de outros instrumentos financeiros.',
    'As opiniões e recomendações dos analistas não implicam em quaisquer concessões de crédito e/ou promessa de rendimentos aos clientes.',
    'A Fatos da Bolsa e os analistas signatários não podem garantir que os investidores obterão lucros.',
    'Além disso, a Fatos da Bolsa e os analistas não compartilharão quaisquer ganhos de investimento com os investidores, nem assumirão qualquer responsabilidade por perdas incorridas.',
    'Investimentos envolvem riscos e os investidores devem ser prudentes ao tomar suas decisões de investimento.',
    'A Fatos da Bolsa e os analistas signatários não possuem obrigações fiduciárias para com os destinatários deste relatório e, ao divulgá-lo, não estão agindo como um fiduciário.',
    'As decisões de investimentos e estratégias financeiras devem ser realizadas pelos próprios leitores, não sendo de responsabilidade dos analistas eventuais perdas que as recomendações possam gerar aos clientes.',
    'Mais informações podem ser obtidas na Resolução CVM nº 20/2021, e no Código de Conduta da APIMEC para o Analista de Valores Mobiliários.'
  ].join(' ');

const formatFontes = (fonte?: string | null) => {
  if (!fonte) {
    return 'Fontes: "de acordo com o relatório".';
  }

  const fontesNormalizadas = fonte
    .split(/\r?\n|;|\|/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join('; ');

  if (!fontesNormalizadas) {
    return 'Fontes: "de acordo com o relatório".';
  }

  return `Fontes: ${fontesNormalizadas.replace(/[.;\s]+$/, '')}.`;
};

const formataData = (dataISO: string) => {
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
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

export default function TechnicalAnalysisSection({
  ticker
}: TechnicalAnalysisSectionProps) {
  const [analises, setAnalises] = useState<AnaliseTecnica[]>([]);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [expanded, setExpanded] = useState<boolean>(false);
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isMobile = useMediaQuery('(max-width: 640px)');

  const carregarAnalises = useCallback(async () => {
    if (!ticker) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        ticker,
        publicado: 'true',
        limit: '5'
      });
      const response = await fetch(
        `/api/analises-tecnicas?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `Falha ao carregar análises técnicas (${response.status})`
        );
      }

      const data = await response.json();
      const lista: AnaliseTecnica[] = Array.isArray(data?.analises)
        ? data.analises
        : [];

      setAnalises(lista);
      setSelecionadaId(lista[0]?.id ?? null);
      setExpanded(false);
    } catch (err) {
      console.error('Erro ao carregar análises técnicas:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar a análise técnica.'
      );
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

    return (
      analises.find((item) => item.id === selecionadaId) ?? analises[0] ?? null
    );
  }, [analises, selecionadaId]);

  const conteudoLength = analiseSelecionada?.conteudo?.length ?? 0;

  const disclosureText = useMemo<string | null>(() => {
    if (!analiseSelecionada) {
      return null;
    }

    const dataElaboracao = analiseSelecionada.createdAt
      ? formataData(analiseSelecionada.createdAt)
      : '';

    if (dataElaboracao) {
      return `${TECHNICAL_ANALYSIS_DISCLOSURE_BASE} ${formatFontes(analiseSelecionada.fonte)} Data de elaboração do relatório de análise: ${dataElaboracao}.`;
    }

    return `${TECHNICAL_ANALYSIS_DISCLOSURE_BASE} ${formatFontes(analiseSelecionada.fonte)} Data de elaboração do relatório de análise: será a data que a análise foi postada.`;
  }, [analiseSelecionada]);

  const containerPadding = isMobile
    ? '20px 16px'
    : isTablet
      ? '24px 24px'
      : '28px 32px';
  
  const contentPadding = isMobile
    ? '10px 16px 20px'
    : isTablet
      ? '14px 24px 24px'
      : '12px 32px 28px';
  const articlePadding = isMobile ? '18px' : isTablet ? '22px' : '24px';
  const accentBlockPadding = isMobile ? '16px' : '20px';
  const supplementaryPadding = isMobile ? '18px' : '20px';

  if (!ticker) {
    return null;
  }

  return (
    <>
      <section
        style={{
          margin: isMobile ? '16px 0 24px' : '24px 0 32px',
          width: '100%',
          borderRadius: isMobile ? '16px' : '18px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Header sempre visível */}
        <header
          style={{
            padding: containerPadding,
            background: '#ffffff',
            boxSizing: 'border-box'
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: isMobile ? 'clamp(18px, 5vw, 22px)' : '20px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: '#0f172a'
            }}
          >
            Análise Técnica {ticker.toUpperCase()}
          </h2>
        </header>

        {/* Conteúdo dinâmico baseado no estado */}
        <div
          style={{
            padding: contentPadding,
            display: 'grid',
            gap: isMobile ? '18px' : '24px',
            boxSizing: 'border-box'
          }}
        >
          {loading ? (
            <div style={{ display: 'grid', gap: '18px' }}>
              <div
                style={{
                  height: isMobile ? '180px' : '220px',
                  borderRadius: '16px',
                  background:
                    'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%)',
                  backgroundSize: '400% 100%',
                  animation: 'pulse 1.6s ease infinite'
                }}
              />
              <div
                style={{
                  height: '18px',
                  width: isMobile ? '160px' : '220px',
                  borderRadius: '6px',
                  background: '#e2e8f0'
                }}
              />
              <div
                style={{
                  height: '14px',
                  width: isMobile ? '220px' : '320px',
                  borderRadius: '6px',
                  background: '#e2e8f0'
                }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    flex: 1,
                    height: '12px',
                    background: '#e2e8f0',
                    borderRadius: '6px'
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: '12px',
                    background: '#e2e8f0',
                    borderRadius: '6px'
                  }}
                />
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
                color: '#b91c1c'
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <ShieldAlert size={20} />
                <strong>Não foi possível carregar a análise técnica</strong>
              </div>
              <span>{error}</span>
            </div>
          ) : !analiseSelecionada ? (
            <div
              style={{
                padding: isMobile ? '24px' : '32px',
                border: '2px dashed #cbd5e1',
                borderRadius: isMobile ? '14px' : '16px',
                background: '#f8fafc',
                textAlign: 'center',
                color: '#475569'
              }}
            >
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}
              >
                Nenhuma análise técnica publicada para este ativo ainda
              </p>
              <p style={{ margin: 0, fontSize: '14px' }}>
                As análises cadastradas pelo time aparecem automaticamente aqui.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: isMobile ? '20px' : '24px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <article
                style={{
                  borderRadius: isMobile ? '14px' : '16px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {analiseSelecionada.imagemCapa && (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={analiseSelecionada.imagemCapa}
                      alt={`Imagem ilustrativa da análise técnica ${analiseSelecionada.titulo}`}
                      style={{
                        display: 'block',
                        width: '100%',
                        maxHeight: isMobile
                          ? '220px'
                          : isTablet
                            ? '300px'
                            : '360px',
                        objectFit: 'cover'
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
                          letterSpacing: '0.08em'
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
                    boxSizing: 'border-box'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: isMobile ? '10px' : '12px',
                      alignItems: 'center'
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
                        textTransform: 'uppercase'
                      }}
                    >
                      {ticker.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontSize: isMobile ? '12px' : '13px',
                        color: '#64748b'
                      }}
                    >
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
                        fontWeight: 700
                      }}
                    >
                      {analiseSelecionada.titulo}
                    </h3>
                    <p
                      style={{
                        margin: '12px 0 0 0',
                        color: '#475569',
                        fontSize: isMobile ? '15px' : '16px',
                        lineHeight: 1.6
                      }}
                    >
                      {analiseSelecionada.resumo ||
                        fallbackResumo(analiseSelecionada.conteudo)}
                    </p>
                  </div>

                  {analiseSelecionada.conteudo && conteudoLength > 480 && (
                      <button
                        type="button"
                        onClick={() => setExpanded((prev) => !prev)}
                        style={{
                          background: '#0f172a',
                          color: '#f8fafc',
                          border: 'none',
                          borderRadius: '999px',
                          padding: isMobile ? '10px 16px' : '10px 18px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: isMobile ? '12px' : '13px',
                          width: isMobile ? '100%' : 'auto',
                          marginTop: isMobile ? '12px' : '14px'
                        }}
                        aria-expanded={expanded}
                      >
                        {expanded ? 'Mostrar menos' : 'Mostrar mais'}
                      </button>
                    )}

                  {analiseSelecionada.conteudo &&
                    (expanded || conteudoLength <= 480) && (
                      <div
                        style={{
                          borderRadius: isMobile ? '12px' : '14px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: accentBlockPadding,
                          boxSizing: 'border-box',
                          display: 'grid',
                          gap: isMobile ? '14px' : '16px',
                          width: '100%',
                          alignSelf: 'stretch',
                          justifySelf: 'stretch'
                        }}
                      >
                        <div
                          className="technical-analysis-content"
                          style={{
                            color: '#1e293b',
                            lineHeight: 1.7,
                            fontSize: isMobile ? '14px' : '15px',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            maxWidth: '100%',
                            width: '100%'
                          }}
                          dangerouslySetInnerHTML={{
                            __html: analiseSelecionada.conteudo
                          }}
                        />

                        {disclosureText && (expanded || conteudoLength <= 480) && (
                          <div
                            style={{
                              padding: isMobile ? '12px' : '16px',
                              borderRadius: isMobile ? '12px' : '14px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              color: '#0f172a',
                              fontSize: isMobile ? '12px' : '13px',
                              lineHeight: 1.6,
                              display: 'grid',
                              gap: isMobile ? '10px' : '12px',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <span
                              style={{
                                fontSize: isMobile ? '12px' : '13px',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: '#0f172a'
                              }}
                            >
                              Disclosure
                            </span>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                              {disclosureText}
                            </p>
                          </div>
                        )}

                        {expanded && conteudoLength > 480 && (
                          <button
                            type="button"
                            onClick={() => setExpanded(false)}
                            style={{
                              background: '#0f172a',
                              color: '#f8fafc',
                              border: 'none',
                              borderRadius: '999px',
                              padding: isMobile ? '10px 16px' : '10px 18px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: isMobile ? '12px' : '13px',
                              width: isMobile ? '100%' : 'auto',
                              justifySelf: isMobile ? 'stretch' : 'start'
                            }}
                            aria-expanded={expanded}
                          >
                            Mostrar menos
                          </button>
                        )}
                      </div>
                    )}
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
                    boxSizing: 'border-box'
                  }}
                >
                  <span
                    style={{
                      fontSize: isMobile ? '13px' : '14px',
                      fontWeight: 600,
                      color: '#1e293b'
                    }}
                  >
                    Outras leituras técnicas recentes
                  </span>

                  <div
                    style={{
                      display: 'grid',
                      gap: isMobile ? '10px' : '12px',
                      gridTemplateColumns: isMobile
                        ? '1fr'
                        : 'repeat(auto-fit, minmax(220px, 1fr))'
                    }}
                  >
                    {analises.map((analise) => (
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
                            analiseSelecionada?.id === analise.id
                              ? '#ecfccb'
                              : 'rgba(15, 23, 42, 0.04)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          display: 'grid',
                          gap: isMobile ? '6px' : '8px'
                        }}
                      >
                        <span
                          style={{
                            fontSize: isMobile ? '11px' : '12px',
                            color: '#64748b'
                          }}
                        >
                          {formataData(analise.updatedAt)}
                        </span>
                        <strong
                          style={{
                            fontSize: isMobile ? '14px' : '15px',
                            color: '#0f172a',
                            lineHeight: 1.4
                          }}
                        >
                          {analise.titulo}
                        </strong>
                        <span
                          style={{
                            fontSize: isMobile ? '12px' : '13px',
                            color: '#475569'
                          }}
                        >
                          {analise.resumo ||
                            fallbackResumo(analise.conteudo, 120)}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: isMobile ? '11px' : '12px',
                            color: '#0f172a',
                            fontWeight: 600
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
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .technical-analysis-content {
          width: 100%;
          max-width: 100%;
          overflow-wrap: anywhere;
        }

        .technical-analysis-content > * {
          max-width: 100% !important;
          width: 100% !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        .technical-analysis-content * {
          box-sizing: border-box;
          max-width: 100% !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        .technical-analysis-content p {
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .technical-analysis-content img,
        .technical-analysis-content video,
        .technical-analysis-content canvas,
        .technical-analysis-content svg {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          display: block;
          margin: 16px auto;
          border-radius: 12px;
        }

        .technical-analysis-content figure {
          width: 100% !important;
          max-width: 100% !important;
          margin: 16px auto;
        }

        .technical-analysis-content iframe {
          width: 100% !important;
          max-width: 100% !important;
          border: none;
          border-radius: 12px;
          min-height: 320px;
          display: block;
          margin: 16px auto;
        }

        .technical-analysis-content table {
          width: 100% !important;
          max-width: 100% !important;
          border-collapse: collapse;
          display: block;
          overflow-x: auto;
          border-radius: 12px;
          background: #ffffff;
          margin: 16px 0;
          padding: 0 12px;
          -webkit-overflow-scrolling: touch;
        }

        .technical-analysis-content table th,
        .technical-analysis-content table td {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          text-align: left;
          font-size: 0.95em;
        }

        .technical-analysis-content pre,
        .technical-analysis-content code {
          white-space: pre-wrap;
          word-break: break-word;
          overflow-x: auto;
        }

        .technical-analysis-content blockquote {
          border-left: 4px solid #0f172a;
          padding-left: 16px;
          margin: 16px 0;
          background: rgba(15, 23, 42, 0.04);
          color: #0f172a;
        }

        .technical-analysis-content ul,
        .technical-analysis-content ol {
          padding-left: 20px;
        }

        .technical-analysis-content a {
          color: #0f172a;
          text-decoration: underline;
          word-break: break-word;
        }

        .technical-analysis-content figcaption {
          margin-top: 8px;
          font-size: 0.9em;
          color: #475569;
          text-align: center;
        }

        @media (max-width: 640px) {
          .technical-analysis-content img,
          .technical-analysis-content video,
          .technical-analysis-content canvas,
          .technical-analysis-content svg {
            margin: 12px auto;
            border-radius: 10px;
          }

          .technical-analysis-content iframe {
            min-height: 220px;
            margin: 12px auto;
          }

          .technical-analysis-content table {
            border-radius: 10px;
            padding: 0 8px;
            margin: 12px 0;
          }
        }
      `}</style>
    </>
  );
}
