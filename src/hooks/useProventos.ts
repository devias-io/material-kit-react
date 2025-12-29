'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type ProventoTipo = 'DIVIDENDO' | 'JCP';
type ProventoOrigem = 'BRAPI' | 'CSV' | 'MANUAL';

type ProventoItem = {
  id: string;
  ticker: string;
  valor: number;
  tipo: ProventoTipo | string;
  dataObj?: string;
  dataCom?: string | null;
  dataPagamento?: string | null;
  origem?: ProventoOrigem | string | null;
  observacoes?: string | null;
};

type ProventoFilters = {
  ticker?: string;
  tipo?: ProventoTipo | '';
  origem?: ProventoOrigem | '';
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type EstatisticasProventos = {
  totalEmpresas: number;
  totalProventos: number;
  valorTotal: number;
  dataUltimoUpload: string;
};

const PAGE_SIZE = 20;

export function useProventos() {
  const [proventos, setProventos] = useState<ProventoItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<ProventoFilters>({});
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasProventos | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchProventos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(PAGE_SIZE));
      params.set('order', order);

      if (filters.ticker) params.set('ticker', filters.ticker);
      if (filters.tipo) params.set('tipo', filters.tipo);
      if (filters.origem) params.set('origem', filters.origem);

      const response = await fetch(`/api/proventos?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Erro ao buscar proventos');
      }

      const json = await response.json();
      setProventos(json.data || []);
      setPagination(json.pagination || pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters.origem, filters.ticker, filters.tipo, order, pagination.page]);

  const fetchEstatisticas = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await fetch('/api/proventos/estatisticas');
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas');
      }
      const json = await response.json();
      setEstatisticas(json);
    } catch (err) {
      console.error('Erro ao buscar estatísticas de proventos', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchProventos();
  }, [fetchProventos]);

  useEffect(() => {
    fetchEstatisticas();
  }, [fetchEstatisticas]);

  const applyFilters = useCallback((nextFilters: ProventoFilters) => {
    setFilters(nextFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
    setOrder('desc');
  }, []);

  const goToPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page: Math.max(page, 1) }));
  }, []);

  const toggleOrder = useCallback(() => {
    setOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const derived = useMemo(() => {
    const start = proventos.length === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
    const end = Math.min(pagination.page * pagination.pageSize, pagination.total);
    return { start, end };
  }, [pagination.page, pagination.pageSize, pagination.total, proventos.length]);

  return {
    proventos,
    pagination,
    filters,
    order,
    loading,
    error,
    estatisticas,
    loadingStats,
    applyFilters,
    clearFilters,
    goToPage,
    toggleOrder,
    setPage: goToPage,
    refetch: fetchProventos,
    refreshStats: fetchEstatisticas,
    range: derived,
    pageSize: PAGE_SIZE,
  };
}
