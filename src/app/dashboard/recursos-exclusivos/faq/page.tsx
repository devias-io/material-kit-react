'use client';

import React, { useState, useEffect } from 'react';

// Tipos
interface FAQ {
  id: string;
  content: string;
  faqTitle: string | null;
  faqOrder: number;
  createdAt: string;
  question: {
    id: string;
    title: string;
    content: string;
    category: string;
    createdAt: string;
  };
  admin: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface FAQData {
  faqs: FAQ[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const categoryLabels = {
  'SMALL_CAPS': 'Small Caps',
  'MICRO_CAPS': 'Micro Caps',
  'DIVIDENDOS': 'Dividendos',
  'FIIS': 'Fundos Imobiliários',
  'INTERNACIONAL_ETFS': 'ETFs Internacionais',
  'INTERNACIONAL_STOCKS': 'Stocks Internacionais',
  'INTERNACIONAL_DIVIDENDOS': 'Dividendos Internacionais',
  'PROJETO_AMERICA': 'Projeto América',
  'GERAL': 'Geral',
  'TECNICO': 'Análise Técnica',
  'FISCAL': 'Questões Fiscais'
};

const getCategoryColor = (category: string) => {
  const colors = {
    'DIVIDENDOS': '#10b981',
    'FIIS': '#3b82f6',
    'SMALL_CAPS': '#6b7280',
    'MICRO_CAPS': '#6b7280',
    'INTERNACIONAL_ETFS': '#f59e0b',
    'INTERNACIONAL_STOCKS': '#3b82f6',
    'PROJETO_AMERICA': '#10b981',
    'GERAL': '#6b7280',
    'TECNICO': '#3b82f6',
    'FISCAL': '#f59e0b'
  };
  return colors[category] || '#6b7280';
};

export default function PublicFAQ() {
  const [faqData, setFaqData] = useState<FAQData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carregar FAQs
  const loadFAQs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(`/api/faq?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFaqData(data);
        setError('');
      } else {
        setError('Erro ao carregar FAQs');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFAQs();
  }, [searchTerm]);

  const handleAccordionChange = (panel: string) => (isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Obter todas as FAQs em uma lista única, ordenadas
  const getAllFAQs = () => {
    if (!faqData) return [];
    
    return faqData.faqs.sort((a, b) => {
      // Ordenar por faqOrder se disponível, senão por data de criação
      if (a.faqOrder !== b.faqOrder) {
        return a.faqOrder - b.faqOrder;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const allFAQs = getAllFAQs();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px'
      }}>
        <div style={{ fontSize: isMobile ? '32px' : '48px' }}>⏳</div>
        <p style={{ 
          color: '#64748b', 
          fontSize: isMobile ? '14px' : '16px', 
          textAlign: 'center' 
        }}>
          Carregando perguntas frequentes...
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      padding: isMobile ? '12px' : '24px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? '20px' : '32px' }}>
        <h1 style={{ 
          fontSize: isMobile ? '24px' : '48px', 
          fontWeight: '800', 
          color: '#1e293b',
          margin: '0 0 8px 0',
          lineHeight: '1.2'
        }}>
          Perguntas Frequentes
        </h1>
        <p style={{ 
          color: '#64748b', 
          fontSize: isMobile ? '14px' : '18px',
          margin: '0',
          lineHeight: '1.5'
        }}>
          Acesso exclusivo às respostas mais importantes sobre investimentos
        </p>
      </div>

      {/* Campo de busca */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        padding: isMobile ? '20px' : '32px',
        marginBottom: isMobile ? '20px' : '32px'
      }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite sua dúvida ou palavras-chave..."
            style={{
              width: '100%',
              padding: isMobile ? '12px 16px 12px 40px' : '16px 20px 16px 48px',
              fontSize: isMobile ? '14px' : '16px',
              border: '1px solid #d1d5db',
              borderRadius: isMobile ? '8px' : '12px',
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4bf700';
              e.target.style.boxShadow = '0 0 0 3px rgba(75, 247, 0, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
          <div style={{
            position: 'absolute',
            left: isMobile ? '12px' : '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b',
            fontSize: isMobile ? '16px' : '20px'
          }}>
            🔍
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: isMobile ? '8px' : '12px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: isMobile ? '20px' : '32px',
          color: '#991b1b'
        }}>
          {error}
        </div>
      )}

      {/* FAQ Content */}
      {!loading && faqData && (
        <div>
          {allFAQs.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: isMobile ? '12px' : '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              padding: isMobile ? '32px 20px' : '48px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: isMobile ? '32px' : '48px', marginBottom: '16px' }}>❓</div>
              <h3 style={{ 
                fontSize: isMobile ? '18px' : '24px', 
                fontWeight: '700', 
                color: '#1e293b', 
                margin: '0 0 8px 0' 
              }}>
                Nenhuma FAQ encontrada
              </h3>
              <p style={{ 
                color: '#64748b', 
                fontSize: isMobile ? '14px' : '16px', 
                margin: '0' 
              }}>
                {searchTerm 
                  ? 'Tente ajustar sua busca'
                  : 'Ainda não temos FAQs cadastradas. Volte em breve!'
                }
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: isMobile ? '16px' : '20px' }}>
              {allFAQs.map((faq, index) => (
                <div 
                  key={faq.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: isMobile ? '8px' : '12px',
                    backgroundColor: '#f8fafc',
                    overflow: 'hidden'
                  }}
                >
                  {/* Header da FAQ */}
                  <div 
                    style={{
                      padding: isMobile ? '16px' : '24px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      backgroundColor: '#ffffff'
                    }}
                    onClick={() => handleAccordionChange(faq.id)(!expandedAccordion || expandedAccordion !== faq.id)}
                    onMouseEnter={(e) => !isMobile && (e.currentTarget.style.backgroundColor = '#f9fafb')}
                    onMouseLeave={(e) => !isMobile && (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'start', 
                      marginBottom: '12px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div style={{ flex: 1, minWidth: isMobile ? '200px' : 'auto' }}>
                        <h4 style={{ 
                          fontSize: isMobile ? '16px' : '18px', 
                          fontWeight: '600', 
                          color: '#1e293b', 
                          margin: '0 0 8px 0',
                          lineHeight: '1.3'
                        }}>
                          {faq.faqTitle || faq.question.title}
                        </h4>
                      </div>
                      
                      <div style={{
                        width: isMobile ? '20px' : '24px',
                        height: isMobile ? '20px' : '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.2s ease',
                        transform: expandedAccordion === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                      onMouseEnter={(e) => !isMobile && (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                      onMouseLeave={(e) => !isMobile && (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      >
                        <svg 
                          width={isMobile ? '12' : '14'} 
                          height={isMobile ? '8' : '10'} 
                          viewBox="0 0 12 8" 
                          fill="none"
                        >
                          <path 
                            d="M1 1L6 6L11 1" 
                            stroke="#64748b" 
                            strokeWidth="1.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>

                    {searchTerm && (
                      <p style={{ 
                        fontSize: isMobile ? '13px' : '14px', 
                        color: '#64748b', 
                        margin: '0',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.4'
                      }}>
                        {faq.question.content}
                      </p>
                    )}
                  </div>

                  {/* Conteúdo expandido */}
                  {expandedAccordion === faq.id && (
                    <div style={{
                      borderTop: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      padding: isMobile ? '20px' : '32px'
                    }}>
                      {/* Resposta */}
                      <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
                        <div style={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: isMobile ? '8px' : '12px',
                          padding: isMobile ? '16px' : '24px'
                        }}>
                          <p style={{
                            fontSize: isMobile ? '13px' : '14px',
                            color: '#1e293b',
                            margin: '0',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {faq.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: isMobile ? '32px' : '48px', 
        paddingTop: isMobile ? '24px' : '32px' 
      }}>
        <p style={{ 
          color: '#64748b', 
          fontSize: isMobile ? '13px' : '14px', 
          margin: '0' 
        }}>
          Não encontrou sua dúvida? Envie uma nova pergunta na Central de Dúvidas.
        </p>
      </div>
    </div>
  );
}