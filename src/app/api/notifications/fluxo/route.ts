import { NextRequest } from 'next/server';

import { createNotificationStreamResponse } from '@/lib/notificationStream';

export const revalidate = 60;

export async function GET(request: NextRequest) {
  return createNotificationStreamResponse(request, {
    routeLabel: '/api/notifications/fluxo',
    // Mantemos a conexão aberta por mais tempo para evitar reconexões
    // frequentes que estavam gerando excesso de requisições e erros 429.
    connectionTimeoutMs: 5 * 60 * 1000
  });
}
