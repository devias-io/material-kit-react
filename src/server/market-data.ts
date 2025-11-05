'use server';

const BRAPI_TOKEN = process.env.BRAPI_TOKEN?.trim();

const DEFAULT_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export type QuoteRequestInput =
  | string
  | {
      symbol: string;
      yahooSymbol?: string;
      brapiSymbol?: string;
      key?: string;
    };

export type TrendDirection = 'up' | 'down';

export interface CombinedQuote {
  key: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  trend: TrendDirection | null;
  currency?: string | null;
  yahoo?: Record<string, any> | null;
  brapi?: Record<string, any> | null;
  sources: {
    price?: 'brapi' | 'yahoo';
    change?: 'brapi' | 'yahoo';
    changePercent?: 'brapi' | 'yahoo';
  };
}

export interface MarketSnapshot {
  quotes: Record<string, CombinedQuote>;
  fromCache: boolean;
  cachedAt: number;
  cacheTtlMs: number;
  metadata: {
    requested: string[];
    brapiSymbols: string[];
    yahooSymbols: string[];
    missing: string[];
  };
}

type CacheEntry = {
  timestamp: number;
  ttl: number;
  data: MarketSnapshot;
};

const cache = new Map<string, CacheEntry>();

const SPECIAL_SYMBOLS: Record<string, { brapiSymbol?: string; yahooSymbol?: string; key?: string }> = {
  IBOV: { brapiSymbol: '^BVSP', yahooSymbol: '^BVSP', key: 'IBOV' },
  SMLL: { brapiSymbol: 'SMLL11', yahooSymbol: 'SMLL11.SA', key: 'SMLL' },
  IFIX: { brapiSymbol: 'IFIX', yahooSymbol: 'IFIX.SA', key: 'IFIX' }
};

interface NormalizedRequest {
  key: string;
  requested: string;
  yahooSymbol?: string;
  brapiSymbol?: string;
}

interface FetchOptions {
  includeDividends?: boolean;
  cacheTtlMs?: number;
  forceRefresh?: boolean;
}

function normalizeTickerKey(symbol?: string | null): string {
  if (!symbol) return '';
  const upper = symbol.toUpperCase();
  if (upper.startsWith('^')) {
    return upper;
  }

  const suffixes = ['.SA', '.BS', '.US', '.F'];
  for (const suffix of suffixes) {
    if (upper.endsWith(suffix)) {
      return upper.slice(0, -suffix.length);
    }
  }
  return upper;
}

function ensureYahooSymbol(symbol: string): string {
  if (!symbol) return symbol;
  if (symbol.startsWith('^')) return symbol;
  if (symbol.includes('.')) return symbol;
  return `${symbol}.SA`;
}

