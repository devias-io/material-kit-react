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
    if (!syncId) return;

    try {
      const response = await fetch(`/api/proventos/sync/${syncId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar status');
      }

      const status = await response.json();
      setData(status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar status:', err);
    }
  }, [syncId]);

  // Auto-refresh enquanto estiver em progresso
  useEffect(() => {
    if (!syncId || !autoRefresh) return;

    setLoading(true);
    buscarStatus().finally(() => setLoading(false));

    // Polling a cada 2 segundos
    const interval = setInterval(async () => {
      const status = await buscarStatus();

      // Parar polling se completou ou deu erro
      if (status && status.status !== 'EM_PROGRESSO') {
        clearInterval(interval);
        setLoading(false);
      }
    }, 2000);

    return () => clearInterval(interval);
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
