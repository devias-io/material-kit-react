export const dynamic = 'force-dynamic'; // 👈 ADICIONAR ESTA LINHA AQUI

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { normalizeCustomPermissions } from '@/lib/custom-permissions';

const prisma = new PrismaClient();

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

    // Verificar se é admin (usuário especial)
    if (userEmail === 'admin@fatosdobolsa.com') {
      return NextResponse.json({
        id: 'ADM-001',
        firstName: 'Admin',
        lastName: 'Sistema',
        email: userEmail,
        plan: 'ADMIN',
        status: 'ACTIVE',
        customPermissions: [],
        createdAt: new Date().toISOString()
      });
    }

    // Buscar no banco de dados
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
        avatar: true
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado no banco:', userEmail);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    console.log('✅ Usuário encontrado:', user.email, 'Plano:', user.plan);

    // Formatar resposta
    const userData = {
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

    return NextResponse.json(userData);

  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}