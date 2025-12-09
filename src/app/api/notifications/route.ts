import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { auth } from '@/lib/auth';
import { emitNotificationEvent } from '@/lib/notificationsEmitter';
import { CacheService } from '@/lib/redis';
import { logApiMetric } from '@/lib/metrics';

export const maxDuration = 5;

// GET - Listar notificações do usuário
export async function GET(request: NextRequest) {
  const startedAt = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const whereClause: any = {
      userId: user.id
    };

    if (unreadOnly) {
      whereClause.read = false;
    }

    const cacheKey = CacheService.getCacheKey(
      'notifications',
      user.id,
      `page:${page}`,
      `limit:${limit}`,
      `unread:${unreadOnly}`
    );

    const { data, metadata } = await CacheService.withCache(
      cacheKey,
      async () => {
        const [notifications, totalNotifications, unreadCount] = await Promise.all([
          prisma.notification.findMany({
            where: whereClause,
            select: {
              id: true,
              type: true,
              title: true,
              message: true,
              read: true,
              createdAt: true,
              link: true,
            },
            orderBy: {
              createdAt: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit
          }),
          prisma.notification.count({
            where: whereClause
          }),
          prisma.notification.count({
            where: {
              userId: user.id,
              read: false
            }
          })
        ]);

        return {
          notifications,
          unreadCount,
          pagination: {
            page,
            limit,
            total: totalNotifications,
            totalPages: Math.ceil(totalNotifications / limit)
          }
        };
      },
      {
        ttlSeconds: 120,
        tags: [`notifications:${user.id}`],
      }
    );

    const response = NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, max-age=0, must-revalidate',
      }
    });

    logApiMetric({
      route: '/api/notifications',
      cacheHit: metadata.cached,
      cacheBackend: metadata.backend,
      durationMs: Date.now() - startedAt,
      status: 200,
      extra: { unreadOnly, page, limit },
    });

    return response;

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
  // Sem finally, sem disconnect - o singleton do Prisma gerencia isso!
}

// POST - Criar nova notificação (para admins)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user;

    if (user.plan !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      targetUserId,
      targetPlan,
      targetPlans,
      title,
      message,
      type = 'info',
      category = 'general',
      actionUrl,
      metadata = {}
    } = body;

    if (!title || !message) {
      return NextResponse.json({
        error: 'title and message are required'
      }, { status: 400 });
    }

    const plansInput: string[] = [];

    if (Array.isArray(targetPlans)) {
      plansInput.push(
        ...targetPlans
          .filter((plan: unknown): plan is string => typeof plan === 'string')
          .map(plan => plan.trim())
          .filter(Boolean)
      );
    }

    if (typeof targetPlan === 'string' && targetPlan.trim()) {
      plansInput.push(targetPlan.trim());
    }

    const uniquePlans = Array.from(new Set(plansInput));

    if (!targetUserId && uniquePlans.length === 0) {
      return NextResponse.json({
        error: 'targetUserId or targetPlans is required'
      }, { status: 400 });
    }

    const recipientIds = new Set<string>();

    if (targetUserId && typeof targetUserId === 'string') {
      recipientIds.add(targetUserId);
    }

    if (uniquePlans.length > 0) {
      const usersFromPlans = await prisma.user.findMany({
        where: {
          plan: {
            in: uniquePlans
          }
        },
        select: {
          id: true
        }
      });

      usersFromPlans.forEach(userRecord => {
        if (userRecord.id) {
          recipientIds.add(userRecord.id);
        }
      });
    }

    if (recipientIds.size === 0) {
      return NextResponse.json({
        error: 'No recipients found for the provided criteria'
      }, { status: 404 });
    }

    const metadataPayload =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? metadata
        : {};

    const baseMetadata = {
      ...metadataPayload,
      ...(uniquePlans.length > 0 ? { targetPlans: uniquePlans } : {}),
      broadcast: uniquePlans.length > 0,
      createdBy: user.id,
      createdByEmail: user.email
    };

    const sanitizedActionUrl =
      typeof actionUrl === 'string' && actionUrl.trim() ? actionUrl.trim() : undefined;

    const notifications = await prisma.$transaction(
      Array.from(recipientIds).map(recipientId =>
        prisma.notification.create({
          data: {
            userId: recipientId,
            title: title.trim(),
            message: message.trim(),
            type,
            category,
            actionUrl: sanitizedActionUrl,
            metadata: baseMetadata
          }
        })
      )
    );

    Array.from(recipientIds).forEach(recipientId => {
      emitNotificationEvent(recipientId, {
        type: 'refresh',
        reason: 'created'
      });
    });

    await CacheService.invalidateTags(Array.from(recipientIds).map(id => `notifications:${id}`));

    return NextResponse.json({
      notificationsCreated: notifications.length,
      recipients: Array.from(recipientIds),
      message: `Notification created for ${notifications.length} recipient(s)`
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
  // Sem finally, sem disconnect - o singleton do Prisma gerencia isso!
}
