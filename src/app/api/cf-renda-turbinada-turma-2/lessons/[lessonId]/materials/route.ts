import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

import { serializeLessonMaterial } from '../../../utils';

export async function POST(request: NextRequest, { params }: { params: { lessonId: string } }) {
  const lessonId = Number(params.lessonId);

  if (Number.isNaN(lessonId)) {
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

    const lesson = await prisma.cfRendaTurbinadaTurma2Lesson.findUnique({
      where: { id: lessonId },
      include: { materials: true }
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

    const { title, fileUrl } = body as {
      title?: unknown;
      fileUrl?: unknown;
    };

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    if (typeof fileUrl !== 'string' || !fileUrl.trim()) {
      return NextResponse.json({ error: 'URL do arquivo é obrigatória' }, { status: 400 });
    }

    const trimmedTitle = title.trim();
    const trimmedFileUrl = fileUrl.trim();

    const material = await prisma.cfRendaTurbinadaTurma2LessonMaterial.create({
      data: {
        lessonId,
        title: trimmedTitle,
        fileUrl: trimmedFileUrl
      }
    });

    return NextResponse.json({ material: serializeLessonMaterial(material) }, { status: 201 });
  } catch (error) {
    console.error('Erro ao anexar material na aula do CF Renda Turbinada Turma 2:', error);
    return NextResponse.json({ error: 'Erro ao anexar material' }, { status: 500 });
  }
}
