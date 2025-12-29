import { BRAPICashDividend, BRAPIResponse } from '@/types/brapi';
import { rateLimitedFetch } from '@/utils/fetchDividendYieldIntegrado';

const BRAPI_TOKEN = process.env.BRAPI_TOKEN?.trim() || 'jJrMYVy9MATGEicx3GxBp8';
const BASE_URL = 'https://brapi.dev/api';
const REQUEST_DELAY_MS = 500;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let rateLimitPromise: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

const aguardarProximaJanela = async () => {
  rateLimitPromise = rateLimitPromise.then(async () => {
    const now = Date.now();
    const waitTime = Math.max(0, lastRequestAt + REQUEST_DELAY_MS - now);
    if (waitTime > 0) {
      await delay(waitTime);
    }
    lastRequestAt = Date.now();
  });

  return rateLimitPromise;
};

export type ProventoParaSincronizacao = {
  ticker: string;
  tipo: 'JCP' | 'DIVIDENDO';
  valor: number;
  dataCom: Date;
  dataPagamento: Date | null;
  descricao: string;
  origem: 'BRAPI';
};

export type ResultadoBuscaProventos = {
  proventos: ProventoParaSincronizacao[];
  erros: string[];
};

export async function buscarProventosBRAPIParaSincronizacao(
  ticker: string
): Promise<ResultadoBuscaProventos> {
  const url = new URL(`${BASE_URL}/quote/${ticker}`);
  url.searchParams.set('dividends', 'true');
  if (BRAPI_TOKEN) {
    url.searchParams.set('token', BRAPI_TOKEN);
  }

  try {
    await aguardarProximaJanela();
    const response = await rateLimitedFetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      timeoutMs: 10000,
      maxRetries: 3,
      retryDelayMs: 1500
    });

    if (!response.ok) {
      return {
        proventos: [],
        erros: [`BRAPI respondeu com status ${response.status}`]
      };
    }

    const data = (await response.json()) as BRAPIResponse;
    const result = Array.isArray(data?.results) ? data.results[0] : undefined;
    const cashDividends: BRAPICashDividend[] =
      result?.dividendsData?.cashDividends ?? [];

    const proventos = cashDividends
      .filter(dividendo => dividendo.paymentDate !== null)
      .map(dividendo => ({
        ticker: result?.symbol || ticker,
        tipo: dividendo.label === 'JCP' ? 'JCP' : 'DIVIDENDO',
        valor: dividendo.rate,
        dataCom: new Date(dividendo.lastDatePrior),
        dataPagamento: dividendo.paymentDate ? new Date(dividendo.paymentDate) : null,
        descricao: dividendo.relatedTo,
        origem: 'BRAPI' as const
      }));

    return { proventos, erros: [] };
  } catch (error: any) {
    const mensagemErro = error?.message || 'Erro desconhecido ao consultar BRAPI';
    return {
      proventos: [],
      erros: [mensagemErro]
    };
  }
}

export async function buscarProventosEmLoteParaSincronizacao(
  tickers: string[],
  concorrencia = 2,
  onProgress?: (ticker: string, index: number, total: number) => void
): Promise<{
  sucessos: Map<string, ProventoParaSincronizacao[]>;
  erros: Map<string, string[]>;
}> {
  const sucessos = new Map<string, ProventoParaSincronizacao[]>();
  const erros = new Map<string, string[]>();
  const total = tickers.length;

  let proximoIndice = 0;
  const limiteConcorrencia = Math.max(1, concorrencia);

  const processarTicker = async () => {
    while (true) {
      const indiceAtual = proximoIndice++;
      const ticker = tickers[indiceAtual];
      if (!ticker) break;

      console.log(`🔄 [BRAPI Sync] (${indiceAtual + 1}/${total}) Iniciando ${ticker}`);
      try {
        const resultado = await buscarProventosBRAPIParaSincronizacao(ticker);

        if (resultado.erros.length > 0) {
          console.warn(`⚠️ [BRAPI Sync] ${ticker} com erros: ${resultado.erros.join('; ')}`);
          erros.set(ticker, resultado.erros);
        } else {
          console.log(
            `✅ [BRAPI Sync] ${ticker} retornou ${resultado.proventos.length} proventos válidos`
          );
          sucessos.set(ticker, resultado.proventos);
        }
      } catch (error: any) {
        const mensagemErro = error?.message || 'Erro desconhecido ao processar ticker';
        console.error(`❌ [BRAPI Sync] ${ticker}: ${mensagemErro}`);
        erros.set(ticker, [mensagemErro]);
      } finally {
        onProgress?.(ticker, indiceAtual + 1, total);
        if (indiceAtual < total - 1) {
          await delay(REQUEST_DELAY_MS);
        }
      }
    }
  };

  const workers = Array.from({ length: limiteConcorrencia }, () => processarTicker());
  await Promise.all(workers);

  return { sucessos, erros };
}
