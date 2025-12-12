// app/api/ativo/[ticker]/completo/route.ts
import { CacheService } from '@/lib/redis';

export const maxDuration = 5;

export async function GET(
  request: Request,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase();
  const cacheKey = CacheService.getCacheKey('ativo', ticker);
  
  // Headers de cache para CDN
  const headers = new Headers();
  headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  
  try {
    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () => {
        const [hgBrasilRes, yahooRes, brapiRes] = await Promise.allSettled([
          fetchHGBrasilData(ticker),
          fetchYahooData(ticker),
          fetchBRAPIData(ticker)
        ]);

        const dadosConsolidados = {
          ticker,
          timestamp: new Date().toISOString(),

          preco: {
            valor: extractPrice(brapiRes, yahooRes, hgBrasilRes),
            variacao: extractVariation(brapiRes, yahooRes, hgBrasilRes),
            fonte: getPriceSource(brapiRes, yahooRes, hgBrasilRes)
          },

          multiplos: {
            pl: extractPL(hgBrasilRes, brapiRes, yahooRes),
            pvp: extractPVP(hgBrasilRes, brapiRes, yahooRes),
            dividendYield: extractDY(brapiRes, hgBrasilRes, yahooRes),
            fontes: {
              pl: getPLSource(hgBrasilRes, brapiRes, yahooRes),
              pvp: getPVPSource(hgBrasilRes, brapiRes, yahooRes),
              dy: getDYSource(brapiRes, hgBrasilRes, yahooRes)
            }
          },

          qualidadeData: calculateDataQuality(hgBrasilRes, yahooRes, brapiRes)
        };

        return dadosConsolidados;
      },
      { ttlSeconds: 300, tags: [`ativo:${ticker}`] }
    );

    return Response.json({
      success: true,
      data,
      cached: metadata.cached,
      source: metadata.cached ? metadata.backend : 'api'
    }, { headers });

  } catch (error) {
    console.error(`Erro ao buscar dados de ${ticker}:`, error);
    
    return Response.json({
      success: false,
      error: 'Erro ao buscar dados do ativo',
      ticker
    }, { status: 500 });
  }
}