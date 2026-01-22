'use client';

import { type FormEvent, useMemo, useState } from 'react';

type PlanValue =
  | 'VIP'
  | 'LITE'
  | 'LITE_V2'
  | 'RENDA_PASSIVA'
  | 'FIIS'
  | 'RENDA_TURBINADA'
  | 'RENDA_TURBINADA_T2'
  | 'RENDA_TURBINADA_T3'
  | 'AMERICA'
  | 'ADMIN';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

type FeedbackState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const PLAN_OPTIONS: Array<{
  value: PlanValue;
  label: string;
  description: string;
  color: string;
  emoji: string;
}> = [
  { value: 'VIP', label: 'Close Friends VIP', description: 'Assinantes do plano VIP completo.', color: '#7C3AED', emoji: '👑' },
  { value: 'LITE', label: 'Close Friends LITE', description: 'Versão otimizada do CF focada no essencial.', color: '#2563EB', emoji: '⭐' },
  { value: 'LITE_V2', label: 'Close Friends LITE 2.0', description: 'Nova turma do plano LITE.', color: '#1D4ED8', emoji: '✨' },
  { value: 'RENDA_PASSIVA', label: 'Projeto Renda Passiva', description: 'Comunidade dedicada à renda recorrente.', color: '#059669', emoji: '💰' },
  { value: 'FIIS', label: 'Projeto FIIs', description: 'Investidores focados em fundos imobiliários.', color: '#D97706', emoji: '🏢' },
  { value: 'RENDA_TURBINADA', label: 'CF Renda Turbinada', description: 'Alunos do programa Renda Turbinada.', color: '#F97316', emoji: '⚡' },
  { value: 'RENDA_TURBINADA_T2', label: 'CF Renda Turbinada - Turma 2', description: 'Alunos da segunda turma do Renda Turbinada.', color: '#FB923C', emoji: '⚡' },
  { value: 'RENDA_TURBINADA_T3', label: 'CF Renda Turbinada - Turma 3', description: 'Alunos da terceira turma do Renda Turbinada.', color: '#FDBA74', emoji: '⚡' },
  { value: 'AMERICA', label: 'Projeto América', description: 'Assinantes do hub internacional.', color: '#DC2626', emoji: '🗽' },
  { value: 'ADMIN', label: 'Administradores', description: 'Time interno e contas administrativas.', color: '#4B5563', emoji: '🛠️' }
];

const NOTIFICATION_TYPES: Array<{ value: NotificationType; label: string; helper: string }> = [
  { value: 'info', label: 'Informativo', helper: 'Atualizações gerais, novidades ou comunicados neutros.' },
  { value: 'success', label: 'Sucesso', helper: 'Boas notícias, conquistas ou convites positivos.' },
  { value: 'warning', label: 'Aviso', helper: 'Orientações importantes que exigem atenção.' },
  { value: 'error', label: 'Alerta', helper: 'Problemas críticos ou interrupções de serviço.' }
];

const CATEGORY_OPTIONS: Array<{ value: string; label: string; helper?: string }> = [
  { value: 'general', label: 'Geral', helper: 'Comunicados amplos e informativos.' },
  { value: 'reports', label: 'Relatórios', helper: 'Atualizações sobre relatórios e publicações.' },
  { value: 'events', label: 'Eventos', helper: 'Avisos sobre lives, aulas ou encontros.' },
  { value: 'maintenance', label: 'Manutenção', helper: 'Interrupções e ajustes na plataforma.' },
  { value: 'reminders', label: 'Lembretes', helper: 'Mensagens rápidas para reforçar ações importantes.' }
];

