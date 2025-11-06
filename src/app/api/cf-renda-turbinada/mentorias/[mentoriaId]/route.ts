import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { serializeMentoria } from '../../utils';

function parseDuration(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const rounded = Math.round(value);
    return rounded > 0 ? rounded : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number.parseInt(trimmed, 10);

    if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
      return null;
    }

    return parsed > 0 ? parsed : null;
  }

  return null;
}

export async function PATCH(request: NextRequest, { params }: { params: { mentoriaId: string } }) {
  const mentoriaId = Number(params.mentoriaId);

  if (!params.mentoriaId || Number.isNaN(mentoriaId)) {
    return NextResponse.json({ error: 'Mentoria id is required' }, { status: 400 });
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

    let body: unknown;

    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { title, description, content, recordedAt, videoUrl, durationMinutes } = body as {
      title?: unknown;
      description?: unknown;
      content?: unknown;
      recordedAt?: unknown;
      videoUrl?: unknown;
      durationMinutes?: unknown;
    };

    const updateData: Record<string, unknown> = {};

    if (typeof title !== 'undefined') {
      if (title !== null && typeof title !== 'string') {
        return NextResponse.json({ error: 'Título inválido' }, { status: 400 });
      }

      if (typeof title === 'string') {
        if (!title.trim()) {
          return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
        }

        updateData.title = title.trim();
      }
    }

    if (typeof recordedAt !== 'undefined') {
      if (recordedAt !== null && typeof recordedAt !== 'string') {
        return NextResponse.json({ error: 'Data da mentoria inválida' }, { status: 400 });
      }

      if (typeof recordedAt === 'string') {
        if (!recordedAt.trim()) {
          return NextResponse.json({ error: 'Data da mentoria é obrigatória' }, { status: 400 });
        }

        const parsedRecordedAt = new Date(recordedAt);

        if (Number.isNaN(parsedRecordedAt.getTime())) {
          return NextResponse.json({ error: 'Data da mentoria inválida' }, { status: 400 });
        }

        updateData.recordedAt = parsedRecordedAt;
      }
    }

    if (typeof description !== 'undefined') {
      if (description !== null && typeof description !== 'string') {
        return NextResponse.json({ error: 'Descrição inválida' }, { status: 400 });
      }

      if (typeof description === 'string') {
        const trimmed = description.trim();
        updateData.description = trimmed.length > 0 ? trimmed : null;
      } else {
        updateData.description = null;
      }
    }

    if (typeof content !== 'undefined') {
      if (content !== null && typeof content !== 'string') {
        return NextResponse.json({ error: 'Conteúdo inválido' }, { status: 400 });
      }

      if (typeof content === 'string') {
        const trimmed = content.trim();
        updateData.content = trimmed.length > 0 ? trimmed : null;
      } else {
        updateData.content = null;
      }
    }

    if (typeof videoUrl !== 'undefined') {
      if (videoUrl !== null && typeof videoUrl !== 'string') {
        return NextResponse.json({ error: 'Link do vídeo inválido' }, { status: 400 });
      }

      if (typeof videoUrl === 'string') {
        const trimmed = videoUrl.trim();
        updateData.videoUrl = trimmed.length > 0 ? trimmed : null;
      } else {
        updateData.videoUrl = null;
      }
    }

    if (typeof durationMinutes !== 'undefined') {
      if (durationMinutes === null) {
        updateData.durationMinutes = null;
      } else {
        const parsedDuration = parseDuration(durationMinutes);

        if (parsedDuration === null) {
          return NextResponse.json({ error: 'Duração inválida' }, { status: 400 });
        }

        updateData.durationMinutes = parsedDuration;
      }
    }

    const mentoria = await prisma.cfRendaTurbinadaMentoria.update({
      where: { id: mentoriaId },
      data: updateData,
      include: { materials: true }
    });

    return NextResponse.json({ mentoria: serializeMentoria(mentoria) });
  } catch (error) {
    console.error('Erro ao atualizar mentoria gravada do CF Renda Turbinada:', error);
    return NextResponse.json({ error: 'Erro ao atualizar mentoria' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { mentoriaId: string } }) {
  const mentoriaId = Number(params.mentoriaId);

  if (!params.mentoriaId || Number.isNaN(mentoriaId)) {
    return NextResponse.json({ error: 'Mentoria id is required' }, { status: 400 });
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

    await prisma.cfRendaTurbinadaMentoria.delete({
      where: { id: mentoriaId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir mentoria gravada do CF Renda Turbinada:', error);
    return NextResponse.json({ error: 'Erro ao excluir mentoria' }, { status: 500 });
  }
}
