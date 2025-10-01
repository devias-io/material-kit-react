// src/app/api/carteiras/upload-validado/route.ts

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type CategoriaChave = 'acoes' | 'fiis' | 'rendaFixa' | 'exterior' | 'cripto' | 'reserva';

interface LinhaNormalizada {
  categoria: CategoriaChave;
  categoriaOriginal: string;
  labelCategoria: string;
  ticker?: string;
  nome?: string;
  quantidade: number;
  precoMedio: number;
  cotacaoAtual: number;
  valorInvestido: number;
  valorAtual: number;
  banco?: string;
  vencimento?: string;
  exchange?: string;
  observacoes?: string;
  moeda?: string;
  origem?: string;
  taxaCambio?: number;
  pesoCarteira?: number;
}

const categoriaDisplayMap: Record<CategoriaChave, string> = {
  acoes: 'Ações',
  fiis: 'FIIs',
  rendaFixa: 'Renda Fixa',
  exterior: 'Exterior',
  cripto: 'Cripto',
  reserva: 'Reserva'
};

const categoriaSinonimos: Record<CategoriaChave, string[]> = {
  acoes: [
    'acoes', 'acao', 'acoesbrasil', 'acoesb3', 'stock', 'stocks', 'equities',
    'brasil', 'b3', 'acaoordinaria', 'acaopreferencial'
  ],
  fiis: [
    'fiis', 'fii', 'fundosimobiliarios', 'fundosimobiliario', 'fundoinvestimentoimobiliario',
    'fundodeinvestimentoimobiliario', 'fundos', 'fundosimob', 'fundosimobiliarios'
  ],
  rendaFixa: [
    'rendafixa', 'fixa', 'titulo', 'titulos', 'titulospublicos', 'titulosprivados', 'tesouro', 'tesourodireto',
    'cdb', 'lci', 'lca', 'debenture', 'debentures', 'cri', 'cra', 'lc', 'lf', 'bonds', 'previdencia',
    'previdenciaprivada', 'fundoprevidenciario', 'fundoprevidencia'
  ],
  exterior: [
    'exterior', 'internacional', 'bdr', 'bdrs', 'acoesinternacionais', 'stocksus', 'usa', 'global', 'internacionais'
  ],
  cripto: [
    'cripto', 'criptomoeda', 'criptomoedas', 'crypto', 'bitcoin', 'ethereum', 'ativosdigitais', 'moedadigital'
  ],
  reserva: [
    'reserva', 'reservaemergencia', 'reservadeemergencia', 'reservaemergencial', 'reservaoportunidade',
    'caixa', 'poupanca', 'poupancaemergencia', 'emergencia', 'liquidez'
  ]
};

const categoriasChave = Object.keys(categoriaDisplayMap) as CategoriaChave[];

function normalizarTextoChave(valor?: string | null): string {
  if (!valor) {
    return '';
  }

  return valor
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

function obterValorPorChaveFlex<T = unknown>(obj: any, chave: string): T | undefined {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(obj, chave)) {
    return obj[chave] as T;
  }

  const chaveMinuscula = chave.toLowerCase();
  const chaveEncontrada = Object.keys(obj).find(key => key.toLowerCase() === chaveMinuscula);

  if (chaveEncontrada) {
    return obj[chaveEncontrada] as T;
  }

  return undefined;
}

function extrairTexto(valor: any): string | undefined {
  if (valor === undefined || valor === null) {
    return undefined;
  }

  if (typeof valor === 'string') {
    const trimmed = valor.trim();
    return trimmed.length ? trimmed : undefined;
  }

  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor.toString();
  }

  return undefined;
}

function extrairPrimeiroTexto(fonte: any, chaves: string[]): string | undefined {
  for (const chave of chaves) {
    const valor = obterValorPorChaveFlex(fonte, chave);
    const texto = extrairTexto(valor);
    if (texto) {
      return texto;
    }
  }

  return undefined;
}

