// src/app/api/questions/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// POST - Criar comentário na pergunta ou resposta
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const question = await prisma.question.findUnique({
      where: { id: params.id }
    });
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const isAdmin = user.plan === 'ADMIN' || user.plan === 'ANALISTA';
    if (!isAdmin) {
      console.warn(
        `Unauthorized comment creation attempt by user ${user.id} on question ${params.id}`
      );
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { content, answerId } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Content must be less than 1000 characters' }, { status: 400 });
    }

    if (answerId) {
      const answer = await prisma.answer.findUnique({ where: { id: answerId } });
      if (!answer || answer.questionId !== params.id) {
        return NextResponse.json({ error: 'Invalid answer reference' }, { status: 400 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        questionId: params.id,
        answerId: answerId || undefined,
        authorId: user.id
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
