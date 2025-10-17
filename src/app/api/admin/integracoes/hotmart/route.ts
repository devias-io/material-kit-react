export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { HOTMART_INTEGRATIONS } from '@/data/integrations';

const prisma = new PrismaClient();

// Verificar autenticação admin
async function verifyAuth(request: NextRequest) {
  const userEmail = request.headers.get('x-user-email');
  return userEmail === 'admin@fatosdobolsa.com';
}

// GET - Listar todas as integrações
export async function GET(request: NextRequest) {
  try {
    if (!(await verifyAuth(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 401 });
    }

    await prisma.$connect();

    const origin = new URL(request.url).origin;

    const integrations = HOTMART_INTEGRATIONS.map(integration => ({
      ...integration,
      webhookUrl: `${origin}/api/webhooks/hotmart/${integration.id}`,
    }));

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      integrations,
      total: integrations.length
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar integrações:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova integração
export async function POST(request: NextRequest) {
  try {
    if (!(await verifyAuth(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 401 });
    }

    const { productName, productId, plan } = await request.json();

    if (!productName || !productId || !plan) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: productName, productId, plan' },
        { status: 400 }
      );
    }

    await prisma.$connect();

    // Gerar ID único para a integração
    const integrationId = Math.random().toString().slice(2, 8);
    const webhookUrl = `${new URL(request.url).origin}/api/webhooks/hotmart/${integrationId}`;

    // Por enquanto, apenas retornar a integração criada
    // Mais tarde implementaremos salvamento no banco
    const newIntegration = {
      id: integrationId,
      productName,
      productId,
      plan,
      webhookUrl,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      totalSales: 0
    };

    await prisma.$disconnect();

    console.log('✅ Nova integração criada:', newIntegration);

    return NextResponse.json({
      success: true,
      integration: newIntegration,
      message: 'Integração criada com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar integração:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar integração existente
export async function PUT(request: NextRequest) {
  try {
    if (!(await verifyAuth(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 401 });
    }

    const { id, productName, productId, plan, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID da integração é obrigatório' },
        { status: 400 }
      );
    }

    // Por enquanto, apenas retornar sucesso
    // Mais tarde implementaremos atualização no banco
    const updatedIntegration = {
      id,
      productName,
      productId,
      plan,
      status,
      updatedAt: new Date().toISOString()
    };

    console.log('✅ Integração atualizada:', updatedIntegration);

    return NextResponse.json({
      success: true,
      integration: updatedIntegration,
      message: 'Integração atualizada com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro ao atualizar integração:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir integração
export async function DELETE(request: NextRequest) {
  try {
    if (!(await verifyAuth(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da integração é obrigatório' },
        { status: 400 }
      );
    }

    // Por enquanto, apenas retornar sucesso
    // Mais tarde implementaremos exclusão no banco
    console.log('✅ Integração excluída:', id);

    return NextResponse.json({
      success: true,
      message: 'Integração excluída com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro ao excluir integração:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}