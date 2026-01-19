// 📁 /hooks/useFiisIntegradas.ts
'use client';

import * as React from 'react';
import { useFiisCotacoesBrapi } from '@/hooks/useFiisCotacoesBrapi';
import { aplicarViesOverride } from '@/utils/vies';
import { extrairNumeroBrApi, calcularDyAPartirDoResultado, formatarDy } from '@/utils/dividendYield';

// 🚀 CACHE GLOBAL SINCRONIZADO PARA GARANTIR DADOS IDÊNTICOS E EVITAR CORS
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

// 🔥 DETECÇÃO DE DISPOSITIVO PARA RESPONSIVIDADE
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

function getFrequenciaDividendosFII(): number {
  return 12;
}

function calcularDyFII(result: any, ticker: string): { valor: number | null; origem: string } {
  const base = calcularDyAPartirDoResultado(result, ticker);
  if (base.valor && base.valor > 0) {
    return base;
  }

  const precoAtual = extrairNumeroBrApi(
    result?.regularMarketPrice ??
      result?.price?.regularMarketPrice ??
      result?.regularMarketPreviousClose ??
      result?.price?.regularMarketPreviousClose
  );

  if (!precoAtual || precoAtual <= 0) {
    return { valor: null, origem: base.origem ?? 'sem_preco' };
  }

  const ultimoDividendo = extrairNumeroBrApi(
    result?.dividendsData?.cashDividends?.[0]?.rate ??
      result?.cashDividends?.[0]?.rate ??
      result?.lastDividends?.[0]?.value ??
      result?.lastDividendValue ??
      null
  );

  if (ultimoDividendo && ultimoDividendo > 0) {
    const dividendoAnual = ultimoDividendo * getFrequenciaDividendosFII();
    const dyCalculado = dividendoAnual / precoAtual;

    if (dyCalculado > 0) {
      return { valor: dyCalculado, origem: 'calc:fii:lastDividendValue' };
    }
  }

  return { valor: null, origem: base.origem ?? 'nao_encontrado' };
}

