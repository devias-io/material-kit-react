import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/cache-service';
import { BRAPI_CONFIG } from '@/lib/brapi-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 5;

const INFLATION_TTL_SECONDS = 3600;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forwardedParams = new URLSearchParams(searchParams);
    forwardedParams.set('token', BRAPI_CONFIG.TOKEN);

    const cacheKey = CacheService.getCacheKey(
      'brapi',
      'inflation',
      forwardedParams.toString() || 'default'
    );

    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () => {
        const url = `${BRAPI_CONFIG.BASE_URL}/v2/inflation?${forwardedParams.toString()}`;
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
        ttlSeconds: INFLATION_TTL_SECONDS,
        tags: ['brapi', 'inflation']
      }
    );

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': `public, max-age=${INFLATION_TTL_SECONDS}`,
        'X-Cache-Hit': String(metadata.cached)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';

    return NextResponse.json(
      { error: `Falha ao buscar dados de inflação: ${message}` },
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