function parseNumeroFlex(valor: unknown): number {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : 0;
  }

  if (typeof valor === 'string') {
    const trimmed = valor.trim();
    if (!trimmed) {
      return 0;
    }

    let somenteNumeros = trimmed
      .replace(/[^0-9,.-]/g, '')
      .replace(/(?!^)-/g, '');

    if (!somenteNumeros) {
      return 0;
    }

    const virgulas = (somenteNumeros.match(/,/g) || []).length;
    const pontos = (somenteNumeros.match(/\./g) || []).length;

    if (virgulas && pontos) {
      if (somenteNumeros.lastIndexOf(',') > somenteNumeros.lastIndexOf('.')) {
        somenteNumeros = somenteNumeros.replace(/\./g, '').replace(',', '.');
      } else {
        somenteNumeros = somenteNumeros.replace(/,/g, '');
      }
    } else if (virgulas) {
      somenteNumeros = somenteNumeros.replace(/,/g, '.');
    }

    const numero = parseFloat(somenteNumeros);
    return Number.isFinite(numero) ? numero : 0;
  }

  return 0;
}

function identificarCategoria(possivelCategoria?: string | null, fallback?: string | null): CategoriaChave | null {
  const candidatos = [possivelCategoria, fallback].filter(Boolean) as string[];

  for (const candidato of candidatos) {
    const textoNormalizado = normalizarTextoChave(candidato);
    if (!textoNormalizado) {
      continue;
    }

    for (const chave of categoriasChave) {
      if (textoNormalizado === normalizarTextoChave(chave)) {
        return chave;
      }

      if (categoriaSinonimos[chave].includes(textoNormalizado)) {
        return chave;
      }
    }
  }

  return null;
}

function extrairLinhasGenericas(portfolioData: any): { linhas: any[]; metadata: Record<string, any> } {
  if (!portfolioData) {
    return { linhas: [], metadata: { formato: 'vazio' } };
  }

  if (Array.isArray(portfolioData)) {
    return { linhas: portfolioData, metadata: { formato: 'array' } };
  }

  if (Array.isArray(portfolioData?.linhas)) {
    const { linhas, ...resto } = portfolioData;
    return { linhas, metadata: { formato: 'linhas', ...resto } };
  }

  if (Array.isArray(portfolioData?.rows)) {
    const { rows, ...resto } = portfolioData;
    return { linhas: rows, metadata: { formato: 'rows', ...resto } };
  }

  if (typeof portfolioData === 'object') {
    const linhas: any[] = [];

    Object.entries(portfolioData).forEach(([sheetName, sheetValue]) => {
      const dadosSheet = obterValorPorChaveFlex<any[]>(sheetValue, 'data');
      if (Array.isArray(dadosSheet)) {
        dadosSheet.forEach(row => {
          if (row && typeof row === 'object') {
            linhas.push({ ...row, sheetName });
          }
        });
      }
    });

    return { linhas, metadata: { formato: 'abas', abasOriginais: Object.keys(portfolioData) } };
  }

  return { linhas: [], metadata: { formato: 'desconhecido' } };
}

