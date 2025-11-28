import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { serializeMentoria } from '../utils';

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

    const isAdmin = user.plan === 'ADMIN';
    const now = new Date();

    const mentorias = await prisma.cfRendaTurbinadaMentoria.findMany({
      orderBy: [
        { releaseDate: 'desc' },
        { recordedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        materials: {
          orderBy: [
            { createdAt: 'asc' },
            { id: 'asc' }
          ]
        }
      }
    });

    const serializedMentorias = mentorias.map(mentoria => {
      const base = serializeMentoria(mentoria);
      const releaseTime = mentoria.releaseDate?.getTime();
      const isReleased = isAdmin || (typeof releaseTime === 'number' && releaseTime <= now.getTime());

      if (isAdmin || isReleased) {
        return {
          ...base,
          isReleased
        };
      }

      return {
        ...base,
        isReleased,
        content: undefined,
        videoUrl: undefined,
        materials: []
      };
    });

    return NextResponse.json({ mentorias: serializedMentorias });
  } catch (error) {
    console.error('Erro ao listar mentorias gravadas do CF Renda Turbinada:', error);
    return NextResponse.json({ error: 'Erro ao listar mentorias' }, { status: 500 });
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

    const { title, description, content, recordedAt, releaseDate, videoUrl, durationMinutes } = body as {
      title?: unknown;
      description?: unknown;
      content?: unknown;
      recordedAt?: unknown;
      releaseDate?: unknown;
      videoUrl?: unknown;
      durationMinutes?: unknown;
    };

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    if (typeof recordedAt !== 'string' || !recordedAt.trim()) {
      return NextResponse.json({ error: 'Data da mentoria é obrigatória' }, { status: 400 });
    }

    const parsedRecordedAt = new Date(recordedAt);

    if (Number.isNaN(parsedRecordedAt.getTime())) {
      return NextResponse.json({ error: 'Data da mentoria inválida' }, { status: 400 });
    }

    if (typeof releaseDate !== 'string' || !releaseDate.trim()) {
      return NextResponse.json({ error: 'Data de liberação é obrigatória' }, { status: 400 });
    }

    const parsedReleaseDate = new Date(releaseDate);

    if (Number.isNaN(parsedReleaseDate.getTime())) {
      return NextResponse.json({ error: 'Data de liberação inválida' }, { status: 400 });
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

    let normalizedContent: string | null = null;

    if (typeof content !== 'undefined') {
      if (content !== null && typeof content !== 'string') {
        return NextResponse.json({ error: 'Conteúdo inválido' }, { status: 400 });
      }

      if (typeof content === 'string') {
        const trimmedContent = content.trim();
        normalizedContent = trimmedContent.length > 0 ? trimmedContent : null;
      }
    }

    let normalizedVideoUrl: string | null = null;

    if (typeof videoUrl !== 'undefined') {
      if (videoUrl !== null && typeof videoUrl !== 'string') {
        return NextResponse.json({ error: 'Link do vídeo inválido' }, { status: 400 });
      }

      if (typeof videoUrl === 'string') {
        const trimmedUrl = videoUrl.trim();
        normalizedVideoUrl = trimmedUrl.length > 0 ? trimmedUrl : null;
      }
    }

    let normalizedDuration: number | null = null;

    if (typeof durationMinutes !== 'undefined') {
      const parsedDuration = parseDuration(durationMinutes);

      if (parsedDuration === null) {
        return NextResponse.json({ error: 'Duração inválida' }, { status: 400 });
      }

      normalizedDuration = parsedDuration;
    }

    const mentoria = await prisma.cfRendaTurbinadaMentoria.create({
      data: {
        title: title.trim(),
        description: normalizedDescription,
        content: normalizedContent,
        videoUrl: normalizedVideoUrl,
        recordedAt: parsedRecordedAt,
        releaseDate: parsedReleaseDate,
        durationMinutes: normalizedDuration ?? undefined
      },
      include: { materials: true }
    });

    return NextResponse.json({ mentoria: serializeMentoria(mentoria) }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar mentoria gravada do CF Renda Turbinada:', error);
    return NextResponse.json({ error: 'Erro ao criar mentoria' }, { status: 500 });
  }
}
