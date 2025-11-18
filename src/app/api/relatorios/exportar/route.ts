import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 📥 GET - Exportar todos os relatórios em formato JSON
export async function GET(request: NextRequest) {
  try {
    // Buscar todos os relatórios
    const relatorios = await prisma.relatorio.findMany({
      orderBy: [
        { ticker: 'asc' },
        { dataReferencia: 'desc' }
      ]
    });

    if (relatorios.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nenhum relatório encontrado para exportar' 
        },
        { status: 404 }
      );
    }

    // Converter para formato da interface (mantendo compatibilidade)
    const relatoriosFormatados = relatorios.map(relatorio => ({
      id: relatorio.id,
      ticker: relatorio.ticker,
      nome: relatorio.nome,
      tipo: relatorio.tipo,
      dataReferencia: relatorio.dataReferencia,
      dataUpload: relatorio.dataUpload.toISOString(),
      linkCanva: relatorio.linkCanva || undefined,
      linkExterno: relatorio.linkExterno || undefined,
      tipoVisualizacao: relatorio.tipoVisualizacao,
      arquivoPdf: relatorio.arquivoPdf || undefined,
      nomeArquivoPdf: relatorio.nomeArquivoPdf || undefined,
      tamanhoArquivo: relatorio.tamanhoArquivo || undefined,
      tipoPdf: relatorio.tipoPdf || undefined,
      hashArquivo: relatorio.hashArquivo || undefined,
      solicitarReupload: relatorio.solicitarReupload || undefined
    }));

    // Criar estrutura de backup com metadados
    const backup = {
      metadata: {
        versao: '2.0',
        dataExportacao: new Date().toISOString(),
        totalRelatorios: relatorios.length,
        totalTickers: new Set(relatorios.map(r => r.ticker)).size,
        tipoBackup: 'completo',
        origem: 'API/Prisma',
        compatibilidade: ['IndexedDB', 'localStorage', 'API']
      },
      relatorios: relatoriosFormatados,
      estatisticas: {
        porTicker: Array.from(new Set(relatorios.map(r => r.ticker))).map(ticker => ({
          ticker,
          total: relatorios.filter(r => r.ticker === ticker).length
        })),
        porTipo: {
          trimestral: relatorios.filter(r => r.tipo === 'trimestral').length,
          anual: relatorios.filter(r => r.tipo === 'anual').length,
          apresentacao: relatorios.filter(r => r.tipo === 'apresentacao').length,
          outros: relatorios.filter(r => r.tipo === 'outros').length
        }
      }
    };

    console.log(`📥 Exportação de relatórios executada:`, {
      totalRelatorios: relatorios.length,
      timestamp: new Date().toISOString()
    });

    // Retornar como download de arquivo JSON
    const jsonString = JSON.stringify(backup, null, 2);
    
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="relatorios_backup_${new Date().toISOString().split('T')[0]}.json"`,
        'Content-Length': jsonString.length.toString()
      }
    });

  } catch (error) {
    console.error('Erro ao exportar relatórios:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao exportar relatórios',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}