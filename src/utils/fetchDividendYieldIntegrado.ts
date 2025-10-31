import { calcularDyAPartirDoResultado, formatarDy } from '@/utils/dividendYield';

const REQUEST_INTERVAL_MS = 350;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1500;
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRY_JITTER_FACTOR = 0.25;

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

type RateLimitedFetchOptions = Omit<RequestInit, 'signal'> & {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
};

export async function rateLimitedFetch(
  url: string,
  options: RateLimitedFetchOptions = {},
  attempt = 0
): Promise<Response> {
  const {
    timeoutMs,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    ...fetchOptions
  } = options;

  const response = await requestRateLimiter.schedule(async () => {
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

  if (!response.ok && RETRYABLE_STATUS_CODES.has(response.status) && attempt < maxRetries) {
    response.body?.cancel();
    const exponentialDelay = retryDelayMs * Math.pow(2, attempt);
    const jitter = exponentialDelay * RETRY_JITTER_FACTOR * Math.random();
    await delay(exponentialDelay + jitter);
    return rateLimitedFetch(url, { ...fetchOptions, timeoutMs, maxRetries, retryDelayMs }, attempt + 1);
  }

  return response;
}

export type DividendYieldIntegradoResult = {
  dy12Meses: number;
  dyFormatado: string;
  fonte: string;
  symbol?: string;
};

const isDevelopmentEnv = process.env.NODE_ENV !== 'production';

const debugLog = (...args: any[]) => {
  if (isDevelopmentEnv) {
    console.log(...args);
  }
};

const debugWarn = (...args: any[]) => {
  if (isDevelopmentEnv) {
    console.warn(...args);
  }
};

const debugError = (...args: any[]) => {
  if (isDevelopmentEnv) {
    console.error(...args);
  }
};

export async function fetchDividendYieldIntegrado(
  ticker: string,
  isMobile: boolean
): Promise<DividendYieldIntegradoResult> {
  if (!ticker) {
    return {
      dy12Meses: 0,
      dyFormatado: '0,00%',
      fonte: 'indisponível'
    };
  }

  const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
  const quoteUrl = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}&dividends=true`;
  let dyObtido = false;
  let dyValue = 0;
  let fonte = 'BRAPI-Estratégia';
  let symbolFromApi: string | undefined;

  const processResult = (result: any, origemEtiqueta: string) => {
    if (!result) {
      fonte = `${origemEtiqueta} | sem_resultado`;
      return false;
    }

    symbolFromApi = result.symbol || symbolFromApi;
    const { valor, origem } = calcularDyAPartirDoResultado(result, ticker);

    if (valor && valor > 0) {
      dyValue = valor;
      fonte = `${origemEtiqueta} | ${origem}`;
      dyObtido = true;
      debugLog(`✅ [DY] ${ticker}: ${formatarDy(valor)} (${origemEtiqueta} | ${origem})`);
      return true;
    }

    fonte = `${origemEtiqueta}-Zero | ${origem}`;
    debugWarn(`⚠️ [DY] ${ticker}: Sem dividendos (${origemEtiqueta} | ${origem})`);
    return false;
  };

  const tentarBusca = async (
    etiqueta: string,
    fetchOptions: RateLimitedFetchOptions
  ) => {
    try {
      debugLog(`${etiqueta} buscando DY para ${ticker}`);
      const response = await rateLimitedFetch(quoteUrl, fetchOptions);

      if (response.ok) {
        const data = await response.json();
        const result = data.results?.[0];
        processResult(result, etiqueta);
      } else {
        debugWarn(`${etiqueta} falhou com status ${response.status}`);
      }
    } catch (error: any) {
      debugWarn(`${etiqueta} erro: ${error?.message || 'erro desconhecido'}`);
    }
  };

  try {
    if (isMobile) {
      await tentarBusca('📱 [DY-MOBILE] User-Agent Desktop', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        },
        timeoutMs: 10000
      });

      if (!dyObtido) {
        await delay(500);
        await tentarBusca('📱 [DY-MOBILE] Sem User-Agent', {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          },
          timeoutMs: 8000
        });
      }

      if (!dyObtido) {
        await delay(500);
        await tentarBusca('📱 [DY-MOBILE] URL simples', {
          method: 'GET',
          mode: 'cors',
          timeoutMs: 8000
        });
      }

      if (!dyObtido) {
        dyValue = 0;
        fonte = 'BRAPI-Mobile-Fallback';
        debugWarn(`📱⚠️ [DY] ${ticker}: Todas as estratégias mobile falharam`);
      }
    } else {
      await tentarBusca('🖥️ [DY-DESKTOP] Estratégia padrão', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'DY-Desktop-App'
        },
        timeoutMs: 5000
      });

      if (!dyObtido) {
        dyValue = 0;
        fonte = 'BRAPI-Desktop-Zero | indisponível';
        debugWarn(`🖥️⚠️ [DY] ${ticker}: Sem dividendos válidos na estratégia desktop`);
      }
    }
  } catch (error) {
    debugError(`❌ Erro ao buscar DY para ${ticker}:`, error);
    dyValue = 0;
    fonte = 'erro';
  }

  return {
    dy12Meses: dyValue,
    dyFormatado: dyValue > 0 ? formatarDy(dyValue) : '0,00%',
    fonte,
    symbol: symbolFromApi ? symbolFromApi.toUpperCase() : undefined
  };
}
