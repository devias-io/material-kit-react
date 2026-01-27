// /app/api/admin/email-broadcast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { enviarEmailComunicado } from '@/lib/auth/email';

export const maxDuration = 10; // ← MUDANÇA 1: Reduzir para 10s

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

    // ← MUDANÇA 2: Responder IMEDIATAMENTE (antes de processar)
    const response = NextResponse.json({
      message: `Email broadcast iniciado para ${validRecipients.length} destinatário(s)`,
      total: validRecipients.length,
      status: 'processing'
    }, { status: 202 }); // 202 = Aceito, processando

    // ← MUDANÇA 3: Processar em background (sem await!)
    processarEmBackground(validRecipients, subject, message, isHtml);

    return response; // Responde instantaneamente

  } catch (error) {
    console.error('Error sending broadcast email:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

// ← ADICIONAR esta função no final do arquivo
function processarEmBackground(
  recipients: any[],
  subject: string,
  message: string,
  isHtml: boolean
) {
  // Executar sem await - não bloqueia a resposta
  (async () => {
    const BATCH_SIZE = 50;
    const allSent: string[] = [];
    const allFailed: string[] = [];

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      
      try {
        const emailResult = await enviarEmailComunicado({
          recipients: batch,
          subject: subject.trim(),
          body: message,
          isHtml: Boolean(isHtml)
        });
        
        allSent.push(...emailResult.sent);
        allFailed.push(...emailResult.failed);
        
        console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} enviado: ${emailResult.sent.length} OK, ${emailResult.failed.length} falhas`);
      } catch (error) {
        console.error(`❌ Erro no batch ${i / BATCH_SIZE + 1}:`, error);
        allFailed.push(...batch.map(r => r.email));
      }
    }

    console.log(`🎉 Broadcast finalizado! ${allSent.length} enviados, ${allFailed.length} falhas`);
  })().catch(error => {
    console.error('❌ Erro no processamento em background:', error);
  });
}
