import { NextResponse } from 'next/server';

const FINNHUB_API_KEY = 'd4b42s9r01qrv4askhmgd4b42s9r01qrv4askhn0';

export async function GET(
  request: Request,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker;

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB_API_KEY}`,
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Finnhub API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const metrics = data.metric || {};

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error(`Error fetching Finnhub data for ${ticker}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
