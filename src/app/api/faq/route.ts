// src/app/api/faq/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Public endpoint: no authentication headers are required

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let whereClause: any = {
      isFaq: true
    };

    if (category && category !== 'ALL') {
      whereClause.question = {
        category: category
      };
    }

    const faqs = await prisma.answer.findMany({
      where: whereClause,
      include: {
        question: true,
        admin: { select: { firstName: true, lastName: true } }
      },
      orderBy: [{ faqOrder: 'asc' }, { createdAt: 'desc' }]
    });

    const groupedFaqs = faqs.reduce((acc, faq) => {
      const category = faq.question.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(faq);
      return acc;
    }, {});

    return NextResponse.json({
      faqs,
      groupedFaqs,
      pagination: { page: 1, limit: 20, total: faqs.length, totalPages: 1 }
    });

  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}