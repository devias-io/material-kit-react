'use client';

import { useState, useEffect, useCallback } from 'react';

// 🎨 INTERFACES TypeScript
interface BRAPIETFData {
  symbol: string;
  shortName: string;
  longName: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketDayRange: string;
  regularMarketVolume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekRange: string;
  marketCap: number | null;
  logoUrl: string;
  dividendsData?: any;
  distanceFrom52WeekHigh: number | null;
  distanceFrom52WeekLow: number | null;
  requestedAt: string;
  fonte: string;
}

// 🚀 HOOK PARA BUSCAR DADOS DE ETF DA BRAPI
export const useBRAPIETF = (ticker: string) => {
  const [etfData, setETFData] = useState<BRAPIETFData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);

  // Lista de ETFs conhecidos que estão disponíveis na BRAPI
  const ETFs_BRAPI: string[] = [
    'QUAL', 'QQQ', 'SPY', 'VTI', 'VEA', 'VWO', 'SOXX', 'XLF', 'XLK', 'XLV', 'XLE',
    'VOO', 'IVV', 'VXUS', 'BND', 'AGG', 'LQD', 'HYG', 'EMB', 'VB', 'VTV', 'VUG',
    'IWM', 'IWN', 'IWO', 'IJH', 'IJR', 'IJK', 'IJJ', 'IJS', 'IWV', 'ITOT',
    'XLC', 'XLI', 'XLB', 'XLRE', 'XLP', 'XLY', 'XLU', 'GLD', 'SLV', 'IAU',
    'ARKK', 'ARKQ', 'ARKW', 'ARKG', 'ARKF', 'VNQ', 'SCHP', 'VTEB', 'TFLO',
    'TLT', 'IEF', 'SHY', 'NOBL', 'HERO', 'MCHI', 'PDBC', 'DBA', 'USO', 'UNG'
  ];

  // Verificar se é ETF disponível na BRAPI
  const isETFBRAPI = useCallback((symbol: string): boolean => {
    if (!symbol) return false;
    return ETFs_BRAPI.includes(symbol.toUpperCase());
  }, []);

  // Função para buscar dados da API
  const fetchETFData = useCallback(async (): Promise<void> => {
    if (!ticker || !isETFBRAPI(ticker)) {
      setETFData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Buscando dados do ETF ${ticker} na BRAPI...`);

      const apiUrl = `/api/financial/quotes?symbols=${encodeURIComponent(ticker)}&dividends=true`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      const result = data.results?.[0] ?? data.quotes?.[0];
      if (result) {
        
        // Processar e estruturar os dados
        const processedData: BRAPIETFData = {
          // Dados básicos
          symbol: result.symbol,
          shortName: result.shortName,
          longName: result.longName,
          currency: result.currency,
          
          // Preços
          regularMarketPrice: result.regularMarketPrice,
          regularMarketChange: result.regularMarketChange,
          regularMarketChangePercent: result.regularMarketChangePercent,
          regularMarketPreviousClose: result.regularMarketPreviousClose,
          regularMarketOpen: result.regularMarketOpen,
          
          // Range diário
          regularMarketDayHigh: result.regularMarketDayHigh,
          regularMarketDayLow: result.regularMarketDayLow,
          regularMarketDayRange: result.regularMarketDayRange,
          
          // Volume
          regularMarketVolume: result.regularMarketVolume,
          
          // 52 semanas
          fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: result.fiftyTwoWeekLow,
          fiftyTwoWeekRange: result.fiftyTwoWeekRange,
          
          // Outros dados
          marketCap: result.marketCap,
          logoUrl: result.logourl,
          
          // Dados de dividendos se disponíveis
          dividendsData: result.dividendsData,
          
          // Métricas calculadas
          distanceFrom52WeekHigh: result.fiftyTwoWeekHigh ? 
            (((result.fiftyTwoWeekHigh - result.regularMarketPrice) / result.regularMarketPrice) * 100) : null,
          distanceFrom52WeekLow: result.fiftyTwoWeekLow ?
            (((result.regularMarketPrice - result.fiftyTwoWeekLow) / result.fiftyTwoWeekLow) * 100) : null,
          
          // Timestamp da busca
          requestedAt: data.requestedAt,
          fonte: 'BRAPI'
        };

        setETFData(processedData);
        setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
        
        console.log(`✅ Dados do ETF ${ticker} carregados da BRAPI:`, processedData);
        
      } else {
        throw new Error('Nenhum resultado encontrado na resposta da API');
      }

    } catch (err: any) {
      console.error(`❌ Erro ao buscar ETF ${ticker} na BRAPI:`, err);
      setError(err.message);
      setETFData(null);
    } finally {
      setLoading(false);
    }
  }, [ticker, isETFBRAPI]); // ✅ Dependências corretas

  // useEffect com dependências corretas
  useEffect(() => {
    fetchETFData();
  }, [fetchETFData]); // ✅ Dependência da função

  // Função de refetch
  const refetch = useCallback((): void => {
    fetchETFData();
  }, [fetchETFData]);

  return {
    etfData,
    loading,
    error,
    ultimaAtualizacao,
    refetch,
    isETFSupported: isETFBRAPI(ticker)
  };
};
