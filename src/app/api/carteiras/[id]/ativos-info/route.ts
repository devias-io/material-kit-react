// src/app/api/carteiras/[id]/ativos-info/route.ts

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  console.log('📊 Buscando ativos da carteira:', params.id);

  try {
    const session = await auth();
    
    if (!session?.user?.plan || session.user.plan !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // 1. BUSCAR CARTEIRA
    const carteira = await prisma.carteiraAnalise.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!carteira) {
      return NextResponse.json({ error: 'Carteira não encontrada' }, { status: 404 });
    }

    console.log('✅ Carteira encontrada:', carteira.nomeArquivo);

    // 2. EXTRAIR E DEBUGAR DADOS DO EXCEL
    let dadosExcel = null;
    if (carteira.dadosEstruturados) {
      try {
        dadosExcel = JSON.parse(carteira.dadosEstruturados);
        
        // DEBUG COMPLETO dos dados salvos
        console.log('📋 ESTRUTURA COMPLETA dos dados salvos:', JSON.stringify(dadosExcel, null, 2));
        console.log('📋 Chaves principais:', Object.keys(dadosExcel));
        
        if (dadosExcel.acoes) {
          console.log('📈 AÇÕES encontradas:', dadosExcel.acoes.length);
          dadosExcel.acoes.forEach((acao, idx) => {
            console.log(`  ${idx + 1}. ${acao.codigo} - ${acao.nome} - R$ ${acao.valorAtual}`);
          });
        } else {
          console.log('❌ AÇÕES: campo não existe ou está vazio');
        }
        
        if (dadosExcel.fiis) {
          console.log('🏘️ FIIs encontrados:', dadosExcel.fiis.length);
          dadosExcel.fiis.forEach((fii, idx) => {
            console.log(`  ${idx + 1}. ${fii.codigo} - ${fii.nome} - R$ ${fii.valorAtual}`);
          });
        } else {
          console.log('❌ FIIs: campo não existe ou está vazio');
        }
        
        if (dadosExcel.exterior) {
          console.log('🌎 EXTERIOR encontrados:', dadosExcel.exterior.length);
        }
        
        if (dadosExcel.rendaFixa) {
          console.log('💰 RENDA FIXA encontrados:', dadosExcel.rendaFixa.length);
        }
        
        if (dadosExcel.cripto) {
          console.log('₿ CRIPTO encontrados:', dadosExcel.cripto.length);
        }
        
      } catch (error) {
        console.error('❌ Erro ao parsear dados:', error);
        return NextResponse.json({ error: 'Dados corrompidos' }, { status: 500 });
      }
    }

    if (!dadosExcel) {
      return NextResponse.json({ error: 'Dados do Excel não encontrados' }, { status: 404 });
    }

    // 3. CONSOLIDAR TODOS OS ATIVOS (não apenas ações e FIIs)
    const ativosDoExcel = [];

    // Ações
    if (dadosExcel.acoes && Array.isArray(dadosExcel.acoes)) {
      dadosExcel.acoes.forEach(acao => {
        ativosDoExcel.push({
          codigo: acao.codigo,
          nome: acao.nome,
          tipo: 'ACAO',
          quantidade: acao.quantidade,
          valorAtual: acao.valorAtual,
          pesoCarteira: acao.pesoCarteira
        });
      });
    }

    // FIIs
    if (dadosExcel.fiis && Array.isArray(dadosExcel.fiis)) {
      dadosExcel.fiis.forEach(fii => {
        ativosDoExcel.push({
          codigo: fii.codigo,
          nome: fii.nome,
          tipo: 'FII',
          quantidade: fii.quantidade,
          valorAtual: fii.valorAtual,
          pesoCarteira: fii.pesoCarteira
        });
      });
    }

    // Renda Fixa
    if (dadosExcel.rendaFixa && Array.isArray(dadosExcel.rendaFixa)) {
      dadosExcel.rendaFixa.forEach(rf => {
        ativosDoExcel.push({
          codigo: rf.produto,
          nome: rf.banco,
          tipo: 'RENDA_FIXA',
          quantidade: 1, // Renda fixa não tem quantidade
          valorAtual: rf.valorAtual,
          pesoCarteira: rf.pesoCarteira,
          vencimento: rf.vencimento
        });
      });
    }

    // Exterior
    if (dadosExcel.exterior && Array.isArray(dadosExcel.exterior)) {
      dadosExcel.exterior.forEach(ext => {
        ativosDoExcel.push({
          codigo: ext.codigo,
          nome: ext.nome,
          tipo: 'EXTERIOR',
          quantidade: ext.quantidade,
          valorAtual: ext.valorAtual,
          pesoCarteira: ext.pesoCarteira
        });
      });
    }

    // Cripto
    if (dadosExcel.cripto && Array.isArray(dadosExcel.cripto)) {
      dadosExcel.cripto.forEach(cripto => {
        ativosDoExcel.push({
          codigo: cripto.criptomoeda,
          nome: cripto.exchange,
          tipo: 'CRIPTO',
          quantidade: cripto.quantidade,
          valorAtual: cripto.valorAtual,
          pesoCarteira: cripto.pesoCarteira
        });
      });
    }

    console.log('📊 Ativos extraídos:', ativosDoExcel.length);

    // 4. BUSCAR INFORMAÇÕES NO SISTEMA
    const codigosParaBuscar = ativosDoExcel.map(ativo => ativo.codigo);
    
    const informacoesDoSistema = await prisma.ativoInformacao.findMany({
      where: {
        codigo: { in: codigosParaBuscar }
      }
    });

    console.log('📋 Informações encontradas:', informacoesDoSistema.length);

    // 5. COMBINAR DADOS
    const ativosCombinados = ativosDoExcel.map(ativoExcel => {
      const infoSistema = informacoesDoSistema.find(info => info.codigo === ativoExcel.codigo);
      
      return {
        codigo: ativoExcel.codigo,
        nome: ativoExcel.nome,
        tipo: ativoExcel.tipo,
        quantidade: ativoExcel.quantidade,
        valorAtual: ativoExcel.valorAtual,
        pesoCarteira: ativoExcel.pesoCarteira,
        valorTotal: ativoExcel.valorAtual,
        temInformacao: !!infoSistema,
        informacao: infoSistema ? {
          qualidade: infoSistema.qualidade,
          risco: infoSistema.risco,
          recomendacao: infoSistema.recomendacao,
          setor: infoSistema.setor,
          nome: infoSistema.nome,
          fundamentosResumo: infoSistema.fundamentosResumo,
          pontosFortes: infoSistema.pontosFortes ? JSON.parse(infoSistema.pontosFortes) : [],
          pontosFracos: infoSistema.pontosFracos ? JSON.parse(infoSistema.pontosFracos) : [],
          observacoes: infoSistema.observacoes,
          dividend_yield: infoSistema.dividend_yield
        } : null
      };
    });

    // 6. CALCULAR ESTATÍSTICAS
    const totalAtivos = ativosCombinados.length;
    const ativosComInfo = ativosCombinados.filter(a => a.temInformacao).length;
    const cobertura = totalAtivos > 0 ? Math.round((ativosComInfo / totalAtivos) * 100) : 0;

    console.log('✅ Dados combinados:', { totalAtivos, ativosComInfo, cobertura });

    return NextResponse.json({
      success: true,
      ativos: ativosCombinados,
      resumo: {
        totalAtivos,
        valorTotal: carteira.valorTotal,
        comInformacao: ativosComInfo,
        semInformacao: totalAtivos - ativosComInfo,
        cobertura
      },
      carteira: {
        id: carteira.id,
        nomeArquivo: carteira.nomeArquivo,
        usuario: carteira.user
      }
    });

  } catch (error) {
    console.error('Erro ao buscar ativos:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}