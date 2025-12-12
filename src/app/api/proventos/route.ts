// 📁 /src/app/api/proventos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/redis';

type ProventoPayload = {
  ticker: string;
  valor: number;
  tipo: string;
  data: string;
  dataObj: string;
  dataCom?: string | null;
  dataPagamento?: string | null;
  dataFormatada: string;
  valorFormatado: string;
  dividendYield?: number | null;
  fonte?: string | null;
};

type UploadJobState = {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total: number;
  inserted: number;
  failed: number;
  startedAt: number;
  finishedAt?: number;
  error?: string;
};

type StatsJobState = {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalTickers: number;
  processed: number;
  failed: number;
  startedAt: number;
  finishedAt?: number;
  error?: string;
};

type DeleteJobState = {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total: number;
  deleted: number;
  startedAt: number;
  finishedAt?: number;
  error?: string;
};

const PROVENTOS_CACHE_TAG = 'proventos:list';
const PROVENTOS_STATS_CACHE_TAG = 'proventos:stats';
const UPLOAD_JOB_TTL_SECONDS = 60 * 60; // 1 hour
const STATS_JOB_TTL_SECONDS = 60 * 60; // 1 hour
const DELETE_JOB_TTL_SECONDS = 60 * 60; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1),
      200
    );
    const ticker = searchParams.get('ticker') || undefined;
    const tipo = searchParams.get('tipo') || undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const orderDirection = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const where = {
      ...(ticker ? { ticker } : {}),
      ...(tipo ? { tipo } : {}),
      ...(startDate || endDate
        ? {
            dataObj: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const cacheKey = CacheService.getCacheKey(
      'proventos',
      'list',
      page,
      pageSize,
      ticker,
      tipo,
      startDate,
      endDate,
      orderDirection
    );

    const { data } = await CacheService.withCache(
      cacheKey,
      async () => {
        const [items, total] = await Promise.all([
          prisma.provento.findMany({
            where,
            orderBy: { dataObj: orderDirection },
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
              id: true,
              ticker: true,
              valor: true,
              tipo: true,
              data: true,
              dataObj: true,
              dataCom: true,
              dataPagamento: true,
              dataFormatada: true,
              valorFormatado: true,
              dividendYield: true,
              fonte: true,
            },
          }),
          prisma.provento.count({ where }),
        ]);

        return {
          items,
          total,
        };
      },
      {
        ttlSeconds: 120,
        tags: [PROVENTOS_CACHE_TAG],
        logLabel: 'proventos:list',
      }
    );

    return NextResponse.json({
      data: data.items,
      pagination: {
        page,
        pageSize,
        total: data.total,
        totalPages: Math.ceil(data.total / pageSize),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar proventos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proventos } = body as { proventos: ProventoPayload[] };

    if (!Array.isArray(proventos)) {
      return NextResponse.json(
        { error: 'Proventos deve ser um array' },
        { status: 400 }
      );
    }

    console.log(`🚀 Iniciando upload de ${proventos.length} proventos`);

    const uploadJobId = `proventos-upload-${Date.now()}`;
    const uploadJob: UploadJobState = {
      id: uploadJobId,
      status: 'running',
      total: proventos.length,
      inserted: 0,
      failed: 0,
      startedAt: Date.now(),
    };
    await CacheService.set(uploadJobId, uploadJob, UPLOAD_JOB_TTL_SECONDS);

    const BATCH_SIZE = 200;
    const MAX_CONCURRENCY = 3;
    const batches: ProventoPayload[][] = [];
    for (let i = 0; i < proventos.length; i += BATCH_SIZE) {
      batches.push(proventos.slice(i, i + BATCH_SIZE));
    }

    for (let i = 0; i < batches.length; i += MAX_CONCURRENCY) {
      const batchSlice = batches.slice(i, i + MAX_CONCURRENCY);
      const results = await Promise.allSettled(
        batchSlice.map(async (batch) => {
          const resultado = await prisma.provento.createMany({
            data: batch.map((p) => ({
              ticker: p.ticker,
              valor: p.valor,
              tipo: p.tipo,
              data: p.data,
              dataObj: new Date(p.dataObj),
              dataCom: p.dataCom ?? null,
              dataPagamento: p.dataPagamento ?? null,
              dataFormatada: p.dataFormatada,
              valorFormatado: p.valorFormatado,
              dividendYield: p.dividendYield ?? null,
              fonte: p.fonte ?? 'csv_upload',
            })),
            skipDuplicates: true,
          });
          return { inserted: resultado.count, batchSize: batch.length };
        })
      );

      results.forEach((result, idx) => {
        const currentBatchSize = batchSlice[idx]?.length ?? 0;

        if (result.status === 'fulfilled') {
          uploadJob.inserted += result.value.inserted;
          uploadJob.failed += result.value.batchSize - result.value.inserted;
        } else {
          uploadJob.failed += currentBatchSize;
          console.error('❌ Erro ao processar lote:', result.reason);
        }
      });

      await CacheService.set(uploadJobId, uploadJob, UPLOAD_JOB_TTL_SECONDS);
    }

    uploadJob.status = 'completed';
    uploadJob.finishedAt = Date.now();
    await CacheService.set(uploadJobId, uploadJob, UPLOAD_JOB_TTL_SECONDS);

    await CacheService.invalidateTags([PROVENTOS_CACHE_TAG, PROVENTOS_STATS_CACHE_TAG]);

    const statsJob = await startEstatisticasJob();

    return NextResponse.json({
      message: 'Upload iniciado com sucesso',
      totalInseridos: uploadJob.inserted,
      totalErros: uploadJob.failed,
      uploadJobId,
      statsJobId: statsJob.id,
    });
  } catch (error) {
    console.error('Erro ao processar upload de proventos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const deleteJob = await startDeleteJob();
    return NextResponse.json({
      message: 'Job de limpeza iniciado',
      deleteJobId: deleteJob.id,
    });
  } catch (error) {
    console.error('Erro ao deletar proventos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function mergeJobState<T extends { id: string }>(
  jobId: string,
  ttlSeconds: number,
  partial: Partial<T> | ((state: T) => Partial<T>)
) {
  const existing = await CacheService.get<T>(jobId);
  if (!existing) return;

  const next = {
    ...existing,
    ...(typeof partial === 'function' ? partial(existing) : partial),
  } as T;

  await CacheService.set(jobId, next, ttlSeconds);
}

async function startEstatisticasJob(): Promise<StatsJobState> {
  const jobId = `proventos-stats-${Date.now()}`;
  const jobState: StatsJobState = {
    id: jobId,
    status: 'pending',
    totalTickers: 0,
    processed: 0,
    failed: 0,
    startedAt: Date.now(),
  };

  await CacheService.set(jobId, jobState, STATS_JOB_TTL_SECONDS);

  setImmediate(() => {
    rebuildEstatisticas(jobId).catch((error) => {
      console.error('❌ Erro ao processar estatísticas:', error);
    });
  });

  return jobState;
}

async function rebuildEstatisticas(jobId: string) {
  try {
    await mergeJobState<StatsJobState>(jobId, STATS_JOB_TTL_SECONDS, { status: 'running' });

    const tickers = await prisma.provento.findMany({
      select: { ticker: true },
      distinct: ['ticker'],
    });

    await mergeJobState<StatsJobState>(jobId, STATS_JOB_TTL_SECONDS, { totalTickers: tickers.length });

    const TICKER_BATCH_SIZE = 10;
    for (let i = 0; i < tickers.length; i += TICKER_BATCH_SIZE) {
      const tickerBatch = tickers.slice(i, i + TICKER_BATCH_SIZE);

      const results = await Promise.allSettled(
        tickerBatch.map(async ({ ticker }) => {
          const stats = await prisma.provento.aggregate({
            where: { ticker },
            _count: { id: true },
            _sum: { valor: true },
            _avg: { valor: true },
            _min: { dataObj: true },
            _max: { dataObj: true },
          });

          await prisma.proventoEstatistica.upsert({
            where: { ticker },
            create: {
              ticker,
              totalProventos: stats._count.id,
              valorTotal: stats._sum.valor || 0,
              valorMedio: stats._avg.valor || 0,
              primeiroProvento: stats._min.dataObj,
              ultimoProvento: stats._max.dataObj,
            },
            update: {
              totalProventos: stats._count.id,
              valorTotal: stats._sum.valor || 0,
              valorMedio: stats._avg.valor || 0,
              primeiroProvento: stats._min.dataObj,
              ultimoProvento: stats._max.dataObj,
              ultimaAtualizacao: new Date(),
            },
          });
        })
      );

      const processedSuccess = results.filter((result) => result.status === 'fulfilled').length;
      const processedFailed = results.length - processedSuccess;

      await mergeJobState<StatsJobState>(jobId, STATS_JOB_TTL_SECONDS, (state) => ({
        processed: state.processed + processedSuccess,
        failed: state.failed + processedFailed,
      }));
    }

    await CacheService.invalidateTags([PROVENTOS_STATS_CACHE_TAG, PROVENTOS_CACHE_TAG]);

    await mergeJobState<StatsJobState>(jobId, STATS_JOB_TTL_SECONDS, {
      status: 'completed',
      finishedAt: Date.now(),
    });
  } catch (error) {
    await mergeJobState<StatsJobState>(jobId, STATS_JOB_TTL_SECONDS, {
      status: 'failed',
      error: (error as Error).message,
      finishedAt: Date.now(),
    });
    throw error;
  }
}

async function startDeleteJob(): Promise<DeleteJobState> {
  const jobId = `proventos-delete-${Date.now()}`;
  const jobState: DeleteJobState = {
    id: jobId,
    status: 'pending',
    total: 0,
    deleted: 0,
    startedAt: Date.now(),
  };

  await CacheService.set(jobId, jobState, DELETE_JOB_TTL_SECONDS);

  setImmediate(() => {
    processDeleteJob(jobId).catch((error) => {
      console.error('❌ Erro no job de limpeza:', error);
    });
  });

  return jobState;
}

async function processDeleteJob(jobId: string) {
  try {
    await mergeJobState<DeleteJobState>(jobId, DELETE_JOB_TTL_SECONDS, { status: 'running' });

    const BATCH_SIZE = 1000;
    let totalRemovidos = 0;

    while (true) {
      const idsBatch = await prisma.provento.findMany({
        select: { id: true },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
      });

      if (idsBatch.length === 0) {
        break;
      }

      const ids = idsBatch.map((item) => item.id);
      const resultado = await prisma.provento.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      totalRemovidos += resultado.count;

      await mergeJobState<DeleteJobState>(jobId, DELETE_JOB_TTL_SECONDS, {
        total: totalRemovidos,
        deleted: totalRemovidos,
      });

      if (idsBatch.length < BATCH_SIZE) {
        break;
      }
    }

    await prisma.proventoEstatistica.deleteMany({});

    await CacheService.invalidateTags([PROVENTOS_CACHE_TAG, PROVENTOS_STATS_CACHE_TAG]);

    await mergeJobState<DeleteJobState>(jobId, DELETE_JOB_TTL_SECONDS, {
      status: 'completed',
      finishedAt: Date.now(),
    });
  } catch (error) {
    await mergeJobState<DeleteJobState>(jobId, DELETE_JOB_TTL_SECONDS, {
      status: 'failed',
      error: (error as Error).message,
      finishedAt: Date.now(),
    });
    throw error;
  }
}
