import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/redis';

const PROGRESS_KEY_PREFIX = 'sync:progress:';

export async function GET(
  _request: NextRequest,
  { params }: { params: { syncId: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (session.user.plan !== 'ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const syncId = Number(params.syncId);

    if (!Number.isInteger(syncId)) {
      return NextResponse.json({ error: 'ID de sincronização inválido' }, { status: 400 });
    }

    const progressCacheKey = `${PROGRESS_KEY_PREFIX}${syncId}`;
    const progressCache = await CacheService.get<{
      syncId: number;
      ticker: string;
      progresso: number;
      total: number;
      status: string;
      totalNovos?: number;
      totalAtualizados?: number;
    } | string>(progressCacheKey);

    if (progressCache) {
      try {
        const progress =
          typeof progressCache === 'string' ? JSON.parse(progressCache) : progressCache;

        const porcentagem = progress.total > 0
          ? Math.round((progress.progresso / progress.total) * 100)
          : 0;

        return NextResponse.json({
          id: syncId,
          status: 'EM_PROGRESSO',
          progresso: progress.progresso,
          total: progress.total,
          porcentagem,
          tickerAtual: progress.ticker,
          totalNovos: progress.totalNovos || 0,
          totalAtualizados: progress.totalAtualizados || 0,
          message: `Processando ${progress.progresso} de ${progress.total} tickers...`,
        });
      } catch (parseError) {
        console.error('Erro ao parsear cache de progresso:', parseError);
      }
    }

    const sync = await prisma.proventoSincronizacao.findUnique({
      where: { id: syncId },
    });

    if (!sync) {
      return NextResponse.json({ error: 'Sincronização não encontrada' }, { status: 404 });
    }

    const duracaoMs = sync.dataFim && sync.dataInicio
      ? sync.dataFim.getTime() - sync.dataInicio.getTime()
      : null;
    const duracaoSegundos = duracaoMs ? Math.round(duracaoMs / 1000) : null;

    const porcentagem = sync.status === 'CONCLUIDO'
      ? 100
      : sync.status === 'ERRO'
        ? sync.totalProcessados + sync.totalErros > 0
          ? Math.round((sync.totalProcessados / (sync.totalProcessados + sync.totalErros)) * 100)
          : 0
        : 0;

    return NextResponse.json({
      id: sync.id,
      ticker: sync.ticker || 'Todos',
      status: sync.status,
      porcentagem,
      dataInicio: sync.dataInicio,
      dataFim: sync.dataFim,
      duracao: duracaoSegundos ? `${duracaoSegundos}s` : null,
      metricas: {
        totalProcessados: sync.totalProcessados,
        totalNovos: sync.totalNovos,
        totalAtualizados: sync.totalAtualizados,
        totalErros: sync.totalErros,
      },
      erros: sync.erros,
      message:
        sync.status === 'CONCLUIDO'
          ? `Sincronização concluída: ${sync.totalNovos} novos, ${sync.totalAtualizados} atualizados`
          : sync.status === 'ERRO'
            ? 'Sincronização finalizada com erros'
            : 'Sincronização em andamento',
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar status de sincronização:', error);

    return NextResponse.json(
      {
        error: 'Erro ao buscar status',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { syncId: string } }
) {
  try {
    const session = await auth();

    if (!session || (session.user.plan !== 'ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const syncId = Number(params.syncId);

    if (!Number.isInteger(syncId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await CacheService.delete(`${PROGRESS_KEY_PREFIX}${syncId}`);

    await prisma.proventoSincronizacao.update({
      where: { id: syncId },
      data: {
        status: 'ERRO',
        dataFim: new Date(),
        erros: { cancelado: true, message: 'Cancelado pelo usuário' },
      },
    });

    return NextResponse.json({ message: 'Sincronização cancelada', syncId });
  } catch (error) {
    console.error('Erro ao cancelar sincronização:', error);
    return NextResponse.json({ error: 'Erro ao cancelar sincronização' }, { status: 500 });
  }
}
