import { NextRequest, NextResponse } from 'next/server';
import { calcularDyAPartirDoResultado, formatarDy } from '@/utils/dividendYield';
import { getMarketSnapshot, type CombinedQuote, type MarketSnapshot } from '@/server/market-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

type DividendYieldResult = {
  dy12Meses: number;
  dyFormatado: string;
  fonte: string;
  symbol?: string;
  requested: string;
};

function normalizeTickerKey(symbol?: string): string {
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

function resolveQuote(snapshot: MarketSnapshot, ticker: string): CombinedQuote | undefined {
  const normalized = normalizeTickerKey(ticker);
  const candidates = new Set<string>([
    normalized,
    ticker.toUpperCase(),
    `${normalized}.SA`
  ]);

  for (const key of candidates) {
    const quote = snapshot.quotes[key];
    if (quote) {
      return quote;
    }
  }

  return undefined;
}

function buildDividendYieldResult(ticker: string, quote: CombinedQuote | undefined): DividendYieldResult {
  const normalized = normalizeTickerKey(ticker);

  if (quote?.brapi) {
    const { valor, origem } = calcularDyAPartirDoResultado(quote.brapi, normalized);
    const dy12Meses = valor && valor > 0 ? valor : 0;

    return {
      dy12Meses,
      dyFormatado: dy12Meses > 0 ? formatarDy(dy12Meses) : '0,00%',
      fonte: `market_fetcher | ${origem}`,
      symbol: typeof quote.brapi.symbol === 'string' ? String(quote.brapi.symbol).toUpperCase() : normalized,
      requested: normalized
    };
  }

  return {
    dy12Meses: 0,
    dyFormatado: '0,00%',
    fonte: 'market_fetcher | sem_dados',
    symbol: normalized,
    requested: normalized
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tickers = Array.isArray(body?.tickers) ? body.tickers : [];

    if (tickers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista de tickers vazia' },
        { status: 400 }
      );
    }

    const sanitizedTickers = tickers
      .map((ticker: string) => String(ticker || '').trim().toUpperCase())
      .filter((ticker) => ticker);

    const uniqueTickers = Array.from(new Set(sanitizedTickers));

    const snapshot = await getMarketSnapshot(uniqueTickers, { includeDividends: true });

    const results: Record<string, DividendYieldResult> = {};

    uniqueTickers.forEach((ticker) => {
      const normalized = normalizeTickerKey(ticker);
      const quote = resolveQuote(snapshot, ticker);
      results[normalized] = buildDividendYieldResult(ticker, quote);
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      metadata: {
        totalRequested: uniqueTickers.length,
        cache: {
          fromCache: snapshot.fromCache,
          cachedAt: snapshot.cachedAt,
          cacheTtlMs: snapshot.cacheTtlMs,
          expiresAt: snapshot.cachedAt + snapshot.cacheTtlMs
        },
        upstream: snapshot.metadata
      }
    });
  } catch (error) {
    console.error('❌ Erro na API de DY batch:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
        results: {}
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Utilize POST com { "tickers": ["ITUB4", "VALE3"] } para calcular DY em lote.',
    example: {
      method: 'POST',
      body: { tickers: ['ITUB4', 'VALE3'] },
    },
    timestamp: new Date().toISOString(),
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
