// src/app/api/questions/[id]/answers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyQuestionAnswered } from '@/utils/notifications';
import { auth } from '@/lib/auth';

// POST - Criar resposta (só admin)
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

    // Verificar se é admin
    if (user.plan !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can create answers' }, { status: 403 });
    }

    // Verificar se a pergunta existe
    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content, isOfficial = true } = body;

    // Validações
    if (!content) {
      return NextResponse.json({ 
        error: 'Content is required' 
      }, { status: 400 });
    }

    if (typeof content !== 'string') {
      return NextResponse.json({ 
        error: 'Content must be a string' 
      }, { status: 400 });
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Content cannot be empty' 
      }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ 
        error: 'Content must be less than 5000 characters' 
      }, { status: 400 });
    }

    // Criar resposta
    const answer = await prisma.answer.create({
      data: {
        content: content.trim(),
        questionId: params.id,
        adminId: user.id,
        isOfficial: Boolean(isOfficial)
      },
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Atualizar status da pergunta para RESPONDIDA
    await prisma.question.update({
      where: { id: params.id },
      data: {
        status: 'RESPONDIDA'
      }
    });

    // Dispara notificação para o usuário (APÓS atualizar status)
    try {
      const adminName = `${user.firstName} ${user.lastName}`;
      await notifyQuestionAnswered(params.id, adminName);
    } catch (notificationError) {
      console.error('Erro ao enviar notificação:', notificationError);
      // Não falha a resposta se a notificação falhar
    }

    return NextResponse.json({ 
      answer,
      message: 'Answer created successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating answer:', error);
    
    // Tratamento específico de erros do Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ 
          error: 'Question not found' 
        }, { status: 404 });
      }
      
      if (prismaError.code === 'P2003') {
        return NextResponse.json({ 
          error: 'Invalid question or admin reference' 
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}


// GET - Listar respostas de uma pergunta
export async function GET(
  _request: NextRequest,
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

    // Verificar se a pergunta existe
    const question = await prisma.question.findUnique({
      where: { id: params.id }
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Verificar permissão
    const isAdmin = user.plan === 'ADMIN';
    const isOwner = question.userId === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Buscar respostas
    const answers = await prisma.answer.findMany({
      where: { questionId: params.id },
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Marcar como lidas pelo usuário se for o dono
    if (isOwner && !isAdmin) {
      const unreadAnswerIds = answers
        .filter(answer => !answer.readByUser)
        .map(answer => answer.id);

      if (unreadAnswerIds.length > 0) {
        await prisma.answer.updateMany({
          where: {
            id: { in: unreadAnswerIds }
          },
          data: {
            readByUser: true
          }
        });

        // Atualizar o array local para refletir mudança
        answers.forEach(answer => {
          if (unreadAnswerIds.includes(answer.id)) {
            answer.readByUser = true;
          }
        });
      }
    }

    return NextResponse.json({ answers });

  } catch (error) {
    console.error('Error fetching answers:', error);
    
    // Tratamento específico de erros do Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ 
          error: 'Question not found' 
        }, { status: 404 });
      }
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
