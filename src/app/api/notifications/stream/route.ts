import { NextRequest } from 'next/server';

import { createNotificationStreamResponse } from '@/lib/notificationStream';

// Alias route for the notifications SSE stream used by legacy clients
export const revalidate = 60;

export async function GET(request: NextRequest) {
  return createNotificationStreamResponse(request, {
    routeLabel: '/api/notifications/stream',
    connectionTimeoutMs: 60000
  });
}
