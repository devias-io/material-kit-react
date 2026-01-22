import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { enviarEmailComunicado } from '@/lib/auth/email';

export const maxDuration = 60; // Aumentado

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (session.user.plan !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      targetPlans,
      targetPlan,
      subject,
      message,
      isHtml = false
    } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'subject and message are required' }, { status: 400 });
    }

    const plansInput: string[] = [];
    if (Array.isArray(targetPlans)) {
      plansInput.push(
        ...targetPlans
          .filter((plan: unknown): plan is string => typeof plan === 'string')
          .map(plan => plan.trim())
          .filter(Boolean)
      );
    }
    if (typeof targetPlan === 'string' && targetPlan.trim()) {
      plansInput.push(targetPlan.trim());
    }

    const uniquePlans = Array.from(new Set(plansInput));
    if (uniquePlans.length === 0) {
      return NextResponse.json({ error: 'targetPlans is required' }, { status: 400 });
    }

    const recipients = await prisma.user.findMany({
      where: {
        plan: {
          in: uniquePlans
        }
      },
      select: {
        email: true,
        firstName: true,
        lastName: true
      }
    });

    const validRecipients = recipients
      .filter(recipient => recipient.email && recipient.email.includes('@'))
      .map(recipient => ({
        email: recipient.email!.toLowerCase(),
        name: [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
      }));

    if (validRecipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found for the provided criteria' }, { status: 404 });
    }

    // Enviar em lotes de 50 para evitar timeout
    const BATCH_SIZE = 50;
    const allSent: string[] = [];
    const allFailed: string[] = [];

    for (let i = 0; i < validRecipients.length; i += BATCH_SIZE) {
      const batch = validRecipients.slice(i, i + BATCH_SIZE);
      
      try {
        const emailResult = await enviarEmailComunicado({
          recipients: batch,
          subject: subject.trim(),
          body: message,
          isHtml: Boolean(isHtml)
        });
        
        allSent.push(...emailResult.sent);
        allFailed.push(...emailResult.failed);
      } catch (error) {
        console.error(`Error sending batch ${i / BATCH_SIZE + 1}:`, error);
        allFailed.push(...batch.map(r => r.email));
      }
    }

    return NextResponse.json({
      message: `Email broadcast sent to ${allSent.length} recipient(s)`,
      recipients: allSent,
      failed: allFailed,
      total: validRecipients.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error sending broadcast email:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
