import { NextResponse } from 'next/server';
import { CacheService } from '@/lib/redis';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, must-revalidate',
  'CDN-Cache-Control': 'public, s-maxage=3600, must-revalidate'
} as const;

export async function GET() {
  try {
    const cacheKey = CacheService.getCacheKey('exchange-rate', 'usd-brl');
    const { data } = await CacheService.withCache(
      cacheKey,
      async () => {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
          headers: {
            Accept: 'application/json'
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`Exchange rate API error: ${response.status}`);
        }

        const payload = await response.json();
        const usdToBrl = payload?.rates?.BRL;

        if (typeof usdToBrl !== 'number') {
          throw new Error('Taxa BRL não encontrada');
        }

        return {
          usdToBrl
        };
      },
      { ttlSeconds: 3600, tags: ['exchange-rate'] }
    );

    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Erro ao buscar USD/BRL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
