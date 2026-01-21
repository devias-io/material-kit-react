export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/migracao-plano/processar
 * Processa a migração do cliente de LITE para VIP
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    const sessionUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, customPermissions: true }
    });

    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const permissions = JSON.parse(sessionUser.customPermissions || '[]');
    if (!permissions.includes('admin')) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    // Extrair dados do body
    const body = await request.json();
    const { userId, valorFinal, mesesRestantes, valorDesconto, observacoes } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar cliente
    const cliente = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se está no plano LITE
    if (cliente.plan !== 'LITE' && cliente.plan !== 'LITE_V2') {
      return NextResponse.json(
        { error: `Cliente está no plano ${cliente.plan}. Apenas clientes do plano LITE podem migrar.` },
        { status: 400 }
      );
    }

    // Verificar se o plano está ativo
    if (cliente.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Plano do cliente não está ativo' },
        { status: 400 }
      );
    }

    const VALOR_LITE = 511.86;
    const VALOR_VIP = 1297.00;

    // Iniciar transação
    const result = await prisma.$transaction(async (tx) => {
      // Registrar migração
      const migracao = await tx.planMigration.create({
        data: {
          userId: cliente.id,
          planOriginal: cliente.plan,
          planNovo: 'VIP',
          valorOriginal: VALOR_LITE,
          valorNovo: VALOR_VIP,
          mesesRestantes: mesesRestantes || 0,
          valorDesconto: valorDesconto || 0,
          valorFinal: valorFinal || VALOR_VIP,
          status: 'COMPLETED',
          observacoes: observacoes || null,
          processadoPor: sessionUser.id,
          dataProcessamento: new Date()
        }
      });

      // Atualizar plano do cliente para VIP
      // Nova data de expiração: 1 ano a partir de agora
      const novaDataExpiracao = new Date();
      novaDataExpiracao.setFullYear(novaDataExpiracao.getFullYear() + 1);

      const clienteAtualizado = await tx.user.update({
        where: { id: cliente.id },
        data: {
          plan: 'VIP',
          expirationDate: novaDataExpiracao
        }
      });

      return { migracao, clienteAtualizado };
    });

    return NextResponse.json({
      success: true,
      message: 'Migração processada com sucesso',
      migracao: {
        id: result.migracao.id,
        planOriginal: result.migracao.planOriginal,
        planNovo: result.migracao.planNovo,
        valorFinal: result.migracao.valorFinal,
        valorFinalFormatado: `R$ ${result.migracao.valorFinal.toFixed(2)}`,
        dataProcessamento: result.migracao.dataProcessamento
      },
      cliente: {
        id: result.clienteAtualizado.id,
        email: result.clienteAtualizado.email,
        planoNovo: result.clienteAtualizado.plan,
        novaDataExpiracao: result.clienteAtualizado.expirationDate
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar migração:', error);
    return NextResponse.json(
      {
        error: 'Erro interno ao processar migração',
        message: error.message
      },
      { status: 500 }
    );
  }
}
