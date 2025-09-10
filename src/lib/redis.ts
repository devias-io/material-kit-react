// lib/redis.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export class CacheService {
  private static TTL_DEFAULT = 300; // 5 minutos
  
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  static async set(key: string, data: any, ttl = this.TTL_DEFAULT): Promise<void> {
    try {
      await redis.setex(key, ttl, data);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  static getCacheKey(ticker: string): string {
    return `ativo:${ticker}:completo`;
  }
}