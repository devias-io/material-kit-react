'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Badge,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Tabs,
  Tab
} from '@mui/material';
import {
  ExpandMore,
  Reply,
  Close,
  CheckCircle,
  Schedule,
  Person,
  Category,
  Refresh,
  FilterList,
  Assignment,
  TrendingUp,
  ContentCopy,
  HelpOutline,
  Add,
  QuestionAnswer,
  Edit,
  Delete,
  DragIndicator
} from '@mui/icons-material';
import { useUser } from '@/hooks/use-user';

// Tipos (mesmo do arquivo anterior)
interface Question {
  id: string;
  title: string;
  content: string;
  category: string;
  status: 'NOVA' | 'RESPONDIDA' | 'FECHADA';
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
  faqTitle?: string;
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
    category: string;
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
    byCategory: Array<{ category: string; count: number }>;
    byPriority: Array<{ priority: string; count: number }>;
  };
}

interface ResponseTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
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

const statusLabels = {
  'NOVA': 'Nova',
  'RESPONDIDA': 'Respondida',
  'FECHADA': 'Fechada'
};

const planLabels = {
  'VIP': 'Close Friends VIP',
  'LITE': 'Close Friends LITE',
  'LITE_V2': 'Close Friends LITE 2.0',
  'RENDA_PASSIVA': 'Projeto Renda Passiva',
  'FIIS': 'Projeto FIIs',
  'AMERICA': 'Projeto América',
  'ADMIN': 'Administrador'
};

