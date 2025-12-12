import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';

const relatorioSchema = z.object({
  ticker: z.string().min(1),
  nome: z.string().min(1),
  tipo: z.enum(['trimestral', 'anual', 'apresentacao', 'outros']),
  dataReferencia: z.string().optional(),
  linkCanva: z.string().url().optional().nullable(),
  linkExterno: z.string().url().optional().nullable(),
  tipoVisualizacao: z.enum(['iframe', 'canva', 'link', 'pdf']).optional(),
  arquivoPdf: z.string().optional().nullable(),
  nomeArquivoPdf: z.string().optional().nullable(),
  tamanhoArquivo: z.number().optional().nullable(),
  tipoPdf: z.enum(['base64', 'referencia']).optional().nullable(),
  hashArquivo: z.string().optional().nullable(),
  solicitarReupload: z.boolean().optional(),
});

// 📊 GET - Listar todos os relatórios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    let relatorios;
    
    if (ticker) {
      // Buscar relatórios de um ticker específico
      relatorios = await prisma.relatorio.findMany({
        where: {
          ticker: ticker.toUpperCase()
        },
        orderBy: [
          { dataReferencia: 'desc' },
          { dataUpload: 'desc' }
        ]
      });
    } else {
      // Buscar todos os relatórios
      relatorios = await prisma.relatorio.findMany({
        orderBy: [
          { ticker: 'asc' },
          { dataReferencia: 'desc' }
        ],
        include: {
          reportFiles: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    }

    // Converter dados do Prisma para formato da interface
    const relatoriosFormatados = relatorios.map(relatorio => ({
      id: relatorio.id,
      ticker: relatorio.ticker,
      nome: relatorio.nome,
      tipo: relatorio.tipo as 'trimestral' | 'anual' | 'apresentacao' | 'outros',
      dataReferencia: relatorio.dataReferencia,
      dataUpload: relatorio.dataUpload.toISOString(),
      linkCanva: relatorio.linkCanva || undefined,
      linkExterno: relatorio.linkExterno || undefined,
      tipoVisualizacao: relatorio.tipoVisualizacao as 'iframe' | 'canva' | 'link' | 'pdf',
      arquivoPdf: relatorio.arquivoPdf || undefined,
      nomeArquivoPdf: relatorio.nomeArquivoPdf || undefined,
      tamanhoArquivo: relatorio.tamanhoArquivo || undefined,
      tipoPdf: (relatorio.tipoPdf as 'base64' | 'referencia') || undefined,
      hashArquivo: relatorio.hashArquivo || undefined,
      solicitarReupload: relatorio.solicitarReupload || undefined,
      status: relatorio.reportFiles[0]?.status || undefined,
      pdfUrl: relatorio.reportFiles[0]?.pdfUrl || undefined,
    }));

    return NextResponse.json(
      {
        success: true,
        relatorios: relatoriosFormatados,
        total: relatoriosFormatados.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120',
        },
      }
    );

  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao buscar relatórios',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// ➕ POST - Criar novo relatório
export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = `relatorios:create:${request.ip ?? 'unknown'}`;
    const rateLimit = await enforceRateLimit(rateLimitKey, 20, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Muitas requisições. Tente novamente em instantes.',
        },
        {
          status: 429,
          headers: rateLimit.retryAfter
            ? { 'Retry-After': rateLimit.retryAfter.toString() }
            : undefined,
        }
      );
    }

    const payload = await request.json();
    const parsed = relatorioSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Payload inválido', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const dados = parsed.data;

    // Criar relatório no banco
    const novoRelatorio = await prisma.relatorio.create({
      data: {
        ticker: dados.ticker.toUpperCase(),
        nome: dados.nome,
        tipo: dados.tipo,
        dataReferencia: dados.dataReferencia || '',
        dataUpload: new Date(),
        linkCanva: dados.linkCanva || null,
        linkExterno: dados.linkExterno || null,
        tipoVisualizacao: dados.tipoVisualizacao || 'iframe',
        arquivoPdf: dados.arquivoPdf || null,
        nomeArquivoPdf: dados.nomeArquivoPdf || null,
        tamanhoArquivo: dados.tamanhoArquivo || null,
        tipoPdf: dados.tipoPdf || null,
        hashArquivo: dados.hashArquivo || null,
        solicitarReupload: dados.solicitarReupload || false,
      },
      include: { reportFiles: true },
    });

    // Registrar status inicial como "pendente"
    await prisma.reportFile.create({
      data: {
        reportId: novoRelatorio.id,
        status: 'pendente',
        pdfUrl: novoRelatorio.arquivoPdf || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Relatório criado com sucesso',
      relatorio: {
        id: novoRelatorio.id,
        ticker: novoRelatorio.ticker,
        nome: novoRelatorio.nome,
        tipo: novoRelatorio.tipo,
        dataReferencia: novoRelatorio.dataReferencia,
        dataUpload: novoRelatorio.dataUpload.toISOString(),
        linkCanva: novoRelatorio.linkCanva || undefined,
        linkExterno: novoRelatorio.linkExterno || undefined,
        tipoVisualizacao: novoRelatorio.tipoVisualizacao,
        arquivoPdf: novoRelatorio.arquivoPdf || undefined,
        nomeArquivoPdf: novoRelatorio.nomeArquivoPdf || undefined,
        tamanhoArquivo: novoRelatorio.tamanhoArquivo || undefined,
        tipoPdf: novoRelatorio.tipoPdf || undefined,
        hashArquivo: novoRelatorio.hashArquivo || undefined,
        solicitarReupload: novoRelatorio.solicitarReupload || undefined,
        status: 'pendente',
        pdfUrl: novoRelatorio.arquivoPdf || undefined,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar relatório:', error);
    
    // Tratar erro de duplicação se existir
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Já existe um relatório com esses dados' 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao criar relatório',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}