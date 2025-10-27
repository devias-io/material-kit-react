/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use client';

import * as React from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useDataStore } from '@/hooks/useDataStore';
import { aplicarViesOverride, getViesBadgePalette, type ViesOverride } from '@/utils/vies';

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

const WHITE_LOGO_TICKERS = ['XP', 'UNH', 'QQQ', 'ARE','WPC'];
const CUSTOM_LOGO_URLS: Record<string, string> = {
  XP: 'https://logo.clearbit.com/xpi.com.br',
  UNH: 'https://logo.clearbit.com/unitedhealthgroup.com',
  QQQ: 'https://logo.clearbit.com/invesco.com',
  WPC: 'https://logo.clearbit.com/wpcarey.com',
  ARE: 'https://investidor10.com.br/storage/stocks/thumbnails/rbQCq2xzJWAfLgUdBYeJJAymyTHUU0Bn4lFs5jpw.jpg'
};

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

// 🚀 HOOK PARA ÍNDICES INTERNACIONAIS SINCRONIZADO
function useIndicesInternacionaisRealTime() {
  const [indicesData, setIndicesData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isMobile = useDeviceDetection();

  const buscarIndicesReal = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ VERIFICAR CACHE GLOBAL PRIMEIRO
      const cacheKey = 'indices_internacionais_unified';
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log('📋 ÍNDICES: Usando cache global');
        setIndicesData(cached);
        setLoading(false);
        return;
      }

      console.log('🔍 BUSCANDO ÍNDICES INTERNACIONAIS - ESTRATÉGIA UNIFICADA...');
      console.log('📱 Device Info:', { isMobile });

      const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
      const indices = ['^GSPC', '^IXIC']; // S&P 500 e NASDAQ
      const indicesUrl = `https://brapi.dev/api/quote/${indices.join(',')}?token=${BRAPI_TOKEN}`;
      
      let dadosIndicesObtidos = false;
      let dadosIndices = null;

      // 🎯 ESTRATÉGIA 1: DESKTOP STYLE (PRIORIDADE MÁXIMA)
      console.log('🎯 ÍNDICES: Tentativa 1 - Estratégia Desktop (Unificada)');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(indicesUrl, {
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
          console.log('🎯📊 ÍNDICES Resposta (Estratégia Unificada):', data);

          if (data.results && data.results.length > 0) {
            const dadosProcessados = {
              sp500: null,
              nasdaq: null
            };

            data.results.forEach((indice: any) => {
              if (indice.symbol === '^GSPC') {
                dadosProcessados.sp500 = {
                  valor: indice.regularMarketPrice,
                  valorFormatado: indice.regularMarketPrice.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  }),
                  variacao: indice.regularMarketChange || 0,
                  variacaoPercent: indice.regularMarketChangePercent || 0,
                  trend: (indice.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down'
                };
              } else if (indice.symbol === '^IXIC') {
                dadosProcessados.nasdaq = {
                  valor: indice.regularMarketPrice,
                  valorFormatado: indice.regularMarketPrice.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  }),
                  variacao: indice.regularMarketChange || 0,
                  variacaoPercent: indice.regularMarketChangePercent || 0,
                  trend: (indice.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down'
                };
              }
            });

            dadosIndices = dadosProcessados;
            console.log('🎯✅ ÍNDICES obtidos (Estratégia Unificada):', dadosIndices);
            dadosIndicesObtidos = true;
          }
        }
      } catch (error) {
        console.log('🎯❌ ÍNDICES (Estratégia Unificada):', error instanceof Error ? error.message : 'Erro desconhecido');
      }

      // 🔄 FALLBACK APENAS PARA MOBILE SE PRIMEIRA ESTRATÉGIA FALHOU
      if (!dadosIndicesObtidos && isMobile) {
        console.log('📱 ÍNDICES: Usando fallback mobile');
        
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          console.log('📱🔄 ÍNDICES: Fallback - Sem User-Agent');
          
          const response = await fetch(indicesUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const dadosProcessados = {
                sp500: null,
                nasdaq: null
              };

              data.results.forEach((indice: any) => {
                if (indice.symbol === '^GSPC') {
                  dadosProcessados.sp500 = {
                    valor: indice.regularMarketPrice,
                    valorFormatado: indice.regularMarketPrice.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    }),
                    variacao: indice.regularMarketChange || 0,
                    variacaoPercent: indice.regularMarketChangePercent || 0,
                    trend: (indice.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down'
                  };
                } else if (indice.symbol === '^IXIC') {
                  dadosProcessados.nasdaq = {
                    valor: indice.regularMarketPrice,
                    valorFormatado: indice.regularMarketPrice.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    }),
                    variacao: indice.regularMarketChange || 0,
                    variacaoPercent: indice.regularMarketChangePercent || 0,
                    trend: (indice.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down'
                  };
                }
              });

              dadosIndices = dadosProcessados;
              console.log('📱✅ ÍNDICES obtidos (Fallback):', dadosIndices);
              dadosIndicesObtidos = true;
            }
          }
        } catch (error) {
          console.log('📱❌ ÍNDICES (Fallback):', error instanceof Error ? error.message : 'Erro desconhecido');
        }
      }

      // ✅ SE OBTEVE DADOS, USAR E CACHEAR
      if (dadosIndicesObtidos && dadosIndices) {
        setCachedData(cacheKey, dadosIndices);
        setIndicesData(dadosIndices);
        return;
      }

      // 🔄 FALLBACK FINAL UNIFICADO
      console.log('🔄 ÍNDICES: Usando fallback unificado...');
      const fallbackData = {
        sp500: {
          valor: 5970.80,
          valorFormatado: '5,970.80',
          variacao: 35.2,
          variacaoPercent: 0.59,
          trend: 'up'
        },
        nasdaq: {
          valor: 19400.00,
          valorFormatado: '19,400.00',
          variacao: 156.3,
          variacaoPercent: 0.81,
          trend: 'up'
        }
      };
      
      console.log('⚠️ ÍNDICES FALLBACK UNIFICADO:', fallbackData);
      setCachedData(cacheKey, fallbackData);
      setIndicesData(fallbackData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro geral desconhecido';
      console.error('❌ Erro geral ao buscar índices:', err);
      setError(errorMessage);
      
      // FALLBACK DE EMERGÊNCIA
      const dadosEmergencia = {
        sp500: {
          valor: 5970.80,
          valorFormatado: '5,970.80',
          variacao: 35.2,
          variacaoPercent: 0.59,
          trend: 'up'
        },
        nasdaq: {
          valor: 19400.00,
          valorFormatado: '19,400.00',
          variacao: 156.3,
          variacaoPercent: 0.81,
          trend: 'up'
        }
      };
      
      setIndicesData(dadosEmergencia);
    } finally {
      setLoading(false);
    }
  }, [isMobile]);

  React.useEffect(() => {
    buscarIndicesReal();
    const interval = setInterval(buscarIndicesReal, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [buscarIndicesReal]);

  return { indicesData, loading, error, refetch: buscarIndicesReal };
}

// 🔥 FUNÇÃO PARA CALCULAR O VIÉS AUTOMATICAMENTE
function calcularViesAutomatico(
  precoTeto: number | undefined,
  precoAtual: string,
  override?: ViesOverride | null
): string {
  if (!precoTeto || precoAtual === 'N/A' || precoTeto === 0) {
    return aplicarViesOverride(override, 'Compra');
  }

  const precoAtualNum = parseFloat(precoAtual.replace('US$', '').replace(',', '.'));

  if (isNaN(precoAtualNum)) {
    return aplicarViesOverride(override, 'Compra');
  }

  const viesAutomatico = precoAtualNum < precoTeto ? 'Compra' : 'Aguardar';
  return aplicarViesOverride(override, viesAutomatico);
}

// 🚀 FUNÇÃO OTIMIZADA PARA BUSCAR COTAÇÕES - ESTRATÉGIA MOBILE/DESKTOP
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

// 🔄 FUNÇÃO PARA IDENTIFICAR SE É ETF
function isETF(ticker: string): boolean {
  const tickerUpper = ticker.toUpperCase();
  
  // Lista de ETFs conhecidos
  const etfsConhecidos = [
    'VOO', 'SPY', 'QQQ', 'IVV', 'VTI', 'SCHD', 
    'VGT', 'XLK', 'VUG', 'VTV', 'VYM', 'VXUS',
    'BND', 'AGG', 'TLT', 'GLD', 'SLV', 'USO'
  ];
  
  return etfsConhecidos.includes(tickerUpper);
}

// 🔄 FUNÇÃO PARA DETERMINAR FREQUÊNCIA DE DIVIDENDOS
function getFrequenciaDividendos(ticker: string): number {
  const tickerUpper = ticker.toUpperCase();
  
  // 📊 Empresas que pagam ANUALMENTE (1x por ano)
  const empresasAnuais = [
    'XP',      // XP Inc. - paga anual
    'NU',      // Nubank - paga anual
    'PAGS',    // PagSeguro - paga anual
    'STNE',    // Stone - paga anual
    'ARCO',    // Arco Platform - paga anual
    'BRFS',    // BRF - paga anual
  ];
  
  if (empresasAnuais.includes(tickerUpper)) {
    return 1; // Anual
  }
  
  // 📊 Empresas que pagam SEMESTRALMENTE (2x por ano)
  const empresasSemestrais = [
    'VALE',    // Vale - paga semestral
    'ITUB',    // Itaú (ADR) - paga semestral
    'BBD',     // Bradesco (ADR) - paga semestral
  ];
  
  if (empresasSemestrais.includes(tickerUpper)) {
    return 2; // Semestral
  }
  
  // 📊 Default: empresas americanas pagam TRIMESTRAL (4x por ano)
  return 4;
}

// 🔄 FUNÇÃO PARA BUSCAR DY VIA API - VERSÃO FINAL COM SUPORTE A ETFs
async function buscarDYsComEstrategia(tickers: string[], isMobile: boolean): Promise<Map<string, string>> {
  const dyMap = new Map<string, string>();
  const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
  
  console.log('📈 [OTIMIZADO] Buscando DY para', tickers.length, 'tickers EM PARALELO...');
  
  // ✅ BATCH REQUEST PRIMEIRO
  try {
    const batchUrl = `https://brapi.dev/api/quote/${tickers.join(',')}?modules=defaultKeyStatistics&token=${BRAPI_TOKEN}`;
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
          let dy = null;
          
          // 🎯 ESTRATÉGIA 1: Verificar se é ETF
          if (isETF(ticker)) {
            // Para ETFs, usar o campo "yield" que já vem em %
            const etfYield = result.defaultKeyStatistics?.yield;
            
            if (etfYield && etfYield > 0) {
              dy = etfYield; // Já está em formato decimal (0.0115 = 1.15%)
              
              console.log(`📊 [ETF-YIELD] ${ticker}: ${(dy * 100).toFixed(2)}%`);
              console.log(`   - Tipo: ETF`);
              console.log(`   - Yield direto da API: ${(dy * 100).toFixed(2)}%`);
            }
          } else {
            // 🎯 ESTRATÉGIA 2: Ações - tentar dividendYield da API
            dy = result.defaultKeyStatistics?.dividendYield;
            
            // 🎯 ESTRATÉGIA 3: Ações - calcular manualmente se necessário
            if (!dy || dy <= 0) {
              const lastDividendValue = result.defaultKeyStatistics?.lastDividendValue;
              const regularMarketPrice = result.regularMarketPrice;
              
              if (lastDividendValue && regularMarketPrice && regularMarketPrice > 0) {
                const frequencia = getFrequenciaDividendos(ticker);
                const dividendoAnual = lastDividendValue * frequencia;
                dy = dividendoAnual / regularMarketPrice;
                
                const frequenciaTexto = frequencia === 1 ? 'ANUAL' : 
                                       frequencia === 2 ? 'SEMESTRAL' : 'TRIMESTRAL';
                
                console.log(`💡 [DY-CALC] ${ticker}: Calculado (${frequenciaTexto})`);
                console.log(`   - Tipo: Ação`);
                console.log(`   - Último dividendo: $${lastDividendValue.toFixed(2)}`);
                console.log(`   - Frequência: ${frequencia}x ao ano`);
                console.log(`   - Dividendo anual: $${dividendoAnual.toFixed(2)}`);
                console.log(`   - Preço atual: $${regularMarketPrice.toFixed(2)}`);
                console.log(`   - DY calculado: ${(dy * 100).toFixed(2)}%`);
              }
            }
          }
          
          if (dy && dy > 0) {
            dyMap.set(ticker, `${(dy * 100).toFixed(2).replace('.', ',')}%`);
            console.log(`✅ [DY] ${ticker}: ${(dy * 100).toFixed(2)}%`);
          } else {
            dyMap.set(ticker, '0,00%');
            console.log(`❌ [DY] ${ticker}: Sem dividendos/yield`);
          }
        });
        
        return dyMap;
      }
    }
  } catch (error) {
    console.log('❌ DY Batch falhou, usando paralelo individual');
  }
  
  // ✅ PARALELO INDIVIDUAL (mesma lógica)
  const promises = tickers.map(async (ticker) => {
    try {
      const response = await Promise.race([
        fetch(`https://brapi.dev/api/quote/${ticker}?modules=defaultKeyStatistics&token=${BRAPI_TOKEN}`, {
          headers: { 'Accept': 'application/json' }
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DY timeout')), 4000))
      ]);

      if (response.ok) {
        const data = await response.json();
        const result = data.results?.[0];
        let dy = null;
        
        // 🎯 ESTRATÉGIA 1: Verificar se é ETF
        if (isETF(ticker)) {
          const etfYield = result?.defaultKeyStatistics?.yield;
          
          if (etfYield && etfYield > 0) {
            dy = etfYield;
            
            console.log(`📊 [ETF-YIELD] ${ticker}: ${(dy * 100).toFixed(2)}%`);
            console.log(`   - Tipo: ETF`);
            console.log(`   - Yield direto da API: ${(dy * 100).toFixed(2)}%`);
          }
        } else {
          // 🎯 ESTRATÉGIA 2: Ações - tentar dividendYield da API
          dy = result?.defaultKeyStatistics?.dividendYield;
          
          // 🎯 ESTRATÉGIA 3: Ações - calcular manualmente se necessário
          if (!dy || dy <= 0) {
            const lastDividendValue = result?.defaultKeyStatistics?.lastDividendValue;
            const regularMarketPrice = result?.regularMarketPrice;
            
            if (lastDividendValue && regularMarketPrice && regularMarketPrice > 0) {
              const frequencia = getFrequenciaDividendos(ticker);
              const dividendoAnual = lastDividendValue * frequencia;
              dy = dividendoAnual / regularMarketPrice;
              
              const frequenciaTexto = frequencia === 1 ? 'ANUAL' : 
                                     frequencia === 2 ? 'SEMESTRAL' : 'TRIMESTRAL';
              
              console.log(`💡 [DY-CALC] ${ticker}: Calculado (${frequenciaTexto})`);
              console.log(`   - Tipo: Ação`);
              console.log(`   - Último dividendo: $${lastDividendValue.toFixed(2)}`);
              console.log(`   - Frequência: ${frequencia}x ao ano`);
              console.log(`   - Dividendo anual: $${dividendoAnual.toFixed(2)}`);
              console.log(`   - Preço atual: $${regularMarketPrice.toFixed(2)}`);
              console.log(`   - DY calculado: ${(dy * 100).toFixed(2)}%`);
            }
          }
        }
        
        if (dy && dy > 0) {
          dyMap.set(ticker, `${(dy * 100).toFixed(2).replace('.', ',')}%`);
          console.log(`✅ [DY] ${ticker}: ${(dy * 100).toFixed(2)}%`);
        } else {
          dyMap.set(ticker, '0,00%');
          console.log(`❌ [DY] ${ticker}: Sem dividendos/yield`);
        }
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
  
  console.log('✅ [DY-OTIMIZADO] Concluído:', dyMap.size, 'de', tickers.length);
  console.log('📊 DY Final Map:', Object.fromEntries(dyMap));
  return dyMap;
}

// 🚀 HOOK PRINCIPAL OTIMIZADO COM PARALELIZAÇÃO TOTAL
function useProjetoAmericaIntegradas() {
  const { dados } = useDataStore();
  const [ativosAtualizados, setAtivosAtualizados] = React.useState<any[]>([]);
  const [cotacoesAtualizadas, setCotacoesAtualizadas] = React.useState<any>({});
  
  // Estados para garantir que TODOS os dados estejam prontos
  const [cotacoesCompletas, setCotacoesCompletas] = React.useState<Map<string, any>>(new Map());
  const [dyCompletos, setDyCompletos] = React.useState<Map<string, string>>(new Map());
  const [todosOsDadosProntos, setTodosOsDadosProntos] = React.useState(false);
  
  // Loading states granulares
  const [loadingCotacoes, setLoadingCotacoes] = React.useState(true);
  const [loadingDY, setLoadingDY] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isMobile = useDeviceDetection();
  const projetoAmericaData = dados.projetoAmerica || [];

  // 🎯 FUNÇÃO PRINCIPAL REESCRITA - PARALELIZAÇÃO TOTAL
  const buscarDadosCompletos = React.useCallback(async () => {
    if (projetoAmericaData.length === 0) {
      setAtivosAtualizados([]);
      setLoadingCotacoes(false);
      return;
    }

    try {
      setError(null);
      setTodosOsDadosProntos(false);
      const tickers = projetoAmericaData.map(ativo => ativo.ticker);
      
      console.log('🚀 INICIANDO BUSCA STEP-BY-STEP ROBUSTA - ESTRATÉGIA MOBILE UNIVERSAL...');
      
      // 🔄 RESET DOS ESTADOS
      setCotacoesCompletas(new Map());
      setDyCompletos(new Map());

      // ⚡ PARALELIZAÇÃO TOTAL
      console.log('⚡ EXECUTANDO TODAS AS ETAPAS EM PARALELO...');

      // Ativar todos os loadings
      setLoadingCotacoes(true);
      setLoadingDY(true);

      // Medir tempo
      const inicioTempo = performance.now();

      // EXECUTAR TUDO EM PARALELO
      const [cotacoesResult, dyResult] = await Promise.allSettled([
        buscarCotacoesParalelas(tickers, isMobile),
        buscarDYsComEstrategia(tickers, isMobile)
      ]);

      const tempoTotal = performance.now() - inicioTempo;
      console.log(`🎉 TODAS AS ETAPAS CONCLUÍDAS EM ${tempoTotal.toFixed(0)}ms!`);

      // Processar resultados
      const cotacoesMap = cotacoesResult.status === 'fulfilled' ? cotacoesResult.value : new Map();
      const dyMap = dyResult.status === 'fulfilled' ? dyResult.value : new Map();

      // Logs de debug
      console.log('📊 Cotações obtidas:', cotacoesMap.size, 'de', tickers.length);
      console.log('📈 DY obtidos:', dyMap.size, 'de', tickers.length);

      // Debug do DY
      console.log('🔍 [PARALLEL-DEBUG] dyMap processado:');
      console.log('🔍 [PARALLEL-DEBUG] dyMap.size:', dyMap.size);
      console.log('🔍 [PARALLEL-DEBUG] dyMap conteúdo:', Object.fromEntries(dyMap));

      // Atualizar estados
      setCotacoesCompletas(cotacoesMap);
      setDyCompletos(dyMap);

      // Desativar loadings
      setLoadingCotacoes(false);
      setLoadingDY(false);
      // Marcar como pronto para processamento final
      setTodosOsDadosProntos(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro na busca otimizada:', err);
      setTodosOsDadosProntos(true);
    }
  }, [projetoAmericaData, isMobile]);

  // 🏆 USEEFFECT QUE SÓ EXECUTA QUANDO TODOS OS DADOS ESTÃO PRONTOS
  React.useEffect(() => {
    if (!todosOsDadosProntos || projetoAmericaData.length === 0) return;
    
    console.log('🏆 PROCESSANDO PROJETO AMÉRICA - TODOS OS DADOS PRONTOS!');
    console.log('🔍 [DEPS-DEBUG] Verificando estados no momento da execução:');
    console.log('🔍 [DEPS-DEBUG] todosOsDadosProntos:', todosOsDadosProntos);
    console.log('🔍 [DEPS-DEBUG] projetoAmericaData.length:', projetoAmericaData.length);
    console.log('🔍 [DEPS-DEBUG] cotacoesCompletas.size:', cotacoesCompletas.size);
    console.log('🔍 [DEPS-DEBUG] dyCompletos.size:', dyCompletos.size);
    console.log('🔍 [DEPS-DEBUG] dyCompletos conteúdo:', Object.fromEntries(dyCompletos));
    
    console.log('📊 Dados disponíveis:', {
      cotacoes: cotacoesCompletas.size,
      dy: dyCompletos.size, 
      ativos: projetoAmericaData.length
    });

    const novasCotacoes: any = {};

    // 🎯 PROCESSAR TODOS OS ATIVOS
    const ativosFinais = projetoAmericaData.map((ativo, index) => {
      const cotacao = cotacoesCompletas.get(ativo.ticker);
      
      // 🔍 DEBUG DY ASSIGNMENT
      const dyAPI = dyCompletos.get(ativo.ticker) || '0,00%';
      console.log(`🔍 [ASSIGN-DEBUG] ${ativo.ticker}:`);
      console.log(`  - dyCompletos.size: ${dyCompletos.size}`);
      console.log(`  - dyCompletos.has('${ativo.ticker}'): ${dyCompletos.has(ativo.ticker)}`);
      console.log(`  - dyCompletos.get('${ativo.ticker}'): ${dyCompletos.get(ativo.ticker)}`);
      console.log(`  - dyAPI final: ${dyAPI}`);
      console.log(`  - loadingDY: ${loadingDY}`);
    
      if (cotacao && cotacao.precoAtual > 0) {
        // ✅ ATIVO COM COTAÇÃO REAL
        const precoAtualNum = cotacao.precoAtual;
        const performance = ((precoAtualNum - ativo.precoEntrada) / ativo.precoEntrada) * 100;
        
        // VALIDAR SE O PREÇO FAZ SENTIDO (para ações americanas, usar limite maior)
        const diferencaPercent = Math.abs(performance);
        if (diferencaPercent > 1000) {
          console.warn(`🚨 ${ativo.ticker}: Preço suspeito! Diferença de ${diferencaPercent.toFixed(1)}% - usando preço de entrada`);
          return {
            ...ativo,
            id: String(ativo.id || index + 1),
            precoAtual: ativo.precoEntrada,
            performance: 0,
            variacao: 0,
            variacaoPercent: 0,
            volume: 0,
            vies: calcularViesAutomatico(
              ativo.precoTeto,
              `US$ ${ativo.precoEntrada.toFixed(2)}`,
              ativo.viesOverride
            ),
            dy: dyAPI,
            statusApi: 'suspicious_price',
            nomeCompleto: cotacao.nome,
            posicaoExibicao: index + 1
          };
        }
        
        novasCotacoes[ativo.ticker] = precoAtualNum;
        
        console.log(`🏆 ${ativo.ticker}: DY final que será usado = ${dyAPI}`);
        
        return {
          ...ativo,
          id: String(ativo.id || index + 1),
          precoAtual: precoAtualNum,
          performance: performance,
          variacao: cotacao.variacao,
          variacaoPercent: cotacao.variacaoPercent,
          volume: cotacao.volume,
          vies: calcularViesAutomatico(
            ativo.precoTeto,
            `US$ ${precoAtualNum.toFixed(2)}`,
            ativo.viesOverride
          ),
          dy: dyAPI,
          statusApi: 'success',
          nomeCompleto: cotacao.nome,
          posicaoExibicao: index + 1
        };
      } else {
        // ⚠️ ATIVO SEM COTAÇÃO REAL
        console.log(`🏆 ${ativo.ticker}: (sem cotação) DY final que será usado = ${dyAPI}`);
        
        return {
          ...ativo,
          id: String(ativo.id || index + 1),
          precoAtual: ativo.precoEntrada,
          performance: 0,
          variacao: 0,
          variacaoPercent: 0,
          volume: 0,
          vies: calcularViesAutomatico(
            ativo.precoTeto,
            `US$ ${ativo.precoEntrada.toFixed(2)}`,
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
    
    console.log('🏆 PROJETO AMÉRICA PROCESSADO COM SUCESSO!');
  }, [todosOsDadosProntos, cotacoesCompletas, dyCompletos, projetoAmericaData, loadingDY]);

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
    error,
    refetch,
    isMobile,
    todosOsDadosProntos // ✅ Novo estado para debug
  };
}

// 🎯 COMPONENTE PRINCIPAL OTIMIZADO
export default function ProjetoAmericaPage() {
  const { dados } = useDataStore();
  const { 
    ativosAtualizados, 
    cotacoesAtualizadas, 
    setCotacoesAtualizadas, 
    loading, 
    loadingDY,
    isMobile,
    todosOsDadosProntos
  } = useProjetoAmericaIntegradas();
  
  const { indicesData } = useIndicesInternacionaisRealTime();

  // Valor por ativo para simulação
  const valorPorAtivo = 1000;

  // Métricas memoizadas
  const metricas = React.useMemo(() => {
    if (!ativosAtualizados || ativosAtualizados.length === 0) {
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

    const valorInicialTotal = ativosAtualizados.length * valorPorAtivo;
    let valorFinalTotal = 0;
    let melhorPerformance = -Infinity;
    let piorPerformance = Infinity;
    let melhorAtivo = null;
    let piorAtivo = null;

    ativosAtualizados.forEach((ativo) => {
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

    const dyValues = ativosAtualizados
      .map(ativo => parseFloat(ativo.dy.replace('%', '').replace(',', '.')))
      .filter(dy => !isNaN(dy) && dy > 0);
    
    const dyMedio = dyValues.length > 0 ? 
      dyValues.reduce((sum, dy) => sum + dy, 0) / dyValues.length : 0;

    return {
      valorInicial: valorInicialTotal,
      valorAtual: valorFinalTotal,
      rentabilidadeTotal,
      quantidadeAtivos: ativosAtualizados.length,
      melhorAtivo,
      piorAtivo,
      dyMedio
    };
  }, [ativosAtualizados]);

  // Funções auxiliares memoizadas
  const formatCurrency = React.useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  }, []);

  const formatPercentage = React.useCallback((value: number) => {
    const signal = value >= 0 ? '+' : '';
    return signal + value.toFixed(2) + '%';
  }, []);

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
          Projeto América
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
              Investimentos estratégicos no mercado americano • Dados atualizados a cada 15 minutos
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

        {/* DY Médio */}
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
            DY médio 12M
          </div>
          <div style={{ 
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '700', 
            color: '#1e293b',
            lineHeight: '1'
          }}>
            {loadingDY ? '...' : `${metricas.dyMedio.toFixed(1)}%`}
          </div>
        </div>

        {/* S&P 500 */}
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
            S&P 500
          </div>
          <div style={{ 
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700', 
            color: '#1e293b',
            lineHeight: '1',
            marginBottom: '4px'
          }}>
            {indicesData?.sp500?.valorFormatado || '5,970.80'}
          </div>
          <div style={{ 
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '600', 
            color: indicesData?.sp500?.trend === 'up' ? '#10b981' : '#ef4444',
            lineHeight: '1'
          }}>
            {indicesData?.sp500 ? formatPercentage(indicesData.sp500.variacaoPercent) : '+0.59%'}
          </div>
        </div>

        {/* NASDAQ */}
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
            NASDAQ 100
          </div>
          <div style={{ 
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700', 
            color: '#1e293b',
            lineHeight: '1',
            marginBottom: '4px'
          }}>
            {indicesData?.nasdaq?.valorFormatado || '19,400.00'}
          </div>
          <div style={{ 
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '600', 
            color: indicesData?.nasdaq?.trend === 'up' ? '#10b981' : '#ef4444',
            lineHeight: '1'
          }}>
            {indicesData?.nasdaq ? formatPercentage(indicesData.nasdaq.variacaoPercent) : '+0.81%'}
          </div>
        </div>
      </div>

      {/* Tabela de Ativos */}
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
            Projeto América • Performance Individual ({ativosAtualizados.length})
          </h3>
          <p style={{
            color: '#64748b',
            fontSize: isMobile ? '14px' : '16px',
            margin: '0'
          }}>
            Investimentos estratégicos no mercado americano com cotações em tempo real
          </p>
        </div>

        {/* Skeleton Loading */}
        {loading && ativosAtualizados.length === 0 ? (
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
                {ativosAtualizados.map((ativo, index) => {
                  const temCotacaoReal = ativo.statusApi === 'success';
                  const viesPalette = getViesBadgePalette(ativo.vies);
                  const ticker = (ativo.ticker ?? '').toUpperCase();
                  const logoSrc = CUSTOM_LOGO_URLS[ticker] ?? `https://financialmodelingprep.com/image-stock/${ticker}.png`;
                  
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
                          backgroundColor: WHITE_LOGO_TICKERS.includes(ticker)
                            ? '#f1f5f9'
                            : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          padding: '4px'
                        }}>
                          <img 
                            src={logoSrc}
                            alt={`Logo ${ticker}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              borderRadius: '2px'
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
                                parent.style.letterSpacing = '0.5px';
                                parent.textContent = ticker.slice(0, 2);
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
                          Performance
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
                        SETOR
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
                        PERFORMANCE
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
                    {ativosAtualizados.map((ativo, index) => {
                      const temCotacaoReal = ativo.statusApi === 'success';
                      const viesPalette = getViesBadgePalette(ativo.vies);
                      const ticker = (ativo.ticker ?? '').toUpperCase();
                      const logoSrc = CUSTOM_LOGO_URLS[ticker] ?? `https://financialmodelingprep.com/image-stock/${ticker}.png`;
                      
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
                            e.currentTarget.style.backgroundColor =e.currentTarget.style.backgroundColor = '#f8fafc';
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
                                width: '48px',
                                height: '48px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: WHITE_LOGO_TICKERS.includes(ticker)
                                  ? '#f1f5f9'
                                  : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                padding: '6px',
                                flexShrink: 0
                              }}>
                                <img 
                                  src={logoSrc}
                                  alt={`Logo ${ticker}`}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    objectFit: 'cover',
                                    borderRadius: '2px',
                                    flexShrink: 0
                                  }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.style.backgroundColor = ativo.performance >= 0 ? '#dcfce7' : '#fee2e2';
                                      parent.style.color = ativo.performance >= 0 ? '#065f46' : '#991b1b';
                                      parent.style.fontWeight = '700';
                                      parent.style.fontSize = '14px';
                                      parent.style.letterSpacing = '0.5px';
                                      parent.textContent = ticker.slice(0, 2);
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
                                  {ativo.nomeCompleto || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                            {ativo.setor}
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

      {/* Gráfico de Composição por Setor */}
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
            Composição por Setor
          </h3>
          <p style={{
            color: '#64748b',
            fontSize: isMobile ? '14px' : '16px',
            margin: '0'
          }}>
            Distribuição setorial da carteira • {ativosAtualizados.length} ativos
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
              // Agrupar por setor
              const setoresMap = new Map();
              ativosAtualizados.forEach(ativo => {
                const setor = ativo.setor || 'Outros';
                setoresMap.set(setor, (setoresMap.get(setor) || 0) + 1);
              });
              
              const setores = Array.from(setoresMap.entries()).map(([setor, quantidade]) => ({
                setor,
                quantidade,
                porcentagem: (quantidade / ativosAtualizados.length) * 100
              }));
              
              const cores = [
                '#1e40af', '#3b82f6', '#06b6d4', '#10b981', '#84cc16', 
                '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899',
                '#8b5cf6', '#6366f1', '#4f46e5', '#7c3aed', '#0891b2',
                '#65a30d', '#ea580c', '#db2777', '#0d9488', '#dc2626'
              ];
              
              const chartSize = isMobile ? 300 : 400;
              const radius = isMobile ? 120 : 150;
              const innerRadius = isMobile ? 60 : 75;
              const centerX = chartSize / 2;
              const centerY = chartSize / 2;
              const totalAngle = 2 * Math.PI;
              let currentAngle = -Math.PI / 2;
              
              if (setores.length === 0) {
                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#64748b',
                    fontSize: '16px'
                  }}>
                    Nenhum ativo para exibir
                  </div>
                );
              }
              
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
                  
                  {setores.map((setor, index) => {
                    const sliceAngle = (setor.porcentagem / 100) * totalAngle;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + sliceAngle;
                    const cor = cores[index % cores.length];
                    const path = createPath(startAngle, endAngle);
                    
                    const middleAngle = (startAngle + endAngle) / 2;
                    const textRadius = (radius + innerRadius) / 2;
                    const textX = centerX + textRadius * Math.cos(middleAngle);
                    const textY = centerY + textRadius * Math.sin(middleAngle);
                    
                    currentAngle += sliceAngle;
                    
                    return (
                      <g key={setor.setor} className="slice-group">
                        <path
                          d={path}
                          fill={cor}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="slice-path"
                        >
                          <title>{setor.setor}: {setor.porcentagem.toFixed(1)}% ({setor.quantidade} ativos)</title>
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
                            {setor.setor.length > 12 ? setor.setor.substring(0, 10) + '...' : setor.setor}
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
                            {setor.porcentagem.toFixed(1)}%
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
                    {setores.length}
                  </text>
                  <text
                    x={centerX}
                    y={centerY + 10}
                    textAnchor="middle"
                    fontSize={isMobile ? "10" : "12"}
                    fill="#64748b"
                  >
                    SETORES
                  </text>
                </svg>
              );
            })()}
          </div>
          
          {/* Legenda Responsiva */}
          <div style={{ 
            flex: '1', 
            display: 'grid', 
            gridTemplateColumns: isMobile 
              ? 'repeat(auto-fit, minmax(100px, 1fr))'
              : 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: isMobile ? '8px' : '12px'
          }}>
            {(() => {
              // Agrupar por setor para a legenda
              const setoresMap = new Map();
              ativosAtualizados.forEach(ativo => {
                const setor = ativo.setor || 'Outros';
                setoresMap.set(setor, (setoresMap.get(setor) || 0) + 1);
              });
              
              const setores = Array.from(setoresMap.entries()).map(([setor, quantidade]) => ({
                setor,
                quantidade,
                porcentagem: (quantidade / ativosAtualizados.length) * 100
              }));
              
              const cores = [
                '#1e40af', '#3b82f6', '#06b6d4', '#10b981', '#84cc16', 
                '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899',
                '#8b5cf6', '#6366f1', '#4f46e5', '#7c3aed', '#0891b2',
                '#65a30d', '#ea580c', '#db2777', '#0d9488', '#dc2626'
              ];
              
              return setores.map((setor, index) => {
                const cor = cores[index % cores.length];
                
                return (
                  <div key={setor.setor} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        {setor.setor}
                      </div>
                      <div style={{ 
                        color: '#64748b', 
                        fontSize: isMobile ? '10px' : '12px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {setor.porcentagem.toFixed(1)}% • {setor.quantidade} ativo{setor.quantidade > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Animações CSS Unificadas */}
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
