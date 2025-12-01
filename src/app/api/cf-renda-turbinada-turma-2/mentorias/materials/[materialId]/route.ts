import { unlink } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: { materialId: string } }) {
  const materialId = Number(params.materialId);

  if (!params.materialId || Number.isNaN(materialId)) {
    return NextResponse.json({ error: 'Material id is required' }, { status: 400 });
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

    const material = await prisma.cfRendaTurbinadaTurma2MentoriaMaterial.findUnique({
      where: { id: materialId }
    });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    await prisma.cfRendaTurbinadaTurma2MentoriaMaterial.delete({
      where: { id: materialId }
    });

    if (material.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', material.fileUrl.replace(/^\//, ''));

      try {
        await unlink(filePath);
      } catch (error) {
        console.warn('Não foi possível remover arquivo de material de mentoria gravada (Turma 2):', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover material de mentoria gravada do CF Renda Turbinada Turma 2:', error);
    return NextResponse.json({ error: 'Erro ao remover material' }, { status: 500 });
  }
}
