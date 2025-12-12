import { CacheService } from './redis';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
};

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const cacheKey = CacheService.getCacheKey('ratelimit', key);
  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  const current = await CacheService.increment(cacheKey, ttlSeconds);
  const remaining = Math.max(0, limit - current);

  if (current > limit) {
    const retryAfter = await CacheService.getTtlSeconds(cacheKey);
    return {
      allowed: false,
      remaining: 0,
      retryAfter: retryAfter ?? ttlSeconds,
    };
  }

  return { allowed: true, remaining };
}
