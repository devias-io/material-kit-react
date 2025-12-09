import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/cache-service';

// 🛡️ CONFIGURAÇÃO PARA VERCEL - EVITA ERRO DE STATIC GENERATION
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';
export const maxDuration = 5;

// 🔑 SUA CHAVE DA API BRAPI
const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';

// 🔧 FUNÇÕES AUXILIARES
function getTrendDirection(change: number): 'up' | 'down' {
  return change >= 0 ? 'up' : 'down';
}

function formatValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number): string {
  const formatted = Math.abs(value).toFixed(2);
  return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
}

// 🌎 FUNÇÃO PARA BUSCAR DADOS REAIS DA BRAPI
async function fetchBrapiData() {
  try {
    console.log('🔄 Buscando dados da Brapi...');
    
    // Buscar índices americanos via Brapi
    const symbols = [
      '^GSPC',  // S&P 500
      '^IXIC',  // NASDAQ
      '^DJI',   // Dow Jones
      '^BVSP'   // Ibovespa (bonus)
    ].join(',');
    
    const response = await fetch(
      `https://brapi.dev/api/quote/${symbols}?token=${BRAPI_TOKEN}&fundamental=false`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; InvestmentApp/1.0)'
        },
        next: { revalidate: 300 } // Cache por 5 minutos
      }
    );
    
    if (!response.ok) {
      throw new Error(`Brapi HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Dados recebidos da Brapi:', data.results?.length, 'símbolos');
    
    if (!data.results || data.results.length === 0) {
      throw new Error('Nenhum dado retornado pela Brapi');
    }
    
    // Mapear dados dos índices
    const indices: any = {};
    
    data.results.forEach((stock: any) => {
      const changePercent = stock.regularMarketChangePercent || 0;
      const currentPrice = stock.regularMarketPrice || 0;
      
      console.log(`📊 ${stock.symbol}: ${currentPrice} (${changePercent.toFixed(2)}%)`);
      
      switch (stock.symbol) {
        case '^GSPC': // S&P 500
          indices.sp500 = {
            value: formatValue(currentPrice),
            trend: getTrendDirection(changePercent),
            diff: Number(changePercent.toFixed(2)),
            price: currentPrice,
            change: stock.regularMarketChange || 0
          };
          break;
          
        case '^IXIC': // NASDAQ
          indices.nasdaq = {
            value: formatValue(currentPrice),
            trend: getTrendDirection(changePercent),
            diff: Number(changePercent.toFixed(2)),
            price: currentPrice,
            change: stock.regularMarketChange || 0
          };
          break;
          
        case '^DJI': // Dow Jones
          indices.dow = {
            value: formatValue(currentPrice),
            trend: getTrendDirection(changePercent),
            diff: Number(changePercent.toFixed(2)),
            price: currentPrice,
            change: stock.regularMarketChange || 0
          };
          break;
          
        case '^BVSP': // Ibovespa
          indices.ibovespa = {
            value: formatValue(currentPrice),
            trend: getTrendDirection(changePercent),
            diff: Number(changePercent.toFixed(2)),
            price: currentPrice,
            change: stock.regularMarketChange || 0
          };
          break;
      }
    });
    
    return indices;
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados da Brapi:', error);
    return null;
  }
}

// 🔍 FUNÇÃO AUXILIAR PARA VERIFICAR SE MERCADO ESTÁ ABERTO
function isMarketOpen(): boolean {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const day = nyTime.getDay(); // 0 = domingo, 6 = sábado
  const hour = nyTime.getHours();
  const minute = nyTime.getMinutes();
  const totalMinutes = hour * 60 + minute;
  
  // Mercado aberto de segunda a sexta, 9:30 às 16:00 (hora de NY)
  const isWeekday = day >= 1 && day <= 5;
  const isMarketHours = totalMinutes >= (9 * 60 + 30) && totalMinutes <= (16 * 60);
  
  return isWeekday && isMarketHours;
}

// 🚀 HANDLER PRINCIPAL DA API
export async function GET(request: NextRequest) {
  try {
    const cacheKey = 'market:international:all';

    const data = await CacheService.withCache({
      key: cacheKey,
      ttlSeconds: 300,
      tags: ['market', 'international'],
      fn: async () => {
        const startTime = Date.now();

        console.log('🌎 International Data API - Iniciando com Brapi...');

        // Buscar dados reais da Brapi
        const brapiData = await fetchBrapiData();

        // Dados de fallback caso a Brapi falhe
        const fallbackData = {
          sp500: { value: "5.845", trend: "up" as const, diff: 25.13 },
          nasdaq: { value: "19.345", trend: "down" as const, diff: -1.00 },
          dow: { value: "42.156", trend: "up" as const, diff: 0.44 }
        };

        // Usar dados da Brapi se disponíveis, senão fallback
        const indices = brapiData || fallbackData;

        // 📊 DADOS ESPECÍFICOS PARA EXTERIOR STOCKS (4 INDICADORES)
        const internationalData = {
          // Dados dos índices (vindos da Brapi ou fallback)
          sp500: indices.sp500,
          nasdaq: indices.nasdaq,
          dow: indices.dow,

          // 🎯 DADOS ESPECÍFICOS PARA EXTERIOR STOCKS (4 CARDS)
          carteira: {
            value: "+62,66%",
            trend: "up" as const,
            diff: 62.66,
            timestamp: new Date().toISOString()
          },

          sp500Periodo: {
            value: "+36,93%",
            trend: "up" as const,
            diff: 36.93,
            timestamp: new Date().toISOString()
          },

          sp500Hoje: {
            value: indices.sp500 ? formatPercent(indices.sp500.diff) : "-0,67%",
            trend: indices.sp500 ? indices.sp500.trend : "down" as const,
            diff: indices.sp500 ? indices.sp500.diff : -0.67,
            timestamp: new Date().toISOString()
          },

          nasdaqHoje: {
            value: indices.nasdaq ? formatPercent(indices.nasdaq.diff) : "-1,00%",
            trend: indices.nasdaq ? indices.nasdaq.trend : "down" as const,
            diff: indices.nasdaq ? indices.nasdaq.diff : -1.00,
            timestamp: new Date().toISOString()
          },

          // Dados extras se necessário
          marketStatus: {
            isOpen: isMarketOpen(),
            timezone: 'America/New_York',
            lastUpdate: new Date().toISOString(),
            source: brapiData ? 'brapi' : 'fallback'
          }
        };

        console.log('✅ Dados internacionais compilados via', brapiData ? 'Brapi' : 'fallback');

        const processingTime = Date.now() - startTime;

        return {
          success: true,
          internationalData: internationalData,
          metadata: {
            timestamp: new Date().toISOString(),
            processingTime,
            source: brapiData ? 'brapi' : 'fallback',
            lastUpdate: new Date().toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo'
            }),
            version: '3.0-brapi-integration',
            dataProvider: 'Brapi.dev'
          }
        };
      },
    });

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ International Data API Error:', errorMessage);
    
    // Retornar dados de fallback em caso de erro
    const fallbackData = {
      carteira: { value: "+62,66%", trend: "up" as const, diff: 62.66 },
      sp500Periodo: { value: "+36,93%", trend: "up" as const, diff: 36.93 },
      sp500Hoje: { value: "-0,67%", trend: "down" as const, diff: -0.67 },
      nasdaqHoje: { value: "-1,00%", trend: "down" as const, diff: -1.00 },
    };
    
    return NextResponse.json({
      success: false,
      internationalData: fallbackData,
      error: errorMessage,
      metadata: {
        timestamp: new Date().toISOString(),
        fallback: true,
        error: errorMessage,
        source: 'fallback'
      }
    }, { 
      status: 200, // Retornar 200 mesmo com erro para não quebrar o frontend
      headers: { 
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// POST method para refresh de dados se necessário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🌎 POST International Data API - Force refresh solicitado');
    
    // Forçar refresh dos dados
    const brapiData = await fetchBrapiData();
    
    return NextResponse.json({
      success: true,
      message: 'Dados atualizados via Brapi',
      timestamp: new Date().toISOString(),
      source: brapiData ? 'brapi' : 'fallback'
    });
    
  } catch (error) {
    console.error('❌ POST International Data API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    });
  }
}

// OPTIONS method para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
