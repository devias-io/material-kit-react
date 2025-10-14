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

// 🏢 FUNÇÃO PARA DETECTAR ETFs AUTOMATICAMENTE
const detectETF = (ticker: string): boolean => {
  if (!ticker) return false;

  const normalizedTicker = ticker.toUpperCase();

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
    'PDBC', 'DBA', 'USO', 'UNG', 'ARKK', 'ARKQ', 'ARKW', 'ARKG', 'ARKF'
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

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Buscando dados reais do ETF ${ticker}...`);

      // MÉTODO 1: Tentar Yahoo Finance para ETF Holdings
try {
  const yahooUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=topHoldings`;
  const yahooResponse = await fetch(yahooUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });
  
  if (yahooResponse.ok) {
    const yahooData = await yahooResponse.json();
    const holdings = yahooData?.quoteSummary?.result?.[0]?.topHoldings?.holdings;
    
    if (holdings && Array.isArray(holdings)) {
      const processedData: ETFData = {
        name: yahooData.quoteSummary.result[0].quoteType.longName,
        description: yahooData.quoteSummary.result[0].summaryProfile?.longBusinessSummary || '',
        totalHoldings: holdings.length,
        topHoldings: holdings.slice(0, 10).map((h: any) => ({
          symbol: h.symbol,
          name: h.holdingName,
          weight: h.holdingPercent * 100, // Yahoo retorna decimal
          sector: h.sector || 'Unknown'
        })),
        sectorBreakdown: []
      };
      
      setETFData(processedData);
      console.log(`✅ Holdings carregados via Yahoo Finance`);
      return;
    }
  }
} catch (error) {
  console.log('⚠️ Yahoo Finance falhou:', error);
}
      
      // MÉTODO 2: Tentar via proxy CORS para APIs alternativas
      try {
        // Usar Financial Modeling Prep (tem plano gratuito)
        const fmpKey = 'demo'; // Substitua por sua chave
        const fmpUrl = `https://financialmodelingprep.com/api/v3/etf-holder/${ticker}?apikey=${fmpKey}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(fmpUrl)}`;
        
        const proxyResponse = await fetch(proxyUrl);
        if (proxyResponse.ok) {
          const proxyData = await proxyResponse.json();
          const fmpData = JSON.parse(proxyData.contents);
          
          if (fmpData && Array.isArray(fmpData) && fmpData.length > 0) {
            console.log(`📊 Dados FMP encontrados para ${ticker}:`, fmpData);
            
            const processedData: ETFData = {
              name: `${ticker} ETF`,
              description: `Exchange Traded Fund ${ticker}`,
              totalHoldings: fmpData.length,
              topHoldings: fmpData.slice(0, 10).map((holding: any) => ({
                symbol: holding.asset,
                name: holding.assetName || holding.asset,
                weight: parseFloat(holding.weightPercentage) || 0,
                sector: holding.sector || 'Unknown'
              })),
              sectorBreakdown: []
            };
            
            // Calcular breakdown por setor
            const sectorMap: Record<string, number> = {};
            fmpData.forEach((holding: any) => {
              const sector = holding.sector || 'Unknown';
              const weight = parseFloat(holding.weightPercentage) || 0;
              sectorMap[sector] = (sectorMap[sector] || 0) + weight;
            });
            
            processedData.sectorBreakdown = Object.entries(sectorMap).map(([sector, weight]) => ({
              sector,
              weight
            }));
            
            setETFData(processedData);
            console.log(`✅ ETF ${ticker} carregado via FMP API`);
            return;
          }
        }
      } catch (fmpError) {
        console.log(`⚠️ FMP API falhou para ${ticker}:`, fmpError);
      }

      // MÉTODO 3: Fallback para dados mock (temporário)
      console.log(`📋 Usando dados mock como fallback para ${ticker}`);
      const mockData = getETFHoldingsMock(ticker);
      if (mockData) {
        setETFData(mockData);
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
  const etfData: Record<string, any> = {
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
    }
  };
  
  return etfData[ticker.toUpperCase()] || null;
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
    
    return mockData[ticker.toUpperCase()] || [];
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
