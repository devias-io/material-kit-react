// src/app/api/questions/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Estatísticas para dashboard admin
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.plan !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Estatísticas gerais
    const totalQuestions = await prisma.question.count();
    const totalAnswers = await prisma.answer.count();
    
    // Por status
    const questionsByStatus = await prisma.question.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    // Por prioridade
    const questionsByPriority = await prisma.question.groupBy({
      by: ['priority'],
      _count: {
        priority: true
      }
    });

    // Perguntas não lidas por admin
    const unreadQuestions = await prisma.question.count({
      where: {
        readByAdmin: false
      }
    });

    // Perguntas pendentes (não respondidas)
    const pendingQuestions = await prisma.question.count({
      where: {
        status: 'NOVA'
      }
    });

    // Tempo médio de resposta (em horas)
    const questionsWithAnswers = await prisma.question.findMany({
      where: {
        answers: {
          some: {}
        }
      },
      include: {
        answers: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 1
        }
      }
    });

    let averageResponseTime = 0;
    if (questionsWithAnswers.length > 0) {
      const responseTimes = questionsWithAnswers.map(q => {
        const questionTime = new Date(q.createdAt).getTime();
        const firstAnswerTime = new Date(q.answers[0].createdAt).getTime();
        return (firstAnswerTime - questionTime) / (1000 * 60 * 60); // em horas
      });
      
      averageResponseTime = responseTimes.reduce((acc, time) => acc + time, 0) / responseTimes.length;
    }

    // Últimas 30 dias - atividade
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentQuestions = await prisma.question.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    const recentAnswers = await prisma.answer.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Top 5 usuários com mais perguntas
    const topUsers = await prisma.question.groupBy({
      by: ['userId'],
      _count: {
        userId: true
      },
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 5
    });

    // Buscar detalhes dos top users
    const topUsersDetails = await Promise.all(
      topUsers.map(async (userStat) => {
        const userDetails = await prisma.user.findUnique({
          where: { id: userStat.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            plan: true
          }
        });
        return {
          user: userDetails,
          questionCount: userStat._count.userId
        };
      })
    );

    // Perguntas por dia nos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // CORREÇÃO: usar "createdAt" não "created_at"
    const dailyQuestions = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM questions 
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    ` as Array<{ date: Date; count: bigint }>;

    // Formatar dados de resposta
    const stats = {
      overview: {
        totalQuestions,
        totalAnswers,
        unreadQuestions,
        pendingQuestions,
        averageResponseTimeHours: Math.round(averageResponseTime * 100) / 100
      },
      breakdown: {
        byStatus: questionsByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        byPriority: questionsByPriority.map(item => ({
          priority: item.priority,
          count: item._count.priority
        }))
      },
      activity: {
        last30Days: {
          questions: recentQuestions,
          answers: recentAnswers
        },
        dailyQuestions: dailyQuestions.map(item => ({
          date: item.date,
          count: Number(item.count)
        }))
      },
      topUsers: topUsersDetails
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching question stats:', error);
    
    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}