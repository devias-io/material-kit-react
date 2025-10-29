import { useState, useEffect, useCallback } from 'react';

const DY_MODULES = 'defaultKeyStatistics,summaryDetail';
const REQUEST_INTERVAL_MS = 600;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type QueueItem = {
  fn: () => Promise<Response>;
  resolve: (value: Response) => void;
  reject: (reason: unknown) => void;
};

class RateLimiter {
  private readonly interval: number;
  private readonly queue: QueueItem[] = [];
  private processing = false;
  private lastExecution = 0;

  constructor(interval: number) {
    this.interval = interval;
  }

  schedule(fn: () => Promise<Response>): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();

      if (!item) {
        continue;
      }

      const now = Date.now();
      const waitTime = Math.max(0, this.lastExecution + this.interval - now);

      if (waitTime > 0) {
        await delay(waitTime);
      }

      this.lastExecution = Date.now();

      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.processing = false;
  }
}

const requestRateLimiter = new RateLimiter(REQUEST_INTERVAL_MS);

type RateLimitedFetchOptions = Omit<RequestInit, 'signal'> & { timeoutMs?: number };

async function rateLimitedFetch(url: string, options: RateLimitedFetchOptions = {}) {
  const { timeoutMs, ...fetchOptions } = options;

  return requestRateLimiter.schedule(async () => {
    const controller = new AbortController();
    const timeoutId = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

    try {
      return await fetch(url, { ...fetchOptions, signal: controller.signal });
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  });
}

function getFrequenciaDividendos(ticker: string): number {
  const tickerUpper = ticker.toUpperCase();

  const empresasAnuais = ['XP', 'NU', 'PAGS', 'STNE', 'ARCO', 'BRFS'];
  if (empresasAnuais.includes(tickerUpper)) {
    return 1;
  }

  const empresasSemestrais = ['VALE', 'ITUB', 'BBD'];
  if (empresasSemestrais.includes(tickerUpper)) {
    return 2;
  }

  return 4;
}

function extrairNumeroBrApi(valor: any): number | null {
  if (valor === null || valor === undefined) {
    return null;
  }

  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor === 'object') {
    if (typeof valor.raw === 'number' && Number.isFinite(valor.raw)) {
      return valor.raw;
    }

    if (typeof valor.fmt === 'string') {
      return extrairNumeroBrApi(valor.fmt);
    }
  }

  if (typeof valor === 'string') {
    const cleaned = valor.trim();
    if (!cleaned) {
      return null;
    }

    const isPercent = cleaned.includes('%');
    const numericOnly = cleaned
      .replace(/[^0-9.,%-]/g, '')
      .replace(/%/g, '')
      .replace(/\s+/g, '');

    let normalizado = numericOnly;
    const possuiVirgula = normalizado.includes(',');
    const possuiPonto = normalizado.includes('.');

    if (possuiVirgula && possuiPonto) {
      if (normalizado.lastIndexOf('.') > normalizado.lastIndexOf(',')) {
        normalizado = normalizado.replace(/,/g, '');
      } else {
        normalizado = normalizado.replace(/\./g, '').replace(',', '.');
      }
    } else if (possuiVirgula) {
      normalizado = normalizado.replace(/,/g, '.');
    }

    const parsed = Number.parseFloat(normalizado);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return isPercent ? parsed / 100 : parsed;
  }

  return null;
}

function formatarDy(valor: number): string {
  const percentual = Number.isFinite(valor) ? valor * 100 : 0;
  return `${percentual.toFixed(2).replace('.', ',')}%`;
}

function calcularDyAPartirDoResultado(result: any, ticker: string): { valor: number | null; origem: string } {
  if (!result) {
    return { valor: null, origem: 'sem_resultado' };
  }

  const fontesDiretas = [
    { valor: result.defaultKeyStatistics?.yield, origem: 'defaultKeyStatistics.yield' },
    { valor: result.summaryDetail?.yield, origem: 'summaryDetail.yield' },
    { valor: result.defaultKeyStatistics?.dividendYield, origem: 'defaultKeyStatistics.dividendYield' },
    { valor: result.summaryDetail?.dividendYield, origem: 'summaryDetail.dividendYield' },
    { valor: result.summaryDetail?.trailingAnnualDividendYield, origem: 'summaryDetail.trailingAnnualDividendYield' }
  ];

  for (const fonte of fontesDiretas) {
    const numero = extrairNumeroBrApi(fonte.valor);
    if (numero && numero > 0) {
      return { valor: numero, origem: fonte.origem };
    }
  }

  const precoAtual = extrairNumeroBrApi(result.regularMarketPrice ?? result.price?.regularMarketPrice);
  if (!precoAtual || precoAtual <= 0) {
    return { valor: null, origem: 'sem_preco' };
  }

  const fontesAnuais = [
    { valor: result.summaryDetail?.dividendRate, origem: 'summaryDetail.dividendRate' },
    { valor: result.summaryDetail?.trailingAnnualDividendRate, origem: 'summaryDetail.trailingAnnualDividendRate' }
  ];

  for (const fonte of fontesAnuais) {
    const dividendoAnual = extrairNumeroBrApi(fonte.valor);
    if (dividendoAnual && dividendoAnual > 0) {
      const dyCalculado = dividendoAnual / precoAtual;
      if (dyCalculado > 0) {
        return { valor: dyCalculado, origem: fonte.origem };
      }
    }
  }

  const ultimoDividendo = extrairNumeroBrApi(
    result.defaultKeyStatistics?.lastDividendValue ?? result.summaryDetail?.lastDividendValue
  );

  if (ultimoDividendo && ultimoDividendo > 0) {
    const frequencia = getFrequenciaDividendos(ticker);
    const dividendoAnual = ultimoDividendo * frequencia;
    const dyCalculado = dividendoAnual / precoAtual;

    if (dyCalculado > 0) {
      return { valor: dyCalculado, origem: 'calc:lastDividendValue' };
    }
  }

  return { valor: null, origem: 'nao_encontrado' };
}

