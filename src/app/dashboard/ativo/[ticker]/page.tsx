'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDataStore } from '../../../../hooks/useDataStore';
import { Download, ExternalLink } from 'lucide-react';

// ✅ LAZY LOADING DE COMPONENTES PESADOS
const AnalisesTrimesestrais = lazy(() => import('@/components/AnalisesTrimesestrais'));
const ETFHoldings = lazy(() => import('@/components/ETFHoldings'));
const ETFMetricCards = lazy(() => import('@/components/ETFMetricCards'));
const TechnicalAnalysisSection = lazy(() => import('@/components/TechnicalAnalysisSection'));

// ✅ IMPORTS BÁSICOS (mantidos síncronos)
import { useAgendaCorporativaTicker } from '@/hooks/ativo/useAgendaCorporativaTicker';
import { useDividendYieldIntegrado } from '@/hooks/ativo/useDividendYieldIntegrado';
import { useProventosIntegrado } from '../../../../hooks/ativo/useProventosIntegrado';
import { useBDRDataAPI } from '../../../../hooks/ativo/useBDRDataAPI';
import { useHGBrasilFII } from '../../../../hooks/ativo/useHGBrasilFII';
import { useCotacaoCompleta } from '../../../../hooks/ativo/useCotacaoCompleta';
import { useBRAPIETF } from '@/hooks/useBRAPIETF';
import { useRelatoriosEstatisticas } from '@/hooks/useRelatoriosAPI';
import { useAuthAccess } from '@/hooks/use-auth-access';
import {
  CARTEIRA_PERMISSION_MAP,
  getCarteirasForTicker,
  type CarteiraKey
} from '@/utils/carteira-access';

// ✅ IMPORT ÚNICO CORRIGIDO
import {
  useDadosFinanceiros,
  useDadosFII,
  useDadosBDR,
  useHGBrasilAcoes,
  useYahooFinanceInternacional,
  useCotacaoUSD,
  formatCurrency,
  formatarValor,
  isBDREstrangeiro,
  getEstrangeiroFromBDR,
  getMercadoOrigem,
  BDR_ESTRANGEIRO_MAPPING,
  DadosFinanceiros,
  DadosFII,
  Relatorio
} from '../../../../hooks/useAtivoDetalhes';

interface TipoAtivo {
  ehBDREstrangeiro: boolean;
  tickerEstrangeiro: string | null;
  bdrCorrespondente: string | null;
  temBDR: boolean;
  ehETF: boolean;
  ehFII: boolean;
  ehREIT: boolean;
}

// ✅ CACHE INTELIGENTE UTILITÁRIO
const cacheUtils = {
  set: (key, data, ttl = 5 * 60 * 1000) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl
      };
      sessionStorage.setItem(`ativo_cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  },
  
  get: (key) => {
    try {
      const cached = sessionStorage.getItem(`ativo_cache_${key}`);
      if (cached) {
        const { data, timestamp, ttl } = JSON.parse(cached);
        if (Date.now() - timestamp < ttl) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Cache get error:', error);
    }
    return null;
  },
  
  clear: (key) => {
    try {
      sessionStorage.removeItem(`ativo_cache_${key}`);
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }
};

// ✅ INTERSECTION OBSERVER OTIMIZADO PARA MOBILE
const useInView = (options = {}) => {
  const [inView, setInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef();
  const timeoutRef = useRef();

  useEffect(() => {
    // Detectar se é mobile para usar configurações diferentes
    const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Debounce para mobile
        if (isMobileDevice) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            if (entry.isIntersecting && !hasTriggered) {
              setInView(true);
              setHasTriggered(true);
              // Uma vez que está in view, não precisa mais observar
              observer.disconnect();
            }
          }, 100);
        } else {
          // Desktop - comportamento normal
          setInView(entry.isIntersecting);
        }
      },
      { 
        threshold: isMobileDevice ? 0.05 : 0.1, // Threshold menor no mobile
        rootMargin: isMobileDevice ? '100px' : '50px', // Margem maior no mobile
        ...options 
      }
    );

    if (ref.current) observer.observe(ref.current);
    
    return () => {
      observer.disconnect();
      clearTimeout(timeoutRef.current);
    };
  }, [hasTriggered]);

  return [ref, inView];
};

// ✅ FUNÇÃO PARA DETECTAR ETFs (OTIMIZADA)
const ETF_LIST = new Set([
  'QQQ', 'SPY', 'VTI', 'VEA', 'VWO', 'QUAL', 'SOXX', 'XLF', 'XLK', 'XLV', 'XLE',
  'HERO', 'MCHI', 'TFLO', 'TLT', 'IEF', 'SHY', 'NOBL', 'VNQ', 'SCHP', 'VTEB',
  'VOO', 'IVV', 'VXUS', 'BND', 'AGG', 'LQD', 'HYG', 'EMB', 'VB', 'VTV', 'VUG',
  'IWM', 'IWN', 'IWO', 'IJH', 'IJR', 'IJK', 'IJJ', 'IJS', 'IWV', 'ITOT',
  'XLC', 'XLI', 'XLB', 'XLRE', 'XLP', 'XLY', 'XLU', 'GLD', 'SLV', 'IAU',
  'PDBC', 'DBA', 'USO', 'UNG', 'ARKK', 'ARKQ', 'ARKW', 'ARKG', 'ARKF'
]);

const KNOWN_REITS = new Set([
  'WPC', 'O', 'STAG', 'ADC', 'NNN', 'AVB', 'PLD',
  'AMT', 'ARE', 'SPG', 'DOC', 'VNQ'
]);

const EQUITY_OVERRIDE_TICKERS = new Set(
  [
    ...Object.keys(BDR_ESTRANGEIRO_MAPPING),
    ...Object.values(BDR_ESTRANGEIRO_MAPPING)
  ].map(ticker => ticker.toUpperCase())
);

const isETF = (ticker) => {
  if (!ticker) return false;
  const normalizedTicker = ticker.toUpperCase();

  if (EQUITY_OVERRIDE_TICKERS.has(normalizedTicker)) {
    return false;
  }

  return ETF_LIST.has(normalizedTicker);
};

const isREIT = (ticker) => {
  if (!ticker) return false;
  const normalizedTicker = ticker.toUpperCase();
  return KNOWN_REITS.has(normalizedTicker);
};

// ✅ HOOK RESPONSIVO OTIMIZADO
const RESPONSIVE_BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  laptop: 1024,
  desktop: 1200
};

const createResponsiveState = (width, height) => {
  const screenSize = width <= RESPONSIVE_BREAKPOINTS.mobile
    ? 'mobile'
    : width <= RESPONSIVE_BREAKPOINTS.tablet
    ? 'tablet'
    : width <= RESPONSIVE_BREAKPOINTS.laptop
    ? 'laptop'
    : 'desktop';

  return {
    screenSize,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isLaptop: screenSize === 'laptop',
    isDesktop: screenSize === 'desktop',
    isMobileOrTablet: screenSize === 'mobile' || screenSize === 'tablet',
    width,
    height,
    breakpoints: RESPONSIVE_BREAKPOINTS
  };
};

const DEFAULT_RESPONSIVE_STATE = createResponsiveState(1200, 800);

let responsiveState = DEFAULT_RESPONSIVE_STATE;
const responsiveSubscribers = new Set();
let resizeListenerRegistered = false;
let resizeTimeoutId = null;
let resizeListener = null;

const notifyResponsiveSubscribers = () => {
  responsiveSubscribers.forEach(subscriber => {
    subscriber(responsiveState);
  });
};

const updateResponsiveState = () => {
  if (typeof window === 'undefined') return;

  responsiveState = createResponsiveState(window.innerWidth, window.innerHeight);
  notifyResponsiveSubscribers();
};

const ensureResizeListener = () => {
  if (resizeListenerRegistered || typeof window === 'undefined') {
    return;
  }

  resizeListener = () => {
    clearTimeout(resizeTimeoutId);
    const delay = window.innerWidth <= RESPONSIVE_BREAKPOINTS.tablet ? 300 : 150;
    resizeTimeoutId = window.setTimeout(updateResponsiveState, delay);
  };

  window.addEventListener('resize', resizeListener, { passive: true });
  resizeListenerRegistered = true;

  updateResponsiveState();
};

const cleanupResizeListenerIfNeeded = () => {
  if (responsiveSubscribers.size === 0 && resizeListenerRegistered && typeof window !== 'undefined') {
    if (resizeListener) {
      window.removeEventListener('resize', resizeListener);
    }
    clearTimeout(resizeTimeoutId);
    resizeTimeoutId = null;
    resizeListenerRegistered = false;
    resizeListener = null;
  }
};

const useResponsive = () => {
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_RESPONSIVE_STATE;
    }

    return createResponsiveState(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    ensureResizeListener();

    const subscriber = (nextState) => {
      setState(nextState);
    };

    responsiveSubscribers.add(subscriber);

    // Garantir que o estado inicial reflita a largura/altura atuais
    if (typeof window !== 'undefined') {
      subscriber(createResponsiveState(window.innerWidth, window.innerHeight));
    }

    return () => {
      responsiveSubscribers.delete(subscriber);
      cleanupResizeListenerIfNeeded();
    };
  }, []);

  return state;
};

// ✅ HOOK DE LOADING PROGRESSIVO
const useProgressiveLoading = (dependencies = []) => {
  const [stages, setStages] = useState({
    stage1: true,  // Header + dados básicos
    stage2: true,  // Métricas financeiras
    stage3: true   // Componentes pesados
  });

  useEffect(() => {
    const anyLoading = dependencies.some(dep => dep === true);
    
    if (!anyLoading) {
      // Stage 1: Dados básicos
      setStages(prev => ({ ...prev, stage1: false }));
      
      // Stage 2: Métricas (com delay mínimo)
      setTimeout(() => {
        setStages(prev => ({ ...prev, stage2: false }));
      }, 100);
      
      // Stage 3: Componentes pesados
      setTimeout(() => {
        setStages(prev => ({ ...prev, stage3: false }));
      }, 200);
    }
  }, dependencies);

  return stages;
};

// ✅ SKELETON LOADER OTIMIZADO
const SkeletonLoader = React.memo(({ variant = 'card', count = 1, className = '' }) => {
  const { isMobile } = useResponsive();
  
  const skeletonStyles = useMemo(() => {
    const baseStyle = {
      backgroundColor: '#e2e8f0',
      borderRadius: '8px',
      animation: 'pulse 2s infinite',
      marginBottom: '16px'
    };

    const variants = {
      header: { ...baseStyle, height: isMobile ? '120px' : '180px', borderRadius: '12px' },
      card: { ...baseStyle, height: isMobile ? '120px' : '160px', width: '100%' },
      metric: { ...baseStyle, height: isMobile ? '80px' : '100px', width: '100%' },
      'table-row': { ...baseStyle, height: '40px', marginBottom: '8px' },
      text: { ...baseStyle, height: '20px', width: '60%' }
    };

    return variants[variant] || baseStyle;
  }, [variant, isMobile]);

  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={skeletonStyles} />
      ))}
    </div>
  );
});

// ✅ LAZY COMPONENT WRAPPER
const LazyComponent = ({ children, fallback, condition = true }) => {
  if (!condition) return fallback || <SkeletonLoader />;
  
  return (
    <Suspense fallback={fallback || <SkeletonLoader />}>
      {children}
    </Suspense>
  );
};

// ✅ GRID RESPONSIVO INTELIGENTE (MEMOIZADO)
const ResponsiveGrid = React.memo(({ children, minCardWidth = 250, gap = 20, className = '' }) => {
  const { width, isMobile } = useResponsive();
  
  const gridStyle = useMemo(() => {
    const adjustedMinWidth = isMobile ? Math.min(minCardWidth, width - 48) : minCardWidth;
    
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${adjustedMinWidth}px, 1fr))`,
      gap: `${gap}px`,
      width: '100%',
      marginBottom: '32px'
    };
  }, [width, isMobile, minCardWidth, gap]);

  return (
    <div style={gridStyle} className={className}>
      {children}
    </div>
  );
});

