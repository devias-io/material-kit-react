// app/api/auth/check/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CacheService } from '@/lib/redis';
import { logApiMetric } from '@/lib/metrics';

export const config = {
  maxDuration: 3,
};

export async function GET() {
  const startedAt = Date.now();

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const cacheKey = CacheService.getCacheKey('auth-check', session.user?.id ?? 'guest');

    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () => ({ authenticated: true }),
      {
        ttlSeconds: 60,
        tags: session.user?.id ? [`session:${session.user.id}`] : undefined,
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
