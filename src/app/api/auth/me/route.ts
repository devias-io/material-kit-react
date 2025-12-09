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

    const cacheKey = `auth:me:${session.user.id}`;
    
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
    console.error('Erro em /api/auth/me:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
