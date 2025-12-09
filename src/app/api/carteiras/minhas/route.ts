export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth'; // ADICIONAR ESTA LINHA
import { CacheService } from '@/lib/redis';
import { logApiMetric } from '@/lib/metrics';

export const config = {
  maxDuration: 5,
};

export async function GET(request: NextRequest) {
  const startedAt = Date.now();

  try {
    // CORRIGIDO: Usar a função auth() real
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Usuário não autenticado' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    // Filtros
    const where: any = {
      userId: session.user.id // CORRIGIDO: Usar session.user.id
    };

    if (status && status !== 'todos') {
      where.status = status.toUpperCase();
    }

    const cacheKey = CacheService.getCacheKey(
      'minhas-carteiras',
      session.user.id,
      `page:${page}`,
      `limit:${limit}`,
      status || 'todos'
    );

    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () => {
        const [carteiras, total] = await Promise.all([
          prisma.carteiraAnalise.findMany({
            where,
            include: {
              ativos: {
                orderBy: {
                  valorTotal: 'desc'
                }
              },
              analista: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            skip,
            take: limit
          }),
          prisma.carteiraAnalise.count({ where })
        ]);


        // Processar carteiras
        const carteirasProcessadas = carteiras.map(carteira => {
          const totalCarteira = carteira.ativos.reduce((sum, ativo) => sum + ativo.valorTotal, 0);

          // Distribuição por tipo
          const distribuicaoTipo = carteira.ativos.reduce((acc, ativo) => {
            acc[ativo.tipo] = (acc[ativo.tipo] || 0) + ativo.valorTotal;
            return acc;
          }, {} as Record<string, number>);

          const distribuicaoPercentual = Object.entries(distribuicaoTipo).map(([tipo, valor]) => ({
            tipo,
            valor,
            percentual: totalCarteira > 0 ? (valor / totalCarteira) * 100 : 0
          }));

          // PARSE DOS DADOS ESTRUTURADOS
          let dadosEstruturados = null;
          if (carteira.dadosEstruturados) {
            try {
              dadosEstruturados = typeof carteira.dadosEstruturados === 'string'
                ? JSON.parse(carteira.dadosEstruturados)
                : carteira.dadosEstruturados;
            } catch (error) {
              console.error('Erro ao parsear dadosEstruturados:', error);
            }
          }

          return {
            id: carteira.id,
            nomeArquivo: carteira.nomeArquivo,
            status: carteira.status.toLowerCase(),
            dataEnvio: carteira.dataEnvio,
            dataAnalise: carteira.dataAnalise,
            valorTotal: carteira.valorTotal,
            quantidadeAtivos: carteira.quantidadeAtivos,
            feedback: carteira.feedback,
            recomendacoes: carteira.recomendacoes ? JSON.parse(carteira.recomendacoes) : [],
            pontuacao: carteira.pontuacao,
            // INCLUIR DADOS ESTRUTURADOS
            dadosEstruturados: dadosEstruturados,
            // CAMPOS INDIVIDUAIS PARA COMPATIBILIDADE
            avaliacaoQualidade: dadosEstruturados?.avaliacoes?.qualidade,
            avaliacaoDiversificacao: dadosEstruturados?.avaliacoes?.diversificacao,
            avaliacaoAdaptacao: dadosEstruturados?.avaliacoes?.adaptacao,
            analista: carteira.analista ? {
              id: carteira.analista.id,
              name: `${carteira.analista.firstName} ${carteira.analista.lastName}`
            } : null,
            ativos: carteira.ativos,
            estatisticas: {
              distribuicaoTipo: distribuicaoPercentual
            }
          };
        });

        return {
          carteiras: carteirasProcessadas,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
      },
      { ttlSeconds: 600, tags: [`carteiras:${session.user.id}`] }
    );

    logApiMetric({
      route: '/api/carteiras/minhas',
      cacheHit: metadata.cached,
      cacheBackend: metadata.backend,
      durationMs: Date.now() - startedAt,
      status: 200,
      extra: { status, page, limit },
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('Erro ao buscar carteiras:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}