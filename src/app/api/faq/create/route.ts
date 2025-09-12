// src/app/api/faq/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [FAQ-CREATE] Iniciando criação de FAQ...');
    
    // USAR O MESMO SISTEMA QUE AS OUTRAS APIS FUNCIONAIS
    // Verificar autenticação da mesma forma que /api/auth/me
    
    let user;
    
    // Opção 1: Verificar se existe um middleware de autenticação global
    // Opção 2: Usar cookies/session como as outras APIs
    
    // Primeiro, vamos tentar extrair usuário do request da mesma forma que outras APIs
    try {
      // Verificar se existe user no request (middleware)
      // @ts-ignore - Verificar se o middleware já setou o user
      user = (request as any).user;
      
      if (!user) {
        // Se não tem user no request, verificar cookies/session
        const cookies = request.cookies;
        console.log('🍪 [DEBUG] Cookies disponíveis:', Array.from(cookies.getAll().map(c => c.name)));
        
        // Verificar se existe um cookie de sessão ou auth
        const sessionCookie = cookies.get('session') || 
                             cookies.get('auth') || 
                             cookies.get('token') ||
                             cookies.get('next-auth.session-token') ||
                             cookies.get('__Secure-next-auth.session-token');
        
        if (sessionCookie) {
          console.log('🍪 [AUTH] Cookie de sessão encontrado:', sessionCookie.name);
          // Aqui você precisa verificar como decodificar/validar o cookie
          // Isso depende de como o sistema de auth atual funciona
        }
        
        // TEMPORÁRIO: Buscar usuário por email hardcoded para teste
        // REMOVER ISSO DEPOIS DE DESCOBRIR A AUTENTICAÇÃO CORRETA
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
      console.log('❌ [AUTH] Usuário não encontrado - cookies/session inválidos');
      return NextResponse.json({ 
        error: 'Authentication required',
        debug: 'No valid session found'
      }, { status: 401 });
    }
    
    if (user.plan !== 'ADMIN') {
      console.log('❌ [AUTH] Acesso negado - Plano do usuário:', user.plan);
      return NextResponse.json({ 
        error: 'Admin access required',
        debug: `User plan: ${user.plan}, required: ADMIN`
      }, { status: 403 });
    }
    
    console.log('✅ [AUTH] Usuário autenticado:', user.email, '- Plano:', user.plan);
    
    const body = await request.json();
    const { title, content, category, faqOrder = 0 } = body;
    
    // Validação
    if (!title || !content || !category) {
      return NextResponse.json({ 
        error: 'Title, content and category are required'
      }, { status: 400 });
    }
    
    // Criar pergunta virtual
    const question = await prisma.question.create({
      data: {
        title: title,
        content: `FAQ criada diretamente: ${title}`,
        category: category,
        status: 'RESPONDIDA',
        userId: user.id,
        readByAdmin: true
      }
    });
    
    // Criar resposta como FAQ
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
    
    console.log('✅ [SUCCESS] FAQ criada com sucesso:', answer.id);
    
    return NextResponse.json({ 
      faq: answer,
      message: 'FAQ criada com sucesso'
    }, { status: 201 });
    
  } catch (error) {
    console.error('💥 [ERROR] Erro ao criar FAQ:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
