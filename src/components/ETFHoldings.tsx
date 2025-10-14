'use client';

import React, { useState, useEffect } from 'react';
import { BDR_ESTRANGEIRO_MAPPING } from '@/hooks/useAtivoDetalhes';

// 🔥 HOOK RESPONSIVO INTERNO
const useResponsive = () => {
  const [screenSize, setScreenSize] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width <= 480) return 'mobile';
    if (width <= 768) return 'tablet';
    if (width <= 1024) return 'laptop';
    return 'desktop';
  });

  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  }));

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDimensions({ width, height });
      
      if (width <= 480) setScreenSize('mobile');
      else if (width <= 768) setScreenSize('tablet');
      else if (width <= 1024) setScreenSize('laptop');
      else setScreenSize('desktop');
    };

    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    screenSize,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isLaptop: screenSize === 'laptop',
    isDesktop: screenSize === 'desktop',
    isMobileOrTablet: screenSize === 'mobile' || screenSize === 'tablet',
    width: dimensions.width,
    height: dimensions.height
  };
};

const EQUITY_OVERRIDE_TICKERS = new Set(
  [
    ...Object.keys(BDR_ESTRANGEIRO_MAPPING),
    ...Object.values(BDR_ESTRANGEIRO_MAPPING)
  ].map(ticker => ticker.toUpperCase())
);

const ETF_TICKER_ALIASES: Record<string, string> = {
  GOLD11: 'IAU',
  BTLT39: 'TLT'
};

const resolveETFTicker = (ticker: string): string => {
  if (!ticker) return '';

  const normalizedTicker = ticker.trim().toUpperCase();
  return ETF_TICKER_ALIASES[normalizedTicker] || normalizedTicker;
};

// 🏢 FUNÇÃO PARA DETECTAR ETFs AUTOMATICAMENTE
const detectETF = (ticker: string): boolean => {
  if (!ticker) return false;

  const normalizedTicker = resolveETFTicker(ticker);

  if (EQUITY_OVERRIDE_TICKERS.has(normalizedTicker)) {
    return false;
  }

  // Lista de ETFs conhecidos
  const etfsConhecidos = [
    'QQQ', 'SPY', 'VTI', 'VEA', 'VWO', 'QUAL', 'SOXX', 'XLF', 'XLK', 'XLV', 'XLE',
    'HERO', 'MCHI', 'TFLO', 'TLT', 'IEF', 'SHY', 'NOBL', 'VNQ', 'SCHP', 'VTEB',
    'VOO', 'IVV', 'VXUS', 'BND', 'AGG', 'LQD', 'HYG', 'EMB', 'VB', 'VTV', 'VUG',
    'IWM', 'IWN', 'IWO', 'IJH', 'IJR', 'IJK', 'IJJ', 'IJS', 'IWV', 'ITOT',
    'XLC', 'XLI', 'XLB', 'XLRE', 'XLP', 'XLY', 'XLU', 'GLD', 'SLV', 'IAU',
    'PDBC', 'DBA', 'USO', 'UNG', 'ARKK', 'ARKQ', 'ARKW', 'ARKG', 'ARKF',
    'JEPQ', 'SCHD'
  ];

  // Verificar se está na lista de ETFs conhecidos
  if (etfsConhecidos.includes(normalizedTicker)) {
    return true;
  }

  // Verificar padrões comuns de ETFs
  const etfPatterns = [
    /ETF$/i,           // Termina com ETF
    /^XL[A-Z]$/,       // SPDR Sector (XLF, XLK, etc)
    /^ARK[A-Z]$/       // ARK ETFs (ARKK, ARKQ, etc)
  ];

  return etfPatterns.some(pattern => pattern.test(normalizedTicker));
};

