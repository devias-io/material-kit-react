import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { eventos, metadata } = await request.json();
    
    if (!eventos || !Array.isArray(eventos) || eventos.length === 0) {
      return NextResponse.json(
        { error: 'Dados de eventos inválidos' }, 
        { status: 400 }
      );
    }
    
    const eventosParaInserir = eventos.map((evento) => ({
      ticker: evento.ticker.toUpperCase(),
      tipo_evento: evento.tipo_evento,
      titulo: evento.titulo,
      data_evento: new Date(evento.data_evento),
      descricao: evento.descricao,
      status: evento.status,
      prioridade: evento.prioridade || null,
      url_externo: evento.url_externo || null,
      observacoes: evento.observacoes || null
    }));
    
    const resultado = await prisma.eventoCorporativo.createMany({
      data: eventosParaInserir,
      skipDuplicates: true
    });
    
    return NextResponse.json({
      success: true,
      eventosInseridos: resultado.count,
      metadata
    });
    
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro ao processar upload' }, 
      { status: 500 }
    );
  }
}