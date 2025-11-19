import { NextResponse } from 'next/server';
import { buildCacheHeaders } from '@/server/cache-headers';

type Holding = {
  symbol: string;
  name: string;
  weight: number;
  sector: string;
};

type SectorBreakdown = {
  sector: string;
  weight: number;
};

type ETFData = {
  name: string;
  description: string;
  totalHoldings: number;
  topHoldings: Holding[];
  sectorBreakdown: SectorBreakdown[];
};

const YAHOO_ENDPOINT = 'https://query2.finance.yahoo.com/v10/finance/quoteSummary/';
const YAHOO_MODULES = 'topHoldings%2CsummaryProfile%2CquoteType';

const ETF_CACHE_HEADERS = buildCacheHeaders({ ttl: 300, swr: 1800 });

async function fetchFromYahoo(ticker: string): Promise<ETFData | null> {
  try {
    const response = await fetch(
      `${YAHOO_ENDPOINT}${ticker}?modules=${YAHOO_MODULES}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MembrosFatosDaBolsaBot/1.0)',
          'Accept': 'application/json'
        },
        cache: 'force-cache',
        next: { revalidate: 300 }
      }
    );

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    const result = json?.quoteSummary?.result?.[0];

    const holdings = result?.topHoldings?.holdings;
    if (!Array.isArray(holdings) || holdings.length === 0) {
      return null;
    }

    const name: string = result?.quoteType?.longName || `${ticker} ETF`;
    const description: string =
      result?.summaryProfile?.longBusinessSummary ||
      result?.assetProfile?.longBusinessSummary ||
      '';

    const processedHoldings: Holding[] = holdings.slice(0, 10).map((holding: any) => ({
      symbol: holding?.symbol ?? '',
      name: holding?.holdingName ?? holding?.symbol ?? 'Unknown',
      weight: typeof holding?.holdingPercent === 'number'
        ? holding.holdingPercent * 100
        : Number(holding?.holdingPercent) * 100 || 0,
      sector: holding?.sector || holding?.holdingCategory || 'Unknown'
    }));

    return {
      name,
      description,
      totalHoldings: holdings.length,
      topHoldings: processedHoldings,
      sectorBreakdown: []
    };
  } catch (error) {
    console.error(`[ETF Holdings] Yahoo request failed for ${ticker}:`, error);
    return null;
  }
}

async function fetchFromFMP(ticker: string): Promise<ETFData | null> {
  const apiKey =
    process.env.FMP_API_KEY ||
    process.env.FINANCIAL_MODELING_PREP_KEY ||
    process.env.NEXT_PUBLIC_FMP_API_KEY ||
    'demo';

  const url = `https://financialmodelingprep.com/api/v3/etf-holder/${ticker}?apikey=${apiKey}`;

  try {
    const response = await fetch(url, {
      cache: 'force-cache',
      next: { revalidate: 300 }
    });
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const topHoldings: Holding[] = data.slice(0, 10).map((holding: any) => ({
      symbol: holding?.asset ?? '',
      name: holding?.assetName || holding?.asset || 'Unknown',
      weight: Number(holding?.weightPercentage) || 0,
      sector: holding?.sector || 'Unknown'
    }));

    const sectorWeights: Record<string, number> = {};
    data.forEach((holding: any) => {
      const sector = holding?.sector || 'Unknown';
      const weight = Number(holding?.weightPercentage) || 0;
      sectorWeights[sector] = (sectorWeights[sector] || 0) + weight;
    });

    const sectorBreakdown: SectorBreakdown[] = Object.entries(sectorWeights)
      .map(([sector, weight]) => ({ sector, weight }))
      .sort((a, b) => b.weight - a.weight);

    return {
      name: `${ticker} ETF`,
      description: `Exchange Traded Fund ${ticker}`,
      totalHoldings: data.length,
      topHoldings,
      sectorBreakdown
    };
  } catch (error) {
    console.error(`[ETF Holdings] FMP request failed for ${ticker}:`, error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json(
      {
        success: false,
        message: 'Ticker é obrigatório.'
      },
      { status: 400 }
    );
  }

  const normalizedTicker = ticker.trim().toUpperCase();

  try {
    const yahooData = await fetchFromYahoo(normalizedTicker);
    if (yahooData) {
      return NextResponse.json({
        success: true,
        source: 'yahoo',
        data: yahooData
      }, { headers: ETF_CACHE_HEADERS });
    }

    const fmpData = await fetchFromFMP(normalizedTicker);
    if (fmpData) {
      return NextResponse.json({
        success: true,
        source: 'fmp',
        data: fmpData
      }, { headers: ETF_CACHE_HEADERS });
    }

    return NextResponse.json(
      {
        success: false,
        source: null,
        data: null,
        message: `Holdings não encontrados para ${normalizedTicker}.`
      },
      { status: 404, headers: ETF_CACHE_HEADERS }
    );
  } catch (error) {
    console.error(`[ETF Holdings] Unexpected error for ${normalizedTicker}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao buscar holdings.'
      },
      { status: 500 }
    );
  }
}
