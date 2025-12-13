import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { addNotificationListener } from '@/lib/notificationsEmitter';
import { logApiMetric } from '@/lib/metrics';
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
  { routeLabel, keepAliveMs = 10000, connectionTimeoutMs = 30000 }: StreamOptions
): Promise<Response> {
  const startTime = Date.now();

  try {
    const session = await auth();
    const userId = session?.user?.id;
    const encoder = new TextEncoder();
    let metricsLogged = false;

    const logMetrics = (statusCode: number, reason?: string) => {
      if (metricsLogged) return;
      metricsLogged = true;
      const extra = userId ? { userId } : reason ? { reason } : undefined;
      logApiMetric({
        route: routeLabel,
        status: statusCode,
        durationMs: Date.now() - startTime,
        cacheHit: false,
        extra
      });
    };

    if (!userId) {
      console.log(
        `[Notifications stream] ${routeLabel}: No session, keeping connection open briefly with unauthorized event`
      );
    } else {
      console.log(`[Notifications stream] ${routeLabel}: Starting stream for user ${userId}`);
    }

    let removeListener: (() => void) | null = null;
    let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
    let abortHandler: (() => void) | null = null;
    let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
    let connectionClosed = false;
    let finalizeStream: ((context: string) => void) | null = null;

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
        logMetrics(userId ? 200 : 200, userId ? undefined : 'unauthenticated');
        connectionClosed = true;
      }
      console.log(
        `[Notifications stream] ${routeLabel} cleanup executed (${context}) for user ${userId ?? 'unknown'}`
      );
    };

    const stream = new ReadableStream({
      start(controller) {
        if (!userId) {
          const unauthorizedPayload = {
            message: 'unauthorized',
            retryAfterMs: 3000
          } satisfies Record<string, unknown>;
          controller.enqueue(
            encoder.encode(`event: unauthorized\ndata: ${JSON.stringify(unauthorizedPayload)}\n\n`)
          );
          setTimeout(() => {
            logMetrics(200, 'unauthenticated');
            controller.close();
          }, unauthorizedPayload.retryAfterMs);
          return;
        }

        let controllerClosed = false;

        finalizeStream = (context: string) => {
          if (controllerClosed) return;
          controllerClosed = true;
          cleanup(context);
          controller.close();
        };

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
        sendComment('handshake-ok');

        removeListener = addNotificationListener(
          userId,
          (event: NotificationRealtimeEvent) => {
            sendEvent(event, event.type);
          }
        );

        keepAliveTimer = setInterval(() => {
          sendComment('keep-alive');
          sendEvent({ type: 'ping' }, 'ping');
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
              finalizeStream?.('timeout');
            }, 100);
          }, connectionTimeoutMs);
        }

        abortHandler = () => {
          finalizeStream?.('abort');
        };

        request.signal.addEventListener('abort', abortHandler);
      },
      cancel() {
        finalizeStream?.('cancel');
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
      route: routeLabel,
      status: 500,
      durationMs: Date.now() - startTime,
      cacheHit: false
    });
    return new Response('Internal server error', { status: 500 });
  }
}
