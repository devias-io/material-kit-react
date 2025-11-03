import { mkdir, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { serializeMaterial } from '../../../utils';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export async function POST(request: NextRequest, { params }: { params: { lessonId: string } }) {
  const lessonId = Number(params.lessonId);

  if (!params.lessonId || Number.isNaN(lessonId)) {
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

    const lesson = await prisma.bastidoresDaBolsaLesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const formData = await request.formData();

    const file = formData.get('file');
    const title = formData.get('title');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: 'Arquivo vazio' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Arquivo maior que 25MB' }, { status: 400 });
    }

    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Formato de arquivo não suportado' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'bastidores-da-bolsa');
    await mkdir(uploadDir, { recursive: true });

    const originalExtension = path.extname(file.name) || '';
    const filename = `${randomUUID()}${originalExtension}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const material = await prisma.bastidoresDaBolsaLessonMaterial.create({
      data: {
        lessonId,
        title: typeof title === 'string' && title.trim().length > 0 ? title.trim() : file.name,
        fileUrl: `/uploads/bastidores-da-bolsa/${filename}`
      }
    });

    return NextResponse.json({ material: serializeMaterial(material) }, { status: 201 });
  } catch (error) {
    console.error('Erro ao anexar material em Bastidores da Bolsa:', error);
    return NextResponse.json({ error: 'Erro ao anexar material' }, { status: 500 });
  }
}
