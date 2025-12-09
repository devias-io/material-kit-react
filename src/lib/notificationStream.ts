import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { addNotificationListener } from '@/lib/notificationsEmitter';
import { logApiMetric } from '@/lib/api-metrics';
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
  const startTime = Date.now();

  try {
    const session = await auth();
    const userId = session?.user?.id;
    const encoder = new TextEncoder();
    let metricsLogged = false;

    const logMetrics = (statusCode: number) => {
      if (metricsLogged) return;
      metricsLogged = true;
      logApiMetric({
        endpoint: routeLabel,
        method: 'GET',
        statusCode,
        responseTime: Date.now() - startTime,
        cacheHit: false,
        userId
      });
    };

    if (!userId) {
      console.log(
        `[Notifications stream] ${routeLabel}: No session, keeping connection open briefly with error event`
      );
    } else {
      console.log(`[Notifications stream] ${routeLabel}: Starting stream for user ${userId}`);
    }

    let removeListener: (() => void) | null = null;
    let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
    let abortHandler: (() => void) | null = null;
    let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
    let connectionClosed = false;

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
      if (!connectionClosed) {
        logMetrics(userId ? 200 : 401);
        connectionClosed = true;
      }
      console.log(
        `[Notifications stream] ${routeLabel} cleanup executed (${context}) for user ${userId ?? 'unknown'}`
      );
    };

    const stream = new ReadableStream({
      start(controller) {
        if (!userId) {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ message: 'unauthorized' })}\n\n`
            )
          );
          setTimeout(() => {
            logMetrics(401);
            controller.close();
          }, 1000);
          return;
        }

        const sendEvent = (
          event: NotificationStreamEvent,
          eventName?: NotificationStreamEvent['type']
        ) => {
          const type = eventName ?? event.type;
          const payload = `event: ${type}\ndata: ${JSON.stringify(event)}\n\n`;
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
            console.log(
              `[Notifications stream] ${routeLabel} connection timeout for user ${userId} after ${connectionTimeoutMs}ms`
            );
            controller.enqueue(
              encoder.encode(
                `event: timeout\ndata: ${JSON.stringify({ message: 'connection_timeout' })}\n\n`
              )
            );
            setTimeout(() => {
              cleanup('timeout');
              controller.close();
            }, 100);
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
    logApiMetric({
      endpoint: routeLabel,
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      cacheHit: false
    });
    return new Response('Internal server error', { status: 500 });
  }
}