function buildRequest(input: QuoteRequestInput): NormalizedRequest {
  if (typeof input === 'string') {
    return buildRequest({ symbol: input });
  }

  const requested = input.symbol.trim();
  const normalized = normalizeTickerKey(requested);
  const preset = SPECIAL_SYMBOLS[normalized];

  const key = input.key || preset?.key || normalized;
  const brapiSymbol = input.brapiSymbol || preset?.brapiSymbol || normalized;
  const yahooSymbol = input.yahooSymbol || preset?.yahooSymbol || ensureYahooSymbol(normalized);

  return {
    key,
    requested: normalized,
    brapiSymbol,
    yahooSymbol
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function resolveQuote(
  map: Record<string, any>,
  candidateKeys: Set<string>
): Record<string, any> | undefined {
  for (const key of candidateKeys) {
    if (!key) continue;
    const quote = map[key];
    if (quote) {
      return quote;
    }
  }
  return undefined;
}

async function fetchFromBrapi(
  requests: NormalizedRequest[],
  includeDividends: boolean
): Promise<Record<string, any>> {
  if (requests.length === 0) {
    return {};
  }

  const uniqueSymbols = Array.from(
    new Set(
      requests
        .map((request) => request.brapiSymbol)
        .filter((symbol): symbol is string => Boolean(symbol))
    )
  );

  const chunks = chunkArray(uniqueSymbols, 10);
  const aggregatedResults: Record<string, any> = {};

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const url = new URL(`https://brapi.dev/api/quote/${chunk.join(',')}`);
        if (includeDividends) {
          url.searchParams.set('dividends', 'true');
        }
        if (BRAPI_TOKEN) {
          url.searchParams.set('token', BRAPI_TOKEN);
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'MembrosFatosdaBolsa/1.0'
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          console.warn(`⚠️ BRAPI request failed with status ${response.status}`);
          return;
        }

        const data = await response.json();
        const quotes = Array.isArray(data?.results) ? data.results : [];

        for (const quote of quotes) {
          const normalizedSymbol = normalizeTickerKey(quote?.symbol || quote?.stock || quote?.ticker);
          if (!normalizedSymbol) continue;

          aggregatedResults[normalizedSymbol] = quote;

          for (const [aliasKey, config] of Object.entries(SPECIAL_SYMBOLS)) {
            const presetSymbol = config.brapiSymbol ? normalizeTickerKey(config.brapiSymbol) : null;
            if (presetSymbol && presetSymbol === normalizedSymbol) {
              aggregatedResults[aliasKey] = quote;
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch BRAPI data:', error);
      }
    })
  );

  return aggregatedResults;
}

async function fetchFromYahoo(requests: NormalizedRequest[]): Promise<Record<string, any>> {
  if (requests.length === 0) {
    return {};
  }

  const uniqueSymbols = Array.from(
    new Set(
      requests
        .map((request) => request.yahooSymbol)
        .filter((symbol): symbol is string => Boolean(symbol))
    )
  );

  if (uniqueSymbols.length === 0) {
    return {};
  }

  const chunks = chunkArray(uniqueSymbols, 10);
  const aggregatedResults: Record<string, any> = {};

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const url = new URL('https://query1.finance.yahoo.com/v7/finance/quote');
        url.searchParams.set('symbols', chunk.join(','));

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json',
            Referer: 'https://finance.yahoo.com/'
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          console.warn(`⚠️ Yahoo request failed with status ${response.status}`);
          return;
        }

        const data = await response.json();
        const quotes = Array.isArray(data?.quoteResponse?.result) ? data.quoteResponse.result : [];

        for (const quote of quotes) {
          const normalizedSymbol = normalizeTickerKey(quote?.symbol);
          if (!normalizedSymbol) continue;

          aggregatedResults[normalizedSymbol] = quote;

          for (const [aliasKey, config] of Object.entries(SPECIAL_SYMBOLS)) {
            const presetSymbol = config.yahooSymbol ? normalizeTickerKey(config.yahooSymbol) : null;
            if (presetSymbol && presetSymbol === normalizedSymbol) {
              aggregatedResults[aliasKey] = quote;
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch Yahoo Finance data:', error);
      }
    })
  );

  return aggregatedResults;
}

