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

        // ✅ BUSCAR PROVENTOS PARA TODOS OS TICKERS (não só faltantes)
        const proventosPorTicker = new Map<string, number>();
        const limite12Meses = new Date();
        limite12Meses.setFullYear(limite12Meses.getFullYear() - 1);

        try {
          console.log('💰 Buscando proventos para todos os tickers:', tickers.length);
          
          const proventos = await prisma.provento.findMany({
            where: {
              ticker: { in: tickers }, // ✅ TODOS os tickers
              dataObj: { gte: limite12Meses },
            },
            select: {
              ticker: true,
              valor: true,
            },
          });

          console.log('💰 Proventos encontrados no DB:', proventos.length);

          // Somar proventos por ticker
          proventos.forEach(provento => {
            const ticker = provento.ticker.toUpperCase();
            const atual = proventosPorTicker.get(ticker) ?? 0;
            proventosPorTicker.set(ticker, atual + (provento.valor ?? 0));
          });

          console.log('💰 Total de tickers com proventos:', proventosPorTicker.size);
          console.log('💰 Amostra:', Object.fromEntries(Array.from(proventosPorTicker.entries()).slice(0, 5)));
        } catch (dbError) {
          console.error('❌ Erro ao buscar proventos no DB:', dbError);
        }

        // ✅ CALCULAR DY DOS FALTANTES usando proventos do DB
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
            const proventos = proventosPorTicker.get(ticker) ?? 0;
            if (proventos <= 0) return;

            const quote = quotePorTicker.get(ticker);
            const precoAtual = quote?.regularMarketPrice ?? quote?.regularMarketPreviousClose ?? 0;
            if (!precoAtual || precoAtual <= 0) return;

            const dy = proventos / precoAtual;
            if (dy > 0) {
              dyMap.set(ticker, formatarDy(dy));
            }
          });
        }

        console.log('✅ Processamento completo:');
        console.log('  - Quotes:', quotes.length);
        console.log('  - DY:', dyMap.size);
        console.log('  - Proventos:', proventosPorTicker.size);

        return {
          quotes,
          dy: Object.fromEntries(dyMap),
          proventos: Object.fromEntries(proventosPorTicker), // ✅ Agora retorna todos
          tickers,
          timestamp: new Date().toISOString(),
          warnings: brapiError ? [{ source: 'brapi', message: brapiError }] : undefined,
        };
      },