// 🚀 FUNÇÃO OTIMIZADA PARA BUSCAR COTAÇÕES DE FIIs EM PARALELO (CORS RESOLVIDO)
async function buscarCotacoesFIIsParalelas(tickers: string[], isMobile: boolean): Promise<Map<string, any>> {
  const cotacoesMap = new Map();
  
  console.log(`📊 Iniciando busca cotações para ${tickers.length} FIIs - Mobile: ${isMobile}`);
  
  // ✅ VERIFICAR CACHE GLOBAL PRIMEIRO
  const cacheKey = `cotacoes_fiis_${tickers.join(',')}_${isMobile}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log('📋 FIIs Cotações: Usando cache global');
    return new Map(Object.entries(cached));
  }
  
  if (!isMobile) {
    // 🖥️ DESKTOP: busca em lote (mais eficiente para FIIs)
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 8000); // ✅ TIMEOUT MAIOR PARA FIIs
      
      const response = await fetch(`/api/financial/quotes?symbols=${encodeURIComponent(tickers.join(','))}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FII-Desktop-Batch-Fetcher'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.results ?? data.quotes ?? [];
        console.log(`📊 [COTAÇÕES-FII-DESKTOP] Resposta para ${results.length || 0} FIIs`);

        results.forEach((quote: any) => {
          if (quote.regularMarketPrice > 0) {
            cotacoesMap.set(quote.symbol, {
              precoAtual: quote.regularMarketPrice,
              variacao: quote.regularMarketChange || 0,
              variacaoPercent: quote.regularMarketChangePercent || 0,
              volume: quote.regularMarketVolume || 0,
              nome: quote.shortName || quote.longName || quote.symbol,
              dadosCompletos: quote,
              fonte: 'BRAPI_DESKTOP_BATCH'
            });
            console.log(`✅ [COTAÇÕES-FII-DESKTOP] ${quote.symbol}: R$ ${quote.regularMarketPrice.toFixed(2)}`);
          }
        });
        
        // ✅ SALVAR NO CACHE SE OBTEVE DADOS
        if (cotacoesMap.size > 0) {
          setCachedData(cacheKey, Object.fromEntries(cotacoesMap));
        }
      } else {
        console.log(`❌ [COTAÇÕES-FII-DESKTOP] Erro HTTP ${response.status}`);
      }
    } catch (error) {
      console.log('❌ [COTAÇÕES-FII-DESKTOP] Erro na busca em lote:', error);
    }
    
    return cotacoesMap;
  }

  // 📱 MOBILE: ESTRATÉGIA UNIFICADA (MESMO PADRÃO DO SMALLCAPS QUE FUNCIONA)
  const buscarCotacaoFII = async (ticker: string) => {
    let dadosFiiObtidos = false;
    let dadosFii = null;

    // 🎯 ESTRATÉGIA 1: DESKTOP STYLE (PRIORIDADE MÁXIMA - MESMO PARA MOBILE)
    console.log(`📱🎯 [COTAÇÕES-FII] ${ticker}: Tentativa 1 - Estratégia Desktop (Unificada)`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // ✅ TIMEOUT MAIOR
      
      const response = await fetch(`/api/financial/quotes?symbols=${encodeURIComponent(ticker)}`, {
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
        const quote = data.results?.[0] ?? data.quotes?.[0];
        if (quote?.regularMarketPrice > 0) {
          console.log(`📱✅ [COTAÇÕES-FII] ${ticker}: R$ ${quote.regularMarketPrice.toFixed(2)} (Estratégia Unificada)`);
          
          dadosFii = {
            precoAtual: quote.regularMarketPrice,
            variacao: quote.regularMarketChange || 0,
            variacaoPercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            nome: quote.shortName || quote.longName || ticker,
            dadosCompletos: quote,
            fonte: 'BRAPI_UNIFIED_STRATEGY'
          };
          dadosFiiObtidos = true;
        }
      }
    } catch (error) {
      console.log(`📱❌ [COTAÇÕES-FII] ${ticker} (Estratégia Unificada): ${error.message}`);
    }

    // 🔄 FALLBACK 1: Sem User-Agent
    if (!dadosFiiObtidos) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        console.log(`📱🔄 [COTAÇÕES-FII] ${ticker}: Fallback 1 - Sem User-Agent`);
        
        const response = await fetch(`/api/financial/quotes?symbols=${encodeURIComponent(ticker)}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const quote = data.results?.[0] ?? data.quotes?.[0];
          if (quote?.regularMarketPrice > 0) {
            console.log(`📱✅ [COTAÇÕES-FII] ${ticker}: R$ ${quote.regularMarketPrice.toFixed(2)} (Fallback 1)`);
            
            dadosFii = {
              precoAtual: quote.regularMarketPrice,
              variacao: quote.regularMarketChange || 0,
              variacaoPercent: quote.regularMarketChangePercent || 0,
              volume: quote.regularMarketVolume || 0,
              nome: quote.shortName || quote.longName || ticker,
              dadosCompletos: quote,
              fonte: 'BRAPI_MOBILE_FALLBACK_1'
            };
            dadosFiiObtidos = true;
          }
        }
      } catch (error) {
        console.log(`📱❌ [COTAÇÕES-FII] ${ticker} (Fallback 1): ${error.message}`);
      }
    }

    // 🔄 FALLBACK 2: URL simplificada
    if (!dadosFiiObtidos) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        console.log(`📱🔄 [COTAÇÕES-FII] ${ticker}: Fallback 2 - URL simplificada`);
        
        const response = await fetch(`/api/financial/quotes?symbols=${encodeURIComponent(ticker)}&range=1d`, {
          method: 'GET',
          mode: 'cors'
        });

        if (response.ok) {
          const data = await response.json();
          const quote = data.results?.[0] ?? data.quotes?.[0];
          if (quote?.regularMarketPrice > 0) {
            console.log(`📱✅ [COTAÇÕES-FII] ${ticker}: R$ ${quote.regularMarketPrice.toFixed(2)} (Fallback 2)`);
            
            dadosFii = {
              precoAtual: quote.regularMarketPrice,
              variacao: quote.regularMarketChange || 0,
              variacaoPercent: quote.regularMarketChangePercent || 0,
              volume: quote.regularMarketVolume || 0,
              nome: quote.shortName || quote.longName || ticker,
              dadosCompletos: quote,
              fonte: 'BRAPI_MOBILE_FALLBACK_2'
            };
            dadosFiiObtidos = true;
          }
        }
      } catch (error) {
        console.log(`📱❌ [COTAÇÕES-FII] ${ticker} (Fallback 2): ${error.message}`);
      }
    }

    if (dadosFiiObtidos && dadosFii) {
      return { ticker, cotacao: dadosFii };
    }
    
    console.log(`📱⚠️ [COTAÇÕES-FII] ${ticker}: Todas as estratégias falharam`);
    return { ticker, cotacao: null };
  };

  // Executar todas as buscas sequencialmente (melhor para mobile FIIs)
  for (const ticker of tickers) {
    const resultado = await buscarCotacaoFII(ticker);
    if (resultado.cotacao) {
      cotacoesMap.set(resultado.ticker, resultado.cotacao);
    }
    
    // Delay entre FIIs para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`📱📋 [COTAÇÕES-FII-MOBILE] Processados: ${cotacoesMap.size}/${tickers.length}`);
  
  // ✅ SALVAR NO CACHE SE OBTEVE DADOS
  if (cotacoesMap.size > 0) {
    setCachedData(cacheKey, Object.fromEntries(cotacoesMap));
  }
  
  return cotacoesMap;
}

// 🔄 FUNÇÃO PARA BUSCAR DY DE FIIs COM ESTRATÉGIA MOBILE/DESKTOP (CORS RESOLVIDO)
async function buscarDYsFiisComEstrategia(tickers: string[], isMobile: boolean): Promise<Map<string, string>> {
  const dyMap = new Map<string, string>();
  
  console.log(`📈 Iniciando busca DY para ${tickers.length} FIIs - Mobile: ${isMobile}`);
  
  // ✅ VERIFICAR CACHE GLOBAL PRIMEIRO
  const cacheKey = `dy_fiis_${tickers.join(',')}_${isMobile}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log('📋 FIIs DY: Usando cache global');
    return new Map(Object.entries(cached));
  }
  
  if (isMobile) {
    // 📱 MOBILE: Estratégia individual (SEQUENCIAL - não paralela!)
    console.log('📱 [DY-FII-MOBILE] Buscando DY individualmente no mobile');
    
    for (const ticker of tickers) {
      let dyObtido = false;
      let dadosDy = null;
      
      // 🎯 ESTRATÉGIA 1: DESKTOP STYLE (PRIORIDADE MÁXIMA - MESMO PARA MOBILE)
      console.log(`📱🎯 [DY-FII] ${ticker}: Tentativa 1 - Estratégia Desktop (Unificada)`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // ✅ TIMEOUT MAIOR
        
        const response = await fetch(`/api/financial/quotes?symbols=${encodeURIComponent(ticker)}&dividends=true`, {
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
          const result = data.results?.[0] ?? data.quotes?.[0];
          const { valor, origem } = calcularDyFII(result, ticker);

          if (valor && valor > 0) {
            dadosDy = formatarDy(valor);
            console.log(`📱✅ [DY-FII] ${ticker}: ${dadosDy} (Estratégia Unificada | ${origem})`);
            dyObtido = true;
          } else {
            console.log(`📱⚠️ [DY-FII] ${ticker}: Sem dividendos (Estratégia Unificada | ${origem})`);
          }
        }
      } catch (error) {
        console.log(`📱❌ [DY-FII] ${ticker} (Estratégia Unificada): ${error.message}`);
      }
      
      // 🔄 FALLBACK 1: Sem User-Agent
      if (!dyObtido) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
          console.log(`📱🔄 [DY-FII] ${ticker}: Fallback 1 - Sem User-Agent`);
          
          const response = await fetch(`/api/financial/quotes?symbols=${encodeURIComponent(ticker)}&dividends=true`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const result = data.results?.[0] ?? data.quotes?.[0];
            const { valor, origem } = calcularDyFII(result, ticker);

            if (valor && valor > 0) {
              dadosDy = formatarDy(valor);
              console.log(`📱✅ [DY-FII] ${ticker}: ${dadosDy} (Fallback 1 | ${origem})`);
              dyObtido = true;
            } else {
              console.log(`📱⚠️ [DY-FII] ${ticker}: Sem dividendos (Fallback 1 | ${origem})`);
            }
          }
        } catch (error) {
          console.log(`📱❌ [DY-FII] ${ticker} (Fallback 1): ${error.message}`);
        }
      }
      
      // 🔄 FALLBACK 2: URL simplificada
      if (!dyObtido) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
          console.log(`📱🔄 [DY-FII] ${ticker}: Fallback 2 - URL simplificada`);
          
          const response = await fetch(`/api/financial/quotes?symbols=${encodeURIComponent(ticker)}&dividends=true&range=1d`, {
            method: 'GET',
            mode: 'cors'
          });

          if (response.ok) {
            const data = await response.json();
            const result = data.results?.[0] ?? data.quotes?.[0];
            const { valor, origem } = calcularDyFII(result, ticker);

            if (valor && valor > 0) {
              dadosDy = formatarDy(valor);
              console.log(`📱✅ [DY-FII] ${ticker}: ${dadosDy} (Fallback 2 | ${origem})`);
              dyObtido = true;
            } else {
              console.log(`📱⚠️ [DY-FII] ${ticker}: Sem dividendos (Fallback 2 | ${origem})`);
            }
          }
        } catch (error) {
          console.log(`📱❌ [DY-FII] ${ticker} (Fallback 2): ${error.message}`);
        }
      }
      
      // Se obteve dados ou não, armazenar resultado
      if (dyObtido && dadosDy) {
        dyMap.set(ticker, dadosDy);
      } else {
        dyMap.set(ticker, '0,00%');
        console.log(`📱⚠️ [DY-FII] ${ticker}: Todas as estratégias falharam, usando 0%`);
      }
      
      // ⭐ DELAY CRUCIAL: previne rate limiting para FIIs
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
  } else {
    // 🖥️ DESKTOP: Requisição em lote para FIIs
    console.log('🖥️ [DY-FII-DESKTOP] Buscando DY em lote no desktop');
    
    try {
      const url = `/api/financial/quotes?symbols=${encodeURIComponent(tickers.join(','))}&dividends=true`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // ✅ TIMEOUT MAIOR PARA FIIs
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FII-DY-Batch-Fetcher'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const results = data.results ?? data.quotes ?? [];
        console.log(`📊 [DY-FII-DESKTOP] Resposta recebida para ${results.length || 0} FIIs`);

        results.forEach((result: any) => {
          const ticker = result.symbol;
          const { valor, origem } = calcularDyFII(result, ticker);

          if (valor && valor > 0) {
            const dyFormatado = formatarDy(valor);
            dyMap.set(ticker, dyFormatado);
            console.log(`✅ [DY-FII-DESKTOP] ${ticker}: ${dyFormatado} (${origem})`);
          } else {
            dyMap.set(ticker, '0,00%');
            console.log(`❌ [DY-FII-DESKTOP] ${ticker}: DY não encontrado (${origem})`);
          }
        });
        
      } else {
        console.log(`❌ [DY-FII-DESKTOP] Erro HTTP ${response.status}`);
        // Fallback: definir 0% para todos
        tickers.forEach(ticker => dyMap.set(ticker, '0,00%'));
      }
      
    } catch (error) {
      console.error(`❌ [DY-FII-DESKTOP] Erro geral:`, error);
      // Fallback: definir 0% para todos
      tickers.forEach(ticker => dyMap.set(ticker, '0,00%'));
    }
  }
  
  console.log(`📋 [DY-FII] Resultado final: ${dyMap.size} tickers processados`);
  
  // ✅ SALVAR NO CACHE
  if (dyMap.size > 0) {
    setCachedData(cacheKey, Object.fromEntries(dyMap));
  }
  
  return dyMap;
}