function buildCombinedQuotes(
  requests: NormalizedRequest[],
  brapiMap: Record<string, any>,
  yahooMap: Record<string, any>
): Record<string, CombinedQuote> {
  const combined: Record<string, CombinedQuote> = {};

  for (const request of requests) {
    const key = request.key;
    if (combined[key]) {
      continue; // Avoid overwriting duplicates
    }

    const candidateKeys = new Set<string>();
    candidateKeys.add(request.key);
    candidateKeys.add(request.requested);

    if (request.brapiSymbol) {
      candidateKeys.add(normalizeTickerKey(request.brapiSymbol));
    }
    if (request.yahooSymbol) {
      candidateKeys.add(normalizeTickerKey(request.yahooSymbol));
    }

    const preset = SPECIAL_SYMBOLS[request.key] || SPECIAL_SYMBOLS[request.requested];
    if (preset?.brapiSymbol) {
      candidateKeys.add(normalizeTickerKey(preset.brapiSymbol));
    }
    if (preset?.yahooSymbol) {
      candidateKeys.add(normalizeTickerKey(preset.yahooSymbol));
    }

    const brapiQuote = resolveQuote(brapiMap, candidateKeys);
    const yahooQuote = resolveQuote(yahooMap, candidateKeys);

    const priceFromBrapi = brapiQuote?.regularMarketPrice ?? brapiQuote?.price ?? null;
    const priceFromYahoo = yahooQuote?.regularMarketPrice ?? null;

    const changeFromBrapi = brapiQuote?.regularMarketChange ?? null;
    const changeFromYahoo = yahooQuote?.regularMarketChange ?? null;

    const changePercentFromBrapi = brapiQuote?.regularMarketChangePercent ?? brapiQuote?.changePercent ?? null;
    const changePercentFromYahoo = yahooQuote?.regularMarketChangePercent ?? null;

    const price = priceFromBrapi ?? priceFromYahoo ?? null;
    const change = changeFromBrapi ?? changeFromYahoo ?? null;
    const changePercent = changePercentFromBrapi ?? changePercentFromYahoo ?? null;

    const trend: TrendDirection | null =
      typeof changePercent === 'number'
        ? changePercent >= 0
          ? 'up'
          : 'down'
        : null;

    combined[key] = {
      key,
      price: typeof price === 'number' ? price : null,
      change: typeof change === 'number' ? change : null,
      changePercent: typeof changePercent === 'number' ? changePercent : null,
      trend,
      currency: brapiQuote?.currency || yahooQuote?.currency || null,
      yahoo: yahooQuote || null,
      brapi: brapiQuote || null,
      sources: {
        price: priceFromBrapi != null ? 'brapi' : priceFromYahoo != null ? 'yahoo' : undefined,
        change: changeFromBrapi != null ? 'brapi' : changeFromYahoo != null ? 'yahoo' : undefined,
        changePercent:
          changePercentFromBrapi != null
            ? 'brapi'
            : changePercentFromYahoo != null
            ? 'yahoo'
            : undefined
      }
    };
  }

  return combined;
}

function buildCacheKey(requests: NormalizedRequest[], includeDividends: boolean): string {
  const sortedKeys = [...new Set(requests.map((request) => request.key))].sort();
  return JSON.stringify({ symbols: sortedKeys, includeDividends });
}

export async function getMarketSnapshot(
  inputs: QuoteRequestInput[],
  options: FetchOptions = {}
): Promise<MarketSnapshot> {
  const includeDividends = Boolean(options.includeDividends);
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;

  const requests = inputs.map((input) => buildRequest(input));
  const cacheKey = buildCacheKey(requests, includeDividends);

  if (!options.forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return {
        ...cached.data,
        fromCache: true,
        cachedAt: cached.timestamp,
        cacheTtlMs: cached.ttl
      };
    }
  }

  const [brapiMap, yahooMap] = await Promise.all([
    fetchFromBrapi(requests, includeDividends),
    fetchFromYahoo(requests)
  ]);

  const combined = buildCombinedQuotes(requests, brapiMap, yahooMap);

  const requestedKeys = [...new Set(requests.map((request) => request.key))];
  const missing = requestedKeys.filter((key) => !combined[key]);

  const snapshot: MarketSnapshot = {
    quotes: combined,
    fromCache: false,
    cachedAt: Date.now(),
    cacheTtlMs,
    metadata: {
      requested: requestedKeys,
      brapiSymbols: Object.keys(brapiMap),
      yahooSymbols: Object.keys(yahooMap),
      missing
    }
  };

  cache.set(cacheKey, {
    timestamp: snapshot.cachedAt,
    ttl: cacheTtlMs,
    data: snapshot
  });

  return snapshot;
}

export function clearMarketSnapshotCache(): void {
  cache.clear();
}
