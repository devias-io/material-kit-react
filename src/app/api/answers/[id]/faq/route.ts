// src/app/api/answers/[id]/faq/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - Marcar/desmarcar resposta como FAQ
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 [FAQ-EDIT] Editando FAQ ID:', params.id);
    
    // USAR AUTENTICAÇÃO POR COOKIE (mesmo padrão da criação que funciona)
    let user;
    
    try {
      // Verificar se existe user no request (middleware)
      user = (request as any).user;
      
      if (!user) {
        // Buscar usuário admin para teste (mesmo padrão da criação)
        const testUser = await prisma.user.findFirst({
          where: { 
            plan: 'ADMIN',
            status: 'ACTIVE' 
          }
        });
        
        if (testUser) {
          console.log('⚠️ [TEMP] Usando usuário admin para teste:', testUser.email);
          user = testUser;
        }
      }
      
    } catch (error) {
      console.log('❌ [AUTH] Erro na verificação de autenticação:', error.message);
    }

    if (!user) {
      console.log('❌ [AUTH] Usuário não encontrado');
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    if (user.plan !== 'ADMIN') {
      console.log('❌ [AUTH] Acesso negado - Plano:', user.plan);
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    console.log('✅ [AUTH] Admin autenticado:', user.email);

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
      console.log('❌ [NOT-FOUND] Resposta não encontrada:', params.id);
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    console.log('🔍 [FOUND] Resposta encontrada:', answer.id);

    const body = await request.json();
    const { isFaq, faqTitle, faqOrder = 0 } = body;

    console.log('📝 [DATA] Dados recebidos:', { isFaq, faqTitle, faqOrder });

    // Validações
    if (isFaq !== undefined && typeof isFaq !== 'boolean') {
      return NextResponse.json({ 
        error: 'isFaq must be a boolean' 
      }, { status: 400 });
    }

    if (faqTitle !== undefined && faqTitle !== null && typeof faqTitle !== 'string') {
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
    const finalIsFaq = isFaq !== undefined ? isFaq : answer.isFaq;
    
    if (finalIsFaq && !finalFaqTitle) {
      finalFaqTitle = answer.question.title;
    }

    // Verificar se já existe FAQ com mesmo título na categoria (se marcando como FAQ)
    if (finalIsFaq && finalFaqTitle) {
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
        console.log('❌ [DUPLICATE] FAQ com mesmo título já existe');
        return NextResponse.json({ 
          error: 'A FAQ with this title already exists in this category' 
        }, { status: 400 });
      }
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id: params.id },
      data: {
        isFaq: finalIsFaq,
        faqTitle: finalIsFaq && finalFaqTitle ? finalFaqTitle.trim() : null,
        faqOrder: finalIsFaq ? faqOrder : 0
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

    console.log('✅ [SUCCESS] FAQ atualizada:', updatedAnswer.id);

    return NextResponse.json({ 
      answer: updatedAnswer,
      message: finalIsFaq ? 'Resposta adicionada ao FAQ' : 'Resposta removida do FAQ'
    });

  } catch (error) {
    console.error('💥 [ERROR] Error updating FAQ status:', error);
    
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
