import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';

export const config = {
  maxDuration: 3,
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `user:profile:${session.user.id}`;

    return await CacheService.withCache({
      key: cacheKey,
      ttlSeconds: 60,
      tags: ['auth', `user:${session.user.id}`],
      fn: async () => {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true,
            plan: true,
            status: true,
            expirationDate: true,
            customPermissions: true,
            origin: true,
          },
        });

        if (!user) {
          throw new Error('User not found');
        }

        return NextResponse.json(user);
      },
    });
  } catch (error) {
    console.error('Erro em /api/user/profile:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const { firstName, lastName, avatar } = await request.json();

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }

    // Atualizar dados do usuário (apenas nome e avatar)
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        avatar,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        avatar: updatedUser.avatar
      }
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
