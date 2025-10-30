import { NextRequest, NextResponse } from 'next/server';
import { calcularDyAPartirDoResultado, formatarDy } from '@/utils/dividendYield';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const BRAPI_TOKEN = process.env.BRAPI_TOKEN?.trim() || 'jJrMYVy9MATGEicx3GxBp8';
const CACHE_DURATION = 5 * 60 * 1000;

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
 * Tenta buscar dados da BRAPI com múltiplas estratégias de fallback
 */
async function fetchWithFallback(tickersString: string): Promise<any> {
  const strategies = [
    // Estratégia 1: Sem parâmetros extras (mais confiável)
    {
      name: 'basica',
      url: `https://brapi.dev/api/quote/${tickersString}?token=${BRAPI_TOKEN}`
    },
    // Estratégia 2: Com fundamental (pode incluir dividendos)
    {
      name: 'fundamental',
      url: `https://brapi.dev/api/quote/${tickersString}?token=${BRAPI_TOKEN}&fundamental=true`
    },
    // Estratégia 3: Com range de 1 ano
    {
      name: 'range_1y',
      url: `https://brapi.dev/api/quote/${tickersString}?token=${BRAPI_TOKEN}&range=1y`
    }
  ];

  let lastError: Error | null = null;

  for (const strategy of strategies) {
    try {
      console.log(`🔍 [BRAPI] Tentando estratégia: ${strategy.name}`);
      
      const response = await fetch(strategy.url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MembrosFatosdaBolsa/1.0',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Verificar se retornou dados válidos
        if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
          console.log(`✅ [BRAPI] Sucesso com estratégia: ${strategy.name}`);
          return { data, strategy: strategy.name };
        }
      } else {
        console.warn(`⚠️ [BRAPI] Estratégia ${strategy.name} retornou ${response.status}`);
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ [BRAPI] Erro na estratégia ${strategy.name}:`, error);
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
      // Usar a nova função com fallback
      const { data, strategy } = await fetchWithFallback(chunkUpper.join(','));
      const quotes = Array.isArray(data?.results) ? data.results : [];

      const processed = new Set<string>();

      quotes.forEach((quote: any) => {
        const symbolNormalizado = normalizarTicker(quote?.symbol);
        if (!symbolNormalizado) {
          return;
        }

        const requestInfo = requestMap.get(symbolNormalizado);
        const { valor, origem } = calcularDyAPartirDoResultado(quote, symbolNormalizado);
        const dy12Meses = valor && valor > 0 ? valor : 0;
        const dyFormatado = dy12Meses > 0 ? formatarDy(dy12Meses) : '0,00%';

        const result: DividendYieldResult = {
          dy12Meses,
          dyFormatado,
          fonte: `brapi_${strategy} | ${origem}`,
          symbol: quote?.symbol ? String(quote.symbol).toUpperCase() : requestInfo?.original || symbolNormalizado,
          requested: requestInfo?.original || symbolNormalizado
        };

        results[symbolNormalizado] = result;
        cache.set(symbolNormalizado, { result, timestamp: Date.now() });
        processed.add(symbolNormalizado);
      });

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
