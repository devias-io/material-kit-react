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
  const now = Date.now();
  const windowEndsAt = now + windowMs;
  const cacheKey = CacheService.getCacheKey('ratelimit', key);

  const current = await CacheService.get<{ count: number; expiresAt: number }>(cacheKey);

  if (!current || current.expiresAt <= now) {
    await CacheService.set(cacheKey, { count: 1, expiresAt: windowEndsAt }, windowMs / 1000);
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(0, Math.ceil((current.expiresAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfter };
  }

  const next = { count: current.count + 1, expiresAt: current.expiresAt };
  const ttlSeconds = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));
  await CacheService.set(cacheKey, next, ttlSeconds);

  return { allowed: true, remaining: limit - next.count };
}
