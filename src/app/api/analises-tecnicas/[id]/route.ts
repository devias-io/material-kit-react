import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ensureSlug, slugify } from '@/utils/slugify';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const analise = await prisma.analiseTecnica.findUnique({
      where: {
        id,
      },
      include: {
        autor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
    });

    if (!analise) {
      return NextResponse.json({ error: 'Análise técnica não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ analise });
  } catch (error) {
    console.error('Erro ao buscar análise técnica:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const {
      ticker,
      titulo,
      resumo,
      conteudo,
      imagemCapa,
      publicado,
      destaque,
      fonte,
      slug: providedSlug,
    } = body;

    const current = await prisma.analiseTecnica.findUnique({ where: { id } });

    if (!current) {
      return NextResponse.json({ error: 'Análise técnica não encontrada' }, { status: 404 });
    }

    let slug = current.slug;

    if (typeof providedSlug === 'string' && providedSlug.trim().length > 0) {
      slug = slugify(providedSlug);
    } else if (typeof titulo === 'string' && titulo.trim().length > 0) {
      slug = slugify(titulo);
    }

    if (!slug) {
      const baseSlugSource =
        current.slug && current.slug.trim().length > 0
          ? current.slug
          : current.titulo || current.ticker || current.id;
      slug = ensureSlug(baseSlugSource, Date.now());
    } else if (slug !== current.slug) {
      const slugExists = await prisma.analiseTecnica.findUnique({ where: { slug } });
      if (slugExists && slugExists.id !== current.id) {
        slug = ensureSlug(slug, Date.now());
      }
    }

    const nextAutorId =
      typeof current.autorId === 'string' && current.autorId.trim().length > 0
        ? current.autorId
        : session.user.id ?? null;

    const analiseAtualizada = await prisma.analiseTecnica.update({
      where: { id },
      data: {
        ticker: ticker ? String(ticker).toUpperCase() : current.ticker,
        titulo: titulo ?? current.titulo,
        resumo: resumo !== undefined ? resumo : current.resumo,
        conteudo: conteudo ?? current.conteudo,
        imagemCapa: imagemCapa !== undefined ? imagemCapa : current.imagemCapa,
        publicado: typeof publicado === 'boolean' ? publicado : current.publicado,
        destaque: typeof destaque === 'boolean' ? destaque : current.destaque,
        fonte: fonte !== undefined ? fonte : current.fonte,
        slug,
        ...(nextAutorId ? { autorId: nextAutorId } : {}),
      },
      include: {
        autor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ analise: analiseAtualizada });
  } catch (error) {
    console.error('Erro ao atualizar análise técnica:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
    }

    const { id } = params;

    await prisma.analiseTecnica.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir análise técnica:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
