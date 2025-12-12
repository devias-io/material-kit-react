// src/hooks/useDataStore.tsx - VERSÃO CORRIGIDA - HEADERS + SIMPLIFICAÇÃO + FUNÇÕES FALTANTES
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { useAuthAccess } from '@/hooks/use-auth-access';
import { DEFAULT_CARTEIRAS_DATA } from '@/data/carteiras-default';
import {
  ALL_CARTEIRA_KEYS,
  CarteiraKey,
  createEmptyCarteirasData,
  resolveCarteirasPermitidas,
  sanitizeCarteirasData
} from '@/utils/carteira-access';
import { normalizeViesOverride, type ViesOverride } from '@/utils/vies';
import { buildQuotesUrl, getQuoteResults } from '@/utils/brapiProxy';

type AtivoComVies<T> = T & { viesOverride: ViesOverride };

const normalizarAtivo = <T extends { viesOverride?: ViesOverride | null }>(ativo: T): AtivoComVies<T> => ({
  ...ativo,
  viesOverride: normalizeViesOverride(ativo.viesOverride)
});

const normalizarCarteira = <T extends { viesOverride?: ViesOverride | null }>(ativos: T[] | undefined) => {
  if (!Array.isArray(ativos)) {
    return [] as AtivoComVies<T>[];
  }

  return ativos.map(normalizarAtivo) as AtivoComVies<T>[];
};

const normalizarDadosCarteiras = (dados: Record<string, any> | undefined) => {
  const resultado: Record<string, any[]> = {};

  ALL_CARTEIRA_KEYS.forEach(carteira => {
    resultado[carteira] = normalizarCarteira(dados?.[carteira]);
  });

  return resultado;
};

// 🎯 DADOS INICIAIS DAS CARTEIRAS (mantidos iguais)
const DADOS_INICIAIS_BASE = DEFAULT_CARTEIRAS_DATA;

const DADOS_INICIAIS = normalizarDadosCarteiras(DADOS_INICIAIS_BASE);

// 🎯 CONFIGURAÇÕES DAS CARTEIRAS (mantidas iguais)
const CARTEIRAS_CONFIG = {
  smallCaps: { 
    nome: 'Small Caps', 
    icon: '📈', 
    color: '#3b82f6',
    moeda: 'BRL',
    campos: ['ticker', 'setor', 'dataEntrada', 'precoEntrada', 'precoTeto'],
    suportaBDR: false
  },
  microCaps: { 
    nome: 'Micro Caps', 
    icon: '🔥', 
    color: '#10b981',
    moeda: 'BRL',
    campos: ['ticker', 'setor', 'dataEntrada', 'precoEntrada', 'precoTeto'],
    suportaBDR: false
  },
  dividendos: { 
    nome: 'Dividendos', 
    icon: '💰', 
    color: '#f59e0b',
    moeda: 'BRL',
    campos: ['ticker', 'setor', 'dataEntrada', 'precoEntrada', 'precoTeto'],
    suportaBDR: false
  },
  fiis: {
    nome: 'FIIs',
    icon: '🏢',
    color: '#8b5cf6',
    moeda: 'BRL',
    campos: ['ticker', 'setor', 'dataEntrada', 'precoEntrada', 'precoTeto'],
    suportaBDR: false
  },
  cfRendaTurbinada: {
    nome: 'CF Renda Turbinada',
    icon: '⚡',
    color: '#f97316',
    moeda: 'BRL',
    campos: ['ticker', 'setor', 'dataEntrada', 'precoEntrada', 'precoTeto'],
    suportaBDR: false
  },
  dividendosInternacional: {
    nome: 'Div. Internacional',
    icon: '🌎',
    color: '#ef4444',
    moeda: 'USD',
    campos: ['ticker', 'setor', 'dataEntrada', 'precoEntrada', 'precoTeto', 'precoTetoBDR'],
    suportaBDR: true
  },
  etfs: { 
    nome: 'ETFs', 
    icon: '📊', 
    color: '#06b6d4',
    moeda: 'USD',
    campos: ['ticker', 'setor', 'dataEntrada', 'precoEntrada'],
    suportaBDR: false
  },
  projetoAmerica: { 
    nome: 'Projeto América', 
    icon: '🇺🇸', 
    color: '#1e40af',
    moeda: 'USD',
    campos: ['ticker', 'setor', 'dataEntrada', 'precoEntrada', 'precoTeto', 'precoTetoBDR'],
    suportaBDR: true
  },
  exteriorStocks: { 
    nome: 'Exterior Stocks', 
    icon: '🌍', 
    color: '#059669',
    moeda: 'USD',
    campos: ['ticker', 'setor', 'dataEntrada', 'precoEntrada', 'precoTeto', 'precoTetoBDR'],
    suportaBDR: true
  }
};

const STORAGE_KEY = 'carteiras-dados';

