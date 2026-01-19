import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { serializeLiveEvent } from '../../utils';

function parseDurationMinutes(value: unknown): number | null {
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const liveId = Number(params.id);

  if (!params.id || Number.isNaN(liveId)) {
    return NextResponse.json({ error: 'Live id is required' }, { status: 400 });
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

    const existingEvent = await prisma.cfRendaTurbinadaTurma3LiveEvent.findUnique({
      where: { id: liveId }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Live event not found' }, { status: 404 });
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

    const { title, description, eventDate, durationMinutes, meetingUrl, isCancelled } = body as {
      title?: unknown;
      description?: unknown;
      eventDate?: unknown;
      durationMinutes?: unknown;
      meetingUrl?: unknown;
      isCancelled?: unknown;
    };

    const data: {
      title?: string;
      description?: string | null;
      eventDate?: Date;
      durationMinutes?: number;
      meetingUrl?: string | null;
      isCancelled?: boolean;
    } = {};

    if (typeof title !== 'undefined') {
      if (typeof title !== 'string' || !title.trim()) {
        return NextResponse.json({ error: 'Título inválido' }, { status: 400 });
      }

      data.title = title.trim();
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

    if (typeof eventDate !== 'undefined') {
      if (typeof eventDate !== 'string' || !eventDate.trim()) {
        return NextResponse.json({ error: 'Data e horário inválidos' }, { status: 400 });
      }

      const parsedDate = new Date(eventDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Data e horário inválidos' }, { status: 400 });
      }

      data.eventDate = parsedDate;
    }

    if (typeof durationMinutes !== 'undefined') {
      const parsedDuration = parseDurationMinutes(durationMinutes);

      if (parsedDuration === null) {
        return NextResponse.json({ error: 'Duração inválida' }, { status: 400 });
      }

      data.durationMinutes = parsedDuration;
    }

    if (typeof meetingUrl !== 'undefined') {
      if (meetingUrl !== null && typeof meetingUrl !== 'string') {
        return NextResponse.json({ error: 'Link de reunião inválido' }, { status: 400 });
      }

      if (typeof meetingUrl === 'string') {
        const trimmedUrl = meetingUrl.trim();
        data.meetingUrl = trimmedUrl.length > 0 ? trimmedUrl : null;
      } else {
        data.meetingUrl = null;
      }
    }

    if (typeof isCancelled !== 'undefined') {
      if (typeof isCancelled !== 'boolean') {
        return NextResponse.json({ error: 'Status de cancelamento inválido' }, { status: 400 });
      }

      data.isCancelled = isCancelled;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    const updatedEvent = await prisma.cfRendaTurbinadaTurma3LiveEvent.update({
      where: { id: liveId },
      data
    });

    return NextResponse.json({ event: serializeLiveEvent(updatedEvent) });
  } catch (error) {
    console.error('Erro ao atualizar live do CF Renda Turbinada Turma 3:', error);
    return NextResponse.json({ error: 'Erro ao atualizar live' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const liveId = Number(params.id);

  if (!params.id || Number.isNaN(liveId)) {
    return NextResponse.json({ error: 'Live id is required' }, { status: 400 });
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

    await prisma.cfRendaTurbinadaTurma3LiveEvent.delete({
      where: { id: liveId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir live do CF Renda Turbinada Turma 3:', error);
    return NextResponse.json({ error: 'Erro ao excluir live' }, { status: 500 });
  }
}
