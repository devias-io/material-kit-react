// ========================================
// HOOKS E UTILITÁRIOS - useAtivoDetalhes.ts
// ========================================

'use client';

import { useState, useEffect, useCallback } from 'react';

// ========================================
// INTERFACES E TIPOS
// ========================================
export interface DadosFinanceiros {
  precoAtual: number;
  variacao: number;
  variacaoPercent: number;
  volume: number;
  marketCap?: number;
  pl?: number;
  dy?: number;
  regularMarketPrice?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  lastDividendValue?: number;
  lastDividendDate?: string;
}

export interface DadosFII {
  valorPatrimonial?: number;
  patrimonio?: number;
  pvp?: number;
  valorMercado?: number;
  valorCaixa?: number;
  numeroCotas?: number;
  ultimoRendimento?: number;
  dataUltimoRendimento?: string;
  dyCagr3Anos?: number;
  numeroCotistas?: number;
  fonte: 'api' | 'manual' | 'misto';
  ultimaAtualizacao?: string;
}

// 🌍 Interface para dados do Yahoo Finance
export interface DadosYahooFinance {
  dividendYield?: number;
  pl?: number;
  pvp?: number;
  roe?: number;
  marketCap?: number;
  volume?: number;
  beta?: number;
  eps?: number;
  dividendRate?: number;
  payoutRatio?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  fonte: string;
  ultimaAtualizacao?: string;
}

// 🇧🇷 Interface para dados do BDR
export interface DadosBDR {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

// 🚀 Interface para dados de ações da HG Brasil
export interface DadosHGBrasil {
  dividendYield12m?: number;
  dividendSum12m?: number;
  pl?: number;
  pvp?: number;
  roe?: number;
  equity?: number;
  quotaCount?: number;
  equityPerShare?: number;
  fonte: string;
  ultimaAtualizacao?: string;
}

export type TipoVisualizacao = 'iframe' | 'canva' | 'link' | 'pdf';

export interface Relatorio {
  id: string;
  nome: string;
  tipo: 'trimestral' | 'anual' | 'apresentacao' | 'outros';
  dataUpload: string;
  dataReferencia: string;
  arquivo?: string;
  linkCanva?: string;
  linkExterno?: string;
  tamanho?: string;
  tipoVisualizacao: TipoVisualizacao;
  arquivoPdf?: string;
  nomeArquivoPdf?: string;
  tamanhoArquivo?: number;
  dataUploadPdf?: string;
  solicitarReupload?: boolean;
  hashArquivo?: string;
}

// ========================================
// CONSTANTES
// ========================================
const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
const HG_BRASIL_KEY = 'a666e15c';

// 🌍 MAPEAMENTO BDR PARA ATIVOS ESTRANGEIROS (SUBSTITUÍDO)
export const BDR_ESTRANGEIRO_MAPPING: Record<string, string> = {
  // Tecnologia EUA
  'AAPL': 'AAPL34',    // Apple
  'MSFT': 'MSFT34',    // Microsoft
  'GOOGL': 'GOGL34',   // Google Class A
  'GOOG': 'GOGL35',    // Google Class C
  'AMZN': 'AMZO34',    // Amazon
  'TSLA': 'TSLA34',    // Tesla
  'META': 'META34',    // Meta (Facebook)
  'NVDA': 'NVDC34',    // Nvidia
  'NFLX': 'NFLX34',    // Netflix
  'CRM': 'CRMS34',     // Salesforce
  'ORCL': 'ORCL34',    // Oracle
  'ADBE': 'ADBE34',    // Adobe
  'INTC': 'INTC34',    // Intel
  'AMD': 'AMD34',      // AMD
  'UBER': 'UBER34',    // Uber
  'ZOOM': 'ZOOM34',    // Zoom
  
  // Financeiros EUA
  'JPM': 'JPMC34',     // JPMorgan Chase
  'BAC': 'BOAC34',     // Bank of America
  'WFC': 'WFCO34',     // Wells Fargo
  'GS': 'GSGI34',      // Goldman Sachs
  'V': 'VISA34',       // Visa
  'MA': 'MAST34',      // Mastercard
  
  // Varejo/Consumo EUA
  'WMT': 'WALM34',     // Walmart
  'HD': 'HOME34',      // Home Depot
  'NKE': 'NIKE34',     // Nike
  'MCD': 'MCDC34',     // McDonald's
  'SBUX': 'SBUB34',    // Starbucks
  'KO': 'COCA34',      // Coca-Cola
  'PEP': 'PEPB34',     // PepsiCo
  'PG': 'PROG34',      // Procter & Gamble
  'JNJ': 'JNJB34',     // Johnson & Johnson
  'PFE': 'PFIZ34',     // Pfizer
  
  // Industriais EUA
  'BA': 'BOIN34',      // Boeing
  'CAT': 'CATG34',     // Caterpillar
  'GE': 'GEOO34',      // General Electric
  'UPS': 'UPSS34',     // UPS
  
  // Energia EUA
  'XOM': 'EXXO34',     // ExxonMobil
  'CVX': 'CHEV34',     // Chevron
  
  // Chinesas (ADRs)
  'BABA': 'BABA34',    // Alibaba
  'JD': 'JDCO34',      // JD.com
  'BIDU': 'BIDU34',    // Baidu
  
  // Outras
  'TSM': 'TSMC34',     // Taiwan Semiconductor
  'ASML': 'ASML34'     // ASML (Holanda)
};

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================
export const formatCurrency = (value: number, moeda = 'BRL') => {
  const currency = moeda === 'USD' ? 'USD' : 'BRL';
  const locale = moeda === 'USD' ? 'en-US' : 'pt-BR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(value);
};

export const formatarValor = (valor: number | undefined, tipo: 'currency' | 'percent' | 'number' | 'millions' = 'currency'): string => {
  if (valor === undefined || valor === null || isNaN(valor)) return 'N/A';
  
  switch (tipo) {
    case 'currency':
      return formatCurrency(valor);
    case 'percent':
      return `${valor.toFixed(2).replace('.', ',')}%`;
    case 'millions':
      if (valor >= 1000000000) {
        return `R$ ${(valor / 1000000000).toFixed(1).replace('.', ',')} bi`;
      } else if (valor >= 1000000) {
        return `R$ ${(valor / 1000000).toFixed(1).replace('.', ',')} mi`;
      } else {
        return formatCurrency(valor);
      }
    case 'number':
      return valor.toLocaleString('pt-BR', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
      });
    default:
      return valor.toString();
  }
};

// 🌍 NOVAS FUNÇÕES PARA BDR ESTRANGEIRO

// Função para detectar BDR estrangeiro
export const isBDREstrangeiro = (ticker: string): boolean => {
  if (!ticker || typeof ticker !== 'string') return false;
  
  const tickerNorm = ticker.toUpperCase().trim();
  
  // Verificar se termina com padrão BDR (34, 35, etc.)
  const bdrPattern = /\d{2}$/;
  if (!bdrPattern.test(tickerNorm)) return false;
  
  // Verificar se existe mapeamento para ativo estrangeiro
  return Object.values(BDR_ESTRANGEIRO_MAPPING).includes(tickerNorm);
};

// Função para obter ativo estrangeiro do BDR
export const getEstrangeiroFromBDR = (bdrTicker: string): string | null => {
  if (!bdrTicker) return null;
  
  // Criar mapeamento inverso
  const mapeamentoInverso: Record<string, string> = {};
  Object.entries(BDR_ESTRANGEIRO_MAPPING).forEach(([estrangeiro, bdr]) => {
    mapeamentoInverso[bdr] = estrangeiro;
  });
  
  return mapeamentoInverso[bdrTicker.toUpperCase()] || null;
};

