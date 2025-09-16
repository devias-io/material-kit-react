import { EventEmitter } from 'node:events';

import type { NotificationRealtimeEvent } from '@/types/notifications';

type NotificationListener = (event: NotificationRealtimeEvent) => void;

const globalForNotifications = globalThis as unknown as {
  notificationEmitter?: EventEmitter;
};

const emitter =
  globalForNotifications.notificationEmitter ?? new EventEmitter();

emitter.setMaxListeners(0);

if (!globalForNotifications.notificationEmitter) {
  globalForNotifications.notificationEmitter = emitter;
}

const getChannel = (userId: string) => `notification:${userId}`;

export function emitNotificationEvent(
  userId: string,
  event: NotificationRealtimeEvent
) {
  emitter.emit(getChannel(userId), event);
}

export function addNotificationListener(
  userId: string,
  listener: NotificationListener
) {
  const channel = getChannel(userId);
  emitter.on(channel, listener);

  return () => {
    emitter.off(channel, listener);
  };
}

