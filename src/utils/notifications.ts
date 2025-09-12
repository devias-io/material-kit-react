// src/utils/notifications.ts - Funções utilitárias para disparar notificações

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  actionUrl?: string;
  metadata?: any;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        category: params.category,
        actionUrl: params.actionUrl,
        metadata: params.metadata || {}
      }
    });
    
    console.log(`📢 Notificação criada para usuário ${params.userId}: ${params.title}`);
    return notification;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
}

// Trigger: Quando uma pergunta é respondida
export async function notifyQuestionAnswered(questionId: string, adminName: string) {
  try {
    // Buscar a pergunta e o usuário
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!question) {
      console.error('Pergunta não encontrada:', questionId);
      return;
    }

    // Criar notificação para o usuário que fez a pergunta
    await createNotification({
      userId: question.userId,
      title: 'Sua pergunta foi respondida!',
      message: `${adminName} respondeu sua pergunta: "${question.title}"`,
      type: 'success',
      category: 'question_answered',
actionUrl: `/dashboard/recursos-exclusivos/central-duvidas#${questionId}`,
      metadata: {
        questionId: questionId,
        questionTitle: question.title,
        adminName: adminName
      }
    });

    console.log(`✅ Notificação enviada para ${question.user.firstName} sobre pergunta respondida`);
  } catch (error) {
    console.error('Erro ao notificar pergunta respondida:', error);
  }
}

// Trigger: Quando um novo relatório é criado
export async function notifyNewReport(
  reportData: any,
  createdByAdminName: string,
  allowedPlans: string[]
) {
  try {
    // Buscar todos os usuários ativos para notificar
    const activeUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        plan: {
          in: allowedPlans
        }
      },
      select: {
        id: true,
        firstName: true,
        plan: true
      }
    });

    // Criar notificações para todos os usuários ativos
    const notifications = activeUsers.map(user => 
      createNotification({
        userId: user.id,
        title: 'Novo Relatório Semanal disponível!',
        message: `Um novo relatório semanal foi publicado: "${reportData.titulo || 'Relatório da semana'}"`,
        type: 'info',
        category: 'new_report',
        actionUrl: '/dashboard/relatorio-semanal',
        metadata: {
          reportId: reportData.id,
          reportTitle: reportData.titulo,
          reportWeek: reportData.semana,
          createdBy: createdByAdminName
        }
      })
    );

    await Promise.all(notifications);
    
    console.log(`📊 Notificação de novo relatório enviada para ${activeUsers.length} usuários`);
  } catch (error) {
    console.error('Erro ao notificar novo relatório:', error);
  }
}

// Trigger: Quando um usuário é mencionado em resposta
export async function notifyUserMentioned(userId: string, mentionedByName: string, context: string, actionUrl: string) {
  try {
    await createNotification({
      userId: userId,
      title: 'Você foi mencionado!',
      message: `${mentionedByName} te mencionou em: ${context}`,
      type: 'info',
      category: 'user_mentioned',
      actionUrl: actionUrl,
      metadata: {
        mentionedBy: mentionedByName,
        context: context
      }
    });

    console.log(`🔔 Notificação de menção enviada para usuário ${userId}`);
  } catch (error) {
    console.error('Erro ao notificar menção:', error);
  }
}