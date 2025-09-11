'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Badge,
  Button
} from '@mui/material';
import {
  Search,
  Close,
  ExpandMore,
  QuestionAnswer,
  Help,
  Star,
  Category,
  AccessTime
} from '@mui/icons-material';

interface SearchResult {
  id: string;
  type: 'question' | 'answer' | 'faq';
  title?: string;
  content: string;
  category: string;
  createdAt: string;
  rank: number;
  // Campos específicos por tipo
  questionTitle?: string;
  questionId?: string;
  faqTitle?: string;
  adminFirstName?: string;
  adminLastName?: string;
  firstName?: string;
  lastName?: string;
}

interface SearchComponentProps {
  isAdmin?: boolean;
  onResultClick?: (result: SearchResult) => void;
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

export default function SearchComponent({ isAdmin = false, onResultClick }: SearchComponentProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('ALL');
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [includeFaq, setIncludeFaq] = useState(true);
  const [stats, setStats] = useState<{
    totalQuestions: number;
    totalAnswers: number;
    totalFaqs: number;
  } | null>(null);

  // Função de busca
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setStats(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        category,
        includeAnswers: includeAnswers.toString(),
        includeFaq: includeFaq.toString(),
        limit: '20'
      });

      const response = await fetch(`/api/questions/search?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setStats(data.stats);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro na busca');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, category, includeAnswers, includeFaq]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'question': return <QuestionAnswer color="primary" />;
      case 'answer': return <Help color="secondary" />;
      case 'faq': return <Star color="warning" />;
      default: return <QuestionAnswer />;
    }
  };

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'question': return 'Pergunta';
      case 'answer': return 'Resposta';
      case 'faq': return 'FAQ';
      default: return 'Resultado';
    }
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} style={{ backgroundColor: '#ffeb3b', fontWeight: 'bold' }}>
          {part}
        </span>
      ) : part
    );
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
    setOpen(false);
  };

  return (
    <>
      {/* Botão de busca */}
      <Button
        variant="outlined"
        startIcon={<Search />}
        onClick={() => setOpen(true)}
        sx={{ minWidth: 200 }}
      >
        Buscar dúvidas...
      </Button>

      {/* Dialog de busca */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Busca Inteligente</Typography>
            <IconButton onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {/* Campo de busca */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Digite sua busca aqui... (ex: FIIs de papel, análise técnica)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              variant="outlined"
              autoFocus
            />
          </Box>

          {/* Filtros */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Categoria"
                >
                  <MenuItem value="ALL">Todas</MenuItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant={includeAnswers ? "contained" : "outlined"}
                size="small"
                onClick={() => setIncludeAnswers(!includeAnswers)}
              >
                Respostas
              </Button>

              <Button
                variant={includeFaq ? "contained" : "outlined"}
                size="small"
                onClick={() => setIncludeFaq(!includeFaq)}
              >
                FAQ
              </Button>
            </Stack>
          </Box>

          {/* Estatísticas */}
          {stats && (
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1}>
                <Chip label={`${stats.totalQuestions} perguntas`} size="small" />
                <Chip label={`${stats.totalAnswers} respostas`} size="small" />
                <Chip label={`${stats.totalFaqs} FAQs`} size="small" />
              </Stack>
            </Box>
          )}

          {/* Loading */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Resultados */}
          {results.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Resultados ({results.length})
              </Typography>
              
              {results.map((result, index) => (
                <Accordion key={`${result.type}-${result.id}-${index}`} sx={{ mb: 1 }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMore />}
                    onClick={() => handleResultClick(result)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      {getResultIcon(result.type)}
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1">
                          {highlightText(
                            result.faqTitle || result.title || result.questionTitle || 'Resultado',
                            query
                          )}
                        </Typography>
                        
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip 
                            label={getResultTypeLabel(result.type)}
                            size="small"
                            color={result.type === 'faq' ? 'warning' : 'default'}
                          />
                          <Chip 
                            label={categoryLabels[result.category]} 
                            variant="outlined"
                            size="small"
                            icon={<Category />}
                          />
                        </Stack>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <AccessTime sx={{ mr: 0.5, fontSize: 16 }} />
                        <Typography variant="caption">
                          {formatDate(result.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {highlightText(result.content, query)}
                    </Typography>
                    
                    {result.adminFirstName && (
                      <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Respondido por: {result.adminFirstName} {result.adminLastName}
                        </Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {/* Sem resultados */}
          {!loading && query.length >= 2 && results.length === 0 && !error && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Nenhum resultado encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tente usar termos diferentes ou mais específicos
              </Typography>
            </Box>
          )}

          {/* Instruções iniciais */}
          {!query.trim() && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Busque em suas dúvidas e FAQ
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Digite pelo menos 2 caracteres para começar a buscar
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}