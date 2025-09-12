// src/app/api/faq/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/utils/auth';

const prisma = new PrismaClient();

// POST - Criar FAQ direta
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, content, category, faqOrder = 0 } = body;

    // Validação
    if (!title || !content || !category) {
      return NextResponse.json({ 
        error: 'Title, content and category are required' 
      }, { status: 400 });
    }

    // Criar uma pergunta "virtual" para a FAQ
    const question = await prisma.question.create({
      data: {
        title: title,
        content: `FAQ criada diretamente: ${title}`,
        category: category,
        status: 'RESPONDIDA',
        userId: user.id, // Admin como criador
        readByAdmin: true
      }
    });

    // Criar a resposta como FAQ
    const answer = await prisma.answer.create({
      data: {
        content: content,
        questionId: question.id,
        adminId: user.id,
        isOfficial: true,
        readByUser: true,
        isFaq: true,
        faqTitle: title,
        faqOrder: faqOrder
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
      faq: answer,
      message: 'FAQ criada com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}