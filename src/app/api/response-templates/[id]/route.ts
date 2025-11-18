// src/app/api/response-templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/utils/auth';

// GET - Buscar template específico
export async function GET(
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

    if (!user || (user.plan !== 'ADMIN' && user.plan !== 'ANALISTA')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const template = await prisma.responseTemplate.findUnique({
      where: { id: params.id },
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

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });

  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Atualizar template
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

    if (!user || (user.plan !== 'ADMIN' && user.plan !== 'ANALISTA')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const template = await prisma.responseTemplate.findUnique({
      where: { id: params.id }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, category, isActive } = body;

    // Validações
    if (title && typeof title !== 'string') {
      return NextResponse.json({ 
        error: 'Title must be a string' 
      }, { status: 400 });
    }

    if (content && typeof content !== 'string') {
      return NextResponse.json({ 
        error: 'Content must be a string' 
      }, { status: 400 });
    }

    if (title && title.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Title cannot be empty' 
      }, { status: 400 });
    }

    if (content && content.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Content cannot be empty' 
      }, { status: 400 });
    }

    if (title && title.length > 200) {
      return NextResponse.json({ 
        error: 'Title must be less than 200 characters' 
      }, { status: 400 });
    }

    if (content && content.length > 5000) {
      return NextResponse.json({ 
        error: 'Content must be less than 5000 characters' 
      }, { status: 400 });
    }

    // Verificar duplicata de título na mesma categoria (se título ou categoria mudaram)
    if (title || category) {
      const newTitle = title ? title.trim() : template.title;
      const newCategory = category || template.category;
      
      const existingTemplate = await prisma.responseTemplate.findFirst({
        where: {
          title: newTitle,
          category: newCategory,
          id: { not: params.id } // Excluir o template atual da busca
        }
      });

      if (existingTemplate) {
        return NextResponse.json({ 
          error: 'A template with this title already exists in this category' 
        }, { status: 400 });
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (category !== undefined) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedTemplate = await prisma.responseTemplate.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ template: updatedTemplate });

  } catch (error) {
    console.error('Error updating template:', error);
    
    // Tratamento específico de erros do Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      
      if (prismaError.code === 'P2002') {
        return NextResponse.json({ 
          error: 'A template with this title already exists in this category' 
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

// DELETE - Deletar template
export async function DELETE(
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

    if (!user || (user.plan !== 'ADMIN' && user.plan !== 'ANALISTA')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const template = await prisma.responseTemplate.findUnique({
      where: { id: params.id }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Verificar se o template está sendo usado antes de deletar
    if (template.usageCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete template that has been used. Consider deactivating it instead.' 
      }, { status: 400 });
    }

    await prisma.responseTemplate.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Template deleted successfully' });

  } catch (error) {
    console.error('Error deleting template:', error);
    
    // Tratamento específico de erros do Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ 
          error: 'Template not found' 
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