import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { gerarSenhaSegura, hashPassword } from '@/lib/auth/password';
import { enviarEmailCredenciais } from '@/lib/auth/email';
import { prisma } from '@/lib/prisma';

async function verifyAuth() {
  try {
    const session = await auth();

    if (session?.user?.plan === 'ADMIN') {
      return session.user;
    }

    return null;
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return null;
  }
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAuth();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const tempPassword = gerarSenhaSegura();
    const hashedPassword = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    try {
      await enviarEmailCredenciais(
        user.email,
        user.firstName || 'usuário',
        tempPassword,
        user.plan || undefined
      );
    } catch (emailError: any) {
      console.error('❌ Erro ao enviar email:', emailError);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao enviar email com instruções',
          details: emailError?.message ?? null,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Instruções de acesso reenviadas com sucesso. Uma nova senha temporária foi enviada ao usuário.',
    });
  } catch (error) {
    console.error('❌ Erro ao reenviar instruções:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
      },
      { status: 500 },
    );
  }
}
