import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const progress = await prisma.lessonProgressTurma2.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        lessonId: true,
        completedAt: true
      }
    });

    const completedLessonIds = progress.map(progressItem => progressItem.lessonId);

    return NextResponse.json({ completedLessons: completedLessonIds });
  } catch (error) {
    console.error('Erro ao buscar progresso (turma 2):', error);
    return NextResponse.json({ error: 'Erro ao buscar progresso' }, { status: 500 });
  }
}
