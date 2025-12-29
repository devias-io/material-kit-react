// 📁 /src/app/api/proventos/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/redis';

const PROVENTOS_CACHE_TAG = 'proventos:list';
const PROVENTOS_STATS_CACHE_TAG = 'proventos:stats';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nomeArquivo, 
      tamanhoArquivo, 
      totalLinhas, 
      linhasProcessadas, 
      linhasComErro,
      proventos 
    } = body;
    
    // 📊 REGISTRAR LOG DO UPLOAD
    const upload = await prisma.proventoUpload.create({
      data: {
        nomeArquivo,
        tamanhoArquivo,
        totalLinhas,
        linhasProcessadas,
        linhasComErro,
        iniciadoEm: new Date(),
        // userId: req.user?.id, // Se tiver autenticação
      }
    });
    
    // 📤 PROCESSAR PROVENTOS EM LOTES
    let totalInseridos = 0;
    let totalAtualizados = 0;
    let totalSobrescritosBRAPI = 0;

    for (const provento of proventos) {
      try {
        const compositeKey = {
          ticker: provento.ticker,
          dataCom: provento.dataCom ?? null,
          tipo: provento.tipo,
        };

        const existente = await prisma.provento.findUnique({
          where: { unique_provento_ticker_dataCom_tipo: compositeKey },
        });

        await prisma.provento.upsert({
          where: { unique_provento_ticker_dataCom_tipo: compositeKey },
          update: {
            valor: provento.valor,
            dataPagamento: provento.dataPagamento,
            observacoes: provento.descricao ?? provento.observacoes,
            origem: 'CSV',
            dataUltimaAtualizacao: new Date(),
            data: provento.data,
            dataObj: new Date(provento.dataObj),
            dataFormatada: provento.dataFormatada,
            valorFormatado: provento.valorFormatado,
            dividendYield: provento.dividendYield,
            fonte: 'csv_upload',
          },
          create: {
            ticker: provento.ticker,
            valor: provento.valor,
            tipo: provento.tipo,
            data: provento.data,
            dataObj: new Date(provento.dataObj),
            dataCom: provento.dataCom ?? null,
            dataPagamento: provento.dataPagamento,
            dataFormatada: provento.dataFormatada,
            valorFormatado: provento.valorFormatado,
            dividendYield: provento.dividendYield,
            fonte: 'csv_upload',
            observacoes: provento.descricao ?? provento.observacoes,
            origem: 'CSV',
            dataUltimaAtualizacao: new Date(),
          },
        });

        if (existente) {
          totalAtualizados++;

          if (existente.origem === 'BRAPI') {
            totalSobrescritosBRAPI++;
            console.log(
              `⚠️ CSV sobrescreveu provento BRAPI: ${provento.ticker} - ${provento.dataCom} - ${provento.tipo}`
            );
          }
        } else {
          totalInseridos++;
        }
      } catch (error) {
        console.error('Erro ao processar provento:', error);
      }
    }
    
    const totalProcessados = proventos.length;

    // ✅ FINALIZAR LOG DO UPLOAD
    await prisma.proventoUpload.update({
      where: { id: upload.id },
      data: {
        finalizadoEm: new Date(),
        proventosCriados: totalInseridos,
        proventosAtualizados: totalAtualizados,
      },
    });

    await CacheService.invalidateTags([PROVENTOS_CACHE_TAG, PROVENTOS_STATS_CACHE_TAG]);

    console.log(
      `Upload concluído: ${totalInseridos} inseridos, ${totalAtualizados} atualizados (sobrescritos BRAPI: ${totalSobrescritosBRAPI})`
    );

    return NextResponse.json({
      message: 'Upload concluído com sucesso',
      estatisticas: {
        totalProcessados,
        totalInseridos,
        totalAtualizados,
        totalSobrescritosBRAPI,
      },
      uploadId: upload.id,
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}