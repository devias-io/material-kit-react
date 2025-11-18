/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use client';

import * as React from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useDataStore } from '@/hooks/useDataStore';
import { aplicarViesOverride, getViesBadgePalette } from '@/utils/vies';
import type { ViesOverride } from '@/utils/vies';
import { calcularDyAPartirDoResultado, formatarDy } from '@/utils/dividendYield';

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

const WHITE_LOGO_TICKERS = ['XP', 'UNH', 'QQQ', 'ARE','SOXX','MCHI'];

const CUSTOM_LOGO_URLS: Record<string, string> = {
  XP: 'https://logo.clearbit.com/xpi.com.br',
  SOXX: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWYDS--_v0EujW81cPjl386t2Tlm7vVXMb0A&s',
  QQQ: 'https://logo.clearbit.com/invesco.com',
  ARE: 'https://logo.clearbit.com/alexandriarealestate.com',
  MCHI: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWYDS--_v0EujW81cPjl386t2Tlm7vVXMb0A&s'
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

// 🔥 FUNÇÃO PARA CALCULAR O VIÉS AUTOMATICAMENTE (ESPECÍFICA PARA ETFs)
function calcularViesAutomatico(
  precoTeto: number | undefined,
  precoAtual: string,
  override?: ViesOverride | null
): string {
  if (!precoTeto || precoAtual === 'N/A') {
    return aplicarViesOverride(override, 'Compra'); // ✅ Para ETFs, sem preço teto é sempre COMPRA
  }

  const precoAtualNum = parseFloat(precoAtual.replace('US$', '').replace(',', '.'));

  if (isNaN(precoAtualNum)) {
    return aplicarViesOverride(override, 'Compra');
  }

  // 🎯 LÓGICA PARA ETFs: Se preço atual está pelo menos 5% abaixo do teto, é COMPRA
  const percentualDoTeto = (precoAtualNum / precoTeto) * 100;

  const viesAutomatico = percentualDoTeto <= 95 ? 'Compra' : 'Aguardar';
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

function registrarDyETF(result: any, ticker: string, dyMap: Map<string, string>): void {
  const { valor, origem } = calcularDyAPartirDoResultado(result, ticker);

  if (valor && valor > 0) {
    const dyFormatado = formatarDy(valor);
    dyMap.set(ticker, dyFormatado);
    console.log(`✅ [ETF] ${ticker}: ${dyFormatado} (${origem})`);
  } else {
    console.log(`❌ [ETF] ${ticker}: Yield não disponível (${origem})`);
  }
}

async function calcularDYDeProventos(
  ticker: string,
  precoAtual: number
): Promise<{ valor: number | null; origem: string }> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`/api/proventos/${ticker}`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      return { valor: null, origem: 'proventos_api_error' };
    }

    const proventosRaw = await response.json();

    if (!Array.isArray(proventosRaw) || proventosRaw.length === 0) {
      return { valor: null, origem: 'proventos_no_data' };
    }

    const limite12Meses = new Date();
    limite12Meses.setFullYear(limite12Meses.getFullYear() - 1);

    const proventosUltimos12Meses = proventosRaw.filter((p: any) => {
      if (!p.dataObj) return false;
      const dataProvento = new Date(p.dataObj);
      return dataProvento >= limite12Meses;
    });

    if (proventosUltimos12Meses.length === 0) {
      return { valor: null, origem: 'proventos_no_recent' };
    }

    const somaProventos = proventosUltimos12Meses.reduce(
      (sum: number, p: any) => sum + (p.valor || 0),
      0
    );

    if (somaProventos <= 0 || precoAtual <= 0) {
      return { valor: null, origem: 'proventos_invalid' };
    }

    const dy = somaProventos / precoAtual;

    console.log(
      `✅ [DY-PROVENTOS-ETFs] ${ticker}: ${(dy * 100).toFixed(2)}% (${proventosUltimos12Meses.length} distribuições)`
    );

    return {
      valor: dy,
      origem: `proventos_12m_${proventosUltimos12Meses.length}`
    };
  } catch (error) {
    return { valor: null, origem: 'proventos_error' };
  }
}

