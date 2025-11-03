import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

import { serializeModule } from '../../utils';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Module id is required' }, { status: 400 });
  }

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

    if (user.plan !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const module = await prisma.cfRendaTurbinadaModule.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
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

    const { title, highlight, releaseDate, isHidden } = body as {
      title?: unknown;
      highlight?: unknown;
      releaseDate?: unknown;
      isHidden?: unknown;
    };

    const data: {
      title?: string;
      highlight?: string | null;
      releaseDate?: Date;
      isHidden?: boolean;
    } = {};

    if (typeof title !== 'undefined') {
      if (typeof title !== 'string' || !title.trim()) {
        return NextResponse.json({ error: 'Título inválido' }, { status: 400 });
      }

      data.title = title.trim();
    }

    if (typeof highlight !== 'undefined') {
      if (highlight !== null && typeof highlight !== 'string') {
        return NextResponse.json({ error: 'Destaque inválido' }, { status: 400 });
      }

      if (typeof highlight === 'string') {
        const trimmedHighlight = highlight.trim();
        data.highlight = trimmedHighlight.length > 0 ? trimmedHighlight : null;
      } else {
        data.highlight = null;
      }
    }

    if (typeof releaseDate !== 'undefined') {
      if (typeof releaseDate !== 'string' || !releaseDate.trim()) {
        return NextResponse.json({ error: 'Data de liberação inválida' }, { status: 400 });
      }

      const parsedReleaseDate = new Date(releaseDate);

      if (Number.isNaN(parsedReleaseDate.getTime())) {
        return NextResponse.json({ error: 'Data de liberação inválida' }, { status: 400 });
      }

      data.releaseDate = parsedReleaseDate;
    }

    if (typeof isHidden !== 'undefined') {
      if (typeof isHidden !== 'boolean') {
        return NextResponse.json({ error: 'Valor inválido para visibilidade' }, { status: 400 });
      }

      data.isHidden = isHidden;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    const updated = await prisma.cfRendaTurbinadaModule.update({
      where: { id },
      data,
      include: {
        lessons: {
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    return NextResponse.json({ module: serializeModule(updated) });
  } catch (error) {
    console.error('Erro ao atualizar módulo do CF Renda Turbinada:', error);
    return NextResponse.json({ error: 'Erro ao atualizar módulo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Module id is required' }, { status: 400 });
  }

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

    if (user.plan !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const existingModule = await prisma.cfRendaTurbinadaModule.findUnique({
      where: { id }
    });

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    await prisma.cfRendaTurbinadaModule.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir módulo do CF Renda Turbinada:', error);
    return NextResponse.json({ error: 'Erro ao excluir módulo' }, { status: 500 });
  }
}
