import { NextRequest, NextResponse } from 'next/server';
import { calcularDyAPartirDoResultado, formatarDy } from '@/utils/dividendYield';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const BRAPI_TOKEN = process.env.BRAPI_TOKEN?.trim() || 'jJrMYVy9MATGEicx3GxBp8';
const CACHE_DURATION = 5 * 60 * 1000;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

type DividendYieldResult = {
  dy12Meses: number;
  dyFormatado: string;
  fonte: string;
  symbol?: string;
  requested: string;
};

type CacheEntry = {
  timestamp: number;
  result: DividendYieldResult;
};

const cache = new Map<string, CacheEntry>();

const normalizarTicker = (symbol?: string) => {
  if (!symbol) return '';
  const [base] = symbol.split('.');
  return base.toUpperCase();
};

const chunkArray = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

/**
 * Calcula DY a partir dos proventos da API interna
 * ATENÇÃO: Só funciona em desenvolvimento (localhost)
 */
async function calcularDyDeProventos(ticker: string, precoAtual: number): Promise<number | null> {
  // Só tentar em desenvolvimento
  if (!IS_DEVELOPMENT) {
    return null;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/proventos/${ticker}`, {
      headers: {
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(3000) // Timeout de 3 segundos
    });

    if (!response.ok) {
      return null;
    }

    const proventos = await response.json();
    
    if (!Array.isArray(proventos) || proventos.length === 0) {
      return null;
    }

    // Somar dividendos dos últimos 12 meses
    const limite = new Date();
    limite.setFullYear(limite.getFullYear() - 1);

    const somaDividendos = proventos.reduce((total, provento) => {
      const dataPagamento = new Date(provento.dataPagamento || provento.dataEx);
      const valor = parseFloat(provento.valor || 0);

      if (dataPagamento >= limite && valor > 0) {
        return total + valor;
      }
      return total;
    }, 0);

    if (somaDividendos > 0 && precoAtual > 0) {
      const dy = somaDividendos / precoAtual;
      console.log(`📊 [PROVENTOS-API] ${ticker}: DY calculado = ${(dy * 100).toFixed(2)}% (soma=${somaDividendos.toFixed(2)}, preço=${precoAtual.toFixed(2)})`);
      return dy;
    }

    return null;
  } catch (error) {
    // Silenciar erros em produção
    if (IS_DEVELOPMENT) {
      console.error(`❌ [PROVENTOS-API] Erro ao buscar proventos de ${ticker}:`, error);
    }
    return null;
  }
}

/**
 * Tenta buscar dados da BRAPI com múltiplas estratégias de fallback
 */
async function fetchWithFallback(tickersString: string): Promise<any> {
  type Strategy = {
    name: string;
    url: string;
    useAuthHeader?: boolean;
  };
  
  const strategies: Strategy[] = [
    // Estratégia 1: Token no query param com dividends
    {
      name: 'dividends_query',
      url: `https://brapi.dev/api/quote/${tickersString}?token=${BRAPI_TOKEN}&dividends=true`
    },
    // Estratégia 2: Com fundamental (pode incluir defaultKeyStatistics com dividend yield)
    {
      name: 'fundamental',
      url: `https://brapi.dev/api/quote/${tickersString}?token=${BRAPI_TOKEN}&fundamental=true`
    },
    // Estratégia 3: Módulo defaultKeyStatistics (inclui dividendYield)
    {
      name: 'modules_keyStats',
      url: `https://brapi.dev/api/quote/${tickersString}?token=${BRAPI_TOKEN}&modules=defaultKeyStatistics`
    },
    // Estratégia 4: Básica (fallback final)
    {
      name: 'basica',
      url: `https://brapi.dev/api/quote/${tickersString}?token=${BRAPI_TOKEN}`
    }
  ];

  let lastError: Error | null = null;

  for (const strategy of strategies) {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': 'MembrosFatosdaBolsa/1.0',
        'Cache-Control': 'no-cache'
      };

      // Se a estratégia usar auth header, adicionar
      if (strategy.useAuthHeader) {
        headers['Authorization'] = `Bearer ${BRAPI_TOKEN}`;
      }
      
      const response = await fetch(strategy.url, {
        method: 'GET',
        headers,
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Verificar se retornou dados válidos
        if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
          return { data, strategy: strategy.name };
        }
      }
    } catch (error) {
      lastError = error as Error;
    }
  }

  // Se todas as estratégias falharam, lançar erro
  throw lastError || new Error('Todas as estratégias de busca falharam');
}

