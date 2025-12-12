// src/app/api/instagram-cadastro/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { CacheService } from '@/lib/redis';

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX = 20;

async function requireUser(req: NextRequest): Promise<string | null> {
  const authData = await auth();
  if (authData?.user?.id) {
    return authData.user.id;
  }

  const tokenHeader = req.headers.get('authorization');
  if (tokenHeader?.startsWith('Bearer ')) {
    return null;
  }

  return null;
}

async function enforceRateLimit(userId: string) {
  const key = CacheService.getCacheKey('instagram-cadastro', userId);
  const current = (await CacheService.get<number>(key)) ?? 0;
  if (current >= RATE_LIMIT_MAX) {
    return false;
  }
  await CacheService.set(key, current + 1, RATE_LIMIT_WINDOW_SECONDS);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    console.log('📝 POST - Cadastrando Instagram...');
    
    const userId = await requireUser(req);

    if (!userId) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const allowed = await enforceRateLimit(userId);
    if (!allowed) {
      return NextResponse.json({ error: 'Muitas requisições, tente novamente em instantes.' }, { status: 429 });
    }
    const { instagram } = await req.json();
    
    if (!instagram || instagram.trim().length < 3) {
      return NextResponse.json(
        { error: 'Instagram inválido' },
        { status: 400 }
      );
    }
    const cleanInstagram = instagram.replace('@', '').trim();
    
    // Verificar se já existe cadastro
    const existingCadastro = await prisma.instagramCadastro.findUnique({
      where: { userId }
    });
    
    // Criar ou atualizar o cadastro do Instagram
    const instagramCadastro = await prisma.instagramCadastro.upsert({
      where: { userId },
      update: {
        instagram: cleanInstagram,
        previousInstagram: existingCadastro?.instagram || null, // Salvar o anterior
        isUpdated: existingCadastro ? true : false, // Marcar como atualizado se já existia
        updatedAt: new Date()
      },
      create: {
        userId,
        instagram: cleanInstagram,
        previousInstagram: null, // Primeiro cadastro não tem anterior
        isUpdated: false // Primeiro cadastro não é atualização
      }
    });
    
    console.log('✅ Instagram cadastrado:', cleanInstagram);
    console.log('📊 Status:', existingCadastro ? 'ATUALIZADO' : 'NOVO');
    
    return NextResponse.json({
      success: true,
      message: 'Instagram cadastrado com sucesso',
      data: {
        instagram: instagramCadastro.instagram,
        isUpdated: instagramCadastro.isUpdated,
        previousInstagram: instagramCadastro.previousInstagram,
        createdAt: instagramCadastro.createdAt
      }
    });
  } catch (error) {
    console.error('💥 Erro ao cadastrar Instagram:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log('🔄 PUT - Atualizando Instagram...');
    
    const userId = await requireUser(req);

    if (!userId) {
      console.log('❌ Usuário não autenticado');
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    const { instagram } = await req.json();
    
    if (!instagram || instagram.trim().length < 3) {
      console.log('❌ Instagram inválido:', instagram);
      return NextResponse.json(
        { error: 'Instagram deve ter pelo menos 3 caracteres' },
        { status: 400 }
      );
    }
    
    const cleanInstagram = instagram.replace('@', '').trim();
    
    // Buscar o cadastro atual para salvar como anterior
    const currentCadastro = await prisma.instagramCadastro.findUnique({
      where: { userId }
    });
    
    if (!currentCadastro) {
      // Se não existe, criar um novo
      const newCadastro = await prisma.instagramCadastro.create({
        data: {
          userId,
          instagram: cleanInstagram,
          previousInstagram: null,
          isUpdated: false
        }
      });
      
      console.log('✅ Instagram criado (não existia):', cleanInstagram);
      
      return NextResponse.json({
        success: true,
        message: 'Instagram cadastrado com sucesso',
        data: {
          instagram: newCadastro.instagram,
          isUpdated: false,
          previousInstagram: null,
          updatedAt: newCadastro.updatedAt
        }
      });
    }
    
    // Atualizar o cadastro salvando o anterior
    const instagramCadastro = await prisma.instagramCadastro.update({
      where: { userId },
      data: {
        instagram: cleanInstagram,
        previousInstagram: currentCadastro.instagram, // Salvar o atual como anterior
        isUpdated: true, // Marcar como atualizado
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Instagram atualizado:', cleanInstagram);
    console.log('📝 Instagram anterior:', currentCadastro.instagram);
    
    return NextResponse.json({
      success: true,
      message: 'Instagram atualizado com sucesso',
      data: {
        instagram: instagramCadastro.instagram,
        previousInstagram: instagramCadastro.previousInstagram,
        isUpdated: instagramCadastro.isUpdated,
        updatedAt: instagramCadastro.updatedAt
      }
    });
    
  } catch (error) {
    console.error('💥 Erro ao atualizar Instagram:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUser(req);

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    const instagramCadastro = await prisma.instagramCadastro.findUnique({
      where: { userId }
    });
    
    return NextResponse.json({
      success: true,
      data: instagramCadastro
    });
  } catch (error) {
    console.error('Erro ao buscar Instagram:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}