import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { addNotificationListener } from '@/lib/notificationsEmitter';
import type { NotificationRealtimeEvent, NotificationStreamEvent } from '@/types/notifications';

interface StreamOptions {
  routeLabel: string;
  keepAliveMs?: number;
  connectionTimeoutMs?: number;
}

/**
 * Cria uma resposta SSE para streaming de notificações do usuário.
 * Inclui timeouts, limpeza e logging detalhado para diagnósticos.
 */
export async function createNotificationStreamResponse(
  request: NextRequest,
  { routeLabel, keepAliveMs = 15000, connectionTimeoutMs = 120000 }: StreamOptions
): Promise<Response> {
  try {
    const session = await auth();

    if (!session?.user) {
      return new Response('Authentication required', { status: 401 });
    }

    const userId = session.user.id;
    const encoder = new TextEncoder();

    let removeListener: (() => void) | null = null;
    let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
    let abortHandler: (() => void) | null = null;
    let connectionTimeout: ReturnType<typeof setTimeout> | null = null;

    const cleanup = (context: string) => {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }

      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }

      if (removeListener) {
        removeListener();
        removeListener = null;
      }

      if (abortHandler) {
        request.signal.removeEventListener('abort', abortHandler);
        abortHandler = null;
      }

      console.log(`[Notifications stream] ${routeLabel} cleanup executed (${context}) for user ${userId}`);
    };

    const stream = new ReadableStream({
      start(controller) {
        const sendEvent = (
          event: NotificationStreamEvent,
          eventName?: NotificationStreamEvent['type']
        ) => {
          const type = eventName ?? event.type;
          const payload = `event: ${type}\n` +
            `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        };

        const sendComment = (comment: string) => {
          controller.enqueue(encoder.encode(`: ${comment}\n\n`));
        };

        sendEvent({ type: 'connected' }, 'connected');

        removeListener = addNotificationListener(
          userId,
          (event: NotificationRealtimeEvent) => {
            sendEvent(event, event.type);
          }
        );

        keepAliveTimer = setInterval(() => {
          sendComment('keep-alive');
        }, keepAliveMs);

        if (connectionTimeoutMs && connectionTimeoutMs > 0) {
          connectionTimeout = setTimeout(() => {
            console.error(`[` +
              `Notifications stream] ${routeLabel} connection timeout for user ${userId} after ${connectionTimeoutMs}ms`
            );
            cleanup('timeout');
            controller.close();
          }, connectionTimeoutMs);
        }

        abortHandler = () => {
          cleanup('abort');
          controller.close();
        };

        request.signal.addEventListener('abort', abortHandler);
      },
      cancel() {
        cleanup('cancel');
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    });
  } catch (error) {
    console.error(`[Notifications stream] ${routeLabel}: failed to open stream`, error);
    return new Response('Internal server error', { status: 500 });
  }
}
