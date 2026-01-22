// app/api/notifications/fluxo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createNotificationStreamResponse } from '@/lib/notificationStream';
import { consumeRateLimit, getClientRateLimitKey } from '@/lib/rateLimiter';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  // Rate limit mais relaxado - agora precisamos de menos reconexões
  const { allowed, retryAfterMs } = consumeRateLimit({
    key: `notifications:stream:${getClientRateLimitKey(request)}`,
    limit: 5, // Reduzido de 10 para 5 - menos reconexões necessárias
    windowMs: 10 * 60 * 1000 // 10 minutos
  });

  if (!allowed) {
    return NextResponse.json(
      { error: 'Stream rate limit exceeded' },
      { 
        status: 429, 
        headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } 
      }
    );
  }

  return createNotificationStreamResponse(request, {
    routeLabel: '/api/notifications/fluxo',
    keepAliveMs: 20000, // Ping a cada 20s (otimizado)
    connectionTimeoutMs: 0 // 0 = sem timeout forçado, deixa o Vercel gerenciar
  });
}
