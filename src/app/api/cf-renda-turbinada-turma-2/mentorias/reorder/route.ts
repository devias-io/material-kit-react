import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { serializeMentoria } from '../../utils';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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

    const { mentoriaId, targetPosition } = body as { mentoriaId?: unknown; targetPosition?: unknown };

    const parsedMentoriaId =
      typeof mentoriaId === 'number'
        ? mentoriaId
        : typeof mentoriaId === 'string'
          ? Number.parseInt(mentoriaId, 10)
          : Number.NaN;

    if (Number.isNaN(parsedMentoriaId) || parsedMentoriaId <= 0) {
      return NextResponse.json({ error: 'ID da mentoria inválido' }, { status: 400 });
    }

    const parsedPosition =
      typeof targetPosition === 'number'
        ? targetPosition
        : typeof targetPosition === 'string'
          ? Number.parseInt(targetPosition, 10)
          : Number.NaN;

    if (Number.isNaN(parsedPosition) || parsedPosition < 1) {
      return NextResponse.json({ error: 'Posição de destino inválida' }, { status: 400 });
    }

    const mentorias = await prisma.cfRendaTurbinadaTurma2Mentoria.findMany({
      orderBy: [
        { sortOrder: 'asc' },
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

    if (mentorias.length === 0) {
      return NextResponse.json({ error: 'Nenhuma mentoria encontrada' }, { status: 404 });
    }

    const orderedIds = mentorias.map(mentoria => mentoria.id);

    if (!orderedIds.includes(parsedMentoriaId)) {
      return NextResponse.json({ error: 'Mentoria não encontrada' }, { status: 404 });
    }

    const otherIds = orderedIds.filter(id => id !== parsedMentoriaId);
    const clampedIndex = clamp(parsedPosition - 1, 0, otherIds.length);
    otherIds.splice(clampedIndex, 0, parsedMentoriaId);

    await prisma.$transaction(async tx => {
      for (let index = 0; index < otherIds.length; index += 1) {
        const id = otherIds[index];

        await tx.cfRendaTurbinadaTurma2Mentoria.update({
          where: { id },
          data: { sortOrder: index + 1 }
        });
      }
    });

    const updatedMentorias = await prisma.cfRendaTurbinadaTurma2Mentoria.findMany({
      orderBy: [
        { sortOrder: 'asc' },
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

    const serialized = updatedMentorias.map(mentoria => ({ ...serializeMentoria(mentoria), isReleased: true }));

    return NextResponse.json({ mentorias: serialized });
  } catch (error) {
    console.error('Erro ao reordenar mentorias do CF Renda Turbinada Turma 2:', error);
    return NextResponse.json({ error: 'Erro ao reordenar mentorias' }, { status: 500 });
  }
}
