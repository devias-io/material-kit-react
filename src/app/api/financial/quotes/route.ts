import { NextRequest, NextResponse } from 'next/server';
import { BrapiService } from '@/lib/brapi-service';
import { buildCacheHeaders } from '@/server/cache-headers';
import { logApiMetric } from '@/lib/metrics';

// 🛡️ CONFIGURAÇÃO PARA VERCEL - EVITA ERRO DE STATIC GENERATION
export const dynamic = 'force-dynamic';
export const revalidate = 300;
export const fetchCache = 'default-cache';
export const runtime = 'nodejs';

export const maxDuration = 5;

const CACHE_HEADERS = buildCacheHeaders({ ttl: 300, swr: 600 });

export async function GET(request: NextRequest) {
  const startedAt = Date.now();

  try {
    // ✅ USAR request.nextUrl EM VEZ DE new URL(request.url)
    const { searchParams } = request.nextUrl;
    const symbols = searchParams.get('symbols');
    
    if (!symbols) {
      return NextResponse.json(
        { error: 'Parâmetro symbols é obrigatório' },
        { status: 400 }
      );
    }

    const symbolsArray = symbols.split(',').map(s => s.trim().toUpperCase());

    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key === 'symbols') return;
      if (value) {
        queryParams[key] = value;
      }
    });

    const { data, metadata } = await BrapiService.fetchQuotes(symbolsArray, {
      cacheTtlMs: 5 * 60 * 1000,
      queryParams,
    });

    logApiMetric({
      route: '/api/financial/quotes',
      cacheHit: metadata.cached,
      cacheBackend: metadata.backend,
      durationMs: Date.now() - startedAt,
      status: 200,
      extra: { symbolsCount: symbolsArray.length },
    });

    return NextResponse.json(
      {
        quotes: data,
        results: data,
        timestamp: new Date().toISOString(),
        symbols: symbolsArray,
        success: true
      },
      { 
        status: 200,
        headers: {
          ...CACHE_HEADERS,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
      }
    );
    
  } catch (error) {
    console.error('❌ Quotes API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        quotes: [],
        timestamp: new Date().toISOString(),
        success: false,
        details: errorMessage
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

// POST method para atualizar quotes se necessário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📊 POST Quotes API - Dados recebidos:', body);
    
    // Implementar lógica de POST se necessário
    // Por exemplo: cache refresh, webhook processing, etc.
    
    return NextResponse.json({
      success: true,
      message: 'Quotes atualizadas com sucesso',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ POST Quotes API Error:', error);
    
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
