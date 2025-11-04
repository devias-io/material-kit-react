'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import type { User } from '@/types/user';
import { formatTextWithLinks } from '@/utils/formatTextWithLinks';

// Tipos
interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
}

interface Question {
  id: string;
  title: string;
  content: string;
  status: 'NOVA' | 'RESPONDIDA' | 'FECHADA';
  createdAt: string;
  answers: Answer[];
  comments: Comment[];
  readByAdmin: boolean;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    plan?: User['plan'] | null;
  };
}

interface Answer {
  id: string;
  content: string;
  createdAt: string;
  admin: {
    firstName: string;
    lastName: string;
  };
  readByUser: boolean;
  comments: Comment[];
}

const statusLabels: Record<Question['status'], string> = {
  'NOVA': 'Aguardando Resposta',
  'RESPONDIDA': 'Respondida',
  'FECHADA': 'Respondida'
};

const planLabels: Record<NonNullable<User['plan']>, string> = {
  VIP: 'Close Friends VIP',
  LITE: 'Close Friends LITE',
  LITE_V2: 'Close Friends LITE 2.0',
  RENDA_PASSIVA: 'Projeto Renda Passiva',
  FIIS: 'Projeto FIIs',
  AMERICA: 'Projeto América',
  ADMIN: 'Administrador'
};

