import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/cache-service';
import { BRAPI_CONFIG } from '@/lib/brapi-config';
import { buildCacheHeaders } from '@/server/cache-headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 5;

const QUOTE_TTL_SECONDS = 300;
const CACHE_HEADERS = buildCacheHeaders({ ttl: QUOTE_TTL_SECONDS, swr: QUOTE_TTL_SECONDS * 2 });

function parseTickers(searchParams: URLSearchParams): string[] {
  const tickersParam = searchParams.get('tickers') ?? searchParams.get('symbols') ?? '';
  return tickersParam
    .split(',')
    .map(ticker => ticker.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tickers = parseTickers(searchParams);

    if (tickers.length === 0) {
      return NextResponse.json(
        { error: 'Parâmetro "tickers" é obrigatório.' },
        { status: 400, headers: { 'Cache-Control': 'no-store', 'X-Cache-Hit': 'false' } }
      );
    }

    const forwardedParams = new URLSearchParams();

    searchParams.forEach((value, key) => {
      if (key === 'tickers' || key === 'symbols') return;
      forwardedParams.set(key, value);
    });

    forwardedParams.set('token', BRAPI_CONFIG.TOKEN);

    const cacheKey = CacheService.getCacheKey(
      'brapi',
      'quote',
      tickers.join(','),
      forwardedParams.toString()
    );

    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () => {
        const url = `${BRAPI_CONFIG.BASE_URL}${BRAPI_CONFIG.ENDPOINTS.QUOTE}/${tickers.join(',')}?${forwardedParams.toString()}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MembrosFatosdaBolsa-API'
          }
        });

        if (!response.ok) {
          throw new Error(`Brapi HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      },
      {
        ttlSeconds: QUOTE_TTL_SECONDS,
        tags: ['brapi', 'quotes', ...tickers]
      }
    );

    return NextResponse.json(data, {
      status: 200,
      headers: {
        ...CACHE_HEADERS,
        'X-Cache-Hit': String(metadata.cached)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';

    return NextResponse.json(
      { error: `Falha ao buscar cotações: ${message}` },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'X-Cache-Hit': 'false'
        }
      }
    );
  }
}
