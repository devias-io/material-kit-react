// app/api/auth/check/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CacheService } from '@/lib/redis';
import { logApiMetric } from '@/lib/metrics';
import { consumeRateLimit, getClientRateLimitKey } from '@/lib/rateLimiter';

export const maxDuration = 3;

export async function GET(request: NextRequest) {
  const startedAt = Date.now();

  const { allowed, retryAfterMs } = consumeRateLimit({
    key: `auth-check:${getClientRateLimitKey(request)}`,
    limit: 6,
    windowMs: 5 * 60 * 1000
  });

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many auth checks, slow down' },
      { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
    );
  }
  
  try {
    const session = await auth();
    
    if (!session?.user?.id) {  // ✅ Melhor checar também o user.id
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const cacheKey = CacheService.getCacheKey('auth-check', session.user.id);
    
    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () => ({ authenticated: true }),
      {
        ttlSeconds: 60,
        tags: [`session:${session.user.id}`],  // ✅ CORRIGIDO: adicionado [
      }
    );

    logApiMetric({
      route: '/api/auth/check',
      cacheHit: metadata.cached,
      cacheBackend: metadata.backend,
      durationMs: Date.now() - startedAt,
      status: 200,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na verificação de auth:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