async function complementarDyComProventos(
  tickers: string[],
  cotacoesMap: Map<string, any>,
  dyMap: Map<string, string>
): Promise<void> {
  const tickersSemDY = tickers.filter((ticker) => {
    const dy = dyMap.get(ticker);
    return !dy || dy === '0,00%';
  });

  if (tickersSemDY.length === 0) {
    return;
  }

  console.log(
    `💰 [PROVENTOS-ETFs] Calculando DY via proventos para ${tickersSemDY.length} tickers...`
  );

  const promises = tickersSemDY.map(async (ticker) => {
    const cotacao = cotacoesMap.get(ticker);

    if (!cotacao || !cotacao.precoAtual || cotacao.precoAtual <= 0) {
      return;
    }

    const { valor, origem } = await calcularDYDeProventos(ticker, cotacao.precoAtual);

    if (valor && valor > 0) {
      dyMap.set(ticker, formatarDy(valor));
      console.log(`✅ [PROVENTOS-ETFs] ${ticker}: ${(valor * 100).toFixed(2)}% (${origem})`);
    }
  });

  await Promise.allSettled(promises);
}

// 🔄 FUNÇÃO PARA BUSCAR DY VIA API - VERSÃO OTIMIZADA PARA ETFs
async function buscarDYsComEstrategia(tickers: string[], isMobile: boolean): Promise<Map<string, string>> {
  const dyMap = new Map<string, string>();
  const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';

  console.log('📈 [ETFs] Buscando DY para', tickers.length, 'ETFs EM PARALELO...');

  // ✅ BATCH REQUEST PRIMEIRO
  try {
    const batchUrl = `https://brapi.dev/api/quote/${tickers.join(',')}?token=${BRAPI_TOKEN}&dividends=true`;
    const response = await Promise.race([
      fetch(batchUrl),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DY batch timeout')), 6000))
    ]);
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        console.log('✅ DY BATCH SUCCESS:', data.results.length, 'ETFs em 1 só request');
        
        data.results.forEach((result: any) => {
          const ticker = result.symbol;
          registrarDyETF(result, ticker, dyMap);
        });
        
        return dyMap;
      }
    }
  } catch (error) {
    console.log('❌ DY Batch falhou, usando paralelo individual');
  }
  
  // ✅ PARALELO INDIVIDUAL
  const promises = tickers.map(async (ticker) => {
    try {
      const response = await Promise.race([
        fetch(`https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}&dividends=true`, {
          headers: { 'Accept': 'application/json' }
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DY timeout')), 4000))
      ]);

      if (response.ok) {
        const data = await response.json();
        const result = data.results?.[0];
        
        registrarDyETF(result, ticker, dyMap);
      }
    } catch (error) {
      console.log(`❌ [ETF-${ticker}]:`, error instanceof Error ? error.message : 'Erro desconhecido');
    }
  });
  
  await Promise.allSettled(promises);
  
  console.log('✅ [ETFs] Concluído:', dyMap.size, 'de', tickers.length);
  console.log('📊 DY Final Map:', Object.fromEntries(dyMap));
  return dyMap;
}

// ✅ NOVA FUNÇÃO: BUSCAR PROVENTOS PARA ETFs (TOTAL RETURN)
async function buscarProventosETFs(ativosData: any[]): Promise<Map<string, number>> {
  const novosProventos = new Map<string, number>();

  console.log('💰 Iniciando busca de proventos ETFs para', ativosData.length, 'ativos');

  const buscarProventoAtivo = async (ativo: any) => {
    try {
      const parseDataBR = (dataBr: string | undefined) => {
        if (!dataBr || typeof dataBr !== 'string') return null;
        const [dia, mes, ano] = dataBr.split('/');
        if (!dia || !mes || !ano) return null;
        const dataISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        const parsed = new Date(`${dataISO}T00:00:00`);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const dataEntradaDate = parseDataBR(ativo.dataEntrada);
      const dataSaidaDate = parseDataBR(ativo.dataSaida);
      const periodoProventos = dataSaidaDate
        ? `${ativo.dataEntrada ?? 'data não informada'} até ${ativo.dataSaida}`
        : `desde ${ativo.dataEntrada ?? 'data não informada'}`;

      console.log(`💰 Buscando proventos ETF para ${ativo.ticker} (${periodoProventos})`);

      const controller = new AbortController();
      setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`/api/proventos/${ativo.ticker}`, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const proventosRaw = await response.json();

        if (Array.isArray(proventosRaw)) {
          const proventosFiltrados = proventosRaw.filter((p: any) => {
            if (!p.dataObj) return false;
            const dataProvento = new Date(p.dataObj);

            if (Number.isNaN(dataProvento.getTime())) return false;
            if (dataEntradaDate && dataProvento < dataEntradaDate) return false;
            if (dataSaidaDate && dataProvento > dataSaidaDate) return false;

            return true;
          });
          
          const total = proventosFiltrados.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
          console.log(`💰 ${ativo.ticker}: US$ ${total.toFixed(2)} (${proventosFiltrados.length} distribuições)`);
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
  
  console.log('💰 Proventos ETFs finais:', Object.fromEntries(novosProventos));
  return novosProventos;
}

// 🚀 HOOK PRINCIPAL OTIMIZADO COM PARALELIZAÇÃO TOTAL + TOTAL RETURN
function useETFsInternacionaisIntegradas() {
  const { dados } = useDataStore();
  const [ativosAtualizados, setAtivosAtualizados] = React.useState<any[]>([]);
  const [cotacoesAtualizadas, setCotacoesAtualizadas] = React.useState<any>({});
  
  // Estados para garantir que TODOS os dados estejam prontos
  const [cotacoesCompletas, setCotacoesCompletas] = React.useState<Map<string, any>>(new Map());
  const [dyCompletos, setDyCompletos] = React.useState<Map<string, string>>(new Map());
  const [proventosCompletos, setProventosCompletos] = React.useState<Map<string, number>>(new Map()); // ✅ NOVO
  const [todosOsDadosProntos, setTodosOsDadosProntos] = React.useState(false);
  
  // Loading states granulares
  const [loadingCotacoes, setLoadingCotacoes] = React.useState(true);
  const [loadingDY, setLoadingDY] = React.useState(false);
  const [loadingProventos, setLoadingProventos] = React.useState(false); // ✅ NOVO
  const [error, setError] = React.useState<string | null>(null);

  const isMobile = useDeviceDetection();
  const etfsInternacionaisData = dados.etfs || [];

  // 🎯 FUNÇÃO PRINCIPAL REESCRITA - PARALELIZAÇÃO TOTAL COM TOTAL RETURN
  const buscarDadosCompletos = React.useCallback(async () => {
    if (etfsInternacionaisData.length === 0) {
      setAtivosAtualizados([]);
      setLoadingCotacoes(false);
      return;
    }

    try {
      setError(null);
      setTodosOsDadosProntos(false);
      const tickers = etfsInternacionaisData.map(ativo => ativo.ticker);
      
      console.log('🚀 INICIANDO BUSCA COM TOTAL RETURN - ETFs INTERNACIONAIS...');
      
      // 🔄 RESET DOS ESTADOS
      setCotacoesCompletas(new Map());
      setDyCompletos(new Map());
      setProventosCompletos(new Map());

      // ⚡ PARALELIZAÇÃO TOTAL - AGORA COM PROVENTOS
      console.log('⚡ EXECUTANDO TODAS AS ETAPAS EM PARALELO (COTAÇÕES + DY + PROVENTOS)...');

      // Ativar todos os loadings
      setLoadingCotacoes(true);
      setLoadingDY(true);
      setLoadingProventos(true);

      // Medir tempo
      const inicioTempo = performance.now();

      // ✅ EXECUTAR TUDO EM PARALELO - AGORA COM PROVENTOS
      const [cotacoesResult, dyResult, proventosResult] = await Promise.allSettled([
        buscarCotacoesParalelas(tickers, isMobile),
        buscarDYsComEstrategia(tickers, isMobile),
        buscarProventosETFs(etfsInternacionaisData) // ✅ NOVO
      ]);

      const tempoTotal = performance.now() - inicioTempo;
      console.log(`🎉 TODAS AS ETAPAS CONCLUÍDAS EM ${tempoTotal.toFixed(0)}ms!`);

      // Processar resultados
      const cotacoesMap = cotacoesResult.status === 'fulfilled' ? cotacoesResult.value : new Map();
      const dyMap = dyResult.status === 'fulfilled' ? dyResult.value : new Map();
      const proventosData = proventosResult.status === 'fulfilled' ? proventosResult.value : new Map(); // ✅ NOVO

      // Logs de debug
      console.log('📊 Cotações obtidas:', cotacoesMap.size, 'de', tickers.length);
      console.log('📈 DY obtidos:', dyMap.size, 'de', tickers.length);
      console.log('💰 Proventos obtidos:', proventosData.size, 'de', etfsInternacionaisData.length); // ✅ NOVO

      await complementarDyComProventos(tickers, cotacoesMap, dyMap);

      tickers.forEach((ticker) => {
        if (!dyMap.has(ticker)) {
          console.log(`⚠️ [DY-ETFs] ${ticker}: Não encontrado em nenhuma fonte, setando 0,00%`);
          dyMap.set(ticker, '0,00%');
        }
      });

      // Debug do DY após complementação
      console.log('🔍 [PARALLEL-DEBUG] dyMap processado:');
      console.log('🔍 [PARALLEL-DEBUG] dyMap.size:', dyMap.size);
      console.log('🔍 [PARALLEL-DEBUG] dyMap conteúdo:', Object.fromEntries(dyMap));

      // Atualizar estados
      setCotacoesCompletas(cotacoesMap);
      setDyCompletos(dyMap);
      setProventosCompletos(proventosData); // ✅ NOVO

      // Desativar loadings
      setLoadingCotacoes(false);
      setLoadingDY(false);
      setLoadingProventos(false); // ✅ NOVO
      
      // Marcar como pronto para processamento final
      setTodosOsDadosProntos(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro na busca otimizada:', err);
      setTodosOsDadosProntos(true);
    }
  }, [etfsInternacionaisData, isMobile]);

  // 🏆 USEEFFECT QUE SÓ EXECUTA QUANDO TODOS OS DADOS ESTÃO PRONTOS - AGORA COM TOTAL RETURN
  React.useEffect(() => {
    if (!todosOsDadosProntos || etfsInternacionaisData.length === 0) return;
    
    console.log('🏆 PROCESSANDO TOTAL RETURN - ETFs INTERNACIONAIS - TODOS OS DADOS PRONTOS!');
    console.log('🔍 [DEPS-DEBUG] Verificando estados no momento da execução:');
    console.log('🔍 [DEPS-DEBUG] todosOsDadosProntos:', todosOsDadosProntos);
    console.log('🔍 [DEPS-DEBUG] etfsInternacionaisData.length:', etfsInternacionaisData.length);
    console.log('🔍 [DEPS-DEBUG] cotacoesCompletas.size:', cotacoesCompletas.size);
    console.log('🔍 [DEPS-DEBUG] dyCompletos.size:', dyCompletos.size);
    console.log('🔍 [DEPS-DEBUG] proventosCompletos.size:', proventosCompletos.size); // ✅ NOVO
    console.log('🔍 [DEPS-DEBUG] dyCompletos conteúdo:', Object.fromEntries(dyCompletos));
    console.log('🔍 [DEPS-DEBUG] proventosCompletos conteúdo:', Object.fromEntries(proventosCompletos)); // ✅ NOVO
    
    console.log('📊 Dados disponíveis:', {
      cotacoes: cotacoesCompletas.size,
      dy: dyCompletos.size, 
      proventos: proventosCompletos.size, // ✅ NOVO
      ativos: etfsInternacionaisData.length
    });

    const novasCotacoes: any = {};

    // 🎯 PROCESSAR TODOS OS ATIVOS COM TOTAL RETURN
    const ativosFinais = etfsInternacionaisData.map((ativo, index) => {
      const cotacao = cotacoesCompletas.get(ativo.ticker);
      
      // 🔍 DEBUG DY ASSIGNMENT
      const dyAPI = dyCompletos.get(ativo.ticker) || '0,00%';
      const proventosAtivo = proventosCompletos.get(ativo.ticker) || 0; // ✅ NOVO
      
      console.log(`🔍 [ASSIGN-DEBUG] ${ativo.ticker}:`);
      console.log(`  - dyCompletos.size: ${dyCompletos.size}`);
      console.log(`  - dyCompletos.has('${ativo.ticker}'): ${dyCompletos.has(ativo.ticker)}`);
      console.log(`  - dyCompletos.get('${ativo.ticker}'): ${dyCompletos.get(ativo.ticker)}`);
      console.log(`  - dyAPI final: ${dyAPI}`);
      console.log(`  - proventosAtivo: US$ ${proventosAtivo.toFixed(2)}`); // ✅ NOVO
      console.log(`  - loadingDY: ${loadingDY}`);
    
      if (cotacao && cotacao.precoAtual > 0) {
        // ✅ ATIVO COM COTAÇÃO REAL - AGORA COM TOTAL RETURN
        const precoAtualNum = cotacao.precoAtual;
        
        // ✅ CALCULAR TOTAL RETURN (IGUAL AOS OUTROS CÓDIGOS)
        const performanceAcao = ((precoAtualNum - ativo.precoEntrada) / ativo.precoEntrada) * 100;
        const performanceProventos = ativo.precoEntrada > 0 ? (proventosAtivo / ativo.precoEntrada) * 100 : 0;
        const performanceTotal = performanceAcao + performanceProventos;
        
        // VALIDAR SE O PREÇO FAZ SENTIDO
        const diferencaPercent = Math.abs(performanceAcao);
        if (diferencaPercent > 1000) {
          console.warn(`🚨 ${ativo.ticker}: Preço suspeito! Diferença de ${diferencaPercent.toFixed(1)}% - usando preço de entrada`);
          return {
            ...ativo,
            id: String(ativo.id || index + 1),
            precoAtual: ativo.precoEntrada,
            performance: performanceProventos, // ✅ Ainda considera proventos
            performanceAcao: 0,
            performanceProventos: performanceProventos,
            proventosAtivo: proventosAtivo,
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
        
        console.log(`🏆 ${ativo.ticker}: DY final = ${dyAPI}`);
        console.log(`🏆 ${ativo.ticker}: US$ ${ativo.precoEntrada.toFixed(2)} -> US$ ${precoAtualNum.toFixed(2)} | Ação ${performanceAcao.toFixed(2)}% + Distribuições ${performanceProventos.toFixed(2)}% = TOTAL ${performanceTotal.toFixed(2)}%`);
        
        return {
          ...ativo,
          id: String(ativo.id || index + 1),
          precoAtual: precoAtualNum,
          performance: performanceTotal, // ✅ TOTAL RETURN
          performanceAcao: performanceAcao, // ✅ NOVO
          performanceProventos: performanceProventos, // ✅ NOVO
          proventosAtivo: proventosAtivo, // ✅ NOVO
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
        // ⚠️ ATIVO SEM COTAÇÃO REAL - MAS AINDA COM PROVENTOS
        const performanceProventos = ativo.precoEntrada > 0 ? (proventosAtivo / ativo.precoEntrada) * 100 : 0;
        
        console.log(`🏆 ${ativo.ticker}: (sem cotação) DY final = ${dyAPI}`);
        console.log(`🏆 ${ativo.ticker}: Sem cotação | US$ ${ativo.precoEntrada.toFixed(2)} + Distribuições ${performanceProventos.toFixed(2)}% = TOTAL ${performanceProventos.toFixed(2)}%`);
        
        return {
          ...ativo,
          id: String(ativo.id || index + 1),
          precoAtual: ativo.precoEntrada,
          performance: performanceProventos, // ✅ Considera apenas proventos
          performanceAcao: 0,
          performanceProventos: performanceProventos,
          proventosAtivo: proventosAtivo,
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
          nomeCompleto: ativo.ticker,
          posicaoExibicao: index + 1
        };
      }
    });

    // 🎯 ATUALIZAÇÃO FINAL DEFINITIVA
    setCotacoesAtualizadas(novasCotacoes);
    setAtivosAtualizados(ativosFinais);
    
    console.log('🏆 TOTAL RETURN ETFs INTERNACIONAIS PROCESSADO COM SUCESSO!');
  }, [todosOsDadosProntos, cotacoesCompletas, dyCompletos, proventosCompletos, etfsInternacionaisData, loadingDY]);

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
    loadingProventos, // ✅ NOVO
    error,
    refetch,
    isMobile,
    todosOsDadosProntos // ✅ Novo estado para debug
  };
}

// 🎯 COMPONENTE PRINCIPAL OTIMIZADO
export default function ETFsInternacionaisPage() {
  const { dados } = useDataStore();
  const { 
    ativosAtualizados, 
    cotacoesAtualizadas, 
    setCotacoesAtualizadas, 
    loading, 
    loadingDY,
    loadingProventos, // ✅ NOVO
    isMobile,
    todosOsDadosProntos
  } = useETFsInternacionaisIntegradas();
  
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
          ETFs Internacionais
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
                Atualizando carteira com Total Return...
              </span>
            </>
          ) : (
            <span>
              Exposição diversificada aos mercados globais • Total Return com reinvestimento de distribuições • Dados atualizados a cada 15 minutos
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

      {/* Tabela de ETFs */}
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
            ETFs Internacionais • Performance Individual ({ativosAtualizados.length})
          </h3>
          <p style={{
            color: '#64748b',
            fontSize: isMobile ? '14px' : '16px',
            margin: '0'
          }}>
            ETFs com Total Return - incluindo reinvestimento de distribuições recebidas
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
  const ticker = (ativo.ticker ?? '').toUpperCase();
  const logoSrc = CUSTOM_LOGO_URLS[ticker] ?? `https://financialmodelingprep.com/image-stock/${ticker}.png`;
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

                        {/* Logo do ETF */}
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          backgroundColor: WHITE_LOGO_TICKERS.includes(ticker) ? '#f1f5f9' : '#ffffff',
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
                                parent.textContent = ativo.ticker.slice(0, 2).toUpperCase();
                              }
                            }}
                          />
                        </div>

                        {/* Nome e Categoria */}
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
                      
                      {/* Performance em destaque - AGORA COM TOTAL RETURN */}
                      <div style={{
                        textAlign: 'center',
                        padding: '8px',
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                          Performance Total (c/ distribuições)
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
                        ETF
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
                        {/* ✅ ADICIONADO ÍCONE DE INFO */}
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
                            title="Performance calculada com Total Return, incluindo o reinvestimento das distribuições recebidas desde a data de entrada."
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
{ativosAtualizados.map((ativo, index) => {
  const temCotacaoReal = ativo.statusApi === 'success';
  const ticker = (ativo.ticker ?? '').toUpperCase();
  const logoSrc = CUSTOM_LOGO_URLS[ticker] ?? `https://financialmodelingprep.com/image-stock/${ticker}.png`;
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
                          {/* ETF */}
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: WHITE_LOGO_TICKERS.includes(ticker) ? '#f1f5f9' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #e2e8f0'
                              }}>
                                <img 
                                  src={logoSrc}
                                  alt={`Logo ${ticker}`}
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
                                      parent.style.color = ativo.performance >= 0 ? '#065f46' : '#991b1b';
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

      {/* Gráfico de Composição por Categoria */}
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
            Composição por Categoria
          </h3>
          <p style={{
            color: '#64748b',
            fontSize: isMobile ? '14px' : '16px',
            margin: '0'
          }}>
            Distribuição por tipo de ETF • {ativosAtualizados.length} ETFs
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
              // Agrupar por categoria
              const categoriasMap = new Map();
              ativosAtualizados.forEach(ativo => {
                const categoria = ativo.setor || 'Outros';
                categoriasMap.set(categoria, (categoriasMap.get(categoria) || 0) + 1);
              });
              
              const categorias = Array.from(categoriasMap.entries()).map(([categoria, quantidade]) => ({
                categoria,
                quantidade,
                porcentagem: (quantidade / ativosAtualizados.length) * 100
              }));
              
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
              const totalAngle = 2 * Math.PI;
              let currentAngle = -Math.PI / 2;
              
              if (categorias.length === 0) {
                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#64748b',
                    fontSize: '16px'
                  }}>
                    Nenhum ETF para exibir
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
                  
                  {categorias.map((categoria, index) => {
                    const sliceAngle = (categoria.porcentagem / 100) * totalAngle;
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
                      <g key={categoria.categoria} className="slice-group">
                        <path
                          d={path}
                          fill={cor}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="slice-path"
                        >
                          <title>{categoria.categoria}: {categoria.porcentagem.toFixed(1)}% ({categoria.quantidade} ETFs)</title>
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
                            {categoria.categoria.length > 12 ? categoria.categoria.substring(0, 10) + '...' : categoria.categoria}
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
                            {categoria.porcentagem.toFixed(1)}%
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
                    {categorias.length}
                  </text>
                  <text
                    x={centerX}
                    y={centerY + 10}
                    textAnchor="middle"
                    fontSize={isMobile ? "10" : "12"}
                    fill="#64748b"
                  >
                    CATEGORIAS
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
              // Agrupar por categoria para a legenda
              const categoriasMap = new Map();
              ativosAtualizados.forEach(ativo => {
                const categoria = ativo.setor || 'Outros';
                categoriasMap.set(categoria, (categoriasMap.get(categoria) || 0) + 1);
              });
              
              const categorias = Array.from(categoriasMap.entries()).map(([categoria, quantidade]) => ({
                categoria,
                quantidade,
                porcentagem: (quantidade / ativosAtualizados.length) * 100
              }));
              
              const cores = [
                '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
                '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
                '#14b8a6', '#eab308', '#dc2626', '#7c3aed', '#0891b2',
                '#65a30d', '#ea580c', '#db2777', '#4f46e5', '#0d9488'
              ];
              
              return categorias.map((categoria, index) => {
                const cor = cores[index % cores.length];
                
                return (
                  <div key={categoria.categoria} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        {categoria.categoria}
                      </div>
                      <div style={{ 
                        color: '#64748b', 
                        fontSize: isMobile ? '10px' : '12px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {categoria.porcentagem.toFixed(1)}% • {categoria.quantidade} ETF{categoria.quantidade > 1 ? 's' : ''}
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