// 🔥 HOOK INTEGRADO PARA DY - EXTRAÍDO DO CÓDIGO ORIGINAL
export function useDividendYieldIntegrado(ticker: string) {
  const [dyData, setDyData] = useState<{
    dy12Meses: number;
    dyFormatado: string;
    fonte: string;
  }>({
    dy12Meses: 0,
    dyFormatado: '0,00%',
    fonte: 'indisponível'
  });
  const [loading, setLoading] = useState(true);
  
  // 🔥 DETECTAR DISPOSITIVO COM ESTADO DE DETECÇÃO COMPLETA
  const [isMobile, setIsMobile] = useState(false);
  const [deviceDetected, setDeviceDetected] = useState(false);

  // 🔥 DETECÇÃO DE DISPOSITIVO
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const mobile = width <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      setDeviceDetected(true);
      console.log('📱 DY - Dispositivo detectado:', { width, isMobile: mobile, deviceDetected: true });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const fetchDY = useCallback(async () => {
    if (!ticker) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`📈 Buscando DY para ${ticker} usando estratégia mobile-first...`);
      console.log('📱 Device Info:', { isMobile, deviceDetected });

      const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
      let dyObtido = false;
      let dyValue = 0;
      let fonte = 'BRAPI-Estratégia';

      if (isMobile) {
        // 📱 MOBILE: Estratégia agressiva com múltiplas tentativas
        console.log('📱 [DY-MOBILE] Estratégia agressiva para forçar API funcionar');
        
        // ESTRATÉGIA 1: User-Agent Desktop
        if (!dyObtido) {
          try {
            console.log(`📱🔄 [DY] ${ticker}: Tentativa 1 - User-Agent Desktop`);
            
            const response = await rateLimitedFetch(`https://brapi.dev/api/quote/${ticker}?modules=${DY_MODULES}&token=${BRAPI_TOKEN}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
              timeoutMs: 10000
            });

            if (response.ok) {
              const data = await response.json();
              const result = data.results?.[0];
              const { valor, origem } = calcularDyAPartirDoResultado(result, ticker);

              if (valor && valor > 0) {
                dyValue = valor;
                fonte = `BRAPI-Mobile-UA-Desktop | ${origem}`;
                dyObtido = true;
                console.log(`📱✅ [DY] ${ticker}: ${formatarDy(valor)} (Desktop UA | ${origem})`);
              } else {
                fonte = `BRAPI-Mobile-UA-Desktop-Zero | ${origem}`;
                console.log(`📱⚠️ [DY] ${ticker}: Sem dividendos (Desktop UA | ${origem})`);
              }
            }
          } catch (error: any) {
            console.log(`📱❌ [DY] ${ticker} (Desktop UA): ${error.message}`);
          }
        }
        
        // Delay entre tentativas
        if (!dyObtido) {
          await delay(500);
        }

        // ESTRATÉGIA 2: Sem User-Agent
        if (!dyObtido) {
          try {
            console.log(`📱🔄 [DY] ${ticker}: Tentativa 2 - Sem User-Agent`);
            
            const response = await rateLimitedFetch(`https://brapi.dev/api/quote/${ticker}?modules=${DY_MODULES}&token=${BRAPI_TOKEN}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              },
              timeoutMs: 8000
            });

            if (response.ok) {
              const data = await response.json();
              const result = data.results?.[0];
              const { valor, origem } = calcularDyAPartirDoResultado(result, ticker);

              if (valor && valor > 0) {
                dyValue = valor;
                fonte = `BRAPI-Mobile-Sem-UA | ${origem}`;
                dyObtido = true;
                console.log(`📱✅ [DY] ${ticker}: ${formatarDy(valor)} (Sem UA | ${origem})`);
              } else {
                fonte = `BRAPI-Mobile-Sem-UA-Zero | ${origem}`;
                console.log(`📱⚠️ [DY] ${ticker}: Sem dividendos (Sem UA | ${origem})`);
              }
            }
          } catch (error: any) {
            console.log(`📱❌ [DY] ${ticker} (Sem UA): ${error.message}`);
          }
        }

        // Delay entre tentativas
        if (!dyObtido) {
          await delay(500);
        }

        // ESTRATÉGIA 3: URL simplificada
        if (!dyObtido) {
          try {
            console.log(`📱🔄 [DY] ${ticker}: Tentativa 3 - URL simplificada`);
            
            const response = await rateLimitedFetch(`https://brapi.dev/api/quote/${ticker}?modules=${DY_MODULES}&token=${BRAPI_TOKEN}&range=1d`, {
              method: 'GET',
              mode: 'cors',
              timeoutMs: 8000
            });

            if (response.ok) {
              const data = await response.json();
              const result = data.results?.[0];
              const { valor, origem } = calcularDyAPartirDoResultado(result, ticker);

              if (valor && valor > 0) {
                dyValue = valor;
                fonte = `BRAPI-Mobile-URL-Simples | ${origem}`;
                dyObtido = true;
                console.log(`📱✅ [DY] ${ticker}: ${formatarDy(valor)} (URL simples | ${origem})`);
              } else {
                fonte = `BRAPI-Mobile-URL-Simples-Zero | ${origem}`;
                console.log(`📱⚠️ [DY] ${ticker}: Sem dividendos (URL simples | ${origem})`);
              }
            }
          } catch (error: any) {
            console.log(`📱❌ [DY] ${ticker} (URL simples): ${error.message}`);
          }
        }

        if (!dyObtido) {
          console.log(`📱⚠️ [DY] ${ticker}: Todas as estratégias mobile falharam`);
          dyValue = 0;
          fonte = 'BRAPI-Mobile-Fallback';
        }

      } else {
        // 🖥️ DESKTOP: Estratégia original (mais simples)
        console.log('🖥️ [DY-DESKTOP] Estratégia desktop padrão');
        
        try {
          const response = await rateLimitedFetch(`https://brapi.dev/api/quote/${ticker}?modules=${DY_MODULES}&token=${BRAPI_TOKEN}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'DY-Desktop-App'
            },
            timeoutMs: 5000
          });

          if (response.ok) {
            const data = await response.json();
            const result = data.results?.[0];
            const { valor, origem } = calcularDyAPartirDoResultado(result, ticker);

            if (valor && valor > 0) {
              dyValue = valor;
              fonte = `BRAPI-Desktop | ${origem}`;
              console.log(`🖥️✅ [DY] ${ticker}: ${formatarDy(valor)} (Desktop | ${origem})`);
            } else {
              fonte = `BRAPI-Desktop-Zero | ${origem}`;
              console.log(`🖥️⚠️ [DY] ${ticker}: Sem dividendos (Desktop | ${origem})`);
            }
          }
        } catch (error: any) {
          console.log(`🖥️❌ [DY] ${ticker} Desktop:`, error.message);
          dyValue = 0;
          fonte = 'BRAPI-Desktop-Error';
        }
      }

      // ✅ ATUALIZAR ESTADO FINAL
      setDyData({
        dy12Meses: dyValue,
        dyFormatado: dyValue > 0 ? formatarDy(dyValue) : '0,00%',
        fonte: fonte
      });

      console.log(`✅ DY FINAL ${ticker}:`, {
        valor: dyValue,
        formatado: dyValue > 0 ? formatarDy(dyValue) : '0,00%',
        fonte: fonte,
        dispositivo: isMobile ? 'mobile' : 'desktop'
      });

    } catch (error) {
      console.error(`❌ Erro geral ao buscar DY para ${ticker}:`, error);
      setDyData({
        dy12Meses: 0,
        dyFormatado: '0,00%',
        fonte: 'erro'
      });
    } finally {
      setLoading(false);
    }
  }, [ticker, isMobile]);

  // ✅ USEEFFECT CORRIGIDO: Aguarda detecção E re-executa quando isMobile muda
  useEffect(() => {
    if (deviceDetected) {
      console.log('🔥 DY: Executando busca após detecção de dispositivo:', { isMobile, deviceDetected });
      fetchDY();
    }
  }, [fetchDY, deviceDetected, isMobile]);

  return {
    dy12Meses: dyData.dy12Meses,
    dyFormatado: dyData.dyFormatado,
    loading,
    fonte: dyData.fonte,
    refetch: fetchDY,
    isMobile,
    deviceDetected
  };
}