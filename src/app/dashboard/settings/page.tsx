/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use client';

import * as React from 'react';
import { debugLog, debugWarn, debugError } from '@/utils/logger';
import { DEFAULT_IFIX_CURRENT, IFIX_HISTORICAL_VALUES, createStaticIfixFallbackPayload } from '@/utils/ifixConstants';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useDataStore } from '@/hooks/useDataStore';
import { aplicarViesOverride, getViesBadgePalette, type ViesOverride } from '@/utils/vies';
import { useProventosPorAtivo } from '@/hooks/useProventosPorAtivo';

type PercentualParticipacao = {
  bruto: unknown;
  numerico: number | null;
};

// 🔥 DETECÇÃO DE DISPOSITIVO SIMPLIFICADA E OTIMIZADA
const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  React.useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
};

// 🚀 HOOK IFIX CORRIGIDO - USANDO IFIX.SA (DADOS REAIS)
function useIfixRealTime() {
  const [ifixData, setIfixData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const buscarIfixReal = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      debugLog('🚀 IFIX: Buscando dados reais com IFIX.SA...');

      const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
      
      // 🎯 ESTRATÉGIAS EM ORDEM DE PRIORIDADE (BASEADO NO TESTE)
      const estrategias = [
        // 1. IFIX.SA - COMPROVADAMENTE FUNCIONA
        {
          nome: 'IFIX.SA com token',
          url: `https://brapi.dev/api/quote/IFIX.SA?token=${BRAPI_TOKEN}`,
          headers: { 'Accept': 'application/json' }
        },
        // 2. IFIX.SA via Authorization header
        {
          nome: 'IFIX.SA via header',
          url: 'https://brapi.dev/api/quote/IFIX.SA',
          headers: { 
            'Accept': 'application/json',
            'Authorization': `Bearer ${BRAPI_TOKEN}`
          }
        },
        // 3. IFIX.SA sem token (plano gratuito)
        {
          nome: 'IFIX.SA sem token',
          url: 'https://brapi.dev/api/quote/IFIX.SA',
          headers: { 'Accept': 'application/json' }
        }
      ];

      let dadosObtidos = false;

      // 🎯 TENTAR CADA ESTRATÉGIA
      for (const estrategia of estrategias) {
        if (dadosObtidos) break;

        try {
          debugLog(`🎯 IFIX: Tentando "${estrategia.nome}"...`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          
          const response = await fetch(estrategia.url, {
            method: 'GET',
            headers: estrategia.headers,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          debugLog(`📊 IFIX: ${estrategia.nome} - Status: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            debugLog(`📊 IFIX: ${estrategia.nome} - Resposta:`, data);

            // ✅ VERIFICAR ERROS
            if (data.error) {
              debugLog(`❌ IFIX: ${estrategia.nome} - Erro: ${data.message}`);
              continue;
            }

            // ✅ PROCESSAR DADOS
            const resultado = data.results?.[0];
            if (resultado?.regularMarketPrice) {
              const preco = resultado.regularMarketPrice;
              
              debugLog(`🔍 IFIX: ${estrategia.nome} - Preço: ${preco}`);
              
              // ✅ VALIDAÇÃO: IFIX.SA deve estar entre 3000-4000
              if (preco >= 3000 && preco <= 4000) {
                const dados = {
                  valor: preco,
                  valorFormatado: new Intl.NumberFormat('pt-BR', {
                    maximumFractionDigits: 0
                  }).format(Math.round(preco)),
                  variacao: resultado.regularMarketChange || 0,
                  variacaoPercent: resultado.regularMarketChangePercent || 0,
                  trend: (resultado.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down',
                  timestamp: new Date().toISOString(),
                  fonte: estrategia.nome,
                  symbol: resultado.symbol,
                  name: resultado.shortName || 'IFIX - Índice de Fundos Imobiliários'
                };

                debugLog(`✅ IFIX: DADOS REAIS OBTIDOS!`, dados);
                setIfixData(dados);
                dadosObtidos = true;
                break;
              } else {
                debugLog(`❌ IFIX: ${estrategia.nome} - Preço fora da faixa válida: ${preco}`);
              }
            } else {
              debugLog(`❌ IFIX: ${estrategia.nome} - Sem dados de preço`);
            }
          } else {
            debugLog(`❌ IFIX: ${estrategia.nome} - HTTP ${response.status}`);
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            debugLog(`⏱️ IFIX: ${estrategia.nome} - Timeout`);
          } else {
            debugError(`❌ IFIX: ${estrategia.nome} - Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        }

        // Delay entre tentativas
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // ⚠️ FALLBACK (só se IFIX.SA não funcionar)
      if (!dadosObtidos) {
        debugWarn('⚠️ IFIX: IFIX.SA falhou. Usando fallback baseado no último valor conhecido...');
        
        // Baseado no valor real que vimos
        const valorUltimoConhecido = DEFAULT_IFIX_CURRENT;
        const agora = new Date();
        const isHorarioComercial = agora.getHours() >= 9 && agora.getHours() <= 18;

        // Pequena variação aleatória
        const variacaoSimulada = (Math.random() - 0.5) * (isHorarioComercial ? 0.8 : 0.3);
        const valorFinal = valorUltimoConhecido * (1 + variacaoSimulada / 100);

        const dadosFallback = {
          ...createStaticIfixFallbackPayload('FALLBACK_BASEADO_EM_3417'),
          valor: valorFinal,
          valorFormatado: new Intl.NumberFormat('pt-BR', {
            maximumFractionDigits: 0
          }).format(Math.round(valorFinal)),
          variacao: valorFinal - valorUltimoConhecido,
          variacaoPercent: variacaoSimulada,
          trend: variacaoSimulada >= 0 ? 'up' : 'down',
          symbol: 'IFIX.SA',
          name: 'IFIX - Índice de Fundos Imobiliários'
        };
        
        debugLog('📈 IFIX: Fallback baseado no valor real:', dadosFallback);
        setIfixData(dadosFallback);
        setError('Usando dados baseados no último valor conhecido');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      debugError('❌ IFIX: Erro geral:', err);
      setError(errorMessage);
      
      // Emergência: usar o valor real que descobrimos
      setIfixData({
        ...createStaticIfixFallbackPayload('EMERGENCIA_VALOR_REAL'),
        valor: DEFAULT_IFIX_CURRENT,
        valorFormatado: new Intl.NumberFormat('pt-BR', {
          maximumFractionDigits: 0
        }).format(Math.round(DEFAULT_IFIX_CURRENT)),
        variacao: -1.25,
        variacaoPercent: -0.04,
        trend: 'down',
        symbol: 'IFIX.SA',
        name: 'IFIX - Índice de Fundos Imobiliários'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    buscarIfixReal();
    const interval = setInterval(buscarIfixReal, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [buscarIfixReal]);

  return { ifixData, loading, error, refetch: buscarIfixReal };
}

// 🚀 HOOK IFIX PERÍODO CORRIGIDO - USA DADOS DO useIfixRealTime
function useIfixPeriodo(ativosAtualizados: any[], ifixAtualData: any) {
  const [ifixPeriodo, setIfixPeriodo] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const calcularIfixPeriodo = async () => {
      if (!ativosAtualizados || ativosAtualizados.length === 0) return;

      try {
        setLoading(true);

        // 📅 ENCONTRAR A DATA MAIS ANTIGA DA CARTEIRA
        let dataMaisAntiga = new Date('2030-01-01');
        ativosAtualizados.forEach(ativo => {
          if (ativo.dataEntrada && !ativo.posicaoEncerrada) {
            const [dia, mes, ano] = ativo.dataEntrada.split('/');
            const dataAtivo = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
            
            if (dataAtivo < dataMaisAntiga) {
              dataMaisAntiga = dataAtivo;
            }
          }
        });

        if (dataMaisAntiga.getFullYear() > 2025) {
          dataMaisAntiga = new Date(2020, 2, 23);
        }

        debugLog('📅 Data mais antiga da carteira:', dataMaisAntiga.toLocaleDateString('pt-BR'));

        // 📊 USAR IFIX ATUAL DO HOOK PRINCIPAL (EVITA BUSCA DUPLICADA)
        let ifixAtual = 3417.45; // Fallback baseado no valor real descoberto
        
        if (ifixAtualData?.valor && ifixAtualData.valor > 3000) {
          ifixAtual = ifixAtualData.valor;
          debugLog('✅ IFIX atual recebido do hook principal:', ifixAtual.toLocaleString('pt-BR'));
        } else {
          debugLog('⚠️ IFIX atual não disponível, usando fallback realista:', ifixAtual.toLocaleString('pt-BR'));
        }

        // 📊 VALORES HISTÓRICOS DO IFIX ATUALIZADOS
        const anoInicial = dataMaisAntiga.getFullYear();
        const mesInicial = dataMaisAntiga.getMonth();
        
        const valoresHistoricos = IFIX_HISTORICAL_VALUES;
        
        // 🎯 BUSCAR VALOR HISTÓRICO
        const chaveEspecifica = `${anoInicial}-${mesInicial}`;
        const ifixInicial = valoresHistoricos[chaveEspecifica] || 
                           valoresHistoricos[`${anoInicial}-0`] || 3000;
        
        debugLog(`📊 IFIX inicial (${chaveEspecifica}):`, ifixInicial.toLocaleString('pt-BR'));
        debugLog(`📊 IFIX atual:`, ifixAtual.toLocaleString('pt-BR'));

        // 🧮 CALCULAR PERFORMANCE NO PERÍODO
        const performancePeriodo = ((ifixAtual - ifixInicial) / ifixInicial) * 100;
        
        debugLog(`📊 Performance IFIX no período: ${performancePeriodo.toFixed(2)}%`);
        
        // 📅 FORMATAR PERÍODO
        const mesInicial_formatado = dataMaisAntiga.toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: 'numeric' 
        });
        
        const resultado = {
          performancePeriodo,
          dataInicial: mesInicial_formatado,
          ifixInicial,
          ifixAtual,
          anoInicial: dataMaisAntiga.getFullYear(),
          diasNoPeriodo: Math.floor((Date.now() - dataMaisAntiga.getTime()) / (1000 * 60 * 60 * 24)),
          dataEntradaCompleta: dataMaisAntiga.toLocaleDateString('pt-BR')
        };

        debugLog('📊 Resultado FINAL IFIX período:', {
          periodo: `desde ${mesInicial_formatado}`,
          inicial: ifixInicial.toLocaleString('pt-BR'),
          atual: ifixAtual.toLocaleString('pt-BR'),
          performance: performancePeriodo.toFixed(2) + '%'
        });

        setIfixPeriodo(resultado);

      } catch (error) {
        debugError('❌ Erro ao calcular IFIX período:', error);
        
        // Fallback baseado no valor real descoberto
        const fallback = {
          performancePeriodo: 5.5, // Performance estimada baseada nos dados reais
          dataInicial: 'jan/2021',
          ifixInicial: 3150,
          ifixAtual: 3417.45, // Valor real descoberto
          anoInicial: 2021,
          diasNoPeriodo: Math.floor((Date.now() - new Date(2021, 0, 15).getTime()) / (1000 * 60 * 60 * 24)),
          dataEntradaCompleta: '15/01/2021'
        };
        
        setIfixPeriodo(fallback);
      } finally {
        setLoading(false);
      }
    };

    calcularIfixPeriodo();
  }, [ativosAtualizados, ifixAtualData]); // Agora depende do ifixAtualData

  return { ifixPeriodo, loading };
}

// 🔥 FUNÇÃO OTIMIZADA PARA CALCULAR VIÉS
function calcularViesAutomatico(
  precoTeto: number | undefined,
  precoAtual: string,
  override?: ViesOverride | null
): string {
  if (!precoTeto || precoAtual === 'N/A') {
    return aplicarViesOverride(override, 'Aguardar');
  }

  const precoAtualNum = parseFloat(precoAtual.replace('R$ ', '').replace(',', '.'));
  if (isNaN(precoAtualNum)) {
    return aplicarViesOverride(override, 'Aguardar');
  }

  const viesAutomatico = precoAtualNum < precoTeto ? 'Compra' : 'Aguardar';
  return aplicarViesOverride(override, viesAutomatico);
}

// 🚀 FUNÇÃO OTIMIZADA PARA BUSCAR COTAÇÕES - SEMPRE ESTRATÉGIA MOBILE
const normalizarTicker = (symbol?: string) => {
  if (!symbol) return '';

  const [base] = symbol.split('.');
  return base.toUpperCase();
};

async function buscarCotacoesParalelas(tickers: string[], isMobile: boolean): Promise<Map<string, any>> {
  const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
  const cotacoesMap = new Map();
  
  debugLog('🚀 [OTIMIZADO] Buscando', tickers.length, 'cotações EM PARALELO...');
  
  // ✅ STRATEGY 1: Tentar batch request primeiro (1 requisição para todos)
  try {
    const batchUrl = `https://brapi.dev/api/quote/${tickers.join(',')}?token=${BRAPI_TOKEN}`;
    const response = await Promise.race([
      fetch(batchUrl),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Batch timeout')), 5000))
    ]);
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        debugLog('✅ BATCH REQUEST SUCESSO:', data.results.length, 'cotações em 1 só request');
        
        data.results.forEach((quote: any) => {
          if (quote.regularMarketPrice > 0) {
            const tickerNormalizado = normalizarTicker(quote.symbol);
            const chavePrincipal = tickerNormalizado || (quote.symbol ? quote.symbol.toUpperCase() : '');

            if (!chavePrincipal) return;

            const dadosCotacao = {
              precoAtual: quote.regularMarketPrice,
              variacao: quote.regularMarketChange || 0,
              variacaoPercent: quote.regularMarketChangePercent || 0,
              volume: quote.regularMarketVolume || 0,
              nome: quote.shortName || quote.longName || quote.symbol,
              dadosCompletos: quote
            };

            cotacoesMap.set(chavePrincipal, dadosCotacao);

            if (quote.symbol && chavePrincipal !== quote.symbol) {
              cotacoesMap.set(quote.symbol, dadosCotacao);
            }
          }
        });
        
        return cotacoesMap;
      }
    }
  } catch (error) {
    debugLog('❌ Batch request falhou, usando paralelo individual');
  }
  
  // ✅ STRATEGY 2: Requests paralelos individuais (SEM DELAYS!)
  debugLog('🚀 [PARALELO] Executando', tickers.length, 'requests simultâneos...');
  
  const promises = tickers.map(async (ticker) => {
    try {
      const response = await Promise.race([
        fetch(`https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}`, {
          headers: { 'Accept': 'application/json' }
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Individual timeout')), 4000))
      ]);

      if (response.ok) {
        const data = await response.json();
        const quote = data.results?.[0];
        
        if (quote?.regularMarketPrice > 0) {
          const tickerNormalizado = normalizarTicker(quote.symbol) || ticker;
          const chavePrincipal = tickerNormalizado || ticker;

          const dadosCotacao = {
            precoAtual: quote.regularMarketPrice,
            variacao: quote.regularMarketChange || 0,
            variacaoPercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            nome: quote.shortName || quote.longName || ticker,
            dadosCompletos: quote
          };

          cotacoesMap.set(chavePrincipal, dadosCotacao);

          if (quote.symbol && chavePrincipal !== quote.symbol) {
            cotacoesMap.set(quote.symbol, dadosCotacao);
          }
        }
      }
    } catch (error) {
      debugLog(`❌ [${ticker}]:`, error instanceof Error ? error.message : 'Erro desconhecido');
    }
  });
  
  // 🚀 EXECUTAR TODAS EM PARALELO (ZERO DELAYS)
  await Promise.allSettled(promises);
  
  debugLog('✅ [PARALELO] Concluído:', cotacoesMap.size, 'de', tickers.length);
  return cotacoesMap;
}

// 🔄 FUNÇÃO PARA BUSCAR DY COM A MESMA ESTRATÉGIA DO DETALHE DO ATIVO
async function buscarDYsComEstrategia(tickers: string[], isMobile: boolean): Promise<Map<string, string>> {
  const dyMap = new Map<string, string>();

  if (tickers.length === 0) {
    return dyMap;
  }

  debugLog('📈 [OTIMIZADO] Buscando DY para', tickers.length, 'tickers com estratégia integrada...');

  const preencherMapComResultado = (
    chavePrincipal: string,
    valorFormatado: string,
    resultado: { symbol?: string | null; requested?: string | null }
  ) => {
    const chaveUpper = chavePrincipal.toUpperCase();
    const chaveNormalizada = normalizarTicker(chavePrincipal) || chaveUpper;

    dyMap.set(chaveUpper, valorFormatado);
    dyMap.set(chaveNormalizada, valorFormatado);

    if (resultado.symbol) {
      const symbolUpper = resultado.symbol.toUpperCase();
      const symbolNormalizado = normalizarTicker(resultado.symbol) || symbolUpper;
      dyMap.set(symbolUpper, valorFormatado);
      dyMap.set(symbolNormalizado, valorFormatado);
    }

    if (resultado.requested) {
      const requestedUpper = resultado.requested.toUpperCase();
      const requestedNormalizada = normalizarTicker(resultado.requested) || requestedUpper;
      dyMap.set(requestedUpper, valorFormatado);
      dyMap.set(requestedNormalizada, valorFormatado);
    }
  };

  const tickersComDadosIncompletos = new Set<string>();

  const marcarTickerComoIncompleto = (ticker?: string | null) => {
    if (!ticker) return;
    const chaveUpper = ticker.toUpperCase();
    const chaveNormalizada = normalizarTicker(ticker) || chaveUpper;

    tickersComDadosIncompletos.add(chaveUpper);
    tickersComDadosIncompletos.add(chaveNormalizada);
  };

  const resultadoPrecisaFallback = (resultado: any): boolean => {
    if (!resultado) return true;

    const dyNumero = typeof resultado.dy12Meses === 'number'
      ? resultado.dy12Meses
      : Number.parseFloat(String(resultado.dy12Meses ?? '').replace(',', '.'));

    if (Number.isFinite(dyNumero) && dyNumero > 0) {
      return false;
    }

    const fonteTexto = typeof resultado.fonte === 'string' ? resultado.fonte.toLowerCase() : '';
    const dyFormatado = typeof resultado.dyFormatado === 'string' ? resultado.dyFormatado.trim() : '';

    const fonteIndicaErro = fonteTexto
      ? /nao_encontrado|erro|indisponivel|sem_resultado/.test(fonteTexto)
      : false;

    if (fonteIndicaErro) {
      return true;
    }

    if (!dyFormatado || dyFormatado === '0,00%') {
      return fonteTexto.length === 0;
    }

    return !Number.isFinite(dyNumero) || dyNumero <= 0;
  };

  try {
    const response = await fetch('/api/dividend-yield/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickers })
    });

    if (response.ok) {
      const data = await response.json();
      const resultadosBatch = data?.results || {};

      Object.entries(resultadosBatch).forEach(([ticker, resultado]: [string, any]) => {
        const valorFormatado = resultado?.dyFormatado || '0,00%';
        preencherMapComResultado(ticker, valorFormatado, resultado || {});

        if (resultadoPrecisaFallback(resultado)) {
          marcarTickerComoIncompleto(ticker);
          marcarTickerComoIncompleto(resultado?.symbol);
          marcarTickerComoIncompleto(resultado?.requested);
        }
      });

      debugLog('✅ [DY-BATCH] Concluído via API:', dyMap.size, 'registros atualizados');
    } else {
      debugLog('⚠️ [DY-BATCH] Falha na API batch:', response.status, response.statusText);
    }
  } catch (error) {
    debugLog('⚠️ [DY-BATCH] Erro ao buscar batch:', error instanceof Error ? error.message : 'Erro desconhecido');
  }

  const faltantes = tickers.filter((ticker) => {
    const chaveUpper = ticker.toUpperCase();
    const chaveNormalizada = normalizarTicker(ticker) || chaveUpper;

    if (!dyMap.has(chaveNormalizada)) {
      return true;
    }

    if (tickersComDadosIncompletos.has(chaveUpper) || tickersComDadosIncompletos.has(chaveNormalizada)) {
      return true;
    }

    const valorAtual = dyMap.get(chaveNormalizada);
    return !valorAtual || valorAtual === '0,00%';
  });

  if (faltantes.length > 0) {
    console.log('⚠️ [DY-FALLBACK] Preenchendo valores padrão para', faltantes.length, 'tickers');

    faltantes.forEach((ticker) => {
      const chaveUpper = ticker.toUpperCase();
      const resultadoFallback = {
        dy12Meses: 0,
        dyFormatado: '0,00%',
        fonte: 'market_fetcher | indisponivel',
        symbol: chaveUpper,
        requested: chaveUpper
      };

      preencherMapComResultado(ticker, resultadoFallback.dyFormatado, resultadoFallback);
    });
  }

  debugLog('✅ [DY-INTEGRADO] Concluído:', dyMap.size, 'registros atualizados');
  return dyMap;
}

// 🚀 HOOK PRINCIPAL OTIMIZADO COM LOADING STATES GRANULARES
function useFiisIntegradas() {
  const { dados } = useDataStore();
  const [ativosAtualizados, setAtivosAtualizados] = React.useState<any[]>([]);
  const [cotacoesAtualizadas, setCotacoesAtualizadas] = React.useState<any>({});
  
  // Estados para garantir que TODOS os dados estejam prontos
  const [cotacoesCompletas, setCotacoesCompletas] = React.useState<Map<string, any>>(new Map());
  const [dyCompletos, setDyCompletos] = React.useState<Map<string, string>>(new Map());
  type ProventosResumo = {
    totalDesdeEntrada: number;
    totalUltimos12Meses: number;
  };

  const [proventosCompletos, setProventosCompletos] = React.useState<Map<string, ProventosResumo>>(new Map());
  const [todosOsDadosProntos, setTodosOsDadosProntos] = React.useState(false);
  
  // Loading states granulares
  const [loadingCotacoes, setLoadingCotacoes] = React.useState(true);
  const [loadingDY, setLoadingDY] = React.useState(false);
  const [loadingProventos, setLoadingProventos] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isMobile = useDeviceDetection();
  const [proventosMap, setProventosMap] = React.useState<Map<string, ProventosResumo>>(new Map());
  const fiisData = dados.fiis || [];

  // Função otimizada para buscar proventos
  const buscarProventosAtivos = React.useCallback(async (ativosData: any[]) => {
    setLoadingProventos(true);
    const novosProventos = new Map<string, ProventosResumo>();
    
    debugLog('💰 Iniciando busca de proventos para', ativosData.length, 'FIIs');
    
    const buscarProventoAtivo = async (ativo: any) => {
      try {
        const [dia, mes, ano] = ativo.dataEntrada.split('/');
        const dataEntradaISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        
        debugLog(`💰 Buscando proventos para ${ativo.ticker} desde ${ativo.dataEntrada}`);
        
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`/api/proventos/${ativo.ticker}`, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const proventosRaw = await response.json();

          if (Array.isArray(proventosRaw)) {
            const dataEntradaDate = new Date(dataEntradaISO + 'T00:00:00');
            const limite12Meses = new Date();
            limite12Meses.setFullYear(limite12Meses.getFullYear() - 1);

            const proventosFiltrados = proventosRaw.filter((p: any) => {
              if (!p.dataObj) return false;
              const dataProvento = new Date(p.dataObj);
              return dataProvento >= dataEntradaDate;
            });

            const totais = proventosFiltrados.reduce(
              (acc: ProventosResumo, p: any) => {
                const valor = typeof p.valor === 'number' ? p.valor : 0;
                if (valor <= 0) {
                  return acc;
                }

                acc.totalDesdeEntrada += valor;

                const dataValor = new Date(p.dataObj);
                if (!Number.isNaN(dataValor.getTime()) && dataValor >= limite12Meses) {
                  acc.totalUltimos12Meses += valor;
                }

                return acc;
              },
              { totalDesdeEntrada: 0, totalUltimos12Meses: 0 } as ProventosResumo
            );

            debugLog(
              `💰 ${ativo.ticker}: R$ ${totais.totalDesdeEntrada.toFixed(2)} (${proventosFiltrados.length} proventos, ` +
                `R$ ${totais.totalUltimos12Meses.toFixed(2)} nos últimos 12 meses)`
            );

            return { ticker: ativo.ticker, totais };
          }
        } else {
          debugLog(`💰 ${ativo.ticker}: Erro HTTP ${response.status}`);
        }
      } catch (error) {
        debugLog(`💰 ${ativo.ticker}: Erro -`, error instanceof Error ? error.message : 'Erro desconhecido');
      }

      return { ticker: ativo.ticker, totais: { totalDesdeEntrada: 0, totalUltimos12Meses: 0 } };
    };

    // Buscar proventos em paralelo
    const resultados = await Promise.allSettled(
      ativosData.map(ativo => buscarProventoAtivo(ativo))
    );

    resultados.forEach((resultado) => {
      if (resultado.status === 'fulfilled') {
        const tickerNormalizado = normalizarTicker(resultado.value.ticker) || resultado.value.ticker;

        novosProventos.set(tickerNormalizado, resultado.value.totais);

        if (tickerNormalizado !== resultado.value.ticker) {
          novosProventos.set(resultado.value.ticker, resultado.value.totais);
        }
      }
    });

    debugLog('💰 Proventos finais:', Object.fromEntries(novosProventos));
    setProventosMap(novosProventos);
    setLoadingProventos(false);
    return novosProventos;
  }, []);

  // 🎯 FUNÇÃO PRINCIPAL REESCRITA - ABORDAGEM STEP-BY-STEP ROBUSTA
  const buscarDadosCompletos = React.useCallback(async () => {
    if (fiisData.length === 0) {
      setAtivosAtualizados([]);
      setLoadingCotacoes(false);
      return;
    }

    try {
      setError(null);
      setTodosOsDadosProntos(false);
      const tickers = fiisData.map(ativo => ativo.ticker);
      
      debugLog('🚀 INICIANDO BUSCA STEP-BY-STEP ROBUSTA - ESTRATÉGIA MOBILE UNIVERSAL...');
      
      // 🔄 RESET DOS ESTADOS
      setCotacoesCompletas(new Map());
      setDyCompletos(new Map());
      setProventosCompletos(new Map());

      // ⚡ PARALELIZAÇÃO TOTAL - SUBSTITUA TODO O BLOCO DAS ETAPAS POR ISTO:
      debugLog('⚡ EXECUTANDO TODAS AS ETAPAS EM PARALELO...');

      // Ativar todos os loadings
      setLoadingCotacoes(true);
      setLoadingDY(true);
      setLoadingProventos(true);

      // Medir tempo
      const inicioTempo = performance.now();

      // EXECUTAR TUDO EM PARALELO
      const [cotacoesResult, dyResult, proventosResult] = await Promise.allSettled([
        buscarCotacoesParalelas(tickers, isMobile),
        buscarDYsComEstrategia(tickers, isMobile),
        buscarProventosAtivos(fiisData)
      ]);

      const tempoTotal = performance.now() - inicioTempo;
      debugLog(`🎉 TODAS AS ETAPAS CONCLUÍDAS EM ${tempoTotal.toFixed(0)}ms!`);

      // Processar resultados
      const cotacoesMap = cotacoesResult.status === 'fulfilled' ? cotacoesResult.value : new Map();
      const dyMap = dyResult.status === 'fulfilled' ? dyResult.value : new Map();
      const proventosData = proventosResult.status === 'fulfilled' ? proventosResult.value : new Map();

      // Logs de debug (seus logs originais mantidos)
      debugLog('📊 Cotações obtidas:', cotacoesMap.size, 'de', tickers.length);
      debugLog('📈 DY obtidos:', dyMap.size, 'de', tickers.length);
      debugLog('💰 Proventos obtidos:', proventosData.size, 'de', fiisData.length);

      // Seu debug do DY mantido
      debugLog('🔍 [PARALLEL-DEBUG] dyMap processado:');
      debugLog('🔍 [PARALLEL-DEBUG] dyMap.size:', dyMap.size);
      debugLog('🔍 [PARALLEL-DEBUG] dyMap conteúdo:', Object.fromEntries(dyMap));
      debugLog('🔍 [PARALLEL-DEBUG] Exemplo KNRI11:', dyMap.get('KNRI11'));
      debugLog('🔍 [PARALLEL-DEBUG] Exemplo HGLG11:', dyMap.get('HGLG11'));

      // Atualizar estados
      setCotacoesCompletas(cotacoesMap);
      setDyCompletos(dyMap);
      setProventosCompletos(proventosData);

      // Desativar loadings
      setLoadingCotacoes(false);
      setLoadingDY(false);
      setLoadingProventos(false);
      
      // Marcar como pronto para processamento final
      setTodosOsDadosProntos(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      debugError('❌ Erro na busca otimizada:', err);
      setTodosOsDadosProntos(true);
    }
  }, [fiisData, isMobile, buscarProventosAtivos]);

  // 🏆 USEEFFECT QUE SÓ EXECUTA QUANDO TODOS OS DADOS ESTÃO PRONTOS
  React.useEffect(() => {
    if (!todosOsDadosProntos || fiisData.length === 0) return;
    
    // 🔍 DEBUG COMPLETO DAS DEPENDÊNCIAS
    debugLog('🏆 PROCESSANDO TOTAL RETURN - TODOS OS DADOS PRONTOS!');
    debugLog('🔍 [DEPS-DEBUG] Verificando estados no momento da execução:');
    debugLog('🔍 [DEPS-DEBUG] todosOsDadosProntos:', todosOsDadosProntos);
    debugLog('🔍 [DEPS-DEBUG] fiisData.length:', fiisData.length);
    debugLog('🔍 [DEPS-DEBUG] cotacoesCompletas.size:', cotacoesCompletas.size);
    debugLog('🔍 [DEPS-DEBUG] dyCompletos.size:', dyCompletos.size);
    debugLog('🔍 [DEPS-DEBUG] proventosCompletos.size:', proventosCompletos.size);
    debugLog('🔍 [DEPS-DEBUG] dyCompletos conteúdo:', Object.fromEntries(dyCompletos));
    
    debugLog('📊 Dados disponíveis:', {
      cotacoes: cotacoesCompletas.size,
      dy: dyCompletos.size, 
      proventos: proventosCompletos.size,
      ativos: fiisData.length
    });

    const novasCotacoes: any = {};

    // 🎯 PROCESSAR TODOS OS ATIVOS COM TOTAL RETURN CORRETO
    const ativosFinais = fiisData.map((ativo, index) => {
      const tickerNormalizado = normalizarTicker(ativo.ticker) || ativo.ticker;
      const cotacao = cotacoesCompletas.get(tickerNormalizado);

      // 🔍 DEBUG DY ASSIGNMENT
      let dyAPI = dyCompletos.get(tickerNormalizado) || '0,00%';
      debugLog(`🔍 [ASSIGN-DEBUG] ${ativo.ticker}:`);
      debugLog(`  - dyCompletos.size: ${dyCompletos.size}`);
      debugLog(`  - dyCompletos.has('${ativo.ticker}'): ${dyCompletos.has(tickerNormalizado)}`);
      debugLog(`  - dyCompletos.get('${ativo.ticker}'): ${dyCompletos.get(tickerNormalizado)}`);
      debugLog(`  - dyAPI final: ${dyAPI}`);
      debugLog(`  - loadingDY: ${loadingDY}`);
      
      const proventosInfo =
        proventosCompletos.get(tickerNormalizado) || proventosCompletos.get(ativo.ticker) || {
          totalDesdeEntrada: 0,
          totalUltimos12Meses: 0
        };

      const proventosTotal = proventosInfo.totalDesdeEntrada;
      const proventos12Meses = proventosInfo.totalUltimos12Meses;

      if (cotacao && cotacao.precoAtual > 0) {
        // ✅ ATIVO COM COTAÇÃO REAL
        const precoAtualNum = cotacao.precoAtual;
        const performanceAcao = ((precoAtualNum - ativo.precoEntrada) / ativo.precoEntrada) * 100;
        const performanceProventos = ativo.precoEntrada > 0 ? (proventosTotal / ativo.precoEntrada) * 100 : 0;
        const performanceTotal = performanceAcao + performanceProventos;

        novasCotacoes[tickerNormalizado] = precoAtualNum;

        if (tickerNormalizado !== ativo.ticker) {
          novasCotacoes[ativo.ticker] = precoAtualNum;
        }

        const dyNumero = Number.parseFloat(dyAPI.replace('%', '').replace(',', '.'));
        if ((!Number.isFinite(dyNumero) || dyNumero <= 0) && precoAtualNum > 0 && proventos12Meses > 0) {
          const dyCalculado = (proventos12Meses / precoAtualNum) * 100;
          if (dyCalculado > 0) {
            dyAPI = `${dyCalculado.toFixed(2).replace('.', ',')}%`;
            debugLog(`🏆 ${ativo.ticker}: DY calculado via proventos = ${dyAPI}`);
          }
        }

        debugLog(`🏆 ${ativo.ticker}: DY final que será usado = ${dyAPI}`);

        return {
          ...ativo,
          id: String(ativo.id || index + 1),
          precoAtual: precoAtualNum,
          performance: performanceTotal,
          performanceAcao: performanceAcao,
          performanceProventos: performanceProventos,
          proventosAtivo: proventosTotal,
          variacao: cotacao.variacao,
          variacaoPercent: cotacao.variacaoPercent,
          volume: cotacao.volume,
          vies: calcularViesAutomatico(
            ativo.precoTeto,
            `R$ ${precoAtualNum.toFixed(2).replace('.', ',')}`,
            ativo.viesOverride
          ),
          dy: dyAPI, // 🔍 ESTE É O VALOR QUE DEVE APARECER NA TELA
          statusApi: 'success',
          nomeCompleto: cotacao.nome,
          posicaoExibicao: index + 1
        };
      } else {
        // ⚠️ ATIVO SEM COTAÇÃO REAL
        const performanceProventos = ativo.precoEntrada > 0 ? (proventosTotal / ativo.precoEntrada) * 100 : 0;

        const precoReferencia = ativo.precoEntrada > 0 ? ativo.precoEntrada : null;
        const dyNumero = Number.parseFloat(dyAPI.replace('%', '').replace(',', '.'));
        if (
          (!Number.isFinite(dyNumero) || dyNumero <= 0) &&
          precoReferencia &&
          proventos12Meses > 0 &&
          precoReferencia > 0
        ) {
          const dyCalculado = (proventos12Meses / precoReferencia) * 100;
          if (dyCalculado > 0) {
            dyAPI = `${dyCalculado.toFixed(2).replace('.', ',')}%`;
            debugLog(`🏆 ${ativo.ticker}: DY calculado via proventos (sem cotação) = ${dyAPI}`);
          }
        }

        debugLog(`🏆 ${ativo.ticker}: (sem cotação) DY final que será usado = ${dyAPI}`);

        return {
          ...ativo,
          id: String(ativo.id || index + 1),
          precoAtual: ativo.precoEntrada,
          performance: performanceProventos,
          performanceAcao: 0,
          performanceProventos: performanceProventos,
          proventosAtivo: proventosTotal,
          variacao: 0,
          variacaoPercent: 0,
          volume: 0,
          vies: calcularViesAutomatico(
            ativo.precoTeto,
            `R$ ${ativo.precoEntrada.toFixed(2).replace('.', ',')}`,
            ativo.viesOverride
          ),
          dy: dyAPI, // 🔍 ESTE É O VALOR QUE DEVE APARECER NA TELA
          statusApi: 'not_found',
          nomeCompleto: 'N/A',
          posicaoExibicao: index + 1
        };
      }
    });

    // 🎯 ATUALIZAÇÃO FINAL DEFINITIVA
    setCotacoesAtualizadas(novasCotacoes);
    setAtivosAtualizados(ativosFinais);
    
    debugLog('🏆 TOTAL RETURN PROCESSADO COM SUCESSO - PRIMEIRA VEZ!');
  }, [todosOsDadosProntos, cotacoesCompletas, dyCompletos, proventosCompletos, fiisData, loadingDY]);

  // UseEffect original simplificado
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      debugLog('🚀 Iniciando busca de dados...');
      buscarDadosCompletos();
    }, 100); // Pequeno debounce

    return () => clearTimeout(timeoutId);
  }, [buscarDadosCompletos]);

  const refetch = React.useCallback(() => {
    debugLog('🔄 REFETCH: Resetando e buscando dados novamente...');
    setTodosOsDadosProntos(false); // Reset do flag
    buscarDadosCompletos();
  }, [buscarDadosCompletos]);

  return {
    ativosAtualizados,
    cotacoesAtualizadas,
    setCotacoesAtualizadas,
    loading: loadingCotacoes || !todosOsDadosProntos, // ✅ Loading até TUDO estar pronto
    loadingDY,
    loadingProventos,
    error,
    refetch,
    isMobile,
    todosOsDadosProntos // ✅ Novo estado para debug
  };
}

