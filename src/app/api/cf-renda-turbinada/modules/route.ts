import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

import { serializeModule } from '../utils';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = user.plan === 'ADMIN';
    const now = new Date();

    const modules = await prisma.cfRendaTurbinadaModule.findMany({
      where: isAdmin
        ? undefined
        : {
            isHidden: false
          },
      orderBy: [
        { releaseDate: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ],
      include: {
        lessons: {
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    const serializedModules = modules.map(module => {
      const baseModule = serializeModule(module);
      const releaseTimestamp = module.releaseDate instanceof Date
        ? module.releaseDate.getTime()
        : Number.NaN;
      const isReleased = !Number.isNaN(releaseTimestamp) && releaseTimestamp <= now.getTime();

      if (isAdmin || isReleased) {
        return {
          ...baseModule,
          isReleased
        };
      }

      return {
        ...baseModule,
        isReleased,
        lessons: []
      };
    });

    return NextResponse.json({ modules: serializedModules });
  } catch (error) {
    console.error('Erro ao listar módulos do CF Renda Turbinada:', error);
    return NextResponse.json({ error: 'Erro ao listar módulos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = user.plan === 'ADMIN';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { title, highlight, releaseDate } = body as {
      title?: unknown;
      highlight?: unknown;
      releaseDate?: unknown;
    };

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    if (typeof releaseDate !== 'string' || !releaseDate.trim()) {
      return NextResponse.json({ error: 'Data de liberação é obrigatória' }, { status: 400 });
    }

    const parsedReleaseDate = new Date(releaseDate);

    if (Number.isNaN(parsedReleaseDate.getTime())) {
      return NextResponse.json({ error: 'Data de liberação inválida' }, { status: 400 });
    }

    const trimmedTitle = title.trim();
    const trimmedHighlight = typeof highlight === 'string' ? highlight.trim() : undefined;

    const sortOrderAggregate = await prisma.cfRendaTurbinadaModule.aggregate({
      _max: { sortOrder: true }
    });

    const nextSortOrder = (sortOrderAggregate._max.sortOrder ?? 0) + 1;

    const module = await prisma.cfRendaTurbinadaModule.create({
      data: {
        title: trimmedTitle,
        highlight: trimmedHighlight && trimmedHighlight.length > 0 ? trimmedHighlight : null,
        releaseDate: parsedReleaseDate,
        sortOrder: nextSortOrder
      },
      include: {
        lessons: {
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    return NextResponse.json({ module: serializeModule(module) }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar módulo do CF Renda Turbinada:', error);
    return NextResponse.json({ error: 'Erro ao criar módulo' }, { status: 500 });
  }
}
