export const dynamic = 'force-dynamic'; // 👈 ADICIONAR ESTA LINHA AQUI

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';

export const maxDuration = 3;

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    console.log('=== DEBUG AUTH ROUTE ===');
    console.log('Session:', session);
    console.log('========================');

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const cacheKey = CacheService.getCacheKey('auth', 'me', session.user.id);

    const { data } = await CacheService.withCache(
      cacheKey,
      async () => {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }

        return user;
      },
      {
        ttlSeconds: 60,
        tags: ['auth', `user:${session.user.id}`],
      }
    );

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    console.error('Erro em /api/auth/me:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}