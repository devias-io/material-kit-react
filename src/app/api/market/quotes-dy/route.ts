import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/cache-service';
import { prisma } from '@/lib/prisma';
import { BrapiService } from '@/lib/brapi-service';
import { buildCacheHeaders } from '@/server/cache-headers';
import { calcularDyAPartirDoResultado, formatarDy } from '@/utils/dividendYield';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10; // ✅ MUDANÇA 1: Aumentado de 5 para 10

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
        // ✅ MUDANÇA 2: Tratamento de erro da BRAPI mais granular
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
          // ✅ Continua processamento mesmo com erro (tenta buscar do DB)
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

        // ✅ MUDANÇA 3: Tenta buscar DY do DB para TODOS os tickers se BRAPI falhou
        const faltantes = brapiError 
          ? tickers // Se BRAPI falhou, tenta todos no DB
          : tickers.filter(ticker => !dyMap.has(ticker)); // Se BRAPI ok, só os que faltam

        const proventosPorTicker = new Map<string, number>();

        if (faltantes.length > 0) {
          const limite12Meses = new Date();
          limite12Meses.setFullYear(limite12Meses.getFullYear() - 1);

          try {
            const proventos = await prisma.provento.findMany({
              where: {
                ticker: { in: faltantes },
                dataObj: { gte: limite12Meses },
              },
              select: {
                ticker: true,
                valor: true,
              },
            });

            const somaPorTicker = new Map<string, number>();
            proventos.forEach(provento => {
              const ticker = provento.ticker.toUpperCase();
              const atual = somaPorTicker.get(ticker) ?? 0;
              somaPorTicker.set(ticker, atual + (provento.valor ?? 0));
            });

            proventos.forEach(provento => {
              const ticker = provento.ticker.toUpperCase();
              const atual = proventosPorTicker.get(ticker) ?? 0;
              proventosPorTicker.set(ticker, atual + (provento.valor ?? 0));
            });

            const quotePorTicker = new Map<string, any>();
            quotes.forEach((quote: any) => {
              const symbol = typeof quote?.symbol === 'string' ? quote.symbol.toUpperCase() : null;
              if (symbol) {
                quotePorTicker.set(symbol, quote);
              }
            });

            faltantes.forEach(ticker => {
              const soma = somaPorTicker.get(ticker) ?? 0;
              if (soma <= 0) return;

              const quote = quotePorTicker.get(ticker);
              const precoAtual = quote?.regularMarketPrice ?? quote?.regularMarketPreviousClose ?? 0;
              if (!precoAtual || precoAtual <= 0) return;

              const dy = soma / precoAtual;
              if (dy > 0) {
                dyMap.set(ticker, formatarDy(dy));
              }
            });
          } catch (dbError) {
            console.error('❌ Erro ao buscar proventos no DB:', dbError);
            // ✅ Continua mesmo se DB falhar
          }
        }

        // ✅ MUDANÇA 4: Retorna warnings se houver erros parciais
        return {
          quotes,
          dy: Object.fromEntries(dyMap),
          proventos: Object.fromEntries(proventosPorTicker),
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
    // ✅ MUDANÇA 5: Erro crítico retorna dados parciais quando possível
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro crítico no endpoint quotes-dy:', error);
    
    return NextResponse.json(
      { 
        quotes: [],
        dy: {},
        tickers: [],
        timestamp: new Date().toISOString(),
        error: `Falha crítica ao buscar cotações: ${message}`,
      },
      { 
        status: 200, // ✅ Status 200 para não quebrar UI
        headers: { 'Cache-Control': 'no-store' } 
      }
    );
  }
}
