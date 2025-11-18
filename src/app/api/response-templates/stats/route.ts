// src/app/api/response-templates/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    let user;
    try {
      const payload = verifyToken(token);
      user = await prisma.user.findUnique({ where: { email: payload.email } });
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 401 });
    }

    if (!user || (user.plan !== 'ADMIN' && user.plan !== 'ANALISTA')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Buscar todos os templates com título incluído
    const allTemplates = await prisma.responseTemplate.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        isActive: true,
        usageCount: true,
        createdAt: true
      }
    });

    // Calcular estatísticas básicas
    const totalTemplates = allTemplates.length;
    const activeTemplates = allTemplates.filter(t => t.isActive).length;
    const totalUsage = allTemplates.reduce((sum, t) => sum + t.usageCount, 0);

    // Estatísticas por categoria
    const categoryStats = new Map();
    
    allTemplates.forEach(template => {
      const category = template.category;
      if (!categoryStats.has(category)) {
        categoryStats.set(category, {
          category,
          count: 0,
          usage: 0,
          activeCount: 0
        });
      }
      
      const stats = categoryStats.get(category);
      stats.count += 1;
      stats.usage += template.usageCount;
      if (template.isActive) {
        stats.activeCount += 1;
      }
    });

    const byCategory = Array.from(categoryStats.values()).sort((a, b) => b.usage - a.usage);

    // Categoria mais usada
    const mostUsedCategory = byCategory.length > 0 ? byCategory[0].category : null;

    // Calcular média de uso
    const averageUsage = totalTemplates > 0 ? Math.round(totalUsage / totalTemplates * 10) / 10 : 0;

    // Templates criados nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTemplates = allTemplates.filter(t => 
      new Date(t.createdAt) >= thirtyDaysAgo
    ).length;

    // Estatísticas de uso (templates mais usados)
    const topUsedTemplates = allTemplates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.title,
        usageCount: t.usageCount,
        category: t.category
      }));

    // Estatísticas mensais (últimos 6 meses)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const templatesCreated = allTemplates.filter(t => {
        const createdDate = new Date(t.createdAt);
        return createdDate >= startOfMonth && createdDate <= endOfMonth;
      }).length;

      monthlyStats.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        templatesCreated,
        monthName: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      });
    }

    // Estatísticas de eficiência (templates com mais uso relativo à idade)
    const templatesWithEfficiency = allTemplates.map(template => {
      const ageInDays = Math.max(1, Math.floor((Date.now() - new Date(template.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
      const efficiency = template.usageCount / ageInDays;
      return {
        id: template.id,
        title: template.title,
        usageCount: template.usageCount,
        ageInDays,
        efficiency: Math.round(efficiency * 100) / 100
      };
    }).sort((a, b) => b.efficiency - a.efficiency).slice(0, 5);

    // Templates inativos que nunca foram usados
    const unusedInactiveTemplates = allTemplates.filter(t => 
      !t.isActive && t.usageCount === 0
    ).length;

    // Resposta final
    const stats = {
      overview: {
        totalTemplates,
        activeTemplates,
        inactiveTemplates: totalTemplates - activeTemplates,
        totalUsage,
        averageUsage,
        recentTemplates,
        unusedInactiveTemplates
      },
      breakdown: {
        byCategory,
        byUsage: topUsedTemplates,
        monthlyCreation: monthlyStats,
        efficiency: templatesWithEfficiency
      },
      insights: {
        mostUsedCategory: mostUsedCategory || 'N/A',
        leastActiveCategory: byCategory.length > 0 ? 
          byCategory[byCategory.length - 1].category : 'N/A',
        averageUsagePerTemplate: averageUsage,
        totalActiveTemplates: activeTemplates,
        inactiveTemplatesRatio: totalTemplates > 0 ? 
          Math.round(((totalTemplates - activeTemplates) / totalTemplates) * 100) : 0,
        templatesNeedingAttention: unusedInactiveTemplates
      }
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching template stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}