// Função para identificar mercado de origem
export const getMercadoOrigem = (tickerEstrangeiro: string | null): string => {
  if (!tickerEstrangeiro) return 'N/A';
  
  const mercados: Record<string, string> = {
    // EUA - Tecnologia (NASDAQ)
    'AAPL': 'NASDAQ (EUA)', 'MSFT': 'NASDAQ (EUA)', 'GOOGL': 'NASDAQ (EUA)',
    'GOOG': 'NASDAQ (EUA)', 'AMZN': 'NASDAQ (EUA)', 'TSLA': 'NASDAQ (EUA)',
    'META': 'NASDAQ (EUA)', 'NVDA': 'NASDAQ (EUA)', 'NFLX': 'NASDAQ (EUA)',
    'CRM': 'NASDAQ (EUA)', 'ORCL': 'NASDAQ (EUA)', 'ADBE': 'NASDAQ (EUA)',
    'INTC': 'NASDAQ (EUA)', 'AMD': 'NASDAQ (EUA)', 'UBER': 'NASDAQ (EUA)',
    'ZOOM': 'NASDAQ (EUA)',
    
    // EUA - Financeiro (NYSE)
    'JPM': 'NYSE (EUA)', 'BAC': 'NYSE (EUA)', 'WFC': 'NYSE (EUA)',
    'GS': 'NYSE (EUA)', 'V': 'NYSE (EUA)', 'MA': 'NYSE (EUA)',
    
    // EUA - Consumo (NYSE/NASDAQ)
    'WMT': 'NYSE (EUA)', 'HD': 'NYSE (EUA)', 'NKE': 'NYSE (EUA)',
    'MCD': 'NYSE (EUA)', 'SBUX': 'NASDAQ (EUA)', 'KO': 'NYSE (EUA)',
    'PEP': 'NASDAQ (EUA)', 'PG': 'NYSE (EUA)', 'JNJ': 'NYSE (EUA)',
    'PFE': 'NYSE (EUA)',
    
    // EUA - Industriais (NYSE)
    'BA': 'NYSE (EUA)', 'CAT': 'NYSE (EUA)', 'GE': 'NYSE (EUA)',
    'UPS': 'NYSE (EUA)',
    
    // EUA - Energia (NYSE)
    'XOM': 'NYSE (EUA)', 'CVX': 'NYSE (EUA)',
    
    // China (ADRs)
    'BABA': 'NYSE (China ADR)', 'JD': 'NASDAQ (China ADR)', 'BIDU': 'NASDAQ (China ADR)',
    
    // Outros
    'TSM': 'NYSE (Taiwan ADR)', 'ASML': 'NASDAQ (Holanda ADR)'
  };
  
  return mercados[tickerEstrangeiro.toUpperCase()] || 'Mercado Exterior';
};

// 🇧🇷 Função para obter BDR de ativo estrangeiro (NOVA)
export const getBDRFromEstrangeiro = (tickerEstrangeiro: string): string | null => {
  return BDR_ESTRANGEIRO_MAPPING[tickerEstrangeiro.toUpperCase()] || null;
};

// ========================================
// HOOKS PERSONALIZADOS
// ========================================

// Hook para dados financeiros
export function useDadosFinanceiros(ticker: string | undefined) {
  const [dadosFinanceiros, setDadosFinanceiros] = useState<DadosFinanceiros | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>('');

  const buscarDados = useCallback(async () => {
    if (!ticker) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Verificar cache primeiro
      const cachedData = localStorage.getItem(`cache_${ticker}`);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
if (parsed.timestamp && (Date.now() - parsed.timestamp) < 6 * 60 * 60 * 1000) {
          setDadosFinanceiros(parsed.data);
          setUltimaAtualizacao('Cache: ' + new Date(parsed.timestamp).toLocaleString('pt-BR'));
          setLoading(false);
          return;
        }
      }

      // Buscar da API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Portfolio-App/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const quote = data.results[0];
          const stats = quote?.defaultKeyStatistics || {};

          const dadosProcessados: DadosFinanceiros = {
            precoAtual: quote.regularMarketPrice || quote.currentPrice || 0,
            variacao: quote.regularMarketChange || 0,
            variacaoPercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            dy: quote.dividendYield || 0,
            marketCap: quote.marketCap,
            pl: quote.priceEarnings,
            regularMarketPrice: quote.regularMarketPrice || quote.currentPrice || 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
            lastDividendValue: stats.lastDividendValue || quote.lastDividendValue,
            lastDividendDate: stats.lastDividendDate || quote.lastDividendDate
          };

          setDadosFinanceiros(dadosProcessados);
          setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
          
          // Salvar no cache
          localStorage.setItem(`cache_${ticker}`, JSON.stringify({
            data: dadosProcessados,
            timestamp: Date.now()
          }));
          
          setLoading(false);
          return;
        }
      }

      // Fallback para dados estáticos
      const dadosEstaticos: DadosFinanceiros = {
        precoAtual: ticker.includes('11') ? 100.00 : 85.75,
        variacao: 1.50,
        variacaoPercent: 1.52,
        volume: 1000000,
        dy: ticker.includes('11') ? 8.5 : 4.2,
        marketCap: ticker.includes('11') ? 2200000000 : 15000000000,
        pl: ticker.includes('11') ? undefined : 12.5,
        regularMarketPrice: ticker.includes('11') ? 100.00 : 85.75
      };
      
      setDadosFinanceiros(dadosEstaticos);
      setUltimaAtualizacao('Dados estáticos - ' + new Date().toLocaleString('pt-BR'));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  return { dadosFinanceiros, loading, error, ultimaAtualizacao, refetch: buscarDados };
}

