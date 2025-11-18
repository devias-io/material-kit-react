import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalEventos = await prisma.eventoCorporativo.count();
    
    const eventos = await prisma.eventoCorporativo.findMany({
      orderBy: { data_evento: 'asc' }
    });
    
    const tickersUnicos = await prisma.eventoCorporativo.groupBy({
      by: ['ticker'],
      _count: { ticker: true }
    });
    
    const ultimoUpload = await prisma.eventoCorporativo.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });
    
    return NextResponse.json({
      totalEventos,
      totalTickers: tickersUnicos.length,
      dataUltimoUpload: ultimoUpload?.createdAt || null,
      eventos
    });
    
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}