'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { formatTextWithLinks } from '@/utils/formatTextWithLinks';
import styles from './central-duvidas.module.css';

type QuestionStatus = 'NOVA' | 'RESPONDIDA' | 'FECHADA';

interface Question {
  id: string;
  title: string;
  content: string;
  status: QuestionStatus;
  createdAt: string;
  readByAdmin: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    plan: string;
  };
  answers: Answer[];
}

interface Answer {
  id: string;
  content: string;
  createdAt: string;
  isFaq?: boolean;
  faqTitle?: string | null;
  faqOrder?: number;
  admin: {
    firstName: string;
    lastName: string;
  };
}

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
    createdAt: string;
  };
  admin: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Stats {
  overview: {
    totalQuestions: number;
    totalAnswers: number;
    unreadQuestions: number;
    pendingQuestions: number;
    averageResponseTimeHours: number;
  };
  breakdown: {
    byStatus: Array<{ status: string; count: number }>;
    byPriority: Array<{ priority: string; count: number }>;
  };
}

interface ResponseTemplate {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

type StatusFilter = 'ALL' | 'NOVA' | 'RESPONDIDA';
type SortOption = 'RECENT' | 'OLDER';

const statusLabels: Record<QuestionStatus, string> = {
  NOVA: 'Nova',
  RESPONDIDA: 'Respondida',
  FECHADA: 'Respondida',
};

const planLabels: Record<string, string> = {
  VIP: 'Close Friends VIP',
  LITE: 'Close Friends LITE',
  LITE_V2: 'Close Friends LITE 2.0',
  RENDA_PASSIVA: 'Projeto Renda Passiva',
  FIIS: 'Projeto FIIs',
  RENDA_TURBINADA: 'CF Renda Turbinada',
  AMERICA: 'Projeto América',
  ADMIN: 'Administrador',
  ANALISTA: 'Analista',
};

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'RECENT', label: 'Mais recentes primeiro' },
  { value: 'OLDER', label: 'Mais antigas primeiro' },
];

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'NOVA', label: 'Novas' },
  { value: 'RESPONDIDA', label: 'Respondidas' },
];

