import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/cache-service';
import { prisma } from '@/lib/prisma';
import { BrapiService } from '@/lib/brapi-service';
import { buildCacheHeaders } from '@/server/cache-headers';
import { calcularDyAPartirDoResultado, formatarDy } from '@/utils/dividendYield';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10;

const CACHE_TTL_SECONDS = 300;
const CACHE_HEADERS = buildCacheHeaders({ ttl: CACHE_TTL_SECONDS, swr: CACHE_TTL_SECONDS * 2 });

function parseTickers(searchParams: URLSearchParams): string[] {
  const tickersParam = searchParams.get('tickers') ?? '';
  return tickersParam
    .split(',')
    .map(ticker => ticker.trim().toUpperCase())
    .filter(Boolean);
}

function normalizeTickers(tickers: string[]): string[] {
  return Array.from(new Set(tickers)).sort();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTickers = parseTickers(searchParams);

    if (rawTickers.length === 0) {
      return NextResponse.json(
        { error: 'Parâmetro "tickers" é obrigatório.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const tickers = normalizeTickers(rawTickers);
    const cacheKey = CacheService.getCacheKey('market', 'quotes-dy', tickers.join(','));

    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () => {
        // Tratamento de erro da BRAPI mais granular
        let quotes: any[] = [];
        let brapiError: string | null = null;

        try {
          const result = await BrapiService.fetchQuotes(tickers, {
            cacheTtlMs: CACHE_TTL_SECONDS * 1000,
            queryParams: {
              dividends: 'true',
              fundamental: 'true',
            },
          });
          quotes = result.data;
        } catch (error) {
          brapiError = error instanceof Error ? error.message : 'Erro ao buscar cotações';
          console.error('❌ Erro BRAPI:', brapiError);
        }

        const dyMap = new Map<string, string>();

        quotes.forEach((quote: any) => {
          const symbol = typeof quote?.symbol === 'string' ? quote.symbol.toUpperCase() : null;
          if (!symbol) return;

          const { valor } = calcularDyAPartirDoResultado(quote, symbol);
          if (valor && valor > 0) {
            dyMap.set(symbol, formatarDy(valor));
          }
        });

        // ✅ BUSCAR PROVENTOS PARA TODOS OS TICKERS (sem limite de data)
        type Provento = {
          valor: number;
          data: Date;
          tipo: string;
        };
        
        const proventosPorTicker = new Map<string, Provento[]>();

        try {
          console.log('💰 Buscando proventos históricos completos para:', tickers.length, 'tickers');
          
          const proventos = await prisma.provento.findMany({
            where: {
              ticker: { in: tickers }, // ✅ TODOS os tickers
              // ✅ REMOVIDO: limite de 12 meses - frontend fará o filtro pela data de entrada
            },
            select: {
              ticker: true,
              valor: true,
              dataObj: true,
              tipo: true,
            },
            orderBy: {
              dataObj: 'desc',
            },
          });

          console.log('💰 Total de proventos encontrados no DB:', proventos.length);

          // Agrupar proventos por ticker (com dados completos)
          proventos.forEach(provento => {
            const ticker = provento.ticker.toUpperCase();
            const atual = proventosPorTicker.get(ticker) ?? [];
            proventosPorTicker.set(ticker, [
              ...atual,
              {
                valor: provento.valor ?? 0,
                data: provento.dataObj,
                tipo: provento.tipo ?? 'DIVIDENDO',
              }
            ]);
          });

          console.log('💰 Tickers com proventos:', proventosPorTicker.size);
          
          // Log de amostra (primeiros 2 tickers)
          const amostra = Array.from(proventosPorTicker.entries()).slice(0, 2);
          amostra.forEach(([ticker, provs]) => {
            console.log(`💰 ${ticker}: ${provs.length} proventos, total: R$ ${provs.reduce((sum, p) => sum + p.valor, 0).toFixed(2)}`);
          });
        } catch (dbError) {
          console.error('❌ Erro ao buscar proventos no DB:', dbError);
        }

        // ✅ CALCULAR DY usando proventos dos últimos 12 meses
        const limite12Meses = new Date();
        limite12Meses.setFullYear(limite12Meses.getFullYear() - 1);

        const faltantes = brapiError 
          ? tickers 
          : tickers.filter(ticker => !dyMap.has(ticker));

        if (faltantes.length > 0) {
          console.log('📊 Calculando DY para faltantes:', faltantes.length);

          const quotePorTicker = new Map<string, any>();
          quotes.forEach((quote: any) => {
            const symbol = typeof quote?.symbol === 'string' ? quote.symbol.toUpperCase() : null;
            if (symbol) {
              quotePorTicker.set(symbol, quote);
            }
          });

          faltantes.forEach(ticker => {
            const todosProventos = proventosPorTicker.get(ticker) ?? [];
            
            // ✅ Para cálculo de DY, usar apenas últimos 12 meses
            const proventosRecentes = todosProventos.filter(p => 
              p.data >= limite12Meses
            );
            
            const totalProventos = proventosRecentes.reduce((sum, p) => sum + p.valor, 0);
            
            if (totalProventos <= 0) return;

            const quote = quotePorTicker.get(ticker);
            const precoAtual = quote?.regularMarketPrice ?? quote?.regularMarketPreviousClose ?? 0;
            if (!precoAtual || precoAtual <= 0) return;

            const dy = totalProventos / precoAtual;
            if (dy > 0) {
              dyMap.set(ticker, formatarDy(dy));
            }
          });
        }

        console.log('✅ Processamento completo:');
        console.log('  - Quotes:', quotes.length);
        console.log('  - DY calculados:', dyMap.size);
        console.log('  - Tickers com histórico de proventos:', proventosPorTicker.size);

        return {
          quotes,
          dy: Object.fromEntries(dyMap),
          proventos: Object.fromEntries(proventosPorTicker), // ✅ Retorna array com datas
          tickers,
          timestamp: new Date().toISOString(),
          warnings: brapiError ? [{ source: 'brapi', message: brapiError }] : undefined,
        };
      },
      {
        ttlSeconds: CACHE_TTL_SECONDS,
        tags: ['market', 'quotes-dy', ...tickers],
      }
    );

    return NextResponse.json(data, {
      status: 200,
      headers: {
        ...CACHE_HEADERS,
        'X-Cache-Hit': String(metadata.cached),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro crítico no endpoint quotes-dy:', error);
    
    return NextResponse.json(
      { 
        quotes: [],
        dy: {},
        proventos: {},
        tickers: [],
        timestamp: new Date().toISOString(),
        error: `Falha crítica ao buscar cotações: ${message}`,
      },
      { 
        status: 200,
        headers: { 'Cache-Control': 'no-store' } 
      }
    );
  }
}
