import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { CacheService } from '@/lib/redis';
import { syncPayloadSchema } from '@/lib/validations/proventos-sync';
import { sincronizarProventos } from '@/workers/proventos-sync-worker';

const RATE_LIMIT_WINDOW_SECONDS = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (session.user.plan !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem sincronizar.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const config = syncPayloadSchema.parse(body);

    const syncConfig = {
      tickers: config.tickers,
      dataInicio: config.dataInicio ? new Date(config.dataInicio) : undefined,
      dataFim: config.dataFim ? new Date(config.dataFim) : undefined,
      forcarAtualizacao: config.forcarAtualizacao ?? false,
    };

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rateLimitKey = CacheService.getCacheKey('ratelimit', 'sync', ip);
    const existingSync = await CacheService.get<string>(rateLimitKey);

    if (existingSync) {
      return NextResponse.json(
        {
          error: 'Aguarde 5 minutos antes de iniciar nova sincronização',
          retryAfter: RATE_LIMIT_WINDOW_SECONDS,
        },
        { status: 429 }
      );
    }

    await CacheService.set(rateLimitKey, '1', RATE_LIMIT_WINDOW_SECONDS);

    console.log(`🔄 Sincronização iniciada por: ${session.user.email || session.user.name}`);
    console.log('📋 Config:', syncConfig);

    sincronizarProventos(syncConfig)
      .then((resultado) => {
        console.log('✅ Sincronização concluída:', resultado);
      })
      .catch((error) => {
        console.error('❌ Erro na sincronização:', error);
      });

    return NextResponse.json(
      {
        message: 'Sincronização iniciada com sucesso',
        status: 'EM_PROGRESSO',
        config: {
          tickers: syncConfig.tickers || 'Todos',
          dataInicio: syncConfig.dataInicio,
          dataFim: syncConfig.dataFim,
          forcarAtualizacao: syncConfig.forcarAtualizacao,
        },
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('❌ Erro ao processar requisição de sincronização:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao iniciar sincronização',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user.plan !== 'ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return NextResponse.json({
      service: 'Sincronização de Proventos BRAPI',
      status: 'online',
      endpoints: {
        sync: 'POST /api/proventos/sync',
        status: 'GET /api/proventos/sync/[syncId]',
        historico: 'GET /api/proventos/sync/historico',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao verificar status' }, { status: 500 });
  }
}
