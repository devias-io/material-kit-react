import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeMaterial } from '../../../utils';

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

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const LIMITE_BASE64 = 3 * 1024 * 1024; // 3MB - Arquivos menores salvos em base64

// ✅ FUNÇÃO PARA PROCESSAR ARQUIVO (Base64)
async function processarArquivoBase64(file: FileLike): Promise<{
  fileUrl: string;
  fileName: string;
  fileSize: number;
  storageType: string;
}> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  if (file.size <= LIMITE_BASE64) {
    // ✅ Arquivo pequeno: converter para base64
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    return {
      fileUrl: dataUrl,
      fileName: file.name || 'material',
      fileSize: file.size,
      storageType: 'base64'
    };
  } else {
    // ❌ Arquivo grande: não suportado (precisa Vercel Blob ou Cloudinary)
    throw new Error(
      `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). ` +
      `Limite: 3MB. Configure Vercel Blob ou Cloudinary para arquivos maiores.`
    );
  }
}

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

    const lesson = await prisma.cfRendaTurbinadaLesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
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

    // ✅ PROCESSAR ARQUIVO EM BASE64
    const dadosArquivo = await processarArquivoBase64(file);

    // ✅ SALVAR NO BANCO (fileUrl agora é base64 data URL)
    const material = await prisma.cfRendaTurbinadaLessonMaterial.create({
      data: {
        lessonId,
        title: typeof title === 'string' && title.trim().length > 0 
          ? title.trim() 
          : dadosArquivo.fileName,
        fileUrl: dadosArquivo.fileUrl // Base64 data URL
      }
    });

    return NextResponse.json({ material: serializeMaterial(material) }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao anexar material no CF Renda Turbinada:', error);
    
    // ✅ RETORNAR MENSAGEM DE ERRO CLARA
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro ao anexar material' }, { status: 500 });
  }
}
