import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import puppeteer, { Browser } from 'puppeteer';
import { auth } from '@/lib/auth';
import { CacheService } from '@/lib/redis';

const s3 = new S3Client({ region: process.env.AWS_REGION });

const PDF_RATE_LIMIT = {
  windowSeconds: 60,
  maxRequests: 5,
};

let browserPromise: Promise<Browser> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  }
  return browserPromise;
}

async function enforceRateLimit(key: string) {
  const counter = (await CacheService.get<number>(key)) ?? 0;
  if (counter >= PDF_RATE_LIMIT.maxRequests) {
    return false;
  }
  await CacheService.set(key, counter + 1, PDF_RATE_LIMIT.windowSeconds);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const rateKey = CacheService.getCacheKey('pdf', session.user.id);
    const allowed = await enforceRateLimit(rateKey);

    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests, try again later.' }, { status: 429 });
    }

    const { html, fileName } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'html is required' }, { status: 400 });
    }

    const browser = await getBrowser();
    const page = await browser.newPage();

    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), 30_000);

    try {
      await page.setContent(html, { waitUntil: 'networkidle0', signal: timeoutController.signal });
      const pdfBuffer = await page.pdf({ format: 'A4' });

      const key = fileName || `${Date.now()}.pdf`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.PDF_BUCKET,
          Key: key,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
        })
      );

      return NextResponse.json({ key }, { status: 200 });
    } finally {
      clearTimeout(timeout);
      await page.close();
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
