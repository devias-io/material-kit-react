export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Verificar autenticação admin
async function verifyAuth(request: NextRequest) {
  const userEmail = request.headers.get('x-user-email');
  return userEmail === 'admin@fatosdobolsa.com';
}

// GET - Dados do dashboard de renovações
export async function GET(request: NextRequest) {
  try {
    if (!(await verifyAuth(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 401 });
    }

    await prisma.$connect();

    // Calcular datas importantes
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // 1. Estatísticas gerais de usuários
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        status: 'ACTIVE',
        OR: [
          { expirationDate: null }, // Vitalícios
          { expirationDate: { gte: now } } // Não expirados
        ]
      }
    });
    const inactiveUsers = totalUsers - activeUsers;

    // 2. Usuários expirando
    const expiringIn7Days = await prisma.user.count({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          gte: now,
          lte: in7Days
        }
      }
    });

    const expiringIn15Days = await prisma.user.count({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          gte: now,
          lte: in15Days
        }
      }
    });

    const expiringIn30Days = await prisma.user.count({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          gte: now,
          lte: in30Days
        }
      }
    });

    // 3. Renovações (purchase com mesmo email)
    const renewalsThisMonth = await prisma.purchase.count({
      where: {
        createdAt: { gte: startOfMonth },
        user: {
          purchases: {
            some: {
              createdAt: { lt: startOfMonth }
            }
          }
        }
      }
    });

    const renewalsLastMonth = await prisma.purchase.count({
      where: {
        createdAt: { 
          gte: lastMonth,
          lte: endOfLastMonth
        },
        user: {
          purchases: {
            some: {
              createdAt: { lt: lastMonth }
            }
          }
        }
      }
    });

    // 4. Cálculo de churn e retenção
    const totalRenewalsExpected = await prisma.user.count({
      where: {
        expirationDate: {
          gte: lastMonth,
          lte: endOfLastMonth
        }
      }
    });

    const churnRate = totalRenewalsExpected > 0 ? 
      ((totalRenewalsExpected - renewalsLastMonth) / totalRenewalsExpected) * 100 : 0;
    const retentionRate = 100 - churnRate;

    // 5. Usuários expirando com detalhes
    const usersExpiring = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          gte: now,
          lte: in30Days
        }
      },
      include: {
        purchases: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { expirationDate: 'asc' }
    });

    // Formatar usuários expirando
    const formattedUsersExpiring = usersExpiring.map(user => {
      const daysUntilExpiry = user.expirationDate ? 
        Math.ceil((new Date(user.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        plan: user.plan,
        expirationDate: user.expirationDate?.toISOString(),
        daysUntilExpiry,
        lastRenewal: user.purchases[0]?.createdAt?.toISOString(),
        totalPurchases: user.purchases.reduce((sum, p) => sum + p.amount, 0),
        status: user.status,
        emailSent: false // Implementar lógica de controle de email
      };
    });

    // 6. Dados mensais para gráficos (últimos 7 meses)
    const monthlyData = [];
    for (let i = 6; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthRenewals = await prisma.purchase.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          user: {
            purchases: {
              some: {
                createdAt: { lt: monthStart }
              }
            }
          }
        }
      });

      const monthNewUsers = await prisma.user.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      });

      const monthCancellations = await prisma.user.count({
        where: {
          updatedAt: { gte: monthStart, lte: monthEnd },
          status: 'INACTIVE'
        }
      });

      const monthRevenue = await prisma.purchase.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd }
        },
        _sum: { amount: true }
      });

      monthlyData.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        renovacoes: monthRenewals,
        novosUsuarios: monthNewUsers,
        cancelamentos: monthCancellations,
        receita: monthRevenue._sum.amount || 0
      });
    }

    await prisma.$disconnect();

    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      expiringIn7Days,
      expiringIn15Days,
      expiringIn30Days,
      renewalsThisMonth,
      renewalsLastMonth,
      churnRate: Math.round(churnRate * 10) / 10,
      retentionRate: Math.round(retentionRate * 10) / 10
    };

    console.log('✅ Dados de renovação carregados:', {
      stats,
      usersExpiringCount: formattedUsersExpiring.length,
      monthlyDataPoints: monthlyData.length
    });

    return NextResponse.json({
      success: true,
      stats,
      usersExpiring: formattedUsersExpiring,
      monthlyData,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro ao carregar dados de renovação:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Enviar emails de lembrete
export async function POST(request: NextRequest) {
  try {
    if (!(await verifyAuth(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 401 });
    }

    const { action, userId, userIds, emailType, subject, message } = await request.json();

    if (action === 'sendReminderEmail') {
      // Enviar email individual
      if (!userId) {
        return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
      }

      await prisma.$connect();
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }

      // Aqui você implementaria o envio real do email
      // Exemplo com serviço de email (Resend, SendGrid, etc.)
      console.log(`📧 Enviando email de lembrete para: ${user.email}`);
      
      // Simular envio de email
      const emailSent = true; // Substituir por lógica real de envio

      await prisma.$disconnect();

      return NextResponse.json({
        success: true,
        message: 'Email de lembrete enviado com sucesso',
        emailSent,
        recipient: user.email
      });
    }

    if (action === 'sendBulkEmails') {
      // Enviar emails em lote
      if (!userIds || !Array.isArray(userIds)) {
        return NextResponse.json({ error: 'userIds é obrigatório' }, { status: 400 });
      }

      await prisma.$connect();
      
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } }
      });

      console.log(`📧 Enviando emails em lote para ${users.length} usuários`);
      
      // Simular envio em lote
      const emailResults = users.map(user => ({
        userId: user.id,
        email: user.email,
        sent: true // Substituir por lógica real
      }));

      await prisma.$disconnect();

      return NextResponse.json({
        success: true,
        message: `${emailResults.length} emails enviados com sucesso`,
        results: emailResults
      });
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Erro ao processar emails:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}