import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const lessonId = Number.parseInt(params.lessonId, 10);

    if (Number.isNaN(lessonId)) {
      return NextResponse.json({ error: 'ID da aula inválido' }, { status: 400 });
    }

    const lesson = await prisma.cfRendaTurbinadaTurma2Lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 });
    }

    await prisma.lessonProgressTurma2.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId
        }
      },
      create: {
        userId: session.user.id,
        lessonId
      },
      update: {
        completedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar aula como concluída (turma 2):', error);
    return NextResponse.json({ error: 'Erro ao marcar aula como concluída' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const lessonId = Number.parseInt(params.lessonId, 10);

    if (Number.isNaN(lessonId)) {
      return NextResponse.json({ error: 'ID da aula inválido' }, { status: 400 });
    }

    await prisma.lessonProgressTurma2
      .delete({
        where: {
          userId_lessonId: {
            userId: session.user.id,
            lessonId
          }
        }
      })
      .catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao desmarcar aula (turma 2):', error);
    return NextResponse.json({ error: 'Erro ao desmarcar aula' }, { status: 500 });
  }
}
