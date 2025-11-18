import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🗑️ DELETE - Limpar todos os relatórios do sistema
export async function DELETE(request: NextRequest) {
  try {
    // Obter contagem antes da exclusão
    const contagemAntes = await prisma.relatorio.count();
    
    if (contagemAntes === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum relatório para excluir',
        relatoriosExcluidos: 0
      });
    }

    // Executar limpeza completa
    const resultado = await prisma.relatorio.deleteMany({});

    console.log(`🗑️ Limpeza completa de relatórios executada:`, {
      relatoriosExcluidos: resultado.count,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Todos os ${resultado.count} relatórios foram removidos do sistema`,
      relatoriosExcluidos: resultado.count,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao limpar todos os relatórios:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao limpar relatórios',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}