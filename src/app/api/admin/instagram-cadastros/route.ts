// src/app/api/admin/instagram-cadastros/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 API Admin chamada...');
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const rawLimit = Number(searchParams.get('limit') ?? 50);
    const limit = Math.min(100, Math.max(20, Number.isFinite(rawLimit) ? rawLimit : 50));

    // Buscar todos os cadastros sem verificação (TEMPORÁRIO)
    const cadastros = await prisma.instagramCadastro.findMany({
      select: {
        id: true,
        instagram: true,
        previousInstagram: true,
        isUpdated: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            plan: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    const total = await prisma.instagramCadastro.count();

    console.log('✅ Cadastros encontrados:', cadastros.length);

    return NextResponse.json({
      success: true,
      data: cadastros,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('💥 Erro ao buscar cadastros:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cadastroId = searchParams.get('id');

    if (!cadastroId) {
      return NextResponse.json(
        { error: 'ID do cadastro é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.instagramCadastro.delete({
      where: { id: cadastroId }
    });

    return NextResponse.json({
      success: true,
      message: 'Cadastro removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover cadastro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
