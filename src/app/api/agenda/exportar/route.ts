// ==========================================
// 📥 GET /api/agenda/exportar
// ==========================================

// ✅ Adicionar estas importações no topo do arquivo
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ✅ Inicializar o Prisma

export async function GET() {
  try {
    const eventos = await prisma.eventoCorporativo.findMany({
      orderBy: [
        { ticker: 'asc' },
        { data_evento: 'asc' }
      ]
    });
    
    // Gerar CSV
    const header = 'ticker,tipo_evento,titulo,data_evento,descricao,status,prioridade,url_externo,observacoes\n';
    
    const csvContent = eventos
      .map(evento => [
        evento.ticker,
        evento.tipo_evento,
        `"${evento.titulo.replace(/"/g, '""')}"`, // Escapar aspas
        evento.data_evento.toISOString().split('T')[0],
        `"${evento.descricao.replace(/"/g, '""')}"`,
        evento.status,
        evento.prioridade || '',
        evento.url_externo || '',
        evento.observacoes ? `"${evento.observacoes.replace(/"/g, '""')}"` : ''
      ].join(','))
      .join('\n');
    
    const csvData = header + csvContent;
    
    return new Response(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="agenda_corporativa_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
    
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar dados' }, 
      { status: 500 }
    );
  }
}