// 🔥 API CORRIGIDA - HEADERS CORRETOS + ERROR HANDLING
const api = {
  getCarteira: async (carteira: string) => {
    try {
      if (typeof window === 'undefined') return [];
      
      console.log(`🔄 API: Buscando ${carteira}`);

      const response = await fetch(`/api/meus-ativos/${carteira}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn(`❌ API: Erro ${response.status} ao buscar ${carteira}`);
        return [];
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        console.log(`✅ API: ${carteira} retornou ${data.length} itens`);
        return normalizarCarteira(data);
      }

      console.log(`⚠️ API: resposta inesperada para ${carteira}`);
      return data;
    } catch (error) {
      console.error(`❌ API: Erro na requisição ${carteira}:`, error);
      return [];
    }
  },

  adicionarAtivo: async (carteira: string, dados: any) => {
    try {
      if (typeof window === 'undefined') throw new Error('Server-side não suportado');
      
      const response = await fetch(`/api/meus-ativos/${carteira}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result?.ativo) {
        return { ...result, ativo: normalizarAtivo(result.ativo) };
      }
      return result;
    } catch (error) {
      console.error('❌ API: Erro ao adicionar:', error);
      throw error;
    }
  },

  editarAtivo: async (carteira: string, id: string, dados: any) => {
    try {
      if (typeof window === 'undefined') throw new Error('Server-side não suportado');
      
      const response = await fetch(`/api/meus-ativos/${carteira}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, ...dados })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result?.ativo) {
        return { ...result, ativo: normalizarAtivo(result.ativo) };
      }
      return result;
    } catch (error) {
      console.error('❌ API: Erro ao editar:', error);
      throw error;
    }
  },

  removerAtivo: async (carteira: string, id: string) => {
    try {
      if (typeof window === 'undefined') throw new Error('Server-side não suportado');
      
      const response = await fetch(`/api/meus-ativos/${carteira}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (Array.isArray(result?.ativos)) {
        return { ...result, ativos: normalizarCarteira(result.ativos) };
      }
      return result;
    } catch (error) {
      console.error('❌ API: Erro ao remover:', error);
      throw error;
    }
  },

  reordenarAtivos: async (carteira: string, novosAtivos: any[]) => {
    try {
      if (typeof window === 'undefined') throw new Error('Server-side não suportado');

      const response = await fetch(`/api/meus-ativos/${carteira}/reorder`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ novosAtivos })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('❌ API: Erro ao reordenar:', error);
      throw error;
    }
  },

  atualizarViesOverride: async (ticker: string, carteira: string, viesOverride: ViesOverride) => {
    try {
      if (typeof window === 'undefined') throw new Error('Server-side não suportado');

      const response = await fetch(`/api/vies/${encodeURIComponent(ticker)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ carteira, viesOverride })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (Array.isArray(result?.ativosAtualizados)) {
        return {
          ...result,
          ativosAtualizados: normalizarCarteira(result.ativosAtualizados)
        };
      }

      if (result?.ativo) {
        return { ...result, ativo: normalizarAtivo(result.ativo) };
      }

      return result;
    } catch (error) {
      console.error('❌ API: Erro ao atualizar viés manual:', error);
      throw error;
    }
  }
};

// 🎯 CONTEXT DO STORE
const DataStoreContext = createContext<any>(null);

// 🎯 HOOK PRINCIPAL
export const useDataStore = () => {
  const context = useContext(DataStoreContext);
  
  if (!context) {
    throw new Error('useDataStore deve ser usado dentro do DataStoreProvider');
  }
  
  return context;
};

// 🎯 PROVIDER SIMPLIFICADO - CORRIGIDO PARA FUNCIONAR
export const DataStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const { planInfo } = useAuthAccess();
  const queryClient = useQueryClient();

  // 🔥 STATES SIMPLIFICADOS
  const [dados, setDados] = useState(() => createEmptyCarteirasData());
  const [cotacoes, setCotacoes] = useState<Record<string, number>>({});
  const [cotacaoUSD, setCotacaoUSD] = useState(5.85);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [modoSincronizacao, setModoSincronizacao] = useState<'localStorage' | 'banco' | 'hibrido'>('localStorage');
  
  // 🔥 REFS PARA CONTROLE
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);

  // 🔥 FUNÇÕES LOCALSTORAGE QUE ESTAVAM FALTANDO
  const lerDados = useCallback(() => {
    try {
      if (typeof window === 'undefined') return DADOS_INICIAIS;
      
      const dadosString = localStorage.getItem(STORAGE_KEY);
      if (!dadosString) {
        console.log('📁 Dados não encontrados, usando iniciais');
        return DADOS_INICIAIS;
      }
      
      const dadosParsed = JSON.parse(dadosString);
      console.log('✅ Dados carregados do localStorage');
      return normalizarDadosCarteiras(dadosParsed);
    } catch (error) {
      console.error('❌ Erro ao ler localStorage:', error);
      return DADOS_INICIAIS;
    }
  }, []);

  const salvarDados = useCallback((novosDados: any) => {
    try {
      if (typeof window === 'undefined') return false;
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novosDados));
      console.log('✅ Dados salvos no localStorage');
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar localStorage:', error);
      return false;
    }
  }, []);

  // 🔥 VERIFICAÇÃO DE AUTENTICAÇÃO SIMPLES
  const isAuthenticated = useMemo(() => {
    return !!user?.id;
  }, [user?.id]);

  const allowedCarteiras = useMemo(() => {
    if (!user?.id) {
      return new Set<CarteiraKey>(ALL_CARTEIRA_KEYS);
    }

    const pages = planInfo?.pages;
    if (!pages || pages.length === 0) {
      return new Set<CarteiraKey>();
    }

    return resolveCarteirasPermitidas(pages, { userPlan: user?.plan });
  }, [user?.id, user?.plan, planInfo?.pages]);

  const isCarteiraPermitida = useCallback(
    (carteira: string) => {
      if (!user?.id) return true;

      return allowedCarteiras.has(carteira as CarteiraKey);
    },
    [allowedCarteiras, user?.id]
  );

  useEffect(() => {
    if (!user?.id) return;

    setDados(prevDados => normalizarDadosCarteiras(sanitizeCarteirasData(prevDados, allowedCarteiras)));
  }, [allowedCarteiras, user?.id]);

  // 🔥 REACT QUERIES SIMPLIFICADAS COM ENABLED CORRETO
  const smallCapsQuery = useQuery({
    queryKey: ['carteira', 'smallCaps', user?.id],
    queryFn: () => api.getCarteira('smallCaps'),
    enabled: !!user?.id && isAuthenticated && isCarteiraPermitida('smallCaps'), // 🔥 REMOVIDO modoSincronizacao === 'hibrido'
    staleTime: 2 * 60 * 1000, // 🔥 REDUZIDO PARA 2min
    refetchOnWindowFocus: false,
    retry: 1
  });

  const microCapsQuery = useQuery({
    queryKey: ['carteira', 'microCaps', user?.id],
    queryFn: () => api.getCarteira('microCaps'),
    enabled: !!user?.id && isAuthenticated && isCarteiraPermitida('microCaps'),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  const dividendosQuery = useQuery({
    queryKey: ['carteira', 'dividendos', user?.id],
    queryFn: () => api.getCarteira('dividendos'),
    enabled:
      !!user?.id &&
      isAuthenticated &&
      modoSincronizacao === 'hibrido' &&
      isCarteiraPermitida('dividendos'),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  const fiisQuery = useQuery({
    queryKey: ['carteira', 'fiis', user?.id],
    queryFn: () => api.getCarteira('fiis'),
    enabled:
      !!user?.id &&
      isAuthenticated &&
      modoSincronizacao === 'hibrido' &&
      isCarteiraPermitida('fiis'),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  const cfRendaTurbinadaQuery = useQuery({
    queryKey: ['carteira', 'cfRendaTurbinada', user?.id],
    queryFn: () => api.getCarteira('cfRendaTurbinada'),
    enabled:
      !!user?.id &&
      isAuthenticated &&
      modoSincronizacao === 'hibrido' &&
      isCarteiraPermitida('cfRendaTurbinada'),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  const dividendosInternacionalQuery = useQuery({
    queryKey: ['carteira', 'dividendosInternacional', user?.id],
    queryFn: () => api.getCarteira('dividendosInternacional'),
    enabled:
      !!user?.id &&
      isAuthenticated &&
      modoSincronizacao === 'hibrido' &&
      isCarteiraPermitida('dividendosInternacional'),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  const etfsQuery = useQuery({
    queryKey: ['carteira', 'etfs', user?.id],
    queryFn: () => api.getCarteira('etfs'),
    enabled:
      !!user?.id &&
      isAuthenticated &&
      modoSincronizacao === 'hibrido' &&
      isCarteiraPermitida('etfs'),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  const projetoAmericaQuery = useQuery({
    queryKey: ['carteira', 'projetoAmerica', user?.id],
    queryFn: () => api.getCarteira('projetoAmerica'),
    enabled:
      !!user?.id &&
      isAuthenticated &&
      modoSincronizacao === 'hibrido' &&
      isCarteiraPermitida('projetoAmerica'),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  const exteriorStocksQuery = useQuery({
    queryKey: ['carteira', 'exteriorStocks', user?.id],
    queryFn: () => api.getCarteira('exteriorStocks'),
    enabled:
      !!user?.id &&
      isAuthenticated &&
      modoSincronizacao === 'hibrido' &&
      isCarteiraPermitida('exteriorStocks'),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // 🔥 OBJECT COM TODAS AS QUERIES
  const carteirasQueries = {
    smallCaps: smallCapsQuery,
    microCaps: microCapsQuery,
    dividendos: dividendosQuery,
    fiis: fiisQuery,
    cfRendaTurbinada: cfRendaTurbinadaQuery,
    dividendosInternacional: dividendosInternacionalQuery,
    etfs: etfsQuery,
    projetoAmerica: projetoAmericaQuery,
    exteriorStocks: exteriorStocksQuery
  };

  // 🔥 MUTATIONS SIMPLIFICADAS
  const adicionarMutation = useMutation({
    mutationFn: ({ carteira, dados }: { carteira: string, dados: any }) => 
      api.adicionarAtivo(carteira, dados),
    onSuccess: (_, { carteira }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['carteira', carteira, user?.id],
        exact: true
      });
    }
  });

  const editarMutation = useMutation({
    mutationFn: ({ carteira, id, dados }: { carteira: string, id: string, dados: any }) => 
      api.editarAtivo(carteira, id, dados),
    
    // 🔥 OPTIMISTIC UPDATE - Atualiza UI IMEDIATAMENTE
    onMutate: async ({ carteira, id, dados }) => {
      console.log(`🔄 OPTIMISTIC UPDATE: ${carteira} ID ${id}`);
      
      // 🔥 ATUALIZAR ESTADO LOCAL IMEDIATAMENTE
      setDados(prevDados => {
        const novosDados = {
          ...prevDados,
          [carteira]: normalizarCarteira(
            prevDados[carteira]?.map((item: any) =>
              item.id.toString() === id.toString()
                ? normalizarAtivo({ ...item, ...dados, editadoEm: new Date().toISOString() })
                : item
            )
          )
        };
        
        // Salvar localStorage se necessário
        if (modoSincronizacao === 'localStorage') {
          salvarDados(novosDados);
        }
        
        return novosDados;
      });

      // Cancelar queries para evitar conflito
      await queryClient.cancelQueries({ 
        queryKey: ['carteira', carteira, user?.id] 
      });

      // Backup para rollback
      const previousData = queryClient.getQueryData(['carteira', carteira, user?.id]);
      
      return { previousData, carteira, id };
    },
    
    // 🔥 SUCESSO - Garantir sincronização
    onSuccess: (result, { carteira, id }) => {
      console.log(`✅ EDIÇÃO SUCESSO: ${carteira} ID ${id}`);
      console.log('📡 Resultado API:', result);
      
      // 🔥 FORÇAR ATUALIZAÇÃO DO CACHE
      if (result?.ativo) {
        const ativoNormalizado = normalizarAtivo(result.ativo);
        // Atualizar cache React Query
        const currentData = queryClient.getQueryData(['carteira', carteira, user?.id]);
        if (Array.isArray(currentData)) {
          const updatedData = currentData.map((item: any) =>
            item.id.toString() === id.toString() ? ativoNormalizado : item
          );
          queryClient.setQueryData(['carteira', carteira, user?.id], updatedData);
        }

        // 🔥 FORÇAR ATUALIZAÇÃO DO ESTADO LOCAL TAMBÉM
        setDados(prevDados => ({
          ...prevDados,
          [carteira]: normalizarCarteira(
            prevDados[carteira]?.map((item: any) =>
              item.id.toString() === id.toString()
                ? normalizarAtivo({ ...ativoNormalizado, editadoEm: new Date().toISOString() })
                : item
            )
          )
        }));
      }
      
      // 🔥 INVALIDAR APÓS UM DELAY PARA GARANTIR
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['carteira', carteira, user?.id],
          refetchType: 'none'  // Não refetch, só marcar como stale
        });
      }, 500);
    },
    
    // 🔥 ERRO - Rollback
    onError: (error, { carteira, id }, context) => {
      console.error(`❌ ERRO EDIÇÃO ${carteira} ID ${id}:`, error);
      
      // Rollback do estado local
      if (context?.previousData) {
        queryClient.setQueryData(['carteira', carteira, user?.id], context.previousData);
      }
    }
  });

  const removerMutation = useMutation({
    mutationFn: ({ carteira, id }: { carteira: string, id: string }) => 
      api.removerAtivo(carteira, id),
    onSuccess: (_, { carteira }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['carteira', carteira, user?.id],
        exact: true
      });
    }
  });

  const reordenarMutation = useMutation({
    mutationFn: ({ carteira, novosAtivos }: { carteira: string, novosAtivos: any[] }) =>
      api.reordenarAtivos(carteira, novosAtivos),
    
    // 🔥 OPTIMISTIC UPDATE - Atualiza ordem IMEDIATAMENTE
    onMutate: async ({ carteira, novosAtivos }) => {
      console.log(`🔄 REORDENAÇÃO OPTIMISTIC: ${carteira}`, novosAtivos.length, 'ativos');

      // 🔥 ATUALIZAR ESTADO LOCAL IMEDIATAMENTE
      const ativosComOrdem = normalizarCarteira(
        novosAtivos.map((ativo, index) => ({
          ...ativo,
          ordem: index,
          editadoEm: new Date().toISOString()
        }))
      );

      setDados(prevDados => {
        const novosDados = {
          ...prevDados,
          [carteira]: ativosComOrdem
        };
        
        // Salvar localStorage se necessário
        if (modoSincronizacao === 'localStorage') {
          salvarDados(novosDados);
        }
        
        return novosDados;
      });

      // Cancelar queries
      await queryClient.cancelQueries({ 
        queryKey: ['carteira', carteira, user?.id] 
      });

      // Backup
      const previousData = queryClient.getQueryData(['carteira', carteira, user?.id]);

      // 🔥 ATUALIZAR CACHE IMEDIATAMENTE
      queryClient.setQueryData(['carteira', carteira, user?.id], ativosComOrdem);

      return { previousData, carteira };
    },

    // 🔥 SUCESSO
    onSuccess: (result, { carteira, novosAtivos }) => {
      console.log(`✅ REORDENAÇÃO SUCESSO: ${carteira}`);

      // 🔥 GARANTIR QUE ORDEM FOI SALVA
      const ativosComOrdem = normalizarCarteira(
        novosAtivos.map((ativo, index) => ({
          ...ativo,
          ordem: index,
          editadoEm: new Date().toISOString()
        }))
      );

      // Atualizar cache final
      queryClient.setQueryData(['carteira', carteira, user?.id], ativosComOrdem);

      // Atualizar estado local final
      setDados(prevDados => ({
        ...prevDados,
        [carteira]: ativosComOrdem
      }));
      
      console.log(`✅ Ordem final salva em ${carteira}:`, ativosComOrdem.map(a => a.ticker));
    },
    
    // 🔥 ERRO - Rollback
    onError: (err, { carteira }, context) => {
      console.error(`❌ ERRO REORDENAÇÃO ${carteira}:`, err);
      
      // Rollback completo
      if (context?.previousData) {
        const dadosRestaurados = normalizarCarteira(context.previousData as any[]);
        queryClient.setQueryData(['carteira', carteira, user?.id], dadosRestaurados);

        setDados(prevDados => ({
          ...prevDados,
          [carteira]: dadosRestaurados.length > 0 ? dadosRestaurados : prevDados[carteira]
        }));
      }
    }
  });

  const atualizarViesMutation = useMutation({
    mutationFn: ({ ticker, carteira, viesOverride }: { ticker: string; carteira: string; viesOverride: ViesOverride }) =>
      api.atualizarViesOverride(ticker, carteira, viesOverride),
    onMutate: async ({ ticker, carteira, viesOverride }) => {
      await queryClient.cancelQueries({
        queryKey: ['carteira', carteira, user?.id]
      });

      const previousQueryData = queryClient.getQueryData(['carteira', carteira, user?.id]);
      const previousState = dados[carteira];

      const overrideNormalizado = normalizeViesOverride(viesOverride);

      setDados(prevDados => ({
        ...prevDados,
        [carteira]: normalizarCarteira(
          prevDados[carteira]?.map((ativo: any) =>
            ativo.ticker === ticker
              ? normalizarAtivo({ ...ativo, viesOverride: overrideNormalizado, editadoEm: new Date().toISOString() })
              : ativo
          )
        )
      }));

      queryClient.setQueryData(['carteira', carteira, user?.id], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return normalizarCarteira(
          oldData.map((ativo: any) =>
            ativo.ticker === ticker
              ? normalizarAtivo({ ...ativo, viesOverride: overrideNormalizado, editadoEm: new Date().toISOString() })
              : ativo
          )
        );
      });

      return { previousQueryData, previousState };
    },
    onSuccess: (result, { ticker, carteira, viesOverride }) => {
      const overrideNormalizado = normalizeViesOverride(result?.viesOverride ?? viesOverride);

      if (Array.isArray(result?.ativosAtualizados)) {
        const ativosNormalizados = normalizarCarteira(result.ativosAtualizados);
        queryClient.setQueryData(['carteira', carteira, user?.id], ativosNormalizados);
        setDados(prevDados => ({
          ...prevDados,
          [carteira]: ativosNormalizados
        }));
        return;
      }

      if (result?.ativo) {
        const ativoNormalizado = normalizarAtivo({ ...result.ativo, viesOverride: overrideNormalizado });
        queryClient.setQueryData(['carteira', carteira, user?.id], (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return normalizarCarteira(
            oldData.map((ativo: any) =>
              ativo.ticker === ticker ? ativoNormalizado : ativo
            )
          );
        });

        setDados(prevDados => ({
          ...prevDados,
          [carteira]: normalizarCarteira(
            prevDados[carteira]?.map((ativo: any) =>
              ativo.ticker === ticker
                ? normalizarAtivo({ ...ativoNormalizado, editadoEm: new Date().toISOString() })
                : ativo
            )
          )
        }));
        return;
      }

      // Fallback para atualizar apenas pelo ticker
      queryClient.setQueryData(['carteira', carteira, user?.id], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return normalizarCarteira(
          oldData.map((ativo: any) =>
            ativo.ticker === ticker
              ? normalizarAtivo({ ...ativo, viesOverride: overrideNormalizado, editadoEm: new Date().toISOString() })
              : ativo
          )
        );
      });

      setDados(prevDados => ({
        ...prevDados,
        [carteira]: normalizarCarteira(
          prevDados[carteira]?.map((ativo: any) =>
            ativo.ticker === ticker
              ? normalizarAtivo({ ...ativo, viesOverride: overrideNormalizado, editadoEm: new Date().toISOString() })
              : ativo
          )
        )
      }));
    },
    onError: (_error, { carteira }, context) => {
      if (context?.previousQueryData) {
        queryClient.setQueryData(['carteira', carteira, user?.id], context.previousQueryData);
      }

      if (context?.previousState) {
        setDados(prevDados => ({
          ...prevDados,
          [carteira]: normalizarCarteira(context.previousState as any[])
        }));
      }
    }
  });

  // 🔥 INICIALIZAÇÃO SIMPLIFICADA
  useEffect(() => {
    if (isLoadingRef.current || typeof window === 'undefined') return;
    isLoadingRef.current = true;
    
    console.log('🚀 DataStore: Inicializando modo híbrido simples...');
    console.log('👤 User:', { id: user?.id, isAuthenticated });
    
    if (user?.id && isAuthenticated) {
      console.log('✅ Usuário autenticado - MODO HÍBRIDO');
      setModoSincronizacao('hibrido');
    } else {
      console.log('❌ Usuário não autenticado - MODO LOCALSTORAGE');
      setModoSincronizacao('localStorage');
      const dadosIniciais = lerDados();
      setDados(normalizarDadosCarteiras(dadosIniciais));
    }
    
    setIsInitialized(true);
    isLoadingRef.current = false;
  }, [user?.id, isAuthenticated, lerDados]);

  // 🔥 DADOS FINAIS SIMPLIFICADOS
  const dadosFinais = useMemo(() => {
    if (modoSincronizacao === 'localStorage' || !user?.id) {
      console.log('📁 Usando dados localStorage');
      return dados;
    }
    
    // 🔥 MODO HÍBRIDO MELHORADO
    const dadosCombinados = Object.keys(CARTEIRAS_CONFIG).reduce((acc, carteira) => {
      if (user?.id && !isCarteiraPermitida(carteira)) {
        acc[carteira] = [];
        return acc;
      }

      const query = carteirasQueries[carteira as keyof typeof carteirasQueries];
      const dadosBanco = Array.isArray(query?.data) ? query.data : [];
      const dadosLocal = Array.isArray(dados[carteira]) ? dados[carteira] : [];
      const dadosFallback = DADOS_INICIAIS[carteira] || [];

      const temMutacaoPendente =
        reordenarMutation.isPending ||
        adicionarMutation.isPending ||
        editarMutation.isPending ||
        removerMutation.isPending;

      const escolherFonte = () => {
        if (temMutacaoPendente) {
          console.log(`⏳ ${carteira}: Local (mutação pendente)`);
          return dadosLocal.length > 0 ? dadosLocal : dadosBanco.length > 0 ? dadosBanco : dadosFallback;
        }

        if (query?.isSuccess && dadosBanco.length > 0) {
          console.log(`✅ ${carteira}: Banco (${dadosBanco.length} itens)`);
          return dadosBanco;
        }

        if (dadosLocal.length > 0) {
          console.log(`📁 ${carteira}: Local (${dadosLocal.length} itens)`);
          return dadosLocal;
        }

        if (dadosBanco.length === 0 && query?.isSuccess) {
          console.log(`⚠️ ${carteira}: Banco vazio, usando fallback (${dadosFallback.length} itens)`);
        }

        return dadosFallback;
      };

      acc[carteira] = escolherFonte();
      return acc;
    }, {} as any);

    return dadosCombinados;
  }, [
    dados,
    carteirasQueries,
    modoSincronizacao,
    user?.id,
    isCarteiraPermitida,
    reordenarMutation.isPending,
    adicionarMutation.isPending,
    editarMutation.isPending,
    removerMutation.isPending
  ]);

  // 🔥 FUNÇÕES DE COTAÇÃO (mantidas iguais)
  const buscarCotacoes = useCallback(async (tickers: string[]) => {
    if (!tickers || tickers.length === 0) return {};
    
    try {
      setLoading(true);
      const response = await fetch(buildQuotesUrl(tickers));

      if (!response.ok) throw new Error('Erro na API');

      const data = await response.json();
      const novasCotacoes: Record<string, number> = {};

      getQuoteResults(data)?.forEach((item: any) => {
        novasCotacoes[item.symbol] = item.regularMarketPrice;
      });
      
      setCotacoes(prev => ({ ...prev, ...novasCotacoes }));
      return novasCotacoes;
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarCotacaoUSD = useCallback(async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.rates || !data.rates.BRL) {
        throw new Error('Taxa BRL não encontrada');
      }
      
      const cotacao = parseFloat(data.rates.BRL);
      setCotacaoUSD(cotacao);
      return cotacao;
    } catch (error) {
      console.error('Erro ao buscar USD/BRL:', error);
      return cotacaoUSD;
    }
  }, [cotacaoUSD]);

  // 🔥 FUNÇÃO obterCarteira
  const obterCarteira = useCallback((nomeCarteira: string) => {
    if (user?.id && !isCarteiraPermitida(nomeCarteira)) {
      return [];
    }

    const dadosCarteira = dadosFinais[nomeCarteira] || [];
    return dadosCarteira.map((item: any) => ({
      ...item,
      precoAtual: cotacoes[item.ticker] || null,
      isReal: !!cotacoes[item.ticker]
    }));
  }, [cotacoes, dadosFinais, isCarteiraPermitida, user?.id]);

  // 🔥 FUNÇÕES CRUD HÍBRIDAS CORRIGIDAS
  const adicionarAtivo = useCallback((carteira: string, novoAtivo: any) => {
    const id = `${carteira.slice(0,3)}${Date.now()}`;
    const ativoComId = normalizarAtivo({
      ...novoAtivo,
      id,
      criadoEm: new Date().toISOString(),
      editadoEm: new Date().toISOString()
    });

    // Salvar local imediatamente
    const novosDados = {
      ...dados,
      [carteira]: normalizarCarteira([...(dados[carteira] || []), ativoComId])
    };

    setDados(novosDados);
    
    if (modoSincronizacao === 'localStorage') {
      salvarDados(novosDados);
    } else if (user?.id && isAuthenticated) {
      // Sync com Prisma
      adicionarMutation.mutate({ carteira, dados: ativoComId });
    }

    if (novoAtivo.ticker) {
      buscarCotacoes([novoAtivo.ticker]);
    }
    
    return ativoComId;
  }, [dados, salvarDados, adicionarMutation, buscarCotacoes, modoSincronizacao, user?.id, isAuthenticated]);

  const editarAtivo = useCallback((carteira: string, id: string, dadosAtualizados: any) => {
    const novosDados = {
      ...dados,
      [carteira]: normalizarCarteira(
        dados[carteira]?.map((item: any) =>
          item.id === id
            ? normalizarAtivo({ ...item, ...dadosAtualizados, editadoEm: new Date().toISOString() })
            : item
        )
      )
    };

    setDados(novosDados);
    
    if (modoSincronizacao === 'localStorage') {
      salvarDados(novosDados);
    } else if (user?.id && isAuthenticated) {
      editarMutation.mutate({ carteira, id, dados: dadosAtualizados });
    }
    
    return novosDados[carteira].find((a: any) => a.id === id);
  }, [dados, salvarDados, editarMutation, modoSincronizacao, user?.id, isAuthenticated]);

  const removerAtivo = useCallback((carteira: string, ativoId: string) => {
    const novosDados = {
      ...dados,
      [carteira]: normalizarCarteira(dados[carteira]?.filter((ativo: any) => ativo.id !== ativoId))
    };

    setDados(novosDados);
    
    if (modoSincronizacao === 'localStorage') {
      salvarDados(novosDados);
    } else if (user?.id && isAuthenticated) {
      removerMutation.mutate({ carteira, id: ativoId });
    }
    
    return true;
  }, [dados, salvarDados, removerMutation, modoSincronizacao, user?.id, isAuthenticated]);

  const reordenarAtivos = useCallback((carteira: string, novosAtivos: any[]) => {
    console.log(`🔄 INICIANDO REORDENAÇÃO ${carteira}:`, novosAtivos.length, 'ativos');
    
    // 🔥 PREPARAR ATIVOS COM ORDEM EXPLÍCITA
    const ativosComOrdem = normalizarCarteira(
      novosAtivos.map((ativo, index) => ({
        ...ativo,
        ordem: index,
        editadoEm: new Date().toISOString()
      }))
    );

    console.log('📋 Nova ordem:', ativosComOrdem.map(a => `${a.ticker} (pos: ${a.ordem})`));

    // 🔥 MODO LOCALSTORAGE - Salvar imediatamente
    if (modoSincronizacao === 'localStorage') {
      const novosDados = {
        ...dados,
        [carteira]: ativosComOrdem
      };
      setDados(novosDados);
      salvarDados(novosDados);
      console.log(`✅ ${carteira} reordenado no localStorage`);
      return;
    }
    
    // 🔥 MODO HÍBRIDO - Usar mutation
    if (user?.id && isAuthenticated) {
      console.log(`🔄 Sincronizando ${carteira} com banco...`);
      reordenarMutation.mutate({ 
        carteira, 
        novosAtivos: ativosComOrdem 
      });
    } else {
      console.warn('⚠️ Não autenticado, salvando apenas local');
      const novosDados = {
        ...dados,
        [carteira]: ativosComOrdem
      };
      setDados(novosDados);
      salvarDados(novosDados);
    }
  }, [dados, setDados, salvarDados, reordenarMutation, modoSincronizacao, user?.id, isAuthenticated]);

  const atualizarViesOverride = useCallback(
    async ({ ticker, carteira, viesOverride }: { ticker: string; carteira: string; viesOverride: ViesOverride }) => {
      return atualizarViesMutation.mutateAsync({ ticker, carteira, viesOverride });
    },
    [atualizarViesMutation]
  );

  // 🔥 OUTRAS FUNÇÕES MANTIDAS
  const atualizarTodasCotacoes = useCallback(async () => {
    const todosTickers = Object.values(dadosFinais)
      .flat()
      .map((item: any) => item.ticker)
      .filter((ticker, index, arr) => arr.indexOf(ticker) === index && ticker);

    if (todosTickers.length > 0) {
      await buscarCotacoes(todosTickers);
    }
    
    await buscarCotacaoUSD();
  }, [dadosFinais, buscarCotacoes, buscarCotacaoUSD]);

  const converterUSDparaBRL = useCallback((carteira: string, cotacaoCustomizada = null) => {
    if (user?.id && !isCarteiraPermitida(carteira)) {
      return false;
    }

    const carteiraConfig = CARTEIRAS_CONFIG[carteira as keyof typeof CARTEIRAS_CONFIG];
    if (!carteiraConfig || !carteiraConfig.suportaBDR) {
      return false;
    }
    
    const cotacaoUsada = cotacaoCustomizada || cotacaoUSD;
    const ativosCarteira = dados[carteira] || [];
    const ativosParaConverter = ativosCarteira.filter((ativo: any) => 
      ativo.precoTeto && !ativo.precoTetoBDR
    );
    
    if (ativosParaConverter.length === 0) {
      return false;
    }
    
    const ativosAtualizados = normalizarCarteira(
      ativosCarteira.map((ativo: any) => {
        if (ativo.precoTeto && !ativo.precoTetoBDR) {
          return normalizarAtivo({
            ...ativo,
            precoTetoBDR: parseFloat((ativo.precoTeto * cotacaoUsada).toFixed(2)),
            editadoEm: new Date().toISOString()
          });
        }
        return normalizarAtivo(ativo);
      })
    );
    
    const novosDados = {
      ...dados,
      [carteira]: ativosAtualizados
    };
    
    setDados(novosDados);
    salvarDados(novosDados);
    
    return ativosParaConverter.length;
  }, [cotacaoUSD, dados, isCarteiraPermitida, salvarDados, user?.id]);

  const obterEstatisticas = useCallback(() => {
    const totalAtivos = Object.values(dadosFinais).reduce((acc: number, carteira: any) => 
      acc + (Array.isArray(carteira) ? carteira.length : 0), 0);
    
    const carteirasPorTamanho = Object.entries(dadosFinais)
      .map(([nome, carteira]: [string, any]) => ({ 
        nome, 
        count: Array.isArray(carteira) ? carteira.length : 0 
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalAtivos,
      totalCarteiras: Object.keys(dadosFinais).length,
      carteirasPorTamanho,
      modoSincronizacao,
      isAuthenticated,
      ultimaAtualizacao: new Date().toISOString()
    };
  }, [dadosFinais, modoSincronizacao, isAuthenticated]);

  const debug = useCallback(() => {
    const stats = obterEstatisticas();
    console.log('🔍 DataStore Debug:', {
      dados: dadosFinais,
      stats,
      modoSincronizacao,
      isAuthenticated,
      user: user?.id,
      cotacaoUSD,
      credenciais: {
        hasEmail: !!localStorage.getItem('user-email'),
        email: localStorage.getItem('user-email')
      }
    });
    return { dados: dadosFinais, stats, modoSincronizacao, isAuthenticated, user: user?.id, cotacaoUSD };
  }, [dadosFinais, obterEstatisticas, modoSincronizacao, isAuthenticated, user?.id, cotacaoUSD]);

  // 🔥 SETUP INICIAL CONTROLADO
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    
    buscarCotacaoUSD();
    
    // Timer controlado
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      buscarCotacaoUSD();
    }, 5 * 60 * 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isInitialized, buscarCotacaoUSD]);

  // 🔥 ADICIONAR debugReordenacao ANTES DO useEffect
  const debugReordenacao = useCallback((carteira: string) => {
    const query = carteirasQueries[carteira as keyof typeof carteirasQueries];
    
    console.log(`🔍 DEBUG REORDENAÇÃO ${carteira}:`, {
      estadoLocal: dados[carteira]?.length || 0,
      queryData: query?.data?.length || 0,
      queryStatus: query?.status,
      queryUpdatedAt: query?.dataUpdatedAt,
      mutationStatus: reordenarMutation.status,
      isPending: reordenarMutation.isPending,
      dadosFinaisCount: dadosFinais[carteira]?.length || 0
    });
    
    return {
      local: dados[carteira],
      query: query?.data,
      final: dadosFinais[carteira]
    };
  }, [dados, carteirasQueries, dadosFinais, reordenarMutation]);

  // 🔥 DEBUG GLOBAL
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      (window as any).debugDataStore = debug;
      (window as any).debugReordenacao = debugReordenacao; // 🔥 NOVO
      
      return () => {
        delete (window as any).debugDataStore;
        delete (window as any).debugReordenacao;
      };
    }
  }, [debug, debugReordenacao, isInitialized]);

  // 🔥 VALUE OBJECT ESTÁVEL
  const contextValue = useMemo(() => {
    if (!isInitialized) {
      return null;
    }

    const queriesArray = Object.values(carteirasQueries) as any[];

    return {
      // Dados
      dados: dadosFinais,
      cotacoes,
      cotacaoUSD,
      loading,
      isInitialized,
      modoSincronizacao,
      isAuthenticated,

      // Configurações
      CARTEIRAS_CONFIG,

      // Métodos
      setDados,
      obterCarteira,
      adicionarAtivo,
      editarAtivo,
      removerAtivo,
      reordenarAtivos,
      atualizarViesOverride,
      buscarCotacoes,
      buscarCotacaoUSD,
      atualizarTodasCotacoes,
      converterUSDparaBRL,
      obterEstatisticas,
      debug,
      debugReordenacao,
      isCarteiraPermitida,

      // Estados React Query
      isLoading: queriesArray.some((q: any) => q.isLoading),
      isError: queriesArray.some((q: any) => q.isError),
      isMutating:
        reordenarMutation.isPending ||
        adicionarMutation.isPending ||
        editarMutation.isPending ||
        removerMutation.isPending ||
        atualizarViesMutation.isPending // 🔥 NOVO
    };
  }, [
    dadosFinais,
    cotacoes,
    cotacaoUSD,
    loading,
    isInitialized,
    modoSincronizacao,
    isAuthenticated,
    CARTEIRAS_CONFIG,
    setDados,
    obterCarteira,
    adicionarAtivo,
    editarAtivo,
    removerAtivo,
    reordenarAtivos,
    atualizarViesOverride,
    buscarCotacoes,
    buscarCotacaoUSD,
    atualizarTodasCotacoes,
    converterUSDparaBRL,
    obterEstatisticas,
    debug,
    debugReordenacao,
    isCarteiraPermitida,
    carteirasQueries,
    reordenarMutation.isPending,
    adicionarMutation.isPending,
    editarMutation.isPending,
    removerMutation.isPending,
    atualizarViesMutation.isPending
  ]);

  return (
    <DataStoreContext.Provider value={contextValue}>
      {children}
    </DataStoreContext.Provider>
  );
};

// 🎯 HOOKS ESPECÍFICOS (mantidos iguais)
export const useSmallCaps = () => {
  const { obterCarteira } = useDataStore();
  return obterCarteira('smallCaps');
};

export const useMicroCaps = () => {
  const { obterCarteira } = useDataStore();
  return obterCarteira('microCaps');
};

export const useDividendos = () => {
  const { obterCarteira } = useDataStore();
  return obterCarteira('dividendos');
};

export const useFiis = () => {
  const { obterCarteira } = useDataStore();
  return obterCarteira('fiis');
};

export const useDividendosInternacional = () => {
  const { obterCarteira } = useDataStore();
  return obterCarteira('dividendosInternacional');
};

export const useETFs = () => {
  const { obterCarteira } = useDataStore();
  return obterCarteira('etfs');
};

export const useProjetoAmerica = () => {
  const { obterCarteira } = useDataStore();
  return obterCarteira('projetoAmerica');
};

export const useExteriorStocks = () => {
  const { obterCarteira } = useDataStore();
  return obterCarteira('exteriorStocks');
};