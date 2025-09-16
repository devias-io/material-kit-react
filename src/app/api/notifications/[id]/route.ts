import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { auth } from '@/lib/auth';
import { emitNotificationEvent } from '@/lib/notificationsEmitter';

const prisma = new PrismaClient();

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

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
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

    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

