import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { serializeMentoriaMaterial } from '../../../utils';
import {
  DEFAULT_ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  isFileLike,
  processUploadedFile,
  validateFile
} from '../../../upload-utils';

export async function POST(request: NextRequest, { params }: { params: { mentoriaId: string } }) {
  const mentoriaId = Number(params.mentoriaId);

  if (!params.mentoriaId || Number.isNaN(mentoriaId)) {
    return NextResponse.json({ error: 'Mentoria id is required' }, { status: 400 });
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

    const mentoria = await prisma.cfRendaTurbinadaTurma2Mentoria.findUnique({
      where: { id: mentoriaId }
    });

    if (!mentoria) {
      return NextResponse.json({ error: 'Mentoria not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');

    if (!isFileLike(file)) {
      return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 });
    }

    const validationError = validateFile(file, {
      allowedMimeTypes: DEFAULT_ALLOWED_MIME_TYPES,
      maxFileSizeBytes: MAX_FILE_SIZE_BYTES
    });

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const processedFile = await processUploadedFile(file, {
      uploadFolder: 'cf-renda-turbinada-turma-2/mentorias-materials'
    });

    const material = await prisma.cfRendaTurbinadaTurma2MentoriaMaterial.create({
      data: {
        mentoriaId,
        title:
          typeof title === 'string' && title.trim().length > 0
            ? title.trim()
            : processedFile.fileName,
        fileUrl: processedFile.fileUrl
      }
    });

    return NextResponse.json({ material: serializeMentoriaMaterial(material) }, { status: 201 });
  } catch (error) {
    console.error('Erro ao anexar material na mentoria gravada do CF Renda Turbinada Turma 2:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Erro ao anexar material' }, { status: 500 });
  }
}