// 🇧🇷 Hook para dados do BDR (MANTIDO IGUAL)
export function useDadosBDR(bdrTicker: string | null) {
  const [bdrData, setBDRData] = useState<DadosBDR | null>(null);
  const [bdrLoading, setBDRLoading] = useState(true);
  const [bdrError, setBDRError] = useState<string | null>(null);

  const fetchBDRData = useCallback(async () => {
    if (!bdrTicker) {
      setBDRLoading(false);
      return;
    }

    try {
      setBDRLoading(true);
      setBDRError(null);
      
      console.log(`🌍 Buscando cotação do BDR estrangeiro: ${bdrTicker}...`);
      
      // Verificar cache do BDR
      const cachedBDR = localStorage.getItem(`cache_bdr_${bdrTicker}`);
      if (cachedBDR) {
        const parsed = JSON.parse(cachedBDR);
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < 3 * 60 * 60 * 1000) { // Cache de 3 horas
          setBDRData(parsed.data);
          setBDRLoading(false);
          console.log(`✅ BDR ${bdrTicker} carregado do cache`);
          return;
        }
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`https://brapi.dev/api/quote/${bdrTicker}?token=${BRAPI_TOKEN}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Portfolio-App/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        if (data?.results?.[0]) {
          const result = data.results[0];
          const bdrInfo: DadosBDR = {
            symbol: result.symbol,
            price: result.regularMarketPrice || 0,
            change: result.regularMarketChange || 0,
            changePercent: result.regularMarketChangePercent || 0
          };
          
          setBDRData(bdrInfo);
          
          // Salvar no cache
          localStorage.setItem(`cache_bdr_${bdrTicker}`, JSON.stringify({
            data: bdrInfo,
            timestamp: Date.now()
          }));
          
          console.log(`✅ BDR estrangeiro ${bdrTicker}: R$ ${result.regularMarketPrice}`);
        }
      } else {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setBDRError(errorMessage);
      console.error(`❌ Erro BDR estrangeiro ${bdrTicker}:`, err);
    } finally {
      setBDRLoading(false);
    }
  }, [bdrTicker]);

  useEffect(() => {
    fetchBDRData();
  }, [fetchBDRData]);

  return { bdrData, bdrLoading, bdrError, refetchBDR: fetchBDRData };
}

// 🚀 Hook HG Brasil - VERSÃO CORRIGIDA COM PRIORIDADE BRAPI PARA P/L

export function useHGBrasilAcoes(ticker: string | undefined) {
  const [dadosHGBrasil, setDadosHGBrasil] = useState<DadosHGBrasil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🔥 DETECTAR DISPOSITIVO
  const [isMobile, setIsMobile] = useState(false);
  const [deviceDetected, setDeviceDetected] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const mobile = width <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      setDeviceDetected(true);
      console.log('📱 HGBrasil - Dispositivo detectado:', { width, isMobile: mobile });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const fetchDadosHGBrasil = useCallback(async () => {
    if (!ticker) {
      setLoading(false);
      return;
    }

    // Só para ações brasileiras (não FII, não BDR)
    if (ticker.includes('11') || ticker.includes('34') || ticker.includes('35')) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🇧🇷 [${isMobile ? 'MOBILE' : 'DESKTOP'}] Buscando dados para ${ticker}...`);

      const parseToNumber = (value: unknown): number | undefined => {
        if (typeof value === 'number' && Number.isFinite(value)) {
          return value;
        }

        if (typeof value === 'string') {
          const cleaned = value.replace(',', '.');
          const parsed = Number(cleaned);
          return Number.isFinite(parsed) ? parsed : undefined;
        }

        return undefined;
      };

      const pickMetric = (
        values: unknown[],
        validate: (value: number) => boolean = (value) => value > 0
      ): number | undefined => {
        for (const candidate of values) {
          const parsed = parseToNumber(candidate);
          if (parsed === undefined) continue;
          if (validate(parsed)) {
            return parsed;
          }
        }
        return undefined;
      };

      const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

      // Verificar cache primeiro
      const cachedData = localStorage.getItem(`cache_hg_${ticker}`);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < 6 * 60 * 60 * 1000) {
          setDadosHGBrasil(parsed.data);
          setLoading(false);
          console.log(`✅ Dados ${ticker} carregados do cache`);
          return;
        }
      }

      let dadosColetados: DadosHGBrasil = {
        fonte: 'api-multipla',
        ultimaAtualizacao: new Date().toISOString()
      };

      // 🎯 ESTRATÉGIA CORRIGIDA: BRAPI PRIMEIRO PARA P/L (MOBILE E DESKTOP)
      console.log(`🎯 PRIORIDADE 1: Buscando P/L via BRAPI com módulo correto...`);

      const brapiBaseUrl = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}`;
      const brapiHeaders: Record<string, string> = {
        'Accept': 'application/json'
      };

      if (isMobile) {
        brapiHeaders['Accept-Language'] = 'pt-BR,pt;q=0.9';
      }

      const brapiStrategies = [
        { nome: 'default-key-statistics', url: `${brapiBaseUrl}&modules=defaultKeyStatistics` },
        { nome: 'quote-basic', url: brapiBaseUrl },
        { nome: 'quote-range', url: `${brapiBaseUrl}&range=1d` }
      ];

      for (const estrategia of brapiStrategies) {
        if (dadosColetados.pl && dadosColetados.pvp) {
          break;
        }

        try {
          console.log(`🎯 BRAPI tentativa (${estrategia.nome}) para ${ticker}`);
          const resposta = await fetch(estrategia.url, {
            method: 'GET',
            headers: brapiHeaders
          });

          if (!resposta.ok) {
            console.log(`⚠️ BRAPI ${estrategia.nome} retornou status ${resposta.status}`);
            continue;
          }

          const dadosBrapi = await resposta.json();
          const resultado = dadosBrapi?.results?.[0];

          if (!resultado) {
            continue;
          }

          const estatisticas = resultado.defaultKeyStatistics || {};

          const plValor = pickMetric(
            [
              estatisticas.trailingPE,
              estatisticas.forwardPE,
              resultado.priceEarnings,
              resultado.priceEarningsRatio
            ],
            (valor) => valor > 0 && valor < 1000
          );

          if (plValor !== undefined) {
            dadosColetados.pl = plValor;
            dadosColetados.fonte = `brapi-${isMobile ? 'mobile' : 'desktop'}-${estrategia.nome}`;
            console.log(`✅ P/L BRAPI ${estrategia.nome}: ${plValor}`);
          }

          const pvpValor = pickMetric(
            [
              estatisticas.priceToBook,
              estatisticas.priceToBookMRQ,
              resultado.priceToBook,
              resultado.priceBookValueRatio
            ],
            (valor) => valor > 0
          );

          if (pvpValor !== undefined && !dadosColetados.pvp) {
            dadosColetados.pvp = pvpValor;
            console.log(`✅ P/VP BRAPI ${estrategia.nome}: ${pvpValor}`);
          }

          if (dadosColetados.pl && dadosColetados.pvp) {
            break;
          }
        } catch (brapiErr) {
          console.log(
            `❌ BRAPI ${estrategia.nome} falhou:`,
            brapiErr instanceof Error ? brapiErr.message : brapiErr
          );
        }

        if (isMobile) {
          await wait(300);
        }
      }

      // 🇧🇷 PRIORIDADE 2: HG Brasil para outros dados (P/VP, DY, etc.) - SÓ SE NÃO TEM P/L
      if (!dadosColetados.pl) {
        console.log(`🇧🇷 PRIORIDADE 2: BRAPI não retornou P/L, buscando HG Brasil...`);
      } else {
        console.log(`🇧🇷 PRIORIDADE 2: P/L já obtido via BRAPI, buscando outros dados no HG Brasil...`);
      }
      
      try {
        const hgUrl = `https://api.hgbrasil.com/finance/stock_price?key=${HG_BRASIL_KEY}&symbol=${ticker}`;

        const hgStrategies = [
          {
            nome: 'allorigins-json',
            executar: async () => {
              const proxyResponse = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(hgUrl)}`, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json'
                }
              });

              if (!proxyResponse.ok) {
                throw new Error(`Status ${proxyResponse.status}`);
              }

              const proxyData = await proxyResponse.json();

              if (!proxyData?.contents) {
                throw new Error('Resposta vazia do proxy');
              }

              try {
                return JSON.parse(proxyData.contents);
              } catch (parseErr) {
                throw new Error(
                  parseErr instanceof Error ? parseErr.message : 'Erro ao parsear JSON do proxy'
                );
              }
            }
          },
          {
            nome: 'allorigins-raw',
            executar: async () => {
              const proxyResponse = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(hgUrl)}`);

              if (!proxyResponse.ok) {
                throw new Error(`Status ${proxyResponse.status}`);
              }

              const text = await proxyResponse.text();

              if (!text) {
                throw new Error('Resposta vazia do proxy (raw)');
              }

              try {
                return JSON.parse(text);
              } catch (parseErr) {
                throw new Error(
                  parseErr instanceof Error ? parseErr.message : 'Erro ao parsear JSON (raw)'
                );
              }
            }
          },
          {
            nome: 'direto',
            executar: async () => {
              const directResponse = await fetch(hgUrl);

              if (!directResponse.ok) {
                throw new Error(`Status ${directResponse.status}`);
              }

              return directResponse.json();
            }
          }
        ];

        let hgData: any = null;

        for (const estrategia of hgStrategies) {
          try {
            console.log(`🇧🇷 HG Brasil tentativa (${estrategia.nome}) para ${ticker}`);
            const resultado = await estrategia.executar();

            if (resultado) {
              hgData = resultado;
              console.log(`✅ HG Brasil ${estrategia.nome} funcionou`);
              break;
            }
          } catch (strategyErr) {
            console.log(
              `⚠️ HG Brasil ${estrategia.nome} falhou:`,
              strategyErr instanceof Error ? strategyErr.message : strategyErr
            );
          }

          if (isMobile) {
            await wait(300);
          }
        }

        // 🎯 PROCESSAR DADOS HG BRASIL (outros dados que não P/L)
        if (hgData?.results?.[ticker]) {
          const result = hgData.results[ticker];

          const pvp = pickMetric(
            [
              result.financials?.price_to_book_ratio,
              result.financials?.priceToBook,
              result.financials?.pvp
            ],
            (valor) => valor > 0
          );

          const dy = pickMetric(
            [
              result.financials?.dividends?.yield_12m,
              result.financials?.dividend_yield_12m
            ],
            (valor) => valor >= 0
          );

          // ✅ MESCLAR DADOS: P/L da BRAPI + outros dados do HG Brasil
          dadosColetados = {
            ...dadosColetados, // Preserva P/L da BRAPI se existir
            dividendYield12m: dy ?? dadosColetados.dividendYield12m,
            dividendSum12m:
              parseToNumber(result.financials?.dividends?.yield_12m_sum) ?? dadosColetados.dividendSum12m,
            pvp: pvp ?? dadosColetados.pvp,
            roe: parseToNumber(result.financials?.return_on_equity),
            equity: parseToNumber(result.financials?.equity),
            quotaCount: parseToNumber(result.financials?.quota_count),
            equityPerShare: parseToNumber(result.financials?.equity_per_share),
            ultimaAtualizacao: new Date().toISOString()
          };

          console.log(`✅ HG Brasil outros dados extraídos:`, {
            pvp: dadosColetados.pvp,
            dy: dadosColetados.dividendYield12m,
            fonte: dadosColetados.fonte
          });
        }
        
      } catch (hgErr) {
        console.log(
          `❌ HG Brasil falhou para ${ticker}:`,
          hgErr instanceof Error ? hgErr.message : hgErr
        );
      }

      // 🎯 FALLBACK FINAL: P/L Estimado (SÓ se BRAPI falhou)
      if (!dadosColetados.pl) {
        console.log(`🎯 Aplicando P/L estimado como último recurso...`);
        
        const plEstimados: Record<string, number> = {
          'ALOS3': 13.10, // 🎯 Valor correto confirmado
          'PETR4': 6.8, 'PETR3': 6.5, 'VALE3': 4.2, 'ITUB4': 8.5, 'BBDC4': 7.1,
          'ABEV3': 11.2, 'WEGE3': 28.5, 'RENT3': 15.3, 'LREN3': 22.1, 'MGLU3': 45.2,
          'VIVT3': 12.8, 'GGBR4': 5.9, 'USIM5': 7.3, 'CSNA3': 4.1, 'GOAU4': 6.7,
          'SUZB3': 18.9, 'JBSS3': 12.4, 'BEEF3': 8.7, 'MRFG3': 15.6, 'NTCO3': 9.8,
          'SMTO3': 11.3, 'PRIO3': 8.9, 'RRRP3': 7.8, 'CPLE6': 14.2, 'ELET3': 9.1,
          'CMIG4': 10.7, 'FLRY3': 19.8, 'RAIA3': 24.6, 'PCAR3': 16.4,
          'ASAI3': 28.7, 'SLCE3': 13.8, 'ARZZ3': 17.2, 'HAPV3': 21.5, 'DXCO3': 33.1,
          'RADL3': 26.3, 'PETZ3': 41.7, 'LWSA3': 52.8, 'AMAR3': 8.9,
          'TUPY3': 12.3, 'RECV3': 7.8, 'BBAS3': 6.2
        };

        if (plEstimados[ticker]) {
          dadosColetados.pl = plEstimados[ticker];
          dadosColetados.fonte = dadosColetados.fonte + '+estimado-fallback';
          console.log(`📊 P/L estimado aplicado para ${ticker}: ${plEstimados[ticker]}`);
        }
      }

      // 📊 RESULTADO FINAL
      setDadosHGBrasil(dadosColetados);
      
      // Salvar no cache
      localStorage.setItem(`cache_hg_${ticker}`, JSON.stringify({
        data: dadosColetados,
        timestamp: Date.now()
      }));
      
      console.log(`✅ DADOS FINAIS ${ticker}:`, {
        pl: dadosColetados.pl,
        pvp: dadosColetados.pvp,
        dy: dadosColetados.dividendYield12m,
        fonte: dadosColetados.fonte,
        dispositivo: isMobile ? 'MOBILE' : 'DESKTOP'
      });

      // ✅ CONFIRMAÇÃO FINAL
      if (dadosColetados.pl) {
        console.log(`🎯 P/L CONFIRMADO para ${ticker}: ${dadosColetados.pl} (fonte: ${dadosColetados.fonte})`);
      } else {
        console.error(`🚨 P/L CONTINUA NULO para ${ticker} no ${isMobile ? 'MOBILE' : 'DESKTOP'}`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error(`❌ Erro geral:`, err);
      setDadosHGBrasil(null);
    } finally {
      setLoading(false);
    }
  }, [ticker, isMobile]);

  useEffect(() => {
    if (deviceDetected) {
      console.log('🔥 Executando busca:', { ticker, isMobile, deviceDetected });
      fetchDadosHGBrasil();
    }
  }, [fetchDadosHGBrasil, deviceDetected, isMobile]);

  return { dadosHGBrasil, loading, error, refetch: fetchDadosHGBrasil };
}

