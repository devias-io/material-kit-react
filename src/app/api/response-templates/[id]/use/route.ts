// src/app/api/response-templates/[id]/use/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/utils/auth';

const prisma = new PrismaClient();

// POST - Incrementar uso do template
export async function POST(
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

    // Verificar se template existe e está ativo
    const template = await prisma.responseTemplate.findUnique({
      where: { id: params.id }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (!template.isActive) {
      return NextResponse.json({ 
        error: 'Cannot use inactive template' 
      }, { status: 400 });
    }

    const updatedTemplate = await prisma.responseTemplate.update({
      where: { id: params.id },
      data: {
        usageCount: {
          increment: 1
        }
      },
      include: {
        creator: { // ✅ CORRETO: usar 'creator' não 'createdBy'
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      template: updatedTemplate,
      message: 'Template usage recorded'
    });

  } catch (error) {
    console.error('Error recording template usage:', error);
    
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