import { NextRequest } from 'next/server';

import { createNotificationStreamResponse } from '@/lib/notificationStream';

// Alias route for the notifications SSE stream used by legacy clients
export const revalidate = 60;

export async function GET(request: NextRequest) {
  return createNotificationStreamResponse(request, {
    routeLabel: '/api/notifications/stream',
    // Mantemos a conexão aberta por mais tempo para evitar desconexões
    // frequentes que estavam gerando excesso de requisições e erros 429.
    connectionTimeoutMs: 5 * 60 * 1000
  });
}