// 🎯 COMPONENTE PRINCIPAL OTIMIZADO
export default function FiisPage() {
  const { dados } = useDataStore();
  const {
    ativosAtualizados, 
    cotacoesAtualizadas, 
    setCotacoesAtualizadas, 
    loading, 
    loadingDY,
    loadingProventos,
    isMobile,
    todosOsDadosProntos
  } = useFiisIntegradas();
  
  const { ifixData } = useIfixRealTime(); // ✅ Dados reais do IFIX.SA
  const { marketData, isFetching: marketDataRefreshing } = useFinancialData();
  const ibovespaData = marketData?.ibovespa ?? null;
  const ibovespaAtualizando = Boolean(marketData) && marketDataRefreshing;
  
  // ✅ PASSAR ifixData para useIfixPeriodo (evita busca duplicada)
  const { ifixPeriodo } = useIfixPeriodo(ativosAtualizados, ifixData);

  const getLogoSrc = React.useCallback((ticker: string) => {
    const sanitized = ticker.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `/logos-fiis/${sanitized}.png`;
  }, []);

  // Separar ativos com memoização
  const { ativosAtivos, ativosEncerrados } = React.useMemo(() => {
    const ativos = ativosAtualizados.filter((ativo) => !ativo.posicaoEncerrada) || [];
    const encerrados = ativosAtualizados.filter((ativo) => ativo.posicaoEncerrada) || [];

    return {
      ativosAtivos: ativos.map((ativo, index) => ({
        ...ativo,
        posicaoExibicao: index + 1
      })),
      ativosEncerrados: encerrados
    };
  }, [ativosAtualizados]);

  const [posicoesEncerradasExpanded, setPosicoesEncerradasExpanded] = React.useState(true);

  React.useEffect(() => {
    if (ativosEncerrados.length > 0) {
      setPosicoesEncerradasExpanded(true);
    }
  }, [ativosEncerrados.length]);

  // Métricas memoizadas
  const metricas = React.useMemo(() => {
    if (!ativosAtivos || ativosAtivos.length === 0) {
      return {
        valorInicial: 0,
        valorAtual: 0,
        rentabilidadeTotal: 0,
        quantidadeAtivos: 0,
        melhorAtivo: null,
        piorAtivo: null,
        dyMedio: 0
      };
    }

    const valorPorAtivo = 1000;
    const valorInicialTotal = ativosAtivos.length * valorPorAtivo;
    let valorFinalTotal = 0;
    let melhorPerformance = -Infinity;
    let piorPerformance = Infinity;
    let melhorAtivo = null;
    let piorAtivo = null;

    ativosAtivos.forEach((ativo) => {
      const valorFinal = valorPorAtivo * (1 + ativo.performance / 100);
      valorFinalTotal += valorFinal;

      if (ativo.performance > melhorPerformance) {
        melhorPerformance = ativo.performance;
        melhorAtivo = { ...ativo, performance: ativo.performance };
      }

      if (ativo.performance < piorPerformance) {
        piorPerformance = ativo.performance;
        piorAtivo = { ...ativo, performance: ativo.performance };
      }
    });

    const rentabilidadeTotal = valorInicialTotal > 0 ? 
      ((valorFinalTotal - valorInicialTotal) / valorInicialTotal) * 100 : 0;

    const dyValues = ativosAtivos
      .map(ativo => parseFloat(ativo.dy.replace('%', '').replace(',', '.')))
      .filter(dy => !isNaN(dy) && dy > 0);
    
    const dyMedio = dyValues.length > 0 ? 
      dyValues.reduce((sum, dy) => sum + dy, 0) / dyValues.length : 0;

    return {
      valorInicial: valorInicialTotal,
      valorAtual: valorFinalTotal,
      rentabilidadeTotal,
      quantidadeAtivos: ativosAtivos.length,
      melhorAtivo,
      piorAtivo,
      dyMedio
    };
  }, [ativosAtivos]);

  // Funções auxiliares memoizadas
  const formatCurrency = React.useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  }, []);

  const formatPercentage = React.useCallback((value: number) => {
    const signal = value >= 0 ? '+' : '';
    return signal + value.toFixed(2) + '%';
  }, []);

  const calcularPerformanceEncerrada = React.useCallback((ativo: any) => {
    if (!ativo.precoSaida || !ativo.precoEntrada) return 0;

    const proventosTotal = Number.isFinite(ativo.proventosAtivo) ? ativo.proventosAtivo : 0;
    return ((ativo.precoSaida + proventosTotal - ativo.precoEntrada) / ativo.precoEntrada) * 100;
  }, []);

  const compositionColors = React.useMemo(
    () => [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
      '#14b8a6', '#eab308', '#dc2626', '#7c3aed', '#0891b2',
      '#65a30d', '#ea580c', '#db2777', '#4f46e5', '#0d9488'
    ],
    []
  );

  const percentuaisParticipacao = React.useMemo<PercentualParticipacao[]>(
    () =>
      ativosAtivos.map((ativo) => {
        const bruto = (ativo as any).percentualParticipacao;
        if (typeof bruto === 'number' && Number.isFinite(bruto)) {
          return { bruto, numerico: bruto };
        }

        if (typeof bruto === 'string') {
          const normalizado = parseFloat(bruto.replace('%', '').replace(',', '.'));
          if (Number.isFinite(normalizado)) {
            return { bruto, numerico: normalizado };
          }
        }

        return { bruto, numerico: null };
      }),
    [ativosAtivos]
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: isMobile ? '16px' : '24px'
    }}>
      {/* Header Responsivo */}
      <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
        <h1 style={{ 
          fontSize: isMobile ? '28px' : '48px',
          fontWeight: '800', 
          color: '#1e293b',
          margin: '0 0 8px 0'
        }}>
          Carteira de Fundos Imobiliários
        </h1>
        <div style={{ 
          color: '#64748b', 
          fontSize: isMobile ? '16px' : '18px',
          margin: '0',
          lineHeight: '1.5',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {loading && !todosOsDadosProntos ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e2e8f0',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{ 
                color: '#3b82f6', 
                fontWeight: '600',
                fontSize: isMobile ? '14px' : '16px'
              }}>
                Atualizando carteira em tempo real...
              </span>
            </>
          ) : (
            <span>
              Dados atualizados a cada 5 minutos
            </span>
          )}
        </div>
      </div>

      {/* Cards de Métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile 
          ? 'repeat(auto-fit, minmax(140px, 1fr))'
          : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: isMobile ? '8px' : '12px',
        marginBottom: '32px'
      }}>
        {/* Performance Total */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            fontSize: isMobile ? '11px' : '12px',
            color: '#64748b', 
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            Rentabilidade total
          </div>
          <div style={{ 
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '700', 
            color: metricas.rentabilidadeTotal >= 0 ? '#10b981' : '#ef4444',
            lineHeight: '1'
          }}>
            {loading ? '...' : formatPercentage(metricas.rentabilidadeTotal)}
          </div>
        </div>

        {/* IFIX Index */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            fontSize: isMobile ? '11px' : '12px',
            color: '#64748b', 
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            IFIX Index
          </div>
          <div style={{ 
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700', 
            color: '#1e293b',
            lineHeight: '1',
            marginBottom: '4px'
          }}>
            {ifixData?.valorFormatado || '3.246'}
          </div>
          <div style={{ 
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '600', 
            color: ifixData?.trend === 'up' ? '#10b981' : '#ef4444',
            lineHeight: '1'
          }}>
            {ifixData ? formatPercentage(ifixData.variacaoPercent) : '-0.5%'}
          </div>
        </div>

        {/* Ibovespa */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: isMobile ? '11px' : '12px',
            color: '#64748b',
            fontWeight: '500',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>Ibovespa</span>
            {ibovespaAtualizando && (
              <span style={{
                fontSize: isMobile ? '10px' : '11px',
                color: '#94a3b8'
              }}>
                atualizando...
              </span>
            )}
          </div>
          <div style={{ 
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700', 
            color: '#1e293b',
            lineHeight: '1',
            marginBottom: '4px'
          }}>
            {ibovespaData?.value || '134.500'}
          </div>
          <div style={{ 
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '600', 
            color: ibovespaData?.trend === 'up' ? '#10b981' : '#ef4444',
            lineHeight: '1'
          }}>
            {ibovespaData ? formatPercentage(ibovespaData.diff) : '+0.2%'}
          </div>
        </div>

        {/* IFIX Período */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            fontSize: isMobile ? '11px' : '12px',
            color: '#64748b', 
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            IFIX período
          </div>
          <div style={{ 
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700', 
            color: ifixPeriodo?.performancePeriodo >= 0 ? '#10b981' : '#ef4444',
            lineHeight: '1',
            marginBottom: '4px'
          }}>
            {ifixPeriodo ? formatPercentage(ifixPeriodo.performancePeriodo) : '+3.0%'}
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#64748b',
            lineHeight: '1'
          }}>
            Desde {ifixPeriodo?.dataInicial || 'jan/2021'}
          </div>
        </div>
      </div>

      {/* Posições Ativas */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: isMobile ? '16px' : '24px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <h3 style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            Posições Ativas ({ativosAtivos.length})
          </h3>
          <p style={{
            color: '#64748b',
            fontSize: isMobile ? '14px' : '16px',
            margin: '0'
          }}>
            Total Return aplicado com reinvestimento de proventos
          </p>
        </div>

        {/* Skeleton Loading */}
        {loading && ativosAtivos.length === 0 ? (
          <div style={{ padding: '24px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{
                height: '60px',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                marginBottom: '12px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            ))}
          </div>
        ) : (
          // Conteúdo principal
          <>
            {isMobile ? (
              // 📱 MOBILE: Cards verticais
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ativosAtivos.map((ativo, index) => {
                  const temCotacaoReal = ativo.statusApi === 'success';
                  const viesPalette = getViesBadgePalette(ativo.vies);
                  
                  return (
                    <div 
                      key={ativo.id || index}
                      style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        padding: '16px',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => {
                        window.location.href = `/dashboard/ativo/${ativo.ticker}`;
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                    >
                      {/* Header do Card */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        {/* Posição */}
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '12px',
                          color: '#64748b'
                        }}>
                          {ativo.posicaoExibicao}
                        </div>

                        {/* Logo do Ativo */}
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          backgroundColor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e2e8f0'
                        }}>
<img
  src={getLogoSrc(ativo.ticker)}
  alt={`Logo ${ativo.ticker}`}
                            style={{
                              width: '28px',
                              height: '28px',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.style.backgroundColor = '#f1f5f9';
                                parent.style.color = '#64748b';
                                parent.style.fontWeight = '700';
                                parent.style.fontSize = '12px';
                                parent.textContent = ativo.ticker.slice(0, 2);
                              }
                            }}
                          />
                        </div>

                        {/* Nome e Setor */}
                        <div style={{ flex: '1' }}>
                          <div style={{ 
                            fontWeight: '700', 
                            color: '#1e293b', 
                            fontSize: '16px'
                          }}>
                            {ativo.ticker}
                            {!temCotacaoReal && (
                              <span style={{ 
                                marginLeft: '8px', 
                                fontSize: '10px', 
                                color: '#f59e0b',
                                backgroundColor: '#fef3c7',
                                padding: '2px 4px',
                                borderRadius: '3px'
                              }}>
                                SIM
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '12px' }}>
                            {ativo.setor}
                          </div>
                        </div>

                        {/* Viés */}
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: '700',
                          backgroundColor: viesPalette.backgroundColor,
                          color: viesPalette.textColor
                        }}>
                          {ativo.vies}
                        </div>
                      </div>
                      
                      {/* Dados em Grid */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '8px', 
                        fontSize: '14px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ color: '#64748b' }}>
                          <span style={{ fontWeight: '500' }}>Entrada:</span><br />
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{ativo.dataEntrada}</span>
                        </div>
                        <div style={{ color: '#64748b' }}>
                          <span style={{ fontWeight: '500' }}>DY 12M:</span><br />
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>
                            {loading && !todosOsDadosProntos ? '--' : ativo.dy}
                          </span>
                        </div>
                        <div style={{ color: '#64748b' }}>
                          <span style={{ fontWeight: '500' }}>Preço Atual:</span><br />
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>
                            {formatCurrency(ativo.precoAtual)}
                          </span>
                        </div>
                        <div style={{ color: '#64748b' }}>
                          <span style={{ fontWeight: '500' }}>Preço Teto:</span><br />
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>
                            {ativo.precoTeto ? formatCurrency(ativo.precoTeto) : '-'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Performance em destaque */}
                      <div style={{
                        textAlign: 'center',
                        padding: '8px',
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                          Performance Total
                        </div>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: '800',
                          color: ativo.performance >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          {formatPercentage(ativo.performance)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // 🖥️ DESKTOP: Tabela completa
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        #
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        FII
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        ENTRADA
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        PREÇO INICIAL
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        PREÇO ATUAL
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        PREÇO TETO
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          PERFORMANCE TOTAL
                          <div 
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: '#64748b',
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'help',
                              position: 'relative'
                            }}
                            title="A rentabilidade de todos os FIIs é calculada pelo método Total Return, incluindo o reinvestimento dos proventos."
                          >
                            i
                          </div>
                        </div>
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        DY 12M
                      </th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                        VIÉS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ativosAtivos.map((ativo, index) => {
                      const temCotacaoReal = ativo.statusApi === 'success';
                      const viesPalette = getViesBadgePalette(ativo.vies);
                      
                      return (
                        <tr 
                          key={ativo.id || index} 
                          style={{ 
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.2s',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            window.location.href = `/dashboard/ativo/${ativo.ticker}`;
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {/* Posição */}
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '14px',
                              color: '#64748b',
                              margin: '0 auto'
                            }}>
                              {ativo.posicaoExibicao}
                            </div>
                          </td>
                          {/* Ativo */}
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #e2e8f0'
                              }}>
<img
  src={getLogoSrc(ativo.ticker)}
  alt={`Logo ${ativo.ticker}`}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    objectFit: 'contain'
                                  }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.style.backgroundColor = '#f1f5f9';
                                      parent.style.color = '#64748b';
                                      parent.style.fontWeight = '700';
                                      parent.style.fontSize = '14px';
                                      parent.textContent = ativo.ticker.slice(0, 2);
                                    }
                                  }}
                                />
                              </div>
                              <div>
                                <div style={{ 
                                  fontWeight: '700', 
                                  color: '#1e293b', 
                                  fontSize: '16px'
                                }}>
                                  {ativo.ticker}
                                  {!temCotacaoReal && (
                                    <span style={{ 
                                      marginLeft: '8px', 
                                      fontSize: '12px', 
                                      color: '#f59e0b',
                                      backgroundColor: '#fef3c7',
                                      padding: '2px 6px',
                                      borderRadius: '4px'
                                    }}>
                                      SIM
                                    </span>
                                  )}
                                </div>
                                <div style={{ color: '#64748b', fontSize: '14px' }}>
                                  {ativo.setor}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                            {ativo.dataEntrada}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                            {formatCurrency(ativo.precoEntrada)}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#1e293b' }}>
                            {formatCurrency(ativo.precoAtual)}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>
                            {ativo.precoTeto ? formatCurrency(ativo.precoTeto) : '-'}
                          </td>
                          <td style={{ 
                            padding: '16px', 
                            textAlign: 'center', 
                            fontWeight: '800',
                            fontSize: '16px',
                            color: ativo.performance >= 0 ? '#10b981' : '#ef4444'
                          }}>
                            {formatPercentage(ativo.performance)}
                          </td>
                          <td style={{ 
                            padding: '16px', 
                            textAlign: 'center',
                            fontWeight: '700',
                            color: '#1e293b'
                          }}>
                            {loadingDY ? '...' : ativo.dy}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              backgroundColor: viesPalette.backgroundColor,
                              color: viesPalette.textColor
                            }}>
                              {ativo.vies}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Posições Encerradas */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          marginBottom: '32px'
        }}
      >
        <div
          style={{
            padding: isMobile ? '16px' : '24px',
            borderBottom: posicoesEncerradasExpanded ? '1px solid #e2e8f0' : 'none',
            backgroundColor: '#f8fafc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.2s'
          }}
          onClick={() => setPosicoesEncerradasExpanded((prev) => !prev)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
          }}
        >
          <div>
            <h3
              style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0 0 8px 0'
              }}
            >
              Posições Encerradas ({ativosEncerrados.length})
            </h3>
            <p
              style={{
                color: '#64748b',
                fontSize: isMobile ? '14px' : '16px',
                margin: '0'
              }}
            >
              Histórico de operações finalizadas
            </p>
          </div>

          <div
            style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease',
              transform: posicoesEncerradasExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6L8 10L12 6" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div
          style={{
            maxHeight: posicoesEncerradasExpanded ? '2000px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-in-out'
          }}
        >
          {ativosEncerrados.length === 0 ? (
            <div
              style={{
                padding: isMobile ? '24px' : '48px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                📈
              </div>
              <div
                style={{
                  fontWeight: '700',
                  fontSize: isMobile ? '16px' : '18px',
                  textAlign: 'center'
                }}
              >
                Nenhuma posição encerrada ainda
              </div>
              <p
                style={{
                  margin: 0,
                  textAlign: 'center',
                  fontSize: isMobile ? '14px' : '15px'
                }}
              >
                Quando ativos forem encerrados você verá os resultados consolidados aqui.
              </p>
            </div>
          ) : isMobile ? (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ativosEncerrados.map((ativo, index) => {
                const performance = calcularPerformanceEncerrada(ativo);

                return (
                  <div
                    key={ativo.id || index}
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e2e8f0'
                        }}
                      >
<img
  src={getLogoSrc(ativo.ticker)}
  alt={`Logo ${ativo.ticker}`}
                          style={{
                            width: '28px',
                            height: '28px',
                            objectFit: 'contain'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.style.backgroundColor = '#dc2626';
                              parent.style.color = 'white';
                              parent.style.fontWeight = '700';
                              parent.style.fontSize = '12px';
                              parent.textContent = ativo.ticker.slice(0, 2);
                            }
                          }}
                        />
                      </div>
                      <div style={{ flex: '1' }}>
                        <div
                          style={{
                            fontWeight: '700',
                            color: '#64748b',
                            fontSize: '16px'
                          }}
                        >
                          {ativo.ticker}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '12px' }}>{ativo.setor}</div>
                      </div>
                      <div
                        style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: '700',
                          backgroundColor: performance >= 0 ? '#dcfce7' : '#fee2e2',
                          color: performance >= 0 ? '#065f46' : '#dc2626'
                        }}
                      >
                        ENCERRADO
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        fontSize: '14px',
                        marginBottom: '12px'
                      }}
                    >
                      <div style={{ color: '#64748b' }}>
                        <span style={{ fontWeight: '500' }}>Entrada:</span>
                        <br />
                        <span style={{ fontWeight: '600', color: '#64748b' }}>{ativo.dataEntrada}</span>
                      </div>
                      <div style={{ color: '#64748b' }}>
                        <span style={{ fontWeight: '500' }}>Saída:</span>
                        <br />
                        <span style={{ fontWeight: '600', color: '#64748b' }}>{ativo.dataSaida}</span>
                      </div>
                      <div style={{ color: '#64748b' }}>
                        <span style={{ fontWeight: '500' }}>Preço Entrada:</span>
                        <br />
                        <span style={{ fontWeight: '700', color: '#64748b' }}>
                          {formatCurrency(ativo.precoEntrada)}
                        </span>
                      </div>
                      <div style={{ color: '#64748b' }}>
                        <span style={{ fontWeight: '500' }}>Preço Saída:</span>
                        <br />
                        <span style={{ fontWeight: '700', color: '#64748b' }}>
                          {formatCurrency(ativo.precoSaida)}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: 'center',
                        padding: '8px',
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '8px'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                        Performance Total (c/ proventos)
                      </div>
                      <div
                        style={{
                          fontSize: '18px',
                          fontWeight: '800',
                          color: performance >= 0 ? '#059669' : '#dc2626'
                        }}
                      >
                        {formatPercentage(performance)}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}
                    >
                      Motivo: {ativo.motivoEncerramento}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', padding: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      ATIVO
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      ENTRADA
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      SAÍDA
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      PREÇO ENTRADA
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      PREÇO SAÍDA
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        PERFORMANCE TOTAL
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#64748b',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'help'
                          }}
                          title="Performance com Total Return, incluindo proventos recebidos durante o período de detenção."
                        >
                          i
                        </div>
                      </div>
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      MOTIVO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ativosEncerrados.map((ativo, index) => {
                    const performance = calcularPerformanceEncerrada(ativo);

                    return (
                      <tr
                        key={ativo.id || index}
                        style={{
                          borderTop: '1px solid #e2e8f0',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#f8fafc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #e2e8f0'
                              }}
                            >
<img
  src={getLogoSrc(ativo.ticker)}
  alt={`Logo ${ativo.ticker}`}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  objectFit: 'contain'
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.style.backgroundColor = '#f8fafc';
                                    parent.style.color = '#64748b';
                                    parent.style.fontWeight = '700';
                                    parent.style.fontSize = '14px';
                                    parent.textContent = ativo.ticker.slice(0, 2);
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '16px' }}>{ativo.ticker}</div>
                              <div style={{ color: '#64748b', fontSize: '14px' }}>{ativo.setor}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                          {ativo.dataEntrada}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                          {ativo.dataSaida}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                          {formatCurrency(ativo.precoEntrada)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                          {formatCurrency(ativo.precoSaida)}
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            textAlign: 'center',
                            fontWeight: '800',
                            fontSize: '16px',
                            color: performance >= 0 ? '#059669' : '#dc2626'
                          }}
                        >
                          {formatPercentage(performance)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                          {ativo.motivoEncerramento}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Composição por Ativos */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: isMobile ? '16px' : '24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}
        >
          <h3
            style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 8px 0'
            }}
          >
            Composição por Ativos Ativos
          </h3>
          <p
            style={{
              color: '#64748b',
              fontSize: isMobile ? '14px' : '16px',
              margin: '0'
            }}
          >
            Distribuição percentual da carteira - {ativosAtivos.length} ativos ativos
          </p>
        </div>

        <div
          style={{
            padding: isMobile ? '16px' : '32px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '16px' : '32px',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              flex: isMobile ? '1' : '0 0 400px',
              height: isMobile ? '300px' : '400px',
              position: 'relative'
            }}
          >
            {(() => {
              const cores = compositionColors;
              const chartSize = isMobile ? 300 : 400;
              const radius = isMobile ? 120 : 150;
              const innerRadius = isMobile ? 60 : 75;
              const centerX = chartSize / 2;
              const centerY = chartSize / 2;

              if (ativosAtivos.length === 0) {
                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#64748b',
                      fontSize: '16px'
                    }}
                  >
                    Nenhum ativo ativo para exibir
                  </div>
                );
              }

              const fallbackPercentual = ativosAtivos.length > 0 ? 100 / ativosAtivos.length : 0;
              const percentuaisNumericos = percentuaisParticipacao.map((item) => item.numerico ?? fallbackPercentual);
              const totalPercentual = percentuaisNumericos.reduce((sum, valor) => sum + valor, 0) || 1;

              let currentAngle = -Math.PI / 2;

              const createPath = (startAngle: number, endAngle: number) => {
                const x1 = centerX + radius * Math.cos(startAngle);
                const y1 = centerY + radius * Math.sin(startAngle);
                const x2 = centerX + radius * Math.cos(endAngle);
                const y2 = centerY + radius * Math.sin(endAngle);

                const x3 = centerX + innerRadius * Math.cos(endAngle);
                const y3 = centerY + innerRadius * Math.sin(endAngle);
                const x4 = centerX + innerRadius * Math.cos(startAngle);
                const y4 = centerY + innerRadius * Math.sin(startAngle);

                const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';

                return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
              };

              return (
                <svg
                  width={chartSize}
                  height={chartSize}
                  viewBox={`0 0 ${chartSize} ${chartSize}`}
                  style={{ width: '100%', height: '100%' }}
                >
                  <defs>
                    <style>
                      {`
                        .slice-text {
                          opacity: 0;
                          transition: opacity 0.3s ease;
                          pointer-events: none;
                        }
                        .slice-group:hover .slice-text {
                          opacity: 1;
                        }
                        .slice-path {
                          transition: all 0.3s ease;
                          cursor: pointer;
                        }
                        .slice-group:hover .slice-path {
                          transform: scale(1.05);
                          transform-origin: ${centerX}px ${centerY}px;
                        }
                      `}
                    </style>
                  </defs>

                  {ativosAtivos.map((ativo, index) => {
                    const percentual = percentuaisNumericos[index];
                    const startAngle = currentAngle;
                    const endAngle = startAngle + (percentual / totalPercentual) * 2 * Math.PI;
                    currentAngle = endAngle;

                    const path = createPath(startAngle, endAngle);
                    const middleAngle = (startAngle + endAngle) / 2;
                    const textRadius = (radius + innerRadius) / 2;
                    const textX = centerX + textRadius * Math.cos(middleAngle);
                    const textY = centerY + textRadius * Math.sin(middleAngle);
                    const cor = cores[index % cores.length];

                    const rawDisplay = percentuaisParticipacao[index].bruto;
                    const displayPercentual = typeof rawDisplay === 'string' && rawDisplay.trim() !== ''
                      ? rawDisplay
                      : `${percentual.toFixed(1)}%`;

                    return (
                      <g key={ativo.id || index} className="slice-group">
                        <path
                          d={path}
                          fill={cor}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="slice-path"
                        >
                          <title>{`${ativo.ticker}: ${displayPercentual}`}</title>
                        </path>

                        <g className="slice-text">
                          <text
                            x={textX}
                            y={textY - 6}
                            textAnchor="middle"
                            fontSize={isMobile ? '10' : '11'}
                            fontWeight="700"
                            fill="#ffffff"
                            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                          >
                            {ativo.ticker}
                          </text>
                          <text
                            x={textX}
                            y={textY + 8}
                            textAnchor="middle"
                            fontSize={isMobile ? '9' : '10'}
                            fontWeight="600"
                            fill="#ffffff"
                            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                          >
                            {displayPercentual}
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  <circle cx={centerX} cy={centerY} r={innerRadius} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
                  <text
                    x={centerX}
                    y={centerY - 10}
                    textAnchor="middle"
                    fontSize={isMobile ? '14' : '16'}
                    fontWeight="700"
                    fill="#1e293b"
                  >
                    {ativosAtivos.length}
                  </text>
                  <text
                    x={centerX}
                    y={centerY + 10}
                    textAnchor="middle"
                    fontSize={isMobile ? '10' : '12'}
                    fill="#64748b"
                  >
                    ATIVOS ATIVOS
                  </text>
                </svg>
              );
            })()}
          </div>

          <div
            style={{
              flex: '1',
              display: 'grid',
              gridTemplateColumns: isMobile
                ? 'repeat(2, 1fr)'
                : 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: isMobile ? '8px' : '12px'
            }}
          >
            {ativosAtivos.map((ativo, index) => {
              const percentual = percentuaisParticipacao[index];
              const fallbackPercentual = ativosAtivos.length > 0 ? (100 / ativosAtivos.length).toFixed(1) : '0.0';
              const displayPercentual = typeof percentual.bruto === 'string' && percentual.bruto.trim() !== ''
                ? percentual.bruto
                : percentual.numerico !== null
                  ? `${percentual.numerico.toFixed(1)}%`
                  : `${fallbackPercentual}%`;

              return (
                <div
                  key={ativo.id || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: isMobile ? '0' : 'auto'
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '2px',
                      backgroundColor: compositionColors[index % compositionColors.length],
                      flexShrink: 0
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: '700',
                        color: '#1e293b',
                        fontSize: isMobile ? '12px' : '14px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {ativo.ticker}
                    </div>
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: isMobile ? '10px' : '12px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {displayPercentual}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Animações CSS */}
      <style jsx>{`
        /* Spinner de Loading Unificado */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Animação de Pulse para Skeletons */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
