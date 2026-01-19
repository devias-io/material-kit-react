// lib/redis.ts
import { Redis } from '@upstash/redis';

type CacheValue<T> = {
  value: T;
  expiresAt: number;
};

type CacheMetadata = {
  cached: boolean;
  backend: 'redis' | 'memory';
  expiresAt?: number;
  cacheTtlSeconds?: number;
};

interface CacheLayer {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  increment(key: string, ttlSeconds?: number): Promise<number>;
  getNumber(key: string): Promise<number | null>;
  getTtlSeconds(key: string): Promise<number | null>;
}

class MemoryCache implements CacheLayer {
  private store = new Map<string, CacheValue<unknown>>();
  private tagVersions = new Map<string, CacheValue<number>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const current = await this.getNumber(key);
    const next = (current ?? 0) + 1;
    const expiresAt = ttlSeconds
      ? Date.now() + ttlSeconds * 1000
      : Number.POSITIVE_INFINITY;

    this.tagVersions.set(key, { value: next, expiresAt });
    return next;
  }

  async getNumber(key: string): Promise<number | null> {
    const entry = this.tagVersions.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.tagVersions.delete(key);
      return null;
    }

    return entry.value;
  }

  async getTtlSeconds(key: string): Promise<number | null> {
    const entry = this.store.get(key) ?? this.tagVersions.get(key);
    if (!entry) return null;

    const remaining = entry.expiresAt - Date.now();
    if (remaining <= 0) {
      this.store.delete(key);
      this.tagVersions.delete(key);
      return null;
    }

    return Math.ceil(remaining / 1000);
  }
}

class UpstashCache implements CacheLayer {
  private client: Redis | null;

  constructor() {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } else {
      this.client = null;
    }
  }

  hasClient() {
    return Boolean(this.client);
  }

  private ensureClient(): asserts this is { client: Redis } {
    if (!this.client) {
      throw new Error('Upstash Redis credentials are not configured');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    return (await this.client.get(key)) as T | null;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    await this.client.set(key, value, { ex: ttlSeconds });
  }

  async delete(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    this.ensureClient();
    const next = await this.client.incr(key);

    if (ttlSeconds) {
      const currentTtl = await this.client.ttl(key);
      if (currentTtl === -1) {
        await this.client.expire(key, ttlSeconds);
      }
    }

    return next;
  }

  async getNumber(key: string): Promise<number | null> {
    if (!this.client) return null;
    const value = await this.client.get<number>(key);
    return value ?? null;
  }

  async getTtlSeconds(key: string): Promise<number | null> {
    if (!this.client) return null;
    const ttl = await this.client.ttl(key);
    return ttl >= 0 ? ttl : null;
  }
}

type WithCacheOptions = {
  ttlSeconds?: number;
  tags?: string[];
  logLabel?: string;
  forceRefresh?: boolean;
};

type WithCacheResult<T> = {
  data: T;
  metadata: CacheMetadata;
};

const DEFAULT_TTL_SECONDS = 300; // 5 minutes
const TAG_PREFIX = 'cache-tag:';
const inflight = new Map<string, Promise<WithCacheResult<unknown>>>();

const memoryLayer = new MemoryCache();
const redisLayer = new UpstashCache();
const redisAvailable = redisLayer.hasClient();
const cacheLayer: CacheLayer = redisAvailable ? redisLayer : memoryLayer;

async function getTagVersion(tag: string): Promise<number> {
  const key = `${TAG_PREFIX}${tag}`;
  const version = await cacheLayer.getNumber(key);
  return version ?? 0;
}

async function bumpTags(tags: string[]): Promise<void> {
  await Promise.all(tags.map(tag => cacheLayer.increment(`${TAG_PREFIX}${tag}`)));
}

function buildFinalKey(baseKey: string, tagVersions: number[]): string {
  if (tagVersions.length === 0) return baseKey;
  return `${baseKey}|${tagVersions.join('|')}`;
}

export class CacheService {
  private static readonly backend: CacheMetadata['backend'] = redisAvailable ? 'redis' : 'memory';

  static getCacheKey(...parts: Array<string | number | boolean | undefined | null>): string {
    return parts.filter(Boolean).join('::');
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      return await cacheLayer.get<T>(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, data: unknown, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
    try {
      await cacheLayer.set(key, data, ttlSeconds);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      await cacheLayer.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async invalidate(key: string): Promise<void> {
    await this.delete(key);
  }

  static async invalidateTags(tags: string[]): Promise<void> {
    if (tags.length === 0) return;
    try {
      await bumpTags(tags);
    } catch (error) {
      console.error('Cache tag bump error:', error);
    }
  }

  static async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      return await cacheLayer.increment(key, ttlSeconds);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  static async getTtlSeconds(key: string): Promise<number | null> {
    try {
      return await cacheLayer.getTtlSeconds(key);
    } catch (error) {
      console.error('Cache ttl error:', error);
      return null;
    }
  }

  static async withCache<T>(
    baseKey: string,
    fetcher: () => Promise<T>,
    options?: WithCacheOptions
  ): Promise<WithCacheResult<T>>;

  static async withCache<T>(options: { key: string; ttlSeconds?: number; tags?: string[]; fn: () => Promise<T> }): Promise<T>;

  static async withCache<T>(
    baseKeyOrOptions: string | { key: string; ttlSeconds?: number; tags?: string[]; fn: () => Promise<T> },
    fetcher?: () => Promise<T>,
    options: WithCacheOptions = {}
  ): Promise<WithCacheResult<T> | T> {
    if (typeof baseKeyOrOptions === 'string') {
      return this.runWithCache(baseKeyOrOptions, fetcher as () => Promise<T>, options);
    }

    const { key, fn, ttlSeconds, tags } = baseKeyOrOptions;
    const result = await this.runWithCache(key, fn, { ttlSeconds, tags });
    return result.data;
  }

  private static async runWithCache<T>(
    baseKey: string,
    fetcher: () => Promise<T>,
    options: WithCacheOptions = {}
  ): Promise<WithCacheResult<T>> {
    const ttlSeconds = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;

    const tagVersions = options.tags ? await Promise.all(options.tags.map(tag => getTagVersion(tag))) : [];
    const finalKey = buildFinalKey(baseKey, tagVersions);

    if (!options.forceRefresh) {
      const cached = await this.get<T>(finalKey);
      if (cached) {
        return {
          data: cached,
          metadata: {
            cached: true,
            backend: this.backend,
            expiresAt: Date.now() + ttlSeconds * 1000,
            cacheTtlSeconds: ttlSeconds,
          },
        };
      }
    }

    const inflightKey = `${finalKey}-inflight`;
    if (inflight.has(inflightKey)) {
      return inflight.get(inflightKey)! as Promise<WithCacheResult<T>>;
    }

    const promise = (async () => {
      const data = await fetcher();
      await this.set(finalKey, data, ttlSeconds);

      return {
        data,
        metadata: {
          cached: false,
          backend: this.backend,
          expiresAt: Date.now() + ttlSeconds * 1000,
          cacheTtlSeconds: ttlSeconds,
        },
      } satisfies WithCacheResult<T>;
    })();

    inflight.set(inflightKey, promise as Promise<WithCacheResult<unknown>>);

    try {
      const result = await promise;
      return result;
    } finally {
      inflight.delete(inflightKey);
    }
  }

  static getBackend(): CacheMetadata['backend'] {
    return this.backend;
  }
}

export type { CacheMetadata, WithCacheResult };
