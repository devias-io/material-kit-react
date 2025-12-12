// SUBSTITUA APENAS: src/lib/brapi-service.ts
// (Mantém toda a estrutura atual, só corrige a chave)

import { CacheService, type WithCacheResult } from './redis';

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const QUOTE_CACHE_TAG = 'financial:quotes';

const isDev = process.env.NODE_ENV !== 'production';

export class BrapiService {
  private static apiKey = 'jJrMYVy9MATGEicx3GxBp8'; // HARDCODE TEMPORÁRIO
  private static baseUrl = 'https://brapi.dev/api';

  // Método estático (como seu código atual usa)
  static async fetchQuotes(
    symbols: string[],
    options: { cacheTtlMs?: number; queryParams?: Record<string, string | undefined | null> } = {}
  ): Promise<WithCacheResult<any[]>> {
    if (!symbols || symbols.length === 0) {
      return {
        data: [],
        metadata: {
          cached: true,
          backend: CacheService.getBackend(),
          expiresAt: Date.now(),
          cacheTtlSeconds: Math.floor((options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS) / 1000),
        },
      };
    }

    const cleanSymbols = symbols
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    const symbolString = cleanSymbols.join(',');

    const normalizedQuery = new URLSearchParams();
    Object.entries(options.queryParams || {}).forEach(([key, value]) => {
      if (value != null && value !== '') {
        normalizedQuery.append(key, value);
      }
    });

    const querySignature = normalizedQuery.toString();

    const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    const ttlSeconds = Math.max(60, Math.floor(cacheTtlMs / 1000));

    const cacheKey = CacheService.getCacheKey('brapi:quotes', symbolString, querySignature || '');

    try {
      return await CacheService.withCache(
        cacheKey,
        async () => {
          const urlParams = new URLSearchParams(normalizedQuery);
          urlParams.set('token', this.apiKey);

          const url = `${this.baseUrl}/quote/${symbolString}?${urlParams}`;

          if (isDev) {
            console.log(`📡 Fetching quotes for ${symbolString} (masked key)`);
          }

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'User-Agent': 'MembrosFatosBolsa/1.0',
            },
            cache: 'force-cache',
            next: {
              revalidate: Math.max(30, Math.floor(cacheTtlMs / 1000)),
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText };
            }

            throw new Error(`Brapi API error: ${response.status} - ${errorData.message || response.statusText}`);
          }

          const data = await response.json();
          const results = data.results || [];

          return results;
        },
        { ttlSeconds, tags: [QUOTE_CACHE_TAG] }
      );
    } catch (error) {
      console.error(`❌ Erro ao buscar cotações da Brapi:`, error);
      throw error;
    }
  }

  // Método de instância para compatibilidade futura
  async fetchQuotesInstance(symbols: string[]): Promise<WithCacheResult<any[]>> {
    return BrapiService.fetchQuotes(symbols);
  }

  // Método para testar conexão
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { data } = await this.fetchQuotes(['PETR4']);
      return {
        success: data.length > 0,
        message: data.length > 0 ? 'Conexão OK' : 'Sem dados'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}