// 🚀 HOOK PARA BUSCAR DADOS REAIS DE ETFs VIA API
const useETFData = (ticker: string, isETFHint?: boolean) => {
  const [etfData, setETFData] = useState<ETFData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchETFData = React.useCallback(async () => {
    const ehETF = typeof isETFHint === 'boolean' ? isETFHint : detectETF(ticker);
    if (!ticker || !ehETF) return;

    const resolvedTicker = resolveETFTicker(ticker);

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Buscando dados reais do ETF ${ticker}...`);

      try {
        const apiResponse = await fetch(`/api/market/etf/holdings?ticker=${resolvedTicker}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });

        if (apiResponse.ok) {
          const payload = await apiResponse.json();
          if (
            payload?.data?.topHoldings &&
            Array.isArray(payload.data.topHoldings) &&
            payload.data.topHoldings.length > 0
          ) {
            setETFData(payload.data);
            console.log(
              `✅ Holdings carregados via rota interna (${payload.source || 'desconhecida'})`
            );
            return;
          }

          if (payload?.message) {
            console.log(`ℹ️ Rota interna respondeu sem holdings: ${payload.message}`);
            setError(payload.message);
          }
        } else {
          const errorPayload = await apiResponse.json().catch(() => null);
          console.log(`⚠️ Rota interna falhou (${apiResponse.status}):`, errorPayload);
          setError(
            errorPayload?.message || `Falha ao buscar holdings (${apiResponse.status})`
          );
        }
      } catch (internalError) {
        console.log(`⚠️ Erro ao chamar rota interna para ${ticker}:`, internalError);
      }

      // Fallback para dados mock (temporário)
      console.log(`📋 Usando dados mock como fallback para ${ticker}`);
      const mockData = getETFHoldingsMock(ticker);
      if (mockData) {
        setETFData(mockData);
        setError(null);
        console.log(`✅ Dados mock carregados para ${ticker}`);
      } else {
        // Se não tem mock, criar dados básicos
        setETFData({
          name: `${ticker} ETF`,
          description: `Exchange Traded Fund ${ticker} - dados em tempo real indisponíveis`,
          totalHoldings: 0,
          topHoldings: [],
          sectorBreakdown: []
        });
        console.log(`ℹ️ Dados básicos criados para ${ticker}`);
      }

    } catch (error) {
      console.error(`❌ Erro ao buscar dados do ETF ${ticker}:`, error);
      setError(`Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }, [ticker, isETFHint]);

  React.useEffect(() => {
    fetchETFData();
  }, [fetchETFData]);

  return { etfData, loading, error, refetch: fetchETFData };
};

const getETFHoldingsMock = (ticker: string) => {
  const etfData: Record<string, ETFData> = {
    'QUAL': {
      name: 'iShares MSCI USA Quality Factor ETF',
      description: 'Tracks investment results of an index composed of U.S. large- and mid-cap stocks with quality characteristics.',
      totalHoldings: 125,
      topHoldings: [
        { symbol: 'AAPL', name: 'Apple Inc.', weight: 8.12, sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', weight: 7.89, sector: 'Technology' },
        { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', weight: 4.21, sector: 'Communication Services' },
        { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', weight: 3.84, sector: 'Financial Services' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', weight: 3.52, sector: 'Technology' },
        { symbol: 'JNJ', name: 'Johnson & Johnson', weight: 3.14, sector: 'Healthcare' },
        { symbol: 'V', name: 'Visa Inc. Class A', weight: 2.98, sector: 'Financial Services' },
        { symbol: 'HD', name: 'The Home Depot Inc.', weight: 2.76, sector: 'Consumer Discretionary' },
        { symbol: 'PG', name: 'The Procter & Gamble Company', weight: 2.43, sector: 'Consumer Staples' },
        { symbol: 'MA', name: 'Mastercard Incorporated Class A', weight: 2.31, sector: 'Financial Services' }
      ],
      sectorBreakdown: [
        { sector: 'Technology', weight: 28.5 },
        { sector: 'Healthcare', weight: 15.2 },
        { sector: 'Consumer Discretionary', weight: 12.8 },
        { sector: 'Financial Services', weight: 11.3 },
        { sector: 'Communication Services', weight: 8.7 },
        { sector: 'Consumer Staples', weight: 7.4 },
        { sector: 'Industrials', weight: 6.9 },
        { sector: 'Real Estate', weight: 4.2 },
        { sector: 'Materials', weight: 2.8 },
        { sector: 'Energy', weight: 2.2 }
      ]
    },
    'QQQ': {
      name: 'Invesco QQQ Trust',
      description: 'Tracks the Nasdaq-100 Index, which includes 100 of the largest domestic and international non-financial companies.',
      totalHoldings: 100,
      topHoldings: [
        { symbol: 'AAPL', name: 'Apple Inc.', weight: 12.1, sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', weight: 11.8, sector: 'Technology' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', weight: 7.2, sector: 'Technology' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 5.8, sector: 'Consumer Discretionary' },
        { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', weight: 4.3, sector: 'Communication Services' },
        { symbol: 'GOOG', name: 'Alphabet Inc. Class C', weight: 4.1, sector: 'Communication Services' },
        { symbol: 'META', name: 'Meta Platforms Inc.', weight: 4.0, sector: 'Communication Services' },
        { symbol: 'TSLA', name: 'Tesla Inc.', weight: 3.9, sector: 'Consumer Discretionary' },
        { symbol: 'AVGO', name: 'Broadcom Inc.', weight: 2.8, sector: 'Technology' },
        { symbol: 'COST', name: 'Costco Wholesale Corporation', weight: 2.1, sector: 'Consumer Staples' }
      ],
      sectorBreakdown: [
        { sector: 'Technology', weight: 48.2 },
        { sector: 'Communication Services', weight: 17.8 },
        { sector: 'Consumer Discretionary', weight: 15.4 },
        { sector: 'Consumer Staples', weight: 6.1 },
        { sector: 'Healthcare', weight: 5.8 },
        { sector: 'Industrials', weight: 4.2 },
        { sector: 'Utilities', weight: 1.8 },
        { sector: 'Materials', weight: 0.7 }
      ]
    },
    'SPY': {
      name: 'SPDR S&P 500 ETF Trust',
      description: 'Seeks to provide investment results that correspond to the price and yield performance of the S&P 500 Index.',
      totalHoldings: 503,
      topHoldings: [
        { symbol: 'AAPL', name: 'Apple Inc.', weight: 7.1, sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', weight: 6.8, sector: 'Technology' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', weight: 4.2, sector: 'Technology' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 3.4, sector: 'Consumer Discretionary' },
        { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', weight: 2.1, sector: 'Communication Services' },
        { symbol: 'GOOG', name: 'Alphabet Inc. Class C', weight: 2.0, sector: 'Communication Services' },
        { symbol: 'META', name: 'Meta Platforms Inc.', weight: 2.2, sector: 'Communication Services' },
        { symbol: 'TSLA', name: 'Tesla Inc.', weight: 2.1, sector: 'Consumer Discretionary' },
        { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', weight: 1.8, sector: 'Financial Services' },
        { symbol: 'LLY', name: 'Eli Lilly and Company', weight: 1.6, sector: 'Healthcare' }
      ],
      sectorBreakdown: [
        { sector: 'Technology', weight: 27.8 },
        { sector: 'Financial Services', weight: 13.1 },
        { sector: 'Healthcare', weight: 12.9 },
        { sector: 'Consumer Discretionary', weight: 10.4 },
        { sector: 'Communication Services', weight: 8.7 },
        { sector: 'Industrials', weight: 8.2 },
        { sector: 'Consumer Staples', weight: 6.1 },
        { sector: 'Energy', weight: 4.2 },
        { sector: 'Utilities', weight: 2.8 },
        { sector: 'Real Estate', weight: 2.5 },
        { sector: 'Materials', weight: 2.4 }
      ]
    },
    'VOO': {
      name: 'Vanguard S&P 500 ETF',
      description: 'Seeks to track the performance of the S&P 500 Index.',
      totalHoldings: 500,
      topHoldings: [
        { symbol: 'AAPL', name: 'Apple Inc.', weight: 7.3, sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', weight: 6.7, sector: 'Technology' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', weight: 4.5, sector: 'Technology' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 3.4, sector: 'Consumer Discretionary' },
        { symbol: 'META', name: 'Meta Platforms Inc.', weight: 2.2, sector: 'Communication Services' },
        { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', weight: 1.9, sector: 'Communication Services' },
        { symbol: 'GOOG', name: 'Alphabet Inc. Class C', weight: 1.8, sector: 'Communication Services' },
        { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', weight: 1.8, sector: 'Financial Services' },
        { symbol: 'LLY', name: 'Eli Lilly and Company', weight: 1.6, sector: 'Healthcare' },
        { symbol: 'TSLA', name: 'Tesla Inc.', weight: 1.5, sector: 'Consumer Discretionary' }
      ],
      sectorBreakdown: [
        { sector: 'Technology', weight: 29.0 },
        { sector: 'Financial Services', weight: 12.9 },
        { sector: 'Healthcare', weight: 13.0 },
        { sector: 'Consumer Discretionary', weight: 10.2 },
        { sector: 'Communication Services', weight: 8.8 },
        { sector: 'Industrials', weight: 8.0 },
        { sector: 'Consumer Staples', weight: 6.0 },
        { sector: 'Energy', weight: 4.1 },
        { sector: 'Utilities', weight: 2.7 },
        { sector: 'Real Estate', weight: 2.4 },
        { sector: 'Materials', weight: 2.3 }
      ]
    },
    'VTI': {
      name: 'Vanguard Total Stock Market ETF',
      description: 'Seeks to track the performance of the CRSP US Total Market Index, which covers the entire U.S. stock market.',
      totalHoldings: 4157,
      topHoldings: [
        { symbol: 'AAPL', name: 'Apple Inc.', weight: 7.1, sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', weight: 6.7, sector: 'Technology' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', weight: 4.1, sector: 'Technology' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 3.3, sector: 'Consumer Discretionary' },
        { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', weight: 2.0, sector: 'Communication Services' },
        { symbol: 'META', name: 'Meta Platforms Inc.', weight: 2.2, sector: 'Communication Services' },
        { symbol: 'GOOG', name: 'Alphabet Inc. Class C', weight: 1.9, sector: 'Communication Services' },
        { symbol: 'TSLA', name: 'Tesla Inc.', weight: 2.0, sector: 'Consumer Discretionary' },
        { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', weight: 1.7, sector: 'Financial Services' },
        { symbol: 'LLY', name: 'Eli Lilly and Company', weight: 1.5, sector: 'Healthcare' }
      ],
      sectorBreakdown: [
        { sector: 'Technology', weight: 26.8 },
        { sector: 'Financial Services', weight: 14.2 },
        { sector: 'Healthcare', weight: 13.1 },
        { sector: 'Consumer Discretionary', weight: 10.8 },
        { sector: 'Communication Services', weight: 8.9 },
        { sector: 'Industrials', weight: 8.1 },
        { sector: 'Consumer Staples', weight: 5.9 },
        { sector: 'Energy', weight: 4.1 },
        { sector: 'Real Estate', weight: 3.8 },
        { sector: 'Materials', weight: 2.7 },
        { sector: 'Utilities', weight: 2.6 }
      ]
    },
    'IJS': {
      name: 'iShares S&P Small-Cap 600 Value ETF',
      description: 'Provides exposure to small-cap U.S. stocks with value characteristics from the S&P SmallCap 600 Value Index.',
      totalHoldings: 480,
      topHoldings: [
        { symbol: 'BJ', name: "BJ's Wholesale Club Holdings, Inc.", weight: 0.78, sector: 'Consumer Staples' },
        { symbol: 'CMC', name: 'Commercial Metals Company', weight: 0.72, sector: 'Materials' },
        { symbol: 'EME', name: 'EMCOR Group, Inc.', weight: 0.69, sector: 'Industrials' },
        { symbol: 'MLI', name: 'Mueller Industries, Inc.', weight: 0.65, sector: 'Industrials' },
        { symbol: 'GPI', name: 'Group 1 Automotive, Inc.', weight: 0.62, sector: 'Consumer Discretionary' },
        { symbol: 'SAIA', name: 'Saia, Inc.', weight: 0.61, sector: 'Industrials' },
        { symbol: 'DDS', name: "Dillard's, Inc. Class A", weight: 0.59, sector: 'Consumer Discretionary' },
        { symbol: 'SIGI', name: 'Selective Insurance Group, Inc.', weight: 0.57, sector: 'Financial Services' },
        { symbol: 'JEF', name: 'Jefferies Financial Group Inc.', weight: 0.55, sector: 'Financial Services' },
        { symbol: 'MTZ', name: 'MasTec, Inc.', weight: 0.54, sector: 'Industrials' }
      ],
      sectorBreakdown: [
        { sector: 'Industrials', weight: 23.5 },
        { sector: 'Consumer Discretionary', weight: 15.8 },
        { sector: 'Financial Services', weight: 15.2 },
        { sector: 'Energy', weight: 8.6 },
        { sector: 'Materials', weight: 8.4 },
        { sector: 'Healthcare', weight: 7.9 },
        { sector: 'Consumer Staples', weight: 6.8 },
        { sector: 'Real Estate', weight: 4.5 },
        { sector: 'Information Technology', weight: 3.7 },
        { sector: 'Utilities', weight: 2.8 },
        { sector: 'Communication Services', weight: 2.8 }
      ]
    },
    'VNQ': {
      name: 'Vanguard Real Estate ETF',
      description: 'Tracks the performance of the MSCI US Investable Market Real Estate 25/50 Index covering U.S. REITs.',
      totalHoldings: 165,
      topHoldings: [
        { symbol: 'PLD', name: 'Prologis, Inc.', weight: 8.3, sector: 'Industrial REIT' },
        { symbol: 'AMT', name: 'American Tower Corporation', weight: 7.1, sector: 'Specialized REIT' },
        { symbol: 'EQIX', name: 'Equinix, Inc.', weight: 5.6, sector: 'Data Center REIT' },
        { symbol: 'WELL', name: 'Welltower Inc.', weight: 4.3, sector: 'Healthcare REIT' },
        { symbol: 'O', name: 'Realty Income Corporation', weight: 4.0, sector: 'Retail REIT' },
        { symbol: 'PSA', name: 'Public Storage', weight: 3.8, sector: 'Self-Storage REIT' },
        { symbol: 'SPG', name: 'Simon Property Group, Inc.', weight: 3.6, sector: 'Retail REIT' },
        { symbol: 'DLR', name: 'Digital Realty Trust, Inc.', weight: 3.0, sector: 'Data Center REIT' },
        { symbol: 'VICI', name: 'VICI Properties Inc.', weight: 2.9, sector: 'Specialized REIT' },
        { symbol: 'EXR', name: 'Extra Space Storage Inc.', weight: 2.5, sector: 'Self-Storage REIT' }
      ],
      sectorBreakdown: [
        { sector: 'Industrial REITs', weight: 18.5 },
        { sector: 'Specialized REITs', weight: 17.2 },
        { sector: 'Data Center REITs', weight: 12.6 },
        { sector: 'Healthcare REITs', weight: 10.4 },
        { sector: 'Retail REITs', weight: 14.9 },
        { sector: 'Residential REITs', weight: 9.3 },
        { sector: 'Diversified REITs', weight: 6.1 },
        { sector: 'Office REITs', weight: 5.1 },
        { sector: 'Lodging & Resorts', weight: 3.2 },
        { sector: 'Self-Storage REITs', weight: 2.7 }
      ]
    },
    'SCHP': {
      name: 'Schwab U.S. TIPS ETF',
      description: 'Provides exposure to U.S. Treasury Inflation-Protected Securities (TIPS) across the maturity spectrum.',
      totalHoldings: 45,
      topHoldings: [
        { symbol: 'TII 0.125% 01/2033', name: 'U.S. Treasury Inflation-Indexed Bond 0.125% 01/15/2033', weight: 4.2, sector: 'U.S. Treasury' },
        { symbol: 'TII 0.125% 07/2032', name: 'U.S. Treasury Inflation-Indexed Bond 0.125% 07/15/2032', weight: 4.0, sector: 'U.S. Treasury' },
        { symbol: 'TII 0.125% 01/2030', name: 'U.S. Treasury Inflation-Indexed Bond 0.125% 01/15/2030', weight: 3.8, sector: 'U.S. Treasury' },
        { symbol: 'TII 0.375% 07/2027', name: 'U.S. Treasury Inflation-Indexed Bond 0.375% 07/15/2027', weight: 3.7, sector: 'U.S. Treasury' },
        { symbol: 'TII 0.125% 07/2031', name: 'U.S. Treasury Inflation-Indexed Bond 0.125% 07/15/2031', weight: 3.5, sector: 'U.S. Treasury' },
        { symbol: 'TII 0.125% 01/2029', name: 'U.S. Treasury Inflation-Indexed Bond 0.125% 01/15/2029', weight: 3.4, sector: 'U.S. Treasury' },
        { symbol: 'TII 0.125% 07/2029', name: 'U.S. Treasury Inflation-Indexed Bond 0.125% 07/15/2029', weight: 3.3, sector: 'U.S. Treasury' },
        { symbol: 'TII 0.125% 01/2034', name: 'U.S. Treasury Inflation-Indexed Bond 0.125% 01/15/2034', weight: 3.2, sector: 'U.S. Treasury' },
        { symbol: 'TII 0.125% 07/2034', name: 'U.S. Treasury Inflation-Indexed Bond 0.125% 07/15/2034', weight: 3.1, sector: 'U.S. Treasury' },
        { symbol: 'TII 0.625% 01/2026', name: 'U.S. Treasury Inflation-Indexed Bond 0.625% 01/15/2026', weight: 3.0, sector: 'U.S. Treasury' }
      ],
      sectorBreakdown: [
        { sector: 'U.S. Treasury Inflation-Protected Securities', weight: 96.0 },
        { sector: 'Cash & Equivalents', weight: 4.0 }
      ]
    },
    'IAU': {
      name: 'iShares Gold Trust',
      description: 'Seeks to reflect generally the performance of the price of gold by holding gold bullion.',
      totalHoldings: 1,
      topHoldings: [
        { symbol: 'XAU', name: 'Allocated Gold Bullion (London Good Delivery)', weight: 100.0, sector: 'Precious Metals' }
      ],
      sectorBreakdown: [
        { sector: 'Gold Bullion', weight: 100.0 }
      ]
    },
    'HERO': {
      name: 'Global X Video Games & Esports ETF',
      description: 'Targets companies involved in the development and publishing of video games, esports, and related hardware.',
      totalHoldings: 51,
      topHoldings: [
        { symbol: 'NVDA', name: 'NVIDIA Corporation', weight: 6.5, sector: 'Technology' },
        { symbol: 'TCEHY', name: 'Tencent Holdings Ltd.', weight: 6.1, sector: 'Communication Services' },
        { symbol: 'ATVI', name: 'Activision Blizzard, Inc.', weight: 5.0, sector: 'Communication Services' },
        { symbol: 'EA', name: 'Electronic Arts Inc.', weight: 4.4, sector: 'Communication Services' },
        { symbol: 'NTDOY', name: 'Nintendo Co., Ltd.', weight: 4.2, sector: 'Consumer Discretionary' },
        { symbol: 'SE', name: 'Sea Limited ADR', weight: 4.0, sector: 'Communication Services' },
        { symbol: 'SONY', name: 'Sony Group Corporation', weight: 3.8, sector: 'Communication Services' },
        { symbol: 'UBI.PA', name: 'Ubisoft Entertainment SA', weight: 3.5, sector: 'Communication Services' },
        { symbol: 'RBLX', name: 'Roblox Corporation Class A', weight: 3.4, sector: 'Communication Services' },
        { symbol: 'TTWO', name: 'Take-Two Interactive Software, Inc.', weight: 3.2, sector: 'Communication Services' }
      ],
      sectorBreakdown: [
        { sector: 'Communication Services', weight: 56.0 },
        { sector: 'Technology', weight: 32.0 },
        { sector: 'Consumer Discretionary', weight: 12.0 }
      ]
    },
    'SOXX': {
      name: 'iShares Semiconductor ETF',
      description: 'Tracks the performance of U.S.-listed semiconductor companies as represented by the ICE Semiconductor Index.',
      totalHoldings: 30,
      topHoldings: [
        { symbol: 'NVDA', name: 'NVIDIA Corporation', weight: 9.7, sector: 'Semiconductors' },
        { symbol: 'AVGO', name: 'Broadcom Inc.', weight: 8.2, sector: 'Semiconductors' },
        { symbol: 'ASML', name: 'ASML Holding N.V.', weight: 6.6, sector: 'Semiconductor Equipment' },
        { symbol: 'TSM', name: 'Taiwan Semiconductor Manufacturing Co. Ltd.', weight: 6.3, sector: 'Semiconductors' },
        { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', weight: 5.5, sector: 'Semiconductors' },
        { symbol: 'QCOM', name: 'QUALCOMM Incorporated', weight: 4.9, sector: 'Semiconductors' },
        { symbol: 'ADI', name: 'Analog Devices, Inc.', weight: 4.6, sector: 'Semiconductors' },
        { symbol: 'INTC', name: 'Intel Corporation', weight: 4.4, sector: 'Semiconductors' },
        { symbol: 'TXN', name: 'Texas Instruments Incorporated', weight: 4.1, sector: 'Semiconductors' },
        { symbol: 'LRCX', name: 'Lam Research Corporation', weight: 3.8, sector: 'Semiconductor Equipment' }
      ],
      sectorBreakdown: [
        { sector: 'Semiconductors', weight: 70.0 },
        { sector: 'Semiconductor Equipment', weight: 30.0 }
      ]
    },
    'MCHI': {
      name: 'iShares MSCI China ETF',
      description: 'Seeks to track the investment results of a broad-based index composed of Chinese equities.',
      totalHoldings: 635,
      topHoldings: [
        { symbol: 'TCEHY', name: 'Tencent Holdings Ltd.', weight: 13.5, sector: 'Communication Services' },
        { symbol: 'BABA', name: 'Alibaba Group Holding Ltd.', weight: 8.8, sector: 'Consumer Discretionary' },
        { symbol: '3690.HK', name: 'Meituan Class B', weight: 5.4, sector: 'Consumer Discretionary' },
        { symbol: 'PDD', name: 'PDD Holdings Inc.', weight: 4.7, sector: 'Consumer Discretionary' },
        { symbol: 'JD', name: 'JD.com Inc. Class A', weight: 3.1, sector: 'Consumer Discretionary' },
        { symbol: 'BYDDY', name: 'BYD Company Ltd. ADR', weight: 2.8, sector: 'Consumer Discretionary' },
        { symbol: 'CICHY', name: 'China Construction Bank Corp. ADR', weight: 2.5, sector: 'Financial Services' },
        { symbol: 'LI', name: 'Li Auto Inc. ADR', weight: 2.1, sector: 'Consumer Discretionary' },
        { symbol: '2318.HK', name: 'Ping An Insurance Group Co. of China Ltd. Class H', weight: 1.9, sector: 'Financial Services' },
        { symbol: 'NTES', name: 'NetEase Inc.', weight: 1.9, sector: 'Communication Services' }
      ],
      sectorBreakdown: [
        { sector: 'Consumer Discretionary', weight: 34.0 },
        { sector: 'Communication Services', weight: 25.0 },
        { sector: 'Financial Services', weight: 18.0 },
        { sector: 'Industrials', weight: 9.0 },
        { sector: 'Information Technology', weight: 7.0 },
        { sector: 'Healthcare', weight: 4.0 },
        { sector: 'Materials', weight: 2.0 },
        { sector: 'Real Estate', weight: 1.0 }
      ]
    },
    'TFLO': {
      name: 'iShares Treasury Floating Rate Bond ETF',
      description: 'Provides access to U.S. Treasury floating rate notes with remaining maturities between one month and two years.',
      totalHoldings: 95,
      topHoldings: [
        { symbol: 'FRN 07/2026', name: 'U.S. Treasury Floating Rate Note 07/31/2026', weight: 2.2, sector: 'U.S. Treasury' },
        { symbol: 'FRN 04/2026', name: 'U.S. Treasury Floating Rate Note 04/30/2026', weight: 2.2, sector: 'U.S. Treasury' },
        { symbol: 'FRN 01/2026', name: 'U.S. Treasury Floating Rate Note 01/31/2026', weight: 2.1, sector: 'U.S. Treasury' },
        { symbol: 'FRN 10/2025', name: 'U.S. Treasury Floating Rate Note 10/31/2025', weight: 2.1, sector: 'U.S. Treasury' },
        { symbol: 'FRN 07/2025', name: 'U.S. Treasury Floating Rate Note 07/31/2025', weight: 2.1, sector: 'U.S. Treasury' },
        { symbol: 'FRN 04/2025', name: 'U.S. Treasury Floating Rate Note 04/30/2025', weight: 2.0, sector: 'U.S. Treasury' },
        { symbol: 'FRN 01/2025', name: 'U.S. Treasury Floating Rate Note 01/31/2025', weight: 2.0, sector: 'U.S. Treasury' },
        { symbol: 'FRN 10/2024', name: 'U.S. Treasury Floating Rate Note 10/31/2024', weight: 2.0, sector: 'U.S. Treasury' },
        { symbol: 'FRN 07/2024', name: 'U.S. Treasury Floating Rate Note 07/31/2024', weight: 1.9, sector: 'U.S. Treasury' },
        { symbol: 'FRN 04/2024', name: 'U.S. Treasury Floating Rate Note 04/30/2024', weight: 1.9, sector: 'U.S. Treasury' }
      ],
      sectorBreakdown: [
        { sector: 'U.S. Treasury Floating Rate Notes', weight: 97.0 },
        { sector: 'Cash & Equivalents', weight: 3.0 }
      ]
    },
    'NOBL': {
      name: 'ProShares S&P 500 Dividend Aristocrats ETF',
      description: 'Tracks the S&P 500 Dividend Aristocrats Index of companies with at least 25 consecutive years of dividend growth.',
      totalHoldings: 67,
      topHoldings: [
        { symbol: 'MMM', name: '3M Company', weight: 1.9, sector: 'Industrials' },
        { symbol: 'PEP', name: 'PepsiCo, Inc.', weight: 1.8, sector: 'Consumer Staples' },
        { symbol: 'KO', name: 'The Coca-Cola Company', weight: 1.7, sector: 'Consumer Staples' },
        { symbol: 'EMR', name: 'Emerson Electric Co.', weight: 1.6, sector: 'Industrials' },
        { symbol: 'WMT', name: 'Walmart Inc.', weight: 1.6, sector: 'Consumer Staples' },
        { symbol: 'MCD', name: 'McDonald\'s Corporation', weight: 1.5, sector: 'Consumer Discretionary' },
        { symbol: 'PG', name: 'The Procter & Gamble Company', weight: 1.5, sector: 'Consumer Staples' },
        { symbol: 'CL', name: 'Colgate-Palmolive Company', weight: 1.4, sector: 'Consumer Staples' },
        { symbol: 'ABT', name: 'Abbott Laboratories', weight: 1.4, sector: 'Healthcare' },
        { symbol: 'LOW', name: 'Lowe\'s Companies, Inc.', weight: 1.3, sector: 'Consumer Discretionary' }
      ],
      sectorBreakdown: [
        { sector: 'Consumer Staples', weight: 26.0 },
        { sector: 'Industrials', weight: 22.0 },
        { sector: 'Healthcare', weight: 14.0 },
        { sector: 'Consumer Discretionary', weight: 11.0 },
        { sector: 'Materials', weight: 8.0 },
        { sector: 'Financial Services', weight: 7.0 },
        { sector: 'Energy', weight: 5.0 },
        { sector: 'Utilities', weight: 4.0 },
        { sector: 'Communication Services', weight: 3.0 }
      ]
    },
    'TLT': {
      name: 'iShares 20+ Year Treasury Bond ETF',
      description: 'Provides exposure to long-term U.S. Treasury bonds with maturities of 20 years or more.',
      totalHoldings: 35,
      topHoldings: [
        { symbol: 'UST 2.375% 05/2050', name: 'U.S. Treasury Bond 2.375% 05/15/2050', weight: 3.1, sector: 'U.S. Treasury' },
        { symbol: 'UST 1.250% 05/2050', name: 'U.S. Treasury Bond 1.250% 05/15/2050', weight: 3.0, sector: 'U.S. Treasury' },
        { symbol: 'UST 1.625% 11/2050', name: 'U.S. Treasury Bond 1.625% 11/15/2050', weight: 2.9, sector: 'U.S. Treasury' },
        { symbol: 'UST 1.500% 02/2051', name: 'U.S. Treasury Bond 1.500% 02/15/2051', weight: 2.9, sector: 'U.S. Treasury' },
        { symbol: 'UST 1.875% 02/2051', name: 'U.S. Treasury Bond 1.875% 02/15/2051', weight: 2.8, sector: 'U.S. Treasury' },
        { symbol: 'UST 2.000% 08/2051', name: 'U.S. Treasury Bond 2.000% 08/15/2051', weight: 2.8, sector: 'U.S. Treasury' },
        { symbol: 'UST 1.750% 11/2051', name: 'U.S. Treasury Bond 1.750% 11/15/2051', weight: 2.7, sector: 'U.S. Treasury' },
        { symbol: 'UST 2.375% 02/2052', name: 'U.S. Treasury Bond 2.375% 02/15/2052', weight: 2.7, sector: 'U.S. Treasury' },
        { symbol: 'UST 2.500% 08/2052', name: 'U.S. Treasury Bond 2.500% 08/15/2052', weight: 2.6, sector: 'U.S. Treasury' },
        { symbol: 'UST 2.375% 11/2052', name: 'U.S. Treasury Bond 2.375% 11/15/2052', weight: 2.6, sector: 'U.S. Treasury' }
      ],
      sectorBreakdown: [
        { sector: 'U.S. Treasury Bonds', weight: 100.0 }
      ]
    },
    'JEPQ': {
      name: 'JPMorgan Nasdaq Equity Premium Income ETF',
      description: 'Combines a low-volatility equity portfolio linked to the Nasdaq-100 with an options overlay for monthly income.',
      totalHoldings: 110,
      topHoldings: [
        { symbol: 'MSFT', name: 'Microsoft Corporation', weight: 9.5, sector: 'Technology' },
        { symbol: 'AAPL', name: 'Apple Inc.', weight: 9.2, sector: 'Technology' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', weight: 7.4, sector: 'Technology' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 6.2, sector: 'Consumer Discretionary' },
        { symbol: 'META', name: 'Meta Platforms Inc.', weight: 4.9, sector: 'Communication Services' },
        { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', weight: 4.4, sector: 'Communication Services' },
        { symbol: 'AVGO', name: 'Broadcom Inc.', weight: 3.6, sector: 'Technology' },
        { symbol: 'NFLX', name: 'Netflix, Inc.', weight: 3.2, sector: 'Communication Services' },
        { symbol: 'TSLA', name: 'Tesla Inc.', weight: 3.0, sector: 'Consumer Discretionary' },
        { symbol: 'COST', name: 'Costco Wholesale Corporation', weight: 2.7, sector: 'Consumer Staples' }
      ],
      sectorBreakdown: [
        { sector: 'Technology', weight: 45.0 },
        { sector: 'Communication Services', weight: 25.0 },
        { sector: 'Consumer Discretionary', weight: 20.0 },
        { sector: 'Consumer Staples', weight: 5.0 },
        { sector: 'Healthcare', weight: 5.0 }
      ]
    },
    'SCHD': {
      name: 'Schwab U.S. Dividend Equity ETF',
      description: 'Tracks the Dow Jones U.S. Dividend 100 Index focusing on quality U.S. companies with sustainable dividends.',
      totalHoldings: 104,
      topHoldings: [
        { symbol: 'AVGO', name: 'Broadcom Inc.', weight: 4.5, sector: 'Technology' },
        { symbol: 'TXN', name: 'Texas Instruments Incorporated', weight: 4.0, sector: 'Technology' },
        { symbol: 'HD', name: 'The Home Depot, Inc.', weight: 3.8, sector: 'Consumer Discretionary' },
        { symbol: 'MRK', name: 'Merck & Co., Inc.', weight: 3.7, sector: 'Healthcare' },
        { symbol: 'PEP', name: 'PepsiCo, Inc.', weight: 3.6, sector: 'Consumer Staples' },
        { symbol: 'KO', name: 'The Coca-Cola Company', weight: 3.4, sector: 'Consumer Staples' },
        { symbol: 'AMGN', name: 'Amgen Inc.', weight: 3.3, sector: 'Healthcare' },
        { symbol: 'CSCO', name: 'Cisco Systems, Inc.', weight: 3.2, sector: 'Technology' },
        { symbol: 'VZ', name: 'Verizon Communications Inc.', weight: 3.1, sector: 'Communication Services' },
        { symbol: 'LMT', name: 'Lockheed Martin Corporation', weight: 3.0, sector: 'Industrials' }
      ],
      sectorBreakdown: [
        { sector: 'Consumer Staples', weight: 21.0 },
        { sector: 'Information Technology', weight: 19.0 },
        { sector: 'Industrials', weight: 16.0 },
        { sector: 'Healthcare', weight: 16.0 },
        { sector: 'Financial Services', weight: 12.0 },
        { sector: 'Energy', weight: 6.0 },
        { sector: 'Communication Services', weight: 5.0 },
        { sector: 'Materials', weight: 3.0 },
        { sector: 'Consumer Discretionary', weight: 2.0 }
      ]
    },
    'IWM': {
      name: 'iShares Russell 2000 ETF',
      description: 'Seeks to track the investment results of an index composed of small-cap U.S. equities.',
      totalHoldings: 2008,
      topHoldings: [
        { symbol: 'SMCI', name: 'Super Micro Computer, Inc.', weight: 0.64, sector: 'Technology' },
        { symbol: 'NVR', name: 'NVR, Inc.', weight: 0.48, sector: 'Consumer Discretionary' },
        { symbol: 'DECK', name: 'Deckers Outdoor Corporation', weight: 0.44, sector: 'Consumer Discretionary' },
        { symbol: 'CELH', name: 'Celsius Holdings, Inc.', weight: 0.41, sector: 'Consumer Staples' },
        { symbol: 'RNR', name: 'RenaissanceRe Holdings Ltd.', weight: 0.37, sector: 'Financial Services' },
        { symbol: 'BLDR', name: 'Builders FirstSource, Inc.', weight: 0.36, sector: 'Industrials' },
        { symbol: 'LSCC', name: 'Lattice Semiconductor Corporation', weight: 0.35, sector: 'Technology' },
        { symbol: 'PNFP', name: 'Pinnacle Financial Partners, Inc.', weight: 0.34, sector: 'Financial Services' },
        { symbol: 'SPSC', name: 'SPS Commerce, Inc.', weight: 0.33, sector: 'Technology' },
        { symbol: 'WWD', name: 'Woodward, Inc.', weight: 0.32, sector: 'Industrials' }
      ],
      sectorBreakdown: [
        { sector: 'Industrials', weight: 17.0 },
        { sector: 'Healthcare', weight: 16.0 },
        { sector: 'Information Technology', weight: 15.0 },
        { sector: 'Financial Services', weight: 14.0 },
        { sector: 'Consumer Discretionary', weight: 13.0 },
        { sector: 'Energy', weight: 6.0 },
        { sector: 'Materials', weight: 6.0 },
        { sector: 'Real Estate', weight: 5.0 },
        { sector: 'Consumer Staples', weight: 4.0 },
        { sector: 'Communication Services', weight: 4.0 }
      ]
    }
  };
  
  const normalizedTicker = resolveETFTicker(ticker);
  return etfData[normalizedTicker] || null;
};

// 🎨 INTERFACES
interface Holding {
  symbol: string;
  name: string;
  weight: number;
  sector: string;
}

interface SectorBreakdown {
  sector: string;
  weight: number;
}

interface ETFData {
  name: string;
  description: string;
  totalHoldings: number;
  topHoldings: Holding[];
  sectorBreakdown: SectorBreakdown[];
}

interface ETFHoldingsProps {
  ticker: string;
  dadosYahoo?: any;
  dadosBRAPI?: any;
  isETF?: boolean;
  loading?: boolean;
}

// 📊 COMPONENTE PRINCIPAL ETF HOLDINGS RESPONSIVO
const ETFHoldings: React.FC<ETFHoldingsProps> = ({ ticker, dadosYahoo, dadosBRAPI, isETF: isETFProp, loading: externalLoading = false }) => {
  const { isMobile, isMobileOrTablet } = useResponsive();
  const [mostrarTodos, setMostrarTodos] = useState(false);

  // 🚀 USAR HOOK DE API REAL
  const shouldFetchETF = typeof isETFProp === 'boolean' ? isETFProp : !!dadosBRAPI;
  const { etfData, loading: apiLoading, error: apiError, refetch } = useETFData(ticker, shouldFetchETF);

  // Verificar se é ETF
  const ehETF = typeof isETFProp === 'boolean'
    ? isETFProp
    : dadosBRAPI
      ? true
      : detectETF(ticker);
  
  // Combinar loading states
  const loading = externalLoading || apiLoading;
  
  // Se não é ETF, não renderizar
  if (!ehETF) {
    console.log(`❌ ${ticker} não é identificado como ETF`);
    return null;
  }
  
  console.log(`✅ Renderizando ETFHoldings para ${ticker}`, { etfData, loading, apiError });

  // Função para obter dados de holdings (mock ou API)
  const getHoldingsData = () => {
    // Prioridade: dadosYahoo > etfData > mock
    if (dadosYahoo?.holdings && Array.isArray(dadosYahoo.holdings)) {
      return dadosYahoo.holdings;
    }
    
    if (etfData?.topHoldings && Array.isArray(etfData.topHoldings)) {
      return etfData.topHoldings;
    }
    
    // Fallback para mock data
    const mockData = {
      'QQQ': [
        { symbol: 'AAPL', name: 'Apple Inc.', weight: 12.1, sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', weight: 11.8, sector: 'Technology' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', weight: 7.2, sector: 'Technology' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 5.8, sector: 'Consumer Discretionary' },
        { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', weight: 4.3, sector: 'Communication Services' },
        { symbol: 'GOOG', name: 'Alphabet Inc. Class C', weight: 4.1, sector: 'Communication Services' },
        { symbol: 'META', name: 'Meta Platforms Inc.', weight: 4.0, sector: 'Communication Services' },
        { symbol: 'TSLA', name: 'Tesla Inc.', weight: 3.9, sector: 'Consumer Discretionary' },
        { symbol: 'AVGO', name: 'Broadcom Inc.', weight: 2.8, sector: 'Technology' },
        { symbol: 'COST', name: 'Costco Wholesale Corporation', weight: 2.1, sector: 'Consumer Staples' }
      ],
      'SPY': [
        { symbol: 'AAPL', name: 'Apple Inc.', weight: 7.1, sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', weight: 6.8, sector: 'Technology' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', weight: 4.2, sector: 'Technology' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 3.4, sector: 'Consumer Discretionary' },
        { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', weight: 2.1, sector: 'Communication Services' },
        { symbol: 'META', name: 'Meta Platforms Inc.', weight: 2.2, sector: 'Communication Services' },
        { symbol: 'TSLA', name: 'Tesla Inc.', weight: 2.1, sector: 'Consumer Discretionary' },
        { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', weight: 1.8, sector: 'Financial Services' },
        { symbol: 'LLY', name: 'Eli Lilly and Company', weight: 1.6, sector: 'Healthcare' },
        { symbol: 'V', name: 'Visa Inc.', weight: 1.5, sector: 'Financial Services' }
      ]
    };
    
    const normalizedTicker = resolveETFTicker(ticker);
    return mockData[normalizedTicker] || [];
  };

  const holdings = getHoldingsData();

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <h3 style={{
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0 0 20px 0'
        }}>
          📊 Principais Holdings
        </h3>
        <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
          <div style={{ marginBottom: '16px', fontSize: '24px' }}>⏳</div>
          <p>Carregando holdings do ETF...</p>
        </div>
      </div>
    );
  }

  if (!holdings || holdings.length === 0) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <h3 style={{
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0 0 20px 0'
        }}>
          📊 ETF Detectado
        </h3>
        <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
          <div style={{ marginBottom: '16px', fontSize: '48px' }}>📊</div>
          <h4 style={{ marginBottom: '8px', color: '#1e293b' }}>
            ETF Detectado
          </h4>
          <p style={{ marginBottom: '16px' }}>
            <strong>{ticker}</strong> foi identificado como um ETF, mas os dados de composição não estão disponíveis no momento.
          </p>
          <button
            onClick={refetch}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            🔄 Buscar Dados da API
          </button>
        </div>
      </div>
    );
  }

  const holdingsToShow = mostrarTodos ? holdings : holdings.slice(0, 10);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: isMobile ? '16px' : '24px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      marginBottom: '32px'
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        marginBottom: '20px',
        gap: isMobile ? '12px' : '0'
      }}>
        <h3 style={{
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0'
        }}>
          📊 Principais Holdings
        </h3>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>          
          {holdings.length > 10 && (
            <button
              onClick={() => setMostrarTodos(!mostrarTodos)}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: isMobile ? '10px' : '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {mostrarTodos ? 'Menos' : `+${holdings.length - 10}`}
            </button>
          )}
                  </div>
      </div>

      {/* Resumo para mobile */}
      {isMobile && (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#1e40af',
            margin: 0,
            fontWeight: '600'
          }}>
            📊 <strong>{holdings.length}</strong> principais holdings do ETF <strong>{ticker}</strong>
          </p>
        </div>
      )}

      {/* Tabela com rolagem lateral */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        overflowX: isMobileOrTablet ? 'auto' : 'visible'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          minWidth: isMobileOrTablet ? '700px' : '100%'
        }}>
          <thead style={{ 
            backgroundColor: '#f8fafc'
          }}>
            <tr>
              <th style={{ 
                padding: isMobile ? '10px 8px' : '12px',
                textAlign: 'left', 
                fontWeight: '700', 
                fontSize: isMobile ? '12px' : '14px'
              }}>
                #
              </th>
              <th style={{ 
                padding: isMobile ? '10px 8px' : '12px',
                textAlign: 'left', 
                fontWeight: '700', 
                fontSize: isMobile ? '12px' : '14px'
              }}>
                Símbolo
              </th>
              <th style={{ 
                padding: isMobile ? '10px 8px' : '12px',
                textAlign: 'left', 
                fontWeight: '700', 
                fontSize: isMobile ? '12px' : '14px'
              }}>
                Empresa
              </th>
              <th style={{ 
                padding: isMobile ? '10px 8px' : '12px',
                textAlign: 'right', 
                fontWeight: '700', 
                fontSize: isMobile ? '12px' : '14px'
              }}>
                Peso (%)
              </th>
              <th style={{ 
                padding: isMobile ? '10px 8px' : '12px',
                textAlign: 'center', 
                fontWeight: '700', 
                fontSize: isMobile ? '12px' : '14px'
              }}>
                Setor
              </th>
            </tr>
          </thead>
          <tbody>
            {holdingsToShow.map((holding, index) => (
              <tr 
                key={holding.symbol || index} 
                style={{ 
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <td style={{ 
                  padding: isMobile ? '10px 8px' : '12px',
                  fontSize: isMobile ? '12px' : '14px',
                  color: '#64748b',
                  fontWeight: '500'
                }}>
                  {index + 1}
                </td>
                <td style={{ 
                  padding: isMobile ? '10px 8px' : '12px',
                  fontWeight: '700',
                  fontSize: isMobile ? '12px' : '14px',
                  color: '#3b82f6'
                }}>
                  {holding.symbol}
                </td>
                <td style={{ 
                  padding: isMobile ? '10px 8px' : '12px',
                  fontWeight: '500',
                  fontSize: isMobile ? '11px' : '14px',
                  maxWidth: isMobile ? '150px' : 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {holding.name || holding.holdingName || 'N/A'}
                </td>
                <td style={{ 
                  padding: isMobile ? '10px 8px' : '12px',
                  textAlign: 'right', 
                  fontWeight: '700', 
                  color: '#22c55e',
                  fontSize: isMobile ? '12px' : '14px'
                }}>
                  {holding.weight ? 
                    `${holding.weight.toFixed(2)}%` : 
                    (holding.holdingPercent ? `${(holding.holdingPercent * 100).toFixed(2)}%` : 'N/A')
                  }
                </td>
                <td style={{ 
                  padding: isMobile ? '10px 8px' : '12px',
                  textAlign: 'center'
                }}>
                  <span style={{
                    backgroundColor: '#f0f9ff',
                    color: '#1e40af',
                    borderRadius: '4px',
                    padding: isMobile ? '2px 6px' : '4px 8px',
                    fontSize: isMobile ? '10px' : '12px',
                    fontWeight: '600',
                    border: '1px solid #bfdbfe'
                  }}>
                    {isMobile 
                      ? (holding.sector || 'Outros').substring(0, 4) + '...'
                      : (holding.sector || 'Outros')
                    }
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {holdings.length > 10 && (
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{
            fontSize: isMobile ? '12px' : '14px',
            color: '#64748b',
            margin: 0,
            fontWeight: '500'
          }}>
            📊 Exibindo {holdingsToShow.length} de {holdings.length} holdings • 
            {holdingsToShow.reduce((acc, holding) => 
              acc + (holding.weight || (holding.holdingPercent ? holding.holdingPercent * 100 : 0)), 0
            ).toFixed(1)}% do total
          </p>
        </div>
      )}
    </div>
  );
};

export { detectETF as isETF };

export default ETFHoldings;
