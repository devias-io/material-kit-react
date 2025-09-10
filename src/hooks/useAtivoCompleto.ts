// hooks/useAtivoCompleto.ts
import { useQuery } from '@tanstack/react-query';

async function fetchAtivoCompleto(ticker: string) {
  const response = await fetch(`/api/ativo/${ticker}/completo`);
  if (!response.ok) {
    throw new Error('Falha ao buscar dados do ativo');
  }
  return response.json();
}

export function useAtivoCompleto(ticker: string) {
  return useQuery({
    queryKey: ['ativo-completo', ticker],
    queryFn: () => fetchAtivoCompleto(ticker),
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Não retry em erros 4xx
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      return failureCount < 2;
    }
  });
}