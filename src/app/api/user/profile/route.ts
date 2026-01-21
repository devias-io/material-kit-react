import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';

const REQUEST_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = REQUEST_TIMEOUT_MS, message?: string) {
  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message ?? `Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

export const maxDuration = 5;

export async function GET(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  let userId: string | undefined;

  try {
    const session = await withTimeout(auth(), REQUEST_TIMEOUT_MS, 'Authentication timed out');
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    userId = session.user.id;

    console.info('[GET /api/user/profile] Iniciando busca de perfil', { correlationId, userId });

    const cacheKey = `user:profile:${session.user.id}`;

    return await withTimeout(CacheService.withCache({
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
            // role: true,  // ❌ REMOVIDO - campo não existe
            avatar: true,
            plan: true,
            status: true,
            expirationDate: true,
            customPermissions: true,
            origin: true,
            mustChangePassword: true,
          },
        });

        if (!user) {
          throw new Error('User not found');
        }

        return NextResponse.json(user);
      },
    }), REQUEST_TIMEOUT_MS, 'Profile lookup timed out');
  } catch (error) {
    const isTimeout = error instanceof Error && error.message.toLowerCase().includes('timed out');
    const status = isTimeout ? 504 : error instanceof Error && error.message === 'User not found' ? 404 : 500;

    console.error('[GET /api/user/profile] Falha ao carregar perfil', {
      correlationId,
      userId,
      status,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorMessage =
      status === 404
        ? 'User not found'
        : isTimeout
          ? 'Request timed out'
          : 'Internal error';

    return NextResponse.json({ error: errorMessage }, { status });
  }
}

export async function PUT(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  let userId: string | undefined;

  try {
    const session = await withTimeout(auth(), REQUEST_TIMEOUT_MS, 'Authentication timed out');
    const { firstName, lastName, avatar } = await withTimeout(request.json(), REQUEST_TIMEOUT_MS, 'Body parsing timed out');

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }

    userId = session.user.id;

    if ((firstName && typeof firstName !== 'string') || (lastName && typeof lastName !== 'string')) {
      console.warn('[PUT /api/user/profile] Dados inválidos recebidos', { correlationId, userId });
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    console.info('[PUT /api/user/profile] Atualizando perfil', { correlationId, userId });

    // Atualizar dados do usuário (apenas nome e avatar)
    const updatedUser = await withTimeout(prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        avatar,
        updatedAt: new Date()
      }
    }), REQUEST_TIMEOUT_MS, 'Profile update timed out');

    // ✅ Invalidar cache após atualização
    await CacheService.invalidate(`user:profile:${session.user.id}`);

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
    const isTimeout = error instanceof Error && error.message.toLowerCase().includes('timed out');

    console.error('❌ Erro ao atualizar perfil:', {
      correlationId,
      userId,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (isTimeout) {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
    }

    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
  // ✅ REMOVIDO: prisma.$disconnect() - não usar com singleton
}
