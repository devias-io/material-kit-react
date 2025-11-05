// src/hooks/useFinancialData.ts
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface MarketData {
  ibovespa: { value: string; trend: 'up' | 'down'; diff: number };
  indiceSmall: { value: string; trend: 'up' | 'down'; diff: number };
  carteiraHoje: { value: string; trend: 'up' | 'down'; diff: number };
  dividendYield: { value: string; trend: 'up' | 'down'; diff: number };
  ibovespaPeriodo: { value: string; trend: 'up' | 'down'; diff: number };
  carteiraPeriodo: { value: string; trend: 'up' | 'down'; diff: number };
}

interface FinancialMarketDataResponse {
  marketData?: MarketData;
  metadata?: Record<string, any>;
  error?: string;
}

const FALLBACK_MARKET_DATA: MarketData = {
  ibovespa: { value: '136.787', trend: 'down', diff: -0.18 },
  indiceSmall: { value: '2.155', trend: 'up', diff: 0.47 },
  carteiraHoje: { value: '88.7%', trend: 'up', diff: 88.7 },
  dividendYield: { value: '7.4%', trend: 'up', diff: 7.4 },
  ibovespaPeriodo: { value: '6.1%', trend: 'up', diff: 6.1 },
  carteiraPeriodo: { value: '9.3%', trend: 'up', diff: 9.3 }
};

const QUERY_KEY = ['financial', 'market-data'];

async function fetchMarketData(): Promise<FinancialMarketDataResponse> {
  const response = await fetch('/api/financial/market-data', {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

interface UseFinancialDataReturn {
  marketData: MarketData | null;
  metadata: Record<string, any> | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isFetching: boolean;
}

export function useFinancialData(): UseFinancialDataReturn {
  const query = useQuery<FinancialMarketDataResponse>({
    queryKey: QUERY_KEY,
    queryFn: fetchMarketData,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData
  });

  const marketData = useMemo(() => {
    if (query.data?.marketData) {
      return query.data.marketData;
    }

    if (query.isError) {
      return FALLBACK_MARKET_DATA;
    }

    return null;
  }, [query.data?.marketData, query.isError]);

  const metadata = query.data?.metadata ?? null;

  const queryError = query.error instanceof Error ? query.error.message : query.error ? 'Erro desconhecido' : null;
  const apiError = query.data?.error ?? null;
  const error = queryError ?? (typeof apiError === 'string' ? apiError : null);

  return {
    marketData,
    metadata,
    loading: query.isPending,
    error,
    refetch: async () => {
      await query.refetch();
    },
    isFetching: query.isFetching
  };
}
