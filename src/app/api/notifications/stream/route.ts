import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { addNotificationListener } from '@/lib/notificationsEmitter';
import type {
  NotificationRealtimeEvent,
  NotificationStreamEvent
} from '@/types/notifications';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new Response('Authentication required', { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  let removeListener: (() => void) | null = null;
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  let abortHandler: (() => void) | null = null;

  const cleanup = () => {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }

    if (removeListener) {
      removeListener();
      removeListener = null;
    }

    if (abortHandler) {
      request.signal.removeEventListener('abort', abortHandler);
      abortHandler = null;
    }
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
      }, 15000);

      abortHandler = () => {
        cleanup();
        controller.close();
      };

      request.signal.addEventListener('abort', abortHandler);
    },
    cancel() {
      cleanup();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}

