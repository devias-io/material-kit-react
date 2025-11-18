import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    return NextResponse.json({
      success: true,
      relatorios: relatoriosFormatados,
      total: relatoriosFormatados.length
    });

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
    const dados = await request.json();

    // Validar dados obrigatórios
    if (!dados.ticker || !dados.nome || !dados.tipo) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Campos obrigatórios: ticker, nome, tipo' 
        },
        { status: 400 }
      );
    }

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