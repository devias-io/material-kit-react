import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/cache-service';
import { BRAPI_CONFIG } from '@/lib/brapi-config';
import { buildCacheHeaders } from '@/server/cache-headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 5;

const LIST_TTL_SECONDS = 3600;
const CACHE_HEADERS = buildCacheHeaders({ ttl: LIST_TTL_SECONDS, swr: LIST_TTL_SECONDS * 2 });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const type = searchParams.get('type') ?? '';

    const forwardedParams = new URLSearchParams();

    if (search) {
      forwardedParams.set('search', search);
    }

    if (type) {
      forwardedParams.set('type', type);
    }

    forwardedParams.set('token', BRAPI_CONFIG.TOKEN);

    const cacheKey = CacheService.getCacheKey('brapi', 'quote', 'list', search || 'all', type || 'all');

    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () => {
        const url = `${BRAPI_CONFIG.BASE_URL}${BRAPI_CONFIG.ENDPOINTS.QUOTE_LIST}?${forwardedParams.toString()}`;
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
        ttlSeconds: LIST_TTL_SECONDS,
        tags: ['brapi', 'list']
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
      { error: `Falha ao buscar lista de ativos: ${message}` },
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
