import { NextResponse } from 'next/server';
import { CacheService } from '@/lib/redis';

const FINNHUB_API_KEY = 'd4b42s9r01qrv4askhmgd4b42s9r01qrv4askhn0';
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, must-revalidate',
  'CDN-Cache-Control': 'public, s-maxage=3600, must-revalidate'
} as const;

export async function GET(
  request: Request,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker;

  try {
    const cacheKey = CacheService.getCacheKey('finnhub', 'metrics', ticker);
    const { data } = await CacheService.withCache(
      cacheKey,
      async () => {
        const response = await fetch(
          `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB_API_KEY}`,
          {
            headers: {
              Accept: 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Finnhub API error: ${response.status}`);
        }

        const payload = await response.json();
        const metrics = payload.metric || {};

        return {
          ticker,
          dividendYield:
            metrics.currentDividendYieldTTM ||
            metrics.dividendYieldIndicatedAnnual ||
            0,
          dividendPerShare:
            metrics.dividendPerShareTTM || metrics.dividendPerShareAnnual || 0,
          dividendGrowthRate5Y: metrics.dividendGrowthRate5Y || 0,
          payoutRatio: metrics.payoutRatioTTM || metrics.payoutRatioAnnual || 0,
          rawMetrics: metrics
        };
      },
      { ttlSeconds: 3600, tags: ['finnhub'] }
    );

    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error(`Error fetching Finnhub data for ${ticker}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
