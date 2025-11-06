import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

import { serializeLesson } from '../../utils';

export async function PATCH(request: NextRequest, { params }: { params: { lessonId: string } }) {
  const lessonId = Number(params.lessonId);

  if (!params.lessonId || Number.isNaN(lessonId)) {
    return NextResponse.json({ error: 'Lesson id is required' }, { status: 400 });
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

    const lesson = await prisma.cfRendaTurbinadaLesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
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

    const data: {
      title?: string;
      duration?: string;
      description?: string | null;
      videoUrl?: string | null;
      content?: string | null;
    } = {};

    if (typeof title !== 'undefined') {
      if (typeof title !== 'string' || !title.trim()) {
        return NextResponse.json({ error: 'Título inválido' }, { status: 400 });
      }

      data.title = title.trim();
    }

    if (typeof duration !== 'undefined') {
      if (typeof duration !== 'string' || !duration.trim()) {
        return NextResponse.json({ error: 'Duração inválida' }, { status: 400 });
      }

      data.duration = duration.trim();
    }

    if (typeof description !== 'undefined') {
      if (description !== null && typeof description !== 'string') {
        return NextResponse.json({ error: 'Descrição inválida' }, { status: 400 });
      }

      if (typeof description === 'string') {
        const trimmedDescription = description.trim();
        data.description = trimmedDescription.length > 0 ? trimmedDescription : null;
      } else {
        data.description = null;
      }
    }

    if (typeof videoUrl !== 'undefined') {
      if (videoUrl !== null && typeof videoUrl !== 'string') {
        return NextResponse.json({ error: 'Link de vídeo inválido' }, { status: 400 });
      }

      if (typeof videoUrl === 'string') {
        const trimmedVideoUrl = videoUrl.trim();
        data.videoUrl = trimmedVideoUrl.length > 0 ? trimmedVideoUrl : null;
      } else {
        data.videoUrl = null;
      }
    }

    if (typeof content !== 'undefined') {
      if (content !== null && typeof content !== 'string') {
        return NextResponse.json({ error: 'Conteúdo inválido' }, { status: 400 });
      }

      if (typeof content === 'string') {
        const trimmedContent = content.trim();
        data.content = trimmedContent.length > 0 ? trimmedContent : null;
      } else {
        data.content = null;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    const updated = await prisma.cfRendaTurbinadaLesson.update({
      where: { id: lessonId },
      data,
      include: {
        materials: {
          orderBy: [
            { createdAt: 'asc' },
            { id: 'asc' }
          ]
        }
      }
    });

    return NextResponse.json({ lesson: serializeLesson(updated) });
  } catch (error) {
    console.error('Erro ao atualizar aula do CF Renda Turbinada:', error);
    return NextResponse.json({ error: 'Erro ao atualizar aula' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { lessonId: string } }) {
  const lessonId = Number(params.lessonId);

  if (!params.lessonId || Number.isNaN(lessonId)) {
    return NextResponse.json({ error: 'Lesson id is required' }, { status: 400 });
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

    const lesson = await prisma.cfRendaTurbinadaLesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    await prisma.cfRendaTurbinadaLesson.delete({
      where: { id: lessonId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir aula do CF Renda Turbinada:', error);
    return NextResponse.json({ error: 'Erro ao excluir aula' }, { status: 500 });
  }
}
