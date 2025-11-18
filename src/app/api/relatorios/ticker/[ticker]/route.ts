import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🗑️ DELETE - Excluir todos os relatórios de um ticker específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const ticker = params.ticker?.toUpperCase();

    // Validar ticker
    if (!ticker || ticker.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ticker é obrigatório' 
        },
        { status: 400 }
      );
    }

    // Buscar relatórios do ticker antes da exclusão (para log e contagem)
    const relatoriosDoTicker = await prisma.relatorio.findMany({
      where: {
        ticker: ticker
      },
      select: {
        id: true,
        nome: true,
        tipo: true,
        dataReferencia: true
      }
    });

    if (relatoriosDoTicker.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Nenhum relatório encontrado para o ticker ${ticker}` 
        },
        { status: 404 }
      );
    }

    // Executar exclusão
    const resultado = await prisma.relatorio.deleteMany({
      where: {
        ticker: ticker
      }
    });

    console.log(`🗑️ Relatórios do ticker ${ticker} excluídos:`, {
      ticker,
      quantidadeExcluida: resultado.count,
      relatorios: relatoriosDoTicker.map(r => `${r.nome} (${r.tipo}) - ${r.dataReferencia}`)
    });

    return NextResponse.json({
      success: true,
      message: `Todos os ${resultado.count} relatórios do ticker ${ticker} foram excluídos`,
      ticker,
      relatoriosExcluidos: resultado.count,
      detalhes: relatoriosDoTicker
    });

  } catch (error) {
    console.error('Erro ao excluir relatórios por ticker:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao excluir relatórios do ticker',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// 📊 GET - Buscar relatórios de um ticker específico (funcionalidade extra)
export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const ticker = params.ticker?.toUpperCase();

    if (!ticker) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ticker é obrigatório' 
        },
        { status: 400 }
      );
    }

    const relatorios = await prisma.relatorio.findMany({
      where: {
        ticker: ticker
      },
      orderBy: [
        { dataReferencia: 'desc' },
        { dataUpload: 'desc' }
      ]
    });

    // Converter para formato da interface
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
      solicitarReupload: relatorio.solicitarReupload || undefined
    }));

    return NextResponse.json({
      success: true,
      ticker,
      relatorios: relatoriosFormatados,
      total: relatoriosFormatados.length
    });

  } catch (error) {
    console.error('Erro ao buscar relatórios por ticker:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao buscar relatórios do ticker',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}