import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 📦 Registrar status de processamento dos relatórios
export async function POST(request: NextRequest) {
  try {
    const { reportId, pdfUrl, status } = await request.json();

    if (!reportId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatórios: reportId e status',
        },
        { status: 400 }
      );
    }

    const registro = await prisma.reportFile.create({
      data: {
        reportId,
        pdfUrl: pdfUrl || null,
        status,
      },
    });

    return NextResponse.json(
      { success: true, reportFile: registro },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao registrar status do relatório:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

