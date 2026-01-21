import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

async function verifyAdmin() {
  try {
    const session = await auth();
    if (session?.user?.plan === 'ADMIN') {
      return session.user;
    }
    return null;
  } catch (error) {
    console.error('❌ Erro na verificação admin:', error);
    return null;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const migrationCheckoutUrl = body?.migrationCheckoutUrl?.trim() || null;

    const product = await prisma.migrationProduct.update({
      where: { id: params.id },
      data: {
        migrationCheckoutUrl,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('❌ Erro ao atualizar produto de migração:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 400 }
    );
  }
}
