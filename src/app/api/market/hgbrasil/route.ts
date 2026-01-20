import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/redis';
import { logApiMetric } from '@/lib/metrics';

export const dynamic = 'force-dynamic';
export const revalidate = 600;
export const runtime = 'nodejs';
export const maxDuration = 5;

const CACHE_TTL_SECONDS = 600;

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=600, must-revalidate',
  'CDN-Cache-Control': 'public, s-maxage=600, must-revalidate',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=600, must-revalidate',
} as const;

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get('symbol')?.trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: 'Parâmetro symbol é obrigatório' }, { status: 400 });
  }

  const apiKey =
    process.env.HGBRASIL_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_HGBRASIL_API_KEY?.trim() ||
    'a666e15c';

  const cacheKey = CacheService.getCacheKey('hgbrasil', 'stock_price', symbol);

  try {
    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () => {
        const url = new URL('https://api.hgbrasil.com/finance/stock_price');
        url.searchParams.set('key', apiKey);
        url.searchParams.set('symbol', symbol);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'MembrosFatosBolsa/1.0',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HG Brasil HTTP ${response.status}: ${errorText}`);
        }

        const payload = await response.json();
        const result = payload?.results?.[symbol] ?? null;

        return {
          result,
          raw: payload,
        };
      },
      { ttlSeconds: CACHE_TTL_SECONDS }
    );

    logApiMetric({
      route: '/api/market/hgbrasil',
      cacheHit: metadata.cached,
      cacheBackend: metadata.backend,
      durationMs: Date.now() - startedAt,
      status: 200,
      extra: { symbol },
    });

    return NextResponse.json(
      {
        success: true,
        symbol,
        result: data.result,
        cached: metadata.cached,
        backend: metadata.backend,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('❌ HG Brasil API Error:', error);

    logApiMetric({
      route: '/api/market/hgbrasil',
      cacheHit: false,
      cacheBackend: CacheService.getBackend(),
      durationMs: Date.now() - startedAt,
      status: 500,
      extra: { symbol },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        symbol,
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
