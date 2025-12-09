// src/app/api/financial/market-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMarketSnapshot, type CombinedQuote } from '@/server/market-data';
import { buildCacheHeaders } from '@/server/cache-headers';
import { logApiMetric } from '@/lib/metrics';
import { CacheService } from '@/lib/cache-service';

export const dynamic = 'force-dynamic';
export const revalidate = 300;
export const fetchCache = 'default-cache';
export const runtime = 'nodejs';
export const maxDuration = 5;

const MARKET_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESPONSE_CACHE_HEADERS = buildCacheHeaders({ ttl: 300, swr: 600 });

const FALLBACK_MARKET_DATA = {
  ibovespa: { value: '136.431', trend: 'down' as const, diff: -0.26 },
  indiceSmall: { value: '2.237,86', trend: 'up' as const, diff: 1.56 },
  carteiraHoje: { value: '88.7%', trend: 'up' as const, diff: 88.7 },
  dividendYield: { value: '7.4%', trend: 'up' as const, diff: 7.4 },
  ibovespaPeriodo: { value: '6.1%', trend: 'up' as const, diff: 6.1 },
  carteiraPeriodo: { value: '9.3%', trend: 'up' as const, diff: 9.3 }
};

type MarketMetric = {
  value: string;
  trend: 'up' | 'down';
  diff: number;
};

function formatMarketValue(value: number): string {
  if (value >= 1000 && value < 10000) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  if (value >= 10000) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  return value.toFixed(2);
}

function buildMetric(quote: CombinedQuote | undefined, fallback: MarketMetric): MarketMetric {
  if (!quote || quote.price == null) {
    return fallback;
  }

  const diff = typeof quote.changePercent === 'number' ? Number(quote.changePercent.toFixed(2)) : fallback.diff;
  const trend = quote.trend ?? (diff >= 0 ? 'up' : 'down');

  return {
    value: formatMarketValue(quote.price),
    trend,
    diff
  };
}

export async function GET(_request: NextRequest) {
  const startedAt = Date.now();

  try {
    const { data, metadata } = await CacheService.withCache(
      CacheService.getCacheKey('market', 'data', 'all'),
      async () => {
        const snapshot = await getMarketSnapshot(
          [
            { symbol: 'IBOV', key: 'IBOV' },
            { symbol: 'SMLL', key: 'SMLL' }
          ],
          { cacheTtlMs: MARKET_CACHE_TTL_MS }
        );

        const ibovespaMetric = buildMetric(snapshot.quotes.IBOV, FALLBACK_MARKET_DATA.ibovespa);
        const smllMetric = buildMetric(snapshot.quotes.SMLL, FALLBACK_MARKET_DATA.indiceSmall);

        const processingTime = Date.now() - startedAt;

        return {
          body: {
            marketData: {
              ibovespa: ibovespaMetric,
              indiceSmall: smllMetric,
              carteiraHoje: FALLBACK_MARKET_DATA.carteiraHoje,
              dividendYield: FALLBACK_MARKET_DATA.dividendYield,
              ibovespaPeriodo: FALLBACK_MARKET_DATA.ibovespaPeriodo,
              carteiraPeriodo: FALLBACK_MARKET_DATA.carteiraPeriodo
            },
            metadata: {
              timestamp: new Date().toISOString(),
              processingTime,
              cache: {
                fromCache: snapshot.fromCache,
                cachedAt: snapshot.cachedAt,
                cacheTtlMs: snapshot.cacheTtlMs,
                expiresAt: snapshot.cachedAt + snapshot.cacheTtlMs
              },
              sources: {
                ibovespa: snapshot.quotes.IBOV?.sources ?? {},
                indiceSmall: snapshot.quotes.SMLL?.sources ?? {}
              },
              requested: snapshot.metadata.requested,
              upstream: snapshot.metadata,
              lastUpdate: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
              version: '7.0-server-fetcher'
            }
          }
        };
      },
      {
        ttlSeconds: 300,
        tags: ['market', 'market-data'],
      }
    );

    const response = NextResponse.json(data.body, {
      status: 200,
      headers: {
        ...RESPONSE_CACHE_HEADERS,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

    logApiMetric({
      route: '/api/financial/market-data',
      cacheHit: metadata.cached,
      cacheBackend: metadata.backend,
      durationMs: Date.now() - startedAt,
      status: 200,
    });

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    return NextResponse.json(
      {
        error: `Falha ao buscar dados: ${errorMessage}`,
        marketData: FALLBACK_MARKET_DATA,
        metadata: {
          timestamp: new Date().toISOString(),
          fallback: true,
          error: errorMessage
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
