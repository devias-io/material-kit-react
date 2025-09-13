import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const report = await prisma.report.findUnique({ where: { id: params.id } })

  if (!report) {
    return NextResponse.json(
      { success: false, error: 'Report not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, report })
}

