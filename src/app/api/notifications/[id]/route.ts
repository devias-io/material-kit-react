import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { auth } from '@/lib/auth';
import { emitNotificationEvent } from '@/lib/notificationsEmitter';
import { CacheService } from '@/lib/redis';
import { logApiMetric } from '@/lib/metrics';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const startedAt = Date.now();

  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const cacheKey = CacheService.getCacheKey('notification', params.id, session.user.id);

    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () => {
        const notification = await prisma.notification.findFirst({
          where: {
            id: params.id,
            userId: session.user.id,
          },
        });

        return notification;
      },
      { ttlSeconds: 60, tags: [`notifications:${session.user.id}`] }
    );

    if (!data) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    logApiMetric({
      route: '/api/notifications/[id]',
      cacheHit: metadata.cached,
      cacheBackend: metadata.backend,
      durationMs: Date.now() - startedAt,
      status: 200,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notification detail:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

// PUT - Marcar notificação como lida
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const result = await prisma.notification.updateMany({
      where: {
        id: params.id,
        userId: session.user.id
      },
      data: { read: true }
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    emitNotificationEvent(session.user.id, {
      type: 'refresh',
      reason: 'updated'
    });

    await CacheService.invalidateTags([`notifications:${session.user.id}`]);

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

// DELETE - Remover notificação
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const result = await prisma.notification.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    emitNotificationEvent(session.user.id, {
      type: 'refresh',
      reason: 'deleted'
    });

    await CacheService.invalidateTags([`notifications:${session.user.id}`]);

    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

