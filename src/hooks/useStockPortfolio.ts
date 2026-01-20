// src/hooks/useStockPortfolio.ts - NOVO HOOK PARA AÇÕES REAIS
'use client';

import { useState, useEffect } from 'react';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { StockQuote } from '@/types/financial';

interface PortfolioStock {
  id: string;
  avatar: string;
  ticker: string;
  setor: string;
  dataEntrada: string;
  precoEntrada: string;
  precoAtual: string;
  dy: string;
  precoTeto: string;
  vies: string;
  performance?: number;
  quotacoesReais?: StockQuote;
}

interface UseStockPortfolioReturn {
  portfolio: PortfolioStock[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStockPortfolio(): UseStockPortfolioReturn {
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isVisible = usePageVisibility();

  // SUAS AÇÕES DA CARTEIRA COM DADOS DE ENTRADA
  const portfolioBase: Omit<PortfolioStock, 'precoAtual' | 'performance'>[] = [
    {
      id: '1',
      avatar: 'https://www.ivalor.com.br/media/emp/logos/ALOS.png',
      ticker: 'ALOS3',
      setor: 'Shoppings',
      dataEntrada: '15/01/2021',
      precoEntrada: 'R$ 26,68',
      dy: '5,95%',
      precoTeto: 'R$ 23,76',
      vies: 'Compra',
    },
    {
      id: '2',
      avatar: 'https://www.ivalor.com.br/media/emp/logos/TUPY.png',
      ticker: 'TUPY3',
      setor: 'Industrial',
      dataEntrada: '04/11/2020',
      precoEntrada: 'R$ 20,36',
      dy: '1,71%',
      precoTeto: 'R$ 31,50',
      vies: 'Compra',
    },
    {
      id: '3',
      avatar: 'https://www.ivalor.com.br/media/emp/logos/RECV.png',
      ticker: 'RECV3',
      setor: 'Petróleo',
      dataEntrada: '23/07/2023',
      precoEntrada: 'R$ 22,29',
      dy: '11,07%',
      precoTeto: 'R$ 31,37',
      vies: 'Compra',
    },
    {
      id: '4',
      avatar: 'https://www.ivalor.com.br/media/emp/logos/CSED.png',
      ticker: 'CSED3',
      setor: 'Educação',
      dataEntrada: '10/12/2023',
      precoEntrada: 'R$ 4,49',
      dy: '4,96%',
      precoTeto: 'R$ 8,35',
      vies: 'Compra',
    },
    {
      id: '5',
      avatar: 'https://www.ivalor.com.br/media/emp/logos/PRIO.png',
      ticker: 'PRIO3',
      setor: 'Petróleo',
      dataEntrada: '04/08/2022',
      precoEntrada: 'R$ 23,35',
      dy: '0,18%',
      precoTeto: 'R$ 48,70',
      vies: 'Compra',
    },
    {
      id: '6',
      avatar: 'https://www.ivalor.com.br/media/emp/logos/RAPT.png',
      ticker: 'RAPT4',
      setor: 'Industrial',
      dataEntrada: '16/09/2021',
      precoEntrada: 'R$ 16,69',
      dy: '4,80%',
      precoTeto: 'R$ 14,00',
      vies: 'Compra',
    },
    {
      id: '7',
      avatar: 'https://www.ivalor.com.br/media/emp/logos/SMTO.png',
      ticker: 'SMTO3',
      setor: 'Sucroenergetico',
      dataEntrada: '10/11/2022',
      precoEntrada: 'R$ 28,20',
      dy: '3,51%',
      precoTeto: 'R$ 35,00',
      vies: 'Compra',
    },
    {
      id: '8',
      avatar: 'https://www.ivalor.com.br/media/emp/logos/FESA.png',
      ticker: 'FESA4',
      setor: 'Commodities',
      dataEntrada: '11/12/2020',
      precoEntrada: 'R$ 4,49',
      dy: '5,68%',
      precoTeto: 'R$ 14,07',
      vies: 'Compra',
    }
  ];

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      // EXTRAIR TICKERS DAS AÇÕES
      const tickers = portfolioBase.map(stock => stock.ticker);
      console.log('🔍 Buscando cotações para:', tickers);

      // BUSCAR COTAÇÕES REAIS DA API
      const response = await fetch(`/api/financial/quotes?symbols=${tickers.join(',')}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar cotações das ações');
      }

      const { quotes } = await response.json();
      console.log('✅ Cotações recebidas:', quotes.length, 'ações');

      // COMBINAR DADOS BASE COM COTAÇÕES REAIS
      const portfolioAtualizado: PortfolioStock[] = portfolioBase.map(stock => {
        const cotacao = quotes.find((q: StockQuote) => q.symbol === stock.ticker);
        
        // CALCULAR PERFORMANCE SE TIVER COTAÇÃO
        let performance = 0;
        let precoAtual = 'N/A';
        
        if (cotacao) {
          const precoEntradaNum = parseFloat(stock.precoEntrada.replace('R$ ', '').replace(',', '.'));
          performance = ((cotacao.regularMarketPrice - precoEntradaNum) / precoEntradaNum) * 100;
          precoAtual = `R$ ${cotacao.regularMarketPrice.toFixed(2).replace('.', ',')}`;
          
          console.log(`📊 ${stock.ticker}: ${precoAtual} (${performance.toFixed(1)}%)`);
        } else {
          console.log(`⚠️ ${stock.ticker}: cotação não encontrada`);
          precoAtual = 'N/A';
        }

        return {
          ...stock,
          precoAtual,
          performance,
          quotacoesReais: cotacao,
        };
      });

      setPortfolio(portfolioAtualizado);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro ao buscar portfólio:', err);
      
      // FALLBACK: usar dados sem cotações reais
      const portfolioSemCotacoes = portfolioBase.map(stock => ({
        ...stock,
        precoAtual: 'N/A',
        performance: 0,
      }));
      setPortfolio(portfolioSemCotacoes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    fetchPortfolioData();

    // ATUALIZAR A CADA 10 MINUTOS
    const interval = setInterval(fetchPortfolioData, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  return {
    portfolio,
    loading,
    error,
    refetch: fetchPortfolioData,
  };
}

// EXEMPLO DE USO NO COMPONENTE:
// const { portfolio, loading, error } = useStockPortfolio();

// RESULTADO:
// portfolio[0] = {
//   ticker: 'ALOS3',
//   precoAtual: 'R$ 21,67', // ← PREÇO REAL DA API
//   performance: -18.7,     // ← CALCULADO AUTOMATICAMENTE
//   quotacoesReais: {       // ← DADOS COMPLETOS DA BRAPI
//     regularMarketPrice: 21.67,
//     regularMarketChangePercent: -2.1,
//     dividendYield: 5.95,  // ← SE DISPONÍVEL
//   }
// }
