import { NextRequest } from 'next/server';

import { createNotificationStreamResponse } from '@/lib/notificationStream';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  return createNotificationStreamResponse(request, {
    routeLabel: '/api/notifications/fluxo',
    // Mantemos a conexão aberta por mais tempo para evitar reconexões
    // frequentes que estavam gerando excesso de requisições e erros 429.
    connectionTimeoutMs: 120000
  });
}
