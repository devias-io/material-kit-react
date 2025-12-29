import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (session.user.plan !== 'ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') ?? '20', 10);
    const offsetParam = parseInt(searchParams.get('offset') ?? '0', 10);
    const statusParam = searchParams.get('status');

    const limit = Math.min(Math.max(limitParam, 1), MAX_LIMIT);
    const offset = Math.max(offsetParam, 0);

    const where: { status?: string } = {};

    if (statusParam && ['EM_PROGRESSO', 'CONCLUIDO', 'ERRO'].includes(statusParam)) {
      where.status = statusParam;
    }

    const [historico, total] = await Promise.all([
      prisma.proventoSincronizacao.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          ticker: true,
          status: true,
          dataInicio: true,
          dataFim: true,
          totalProcessados: true,
          totalNovos: true,
          totalAtualizados: true,
          totalErros: true,
          erros: true,
          createdAt: true,
        },
      }),
      prisma.proventoSincronizacao.count({ where }),
    ]);

    const historicoEnriquecido = historico.map((sync) => {
      const duracaoMs = sync.dataFim && sync.dataInicio ? sync.dataFim.getTime() - sync.dataInicio.getTime() : null;
      const duracaoSegundos = duracaoMs ? Math.round(duracaoMs / 1000) : null;

      const total = sync.totalProcessados + sync.totalErros;
      const taxaSucesso = total > 0 ? Math.round((sync.totalProcessados / total) * 100) : 0;

      return {
        id: sync.id,
        ticker: sync.ticker || 'Todos',
        status: sync.status,
        dataInicio: sync.dataInicio,
        dataFim: sync.dataFim,
        duracao: duracaoSegundos ? `${duracaoSegundos}s` : null,
        metricas: {
          totalProcessados: sync.totalProcessados,
          totalNovos: sync.totalNovos,
          totalAtualizados: sync.totalAtualizados,
          totalErros: sync.totalErros,
          taxaSucesso: `${taxaSucesso}%`,
        },
        temErros: sync.totalErros > 0,
        erros: sync.totalErros > 0 ? sync.erros : null,
      };
    });

    const estatisticas = await prisma.proventoSincronizacao.aggregate({
      _count: { id: true },
      _sum: {
        totalNovos: true,
        totalAtualizados: true,
        totalErros: true,
      },
    });

    const ultimaSincronizacao = historico[0] || null;

    return NextResponse.json({
      historico: historicoEnriquecido,
      paginacao: {
        total,
        limit,
        offset,
        temMais: offset + limit < total,
      },
      estatisticas: {
        totalSincronizacoes: estatisticas._count.id,
        totalProventosNovos: estatisticas._sum.totalNovos || 0,
        totalProventosAtualizados: estatisticas._sum.totalAtualizados || 0,
        totalErros: estatisticas._sum.totalErros || 0,
      },
      ultimaSincronizacao: ultimaSincronizacao
        ? {
            id: ultimaSincronizacao.id,
            dataInicio: ultimaSincronizacao.dataInicio,
            status: ultimaSincronizacao.status,
          }
        : null,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);

    return NextResponse.json(
      {
        error: 'Erro ao buscar histórico',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
