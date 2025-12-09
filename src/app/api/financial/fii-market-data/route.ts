// app/api/financial/fii-market-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildCacheHeaders } from '@/server/cache-headers';
import { CacheService } from '@/lib/cache-service';

export const config = {
  maxDuration: 5,
};

// 🔥 TIPOS PARA DADOS DE MERCADO DOS FIIs
interface FIIMarketData {
  ifix: {
    value: string;
    trend: 'up' | 'down';
    diff: number;
  };
  carteiraHoje: {
    value: string;
    trend: 'up' | 'down';
    diff: number;
  };
  dividendYield: {
    value: string;
    trend: 'up' | 'down';
    diff: number;
  };
  carteiraPeriodo: {
    value: string;
    trend: 'up' | 'down';
    diff: number;
  };
}

const CACHE_HEADERS = buildCacheHeaders({ ttl: 300, swr: 1200 });
const CACHE_DURATION = 300000;
let cachedData: { data: FIIMarketData; timestamp: number } | null = null;

// 🔑 TOKEN BRAPI VALIDADO
const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';

// 📊 FUNÇÃO PARA BUSCAR IFIX EM TEMPO REAL
async function fetchIFIXRealTime(): Promise<{ value: string; trend: 'up' | 'down'; diff: number }> {
  try {
    console.log('🔍 Buscando IFIX via BRAPI...');
    
    const response = await fetch(`https://brapi.dev/api/quote/IFIX?token=${BRAPI_TOKEN}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FII-Market-Data-API'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const ifixData = data.results[0];
        
        return {
          value: Math.round(ifixData.regularMarketPrice).toLocaleString('pt-BR'),
          trend: (ifixData.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down',
          diff: ifixData.regularMarketChangePercent || 0
        };
      }
    }
    
    throw new Error('Falha ao obter dados do IFIX');
  } catch (error) {
    console.error('❌ Erro ao buscar IFIX:', error);
    
    // 🔄 FALLBACK
    return {
      value: "3.200",
      trend: "up",
      diff: 0.25
    };
  }
}

// 📈 FUNÇÃO PARA SIMULAR DADOS DE CARTEIRA (pode ser substituída por dados reais)
function generatePortfolioData(): {
  carteiraHoje: { value: string; trend: 'up' | 'down'; diff: number };
  dividendYield: { value: string; trend: 'up' | 'down'; diff: number };
  carteiraPeriodo: { value: string; trend: 'up' | 'down'; diff: number };
} {
  // 🎯 EM PRODUÇÃO, AQUI VIRIAM OS CÁLCULOS REAIS DA CARTEIRA
  // baseados nos FIIs do usuário e suas cotações atuais
  
  const now = new Date();
  const hour = now.getHours();
  
  // 📊 Variação baseada no horário para simular movimento do mercado
  const baseVariation = Math.sin((hour * Math.PI) / 12) * 2;
  
  const carteiraHoje = {
    value: "12.4%",
    trend: baseVariation >= 0 ? "up" as const : "down" as const,
    diff: 12.4 + baseVariation
  };

  const dividendYield = {
    value: "11.8%",
    trend: "up" as const,
    diff: 11.8
  };

  const carteiraPeriodo = {
    value: "15.2%",
    trend: "up" as const,
    diff: 15.2 + (baseVariation * 0.5)
  };

  return {
    carteiraHoje,
    dividendYield,
    carteiraPeriodo
  };
}

// 🚀 FUNÇÃO PRINCIPAL PARA BUSCAR TODOS OS DADOS
async function fetchFIIMarketData(): Promise<FIIMarketData> {
  try {
    console.log('🔄 Iniciando busca de dados de mercado FIIs...');

    // 📊 BUSCAR DADOS EM PARALELO
    const [ifixData, portfolioData] = await Promise.all([
      fetchIFIXRealTime(),
      Promise.resolve(generatePortfolioData())
    ]);

    const marketData: FIIMarketData = {
      ifix: ifixData,
      ...portfolioData
    };

    console.log('✅ Dados de mercado FIIs coletados:', marketData);
    return marketData;

  } catch (error) {
    console.error('❌ Erro ao buscar dados de mercado FIIs:', error);
    
    // 🔄 FALLBACK COMPLETO
    return {
      ifix: { value: "3.200", trend: "up", diff: 0.25 },
      carteiraHoje: { value: "12.4%", trend: "up", diff: 12.4 },
      dividendYield: { value: "11.8%", trend: "up", diff: 11.8 },
      carteiraPeriodo: { value: "15.2%", trend: "up", diff: 15.2 }
    };
  }
}

// 🌐 HANDLER DA API
export async function GET(request: NextRequest) {
  try {
    console.log('🌐 API FII Market Data chamada');
    const cacheKey = CacheService.getCacheKey('market', 'fii', 'all');

    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () => {
        const marketData = await fetchFIIMarketData();
        const now = Date.now();

        return {
          success: true,
          marketData,
          timestamp: new Date(now).toISOString(),
          source: 'fresh',
          nextUpdate: new Date(now + 300000).toISOString()
        };
      },
      {
        ttlSeconds: 300,
        tags: ['market', 'fii'],
      }
    );

    cachedData = {
      data: data.marketData,
      timestamp: Date.now(),
    };

    return NextResponse.json(
      metadata.cached
        ? { ...data, source: 'cache' }
        : data,
      { headers: CACHE_HEADERS }
    );

  } catch (error) {
    console.error('❌ Erro na API FII Market Data:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      marketData: {
        ifix: { value: "3.200", trend: "up", diff: 0.25 },
        carteiraHoje: { value: "12.4%", trend: "up", diff: 12.4 },
        dividendYield: { value: "11.8%", trend: "up", diff: 11.8 },
        carteiraPeriodo: { value: "15.2%", trend: "up", diff: 15.2 }
      }
    }, { status: 500 });
  }
}

// 🔄 MÉTODO POST PARA FORÇAR REFRESH DO CACHE
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Forçando refresh do cache FII Market Data...');
    
    // 🗑️ LIMPAR CACHE
    cachedData = null;
    
    // 📊 BUSCAR DADOS FRESCOS
    const marketData = await fetchFIIMarketData();
    
    // 💾 ATUALIZAR CACHE
    cachedData = {
      data: marketData,
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      message: 'Cache refreshed successfully',
      marketData,
      timestamp: new Date().toISOString(),
      source: 'force_refresh'
    });

  } catch (error) {
    console.error('❌ Erro ao forçar refresh:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao refresh',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// 📊 MÉTODO PARA OBTER STATUS DO CACHE
export async function HEAD(request: NextRequest) {
  const headers = new Headers();
  
  if (cachedData) {
    headers.set('X-Cache-Status', 'HIT');
    headers.set('X-Cache-Age', Math.floor((Date.now() - cachedData.timestamp) / 1000).toString());
    headers.set('X-Cache-Expires', Math.floor((CACHE_DURATION - (Date.now() - cachedData.timestamp)) / 1000).toString());
  } else {
    headers.set('X-Cache-Status', 'MISS');
  }
  
  headers.set('X-API-Version', '1.0');
  headers.set('X-Data-Source', 'BRAPI + Custom');
  
  return new NextResponse(null, { status: 200, headers });
}
