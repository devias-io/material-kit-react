// src/workers/proventos-sync-worker.ts

import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/redis';
import { buscarProventosEmLoteParaSincronizacao } from '@/services/proventos-brapi-sync';
import type { ProventoSyncConfig } from '@/types/brapi';

const PROVENTOS_CACHE_TAG = 'proventos:list';
const PROVENTOS_STATS_CACHE_TAG = 'proventos:stats';
const PROGRESS_CACHE_TTL_SECONDS = 60 * 60;
const ESTATISTICAS_BATCH_SIZE = 10;
const BATCH_SIZE = 100;

// ✅ LISTA DEFAULT (caso não encontre em lugar nenhum)
const TICKERS_DEFAULT = [
  'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3',
  'B3SA3', 'MGLU3', 'WEGE3', 'RENT3', 'EGIE3',
  'BBAS3', 'SANB11', 'ELET3', 'BPAC11', 'TAEE11',
  'ITSA4', 'VIVT3', 'CPLE6', 'CMIG4', 'ENBR3'
];

// Funções auxiliares de formatação
const formatarValor = (valor: number) =>
  valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatarData = (data: Date) =>
  new Intl.DateTimeFormat('pt-BR').format(data);

// ✅ NORMALIZAR TIPO (sempre uppercase)
const normalizarTipo = (tipo: string): string => tipo.toUpperCase().trim();

// ✅ NORMALIZAR DATA (sempre ISO completo)
const normalizarDataISO = (data: Date | string | null): string | null => {
  if (!data) return null;
  
  const dateObj = data instanceof Date ? data : new Date(data);
  return dateObj.toISOString();
};

// ✅ ARREDONDAR VALOR para 2 casas decimais
const arredondarValor = (valor: number): number => {
  return Math.round(valor * 100) / 100;
};

// ✅ FUNÇÃO AUXILIAR: Buscar tickers de AtivoInformacao
async function buscarTickersDeAtivosInformacao(): Promise<string[]> {
  try {
    console.log('📊 Buscando tickers de ativos_informacao...');
    
    const ativosInfo = await prisma.ativoInformacao.findMany({
      where: {
        ativo: true, // Apenas ativos
        tipo: {
          in: ['ACAO', 'FII'] // Apenas ações e FIIs
        }
      },
      select: { 
        codigo: true,
        nome: true,
        tipo: true 
      },
      orderBy: { codigo: 'asc' },
    });

    const tickers = ativosInfo.map((a) => a.codigo.toUpperCase());
    
    console.log(`✅ Encontrados ${tickers.length} tickers em ativos_informacao`);
    
    return tickers;
  } catch (error) {
    console.error('❌ Erro ao buscar de ativos_informacao:', error);
    return [];
  }
}

