import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { auth } from '@/lib/auth';
import { emitNotificationEvent } from '@/lib/notificationsEmitter';

const prisma = new PrismaClient();

// PUT - Marcar todas as notificações como lidas
export async function PUT() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user;

    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        read: false
      },
      data: {
        read: true
      }
    });

    emitNotificationEvent(user.id, {
      type: 'refresh',
      reason: 'mark-all-read'
    });

    return NextResponse.json({ updatedCount: result.count });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

