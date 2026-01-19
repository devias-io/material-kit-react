import { useState, useEffect, useCallback } from 'react';

import { DadosBDR } from '../useAtivoDetalhes';

// 🔥 HOOK PARA BUSCAR DADOS REAIS DOS BDRs
export function useBDRDataAPI(bdrTicker: string | null) {
  const [bdrData, setBDRData] = useState<DadosBDR | null>(null);
  const [bdrLoading, setBDRLoading] = useState(true);
  const [bdrError, setBDRError] = useState<string | null>(null);

  const fetchBDRData = useCallback(async () => {
    if (!bdrTicker) {
      setBDRLoading(false);
      return;
    }

    try {
      setBDRError(null);
      console.log(`🇧🇷 Buscando cotação do BDR: ${bdrTicker}...`);
      
      const response = await fetch(`/api/financial/quotes?symbols=${encodeURIComponent(bdrTicker)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      const result = data?.results?.[0] ?? data?.quotes?.[0];
      if (result) {

        const pickNumber = (...values: Array<number | null | undefined>) => {
          for (const value of values) {
            if (typeof value === 'number' && !Number.isNaN(value)) {
              return value;
            }
          }
          return undefined;
        };

        const price = pickNumber(
          result.regularMarketPrice,
          result.currentPrice,
          result.previousClose,
          result.regularMarketPreviousClose
        );

        const previousClose = pickNumber(
          result.regularMarketPreviousClose,
          result.previousClose
        );

        const change = pickNumber(
          result.regularMarketChange,
          result.change
        );

        let changePercent = pickNumber(
          result.regularMarketChangePercent,
          result.changePercent
        );

        if ((changePercent === undefined || changePercent === null) && typeof change === 'number') {
          const base = pickNumber(previousClose, typeof price === 'number' ? price - change : undefined);

          if (typeof base === 'number' && base !== 0) {
            changePercent = (change / base) * 100;
          }
        }

        const priceSource: DadosBDR['priceSource'] = typeof result.regularMarketPrice === 'number'
          ? 'regular'
          : typeof result.regularMarketPreviousClose === 'number' || typeof result.previousClose === 'number'
          ? 'previousClose'
          : price !== undefined
          ? 'calculado'
          : 'desconhecido';

        setBDRData({
          symbol: result.symbol,
          price: typeof price === 'number' ? price : 0,
          change: typeof change === 'number' ? change : 0,
          changePercent: typeof changePercent === 'number' ? changePercent : 0,
          previousClose: previousClose,
          currency: result.currency || 'BRL',
          fonte: 'brapi',
          updatedAt: result.updatedAt || new Date().toISOString(),
          priceSource,
          volume: typeof result.regularMarketVolume === 'number'
            ? result.regularMarketVolume
            : undefined,
          shortName: result.shortName,
          longName: result.longName
        });
        console.log(`✅ BDR ${bdrTicker}: R$ ${result.regularMarketPrice}`);
      } else {
        throw new Error('Dados do BDR não encontrados na resposta da API');
      }
    } catch (err: any) {
      console.error(`❌ Erro BDR ${bdrTicker}:`, err);
      setBDRError(err.message);
      setBDRData(null);
    } finally {
      setBDRLoading(false);
    }
  }, [bdrTicker]);

  useEffect(() => {
    fetchBDRData();
  }, [fetchBDRData]);

  return { 
    bdrData, 
    bdrLoading, 
    bdrError, 
    refetch: fetchBDRData 
  };
}
