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
    console.log('🔄 STEP 8: Localizando aba principal...');

    const requiredHeaders = ['ativo', 'categoria', 'quantidade', 'precoMedio'];

    const normalizeText = (value: unknown) => {
      if (value === undefined || value === null) return '';
      return String(value)
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
    };

    const headerAlias: Record<string, string> = {
      ativo: 'ativo',
      ticker: 'ativo',
      codigo: 'ativo',
      codigoticker: 'ativo',
      papel: 'ativo',
      categoria: 'categoria',
      classificacao: 'categoria',
      classe: 'categoria',
      segmento: 'categoria',
      setor: 'categoria',
      qtde: 'quantidade',
      quantidade: 'quantidade',
      qtd: 'quantidade',
      posicao: 'quantidade',
      preco: 'precoMedio',
      precomedio: 'precoMedio',
      precomedioaplicado: 'precoMedio',
      pm: 'precoMedio',
      precoteto: 'precoMedio',
      precopago: 'precoMedio',
      precocompra: 'precoMedio',
      cotacao: 'precoAtual',
      cotacaoatual: 'precoAtual',
      precoatual: 'precoAtual',
      precounitario: 'precoAtual',
      valorinvestido: 'valorInvestido',
      valoraplicado: 'valorInvestido',
      valortotal: 'valorInvestido',
      custo: 'valorInvestido',
      valoratual: 'valorAtual',
      valormercado: 'valorAtual',
      nome: 'nome',
      descricao: 'nome',
      empresa: 'nome',
      ativoexterior: 'ativo',
      simbolo: 'ativo'
    };

    const localizarAbaPrincipal = () => {
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const linhas = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: null });

        for (let i = 0; i < linhas.length; i++) {
          const linha = linhas[i];
          if (!linha || linha.length === 0) continue;

          const headersEncontrados = new Set<string>();
          linha.forEach(celula => {
            const normalizado = normalizeText(celula);
            if (normalizado && headerAlias[normalizado]) {
              headersEncontrados.add(headerAlias[normalizado]);
            }
          });

          const contemCabecalhos = requiredHeaders.every(header => headersEncontrados.has(header));

          if (contemCabecalhos) {
            return { sheetName, headerRowIndex: i, linhas };
          }
        }
      }

      return null;
    };

    const resultadoLocalizacao = localizarAbaPrincipal();

    if (!resultadoLocalizacao) {
      console.error('❌ STEP 8: Nenhuma aba com cabeçalhos válidos encontrada.');
      return NextResponse.json({
        error: 'Não foi possível identificar a aba principal da planilha.',
        details: 'Certifique-se de que a planilha contenha colunas ATIVO, CATEGORIA, QTDE e PREÇO MÉDIO.'
      }, { status: 400 });
    }

    const { sheetName: abaPrincipal, headerRowIndex, linhas: linhasPlanilha } = resultadoLocalizacao;
    console.log(`✅ STEP 8: Aba principal encontrada: ${abaPrincipal} (linha de cabeçalho ${headerRowIndex + 1})`);

    const headerRow = linhasPlanilha[headerRowIndex];
    const headerIndexMap: Record<string, number> = {};
    headerRow.forEach((celula, index) => {
      const chaveNormalizada = normalizeText(celula);
      if (!chaveNormalizada) return;
      const chavePadrao = headerAlias[chaveNormalizada];
      if (chavePadrao && headerIndexMap[chavePadrao] === undefined) {
        headerIndexMap[chavePadrao] = index;
      }
    });

    const possuiCabecalhosObrigatorios = requiredHeaders.every(header => headerIndexMap[header] !== undefined);

    if (!possuiCabecalhosObrigatorios) {
      console.error('❌ STEP 8: Cabeçalhos obrigatórios ausentes na aba principal.');
      return NextResponse.json({
        error: 'Cabeçalhos obrigatórios ausentes na planilha.',
        details: 'As colunas ATIVO, CATEGORIA, QTDE e PREÇO MÉDIO são obrigatórias.'
      }, { status: 400 });
    }

    const extrairValorNumerico = (valor: unknown): number | null => {
      if (valor === undefined || valor === null) return null;
      if (typeof valor === 'number' && !Number.isNaN(valor)) return valor;

      const valorStr = String(valor)
        .replace(/\./g, '')
        .replace(/,/g, '.')
        .replace(/[^0-9.-]/g, '')
        .trim();

      if (!valorStr) return null;

      const numero = parseFloat(valorStr);
      return Number.isFinite(numero) ? numero : null;
    };

    const obterValor = (linha: any[], chave: string): any => {
      const indice = headerIndexMap[chave];
      if (indice === undefined) return null;
      return linha[indice];
    };

    const dadosCarteira = {
      abas: [],
      acoes: [],
      fiis: [],
      rendaFixa: [],
      exterior: [],
      cripto: [],
      reserva: [],
      outros: [],
      processedAt: new Date().toISOString()
    };

    const categoriasEncontradas = new Set<string>();

    const normalizarCategoria = (categoria: string | null | undefined) => {
      if (!categoria) {
        return { chave: 'outros', nome: 'Outros' as const };
      }

      const valorNormalizado = normalizeText(categoria);

      const eh = (valor: string) => valorNormalizado === valor;
      const contem = (trecho: string) => valorNormalizado.includes(trecho);

      if (
        eh('acao') ||
        eh('acoes') ||
        contem('acaobrasil') ||
        contem('rendavariavel') ||
        eh('stock') ||
        eh('stocks') ||
        eh('equity')
      ) {
        return { chave: 'acoes' as const, nome: 'Ações' };
      }

      if (contem('fii') || contem('fundodeinvestimentoimobiliario') || contem('fundoimobiliario') || contem('fiagro')) {
        return { chave: 'fiis' as const, nome: 'FIIs' };
      }

      if (
        contem('tesouro') ||
        contem('rendafixa') ||
        contem('cdb') ||
        contem('lci') ||
        contem('lca') ||
        contem('debenture') ||
        contem('cri') ||
        contem('cra') ||
        contem('prefixado') ||
        contem('posfixado') ||
        contem('ipca')
      ) {
        return { chave: 'rendaFixa' as const, nome: 'Renda Fixa' };
      }

      if (
        contem('reit') ||
        contem('bdr') ||
        contem('adr') ||
        contem('exterior') ||
        contem('internacional') ||
        contem('global') ||
        contem('usa') ||
        contem('nasdaq') ||
        contem('nyse') ||
        contem('stockexchange') ||
        contem('etf')
      ) {
        return { chave: 'exterior' as const, nome: 'Exterior' };
      }

      if (contem('cripto') || contem('bitcoin') || contem('ethereum') || contem('defi')) {
        return { chave: 'cripto' as const, nome: 'Cripto' };
      }

      if (contem('reserva') || contem('poupanca') || contem('emergencia')) {
        return { chave: 'reserva' as const, nome: 'Reserva' };
      }

      if (contem('outro')) {
        return { chave: 'outros' as const, nome: 'Outros' };
      }

      console.warn(`⚠️ Categoria não reconhecida: ${categoria}. Será classificada como Outros.`);
      return { chave: 'outros' as const, nome: 'Outros' };
    };

    const linhasDados = linhasPlanilha.slice(headerRowIndex + 1);

    for (const linha of linhasDados) {
      if (!linha) continue;

      const ativo = obterValor(linha, 'ativo');
      const categoriaRaw = obterValor(linha, 'categoria');
      const precoMedio = extrairValorNumerico(obterValor(linha, 'precoMedio'));

      if (!ativo || !categoriaRaw) continue;
      if (!precoMedio || precoMedio <= 0) continue;

      const valorInvestidoInformado = extrairValorNumerico(obterValor(linha, 'valorInvestido'));
      let quantidade = extrairValorNumerico(obterValor(linha, 'quantidade'));

      if ((!quantidade || quantidade <= 0) && valorInvestidoInformado && valorInvestidoInformado > 0) {
        quantidade = valorInvestidoInformado / precoMedio;
      }

      if (!quantidade || quantidade <= 0) continue;

      const precoAtual = extrairValorNumerico(obterValor(linha, 'precoAtual'));
      const valorAtualInformado = extrairValorNumerico(obterValor(linha, 'valorAtual'));
      const nome = obterValor(linha, 'nome') ? String(obterValor(linha, 'nome')).trim() : '';

      const ativoStr = String(ativo).trim();
      const valorInvestido = valorInvestidoInformado ?? quantidade * precoMedio;
      const valorAtual = valorAtualInformado ?? (precoAtual ? quantidade * precoAtual : valorInvestido);
      const rentabilidade = valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0;

      const categoriaNormalizada = normalizarCategoria(String(categoriaRaw));
      categoriasEncontradas.add(categoriaNormalizada.nome);

      const itemBase = {
        codigo: ativoStr.toUpperCase(),
        codigoOriginal: ativoStr,
        nome,
        quantidade,
        precoMedio,
        cotacaoAtual: precoAtual ?? precoMedio,
        valorInvestido,
        valorAtual,
        rentabilidade,
        pesoCarteira: 0,
        categoriaOriginal: String(categoriaRaw).trim()
      };

      if (categoriaNormalizada.chave === 'acoes') {
        dadosCarteira.acoes.push({
          ...itemBase,
          tipo: 'ACAO'
        });
      } else if (categoriaNormalizada.chave === 'fiis') {
        dadosCarteira.fiis.push({
          ...itemBase,
          tipo: 'FII'
        });
      } else if (categoriaNormalizada.chave === 'rendaFixa') {
        dadosCarteira.rendaFixa.push({
          ...itemBase,
          produto: itemBase.codigo,
          banco: itemBase.nome,
          tipo: 'RENDA_FIXA'
        });
      } else if (categoriaNormalizada.chave === 'exterior') {
        dadosCarteira.exterior.push({
          ...itemBase,
          tipo: 'EXTERIOR'
        });
      } else if (categoriaNormalizada.chave === 'cripto') {
        dadosCarteira.cripto.push({
          ...itemBase,
          criptomoeda: itemBase.codigo,
          exchange: itemBase.nome,
          tipo: 'CRIPTO'
        });
      } else if (categoriaNormalizada.chave === 'reserva') {
        dadosCarteira.reserva.push({
          ...itemBase,
          onde: itemBase.codigoOriginal,
          banco: itemBase.nome,
          valor: itemBase.valorAtual,
          tipo: 'RESERVA'
        });
      } else {
        dadosCarteira.outros.push({
          ...itemBase,
          tipo: 'OUTROS'
        });
      }
    }

    const abasSet = new Set<string>();
    abasSet.add(abaPrincipal);
    Array.from(categoriasEncontradas)
      .filter(Boolean)
      .forEach(categoria => abasSet.add(categoria));

    dadosCarteira.abas = Array.from(abasSet);

    const ativosParaPeso = [
      ...dadosCarteira.acoes,
      ...dadosCarteira.fiis,
      ...dadosCarteira.rendaFixa,
      ...dadosCarteira.exterior,
      ...dadosCarteira.cripto,
      ...dadosCarteira.outros
    ];

    const valorTotal = ativosParaPeso.reduce((total, item) => total + (item.valorAtual || 0), 0);
    const quantidadeAtivos = ativosParaPeso.length;

    if (quantidadeAtivos === 0) {
      console.error('❌ STEP 8: Nenhum ativo válido foi identificado na aba principal.');
      return NextResponse.json({
        error: 'Nenhum ativo válido encontrado na planilha.',
        details: 'Verifique se as colunas possuem valores numéricos para quantidade e preço médio.'
      }, { status: 400 });
    }

    const calcularPeso = (valor: number) => (valorTotal > 0 ? (valor / valorTotal) * 100 : 0);

    const aplicarPeso = (lista: any[]) =>
      lista.map(item => ({
        ...item,
        pesoCarteira: calcularPeso(item.valorAtual || 0)
      }));

    dadosCarteira.acoes = aplicarPeso(dadosCarteira.acoes);
    dadosCarteira.fiis = aplicarPeso(dadosCarteira.fiis);
    dadosCarteira.rendaFixa = aplicarPeso(dadosCarteira.rendaFixa);
    dadosCarteira.exterior = aplicarPeso(dadosCarteira.exterior);
    dadosCarteira.cripto = aplicarPeso(dadosCarteira.cripto);
    dadosCarteira.outros = aplicarPeso(dadosCarteira.outros);

    console.log(`✅ STEP 8: Dados extraídos com sucesso!`);
    console.log(`📊 Resumo: ${quantidadeAtivos} ativos, R$ ${valorTotal.toFixed(2)}`);
    console.log(`📈 Ações: ${dadosCarteira.acoes.length}`);
    console.log(`🏘️ FIIs: ${dadosCarteira.fiis.length}`);
    console.log(`💰 Renda Fixa: ${dadosCarteira.rendaFixa.length}`);
    console.log(`🌎 Exterior: ${dadosCarteira.exterior.length}`);
    console.log(`₿ Cripto: ${dadosCarteira.cripto.length}`);
    console.log(`📦 Outros: ${dadosCarteira.outros.length}`);
    console.log(`🏦 Reserva: ${dadosCarteira.reserva.length}`);

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