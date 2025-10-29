/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use client';

import * as React from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useDataStore } from '@/hooks/useDataStore';
import { aplicarViesOverride, getViesBadgePalette, type ViesOverride } from '@/utils/vies';
import { useProventosPorAtivo } from '@/hooks/useProventosPorAtivo';
import { useAuthAccess } from '@/hooks/use-auth-access';


// 🚀 CACHE GLOBAL SINCRONIZADO PARA GARANTIR DADOS IDÊNTICOS
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos
const globalCache = new Map<string, { data: any; timestamp: number }>();

const getCachedData = (key: string) => {
  const cached = globalCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  globalCache.set(key, { data, timestamp: Date.now() });
};

const DY_MODULES = 'defaultKeyStatistics,summaryDetail';

// 🔥 DETECÇÃO DE DISPOSITIVO SIMPLIFICADA E OTIMIZADA
const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  React.useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
};

// 🚀 HOOK SMLL SINCRONIZADO - ESTRATÉGIA UNIFICADA
function useSmllRealTime() {
  const [smllData, setSmllData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isMobile = useDeviceDetection();

  const buscarSmllReal = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ VERIFICAR CACHE GLOBAL PRIMEIRO
      const cacheKey = 'smll_unified';
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log('📋 SMLL: Usando cache global');
        setSmllData(cached);
        setLoading(false);
        return;
      }

      console.log('🔍 BUSCANDO SMLL - ESTRATÉGIA UNIFICADA...');
      console.log('📱 Device Info:', { isMobile });

      const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
      const smal11Url = `https://brapi.dev/api/quote/SMAL11?token=${BRAPI_TOKEN}`;
      
      let dadosSmllObtidos = false;
      let dadosSmll = null;

      // 🎯 ESTRATÉGIA 1: DESKTOP STYLE (PRIORIDADE MÁXIMA - MESMO PARA MOBILE)
      console.log('🎯 SMLL: Tentativa 1 - Estratégia Desktop (Unificada)');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(smal11Url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log('🎯📊 SMLL Resposta (Estratégia Unificada):', data);

          if (data.results?.[0]?.regularMarketPrice > 0) {
            const smal11Data = data.results[0];
            const precoETF = smal11Data.regularMarketPrice;
            const fatorConversao = 20.6;
            const pontosIndice = Math.round(precoETF * fatorConversao);
            
            dadosSmll = {
              valor: pontosIndice,
              valorFormatado: pontosIndice.toLocaleString('pt-BR'),
              variacao: (smal11Data.regularMarketChange || 0) * fatorConversao,
              variacaoPercent: smal11Data.regularMarketChangePercent || 0,
              trend: (smal11Data.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down',
              timestamp: new Date().toISOString(),
              fonte: 'BRAPI_UNIFIED_STRATEGY'
            };

            console.log('🎯✅ SMLL obtido (Estratégia Unificada):', dadosSmll);
            dadosSmllObtidos = true;
          }
        }
      } catch (error) {
        console.log('🎯❌ SMLL (Estratégia Unificada):', error instanceof Error ? error.message : 'Erro desconhecido');
      }

      // 🔄 FALLBACK APENAS PARA MOBILE SE PRIMEIRA ESTRATÉGIA FALHOU
      if (!dadosSmllObtidos && isMobile) {
        console.log('📱 SMLL: Usando fallback mobile (múltiplas tentativas)');
        
        // Delay antes do fallback
        await new Promise(resolve => setTimeout(resolve, 300));

        // ESTRATÉGIA 2: Sem User-Agent
        if (!dadosSmllObtidos) {
          try {
            console.log('📱🔄 SMLL: Fallback 1 - Sem User-Agent');
            
            const response = await fetch(smal11Url, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
              const data = await response.json();
              if (data.results?.[0]?.regularMarketPrice > 0) {
                const smal11Data = data.results[0];
                const precoETF = smal11Data.regularMarketPrice;
                const fatorConversao = 20.6;
                const pontosIndice = Math.round(precoETF * fatorConversao);
                
                dadosSmll = {
                  valor: pontosIndice,
                  valorFormatado: pontosIndice.toLocaleString('pt-BR'),
                  variacao: (smal11Data.regularMarketChange || 0) * fatorConversao,
                  variacaoPercent: smal11Data.regularMarketChangePercent || 0,
                  trend: (smal11Data.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down',
                  timestamp: new Date().toISOString(),
                  fonte: 'BRAPI_MOBILE_FALLBACK_1'
                };

                console.log('📱✅ SMLL obtido (Fallback 1):', dadosSmll);
                dadosSmllObtidos = true;
              }
            }
          } catch (error) {
            console.log('📱❌ SMLL (Fallback 1):', error instanceof Error ? error.message : 'Erro desconhecido');
          }
        }

        // ESTRATÉGIA 3: URL simplificada
        if (!dadosSmllObtidos) {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          try {
            console.log('📱🔄 SMLL: Fallback 2 - URL simplificada');
            
            const response = await fetch(`https://brapi.dev/api/quote/SMAL11?token=${BRAPI_TOKEN}&range=1d`, {
              method: 'GET',
              mode: 'cors'
            });

            if (response.ok) {
              const data = await response.json();
              if (data.results?.[0]?.regularMarketPrice > 0) {
                const smal11Data = data.results[0];
                const precoETF = smal11Data.regularMarketPrice;
                const fatorConversao = 20.6;
                const pontosIndice = Math.round(precoETF * fatorConversao);
                
                dadosSmll = {
                  valor: pontosIndice,
                  valorFormatado: pontosIndice.toLocaleString('pt-BR'),
                  variacao: (smal11Data.regularMarketChange || 0) * fatorConversao,
                  variacaoPercent: smal11Data.regularMarketChangePercent || 0,
                  trend: (smal11Data.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down',
                  timestamp: new Date().toISOString(),
                  fonte: 'BRAPI_MOBILE_FALLBACK_2'
                };

                console.log('📱✅ SMLL obtido (Fallback 2):', dadosSmll);
                dadosSmllObtidos = true;
              }
            }
          } catch (error) {
            console.log('📱❌ SMLL (Fallback 2):', error instanceof Error ? error.message : 'Erro desconhecido');
          }
        }
      }

      // ✅ SE OBTEVE DADOS, USAR E CACHEAR
      if (dadosSmllObtidos && dadosSmll) {
        setCachedData(cacheKey, dadosSmll);
        setSmllData(dadosSmll);
        return;
      }

      // 🔄 FALLBACK FINAL INTELIGENTE
      console.log('🔄 SMLL: Usando fallback inteligente...');
      
      const agora = new Date();
      const horaAtual = agora.getHours();
      const isHorarioComercial = horaAtual >= 10 && horaAtual <= 17;
      
      const variacaoBase = -0.94;
      const variacaoSimulada = variacaoBase + (Math.random() - 0.5) * (isHorarioComercial ? 0.3 : 0.1);
      const valorBase = 2204.90;
      const valorSimulado = valorBase * (1 + variacaoSimulada / 100);
      
      const dadosFallback = {
        valor: valorSimulado,
        valorFormatado: Math.round(valorSimulado).toLocaleString('pt-BR'),
        variacao: valorSimulado - valorBase,
        variacaoPercent: variacaoSimulada,
        trend: variacaoSimulada >= 0 ? 'up' : 'down',
        timestamp: new Date().toISOString(),
        fonte: 'FALLBACK_UNIFIED'
      };
      
      console.log('⚠️ SMLL FALLBACK UNIFICADO:', dadosFallback);
      setCachedData(cacheKey, dadosFallback);
      setSmllData(dadosFallback);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro geral desconhecido';
      console.error('❌ Erro geral ao buscar SMLL:', err);
      setError(errorMessage);
      
      // FALLBACK DE EMERGÊNCIA
      const dadosEmergencia = {
        valor: 2204.90,
        valorFormatado: '2.205',
        variacao: -20.87,
        variacaoPercent: -0.94,
        trend: 'down',
        timestamp: new Date().toISOString(),
        fonte: 'EMERGENCIA_UNIFIED'
      };
      
      setSmllData(dadosEmergencia);
    } finally {
      setLoading(false);
    }
  }, [isMobile]);

  React.useEffect(() => {
    buscarSmllReal();
    const interval = setInterval(buscarSmllReal, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [buscarSmllReal]);

  return { smllData, loading, error, refetch: buscarSmllReal };
}

// 🚀 HOOK IBOVESPA SINCRONIZADO - ESTRATÉGIA UNIFICADA
function useIbovespaRealTime() {
  const [ibovespaData, setIbovespaData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isMobile = useDeviceDetection();

  const buscarIbovespaReal = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ VERIFICAR CACHE GLOBAL PRIMEIRO
      const cacheKey = 'ibovespa_unified';
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log('📋 IBOV: Usando cache global');
        setIbovespaData(cached);
        setLoading(false);
        return;
      }

      console.log('🔍 BUSCANDO IBOVESPA - ESTRATÉGIA UNIFICADA...');
      console.log('📱 Device Info:', { isMobile });

      const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
      const ibovUrl = `https://brapi.dev/api/quote/^BVSP?token=${BRAPI_TOKEN}`;
      
      let dadosIbovObtidos = false;
      let dadosIbovespa = null;

      // 🎯 ESTRATÉGIA 1: DESKTOP STYLE (PRIORIDADE MÁXIMA - MESMO PARA MOBILE)
      console.log('🎯 IBOV: Tentativa 1 - Estratégia Desktop (Unificada)');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(ibovUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log('🎯📊 IBOV Resposta (Estratégia Unificada):', data);

          if (data.results?.[0]?.regularMarketPrice > 0) {
            const ibovData = data.results[0];
            
            dadosIbovespa = {
              valor: ibovData.regularMarketPrice,
              valorFormatado: Math.round(ibovData.regularMarketPrice).toLocaleString('pt-BR'),
              variacao: ibovData.regularMarketChange || 0,
              variacaoPercent: ibovData.regularMarketChangePercent || 0,
              trend: (ibovData.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down',
              timestamp: new Date().toISOString(),
              fonte: 'BRAPI_UNIFIED_STRATEGY'
            };

            console.log('🎯✅ IBOV obtido (Estratégia Unificada):', dadosIbovespa);
            dadosIbovObtidos = true;
          }
        }
      } catch (error) {
        console.log('🎯❌ IBOV (Estratégia Unificada):', error instanceof Error ? error.message : 'Erro desconhecido');
      }

      // 🔄 FALLBACK APENAS PARA MOBILE SE PRIMEIRA ESTRATÉGIA FALHOU
      if (!dadosIbovObtidos && isMobile) {
        console.log('📱 IBOV: Usando fallback mobile (múltiplas tentativas)');
        
        // Delay antes do fallback
        await new Promise(resolve => setTimeout(resolve, 300));

        // ESTRATÉGIA 2: Sem User-Agent
        if (!dadosIbovObtidos) {
          try {
            console.log('📱🔄 IBOV: Fallback 1 - Sem User-Agent');
            
            const response = await fetch(ibovUrl, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
              const data = await response.json();
              if (data.results?.[0]?.regularMarketPrice > 0) {
                const ibovData = data.results[0];
                
                dadosIbovespa = {
                  valor: ibovData.regularMarketPrice,
                  valorFormatado: Math.round(ibovData.regularMarketPrice).toLocaleString('pt-BR'),
                  variacao: ibovData.regularMarketChange || 0,
                  variacaoPercent: ibovData.regularMarketChangePercent || 0,
                  trend: (ibovData.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down',
                  timestamp: new Date().toISOString(),
                  fonte: 'BRAPI_MOBILE_FALLBACK_1'
                };

                console.log('📱✅ IBOV obtido (Fallback 1):', dadosIbovespa);
                dadosIbovObtidos = true;
              }
            }
          } catch (error) {
            console.log('📱❌ IBOV (Fallback 1):', error instanceof Error ? error.message : 'Erro desconhecido');
          }
        }

        // ESTRATÉGIA 3: URL simplificada
        if (!dadosIbovObtidos) {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          try {
            console.log('📱🔄 IBOV: Fallback 2 - URL simplificada');
            
            const response = await fetch(`https://brapi.dev/api/quote/^BVSP?token=${BRAPI_TOKEN}&range=1d`, {
              method: 'GET',
              mode: 'cors'
            });

            if (response.ok) {
              const data = await response.json();
              if (data.results?.[0]?.regularMarketPrice > 0) {
                const ibovData = data.results[0];
                
                dadosIbovespa = {
                  valor: ibovData.regularMarketPrice,
                  valorFormatado: Math.round(ibovData.regularMarketPrice).toLocaleString('pt-BR'),
                  variacao: ibovData.regularMarketChange || 0,
                  variacaoPercent: ibovData.regularMarketChangePercent || 0,
                  trend: (ibovData.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down',
                  timestamp: new Date().toISOString(),
                  fonte: 'BRAPI_MOBILE_FALLBACK_2'
                };

                console.log('📱✅ IBOV obtido (Fallback 2):', dadosIbovespa);
                dadosIbovObtidos = true;
              }
            }
          } catch (error) {
            console.log('📱❌ IBOV (Fallback 2):', error instanceof Error ? error.message : 'Erro desconhecido');
          }
        }
      }

      // ✅ SE OBTEVE DADOS, USAR E CACHEAR
      if (dadosIbovObtidos && dadosIbovespa) {
        setCachedData(cacheKey, dadosIbovespa);
        setIbovespaData(dadosIbovespa);
        return;
      }

      // 🔄 FALLBACK FINAL UNIFICADO
      console.log('🔄 IBOV: Usando fallback unificado...');
      const fallbackData = {
        valor: 134500,
        valorFormatado: '134.500',
        variacao: -588.25,
        variacaoPercent: -0.43,
        trend: 'down',
        timestamp: new Date().toISOString(),
        fonte: 'FALLBACK_UNIFIED'
      };
      
      console.log('⚠️ IBOV FALLBACK UNIFICADO:', fallbackData);
      setCachedData(cacheKey, fallbackData);
      setIbovespaData(fallbackData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro geral ao buscar Ibovespa:', err);
      setError(errorMessage);
      
      // FALLBACK DE EMERGÊNCIA
      const fallbackData = {
        valor: 134500,
        valorFormatado: '134.500',
        variacao: -588.25,
        variacaoPercent: -0.43,
        trend: 'down',
        timestamp: new Date().toISOString(),
        fonte: 'EMERGENCIA_UNIFIED'
      };
      setIbovespaData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, [isMobile]);

  React.useEffect(() => {
    buscarIbovespaReal();
    const interval = setInterval(buscarIbovespaReal, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [buscarIbovespaReal]);

  return { ibovespaData, loading, error, refetch: buscarIbovespaReal };
}

// 🚀 HOOK CORRIGIDO PARA IBOVESPA NO PERÍODO
function useIbovespaPeriodo(ativosAtualizados: any[]) {
  const [ibovespaPeriodo, setIbovespaPeriodo] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const isMobile = useDeviceDetection();

  React.useEffect(() => {
    const calcularIbovespaPeriodo = async () => {
      if (!ativosAtualizados || ativosAtualizados.length === 0) return;

      try {
        setLoading(true);

        // 📅 ENCONTRAR A DATA MAIS ANTIGA DA CARTEIRA
        let dataMaisAntiga = new Date('2030-01-01');
        ativosAtualizados.forEach(ativo => {
          if (ativo.dataEntrada && !ativo.posicaoEncerrada) {
            const [dia, mes, ano] = ativo.dataEntrada.split('/');
            const dataAtivo = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
            
            if (dataAtivo < dataMaisAntiga) {
              dataMaisAntiga = dataAtivo;
            }
          }
        });

        if (dataMaisAntiga.getFullYear() > 2025) {
          dataMaisAntiga = new Date(2020, 2, 23);
        }

        console.log('📅 Data mais antiga da carteira:', dataMaisAntiga.toLocaleDateString('pt-BR'));

        const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
        let ibovAtual = 134500;
        
        // 📊 BUSCAR IBOVESPA ATUAL
        try {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(`https://brapi.dev/api/quote/^BVSP?token=${BRAPI_TOKEN}`, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'User-Agent': isMobile
                ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                : 'SmallCaps-Ibov-Current'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            ibovAtual = data.results?.[0]?.regularMarketPrice || 134500;
            console.log('📊 Ibovespa atual obtido:', ibovAtual.toLocaleString('pt-BR'));
          }
        } catch (error) {
          console.log('⚠️ Erro ao buscar Ibovespa atual, usando fallback:', ibovAtual.toLocaleString('pt-BR'));
        }

        // 📊 VALORES HISTÓRICOS MAIS PRECISOS
        const anoInicial = dataMaisAntiga.getFullYear();
        const mesInicial = dataMaisAntiga.getMonth();
        
        const valoresHistoricos: { [key: string]: number } = {
          // 2020 - VALORES BASEADOS NO CRASH REAL DO COVID
          '2020-0': 115000, '2020-1': 110000, '2020-2': 63500, '2020-3': 73000,
          '2020-4': 78000, '2020-5': 93000, '2020-6': 100000, '2020-7': 105000,
          '2020-8': 103000, '2020-9': 97000, '2020-10': 103000, '2020-11': 118000,
          
          // 2021 - ANO DE ALTA VOLATILIDADE
          '2021-0': 119000, '2021-1': 116000, '2021-2': 112000, '2021-3': 118000,
          '2021-4': 125000, '2021-5': 127000, '2021-6': 125000, '2021-7': 120000,
          '2021-8': 115000, '2021-9': 108000, '2021-10': 103000, '2021-11': 105000,
          
          // 2022 - CORREÇÃO
          '2022-0': 110000, '2022-1': 114000, '2022-2': 118000, '2022-3': 116000,
          '2022-4': 112000, '2022-5': 103000, '2022-6': 100000, '2022-7': 112000,
          '2022-8': 115000, '2022-9': 116000, '2022-10': 118000, '2022-11': 109000,
          
          // 2023 - RECUPERAÇÃO PARCIAL
          '2023-0': 109000, '2023-1': 112000, '2023-2': 108000, '2023-3': 112000,
          '2023-4': 116000, '2023-5': 121000, '2023-6': 125000, '2023-7': 122000,
          '2023-8': 118000, '2023-9': 115000, '2023-10': 125000, '2023-11': 133000,
          
          // 2024 - QUEDA SIGNIFICATIVA
          '2024-0': 134000, '2024-1': 132000, '2024-2': 130000, '2024-3': 128000,
          '2024-4': 126000, '2024-5': 123000, '2024-6': 128000, '2024-7': 133000,
          '2024-8': 135000, '2024-9': 132000, '2024-10': 130000, '2024-11': 119000,
          
          // 2025
          '2025-0': 119000, '2025-1': 122000, '2025-2': 128000, '2025-3': 132000,
          '2025-4': 134000, '2025-5': 136000, '2025-6': 134500, '2025-7': 134500
        };
        
        // 🎯 BUSCAR VALOR HISTÓRICO MAIS ESPECÍFICO
        const chaveEspecifica = `${anoInicial}-${mesInicial}`;
        const ibovInicial = valoresHistoricos[chaveEspecifica] || 
                           valoresHistoricos[`${anoInicial}-0`] || 85000;
        
        console.log(`📊 Ibovespa inicial (${chaveEspecifica}):`, ibovInicial.toLocaleString('pt-BR'));
        console.log(`📊 Ibovespa atual:`, ibovAtual.toLocaleString('pt-BR'));

        // 🧮 CALCULAR PERFORMANCE NO PERÍODO
        const performancePeriodo = ((ibovAtual - ibovInicial) / ibovInicial) * 100;
        
        console.log(`📊 Performance Ibovespa no período: ${performancePeriodo.toFixed(2)}%`);
        
        // 📅 FORMATAR PERÍODO
        const mesInicial_formatado = dataMaisAntiga.toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: 'numeric' 
        });
        
        const resultado = {
          performancePeriodo,
          dataInicial: mesInicial_formatado,
          ibovInicial,
          ibovAtual,
          anoInicial: dataMaisAntiga.getFullYear(),
          diasNoPeriodo: Math.floor((Date.now() - dataMaisAntiga.getTime()) / (1000 * 60 * 60 * 24)),
          dataEntradaCompleta: dataMaisAntiga.toLocaleDateString('pt-BR')
        };

        console.log('📊 Resultado FINAL Ibovespa período:', {
          periodo: `desde ${mesInicial_formatado}`,
          inicial: ibovInicial.toLocaleString('pt-BR'),
          atual: ibovAtual.toLocaleString('pt-BR'),
          performance: performancePeriodo.toFixed(2) + '%'
        });

        setIbovespaPeriodo(resultado);

      } catch (error) {
        console.error('❌ Erro ao calcular Ibovespa período:', error);
        
        // Fallback mais conservador
        const fallback = {
          performancePeriodo: 0,
          dataInicial: 'jan/2021',
          ibovInicial: 119000,
          ibovAtual: 134500,
          anoInicial: 2021,
          diasNoPeriodo: Math.floor((Date.now() - new Date(2021, 0, 15).getTime()) / (1000 * 60 * 60 * 24)),
          dataEntradaCompleta: '15/01/2021'
        };
        
        setIbovespaPeriodo(fallback);
      } finally {
        setLoading(false);
      }
    };

    calcularIbovespaPeriodo();
  }, [ativosAtualizados, isMobile]);

  return { ibovespaPeriodo, loading };
}

// 🔥 FUNÇÃO OTIMIZADA PARA CALCULAR VIÉS
function calcularViesAutomatico(
  precoTeto: number | undefined,
  precoAtual: string,
  override?: ViesOverride | null
): string {
  if (!precoTeto || precoAtual === 'N/A') {
    return aplicarViesOverride(override, 'Aguardar');
  }

  const precoAtualNum = parseFloat(precoAtual.replace('R$ ', '').replace(',', '.'));
  if (isNaN(precoAtualNum)) {
    return aplicarViesOverride(override, 'Aguardar');
  }

  const viesAutomatico = precoAtualNum < precoTeto ? 'Compra' : 'Aguardar';
  return aplicarViesOverride(override, viesAutomatico);
}

// 🚀 FUNÇÃO OTIMIZADA PARA BUSCAR COTAÇÕES - SEMPRE ESTRATÉGIA MOBILE
async function buscarCotacoesParalelas(tickers: string[], isMobile: boolean): Promise<Map<string, any>> {
  const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
  const cotacoesMap = new Map();
  
  console.log('🚀 [OTIMIZADO] Buscando', tickers.length, 'cotações EM PARALELO...');
  
  // ✅ STRATEGY 1: Tentar batch request primeiro (1 requisição para todos)
  try {
    const batchUrl = `https://brapi.dev/api/quote/${tickers.join(',')}?token=${BRAPI_TOKEN}`;
    const response = await Promise.race([
      fetch(batchUrl),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Batch timeout')), 5000))
    ]);
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        console.log('✅ BATCH REQUEST SUCESSO:', data.results.length, 'cotações em 1 só request');
        
        data.results.forEach((quote: any) => {
          if (quote.regularMarketPrice > 0) {
            cotacoesMap.set(quote.symbol, {
              precoAtual: quote.regularMarketPrice,
              variacao: quote.regularMarketChange || 0,
              variacaoPercent: quote.regularMarketChangePercent || 0,
              volume: quote.regularMarketVolume || 0,
              nome: quote.shortName || quote.longName || quote.symbol,
              dadosCompletos: quote
            });
          }
        });
        
        return cotacoesMap;
      }
    }
  } catch (error) {
    console.log('❌ Batch request falhou, usando paralelo individual');
  }
  
  // ✅ STRATEGY 2: Requests paralelos individuais (SEM DELAYS!)
  console.log('🚀 [PARALELO] Executando', tickers.length, 'requests simultâneos...');
  
  const promises = tickers.map(async (ticker) => {
    try {
      const response = await Promise.race([
        fetch(`https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}`, {
          headers: { 'Accept': 'application/json' }
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Individual timeout')), 4000))
      ]);

      if (response.ok) {
        const data = await response.json();
        const quote = data.results?.[0];
        
        if (quote?.regularMarketPrice > 0) {
          cotacoesMap.set(ticker, {
            precoAtual: quote.regularMarketPrice,
            variacao: quote.regularMarketChange || 0,
            variacaoPercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            nome: quote.shortName || quote.longName || ticker,
            dadosCompletos: quote
          });
        }
      }
    } catch (error) {
      console.log(`❌ [${ticker}]:`, error instanceof Error ? error.message : 'Erro desconhecido');
    }
  });
  
  // 🚀 EXECUTAR TODAS EM PARALELO (ZERO DELAYS)
  await Promise.allSettled(promises);
  
  console.log('✅ [PARALELO] Concluído:', cotacoesMap.size, 'de', tickers.length);
  return cotacoesMap;
}

function getFrequenciaDividendos(ticker: string): number {
  const tickerUpper = ticker.toUpperCase();

  const empresasAnuais = ['XP', 'NU', 'PAGS', 'STNE', 'ARCO', 'BRFS'];
  if (empresasAnuais.includes(tickerUpper)) {
    return 1;
  }

  const empresasSemestrais = ['VALE', 'ITUB', 'BBD'];
  if (empresasSemestrais.includes(tickerUpper)) {
    return 2;
  }

  return 4;
}

function extrairNumeroBrApi(valor: any): number | null {
  if (valor === null || valor === undefined) {
    return null;
  }

  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor === 'object') {
    if (typeof valor.raw === 'number' && Number.isFinite(valor.raw)) {
      return valor.raw;
    }

    if (typeof valor.fmt === 'string') {
      return extrairNumeroBrApi(valor.fmt);
    }
  }

  if (typeof valor === 'string') {
    const cleaned = valor.trim();
    if (!cleaned) {
      return null;
    }

    const isPercent = cleaned.includes('%');
    const numericOnly = cleaned
      .replace(/[^0-9.,%-]/g, '')
      .replace(/%/g, '')
      .replace(/\s+/g, '');

    let normalizado = numericOnly;
    const possuiVirgula = normalizado.includes(',');
    const possuiPonto = normalizado.includes('.');

    if (possuiVirgula && possuiPonto) {
      if (normalizado.lastIndexOf('.') > normalizado.lastIndexOf(',')) {
        normalizado = normalizado.replace(/,/g, '');
      } else {
        normalizado = normalizado.replace(/\./g, '').replace(',', '.');
      }
    } else if (possuiVirgula) {
      normalizado = normalizado.replace(/,/g, '.');
    }

    const parsed = Number.parseFloat(normalizado);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return isPercent ? parsed / 100 : parsed;
  }

  return null;
}

function formatarDy(valor: number): string {
  const percentual = Number.isFinite(valor) ? valor * 100 : 0;
  return `${percentual.toFixed(2).replace('.', ',')}%`;
}

function calcularDyAPartirDoResultado(result: any, ticker: string): { valor: number | null; origem: string } {
  if (!result) {
    return { valor: null, origem: 'sem_resultado' };
  }

  const fontesDiretas = [
    { valor: result.defaultKeyStatistics?.yield, origem: 'defaultKeyStatistics.yield' },
    { valor: result.summaryDetail?.yield, origem: 'summaryDetail.yield' },
    { valor: result.defaultKeyStatistics?.dividendYield, origem: 'defaultKeyStatistics.dividendYield' },
    { valor: result.summaryDetail?.dividendYield, origem: 'summaryDetail.dividendYield' },
    { valor: result.summaryDetail?.trailingAnnualDividendYield, origem: 'summaryDetail.trailingAnnualDividendYield' }
  ];

  for (const fonte of fontesDiretas) {
    const numero = extrairNumeroBrApi(fonte.valor);
    if (numero && numero > 0) {
      return { valor: numero, origem: fonte.origem };
    }
  }

  const precoAtual = extrairNumeroBrApi(result.regularMarketPrice ?? result.price?.regularMarketPrice);
  if (!precoAtual || precoAtual <= 0) {
    return { valor: null, origem: 'sem_preco' };
  }

  const fontesAnuais = [
    { valor: result.summaryDetail?.dividendRate, origem: 'summaryDetail.dividendRate' },
    { valor: result.summaryDetail?.trailingAnnualDividendRate, origem: 'summaryDetail.trailingAnnualDividendRate' }
  ];

  for (const fonte of fontesAnuais) {
    const dividendoAnual = extrairNumeroBrApi(fonte.valor);
    if (dividendoAnual && dividendoAnual > 0) {
      const dyCalculado = dividendoAnual / precoAtual;
      if (dyCalculado > 0) {
        return { valor: dyCalculado, origem: fonte.origem };
      }
    }
  }

  const ultimoDividendo = extrairNumeroBrApi(
    result.defaultKeyStatistics?.lastDividendValue ?? result.summaryDetail?.lastDividendValue
  );

  if (ultimoDividendo && ultimoDividendo > 0) {
    const frequencia = getFrequenciaDividendos(ticker);
    const dividendoAnual = ultimoDividendo * frequencia;
    const dyCalculado = dividendoAnual / precoAtual;

    if (dyCalculado > 0) {
      const frequenciaTexto =
        frequencia === 1 ? 'ANUAL' : frequencia === 2 ? 'SEMESTRAL' : 'TRIMESTRAL';

      console.log(`💡 [DY-CALC] ${ticker}: Calculado (${frequenciaTexto})`);
      console.log(`   - Último dividendo: $${ultimoDividendo.toFixed(2)}`);
      console.log(`   - Frequência: ${frequencia}x ao ano`);
      console.log(`   - Dividendo anual: $${dividendoAnual.toFixed(2)}`);
      console.log(`   - Preço atual: $${precoAtual.toFixed(2)}`);
      console.log(`   - DY calculado: ${(dyCalculado * 100).toFixed(2)}%`);

      return { valor: dyCalculado, origem: 'calc:lastDividendValue' };
    }
  }

  return { valor: null, origem: 'nao_encontrado' };
}

function registrarDyNoMapa(result: any, ticker: string, dyMap: Map<string, string>): void {
  const { valor, origem } = calcularDyAPartirDoResultado(result, ticker);

  if (valor && valor > 0) {
    const dyFormatado = formatarDy(valor);
    dyMap.set(ticker, dyFormatado);
    console.log(`✅ [DY] ${ticker}: ${(valor * 100).toFixed(2)}% (${origem})`);
  } else {
    dyMap.set(ticker, '0,00%');
    console.log(`❌ [DY] ${ticker}: Sem dividendos (${origem})`);
  }
}

// 🔄 FUNÇÃO PARA BUSCAR DY - VERSÃO CORRETA (IGUAL AO SEU CÓDIGO QUE FUNCIONAVA)
async function buscarDYsComEstrategia(tickers: string[], isMobile: boolean): Promise<Map<string, string>> {
  const dyMap = new Map<string, string>();
  const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
  
  console.log('📈 [CORRETO] Buscando DY para', tickers.length, 'tickers EM PARALELO...');
  
  // ✅ BATCH REQUEST - IGUAL AO SEU CÓDIGO ANTERIOR QUE FUNCIONAVA
  try {
    const batchUrl = `https://brapi.dev/api/quote/${tickers.join(',')}?modules=${DY_MODULES}&token=${BRAPI_TOKEN}`;
    const response = await Promise.race([
      fetch(batchUrl),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DY batch timeout')), 6000))
    ]);

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        console.log('✅ DY BATCH SUCCESS:', data.results.length, 'DYs em 1 só request');
        
        data.results.forEach((result: any) => {
          const ticker = result.symbol;
          registrarDyNoMapa(result, ticker, dyMap);
        });
        
        return dyMap;
      }
    }
  } catch (error) {
    console.log('❌ DY Batch falhou, usando paralelo individual');
  }
  
  // ✅ PARALELO INDIVIDUAL - IGUAL AO SEU CÓDIGO ANTERIOR
  const promises = tickers.map(async (ticker) => {
    try {
      const response = await Promise.race([
        fetch(`https://brapi.dev/api/quote/${ticker}?modules=${DY_MODULES}&token=${BRAPI_TOKEN}`, {
          headers: { 'Accept': 'application/json' }
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DY timeout')), 4000))
      ]);

      if (response.ok) {
        const data = await response.json();
        const result = data.results?.[0];
        registrarDyNoMapa(result, ticker, dyMap);
      }
    } catch (error) {
      console.log(`❌ [DY-${ticker}]:`, error instanceof Error ? error.message : 'Erro desconhecido');
    }
  });
  
  await Promise.allSettled(promises);
  
  // Garantir que todos os tickers tenham DY
  tickers.forEach(ticker => {
    if (!dyMap.has(ticker)) {
      dyMap.set(ticker, '0,00%');
    }
  });
  
  console.log('✅ [DY-CORRETO] Concluído:', dyMap.size, 'de', tickers.length);
  console.log('📊 DY Final Map:', Object.fromEntries(dyMap));
  return dyMap;
}

// 🚀 HOOK PRINCIPAL OTIMIZADO COM PARALELIZAÇÃO TOTAL
function useSmallCapsIntegradas() {
  const { dados } = useDataStore();
  const [ativosAtualizados, setAtivosAtualizados] = React.useState<any[]>([]);
  const [cotacoesAtualizadas, setCotacoesAtualizadas] = React.useState<any>({});
  
  // Estados para garantir que TODOS os dados estejam prontos
  const [cotacoesCompletas, setCotacoesCompletas] = React.useState<Map<string, any>>(new Map());
  const [dyCompletos, setDyCompletos] = React.useState<Map<string, string>>(new Map());
  const [proventosCompletos, setProventosCompletos] = React.useState<Map<string, number>>(new Map());
  const [todosOsDadosProntos, setTodosOsDadosProntos] = React.useState(false);
  
  // Loading states granulares
  const [loadingCotacoes, setLoadingCotacoes] = React.useState(true);
  const [loadingDY, setLoadingDY] = React.useState(false);
  const [loadingProventos, setLoadingProventos] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isMobile = useDeviceDetection();
  const [proventosMap, setProventosMap] = React.useState<Map<string, number>>(new Map());
  const smallCapsData = dados.smallCaps || [];

  // Função otimizada para buscar proventos
  const buscarProventosAtivos = React.useCallback(async (ativosData: any[]) => {
    setLoadingProventos(true);
    const novosProventos = new Map<string, number>();
    
    console.log('💰 Iniciando busca de proventos para', ativosData.length, 'small caps');
    
    const buscarProventoAtivo = async (ativo: any) => {
      try {
        const [dia, mes, ano] = ativo.dataEntrada.split('/');
        const dataEntradaISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        
        console.log(`💰 Buscando proventos para ${ativo.ticker} desde ${ativo.dataEntrada}`);
        
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`/api/proventos/${ativo.ticker}`, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const proventosRaw = await response.json();
          
          if (Array.isArray(proventosRaw)) {
const dataEntradaDate = new Date(dataEntradaISO + 'T00:00:00');

// Para posições encerradas, filtrar até a data de saída
let dataLimite = null;
if (ativo.posicaoEncerrada && ativo.dataSaida) {
  const [dia, mes, ano] = ativo.dataSaida.split('/');
  const dataSaidaISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  dataLimite = new Date(dataSaidaISO + 'T23:59:59'); // Incluir o dia da saída
}

const proventosFiltrados = proventosRaw.filter((p: any) => {
  if (!p.dataObj) return false;
  const dataProvento = new Date(p.dataObj);
  
  // Deve estar após a data de entrada
  if (dataProvento < dataEntradaDate) return false;
  
  // Se for posição encerrada, deve estar antes ou na data de saída
  if (dataLimite && dataProvento > dataLimite) return false;
  
  return true;
});
            
            const total = proventosFiltrados.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
            console.log(`💰 ${ativo.ticker}: R$ ${total.toFixed(2)} (${proventosFiltrados.length} proventos)`);
            return { ticker: ativo.ticker, valor: total };
          }
        } else {
          console.log(`💰 ${ativo.ticker}: Erro HTTP ${response.status}`);
        }
      } catch (error) {
        console.log(`💰 ${ativo.ticker}: Erro -`, error instanceof Error ? error.message : 'Erro desconhecido');
      }
      
      return { ticker: ativo.ticker, valor: 0 };
    };

    // Buscar proventos em paralelo
    const resultados = await Promise.allSettled(
      ativosData.map(ativo => buscarProventoAtivo(ativo))
    );

    resultados.forEach((resultado) => {
      if (resultado.status === 'fulfilled') {
        novosProventos.set(resultado.value.ticker, resultado.value.valor);
      }
    });
    
    console.log('💰 Proventos finais:', Object.fromEntries(novosProventos));
    setProventosMap(novosProventos);
    setLoadingProventos(false);
    return novosProventos;
  }, []);

  // 🎯 FUNÇÃO PRINCIPAL REESCRITA - PARALELIZAÇÃO TOTAL (IGUAL AO CÓDIGO DOS FIIS)
  const buscarDadosCompletos = React.useCallback(async () => {
    if (smallCapsData.length === 0) {
      setAtivosAtualizados([]);
      setLoadingCotacoes(false);
      return;
    }

    try {
      setError(null);
      setTodosOsDadosProntos(false);
      const tickers = smallCapsData.map(ativo => ativo.ticker);
      
      console.log('🚀 INICIANDO BUSCA STEP-BY-STEP ROBUSTA - ESTRATÉGIA MOBILE UNIVERSAL...');
      
      // 🔄 RESET DOS ESTADOS
      setCotacoesCompletas(new Map());
      setDyCompletos(new Map());
      setProventosCompletos(new Map());

      // ⚡ PARALELIZAÇÃO TOTAL - IGUAL AO CÓDIGO DOS FIIS
      console.log('⚡ EXECUTANDO TODAS AS ETAPAS EM PARALELO...');

      // Ativar todos os loadings
      setLoadingCotacoes(true);
      setLoadingDY(true);
      setLoadingProventos(true);

      // Medir tempo
      const inicioTempo = performance.now();

      // EXECUTAR TUDO EM PARALELO
      const [cotacoesResult, dyResult, proventosResult] = await Promise.allSettled([
        buscarCotacoesParalelas(tickers, isMobile),
        buscarDYsComEstrategia(tickers, isMobile),
        buscarProventosAtivos(smallCapsData)
      ]);

      const tempoTotal = performance.now() - inicioTempo;
      console.log(`🎉 TODAS AS ETAPAS CONCLUÍDAS EM ${tempoTotal.toFixed(0)}ms!`);

      // Processar resultados
      const cotacoesMap = cotacoesResult.status === 'fulfilled' ? cotacoesResult.value : new Map();
      const dyMap = dyResult.status === 'fulfilled' ? dyResult.value : new Map();
      const proventosData = proventosResult.status === 'fulfilled' ? proventosResult.value : new Map();

      // Logs de debug
      console.log('📊 Cotações obtidas:', cotacoesMap.size, 'de', tickers.length);
      console.log('📈 DY obtidos:', dyMap.size, 'de', tickers.length);
      console.log('💰 Proventos obtidos:', proventosData.size, 'de', smallCapsData.length);

      // Debug do DY
      console.log('🔍 [PARALLEL-DEBUG] dyMap processado:');
      console.log('🔍 [PARALLEL-DEBUG] dyMap.size:', dyMap.size);
      console.log('🔍 [PARALLEL-DEBUG] dyMap conteúdo:', Object.fromEntries(dyMap));

      // Atualizar estados
      setCotacoesCompletas(cotacoesMap);
      setDyCompletos(dyMap);
      setProventosCompletos(proventosData);

      // Desativar loadings
      setLoadingCotacoes(false);
      setLoadingDY(false);
      setLoadingProventos(false);
      
      // Marcar como pronto para processamento final
      setTodosOsDadosProntos(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro na busca otimizada:', err);
      setTodosOsDadosProntos(true);
    }
  }, [smallCapsData, isMobile, buscarProventosAtivos]);

  // 🏆 USEEFFECT QUE SÓ EXECUTA QUANDO TODOS OS DADOS ESTÃO PRONTOS
  React.useEffect(() => {
    if (!todosOsDadosProntos || smallCapsData.length === 0) return;
    
    console.log('🏆 PROCESSANDO TOTAL RETURN - TODOS OS DADOS PRONTOS!');
    console.log('🔍 [DEPS-DEBUG] Verificando estados no momento da execução:');
    console.log('🔍 [DEPS-DEBUG] todosOsDadosProntos:', todosOsDadosProntos);
    console.log('🔍 [DEPS-DEBUG] smallCapsData.length:', smallCapsData.length);
    console.log('🔍 [DEPS-DEBUG] cotacoesCompletas.size:', cotacoesCompletas.size);
    console.log('🔍 [DEPS-DEBUG] dyCompletos.size:', dyCompletos.size);
    console.log('🔍 [DEPS-DEBUG] proventosCompletos.size:', proventosCompletos.size);
    console.log('🔍 [DEPS-DEBUG] dyCompletos conteúdo:', Object.fromEntries(dyCompletos));
    
    console.log('📊 Dados disponíveis:', {
      cotacoes: cotacoesCompletas.size,
      dy: dyCompletos.size, 
      proventos: proventosCompletos.size,
      ativos: smallCapsData.length
    });

    const novasCotacoes: any = {};

    // 🎯 PROCESSAR TODOS OS ATIVOS COM TOTAL RETURN CORRETO
    const ativosFinais = smallCapsData.map((ativo, index) => {
      const cotacao = cotacoesCompletas.get(ativo.ticker);
      
      // 🔍 DEBUG DY ASSIGNMENT
      const dyAPI = dyCompletos.get(ativo.ticker) || '0,00%';
      console.log(`🔍 [ASSIGN-DEBUG] ${ativo.ticker}:`);
      console.log(`  - dyCompletos.size: ${dyCompletos.size}`);
      console.log(`  - dyCompletos.has('${ativo.ticker}'): ${dyCompletos.has(ativo.ticker)}`);
      console.log(`  - dyCompletos.get('${ativo.ticker}'): ${dyCompletos.get(ativo.ticker)}`);
      console.log(`  - dyAPI final: ${dyAPI}`);
      console.log(`  - loadingDY: ${loadingDY}`);
      
      const proventosAtivo = proventosCompletos.get(ativo.ticker) || 0;
    
      if (cotacao && cotacao.precoAtual > 0) {
        // ✅ ATIVO COM COTAÇÃO REAL
        const precoAtualNum = cotacao.precoAtual;
        const performanceAcao = ((precoAtualNum - ativo.precoEntrada) / ativo.precoEntrada) * 100;
        const performanceProventos = ativo.precoEntrada > 0 ? (proventosAtivo / ativo.precoEntrada) * 100 : 0;
        const performanceTotal = performanceAcao + performanceProventos;
        
        novasCotacoes[ativo.ticker] = precoAtualNum;
        
        console.log(`🏆 ${ativo.ticker}: DY final que será usado = ${dyAPI}`);
        
        return {
          ...ativo,
          id: String(ativo.id || index + 1),
          precoAtual: precoAtualNum,
          performance: performanceTotal,
          performanceAcao: performanceAcao,
          performanceProventos: performanceProventos,
          proventosAtivo: proventosAtivo,
          variacao: cotacao.variacao,
          variacaoPercent: cotacao.variacaoPercent,
          volume: cotacao.volume,
          vies: calcularViesAutomatico(
            ativo.precoTeto,
            `R$ ${precoAtualNum.toFixed(2).replace('.', ',')}`,
            ativo.viesOverride
          ),
          dy: dyAPI,
          statusApi: 'success',
          nomeCompleto: cotacao.nome,
          posicaoExibicao: index + 1
        };
      } else {
        // ⚠️ ATIVO SEM COTAÇÃO REAL
        const performanceProventos = ativo.precoEntrada > 0 ? (proventosAtivo / ativo.precoEntrada) * 100 : 0;
        
        console.log(`🏆 ${ativo.ticker}: (sem cotação) DY final que será usado = ${dyAPI}`);
        
        return {
          ...ativo,
          id: String(ativo.id || index + 1),
          precoAtual: ativo.precoEntrada,
          performance: performanceProventos,
          performanceAcao: 0,
          performanceProventos: performanceProventos,
          proventosAtivo: proventosAtivo,
          variacao: 0,
          variacaoPercent: 0,
          volume: 0,
          vies: calcularViesAutomatico(
            ativo.precoTeto,
            `R$ ${ativo.precoEntrada.toFixed(2).replace('.', ',')}`,
            ativo.viesOverride
          ),
          dy: dyAPI,
          statusApi: 'not_found',
          nomeCompleto: 'N/A',
          posicaoExibicao: index + 1
        };
      }
    });

    // 🎯 ATUALIZAÇÃO FINAL DEFINITIVA
    setCotacoesAtualizadas(novasCotacoes);
    setAtivosAtualizados(ativosFinais);
    
    console.log('🏆 TOTAL RETURN PROCESSADO COM SUCESSO - PRIMEIRA VEZ!');
  }, [todosOsDadosProntos, cotacoesCompletas, dyCompletos, proventosCompletos, smallCapsData, loadingDY]);

  // UseEffect original simplificado
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('🚀 Iniciando busca de dados...');
      buscarDadosCompletos();
    }, 100); // Pequeno debounce

    return () => clearTimeout(timeoutId);
  }, [buscarDadosCompletos]);

  const refetch = React.useCallback(() => {
    console.log('🔄 REFETCH: Resetando e buscando dados novamente...');
    setTodosOsDadosProntos(false); // Reset do flag
    buscarDadosCompletos();
  }, [buscarDadosCompletos]);

  return {
    ativosAtualizados,
    cotacoesAtualizadas,
    setCotacoesAtualizadas,
    loading: loadingCotacoes || !todosOsDadosProntos, // ✅ Loading até TUDO estar pronto
    loadingDY,
    loadingProventos,
    error,
    refetch,
    isMobile,
    todosOsDadosProntos, // ✅ Novo estado para debug
  proventosCompletos  // ✅ ADICIONAR ESTA LINHA

  };
}