// 💰 FUNÇÃO PARA CALCULAR PROVENTOS DE UM FII NO PERÍODO (desde a data de entrada)
const calcularProventosFii = (ticker: string, dataEntrada: string): number => {
  try {
    if (typeof window === 'undefined') return 0;
    
    // Buscar proventos do localStorage da Central de Proventos
    const proventosKey = `proventos_${ticker}`;
    const proventosData = localStorage.getItem(proventosKey);
    if (!proventosData) return 0;
    
    const proventos = JSON.parse(proventosData);
    if (!Array.isArray(proventos) || proventos.length === 0) return 0;
    
    // Converter data de entrada para objeto Date
    const [dia, mes, ano] = dataEntrada.split('/');
    const dataEntradaObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    
    console.log(`🔍 Calculando proventos para ${ticker} desde ${dataEntrada}`);
    
    // Filtrar proventos pagos após a data de entrada
    const proventosFiltrados = proventos.filter((provento: any) => {
      try {
        let dataProventoObj: Date;
        
        // Tentar diferentes formatos de data
        if (provento.dataPagamento) {
          if (provento.dataPagamento.includes('/')) {
            const [d, m, a] = provento.dataPagamento.split('/');
            dataProventoObj = new Date(parseInt(a), parseInt(m) - 1, parseInt(d));
          } else if (provento.dataPagamento.includes('-')) {
            dataProventoObj = new Date(provento.dataPagamento);
          }
        } else if (provento.data) {
          if (provento.data.includes('/')) {
            const [d, m, a] = provento.data.split('/');
            dataProventoObj = new Date(parseInt(a), parseInt(m) - 1, parseInt(d));
          } else if (provento.data.includes('-')) {
            dataProventoObj = new Date(provento.data);
          }
        } else if (provento.dataCom) {
          if (provento.dataCom.includes('/')) {
            const [d, m, a] = provento.dataCom.split('/');
            dataProventoObj = new Date(parseInt(a), parseInt(m) - 1, parseInt(d));
          } else if (provento.dataCom.includes('-')) {
            dataProventoObj = new Date(provento.dataCom);
          }
        } else if (provento.dataObj) {
          dataProventoObj = new Date(provento.dataObj);
        } else {
          return false;
        }
        
        return dataProventoObj && dataProventoObj >= dataEntradaObj;
      } catch (error) {
        console.error('Erro ao processar data do provento:', error);
        return false;
      }
    });
    
    // Somar valores dos proventos
    const totalProventos = proventosFiltrados.reduce((total: number, provento: any) => {
      const valor = typeof provento.valor === 'number' ? provento.valor : parseFloat(provento.valor?.toString().replace(',', '.') || '0');
      return total + (isNaN(valor) ? 0 : valor);
    }, 0);
    
    console.log(`✅ ${ticker}: ${proventosFiltrados.length} proventos = R$ ${totalProventos.toFixed(2)}`);
    
    return totalProventos;
    
  } catch (error) {
    console.error(`❌ Erro ao calcular proventos para ${ticker}:`, error);
    return 0;
  }
};