function normalizarLinha(row: any): LinhaNormalizada | null {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const sheetName = extrairTexto(obterValorPorChaveFlex(row, 'sheetName'));
  const categoriaOriginal =
    extrairPrimeiroTexto(row, ['categoria', 'Category', 'tipoCategoria', 'tipo', 'grupo', 'setor', 'aba']) ||
    sheetName ||
    '';

  const categoria = identificarCategoria(categoriaOriginal, sheetName);

  if (!categoria) {
    return null;
  }

  const labelCategoria = categoriaDisplayMap[categoria];
  const valores = Array.isArray(obterValorPorChaveFlex(row, 'values'))
    ? (obterValorPorChaveFlex(row, 'values') as unknown[])
    : undefined;

  if (valores && valores.length) {
    if (categoria === 'acoes' || categoria === 'fiis') {
      const ticker =
        extrairTexto(valores[0]) || extrairPrimeiroTexto(row, ['codigo', 'ticker', 'ativo', 'sigla', 'bdr']);
      const nome =
        extrairTexto(valores[1]) || extrairPrimeiroTexto(row, ['nome', 'descricao', 'description', 'company']);
      const quantidade = parseNumeroFlex(valores[2] ?? extrairPrimeiroTexto(row, ['quantidade', 'qtde', 'qtd']));
      const precoMedio = parseNumeroFlex(valores[3] ?? extrairPrimeiroTexto(row, ['precoMedio', 'pm', 'preco_medio']));
      const cotacaoAtual = parseNumeroFlex(
        valores[4] ?? extrairPrimeiroTexto(row, ['cotacaoAtual', 'cotacao', 'precoAtual'])
      );
      const valorInvestido = parseNumeroFlex(
        valores[5] ?? extrairPrimeiroTexto(row, ['valorInvestido', 'totalInvestido'])
      );
      const valorAtual = parseNumeroFlex(
        valores[6] ?? valores[5] ?? extrairPrimeiroTexto(row, ['valorAtual', 'totalAtual'])
      );

      return {
        categoria,
        categoriaOriginal,
        labelCategoria,
        ticker: ticker?.toUpperCase(),
        nome: nome || ticker,
        quantidade,
        precoMedio,
        cotacaoAtual,
        valorInvestido,
        valorAtual,
        origem: sheetName
      };
    }

    if (categoria === 'rendaFixa') {
      const produto =
        extrairTexto(valores[0]) || extrairPrimeiroTexto(row, ['produto', 'ativo', 'descricao', 'nome']);
      const banco = extrairTexto(valores[1]) || extrairPrimeiroTexto(row, ['banco', 'instituicao']);
      const valorInvestido = parseNumeroFlex(valores[2] ?? extrairPrimeiroTexto(row, ['valorInvestido', 'valor']));
      const valorAtual = parseNumeroFlex(valores[3] ?? extrairPrimeiroTexto(row, ['valorAtual', 'saldo']));
      const vencimento = extrairTexto(valores[4]) || extrairPrimeiroTexto(row, ['vencimento', 'dataVencimento']);

      return {
        categoria,
        categoriaOriginal,
        labelCategoria,
        ticker: produto,
        nome: produto,
        quantidade: 0,
        precoMedio: 0,
        cotacaoAtual: 0,
        valorInvestido,
        valorAtual,
        banco,
        vencimento,
        origem: sheetName
      };
    }

    if (categoria === 'exterior') {
      const ticker =
        extrairTexto(valores[0]) || extrairPrimeiroTexto(row, ['codigo', 'ticker', 'ativo', 'sigla']);
      const nome =
        extrairTexto(valores[1]) || extrairPrimeiroTexto(row, ['nome', 'descricao', 'company', 'description']);
      const quantidade = parseNumeroFlex(valores[2] ?? extrairPrimeiroTexto(row, ['quantidade', 'qtde']));
      const precoMedio = parseNumeroFlex(valores[3] ?? extrairPrimeiroTexto(row, ['precoMedio', 'pm']));
      const cotacaoAtual = parseNumeroFlex(valores[4] ?? extrairPrimeiroTexto(row, ['cotacao', 'cotacaoAtual']));
      const valorInvestido = parseNumeroFlex(
        valores[5] ?? extrairPrimeiroTexto(row, ['valorInvestido', 'totalInvestido'])
      );
      const valorAtual = parseNumeroFlex(valores[6] ?? extrairPrimeiroTexto(row, ['valorAtual', 'totalAtual']));
      const taxaCambio = parseNumeroFlex(
        extrairPrimeiroTexto(row, ['taxaCambio', 'cambio', 'exchangeRate', 'taxa_de_cambio'])
      );

      return {
        categoria,
        categoriaOriginal,
        labelCategoria,
        ticker: ticker?.toUpperCase(),
        nome: nome || ticker,
        quantidade,
        precoMedio,
        cotacaoAtual,
        valorInvestido,
        valorAtual,
        taxaCambio,
        origem: sheetName
      };
    }

    if (categoria === 'cripto') {
      const nome =
        extrairTexto(valores[0]) || extrairPrimeiroTexto(row, ['criptomoeda', 'ativo', 'descricao', 'nome']);
      const quantidade = parseNumeroFlex(valores[1] ?? extrairPrimeiroTexto(row, ['quantidade', 'qtde']));
      const precoMedio = parseNumeroFlex(valores[2] ?? extrairPrimeiroTexto(row, ['precoMedio', 'pm']));
      const valorAtual = parseNumeroFlex(valores[3] ?? extrairPrimeiroTexto(row, ['valorAtual', 'totalAtual']));
      const exchange = extrairTexto(valores[4]) || extrairPrimeiroTexto(row, ['exchange', 'corretora']);

      return {
        categoria,
        categoriaOriginal,
        labelCategoria,
        ticker: nome?.toUpperCase(),
        nome,
        quantidade,
        precoMedio,
        cotacaoAtual: 0,
        valorInvestido: quantidade * precoMedio,
        valorAtual,
        exchange,
        origem: sheetName
      };
    }

    if (categoria === 'reserva') {
      const nome =
        extrairTexto(valores[0]) || extrairPrimeiroTexto(row, ['onde', 'instituicao', 'descricao', 'nome']);
      const banco = extrairTexto(valores[1]) || extrairPrimeiroTexto(row, ['banco', 'instituicao']);
      const valor = parseNumeroFlex(valores[2] ?? extrairPrimeiroTexto(row, ['valor', 'saldo']));
      const observacoes = extrairTexto(valores[3]) || extrairPrimeiroTexto(row, ['observacoes', 'descricao']);

      return {
        categoria,
        categoriaOriginal,
        labelCategoria,
        nome,
        quantidade: 0,
        precoMedio: 0,
        cotacaoAtual: 0,
        valorInvestido: valor,
        valorAtual: valor,
        banco,
        observacoes,
        origem: sheetName
      };
    }
  }

  const ticker = extrairPrimeiroTexto(row, ['codigo', 'ticker', 'ativo', 'sigla', 'bdr']);
  const nome =
    extrairPrimeiroTexto(row, ['nome', 'descricao', 'description', 'company', 'produto', 'onde']) || ticker;
  const quantidade = parseNumeroFlex(
    extrairPrimeiroTexto(row, ['quantidade', 'qtde', 'qtd', 'cotas', 'unidades', 'shares'])
  );
  const precoMedio = parseNumeroFlex(
    extrairPrimeiroTexto(row, ['precoMedio', 'preco_medio', 'pm', 'averagePrice', 'price'])
  );
  const cotacaoAtual = parseNumeroFlex(
    extrairPrimeiroTexto(row, ['cotacaoAtual', 'cotacao', 'precoAtual', 'valorAtualUnitario'])
  );
  const valorInvestido = parseNumeroFlex(
    extrairPrimeiroTexto(row, ['valorInvestido', 'valor_investido', 'totalInvestido', 'valorAplicado', 'investimento'])
  );
  const valorAtual = parseNumeroFlex(
    extrairPrimeiroTexto(row, ['valorAtual', 'valor_atual', 'totalAtual', 'saldoAtual', 'saldo', 'valor'])
  );
  const banco = extrairPrimeiroTexto(row, ['banco', 'instituicao', 'instituicaoFinanceira', 'corretora']);
  const vencimento = extrairPrimeiroTexto(row, ['vencimento', 'dataVencimento', 'maturity']);
  const exchange = extrairPrimeiroTexto(row, ['exchange', 'corretora', 'plataforma', 'broker']);
  const observacoes = extrairPrimeiroTexto(row, ['observacoes', 'observacao', 'comentarios', 'notas']);
  const moeda = extrairPrimeiroTexto(row, ['moeda', 'currency']);
  const taxaCambio = parseNumeroFlex(
    extrairPrimeiroTexto(row, ['taxaCambio', 'cambio', 'exchangeRate', 'taxa_de_cambio'])
  );

  return {
    categoria,
    categoriaOriginal,
    labelCategoria,
    ticker: ticker?.toUpperCase(),
    nome,
    quantidade,
    precoMedio,
    cotacaoAtual,
    valorInvestido,
    valorAtual,
    banco,
    vencimento,
    exchange,
    observacoes,
    moeda,
    origem: sheetName,
    taxaCambio
  };
}

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
    
    const { linhas: linhasExtraidas, metadata: metadataEntrada } = extrairLinhasGenericas(dadosValidados.portfolioData);
    console.log(`ℹ️ STEP 6: Linhas recebidas para processamento: ${linhasExtraidas.length}`);

    const linhasNormalizadas = linhasExtraidas
      .map(normalizarLinha)
      .filter((linha): linha is LinhaNormalizada => !!linha);

    if (!linhasNormalizadas.length) {
      console.error('❌ STEP 6: Nenhuma linha válida encontrada no formato enviado');
      return NextResponse.json({
        error: 'Formato de dados inválido',
        details: 'Não foi possível identificar ativos na estrutura enviada',
        recebidos: linhasExtraidas.length
      }, { status: 400 });
    }

    const dadosCarteira = {
      abas: [] as string[],
      acoes: [] as any[],
      fiis: [] as any[],
      rendaFixa: [] as any[],
      exterior: [] as any[],
      cripto: [] as any[],
      reserva: [] as any[],
      processedAt: new Date().toISOString(),
      validatedInFrontend: true,
      linhasProcessadas: [] as LinhaNormalizada[],
      resumoCategorias: {} as Record<string, { label: string; valorTotal: number; percentual: number; quantidadeAtivos: number }>,
      metadadosEntrada: {
        ...metadataEntrada,
        totalLinhasRecebidas: linhasExtraidas.length
      },
      resumoGeral: {
        valorTotal: 0,
        quantidadeAtivos: 0,
        linhasProcessadas: 0,
        categorias: [] as string[]
      }
    };

    const categoriasEncontradas = new Set<CategoriaChave>();
    const resumoCategoriasAcumulado: Partial<Record<CategoriaChave, { valor: number; ativos: number }>> = {};
    const linhasEnriquecidas: LinhaNormalizada[] = [];

    let valorTotal = 0;
    let quantidadeAtivos = 0;

    const registrarResumo = (categoria: CategoriaChave, valor: number) => {
      if (!resumoCategoriasAcumulado[categoria]) {
        resumoCategoriasAcumulado[categoria] = { valor: 0, ativos: 0 };
      }

      if (valor > 0) {
        resumoCategoriasAcumulado[categoria]!.valor += valor;
      }

      resumoCategoriasAcumulado[categoria]!.ativos += 1;
    };

    linhasNormalizadas.forEach(linha => {
      categoriasEncontradas.add(linha.categoria);

      const enriched: LinhaNormalizada = { ...linha };

      switch (linha.categoria) {
        case 'acoes':
        case 'fiis': {
          const quantidade = linha.quantidade > 0 ? linha.quantidade : 0;
          const precoMedio = linha.precoMedio > 0
            ? linha.precoMedio
            : (linha.valorInvestido > 0 && quantidade > 0 ? linha.valorInvestido / quantidade : 0);
          const cotacaoAtual = linha.cotacaoAtual > 0
            ? linha.cotacaoAtual
            : (linha.valorAtual > 0 && quantidade > 0 ? linha.valorAtual / quantidade : precoMedio);
          const valorInvestido = linha.valorInvestido > 0
            ? linha.valorInvestido
            : (quantidade > 0 ? precoMedio * quantidade : 0);
          const valorAtual = linha.valorAtual > 0
            ? linha.valorAtual
            : (quantidade > 0 ? cotacaoAtual * quantidade : valorInvestido);

          if ((linha.ticker || linha.nome) && (valorInvestido > 0 || valorAtual > 0)) {
            const tipo = linha.categoria === 'acoes' ? 'ACAO' : 'FII';
            const registro = {
              codigo: (linha.ticker || linha.nome || '').toUpperCase(),
              nome: linha.nome || linha.ticker || '',
              tipo,
              quantidade,
              precoMedio,
              cotacaoAtual,
              valorInvestido,
              valorAtual,
              rentabilidade: valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0,
              pesoCarteira: 0
            };

            if (linha.categoria === 'acoes') {
              dadosCarteira.acoes.push(registro);
            } else {
              dadosCarteira.fiis.push(registro);
            }

            valorTotal += valorAtual;
            quantidadeAtivos += 1;
            registrarResumo(linha.categoria, valorAtual);

            enriched.quantidade = quantidade;
            enriched.precoMedio = precoMedio;
            enriched.cotacaoAtual = cotacaoAtual;
            enriched.valorInvestido = valorInvestido;
            enriched.valorAtual = valorAtual;
          }

          break;
        }

        case 'rendaFixa': {
          const valorInvestido = linha.valorInvestido > 0 ? linha.valorInvestido : linha.valorAtual;
          const valorAtual = linha.valorAtual > 0 ? linha.valorAtual : valorInvestido;

          if ((valorInvestido > 0 || valorAtual > 0) && (linha.nome || linha.ticker)) {
            dadosCarteira.rendaFixa.push({
              produto: linha.nome || linha.ticker || 'Renda Fixa',
              banco: linha.banco || '',
              tipo: 'RENDA_FIXA',
              valorInvestido,
              valorAtual,
              vencimento: linha.vencimento || '',
              rentabilidade: valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0,
              pesoCarteira: 0
            });

            valorTotal += valorAtual;
            quantidadeAtivos += 1;
            registrarResumo('rendaFixa', valorAtual);

            enriched.valorInvestido = valorInvestido;
            enriched.valorAtual = valorAtual;
          }

          break;
        }

        case 'exterior': {
          const quantidade = linha.quantidade > 0 ? linha.quantidade : 0;
          const precoMedio = linha.precoMedio > 0
            ? linha.precoMedio
            : (linha.valorInvestido > 0 && quantidade > 0 ? linha.valorInvestido / quantidade : 0);
          const cotacaoAtual = linha.cotacaoAtual > 0
            ? linha.cotacaoAtual
            : (linha.valorAtual > 0 && quantidade > 0 ? linha.valorAtual / quantidade : precoMedio);
          const valorInvestido = linha.valorInvestido > 0
            ? linha.valorInvestido
            : (quantidade > 0 ? precoMedio * quantidade : 0);
          const valorAtual = linha.valorAtual > 0
            ? linha.valorAtual
            : (quantidade > 0 ? cotacaoAtual * quantidade : valorInvestido);

          if ((linha.ticker || linha.nome) && (valorInvestido > 0 || valorAtual > 0)) {
            const moedaNormalizada = normalizarTextoChave(linha.moeda);
            const taxaCambio = linha.taxaCambio && linha.taxaCambio > 0
              ? linha.taxaCambio
              : (moedaNormalizada === 'usd' ? 5.5 : 1);

            dadosCarteira.exterior.push({
              codigo: (linha.ticker || linha.nome || '').toUpperCase(),
              nome: linha.nome || linha.ticker || '',
              tipo: 'EXTERIOR',
              quantidade,
              precoMedioUSD: precoMedio,
              cotacaoUSD: cotacaoAtual,
              taxaCambio,
              valorInvestido,
              valorAtual,
              rentabilidade: valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0,
              pesoCarteira: 0,
              moeda: linha.moeda || undefined
            });

            valorTotal += valorAtual;
            quantidadeAtivos += 1;
            registrarResumo('exterior', valorAtual);

            enriched.quantidade = quantidade;
            enriched.precoMedio = precoMedio;
            enriched.cotacaoAtual = cotacaoAtual;
            enriched.valorInvestido = valorInvestido;
            enriched.valorAtual = valorAtual;
            enriched.taxaCambio = taxaCambio;
          }

          break;
        }

        case 'cripto': {
          const quantidade = linha.quantidade > 0 ? linha.quantidade : 0;
          const precoMedio = linha.precoMedio > 0
            ? linha.precoMedio
            : (linha.valorInvestido > 0 && quantidade > 0 ? linha.valorInvestido / quantidade : 0);
          const valorInvestido = linha.valorInvestido > 0 ? linha.valorInvestido : quantidade * precoMedio;
          const valorAtual = linha.valorAtual > 0 ? linha.valorAtual : valorInvestido;

          if ((linha.nome || linha.ticker) && (valorInvestido > 0 || valorAtual > 0)) {
            dadosCarteira.cripto.push({
              criptomoeda: linha.nome || linha.ticker || '',
              tipo: 'CRIPTO',
              quantidade,
              precoMedio,
              valorAtual,
              exchange: linha.exchange || '',
              rentabilidade: valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0,
              pesoCarteira: 0
            });

            valorTotal += valorAtual;
            quantidadeAtivos += 1;
            registrarResumo('cripto', valorAtual);

            enriched.quantidade = quantidade;
            enriched.precoMedio = precoMedio;
            enriched.valorInvestido = valorInvestido;
            enriched.valorAtual = valorAtual;
          }

          break;
        }

        case 'reserva': {
          const valorReserva = linha.valorAtual > 0 ? linha.valorAtual : linha.valorInvestido;

          if (valorReserva > 0 && (linha.nome || linha.banco)) {
            dadosCarteira.reserva.push({
              onde: linha.nome || linha.banco || 'Reserva',
              banco: linha.banco || '',
              tipo: 'RESERVA',
              valor: valorReserva,
              observacoes: linha.observacoes || ''
            });

            registrarResumo('reserva', valorReserva);

            enriched.valorInvestido = valorReserva;
            enriched.valorAtual = valorReserva;
          }

          break;
        }
      }

      linhasEnriquecidas.push(enriched);
    });

    dadosCarteira.abas = Array.from(categoriasEncontradas).map(categoria => categoriaDisplayMap[categoria]);

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

      linhasEnriquecidas.forEach(linha => {
        linha.pesoCarteira = linha.categoria === 'reserva' ? 0 : (linha.valorAtual > 0 ? (linha.valorAtual / valorTotal) * 100 : 0);
      });
    } else {
      linhasEnriquecidas.forEach(linha => {
        linha.pesoCarteira = 0;
      });
    }

    const resumoCategorias = (Object.entries(resumoCategoriasAcumulado) as [CategoriaChave, { valor: number; ativos: number }][])
      .reduce((acc, [categoria, info]) => {
        if (!info) {
          return acc;
        }

        const valorCategoria = info.valor;
        const percentual = categoria === 'reserva' || valorTotal <= 0
          ? 0
          : (valorCategoria / valorTotal) * 100;

        acc[categoria] = {
          label: categoriaDisplayMap[categoria],
          valorTotal: Number(valorCategoria.toFixed(2)),
          percentual: Number(percentual.toFixed(2)),
          quantidadeAtivos: info.ativos
        };

        return acc;
      }, {} as Record<string, { label: string; valorTotal: number; percentual: number; quantidadeAtivos: number }>);

    dadosCarteira.resumoCategorias = resumoCategorias;
    dadosCarteira.linhasProcessadas = linhasEnriquecidas;
    dadosCarteira.resumoGeral = {
      valorTotal,
      quantidadeAtivos,
      linhasProcessadas: linhasEnriquecidas.length,
      categorias: dadosCarteira.abas
    };

    console.log('✅ STEP 6: Estrutura reorganizada com sucesso');
    console.log(`📊 Resumo geral: ${quantidadeAtivos} ativos, valor total R$ ${valorTotal.toFixed(2)}`);
    console.log('📂 Categorias encontradas:', dadosCarteira.abas);
    console.log(`📈 Ações: ${dadosCarteira.acoes.length}`);
    console.log(`🏘️ FIIs: ${dadosCarteira.fiis.length}`);
    console.log(`💰 Renda Fixa: ${dadosCarteira.rendaFixa.length}`);
    console.log(`🌎 Exterior: ${dadosCarteira.exterior.length}`);
    console.log(`₿ Cripto: ${dadosCarteira.cripto.length}`);
    console.log(`🏦 Reserva: ${dadosCarteira.reserva.length}`);

    // STEP 8: SALVAR NO BANCO
    const abasProcessadas = dadosCarteira.abas.length;
    const linhasProcessadas = linhasEnriquecidas.length;

    console.log('🗄️ STEP 8: Salvando no banco...');
    console.log('📝 Dados que serão salvos:', {
      userId: session.user.id,
      nomeArquivo: dadosValidados.fileName,
      valorTotal,
      quantidadeAtivos,
      linhasProcessadas,
      abasProcessadas,
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
          linhasProcessadas,
          abasProcessadas,
          dadosValidados: true,
          questionarioIncluido: !!questionario,
          nomeArquivo: dadosValidados.fileName,
          categorias: dadosCarteira.abas,
          distribuicao: dadosCarteira.resumoCategorias,
          formatoEntrada: dadosCarteira.metadadosEntrada?.formato || null
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