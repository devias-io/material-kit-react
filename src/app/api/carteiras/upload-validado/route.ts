// src/app/api/carteiras/upload-validado/route.ts

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log('==================== DEBUG UPLOAD VALIDADO START ====================');
  console.log('🚀 STEP 1: Iniciando upload com dados validados');

  try {
    // STEP 2: VERIFICAR AUTENTICAÇÃO
    console.log('🔐 STEP 2: Verificando autenticação...');
    const session = await auth();
    
    if (!session?.user?.id) {
      console.error('❌ STEP 2: Usuário não autenticado');
      return NextResponse.json({ 
        error: 'Não autorizado',
        details: 'Sessão inválida ou expirada'
      }, { status: 401 });
    }

    console.log(`✅ STEP 2: Usuário autenticado: ${session.user.id}`);

    // STEP 3: VERIFICAR CARTEIRAS EXISTENTES
    console.log('📋 STEP 3: Verificando carteiras existentes...');
    const carteiraExistente = await prisma.carteiraAnalise.findFirst({
      where: { userId: session.user.id }
    });

    if (carteiraExistente) {
      console.log('🚫 STEP 3: Upload rejeitado - usuário já enviou carteira');
      return NextResponse.json({
        error: 'Você já enviou uma carteira para análise.',
        carteiraExistente: {
          id: carteiraExistente.id,
          status: carteiraExistente.status.toLowerCase(),
          nomeArquivo: carteiraExistente.nomeArquivo
        }
      }, { status: 400 });
    }

    console.log('✅ STEP 3: Usuário pode enviar nova carteira');

    // STEP 4: PROCESSAR FORM DATA
    console.log('📤 STEP 4: Processando FormData...');
    const formData = await request.formData();
    
    const dadosValidadosStr = formData.get('dadosValidados');
    const questionarioStr = formData.get('questionario');
    
    if (!dadosValidadosStr) {
      console.error('❌ STEP 4: Dados validados não encontrados');
      return NextResponse.json({
        error: 'Dados validados não enviados',
        details: 'Campo "dadosValidados" não encontrado'
      }, { status: 400 });
    }

    console.log('✅ STEP 4: Dados validados recebidos');

    // STEP 5: PROCESSAR DADOS VALIDADOS
    console.log('🔍 STEP 5: Processando dados validados...');
    
    let dadosValidados, questionario;
    
    try {
      dadosValidados = JSON.parse(dadosValidadosStr.toString());
      questionario = questionarioStr ? JSON.parse(questionarioStr.toString()) : null;
      console.log('✅ STEP 5: JSON válido processado');
    } catch (error) {
      console.error('❌ STEP 5: Erro ao fazer parse do JSON:', error);
      return NextResponse.json({
        error: 'Dados inválidos',
        details: 'Erro ao processar dados JSON'
      }, { status: 400 });
    }

    // STEP 6: CONVERTER DADOS VALIDADOS PARA ESTRUTURA DO BANCO
    console.log('🔄 STEP 6: Convertendo dados para estrutura do banco...');
    
    const dadosCarteira = {
      abas: Object.keys(dadosValidados.portfolioData),
      acoes: [],
      fiis: [],
      rendaFixa: [],
      exterior: [],
      cripto: [],
      reserva: [],
      processedAt: new Date().toISOString(),
      validatedInFrontend: true
    };

    let valorTotal = 0;
    let quantidadeAtivos = 0;

    // Processar cada aba dos dados validados
    Object.entries(dadosValidados.portfolioData).forEach(([sheetName, sheetData]) => {
      console.log(`📊 Convertendo aba: ${sheetName}`);
      
      const rows = sheetData.data || [];
      
      // Processar AÇÕES
      if (sheetName.toLowerCase().includes('ações') || sheetName.toLowerCase() === 'acoes') {
        rows.forEach(row => {
          const values = row.values;
          if (values && values[0] && values[1] && values[2]) {
            const codigo = String(values[0]).trim().toUpperCase();
            const quantidade = parseFloat(values[1]) || 0;
            const precoMedio = parseFloat(values[2]) || 0;
            const cotacaoAtual = parseFloat(values[3]) || precoMedio;
            const valorInvestido = quantidade * precoMedio;
            const valorAtual = quantidade * cotacaoAtual;
            
            if (quantidade > 0 && precoMedio > 0) {
              dadosCarteira.acoes.push({
                codigo,
                nome: codigo,
                tipo: 'ACAO',
                quantidade,
                precoMedio,
                cotacaoAtual,
                valorInvestido,
                valorAtual,
                rentabilidade: valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0,
                pesoCarteira: 0 // Será calculado depois
              });
              valorTotal += valorAtual;
              quantidadeAtivos++;
            }
          }
        });
      }
      
      // Processar FIIs
      if (sheetName.toLowerCase().includes('fii')) {
        rows.forEach(row => {
          const values = row.values;
          if (values && values[0] && values[1] && values[2]) {
            const codigo = String(values[0]).trim().toUpperCase();
            const quantidade = parseFloat(values[1]) || 0;
            const precoMedio = parseFloat(values[2]) || 0;
            const cotacaoAtual = parseFloat(values[3]) || precoMedio;
            const valorInvestido = quantidade * precoMedio;
            const valorAtual = quantidade * cotacaoAtual;
            
            if (quantidade > 0 && precoMedio > 0) {
              dadosCarteira.fiis.push({
                codigo,
                nome: codigo,
                tipo: 'FII',
                quantidade,
                precoMedio,
                cotacaoAtual,
                valorInvestido,
                valorAtual,
                rentabilidade: valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0,
                pesoCarteira: 0
              });
              valorTotal += valorAtual;
              quantidadeAtivos++;
            }
          }
        });
      }
      
      // Processar RENDA FIXA
      if (sheetName.toLowerCase().includes('renda') || sheetName.toLowerCase().includes('fixa')) {
        rows.forEach(row => {
          const values = row.values;
          if (values && values[0] && values[2]) {
            const produto = String(values[0]).trim();
            const banco = values[1] ? String(values[1]).trim() : '';
            const valorInvestido = parseFloat(values[2]) || 0;
            const valorAtual = parseFloat(values[3]) || valorInvestido;
            const vencimento = values[4] ? String(values[4]).trim() : '';
            
            if (valorInvestido > 0) {
              dadosCarteira.rendaFixa.push({
                produto,
                banco,
                tipo: 'RENDA_FIXA',
                valorInvestido,
                valorAtual,
                vencimento,
                rentabilidade: valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0,
                pesoCarteira: 0
              });
              valorTotal += valorAtual;
              quantidadeAtivos++;
            }
          }
        });
      }
      
      // Processar EXTERIOR
      if (sheetName.toLowerCase().includes('exterior')) {
        rows.forEach(row => {
          const values = row.values;
          if (values && values[0] && values[1] && values[2]) {
            const codigo = String(values[0]).trim().toUpperCase();
            const quantidade = parseFloat(values[1]) || 0;
            const precoMedioUSD = parseFloat(values[2]) || 0;
            const cotacaoUSD = parseFloat(values[3]) || precoMedioUSD;
            const taxaCambio = 5.5; // Taxa padrão
            const valorInvestido = quantidade * precoMedioUSD * taxaCambio;
            const valorAtual = quantidade * cotacaoUSD * taxaCambio;
            
            if (quantidade > 0 && precoMedioUSD > 0) {
              dadosCarteira.exterior.push({
                codigo,
                nome: codigo,
                tipo: 'EXTERIOR',
                quantidade,
                precoMedioUSD,
                cotacaoUSD,
                taxaCambio,
                valorInvestido,
                valorAtual,
                rentabilidade: valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0,
                pesoCarteira: 0
              });
              valorTotal += valorAtual;
              quantidadeAtivos++;
            }
          }
        });
      }
      
      // Processar CRIPTO
      if (sheetName.toLowerCase().includes('cripto')) {
        rows.forEach(row => {
          const values = row.values;
          if (values && values[0] && values[1] && values[2]) {
            const criptomoeda = String(values[0]).trim();
            const quantidade = parseFloat(values[1]) || 0;
            const precoMedio = parseFloat(values[2]) || 0;
            const valorAtual = parseFloat(values[3]) || (quantidade * precoMedio);
            const exchange = values[4] ? String(values[4]).trim() : '';
            
            if (quantidade > 0 && precoMedio > 0) {
              dadosCarteira.cripto.push({
                criptomoeda,
                tipo: 'CRIPTO',
                quantidade,
                precoMedio,
                valorAtual,
                exchange,
                rentabilidade: (quantidade * precoMedio) > 0 ? ((valorAtual - (quantidade * precoMedio)) / (quantidade * precoMedio)) * 100 : 0,
                pesoCarteira: 0
              });
              valorTotal += valorAtual;
              quantidadeAtivos++;
            }
          }
        });
      }
      
      // Processar RESERVA
      if (sheetName.toLowerCase().includes('reserva')) {
        rows.forEach(row => {
          const values = row.values;
          if (values && values[0] && values[2]) {
            const onde = String(values[0]).trim();
            const banco = values[1] ? String(values[1]).trim() : '';
            const valor = parseFloat(values[2]) || 0;
            const observacoes = values[3] ? String(values[3]).trim() : '';
            
            if (valor > 0) {
              dadosCarteira.reserva.push({
                onde,
                banco,
                tipo: 'RESERVA',
                valor,
                observacoes
              });
              // Reserva não conta no valor total da carteira
            }
          }
        });
      }
    });

    // STEP 7: CALCULAR PERCENTUAIS
    console.log('📊 STEP 7: Calculando percentuais...');
    
    if (valorTotal > 0) {
      dadosCarteira.acoes = dadosCarteira.acoes.map(ativo => ({
        ...ativo,
        pesoCarteira: (ativo.valorAtual / valorTotal) * 100
      }));

      dadosCarteira.fiis = dadosCarteira.fiis.map(ativo => ({
        ...ativo,
        pesoCarteira: (ativo.valorAtual / valorTotal) * 100
      }));

      dadosCarteira.exterior = dadosCarteira.exterior.map(ativo => ({
        ...ativo,
        pesoCarteira: (ativo.valorAtual / valorTotal) * 100
      }));

      dadosCarteira.rendaFixa = dadosCarteira.rendaFixa.map(item => ({
        ...item,
        pesoCarteira: (item.valorAtual / valorTotal) * 100
      }));

      dadosCarteira.cripto = dadosCarteira.cripto.map(item => ({
        ...item,
        pesoCarteira: (item.valorAtual / valorTotal) * 100
      }));
    }

    console.log(`✅ STEP 7: Percentuais calculados!`);
    console.log(`📊 Resumo: ${quantidadeAtivos} ativos, R$ ${valorTotal.toFixed(2)}`);
    console.log(`📈 Ações: ${dadosCarteira.acoes.length}`);
    console.log(`🏘️ FIIs: ${dadosCarteira.fiis.length}`);
    console.log(`💰 Renda Fixa: ${dadosCarteira.rendaFixa.length}`);
    console.log(`🌎 Exterior: ${dadosCarteira.exterior.length}`);
    console.log(`₿ Cripto: ${dadosCarteira.cripto.length}`);
    console.log(`🏦 Reserva: ${dadosCarteira.reserva.length}`);

    // STEP 8: SALVAR NO BANCO
    console.log('🗄️ STEP 8: Salvando no banco...');
    console.log('📝 Dados que serão salvos:', {
      userId: session.user.id,
      nomeArquivo: dadosValidados.fileName,
      valorTotal,
      quantidadeAtivos,
      status: 'PENDENTE'
    });
    
    try {
      const novaCarteira = await prisma.carteiraAnalise.create({
        data: {
          userId: session.user.id,
          nomeArquivo: dadosValidados.fileName,
          arquivoUrl: `validated/${dadosValidados.fileName}`, // Indica que veio validado
          valorTotal: valorTotal,
          quantidadeAtivos: quantidadeAtivos,
          status: 'PENDENTE',
          dadosEstruturados: JSON.stringify({
            ...dadosCarteira,
            questionario: questionario,
            validatedData: true,
            originalData: dadosValidados.portfolioData, // Dados originais da validação
            processedAt: dadosValidados.processedAt
          })
        }
      });

      console.log('✅ STEP 8: Carteira salva com sucesso:', novaCarteira.id);
      console.log('==================== DEBUG UPLOAD VALIDADO SUCCESS ====================');

      return NextResponse.json({
        success: true,
        message: 'Dados validados enviados com sucesso!',
        carteiraId: novaCarteira.id,
        resumo: {
          valorTotal: valorTotal,
          quantidadeAtivos: quantidadeAtivos,
          abasProcessadas: Object.keys(dadosValidados.portfolioData).length,
          dadosValidados: true,
          questionarioIncluido: !!questionario,
          nomeArquivo: dadosValidados.fileName,
          distribuicao: {
            acoes: dadosCarteira.acoes.length,
            fiis: dadosCarteira.fiis.length,
            rendaFixa: dadosCarteira.rendaFixa.length,
            exterior: dadosCarteira.exterior.length,
            cripto: dadosCarteira.cripto.length,
            reserva: dadosCarteira.reserva.length
          }
        }
      });

    } catch (dbError) {
      console.error('❌ STEP 8: ERRO no banco:', dbError);
      console.error('❌ Mensagem completa:', dbError.message);
      console.log('==================== DEBUG UPLOAD VALIDADO FAILED ====================');
      
      return NextResponse.json({
        error: 'Erro ao salvar no banco de dados',
        details: dbError.message,
        step: 'database_save'
      }, { status: 500 });
    }

  } catch (globalError) {
    console.error('💥 ERRO GLOBAL:', globalError);
    console.log('==================== DEBUG UPLOAD VALIDADO ERROR ====================');
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: globalError.message
    }, { status: 500 });
  }
}