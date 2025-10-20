// src/app/api/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// GET - Listar perguntas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verificar se é admin
    const isAdmin = user.plan === 'ADMIN';
    
    // Filtros opcionais
    const statusParam = searchParams.get('status');
    const excludeVirtual = searchParams.get('excludeVirtual') === 'true';

    // Parse paginação com valores padrão seguros
    const parsePositiveInt = (value: string | null, defaultValue: number) => {
      const parsed = Number(value);
      if (!value || Number.isNaN(parsed) || parsed < 1) {
        return defaultValue;
      }
      return Math.floor(parsed);
    };

    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = parsePositiveInt(searchParams.get('limit'), 10);

    // Query base
    let whereClause: any = {};

    // Se não é admin, só mostra suas próprias perguntas
    if (!isAdmin) {
      whereClause.userId = user.id;
    }

    // Filtros adicionais
    if (statusParam) {
      const statusFilters = statusParam
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      if (statusFilters.length === 1) {
        whereClause.status = statusFilters[0];
      } else if (statusFilters.length > 1) {
        whereClause.status = { in: statusFilters };
      }
    }
    

    // Para admins, buscar perguntas específicas de outros usuários
    const targetUserId = searchParams.get('userId');
    if (isAdmin && targetUserId) {
      whereClause.userId = targetUserId;
    }

    if (excludeVirtual) {
      whereClause.answers = { none: { isFaq: true } };
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            plan: true
          }
        },
        answers: {
          include: {
            admin: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            comments: {
              include: {
                author: {
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
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        comments: {
          include: {
            author: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Marcar como lidas pelo admin se necessário
    if (isAdmin) {
      const unreadQuestionIds = questions
        .filter(q => !q.readByAdmin)
        .map(q => q.id);

      if (unreadQuestionIds.length > 0) {
        await prisma.question.updateMany({
          where: {
            id: { in: unreadQuestionIds }
          },
          data: {
            readByAdmin: true
          }
        });
      }
    }

    // Contar total para paginação
    const total = await prisma.question.count({
      where: whereClause
    });

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      isAdmin
    });

  } catch (error) {
    console.error('GET /api/questions failed:', error);

    let errorMessage = 'Internal server error';

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorMessage = 'Database error';
    }

    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST - Criar nova pergunta (só usuários)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, content, priority = 'NORMAL' } = body;

    // Validações
    if (!title || !content) {
      return NextResponse.json({ 
        error: 'Title and content are required' 
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

    const question = await prisma.question.create({
      data: {
        title,
        content,
        priority,
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            plan: true
          }
        }
      }
    });

    return NextResponse.json({ question }, { status: 201 });

  } catch (error) {
    console.error('POST /api/questions failed:', error);

    let errorMessage = 'Internal server error';

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorMessage = 'Database error';
    }

    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
