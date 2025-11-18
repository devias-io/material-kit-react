import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { auth } from '@/lib/auth';
import { emitNotificationEvent } from '@/lib/notificationsEmitter';

// GET - Listar notificações do usuário
export async function GET(request: NextRequest) {
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

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const totalNotifications = await prisma.notification.count({
      where: whereClause
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false
      }
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total: totalNotifications,
        totalPages: Math.ceil(totalNotifications / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
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
  } finally {
    await prisma.$disconnect();
  }
}