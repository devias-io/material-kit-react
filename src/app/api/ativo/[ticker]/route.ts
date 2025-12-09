// app/api/ativo/[ticker]/completo/route.ts
import { CacheService } from '@/lib/redis';

export const config = {
  maxDuration: 5,
};

export async function GET(
  request: Request,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase();
  const cacheKey = CacheService.getCacheKey(ticker);
  
  // Headers de cache para CDN
  const headers = new Headers();
  headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  
  try {
    // 1. Tentar cache Redis primeiro
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return Response.json({
        success: true,
        data: cached,
        cached: true,
        source: 'redis'
      }, { headers });
    }
    
    // 2. Buscar dados de todas as fontes em paralelo
    const [hgBrasilRes, yahooRes, brapiRes] = await Promise.allSettled([
      fetchHGBrasilData(ticker),
      fetchYahooData(ticker),
      fetchBRAPIData(ticker)
    ]);
    
    // 3. Consolidar dados com fallbacks inteligentes
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
    
    // 4. Salvar no cache (TTL baseado na qualidade)
    const ttl = dadosConsolidados.qualidadeData.level === 'high' ? 300 : 180;
    await CacheService.set(cacheKey, dadosConsolidados, ttl);
    
    return Response.json({
      success: true,
      data: dadosConsolidados,
      cached: false,
      source: 'api'
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