// ✅ FUNÇÃO AUXILIAR: Buscar tickers de todas as carteiras de usuários
async function buscarTickersDasCarteiras(): Promise<string[]> {
  try {
    console.log('📦 Buscando tickers das carteiras de usuários...');
    
    const tickers = new Set<string>();
    
    // Buscar de todas as tabelas de carteiras
    const [
      microCaps,
      smallCaps,
      dividendos,
      fiis,
      rendaTurbinada,
      dividendosInternacional,
      etfs,
      projetoAmerica,
      exteriorStocks
    ] = await Promise.all([
      prisma.userMicroCaps.findMany({ 
        select: { ticker: true }, 
        distinct: ['ticker'],
        where: { posicaoEncerrada: false } // Apenas posições ativas
      }),
      prisma.userSmallCaps.findMany({ 
        select: { ticker: true }, 
        distinct: ['ticker'],
        where: { posicaoEncerrada: false }
      }),
      prisma.userDividendos.findMany({ 
        select: { ticker: true }, 
        distinct: ['ticker'],
        where: { posicaoEncerrada: false }
      }),
      prisma.userFiis.findMany({ 
        select: { ticker: true }, 
        distinct: ['ticker'],
        where: { posicaoEncerrada: false }
      }),
      prisma.userRendaTurbinada.findMany({ 
        select: { ticker: true }, 
        distinct: ['ticker'],
        where: { posicaoEncerrada: false }
      }),
      prisma.userDividendosInternacional.findMany({ 
        select: { ticker: true }, 
        distinct: ['ticker'],
        where: { posicaoEncerrada: false }
      }),
      prisma.userEtfs.findMany({ 
        select: { ticker: true }, 
        distinct: ['ticker'],
        where: { posicaoEncerrada: false }
      }),
      prisma.userProjetoAmerica.findMany({ 
        select: { ticker: true }, 
        distinct: ['ticker'],
        where: { posicaoEncerrada: false }
      }),
      prisma.userExteriorStocks.findMany({ 
        select: { ticker: true }, 
        distinct: ['ticker'],
        where: { posicaoEncerrada: false }
      }),
    ]);
    
    // Adicionar todos ao Set (remove duplicatas automaticamente)
    [
      ...microCaps,
      ...smallCaps,
      ...dividendos,
      ...fiis,
      ...rendaTurbinada,
      ...dividendosInternacional,
      ...etfs,
      ...projetoAmerica,
      ...exteriorStocks
    ].forEach(({ ticker }) => {
      // Filtrar tickers internacionais (não tem proventos BR)
      if (!ticker.includes('.') && !ticker.match(/^\d/)) {
        tickers.add(ticker.toUpperCase());
      }
    });
    
    const tickersArray = Array.from(tickers).sort();
    console.log(`✅ Encontrados ${tickersArray.length} tickers únicos nas carteiras`);
    
    return tickersArray;
  } catch (error) {
    console.error('❌ Erro ao buscar das carteiras:', error);
    return [];
  }
}

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
      // ✅ 1ª PRIORIDADE: Tickers específicos passados na configuração
      tickersParaSincronizar = config.tickers.map((ticker) => ticker.toUpperCase());
      console.log(`🎯 Sincronizando ${tickersParaSincronizar.length} tickers específicos`);
      
    } else {
      // ✅ 2ª PRIORIDADE: Buscar de ativos_informacao
      tickersParaSincronizar = await buscarTickersDeAtivosInformacao();
      
      // ✅ 3ª PRIORIDADE: Se não encontrar, buscar das carteiras
      if (tickersParaSincronizar.length === 0) {
        console.log('⚠️ Nenhum ticker em ativos_informacao, buscando das carteiras...');
        tickersParaSincronizar = await buscarTickersDasCarteiras();
      }
      
      // ✅ 4ª PRIORIDADE: Se ainda estiver vazio, usar lista default
      if (tickersParaSincronizar.length === 0) {
        console.log('⚠️ Nenhum ticker encontrado, usando lista default...');
        tickersParaSincronizar = TICKERS_DEFAULT;
      }
      
      console.log(`🌍 Sincronizando ${tickersParaSincronizar.length} tickers`);
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
    let totalErrosProcessamento = 0;

    // PROCESSAR TODOS OS PROVENTOS EM LOTES
    const todosProventos: Array<{
      ticker: string;
      provento: any;
    }> = [];

    for (const [ticker, proventos] of sucessos.entries()) {
      for (const provento of proventos) {
        // Aplicar filtros de data
        if (config.dataInicio && provento.dataCom < config.dataInicio) continue;
        if (config.dataFim && provento.dataCom > config.dataFim) continue;
        
        todosProventos.push({ ticker, provento });
      }
    }

    console.log(`📦 Total de proventos para processar: ${todosProventos.length}`);

    // PROCESSAR EM LOTES
    for (let i = 0; i < todosProventos.length; i += BATCH_SIZE) {
      const batch = todosProventos.slice(i, i + BATCH_SIZE);
      
      console.log(`📊 Processando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(todosProventos.length / BATCH_SIZE)} (${batch.length} proventos)`);

      try {
        // PROCESSAR CADA PROVENTO DO LOTE
        const results = await Promise.allSettled(
          batch.map(async ({ ticker, provento }) => {
            const dataBase = provento.dataPagamento || provento.dataCom;
            
            // ✅ NORMALIZAR DADOS
            const tipoNormalizado = normalizarTipo(provento.tipo);
            const dataComString = normalizarDataISO(provento.dataCom);
            const dataPagamentoString = normalizarDataISO(provento.dataPagamento);
            const valorArredondado = arredondarValor(provento.valor);

            // ✅ VERIFICAR SE JÁ EXISTE (com margem de erro no valor)
            const existente = await prisma.provento.findFirst({
              where: {
                ticker: provento.ticker,
                tipo: tipoNormalizado,
                valor: {
                  gte: valorArredondado - 0.005,  // Margem de ±0.005
                  lte: valorArredondado + 0.005,
                },
                dataCom: dataComString,
                dataPagamento: dataPagamentoString,
              },
              select: { id: true, origem: true, valor: true }
            });

            const dadosProvento = {
              tipo: tipoNormalizado,
              valor: provento.valor,  // ✅ Salva valor original (não arredondado)
              data: normalizarDataISO(dataBase),
              dataObj: dataBase,
              dataCom: dataComString,
              dataPagamento: dataPagamentoString,
              dataFormatada: formatarData(dataBase),
              valorFormatado: formatarValor(provento.valor),
              observacoes: provento.descricao,
              fonte: 'BRAPI',
              origem: 'BRAPI' as const,
              dataUltimaAtualizacao: new Date(),
            };

            if (!existente) {
              // CRIAR NOVO
              await prisma.provento.create({
                data: {
                  ticker: provento.ticker,
                  ...dadosProvento,
                },
              });
              return { acao: 'CRIADO', ticker: provento.ticker };
              
            } else if (existente.origem === 'BRAPI') {
              // ATUALIZAR (origem BRAPI) - sempre atualiza para ter valor mais preciso
              await prisma.provento.update({
                where: { id: existente.id },
                data: dadosProvento,
              });
              return { acao: 'ATUALIZADO', ticker: provento.ticker };
              
            } else if (existente.origem === 'CSV' && config.forcarAtualizacao) {
              // SOBRESCREVER CSV (forçar)
              await prisma.provento.update({
                where: { id: existente.id },
                data: {
                  ...dadosProvento,
                  origem: 'BRAPI',
                },
              });
              console.log(`⚠️ CSV sobrescrito: ${ticker} - ${tipoNormalizado} - valor ${existente.valor} → ${provento.valor}`);
              return { acao: 'SOBRESCRITO', ticker: provento.ticker };
              
            } else {
              // PULAR (CSV tem prioridade)
              // Log se valores são diferentes mas considerados duplicatas
              if (Math.abs(existente.valor - provento.valor) > 0.001) {
                console.log(`ℹ️ Pulado (CSV): ${ticker} - ${tipoNormalizado} - CSV: ${existente.valor} vs BRAPI: ${provento.valor}`);
              }
              return { acao: 'PULADO', ticker: provento.ticker };
            }
          })
        );

        // Contar resultados
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            if (result.value.acao === 'CRIADO') totalNovos++;
            else if (result.value.acao === 'ATUALIZADO' || result.value.acao === 'SOBRESCRITO') totalAtualizados++;
            else if (result.value.acao === 'PULADO') totalPulados++;
          } else {
            totalErrosProcessamento++;
            console.error('❌ Erro ao processar provento:', result.reason);
          }
        });

      } catch (error) {
        console.error(`❌ Erro ao processar lote:`, error);
        totalErrosProcessamento += batch.length;
      }
    }

    console.log(
      `📈 Resultados: ${totalNovos} novos, ${totalAtualizados} atualizados, ${totalPulados} pulados (CSV), ${totalErrosProcessamento} erros`
    );

    // Atualizar registro de sincronização
    await prisma.proventoSincronizacao.update({
      where: { id: syncId },
      data: {
        status: totalErrosProcessamento > 0 ? 'ERRO' : 'CONCLUIDO',
        dataFim: new Date(),
        totalProcessados: sucessos.size,
        totalNovos,
        totalAtualizados,
        totalErros: totalErrosProcessamento + erros.size,
        erros: erros.size > 0 ? Object.fromEntries(erros) : null,
      },
    });

    // Invalidar caches
    console.log('🗑️ Invalidando caches...');
    await invalidarCachesProventos(tickersParaSincronizar);

    // Recalcular estatísticas
    console.log('📊 Recalculando estatísticas...');
    await recalcularEstatisticasProventos(tickersParaSincronizar);

    // Limpar progresso do cache
    await CacheService.delete(`sync:progress:${syncId}`);

    console.log('✅ Sincronização concluída com sucesso!');

    return {
      syncId,
      totalNovos,
      totalAtualizados,
      totalPulados,
      totalErros: totalErrosProcessamento + erros.size,
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

    await Promise.allSettled(
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
