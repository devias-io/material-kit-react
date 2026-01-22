// app/api/notifications/fluxo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createNotificationStreamResponse } from '@/lib/notificationStream';
import { consumeRateLimit, getClientRateLimitKey } from '@/lib/rateLimiter';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const maxDuration = 300; // ✅ Máximo do Vercel Pro

export async function GET(request: NextRequest) {
  const { allowed, retryAfterMs } = consumeRateLimit({
    key: `notifications:stream:${getClientRateLimitKey(request)}`,
    limit: 5,
    windowMs: 10 * 60 * 1000
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
    keepAliveMs: 20000, // Ping a cada 20s
    connectionTimeoutMs: 290000 // ✅ 4min50s - fecha ANTES do Vercel matar
  });
}