export default function AdminNotificationsBroadcastPage() {
  const [selectedPlans, setSelectedPlans] = useState<PlanValue[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('info');
  const [category, setCategory] = useState('general');
  const [actionUrl, setActionUrl] = useState('');
  const [campaignTag, setCampaignTag] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ status: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailPlans, setEmailPlans] = useState<PlanValue[]>([]);
  const [emailBroadcastSubject, setEmailBroadcastSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailIsHtml, setEmailIsHtml] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<FeedbackState>({ status: 'idle', message: '' });
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  const isAllSelected = selectedPlans.length === PLAN_OPTIONS.length;

  const selectedPlanBadges = useMemo(() => {
    return PLAN_OPTIONS.filter(option => selectedPlans.includes(option.value));
  }, [selectedPlans]);

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setActionUrl('');
    setCampaignTag('');
    setSendEmail(false);
    setEmailSubject('');
    setPreviewMode(false);
  };

  const togglePlan = (plan: PlanValue) => {
    setSelectedPlans(prev =>
      prev.includes(plan) ? prev.filter(item => item !== plan) : [...prev, plan]
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPlans([]);
    } else {
      setSelectedPlans(PLAN_OPTIONS.map(option => option.value));
    }
  };

  const emailAllSelected = emailPlans.length === PLAN_OPTIONS.length;

  const toggleEmailPlan = (plan: PlanValue) => {
    setEmailPlans(prev =>
      prev.includes(plan) ? prev.filter(item => item !== plan) : [...prev, plan]
    );
  };

  const handleEmailSelectAll = () => {
    if (emailAllSelected) {
      setEmailPlans([]);
    } else {
      setEmailPlans(PLAN_OPTIONS.map(option => option.value));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedPlans.length === 0) {
      setFeedback({ status: 'error', message: 'Selecione pelo menos um plano para enviar a notificação.' });
      return;
    }

    if (!title.trim() || !message.trim()) {
      setFeedback({ status: 'error', message: 'Título e mensagem são obrigatórios.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ status: 'idle', message: '' });

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
          body: JSON.stringify({
            title: title.trim(),
            message: message.trim(),
            type,
            category,
            actionUrl: actionUrl.trim() || undefined,
            sendEmail,
            emailSubject: sendEmail && emailSubject.trim() ? emailSubject.trim() : undefined,
            targetPlans: selectedPlans,
            metadata: {
              scope: 'admin-dashboard-broadcast',
              previewMode,
            ...(campaignTag.trim() ? { campaignTag: campaignTag.trim() } : {})
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Não foi possível enviar a notificação.');
      }

      const data = await response.json();
      const totalRecipients = Array.isArray(data?.recipients) ? data.recipients.length : 0;
      const totalNotifications = typeof data?.notificationsCreated === 'number' ? data.notificationsCreated : totalRecipients;
      const emailSummary = data?.email?.requested
        ? ` E-mails: ${data.email.sent ?? 0} enviados${data.email.failed ? `, ${data.email.failed} falharam` : ''}.`
        : '';

      setFeedback({
        status: 'success',
        message: `Notificação enviada com sucesso para ${totalNotifications} usuário(s).${emailSummary}`
      });
      resetForm();
    } catch (error: any) {
      console.error('Erro ao enviar notificação:', error);
      setFeedback({
        status: 'error',
        message: error?.message || 'Erro inesperado ao tentar enviar a notificação.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetEmailForm = () => {
    setEmailPlans([]);
    setEmailBroadcastSubject('');
    setEmailMessage('');
    setEmailIsHtml(false);
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (emailPlans.length === 0) {
      setEmailFeedback({ status: 'error', message: 'Selecione pelo menos um plano para enviar o e-mail.' });
      return;
    }

    if (!emailBroadcastSubject.trim() || !emailMessage.trim()) {
      setEmailFeedback({ status: 'error', message: 'Assunto e mensagem do e-mail são obrigatórios.' });
      return;
    }

    setIsEmailSubmitting(true);
    setEmailFeedback({ status: 'idle', message: '' });

    try {
      const response = await fetch('/api/admin/email-broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          subject: emailBroadcastSubject.trim(),
          message: emailMessage,
          isHtml: emailIsHtml,
          targetPlans: emailPlans
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Não foi possível enviar o e-mail.');
      }

      const data = await response.json();
      const sentCount = Array.isArray(data?.recipients) ? data.recipients.length : 0;
      const failedCount = Array.isArray(data?.failed) ? data.failed.length : 0;

      setEmailFeedback({
        status: 'success',
        message: `E-mail enviado para ${sentCount} usuário(s).${failedCount ? ` ${failedCount} falharam.` : ''}`
      });
      resetEmailForm();
    } catch (error: any) {
      console.error('Erro ao enviar e-mail:', error);
      setEmailFeedback({
        status: 'error',
        message: error?.message || 'Erro inesperado ao tentar enviar o e-mail.'
      });
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: '32px'
    },
    wrapper: {
      maxWidth: '1100px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 800,
      margin: 0,
      color: '#0f172a'
    },
    subtitle: {
      marginTop: '8px',
      color: '#475569',
      fontSize: '1.05rem'
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '16px',
      boxShadow: '0 15px 45px rgba(15, 23, 42, 0.08)',
      padding: '32px',
      marginBottom: '24px'
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px'
    },
    sectionTitleText: {
      fontSize: '1.35rem',
      fontWeight: 700,
      color: '#1e293b'
    },
    selectAllButton: {
      background: 'none',
      border: 'none',
      color: '#2563eb',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    planGrid: {
      display: 'grid',
      gap: '16px',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))'
    },
    planCard: {
      borderRadius: '14px',
      border: '1px solid #e2e8f0',
      padding: '20px',
      backgroundColor: '#fff',
      textAlign: 'left' as const,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px'
    },
    planCardSelected: {
      borderColor: '#2563eb',
      boxShadow: '0 12px 30px rgba(37, 99, 235, 0.2)'
    },
    planBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 600,
      fontSize: '1.05rem'
    },
    planDescription: {
      margin: 0,
      color: '#64748b',
      fontSize: '0.95rem'
    },
    formGrid: {
      display: 'grid',
      gap: '20px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px'
    },
    label: {
      fontWeight: 600,
      color: '#334155',
      fontSize: '0.95rem'
    },
    helper: {
      color: '#64748b',
      fontSize: '0.85rem'
    },
    input: {
      padding: '14px',
      borderRadius: '12px',
      border: '1px solid #cbd5f5',
      fontSize: '1rem',
      transition: 'border-color 0.2s ease',
      fontFamily: 'inherit'
    },
    textarea: {
      minHeight: '160px',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid #cbd5f5',
      resize: 'vertical' as const,
      fontSize: '1rem',
      fontFamily: 'inherit'
    },
    select: {
      padding: '14px',
      borderRadius: '12px',
      border: '1px solid #cbd5f5',
      fontSize: '1rem',
      fontFamily: 'inherit'
    },
    checkboxRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    checkboxInput: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    submitButton: {
      marginTop: '24px',
      padding: '16px 28px',
      borderRadius: '12px',
      border: 'none',
      fontWeight: 700,
      fontSize: '1.05rem',
      cursor: 'pointer',
      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
      color: '#fff',
      boxShadow: '0 14px 30px rgba(59, 130, 246, 0.25)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    },
    submitButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    feedback: {
      marginTop: '16px',
      padding: '16px',
      borderRadius: '12px',
      fontWeight: 500
    },
    feedbackSuccess: {
      backgroundColor: '#ecfdf5',
      color: '#047857'
    },
    feedbackError: {
      backgroundColor: '#fee2e2',
      color: '#b91c1c'
    },
    previewCard: {
      borderRadius: '16px',
      border: '1px dashed #94a3b8',
      padding: '20px',
      marginTop: '12px',
      backgroundColor: '#f8fafc'
    },
    inlineBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '9999px',
      backgroundColor: '#e0e7ff',
      color: '#3730a3',
      fontSize: '0.8rem',
      fontWeight: 600
    }
  } as const;

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <header style={styles.header}>
          <h1 style={styles.title}>📣 Central de Comunicação</h1>
          <p style={styles.subtitle}>
            Envie notificações no app e e-mails separados para grupos de usuários com base no plano contratado.
          </p>
        </header>

        <section style={styles.card}>
          <div style={styles.sectionTitle}>
            <h2 style={styles.sectionTitleText}>1. Escolha os planos-alvo</h2>
            <button type="button" style={styles.selectAllButton} onClick={handleSelectAll}>
              {isAllSelected ? 'Limpar seleção' : 'Selecionar todos'}
            </button>
          </div>

          <div style={styles.planGrid}>
            {PLAN_OPTIONS.map(option => {
              const isSelected = selectedPlans.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => togglePlan(option.value)}
                  style={{
                    ...styles.planCard,
                    ...(isSelected ? styles.planCardSelected : {})
                  }}
                >
                  <div style={styles.planBadge}>
                    <span role="img" aria-hidden="true">
                      {option.emoji}
                    </span>
                    <span style={{ color: option.color }}>{option.label}</span>
                  </div>
                  <p style={styles.planDescription}>{option.description}</p>
                  <div style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      readOnly
                      checked={isSelected}
                      style={styles.checkboxInput}
                    />
                    <span style={{ color: isSelected ? '#2563eb' : '#94a3b8', fontWeight: 600 }}>
                      {isSelected ? 'Selecionado' : 'Selecionar plano'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={styles.card}>
          <form style={styles.formGrid} onSubmit={handleSubmit}>
            <div>
              <h2 style={styles.sectionTitleText}>2. Escreva a mensagem</h2>
              <p style={styles.helper}>Defina o conteúdo e a categorização da notificação.</p>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="notification-title">
                Título da notificação
              </label>
              <input
                id="notification-title"
                style={styles.input}
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="Ex.: Novo relatório disponível para download"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="notification-message">
                Mensagem
              </label>
              <textarea
                id="notification-message"
                style={styles.textarea}
                value={message}
                onChange={event => setMessage(event.target.value)}
                placeholder="Compartilhe os detalhes mais importantes com os assinantes selecionados."
              />
            </div>

            <div style={{ ...styles.formGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="notification-type">
                  Tipo de destaque
                </label>
                <select
                  id="notification-type"
                  style={styles.select}
                  value={type}
                  onChange={event => setType(event.target.value as NotificationType)}
                >
                  {NOTIFICATION_TYPES.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span style={styles.helper}>
                  {NOTIFICATION_TYPES.find(option => option.value === type)?.helper}
                </span>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="notification-category">
                  Categoria
                </label>
                <select
                  id="notification-category"
                  style={styles.select}
                  value={category}
                  onChange={event => setCategory(event.target.value)}
                >
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span style={styles.helper}>
                  {CATEGORY_OPTIONS.find(option => option.value === category)?.helper}
                </span>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="notification-link">
                Link de ação (opcional)
              </label>
              <input
                id="notification-link"
                style={styles.input}
                value={actionUrl}
                onChange={event => setActionUrl(event.target.value)}
                placeholder="https://..."
              />
              <span style={styles.helper}>
                Caso queira direcionar os usuários para um link específico, informe-o aqui.
              </span>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="campaign-tag">
                Identificador interno (opcional)
              </label>
              <input
                id="campaign-tag"
                style={styles.input}
                value={campaignTag}
                onChange={event => setCampaignTag(event.target.value)}
                placeholder="Ex.: campanha_relatorio_abril"
              />
              <span style={styles.helper}>
                Esse identificador ficará salvo nos metadados para facilitar auditoria e acompanhamento.
              </span>
            </div>

            <div style={styles.checkboxRow}>
              <input
                id="send-email"
                type="checkbox"
                checked={sendEmail}
                onChange={event => setSendEmail(event.target.checked)}
                style={styles.checkboxInput}
              />
              <label htmlFor="send-email" style={{ ...styles.helper, fontWeight: 600, cursor: 'pointer' }}>
                Enviar também por e-mail
              </label>
              <span style={styles.inlineBadge}>SMTP Vercel</span>
            </div>

            {sendEmail && (
              <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="notification-email-subject">
                  Assunto do e-mail (opcional)
                </label>
                <input
                  id="notification-email-subject"
                  style={styles.input}
                  value={emailSubject}
                  onChange={event => setEmailSubject(event.target.value)}
                  placeholder="Ex.: Atualização importante para sua assinatura"
                />
                <span style={styles.helper}>
                  Se deixar em branco, o assunto será montado automaticamente a partir do título e do tipo.
                </span>
              </div>
            )}

            <div style={styles.checkboxRow}>
              <input
                id="preview-mode"
                type="checkbox"
                checked={previewMode}
                onChange={event => setPreviewMode(event.target.checked)}
                style={styles.checkboxInput}
              />
              <label htmlFor="preview-mode" style={{ ...styles.helper, fontWeight: 600, cursor: 'pointer' }}>
                Marcar como envio de teste / homologação
              </label>
            </div>

            {previewMode && (
              <div style={styles.previewCard}>
                <strong>Importante:</strong> O campo "previewMode" será registrado nos metadados. Utilize-o para envios de teste
                antes da campanha principal.
              </div>
            )}

            {selectedPlanBadges.length > 0 && (
              <div style={styles.previewCard}>
                <strong>Planos selecionados:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {selectedPlanBadges.map(option => (
                    <span
                      key={option.value}
                      style={{
                        backgroundColor: option.color + '20',
                        color: option.color,
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        fontWeight: 600
                      }}
                    >
                      {option.emoji} {option.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(isSubmitting ? styles.submitButtonDisabled : {}),
                transform: isSubmitting ? 'scale(1)' : 'scale(1)'
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar notificação para os planos selecionados'}
            </button>

            {feedback.status !== 'idle' && (
              <div
                style={{
                  ...styles.feedback,
                  ...(feedback.status === 'success' ? styles.feedbackSuccess : styles.feedbackError)
                }}
              >
                {feedback.message}
              </div>
            )}
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionTitle}>
            <h2 style={styles.sectionTitleText}>3. Envio de e-mails</h2>
            <button type="button" style={styles.selectAllButton} onClick={handleEmailSelectAll}>
              {emailAllSelected ? 'Limpar seleção' : 'Selecionar todos'}
            </button>
          </div>

          <p style={styles.helper}>
            Crie um e-mail separado das notificações. Defina assunto e corpo do email que será enviado.
          </p>

          <div style={{ ...styles.planGrid, marginTop: '16px' }}>
            {PLAN_OPTIONS.map(option => {
              const isSelected = emailPlans.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleEmailPlan(option.value)}
                  style={{
                    ...styles.planCard,
                    ...(isSelected ? styles.planCardSelected : {})
                  }}
                >
                  <div style={styles.planBadge}>
                    <span role="img" aria-hidden="true">
                      {option.emoji}
                    </span>
                    <span style={{ color: option.color }}>{option.label}</span>
                  </div>
                  <p style={styles.planDescription}>{option.description}</p>
                  <div style={styles.checkboxRow}>
                    <input type="checkbox" readOnly checked={isSelected} style={styles.checkboxInput} />
                    <span style={{ color: isSelected ? '#2563eb' : '#94a3b8', fontWeight: 600 }}>
                      {isSelected ? 'Selecionado' : 'Selecionar plano'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <form style={{ ...styles.formGrid, marginTop: '24px' }} onSubmit={handleEmailSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="email-subject">
                Assunto do e-mail
              </label>
              <input
                id="email-subject"
                style={styles.input}
                value={emailBroadcastSubject}
                onChange={event => setEmailBroadcastSubject(event.target.value)}
                placeholder="Ex.: Atualização importante para sua assinatura"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="email-message">
                Corpo do e-mail
              </label>
              <textarea
                id="email-message"
                style={styles.textarea}
                value={emailMessage}
                onChange={event => setEmailMessage(event.target.value)}
                placeholder="Escreva aqui a mensagem completa do e-mail."
              />
              <span style={styles.helper}>
                Se quiser usar HTML, marque a opção abaixo. Caso contrário, as quebras de linha serão preservadas.
              </span>
            </div>

            <div style={styles.checkboxRow}>
              <input
                id="email-is-html"
                type="checkbox"
                checked={emailIsHtml}
                onChange={event => setEmailIsHtml(event.target.checked)}
                style={styles.checkboxInput}
              />
              <label htmlFor="email-is-html" style={{ ...styles.helper, fontWeight: 600, cursor: 'pointer' }}>
                Conteúdo em HTML
              </label>
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(isEmailSubmitting ? styles.submitButtonDisabled : {}),
                transform: isEmailSubmitting ? 'scale(1)' : 'scale(1)'
              }}
              disabled={isEmailSubmitting}
            >
              {isEmailSubmitting ? 'Enviando...' : 'Enviar e-mail para os planos selecionados'}
            </button>

            {emailFeedback.status !== 'idle' && (
              <div
                style={{
                  ...styles.feedback,
                  ...(emailFeedback.status === 'success' ? styles.feedbackSuccess : styles.feedbackError)
                }}
              >
                {emailFeedback.message}
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