async function fetchBatchFromBrapi(tickers: string[]): Promise<Record<string, DividendYieldResult>> {
  const results: Record<string, DividendYieldResult> = {};
  if (tickers.length === 0) {
    return results;
  }

  const now = Date.now();
  const pendingTickers: string[] = [];

  // Verificar cache primeiro
  tickers.forEach((ticker) => {
    const normalized = normalizarTicker(ticker);
    const cached = cache.get(normalized);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      results[normalized] = cached.result;
    } else {
      pendingTickers.push(ticker);
    }
  });

  if (pendingTickers.length === 0) {
    return results;
  }

  const chunks = chunkArray(pendingTickers, 8);

  for (const chunk of chunks) {
    const chunkUpper = chunk.map((ticker) => ticker.toUpperCase());
    const requestMap = new Map<string, { original: string; normalized: string }>();

    chunkUpper.forEach((ticker) => {
      const normalized = normalizarTicker(ticker);
      if (normalized) {
        requestMap.set(normalized, { original: ticker, normalized });
      }
    });

    try {
      const { data, strategy } = await fetchWithFallback(chunkUpper.join(','));
      const quotes = Array.isArray(data?.results) ? data.results : [];

      const processed = new Set<string>();

      for (const quote of quotes) {
        const symbolNormalizado = normalizarTicker(quote?.symbol);
        if (!symbolNormalizado) {
          continue;
        }

        const requestInfo = requestMap.get(symbolNormalizado);
        
        // Primeiro, tentar calcular com dados da BRAPI
        const { valor: valorBrapi, origem: origemBrapi } = calcularDyAPartirDoResultado(quote, symbolNormalizado);
        
        let dy12Meses = valorBrapi && valorBrapi > 0 ? valorBrapi : 0;
        let fonte = `brapi_${strategy} | ${origemBrapi}`;

        // Se BRAPI não retornou DY E estamos em desenvolvimento, tentar API de proventos interna
        if ((dy12Meses === 0 || origemBrapi === 'nao_encontrado') && IS_DEVELOPMENT) {
          const precoAtual = quote?.regularMarketPrice || quote?.regularMarketPreviousClose || 0;
          
          if (precoAtual > 0) {
            const dyProventos = await calcularDyDeProventos(symbolNormalizado, precoAtual);
            
            if (dyProventos && dyProventos > 0) {
              dy12Meses = dyProventos;
              fonte = 'proventos_api | calc:12m';
            }
          }
        }

        const dyFormatado = dy12Meses > 0 ? formatarDy(dy12Meses) : '0,00%';

        const result: DividendYieldResult = {
          dy12Meses,
          dyFormatado,
          fonte,
          symbol: quote?.symbol ? String(quote.symbol).toUpperCase() : requestInfo?.original || symbolNormalizado,
          requested: requestInfo?.original || symbolNormalizado
        };

        results[symbolNormalizado] = result;
        cache.set(symbolNormalizado, { result, timestamp: Date.now() });
        processed.add(symbolNormalizado);
      }

      // Marcar como não encontrado os que não vieram na resposta
      requestMap.forEach(({ original, normalized }) => {
        if (!processed.has(normalized)) {
          const fallback: DividendYieldResult = {
            dy12Meses: 0,
            dyFormatado: '0,00%',
            fonte: `brapi_${strategy} | nao_encontrado`,
            symbol: original,
            requested: original
          };
          results[normalized] = fallback;
          cache.set(normalized, { result: fallback, timestamp: Date.now() });
        }
      });
    } catch (error) {
      console.error(`❌ Erro ao buscar DY batch ${chunk.join(', ')}:`, error);
      
      // Em caso de erro total, marcar todos como não encontrados
      requestMap.forEach(({ original, normalized }) => {
        const fallback: DividendYieldResult = {
          dy12Meses: 0,
          dyFormatado: '0,00%',
          fonte: 'brapi_batch | erro_api',
          symbol: original,
          requested: original
        };
        results[normalized] = fallback;
        cache.set(normalized, { result: fallback, timestamp: Date.now() });
      });
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tickers = Array.isArray(body?.tickers) ? body.tickers : [];

    if (tickers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista de tickers vazia' },
        { status: 400 }
      );
    }

    const sanitizedTickers = tickers
      .map((ticker: string) => String(ticker || '').trim().toUpperCase())
      .filter((ticker) => ticker);

    const uniqueTickers = Array.from(new Set(sanitizedTickers));

    const batchResults = await fetchBatchFromBrapi(uniqueTickers);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: batchResults,
      metadata: {
        totalRequested: uniqueTickers.length,
        cacheSize: cache.size
      }
    });
  } catch (error) {
    console.error('❌ Erro na API de DY batch:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
        results: {}
      },
      { status: 500 }
    );
  }
}