// ✅ UTILITÁRIOS CENTRALIZADOS (MEMOIZADOS)
const formatUtils = {
  currency: (value, currency = 'BRL') => {
    if (!value || isNaN(value)) return 'N/A';
    return formatCurrency(value, currency);
  },
  
  percentage: (value, decimals = 2) => {
    if (!value || isNaN(value)) return 'N/A';
    return `${value.toFixed(decimals)}%`;
  },
  
  number: (value, decimals = 2) => {
    if (!value || isNaN(value)) return 'N/A';
    return value.toFixed(decimals).replace('.', ',');
  },
  
  compactNumber: (value, suffix = '') => {
    if (!value || isNaN(value)) return 'N/A';
    
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B${suffix}`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M${suffix}`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K${suffix}`;
    
    return `${value.toFixed(0)}${suffix}`;
  },
  
  date: (dateInput, format = 'short') => {
    if (!dateInput) return 'N/A';
    
    let date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      return 'N/A';
    }
    
    if (isNaN(date.getTime())) return 'N/A';
    
    const options = {
      short: { day: '2-digit', month: '2-digit' },
      medium: { day: '2-digit', month: '2-digit', year: '2-digit' },
      long: { day: '2-digit', month: '2-digit', year: 'numeric' },
      monthYear: { month: 'short', year: 'numeric' }
    };
    
    try {
      return date.toLocaleDateString('pt-BR', options[format] || options.medium);
    } catch (error) {
      return 'N/A';
    }
  }
};

// ✅ COMPONENTE CARD MÉTRICA OTIMIZADO
const MetricCard = React.memo(({ 
  title, 
  value, 
  subtitle, 
  loading = false,
  trend,
  icon,
  color = '#1e293b'
}) => {
  const { isMobile } = useResponsive();
  
  const cardStyles = useMemo(() => ({
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: isMobile ? '16px' : '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    height: '100%',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default'
  }), [isMobile]);
  
  if (loading) {
    return <SkeletonLoader variant="metric" />;
  }

  return (
    <div style={cardStyles}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '8px'
      }}>
        {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
        <h4 style={{
          fontSize: isMobile ? '11px' : '12px',
          fontWeight: '700',
          color: '#64748b',
          margin: '0',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {title}
        </h4>
      </div>
      
      <p style={{
        fontSize: isMobile ? '20px' : '24px',
        fontWeight: '800',
        color: trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : color,
        margin: '0 0 4px 0',
        lineHeight: '1.2'
      }}>
        {value}
      </p>
      
      {subtitle && (
        <p style={{
          fontSize: isMobile ? '10px' : '12px',
          color: '#64748b',
          margin: '0',
          fontWeight: '500'
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
});

// ✅ NOMES E DESCRIÇÕES (MEMOIZADOS)
const COMPANY_NAMES = {
  // 🇧🇷 Ações Brasil
  'ALOS3': 'Allos S.A.',
  'TUPY3': 'Tupy S.A.',
  'PRIO3': 'Prio S.A.',
  'RECV3': 'PetroRecôncavo S.A.',
  'CSED3': 'Cruzeiro do Sul Educacional S.A.',
  'UNIP6': 'Unipar S.A.',
  'RAPT4': 'Randoncorp S.A.',
  'FLRY3': 'Fleury S.A.',
  'SMTO3': 'São Martinho S.A.',
  'FESA4': 'Ferbasa S.A.',
  'EZTC3': 'EZTEC Empreendimentos e Participações S.A.',
  'JALL3': 'Jalles Machado S.A.',
  'YDUQ3': 'YDUQS Participações S.A.',
  'SIMH3': 'Simpar S.A.',
  'ALUP11': 'Alupar Investimento S.A.',
  'NEOE3': 'Neoenergia S.A.',
  'SHUL4': 'Schulz S.A.',
  'RANI3': 'Irani Papel e Celulose S.A.',
  'KEPL3': 'Kepler Weber S.A.',
  'EVEN3': 'Even Construtora e Incorporadora S.A.',
  'WIZC3': 'Wiz Co S.A.',
  'RSUL4': 'Riosulense S.A.',
  'TASA4': 'Taurus Armas S.A.',
  'POSI3': 'Positivo Tecnologia S.A.',
  'TRIS3': 'Trisul S.A.',
  'CGRA4': 'Grazziotin S.A.',
  'ROMI3': 'Indústrias Romi S.A.',
  'CEAB3': 'C&A Modas S.A.',
  'LOGG3': 'LOG Commercial Properties e Participações S.A.',
  'AGRO3': 'BrasilAgro S.A.',
  'DEXP3': 'Dexxos Participações S.A.',
  'LEVE3': 'Mahle Metal Leve S.A.',
  'ODPV3': 'OdontoPrev S.A.',
  'EGIE3': 'Engie Brasil Energia S.A.',
  'VALE3': 'Vale S.A.',
  'PETR4': 'Petróleo Brasileiro S.A. (Petrobras)',
  'BBAS3': 'Banco do Brasil S.A.',
  'BRSR6': 'Banrisul S.A.',
  'ELET3': 'Eletrobras S.A.',
  'ABCB4': 'Banco ABC Brasil S.A.',
  'KLBN11': 'Klabin S.A.',
  'SAPR4': 'Sanepar S.A.',
  'CSMG3': 'Copasa MG S.A.',
  'BBSE3': 'BB Seguridade Participações S.A.',
  'ISAE4': 'ISA CTEEP S.A.',
  'VIVT3': 'Telefônica Brasil S.A.',
  'SANB11': 'Banco Santander (Brasil) S.A.',
  'B3SA3': 'B3 S.A. – Brasil, Bolsa, Balcão',
  'CPLE6': 'Copel S.A.',

  // 🇧🇷 FIIs
  'PMLL11': 'PMLL11 – Fundo Imobiliário',
  'KNSC11': 'Kinea Securities FII',
  'KNHF11': 'Kinea Hedge Fund FII',
  'HGBS11': 'Hedge Brasil Shopping FII',
  'BRCO11': 'Bresco Logística FII',
  'RURA11': 'Rura FII',
  'BCIA11': 'Bradesco Carteira Imobiliária Ativa FII',
  'BPFF11': 'BTG Pactual Fundo de Fundos FII',
  'HGFF11': 'Hedge Top FOFII 3 FII',
  'VGIP11': 'Valora Crédito Imobiliário FII',
  'XPML11': 'XP Malls FII',
  'HGLG11': 'CSHG Logística FII',
  'LVBI11': 'VBI Logístico FII',
  'HSML11': 'HSI Malls FII',
  'AFHI11': 'AF Invest FII',
  'BTLG11': 'BTG Pactual Logística FII',
  'VRTA11': 'Fator Verita FII',
  'HGRU11': 'CSHG Renda Urbana FII',
  'ALZR11': 'Alianza Trust Renda Imobiliária FII',
  'BCRI11': 'Banestes Recebíveis Imobiliários FII',
  'KNRI11': 'Kinea Renda Imobiliária FII',
  'IRDM11': 'Iridium Recebíveis Imobiliários FII',
  'MXRF11': 'Maxi Renda FII',

  // 🇺🇸 Ações EUA
  'AMD': 'Advanced Micro Devices, Inc.',
  'XP': 'XP Inc.',
  'HD': 'The Home Depot, Inc.',
  'AAPL': 'Apple Inc.',
  'FIVE': 'Five Below, Inc.',
  'AMAT': 'Applied Materials, Inc.',
  'COST': 'Costco Wholesale Corporation',
  'GOOGL': 'Alphabet Inc.',
  'META': 'Meta Platforms, Inc.',
  'BRK.B': 'Berkshire Hathaway Inc. (Class B)',
  'NVDA': 'NVIDIA Corporation',
  'AMZN': 'Amazon.com, Inc.',
  'PEP': 'PepsiCo, Inc.',
  'VZ': 'Verizon Communications Inc.',
  'ADC': 'Agree Realty Corporation',
  'STAG': 'STAG Industrial, Inc.',
  'O': 'Realty Income Corporation',
  'AVB': 'AvalonBay Communities, Inc.',
  'WPC': 'W. P. Carey Inc.',
  'CRM': 'Salesforce, Inc.',
  'PYPL': 'PayPal Holdings, Inc.',
  'JPM': 'JPMorgan Chase & Co.',
  'PLD': 'Prologis, Inc.',
  'AMT': 'American Tower Corporation',
  'ARE': 'Alexandria Real Estate Equities, Inc.',
  'SPG': 'Simon Property Group, Inc.',
  'DOC': 'Physicians Realty Trust',
  'NNN': 'NNN REIT, Inc.',
  'OXY': 'Occidental Petroleum Corporation',

  // 🇺🇸 ETFs/Trusts
  'VOO': 'Vanguard S&P 500 ETF',
  'IJS': 'iShares S&P Small-Cap 600 Value ETF',
  'QUAL': 'iShares MSCI USA Quality Factor ETF',
  'QQQ': 'Invesco QQQ Trust',
  'VNQ': 'Vanguard Real Estate ETF',
  'SCHP': 'Schwab U.S. TIPS ETF',
  'IAU': 'iShares Gold Trust',
  'HERO': 'Global X Video Games & Esports ETF',
  'SOXX': 'iShares Semiconductor ETF',
  'MCHI': 'iShares MSCI China ETF',
  'TFLO': 'iShares Treasury Floating Rate Bond ETF',
  'TLT': 'iShares 20+ Year Treasury Bond ETF',
  'NOBL': 'ProShares S&P 500 Dividend Aristocrats ETF',
  'JEPQ': 'JPMorgan Nasdaq Equity Premium Income ETF',
  'SCHD': 'Schwab U.S. Dividend Equity ETF',
  'IWM': 'iShares Russell 2000 ETF'
};

const COMPANY_DESCRIPTIONS = {
  // 🇧🇷 Ações Brasil
  'ALOS3': 'Empresa brasileira de shoppings e varejo imobiliário.',
  'TUPY3': 'Fundição e autopeças, com foco em blocos e cabeçotes.',
  'PRIO3': 'Petrolífera independente focada em E&P offshore.',
  'RECV3': 'Exploração e produção de petróleo e gás onshore.',
  'CSED3': 'Grupo de educação superior e cursos digitais.',
  'UNIP6': 'Química e petroquímica, destaque em PVC e soda.',
  'RAPT4': 'Indústria de implementos, autopeças e serviços.',
  'FLRY3': 'Serviços de medicina diagnóstica e saúde.',
  'SMTO3': 'Produtora de açúcar, etanol e energia.',
  'FESA4': 'Siderurgia e ferroligas, com foco em cromo.',
  'EZTC3': 'Incorporação e construção de médio/alto padrão.',
  'JALL3': 'Produção de açúcar, etanol e energia.',
  'YDUQ3': 'Educação superior e EAD em larga escala.',
  'SIMH3': 'Holding de serviços (logística, frota, concessões).',
  'ALUP11': 'Holding de transmissão e geração de energia.',
  'NEOE3': 'Geração, transmissão e distribuição de energia.',
  'SHUL4': 'Autopeças e componentes metálicos.',
  'RANI3': 'Papel e celulose, embalagens e florestal.',
  'KEPL3': 'Silos e soluções para pós-colheita agrícola.',
  'EVEN3': 'Incorporação residencial e comercial.',
  'WIZC3': 'Distribuição de seguros e serviços financeiros.',
  'RSUL4': 'Autopeças e usinagem de precisão.',
  'TASA4': 'Armas leves e equipamentos de defesa.',
  'POSI3': 'Computadores, celulares e tecnologia educacional.',
  'TRIS3': 'Incorporação focada em médio/baixo padrão.',
  'CGRA4': 'Varejo de moda e utilidades no Sul do Brasil.',
  'ROMI3': 'Máquinas-ferramenta e fundidos.',
  'CEAB3': 'Varejo de moda (C&A) no Brasil.',
  'LOGG3': 'Desenvolvimento e gestão de galpões logísticos.',
  'AGRO3': 'Agronegócio com foco em terras e grãos.',
  'DEXP3': 'Holding com investimentos industriais.',
  'LEVE3': 'Autopeças para motores e sistemas.',
  'ODPV3': 'Planos odontológicos e serviços de saúde.',
  'EGIE3': 'Geração de energia elétrica diversificada.',
  'VALE3': 'Mineração e logística, líder em minério de ferro.',
  'PETR4': 'Energia integrada, E&P, refino e gás.',
  'BBAS3': 'Banca múltipla e serviços financeiros.',
  'BRSR6': 'Banco estadual com foco em varejo e agronegócio.',
  'ELET3': 'Geração e transmissão de energia elétrica.',
  'ABCB4': 'Banco de atacado, corporate e middle market.',
  'KLBN11': 'Papel e celulose, embalagens e florestas.',
  'SAPR4': 'Saneamento básico (água e esgoto).',
  'CSMG3': 'Saneamento em Minas Gerais.',
  'BBSE3': 'Seguros, previdência e capitalização.',
  'ISAE4': 'Transmissão de energia elétrica.',
  'VIVT3': 'Telecom (móvel, banda larga e TV).',
  'SANB11': 'Banco universal com varejo e corporate.',
  'B3SA3': 'Bolsa de valores e infraestrutura de mercado.',
  'CPLE6': 'Energia: geração, transmissão e distribuição.',

  // 🇧🇷 FIIs
  'PMLL11': 'Fundo imobiliário com foco em renda (diversificado).',
  'KNSC11': 'FII de CRIs e estratégia de crédito.',
  'KNHF11': 'FII multimercado com foco em hedge/FOF.',
  'HGBS11': 'FII de shoppings e varejo.',
  'BRCO11': 'FII de galpões logísticos.',
  'RURA11': 'FII com foco em ativos do agronegócio.',
  'BCIA11': 'FII de fundos imobiliários (FOF).',
  'BPFF11': 'FII de fundos (FOF) com gestão ativa.',
  'HGFF11': 'FII de fundos e estratégias diversificadas.',
  'VGIP11': 'FII de recebíveis imobiliários (CRIs).',
  'XPML11': 'FII de shoppings administrados pela XP.',
  'HGLG11': 'FII logístico (galpões).',
  'LVBI11': 'FII logístico e industrial.',
  'HSML11': 'FII de shoppings.',
  'AFHI11': 'FII de recebíveis e crédito imobiliário.',
  'BTLG11': 'FII logístico BTG Pactual.',
  'VRTA11': 'FII de CRIs (renda fixa imobiliária).',
  'HGRU11': 'FII de renda urbana (varejo/serviços).',
  'ALZR11': 'FII de imóveis corporativos e logísticos.',
  'BCRI11': 'FII de CRIs com gestão ativa.',
  'KNRI11': 'FII de lajes corporativas e logística.',
  'IRDM11': 'FII de CRIs com alta diversificação.',
  'MXRF11': 'FII híbrido com foco em CRIs e FOF.',

  // 🇺🇸 Ações EUA
  'AMD': 'Fabricante de chips e soluções de computação.',
  'XP': 'Plataforma de investimentos com origem no Brasil.',
  'HD': 'Varejo de materiais de construção e casa.',
  'AAPL': 'Tecnologia: hardware, software e serviços.',
  'FIVE': 'Varejo de desconto voltado ao público jovem.',
  'AMAT': 'Equipamentos para a indústria de semicondutores.',
  'COST': 'Varejo de clubes de compras.',
  'GOOGL': 'Serviços de internet, ads e cloud.',
  'META': 'Redes sociais, mensageria e realidade estendida.',
  'BRK.B': 'Holding diversificada liderada por Warren Buffett.',
  'NVDA': 'GPUs e plataformas de IA e data centers.',
  'AMZN': 'E-commerce e computação em nuvem (AWS).',
  'PEP': 'Bebidas e alimentos globais.',
  'VZ': 'Telecomunicações móveis e serviços de rede.',
  'ADC': 'REIT focado em varejo essencial (triple-net).',
  'STAG': 'REIT de armazéns industriais (last mile).',
  'O': 'REIT de varejo com contratos de longo prazo.',
  'AVB': 'REIT residencial (multifamily).',
  'WPC': 'REIT diversificado (sale-leaseback).',
  'CRM': 'Software SaaS de CRM e plataforma cloud.',
  'PYPL': 'Pagamentos digitais e carteira eletrônica.',
  'JPM': 'Maior banco dos EUA por ativos.',
  'PLD': 'REIT logístico global (galpões).',
  'AMT': 'REIT de torres de telecomunicações.',
  'ARE': 'REIT de laboratórios e life science.',
  'SPG': 'REIT de shoppings premium.',
  'DOC': 'REIT de imóveis médicos.',
  'NNN': 'REIT de varejo (triple-net).',
  'OXY': 'Petróleo e gás, E&P e midstream.',

  // 🇺🇸 ETFs/Trusts
  'VOO': 'ETF que replica o S&P 500.',
  'IJS': 'ETF de small caps (S&P 600 Value).',
  'QUAL': 'ETF de fator qualidade (ações EUA).',
  'QQQ': 'ETF que acompanha a Nasdaq-100.',
  'VNQ': 'ETF de REITs dos EUA.',
  'SCHP': 'ETF de TIPS (Treasury protegidos da inflação).',
  'IAU': 'Trust lastreado em ouro físico.',
  'HERO': 'ETF de games e eSports.',
  'SOXX': 'ETF do setor de semicondutores.',
  'MCHI': 'ETF de ações da China (MSCI).',
  'TFLO': 'ETF de Treasuries com taxa flutuante.',
  'TLT': 'ETF de Treasuries longos (20+ anos).',
  'NOBL': 'ETF de Dividend Aristocrats do S&P 500.',
  'JEPQ': 'ETF com estratégia de opções sobre Nasdaq-100.',
  'SCHD': 'ETF de dividendos de alta qualidade (EUA).',
  'IWM': 'ETF de small caps (Russell 2000).'
};

const getNomeEmpresa = (ticker, setor) => {
  return COMPANY_NAMES[ticker] || `${ticker} - ${setor}`;
};

const getDescricaoEmpresa = (ticker, setor) => {
  return COMPANY_DESCRIPTIONS[ticker] || `Empresa do setor ${setor}.`;
};

const CUSTOM_LOGO_URLS = {
  XP: 'https://logo.clearbit.com/xpi.com.br',
  UNH: 'https://logo.clearbit.com/unitedhealthgroup.com'
};

// ✅ COMPONENTE DE AVATAR OTIMIZADO
const CompanyAvatar = React.memo(({ symbol, companyName, size = 120 }) => {
  const [imageUrl, setImageUrl] = React.useState(null);
  const [showFallback, setShowFallback] = React.useState(false);
  const [loadingStrategy, setLoadingStrategy] = React.useState(0);

  const strategies = useMemo(() => {
    const normalizedSymbol = (symbol ?? '').toUpperCase();
    const isFII = normalizedSymbol.includes('11') || normalizedSymbol.endsWith('11');

    if (isFII) {
      const localPath = `/assets/${normalizedSymbol}.png`;
      return [
        localPath,
        `https://www.ivalor.com.br/media/emp/logos/${normalizedSymbol.replace('11', '')}.png`,
        `https://ui-avatars.com/api/?name=${normalizedSymbol}&size=128&background=8b5cf6&color=ffffff&bold=true&format=png`
      ];
    }

    const isBrazilian = normalizedSymbol.match(/\d$/);

    if (isBrazilian) {
      const tickerBase = normalizedSymbol.replace(/\d+$/, '');
      return [
        `https://www.ivalor.com.br/media/emp/logos/${tickerBase}.png`,
        `https://logo.clearbit.com/${tickerBase.toLowerCase()}.com.br`,
        `https://logo.clearbit.com/${tickerBase.toLowerCase()}.com`,
        `https://ui-avatars.com/api/?name=${normalizedSymbol}&size=128&background=8b5cf6&color=ffffff&bold=true&format=png`
      ];
    } else {
      const knownLogos = {
        ...CUSTOM_LOGO_URLS,
        'AAPL': 'https://logo.clearbit.com/apple.com',
        'GOOGL': 'https://logo.clearbit.com/google.com',
        'META': 'https://logo.clearbit.com/meta.com',
        'NVDA': 'https://logo.clearbit.com/nvidia.com',
        'AMZN': 'https://logo.clearbit.com/amazon.com',
        'TSLA': 'https://logo.clearbit.com/tesla.com',
        'MSFT': 'https://logo.clearbit.com/microsoft.com',
        'COST': 'https://investidor10.com.br/storage/stocks/thumbnails/68b1ff2ada15e.jpg',
        'HD': 'https://investidor10.com.br/storage/stocks/thumbnails/68cabec7da51c.jpg',
        'AMAT': 'https://investidor10.com.br/storage/stocks/thumbnails/68c36de907ad7.jpg',
        'NNN': 'https://investidor10.com.br/storage/stocks/images/bCjcRXtnrz9lNF5E.jpg
      };

      const primaryUrl = knownLogos[normalizedSymbol] || `https://logo.clearbit.com/${normalizedSymbol.toLowerCase()}.com`;

      return [
        primaryUrl,
        `https://ui-avatars.com/api/?name=${normalizedSymbol}&size=128&background=8b5cf6&color=ffffff&bold=true&format=png`
      ];
    }
  }, [symbol]);

  React.useEffect(() => {
    setImageUrl(strategies[0]);
    setShowFallback(false);
    setLoadingStrategy(0);
  }, [symbol, strategies]);

  const handleImageError = useCallback(() => {
    if (loadingStrategy < strategies.length - 1) {
      const nextStrategy = loadingStrategy + 1;
      setLoadingStrategy(nextStrategy);
      setImageUrl(strategies[nextStrategy]);
    } else {
      setShowFallback(true);
    }
  }, [loadingStrategy, strategies]);

  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
      handleImageError();
      return;
    }
    setShowFallback(false);
  }, [handleImageError]);

  const containerStyle = useMemo(() => ({
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    border: '3px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size > 100 ? '2rem' : '1.5rem',
    fontWeight: 'bold',
    color: '#374151',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden'
  }), [size]);

  return (
    <div style={containerStyle}>
      <span style={{ 
        position: 'absolute', 
        zIndex: 1,
        fontSize: size > 100 ? '2rem' : '1.5rem',
        display: showFallback ? 'block' : 'none'
      }}>
        {symbol.slice(0, 2)}
      </span>
      
      {imageUrl && !showFallback && (
        <img
          src={imageUrl}
          alt={`Logo ${symbol}`}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 2,
            objectFit: 'cover'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
});

// ✅ MAPEAMENTO BDR OTIMIZADO
const BDR_MAPPING = {
  'NVDA': 'NVDC34', 'AAPL': 'AAPL34', 'AMZN': 'AMZO34', 'GOOGL': 'GOGL34',
  'GOOG': 'GOGL34', 'META': 'M1TA34', 'TSLA': 'TSLA34', 'MSFT': 'MSFT34',
  'AMD': 'A1MD34', 'NFLX': 'NFLX34', 'UBER': 'UBER34', 'PYPL': 'PYPL34',
  'CRM': 'SSFO34', 'ADBE': 'ADBE34', 'INTC': 'I1NT34', 'ORCL': 'ORCL34'
};

function getBDRFromAmericano(tickerAmericano) {
  return BDR_MAPPING[tickerAmericano] || null;
}

// ✅ FUNÇÕES DE CÁLCULO OTIMIZADAS
const calcularVies = (precoTeto, precoAtual, precoEntrada) => {
  const teto = typeof precoTeto === 'string' ? 
    parseFloat(precoTeto.replace(',', '.').replace('R$', '').trim()) : 
    precoTeto;
  
  const entrada = typeof precoEntrada === 'string' ? 
    parseFloat(precoEntrada.replace(',', '.').replace('R$', '').trim()) : 
    precoEntrada;
  
  const precoReferencia = precoAtual || entrada;
  
  if (!teto || !precoReferencia || isNaN(teto) || isNaN(precoReferencia)) {
    return { vies: 'N/A', cor: '#6b7280' };
  }
  
  if (precoReferencia >= teto) {
    return { vies: 'AGUARDAR', cor: '#f59e0b' };
  } else {
    return { vies: 'COMPRA', cor: '#22c55e' };
  }
};

const calcularViesBDR = (precoTetoBDR, precoBDR, cotacaoUSD) => {
  if (!precoTetoBDR || !precoBDR) {
    return { vies: 'N/A', cor: '#6b7280', explicacao: 'Dados insuficientes' };
  }

  const tetoNumerico = typeof precoTetoBDR === 'string' ? 
    parseFloat(precoTetoBDR.replace(',', '.').replace('R$', '').trim()) : 
    precoTetoBDR;

  if (isNaN(tetoNumerico) || tetoNumerico <= 0) {
    return { vies: 'N/A', cor: '#6b7280', explicacao: 'Preço teto inválido' };
  }

  if (precoBDR >= tetoNumerico) {
    return { 
      vies: 'AGUARDAR', 
      cor: '#f59e0b', 
      explicacao: 'BDR atingiu ou superou o preço teto' 
    };
  } else {
    const percentualParaTeto = ((tetoNumerico - precoBDR) / precoBDR) * 100;
    return { 
      vies: 'COMPRA', 
      cor: '#22c55e', 
      explicacao: `${percentualParaTeto.toFixed(1)}% de espaço até o teto` 
    };
  }
};

// ✅ COMPONENTES ESPECÍFICOS (COM LAZY LOADING INTERNO)

// FII Cards com In-View Loading
const FIISpecificCards = React.memo(({ ticker, dadosFII, loading, isFII }) => {
  const { isMobile, isMobileOrTablet } = useResponsive();
  const [containerRef, inView] = useInView();
  const ehFII = isFII || ticker.includes('11') || ticker.endsWith('11');
  
  if (!ehFII) return null;

  const formatarValor = useCallback((valor, tipo = 'currency') => {
    if (!valor || isNaN(valor)) return 'N/A';
    
    switch (tipo) {
      case 'currency': return `R$ ${valor.toFixed(2).replace('.', ',')}`;
      case 'percentage': return `${valor.toFixed(2)}%`;
      case 'billions': return `R$ ${(valor / 1000000000).toFixed(1)} B`;
      case 'millions': return `R$ ${(valor / 1000000).toFixed(1)} M`;
      case 'number': return valor.toFixed(2).replace('.', ',');
      default: return valor.toString();
    }
  }, []);

  return (
    <div ref={containerRef} style={{
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
        margin: '0 0 20px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        🏢 Informações sobre o FII
      </h3>

      {!inView ? (
        <SkeletonLoader variant="card" count={3} />
      ) : loading ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(3, 1fr)', 
          gap: isMobile ? '12px' : '16px'
        }}>          
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonLoader key={i} variant="metric" />
          ))}
        </div>
      ) : dadosFII ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(3, 1fr)', 
          gap: isMobile ? '12px' : '16px'
        }}>
          <MetricCard
            title="Dividend Yield"
            value={dadosFII.dividendYield12m ? formatarValor(dadosFII.dividendYield12m, 'percentage') : 'N/A'}
            loading={false}
          />
          <MetricCard
            title="Último Rendimento"
            value={dadosFII.ultimoRendimento ? formatarValor(dadosFII.ultimoRendimento) : 'N/A'}
            loading={false}
          />
          <MetricCard
            title="Patrimônio Líquido"
            value={dadosFII.patrimonioLiquido ? formatarValor(dadosFII.patrimonioLiquido, 'billions') : 'N/A'}
            loading={false}
          />
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(3, 1fr)',  
          gap: isMobile ? '12px' : '16px'
        }}>
          <MetricCard title="Dividend Yield" value="N/A" loading={false} />
          <MetricCard title="Último Rendimento" value="N/A" loading={false} />
          <MetricCard title="Patrimônio Líquido" value="N/A" loading={false} />
        </div>
      )}
    </div>
  );
});