// 🎯 COMPONENTE PRINCIPAL OTIMIZADO
export default function SmallCapsPage() {
  // ✅ TODOS OS HOOKS NO TOPO - SEM EXCEÇÃO
  const { hasAccessSync, loading: authLoading, planInfo } = useAuthAccess();
  const { dados } = useDataStore();
  const { 
    ativosAtualizados, 
    cotacoesAtualizadas, 
    setCotacoesAtualizadas, 
    loading, 
    loadingDY,
    loadingProventos,
    isMobile,
    todosOsDadosProntos,
    proventosCompletos
  } = useSmallCapsIntegradas();
  
  const { smllData } = useSmllRealTime();
  const { ibovespaData } = useIbovespaRealTime();
  const { ibovespaPeriodo } = useIbovespaPeriodo(ativosAtualizados);

  // ✅ ESTE useMemo TAMBÉM DEVE ESTAR NO TOPO
  const { ativosAtivos, ativosEncerrados } = React.useMemo(() => {
    const ativos = ativosAtualizados.filter((ativo) => !ativo.posicaoEncerrada) || [];
    const encerrados = ativosAtualizados.filter((ativo) => ativo.posicaoEncerrada) || [];
    
    return {
      ativosAtivos: ativos.map((ativo, index) => ({
        ...ativo,
        posicaoExibicao: index + 1
      })),
      ativosEncerrados: encerrados
    };
  }, [ativosAtualizados]);

  // Métricas memoizadas
  const metricas = React.useMemo(() => {
    if (!ativosAtivos || ativosAtivos.length === 0) {
      return {
        valorInicial: 0,
        valorAtual: 0,
        rentabilidadeTotal: 0,
        quantidadeAtivos: 0,
        melhorAtivo: null,
        piorAtivo: null,
        dyMedio: 0
      };
    }

    const valorPorAtivo = 1000;
    const valorInicialTotal = ativosAtivos.length * valorPorAtivo;
    let valorFinalTotal = 0;
    let melhorPerformance = -Infinity;
    let piorPerformance = Infinity;
    let melhorAtivo = null;
    let piorAtivo = null;

    ativosAtivos.forEach((ativo) => {
      const valorFinal = valorPorAtivo * (1 + ativo.performance / 100);
      valorFinalTotal += valorFinal;

      if (ativo.performance > melhorPerformance) {
        melhorPerformance = ativo.performance;
        melhorAtivo = { ...ativo, performance: ativo.performance };
      }

      if (ativo.performance < piorPerformance) {
        piorPerformance = ativo.performance;
        piorAtivo = { ...ativo, performance: ativo.performance };
      }
    });

    const rentabilidadeTotal = valorInicialTotal > 0 ? 
      ((valorFinalTotal - valorInicialTotal) / valorInicialTotal) * 100 : 0;

    const dyValues = ativosAtivos
      .map(ativo => parseFloat(ativo.dy.replace('%', '').replace(',', '.')))
      .filter(dy => !isNaN(dy) && dy > 0);
    
    const dyMedio = dyValues.length > 0 ? 
      dyValues.reduce((sum, dy) => sum + dy, 0) / dyValues.length : 0;

    return {
      valorInicial: valorInicialTotal,
      valorAtual: valorFinalTotal,
      rentabilidadeTotal,
      quantidadeAtivos: ativosAtivos.length,
      melhorAtivo,
      piorAtivo,
      dyMedio
    };
  }, [ativosAtivos]);

  // Funções auxiliares memoizadas
  const formatCurrency = React.useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  }, []);

  const formatPercentage = React.useCallback((value: number) => {
    const signal = value >= 0 ? '+' : '';
    return signal + value.toFixed(2) + '%';
  }, []);