export default function AdminCentralDuvidas() {
  const { user } = useUser();

  const [currentTab, setCurrentTab] = useState<'QUESTIONS' | 'FAQ'>('QUESTIONS');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('RECENT');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [activeResponseQuestionId, setActiveResponseQuestionId] = useState<string | null>(null);
  const [responseContent, setResponseContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');

  const [showFaqModal, setShowFaqModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [faqTitle, setFaqTitle] = useState('');
  const [faqOrder, setFaqOrder] = useState(0);

  const [editFaqModalOpen, setEditFaqModalOpen] = useState(false);
  const [faqToEdit, setFaqToEdit] = useState<FAQ | null>(null);
  const [editFaqTitle, setEditFaqTitle] = useState('');
  const [editFaqOrder, setEditFaqOrder] = useState(0);
  const [editFaqContent, setEditFaqContent] = useState('');

  const [deleteFaqDialogOpen, setDeleteFaqDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);

  const [deleteQuestionDialogOpen, setDeleteQuestionDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState(false);

  const [showCreateFaqModal, setShowCreateFaqModal] = useState(false);
  const [createFaqData, setCreateFaqData] = useState({ title: '', content: '', faqOrder: 0 });
  const [creatingFaq, setCreatingFaq] = useState(false);

  useEffect(() => {
    loadData(1);
  }, []);

  useEffect(() => {
    loadData(1);
  }, [currentTab, statusFilter]);

  const loadData = async (page = currentPage) => {
    if (currentTab === 'QUESTIONS') {
      await Promise.all([loadQuestions(page), loadStats()]);
    } else {
      await loadFAQs();
    }
  };

  const loadQuestions = async (page = currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('excludeVirtual', 'true');
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (statusFilter !== 'ALL') {
        const statusParam =
          statusFilter === 'RESPONDIDA' ? 'RESPONDIDA,FECHADA' : statusFilter;
        params.append('status', statusParam);
      }

      const response = await fetch(`/api/questions?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const normalizedQuestions = (data.questions || []).map((question: Question) => ({
          ...question,
          status: question.status === 'FECHADA' ? 'RESPONDIDA' : question.status,
        }));
        setQuestions(normalizedQuestions);
        setCurrentPage(data.pagination.page);
        setTotal(data.pagination.total);
        setError('');
      } else {
        setError('Erro ao carregar perguntas. Tente novamente.');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/questions/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const loadFAQs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/faq', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFaqs(data.faqs || []);
        setError('');
      } else {
        setError('Erro ao carregar FAQs');
      }
    } catch (err) {
      setError('Erro ao carregar FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFAQ = async () => {
    if (!createFaqData.title.trim() || !createFaqData.content.trim()) {
      setError('Título e conteúdo são obrigatórios');
      return;
    }

    setCreatingFaq(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? document.cookie.match(/auth-token=([^;]+)/)?.[1] || localStorage.getItem('auth-token') || ''
          : '';

      const response = await fetch('/api/faq/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.email ? { 'X-User-Email': user.email } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(createFaqData),
      });

      if (response.ok) {
        setSuccess('FAQ criada com sucesso!');
        setShowCreateFaqModal(false);
        setCreateFaqData({ title: '', content: '', faqOrder: 0 });
        loadFAQs();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao criar FAQ');
      }
    } catch (err) {
      setError('Erro ao criar FAQ');
    } finally {
      setCreatingFaq(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const params = new URLSearchParams();
      params.append('isActive', 'true');

      const response = await fetch(`/api/response-templates?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        setError('Erro ao carregar templates');
      }
    } catch (err) {
      setError('Erro ao carregar templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleUseTemplate = async (template: ResponseTemplate) => {
    try {
      await fetch(`/api/response-templates/${template.id}/use`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setResponseContent(template.content);
      setShowTemplatesModal(false);
      setSuccess(`Template "${template.title}" aplicado!`);
    } catch (err) {
      setError('Erro ao aplicar template');
    }
  };

  const handleMarkAsFAQ = (answer: Answer, questionTitle: string) => {
    setSelectedAnswer(answer);
    setFaqTitle(answer.faqTitle || questionTitle);
    setFaqOrder(answer.faqOrder || 0);
    setShowFaqModal(true);
  };

  const submitFAQ = async () => {
    if (!selectedAnswer) return;

    try {
      const response = await fetch(`/api/answers/${selectedAnswer.id}/faq`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isFaq: !selectedAnswer.isFaq,
          faqTitle: selectedAnswer.isFaq ? null : faqTitle,
          faqOrder: selectedAnswer.isFaq ? 0 : faqOrder,
        }),
      });

      if (response.ok) {
        const action = selectedAnswer.isFaq ? 'removida das' : 'adicionada às';
        setSuccess(`Resposta ${action} FAQs!`);
        setShowFaqModal(false);
        setSelectedAnswer(null);
        setFaqTitle('');
        setFaqOrder(0);
        loadData();
      } else {
        setError('Erro ao alterar status FAQ');
      }
    } catch (err) {
      setError('Erro ao alterar status FAQ');
    }
  };

  const handleEditFaq = (faq: FAQ) => {
    setFaqToEdit(faq);
    setEditFaqTitle(faq.faqTitle || '');
    setEditFaqOrder(faq.faqOrder || 0);
    setEditFaqContent(faq.content || '');
    setEditFaqModalOpen(true);
  };

  const handleUpdateFaq = async () => {
    if (!faqToEdit) return;

    try {
      const response = await fetch(`/api/answers/${faqToEdit.id}/faq`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isFaq: true,
          faqTitle: editFaqTitle,
          faqOrder: editFaqOrder,
          content: editFaqContent,
        }),
      });

      if (response.ok) {
        setSuccess('FAQ atualizada com sucesso!');
        setEditFaqModalOpen(false);
        setFaqToEdit(null);
        loadFAQs();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao atualizar FAQ');
      }
    } catch (err) {
      setError('Erro ao atualizar FAQ');
    }
  };

  const handleDeleteFaq = (faq: FAQ) => {
    setFaqToDelete(faq);
    setDeleteFaqDialogOpen(true);
  };

  const confirmDeleteFaq = async () => {
    if (!faqToDelete) return;

    try {
      const response = await fetch(`/api/answers/${faqToDelete.id}/faq`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess('FAQ removida com sucesso!');
        setDeleteFaqDialogOpen(false);
        setFaqToDelete(null);
        loadFAQs();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao remover FAQ');
      }
    } catch (err) {
      setError('Erro ao remover FAQ');
    }
  };

  const handleDeleteQuestion = (question: Question) => {
    setError('');
    setSuccess('');
    setQuestionToDelete(question);
    setDeleteQuestionDialogOpen(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;

    setDeletingQuestion(true);

    try {
      const response = await fetch(`/api/questions/${questionToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const shouldGoToPreviousPage =
          questions.length === 1 && currentPage > 1 && total - 1 <= (currentPage - 1) * limit;

        setSuccess('Pergunta removida com sucesso!');
        setDeleteQuestionDialogOpen(false);
        setQuestionToDelete(null);

        await loadData(shouldGoToPreviousPage ? currentPage - 1 : currentPage);
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.error || 'Erro ao remover pergunta');
      }
    } catch (err) {
      setError('Erro ao remover pergunta');
    } finally {
      setDeletingQuestion(false);
    }
  };

  const handleCloseDeleteQuestionDialog = () => {
    setDeleteQuestionDialogOpen(false);
    setQuestionToDelete(null);
  };

  const handleStartResponse = (question: Question) => {
    setSelectedQuestion(question);
    setResponseContent('');
    setActiveResponseQuestionId(question.id);
    setExpandedQuestion(question.id);
    loadTemplates();
  };

  const handleCancelResponse = () => {
    setActiveResponseQuestionId(null);
    setResponseContent('');
    setSelectedQuestion(null);
  };

  const handleSubmitResponse = async () => {
    if (!selectedQuestion || !responseContent.trim()) {
      setError('Resposta é obrigatória');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/questions/${selectedQuestion.id}/answers`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: responseContent,
        }),
      });

      if (response.ok) {
        setSuccess('Resposta enviada com sucesso!');
        setResponseContent('');
        setSelectedQuestion(null);
        setActiveResponseQuestionId(null);
        loadData();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao enviar resposta');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
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
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${Math.max(1, diffInMinutes)} min atrás`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Ontem';
    }

    return formatDate(dateString);
  };

  const getStatusBadgeClass = (status: QuestionStatus) => {
    switch (status) {
      case 'NOVA':
        return styles.statusNew;
      case 'RESPONDIDA':
      case 'FECHADA':
        return styles.statusAnswered;
      default:
        return '';
    }
  };

  const statusCounts = useMemo(() => {
    if (stats?.breakdown?.byStatus?.length) {
      return stats.breakdown.byStatus.reduce(
        (acc, item) => {
          acc.total += item.count;

          if (item.status === 'NOVA') {
            acc.NOVA += item.count;
          }

          if (item.status === 'RESPONDIDA' || item.status === 'FECHADA') {
            acc.RESPONDIDA += item.count;
          }

          return acc;
        },
        { total: 0, NOVA: 0, RESPONDIDA: 0 } as Record<'total' | 'NOVA' | 'RESPONDIDA', number>,
      );
    }

    return questions.reduce(
      (acc, question) => {
        acc.total += 1;
        if (question.status === 'NOVA') {
          acc.NOVA += 1;
        } else {
          acc.RESPONDIDA += 1;
        }
        return acc;
      },
      { total: 0, NOVA: 0, RESPONDIDA: 0 } as Record<'total' | 'NOVA' | 'RESPONDIDA', number>,
    );
  }, [questions, stats]);

  const filteredQuestions = useMemo(() => {
    let data = [...questions];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter((question) => {
        const matchesTitle = question.title.toLowerCase().includes(term);
        const matchesContent = question.content.toLowerCase().includes(term);
        const matchesUser = `${question.user.firstName} ${question.user.lastName}`.toLowerCase().includes(term);
        return matchesTitle || matchesContent || matchesUser;
      });
    }

    return data.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (sortOption === 'RECENT') {
        return dateB - dateA;
      }

      return dateA - dateB;
    });
  }, [questions, searchTerm, sortOption]);

  const filteredTemplates = useMemo(
    () =>
      templates.filter((template) => {
        const query = templateSearch.toLowerCase();
        return (
          template.title.toLowerCase().includes(query) || template.content.toLowerCase().includes(query)
        );
      }),
    [templates, templateSearch],
  );

  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

  const handleRefresh = () => {
    if (currentTab === 'QUESTIONS') {
      loadQuestions(currentPage);
      loadStats();
    } else {
      loadFAQs();
    }
  };

  const isLoadingQuestions = loading && currentTab === 'QUESTIONS';
  const isLoadingFaqs = loading && currentTab === 'FAQ';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>Central de Dúvidas - Admin</h1>
            <p className={styles.headerSubtitle}>
              Gerencie as dúvidas dos membros, organize respostas da equipe e alimente a base de conhecimento.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/dashboard/admin/templates" className={styles.secondaryButton}>
              Gerenciar templates
            </Link>
            <button type="button" className={styles.secondaryButton} onClick={handleRefresh}>
              Atualizar dados
            </button>
          </div>
        </header>

        <div className={styles.mainTabs}>
          <button
            type="button"
            className={`${styles.mainTabButton} ${currentTab === 'QUESTIONS' ? styles.mainTabButtonActive : ''}`}
            onClick={() => setCurrentTab('QUESTIONS')}
          >
            Atendimento
          </button>
          <button
            type="button"
            className={`${styles.mainTabButton} ${currentTab === 'FAQ' ? styles.mainTabButtonActive : ''}`}
            onClick={() => setCurrentTab('FAQ')}
          >
            Base de conhecimento
          </button>
        </div>

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

        {currentTab === 'QUESTIONS' && (
          <>
            <section className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Total</span>
                <strong className={styles.summaryValue}>{stats?.overview.totalQuestions ?? statusCounts.total}</strong>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Pendentes</span>
                <strong className={styles.summaryValue}>{stats?.overview.pendingQuestions ?? statusCounts.NOVA}</strong>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Respondidas</span>
                <strong className={styles.summaryValue}>{stats?.overview.totalAnswers ?? statusCounts.RESPONDIDA}</strong>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Tempo médio de resposta</span>
                <strong className={styles.summaryValue}>
                  {stats?.overview.averageResponseTimeHours
                    ? `${stats.overview.averageResponseTimeHours.toFixed(1)}h`
                    : '—'}
                </strong>
              </div>
            </section>

            <div className={styles.filtersCard}>
              <div className={styles.filterHeader}>
                <div className={styles.filterTabs}>
                  {statusTabs.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      className={`${styles.tabButton} ${statusFilter === tab.value ? styles.tabButtonActive : ''}`}
                      onClick={() => {
                        setStatusFilter(tab.value);
                        setExpandedQuestion(null);
                      }}
                    >
                      {tab.label} ({tab.value === 'ALL' ? statusCounts.total : statusCounts[tab.value]})
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterControls}>
                <div className={styles.searchBox}>
                  <input
                    type="search"
                    placeholder="Buscar por título, conteúdo ou membro"
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
              {isLoadingQuestions && questions.length === 0 ? (
                <div className={styles.loadingWrapper}>
                  <p>Carregando dúvidas...</p>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className={styles.emptyState}>
                  <h3>Nenhuma dúvida encontrada</h3>
                  <p>Revise os filtros, altere a busca ou aguarde novas perguntas dos membros.</p>
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
                        <div className={styles.questionHeadingActions}>
                          <span className={`${styles.statusBadge} ${getStatusBadgeClass(question.status)}`}>
                            {statusLabels[question.status]}
                          </span>
                          <button
                            type="button"
                            className={styles.dangerGhostButton}
                            onClick={() => handleDeleteQuestion(question)}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                      <div className={styles.questionMeta}>
                        <span className={styles.questionMetaItem}>
                          <strong>
                            {question.user.firstName} {question.user.lastName}
                          </strong>
                          {planLabels[question.user.plan] && ` • ${planLabels[question.user.plan]}`}
                        </span>
                        <span className={styles.questionMetaItem}>{formatDateRelative(question.createdAt)}</span>
                        <span className={styles.questionMetaItem}>Criada em {formatDate(question.createdAt)}</span>
                        <span className={styles.questionMetaItem}>
                          {question.answers.length === 1 ? '1 resposta' : `${question.answers.length} respostas`}
                        </span>
                        {!question.readByAdmin && (
                          <span className={`${styles.statusBadge} ${styles.statusUnread}`}>
                            Nova para equipe
                          </span>
                        )}
                      </div>
                    </header>

                    <div className={styles.questionContent}>
                      {formatTextWithLinks(question.content, {
                        linkProps: { className: styles.answerLink },
                      })}
                    </div>

                    {/* Botão fora da área expandida para perguntas sem expansão */}
                    {question.status === 'NOVA' &&
                     activeResponseQuestionId !== question.id &&
                     expandedQuestion !== question.id && (
                      <div className={styles.questionFooter}>
                        <button
                          type="button"
                          className={styles.responseButton}
                          onClick={() => handleStartResponse(question)}
                        >
                          Responder dúvida
                        </button>
                      </div>
                    )}

                    {expandedQuestion === question.id && (
                      <div className={styles.detailArea}>
                        {question.answers.length > 0 ? (
                          <div>
                            <h4>Respostas da equipe</h4>
                            <div className={styles.listSection}>
                              {question.answers.map((answer) => (
                                <div key={answer.id} className={styles.answerCard}>
                                  <div className={styles.answerHeader}>
                                    <div>
                                      <strong>Fatos da Bolsa</strong>
                                      <div>{formatDate(answer.createdAt)}</div>
                                    </div>
                                    <div className={styles.answerActions}>
                                      {answer.isFaq && <span className={`${styles.tag} ${styles.tagNeutral}`}>FAQ</span>}
                                      <button
                                        type="button"
                                        className={styles.secondaryButton}
                                        onClick={() => handleMarkAsFAQ(answer, question.title)}
                                      >
                                        {answer.isFaq ? 'Remover das FAQs' : 'Adicionar às FAQs'}
                                      </button>
                                    </div>
                                  </div>
                                  <div className={styles.answerContent}>
                                    {formatTextWithLinks(answer.content, {
                                      linkProps: { className: styles.answerLink },
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className={styles.emptyAnswers}>Nenhuma resposta da equipe cadastrada ainda.</p>
                        )}
                        
                        {/* Botão dentro da área expandida */}
                        {question.status === 'NOVA' && activeResponseQuestionId !== question.id && (
                          <div className={styles.questionFooter}>
                            <button
                              type="button"
                              className={styles.responseButton}
                              onClick={() => handleStartResponse(question)}
                            >
                              Responder dúvida
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {activeResponseQuestionId === question.id && (
                      <div className={styles.responseForm}>
                        <label htmlFor={`response-${question.id}`} className={styles.responseLabel}>
                          Responder membro
                        </label>
                        <textarea
                          id={`response-${question.id}`}
                          className={styles.responseTextarea}
                          value={responseContent}
                          onChange={(event) => setResponseContent(event.target.value)}
                          placeholder="Escreva sua resposta para o membro"
                        />
                        <div className={styles.responseActions}>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => setShowTemplatesModal(true)}
                          >
                            Inserir template
                          </button>
                          <div className={styles.responseActionButtons}>
                            <button
                              type="button"
                              className={styles.secondaryButton}
                              onClick={handleCancelResponse}
                              disabled={submitting}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className={styles.primaryButton}
                              onClick={handleSubmitResponse}
                              disabled={submitting}
                            >
                              {submitting ? 'Enviando...' : 'Publicar resposta'}
                            </button>
                          </div>
                        </div>
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
          </>
        )}

        {currentTab === 'FAQ' && (
          <>
            <div className={styles.header}>
              <div>
                <h2 className={styles.headerTitle}>Base de conhecimento</h2>
                <p className={styles.headerSubtitle}>
                  Aproveite respostas frequentes para acelerar o atendimento e garantir consistência na comunicação.
                </p>
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setShowCreateFaqModal(true)}
              >
                Criar FAQ
              </button>
            </div>

            {isLoadingFaqs && faqs.length === 0 ? (
              <div className={styles.loadingWrapper}>
                <p>Carregando base de conhecimento...</p>
              </div>
            ) : faqs.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>Nenhum artigo cadastrado</h3>
                <p>Converta respostas relevantes em FAQs para ajudar toda a comunidade.</p>
              </div>
            ) : (
              <div className={styles.faqList}>
                {faqs.map((faq) => (
                  <div key={faq.id} className={styles.faqCard}>
                    <div className={styles.faqHeader}>
                      <h3 className={styles.faqTitle}>{faq.faqTitle || faq.question.title}</h3>
                      <div className={styles.actionGroup}>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => handleEditFaq(faq)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => handleDeleteFaq(faq)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>

                    <div className={styles.faqMeta}>
                      <span className={`${styles.tag} ${styles.tagPrimary}`}>
                        Pergunta original: {faq.question.title}
                      </span>
                      <span className={`${styles.tag} ${styles.tagNeutral}`}>
                        Ordem: {faq.faqOrder}
                      </span>
                      <span>{formatDate(faq.createdAt)}</span>
                    </div>

                    <div className={styles.faqContent}>{faq.content}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showTemplatesModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.modalLarge}`}>
            <div className={styles.modalHeader}>
              <h2>Selecionar template</h2>
              <button type="button" onClick={() => setShowTemplatesModal(false)} aria-label="Fechar">
                ×
              </button>
            </div>
            <div className={`${styles.modalBody} ${styles.modalBodyScrollable}`}>
              <div className={styles.fieldGroup}>
                <label>Buscar templates</label>
                <input
                  type="search"
                  placeholder="Digite para buscar por título ou conteúdo"
                  value={templateSearch}
                  onChange={(event) => setTemplateSearch(event.target.value)}
                />
              </div>
              {loadingTemplates ? (
                <div className={styles.loadingWrapper}>
                  <p>Carregando templates...</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className={styles.emptyState}>
                  <h3>Nenhum template disponível</h3>
                  <p>Crie modelos reutilizáveis para acelerar suas respostas.</p>
                </div>
              ) : (
                <div className={styles.templateList}>
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={styles.templateItem}
                      onClick={() => handleUseTemplate(template)}
                    >
                      <div className={styles.templateItemHeader}>
                        <strong>{template.title}</strong>
                        {template.usageCount > 0 && (
                          <span className={styles.templateStats}>{template.usageCount} usos</span>
                        )}
                      </div>
                      <p>{template.content}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryButton} onClick={() => setShowTemplatesModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showFaqModal && selectedAnswer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{selectedAnswer.isFaq ? 'Remover das FAQs' : 'Adicionar à base de conhecimento'}</h2>
              <button type="button" onClick={() => setShowFaqModal(false)} aria-label="Fechar">
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {selectedAnswer.isFaq ? (
                <p>Tem certeza de que deseja remover esta resposta da base de conhecimento?</p>
              ) : (
                <>
                  <div className={styles.fieldGroup}>
                    <label>Título da FAQ</label>
                    <input
                      type="text"
                      value={faqTitle}
                      onChange={(event) => setFaqTitle(event.target.value)}
                      placeholder="Defina um título descritivo para a FAQ"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Ordem de exibição</label>
                    <input
                      type="number"
                      value={faqOrder}
                      onChange={(event) => setFaqOrder(Number(event.target.value))}
                    />
                  </div>
                </>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryButton} onClick={() => setShowFaqModal(false)}>
                Cancelar
              </button>
              <button type="button" className={styles.primaryButton} onClick={submitFAQ}>
                {selectedAnswer.isFaq ? 'Remover' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteQuestionDialogOpen && questionToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Excluir pergunta</h2>
              <button type="button" onClick={handleCloseDeleteQuestionDialog} aria-label="Fechar">
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Tem certeza de que deseja excluir a pergunta <strong>{questionToDelete.title}</strong>?
              </p>
              <p>Essa ação não pode ser desfeita.</p>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryButton} onClick={handleCloseDeleteQuestionDialog}>
                Cancelar
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={confirmDeleteQuestion}
                disabled={deletingQuestion}
              >
                {deletingQuestion ? 'Excluindo...' : 'Excluir pergunta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateFaqModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Criar FAQ</h2>
              <button type="button" onClick={() => setShowCreateFaqModal(false)} aria-label="Fechar">
                ×
              </button>
            </div>
            <div className={`${styles.modalBody} ${styles.modalBodyScrollable}`}>
              <div className={styles.fieldGroup}>
                <label>Título</label>
                <input
                  type="text"
                  value={createFaqData.title}
                  onChange={(event) => setCreateFaqData({ ...createFaqData, title: event.target.value })}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label>Conteúdo</label>
                <textarea
                  value={createFaqData.content}
                  onChange={(event) => setCreateFaqData({ ...createFaqData, content: event.target.value })}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label>Ordem</label>
                <input
                  type="number"
                  value={createFaqData.faqOrder}
                  onChange={(event) =>
                    setCreateFaqData({ ...createFaqData, faqOrder: Number(event.target.value) })
                  }
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryButton} onClick={() => setShowCreateFaqModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleCreateFAQ}
                disabled={creatingFaq}
              >
                {creatingFaq ? 'Criando...' : 'Criar FAQ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editFaqModalOpen && faqToEdit && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Editar FAQ</h2>
              <button type="button" onClick={() => setEditFaqModalOpen(false)} aria-label="Fechar">
                ×
              </button>
            </div>
            <div className={`${styles.modalBody} ${styles.modalBodyScrollable}`}>
              <div className={styles.fieldGroup}>
                <label>Título</label>
                <input
                  type="text"
                  value={editFaqTitle}
                  onChange={(event) => setEditFaqTitle(event.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label>Ordem</label>
                <input
                  type="number"
                  value={editFaqOrder}
                  onChange={(event) => setEditFaqOrder(Number(event.target.value))}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label>Conteúdo</label>
                <textarea
                  value={editFaqContent}
                  onChange={(event) => setEditFaqContent(event.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryButton} onClick={() => setEditFaqModalOpen(false)}>
                Cancelar
              </button>
              <button type="button" className={styles.primaryButton} onClick={handleUpdateFaq}>
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteFaqDialogOpen && faqToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Remover FAQ</h2>
            </div>
            <div className={styles.modalBody}>
              <p>
                Tem certeza de que deseja remover a FAQ "
                {faqToDelete.faqTitle || faqToDelete.question.title}"?
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryButton} onClick={() => setDeleteFaqDialogOpen(false)}>
                Cancelar
              </button>
              <button type="button" className={styles.dangerButton} onClick={confirmDeleteFaq}>
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
