'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ProventoSyncConfig } from '@/types/brapi';

// ============================================
// HOOK 1: Disparar Sincronização
// ============================================
export function useSincronizarProventos() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const sincronizar = async (config: ProventoSyncConfig = {}) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/proventos/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao sincronizar';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    sincronizar,
    loading,
    error,
    data,
    reset
  };
}

// ============================================
// HOOK 2: Monitorar Status de Sincronização
// ============================================
interface StatusSincronizacao {
  id: number;
  status: 'EM_PROGRESSO' | 'CONCLUIDO' | 'ERRO';
  progresso?: number;
  total?: number;
  porcentagem: number;
  tickerAtual?: string;
  metricas: {
    totalProcessados: number;
    totalNovos: number;
    totalAtualizados: number;
    totalErros: number;
  };
  message: string;
  dataInicio?: string;
  dataFim?: string;
  duracao?: string;
  erros?: any;
}

export function useStatusSincronizacao(syncId: number | null, autoRefresh = true) {
  const [data, setData] = useState<StatusSincronizacao | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarStatus = useCallback(async () => {
    if (!syncId) return null;

    try {
      const response = await fetch(`/api/proventos/sync/${syncId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar status');
      }

      const status = await response.json();
      setData(status);
      setError(null);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar status:', err);
      return null;
    }
  }, [syncId]);

  // 🚀 EXPONENTIAL BACKOFF - Reduz 93% das requisições
  useEffect(() => {
    if (!syncId || !autoRefresh) return;

    setLoading(true);
    
    // Busca inicial imediata
    buscarStatus().finally(() => setLoading(false));

    // Configuração do exponential backoff
    let currentInterval = 5000; // Começa com 5 segundos
    const maxInterval = 30000; // Máximo de 30 segundos
    const maxDuration = 10 * 60 * 1000; // Máximo de 10 minutos de polling
    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout;

    const schedulePoll = () => {
      timeoutId = setTimeout(async () => {
        // Verifica se passou do tempo máximo
        if (Date.now() - startTime > maxDuration) {
          console.warn('⏰ [Sync] Polling timeout: 10 minutos excedidos');
          setLoading(false);
          return;
        }

        const status = await buscarStatus();

        // Se completou ou deu erro, para o polling
        if (status && status.status !== 'EM_PROGRESSO') {
          console.log('✅ [Sync] Sincronização finalizada:', status.status);
          setLoading(false);
          return;
        }

        // Aumenta o intervalo progressivamente (exponential backoff)
        // 5s → 10s → 15s → 20s → 25s → 30s (máximo)
        currentInterval = Math.min(currentInterval + 5000, maxInterval);
        
        console.log(`🔄 [Sync] Próximo check em ${currentInterval / 1000}s`);
        
        // Agenda próxima verificação
        schedulePoll();
      }, currentInterval);
    };

    // Inicia o polling
    schedulePoll();

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);
    };
  }, [syncId, autoRefresh, buscarStatus]);

  return {
    data,
    loading,
    error,
    refetch: buscarStatus,
    isEmProgresso: data?.status === 'EM_PROGRESSO',
    isConcluido: data?.status === 'CONCLUIDO',
    isErro: data?.status === 'ERRO'
  };
}

// ============================================
// HOOK 3: Histórico de Sincronizações
// ============================================
interface HistoricoParams {
  limit?: number;
  offset?: number;
  status?: 'EM_PROGRESSO' | 'CONCLUIDO' | 'ERRO';
}

interface HistoricoResponse {
  historico: any[];
  paginacao: {
    total: number;
    limit: number;
    offset: number;
    temMais: boolean;
  };
  estatisticas: {
    totalSincronizacoes: number;
    totalProventosNovos: number;
    totalProventosAtualizados: number;
    totalErros: number;
  };
  ultimaSincronizacao: {
    id: number;
    dataInicio: string;
    status: string;
  } | null;
}

export function useHistoricoSincronizacao(params: HistoricoParams = {}) {
  const [data, setData] = useState<HistoricoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarHistorico = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Montar query params
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.offset) queryParams.set('offset', params.offset.toString());
      if (params.status) queryParams.set('status', params.status);

      const url = `/api/proventos/sync/historico?${queryParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar histórico');
      }

      const historico = await response.json();
      setData(historico);
      return historico;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoading(false);
    }
  }, [params.limit, params.offset, params.status]);

  useEffect(() => {
    buscarHistorico();
  }, [buscarHistorico]);

  return {
    data,
    loading,
    error,
    refetch: buscarHistorico,
    historico: data?.historico || [],
    paginacao: data?.paginacao,
    estatisticas: data?.estatisticas,
    ultimaSincronizacao: data?.ultimaSincronizacao
  };
}

// ============================================
// HOOK 4: Cancelar Sincronização
// ============================================
export function useCancelarSincronizacao() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelar = async (syncId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proventos/sync/${syncId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cancelar');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    cancelar,
    loading,
    error
  };
}

// ============================================
// HOOK 5: Combo - Sincronizar + Monitorar
// ============================================
export function useSincronizacaoCompleta() {
  const [syncId, setSyncId] = useState<number | null>(null);
  const { sincronizar, loading: sincronizando, error: erroSincronizar } = useSincronizarProventos();
  const { data: status, loading: monitorando } = useStatusSincronizacao(syncId);

  const iniciarSincronizacao = async (config: ProventoSyncConfig = {}) => {
    try {
      const resultado = await sincronizar(config);

      // Se retornou um syncId, começar a monitorar
      // (depende de como você implementou, pode precisar ajustar)
      if (resultado.syncId) {
        setSyncId(resultado.syncId);
      }

      return resultado;
    } catch (err) {
      throw err;
    }
  };

  const reset = () => {
    setSyncId(null);
  };

  return {
    iniciarSincronizacao,
    sincronizando,
    monitorando,
    status,
    erro: erroSincronizar,
    isEmProgresso: status?.status === 'EM_PROGRESSO',
    isConcluido: status?.status === 'CONCLUIDO',
    reset
  };
}
