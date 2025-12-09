export const dynamic = 'force-dynamic'; // 👈 ADICIONAR ESTA LINHA AQUI

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { normalizeCustomPermissions } from '@/lib/custom-permissions';
import { CacheService } from '@/lib/cache-service';

export const config = {
  maxDuration: 3,
};

function parseCustomPermissions(rawValue: unknown): string[] {
  if (!rawValue) {
    return [];
  }

  const normalize = (value: unknown): string => String(value).trim();

  const toArray = (): string[] => {
    if (Array.isArray(rawValue)) {
      return rawValue.map(normalize);
    }

    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();

      if (!trimmed) {
        return [];
      }

      try {
        const parsed = JSON.parse(trimmed);

        if (Array.isArray(parsed)) {
          return parsed.map(normalize);
        }
      } catch (error) {
        // Valor não é JSON válido – trataremos como permissão única
      }

      return [normalize(trimmed)];
    }

    return [];
  };

  return Array.from(new Set(toArray().filter(permission => permission.length > 0)));
}

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.headers.get('x-user-email');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Email não fornecido' }, { status: 401 });
    }

    console.log('🔍 Buscando dados do usuário:', userEmail);

    const cacheKey = CacheService.getCacheKey('user', 'me', userEmail);

    const { data } = await CacheService.withCache(
      cacheKey,
      async () => {
        if (userEmail === 'admin@fatosdobolsa.com') {
          return {
            id: 'ADM-001',
            firstName: 'Admin',
            lastName: 'Sistema',
            email: userEmail,
            plan: 'ADMIN',
            status: 'ACTIVE',
            customPermissions: [],
            createdAt: new Date().toISOString(),
          };
        }

        const user = await prisma.user.findUnique({
          where: { email: userEmail },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            plan: true,
            status: true,
            customPermissions: true,
            expirationDate: true,
            createdAt: true,
            avatar: true,
          }
        });

        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }

        console.log('✅ Usuário encontrado:', user.email, 'Plano:', user.plan);

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          plan: user.plan,
          status: user.status,
          customPermissions: normalizeCustomPermissions(user.customPermissions),
          expirationDate: user.expirationDate?.toISOString(),
          avatar: user.avatar
        };
      },
      {
        ttlSeconds: 60,
        tags: ['auth', `user:${userEmail}`],
      }
    );

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}