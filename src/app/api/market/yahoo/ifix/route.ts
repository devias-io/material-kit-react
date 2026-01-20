import { NextResponse } from 'next/server';
import { CacheService } from '@/lib/redis';
import { logApiMetric } from '@/lib/metrics';

export const dynamic = 'force-dynamic';
export const revalidate = 300;
export const runtime = 'nodejs';
export const maxDuration = 5;

const CACHE_TTL_SECONDS = 300;

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, must-revalidate',
  'CDN-Cache-Control': 'public, s-maxage=300, must-revalidate',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=300, must-revalidate',
} as const;

export async function GET() {
  const startedAt = Date.now();
  const cacheKey = CacheService.getCacheKey('yahoo', 'chart', 'IFIX.SA');

  try {
    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () => {
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/IFIX.SA';

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; MembrosFatosDaBolsaBot/1.0)',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Yahoo IFIX HTTP ${response.status}: ${errorText}`);
        }

        return response.json();
      },
      { ttlSeconds: CACHE_TTL_SECONDS }
    );

    logApiMetric({
      route: '/api/market/yahoo/ifix',
      cacheHit: metadata.cached,
      cacheBackend: metadata.backend,
      durationMs: Date.now() - startedAt,
      status: 200,
    });

    return NextResponse.json(data, { status: 200, headers: CACHE_HEADERS });
  } catch (error) {
    console.error('❌ Yahoo IFIX API Error:', error);

    logApiMetric({
      route: '/api/market/yahoo/ifix',
      cacheHit: false,
      cacheBackend: CacheService.getBackend(),
      durationMs: Date.now() - startedAt,
      status: 500,
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
