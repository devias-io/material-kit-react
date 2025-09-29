'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/hooks/use-user';
import styles from './central-duvidas.module.css';

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
  user: { id: string };
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
  NOVA: 'Aguardando resposta',
  RESPONDIDA: 'Respondida',
  FECHADA: 'Fechada',
};

type StatusFilter = 'ALL' | Question['status'];
type SortOption = 'RECENT' | 'OLDER';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'RECENT', label: 'Mais recentes primeiro' },
  { value: 'OLDER', label: 'Mais antigas primeiro' },
];

export default function CentralDuvidas() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('RECENT');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const { user: currentUser } = useUser();

  useEffect(() => {
    loadQuestions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuestions = async (page = currentPage) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/questions?page=${page}&limit=${limit}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newQuestion.title, content: newQuestion.content }),
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

  const handleCloseQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'FECHADA' }),
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
    setCommentInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitComment = async (questionId: string, key: string, answerId?: string) => {
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, answerId }),
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
      minute: '2-digit',
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
    return question.answers.some((answer) => !answer.readByUser);
  };

  const statusCounts = useMemo(
    () =>
      questions.reduce(
        (acc, question) => {
          acc.total += 1;
          acc[question.status] += 1;
          return acc;
        },
        { total: 0, NOVA: 0, RESPONDIDA: 0, FECHADA: 0 }
      ),
    [questions]
  );

  const filteredQuestions = useMemo(() => {
    let data = [...questions];

    if (statusFilter !== 'ALL') {
      data = data.filter((question) => question.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      data = data.filter(
        (question) =>
          question.title.toLowerCase().includes(query) ||
          question.content.toLowerCase().includes(query)
      );
    }

    return data.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (sortOption === 'RECENT') {
        return dateB - dateA;
      }

      return dateA - dateB;
    });
  }, [questions, statusFilter, searchTerm, sortOption]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getStatusBadgeClass = (status: Question['status']) => {
    switch (status) {
      case 'NOVA':
        return styles.statusNew;
      case 'RESPONDIDA':
        return styles.statusAnswered;
      case 'FECHADA':
        return styles.statusClosed;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <p>Carregando suas dúvidas...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>Central de Dúvidas</h1>
            <p className={styles.headerSubtitle}>
              Visualize perguntas, organize respostas e mantenha toda a equipe alinhada.
            </p>
          </div>
          <button type="button" className={styles.primaryButton} onClick={() => setOpenDialog(true)}>
            Nova pergunta
          </button>
        </header>

        <div className={styles.quickLinks}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => (window.location.href = '/dashboard/recursos-exclusivos/faq')}
          >
            <span className={styles.linkIcon}>?</span>
            Central de FAQ
          </button>
        </div>

        <section className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Total</span>
            <strong className={styles.summaryValue}>{total || statusCounts.total}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Novas</span>
            <strong className={styles.summaryValue}>{statusCounts.NOVA}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Respondidas</span>
            <strong className={styles.summaryValue}>{statusCounts.RESPONDIDA}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Fechadas</span>
            <strong className={styles.summaryValue}>{statusCounts.FECHADA}</strong>
          </div>
        </section>

        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Fechar alerta">
              ×
            </button>
          </div>
        )}

        {success && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess('')} aria-label="Fechar alerta">
              ×
            </button>
          </div>
        )}

        <div className={styles.filtersCard}>
          <div className={styles.filterTabs}>
            {(
              [
                { value: 'ALL' as StatusFilter, label: `Todos (${statusCounts.total})` },
                { value: 'NOVA' as StatusFilter, label: `Novos (${statusCounts.NOVA})` },
                { value: 'RESPONDIDA' as StatusFilter, label: `Respondidos (${statusCounts.RESPONDIDA})` },
                { value: 'FECHADA' as StatusFilter, label: `Fechados (${statusCounts.FECHADA})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`${styles.tabButton} ${statusFilter === tab.value ? styles.tabButtonActive : ''}`}
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.filterControls}>
            <div className={styles.searchBox}>
              <input
                type="search"
                placeholder="Buscar por título ou conteúdo"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <select
              className={styles.select}
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as SortOption)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className={styles.listSection}>
          {filteredQuestions.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>
                {questions.length === 0
                  ? 'Nenhuma dúvida encontrada'
                  : 'Nenhum resultado para os filtros atuais'}
              </h3>
              <p>
                Ajuste os filtros ou registre uma nova pergunta para começar a conversa com nossos especialistas.
              </p>
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <article key={question.id} className={styles.questionCard}>
                <header className={styles.questionHeader}>
                  <div className={styles.questionHeading}>
                    <button
                      type="button"
                      className={styles.expandButton}
                      onClick={() =>
                        setExpandedQuestion((current) => (current === question.id ? null : question.id))
                      }
                      aria-expanded={expandedQuestion === question.id}
                    >
                      <span className={styles.expandIcon} aria-hidden="true" />
                      <span className={styles.questionTitle}>{question.title}</span>
                    </button>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(question.status)}`}>
                      {statusLabels[question.status]}
                    </span>
                  </div>
                  <div className={styles.questionMeta}>
                    <span>{formatDateRelative(question.createdAt)}</span>
                    <span>Enviada em {formatDate(question.createdAt)}</span>
                    <span>
                      {question.answers.length === 1 ? '1 resposta' : `${question.answers.length} respostas`}
                    </span>
                    {hasUnreadAnswers(question) && <span className={styles.unreadBadge}>Novas respostas</span>}
                  </div>
                </header>

                <div className={styles.questionContent}>
                  <p>{question.content}</p>
                </div>

                {expandedQuestion === question.id && (
                  <div className={styles.detailArea}>
                    {question.comments.length > 0 && (
                      <div className={styles.commentsThread}>
                        <header>
                          <h4>Comentários internos</h4>
                        </header>
                        <div className={styles.threadBody}>
                          {question.comments.map((comment) => (
                            <div key={comment.id} className={styles.commentItem}>
                              <div className={styles.commentHeader}>
                                <strong>
                                  {comment.author.firstName} {comment.author.lastName}
                                </strong>
                                <span>{formatDate(comment.createdAt)}</span>
                              </div>
                              <p>{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentUser?.id !== question.user.id && (
                      <div className={styles.commentForm}>
                        <label htmlFor={`comment-question-${question.id}`}>Adicionar comentário interno</label>
                        <textarea
                          id={`comment-question-${question.id}`}
                          value={commentInputs[`question-${question.id}`] || ''}
                          onChange={(event) => handleCommentChange(`question-${question.id}`, event.target.value)}
                          placeholder="Escreva atualizações ou orientações para a equipe"
                          rows={3}
                        />
                        <div className={styles.formActions}>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => handleCommentChange(`question-${question.id}`, '')}
                            disabled={!commentInputs[`question-${question.id}`]?.trim()}
                          >
                            Limpar
                          </button>
                          <button
                            type="button"
                            className={styles.primaryButton}
                            onClick={() => handleSubmitComment(question.id, `question-${question.id}`)}
                          >
                            Comentar
                          </button>
                        </div>
                      </div>
                    )}

                    {question.answers.length > 0 && (
                      <div className={styles.answersArea}>
                        <h4>
                          {question.answers.length === 1
                            ? 'Resposta do especialista'
                            : `Respostas (${question.answers.length})`}
                        </h4>

                        {question.answers.map((answer) => (
                          <div key={answer.id} className={styles.answerCard}>
                            <div className={styles.answerHeader}>
                              <div>
                                <strong>
                                  {answer.admin.firstName} {answer.admin.lastName}
                                </strong>
                                <span>Equipe de especialistas</span>
                              </div>
                              <time>{formatDate(answer.createdAt)}</time>
                            </div>
                            <div className={styles.answerContent}>
                              <p>{answer.content}</p>
                            </div>

                            {answer.comments.length > 0 && (
                              <div className={styles.followUpComments}>
                                {answer.comments.map((comment) => (
                                  <div key={comment.id} className={styles.commentItem}>
                                    <div className={styles.commentHeader}>
                                      <strong>
                                        {comment.author.firstName} {comment.author.lastName}
                                      </strong>
                                      <span>{formatDate(comment.createdAt)}</span>
                                    </div>
                                    <p>{comment.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {currentUser?.id !== question.user.id && (
                              <div className={styles.commentForm}>
                                <label htmlFor={`comment-answer-${answer.id}`}>
                                  Adicionar comentário à resposta
                                </label>
                                <textarea
                                  id={`comment-answer-${answer.id}`}
                                  value={commentInputs[`answer-${answer.id}`] || ''}
                                  onChange={(event) => handleCommentChange(`answer-${answer.id}`, event.target.value)}
                                  placeholder="Registre alinhamentos internos sobre esta resposta"
                                  rows={3}
                                />
                                <div className={styles.formActions}>
                                  <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    onClick={() => handleCommentChange(`answer-${answer.id}`, '')}
                                    disabled={!commentInputs[`answer-${answer.id}`]?.trim()}
                                  >
                                    Limpar
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.primaryButton}
                                    onClick={() =>
                                      handleSubmitComment(question.id, `answer-${answer.id}`, answer.id)
                                    }
                                  >
                                    Comentar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <footer className={styles.cardFooter}>
                      {question.status !== 'FECHADA' && question.answers.length > 0 ? (
                        <button
                          type="button"
                          className={styles.successButton}
                          onClick={() => handleCloseQuestion(question.id)}
                        >
                          Marcar como resolvida
                        </button>
                      ) : (
                        <span className={styles.mutedText}>Pergunta encerrada</span>
                      )}
                    </footer>
                  </div>
                )}
              </article>
            ))
          )}
        </section>

        {total > limit && (
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => currentPage > 1 && loadQuestions(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => currentPage < totalPages && loadQuestions(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {openDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} role="dialog" aria-modal="true">
            <header className={styles.modalHeader}>
              <h2>Nova dúvida</h2>
              <button type="button" onClick={() => setOpenDialog(false)} aria-label="Fechar">
                ×
              </button>
            </header>
            <div className={styles.modalBody}>
              <div className={styles.fieldGroup}>
                <label htmlFor="new-question-title">Título da dúvida</label>
                <input
                  id="new-question-title"
                  type="text"
                  value={newQuestion.title}
                  onChange={(event) => setNewQuestion({ ...newQuestion, title: event.target.value })}
                  placeholder="Descreva sua dúvida de forma objetiva"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="new-question-content">Descrição detalhada</label>
                <textarea
                  id="new-question-content"
                  value={newQuestion.content}
                  onChange={(event) => setNewQuestion({ ...newQuestion, content: event.target.value })}
                  placeholder="Detalhe sua dúvida. Quanto mais específica, melhor será nossa resposta."
                  rows={6}
                />
              </div>
            </div>
            <footer className={styles.modalFooter}>
              <button type="button" className={styles.secondaryButton} onClick={() => setOpenDialog(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleSubmitQuestion}
                disabled={submitting}
              >
                {submitting ? 'Enviando...' : 'Enviar dúvida'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
