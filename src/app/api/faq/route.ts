// src/app/api/faq/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Public endpoint: no authentication headers are required

    const faqs = await prisma.answer.findMany({
      where: { isFaq: true },
      include: {
        question: true,
        admin: { select: { firstName: true, lastName: true } }
      },
      orderBy: [{ faqOrder: 'asc' }, { createdAt: 'desc' }]
    });
    return NextResponse.json(
      {
        faqs,
        pagination: { page: 1, limit: 20, total: faqs.length, totalPages: 1 },
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