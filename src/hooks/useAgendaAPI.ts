// 📁 hooks/useAgendaAPI.ts - HOOKS PARA API DA AGENDA CORPORATIVA

import { useState, useCallback } from 'react';

// Interfaces
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

interface EstatisticasAgenda {
  totalEventos: number;
  totalTickers: number;
  proximos30Dias: number;
  dataUltimoUpload: string | null;
  eventos: EventoCorporativo[];
}

interface MetadataUpload {
  nomeArquivo: string;
  tamanhoArquivo: number;
  totalLinhas: number;
  linhasProcessadas: number;
}

// 📊 HOOK PARA CARREGAR ESTATÍSTICAS DA AGENDA
export const useAgendaEstatisticas = () => {
  const [estatisticas, setEstatisticas] = useState<EstatisticasAgenda>({
    totalEventos: 0,
    totalTickers: 0,
    proximos30Dias: 0,
    dataUltimoUpload: null,
    eventos: []
  });
  const [loading, setLoading] = useState(false);

  const carregarEstatisticas = useCallback(async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/agenda/estatisticas', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const dados = await response.json();
      
      // Calcular próximos 30 dias no frontend para otimização
      const hoje = new Date();
      const proximos30Dias = dados.eventos.filter((evento: EventoCorporativo) => {
        const dataEvento = new Date(evento.data_evento);
        const diffDays = Math.ceil((dataEvento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
      }).length;

      setEstatisticas({
        ...dados,
        proximos30Dias
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas da agenda:', error);
      // Em caso de erro, manter dados vazios
      setEstatisticas({
        totalEventos: 0,
        totalTickers: 0,
        proximos30Dias: 0,
        dataUltimoUpload: null,
        eventos: []
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    estatisticas,
    loading,
    carregarEstatisticas
  };
};

// 📤 HOOK PARA UPLOAD E MANIPULAÇÃO DE EVENTOS
export const useAgendaUpload = () => {
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);

  // Upload de novos eventos
  const uploadEventos = useCallback(async (
    eventos: EventoCorporativo[], 
    metadata: MetadataUpload
  ) => {
    setLoading(true);
    setProgresso(0);

    try {
      // Simular progresso para UX
      setProgresso(25);

      const response = await fetch('/api/agenda/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventos,
          metadata
        }),
      });

      setProgresso(75);

      if (!response.ok) {
        throw new Error(`Erro no upload: ${response.status}`);
      }

      const resultado = await response.json();
      setProgresso(100);

      return resultado;

    } catch (error) {
      console.error('Erro no upload de eventos:', error);
      throw error;
    } finally {
      setLoading(false);
      setProgresso(0);
    }
  }, []);

  // Excluir evento individual
  const excluirEvento = useCallback(async (eventoIndex: number) => {
    setLoading(true);

    try {
      const response = await fetch('/api/agenda/excluir-evento', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventoIndex }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao excluir evento: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir múltiplos eventos
  const excluirEventos = useCallback(async (indices: number[]) => {
    setLoading(true);

    try {
      const response = await fetch('/api/agenda/excluir-eventos', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ indices }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao excluir eventos: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Erro ao excluir eventos:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir todos eventos de um ticker
  const excluirPorTicker = useCallback(async (ticker: string) => {
    setLoading(true);

    try {
      const response = await fetch('/api/agenda/excluir-por-ticker', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao excluir eventos do ticker: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Erro ao excluir eventos do ticker:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Limpar todos os eventos
  const limparTodos = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/agenda/limpar-todos', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao limpar dados: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    uploadEventos,
    excluirEvento,
    excluirEventos,
    excluirPorTicker,
    limparTodos,
    loading,
    progresso
  };
};

// 📥 HOOK PARA EXPORTAÇÃO DE DADOS
export const useAgendaExport = () => {
  const [loading, setLoading] = useState(false);

  const exportarDados = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/agenda/exportar', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro na exportação: ${response.status}`);
      }

      // Receber o arquivo como blob
      const blob = await response.blob();
      
      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agenda_corporativa_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return { success: true };

    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    exportarDados,
    loading
  };
};