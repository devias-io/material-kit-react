import { prisma } from '@/lib/prisma'

interface ReportJob {
  reportId: string
  canvaId: string
}

class ReportQueue {
  private queue: ReportJob[] = []
  private processing = false

  enqueue(job: ReportJob) {
    this.queue.push(job)
    void this.process()
  }

  private async process(): Promise<void> {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()!
      await this.handle(job)
    }

    this.processing = false
  }

  private async handle(job: ReportJob): Promise<void> {
    try {
      await prisma.report.update({
        where: { id: job.reportId },
        data: { status: 'processing', progress: 10 }
      })

      const iframeUrl = `https://www.canva.com/design/${job.canvaId}/view?embed`
      const name = `Report ${job.canvaId}`

      // Simular processamento assíncrono
      await new Promise(resolve => setTimeout(resolve, 1000))

      await prisma.report.update({
        where: { id: job.reportId },
        data: {
          name,
          iframeUrl,
          status: 'completed',
          progress: 100
        }
      })
    } catch (error) {
      await prisma.report.update({
        where: { id: job.reportId },
        data: { status: 'failed', progress: 100 }
      })
    }
  }
}

const globalForQueue = globalThis as unknown as {
  reportQueue?: ReportQueue
}

export const reportQueue =
  globalForQueue.reportQueue ?? new ReportQueue()

if (!globalForQueue.reportQueue) {
  globalForQueue.reportQueue = reportQueue
}

