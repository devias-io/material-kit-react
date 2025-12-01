import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

    const { moduleId, lessons } = body as {
      moduleId?: unknown;
      lessons?: unknown;
    };

    if (typeof moduleId !== 'string' || !moduleId.trim()) {
      return NextResponse.json({ error: 'ID do módulo é obrigatório' }, { status: 400 });
    }

    if (!Array.isArray(lessons) || lessons.length === 0) {
      return NextResponse.json({ error: 'Lista de aulas inválida' }, { status: 400 });
    }

    const validLessons = lessons.every(
      lesson => lesson && typeof lesson === 'object' && typeof (lesson as { id?: unknown }).id === 'number'
    );

    if (!validLessons) {
      return NextResponse.json({ error: 'Formato inválido para aulas' }, { status: 400 });
    }

    await prisma.$transaction(
      lessons.map((lesson, index) =>
        prisma.cfRendaTurbinadaTurma2Lesson.update({
          where: { id: (lesson as { id: number }).id },
          data: { sortOrder: index + 1 }
        })
      )
    );

    const reordered = await prisma.cfRendaTurbinadaTurma2Lesson.findMany({
      where: { moduleId },
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
    });

    return NextResponse.json({ lessons: reordered });
  } catch (error) {
    console.error('Erro ao reordenar aulas do CF Renda Turbinada Turma 2:', error);
    return NextResponse.json({ error: 'Erro ao reordenar aulas' }, { status: 500 });
  }
}