// Agenda Corporativa com Loading Condicional
const AgendaCorporativa = React.memo(({ ticker, isFII = false }) => {
  const [containerRef, inView] = useInView();
  const { eventos, loading, error, refetch } = useAgendaCorporativaTicker(ticker || '');

  const calcularDiasAteEvento = useCallback((dataEvento) => {
    if (!dataEvento) return 0;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const evento = dataEvento instanceof Date ? dataEvento : new Date(dataEvento);
    if (isNaN(evento.getTime())) return 0;
    
    evento.setHours(0, 0, 0, 0);
    
    const diffTime = evento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, []);

  const formatarProximidade = useCallback((dias) => {
    if (dias < 0) return 'Passou';
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Amanhã';
    if (dias <= 7) return `Em ${dias} dias`;
    if (dias <= 30) return `Em ${Math.ceil(dias / 7)} semanas`;
    return `Em ${Math.ceil(dias / 30)} meses`;
  }, []);

  // Só renderiza se estiver na view e com ticker válido
  if (!inView || !ticker) {
    return (
      <div ref={containerRef} style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <SkeletonLoader variant="card" count={2} />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      marginBottom: '32px'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0'
        }}>
        Agenda Corporativa
        </h3>
      </div>

      {!ticker ? (
        <SkeletonLoader variant="card" count={2} />
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <div style={{ color: '#64748b', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
            <p>Carregando eventos...</p>
          </div>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#ef4444' }}>
          <h4 style={{ marginBottom: '16px' }}>❌ Erro ao carregar eventos</h4>
          <p style={{ marginBottom: '24px', fontSize: '14px' }}>{error}</p>
        </div>
      ) : eventos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
          <h4 style={{ marginBottom: '16px' }}>📭 Nenhum evento encontrado para {ticker}</h4>
          <p style={{ marginBottom: '24px' }}>ℹ️ Não há eventos cadastrados para este ticker</p>
        </div>
      ) : (
        <div>
          {eventos.slice(0, 4).map((evento, index) => {
            const diasAteEvento = calcularDiasAteEvento(evento.dataObj);
            const proximidade = formatarProximidade(diasAteEvento);
            
            return (
<div key={evento.id} style={{ 
  border: '1px solid #e2e8f0', 
  borderRadius: '8px',
  backgroundColor: 'white',
  marginBottom: '12px',
  padding: '20px',
  borderLeftWidth: diasAteEvento <= 7 && diasAteEvento >= 0 ? '4px' : '1px',
  borderLeftColor: diasAteEvento <= 7 && diasAteEvento >= 0 ? '#f59e0b' : '#e2e8f0'
}}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ flex: 1 }}>
      <h4 style={{
        fontSize: '16px',
        fontWeight: '600',
        margin: '0 0 8px 0',
        color: '#1e293b'
      }}>
        {evento.titulo}
      </h4>
      
      <p style={{
        fontSize: '14px',
        color: '#64748b',
        margin: '0 0 12px 0',
        lineHeight: '1.4'
      }}>
        {evento.descricao}
      </p>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{
          backgroundColor: diasAteEvento < 0 ? '#d1d5db' : diasAteEvento <= 7 ? '#f59e0b' : '#3b82f6',
          color: diasAteEvento < 0 ? '#6b7280' : 'white',
          fontSize: '12px',
          fontWeight: '500',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          {proximidade}
        </span>
        
        <span style={{
          fontSize: '12px',
          border: '1px solid #d1d5db',
          color: '#6b7280',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          {evento.tipo}
        </span>
      </div>
    </div>

    <div style={{ 
      textAlign: 'right',
      minWidth: '120px',
      marginLeft: '20px'
    }}>
      <div style={{ 
        fontSize: '28px',
        fontWeight: '700',
        color: diasAteEvento < 0 ? '#9ca3af' : diasAteEvento <= 7 ? '#f59e0b' : '#3b82f6',
        lineHeight: '1'
      }}>
        {evento.dataObj ? (
          evento.dataObj instanceof Date ? 
            evento.dataObj.getDate() :
            new Date(evento.dataObj).getDate()
        ) : 'N/A'}
      </div>
      <div style={{ 
        fontSize: '14px',
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {evento.dataObj ? (
          evento.dataObj instanceof Date ? 
            evento.dataObj.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) :
            new Date(evento.dataObj).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        ) : 'N/A'}
      </div>
    </div>
  </div>
</div>
            );
          })}
        </div>
      )}
    </div>
  );
});

// Dados da Posição com Memoização
const DadosPosicaoExpandidos = React.memo(({ 
  empresa, 
  dadosFinanceiros, 
  precoAtualFormatado,
  isFII = false,
  distanciaPrecoTeto,
  percentualCarteira, 
  carteiraConfig
}) => {
  const { isMobile, isMobileOrTablet } = useResponsive();
  const precoAtual = dadosFinanceiros?.precoAtual || null;

  const viesCalculado = useMemo(() => {
    return calcularVies(empresa.precoTeto, precoAtual, empresa.precoEntrada);
  }, [empresa.precoTeto, precoAtual, empresa.precoEntrada]);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', 
      gap: isMobile ? '16px' : '24px', 
      marginBottom: '32px' 
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: isMobile ? '20px' : '32px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: isMobile ? '16px' : '18px', 
          marginBottom: isMobile ? '16px' : '24px', 
          fontWeight: '600' 
        }}>
        Dados da Posição
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: isMobile ? '8px 12px' : '12px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '4px' : '0'
          }}>
            <span style={{ fontSize: isMobile ? '12px' : '14px', color: '#64748b' }}>Data de Entrada</span>
            <span style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '600' }}>{empresa.dataEntrada}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: isMobile ? '8px 12px' : '12px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '4px' : '0'
          }}>
            <span style={{ fontSize: isMobile ? '12px' : '14px', color: '#64748b' }}>Preço de Entrada</span>
            <span style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '600' }}>
              {typeof empresa.precoEntrada === 'number' 
                ? formatCurrency(empresa.precoEntrada, carteiraConfig.moeda)
                : empresa.precoEntrada || 'N/A'
              }
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: isMobile ? '8px 12px' : '12px', 
            backgroundColor: dadosFinanceiros?.precoAtual ? '#e8f5e8' : '#f8fafc', 
            borderRadius: '8px',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '4px' : '0'
          }}>
            <span style={{ fontSize: isMobile ? '12px' : '14px', color: '#64748b' }}>Preço Atual</span>
            <span style={{ 
              fontSize: isMobile ? '12px' : '14px', 
              fontWeight: '600', 
              color: dadosFinanceiros?.precoAtual ? '#22c55e' : 'inherit' 
            }}>
              {precoAtualFormatado}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: isMobile ? '20px' : '32px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: isMobile ? '16px' : '18px', 
          marginBottom: isMobile ? '16px' : '24px', 
          fontWeight: '600' 
        }}>
        Análise de Viés
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: isMobile ? '8px 12px' : '12px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '4px' : '0'
          }}>
            <span style={{ fontSize: isMobile ? '12px' : '14px', color: '#64748b' }}>Preço Teto</span>
            <span style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '600' }}>
              {typeof empresa.precoTeto === 'number' 
                ? formatCurrency(empresa.precoTeto, carteiraConfig.moeda)
                : empresa.precoTeto || 'N/A'
              }
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: isMobile ? '8px 12px' : '12px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '4px' : '0',
            alignItems: isMobile ? 'flex-start' : 'center'
          }}>
            <span style={{ fontSize: isMobile ? '12px' : '14px', color: '#64748b' }}>Viés Calculado</span>
            <span style={{
              backgroundColor: viesCalculado.cor,
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: '600',
              alignSelf: isMobile ? 'flex-start' : 'auto'
            }}>
              {viesCalculado.vies}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: isMobile ? '8px 12px' : '12px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '4px' : '0'
          }}>
            <span style={{ fontSize: isMobile ? '12px' : '14px', color: '#64748b' }}>% da Carteira</span>
            <span style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '600' }}>{percentualCarteira || 'N/A'}</span>
          </div>
          
          {distanciaPrecoTeto !== null && distanciaPrecoTeto !== undefined && (
            <div style={{ 
              padding: isMobile ? '10px 12px' : '12px', 
              backgroundColor: distanciaPrecoTeto > 0 ? '#f0f9ff' : '#fef2f2', 
              borderRadius: '8px',
              border: `1px solid ${distanciaPrecoTeto > 0 ? '#bfdbfe' : '#fecaca'}`
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '4px' : '0'
              }}>
                <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#64748b' }}>
                  Distância do Teto:
                </span>
                <span style={{ 
                  fontSize: isMobile ? '12px' : '14px', 
                  fontWeight: '600',
                  color: distanciaPrecoTeto > 0 ? '#1d4ed8' : '#dc2626'
                }}>
                  {distanciaPrecoTeto > 0 ? '+' : ''}{distanciaPrecoTeto.toFixed(1)}%
                </span>
              </div>
              <p style={{ 
                fontSize: isMobile ? '10px' : '11px', 
                color: '#64748b', 
                margin: '4px 0 0 0',
                fontStyle: 'italic',
                lineHeight: '1.3'
              }}>
                {distanciaPrecoTeto > 0 
                  ? '📈 Preço atual está abaixo do teto - espaço para valorização'
                  : '🚨 Preço atual atingiu ou superou o teto'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Histórico de Dividendos com Virtual Scrolling
const HistoricoDividendos = React.memo(({ ticker, dataEntrada, dataSaida, isFII = false }) => {
  const [containerRef, inView] = useInView();
  const [proventos, setProventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fonte, setFonte] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  const { isMobile } = useResponsive();
  const isInternacional = useMemo(() => !/\d$/.test(ticker ?? ''), [ticker]);
  const moeda = useMemo(() => (isInternacional ? 'USD' : 'BRL'), [isInternacional]);

  const normalizarData = useCallback((valor) => {
    if (!valor) return null;

    let data = null;

    if (valor instanceof Date) {
      data = new Date(valor.getTime());
    } else if (typeof valor === 'string') {
      const valorString = valor.trim();
      const formatoBR = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = valorString.match(formatoBR);

      if (match) {
        const [, diaStr, mesStr, anoStr] = match;
        const dia = Number(diaStr);
        const mesIndex = Number(mesStr) - 1;
        const ano = Number(anoStr);
        const dataBrasil = new Date(ano, mesIndex, dia);

        if (
          !Number.isNaN(dia) &&
          !Number.isNaN(mesIndex) &&
          !Number.isNaN(ano) &&
          dataBrasil.getFullYear() === ano &&
          dataBrasil.getMonth() === mesIndex &&
          dataBrasil.getDate() === dia
        ) {
          data = dataBrasil;
        }
      }

      if (!data) {
        const dataParseada = new Date(valorString);
        data = isNaN(dataParseada.getTime()) ? null : dataParseada;
      }
    } else {
      const dataGenerica = new Date(valor);
      data = isNaN(dataGenerica.getTime()) ? null : dataGenerica;
    }

    if (!data) return null;

    data.setHours(0, 0, 0, 0);
    return data;
  }, []);

  const criarDataFallback = useCallback(() => {
    const agora = new Date();
    agora.setHours(0, 0, 0, 0);
    return agora;
  }, []);

  const dataEntradaNormalizada = useMemo(() => normalizarData(dataEntrada), [dataEntrada, normalizarData]);
  const dataSaidaNormalizada = useMemo(() => normalizarData(dataSaida), [dataSaida, normalizarData]);

  const processarProventos = useCallback((listaProventos) => {
    if (!Array.isArray(listaProventos)) return [];

    return listaProventos
      .map((item) => {
        const valorNumerico = typeof item.valor === 'number' ? item.valor : Number(item.valor ?? 0) || 0;
        const dataBruta = item.dataObj ?? item.dataCom ?? item.data;
        const dataNormalizada = normalizarData(dataBruta) || criarDataFallback();

        const valorParaFormatacao = Number.isFinite(valorNumerico) ? valorNumerico : 0;

        return {
          ...item,
          valor: valorNumerico,
          dataObj: dataNormalizada,
          valorFormatado: formatCurrency(valorParaFormatacao, moeda),
          tipo: item.tipo || (isFII ? 'Rendimento' : 'Dividendo')
        };
      })
      .filter((item) => {
        if (!item.dataObj) return false;

        const dataValida = item.dataObj instanceof Date ? item.dataObj : normalizarData(item.dataObj);
        if (!dataValida || isNaN(dataValida.getTime())) return false;

        if (!item.valor || item.valor <= 0) return false;

        if (dataEntradaNormalizada && dataValida.getTime() < dataEntradaNormalizada.getTime()) return false;
        if (dataSaidaNormalizada && dataValida.getTime() > dataSaidaNormalizada.getTime()) return false;

        item.dataObj = dataValida;
        return true;
      })
      .sort((a, b) => {
        const dataA = a.dataObj instanceof Date ? a.dataObj : normalizarData(a.dataObj) || criarDataFallback();
        const dataB = b.dataObj instanceof Date ? b.dataObj : normalizarData(b.dataObj) || criarDataFallback();

        return dataB.getTime() - dataA.getTime();
      });
  }, [criarDataFallback, dataEntradaNormalizada, dataSaidaNormalizada, isFII, moeda, normalizarData]);

  useEffect(() => {
    if (!inView || !ticker) return;

    const carregarProventos = async () => {
      try {
        setLoading(true);

        // Tentar cache primeiro
        const cached = cacheUtils.get(`proventos_${ticker}`);
        if (cached) {
          const proventosProcessados = processarProventos(cached);
          setProventos(proventosProcessados);
          setFonte('cache');
          setPaginaAtual(1);
          setLoading(false);
          return;
        }

        let proventosEncontrados = [];
        let fonteAtual = '';

        // Tentar API primeiro
        try {
          const response = await fetch(`/api/proventos/${ticker}`);
          
          if (response.ok) {
            const dadosAPI = await response.json();
            
            if (Array.isArray(dadosAPI) && dadosAPI.length > 0) {
              proventosEncontrados = dadosAPI;
              fonteAtual = 'API';
            }
          }
        } catch (apiError) {
          console.warn('Erro na API:', apiError);
        }

        // Fallback para localStorage
        if (proventosEncontrados.length === 0) {
          const dadosSalvos = localStorage.getItem(`proventos_${ticker}`);
          if (dadosSalvos) {
            try {
              const proventosSalvos = JSON.parse(dadosSalvos);
              proventosEncontrados = proventosSalvos;
              fonteAtual = 'localStorage';
            } catch (err) {
              console.error('Erro localStorage:', err);
            }
          }
        }

        const proventosProcessados = processarProventos(proventosEncontrados);

        setProventos(proventosProcessados);
        setFonte(fonteAtual || 'sem dados');
        setPaginaAtual(1);

        // Cache os dados válidos
        if (proventosProcessados.length > 0) {
          cacheUtils.set(`proventos_${ticker}`, proventosProcessados);
        }

      } catch (error) {
        console.error('Erro geral:', error);
        setProventos([]);
        setFonte('erro');
      } finally {
        setLoading(false);
      }
    };

    carregarProventos();
  }, [ticker, inView, processarProventos]);

  const { totalProventos, mediaProvento, ultimoProvento } = useMemo(() => {
    const total = proventos.reduce((sum, item) => sum + (item.valor || 0), 0);
    const media = proventos.length > 0 ? total / proventos.length : 0;
    let ultimo = null;
    
    if (proventos.length > 0) {
      ultimo = proventos[0];
      // Garantir que o último provento tem uma data válida
      if (ultimo && ultimo.dataObj) {
        if (!(ultimo.dataObj instanceof Date)) {
          ultimo.dataObj = new Date(ultimo.dataObj);
        }
        if (isNaN(ultimo.dataObj.getTime())) {
          ultimo.dataObj = new Date();
        }
      }
    }

    return {
      totalProventos: total,
      mediaProvento: media,
      ultimoProvento: ultimo
    };
  }, [proventos]);

  const totalPaginas = Math.ceil(proventos.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const proventosExibidos = proventos.slice(indiceInicio, indiceFim);

  return (
    <div ref={containerRef} style={{
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
          {isFII ? 'Histórico de Rendimentos (FII)' : 'Histórico de Proventos'}
        </h3>
        
      </div>

      {!inView ? (
        <SkeletonLoader variant="card" count={3} />
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
          <div style={{ marginBottom: '16px', fontSize: '24px' }}>⏳</div>
          <p>Carregando proventos de {ticker}...</p>
        </div>
      ) : proventos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
          <p>
            {isFII ? `❌ Nenhum rendimento carregado para ${ticker}` : `❌ Nenhum provento carregado para ${ticker}`}
          </p>
        </div>
      ) : (
        <>
          <ResponsiveGrid minCardWidth={200} gap={16}>
            <MetricCard
              title={isMobile ? 'Pagamentos' : 'Nº de Pagamentos'}
              value={proventos.length.toString()}
              color="#9ca3af"
            />
            <MetricCard
              title="Total"
              value={formatCurrency(totalProventos, moeda)}
              color="#9ca3af"
            />
            <MetricCard
              title="Média"
              value={formatCurrency(mediaProvento, moeda)}
              color="#9ca3af"
            />
            <MetricCard
              title="Último"
              value={ultimoProvento && ultimoProvento.dataObj ? 
                (ultimoProvento.dataObj instanceof Date ? 
                  ultimoProvento.dataObj.toLocaleDateString('pt-BR').replace(/\/\d{4}/, '') : 
                  new Date(ultimoProvento.dataObj).toLocaleDateString('pt-BR').replace(/\/\d{4}/, '')
                ) : 'N/A'
              }
              color="#9ca3af"
            />
          </ResponsiveGrid>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            overflowX: isMobile ? 'auto' : 'visible'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              minWidth: isMobile ? '600px' : '100%'
            }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ 
                    padding: isMobile ? '10px 8px' : '12px',
                    textAlign: 'left', 
                    fontWeight: '700', 
                    fontSize: isMobile ? '12px' : '14px'
                  }}>
                    Ativo
                  </th>
                  <th style={{ 
                    padding: isMobile ? '10px 8px' : '12px',
                    textAlign: 'right', 
                    fontWeight: '700', 
                    fontSize: isMobile ? '12px' : '14px'
                  }}>
                    Valor
                  </th>
                  <th style={{ 
                    padding: isMobile ? '10px 8px' : '12px',
                    textAlign: 'center', 
                    fontWeight: '700', 
                    fontSize: isMobile ? '12px' : '14px'
                  }}>
                    Data
                  </th>
                  <th style={{ 
                    padding: isMobile ? '10px 8px' : '12px',
                    textAlign: 'center', 
                    fontWeight: '700', 
                    fontSize: isMobile ? '12px' : '14px'
                  }}>
                    Tipo
                  </th>
                </tr>
              </thead>
              <tbody>
                {proventosExibidos.map((provento, index) => (
                  <tr 
                    key={`${provento.id || provento.data}-${index}`} 
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                  >
                    <td style={{ 
                      padding: isMobile ? '10px 8px' : '12px',
                      fontWeight: '500',
                      fontSize: isMobile ? '13px' : '14px'
                    }}>
                      {ticker}
                    </td>
                    <td style={{ 
                      padding: isMobile ? '10px 8px' : '12px',
                      textAlign: 'right', 
                      fontWeight: '700', 
                      color: '#22c55e',
                      fontSize: isMobile ? '13px' : '14px'
                    }}>
                      {provento.valorFormatado}
                    </td>
                    <td style={{ 
                      padding: isMobile ? '10px 8px' : '12px',
                      textAlign: 'center', 
                      fontWeight: '500',
                      fontSize: isMobile ? '12px' : '14px'
                    }}>
                      {provento.dataObj ? (
                        provento.dataObj instanceof Date ? 
                          provento.dataObj.toLocaleDateString('pt-BR') :
                          new Date(provento.dataObj).toLocaleDateString('pt-BR')
                      ) : 'N/A'}
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
                          ? (provento.tipo || (isFII ? 'Rend' : 'Div')).substring(0, 4)
                          : (provento.tipo || (isFII ? 'Rendimento' : 'Dividendo'))
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '24px',
              gap: '8px'
            }}>
              <button
                onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                disabled={paginaAtual === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: paginaAtual === 1 ? '#f8fafc' : '#ffffff',
                  color: paginaAtual === 1 ? '#9ca3af' : '#374151',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Anterior
              </button>

              <span style={{ padding: '0 16px', fontSize: '14px', color: '#64748b' }}>
                {paginaAtual} de {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                disabled={paginaAtual === totalPaginas}
                style={{
                  padding: '8px 16px',
                  backgroundColor: paginaAtual === totalPaginas ? '#f8fafc' : '#ffffff',
                  color: paginaAtual === totalPaginas ? '#9ca3af' : '#374151',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer'
                }}
              >
                Próximo
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

// BDR Americano Info com Lazy Loading
const BDRAmericanoInfo = React.memo(({ 
  ticker, 
  bdrCorrespondente, 
  temBDR, 
  bdrData, 
  bdrLoading,
  precoTetoBDR,
  cotacaoUSD,
  loadingUSD = false,
  atualizacaoUSD,
  refetchUSD
}) => {
  
  if (!temBDR || !bdrCorrespondente) {
    return null;
  }

  const viesBDR = useMemo(() => {
    return precoTetoBDR && bdrData?.price ? 
      calcularViesBDR(precoTetoBDR, bdrData.price, cotacaoUSD) : null;
  }, [precoTetoBDR, bdrData?.price, cotacaoUSD]);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      marginBottom: '32px'
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#1e293b',
        margin: '0 0 20px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🇧🇷 BDR Disponível no Brasil
        <span style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '4px',
          padding: '2px 8px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          DISPONÍVEL
        </span>
      </h3>

      <ResponsiveGrid minCardWidth={200} gap={16}>
        <MetricCard
          title="Ativo Original (EUA)"
          value={ticker}
          subtitle="Mercado Americano"
          color="#15803d"
        />
        
        <MetricCard
          title="BDR Brasileiro"
          value={bdrCorrespondente}
          subtitle="Negociado na B3"
          color="#15803d"
        />

        {bdrData && bdrData.price && (
          <>
            <MetricCard
              title="Preço BDR (R$)"
              value={`R$ ${bdrData.price.toFixed(2).replace('.', ',')}`}
              color="#22c55e"
            />

            <MetricCard
              title="Variação BDR"
              value={`${(bdrData.changePercent || 0) >= 0 ? '+' : ''}${(bdrData.changePercent || 0).toFixed(2)}%`}
              color={(bdrData.changePercent || 0) >= 0 ? '#22c55e' : '#ef4444'}
            />
          </>
        )}

        {cotacaoUSD && (
          <MetricCard
            title="USD/BRL"
            value={`R$ ${cotacaoUSD.toFixed(2).replace('.', ',')}`}
            subtitle="Dólar hoje"
            color="#6366f1"
          />
        )}
      </ResponsiveGrid>

      {bdrLoading && (
        <div style={{ 
          marginTop: '16px',
          textAlign: 'center', 
          padding: '16px',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #bbf7d0'
        }}>
          <span style={{ color: '#15803d', fontSize: '14px' }}>⏳ Carregando cotação do BDR...</span>
        </div>
      )}
    </div>
  );
});

// Gerenciador de Relatórios com In-View Loading
const GerenciadorRelatorios = React.memo(({ ticker }) => {
  const [containerRef, inView] = useInView();
  const {
    estatisticas,
    loading,
    error,
    carregarEstatisticas
  } = useRelatoriosEstatisticas();
  const { isMobile } = useResponsive();

  const relatoriosDoTicker = useMemo(() => {
    if (!ticker || !estatisticas.relatorios) return [];
    
    return estatisticas.relatorios
      .filter(rel => rel.ticker === ticker)
      .map(rel => ({
        ...rel,
        arquivo: rel.arquivoPdf ? 'PDF_API' : undefined,
        tamanho: rel.tamanhoArquivo ? `${(rel.tamanhoArquivo / 1024 / 1024).toFixed(1)} MB` : undefined
      }))
      .sort((a, b) => {
        const dateA = a.dataUpload ? new Date(a.dataUpload) : new Date(0);
        const dateB = b.dataUpload ? new Date(b.dataUpload) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  }, [ticker, estatisticas.relatorios]);

  useEffect(() => {
    if (inView) {
      carregarEstatisticas();
    }
  }, [inView, carregarEstatisticas]);

  const actionButtonStyle = useMemo(() => ({
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.2s ease, transform 0.2s ease'
  }), []);

  const handleButtonHover = useCallback((event) => {
    event.currentTarget.style.backgroundColor = '#e2e8f0';
    event.currentTarget.style.transform = 'translateY(-1px)';
  }, []);

  const handleButtonLeave = useCallback((event) => {
    event.currentTarget.style.backgroundColor = '#f8fafc';
    event.currentTarget.style.transform = 'translateY(0)';
  }, []);

  const visualizarRelatorio = useCallback((relatorio) => {
    if (relatorio.arquivoPdf && relatorio.tipoPdf === 'base64') {
      try {
        const base64Clean = relatorio.arquivoPdf.replace('data:application/pdf;base64,', '');
        const binaryString = atob(base64Clean);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const newWindow = window.open(url, '_blank');
        
        if (newWindow) {
          setTimeout(() => URL.revokeObjectURL(url), 30000);
          
          const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (isMobile) {
            setTimeout(() => {
              alert('📱 PDF aberto para visualização!\n\nPara salvar: use o botão de compartilhar (📤) do navegador');
            }, 1000);
          }
        } else {
          alert('🚫 Popup bloqueado! Permita popups para visualizar o PDF.');
        }
        
        return;
        
      } catch (error) {
        console.error('❌ Erro ao abrir PDF para visualização:', error);
      }
    }
    
    if (relatorio.tipoVisualizacao === 'link' && relatorio.linkExterno) {
      window.open(relatorio.linkExterno, '_blank');
      return;
    }
    
    if (relatorio.tipoVisualizacao === 'canva' && relatorio.linkCanva) {
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        if (confirm('🎨 Abrir no Canva?\n\n📱 Pode abrir o app do Canva se instalado.\n\nClique OK para continuar ou Cancelar para tentar outra opção.')) {
          window.open(relatorio.linkCanva, '_blank');
        } else {
          alert('💡 Alternativa: Use o botão "📥 PDF" para baixar a versão em PDF se disponível.');
        }
      } else {
        window.open(relatorio.linkCanva, '_blank');
      }
      return;
    }
    
    if (relatorio.linkExterno) {
      window.open(relatorio.linkExterno, '_blank');
    } else if (relatorio.linkCanva) {
      window.open(relatorio.linkCanva, '_blank');
    } else {
      alert('📋 Link de visualização não disponível para este relatório');
    }
  }, []);

  const downloadPDF = useCallback((relatorio) => {
    if (!relatorio.arquivoPdf || relatorio.tipoPdf !== 'base64') {
      if (relatorio.tipoPdf === 'referencia') {
        alert('📋 PDF grande - solicite re-upload na Central de Relatórios');
      } else {
        alert('📋 PDF não disponível para este relatório');
      }
      return;
    }

    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isMobile = isIOS || isAndroid;
      
      const nomeArquivo = relatorio.nomeArquivoPdf || `${relatorio.ticker}_${relatorio.nome}.pdf`;
      
      if (!relatorio.arquivoPdf.startsWith('data:application/pdf;base64,')) {
        alert('❌ Formato de PDF inválido. Tente fazer re-upload do arquivo.');
        return;
      }
      
      if (isMobile) {
        try {
          const base64Clean = relatorio.arquivoPdf.replace('data:application/pdf;base64,', '');
          const binaryString = atob(base64Clean);
          const bytes = new Uint8Array(binaryString.length);
          
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          if (isIOS) {
            const newWindow = window.open(url, '_blank');
            if (newWindow) {
              setTimeout(() => {
                alert('📱 PDF aberto em nova aba!\n\nPara salvar no iPhone:\n1. Toque no ícone de compartilhar (📤)\n2. Escolha "Salvar em Arquivos"');
              }, 1000);
            } else {
              alert('🚫 Popup bloqueado! Permita popups nas configurações do Safari.');
            }
          } else {
            const link = document.createElement('a');
            link.href = url;
            link.download = nomeArquivo;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => {
              if (confirm('📱 Se o download não apareceu, deseja abrir o PDF em nova aba?')) {
                window.open(url, '_blank');
              }
            }, 2000);
          }
          
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          
        } catch (error) {
          alert('❌ Erro ao processar PDF no mobile. Tente fazer re-upload do arquivo.');
        }
        
      } else {
        try {
          const base64Clean = relatorio.arquivoPdf.replace('data:application/pdf;base64,', '');
          const binaryString = atob(base64Clean);
          const bytes = new Uint8Array(binaryString.length);
          
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = nomeArquivo;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          
        } catch (error) {
          alert('❌ Erro ao processar PDF. Verifique se o arquivo não está corrompido.');
        }
      }
      
    } catch (error) {
      alert('❌ Erro ao baixar PDF: ' + error.message);
    }
  }, []);

  return (
    <div ref={containerRef} style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      marginBottom: '24px'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0 0 4px 0'
        }}>
        Relatórios da Empresa
        </h3>
      </div>

      {!inView ? (
        <SkeletonLoader variant="card" count={2} />
      ) : loading ? (
        <div style={{
          textAlign: 'center',
          padding: '24px',
          color: '#64748b'
        }}>
          <div style={{ marginBottom: '12px', fontSize: '24px' }}>⏳</div>
          <p style={{ fontSize: '14px', margin: '0' }}>
            Carregando relatórios de {ticker}...
          </p>
        </div>
      ) : error ? (
        <div style={{
          textAlign: 'center',
          padding: '24px',
          color: '#dc2626'
        }}>
          <div style={{ marginBottom: '12px', fontSize: '24px' }}>⚠️</div>
          <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>
            <strong>Erro ao carregar relatórios</strong>
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
            {error}
          </p>
          <button
            onClick={carregarEstatisticas}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Tentar Novamente
          </button>
        </div>
      ) : relatoriosDoTicker.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
          <div style={{ marginBottom: '16px', fontSize: '48px' }}>📭</div>
          <h4 style={{ 
            marginBottom: '8px', 
            color: '#1e293b',
            fontSize: '16px' 
          }}>
            Nenhum relatório encontrado
          </h4>
          <p style={{ 
            marginBottom: '16px',
            fontSize: '14px' 
          }}>
            Não há relatórios para <strong>{ticker}</strong>
          </p>
          <p style={{ 
            fontSize: '12px', 
            color: '#94a3b8', 
            marginBottom: '20px' 
          }}>
            💡 Adicione relatórios através da Central de Relatórios
          </p>
        </div>
      ) : (
        <div>
          {relatoriosDoTicker.map((relatorio, index) => (
            <div
              key={relatorio.id || index}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                marginBottom: '12px',
                backgroundColor: 'white',
                padding: '16px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  gap: '16px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      margin: '0 0 4px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b',
                      lineHeight: '1.3'
                    }}
                  >
                    {relatorio.nome}
                  </h4>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#64748b',
                      marginBottom: '4px'
                    }}
                  >
                    {relatorio.tipo} • {relatorio.dataReferencia}
                  </div>
                  {relatorio.tamanho && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#94a3b8'
                      }}
                    >
                      📄 {relatorio.tamanho}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '8px',
                    justifyContent: isMobile ? 'flex-start' : 'flex-end',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  {relatorio.arquivoPdf && relatorio.tipoPdf === 'base64' && (
                    <button
                      onClick={() => downloadPDF(relatorio)}
                      onMouseEnter={handleButtonHover}
                      onMouseLeave={handleButtonLeave}
                      style={{
                        ...actionButtonStyle,
                        flex: isMobile ? 1 : undefined
                      }}
                    >
                      <Download size={16} />
                      Baixar PDF
                    </button>
                  )}

                  <button
                    onClick={() => visualizarRelatorio(relatorio)}
                    onMouseEnter={handleButtonHover}
                    onMouseLeave={handleButtonLeave}
                    style={{
                      ...actionButtonStyle,
                      flex: isMobile ? 1 : undefined
                    }}
                  >
                    <ExternalLink size={16} />
                    Abrir relatório
                  </button>
                </div>
              </div>

              <div
                style={{
                  fontSize: '10px',
                  color: '#64748b',
                  textAlign: 'center',
                  marginTop: '6px'
                }}
              >
                Adicionado em: {relatorio.dataUpload ?
                  (typeof relatorio.dataUpload === 'string' ?
                    new Date(relatorio.dataUpload).toLocaleDateString('pt-BR') :
                    relatorio.dataUpload.toLocaleDateString('pt-BR')
                  ) : 'N/A'
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// ========================================
// COMPONENTE PRINCIPAL OTIMIZADO
// ========================================
export default function AtivoPage() {
  const params = useParams();
  const router = useRouter();
  const {
    dados,
    CARTEIRAS_CONFIG,
    cotacoes,
    buscarCotacoes
  } = useDataStore();
  const { planInfo } = useAuthAccess();

  const ticker = params?.ticker?.toString().toUpperCase();
  const { isMobile, isMobileOrTablet } = useResponsive();
  // Temporarily disable the company reports card until it's ready to be reused.
  const mostrarRelatoriosEmpresa = false;
  const carteirasPossiveis = useMemo(
    () => (ticker ? getCarteirasForTicker(ticker, dados) : []),
    [ticker, dados]
  );
  const podeAcessarCarteira = useCallback(
    (carteira: CarteiraKey) => {
      const permission = CARTEIRA_PERMISSION_MAP[carteira];

      if (!permission) {
        return true;
      }

      if (!planInfo?.pages || planInfo.pages.length === 0) {
        return true;
      }

      return planInfo.pages.includes(permission);
    },
    [planInfo?.pages]
  );

  // ✅ ESTADOS BÁSICOS
  const [ativo, setAtivo] = useState(null);
  const [carteira, setCarteira] = useState(null);
  const [loading, setLoading] = useState(true);
  const deveNegarAcesso = useMemo(() => {
    if (!ticker) return false;
    if (carteirasPossiveis.length === 0) return false;
    if (!planInfo?.pages || planInfo.pages.length === 0) return false;

    return !carteirasPossiveis.some(carteira => podeAcessarCarteira(carteira));
  }, [carteirasPossiveis, planInfo?.pages, podeAcessarCarteira, ticker]);

  useEffect(() => {
    if (!deveNegarAcesso) {
      return;
    }

    cacheUtils.clear(`ativo_${ticker}`);
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Falha ao limpar sessionStorage:', error);
    }
    setAtivo(null);
    setCarteira(null);
    setLoading(false);
  }, [deveNegarAcesso, ticker]);

  // ✅ DETECTORES DE TIPO DE ATIVO (MEMOIZADOS) - Só executa se ticker existe
  const tipoAtivo = useMemo<TipoAtivo>(() => {
    if (!ticker) {
      return {
        ehBDREstrangeiro: false,
        tickerEstrangeiro: null,
        bdrCorrespondente: null,
        temBDR: false,
        ehETF: false,
        ehFII: false,
        ehREIT: false
      };
    }

    const ehBDREstrangeiro = isBDREstrangeiro(ticker);
    const tickerEstrangeiro = ehBDREstrangeiro ? getEstrangeiroFromBDR(ticker) : null;
    const bdrCorrespondente = getBDRFromAmericano(ticker);
    const temBDR = !!bdrCorrespondente;
    const ehETF = isETF(ticker);
    const ehFII = ticker.includes('11') || ticker.endsWith('11');
    const ehREIT = isREIT(ticker);

    return {
      ehBDREstrangeiro,
      tickerEstrangeiro,
      bdrCorrespondente,
      temBDR,
      ehETF,
      ehFII,
      ehREIT
    };
  }, [ticker]);

  // ✅ HOOKS CONDICIONAIS OTIMIZADOS (sempre chamados, mas com parâmetros condicionais)
  const { cotacaoUSD, loading: loadingUSD, ultimaAtualizacao: atualizacaoUSD, refetch: refetchUSD } = useCotacaoUSD();
  
  // Dados básicos sempre carregados
  const { dadosFinanceiros, loading: dadosLoading, error: dadosError, ultimaAtualizacao, refetch } = useDadosFinanceiros(ticker || '');
  const { cotacaoCompleta, loading: loadingCotacao, error: errorCotacao } = useCotacaoCompleta(ticker || '', tipoAtivo.ehBDREstrangeiro);
  
  // Dados condicionais baseados no tipo (sempre chamados, mas podem retornar null)
  const { dadosFII: dadosFIIHGBrasil, loading: loadingFIIHGBrasil } = useHGBrasilFII(
    tipoAtivo.ehFII ? ticker : ''
  );
  
  const { dadosHGBrasil, loading: loadingHGBrasil } = useHGBrasilAcoes(
    (ticker?.match(/\d$/) && !ticker.includes('11')) ? ticker : ''
  );
  
  const { dadosYahoo, loading: loadingYahoo } = useYahooFinanceInternacional(
    (!ticker?.match(/\d$/) || tipoAtivo.ehBDREstrangeiro) ? ticker : ''
  );
  
  const { bdrData, bdrLoading } = useDadosBDR(
    tipoAtivo.ehBDREstrangeiro ? ticker : ''
  );
  
  const { bdrData: bdrDataAPI, bdrLoading: bdrLoadingAPI } = useBDRDataAPI(
    tipoAtivo.temBDR ? tipoAtivo.bdrCorrespondente : ''
  );
  
  const { etfData: etfBRAPIData, loading: loadingETFBRAPI } = useBRAPIETF(
    tipoAtivo.ehETF ? ticker : ''
  );

  // ✅ HOOKS INTEGRADOS (sempre chamados)
  const { dy12Meses, dyFormatado, loading: loadingDY, fonte: fonteDY } = useDividendYieldIntegrado(ticker || '');
  const { valorProventos, performanceProventos, loading: loadingProventos, fonte: fonteProventos } = useProventosIntegrado(
    ticker || '',
    ativo?.dataEntrada || '', 
    ativo?.precoEntrada
  );

  // ✅ LOADING PROGRESSIVO
  const loadingStages = useProgressiveLoading([
    loading,
    dadosLoading && !dadosFinanceiros,
    loadingCotacao && !cotacaoCompleta
  ]);

  // ✅ FUNÇÃO PARA OBTER PREÇO TETO BDR (MEMOIZADA)
  const obterPrecoTetoBDR = useCallback(() => {
    if (!ativo || !carteira) return null;

    if (ativo.precoTetoBDR && typeof ativo.precoTetoBDR === 'number') {
      return ativo.precoTetoBDR;
    }

    try {
      const dadosCompletos = dados[carteira];
      if (Array.isArray(dadosCompletos)) {
        const ativoCompleto = dadosCompletos.find(a => a?.ticker === ticker);
        if (ativoCompleto?.precoTetoBDR && typeof ativoCompleto.precoTetoBDR === 'number') {
          return ativoCompleto.precoTetoBDR;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar preço teto BDR:', error);
    }

    return null;
  }, [ativo, carteira, dados, ticker]);

  const precoTetoBDR = obterPrecoTetoBDR();

  // ✅ FUNÇÃO CALCULAR PERCENTUAL CARTEIRA (MEMOIZADA)
  const calcularPercentualCarteira = useCallback((nomeCarteira) => {
    if (!dados || !dados[nomeCarteira]) return 'N/A';
    
    const ativosCarteira = dados[nomeCarteira];
    const numeroAtivos = Array.isArray(ativosCarteira) ? ativosCarteira.length : 0;
    
    if (numeroAtivos === 0) return '0%';
    
    const percentual = (100 / numeroAtivos).toFixed(1);
    return `${percentual}%`;
  }, [dados]);

  // ✅ EFFECT PARA BUSCAR DADOS BÁSICOS (OTIMIZADO)
  useEffect(() => {
    if (!ticker) {
      setAtivo(null);
      setCarteira(null);
      setLoading(false);
      return;
    }

    if (deveNegarAcesso) {
      setLoading(false);
      return;
    }

    if (!dados || Object.keys(dados).length === 0) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);

      return () => clearTimeout(timer);
    }

    // Função para buscar dados
    const buscarDadosAtivo = () => {
      // Cache para dados do ativo
      const cached = cacheUtils.get(`ativo_${ticker}`);

      if (cached) {
        const carteiraCache = cached.carteira as CarteiraKey;
        const carteiraValida = Object.prototype.hasOwnProperty.call(
          CARTEIRA_PERMISSION_MAP,
          carteiraCache
        );

        if (carteiraValida && planInfo?.pages && !podeAcessarCarteira(carteiraCache)) {
          cacheUtils.clear(`ativo_${ticker}`);
        } else {
          setAtivo(cached.ativo);
          setCarteira(cached.carteira);
          setLoading(false);
          return;
        }
      }

      // BUSCA EM MÚLTIPLAS CARTEIRAS
      let ativoEncontrado = null;
      let carteiraEncontrada = null;
      const carteirasComAtivo = [];
      const dadosDetalhados = {};

      Object.entries(dados).forEach(([nomeCarteira, ativos]) => {
        if (Array.isArray(ativos)) {
          const ativoNaCarteira = ativos.find(a => a?.ticker === ticker);
          if (ativoNaCarteira) {
            if (!ativoEncontrado) {
              ativoEncontrado = { ...ativoNaCarteira };
              carteiraEncontrada = nomeCarteira;
            }
            
            carteirasComAtivo.push({
              nome: nomeCarteira,
              config: CARTEIRAS_CONFIG[nomeCarteira],
              dados: ativoNaCarteira
            });
            
            dadosDetalhados[nomeCarteira] = ativoNaCarteira;
          }
        }
      });

      if (ativoEncontrado && carteiraEncontrada) {
        if (carteirasComAtivo.length > 1) {
          ativoEncontrado.multiplePortfolios = true;
          ativoEncontrado.portfoliosList = carteirasComAtivo.map(c => c.nome);
          ativoEncontrado.portfoliosData = dadosDetalhados;
          
          const prioridades = {
            'internacional': 1,
            'acoes': 2,
            'fiis': 3,
            'cripto': 4,
            'renda_fixa': 5
          };
          
          carteirasComAtivo.sort((a, b) => {
            const prioA = prioridades[a.nome] || 99;
            const prioB = prioridades[b.nome] || 99;
            return prioA - prioB;
          });
          
          const carteiraPrincipal = carteirasComAtivo[0];
          carteiraEncontrada = carteiraPrincipal.nome;
          
        } else {
          ativoEncontrado.multiplePortfolios = false;
          ativoEncontrado.portfoliosList = [carteiraEncontrada];
        }

        setAtivo(ativoEncontrado);
        setCarteira(carteiraEncontrada);
        
        // Cache os dados encontrados
        const cacheData = {
          ativo: ativoEncontrado,
          carteira: carteiraEncontrada
        };
        
        cacheUtils.set(`ativo_${ticker}`, cacheData);
      }

      setLoading(false);
    };

    buscarDadosAtivo();
  }, [
    CARTEIRAS_CONFIG,
    dados,
    deveNegarAcesso,
    planInfo?.pages,
    podeAcessarCarteira,
    ticker
  ]);

  // ✅ CÁLCULOS MEMOIZADOS
  const calculatedData = useMemo(() => {
    if (!ativo) return {};

    // Calcular performance
    let performanceAcao = 0;
    
    if (ativo.posicaoEncerrada && ativo.precoSaida) {
      performanceAcao = ((ativo.precoSaida - ativo.precoEntrada) / ativo.precoEntrada) * 100;
    } else {
      const precoAtual = cotacaoCompleta?.regularMarketPrice || 
                        (cotacoes[ticker] && typeof cotacoes[ticker] === 'object' ? cotacoes[ticker].regularMarketPrice : cotacoes[ticker]);
      
      if (precoAtual && ativo.precoEntrada) {
        performanceAcao = ((precoAtual - ativo.precoEntrada) / ativo.precoEntrada) * 100;
      }
    }
    
    const performanceTotal = performanceAcao + (performanceProventos || 0);
    
    // Preço atual formatado
    const precoAtual = cotacaoCompleta?.regularMarketPrice || 
                      (cotacoes[ticker] && typeof cotacoes[ticker] === 'object' ? cotacoes[ticker].regularMarketPrice : cotacoes[ticker]);
    
    const precoAtualFormatado = ativo.posicaoEncerrada && ativo.precoSaida ? 
      formatCurrency(ativo.precoSaida, CARTEIRAS_CONFIG[carteira]?.moeda || 'BRL') :
      (precoAtual ? formatCurrency(precoAtual, CARTEIRAS_CONFIG[carteira]?.moeda || 'BRL') : formatCurrency(ativo.precoEntrada, CARTEIRAS_CONFIG[carteira]?.moeda || 'BRL'));

    // Distância do preço teto
    const distanciaPrecoTeto = (() => {
      if (!ativo.precoTeto || ativo.posicaoEncerrada) {
        return null;
      }
      
      const precoReferencia = precoAtual || ativo.precoEntrada;
      return ((ativo.precoTeto - precoReferencia) / precoReferencia) * 100;
    })();

    // Percentual da carteira
    const percentualCarteira = (() => {
      if (ativo?.multiplePortfolios) {
        const percentuais = {};
        ativo.portfoliosList.forEach(nomeCarteira => {
          percentuais[nomeCarteira] = calcularPercentualCarteira(nomeCarteira);
        });
        
        const principal = percentuais[carteira];
        const outros = Object.entries(percentuais)
          .filter(([nome]) => nome !== carteira)
          .map(([nome, valor]) => `${CARTEIRAS_CONFIG[nome]?.nome || nome}: ${valor}`)
          .join(', ');
        
        return `${principal} (principal)${outros ? ` + ${outros}` : ''}`;
      }
      
      return calcularPercentualCarteira(carteira);
    })();

    // Dados de variação
    const getVariationData = () => {
      if (ativo.posicaoEncerrada) {
        return {
          value: Math.abs(performanceTotal).toFixed(2),
          isPositive: performanceTotal >= 0,
          icon: performanceTotal >= 0 ? '▲' : '▼'
        };
      }
      
      if (cotacaoCompleta?.regularMarketChangePercent !== undefined) {
        const variation = cotacaoCompleta.regularMarketChangePercent;
        return {
          value: Math.abs(variation).toFixed(2),
          isPositive: variation >= 0,
          icon: variation >= 0 ? '▲' : '▼'
        };
      }
      
      const cotacaoGlobal = cotacoes[ticker];
      if (cotacaoGlobal?.regularMarketChangePercent !== undefined) {
        const variation = cotacaoGlobal.regularMarketChangePercent;
        return {
          value: Math.abs(variation).toFixed(2),
          isPositive: variation >= 0,
          icon: variation >= 0 ? '▲' : '▼'
        };
      }
      
      return {
        value: 'N/A',
        isPositive: true,
        icon: '•'
      };
    };

    // Background gradient
    const getBackgroundGradient = () => {
if (tipoAtivo.ehFII) return 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
      if (tipoAtivo.ehBDREstrangeiro) return 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)';
      if (carteira === 'acoes') return 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
      return 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
    };

    return {
      performanceData: {
        total: performanceTotal,
        acao: performanceAcao,
        proventos: performanceProventos || 0,
        valorProventos: valorProventos || 0
      },
      precoAtualFormatado,
      distanciaPrecoTeto,
      percentualCarteira,
      variationData: getVariationData(),
      backgroundGradient: getBackgroundGradient()
    };
  }, [
    ativo, 
    carteira, 
    cotacaoCompleta, 
    cotacoes, 
    ticker, 
    performanceProventos, 
    valorProventos, 
    calcularPercentualCarteira, 
    CARTEIRAS_CONFIG,
    tipoAtivo
  ]);

  const acessoNegadoContent = (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '520px' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🚫</div>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '16px'
          }}
        >
          Acesso negado ao ativo
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: '#64748b',
            marginBottom: '32px'
          }}
        >
          O ativo <strong>{ticker}</strong> faz parte de uma carteira que não está disponível
          no seu plano atual. Entre em contato com o suporte para saber mais sobre como
          desbloquear esse conteúdo.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🏠 Voltar ao Dashboard
        </button>
      </div>
    </div>
  );

  if (deveNegarAcesso) {
    return acessoNegadoContent;
  }

  const performanceTotal = calculatedData.performanceData?.total;
  const performanceAcao = calculatedData.performanceData?.acao;

  const formattedPerformanceTotal = typeof performanceTotal === 'number'
    ? `${performanceTotal >= 0 ? '+' : ''}${performanceTotal.toFixed(2)}%`
    : '0,0%';

  const formattedPerformanceAcao = typeof performanceAcao === 'number'
    ? `${performanceAcao.toFixed(1)}%`
    : '0,0%';

  const formattedPerformanceProventos = typeof performanceProventos === 'number'
    ? `${performanceProventos.toFixed(1)}%`
    : '0,0%';

  const performanceSubtitle = `Ação: ${formattedPerformanceAcao} • Proventos: ${formattedPerformanceProventos}`;

  const performanceColor = typeof performanceTotal === 'number'
    ? performanceTotal >= 0
      ? '#22c55e'
      : '#ef4444'
    : '#6b7280';

  // Estados de carregamento e erro (com stages)
  if (ticker && loadingStages.stage1) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
            Carregando informações do ativo...
          </h2>
        </div>
      </div>
    );
  }

  if (ticker && (!ativo || !carteira)) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔍</div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '800', 
            color: '#1e293b',
            marginBottom: '16px'
          }}>
            Ativo não encontrado
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#64748b',
            marginBottom: '32px'
          }}>
            O ativo <strong>{ticker}</strong> não foi encontrado em nenhuma das suas carteiras.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🏠 Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const carteiraConfig = CARTEIRAS_CONFIG[carteira];
  const moedaPadrao = carteiraConfig?.moeda || 'BRL';

  const dashboardContent = ticker ? (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: isMobile ? '16px' : '24px'
    }}>
      {/* Navegação */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ← Voltar
        </button>
      </div>

      {/* Header Principal */}
      <div style={{
        marginBottom: '32px',
        background: calculatedData.backgroundGradient,
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: isMobile ? '20px' : '32px' }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobileOrTablet ? 'column' : 'row',
            gap: isMobile ? '16px' : '24px',
            alignItems: isMobileOrTablet ? 'center' : 'flex-start'
          }}>

            {/* AVATAR DA EMPRESA */}
            <CompanyAvatar
              symbol={ticker}
              companyName={getNomeEmpresa(ticker, ativo?.setor || '')}
              size={isMobile ? 80 : isMobileOrTablet ? 100 : 120}
            />

            {/* INFORMAÇÕES CENTRAIS */}
            <div style={{
              flex: 1,
              textAlign: isMobileOrTablet ? 'center' : 'left',
              minWidth: 0
            }}>
              {/* Título e badges */}
              <div style={{
                display: 'flex',
                flexDirection: isMobileOrTablet ? 'column' : 'row',
                gap: '12px',
                alignItems: isMobileOrTablet ? 'center' : 'flex-start',
                marginBottom: '8px',
                flexWrap: 'wrap'
              }}>
                <h1 style={{
                  fontSize: isMobile ? '1.8rem' : isMobileOrTablet ? '2.2rem' : '2.5rem',
                  fontWeight: 700,
                  margin: 0,
                  color: '#1f2937',
                  letterSpacing: '-0.025em'
                }}>
                  {ticker}
                </h1>

                {/* Badges responsivos */}
                <div style={{
                  display: 'flex',
                  gap: isMobile ? '6px' : '8px',
                  flexWrap: 'wrap',
                  justifyContent: isMobileOrTablet ? 'center' : 'flex-start'
                }}>
                  <div style={{
                    background: carteiraConfig?.color || '#6b7280',
                    color: 'white',
                    padding: isMobile ? '3px 8px' : '4px 12px',
                    borderRadius: '6px',
                    fontSize: isMobile ? '10px' : '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {carteiraConfig?.nome || carteira}
                  </div>

                  {ativo.posicaoEncerrada && (
                    <div style={{
                      background: '#ef4444',
                      color: 'white',
                      padding: isMobile ? '3px 8px' : '4px 12px',
                      borderRadius: '6px',
                      fontSize: isMobile ? '10px' : '12px',
                      fontWeight: 'bold'
                    }}>
                      ENCERRADA
                    </div>
                  )}
                </div>
              </div>

              {/* Nome da empresa */}
              <h2 style={{
                fontSize: isMobile ? '1rem' : isMobileOrTablet ? '1.1rem' : '1.25rem',
                fontWeight: 600,
                margin: '0 0 12px 0',
                color: '#374151',
                lineHeight: '1.4'
              }}>
                {getNomeEmpresa(ticker, ativo.setor)}
              </h2>

              {/* Info do setor */}
              <div style={{
                background: '#e2e8f0',
                color: '#475569',
                padding: isMobile ? '3px 10px' : '4px 12px',
                borderRadius: '6px',
                fontSize: isMobile ? '11px' : '13px',
                fontWeight: 500,
                display: 'inline-block',
                marginBottom: '12px'
              }}>
                {carteiraConfig?.moeda || 'BRL'} • {ativo.setor}
                {tipoAtivo.ehFII && ' • Fundo Imobiliário'}
                {tipoAtivo.ehBDREstrangeiro && ` • Mercado: ${getMercadoOrigem(tipoAtivo.tickerEstrangeiro)}`}
              </div>

              {/* Descrição da empresa */}
              <p style={{
                fontSize: isMobile ? '14px' : '16px',
                lineHeight: 1.6,
                color: '#4b5563',
                margin: 0,
                maxWidth: isMobileOrTablet ? '100%' : '600px'
              }}>
                {getDescricaoEmpresa(ticker, ativo.setor)}
              </p>

              {/* Alerta de posição encerrada */}
              {ativo.posicaoEncerrada && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: isMobile ? '10px 12px' : '12px 16px',
                  borderRadius: '8px',
                  color: '#b91c1c',
                  fontWeight: 600,
                  marginTop: '12px',
                  fontSize: isMobile ? '12px' : '14px'
                }}>
                  🔒 Posição encerrada em {ativo.dataSaida}
                </div>
              )}
            </div>

            {/* PREÇO E VARIAÇÃO */}
            <div style={{
              textAlign: isMobileOrTablet ? 'center' : 'right',
              minWidth: isMobileOrTablet ? 'auto' : '200px'
            }}>
              <div style={{
                fontSize: isMobile ? '2rem' : isMobileOrTablet ? '2.5rem' : '3rem',
                fontWeight: 700,
                color: '#1f2937',
                lineHeight: 1,
                marginBottom: '8px'
              }}>
                {calculatedData.precoAtualFormatado}
              </div>

              <div style={{
                color: calculatedData.variationData?.isPositive ? '#22c55e' : '#ef4444',
                fontWeight: 700,
                fontSize: isMobile ? '0.9rem' : isMobileOrTablet ? '1.1rem' : '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobileOrTablet ? 'center' : 'flex-end',
                gap: '8px'
              }}>
                <span style={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }}>
                  {calculatedData.variationData?.icon}
                </span>
                <span>
                  {calculatedData.variationData?.value}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STAGE 2: COMPONENTES CONDICIONAIS */}
      {!loadingStages.stage2 && (
        <>
          {/* Para ativos americanos com BDR disponível */}
          {tipoAtivo.temBDR && tipoAtivo.bdrCorrespondente && (
            <BDRAmericanoInfo
              ticker={ticker}
              bdrCorrespondente={tipoAtivo.bdrCorrespondente}
              temBDR={tipoAtivo.temBDR}
              bdrData={bdrDataAPI}
              bdrLoading={bdrLoadingAPI}
              precoTetoBDR={precoTetoBDR}
              cotacaoUSD={cotacaoUSD}
              loadingUSD={loadingUSD}
              atualizacaoUSD={atualizacaoUSD}
              refetchUSD={refetchUSD}
            />
          )}

          {/* Dados Específicos de FII */}
          {tipoAtivo.ehFII && (
            <FIISpecificCards
              ticker={ticker}
              dadosFII={dadosFIIHGBrasil}
              loading={loadingFIIHGBrasil}
              isFII={tipoAtivo.ehFII}
            />
          )}

          {/* Grid de Cards de Métricas */}
          {tipoAtivo.ehETF ? (
            <LazyComponent
              condition={!loadingStages.stage2}
              fallback={<SkeletonLoader variant="card" count={4} />}
            >
              <ETFMetricCards
                ticker={ticker}
                etfData={etfBRAPIData}
                loading={loadingETFBRAPI}
              />
            </LazyComponent>
          ) : tipoAtivo.ehREIT ? (
            <ResponsiveGrid minCardWidth={200} gap={20}>
              <MetricCard
                title="MIN. 52 SEMANAS"
                value={dadosYahoo?.fiftyTwoWeekLow
                  ? formatCurrency(dadosYahoo.fiftyTwoWeekLow, moedaPadrao)
                  : dadosFinanceiros?.fiftyTwoWeekLow
                  ? formatCurrency(dadosFinanceiros.fiftyTwoWeekLow, moedaPadrao)
                  : 'N/A'}
                subtitle={(() => {
                  const low = dadosYahoo?.fiftyTwoWeekLow || dadosFinanceiros?.fiftyTwoWeekLow;
                  const current = dadosFinanceiros?.precoAtual || cotacaoCompleta?.regularMarketPrice;
                  if (low && current) {
                    const distancia = ((current - low) / low) * 100;
                    return `+${distancia.toFixed(1)}% acima`;
                  }
                  return 'Mínima anual';
                })()}
                loading={dadosLoading || loadingYahoo}
                icon="📉"
                color="#ef4444"
              />

              <MetricCard
                title="MÁX. 52 SEMANAS"
                value={dadosYahoo?.fiftyTwoWeekHigh
                  ? formatCurrency(dadosYahoo.fiftyTwoWeekHigh, moedaPadrao)
                  : dadosFinanceiros?.fiftyTwoWeekHigh
                  ? formatCurrency(dadosFinanceiros.fiftyTwoWeekHigh, moedaPadrao)
                  : 'N/A'}
                subtitle={(() => {
                  const high = dadosYahoo?.fiftyTwoWeekHigh || dadosFinanceiros?.fiftyTwoWeekHigh;
                  const current = dadosFinanceiros?.precoAtual || cotacaoCompleta?.regularMarketPrice;
                  if (high && current) {
                    const distancia = ((high - current) / current) * 100;
                    return `${distancia.toFixed(1)}% abaixo`;
                  }
                  return 'Máxima anual';
                })()}
                loading={dadosLoading || loadingYahoo}
                icon="📈"
                color="#22c55e"
              />

              <MetricCard
                title="PERFORMANCE TOTAL"
                value={formattedPerformanceTotal}
                subtitle={performanceSubtitle}
                color={performanceColor}
                loading={loadingProventos}
              />

              <MetricCard
                title="DIVIDEND YIELD"
                value={(() => {
                  if (dy12Meses > 0) {
                    return dyFormatado;
                  }

                  if (dadosYahoo?.dividendYield && dadosYahoo.dividendYield > 0) {
                    return `${dadosYahoo.dividendYield.toFixed(2)}%`;
                  }

                  if (dadosFinanceiros?.lastDividendValue && dadosFinanceiros?.regularMarketPrice) {
                    const quarterlyDiv = dadosFinanceiros.lastDividendValue;
                    const annualDiv = quarterlyDiv * 4;
                    const price = dadosFinanceiros.regularMarketPrice;
                    const calculatedDY = (annualDiv / price) * 100;
                    return `${calculatedDY.toFixed(2)}%`;
                  }

                  if (dadosHGBrasil?.dividendYield12m) {
                    return `${dadosHGBrasil.dividendYield12m.toFixed(2)}%`;
                  }

                  return 'N/A';
                })()}
                subtitle={(() => {
                  if (dy12Meses > 0) {
                    return '';
                  }
                  if (dadosYahoo?.dividendYield && dadosYahoo.dividendYield > 0) {
                    return '';
                  }
                  if (dadosFinanceiros?.lastDividendValue && dadosFinanceiros?.regularMarketPrice) {
                    return 'Estimado (último div × 4)';
                  }
                  if (dadosHGBrasil?.dividendYield12m) {
                    return '';
                  }
                  return '';
                })()}
                loading={loadingDY || loadingHGBrasil || loadingYahoo || dadosLoading}
                icon="💰"
              />
            </ResponsiveGrid>
          ) : !tipoAtivo.ehFII && (
            <ResponsiveGrid minCardWidth={200} gap={20}>
              <MetricCard
                title="PERFORMANCE TOTAL"
                value={formattedPerformanceTotal}
                subtitle={performanceSubtitle}
                color={performanceColor}
                loading={loadingProventos}
              />

              <MetricCard
                title="P/L"
                value={(() => {
                  if (ticker.match(/\d$/) && !ticker.includes('11')) {
                    if (dadosHGBrasil?.pl && dadosHGBrasil.pl > 0 && dadosHGBrasil.pl < 1000) {
                      return dadosHGBrasil.pl.toFixed(2);
                    }
                    if (dadosFinanceiros?.pl && dadosFinanceiros.pl > 0 && dadosFinanceiros.pl < 1000) {
                      return dadosFinanceiros.pl.toFixed(2);
                    }
                    if (dadosYahoo?.pl && dadosYahoo.pl > 0 && dadosYahoo.pl < 999) {
                      return dadosYahoo.pl.toFixed(2);
                    }
                    return 'N/A';
                  }

                  else if (!ticker.match(/\d$/)) {
                    if (dadosYahoo?.pl && dadosYahoo.pl > 0 && dadosYahoo.pl < 999) {
                      return dadosYahoo.pl.toFixed(2);
                    }
                    if (dadosHGBrasil?.pl && dadosHGBrasil.pl > 0 && dadosHGBrasil.pl < 1000) {
                      return dadosHGBrasil.pl.toFixed(2);
                    }
                    if (dadosFinanceiros?.pl && dadosFinanceiros.pl > 0 && dadosFinanceiros.pl < 1000) {
                      return dadosFinanceiros.pl.toFixed(2);
                    }
                    return 'N/A';
                  }

                  else {
                    if (dadosHGBrasil?.pl && dadosHGBrasil.pl > 0) {
                      return dadosHGBrasil.pl.toFixed(2);
                    }
                    if (dadosFinanceiros?.pl && dadosFinanceiros.pl > 0) {
                      return dadosFinanceiros.pl.toFixed(2);
                    }
                    if (dadosYahoo?.pl && dadosYahoo.pl > 0) {
                      return dadosYahoo.pl.toFixed(2);
                    }
                    return 'N/A';
                  }
                })()}

                subtitle={(() => {
                  if (ticker.match(/\d$/) && !ticker.includes('11')) {
                    if (dadosHGBrasil?.pl && dadosHGBrasil.pl > 0 && dadosHGBrasil.pl < 1000) {
                      return "";
                    }
                    if (dadosFinanceiros?.pl && dadosFinanceiros.pl > 0 && dadosFinanceiros.pl < 1000) {
                      return "";
                    }
                    if (dadosYahoo?.pl && dadosYahoo.pl > 0 && dadosYahoo.pl < 999) {
                      return "";
                    }
                  } else if (!ticker.match(/\d$/)) {
                    if (dadosYahoo?.pl && dadosYahoo.pl > 0 && dadosYahoo.pl < 999) {
                      return dadosYahoo.fonte || "International";
                    }
                    if (dadosHGBrasil?.pl && dadosHGBrasil.pl > 0 && dadosHGBrasil.pl < 1000) {
                      return "";
                    }
                    if (dadosFinanceiros?.pl && dadosFinanceiros.pl > 0 && dadosFinanceiros.pl < 1000) {
                      return "";
                    }
                  }

                  return "";
                })()}

                loading={dadosLoading || loadingHGBrasil || loadingYahoo}
              />

              <MetricCard
                title="DIVIDEND YIELD"
                value={(() => {
                  if (dy12Meses > 0) {
                    return dyFormatado;
                  }
                  if (dadosYahoo?.dividendYield && dadosYahoo.dividendYield > 0) {
                    return `${dadosYahoo.dividendYield.toFixed(2)}%`;
                  }
                  if (dadosHGBrasil?.dividendYield12m) {
                    return `${dadosHGBrasil.dividendYield12m.toFixed(2)}%`;
                  }
                  return 'N/A';
                })()}
                subtitle={(() => {
                  if (dy12Meses > 0) {
                    return "";
                  }
                  if (dadosYahoo?.dividendYield && dadosYahoo.dividendYield > 0) {
                    return "";
                  }
                  if (dadosHGBrasil?.dividendYield12m) {
                    return "";
                  }
                  return "";
                })()}
                loading={loadingDY || loadingHGBrasil || loadingYahoo}
              />

              <MetricCard
                title="P/VP"
                value={(() => {
                  if (dadosYahoo?.pvp && dadosYahoo.pvp > 0 && dadosYahoo.pvp < 999) {
                    return dadosYahoo.pvp.toFixed(2);
                  }
                  if (dadosHGBrasil?.pvp) {
                    return dadosHGBrasil.pvp.toFixed(2);
                  }
                  return 'N/A';
                })()}
                subtitle={(() => {
                  if (dadosYahoo?.pvp && dadosYahoo.pvp > 0 && dadosYahoo.pvp < 999) {
                    return dadosYahoo.fonte || "";
                  }
                  if (dadosHGBrasil?.pvp) {
                    return "";
                  }
                  return "";
                })()}
                loading={loadingHGBrasil || loadingYahoo}
              />
            </ResponsiveGrid>
          )}
        </>
      )}

      {/* STAGE 3: COMPONENTES PESADOS COM LAZY LOADING */}
      {!loadingStages.stage3 && (
        <>
          <LazyComponent
            condition={!loadingStages.stage3}
            fallback={<SkeletonLoader variant="card" count={2} />}
          >
            <ETFHoldings
              ticker={ticker}
              dadosYahoo={dadosYahoo}
              isETF={tipoAtivo.ehETF}
              dadosBRAPI={etfBRAPIData}
              loading={loadingYahoo || loadingETFBRAPI}
            />
          </LazyComponent>

          <LazyComponent
            condition={!loadingStages.stage3}
            fallback={<SkeletonLoader variant="card" count={2} />}
          >
            <AnalisesTrimesestrais ticker={ticker} />
          </LazyComponent>

          <LazyComponent
            condition={!loadingStages.stage3}
            fallback={<SkeletonLoader variant="card" count={1} />}
          >
            <TechnicalAnalysisSection ticker={ticker} />
          </LazyComponent>

          {mostrarRelatoriosEmpresa && (
            <GerenciadorRelatorios ticker={ticker} />
          )}

          <AgendaCorporativa ticker={ticker} isFII={tipoAtivo.ehFII} />

          <HistoricoDividendos
            ticker={ticker}
            dataEntrada={ativo.dataEntrada}
            dataSaida={ativo.dataSaida}
            isFII={tipoAtivo.ehFII}
          />

          <DadosPosicaoExpandidos
            empresa={ativo}
            dadosFinanceiros={dadosFinanceiros}
            precoAtualFormatado={calculatedData.precoAtualFormatado}
            isFII={tipoAtivo.ehFII}
            distanciaPrecoTeto={calculatedData.distanciaPrecoTeto}
            percentualCarteira={calculatedData.percentualCarteira}
            carteiraConfig={carteiraConfig}
          />
        </>
      )}
    </div>
  ) : (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
          Ticker não informado
        </h2>
      </div>
    </div>
  );

  return dashboardContent;
}
