// src/app/api/carteiras/upload/route.ts

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  console.log('==================== DEBUG UPLOAD START ====================');
  console.log('🚀 STEP 1: Iniciando upload de carteira');

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
    
    const file: File | null = formData.get('arquivo') as unknown as File;
    const questionarioData = formData.get('questionario');
    
    if (!file) {
      console.error('❌ STEP 4: Nenhum arquivo encontrado');
      return NextResponse.json({
        error: 'Nenhum arquivo enviado',
        details: 'Campo "arquivo" não encontrado'
      }, { status: 400 });
    }

    console.log(`✅ STEP 4: Arquivo recebido: ${file.name} (${file.size} bytes)`);

    // STEP 5: VALIDAR ARQUIVO
    console.log('🔍 STEP 5: Validando arquivo...');
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ 
        error: 'Formato de arquivo inválido. Use apenas .xlsx ou .xls'
      }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Máximo 10MB'
      }, { status: 400 });
    }

    console.log('✅ STEP 5: Arquivo válido');

    // STEP 6: PROCESSAR QUESTIONÁRIO
    let questionario = null;
    if (questionarioData) {
      try {
        const questionarioStr = typeof questionarioData === 'string' 
          ? questionarioData 
          : questionarioData.toString();
        questionario = JSON.parse(questionarioStr);
        console.log('✅ STEP 6: Questionário processado');
      } catch (error) {
        console.error('❌ STEP 6: Erro no questionário:', error);
      }
    }

    // STEP 7: PROCESSAR EXCEL
    console.log('📊 STEP 7: Processando planilha Excel...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      cellStyles: true,
      cellFormulas: true,
      cellDates: true
    });
    
    console.log('✅ STEP 7: Excel processado. Abas:', workbook.SheetNames);

    // STEP 8: EXTRAIR DADOS DO EXCEL CORRETAMENTE
    console.log('🔄 STEP 8: Extraindo dados das abas...');
    
    const dadosCarteira = {
      abas: workbook.SheetNames,
      acoes: [],
      fiis: [],
      rendaFixa: [],
      exterior: [],
      cripto: [],
      reserva: [],
      processedAt: new Date().toISOString()
    };

    let valorTotal = 0;
    let quantidadeAtivos = 0;

    // Processar cada aba do Excel
    for (const sheetName of workbook.SheetNames) {
      try {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`📊 Processando aba: ${sheetName} (${data.length} linhas)`);
        
        // Processar AÇÕES
        if (sheetName.toLowerCase().includes('ações') || sheetName.toLowerCase().includes('acoes')) {
          for (let i = 6; i < Math.min(data.length, 25); i++) {
            const row = data[i];
            if (row && row[0] && row[2] && row[3]) { // Código, Quantidade, Preço
              const codigo = String(row[0]).trim().toUpperCase();
              const nome = row[1] ? String(row[1]).trim() : '';
              const quantidade = parseFloat(row[2]) || 0;
              const precoMedio = parseFloat(row[3]) || 0;
              const cotacaoAtual = parseFloat(row[4]) || precoMedio;
              const valorInvestido = quantidade * precoMedio;
              const valorAtual = quantidade * cotacaoAtual;
              
              if (quantidade > 0 && precoMedio > 0) {
                dadosCarteira.acoes.push({
                  codigo,
                  nome,
                  tipo: 'ACAO',
                  quantidade,
                  precoMedio,
                  cotacaoAtual,
                  valorInvestido,
                  valorAtual,
                  rentabilidade: valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0
                });
                valorTotal += valorAtual;
                quantidadeAtivos++;
              }
            }
          }
        }
        
        // Processar FIIs
        if (sheetName.toLowerCase().includes('fii')) {
          for (let i = 6; i < Math.min(data.length, 25); i++) {
            const row = data[i];
            if (row && row[0] && row[2] && row[3]) {
              const codigo = String(row[0]).trim().toUpperCase();
              const nome = row[1] ? String(row[1]).trim() : '';
              const quantidade = parseFloat(row[2]) || 0;
              const precoMedio = parseFloat(row[3]) || 0;
              const cotacaoAtual = parseFloat(row[4]) || precoMedio;
              const valorInvestido = quantidade * precoMedio;
              const valorAtual = quantidade * cotacaoAtual;
              
              if (quantidade > 0 && precoMedio > 0) {
                dadosCarteira.fiis.push({
                  codigo,
                  nome,
                  tipo: 'FII',
                  quantidade,
                  precoMedio,
                  cotacaoAtual,
                  valorInvestido,
                  valorAtual,
                  rentabilidade: valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0
                });
                valorTotal += valorAtual;
                quantidadeAtivos++;
              }
            }
          }
        }
        
        // Processar RENDA FIXA
        if (sheetName.toLowerCase().includes('renda') || sheetName.toLowerCase().includes('fixa')) {
          for (let i = 6; i < Math.min(data.length, 20); i++) {
            const row = data[i];
            if (row && row[0] && row[2]) {
              const produto = String(row[0]).trim();
              const banco = row[1] ? String(row[1]).trim() : '';
              const valorInvestido = parseFloat(row[2]) || 0;
              const valorAtual = parseFloat(row[3]) || valorInvestido;
              const vencimento = row[4] ? String(row[4]).trim() : '';
              
              if (valorInvestido > 0) {
                dadosCarteira.rendaFixa.push({
                  produto,
                  banco,
                  tipo: 'RENDA_FIXA',
                  valorInvestido,
                  valorAtual,
                  vencimento,
                  rentabilidade: valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0
                });
                valorTotal += valorAtual;
                quantidadeAtivos++;
              }
            }
          }
        }
        
        // Processar EXTERIOR
        if (sheetName.toLowerCase().includes('exterior')) {
          for (let i = 6; i < Math.min(data.length, 19); i++) {
            const row = data[i];
            if (row && row[0] && row[2] && row[3]) {
              const codigo = String(row[0]).trim().toUpperCase();
              const nome = row[1] ? String(row[1]).trim() : '';
              const quantidade = parseFloat(row[2]) || 0;
              const precoMedioUSD = parseFloat(row[3]) || 0;
              const cotacaoUSD = parseFloat(row[4]) || precoMedioUSD;
              const taxaCambio = 5.5; // Taxa fixa no modelo
              const valorInvestido = quantidade * precoMedioUSD * taxaCambio;
              const valorAtual = quantidade * cotacaoUSD * taxaCambio;
              
              if (quantidade > 0 && precoMedioUSD > 0) {
                dadosCarteira.exterior.push({
                  codigo,
                  nome,
                  tipo: 'EXTERIOR',
                  quantidade,
                  precoMedioUSD,
                  cotacaoUSD,
                  taxaCambio,
                  valorInvestido,
                  valorAtual,
                  rentabilidade: valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0
                });
                valorTotal += valorAtual;
                quantidadeAtivos++;
              }
            }
          }
        }
        
        // Processar CRIPTO
        if (sheetName.toLowerCase().includes('cripto')) {
          for (let i = 6; i < Math.min(data.length, 16); i++) {
            const row = data[i];
            if (row && row[0] && row[1] && row[2]) {
              const criptomoeda = String(row[0]).trim();
              const quantidade = parseFloat(row[1]) || 0;
              const precoMedio = parseFloat(row[2]) || 0;
              const valorAtual = parseFloat(row[3]) || (quantidade * precoMedio);
              const exchange = row[4] ? String(row[4]).trim() : '';
              
              if (quantidade > 0 && precoMedio > 0) {
                dadosCarteira.cripto.push({
                  criptomoeda,
                  tipo: 'CRIPTO',
                  quantidade,
                  precoMedio,
                  valorAtual,
                  exchange,
                  rentabilidade: (quantidade * precoMedio) > 0 ? ((valorAtual - (quantidade * precoMedio)) / (quantidade * precoMedio)) * 100 : 0
                });
                valorTotal += valorAtual;
                quantidadeAtivos++;
              }
            }
          }
        }
        
        // Processar RESERVA
        if (sheetName.toLowerCase().includes('reserva')) {
          for (let i = 6; i < Math.min(data.length, 16); i++) {
            const row = data[i];
            if (row && row[0] && row[2]) {
              const onde = String(row[0]).trim();
              const banco = row[1] ? String(row[1]).trim() : '';
              const valor = parseFloat(row[2]) || 0;
              const observacoes = row[3] ? String(row[3]).trim() : '';
              
              if (valor > 0) {
                dadosCarteira.reserva.push({
                  onde,
                  banco,
                  tipo: 'RESERVA',
                  valor,
                  observacoes
                });
                // Reserva não conta no valor total da carteira de investimentos
              }
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar aba ${sheetName}:`, error);
      }
    }

    // Calcular percentuais
    dadosCarteira.acoes = dadosCarteira.acoes.map(ativo => ({
      ...ativo,
      pesoCarteira: valorTotal > 0 ? (ativo.valorAtual / valorTotal) * 100 : 0
    }));

    dadosCarteira.fiis = dadosCarteira.fiis.map(ativo => ({
      ...ativo,
      pesoCarteira: valorTotal > 0 ? (ativo.valorAtual / valorTotal) * 100 : 0
    }));

    dadosCarteira.exterior = dadosCarteira.exterior.map(ativo => ({
      ...ativo,
      pesoCarteira: valorTotal > 0 ? (ativo.valorAtual / valorTotal) * 100 : 0
    }));

    dadosCarteira.rendaFixa = dadosCarteira.rendaFixa.map(item => ({
      ...item,
      pesoCarteira: valorTotal > 0 ? (item.valorAtual / valorTotal) * 100 : 0
    }));

    dadosCarteira.cripto = dadosCarteira.cripto.map(item => ({
      ...item,
      pesoCarteira: valorTotal > 0 ? (item.valorAtual / valorTotal) * 100 : 0
    }));

    console.log(`✅ STEP 8: Dados extraídos com sucesso!`);
    console.log(`📊 Resumo: ${quantidadeAtivos} ativos, R$ ${valorTotal.toFixed(2)}`);
    console.log(`📈 Ações: ${dadosCarteira.acoes.length}`);
    console.log(`🏘️ FIIs: ${dadosCarteira.fiis.length}`);
    console.log(`💰 Renda Fixa: ${dadosCarteira.rendaFixa.length}`);
    console.log(`🌎 Exterior: ${dadosCarteira.exterior.length}`);
    console.log(`₿ Cripto: ${dadosCarteira.cripto.length}`);
    console.log(`🏦 Reserva: ${dadosCarteira.reserva.length}`);

    // Valores finais calculados
    const valorFinal = valorTotal;
    const quantidadeFinal = quantidadeAtivos;

    // STEP 9: SALVAR NO BANCO - CORREÇÃO DEFINITIVA
    console.log('🗄️ STEP 9: Salvando no banco...');
    console.log('📝 Dados que serão salvos:', {
      userId: session.user.id,
      nomeArquivo: file.name,
      arquivoUrl: `uploads/${file.name}`, // VALOR CORRETO PARA arquivoUrl
      valorTotal,
      quantidadeAtivos,
      status: 'PENDENTE'
    });
    
    try {
      const novaCarteira = await prisma.carteiraAnalise.create({
        data: {
          userId: session.user.id,
          nomeArquivo: file.name,
          arquivoUrl: `uploads/${file.name}`,
          valorTotal: valorFinal,
          quantidadeAtivos: quantidadeFinal,
          status: 'PENDENTE',
          dadosEstruturados: JSON.stringify(dadosCarteira) // Salvar dados extraídos
        }
      });

      console.log('✅ STEP 9: Carteira salva com sucesso:', novaCarteira.id);
      console.log('==================== DEBUG UPLOAD SUCCESS ====================');

      return NextResponse.json({
        success: true,
        message: 'Carteira enviada com sucesso!',
        carteiraId: novaCarteira.id,
        resumo: {
          valorTotal: valorTotal,
          quantidadeAtivos: quantidadeAtivos,
          arquivoProcessado: true,
          questionarioIncluido: !!questionario,
          nomeArquivo: file.name
        }
      });

    } catch (dbError) {
      console.error('❌ STEP 9: ERRO FINAL no banco:', dbError);
      console.error('❌ Mensagem completa:', dbError.message);
      console.log('==================== DEBUG UPLOAD FAILED ====================');
      
      return NextResponse.json({
        error: 'Erro ao salvar no banco de dados',
        details: dbError.message,
        step: 'database_save_final'
      }, { status: 500 });
    }

  } catch (globalError) {
    console.error('💥 ERRO GLOBAL:', globalError);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: globalError.message
    }, { status: 500 });
  }
}