// app/api/notifications/mark-all-read/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { emitNotificationEvent } from '@/lib/notificationsEmitter';
import { CacheService } from '@/lib/redis';
import { logApiMetric } from '@/lib/metrics';

// PUT - Marcar todas as notificações como lidas
export async function PUT() {
  const startedAt = Date.now();

  try {
    const session = await auth();
    
    if (!session?.user) {
      logApiMetric({
        route: '/api/notifications/mark-all-read',
        status: 401,
        durationMs: Date.now() - startedAt,
        cacheHit: false
      });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user;

    // Atualizar todas as notificações não lidas do usuário
    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        read: false
      },
      data: {
        read: true
      }
    });

    // Invalidar cache de notificações do usuário
    await CacheService.invalidateTags([`notifications:${user.id}`]);

    // Emitir evento SSE para atualizar interface em tempo real
    emitNotificationEvent(user.id, {
      type: 'refresh',
      reason: 'mark-all-read'
    });

    logApiMetric({
      route: '/api/notifications/mark-all-read',
      status: 200,
      durationMs: Date.now() - startedAt,
      cacheHit: false,
      extra: { updatedCount: result.count, userId: user.id }
    });

    return NextResponse.json({ 
      updatedCount: result.count,
      message: `${result.count} notification(s) marked as read`
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    
    logApiMetric({
      route: '/api/notifications/mark-all-read',
      status: 500,
      durationMs: Date.now() - startedAt,
      cacheHit: false
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
