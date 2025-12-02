import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword, confirmPassword } = await request.json();
    
    console.log('🔐 Solicitação de alteração de senha');

    // Validar dados
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ 
        error: 'Todos os campos são obrigatórios' 
      }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ 
        error: 'Nova senha e confirmação não coincidem' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'Nova senha deve ter pelo menos 6 caracteres' 
      }, { status: 400 });
    }

    // Recuperar usuário da sessão
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }

    // Verificar senha atual
    const senhaValida = await verifyPassword(currentPassword, user.password || '');
    
    if (!senhaValida) {
      return NextResponse.json({ 
        error: 'Senha atual incorreta' 
      }, { status: 400 });
    }

    console.log('✅ Senha atual confirmada para:', user.email);

    // Hash da nova senha
    const novaSenhaHash = await hashPassword(newPassword);

    // Atualizar senha do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: novaSenhaHash,
        passwordCreatedAt: new Date(),
        mustChangePassword: false, // 🎯 IMPORTANTE: Remover obrigação
        loginAttempts: 0, // Resetar tentativas
        lockedUntil: null // Desbloquear conta
      }
    });

    console.log('🎉 Senha alterada com sucesso para:', user.email);

    return NextResponse.json({
      message: 'Senha alterada com sucesso',
      mustChangePassword: false
    });

  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}