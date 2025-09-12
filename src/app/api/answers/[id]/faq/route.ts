// src/app/api/answers/[id]/faq/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/utils/auth';

const prisma = new PrismaClient();

// PUT - Marcar/desmarcar resposta como FAQ
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    let user;
    try {
      const payload = verifyToken(token);
      user = await prisma.user.findUnique({ where: { email: payload.email } });
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 401 });
    }

    if (!user || user.plan !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const answer = await prisma.answer.findUnique({
      where: { id: params.id },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            content: true,
            category: true
          }
        }
      }
    });

    if (!answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    const body = await request.json();
    const { isFaq, faqTitle, faqOrder = 0 } = body;

    // Validações
    if (typeof isFaq !== 'boolean') {
      return NextResponse.json({ 
        error: 'isFaq must be a boolean' 
      }, { status: 400 });
    }

    if (isFaq && faqTitle && typeof faqTitle !== 'string') {
      return NextResponse.json({ 
        error: 'faqTitle must be a string' 
      }, { status: 400 });
    }

    if (typeof faqOrder !== 'number' || faqOrder < 0) {
      return NextResponse.json({ 
        error: 'faqOrder must be a non-negative number' 
      }, { status: 400 });
    }

    // Se está marcando como FAQ, gerar um título se não fornecido
    let finalFaqTitle = faqTitle;
    if (isFaq && !finalFaqTitle) {
      finalFaqTitle = answer.question.title;
    }

    // Verificar se já existe FAQ com mesmo título na categoria (se marcando como FAQ)
    if (isFaq && finalFaqTitle) {
      const existingFaq = await prisma.answer.findFirst({
        where: {
          isFaq: true,
          faqTitle: finalFaqTitle.trim(),
          question: {
            category: answer.question.category
          },
          id: { not: params.id } // Excluir a resposta atual
        }
      });

      if (existingFaq) {
        return NextResponse.json({ 
          error: 'A FAQ with this title already exists in this category' 
        }, { status: 400 });
      }
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id: params.id },
      data: {
        isFaq,
        faqTitle: isFaq && finalFaqTitle ? finalFaqTitle.trim() : null,
        faqOrder: isFaq ? faqOrder : 0
      },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            content: true,
            category: true
          }
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({ 
      answer: updatedAnswer,
      message: isFaq ? 'Resposta adicionada ao FAQ' : 'Resposta removida do FAQ'
    });

  } catch (error) {
    console.error('Error updating FAQ status:', error);
    
    // Tratamento específico de erros do Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ 
          error: 'Answer not found' 
        }, { status: 404 });
      }
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
