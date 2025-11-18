import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const ip = request.ip || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Log da tentativa
    await prisma.loginLog.create({
      data: {
        userId: user?.id || null,
        email: email.toLowerCase(),
        success: false, // Será atualizado se login der certo
        ip,
        userAgent
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Email ou senha inválidos' }, { status: 401 });
    }

    // Verificar senha
    const senhaValida = await verifyPassword(password, user.password || '');
    
    if (!senhaValida) {
      // Incrementar tentativas
      const tentativas = (user.loginAttempts || 0) + 1;
      const solicitarRedefinicao = tentativas >= 5;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: tentativas,
          lockedUntil: null
        }
      });

      if (solicitarRedefinicao) {
        return NextResponse.json({
          error: 'Muitas tentativas inválidas. Clique em "Esqueci minha senha" para redefinir sua senha.'
        }, { status: 401 });
      }

      return NextResponse.json({ error: 'Email ou senha inválidos' }, { status: 401 });
    }

    // Verificar se usuário está ativo
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Conta inativa' }, { status: 403 });
    }

    // Verificar se acesso expirou
    if (user.expirationDate && user.expirationDate < new Date()) {
      return NextResponse.json({ error: 'Acesso expirado' }, { status: 403 });
    }

    // Login bem-sucedido - resetar tentativas e atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date()
      }
    });

    // Atualizar log para sucesso
    await prisma.loginLog.updateMany({
      where: { 
        email: email.toLowerCase(),
        success: false,
        createdAt: { gte: new Date(Date.now() - 5000) } // últimos 5 segundos
      },
      data: { success: true }
    });

    // Gerar JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        plan: user.plan 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.plan,
        mustChangePassword: user.mustChangePassword
      }
    });

    // Definir cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    });

    return response;

  } catch (error) {
    console.error('❌ Erro no login:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}