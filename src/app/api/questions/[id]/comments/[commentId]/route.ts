// src/app/api/questions/[id]/comments/[commentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// DELETE - Remover comentário
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: params.commentId }
    });
    if (!comment || comment.questionId !== params.id) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const isAdmin = user.plan === 'ADMIN';
    const isAuthor = comment.authorId === user.id;
    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: params.commentId } });
    return NextResponse.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
