import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

import { serializeLesson } from '../../../utils';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id: moduleId } = params;

  if (!moduleId || typeof moduleId !== 'string') {
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

    const module = await prisma.cfRendaTurbinadaTurma2Module.findUnique({
      where: { id: moduleId }
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

    const { title, duration, description, videoUrl, content } = body as {
      title?: unknown;
      duration?: unknown;
      description?: unknown;
      videoUrl?: unknown;
      content?: unknown;
    };

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    if (typeof duration !== 'string' || !duration.trim()) {
      return NextResponse.json({ error: 'Duração é obrigatória' }, { status: 400 });
    }

    const trimmedTitle = title.trim();
    const trimmedDuration = duration.trim();
    const trimmedDescription = typeof description === 'string' ? description.trim() : undefined;
    const trimmedVideoUrl = typeof videoUrl === 'string' ? videoUrl.trim() : undefined;
    const trimmedContent = typeof content === 'string' ? content.trim() : undefined;

    const aggregate = await prisma.cfRendaTurbinadaTurma2Lesson.aggregate({
      where: { moduleId },
      _max: { sortOrder: true }
    });

    const nextSortOrder = (aggregate._max.sortOrder ?? 0) + 1;

    const lesson = await prisma.cfRendaTurbinadaTurma2Lesson.create({
      data: {
        moduleId,
        title: trimmedTitle,
        duration: trimmedDuration,
        description: trimmedDescription && trimmedDescription.length > 0 ? trimmedDescription : null,
        videoUrl: trimmedVideoUrl && trimmedVideoUrl.length > 0 ? trimmedVideoUrl : null,
        content: trimmedContent && trimmedContent.length > 0 ? trimmedContent : null,
        sortOrder: nextSortOrder
      },
      include: {
        materials: {
          orderBy: [
            { createdAt: 'asc' },
            { id: 'asc' }
          ]
        }
      }
    });

    return NextResponse.json({ lesson: serializeLesson(lesson) }, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar aula ao módulo do CF Renda Turbinada Turma 2:', error);
    return NextResponse.json({ error: 'Erro ao adicionar aula ao módulo' }, { status: 500 });
  }
}