// 🌍 Hook para dados de ativos internacionais via Yahoo Finance - VERSÃO MOBILE-FIRST CORRIGIDA
export function useYahooFinanceInternacional(ticker: string | undefined) {
  const [dadosYahoo, setDadosYahoo] = useState<{
    dividendYield?: number;
    pl?: number;
    pvp?: number;
    roe?: number;
    marketCap?: number;
    volume?: number;
    beta?: number;
    eps?: number;
    dividendRate?: number;
    payoutRatio?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    fonte: string;
    ultimaAtualizacao?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🔥 DETECTAR DISPOSITIVO COM ESTADO DE DETECÇÃO COMPLETA (IGUAL AO ARQUIVO 2)
  const [isMobile, setIsMobile] = useState(false);
  const [deviceDetected, setDeviceDetected] = useState(false);

  // 🔥 DETECÇÃO DE DISPOSITIVO (COPIADO DO ARQUIVO 2)
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const mobile = width <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      setDeviceDetected(true);
      console.log('📱 Yahoo - Dispositivo detectado:', { width, isMobile: mobile, deviceDetected: true });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const fetchDadosInternacionais = useCallback(async () => {
    if (!ticker) {
      setLoading(false);
      return;
    }

    // Só para ativos internacionais
    if ((ticker.match(/\d$/) && !ticker.includes('34') && !ticker.includes('35')) || ticker.includes('11')) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🌍 Buscando dados internacionais para ${ticker}...`);
      console.log('📱 Device Info:', { isMobile, deviceDetected });

      // Verificar cache primeiro (2 horas para dados fundamentalistas)
      const cachedData = localStorage.getItem(`cache_international_${ticker}`);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < 2 * 60 * 60 * 1000) {
          setDadosYahoo(parsed.data);
          setLoading(false);
          console.log(`✅ Dados internacionais ${ticker} carregados do cache`);
          return;
        }
      }

      let dadosColetados = {
        fonte: 'api-multipla',
        ultimaAtualizacao: new Date().toISOString()
      };
      let dadosObtidos = false;

      if (isMobile) {
        // 📱 MOBILE: Estratégia agressiva com múltiplas tentativas (IGUAL AO ARQUIVO 2)
        console.log('📱 [YAHOO-MOBILE] Estratégia agressiva para forçar API funcionar');
        
        // ESTRATÉGIA 1: YH Finance via Proxy com User-Agent Desktop
        if (!dadosObtidos) {
          try {
            console.log(`📱🔄 [YAHOO] ${ticker}: Tentativa 1 - User-Agent Desktop`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const yahooUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=summaryDetail,defaultKeyStatistics,financialData`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
            
            const response = await fetch(proxyUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const proxyData = await response.json();
              const yahooData = JSON.parse(proxyData.contents);
              console.log(`📱📊 Yahoo Resposta (Desktop UA):`, yahooData);

              if (yahooData?.quoteSummary?.result?.[0]) {
                const result = yahooData.quoteSummary.result[0];
                const price = result.price || {};
                const summaryDetail = result.summaryDetail || {};
                const defaultKeyStatistics = result.defaultKeyStatistics || {};
                const financialData = result.financialData || {};
                
                dadosColetados = {
                  ...dadosColetados,
                  dividendYield: summaryDetail.dividendYield?.raw ? (summaryDetail.dividendYield.raw * 100) : null,
                  pl: summaryDetail.trailingPE?.raw || defaultKeyStatistics.trailingPE?.raw,
                  pvp: defaultKeyStatistics.priceToBook?.raw || summaryDetail.priceToBook?.raw,
                  roe: financialData.returnOnEquity?.raw ? (financialData.returnOnEquity.raw * 100) : null,
                  dividendRate: summaryDetail.dividendRate?.raw || defaultKeyStatistics.dividendRate?.raw,
                  payoutRatio: defaultKeyStatistics.payoutRatio?.raw ? (defaultKeyStatistics.payoutRatio.raw * 100) : null,
                  marketCap: summaryDetail.marketCap?.raw || price.marketCap?.raw,
                  volume: summaryDetail.volume?.raw || summaryDetail.averageVolume?.raw,
                  beta: defaultKeyStatistics.beta?.raw,
                  eps: defaultKeyStatistics.trailingEps?.raw,
                  fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh?.raw || price.fiftyTwoWeekHigh?.raw,
                  fiftyTwoWeekLow: summaryDetail.fiftyTwoWeekLow?.raw || price.fiftyTwoWeekLow?.raw,
                  fonte: 'yahoo-mobile-ua-desktop'
                };

                setDadosYahoo(dadosColetados);
                
                // Salvar no cache
                localStorage.setItem(`cache_international_${ticker}`, JSON.stringify({
                  data: dadosColetados,
                  timestamp: Date.now()
                }));
                
                console.log(`📱✅ Yahoo ${ticker} obtido (Desktop UA):`, dadosColetados);
                dadosObtidos = true;
              }
            }
          } catch (error) {
            console.log(`📱❌ Yahoo ${ticker} (Desktop UA): ${error.message}`);
          }
        }

        // Delay entre tentativas
        if (!dadosObtidos) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // ESTRATÉGIA 2: API alternativa via BRAPI (para ativos americanos)
        if (!dadosObtidos && (ticker.match(/^[A-Z]+$/) || ticker.includes('.'))) {
          try {
            console.log(`📱🔄 [YAHOO] ${ticker}: Tentativa 2 - BRAPI Internacional`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(`https://brapi.dev/api/quote/${ticker}?modules=summaryDetail,defaultKeyStatistics&token=${BRAPI_TOKEN}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              },
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              console.log(`📱📊 BRAPI Resposta:`, data);

              if (data.results?.[0]) {
                const result = data.results[0];
                
                dadosColetados = {
                  ...dadosColetados,
                  pl: result.summaryDetail?.trailingPE || result.defaultKeyStatistics?.trailingPE,
                  pvp: result.defaultKeyStatistics?.priceToBook,
                  dividendYield: result.summaryDetail?.dividendYield || result.defaultKeyStatistics?.dividendYield,
                  marketCap: result.marketCap,
                  volume: result.regularMarketVolume,
                  fiftyTwoWeekHigh: result.fiftyTwoWeekHigh || result.summaryDetail?.fiftyTwoWeekHigh,
                  fiftyTwoWeekLow: result.fiftyTwoWeekLow || result.summaryDetail?.fiftyTwoWeekLow,
                  fonte: 'brapi-internacional-mobile'
                };

                setDadosYahoo(dadosColetados);
                
                // Salvar no cache
                localStorage.setItem(`cache_international_${ticker}`, JSON.stringify({
                  data: dadosColetados,
                  timestamp: Date.now()
                }));
                
                console.log(`📱✅ Yahoo ${ticker} obtido (BRAPI):`, dadosColetados);
                dadosObtidos = true;
              }
            }
          } catch (error) {
            console.log(`📱❌ Yahoo ${ticker} (BRAPI): ${error.message}`);
          }
        }

        // Delay entre tentativas
        if (!dadosObtidos) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // ESTRATÉGIA 3: Yahoo direto sem proxy
        if (!dadosObtidos) {
          try {
            console.log(`📱🔄 [YAHOO] ${ticker}: Tentativa 3 - Yahoo direto`);
            
            const response = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=summaryDetail,defaultKeyStatistics`, {
              method: 'GET',
              mode: 'cors'
            });

            if (response.ok) {
              const data = await response.json();
              console.log(`📱📊 Yahoo Resposta (Direto):`, data);

              if (data?.quoteSummary?.result?.[0]) {
                const result = data.quoteSummary.result[0];
                const summaryDetail = result.summaryDetail || {};
                const defaultKeyStatistics = result.defaultKeyStatistics || {};
                
                dadosColetados = {
                  ...dadosColetados,
                  dividendYield: summaryDetail.dividendYield?.raw ? (summaryDetail.dividendYield.raw * 100) : null,
                  pl: summaryDetail.trailingPE?.raw || defaultKeyStatistics.trailingPE?.raw,
                  pvp: defaultKeyStatistics.priceToBook?.raw,
                  marketCap: summaryDetail.marketCap?.raw,
                  volume: summaryDetail.volume?.raw,
                  fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh?.raw || defaultKeyStatistics.fiftyTwoWeekHigh?.raw,
                  fiftyTwoWeekLow: summaryDetail.fiftyTwoWeekLow?.raw || defaultKeyStatistics.fiftyTwoWeekLow?.raw,
                  fonte: 'yahoo-mobile-direto'
                };

                setDadosYahoo(dadosColetados);
                
                // Salvar no cache
                localStorage.setItem(`cache_international_${ticker}`, JSON.stringify({
                  data: dadosColetados,
                  timestamp: Date.now()
                }));
                
                console.log(`📱✅ Yahoo ${ticker} obtido (Direto):`, dadosColetados);
                dadosObtidos = true;
              }
            }
          } catch (error) {
            console.log(`📱❌ Yahoo ${ticker} (Direto): ${error.message}`);
          }
        }

        if (!dadosObtidos) {
          console.log(`📱⚠️ Yahoo ${ticker}: Todas as estratégias mobile falharam`);
        }

      } else {
        // 🖥️ DESKTOP: Estratégia original (mais simples) - MANTIDA IGUAL
        console.log('🖥️ [YAHOO-DESKTOP] Estratégia desktop padrão');
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);
          
          const yahooUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=price,summaryDetail,defaultKeyStatistics,financialData,keyStatistics`;
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
          
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const proxyData = await proxyResponse.json();
            const yahooData = JSON.parse(proxyData.contents);
            console.log(`🖥️📊 Yahoo Resposta Desktop:`, yahooData);

            if (yahooData?.quoteSummary?.result?.[0]) {
              const result = yahooData.quoteSummary.result[0];
              const price = result.price || {};
              const summaryDetail = result.summaryDetail || {};
              const defaultKeyStatistics = result.defaultKeyStatistics || {};
              const financialData = result.financialData || {};
              
              dadosColetados = {
                ...dadosColetados,
                dividendYield: summaryDetail.dividendYield?.raw ? (summaryDetail.dividendYield.raw * 100) : null,
                pl: summaryDetail.trailingPE?.raw || defaultKeyStatistics.trailingPE?.raw,
                pvp: defaultKeyStatistics.priceToBook?.raw || summaryDetail.priceToBook?.raw,
                roe: financialData.returnOnEquity?.raw ? (financialData.returnOnEquity.raw * 100) : null,
                dividendRate: summaryDetail.dividendRate?.raw || defaultKeyStatistics.dividendRate?.raw,
                payoutRatio: defaultKeyStatistics.payoutRatio?.raw ? (defaultKeyStatistics.payoutRatio.raw * 100) : null,
                marketCap: summaryDetail.marketCap?.raw || price.marketCap?.raw,
                volume: summaryDetail.volume?.raw || summaryDetail.averageVolume?.raw,
                beta: defaultKeyStatistics.beta?.raw,
                eps: defaultKeyStatistics.trailingEps?.raw,
                fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh?.raw || price.fiftyTwoWeekHigh?.raw,
                fiftyTwoWeekLow: summaryDetail.fiftyTwoWeekLow?.raw || price.fiftyTwoWeekLow?.raw,
                fonte: 'yahoo-desktop'
              };

              setDadosYahoo(dadosColetados);
              
              // Salvar no cache
              localStorage.setItem(`cache_international_${ticker}`, JSON.stringify({
                data: dadosColetados,
                timestamp: Date.now()
              }));
              
              console.log(`🖥️✅ Yahoo ${ticker} obtido Desktop:`, dadosColetados);
              dadosObtidos = true;
            }
          }
        } catch (error) {
          console.log(`🖥️❌ Yahoo ${ticker} Desktop:`, error.message);
        }
      }

      // FALLBACK COM DADOS ESTIMADOS (MANTIDO IGUAL)
      if (!dadosObtidos || (!dadosColetados.pl && !dadosColetados.pvp)) {
        const dadosEstimados: Record<string, { pl?: number; pvp?: number; dy?: number }> = {
          // ========================================
          // TECNOLOGIA - MEGA CAPS
          // ========================================
          'AAPL': { pl: 29.8, pvp: 39.1, dy: 0.52 },
          'MSFT': { pl: 37.9, pvp: 13.4, dy: 0.75 },
          'GOOGL': { pl: 26.4, pvp: 5.8, dy: 0.0 },
          'AMZN': { pl: 42.1, pvp: 8.3, dy: 0.0 },
          'META': { pl: 24.9, pvp: 7.2, dy: 0.0 },
          'NVDA': { pl: 51.2, pvp: 55.8, dy: 0.09 },
          'AMD': { pl: 68.5, pvp: 3.8, dy: 0.0 },
          'AMAT': { pl: 24.3, pvp: 6.5, dy: 1.0 },
          'TSLA': { pl: 65.4, pvp: 12.7, dy: 0.0 },

          // ========================================
          // TECNOLOGIA - SOFTWARE & CLOUD
          // ========================================
          'CRM': { pl: 38.5, pvp: 5.4, dy: 0.0 },

          // ========================================
          // FINANCEIRO
          // ========================================
          'JPM': { pl: 12.5, pvp: 1.8, dy: 2.3 },
          'BRK.B': { pl: 22.8, pvp: 1.5, dy: 0.0 },
          'XP': { pl: 14.2, pvp: 2.1, dy: 3.8 },
          'PYPL': { pl: 18.4, pvp: 3.2, dy: 0.0 },

          // ========================================
          // SAÚDE (HEALTHCARE)
          // ========================================
          'UNH': { pl: 15.7, pvp: 5.8, dy: 2.5 },

          // ========================================
          // VAREJO (RETAIL)
          // ========================================
          'COST': { pl: 52.5, pvp: 13.2, dy: 0.55 },
          'HD': { pl: 27.3, pvp: 124.5, dy: 2.28 },
          'FIVE': { pl: 18.5, pvp: 3.2, dy: 0.0 },

          // ========================================
          // BEBIDAS & ALIMENTOS
          // ========================================
          'KO': { pl: 26.1, pvp: 9.8, dy: 3.0 },
          'PEP': { pl: 24.7, pvp: 12.1, dy: 2.7 },

          // ========================================
          // TECNOLOGIA INDUSTRIAIS
          // ========================================
          'STX': { pl: 14.2, pvp: 2.8, dy: 3.2 },

          // ========================================
          // TELECOMUNICAÇÕES
          // ========================================
          'VZ': { pl: 9.5, pvp: 1.8, dy: 6.4 },

          // ========================================
          // ENERGIA
          // ========================================
          'OXY': { pl: 11.8, pvp: 1.9, dy: 1.3 },

          // ========================================
          // REITs - INDUSTRIAL (Price/FFO usado como "pl")
          // ========================================
          'PLD': { pl: 24.5, pvp: 3.8, dy: 2.8 },
          'STAG': { pl: 15.0, pvp: 1.4, dy: 4.5 },

          // ========================================
          // REITs - TRIPLE NET LEASE
          // ========================================
          'O': { pl: 15.4, pvp: 1.3, dy: 4.9 },
          'NNN': { pl: 14.0, pvp: 1.4, dy: 4.8 },
          'WPC': { pl: 16.2, pvp: 1.2, dy: 5.5 },
          'ADC': { pl: 13.5, pvp: 1.1, dy: 6.2 },

          // ========================================
          // REITs - HEALTHCARE
          // ========================================
          'DOC': { pl: 17.8, pvp: 1.5, dy: 4.3 },

          // ========================================
          // REITs - RESIDENTIAL/APARTMENT
          // ========================================
          'AVB': { pl: 17.5, pvp: 2.1, dy: 3.7 },

          // ========================================
          // REITs - INFRASTRUCTURE/SPECIALTY
          // ========================================
          'AMT': { pl: 24.3, pvp: 9.5, dy: 2.8 },
          'ARE': { pl: 19.5, pvp: 1.8, dy: 3.9 },

          // ========================================
          // REITs - RETAIL/MALL
          // ========================================
          'SPG': { pl: 11.2, pvp: 2.8, dy: 5.8 },

          // ========================================
          // ETFs - EQUITY BROAD MARKET
          // ========================================
          'QQQ': { pl: 35.2, pvp: 8.5, dy: 0.48 },
          'SPY': { pl: 24.5, pvp: 4.8, dy: 1.2 },
          'IWM': { pl: 21.3, pvp: 1.9, dy: 1.4 },

          // ========================================
          // ETFs - DIVIDEND FOCUSED
          // ========================================
          'SCHD': { pl: 18.5, pvp: 3.2, dy: 3.5 },
          'NOBL': { pl: 22.1, pvp: 4.1, dy: 2.1 },
          'JEPQ': { pl: 0, pvp: 0, dy: 9.2 },

          // ========================================
          // ETFs - BONDS/FIXED INCOME
          // ========================================
          'TLT': { pl: 0, pvp: 0, dy: 3.8 },

          // ========================================
          // ETFs - COMMODITIES
          // ========================================
          'IAU': { pl: 0, pvp: 0, dy: 0.0 }
        };

        if (dadosEstimados[ticker]) {
          const estimados = dadosEstimados[ticker];
          
          if (!dadosColetados.pl && estimados.pl) {
            dadosColetados.pl = estimados.pl;
          }
          if (!dadosColetados.pvp && estimados.pvp) {
            dadosColetados.pvp = estimados.pvp;
          }
          if (!dadosColetados.dividendYield && estimados.dy !== undefined) {
            dadosColetados.dividendYield = estimados.dy;
          }
          
          dadosColetados.fonte = dadosColetados.fonte + '+estimado';
          console.log(`📊 Dados estimados aplicados para ${ticker}:`, estimados);
        }

        setDadosYahoo(dadosColetados);
        
        // Salvar no cache
        localStorage.setItem(`cache_international_${ticker}`, JSON.stringify({
          data: dadosColetados,
          timestamp: Date.now()
        }));
      }

      console.log(`✅ Dados internacionais finais para ${ticker}:`, dadosColetados);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error(`❌ Erro geral Yahoo ${ticker}:`, err);
      setDadosYahoo(null);
    } finally {
      setLoading(false);
    }
  }, [ticker, isMobile]);

  // ✅ USEEFFECT CORRIGIDO: Aguarda detecção E re-executa quando isMobile muda (IGUAL AO ARQUIVO 2)
  useEffect(() => {
    if (deviceDetected) {
      console.log('🔥 Yahoo: Executando busca após detecção de dispositivo:', { isMobile, deviceDetected });
      fetchDadosInternacionais();
    }
  }, [fetchDadosInternacionais, deviceDetected, isMobile]);

  return { dadosYahoo, loading, error, refetch: fetchDadosInternacionais };
}

// Hook para dados de FII (MANTIDO IGUAL)
export function useDadosFII(ticker: string, dadosFinanceiros?: DadosFinanceiros | null) {
  const [dadosFII, setDadosFII] = useState<DadosFII | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarDadosFII = useCallback(async () => {
    if (!ticker) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Dados manuais
      const dadosManuais = localStorage.getItem(`dados_fii_${ticker}`);
      let dadosProcessados: DadosFII = { fonte: 'manual' };
      
      if (dadosManuais) {
        const dadosSalvos = JSON.parse(dadosManuais);
        dadosProcessados = { ...dadosSalvos, fonte: 'manual' };
      }

      // Tentar API
      if (typeof window !== 'undefined' && navigator.onLine) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(`https://brapi.dev/api/quote/${ticker}?modules=defaultKeyStatistics&token=${BRAPI_TOKEN}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const fii = data.results[0];
              const stats = fii.defaultKeyStatistics || {};
              
              const dadosAPI = {
                valorPatrimonial: stats.bookValue,
                pvp: stats.priceToBook,
                numeroCotas: stats.sharesOutstanding,
                ultimoRendimento: stats.lastDividendValue,
                dataUltimoRendimento: stats.lastDividendDate,
                ultimaAtualizacao: new Date().toLocaleString('pt-BR')
              };

              if (dadosAPI.valorPatrimonial && dadosAPI.numeroCotas) {
                dadosAPI.patrimonio = dadosAPI.valorPatrimonial * dadosAPI.numeroCotas;
              }

              dadosProcessados = { ...dadosProcessados, ...dadosAPI, fonte: 'api' };
            }
          }
        } catch (apiError) {
          console.error('Erro na API FII:', apiError);
        }
      }

      // Dados de exemplo se necessário
      if (!dadosProcessados.valorPatrimonial) {
        const dadosExemplo = {
          valorPatrimonial: 100.25,
          pvp: 0.88,
          valorMercado: 2200000000,
          valorCaixa: 150000000,
          numeroCotas: 26178644,
          ultimoRendimento: 0.75,
          dataUltimoRendimento: '2024-12-15',
          ultimaAtualizacao: 'Exemplo - ' + new Date().toLocaleString('pt-BR')
        };
        
        dadosExemplo.patrimonio = dadosExemplo.valorPatrimonial * dadosExemplo.numeroCotas;
        dadosProcessados = { ...dadosProcessados, ...dadosExemplo, fonte: 'exemplo' as any };
      }

      setDadosFII(dadosProcessados);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      setDadosFII({ fonte: 'manual' });
    } finally {
      setLoading(false);
    }
  }, [ticker, dadosFinanceiros]);

  const salvarDadosManuais = useCallback((dadosManuais: Partial<DadosFII>) => {
    try {
      const dadosParaSalvar = {
        dyCagr3Anos: dadosManuais.dyCagr3Anos,
        numeroCotistas: dadosManuais.numeroCotistas
      };
      
      localStorage.setItem(`dados_fii_${ticker}`, JSON.stringify(dadosParaSalvar));
      
      setDadosFII(prev => ({
        ...prev,
        ...dadosParaSalvar,
        fonte: prev?.fonte === 'api' ? 'misto' : prev?.fonte || 'manual'
      }));
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  }, [ticker]);

  useEffect(() => {
    buscarDadosFII();
  }, [buscarDadosFII]);

  return { dadosFII, loading, error, refetch: buscarDadosFII, salvarDadosManuais };
}

