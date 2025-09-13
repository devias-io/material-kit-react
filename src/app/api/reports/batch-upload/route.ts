import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reportQueue } from '@/lib/reportQueue'

function extractCanvaId(input: string): string {
  const match = input.match(/design\/([A-Za-z0-9_-]+)/)
  return match ? match[1] : input
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const links: string[] = body?.links

    if (!Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { success: false, error: 'links must be a non-empty array' },
        { status: 400 }
      )
    }

    const createdReports = []

    for (const link of links) {
      const canvaId = extractCanvaId(link)
      const report = await prisma.report.create({
        data: { canvaId }
      })

      reportQueue.enqueue({ reportId: report.id, canvaId })

      createdReports.push({ id: report.id, status: report.status })
    }

    return NextResponse.json({ success: true, reports: createdReports })
  } catch (error) {
    console.error('Erro no batch upload:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar uploads' },
      { status: 500 }
    )
  }
}