// 🔥 FUNÇÃO OTIMIZADA PARA CALCULAR VIÉS DE FIIs
function calcularViesAutomaticoFII(precoTeto: number | undefined, precoAtual: number): string {
  if (!precoTeto || !precoAtual || precoAtual <= 0) return 'Aguardar';
  return precoAtual < precoTeto ? 'Compra' : 'Aguardar';
}

// 🚀 HOOK PRINCIPAL UNIFICADO - ESTRATÉGIA ROBUSTA PARA FIIs
export function useFiisIntegradas() {
  const { fiis: fiisOriginais, loading: fiisLoadingOriginal, erro: fiisError } = useFiisCotacoesBrapi();
  const [fiisAtualizados, setFiisAtualizados] = React.useState<any[]>([]);
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

  // Função para buscar proventos dos FIIs
  const buscarProventosFIIs = React.useCallback(async (fiisData: any[]) => {
    setLoadingProventos(true);
    const novosProventos = new Map<string, number>();
    
    console.log('💰 Iniciando busca de proventos para', fiisData.length, 'FIIs');
    
    for (const fii of fiisData) {
      try {
        if (!fii.dataEntrada) {
          novosProventos.set(fii.ticker, 0);
          continue;
        }

        const valorProventos = calcularProventosFii(fii.ticker, fii.dataEntrada);
        novosProventos.set(fii.ticker, valorProventos);
        console.log(`💰 ${fii.ticker}: R$ ${valorProventos.toFixed(2)}`);
        
        // Pequeno delay entre buscas
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`💰 ${fii.ticker}: Erro -`, error.message);
        novosProventos.set(fii.ticker, 0);
      }
    }
    
    console.log('💰 Proventos FIIs finais:', Object.fromEntries(novosProventos));
    setProventosCompletos(novosProventos);
    setLoadingProventos(false);
    return novosProventos;
  }, []);

  // 🎯 FUNÇÃO PRINCIPAL STEP-BY-STEP ROBUSTA PARA FIIs
  const buscarDadosCompletosFIIs = React.useCallback(async () => {
    if (!fiisOriginais || fiisOriginais.length === 0) {
      setFiisAtualizados([]);
      setLoadingCotacoes(false);
      return;
    }

    try {
      setError(null);
      setTodosOsDadosProntos(false);
      const tickers = fiisOriginais.map(fii => fii.ticker).filter(Boolean);
      
      console.log('🚀 INICIANDO BUSCA STEP-BY-STEP ROBUSTA PARA FIIs...');
      
      // 🔄 RESET DOS ESTADOS
      setCotacoesCompletas(new Map());
      setDyCompletos(new Map());
      setProventosCompletos(new Map());

      // 📊 ETAPA 1: COTAÇÕES
      console.log('📊 ETAPA 1: Buscando cotações FIIs...');
      setLoadingCotacoes(true);
      
      const cotacoesMap = await buscarCotacoesFIIsParalelas(tickers, isMobile);
      console.log('📊 Cotações FIIs obtidas:', cotacoesMap.size, 'de', tickers.length);
      
      setCotacoesCompletas(cotacoesMap);
      setLoadingCotacoes(false);

      // 📈 ETAPA 2: DY
      console.log('📈 ETAPA 2: Buscando DY FIIs...');
      setLoadingDY(true);
      
      const dyMap = await buscarDYsFiisComEstrategia(tickers, isMobile);
      console.log('📈 DY FIIs obtidos:', dyMap.size, 'de', tickers.length);
      
      setDyCompletos(dyMap);
      setLoadingDY(false);

      // 💰 ETAPA 3: PROVENTOS
      console.log('💰 ETAPA 3: Buscando proventos FIIs...');
      setLoadingProventos(true);
      
      const proventosData = await buscarProventosFIIs(fiisOriginais);
      console.log('💰 Proventos FIIs obtidos:', proventosData.size, 'de', fiisOriginais.length);
      
      setProventosCompletos(proventosData);
      setLoadingProventos(false);

      // ✅ MARCAR COMO TODOS PRONTOS
      console.log('✅ TODOS OS DADOS FIIs COLETADOS - MARCANDO COMO PRONTOS');
      setTodosOsDadosProntos(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro geral ao buscar dados FIIs:', err);
      
      setLoadingCotacoes(false);
      setLoadingDY(false);
      setLoadingProventos(false);
    }
  }, [fiisOriginais, isMobile, buscarProventosFIIs]);

  // 🏆 USEEFFECT QUE PROCESSA QUANDO TODOS OS DADOS ESTÃO PRONTOS
  React.useEffect(() => {
    if (!todosOsDadosProntos || !fiisOriginais || fiisOriginais.length === 0) return;
    
    console.log('🏆 PROCESSANDO TOTAL RETURN FIIs - TODOS OS DADOS PRONTOS!');
    console.log('📊 Dados FIIs disponíveis:', {
      cotacoes: cotacoesCompletas.size,
      dy: dyCompletos.size, 
      proventos: proventosCompletos.size,
      fiis: fiisOriginais.length
    });

    // 🎯 PROCESSAR TODOS OS FIIs COM TOTAL RETURN CORRETO
    const fiisFinais = fiisOriginais.map((fii, index) => {
      const cotacao = cotacoesCompletas.get(fii.ticker);
      const dyAPI = dyCompletos.get(fii.ticker);
      const proventosFII = proventosCompletos.get(fii.ticker) || 0;
      
      if (cotacao && cotacao.precoAtual > 0) {
        // ✅ FII COM COTAÇÃO REAL DA API
        const precoAtualNum = cotacao.precoAtual;
        const precoEntradaNum = parseFloat(fii.precoEntrada?.toString().replace('R$ ', '').replace(',', '.') || '0');
        
        const performancePreco = precoEntradaNum > 0 ? ((precoAtualNum - precoEntradaNum) / precoEntradaNum) * 100 : 0;
        const performanceProventos = precoEntradaNum > 0 ? (proventosFII / precoEntradaNum) * 100 : 0;
        const performanceTotal = performancePreco + performanceProventos;
        
        console.log(`🏆 ${fii.ticker}: R$ ${precoEntradaNum.toFixed(2)} -> R$ ${precoAtualNum.toFixed(2)} | Preço ${performancePreco.toFixed(2)}% + Proventos ${performanceProventos.toFixed(2)}% = TOTAL ${performanceTotal.toFixed(2)}%`);
        
        return {
          ...fii,
          id: String(fii.id || index + 1),
          precoAtual: `R$ ${precoAtualNum.toFixed(2).replace('.', ',')}`,
          precoAtualNum: precoAtualNum,
          performance: performanceTotal,
          performancePreco: performancePreco,
          performanceProventos: performanceProventos,
          proventosFII: proventosFII,
          variacao: cotacao.variacao,
          variacaoPercent: cotacao.variacaoPercent,
          volume: cotacao.volume,
          vies: aplicarViesOverride(
            fii.viesOverride,
            calcularViesAutomaticoFII(fii.precoTeto, precoAtualNum)
          ),
          dy: dyAPI || fii.dy || '-',
          statusApi: 'success',
          nomeCompleto: cotacao.nome,
          posicaoExibicao: index + 1
        };
      } else {
        // ⚠️ FII SEM COTAÇÃO REAL - usar dados originais + proventos
        const precoEntradaNum = parseFloat(fii.precoEntrada?.toString().replace('R$ ', '').replace(',', '.') || '0');
        const performanceProventos = precoEntradaNum > 0 ? (proventosFII / precoEntradaNum) * 100 : 0;
        
        console.log(`🏆 ${fii.ticker}: Sem cotação API | R$ ${precoEntradaNum.toFixed(2)} + Proventos ${performanceProventos.toFixed(2)}% = TOTAL ${performanceProventos.toFixed(2)}%`);
        
        return {
          ...fii,
          id: String(fii.id || index + 1),
          precoAtual: fii.precoAtual || fii.precoEntrada || 'N/A',
          precoAtualNum: precoEntradaNum,
          performance: performanceProventos,
          performancePreco: 0,
          performanceProventos: performanceProventos,
          proventosFII: proventosFII,
          variacao: 0,
          variacaoPercent: 0,
          volume: 0,
          vies: aplicarViesOverride(
            fii.viesOverride,
            calcularViesAutomaticoFII(fii.precoTeto, precoEntradaNum)
          ),
          dy: dyAPI || fii.dy || '-',
          statusApi: 'not_found',
          nomeCompleto: 'N/A',
          posicaoExibicao: index + 1
        };
      }
    });

    // 🎯 ATUALIZAÇÃO FINAL DEFINITIVA
    setFiisAtualizados(fiisFinais);
    
    console.log('🏆 TOTAL RETURN FIIs PROCESSADO COM SUCESSO!');
  }, [todosOsDadosProntos, cotacoesCompletas, dyCompletos, proventosCompletos, fiisOriginais]);

  // UseEffect principal
  React.useEffect(() => {
    if (fiisOriginais && fiisOriginais.length > 0) {
      const timeoutId = setTimeout(() => {
        console.log('🚀 Iniciando busca de dados FIIs...');
        buscarDadosCompletosFIIs();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [buscarDadosCompletosFIIs]);

  const refetch = React.useCallback(() => {
    console.log('🔄 REFETCH FIIs: Resetando e buscando dados novamente...');
    setTodosOsDadosProntos(false);
    buscarDadosCompletosFIIs();
  }, [buscarDadosCompletosFIIs]);

  return {
    fiis: fiisAtualizados,
    loading: loadingCotacoes || !todosOsDadosProntos,
    loadingCotacoes,
    loadingDY,
    loadingProventos,
    error: error || fiisError,
    refetch,
    isMobile,
    todosOsDadosProntos
  };
}