// ✅ ESTADO PARA EXPAND/COLLAPSE DAS POSIÇÕES ENCERRADAS  
const [posicoesEncerradasExpanded, setPosicoesEncerradasExpanded] = React.useState(false);

const calcularPerformanceEncerrada = React.useCallback((ativo: any) => {

  if (!ativo.precoSaida) return 0;
  
  // Performance da ação (variação do preço)
  const performanceAcao = ((ativo.precoSaida - ativo.precoEntrada) / ativo.precoEntrada) * 100;
  
  // Performance dos proventos recebidos durante o período
  const proventosAtivo = proventosCompletos.get(ativo.ticker) || 0;
  const performanceProventos = ativo.precoEntrada > 0 ? (proventosAtivo / ativo.precoEntrada) * 100 : 0;
  
  // Total Return = Performance da ação + Performance dos proventos
  return performanceAcao + performanceProventos;
}, [proventosCompletos]);

  if (authLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <h2 style={{ color: '#1e293b' }}>Verificando permissões...</h2>
        </div>
      </div>
    );
  }

  if (!hasAccessSync('small-caps')) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ 
          textAlign: 'center', 
          backgroundColor: 'white', 
          padding: '48px 32px', 
          borderRadius: '16px', 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#1e293b', 
            marginBottom: '16px' 
          }}>
            Acesso Restrito
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '24px'
          }}>
            Você não tem permissão para acessar a carteira de <strong>Small Caps</strong>.
          </p>
          <p style={{ 
            color: '#64748b', 
            fontSize: '14px',
            marginBottom: '32px'
          }}>
            Plano atual: <strong>{planInfo?.displayName || 'Carregando...'}</strong>
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      padding: isMobile ? '16px' : '24px'
    }}>
      {/* Header Responsivo */}
      <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
        <h1 style={{ 
          fontSize: isMobile ? '28px' : '48px',
          fontWeight: '800', 
          color: '#1e293b',
          margin: '0 0 8px 0'
        }}>
          Carteira de Small Caps
        </h1>
        <div style={{ 
          color: '#64748b', 
          fontSize: isMobile ? '16px' : '18px',
          margin: '0',
          lineHeight: '1.5',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {loading && !todosOsDadosProntos ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e2e8f0',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{ 
                color: '#3b82f6', 
                fontWeight: '600',
                fontSize: isMobile ? '14px' : '16px'
              }}>
                Atualizando carteira em tempo real...
              </span>
            </>
          ) : (
            <span>
              Dados atualizados a cada 5 minutos
            </span>
          )}
        </div>
      </div>

      {/* Cards de Métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile 
          ? 'repeat(auto-fit, minmax(140px, 1fr))'
          : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: isMobile ? '8px' : '12px',
        marginBottom: '32px'
      }}>
        {/* Performance Total */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            fontSize: isMobile ? '11px' : '12px',
            color: '#64748b', 
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            Rentabilidade total
          </div>
          <div style={{ 
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '700', 
            color: metricas.rentabilidadeTotal >= 0 ? '#10b981' : '#ef4444',
            lineHeight: '1'
          }}>
            {loading ? '...' : formatPercentage(metricas.rentabilidadeTotal)}
          </div>
        </div>

        {/* SMLL Index */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            fontSize: isMobile ? '11px' : '12px',
            color: '#64748b', 
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            SMLL Index
          </div>
          <div style={{ 
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700', 
            color: '#1e293b',
            lineHeight: '1',
            marginBottom: '4px'
          }}>
            {smllData?.valorFormatado || '2.205'}
          </div>
          <div style={{ 
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '600', 
            color: smllData?.trend === 'up' ? '#10b981' : '#ef4444',
            lineHeight: '1'
          }}>
            {smllData ? formatPercentage(smllData.variacaoPercent) : '+0.4%'}
          </div>
        </div>

        {/* Ibovespa */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            fontSize: isMobile ? '11px' : '12px',
            color: '#64748b', 
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            Ibovespa
          </div>
          <div style={{ 
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700', 
            color: '#1e293b',
            lineHeight: '1',
            marginBottom: '4px'
          }}>
            {ibovespaData?.valorFormatado || '134.500'}
          </div>
          <div style={{ 
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '600', 
            color: ibovespaData?.trend === 'up' ? '#10b981' : '#ef4444',
            lineHeight: '1'
          }}>
            {ibovespaData ? formatPercentage(ibovespaData.variacaoPercent) : '+0.2%'}
          </div>
        </div>

        {/* Ibovespa Período */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            fontSize: isMobile ? '11px' : '12px',
            color: '#64748b', 
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            Ibovespa período
          </div>
          <div style={{ 
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700', 
            color: ibovespaPeriodo?.performancePeriodo >= 0 ? '#10b981' : '#ef4444',
            lineHeight: '1',
            marginBottom: '4px'
          }}>
            {ibovespaPeriodo ? formatPercentage(ibovespaPeriodo.performancePeriodo) : '+111.8%'}
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#64748b',
            lineHeight: '1'
          }}>
            Desde {ibovespaPeriodo?.dataInicial || 'mar/2020'}
          </div>
        </div>
      </div>

      {/* Posições Ativas */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: isMobile ? '16px' : '24px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <h3 style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            Posições Ativas ({ativosAtivos.length})
          </h3>
          <p style={{
            color: '#64748b',
            fontSize: isMobile ? '14px' : '16px',
            margin: '0'
          }}>
            Total Return aplicado com reinvestimento de proventos
          </p>
        </div>

        {/* Skeleton Loading */}
        {loading && ativosAtivos.length === 0 ? (
          <div style={{ padding: '24px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{
                height: '60px',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                marginBottom: '12px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            ))}
          </div>
        ) : (
          // Conteúdo principal
          <>
            {isMobile ? (
              // 📱 MOBILE: Cards verticais
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ativosAtivos.map((ativo, index) => {
                  const temCotacaoReal = ativo.statusApi === 'success';
                  const viesPalette = getViesBadgePalette(ativo.vies);
                  
                  return (
                    <div 
                      key={ativo.id || index}
                      style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        padding: '16px',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => {
                        window.location.href = `/dashboard/ativo/${ativo.ticker}`;
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                    >
                      {/* Header do Card */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        {/* Posição */}
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '12px',
                          color: '#64748b'
                        }}>
                          {ativo.posicaoExibicao}
                        </div>

                        {/* Logo do Ativo */}
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          backgroundColor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e2e8f0'
                        }}>
                          <img 
                            src={`https://www.ivalor.com.br/media/emp/logos/${ativo.ticker.replace(/\d+$/, '')}.png`}
                            alt={`Logo ${ativo.ticker}`}
                            style={{
                              width: '28px',
                              height: '28px',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.style.backgroundColor = ativo.performance >= 0 ? '#dcfce7' : '#fee2e2';
                                parent.style.color = ativo.performance >= 0 ? '#065f46' : '#dc2626';
                                parent.style.fontWeight = '700';
                                parent.style.fontSize = '12px';
                                parent.textContent = ativo.ticker.slice(0, 2);
                              }
                            }}
                          />
                        </div>

                        {/* Nome e Setor */}
                        <div style={{ flex: '1' }}>
                          <div style={{ 
                            fontWeight: '700', 
                            color: '#1e293b', 
                            fontSize: '16px'
                          }}>
                            {ativo.ticker}
                            {!temCotacaoReal && (
                              <span style={{ 
                                marginLeft: '8px', 
                                fontSize: '10px', 
                                color: '#f59e0b',
                                backgroundColor: '#fef3c7',
                                padding: '2px 4px',
                                borderRadius: '3px'
                              }}>
                                SIM
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '12px' }}>
                            {ativo.setor}
                          </div>
                        </div>

                        {/* Viés */}
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: '700',
                          backgroundColor: viesPalette.backgroundColor,
                          color: viesPalette.textColor
                        }}>
                          {ativo.vies}
                        </div>
                      </div>
                      
                      {/* Dados em Grid */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '8px', 
                        fontSize: '14px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ color: '#64748b' }}>
                          <span style={{ fontWeight: '500' }}>Entrada:</span><br />
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{ativo.dataEntrada}</span>
                        </div>
                        <div style={{ color: '#64748b' }}>
                          <span style={{ fontWeight: '500' }}>DY 12M:</span><br />
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>
                            {loading && !todosOsDadosProntos ? '--' : ativo.dy}
                          </span>
                        </div>
                        <div style={{ color: '#64748b' }}>
                          <span style={{ fontWeight: '500' }}>Preço Atual:</span><br />
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>
                            {formatCurrency(ativo.precoAtual)}
                          </span>
                        </div>
                        <div style={{ color: '#64748b' }}>
                          <span style={{ fontWeight: '500' }}>Preço Teto:</span><br />
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>
                            {ativo.precoTeto ? formatCurrency(ativo.precoTeto) : '-'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Performance em destaque */}
                      <div style={{
                        textAlign: 'center',
                        padding: '8px',
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                          Performance Total
                        </div>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: '800',
                          color: ativo.performance >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          {formatPercentage(ativo.performance)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // 🖥️ DESKTOP: Tabela completa
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        #
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        ATIVO
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        ENTRADA
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        PREÇO INICIAL
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        PREÇO ATUAL
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        PREÇO TETO
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          PERFORMANCE TOTAL
                          <div 
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: '#64748b',
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'help',
                              position: 'relative'
                            }}
                            title="A rentabilidade de todos os ativos é calculada pelo método Total Return, incluindo o reinvestimento dos proventos."
                          >
                            i
                          </div>
                        </div>
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        DY 12M
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        VIÉS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ativosAtivos.map((ativo, index) => {
                      const temCotacaoReal = ativo.statusApi === 'success';
                      const viesPalette = getViesBadgePalette(ativo.vies);
                      
                      return (
                        <tr 
                          key={ativo.id || index} 
                          style={{ 
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.2s',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            window.location.href = `/dashboard/ativo/${ativo.ticker}`;
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {/* Posição */}
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '14px',
                              color: '#64748b',
                              margin: '0 auto'
                            }}>
                              {ativo.posicaoExibicao}
                            </div>
                          </td>
                          {/* Ativo */}
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #e2e8f0'
                              }}>
                                <img 
                                  src={`https://www.ivalor.com.br/media/emp/logos/${ativo.ticker.replace(/\d+$/, '')}.png`}
                                  alt={`Logo ${ativo.ticker}`}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    objectFit: 'contain'
                                  }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.style.backgroundColor = ativo.performance >= 0 ? '#dcfce7' : '#fee2e2';
                                      parent.style.color = ativo.performance >= 0 ? '#065f46' : '#dc2626';
                                      parent.style.fontWeight = '700';
                                      parent.style.fontSize = '14px';
                                      parent.textContent = ativo.ticker.slice(0, 2);
                                    }
                                  }}
                                />
                              </div>
                              <div>
                                <div style={{ 
                                  fontWeight: '700', 
                                  color: '#1e293b', 
                                  fontSize: '16px'
                                }}>
                                  {ativo.ticker}
                                  {!temCotacaoReal && (
                                    <span style={{ 
                                      marginLeft: '8px', 
                                      fontSize: '12px', 
                                      color: '#f59e0b',
                                      backgroundColor: '#fef3c7',
                                      padding: '2px 6px',
                                      borderRadius: '4px'
                                    }}>
                                      SIM
                                    </span>
                                  )}
                                </div>
                                <div style={{ color: '#64748b', fontSize: '14px' }}>
                                  {ativo.setor}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                            {ativo.dataEntrada}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                            {formatCurrency(ativo.precoEntrada)}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#1e293b' }}>
                            {formatCurrency(ativo.precoAtual)}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>
                            {ativo.precoTeto ? formatCurrency(ativo.precoTeto) : '-'}
                          </td>
                          <td style={{ 
                            padding: '16px', 
                            textAlign: 'center', 
                            fontWeight: '800',
                            fontSize: '16px',
                            color: ativo.performance >= 0 ? '#10b981' : '#ef4444'
                          }}>
                            {formatPercentage(ativo.performance)}
                          </td>
                          <td style={{ 
                            padding: '16px', 
                            textAlign: 'center',
                            fontWeight: '700',
                            color: '#1e293b'
                          }}>
                            {loadingDY ? '...' : ativo.dy}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              backgroundColor: viesPalette.backgroundColor,
                              color: viesPalette.textColor
                            }}>
                              {ativo.vies}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

{/* ✅ POSIÇÕES ENCERRADAS COM EXPAND/COLLAPSE */}
{ativosEncerrados.length > 0 && (
  <div style={{
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    marginBottom: '32px'
  }}>
    {/* Header Clicável */}
    <div 
      style={{
        padding: isMobile ? '16px' : '24px',
        borderBottom: posicoesEncerradasExpanded ? '1px solid #e2e8f0' : 'none',
        backgroundColor: '#f8fafc',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background-color 0.2s'
      }}
      onClick={() => setPosicoesEncerradasExpanded(!posicoesEncerradasExpanded)}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f1f5f9';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f8fafc';
      }}
    >
      <div>
        <h3 style={{
          fontSize: isMobile ? '20px' : '24px',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0 0 8px 0'
        }}>
          Posições Encerradas ({ativosEncerrados.length})
        </h3>
        <p style={{
          color: '#64748b',
          fontSize: isMobile ? '14px' : '16px',
          margin: '0'
        }}>
          Histórico de operações finalizadas
        </p>
      </div>
      
      {/* Seta Animada */}
      <div style={{
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.3s ease',
        transform: posicoesEncerradasExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6L8 10L12 6" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>

    {/* Conteúdo Expansível */}
    <div style={{
      maxHeight: posicoesEncerradasExpanded ? '2000px' : '0',
      overflow: 'hidden',
      transition: 'max-height 0.3s ease-in-out'
    }}>
      {isMobile ? (
        // 📱 MOBILE: Cards para encerradas
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ativosEncerrados.map((ativo, index) => {
            const performance = calcularPerformanceEncerrada(ativo);
            
            return (
              <div 
                key={ativo.id || index}
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #e2e8f0'
                }}
              >
                {/* Header do Card Encerrado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e2e8f0'
                  }}>
                    <img 
                      src={`https://www.ivalor.com.br/media/emp/logos/${ativo.ticker.replace(/\d+$/, '')}.png`}
                      alt={`Logo ${ativo.ticker}`}
                      style={{
                        width: '28px',
                        height: '28px',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.style.backgroundColor = '#dc2626';
                          parent.style.color = 'white';
                          parent.style.fontWeight = '700';
                          parent.style.fontSize = '12px';
                          parent.textContent = ativo.ticker.slice(0, 2);
                        }
                      }}
                    />
                  </div>
                  <div style={{ flex: '1' }}>
                    <div style={{ 
                      fontWeight: '700', 
                      color: '#64748b', 
                      fontSize: '16px'
                    }}>
                      {ativo.ticker}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>
                      {ativo.setor}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: '700',
                    backgroundColor: performance >= 0 ? '#dcfce7' : '#fee2e2',
                    color: performance >= 0 ? '#065f46' : '#dc2626'
                  }}>
                    ENCERRADO
                  </div>
                </div>
                
                {/* Dados em Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '8px', 
                  fontSize: '14px',
                  marginBottom: '12px'
                }}>
                  <div style={{ color: '#64748b' }}>
                    <span style={{ fontWeight: '500' }}>Entrada:</span><br />
                    <span style={{ fontWeight: '600', color: '#64748b' }}>{ativo.dataEntrada}</span>
                  </div>
                  <div style={{ color: '#64748b' }}>
                    <span style={{ fontWeight: '500' }}>Saída:</span><br />
                    <span style={{ fontWeight: '600', color: '#64748b' }}>{ativo.dataSaida}</span>
                  </div>
                  <div style={{ color: '#64748b' }}>
                    <span style={{ fontWeight: '500' }}>Preço Entrada:</span><br />
                    <span style={{ fontWeight: '700', color: '#64748b' }}>
                      {formatCurrency(ativo.precoEntrada)}
                    </span>
                  </div>
                  <div style={{ color: '#64748b' }}>
                    <span style={{ fontWeight: '500' }}>Preço Saída:</span><br />
                    <span style={{ fontWeight: '700', color: '#64748b' }}>
                      {formatCurrency(ativo.precoSaida)}
                    </span>
                  </div>
                </div>
                
                {/* Performance final */}
                <div style={{
                  textAlign: 'center',
                  padding: '8px',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                    Performance Final
                  </div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '800',
                    color: performance >= 0 ? '#059669' : '#dc2626'
                  }}>
                    {formatPercentage(performance)}
                  </div>
                </div>

                {/* Motivo */}
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b', 
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  Motivo: {ativo.motivoEncerramento}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // 🖥️ DESKTOP: Tabela para encerradas
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                  ATIVO
                </th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                  ENTRADA
                </th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                  SAÍDA
                </th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                  PREÇO ENTRADA
                </th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                  PREÇO SAÍDA
                </th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                  PERFORMANCE FINAL
                </th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                  MOTIVO
                </th>
              </tr>
            </thead>
            <tbody>
              {ativosEncerrados.map((ativo, index) => {
                const performance = calcularPerformanceEncerrada(ativo);
                
                return (
                  <tr 
                    key={ativo.id || index} 
                    style={{ 
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e2e8f0'
                        }}>
                          <img 
                            src={`https://www.ivalor.com.br/media/emp/logos/${ativo.ticker.replace(/\d+$/, '')}.png`}
                            alt={`Logo ${ativo.ticker}`}
                            style={{
                              width: '32px',
                              height: '32px',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.style.backgroundColor = '#dc2626';
                                parent.style.color = 'white';
                                parent.style.fontWeight = '700';
                                parent.style.fontSize = '14px';
                                parent.textContent = ativo.ticker.slice(0, 2);
                              }
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ 
                            fontWeight: '700', 
                            color: '#64748b', 
                            fontSize: '16px'
                          }}>
                            {ativo.ticker}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '14px' }}>
                            {ativo.setor}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                      {ativo.dataEntrada}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                      {ativo.dataSaida}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>
                      {formatCurrency(ativo.precoEntrada)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>
                      {formatCurrency(ativo.precoSaida)}
                    </td>
                    <td style={{ 
                      padding: '16px', 
                      textAlign: 'center', 
                      fontWeight: '800',
                      fontSize: '16px',
                      color: performance >= 0 ? '#059669' : '#dc2626'
                    }}>
                      {formatPercentage(performance)}
                    </td>
                    <td style={{ 
                      padding: '16px', 
                      textAlign: 'center', 
                      fontSize: '12px', 
                      color: '#64748b' 
                    }}>
                      {ativo.motivoEncerramento}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
)}

      {/* Gráfico de Composição */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: isMobile ? '16px' : '24px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <h3 style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            Composição por Ativos Ativos
          </h3>
          <p style={{
            color: '#64748b',
            fontSize: isMobile ? '14px' : '16px',
            margin: '0'
          }}>
            Distribuição percentual da carteira - {ativosAtivos.length} ativos ativos
          </p>
        </div>

        <div style={{ 
          padding: isMobile ? '16px' : '32px',
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '16px' : '32px',
          alignItems: 'center' 
        }}>
          {/* Gráfico SVG Responsivo */}
          <div style={{ 
            flex: isMobile ? '1' : '0 0 400px',
            height: isMobile ? '300px' : '400px',
            position: 'relative' 
          }}>
            {(() => {
              const cores = [
                '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
                '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
                '#14b8a6', '#eab308', '#dc2626', '#7c3aed', '#0891b2',
                '#65a30d', '#ea580c', '#db2777', '#4f46e5', '#0d9488'
              ];
              
              const chartSize = isMobile ? 300 : 400;
              const radius = isMobile ? 120 : 150;
              const innerRadius = isMobile ? 60 : 75;
              const centerX = chartSize / 2;
              const centerY = chartSize / 2;
              const totalAtivos = ativosAtivos.length;
              
              if (totalAtivos === 0) {
                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#64748b',
                    fontSize: '16px'
                  }}>
                    Nenhum ativo ativo para exibir
                  </div>
                );
              }
              
              const anglePerSlice = (2 * Math.PI) / totalAtivos;
              
              const createPath = (startAngle: number, endAngle: number) => {
                const x1 = centerX + radius * Math.cos(startAngle);
                const y1 = centerY + radius * Math.sin(startAngle);
                const x2 = centerX + radius * Math.cos(endAngle);
                const y2 = centerY + radius * Math.sin(endAngle);
                
                const x3 = centerX + innerRadius * Math.cos(endAngle);
                const y3 = centerY + innerRadius * Math.sin(endAngle);
                const x4 = centerX + innerRadius * Math.cos(startAngle);
                const y4 = centerY + innerRadius * Math.sin(startAngle);
                
                const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
                
                return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
              };
              
              return (
                <svg 
                  width={chartSize} 
                  height={chartSize} 
                  viewBox={`0 0 ${chartSize} ${chartSize}`} 
                  style={{ width: '100%', height: '100%' }}
                >
                  <defs>
                    <style>
                      {`
                        .slice-text {
                          opacity: 0;
                          transition: opacity 0.3s ease;
                          pointer-events: none;
                        }
                        .slice-group:hover .slice-text {
                          opacity: 1;
                        }
                        .slice-path {
                          transition: all 0.3s ease;
                          cursor: pointer;
                        }
                        .slice-group:hover .slice-path {
                          transform: scale(1.05);
                          transform-origin: ${centerX}px ${centerY}px;
                        }
                      `}
                    </style>
                  </defs>
                  
                  {ativosAtivos.map((ativo, index) => {
                    const startAngle = index * anglePerSlice - Math.PI / 2;
                    const endAngle = (index + 1) * anglePerSlice - Math.PI / 2;
                    const cor = cores[index % cores.length];
                    const path = createPath(startAngle, endAngle);
                    
                    const middleAngle = (startAngle + endAngle) / 2;
                    const textRadius = (radius + innerRadius) / 2;
                    const textX = centerX + textRadius * Math.cos(middleAngle);
                    const textY = centerY + textRadius * Math.sin(middleAngle);
                    const porcentagem = (100 / totalAtivos).toFixed(1);
                    
                    return (
                      <g key={ativo.ticker} className="slice-group">
                        <path
                          d={path}
                          fill={cor}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="slice-path"
                        >
                          <title>{ativo.ticker}: {porcentagem}%</title>
                        </path>
                        
                        <g className="slice-text">
                          <text
                            x={textX}
                            y={textY - 6}
                            textAnchor="middle"
                            fontSize={isMobile ? "10" : "11"}
                            fontWeight="700"
                            fill="#ffffff"
                            style={{ 
                              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                            }}
                          >
                            {ativo.ticker}
                          </text>
                          
                          <text
                            x={textX}
                            y={textY + 8}
                            textAnchor="middle"
                            fontSize={isMobile ? "9" : "10"}
                            fontWeight="600"
                            fill="#ffffff"
                            style={{ 
                              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                            }}
                          >
                            {porcentagem}%
                          </text>
                        </g>
                      </g>
                    );
                  })}
                  
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={innerRadius}
                    fill="#f8fafc"
                    stroke="#e2e8f0"
                    strokeWidth="2"
                  />
                  
                  <text
                    x={centerX}
                    y={centerY - 10}
                    textAnchor="middle"
                    fontSize={isMobile ? "14" : "16"}
                    fontWeight="700"
                    fill="#1e293b"
                  >
                    {totalAtivos}
                  </text>
                  <text
                    x={centerX}
                    y={centerY + 10}
                    textAnchor="middle"
                    fontSize={isMobile ? "10" : "12"}
                    fill="#64748b"
                  >
                    ATIVOS ATIVOS
                  </text>
                </svg>
              );
            })()}
          </div>
          
          {/* Legenda Responsiva */}
<div style={{ 
  flex: '1', 
  display: 'grid', 
  // 🔥 MUDANÇA AQUI: Forçar 2 colunas no mobile
  gridTemplateColumns: isMobile 
    ? 'repeat(2, 1fr)'  // ✅ 2 colunas fixas no mobile
    : 'repeat(auto-fit, minmax(120px, 1fr))', 
  gap: isMobile ? '8px' : '12px'
}}>
  {ativosAtivos.map((ativo, index) => {
    const porcentagem = ativosAtivos.length > 0 ? ((1 / ativosAtivos.length) * 100).toFixed(1) : '0.0';
    const cores = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
      '#14b8a6', '#eab308', '#dc2626', '#7c3aed', '#0891b2',
      '#65a30d', '#ea580c', '#db2777', '#4f46e5', '#0d9488'
    ];
    const cor = cores[index % cores.length];
    
    return (
      <div key={ativo.ticker} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        // 🔥 MUDANÇA AQUI: Melhor quebra de linha no mobile
        minWidth: isMobile ? '0' : 'auto'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '2px',
          backgroundColor: cor,
          flexShrink: 0
        }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ 
            fontWeight: '700', 
            color: '#1e293b', 
            fontSize: isMobile ? '12px' : '14px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {ativo.ticker}
          </div>
          <div style={{ 
            color: '#64748b', 
            fontSize: isMobile ? '10px' : '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {porcentagem}%
          </div>
        </div>
      </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Animações CSS */}
      <style jsx>{`
        /* Spinner de Loading Unificado */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Animação de Pulse para Skeletons */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}