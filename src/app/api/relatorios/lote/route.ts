import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const TIPOS_VALIDOS = new Set(['trimestral', 'anual', 'apresentacao', 'outros']);
const TIPOS_VISUALIZACAO_VALIDOS = new Set(['iframe', 'canva', 'link', 'pdf']);

type MetadataUpload = {
  nomeArquivo?: string;
  tamanhoArquivo?: number;
  totalItens?: number;
  itensProcessados?: number;
};

type ErroProcessamento = {
  index: number;
  ticker?: string;
  nome?: string;
  motivo: string;
};

type RelatorioLotePayload = {
  relatorios?: unknown;
  metadata?: unknown;
};

type RelatorioNormalizado = {
  index: number;
  ticker: string;
  nome: string;
  dataReferencia: string;
  dados: {
    ticker: string;
    nome: string;
    tipo: string;
    dataReferencia: string;
    dataUpload: Date;
    linkCanva: string | null;
    linkExterno: string | null;
    tipoVisualizacao: string;
    arquivoPdf: string | null;
    nomeArquivoPdf: string | null;
    tamanhoArquivo: number | null;
    tipoPdf: string | null;
    hashArquivo: string | null;
    solicitarReupload: boolean;
  };
};

function normalizarTipo(valor: unknown): 'trimestral' | 'anual' | 'apresentacao' | 'outros' {
  if (typeof valor === 'string') {
    const normalizado = valor.toLowerCase();
    if (TIPOS_VALIDOS.has(normalizado)) {
      return normalizado as 'trimestral' | 'anual' | 'apresentacao' | 'outros';
    }
  }
  return 'outros';
}

function normalizarTipoVisualizacao(valor: unknown): 'iframe' | 'canva' | 'link' | 'pdf' {
  if (typeof valor === 'string') {
    const normalizado = valor.toLowerCase();
    if (TIPOS_VISUALIZACAO_VALIDOS.has(normalizado)) {
      return normalizado as 'iframe' | 'canva' | 'link' | 'pdf';
    }
  }
  return 'iframe';
}

function parseDataUpload(valor: unknown): Date {
  if (typeof valor === 'string') {
    const data = new Date(valor);
    if (!Number.isNaN(data.getTime())) {
      return data;
    }
  } else if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return valor;
  }
  return new Date();
}

function toOptionalString(valor: unknown): string | null {
  if (typeof valor === 'string') {
    const texto = valor.trim();
    return texto.length > 0 ? texto : null;
  }
  return null;
}

function toOptionalNumber(valor: unknown): number | null {
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor;
  }
  if (typeof valor === 'string') {
    const numero = Number(valor);
    if (!Number.isNaN(numero)) {
      return numero;
    }
  }
  return null;
}

function toBoolean(valor: unknown, padrao = false): boolean {
  if (typeof valor === 'boolean') {
    return valor;
  }
  if (typeof valor === 'string') {
    const texto = valor.trim().toLowerCase();
    if (['true', '1', 'sim', 'yes'].includes(texto)) {
      return true;
    }
    if (['false', '0', 'nao', 'não', 'no'].includes(texto)) {
      return false;
    }
  }
  return padrao;
}

function normalizarMetadata(valor: unknown): MetadataUpload & {
  recebidoEm: string;
} {
  const metadata: MetadataUpload = {};

  if (valor && typeof valor === 'object') {
    const dados = valor as Record<string, unknown>;

    if (typeof dados.nomeArquivo === 'string' && dados.nomeArquivo.trim()) {
      metadata.nomeArquivo = dados.nomeArquivo.trim();
    }

    const tamanho = toOptionalNumber(dados.tamanhoArquivo);
    if (typeof tamanho === 'number') {
      metadata.tamanhoArquivo = tamanho;
    }

    const totalItens = toOptionalNumber(dados.totalItens);
    if (typeof totalItens === 'number') {
      metadata.totalItens = totalItens;
    }

    const itensProcessados = toOptionalNumber(dados.itensProcessados);
    if (typeof itensProcessados === 'number') {
      metadata.itensProcessados = itensProcessados;
    }
  }

  return {
    ...metadata,
    recebidoEm: new Date().toISOString(),
  };
}

function normalizarRelatorios(relatorios: unknown): {
  validos: RelatorioNormalizado[];
  erros: ErroProcessamento[];
} {
  const erros: ErroProcessamento[] = [];
  const validos: RelatorioNormalizado[] = [];
  const combinacoesProcessadas = new Set<string>();

  if (!Array.isArray(relatorios)) {
    return { validos, erros: [{ index: -1, motivo: 'Formato inválido: relatorios deve ser um array' }] };
  }

  relatorios.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      erros.push({ index, motivo: 'Item inválido: esperado objeto' });
      return;
    }

    const dados = item as Record<string, unknown>;
    const ticker = typeof dados.ticker === 'string' ? dados.ticker.trim().toUpperCase() : '';
    const nome = typeof dados.nome === 'string' ? dados.nome.trim() : '';

    if (!ticker) {
      erros.push({ index, motivo: 'Ticker não informado ou inválido' });
      return;
    }

    if (!nome) {
      erros.push({ index, ticker, motivo: 'Nome do relatório não informado' });
      return;
    }

    const tipo = normalizarTipo(dados.tipo);
    const tipoVisualizacao = normalizarTipoVisualizacao(dados.tipoVisualizacao);
    const dataReferencia = typeof dados.dataReferencia === 'string' ? dados.dataReferencia.trim() : '';
    const dataUpload = parseDataUpload(dados.dataUpload);

    const combinacao = `${ticker}::${nome}::${dataReferencia}`;
    if (combinacoesProcessadas.has(combinacao)) {
      erros.push({ index, ticker, nome, motivo: 'Relatório duplicado no lote (mesmo ticker/nome/dataReferencia)' });
      return;
    }

    combinacoesProcessadas.add(combinacao);

    validos.push({
      index,
      ticker,
      nome,
      dataReferencia,
      dados: {
        ticker,
        nome,
        tipo,
        dataReferencia,
        dataUpload,
        linkCanva: toOptionalString(dados.linkCanva),
        linkExterno: toOptionalString(dados.linkExterno),
        tipoVisualizacao,
        arquivoPdf: toOptionalString(dados.arquivoPdf),
        nomeArquivoPdf: toOptionalString(dados.nomeArquivoPdf),
        tamanhoArquivo: toOptionalNumber(dados.tamanhoArquivo),
        tipoPdf: toOptionalString(dados.tipoPdf),
        hashArquivo: toOptionalString(dados.hashArquivo),
        solicitarReupload: toBoolean(dados.solicitarReupload),
      },
    });
  });

  return { validos, erros };
}

