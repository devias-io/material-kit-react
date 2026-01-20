import { NextResponse } from 'next/server';
import { type UserFiis, type ViesOverride } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { DEFAULT_FIIS_PORTFOLIO } from '@/data/carteiras-default';
import { auth } from '@/lib/auth';
import { CacheService } from '@/lib/cache-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface FiiPortfolioAsset {
  id: string;
  ticker: string;
  setor: string;
  dataEntrada: string;
  precoEntrada: number;
  precoTeto: number | null;
  posicaoEncerrada: boolean;
  dataSaida: string | null;
  precoSaida: number | null;
  viesOverride: ViesOverride | 'AUTO';
  ordem: number;
}

const FALLBACK_ASSETS: FiiPortfolioAsset[] = DEFAULT_FIIS_PORTFOLIO.map((fii, index) => ({
  id: fii.id ?? `fallback-${index}`,
  ticker: fii.ticker,
  setor: fii.setor,
  dataEntrada: fii.dataEntrada,
  precoEntrada: Number(fii.precoEntrada ?? 0),
  precoTeto: typeof fii.precoTeto === 'number' ? Number(fii.precoTeto) : null,
  posicaoEncerrada: false,
  dataSaida: null,
  precoSaida: null,
  viesOverride: 'AUTO',
  ordem: index + 1,
}));

function mapDatabaseAssets(records: UserFiis[]): FiiPortfolioAsset[] {
  return records.map((record, index) => ({
    id: record.id,
    ticker: record.ticker,
    setor: record.setor,
    dataEntrada: record.dataEntrada,
    precoEntrada: Number(record.precoEntrada ?? 0),
    precoTeto: typeof record.precoTeto === 'number' ? Number(record.precoTeto) : null,
    posicaoEncerrada: Boolean(record.posicaoEncerrada),
    dataSaida: record.dataSaida ?? null,
    precoSaida: typeof record.precoSaida === 'number' ? Number(record.precoSaida) : null,
    viesOverride: record.viesOverride ?? 'AUTO',
    ordem: index + 1,
  }));
}

function calculateMetrics(ativos: FiiPortfolioAsset[]) {
  const totalAtivos = ativos.length;
  const ativosAtivos = ativos.filter(ativo => !ativo.posicaoEncerrada).length;
  const ativosEncerrados = totalAtivos - ativosAtivos;

  const totalInvestido = ativos.reduce((sum, ativo) => sum + (ativo.precoEntrada || 0), 0);
  const precoEntradaMedio = totalAtivos > 0 ? totalInvestido / totalAtivos : 0;

  const ativosComTeto = ativos.filter(ativo => typeof ativo.precoTeto === 'number' && ativo.precoTeto !== null);
  const precoTetoMedio = ativosComTeto.length > 0
    ? ativosComTeto.reduce((sum, ativo) => sum + (ativo.precoTeto || 0), 0) / ativosComTeto.length
    : 0;

  const setores = ativos.reduce<Record<string, number>>((acc, ativo) => {
    const chave = ativo.setor || 'Indefinido';
    acc[chave] = (acc[chave] || 0) + 1;
    return acc;
  }, {});

  const distribuicaoSetorial = Object.entries(setores)
    .map(([setor, quantidade]) => ({
      setor,
      quantidade,
      percentual: totalAtivos > 0 ? Number(((quantidade / totalAtivos) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.quantidade - a.quantidade);

  return {
    totais: {
      totalAtivos,
      ativosAtivos,
      ativosEncerrados,
      totalInvestido: Number(totalInvestido.toFixed(2)),
      precoEntradaMedio: Number(precoEntradaMedio.toFixed(2)),
      precoTetoMedio: Number(precoTetoMedio.toFixed(2)),
    },
    distribuicaoSetorial,
    destaqueSetorial: distribuicaoSetorial[0] ?? null,
  };
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? 'anonymous';

  const cacheKey = CacheService.getCacheKey('fii-portfolio', userId);

  const { data, metadata } = await CacheService.withCache(
    cacheKey,
    async () => {
      let assets: FiiPortfolioAsset[] | null = null;
      let source: 'database' | 'static-fallback' = 'database';
      let ultimaAtualizacao: string | null = null;
      let fetchError: string | null = null;

      try {
        const databaseAssets = await prisma.userFiis.findMany({
          orderBy: { editadoEm: 'asc' },
        });

        if (databaseAssets.length > 0) {
          assets = mapDatabaseAssets(databaseAssets);
          const mostRecentUpdate = databaseAssets.reduce((acc, current) => {
            const updatedAt = current.updatedAt instanceof Date
              ? current.updatedAt.getTime()
              : new Date(current.updatedAt as unknown as string).getTime();
            return Math.max(acc, updatedAt || 0);
          }, 0);
          ultimaAtualizacao = mostRecentUpdate ? new Date(mostRecentUpdate).toISOString() : null;
        }
      } catch (error) {
        fetchError = error instanceof Error ? error.message : 'Erro desconhecido ao consultar FIIs';
        console.error('❌ Erro ao buscar FIIs no banco de dados:', error);
      }

      if (!assets || assets.length === 0) {
        assets = FALLBACK_ASSETS;
        source = 'static-fallback';
      }

      const metrics = calculateMetrics(assets);

      return {
        success: true,
        source,
        generatedAt: new Date().toISOString(),
        portfolio: {
          ...metrics,
          totalSetores: metrics.distribuicaoSetorial.length,
          ultimaAtualizacao,
        },
        assets,
        metadata: {
          fallbackUtilizado: source !== 'database',
          fetchError,
        },
      };
    },
    {
      ttlSeconds: 300,
      tags: ['fii-portfolio', userId],
    }
  );

  return NextResponse.json(data, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=300',
      'X-Cache-Hit': String(metadata.cached),
    },
  });
}
