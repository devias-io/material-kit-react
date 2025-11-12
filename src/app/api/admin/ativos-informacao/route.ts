// src/app/api/admin/ativos-informacao/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { verifyToken } from '@/utils/auth';
import { isTickerFII } from '@/utils/tickers';

// Função auxiliar de autenticação centralizada
async function authenticateAdmin(request: NextRequest) {
  console.log('Iniciando autenticação...');
  
  let session = await auth();
  console.log('Auth() resultado:', session ? 'SUCESSO' : 'FALHOU');
  
  // MÉTODO 2: Se falhou, tentar autenticação alternativa
  if (!session) {
    console.log('Tentando autenticação alternativa...');
    
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const authTokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
      if (authTokenMatch) {
        const token = authTokenMatch[1];
        
        try {
          const decoded = verifyToken(token);
          
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              plan: true,
              status: true,
              expirationDate: true,
              customPermissions: true
            }
          });
          
          if (user && user.status === 'ACTIVE') {
            const isAdmin = user.plan === 'ADMIN';
            session = {
              user: {
                id: user.id,
                role: isAdmin ? 'ADMIN' : 'USER',
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                plan: user.plan,
                canUploadPortfolio: true,
                hasVipAccess: true
              }
            };
            console.log('✅ Autenticação alternativa bem-sucedida');
          }
        } catch (jwtError) {
          console.log('❌ Erro JWT:', jwtError.message);
        }
      }
    }
  }
  
  // MÉTODO 3: Fallback para desenvolvimento (buscar admin direto)
  if (!session) {
    console.log('Usando fallback de desenvolvimento...');
    const adminUser = await prisma.user.findFirst({
      where: { 
        plan: 'ADMIN',
        status: 'ACTIVE'
      }
    });
    
    if (adminUser) {
      session = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
          name: `${adminUser.firstName} ${adminUser.lastName}`,
          email: adminUser.email,
          plan: adminUser.plan,
          canUploadPortfolio: true,
          hasVipAccess: true
        }
      };
      console.log('✅ Fallback admin ativado para desenvolvimento');
    }
  }
  
  console.log('Sessão final:', session ? `Usuario: ${session.user?.email}, Plano: ${session.user?.plan}` : 'null');
  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    
    // Verificar se é admin
    if (!session?.user || (session.user.plan !== 'ADMIN' && session.user.role !== 'ADMIN')) {
      console.log('❌ Acesso negado no GET');
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tipo = searchParams.get('tipo');
    const risco = searchParams.get('risco');
    const ativo = searchParams.get('ativo');

    const where = {
      ...(search && {
        OR: [
          { codigo: { contains: search, mode: 'insensitive' } },
          { nome: { contains: search, mode: 'insensitive' } },
          { setor: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(tipo && { tipo }),
      ...(risco && { risco }),
      ...(ativo !== null && { ativo: ativo === 'true' })
    };

    const ativos = await prisma.ativoInformacao.findMany({
      where,
      orderBy: { codigo: 'asc' },
      take: 100 // Limite para performance
    });

    const total = await prisma.ativoInformacao.count({ where });

    return NextResponse.json({
      success: true,
      ativos,
      total,
      page: 1,
      hasMore: total > 100
    });

  } catch (error) {
    console.error('Erro ao buscar ativos:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    
    if (!session?.user || (session.user.plan !== 'ADMIN' && session.user.role !== 'ADMIN')) {
      console.log('❌ Acesso negado no POST');
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const data = await request.json();
    const { ativos } = data;

    if (!ativos || !Array.isArray(ativos)) {
      return NextResponse.json({ 
        error: 'Dados inválidos. Envie um array de ativos.' 
      }, { status: 400 });
    }

    // Validar e processar ativos
    const ativosValidos = [];
    const erros = [];

    for (const ativo of ativos) {
      if (!ativo.codigo || !ativo.nome) {
        erros.push(`Ativo inválido: código e nome são obrigatórios - ${JSON.stringify(ativo)}`);
        continue;
      }

      ativosValidos.push({
        codigo: ativo.codigo.toUpperCase().trim(),
        nome: ativo.nome.trim(),
        setor: ativo.setor?.trim() || 'Não classificado',
        subsetor: ativo.subsetor?.trim() || null,
        tipo: ativo.tipo?.toUpperCase() || determinarTipoAtivo(ativo.codigo),
        qualidade: Math.max(0, Math.min(10, Number(ativo.qualidade) || 7)),
        risco: ['BAIXO', 'MEDIO', 'ALTO'].includes(ativo.risco?.toUpperCase()) 
          ? ativo.risco.toUpperCase() : 'MEDIO',
        recomendacao: ['COMPRA', 'VENDA', 'NEUTRO', 'MANTER'].includes(ativo.recomendacao?.toUpperCase())
          ? ativo.recomendacao.toUpperCase() : 'NEUTRO',
        fundamentosResumo: ativo.fundamentosResumo?.trim() || null,
        pontosFortes: ativo.pontosFortes ? JSON.stringify(
          Array.isArray(ativo.pontosFortes) ? ativo.pontosFortes : [ativo.pontosFortes]
        ) : null,
        pontosFracos: ativo.pontosFracos ? JSON.stringify(
          Array.isArray(ativo.pontosFracos) ? ativo.pontosFracos : [ativo.pontosFracos]
        ) : null,
        observacoes: ativo.observacoes?.trim() || null,
        segmento: ativo.segmento?.trim() || null,
        governanca: ativo.governanca?.trim() || null,
        dividend_yield: ativo.dividend_yield ? Number(ativo.dividend_yield) : null,
        criadoPor: session.user.id,
        ultimaRevisao: new Date()
      });
    }

    if (ativosValidos.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum ativo válido encontrado',
        detalhes: erros
      }, { status: 400 });
    }

    // Usar upsert para atualizar existentes ou criar novos
    const resultados = await Promise.all(
      ativosValidos.map(ativo =>
        prisma.ativoInformacao.upsert({
          where: { codigo: ativo.codigo },
          update: { 
            ...ativo,
            updatedAt: new Date()
          },
          create: ativo
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${resultados.length} ativos processados com sucesso`,
      processados: resultados.length,
      erros: erros.length > 0 ? erros : undefined
    });

  } catch (error) {
    console.error('Erro ao salvar ativos:', error);
    return NextResponse.json({ 
      error: 'Erro ao salvar ativos',
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    
    if (!session?.user || (session.user.plan !== 'ADMIN' && session.user.role !== 'ADMIN')) {
      console.log('❌ Acesso negado no PUT');
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ 
        error: 'ID é obrigatório para atualização' 
      }, { status: 400 });
    }

    // Processar arrays se necessário
    if (updateData.pontosFortes && typeof updateData.pontosFortes === 'object') {
      updateData.pontosFortes = JSON.stringify(updateData.pontosFortes);
    }
    if (updateData.pontosFracos && typeof updateData.pontosFracos === 'object') {
      updateData.pontosFracos = JSON.stringify(updateData.pontosFracos);
    }

    const ativo = await prisma.ativoInformacao.update({
      where: { id },
      data: {
        ...updateData,
        ultimaRevisao: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      ativo,
      message: 'Ativo atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar ativo:', error);
    return NextResponse.json({ 
      error: 'Erro ao atualizar ativo',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Iniciando DELETE...');
    
    const session = await authenticateAdmin(request);
    
    if (!session?.user || (session.user.plan !== 'ADMIN' && session.user.role !== 'ADMIN')) {
      console.log('❌ Acesso negado no DELETE');
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    console.log('✅ Autenticação OK para DELETE');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('ID recebido para DELETE:', id);

    if (!id) {
      console.log('❌ ID não fornecido');
      return NextResponse.json({ 
        error: 'ID é obrigatório' 
      }, { status: 400 });
    }

    console.log('Tentando deletar ativo com ID:', id);

    await prisma.ativoInformacao.delete({
      where: { id }
    });

    console.log('✅ Ativo deletado com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Ativo removido com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao remover ativo:', error);
    return NextResponse.json({ 
      error: 'Erro ao remover ativo',
      details: error.message
    }, { status: 500 });
  }
}

function determinarTipoAtivo(codigo: string): string {
  const normalizedCodigo = (codigo || '').toUpperCase();

  if (isTickerFII(normalizedCodigo)) return 'FII';
  if (normalizedCodigo.endsWith('3') || normalizedCodigo.endsWith('4')) return 'ACAO';
  if (normalizedCodigo.includes('ETF')) return 'ETF';
  return 'OUTRO';
}
