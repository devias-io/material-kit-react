// 📁 /src/app/api/proventos/[ticker]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const { ticker } = params;
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker inválido' },
        { status: 400 }
      );
    }
    
    // 📊 BUSCAR PROVENTOS DE UM TICKER ESPECÍFICO
    const proventos = await prisma.provento.findMany({
      where: { 
        ticker: ticker.toUpperCase() 
      },
      orderBy: { dataObj: 'desc' }
    });
    
    return NextResponse.json(proventos);
  } catch (error) {
    console.error(`Erro ao buscar proventos:`, error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}