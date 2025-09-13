// src/app/api/questions/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Busca inteligente em perguntas e respostas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const includeAnswers = searchParams.get('includeAnswers') === 'true';
    const includeFaq = searchParams.get('includeFaq') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Query must be at least 2 characters' 
      }, { status: 400 });
    }

    const isAdmin = user.plan === 'ADMIN';
    
    // Construir query base
    let whereClause: any = {};

    // Se não é admin, só buscar suas próprias perguntas
    if (!isAdmin) {
      whereClause.userId = user.id;
    }

    // Filtro por categoria se especificado
    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    // Busca por texto usando PostgreSQL full-text search
    const searchConditions = [];
    
    // Buscar em perguntas
    const questionResults = await prisma.$queryRaw`
      SELECT 
        q.id,
        q.title,
        q.content,
        q.category,
        q.status,
        q."createdAt",
        q."userId",
        u."firstName",
        u."lastName",
        u.email,
        u.plan,
        ts_rank(to_tsvector('portuguese', q.title || ' ' || q.content), plainto_tsquery('portuguese', ${query})) as rank,
        'question' as type
      FROM questions q
      JOIN "User" u ON q."userId" = u.id
      WHERE to_tsvector('portuguese', q.title || ' ' || q.content) @@ plainto_tsquery('portuguese', ${query})
      ${!isAdmin ? `AND q."userId" = ${user.id}` : ''}
      ${category && category !== 'ALL' ? `AND q.category = '${category}'` : ''}
      ORDER BY rank DESC
      LIMIT ${limit}
      OFFSET ${(page - 1) * limit}
    ` as any[];

    let answerResults: any[] = [];
    
    // Buscar em respostas se includeAnswers for true
    if (includeAnswers) {
      answerResults = await prisma.$queryRaw`
        SELECT 
          a.id,
          a.content,
          a."createdAt",
          a."isFaq",
          a."faqTitle",
          q.id as "questionId",
          q.title as "questionTitle",
          q.category,
          q."userId" as "questionUserId",
          admin."firstName" as "adminFirstName",
          admin."lastName" as "adminLastName",
          ts_rank(to_tsvector('portuguese', a.content), plainto_tsquery('portuguese', ${query})) as rank,
          'answer' as type
        FROM answers a
        JOIN questions q ON a."questionId" = q.id
        JOIN "User" admin ON a."adminId" = admin.id
        WHERE to_tsvector('portuguese', a.content) @@ plainto_tsquery('portuguese', ${query})
        ${!isAdmin ? `AND q."userId" = ${user.id}` : ''}
        ${category && category !== 'ALL' ? `AND q.category = '${category}'` : ''}
        ${includeFaq ? 'AND a."isFaq" = true' : ''}
        ORDER BY rank DESC
        LIMIT ${limit}
        OFFSET ${(page - 1) * limit}
      ` as any[];
    }

    // Buscar FAQ específicas se includeFaq for true
    let faqResults: any[] = [];
    if (includeFaq) {
      faqResults = await prisma.$queryRaw`
        SELECT 
          a.id,
          a.content,
          a."faqTitle",
          a."faqOrder",
          a."createdAt",
          q.id as "questionId",
          q.title as "questionTitle",
          q.category,
          admin."firstName" as "adminFirstName",
          admin."lastName" as "adminLastName",
          ts_rank(to_tsvector('portuguese', COALESCE(a."faqTitle", '') || ' ' || a.content), plainto_tsquery('portuguese', ${query})) as rank,
          'faq' as type
        FROM answers a
        JOIN questions q ON a."questionId" = q.id
        JOIN "User" admin ON a."adminId" = admin.id
        WHERE a."isFaq" = true
        AND to_tsvector('portuguese', COALESCE(a."faqTitle", '') || ' ' || a.content) @@ plainto_tsquery('portuguese', ${query})
        ${category && category !== 'ALL' ? `AND q.category = '${category}'` : ''}
        ORDER BY rank DESC, a."faqOrder" ASC
        LIMIT ${limit}
        OFFSET ${(page - 1) * limit}
      ` as any[];
    }

    // Combinar resultados e ordenar por relevância
    const allResults = [
      ...questionResults.map(r => ({ ...r, type: 'question' })),
      ...answerResults.map(r => ({ ...r, type: 'answer' })),
      ...faqResults.map(r => ({ ...r, type: 'faq' }))
    ].sort((a, b) => parseFloat(b.rank) - parseFloat(a.rank));

    // Contar totais para paginação
    const totalQuestions = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM questions q
      WHERE to_tsvector('portuguese', q.title || ' ' || q.content) @@ plainto_tsquery('portuguese', ${query})
      ${!isAdmin ? `AND q."userId" = ${user.id}` : ''}
      ${category && category !== 'ALL' ? `AND q.category = '${category}'` : ''}
    ` as any[];

    const totalAnswers = includeAnswers ? await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM answers a
      JOIN questions q ON a."questionId" = q.id
      WHERE to_tsvector('portuguese', a.content) @@ plainto_tsquery('portuguese', ${query})
      ${!isAdmin ? `AND q."userId" = ${user.id}` : ''}
      ${category && category !== 'ALL' ? `AND q.category = '${category}'` : ''}
    ` as any[] : [{ count: 0 }];

    const totalFaqs = includeFaq ? await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM answers a
      JOIN questions q ON a."questionId" = q.id
      WHERE a."isFaq" = true
      AND to_tsvector('portuguese', COALESCE(a."faqTitle", '') || ' ' || a.content) @@ plainto_tsquery('portuguese', ${query})
      ${category && category !== 'ALL' ? `AND q.category = '${category}'` : ''}
    ` as any[] : [{ count: 0 }];

    const total = Number(totalQuestions[0].count) + Number(totalAnswers[0].count) + Number(totalFaqs[0].count);

    return NextResponse.json({
      results: allResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalQuestions: Number(totalQuestions[0].count),
        totalAnswers: Number(totalAnswers[0].count),
        totalFaqs: Number(totalFaqs[0].count)
      },
      query,
      isAdmin
    });

  } catch (error) {
    console.error('Error searching questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}