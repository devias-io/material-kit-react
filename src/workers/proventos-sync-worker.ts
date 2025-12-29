import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/redis';
import { buscarProventosEmLoteParaSincronizacao } from '@/services/proventos-brapi-sync';
import type { ProventoSyncConfig } from '@/types/brapi';

const PROVENTOS_CACHE_TAG = 'proventos:list';
const PROVENTOS_STATS_CACHE_TAG = 'proventos:stats';
const PROGRESS_CACHE_TTL_SECONDS = 60 * 60;
const ESTATISTICAS_BATCH_SIZE = 10;

const formatarValor = (valor: number) =>
  valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatarData = (data: Date) => new Intl.DateTimeFormat('pt-BR').format(data);

export async function sincronizarProventos(config: ProventoSyncConfig = {}) {
  console.log('🚀 Iniciando sincronização de proventos...', config);

  const syncRecord = await prisma.proventoSincronizacao.create({
    data: {
      ticker: config.tickers?.length ? config.tickers.join(',') : null,
      status: 'EM_PROGRESSO',
      dataInicio: new Date(),
      totalProcessados: 0,
      totalNovos: 0,
      totalAtualizados: 0,
      totalErros: 0,
    },
  });

  const syncId = syncRecord.id;
  console.log(`📝 Sincronização criada com ID: ${syncId}`);

  try {
    let tickersParaSincronizar: string[];

    if (config.tickers && config.tickers.length > 0) {
      tickersParaSincronizar = config.tickers.map((ticker) => ticker.toUpperCase());
      console.log(`🎯 Sincronizando ${tickersParaSincronizar.length} tickers específicos`);
    } else {
      const tickersUnicos = await prisma.provento.findMany({
        select: { ticker: true },
        distinct: ['ticker'],
        orderBy: { ticker: 'asc' },
      });

      tickersParaSincronizar = tickersUnicos.map((t) => t.ticker.toUpperCase());
      console.log(`🌍 Sincronizando TODOS os tickers: ${tickersParaSincronizar.length}`);
    }

    if (tickersParaSincronizar.length === 0) {
      throw new Error('Nenhum ticker para sincronizar');
    }

    const { sucessos, erros } = await buscarProventosEmLoteParaSincronizacao(
      tickersParaSincronizar,
      2,
      async (ticker, index, total) => {
        const progressData = {
          syncId,
          ticker,
          progresso: index,
          total,
          status: 'EM_PROGRESSO' as const,
        };

        await CacheService.set(
          `sync:progress:${syncId}`,
          progressData,
          PROGRESS_CACHE_TTL_SECONDS
        );

        console.log(`⏳ Progresso: ${index}/${total} - ${ticker}`);
      }
    );

    console.log(`✅ Busca concluída: ${sucessos.size} sucessos, ${erros.size} erros`);

    let totalNovos = 0;
    let totalAtualizados = 0;
    let totalPulados = 0;

    for (const [ticker, proventos] of sucessos.entries()) {
      console.log(`📊 Processando ${ticker}: ${proventos.length} proventos`);

      for (const provento of proventos) {
        if (config.dataInicio && provento.dataCom < config.dataInicio) continue;
        if (config.dataFim && provento.dataCom > config.dataFim) continue;

        const dataComIso = provento.dataCom.toISOString();
        const dataPagamentoIso = provento.dataPagamento
          ? provento.dataPagamento.toISOString()
          : null;
        const dataBase = provento.dataPagamento ?? provento.dataCom;
        const dataFormatada = formatarData(dataBase);
        const valorFormatado = formatarValor(provento.valor);

        const existente = await prisma.provento.findFirst({
          where: {
            ticker: provento.ticker.toUpperCase(),
            dataCom: dataComIso,
            tipo: provento.tipo,
          },
        });

        const dadosAtualizados = {
          valor: provento.valor,
          data: dataBase.toISOString(),
          dataObj: dataBase,
          dataCom: dataComIso,
          dataPagamento: dataPagamentoIso,
          dataFormatada,
          valorFormatado,
          observacoes: provento.descricao,
          fonte: 'BRAPI',
          origem: 'BRAPI' as const,
          dataUltimaAtualizacao: new Date(),
        };

        if (!existente) {
          await prisma.provento.create({
            data: {
              ticker: provento.ticker.toUpperCase(),
              ...dadosAtualizados,
            },
          });
          totalNovos++;
        } else if (existente.origem === 'BRAPI') {
          await prisma.provento.update({
            where: { id: existente.id },
            data: dadosAtualizados,
          });
          totalAtualizados++;
        } else if (existente.origem === 'CSV' && config.forcarAtualizacao) {
          await prisma.provento.update({
            where: { id: existente.id },
            data: dadosAtualizados,
          });
          totalAtualizados++;
        } else {
          totalPulados++;
        }
      }
    }

    console.log(`📈 Resultados: ${totalNovos} novos, ${totalAtualizados} atualizados, ${totalPulados} pulados (CSV)`);

    await prisma.proventoSincronizacao.update({
      where: { id: syncId },
      data: {
        status: erros.size > 0 ? 'ERRO' : 'CONCLUIDO',
        dataFim: new Date(),
        totalProcessados: sucessos.size,
        totalNovos,
        totalAtualizados,
        totalErros: erros.size,
        erros: erros.size > 0 ? Object.fromEntries(erros) : null,
      },
    });

    await invalidarCachesProventos(tickersParaSincronizar);

    console.log('📊 Recalculando estatísticas...');
    await recalcularEstatisticasProventos(tickersParaSincronizar);

    await CacheService.delete(`sync:progress:${syncId}`);

    console.log('✅ Sincronização concluída com sucesso!');

    return {
      syncId,
      totalNovos,
      totalAtualizados,
      totalPulados,
      totalErros: erros.size,
      erros: Array.from(erros.entries()),
    };
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);

    await prisma.proventoSincronizacao.update({
      where: { id: syncId },
      data: {
        status: 'ERRO',
        dataFim: new Date(),
        erros: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      },
    });

    await CacheService.delete(`sync:progress:${syncId}`);

    throw error;
  }
}

export async function invalidarCachesProventos(tickers: string[] = []) {
  const tags = [
    PROVENTOS_CACHE_TAG,
    PROVENTOS_STATS_CACHE_TAG,
    ...tickers.map((ticker) => `proventos:${ticker.toUpperCase()}`),
  ];

  try {
    await CacheService.invalidateTags(tags);
    console.log(`🗑️ Cache invalidado para ${tags.length} tags`);
  } catch (error) {
    console.error('Erro ao invalidar caches:', error);
  }
}

async function recalcularEstatisticasProventos(tickers: string[]) {
  const tickersUnicos = Array.from(new Set(tickers.map((ticker) => ticker.toUpperCase())));
  if (tickersUnicos.length === 0) return;

  for (let i = 0; i < tickersUnicos.length; i += ESTATISTICAS_BATCH_SIZE) {
    const batch = tickersUnicos.slice(i, i + ESTATISTICAS_BATCH_SIZE);

    await Promise.all(
      batch.map(async (ticker) => {
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
  }
}