// Hook para Dividend Yield CORRIGIDO PARA ATIVOS INTERNACIONAIS
export function useDividendYield(
  ticker: string | undefined, 
  dataEntrada: string, 
  precoAtual?: number, 
  precoEntrada?: string, 
  isFII = false
) {
  const [dyData, setDyData] = useState({
    dy12Meses: 0,
    dyDesdeEntrada: 0
  });
  const [loading, setLoading] = useState(true);
  const [fonte, setFonte] = useState('');

  const calcularDY = useCallback(async () => {
    if (!ticker) {
      setDyData({ dy12Meses: 0, dyDesdeEntrada: 0 });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`📊 Calculando DY para ${ticker}:`, { 
        precoAtual, 
        precoEntrada, 
        dataEntrada, 
        isFII 
      });

      // 🌍 DETECTAR SE É ATIVO INTERNACIONAL
      const ehInternacional = !ticker.match(/\d$/) && !ticker.includes('11') && !ticker.includes('34') && !ticker.includes('35');
      console.log(`🌍 ${ticker} é internacional?`, ehInternacional);

      // 1. PARA ATIVOS INTERNACIONAIS - BUSCAR VIA API
      if (ehInternacional) {
        console.log(`🌍 Buscando DY internacional para ${ticker}...`);

        // A. Tentar Yahoo Finance via proxy
        try {
          const yahooUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=summaryDetail,defaultKeyStatistics`;
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const proxyData = await response.json();
            const yahooData = JSON.parse(proxyData.contents);
            
            if (yahooData?.quoteSummary?.result?.[0]) {
              const result = yahooData.quoteSummary.result[0];
              const summaryDetail = result.summaryDetail || {};
              
              const dividendYield = summaryDetail.dividendYield?.raw;
              
              if (dividendYield && dividendYield > 0) {
                const dyPercent = dividendYield * 100;
                console.log(`✅ DY encontrado no Yahoo Finance para ${ticker}: ${dyPercent.toFixed(2)}%`);
                
                setDyData({
                  dy12Meses: dyPercent,
                  dyDesdeEntrada: dyPercent // Para ativos internacionais, usar o mesmo valor
                });
                setFonte('Yahoo Finance');
                setLoading(false);
                return;
              }
            }
          }
        } catch (yahooError) {
          console.log(`⚠️ Erro Yahoo Finance para ${ticker}:`, yahooError.message);
        }

        // B. Fallback: Dados estimados para ações conhecidas
        const dyEstimados: Record<string, number> = {
          // Ações americanas com dividendos conhecidos (% anual)
          'AAPL': 0.52, 'MSFT': 0.68, 'GOOGL': 0.0, 'AMZN': 0.0, 'TSLA': 0.0, 'META': 0.0,
          'NVDA': 0.09, 'KO': 3.0, 'PEP': 2.7, 'JNJ': 2.9, 'PFE': 5.8, 'XOM': 6.1,
          'CVX': 3.4, 'VZ': 6.8, 'T': 7.4, 'IBM': 4.6, 'JPM': 2.4, 'BAC': 2.8,
          'WFC': 2.9, 'V': 0.7, 'MA': 0.5, 'HD': 2.4, 'WMT': 1.7, 'DIS': 0.0,
          'NKE': 1.1, 'MCD': 2.2, 'SBUX': 2.3, 'INTC': 1.5, 'AMD': 0.0,
          
          // ETFs conhecidos
          'VOO': 1.3, 'QQQ': 0.6, 'SPY': 1.3, 'VTI': 1.4, 'SCHD': 3.2, 'VYM': 2.8,
          'VXUS': 2.1, 'VEA': 2.4, 'VWO': 3.1, 'BND': 2.1, 'TLT': 2.8,
          'GLD': 0.0, 'SLV': 0.0, 'IVV': 1.3, 'IEMG': 2.8,
          
          // REITs populares
          'O': 4.1, 'STAG': 3.8, 'NNN': 4.2, 'WPC': 5.1, 'VICI': 4.8,
          
          // Setores específicos
          'MO': 8.1, 'PM': 5.2, 'UPS': 3.5, 'CAT': 2.1, 'MMM': 3.3,
          'GE': 0.4, 'F': 4.4, 'GM': 0.6, 'OXY': 1.2, 'SLB': 2.4
        };

        if (dyEstimados[ticker] !== undefined) {
          const dyEstimado = dyEstimados[ticker];
          console.log(`📊 Usando DY estimado para ${ticker}: ${dyEstimado}%`);
          
          setDyData({
            dy12Meses: dyEstimado,
            dyDesdeEntrada: dyEstimado
          });
          setFonte('Estimativa');
          setLoading(false);
          return;
        }

        // C. Se chegou aqui, não tem dados
        console.log(`❌ Nenhum DY encontrado para ativo internacional ${ticker}`);
        setDyData({ dy12Meses: 0, dyDesdeEntrada: 0 });
        setFonte('Indisponível');
        setLoading(false);
        return;
      }

      // 2. PARA ATIVOS BRASILEIROS E FIIs - LÓGICA ORIGINAL
      if (!precoAtual || precoAtual <= 0 || !precoEntrada || !dataEntrada) {
        console.log(`❌ Dados insuficientes para calcular DY brasileiro de ${ticker}`);
        setDyData({ dy12Meses: 0, dyDesdeEntrada: 0 });
        setFonte('Dados insuficientes');
        setLoading(false);
        return;
      }

      let dadosSalvos = null;
      
      if (typeof window !== 'undefined') {
        if (isFII) {
          dadosSalvos = localStorage.getItem(`dividendos_fii_${ticker}`) || 
                       localStorage.getItem(`proventos_${ticker}`) ||
                       localStorage.getItem(`rendimentos_${ticker}`);
        } else {
          dadosSalvos = localStorage.getItem(`proventos_${ticker}`);
        }

        if (!dadosSalvos) {
          const proventosCentral = localStorage.getItem('proventos_central_master');
          if (proventosCentral) {
            try {
              const todosDados = JSON.parse(proventosCentral);
              const dadosTicker = todosDados.filter((item: any) => item.ticker === ticker);
              if (dadosTicker.length > 0) {
                dadosSalvos = JSON.stringify(dadosTicker);
              }
            } catch (err) {
              console.error('Erro ao buscar do sistema central:', err);
            }
          }
        }
      }
      
      if (!dadosSalvos) {
        console.log(`❌ Nenhum provento local encontrado para ${ticker}`);
        setDyData({ dy12Meses: 0, dyDesdeEntrada: 0 });
        setFonte('Sem histórico');
        setLoading(false);
        return;
      }

      const proventos = JSON.parse(dadosSalvos).map((item: any) => ({
        ...item,
        dataObj: new Date(item.dataCom || item.data || item.dataObj || item.dataFormatada)
      }));

      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);

      const dataEntradaObj = new Date(dataEntrada.split('/').reverse().join('-'));
      const data12MesesAtras = new Date(hoje);
      data12MesesAtras.setFullYear(data12MesesAtras.getFullYear() - 1);
      data12MesesAtras.setHours(0, 0, 0, 0);

      const proventos12Meses = proventos.filter((provento: any) => {
        if (!provento.dataObj || isNaN(provento.dataObj.getTime())) return false;
        return provento.dataObj >= data12MesesAtras && provento.dataObj <= hoje;
      });

      const proventosDesdeEntrada = proventos.filter((provento: any) => 
        provento.dataObj && 
        !isNaN(provento.dataObj.getTime()) &&
        provento.dataObj >= dataEntradaObj && 
        provento.dataObj <= hoje
      );

      const totalProventos12Meses = proventos12Meses.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
      const totalProventosDesdeEntrada = proventosDesdeEntrada.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);

      const dy12Meses = precoAtual > 0 ? (totalProventos12Meses / precoAtual) * 100 : 0;
      
      // Converte precoEntrada de string para número
      let precoEntradaNumero = 0;
      if (typeof precoEntrada === 'string') {
        precoEntradaNumero = parseFloat(precoEntrada.replace('R$ ', '').replace('.', '').replace(',', '.'));
      } else if (typeof precoEntrada === 'number') {
        precoEntradaNumero = precoEntrada;
      }
      
      const dyDesdeEntrada = precoEntradaNumero > 0 ? (totalProventosDesdeEntrada / precoEntradaNumero) * 100 : 0;

      console.log(`✅ DY calculado para ${ticker}: 12m=${dy12Meses.toFixed(2)}%, Entrada=${dyDesdeEntrada.toFixed(2)}%`);

      setDyData({
        dy12Meses: isNaN(dy12Meses) ? 0 : dy12Meses,
        dyDesdeEntrada: isNaN(dyDesdeEntrada) ? 0 : dyDesdeEntrada
      });
      setFonte('Histórico Local');

    } catch (error) {
      console.error(`❌ Erro ao calcular DY para ${ticker}:`, error);
      setDyData({ dy12Meses: 0, dyDesdeEntrada: 0 });
      setFonte('Erro');
    } finally {
      setLoading(false);
    }
  }, [ticker, precoAtual, precoEntrada, dataEntrada, isFII]);

  useEffect(() => {
    calcularDY();
  }, [calcularDY]);

  return { 
    ...dyData, 
    loading, 
    fonte,
    refetch: calcularDY 
  };
}

// 💱 Hook para cotação USD/BRL em tempo real
export function useCotacaoUSD() {
  const [cotacaoUSD, setCotacaoUSD] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>('');

  const buscarCotacaoUSD = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('💱 Buscando cotação USD/BRL...');

      // Verificar cache primeiro (15 minutos para cotação)
      const cachedData = localStorage.getItem('cache_usd_brl');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < 15 * 60 * 1000) {
          setCotacaoUSD(parsed.cotacao);
          setUltimaAtualizacao('Cache: ' + new Date(parsed.timestamp).toLocaleString('pt-BR'));
          setLoading(false);
          console.log(`✅ USD/BRL do cache: R$ ${parsed.cotacao}`);
          return;
        }
      }

      // MÉTODO 1: BRAPI (Recomendado - dados brasileiros)
      try {
        console.log('📡 Tentando BRAPI para USD/BRL...');
        
        const brapiResponse = await fetch(`https://brapi.dev/api/quote/USDBRL=X?token=${BRAPI_TOKEN}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Portfolio-App/1.0'
          }
        });

        if (brapiResponse.ok) {
          const brapiData = await brapiResponse.json();
          
          if (brapiData.results && brapiData.results[0]) {
            const usdBrl = brapiData.results[0].regularMarketPrice;
            
            if (usdBrl && usdBrl > 0) {
              setCotacaoUSD(usdBrl);
              setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
              
              // Salvar no cache
              localStorage.setItem('cache_usd_brl', JSON.stringify({
                cotacao: usdBrl,
                timestamp: Date.now()
              }));
              
              console.log(`✅ USD/BRL BRAPI: R$ ${usdBrl.toFixed(2)}`);
              setLoading(false);
              return;
            }
          }
        }
      } catch (brapiError) {
        console.log('⚠️ BRAPI falhou, tentando HG Brasil...');
      }

      // MÉTODO 2: HG Brasil (Backup)
      try {
        console.log('📡 Tentando HG Brasil para USD/BRL...');
        
        const hgUrl = `https://api.hgbrasil.com/finance?key=${HG_BRASIL_KEY}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(hgUrl)}`;

        const hgResponse = await fetch(proxyUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (hgResponse.ok) {
          const proxyData = await hgResponse.json();
          const hgData = JSON.parse(proxyData.contents);
          
          if (hgData.results && hgData.results.currencies && hgData.results.currencies.USD) {
            const usdBrl = hgData.results.currencies.USD.buy;
            
            if (usdBrl && usdBrl > 0) {
              setCotacaoUSD(usdBrl);
              setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
              
              // Salvar no cache
              localStorage.setItem('cache_usd_brl', JSON.stringify({
                cotacao: usdBrl,
                timestamp: Date.now()
              }));
              
              console.log(`✅ USD/BRL HG Brasil: R$ ${usdBrl.toFixed(2)}`);
              setLoading(false);
              return;
            }
          }
        }
      } catch (hgError) {
        console.log('⚠️ HG Brasil falhou, tentando AwesomeAPI...');
      }

      // MÉTODO 3: AwesomeAPI (Backup brasileiro)
      try {
        console.log('📡 Tentando AwesomeAPI para USD/BRL...');
        
        const awesomeResponse = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (awesomeResponse.ok) {
          const awesomeData = await awesomeResponse.json();
          
          if (awesomeData.USDBRL && awesomeData.USDBRL.bid) {
            const usdBrl = parseFloat(awesomeData.USDBRL.bid);
            
            if (usdBrl && usdBrl > 0) {
              setCotacaoUSD(usdBrl);
              setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
              
              // Salvar no cache
              localStorage.setItem('cache_usd_brl', JSON.stringify({
                cotacao: usdBrl,
                timestamp: Date.now()
              }));
              
              console.log(`✅ USD/BRL AwesomeAPI: R$ ${usdBrl.toFixed(2)}`);
              setLoading(false);
              return;
            }
          }
        }
      } catch (awesomeError) {
        console.log('⚠️ AwesomeAPI falhou, usando valor estimado...');
      }

      // MÉTODO 4: Yahoo Finance (Internacional)
      try {
        console.log('📡 Tentando Yahoo Finance para USD/BRL...');
        
        const yahooUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X';
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;

        const yahooResponse = await fetch(proxyUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (yahooResponse.ok) {
          const proxyData = await yahooResponse.json();
          const yahooData = JSON.parse(proxyData.contents);
          
          if (yahooData?.chart?.result?.[0]?.meta?.regularMarketPrice) {
            const usdBrl = yahooData.chart.result[0].meta.regularMarketPrice;
            
            if (usdBrl && usdBrl > 0) {
              setCotacaoUSD(usdBrl);
              setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
              
              // Salvar no cache
              localStorage.setItem('cache_usd_brl', JSON.stringify({
                cotacao: usdBrl,
                timestamp: Date.now()
              }));
              
              console.log(`✅ USD/BRL Yahoo Finance: R$ ${usdBrl.toFixed(2)}`);
              setLoading(false);
              return;
            }
          }
        }
      } catch (yahooError) {
        console.log('⚠️ Yahoo Finance falhou...');
      }

      // FALLBACK: Valor estimado (última opção)
      console.log('📊 Usando cotação estimada USD/BRL...');
      const cotacaoEstimada = 5.25; // Valor aproximado
      setCotacaoUSD(cotacaoEstimada);
      setUltimaAtualizacao('Estimado - ' + new Date().toLocaleString('pt-BR'));
      
      console.log(`⚠️ USD/BRL estimado: R$ ${cotacaoEstimada}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro ao buscar cotação USD/BRL:', error);
      
      // Em caso de erro, usar valor padrão
      setCotacaoUSD(5.20);
      setUltimaAtualizacao('Erro - valor padrão');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarCotacaoUSD();
    
    // Atualizar a cada 15 minutos
    const interval = setInterval(buscarCotacaoUSD, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [buscarCotacaoUSD]);

  return { 
    cotacaoUSD, 
    loading, 
    error, 
    ultimaAtualizacao, 
    refetch: buscarCotacaoUSD 
  };
}