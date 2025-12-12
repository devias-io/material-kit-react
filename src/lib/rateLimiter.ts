const windows = new Map<string, number[]>();

interface RateLimitConfig {
  key: string;
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function consumeRateLimit({ key, limit, windowMs }: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = windows.get(key) ?? [];
  const recent = timestamps.filter(ts => ts > windowStart);

  if (recent.length >= limit) {
    const retryAfterMs = Math.max(0, recent[0] + windowMs - now);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  recent.push(now);
  windows.set(key, recent);

  return {
    allowed: true,
    remaining: Math.max(0, limit - recent.length),
    retryAfterMs: 0
  };
}

export function getClientRateLimitKey(
  request: Request,
  fallback: string = 'anonymous'
): string {
  const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
  const firstIp = forwardedFor.split(',')[0]?.trim();
  return firstIp || fallback;
}
