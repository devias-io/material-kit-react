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
  Divider,
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
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  ContentCopy,
  TrendingUp,
  Category,
  Refresh,
  FilterList,
  Save,
  Cancel
} from '@mui/icons-material';

// Tipos
interface ResponseTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
}

interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  totalUsage: number;
  mostUsedCategory: string;
  byCategory: Array<{ category: string; count: number; usage: number }>;
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

const initialTemplateState = {
  title: '',
  content: '',
  category: 'GERAL',
  isActive: true
};

export default function AdminTemplatesManager() {
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ResponseTemplate | null>(null);
  const [formData, setFormData] = useState(initialTemplateState);
  
  // Preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ResponseTemplate | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    category: '',
    isActive: ''
  });

  // Carregar dados
  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadTemplates(), loadStats()]);
    setLoading(false);
  };

  const loadTemplates = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.isActive) params.append('isActive', filters.isActive);

      const response = await fetch(`/api/response-templates?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      } else {
        setError('Erro ao carregar templates');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/response-templates/stats', {
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
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  // Criar/Editar template
  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Título e conteúdo são obrigatórios');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingTemplate
        ? `/api/response-templates/${editingTemplate.id}`
        : '/api/response-templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(editingTemplate ? 'Template atualizado!' : 'Template criado!');
        handleCloseModal();
        loadData();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao salvar template');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setSubmitting(false);
    }
  };

  // Deletar template
  const handleDelete = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const response = await fetch(`/api/response-templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('Template excluído!');
        loadData();
      } else {
        setError('Erro ao excluir template');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  // Alterar status ativo/inativo
  const handleToggleActive = async (template: ResponseTemplate) => {
    try {
      const response = await fetch(`/api/response-templates/${template.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !template.isActive })
      });

      if (response.ok) {
        setSuccess(`Template ${!template.isActive ? 'ativado' : 'desativado'}!`);
        loadData();
      }
    } catch (err) {
      setError('Erro ao alterar status');
    }
  };

  // Copiar template
  const handleCopy = (template: ResponseTemplate) => {
    setFormData({
      title: `${template.title} (Cópia)`,
      content: template.content,
      category: template.category,
      isActive: true
    });
    setEditingTemplate(null);
    setShowModal(true);
  };

  // Modal handlers
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData(initialTemplateState);
  };

  const handleEdit = (template: ResponseTemplate) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      content: template.content,
      category: template.category,
      isActive: template.isActive
    });
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Carregando templates...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gerenciar Templates de Respostas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Crie e gerencie templates para acelerar as respostas às dúvidas dos usuários
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

      {/* Estatísticas */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {stats.totalTemplates}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Templates
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {stats.activeTemplates}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Templates Ativos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {stats.totalUsage}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Usos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {categoryLabels[stats.mostUsedCategory] || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Categoria Mais Usada
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros e Ações */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterList sx={{ mr: 1 }} />
              <Typography variant="h6">Filtros</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={loadData} size="small">
                <Refresh />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowModal(true)}
              >
                Novo Template
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
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
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.isActive}
                  onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Ativos</MenuItem>
                  <MenuItem value="false">Inativos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Templates */}
      {templates.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" gutterBottom>
              Nenhum template encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Crie seu primeiro template para acelerar as respostas
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowModal(true)}
              sx={{ mt: 2 }}
            >
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Usos</TableCell>
                <TableCell>Criado por</TableCell>
                <TableCell>Data</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {template.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {template.content.length > 100 
                        ? `${template.content.substring(0, 100)}...`
                        : template.content
                      }
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={categoryLabels[template.category]} 
                      variant="outlined"
                      size="small"
                      icon={<Category />}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={template.isActive ? 'Ativo' : 'Inativo'}
                      color={template.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUp sx={{ mr: 0.5, fontSize: 16 }} />
                      {template.usageCount}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {template.creator.firstName} {template.creator.lastName}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="caption">
                      {formatDate(template.createdAt)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Visualizar">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setPreviewTemplate(template);
                            setShowPreview(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Editar">
                        <IconButton 
                          size="small"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Copiar">
                        <IconButton 
                          size="small"
                          onClick={() => handleCopy(template)}
                        >
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={template.isActive ? 'Desativar' : 'Ativar'}>
                        <IconButton 
                          size="small"
                          onClick={() => handleToggleActive(template)}
                        >
                          {template.isActive ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Excluir">
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => handleDelete(template.id)}
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

      {/* Modal Criar/Editar */}
      <Dialog 
        open={showModal} 
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTemplate ? 'Editar Template' : 'Novo Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Título do Template"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                fullWidth
                placeholder="Ex: Resposta sobre dividend yield"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Categoria"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Template ativo"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Conteúdo do Template"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                multiline
                rows={10}
                fullWidth
                placeholder="Digite o conteúdo do template aqui..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} startIcon={<Cancel />}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || !formData.title.trim() || !formData.content.trim()}
            startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Preview */}
      <Dialog 
        open={showPreview} 
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Preview do Template
        </DialogTitle>
        <DialogContent>
          {previewTemplate && (
            <>
              <Typography variant="h6" gutterBottom>
                {previewTemplate.title}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip 
                  label={categoryLabels[previewTemplate.category]} 
                  variant="outlined"
                  size="small"
                />
                <Chip 
                  label={previewTemplate.isActive ? 'Ativo' : 'Inativo'}
                  color={previewTemplate.isActive ? 'success' : 'default'}
                  size="small"
                />
                <Chip 
                  label={`${previewTemplate.usageCount} usos`}
                  variant="outlined"
                  size="small"
                />
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {previewTemplate.content}
                </Typography>
              </Paper>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Criado por: {previewTemplate.creator.firstName} {previewTemplate.creator.lastName}
                  <br />
                  Em: {formatDate(previewTemplate.createdAt)}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>
            Fechar
          </Button>
          {previewTemplate && (
            <Button 
              variant="contained"
              onClick={() => {
                setShowPreview(false);
                handleEdit(previewTemplate);
              }}
              startIcon={<Edit />}
            >
              Editar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}