export default function AdminCentralDuvidas() {
  const { user } = useUser();
  // Estados principais
  const [currentTab, setCurrentTab] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para respostas
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Estados para templates
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  
  // Estados para FAQ
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [faqTitle, setFaqTitle] = useState('');
  const [faqOrder, setFaqOrder] = useState(0);

  const [editFaqModalOpen, setEditFaqModalOpen] = useState(false);
  const [faqToEdit, setFaqToEdit] = useState<FAQ | null>(null);
  const [editFaqTitle, setEditFaqTitle] = useState('');
  const [editFaqOrder, setEditFaqOrder] = useState(0);

  const [deleteFaqDialogOpen, setDeleteFaqDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);
  
  // Estados para criar FAQ
  const [showCreateFaqModal, setShowCreateFaqModal] = useState(false);
  const [createFaqData, setCreateFaqData] = useState({
    title: '',
    content: '',
    category: 'GERAL',
    faqOrder: 0
  });
  const [creatingFaq, setCreatingFaq] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: 'NOVA',
    category: ''
  });

  const [faqFilters, setFaqFilters] = useState({
    category: ''
  });

  // Carregar dados
  const loadData = async () => {
    if (currentTab === 0) {
      await Promise.all([loadQuestions(), loadStats()]);
    } else {
      await loadFAQs();
    }
  };

  const loadQuestions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      // IMPORTANTE: Filtrar apenas perguntas reais (não FAQs virtuais)
      params.append('excludeVirtual', 'true');

      const response = await fetch(`/api/questions?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
      } else {
        setError('Erro ao carregar perguntas');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/questions/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFAQs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (faqFilters.category) params.append('category', faqFilters.category);

      const response = await fetch(`/api/faq?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFaqs(data.faqs || []);
      } else {
        setError('Erro ao carregar FAQs');
      }
    } catch (err) {
      setError('Erro ao carregar FAQs');
    } finally {
      setLoading(false);
    }
  };

  // Criar FAQ direta (modificada para não criar pergunta virtual)
  const handleCreateFAQ = async () => {
    if (!createFaqData.title.trim() || !createFaqData.content.trim()) {
      setError('Título e conteúdo são obrigatórios');
      return;
    }

    setCreatingFaq(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? document.cookie.match(/auth-token=([^;]+)/)?.[1] ||
            localStorage.getItem('auth-token') ||
            ''
          : '';

      const response = await fetch('/api/faq/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.email ? { 'X-User-Email': user.email } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(createFaqData)
      });

      if (response.ok) {
        setSuccess('FAQ criada com sucesso!');
        setShowCreateFaqModal(false);
        setCreateFaqData({
          title: '',
          content: '',
          category: 'GERAL',
          faqOrder: 0
        });
        loadFAQs(); // Recarregar apenas FAQs
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

  // Todas as outras funções permanecem iguais...
  const loadTemplates = async (questionCategory?: string) => {
    setLoadingTemplates(true);
    try {
      const params = new URLSearchParams();
      params.append('isActive', 'true');
      if (questionCategory) {
        params.append('category', questionCategory);
      }

      const response = await fetch(`/api/response-templates?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
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
          'Content-Type': 'application/json'
        }
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isFaq: !selectedAnswer.isFaq,
          faqTitle: selectedAnswer.isFaq ? null : faqTitle,
          faqOrder: selectedAnswer.isFaq ? 0 : faqOrder
        })
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
    setEditFaqModalOpen(true);
  };

  const handleUpdateFaq = async () => {
    if (!faqToEdit) return;

    try {
      const response = await fetch(`/api/answers/${faqToEdit.id}/faq`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isFaq: true,
          faqTitle: editFaqTitle,
          faqOrder: editFaqOrder
        })
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
        credentials: 'include'
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

  useEffect(() => {
    loadData();
  }, [currentTab, filters, faqFilters]);

  const handleOpenResponseModal = (question: Question) => {
    setSelectedQuestion(question);
    setShowResponseModal(true);
    loadTemplates(question.category);
  };

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
    template.content.toLowerCase().includes(templateSearch.toLowerCase())
  );

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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: responseContent
        })
      });

      if (response.ok) {
        setSuccess('Resposta enviada com sucesso!');
        setShowResponseModal(false);
        setResponseContent('');
        setSelectedQuestion(null);
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

  const handleStatusChange = async (questionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setSuccess(`Status alterado para ${statusLabels[newStatus as keyof typeof statusLabels]}`);
        loadData();
      }
    } catch (err) {
      setError('Erro ao alterar status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'NOVA': return 'warning';
      case 'RESPONDIDA': return 'success';
      case 'FECHADA': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Carregando...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Central de Dúvidas - Admin
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie as dúvidas dos usuários e forneça respostas especializadas
        </Typography>
      </Box>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<QuestionAnswer />}
            label="Perguntas dos Usuários" 
            iconPosition="start"
          />
          <Tab 
            icon={<HelpOutline />}
            label="Gerenciar FAQs" 
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* Conteúdo da Aba 1: Perguntas dos Usuários */}
      {currentTab === 0 && (
        <>
          {/* Estatísticas */}
          {stats && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      {stats.overview.totalQuestions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total de Dúvidas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {stats.overview.pendingQuestions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aguardando Resposta
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {stats.overview.unreadQuestions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Não Lidas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {stats.overview.averageResponseTimeHours.toFixed(1)}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tempo Médio de Resposta
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Filtros */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterList sx={{ mr: 1 }} />
                <Typography variant="h6">Filtros</Typography>
                <Box sx={{ ml: 'auto' }}>
                  <IconButton onClick={loadData} size="small">
                    <Refresh />
                  </IconButton>
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      label="Status"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="NOVA">Nova</MenuItem>
                      <MenuItem value="RESPONDIDA">Respondida</MenuItem>
                      <MenuItem value="FECHADA">Fechada</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      label="Categoria"
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <MenuItem key={key} value={key}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Lista de perguntas */}
          {questions.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" gutterBottom>
                  Nenhuma dúvida encontrada
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tente ajustar os filtros ou aguarde novas perguntas dos usuários
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box>
              {questions.map((question) => (
                <Card key={question.id} sx={{ mb: 2, border: question.readByAdmin ? 1 : 2, borderColor: question.readByAdmin ? 'divider' : 'primary.main' }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {question.title}
                            {!question.readByAdmin && (
                              <Badge badgeContent="NOVA" color="primary" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                          
                          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Chip 
                              label={statusLabels[question.status]} 
                              color={getStatusColor(question.status)}
                              size="small"
                              icon={question.status === 'NOVA' ? <Schedule /> : <CheckCircle />}
                            />
                            <Chip 
                              label={categoryLabels[question.category as keyof typeof categoryLabels]} 
                              variant="outlined"
                              size="small"
                              icon={<Category />}
                            />
                          </Stack>

                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ mr: 0.5, fontSize: 16 }} />
                            {question.user.firstName} {question.user.lastName} ({planLabels[question.user.plan as keyof typeof planLabels] || question.user.plan})
                          </Typography>
                        </Box>
                        
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(question.createdAt)}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    
                    <AccordionDetails>
                      <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
                        {question.content}
                      </Typography>

                      {question.answers.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            Respostas ({question.answers.length})
                          </Typography>
                          
                          {question.answers.map((answer) => (
                            <Paper key={answer.id} sx={{ p: 2, mb: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2">
                                  {answer.admin.firstName} {answer.admin.lastName}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption">
                                    {formatDate(answer.createdAt)}
                                  </Typography>
                                  
                                  <Tooltip title={answer.isFaq ? "Remover das FAQs" : "Adicionar às FAQs"}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleMarkAsFAQ(answer, question.title)}
                                      sx={{ color: 'inherit' }}
                                    >
                                      <HelpOutline />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                              
                              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {answer.content}
                              </Typography>
                              
                              {answer.isFaq && (
                                <Chip 
                                  label="FAQ" 
                                  size="small" 
                                  color="secondary"
                                  sx={{ mt: 1 }}
                                />
                              )}
                            </Paper>
                          ))}
                        </Box>
                      )}

                      <Stack direction="row" spacing={2}>
                        {question.status === 'NOVA' && (
                          <Button
                            variant="contained"
                            startIcon={<Reply />}
                            onClick={() => handleOpenResponseModal(question)}
                          >
                            Responder
                          </Button>
                        )}
                        
                        {question.status !== 'FECHADA' && (
                          <Button
                            variant="outlined"
                            startIcon={<Close />}
                            onClick={() => handleStatusChange(question.id, 'FECHADA')}
                          >
                            Fechar
                          </Button>
                        )}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}

      {/* Conteúdo da Aba 2: Gerenciar FAQs */}
      {currentTab === 1 && (
        <>
          {/* Header da aba FAQs */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">
              Base de Conhecimento
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateFaqModal(true)}
            >
              Criar FAQ
            </Button>
          </Box>

          {/* Filtros FAQs */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterList sx={{ mr: 1 }} />
                <Typography variant="h6">Filtros</Typography>
                <Box sx={{ ml: 'auto' }}>
                  <IconButton onClick={loadData} size="small">
                    <Refresh />
                  </IconButton>
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      value={faqFilters.category}
                      onChange={(e) => setFaqFilters({ ...faqFilters, category: e.target.value })}
                      label="Categoria"
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <MenuItem key={key} value={key}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Lista de FAQs */}
          {faqs.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <HelpOutline sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Nenhuma FAQ encontrada
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Crie suas primeiras FAQs para formar uma base de conhecimento
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowCreateFaqModal(true)}
                >
                  Criar Primeira FAQ
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ordem</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Criado por</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {faqs.map((faq) => (
                    <TableRow key={faq.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DragIndicator sx={{ mr: 1, color: 'text.secondary' }} />
                          {faq.faqOrder}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="subtitle2">
                          {faq.faqTitle || faq.question.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {faq.content.length > 100 
                            ? `${faq.content.substring(0, 100)}...`
                            : faq.content
                          }
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={categoryLabels[faq.question.category as keyof typeof categoryLabels]} 
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {faq.admin.firstName} {faq.admin.lastName}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="caption">
                          {formatDate(faq.createdAt)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleEditFaq(faq)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Excluir">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteFaq(faq)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Modais (permanecem os mesmos) */}
      {/* Modal de Resposta */}
      <Dialog 
        open={showResponseModal} 
        onClose={() => setShowResponseModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Responder Dúvida</DialogTitle>
        <DialogContent>
          {selectedQuestion && (
            <>
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  {selectedQuestion.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Por: {selectedQuestion.user.firstName} {selectedQuestion.user.lastName}
                  <Chip 
                    label={categoryLabels[selectedQuestion.category as keyof typeof categoryLabels]} 
                    size="small" 
                    variant="outlined" 
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedQuestion.content}
                </Typography>
              </Paper>

              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Assignment />}
                  onClick={() => setShowTemplatesModal(true)}
                  size="small"
                >
                  Usar Template {templates.length > 0 && `(${templates.length} disponíveis)`}
                </Button>
              </Box>

              <TextField
                label="Sua resposta"
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                multiline
                rows={8}
                fullWidth
                placeholder="Digite sua resposta detalhada aqui ou use um template..."
                variant="outlined"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowResponseModal(false);
              setResponseContent('');
              setSelectedQuestion(null);
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitResponse}
            variant="contained"
            disabled={submitting || !responseContent.trim()}
            startIcon={submitting ? <CircularProgress size={20} /> : <Reply />}
          >
            {submitting ? 'Enviando...' : 'Enviar Resposta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Templates */}
      <Dialog 
        open={showTemplatesModal} 
        onClose={() => setShowTemplatesModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Selecionar Template
          {selectedQuestion && (
            <Typography variant="body2" color="text.secondary">
              Categoria: {categoryLabels[selectedQuestion.category as keyof typeof categoryLabels]}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Buscar templates"
            value={templateSearch}
            onChange={(e) => setTemplateSearch(e.target.value)}
            fullWidth
            placeholder="Digite para buscar por título ou conteúdo..."
            sx={{ mb: 2 }}
            size="small"
          />

          {loadingTemplates ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredTemplates.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {templates.length === 0 ? 'Nenhum template encontrado' : 'Nenhum template corresponde à busca'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {templates.length === 0 
                  ? 'Crie templates para esta categoria ou use templates gerais'
                  : 'Tente usar termos diferentes na busca'
                }
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredTemplates.map((template) => (
                <ListItem key={template.id} disablePadding>
                  <ListItemButton 
                    onClick={() => handleUseTemplate(template)}
                    sx={{ 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1, 
                      mb: 1,
                      '&:hover': {
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <ContentCopy />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle1">
                            {template.title}
                          </Typography>
                          <Chip 
                            label={categoryLabels[template.category as keyof typeof categoryLabels]} 
                            size="small" 
                            variant="outlined"
                          />
                          {template.usageCount > 0 && (
                            <Chip 
                              icon={<TrendingUp />}
                              label={`${template.usageCount} usos`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {template.content}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplatesModal(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de FAQ */}
      <Dialog 
        open={showFaqModal} 
        onClose={() => setShowFaqModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedAnswer?.isFaq ? 'Remover das FAQs' : 'Adicionar à Base de Conhecimento (FAQ)'}
        </DialogTitle>
        <DialogContent>
          {!selectedAnswer?.isFaq ? (
            <Box sx={{ pt: 1 }}>
              <TextField
                label="Título da FAQ"
                value={faqTitle}
                onChange={(e) => setFaqTitle(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                placeholder="Como será exibido na página de FAQ"
              />
              <TextField
                label="Ordem de exibição"
                type="number"
                value={faqOrder}
                onChange={(e) => setFaqOrder(Number(e.target.value))}
                fullWidth
                helperText="0 = primeiro, números maiores aparecem depois"
              />
            </Box>
          ) : (
            <Typography variant="body1">
              Tem certeza que deseja remover esta resposta das FAQs?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFaqModal(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={submitFAQ}
            variant="contained"
            color={selectedAnswer?.isFaq ? 'error' : 'primary'}
            disabled={!selectedAnswer?.isFaq && !faqTitle.trim()}
          >
            {selectedAnswer?.isFaq ? 'Remover das FAQs' : 'Adicionar às FAQs'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Editar FAQ */}
      <Dialog
        open={editFaqModalOpen}
        onClose={() => setEditFaqModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar FAQ</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Título da FAQ"
              value={editFaqTitle}
              onChange={(e) => setEditFaqTitle(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Ordem de exibição"
              type="number"
              value={editFaqOrder}
              onChange={(e) => setEditFaqOrder(Number(e.target.value))}
              fullWidth
              helperText="0 = primeiro, números maiores aparecem depois"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditFaqModalOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleUpdateFaq}
            variant="contained"
            disabled={!editFaqTitle.trim()}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmar Exclusão de FAQ */}
      <Dialog
        open={deleteFaqDialogOpen}
        onClose={() => setDeleteFaqDialogOpen(false)}
      >
        <DialogTitle>Excluir FAQ</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja excluir esta FAQ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFaqDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDeleteFaq} variant="contained" color="error">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Criar FAQ */}
      <Dialog
        open={showCreateFaqModal}
        onClose={() => setShowCreateFaqModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Criar Nova FAQ</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Título da FAQ"
                  value={createFaqData.title}
                  onChange={(e) => setCreateFaqData({ ...createFaqData, title: e.target.value })}
                  fullWidth
                  placeholder="Ex: Como calcular dividend yield?"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={createFaqData.category}
                    onChange={(e) => setCreateFaqData({ ...createFaqData, category: e.target.value })}
                    label="Categoria"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <MenuItem key={key} value={key}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Ordem de exibição"
                  type="number"
                  value={createFaqData.faqOrder}
                  onChange={(e) => setCreateFaqData({ ...createFaqData, faqOrder: Number(e.target.value) })}
                  fullWidth
                  helperText="0 = primeiro"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Conteúdo da FAQ"
                  value={createFaqData.content}
                  onChange={(e) => setCreateFaqData({ ...createFaqData, content: e.target.value })}
                  multiline
                  rows={8}
                  fullWidth
                  placeholder="Digite o conteúdo completo da resposta..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateFaqModal(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateFAQ}
            variant="contained"
            disabled={creatingFaq || !createFaqData.title.trim() || !createFaqData.content.trim()}
            startIcon={creatingFaq ? <CircularProgress size={20} /> : <Add />}
          >
            {creatingFaq ? 'Criando...' : 'Criar FAQ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}