'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  Checkbox,
  Toolbar
} from '@mui/material';

// 🔄 IMPORTAR NOVOS HOOKS DA API
import { 
  useAgendaEstatisticas, 
  useAgendaUpload, 
  useAgendaExport 
} from '@/hooks/useAgendaAPI';
import { useAuthAccess } from '@/hooks/use-auth-access';

// Ícones Mock (mantendo consistência com o padrão atual)
const UploadIcon = () => <span>📤</span>;
const DownloadIcon = () => <span>📥</span>;
const DeleteIcon = () => <span>🗑️</span>;
const RefreshIcon = () => <span>🔄</span>;
const ViewIcon = () => <span>👁️</span>;
const ArrowLeftIcon = () => <span>←</span>;
const MoreVertIcon = () => <span>⋮</span>;
const EditIcon = () => <span>✏️</span>;

// 🆕 PARSER INTELIGENTE DE DATAS - ACEITA MÚLTIPLOS FORMATOS
const parseDataInteligente = (dataString: string): Date | null => {
  if (!dataString) return null;
  
  // Remover espaços e normalizar separadores
  const data = dataString.trim().replace(/\//g, '-').replace(/\./g, '-');
  
  const match = data.match(/^(\d{1,4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  
  const [, parte1, parte2, parte3] = match;
  let ano: number, mes: number, dia: number;
  
  // Detectar formato baseado nos valores
  if (parte1.length === 4) {
    // Começa com ano (4 dígitos)
    ano = parseInt(parte1);
    
    if (parseInt(parte2) > 12) {
      // YYYY-DD-MM (formato brasileiro adaptado)
      dia = parseInt(parte2);
      mes = parseInt(parte3);
    } else if (parseInt(parte3) > 12) {
      // YYYY-MM-DD (formato ISO)
      mes = parseInt(parte2);
      dia = parseInt(parte3);
    } else {
      // Ambos podem ser mês/dia, assumir YYYY-MM-DD como padrão
      mes = parseInt(parte2);
      dia = parseInt(parte3);
    }
  } else {
    // Não começa com ano - formato brasileiro DD-MM-YYYY
    dia = parseInt(parte1);
    mes = parseInt(parte2);
    ano = parseInt(parte3);
  }
  
  // Validar valores
  if (ano < 1900 || ano > 2100) return null;
  if (mes < 1 || mes > 12) return null;
  if (dia < 1 || dia > 31) return null;
  
  // Criar data com horário fixo para evitar problemas de timezone
  return new Date(ano, mes - 1, dia, 12, 0, 0);
};

// Configurações dos tipos de eventos
const TIPOS_EVENTO = {
  resultado: { icon: '📊', cor: '#3b82f6', label: 'Resultados' },
  dividendo: { icon: '💰', cor: '#22c55e', label: 'Dividendos' },
  rendimento: { icon: '💰', cor: '#f59e0b', label: 'Rendimentos' },
  assembleia: { icon: '🏛️', cor: '#8b5cf6', label: 'Assembleia' },
  conference_call: { icon: '📞', cor: '#06b6d4', label: 'Conference Call' },
  relatorio: { icon: '📄', cor: '#64748b', label: 'Relatório' },
  evento_especial: { icon: '⭐', cor: '#ec4899', label: 'Evento Especial' },
  fato_relevante: { icon: '⚠️', cor: '#ef4444', label: 'Fato Relevante' }
};

const STATUS_CONFIG = {
  confirmado: { cor: '#22c55e', label: 'Confirmado' },
  estimado: { cor: '#f59e0b', label: 'Estimado' },
  cancelado: { cor: '#ef4444', label: 'Cancelado' },
  adiado: { cor: '#8b5cf6', label: 'Adiado' }
};

interface EventoCorporativo {
  ticker: string;
  tipo_evento: string;
  titulo: string;
  data_evento: string;
  descricao: string;
  status: string;
  prioridade?: string;
  url_externo?: string;
  observacoes?: string;
  id?: string;
}

// Componente principal da página
export default function CentralAgendaPage() {
  const { hasAnalisesTrimesestraisAdminAccess, loading: authLoading, user } = useAuthAccess();
  const [tabAtual, setTabAtual] = useState(0);
  const [dialogLimpar, setDialogLimpar] = useState(false);
  const [etapaProcessamento, setEtapaProcessamento] = useState<string>('');
  
  // 🔄 USAR NOVOS HOOKS DA API
  const { 
    estatisticas, 
    loading: statsLoading, 
    carregarEstatisticas 
  } = useAgendaEstatisticas();
  
  const { 
    uploadEventos, 
    excluirEvento,
    excluirEventos,
    excluirPorTicker,
    limparTodos, 
    loading: uploadLoading, 
    progresso 
  } = useAgendaUpload();
  
  const { 
    exportarDados, 
    loading: exportLoading 
  } = useAgendaExport();

  // 🗑️ Estados para exclusão
  const [eventoParaExcluir, setEventoParaExcluir] = useState<number | null>(null);
  const [tickerParaExcluir, setTickerParaExcluir] = useState<string | null>(null);
  const [eventosSelecionados, setEventosSelecionados] = useState<number[]>([]);
  const [modoSelecao, setModoSelecao] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuEventoIndex, setMenuEventoIndex] = useState<number | null>(null);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // ✅ CARREGAR ESTATÍSTICAS AO MONTAR COMPONENTE
  useEffect(() => {
    carregarEstatisticas();
  }, [carregarEstatisticas]);

  // 🆕 PROCESSAR UPLOAD DE CSV COM PARSER INTELIGENTE E API
  const handleUploadCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    setEtapaProcessamento('Lendo arquivo...');
    await delay(300);

    try {
      const texto = await arquivo.text();
      const linhas = texto.split('\n').filter(linha => linha.trim());
      
      if (linhas.length < 2) {
        throw new Error('Arquivo CSV deve ter pelo menos cabeçalho e uma linha de dados');
      }

      const cabecalho = linhas[0].split(',').map(col => col.trim());
      console.log('Cabeçalho encontrado:', cabecalho);

      // Mapeamento de colunas flexível
      const mapeamentoColunas: { [key: string]: string } = {
        'tipo': 'tipo_evento',
        'tipo_evento': 'tipo_evento',
        'data': 'data_evento', 
        'data_evento': 'data_evento',
        'categoria': 'tipo_evento'
      };

      // Validar colunas obrigatórias com mapeamento flexível
      const colunasObrigatorias = ['ticker', 'titulo', 'descricao', 'status'];
      const colunasTipoEvento = ['tipo', 'tipo_evento', 'categoria'];
      const colunasDataEvento = ['data', 'data_evento'];

      const colunasFaltantes = colunasObrigatorias.filter(col => !cabecalho.includes(col));
      
      // Verificar se existe pelo menos uma coluna de tipo_evento
      const temTipoEvento = colunasTipoEvento.some(col => cabecalho.includes(col));
      if (!temTipoEvento) {
        colunasFaltantes.push('tipo_evento (ou tipo)');
      }

      // Verificar se existe pelo menos uma coluna de data_evento  
      const temDataEvento = colunasDataEvento.some(col => cabecalho.includes(col));
      if (!temDataEvento) {
        colunasFaltantes.push('data_evento (ou data)');
      }
      
      if (colunasFaltantes.length > 0) {
        throw new Error(`Colunas obrigatórias faltantes: ${colunasFaltantes.join(', ')}`);
      }

      setEtapaProcessamento(`Processando ${linhas.length - 1} linhas...`);

      // Processar dados
      const eventosNovos: EventoCorporativo[] = [];
      
      for (let i = 1; i < linhas.length; i++) {
        const valores = linhas[i].split(',').map(val => val.trim());
        
        if (valores.length < cabecalho.length) {
          console.warn(`Linha ${i + 1} incompleta, pulando...`);
          continue;
        }

        const evento: any = {};
        
        // Mapear colunas do CSV para o formato esperado
        cabecalho.forEach((coluna, index) => {
          const colunaDestino = mapeamentoColunas[coluna] || coluna;
          evento[colunaDestino] = valores[index] || '';
        });

        // Adicionar ID único
        evento.id = `${evento.ticker}-${evento.data_evento}-${i}`;

        // Validar dados obrigatórios
        if (!evento.ticker || !evento.data_evento || !evento.titulo) {
          console.warn(`Linha ${i + 1} com dados obrigatórios faltantes, pulando...`);
          continue;
        }

        // 🆕 VALIDAR DATA USANDO PARSER INTELIGENTE
        const dataEvento = parseDataInteligente(evento.data_evento);
        if (!dataEvento) {
          console.warn(`Linha ${i + 1} com data inválida: ${evento.data_evento}`);
          continue;
        }

        // Normalizar a data no formato ISO para armazenamento
        evento.data_evento = dataEvento.toISOString().split('T')[0]; // YYYY-MM-DD

        eventosNovos.push(evento as EventoCorporativo);
      }

      if (eventosNovos.length === 0) {
        throw new Error('Nenhum evento válido encontrado no arquivo');
      }

      setEtapaProcessamento('Enviando para servidor...');

      // 🚀 USAR API EM VEZ DE localStorage
      const resultado = await uploadEventos(eventosNovos, {
        nomeArquivo: arquivo.name,
        tamanhoArquivo: arquivo.size,
        totalLinhas: linhas.length,
        linhasProcessadas: eventosNovos.length
      });

      // ✅ RECARREGAR ESTATÍSTICAS
      await carregarEstatisticas();
      
      alert(`✅ ${eventosNovos.length} eventos carregados com sucesso!\n\nTickers processados: ${new Set(eventosNovos.map(e => e.ticker)).size}\n\n📅 Formatos de data aceitos: DD/MM/YYYY, YYYY-MM-DD, YYYY-DD-MM`);
      
    } catch (error) {
      console.error('Erro no upload:', error);
      alert(`❌ Erro ao processar arquivo:\n${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setEtapaProcessamento('');
      event.target.value = '';
    }
  };

  // ✅ EXPORTAR VIA API
  const handleExportarDados = async () => {
    try {
      await exportarDados();
      alert('Dados exportados com sucesso!');
    } catch (error) {
      alert('Erro ao exportar dados');
    }
  };

  // ✅ LIMPAR VIA API
  const handleLimparTudo = async () => {
    try {
      await limparTodos();
      await carregarEstatisticas();
      setEventosSelecionados([]);
      setModoSelecao(false);
      setDialogLimpar(false);
      alert('Dados removidos com sucesso.');
    } catch (error) {
      alert('Erro ao remover dados');
    }
  };

  // Download do template
  const downloadTemplate = () => {
    const template = `ticker,tipo_evento,titulo,data_evento,descricao,status,prioridade,url_externo,observacoes
VALE3,resultado,Resultados 1T25,2025-05-15,Divulgação dos resultados do primeiro trimestre,confirmado,alta,,
PETR4,dividendo,Ex-Dividendos,2025-06-10,Data ex-dividendos referente aos resultados,estimado,media,,
MALL11,rendimento,Rendimento Jun/25,2025-06-15,Distribuição mensal de rendimentos,confirmado,alta,,
HSML11,assembleia,AGO 2025,2025-04-28,Assembleia Geral de Cotistas,confirmado,alta,https://hsml11.com.br,
BTLG11,conference_call,Conference Call 1T25,2025-05-16,Apresentação dos resultados trimestrais,confirmado,media,,Às 16h00
VALE3,fato_relevante,Comunicado Importante,2025-07-01,Comunicado sobre operações especiais,estimado,baixa,,`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_agenda_corporativa.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🗑️ Funções de exclusão VIA API
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, index: number) => {
    setMenuAnchor(event.currentTarget);
    setMenuEventoIndex(index);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuEventoIndex(null);
  };

  const handleExcluirEvento = (index: number) => {
    setEventoParaExcluir(index);
    handleMenuClose();
  };

  const confirmarExclusaoEvento = async () => {
    if (eventoParaExcluir !== null) {
      try {
        await excluirEvento(eventoParaExcluir);
        await carregarEstatisticas();
        setEventoParaExcluir(null);
        alert('✅ Evento excluído com sucesso!');
      } catch (error) {
        alert('Erro ao excluir evento');
      }
    }
  };

  const handleExcluirTicker = (ticker: string) => {
    setTickerParaExcluir(ticker);
  };

  const confirmarExclusaoTicker = async () => {
    if (tickerParaExcluir) {
      try {
        const eventosDoTicker = estatisticas.eventos.filter(e => e.ticker === tickerParaExcluir).length;
        await excluirPorTicker(tickerParaExcluir);
        await carregarEstatisticas();
        setTickerParaExcluir(null);
        alert(`✅ ${eventosDoTicker} eventos do ticker ${tickerParaExcluir} excluídos!`);
      } catch (error) {
        alert('Erro ao excluir eventos do ticker');
      }
    }
  };

  const handleSelecionar = (index: number) => {
    setEventosSelecionados(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSelecionarTodos = () => {
    if (eventosSelecionados.length === estatisticas.eventos.length) {
      setEventosSelecionados([]);
    } else {
      setEventosSelecionados(estatisticas.eventos.map((_, index) => index));
    }
  };

  const excluirSelecionados = async () => {
    if (eventosSelecionados.length > 0) {
      try {
        await excluirEventos(eventosSelecionados);
        await carregarEstatisticas();
        setEventosSelecionados([]);
        setModoSelecao(false);
        alert(`✅ ${eventosSelecionados.length} eventos excluídos!`);
      } catch (error) {
        alert('Erro ao excluir eventos selecionados');
      }
    }
  };

  // Estatísticas por ticker VIA API
  const estatisticasPorTicker = React.useMemo(() => {
    const stats: { [ticker: string]: { total: number; proximos: number } } = {};
    const hoje = new Date();
    
    estatisticas.eventos.forEach(evento => {
      if (!stats[evento.ticker]) {
        stats[evento.ticker] = { total: 0, proximos: 0 };
      }
      stats[evento.ticker].total++;
      
      const dataEvento = new Date(evento.data_evento);
      const diffDays = Math.ceil((dataEvento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        stats[evento.ticker].proximos++;
      }
    });

    return Object.entries(stats)
      .map(([ticker, data]) => ({ ticker, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [estatisticas.eventos]);

  if (authLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2, color: '#3b82f6' }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
            Verificando permissões administrativas...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Central da Agenda Corporativa
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!hasAnalisesTrimesestraisAdminAccess()) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        p: 3
      }}>
        <Card sx={{ maxWidth: 600, textAlign: 'center', p: 6 }}>
          <Typography variant="h2" sx={{ fontSize: '64px', mb: 3 }}>
            📅
          </Typography>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            color: '#dc2626', 
            mb: 2 
          }}>
            Acesso Administrativo Negado
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
            A <strong>Central da Agenda Corporativa</strong> é uma área restrita a administradores do sistema. 
            Você não possui as permissões necessárias para gerenciar eventos corporativos.
          </Typography>
          <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Usuário:</strong> {user?.email || 'N/A'}<br/>
              <strong>Plano:</strong> {user?.plan || 'N/A'}<br/>
              <strong>Área solicitada:</strong> Agenda Corporativa (Admin)
            </Typography>
          </Alert>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="error"
              onClick={() => window.location.href = '/dashboard'}
              sx={{ px: 4 }}
            >
              Voltar ao Dashboard
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.history.back()}
              sx={{ px: 4 }}
            >
              Página Anterior
            </Button>
          </Stack>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            📅 Central da Agenda Corporativa (API)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sistema unificado sincronizado entre todos os dispositivos
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            startIcon={<ArrowLeftIcon />}
            onClick={() => window.history.back()}
            variant="outlined"
          >
            Voltar
          </Button>

          {/* ✅ INDICADOR DE STATUS DA API */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: '#10b981' 
            }} />
            <Typography sx={{ fontSize: '12px', color: '#64748b' }}>
              API Conectada
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={carregarEstatisticas}
            disabled={statsLoading}
          >
            {statsLoading ? 'Atualizando...' : 'Atualizar'}
          </Button>
          
          {estatisticas.totalEventos > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDialogLimpar(true)}
            >
              Limpar Tudo
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Cards de Estatísticas - AGORA VIA API */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                {statsLoading ? '...' : estatisticas.totalEventos}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de Eventos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#22c55e' }}>
                {statsLoading ? '...' : estatisticas.totalTickers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tickers Únicos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                {statsLoading ? '...' : estatisticas.proximos30Dias}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Próximos 30 Dias
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Última Atualização
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {statsLoading ? '...' : (estatisticas.dataUltimoUpload 
                  ? new Date(estatisticas.dataUltimoUpload).toLocaleDateString('pt-BR') 
                  : 'Nunca'
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Área de Upload - ATUALIZADA PARA API */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            📤 Importar Eventos
          </Typography>
          
          <Stack spacing={3}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>📋 Como usar:</strong><br/>
                1. Baixe o template CSV abaixo<br/>
                2. Preencha com os dados dos eventos corporativos<br/>
                3. Faça upload do arquivo preenchido<br/>
                4. Os dados aparecerão automaticamente nas páginas dos ativos<br/>
                <br/>
                <strong>✅ Dados serão sincronizados entre todos os dispositivos automaticamente</strong><br/>
                <strong>📅 Formatos de data aceitos:</strong> YYYY-MM-DD, DD/MM/YYYY, YYYY-DD-MM, DD.MM.YYYY
              </Typography>
            </Alert>

            <Stack direction="row" spacing={2} alignItems="center">
              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="upload-csv-agenda"
                type="file"
                onChange={handleUploadCSV}
                disabled={uploadLoading}
              />
              <label htmlFor="upload-csv-agenda">
                <Button
                  component="span"
                  variant="contained"
                  startIcon={uploadLoading ? <CircularProgress size={16} /> : <UploadIcon />}
                  disabled={uploadLoading}
                  size="large"
                >
                  {uploadLoading ? 'Processando...' : 'Upload CSV'}
                </Button>
              </label>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
                size="large"
              >
                Baixar Template
              </Button>

              <Button 
                variant="outlined"
                onClick={handleExportarDados} 
                startIcon={<DownloadIcon />}
                disabled={exportLoading}
              >
                {exportLoading ? 'Exportando...' : 'Exportar Dados'}
              </Button>
            </Stack>

            {uploadLoading && (
              <Box>
                <Typography sx={{ mb: 1, color: '#64748b', fontSize: '0.875rem' }}>
                  {etapaProcessamento}
                </Typography>
                <LinearProgress 
                  value={progresso} 
                  variant="determinate" 
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#3b82f6',
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs de Visualização */}
      {estatisticas.totalEventos > 0 && (
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabAtual} onChange={(_, newValue) => setTabAtual(newValue)}>
              <Tab label={`📊 Eventos (${estatisticas.totalEventos})`} />
              <Tab label={`🏢 Por Ticker (${estatisticas.totalTickers})`} />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 0 }}>
            {/* Tab 1: Lista de Eventos */}
            {tabAtual === 0 && (
              <>
                {/* 🗑️ Toolbar de ações */}
                <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                    <Button
                      size="small"
                      variant={modoSelecao ? "contained" : "outlined"}
                      onClick={() => {
                        setModoSelecao(!modoSelecao);
                        setEventosSelecionados([]);
                      }}
                    >
                      {modoSelecao ? 'Cancelar Seleção' : 'Selecionar Múltiplos'}
                    </Button>

                    {modoSelecao && (
                      <>
                        <Button
                          size="small"
                          onClick={handleSelecionarTodos}
                        >
                          {eventosSelecionados.length === estatisticas.eventos.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </Button>

                        {eventosSelecionados.length > 0 && (
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            startIcon={<DeleteIcon />}
                            onClick={excluirSelecionados}
                          >
                            Excluir Selecionados ({eventosSelecionados.length})
                          </Button>
                        )}
                      </>
                    )}
                  </Stack>
                </Toolbar>

                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {modoSelecao && <TableCell padding="checkbox">Sel.</TableCell>}
                        <TableCell>Ticker</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Título</TableCell>
                        <TableCell>Data</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {estatisticas.eventos
                        .sort((a, b) => new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime())
                        .map((evento, index) => {
                          const config = TIPOS_EVENTO[evento.tipo_evento as keyof typeof TIPOS_EVENTO] || 
                                       { icon: '📅', cor: '#64748b', label: evento.tipo_evento };
                          const statusConfig = STATUS_CONFIG[evento.status as keyof typeof STATUS_CONFIG] || 
                                              { cor: '#64748b', label: evento.status };
                          
                          return (
                            <TableRow key={index} hover>
                              {modoSelecao && (
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={eventosSelecionados.includes(index)}
                                    onChange={() => handleSelecionar(index)}
                                  />
                                </TableCell>
                              )}
                              <TableCell sx={{ fontWeight: 600 }}>
                                {evento.ticker}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  icon={<span>{config.icon}</span>}
                                  label={config.label}
                                  size="small"
                                  sx={{
                                    backgroundColor: config.cor,
                                    color: 'white',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {evento.titulo}
                                  </Typography>
                                  {evento.observacoes && (
                                    <Typography variant="caption" color="text.secondary">
                                      📝 {evento.observacoes}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {new Date(evento.data_evento).toLocaleDateString('pt-BR')}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={statusConfig.label}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    borderColor: statusConfig.cor,
                                    color: statusConfig.cor,
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </TableCell>

                              <TableCell align="center">
                                <Tooltip title="Mais opções">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleMenuClick(e, index)}
                                  >
                                    <MoreVertIcon />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Tab 2: Estatísticas por Ticker */}
            {tabAtual === 1 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  {estatisticasPorTicker.map(({ ticker, total, proximos }) => (
                    <Grid item xs={12} sm={6} md={4} key={ticker}>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {ticker}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={`${total} total`}
                                size="small"
                                color="primary"
                              />
                              {proximos > 0 && (
                                <Chip
                                  label={`${proximos} próximos`}
                                  size="small"
                                  color="warning"
                                />
                              )}
                              <Tooltip title="Excluir todos eventos deste ticker">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleExcluirTicker(ticker)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Menu de contexto para ações do evento */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuEventoIndex !== null && handleExcluirEvento(menuEventoIndex)}>
          <DeleteIcon /> &nbsp; Excluir Evento
        </MenuItem>
      </Menu>

      {/* Dialogs de Confirmação */}
      <Dialog 
        open={eventoParaExcluir !== null} 
        onClose={() => setEventoParaExcluir(null)}
      >
        <DialogTitle>🗑️ Excluir Evento</DialogTitle>
        <DialogContent>
          {eventoParaExcluir !== null && (
            <Typography>
              Tem certeza que deseja excluir o evento:
              <br/><br/>
              <strong>{estatisticas.eventos[eventoParaExcluir]?.titulo}</strong>
              <br/>
              <em>{estatisticas.eventos[eventoParaExcluir]?.ticker} - {new Date(estatisticas.eventos[eventoParaExcluir]?.data_evento).toLocaleDateString('pt-BR')}</em>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventoParaExcluir(null)}>
            Cancelar
          </Button>
          <Button
            color="error"
            onClick={confirmarExclusaoEvento}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={tickerParaExcluir !== null} 
        onClose={() => setTickerParaExcluir(null)}
      >
        <DialogTitle>🗑️ Excluir Todos Eventos do Ticker</DialogTitle>
        <DialogContent>
          {tickerParaExcluir && (
            <Typography>
              Tem certeza que deseja excluir todos os{' '}
              <strong>{estatisticas.eventos.filter(e => e.ticker === tickerParaExcluir).length} eventos</strong>{' '}
              do ticker <strong>{tickerParaExcluir}</strong>?
              <br/><br/>
              Esta ação não pode ser desfeita.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTickerParaExcluir(null)}>
            Cancelar
          </Button>
          <Button
            color="error"
            onClick={confirmarExclusaoTicker}
          >
            Excluir Todos
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogLimpar} onClose={() => setDialogLimpar(false)}>
        <DialogTitle>🗑️ Limpar Todos os Dados</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja limpar todos os {estatisticas.totalEventos} eventos carregados?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogLimpar(false)}>
            Cancelar
          </Button>
          <Button
            color="error"
            onClick={handleLimparTudo}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Estado vazio */}
      {estatisticas.totalEventos === 0 && !statsLoading && (
        <Paper sx={{ p: 6, textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            📭 Nenhum evento carregado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Faça upload de um arquivo CSV para começar a gerenciar os eventos corporativos
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={downloadTemplate}
          >
            Baixar Template
          </Button>
        </Paper>
      )}
    </Box>
  );
}