export type NotificationRealtimeReason =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'mark-all-read'
  | 'manual-sync';

export interface NotificationRealtimeEvent {
  type: 'refresh';
  reason?: NotificationRealtimeReason;
}

export type NotificationStreamEvent =
  | NotificationRealtimeEvent
  | { type: 'connected' };

