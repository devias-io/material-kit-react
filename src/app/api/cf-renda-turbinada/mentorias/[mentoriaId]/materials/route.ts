import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { serializeMentoriaMaterial } from '../../../utils';

type FileLike = {
  arrayBuffer: () => Promise<ArrayBuffer>;
  size: number;
  type?: string;
  name?: string;
};

function isFileLike(value: unknown): value is FileLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FileLike).arrayBuffer === 'function' &&
    typeof (value as FileLike).size === 'number'
  );
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const BASE64_LIMIT_BYTES = 10 * 1024 * 1024;

async function processBase64File(file: FileLike): Promise<{
  fileUrl: string;
  fileName: string;
}> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (file.size > BASE64_LIMIT_BYTES) {
    throw new Error(
      `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). ` +
        'Limite: 10MB. Configure um provedor de arquivos (ex.: Vercel Blob) para suportar uploads maiores.'
    );
  }

  const base64 = buffer.toString('base64');
  const mimeType = file.type || 'application/octet-stream';
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return {
    fileUrl: dataUrl,
    fileName: file.name || 'material'
  };
}

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

    const mentoria = await prisma.cfRendaTurbinadaMentoria.findUnique({
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

    if (file.size <= 0) {
      return NextResponse.json({ error: 'Arquivo vazio' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Arquivo maior que 25MB' }, { status: 400 });
    }

    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Formato de arquivo não suportado' }, { status: 400 });
    }

    const processedFile = await processBase64File(file);

    const material = await prisma.cfRendaTurbinadaMentoriaMaterial.create({
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
    console.error('Erro ao anexar material na mentoria gravada do CF Renda Turbinada:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Erro ao anexar material' }, { status: 500 });
  }
}
