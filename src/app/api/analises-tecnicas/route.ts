import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ensureSlug, slugify } from '@/utils/slugify';

function buildUniqueSlug(base: string): string {
  const baseSlug = slugify(base);
  if (!baseSlug) {
    return `analise-${Date.now()}`;
  }

  return ensureSlug(baseSlug, Date.now());
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const slug = searchParams.get('slug');
    const publicado = searchParams.get('publicado');
    const destaque = searchParams.get('destaque');
    const limitParam = searchParams.get('limit');

    const where: any = {};

    if (ticker) {
      where.ticker = ticker.toUpperCase();
    }

    if (slug) {
      where.slug = slug;
    }

    if (publicado !== null) {
      where.publicado = publicado === 'true';
    }

    if (destaque !== null) {
      where.destaque = destaque === 'true';
    }

    const take = limitParam ? Number.parseInt(limitParam, 10) || undefined : undefined;

    const analises = await prisma.analiseTecnica.findMany({
      where,
      take,
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
      orderBy: [
        { destaque: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ analises });
  } catch (error) {
    console.error('Erro ao buscar análises técnicas:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      ticker,
      titulo,
      resumo,
      conteudo,
      imagemCapa,
      publicado = true,
      destaque = false,
      fonte,
      slug: providedSlug,
    } = body;

    if (!ticker || !titulo || !conteudo) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: ticker, titulo e conteudo' },
        { status: 400 }
      );
    }

    const normalizedTicker = String(ticker).toUpperCase();

    let slug = providedSlug ? slugify(String(providedSlug)) : slugify(String(titulo));
    if (!slug) {
      slug = buildUniqueSlug(String(titulo) || normalizedTicker);
    } else {
      const exists = await prisma.analiseTecnica.findUnique({ where: { slug } });
      if (exists) {
        slug = ensureSlug(slug, Date.now());
      }
    }

    const analise = await prisma.analiseTecnica.create({
      data: {
        ticker: normalizedTicker,
        titulo,
        resumo: resumo ?? null,
        conteudo,
        imagemCapa: imagemCapa ?? null,
        publicado,
        destaque,
        fonte: fonte ?? null,
        slug,
        autorId: session.user.id,
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

    return NextResponse.json({ analise }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar análise técnica:', error);

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
