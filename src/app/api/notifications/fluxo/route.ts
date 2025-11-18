import { NextRequest } from 'next/server';

import { createNotificationStreamResponse } from '@/lib/notificationStream';

export const revalidate = 60;

export async function GET(request: NextRequest) {
  return createNotificationStreamResponse(request, {
    routeLabel: '/api/notifications/fluxo',
    connectionTimeoutMs: 120000
  });
}
