// 📁 /src/app/api/proventos/[ticker]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/redis';
import { logApiMetric } from '@/lib/metrics';

export const maxDuration = 5;

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const startedAt = Date.now();

  try {
    const { ticker } = params;

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker inválido' },
        { status: 400 }
      );
    }

    const cacheKey = CacheService.getCacheKey('proventos', ticker.toUpperCase());

    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () =>
        prisma.provento.findMany({
          where: {
            ticker: ticker.toUpperCase()
          },
          orderBy: { dataObj: 'desc' }
        }),
      {
        ttlSeconds: 3600,
        tags: [`proventos:${ticker.toUpperCase()}`],
      }
    );

    logApiMetric({
      route: '/api/proventos/[ticker]',
      cacheHit: metadata.cached,
      cacheBackend: metadata.backend,
      durationMs: Date.now() - startedAt,
      status: 200,
      extra: { ticker: ticker.toUpperCase() },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error(`Erro ao buscar proventos:`, error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}