export async function POST(request: NextRequest) {
  const inicioProcessamento = new Date();

  try {
    const payload = (await request.json()) as RelatorioLotePayload;
    const { relatorios, metadata } = payload;

    if (!relatorios || !Array.isArray(relatorios) || relatorios.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'É necessário enviar ao menos um relatório para processamento',
        },
        { status: 400 },
      );
    }

    const metadataNormalizada = metadata ? normalizarMetadata(metadata) : undefined;

    console.log('📥 Recebendo lote de relatórios', {
      totalRecebidos: relatorios.length,
      metadata: metadataNormalizada,
    });

    const { validos, erros: errosValidacao } = normalizarRelatorios(relatorios);

    if (validos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhum relatório válido para processamento',
          erros: errosValidacao,
          metadata: metadataNormalizada,
        },
        { status: 400 },
      );
    }

    const errosProcessamento: ErroProcessamento[] = [...errosValidacao];
    let totalCriados = 0;
    let totalDuplicados = 0;

    for (const relatorio of validos) {
      try {
        const existente = await prisma.relatorio.findFirst({
          where: {
            ticker: relatorio.dados.ticker,
            nome: relatorio.dados.nome,
            dataReferencia: relatorio.dados.dataReferencia,
          },
          select: { id: true },
        });

        if (existente) {
          totalDuplicados += 1;
          errosProcessamento.push({
            index: relatorio.index,
            ticker: relatorio.ticker,
            nome: relatorio.nome,
            motivo: 'Já existe relatório com mesmo ticker, nome e data de referência',
          });
          continue;
        }

        const novoRelatorio = await prisma.relatorio.create({
          data: relatorio.dados,
        });
        totalCriados += 1;

        try {
          await prisma.reportFile.create({
            data: {
              reportId: novoRelatorio.id,
              status: 'pendente',
              pdfUrl: novoRelatorio.arquivoPdf ?? null,
            },
          });
        } catch (erroReportFile) {
          console.warn('⚠️ Erro ao registrar status inicial do relatório', {
            relatorioId: novoRelatorio.id,
            error: erroReportFile,
          });
          errosProcessamento.push({
            index: relatorio.index,
            ticker: relatorio.ticker,
            nome: relatorio.nome,
            motivo: 'Relatório criado, mas falhou ao registrar status inicial',
          });
        }
      } catch (erro) {
        console.error('❌ Erro ao processar relatório do lote', {
          ticker: relatorio.ticker,
          nome: relatorio.nome,
          error: erro,
        });
        errosProcessamento.push({
          index: relatorio.index,
          ticker: relatorio.ticker,
          nome: relatorio.nome,
          motivo: erro instanceof Error ? erro.message : 'Erro desconhecido ao salvar relatório',
        });
      }
    }

    const fimProcessamento = new Date();

    const sucessoTotal = errosProcessamento.length === 0;
    const houveSucessoParcial = !sucessoTotal && totalCriados > 0;
    const nenhumRelatorioCriado = totalCriados === 0;

    let message: string;
    if (sucessoTotal) {
      message = `Processamento concluído com sucesso (${totalCriados}/${relatorios.length}).`;
    } else if (nenhumRelatorioCriado) {
      message =
        totalDuplicados > 0
          ? 'Nenhum relatório criado: todos os itens já existiam.'
          : 'Nenhum relatório criado devido a erros durante o processamento.';
    } else {
      message = `Processamento concluído com avisos. Inseridos ${totalCriados} de ${relatorios.length} relatórios.`;
    }

    const resposta = {
      success: sucessoTotal,
      partialSuccess: houveSucessoParcial,
      message,
      resultados: {
        totalRecebidos: relatorios.length,
        totalValidos: validos.length,
        totalCriados,
        totalDuplicados,
        totalComErro: errosProcessamento.length,
        duracaoMs: fimProcessamento.getTime() - inicioProcessamento.getTime(),
      },
      metadata: metadataNormalizada,
      erros: errosProcessamento,
    };

    console.log('📦 Resultado do processamento em lote', {
      totalRecebidos: resposta.resultados.totalRecebidos,
      totalValidos: resposta.resultados.totalValidos,
      totalCriados,
      totalDuplicados,
      totalErros: errosProcessamento.length,
      sucessoTotal,
      houveSucessoParcial,
    });

    const statusCode = sucessoTotal ? 201 : totalDuplicados > 0 ? 409 : 400;

    return NextResponse.json(resposta, { status: statusCode });
  } catch (error) {
    console.error('Erro ao processar lote de relatórios:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor ao processar lote de relatórios',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
