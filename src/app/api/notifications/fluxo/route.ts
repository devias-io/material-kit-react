import { NextRequest, NextResponse } from 'next/server';

import { createNotificationStreamResponse } from '@/lib/notificationStream';
import { consumeRateLimit, getClientRateLimitKey } from '@/lib/rateLimiter';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const { allowed, retryAfterMs } = consumeRateLimit({
    key: `notifications:stream:${getClientRateLimitKey(request)}`,
    limit: 10,
    windowMs: 10 * 60 * 1000
  });

  if (!allowed) {
    return NextResponse.json(
      { error: 'Stream rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
    );
  }

  return createNotificationStreamResponse(request, {
    routeLabel: '/api/notifications/fluxo',
    // Mantemos a conexão aberta por mais tempo para evitar reconexões
    // frequentes que estavam gerando excesso de requisições e erros 429.
    connectionTimeoutMs: 30000
  });
}
