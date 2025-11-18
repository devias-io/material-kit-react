// src/app/api/response-templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Listar templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user;

    if (user.plan !== 'ADMIN' && user.plan !== 'ANALISTA') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let whereClause: any = {};

    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    if (isActive !== null && isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const templates = await prisma.responseTemplate.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.responseTemplate.count({
      where: whereClause
    });

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Criar novo template
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user;

    if (user.plan !== 'ADMIN' && user.plan !== 'ANALISTA') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, category = 'GERAL', isActive = true } = body;

    // Validações
    if (!title || !content) {
      return NextResponse.json({ 
        error: 'Title and content are required' 
      }, { status: 400 });
    }

    if (typeof title !== 'string' || typeof content !== 'string') {
      return NextResponse.json({ 
        error: 'Title and content must be strings' 
      }, { status: 400 });
    }

    if (title.trim().length === 0 || content.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Title and content cannot be empty' 
      }, { status: 400 });
    }

    if (title.length > 200) {
      return NextResponse.json({ 
        error: 'Title must be less than 200 characters' 
      }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ 
        error: 'Content must be less than 5000 characters' 
      }, { status: 400 });
    }

    // Verificar se já existe um template com o mesmo título
    const existingTemplate = await prisma.responseTemplate.findFirst({
      where: {
        title: title.trim(),
        category: category
      }
    });

    if (existingTemplate) {
      return NextResponse.json({ 
        error: 'A template with this title already exists in this category' 
      }, { status: 400 });
    }

    const template = await prisma.responseTemplate.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category,
        isActive: Boolean(isActive),
        usageCount: 0,
        createdBy: user.id // Campo correto conforme schema
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ template }, { status: 201 });

  } catch (error) {
    console.error('Error creating template:', error);
    
    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Verificar se é um erro de validação do Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      
      if (prismaError.code === 'P2002') {
        return NextResponse.json({ 
          error: 'A template with this title already exists' 
        }, { status: 400 });
      }
      
      if (prismaError.code === 'P2003') {
        return NextResponse.json({ 
          error: 'Invalid user reference' 
        }, { status: 400 });
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