export default function CentralDuvidas() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const { user: currentUser } = useUser();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carregar perguntas reais da API
  const loadQuestions = async (page = currentPage) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/questions?page=${page}&limit=${limit}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setCurrentPage(data.pagination.page);
        setTotal(data.pagination.total);
        setError('');
      } else {
        setError('Erro ao carregar dúvidas. Tente novamente.');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions(1);
  }, []);

  // Criar nova pergunta
  const handleSubmitQuestion = async () => {
    if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
      setError('Título e conteúdo são obrigatórios');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newQuestion.title, content: newQuestion.content })
      });

      if (response.ok) {
        setSuccess('Dúvida enviada com sucesso! Você receberá uma resposta em breve.');
        setOpenDialog(false);
        setNewQuestion({ title: '', content: '' });
        loadQuestions(1);
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao enviar dúvida');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setSubmitting(false);
    }
  };

  // Fechar dúvida
  const handleCloseQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'FECHADA' })
      });

      if (response.ok) {
        setSuccess('Dúvida marcada como resolvida!');
        loadQuestions(currentPage);
      }
    } catch (err) {
      setError('Erro ao fechar dúvida');
    }
  };

  const handleCommentChange = (key: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmitComment = async (
    questionId: string,
    key: string,
    answerId?: string
  ) => {
    const content = commentInputs[key];
    if (!content || !content.trim()) {
      setError('Comentário vazio');
      return;
    }

    try {
      const response = await fetch(`/api/questions/${questionId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, answerId })
      });

      if (response.ok) {
        handleCommentChange(key, '');
        loadQuestions();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao enviar comentário');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateRelative = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora há pouco';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    if (diffInHours < 48) return 'Ontem';
    return formatDate(dateString);
  };

  const hasUnreadAnswers = (question: Question) => {
    return question.answers.some(answer => !answer.readByUser);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOVA':
        return '⏳';
      case 'RESPONDIDA':
        return '✓';
      case 'FECHADA':
        return '✓';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOVA':
        return '#10b981';
      case 'RESPONDIDA':
        return '#10b981';
      case 'FECHADA':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getQuestionUserName = (user?: Question['user']) => {
    if (!user) {
      return '';
    }

    const parts = [user.firstName?.trim(), user.lastName?.trim()].filter(Boolean) as string[];
    return parts.join(' ').trim();
  };

  const getQuestionUserPlanLabel = (user?: Question['user']) => {
    if (!user?.plan) {
      return '';
    }

    return planLabels[user.plan] ?? user.plan;
  };

  const handleAccordionChange = (questionId: string) => (isExpanded: boolean) => {
    setExpandedQuestion(isExpanded ? questionId : null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '16px'
        }}>
          Carregando suas dúvidas...
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa', 
      padding: isMobile ? '16px' : '32px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? '32px' : '48px', maxWidth: '1200px', margin: '0 auto 32px auto' }}>
        <h1 style={{ 
          fontSize: isMobile ? '28px' : '42px', 
          fontWeight: '700', 
          color: '#111827',
          margin: '0 0 12px 0',
          lineHeight: '1.1',
          letterSpacing: '-0.025em'
        }}>
          Central de Dúvidas
        </h1>
        <p style={{ 
          color: '#6b7280', 
          fontSize: isMobile ? '16px' : '18px',
          margin: '0',
          lineHeight: '1.6',
          fontWeight: '400'
        }}>
          Tire suas dúvidas sobre investimentos e receba respostas dos nossos especialistas
        </p>
      </div>

      {/* Container principal */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Alertas */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            color: '#991b1b',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{error}</span>
              <button 
                onClick={() => setError('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#991b1b',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            color: '#166534',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{success}</span>
              <button 
                onClick={() => setSuccess('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#166534',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Perguntas frequentes:
            </span>
            <button
              onClick={() => window.location.href = '/dashboard/recursos-exclusivos/faq'}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e5e7eb';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
             FAQ
            </button>
          </div>
          
          <button
            onClick={() => setOpenDialog(true)}
            style={{
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#374151'}
          >
            Nova Pergunta
          </button>
        </div>

        {/* Lista de dúvidas */}
        {questions.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '500',
              color: '#374151',
              margin: '0 0 8px 0'
            }}>
              {currentPage === 1 ? 'Nenhuma dúvida ainda' : 'Nenhuma dúvida nesta página'}
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              margin: '0'
            }}>
              {currentPage === 1
                ? 'Faça sua primeira pergunta para nossos especialistas'
                : 'Tente navegar para outra página ou crie uma nova pergunta'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {questions.map((question) => {
              const questionUserName = getQuestionUserName(question.user);
              const questionUserPlan = getQuestionUserPlanLabel(question.user);
              const canMarkAsResolved = currentUser?.plan === 'ADMIN' && currentUser?.id !== question.user.id;

              return (
                <div
                  key={question.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden'
                  }}
                >
                {/* Header da pergunta */}
                <div 
                  style={{
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s'
                  }}
                  onClick={() => handleAccordionChange(question.id)(!expandedQuestion || expandedQuestion !== question.id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: '500', 
                      color: '#1f2937', 
                      margin: '0',
                      flex: 1
                    }}>
                      {question.title}
                    </h4>
                    
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#6b7280',
                      marginLeft: '16px',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatDate(question.createdAt)}
                    </div>
                    
                    <div style={{
                      marginLeft: '16px',
                      cursor: 'pointer',
                      transform: expandedQuestion === question.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path 
                          d="M4 6L8 10L12 6" 
                          stroke="#6b7280" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: getStatusColor(question.status),
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      <span>{getStatusIcon(question.status)}</span>
                      {statusLabels[question.status]}
                    </div>
                    
                    {hasUnreadAnswers(question) && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Nova Resposta
                      </div>
                    )}
                    
                    {questionUserName && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#6b7280',
                        fontSize: '13px'
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92178 15.4214 5.17163 16.1716C4.42149 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>
                          {questionUserName}
                          {questionUserPlan ? ` (${questionUserPlan})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conteúdo expandido */}
                {expandedQuestion === question.id && (
                  <div style={{ 
                    borderTop: '1px solid #f3f4f6',
                    backgroundColor: '#f9fafb'
                  }}>
                    {/* Pergunta completa */}
                    <div style={{ padding: '24px' }}>
                      <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '24px'
                      }}>
                        <h5 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                          margin: '0 0 12px 0',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Pergunta
                        </h5>
                        <p
                          style={{
                            fontSize: '15px',
                            color: '#374151',
                            margin: '0',
                            lineHeight: '1.6',
                          }}
                        >
                          {formatTextWithLinks(question.content, {
                            linkProps: {
                              style: {
                                color: '#2563eb',
                                textDecoration: 'underline',
                                wordBreak: 'break-word',
                              },
                            },
                          })}
                        </p>
                      </div>

                      {/* Comentários da pergunta */}
                      {question.comments.length > 0 && (
                        <div style={{
                          marginTop: '16px',
                          paddingLeft: '16px',
                          borderLeft: '2px solid #e5e7eb',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          {question.comments.map((comment) => (
                            <div key={comment.id} style={{ fontSize: '14px', color: '#374151' }}>
                              <strong>{comment.author.firstName} {comment.author.lastName}:</strong> {comment.content}
                            </div>
                          ))}
                        </div>
                      )}

                      {currentUser?.id !== question.user.id && (
                        <div style={{ marginTop: '12px' }}>
                          <textarea
                            value={commentInputs[`question-${question.id}`] || ''}
                            onChange={(e) => handleCommentChange(`question-${question.id}`, e.target.value)}
                            placeholder="Adicione um comentário"
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              resize: 'vertical',
                              fontFamily: 'inherit',
                              fontSize: '14px'
                            }}
                          />
                          <button
                            onClick={() => handleSubmitComment(question.id, `question-${question.id}`)}
                            style={{
                              marginTop: '8px',
                              backgroundColor: '#374151',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            Comentar
                          </button>
                        </div>
                      )}

                      {/* Respostas */}
                      {question.answers.length > 0 && (
                        <div>
                          <h5 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#6b7280',
                            margin: '0 0 16px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {question.answers.length === 1 ? 'Resposta' : `Respostas (${question.answers.length})`}
                          </h5>
                          
                          <div style={{ display: 'grid', gap: '16px' }}>
                            {question.answers.map((answer) => (
                              <div key={answer.id} style={{ 
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                padding: '20px',
                                border: !answer.readByUser ? '2px solid #f3f4f6' : '1px solid #e5e7eb'
                              }}>
                                {/* Header da resposta */}
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '16px',
                                  paddingBottom: '12px',
                                  borderBottom: '1px solid #f3f4f6'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92178 15.4214 5.17163 16.1716C4.42149 16.9217 4 17.9391 4 19V21" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <circle cx="12" cy="7" r="4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span style={{
                                      fontSize: '14px',
                                      fontWeight: '500',
                                      color: '#374151'
                                    }}>
                                      Fatos da Bolsa (Administrador)
                                    </span>
                                  </div>
                                  <span style={{
                                    fontSize: '12px',
                                    color: '#6b7280'
                                  }}>
                                    {formatDate(answer.createdAt)}
                                  </span>
                                </div>
                                
                                {/* Conteúdo da resposta */}
                                <div
                                  style={{
                                    fontSize: '15px',
                                    color: '#374151',
                                    lineHeight: '1.6',
                                  }}
                                >
                                  {formatTextWithLinks(answer.content, {
                                    linkProps: {
                                      style: {
                                        color: '#2563eb',
                                        textDecoration: 'underline',
                                        wordBreak: 'break-word',
                                      },
                                    },
                                  })}
                                </div>

                                {answer.comments.length > 0 && (
                                  <div style={{
                                    marginTop: '16px',
                                    paddingLeft: '16px',
                                    borderLeft: '2px solid #e5e7eb',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                  }}>
                                    {answer.comments.map((comment) => (
                                      <div key={comment.id} style={{ fontSize: '14px', color: '#374151' }}>
                                        <strong>{comment.author.firstName} {comment.author.lastName}:</strong> {comment.content}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {currentUser?.id !== question.user.id && (
                                  <div style={{ marginTop: '12px' }}>
                                    <textarea
                                      value={commentInputs[`answer-${answer.id}`] || ''}
                                      onChange={(e) => handleCommentChange(`answer-${answer.id}`, e.target.value)}
                                      placeholder="Adicione um comentário"
                                      rows={3}
                                      style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        fontSize: '14px'
                                      }}
                                    />
                                    <button
                                      onClick={() => handleSubmitComment(question.id, `answer-${answer.id}`, answer.id)}
                                      style={{
                                        marginTop: '8px',
                                        backgroundColor: '#374151',
                                        color: 'white',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Comentar
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ações */}
                      <div style={{
                        marginTop: '24px',
                        paddingTop: '20px',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}>
                        {canMarkAsResolved && question.status !== 'FECHADA' && question.answers.length > 0 && (
                          <button
                            onClick={() => handleCloseQuestion(question.id)}
                            style={{
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                          >
                            Marcar como Resolvida
                          </button>
                        )}
                        
                        {question.status === 'NOVA' && (
                          <div style={{
                            color: '#6b7280',
                            fontSize: '13px'
                          }}>
                            Aguardando análise dos especialistas...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}

        {/* Paginação */}
        {total > limit && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '24px'
          }}>
            <button
              onClick={() => currentPage > 1 && loadQuestions(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Anterior
            </button>

            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              Página {currentPage} de {Math.ceil(total / limit)}
            </span>

            <button
              onClick={() => currentPage < Math.ceil(total / limit) && loadQuestions(currentPage + 1)}
              disabled={currentPage >= Math.ceil(total / limit)}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: currentPage >= Math.ceil(total / limit) ? 'not-allowed' : 'pointer'
              }}
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* Modal nova pergunta */}
      {openDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Header do modal */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0'
              }}>
                Nova Dúvida
              </h2>
              <button
                onClick={() => setOpenDialog(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {/* Conteúdo do modal */}
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Título da dúvida
                </label>
                <input
                  type="text"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                  placeholder="Descreva sua dúvida de forma objetiva"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Descrição detalhada
                </label>
                <textarea
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                  placeholder="Detalhe sua dúvida. Quanto mais específica, melhor será nossa resposta."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Botões */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setOpenDialog(false)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitQuestion}
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: submitting ? '#9ca3af' : '#374151',
                    color: 'white',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {submitting ? 'Enviando...' : 'Enviar Dúvida'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
