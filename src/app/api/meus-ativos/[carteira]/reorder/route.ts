export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CARTEIRA_MODELS = {
  microCaps: 'userMicroCaps',
  smallCaps: 'userSmallCaps', 
  dividendos: 'userDividendos',
  fiis: 'userFiis',
  dividendosInternacional: 'userDividendosInternacional',
  etfs: 'userEtfs',
  projetoAmerica: 'userProjetoAmerica',
  exteriorStocks: 'userExteriorStocks'
} as const;

async function getAuthenticatedUser(request: NextRequest) {
  const userEmail = request.headers.get('x-user-email');
  
  if (!userEmail) return null;
  
  if (userEmail === 'admin@fatosdobolsa.com') {
    const adminUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, firstName: true, lastName: true, email: true, plan: true, status: true }
    });
    return adminUser;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, firstName: true, lastName: true, email: true, plan: true, status: true }
    });
    return user;
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return null;
  }
}

// POST - Reordenar ativos
export async function POST(request: NextRequest, { params }: { params: { carteira: string } }) {
  try {
    console.log('🔄 INICIO REORDENAÇÃO - Carteira:', params.carteira);
    
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { carteira } = params;
    const { novosAtivos } = await request.json();
    
    console.log('🔄 Nova ordem recebida:', novosAtivos.map((a: any) => a.ticker));
    
    const modelName = CARTEIRA_MODELS[carteira as keyof typeof CARTEIRA_MODELS];
    if (!modelName) {
      return NextResponse.json({ error: 'Carteira inválida' }, { status: 400 });
    }

    const model = (prisma as any)[modelName];
    
    // 🔥 BUSCAR TODOS OS ATIVOS DO BANCO (SEM FILTRO DE USERID)
    console.log('🔍 Buscando TODOS os ativos do banco...');
    const ativosReais = await model.findMany({
      // where: { userId: user.id }, ← REMOVIDO
      select: { id: true, ticker: true }
    });
    
    // 🔥 MAPEAR TICKERS PARA IDs REAIS
    const tickerParaId = new Map();
    ativosReais.forEach((ativo: any) => {
      tickerParaId.set(ativo.ticker, ativo.id);
    });
    
    console.log('📊 Mapeamento ticker → ID:', Object.fromEntries(tickerParaId.entries()));
    
    // 🔥 ATUALIZAR EM SEQUÊNCIA PARA MANTER ORDEM
    console.log('🔄 Atualizando ordem sequencial...');
    
    const baseTime = new Date();
    const atualizacoes = [];
    
    for (let i = 0; i < novosAtivos.length; i++) {
      const ativo = novosAtivos[i];
      const idReal = tickerParaId.get(ativo.ticker);
      
      if (idReal) {
        // Criar timestamps sequenciais (com diferença de 1 segundo)
        const timestampOrdem = new Date(baseTime.getTime() + (i * 1000));
        
        console.log(`📍 Posição ${i + 1}: ${ativo.ticker} (${idReal}) → ${timestampOrdem.toISOString()}`);
        
        atualizacoes.push(
          model.update({
            where: { 
              id: idReal
              // userId: user.id ← REMOVIDO
            },
            data: { 
              editadoEm: timestampOrdem
            }
          })
        );
      } else {
        console.warn(`⚠️ Ativo ${ativo.ticker} não encontrado no banco`);
      }
    }
    
    // Executar todas as atualizações
    await prisma.$transaction(atualizacoes);
    
    // Limpar cache após reordenação
    const chaveCache = `dados_mestres_${carteira}`;
    if (typeof cacheDadosMestres !== 'undefined') {
      cacheDadosMestres.delete(chaveCache);
    }
    
    console.log(`✅ Reordenação da carteira ${carteira} concluída com ${atualizacoes.length} ativos`);
    
    return NextResponse.json({ 
      success: true, 
      message: `${atualizacoes.length} ativos reordenados`,
      novaOrdem: novosAtivos.map((a: any) => a.ticker)
    });
    
  } catch (error) {
    console.error('❌ Erro na reordenação:', error);
    return NextResponse.json({ 
      error: 'Erro ao reordenar',
      details: (error as Error).message 
    }, { status: 500 });
  }
}