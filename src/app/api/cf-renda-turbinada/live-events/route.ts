import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { serializeLiveEvent } from '../utils';

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

export async function GET() {
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

    const events = await prisma.cfRendaTurbinadaLiveEvent.findMany({
      orderBy: [
        { eventDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({ events: events.map(serializeLiveEvent) });
  } catch (error) {
    console.error('Erro ao listar lives do CF Renda Turbinada:', error);
    return NextResponse.json({ error: 'Erro ao listar lives' }, { status: 500 });
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

    const { title, description, eventDate, durationMinutes, meetingUrl } = body as {
      title?: unknown;
      description?: unknown;
      eventDate?: unknown;
      durationMinutes?: unknown;
      meetingUrl?: unknown;
    };

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    if (typeof eventDate !== 'string' || !eventDate.trim()) {
      return NextResponse.json({ error: 'Data e horário são obrigatórios' }, { status: 400 });
    }

    const parsedDate = new Date(eventDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Data e horário inválidos' }, { status: 400 });
    }

    let normalizedDuration = 60;

    if (typeof durationMinutes !== 'undefined') {
      const parsedDuration = parseDurationMinutes(durationMinutes);

      if (parsedDuration === null) {
        return NextResponse.json({ error: 'Duração inválida' }, { status: 400 });
      }

      normalizedDuration = parsedDuration;
    }

    let normalizedDescription: string | null = null;

    if (typeof description !== 'undefined') {
      if (description !== null && typeof description !== 'string') {
        return NextResponse.json({ error: 'Descrição inválida' }, { status: 400 });
      }

      if (typeof description === 'string') {
        const trimmedDescription = description.trim();
        normalizedDescription = trimmedDescription.length > 0 ? trimmedDescription : null;
      }
    }

    let normalizedMeetingUrl: string | null = null;

    if (typeof meetingUrl !== 'undefined') {
      if (meetingUrl !== null && typeof meetingUrl !== 'string') {
        return NextResponse.json({ error: 'Link de reunião inválido' }, { status: 400 });
      }

      if (typeof meetingUrl === 'string') {
        const trimmedUrl = meetingUrl.trim();
        normalizedMeetingUrl = trimmedUrl.length > 0 ? trimmedUrl : null;
      }
    }

    const event = await prisma.cfRendaTurbinadaLiveEvent.create({
      data: {
        title: title.trim(),
        description: normalizedDescription,
        eventDate: parsedDate,
        durationMinutes: normalizedDuration,
        meetingUrl: normalizedMeetingUrl
      }
    });

    return NextResponse.json({ event: serializeLiveEvent(event) }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar live do CF Renda Turbinada:', error);
    return NextResponse.json({ error: 'Erro ao criar live' }, { status: 500 });
  }
}
