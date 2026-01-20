// src/app/api/faq/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Public endpoint: no authentication headers are required
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const rawLimit = Number(searchParams.get('limit') ?? 20);
    const limit = Math.min(50, Math.max(10, Number.isFinite(rawLimit) ? rawLimit : 20));

    const faqs = await prisma.answer.findMany({
      where: { isFaq: true },
      select: {
        id: true,
        content: true,
        faqTitle: true,
        faqOrder: true,
        createdAt: true,
        admin: { select: { firstName: true, lastName: true } },
        question: {
          select: {
            id: true,
            title: true,
            category: true
          }
        }
      },
      orderBy: [{ faqOrder: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    });
    const total = await prisma.answer.count({ where: { isFaq: true } });
    return NextResponse.json(
      {
        faqs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120',
        },
      }
    );

  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
