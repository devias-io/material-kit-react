import { NextResponse } from 'next/server';
import { getMarketSnapshot, type CombinedQuote } from '@/server/market-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

const CACHE_TTL_MS = 2 * 60 * 1000;

const FALLBACK_DATA = {
  ibovespa: { value: '136.431', trend: 'down' as const, diff: -0.26 },
  indiceSmall: { value: '2.237,86', trend: 'up' as const, diff: 1.56 },
  carteiraHoje: { value: '88.7%', trend: 'up' as const, diff: 88.7 },
  dividendYield: { value: '7.4%', trend: 'up' as const, diff: 7.4 },
};

type MarketMetric = {
  value: string;
  trend: 'up' | 'down';
  diff: number;
};

function formatNumber(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function buildMetric(quote: CombinedQuote | undefined, fallback: MarketMetric): MarketMetric {
  if (!quote || typeof quote.price !== 'number') {
    return fallback;
  }

  const diff = typeof quote.changePercent === 'number'
    ? Number(quote.changePercent.toFixed(2))
    : fallback.diff;
  const trend = diff >= 0 ? 'up' : 'down';

  const value = quote.price >= 1000
    ? formatNumber(quote.price, 0)
    : formatNumber(quote.price, 2);

  return {
    value,
    trend,
    diff,
  };
}

export async function GET() {
  const startedAt = Date.now();

  try {
    const snapshot = await getMarketSnapshot([
      { symbol: 'IBOV', key: 'IBOV' },
      { symbol: 'SMLL', key: 'SMLL' },
    ], {
      cacheTtlMs: CACHE_TTL_MS,
    });

    const ibovespa = buildMetric(snapshot.quotes.IBOV, FALLBACK_DATA.ibovespa);
    const indiceSmall = buildMetric(snapshot.quotes.SMLL, FALLBACK_DATA.indiceSmall);

    const responseBody = {
      success: true,
      data: {
        ibovespa,
        indiceSmall,
        carteiraHoje: FALLBACK_DATA.carteiraHoje,
        dividendYield: FALLBACK_DATA.dividendYield,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startedAt,
        cache: {
          fromCache: snapshot.fromCache,
          cachedAt: snapshot.cachedAt,
          cacheTtlMs: snapshot.cacheTtlMs,
          expiresAt: snapshot.cachedAt + snapshot.cacheTtlMs,
        },
        requested: snapshot.metadata.requested,
      },
    };

    return NextResponse.json(responseBody, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';

    return NextResponse.json({
      success: false,
      error: message,
      data: {
        ibovespa: FALLBACK_DATA.ibovespa,
        indiceSmall: FALLBACK_DATA.indiceSmall,
        carteiraHoje: FALLBACK_DATA.carteiraHoje,
        dividendYield: FALLBACK_DATA.dividendYield,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        fallback: true,
      },
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
