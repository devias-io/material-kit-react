// hooks/useBrapi.ts
import { useState, useCallback } from 'react';
import { BRAPI_CONFIG, BrapiQuoteResponse, DadosTrimestre } from '@/lib/brapi-config';

const CLIENT_CACHE = new Map<string, { data: BrapiQuoteResponse; timestamp: number }>();

function buildCacheKey(symbols: string[], params: Record<string, string>) {
  const normalizedSymbols = symbols.map((symbol) => symbol.trim().toUpperCase()).join(',');
  const normalizedParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      normalizedParams.append(key, value);
    }
  });

  return `${normalizedSymbols}|${normalizedParams.toString()}`;
}

export const useBrapi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para fazer requests para BRAPI via API interna (com cache compartilhado)
  const brapiRequest = useCallback(async (endpoint: string, params: Record<string, string> = {}): Promise<BrapiQuoteResponse> => {
    const tickerSegment = endpoint.replace(/^\/quote\//, '');
    const symbols = tickerSegment.split(',').map((symbol) => symbol.trim()).filter(Boolean);

    const searchParams = new URLSearchParams();
    if (symbols.length > 0) {
      searchParams.set('symbols', symbols.join(','));
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, value);
      }
    });

    const cacheKey = buildCacheKey(symbols, params);
    const cached = CLIENT_CACHE.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < BRAPI_CONFIG.RATE_LIMIT.CACHE_DURATION) {
      console.log('📚 Usando cache BRAPI:', cacheKey);
      return cached.data;
    }

    try {
      console.log('🌐 Request BRAPI via API interna:', searchParams.toString());

      const response = await fetch(`/api/financial/quotes?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Erro BRAPI ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const payload: BrapiQuoteResponse = {
        results: data?.quotes || [],
        requestedAt: new Date().toISOString(),
        took: data?.timestamp || ''
      };

      CLIENT_CACHE.set(cacheKey, { data: payload, timestamp: Date.now() });

      return payload;

    } catch (error) {
      console.error('❌ Erro na requisição BRAPI:', error);
      throw error;
    }
  }, []);

  // Converter trimestre brasileiro para data
  const converterTrimestreParaData = useCallback((trimestre: string): string => {
    const match = trimestre.match(/(\d)T(\d{2})/);
    if (!match) return '';
    
    const [, tri, ano] = match;
    const anoCompleto = `20${ano}`;
    
    const datasFinais = {
      '1': `${anoCompleto}-03-31`,
      '2': `${anoCompleto}-06-30`,
      '3': `${anoCompleto}-09-30`,
      '4': `${anoCompleto}-12-31`
    };
    
    return datasFinais[tri as keyof typeof datasFinais] || '';
  }, []);

  // Calcular variação percentual
  const calcularVariacao = useCallback((valorAtual: number, valorAnterior: number): number => {
    if (valorAnterior === 0) return 0;
    return ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100;
  }, []);

  // Função para converter valores negativos da BRAPI para positivos quando apropriado
  const normalizarValor = useCallback((valor: number | null | undefined): number => {
    return Math.abs(valor || 0);
  }, []);

  // Calcular margens
  const calcularMargens = useCallback((receita: number, lucroBruto: number, resultadoOp: number, ebit: number, lucroLiq: number) => {
    if (receita === 0) {
      return { margemBruta: 0, margemOperacional: 0, margemEbit: 0, margemLiquida: 0 };
    }
    
    return {
      margemBruta: (lucroBruto / receita) * 100,
      margemOperacional: (resultadoOp / receita) * 100, 
      margemEbit: (ebit / receita) * 100,
      margemLiquida: (lucroLiq / receita) * 100
    };
  }, []);

  // Analisar situação da empresa automaticamente
  const analisarEmpresa = useCallback((dados: any, margens: any) => {
    const receita = dados.totalRevenue / 1000000;
    const despesasOp = normalizarValor(dados.sellingGeneralAdministrative) / 1000000;
    const despesasFin = normalizarValor(dados.financialExpenses) / 1000000;
    
    // Análise da situação do lucro
    const situacaoLucro = dados.netIncome >= 0 ? 'lucro' : 'prejuizo';
    
    // Intensidade operacional (despesas vs receita)
    const intensidadeOp = despesasOp / receita;
    const intensidadeOperacional = intensidadeOp > 0.15 ? 'alta' : intensidadeOp > 0.08 ? 'media' : 'baixa';
    
    // Alavancagem financeira (juros vs receita)
    const alavancagemFin = despesasFin / receita;
    const alavancagemFinanceira = alavancagemFin > 0.05 ? 'alta' : alavancagemFin > 0.02 ? 'media' : 'baixa';
    
    // Eficiência operacional baseada na margem
    const eficienciaOperacional = margens.margemOperacional > 20 ? 'excelente' :
                                 margens.margemOperacional > 10 ? 'boa' :
                                 margens.margemOperacional > 0 ? 'regular' : 'ruim';
    
    // Qualidade do lucro (operacional vs líquido)
    const ratioQualidade = Math.abs(dados.operatingIncome) > 0 ? Math.abs(dados.netIncome / dados.operatingIncome) : 0;
    const qualidadeLucro = ratioQualidade > 0.8 ? 'alta' : ratioQualidade > 0.5 ? 'media' : 'baixa';
    
    return {
      situacaoLucro,
      intensidadeOperacional,
      alavancagemFinanceira, 
      eficienciaOperacional,
      qualidadeLucro,
      crescimentoConsistente: false // Seria necessário analisar histórico
    };
  }, [normalizarValor]);

  // Gerar badges inteligentes e categorizados
  const gerarBadgesInteligentes = useCallback((dados: any, variacoes: any, margens: any, analise: any): DadosTrimestre['badges'] => {
    const badges: DadosTrimestre['badges'] = [];
    
    // 🚀 BADGES DE CRESCIMENTO
    if (variacoes.receita.variacaoYoY > 25) {
      badges.push({
        tipo: 'success',
        categoria: 'crescimento',
        texto: 'Crescimento Explosivo',
        descricao: `Receita cresceu ${variacoes.receita.variacaoYoY.toFixed(1)}% YoY`,
        valor: variacoes.receita.variacaoYoY
      });
    } else if (variacoes.receita.variacaoYoY > 10) {
      badges.push({
        tipo: 'success',
        categoria: 'crescimento',
        texto: 'Crescimento Forte',
        descricao: `Receita +${variacoes.receita.variacaoYoY.toFixed(1)}% YoY`,
        valor: variacoes.receita.variacaoYoY
      });
    } else if (variacoes.receita.variacaoYoY < -15) {
      badges.push({
        tipo: 'error',
        categoria: 'crescimento',
        texto: 'Receita em Queda',
        descricao: `Receita caiu ${Math.abs(variacoes.receita.variacaoYoY).toFixed(1)}% YoY`,
        valor: variacoes.receita.variacaoYoY
      });
    }
    
    // 💰 BADGES DE RENTABILIDADE
    if (margens.margemBruta > 40) {
      badges.push({
        tipo: 'success',
        categoria: 'rentabilidade',
        texto: 'Margem Bruta Excelente',
        descricao: `${margens.margemBruta.toFixed(1)}% de margem bruta`,
        valor: margens.margemBruta
      });
    }
    
    if (margens.margemLiquida > 15) {
      badges.push({
        tipo: 'success',
        categoria: 'rentabilidade',
        texto: 'Alta Rentabilidade',
        descricao: `${margens.margemLiquida.toFixed(1)}% de margem líquida`,
        valor: margens.margemLiquida
      });
    } else if (margens.margemLiquida < 0) {
      badges.push({
        tipo: 'error',
        categoria: 'rentabilidade',
        texto: 'Prejuízo',
        descricao: `Margem líquida negativa: ${margens.margemLiquida.toFixed(1)}%`,
        valor: margens.margemLiquida
      });
    }
    
    // ⚡ BADGES DE EFICIÊNCIA
    if (analise.eficienciaOperacional === 'excelente') {
      badges.push({
        tipo: 'success',
        categoria: 'eficiencia',
        texto: 'Operação Eficiente',
        descricao: `${margens.margemOperacional.toFixed(1)}% de margem operacional`,
        valor: margens.margemOperacional
      });
    } else if (analise.eficienciaOperacional === 'ruim') {
      badges.push({
        tipo: 'warning',
        categoria: 'eficiencia',
        texto: 'Operação Ineficiente',
        descricao: `Margem operacional de apenas ${margens.margemOperacional.toFixed(1)}%`,
        valor: margens.margemOperacional
      });
    }
    
    // 💸 BADGES FINANCEIROS
    if (analise.alavancagemFinanceira === 'alta') {
      badges.push({
        tipo: 'warning',
        categoria: 'financeiro',
        texto: 'Alto Custo Financeiro',
        descricao: 'Despesas financeiras elevadas em relação à receita'
      });
    }
    
    // 🎯 BADGES DE PERFORMANCE LPA
    if (variacoes.lpa.variacaoYoY > 50) {
      badges.push({
        tipo: 'success',
        categoria: 'crescimento',
        texto: 'LPA em Disparada',
        descricao: `LPA cresceu ${variacoes.lpa.variacaoYoY.toFixed(1)}% YoY`,
        valor: variacoes.lpa.variacaoYoY
      });
    } else if (variacoes.lpa.variacaoYoY < -30) {
      badges.push({
        tipo: 'error',
        categoria: 'alerta',
        texto: 'LPA em Queda Forte',
        descricao: `LPA caiu ${Math.abs(variacoes.lpa.variacaoYoY).toFixed(1)}% YoY`,
        valor: variacoes.lpa.variacaoYoY
      });
    }
    
    return badges;
  }, []);

  // Função principal para buscar dados completos do trimestre
  const buscarDadosTrimestre = useCallback(async (ticker: string, trimestre: string): Promise<DadosTrimestre> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Buscando dados completos: ${ticker} - ${trimestre}`);
      
      // 1. Buscar dados com todos os módulos necessários
      const data = await brapiRequest(`/quote/${ticker}`, {
        modules: 'incomeStatementHistoryQuarterly,financialDataHistoryQuarterly,defaultKeyStatisticsHistoryQuarterly,balanceSheetHistoryQuarterly'
      });
      
      if (!data.results || data.results.length === 0) {
        throw new Error(`Empresa ${ticker} não encontrada na BRAPI`);
      }
      
      const dadosEmpresa = data.results[0];
      const historicoReceita = dadosEmpresa.incomeStatementHistoryQuarterly || [];
      
      if (historicoReceita.length === 0) {
        throw new Error(`Dados históricos não disponíveis para ${ticker}`);
      }
      
      // 2. Encontrar dados do trimestre específico
      const dataReferencia = converterTrimestreParaData(trimestre);
      let dadosTrimestre = historicoReceita[0]; // Mais recente como fallback
      
      if (dataReferencia) {
        const dadoEspecifico = historicoReceita.find(d => d.endDate === dataReferencia);
        if (dadoEspecifico) {
          dadosTrimestre = dadoEspecifico;
          console.log(`✅ Encontrados dados específicos para ${trimestre}`);
        } else {
          console.log(`⚠️ Dados de ${trimestre} não encontrados, usando mais recente`);
        }
      }
      
      // 3. PROCESSAR DEMONSTRATIVO DE RESULTADOS COMPLETO
      const receitaBruta = (dadosTrimestre.totalRevenue || 0) / 1000000;
      const custoProdutos = normalizarValor(dadosTrimestre.costOfRevenue) / 1000000;
      const lucroBruto = (dadosTrimestre.grossProfit || 0) / 1000000;
      const despesasVendas = normalizarValor(dadosTrimestre.salesExpenses) / 1000000;
      const despesasAdm = normalizarValor(dadosTrimestre.sellingGeneralAdministrative) / 1000000;
      const outrasReceitasDespesas = (dadosTrimestre.otherOperatingExpenses || 0) / 1000000;
      const resultadoOperacional = (dadosTrimestre.operatingIncome || 0) / 1000000;
      const ebit = (dadosTrimestre.ebit || 0) / 1000000;
      const receitasFinanceiras = (dadosTrimestre.financialIncome || 0) / 1000000;
      const despesasFinanceiras = normalizarValor(dadosTrimestre.financialExpenses) / 1000000;
      const resultadoFinanceiro = (dadosTrimestre.financialResult || 0) / 1000000;
      const lucroAntesImposto = (dadosTrimestre.incomeBeforeTax || 0) / 1000000;
      const impostoRenda = (dadosTrimestre.incomeTaxExpense || 0) / 1000000;
      const impostoCorrente = (dadosTrimestre.currentTaxes || 0) / 1000000;
      const impostoDiferido = (dadosTrimestre.deferredTaxes || 0) / 1000000;
      const lucroLiquido = (dadosTrimestre.netIncome || 0) / 1000000;
      
      // 4. CALCULAR MARGENS
      const margens = calcularMargens(receitaBruta, lucroBruto, resultadoOperacional, ebit, lucroLiquido);
      
      // 5. PROCESSAR DADOS POR AÇÃO
      const lpaBasico = dadosTrimestre.basicEarningsPerCommonShare || 0;
      const lpaDiluido = dadosTrimestre.dilutedEarningsPerCommonShare || 0;
      
      // 6. CALCULAR VARIAÇÕES HISTÓRICAS
      const trimestreAnterior = historicoReceita[1];
      const trimestreMesmoAnoAnterior = historicoReceita[4] || historicoReceita[0];
      
      const variacoes = {
        receita: {
          valor: receitaBruta,
          variacaoQoQ: trimestreAnterior ? calcularVariacao(receitaBruta, (trimestreAnterior.totalRevenue || 0) / 1000000) : 0,
          variacaoYoY: trimestreMesmoAnoAnterior ? calcularVariacao(receitaBruta, (trimestreMesmoAnoAnterior.totalRevenue || 0) / 1000000) : 0
        },
        lucroBruto: {
          valor: lucroBruto,
          variacaoQoQ: trimestreAnterior ? calcularVariacao(lucroBruto, (trimestreAnterior.grossProfit || 0) / 1000000) : 0,
          variacaoYoY: trimestreMesmoAnoAnterior ? calcularVariacao(lucroBruto, (trimestreMesmoAnoAnterior.grossProfit || 0) / 1000000) : 0
        },
        ebit: {
          valor: ebit,
          variacaoQoQ: trimestreAnterior ? calcularVariacao(ebit, (trimestreAnterior.ebit || 0) / 1000000) : 0,
          variacaoYoY: trimestreMesmoAnoAnterior ? calcularVariacao(ebit, (trimestreMesmoAnoAnterior.ebit || 0) / 1000000) : 0
        },
        lucroLiquido: {
          valor: lucroLiquido,
          variacaoQoQ: trimestreAnterior ? calcularVariacao(lucroLiquido, (trimestreAnterior.netIncome || 0) / 1000000) : 0,
          variacaoYoY: trimestreMesmoAnoAnterior ? calcularVariacao(lucroLiquido, (trimestreMesmoAnoAnterior.netIncome || 0) / 1000000) : 0
        },
        lpa: {
          valor: lpaBasico,
          variacaoQoQ: trimestreAnterior ? calcularVariacao(lpaBasico, trimestreAnterior.basicEarningsPerCommonShare || 0) : 0,
          variacaoYoY: trimestreMesmoAnoAnterior ? calcularVariacao(lpaBasico, trimestreMesmoAnoAnterior.basicEarningsPerCommonShare || 0) : 0
        }
      };
      
      // 7. ANÁLISE AUTOMÁTICA
      const analiseAutomatica = analisarEmpresa(dadosTrimestre, margens);
      
      // 8. PROCESSAR HISTÓRICO COMPARATIVO ENRIQUECIDO
      const historicoComparativo = historicoReceita.slice(0, 8).map(item => {
        const data = new Date(item.endDate);
        const ano = data.getFullYear();
        const mes = data.getMonth() + 1;
        const tri = Math.ceil(mes / 3);
        const anoAbrev = ano.toString().slice(-2);
        
        const receitaItem = (item.totalRevenue || 0) / 1000000;
        const custoItem = normalizarValor(item.costOfRevenue) / 1000000;
        const lucroBrutoItem = (item.grossProfit || 0) / 1000000;
        const despOpItem = normalizarValor(item.sellingGeneralAdministrative) / 1000000;
        const resultOpItem = (item.operatingIncome || 0) / 1000000;
        const ebitItem = (item.ebit || 0) / 1000000;
        const despFinItem = normalizarValor(item.financialExpenses) / 1000000;
        const lucroLiqItem = (item.netIncome || 0) / 1000000;
        const lpaItem = item.basicEarningsPerCommonShare || 0;
        
        const margensItem = calcularMargens(receitaItem, lucroBrutoItem, resultOpItem, ebitItem, lucroLiqItem);
        
        return {
          trimestre: `${tri}T${anoAbrev}`,
          data: item.endDate,
          receita: receitaItem,
          custoProdutos: custoItem,
          lucroBruto: lucroBrutoItem,
          despesasOperacionais: despOpItem,
          resultadoOperacional: resultOpItem,
          ebit: ebitItem,
          despesasFinanceiras: despFinItem,
          lucroLiquido: lucroLiqItem,
          lpaBasico: lpaItem,
          margemBruta: margensItem.margemBruta,
          margemOperacional: margensItem.margemOperacional,
          margemEbit: margensItem.margemEbit,
          margemLiquida: margensItem.margemLiquida
        };
      });
      
      // 9. GERAR BADGES INTELIGENTES
      const badges = gerarBadgesInteligentes(dadosTrimestre, variacoes, margens, analiseAutomatica);
      
      // 10. MONTAR RESULTADO FINAL COMPLETO
      const resultado: DadosTrimestre = {
        ticker: ticker.toUpperCase(),
        nomeEmpresa: dadosEmpresa.longName || dadosEmpresa.shortName || ticker.toUpperCase(),
        dataReferencia: dadosTrimestre.endDate,
        trimestre: trimestre,
        
        dadosPeriodo: {
          cotacaoFechamento: dadosEmpresa.regularMarketPrice || 0,
          performanceTrimestre: 0,
          volumeMedioTrimestre: dadosEmpresa.averageDailyVolume3Month || 0,
          plPeriodo: dadosEmpresa.priceEarnings || 0,
          marketCapPeriodo: dadosEmpresa.marketCap || 0,
          beta: 0, // Seria necessário buscar em outro endpoint
          dividendYield: 0
        },
        
        demonstrativoResultados: {
          receitaBruta,
          custoProdutos,
          lucroBruto,
          despesasVendas,
          despesasAdministrativas: despesasAdm,
          outrasReceitasDespesas,
          resultadoOperacional,
          ebit,
          receitasFinanceiras,
          despesasFinanceiras,
          resultadoFinanceiro,
          lucroAntesImposto,
          impostoRenda,
          impostoCorrente,
          impostoDiferido,
          lucroLiquido
        },
        
        margens,
        
        porAcao: {
          lpaBasico,
          lpaDiluido,
          numeroAcoesBasico: lucroLiquido !== 0 && lpaBasico !== 0 ? Math.abs((lucroLiquido * 1000000) / lpaBasico) : undefined,
          numeroAcoesDiluido: lucroLiquido !== 0 && lpaDiluido !== 0 ? Math.abs((lucroLiquido * 1000000) / lpaDiluido) : undefined
        },
        
        variacoes,
        analiseAutomatica,
        badges,
        historicoComparativo,
        
        // Mantém compatibilidade com formato anterior
        metricas: {
          receita: {
            valor: receitaBruta,
            unidade: 'milhões',
            variacao: variacoes.receita.variacaoQoQ,
            variacaoYoY: variacoes.receita.variacaoYoY
          },
          ebitda: {
            valor: ebit, // Usando EBIT como proxy
            unidade: 'milhões',
            margem: margens.margemEbit,
            variacao: variacoes.ebit.variacaoQoQ,
            variacaoYoY: variacoes.ebit.variacaoYoY
          },
          lucroLiquido: {
            valor: lucroLiquido,
            unidade: 'milhões',
            margem: margens.margemLiquida,
            variacao: variacoes.lucroLiquido.variacaoQoQ,
            variacaoYoY: variacoes.lucroLiquido.variacaoYoY
          },
          roe: {
            valor: dadosEmpresa.returnOnEquity || 0,
            unidade: '%'
          }
        }
      };
      
      console.log(`✅ Processamento completo concluído: ${resultado.badges.length} badges gerados`);
      console.log(`📊 Margens: Bruta ${margens.margemBruta.toFixed(1)}% | Operacional ${margens.margemOperacional.toFixed(1)}% | Líquida ${margens.margemLiquida.toFixed(1)}%`);
      
      return resultado;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro ao buscar dados BRAPI:', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [brapiRequest, converterTrimestreParaData, calcularVariacao, normalizarValor, calcularMargens, analisarEmpresa, gerarBadgesInteligentes]);

  // Buscar apenas cotação atual (para preview rápido)
  const buscarCotacao = useCallback(async (ticker: string) => {
    try {
      const data = await brapiRequest(`/quote/${ticker}`);
      return data.results[0];
    } catch (error) {
      console.error('Erro ao buscar cotação:', error);
      return null;
    }
  }, [brapiRequest]);

// Buscar apenas nome da empresa (chamada rápida)
const buscarNomeEmpresa = useCallback(async (ticker: string): Promise<string> => {
  try {
    const data = await brapiRequest(`/quote/${ticker}`);
    if (data.results && data.results[0]) {
      return data.results[0].longName || data.results[0].shortName || ticker.toUpperCase();
    }
    return ticker.toUpperCase();
  } catch (error) {
    console.log('Ticker não encontrado:', ticker);
    return ticker.toUpperCase();
  }
}, [brapiRequest]);

  return {
    buscarDadosTrimestre,
    buscarCotacao,
  buscarNomeEmpresa, // ✅ NOVO
    loading,
    error
  };
};