import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

import { serializeModule } from '../../utils';

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

    const { lessonId, targetModuleId, targetPosition } = body as {
      lessonId?: unknown;
      targetModuleId?: unknown;
      targetPosition?: unknown;
    };

    const parsedLessonId =
      typeof lessonId === 'number'
        ? lessonId
        : typeof lessonId === 'string'
          ? Number.parseInt(lessonId, 10)
          : Number.NaN;

    if (Number.isNaN(parsedLessonId) || parsedLessonId <= 0) {
      return NextResponse.json({ error: 'ID da aula inválido' }, { status: 400 });
    }

    const parsedTargetModuleId = typeof targetModuleId === 'string' ? targetModuleId.trim() : '';

    if (!parsedTargetModuleId) {
      return NextResponse.json({ error: 'Módulo de destino é obrigatório' }, { status: 400 });
    }

    const parsedTargetPosition =
      typeof targetPosition === 'number'
        ? targetPosition
        : typeof targetPosition === 'string'
          ? Number.parseInt(targetPosition, 10)
          : Number.NaN;

    if (Number.isNaN(parsedTargetPosition) || parsedTargetPosition < 1) {
      return NextResponse.json({ error: 'Posição de destino inválida' }, { status: 400 });
    }

    const lesson = await prisma.cfRendaTurbinadaLesson.findUnique({
      where: { id: parsedLessonId }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 });
    }

    const targetModule = await prisma.cfRendaTurbinadaModule.findUnique({
      where: { id: parsedTargetModuleId },
      include: { lessons: true }
    });

    if (!targetModule) {
      return NextResponse.json({ error: 'Módulo de destino não encontrado' }, { status: 404 });
    }

    const sourceModuleId = lesson.moduleId;
    const isSameModule = sourceModuleId === parsedTargetModuleId;

    await prisma.$transaction(async tx => {
      if (isSameModule) {
        const lessonsInModule = await tx.cfRendaTurbinadaLesson.findMany({
          where: { moduleId: sourceModuleId },
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'asc' }
          ]
        });

        const otherLessons = lessonsInModule.filter(currentLesson => currentLesson.id !== parsedLessonId);
        const clampedIndex = clamp(parsedTargetPosition - 1, 0, otherLessons.length);
        const orderedIds = otherLessons.map(currentLesson => currentLesson.id);
        orderedIds.splice(clampedIndex, 0, parsedLessonId);

        for (let index = 0; index < orderedIds.length; index += 1) {
          const id = orderedIds[index];
          await tx.cfRendaTurbinadaLesson.update({
            where: { id },
            data: { sortOrder: index + 1 }
          });
        }

        return;
      }

      const sourceLessons = await tx.cfRendaTurbinadaLesson.findMany({
        where: { moduleId: sourceModuleId },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      const remainingIds = sourceLessons
        .filter(currentLesson => currentLesson.id !== parsedLessonId)
        .map(currentLesson => currentLesson.id);

      for (let index = 0; index < remainingIds.length; index += 1) {
        const id = remainingIds[index];
        await tx.cfRendaTurbinadaLesson.update({
          where: { id },
          data: { sortOrder: index + 1 }
        });
      }

      const targetLessons = await tx.cfRendaTurbinadaLesson.findMany({
        where: { moduleId: parsedTargetModuleId },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      const targetIds = targetLessons.map(currentLesson => currentLesson.id);
      const clampedIndex = clamp(parsedTargetPosition - 1, 0, targetIds.length);
      targetIds.splice(clampedIndex, 0, parsedLessonId);

      for (let index = 0; index < targetIds.length; index += 1) {
        const id = targetIds[index];
        await tx.cfRendaTurbinadaLesson.update({
          where: { id },
          data: {
            sortOrder: index + 1,
            ...(id === parsedLessonId ? { moduleId: parsedTargetModuleId } : {})
          }
        });
      }
    });

    const moduleIdsToFetch = isSameModule ? [sourceModuleId] : [sourceModuleId, parsedTargetModuleId];

    const updatedModules = await prisma.cfRendaTurbinadaModule.findMany({
      where: { id: { in: moduleIdsToFetch } },
      include: {
        lessons: {
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'asc' }
          ],
          include: {
            materials: {
              orderBy: [
                { createdAt: 'asc' },
                { id: 'asc' }
              ]
            }
          }
        }
      }
    });

    return NextResponse.json({ modules: updatedModules.map(serializeModule) });
  } catch (error) {
    console.error('Erro ao mover aula do CF Renda Turbinada:', error);
    return NextResponse.json({ error: 'Erro ao mover aula' }, { status: 500 });
  }
}
