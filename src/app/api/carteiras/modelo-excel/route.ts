// src/app/api/carteiras/modelo-excel/route.ts

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const TEMPLATE_PATH = join(process.cwd(), 'public', 'modelos', 'analise-de-carteira.xlsx');

export async function GET() {
  try {
    const fileBuffer = await fs.readFile(TEMPLATE_PATH);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Modelo-Carteira-Completo.xlsx"'
      }
    });
  } catch (error) {
    console.error('Erro ao carregar modelo Excel:', error);
    const details = error instanceof Error ? error.message : 'Erro desconhecido';

    return NextResponse.json(
      {
        error: 'Erro ao carregar modelo Excel',
        details
      },
      { status: 500 }
    );
  }
}
