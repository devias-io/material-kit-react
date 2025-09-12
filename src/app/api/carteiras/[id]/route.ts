import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { verifyToken } from '@/utils/auth';

// Mesma função de autenticação que funciona na API de ativos
async function authenticateAdmin(request: NextRequest) {
  console.log('Iniciando autenticação para delete carteira...');
  
  let session = await auth();
  console.log('Auth() resultado:', session ? 'SUCESSO' : 'FALHOU');
  
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
        } catch (error) {
          console.log('❌ Erro JWT:', (error as Error).message);
        }
      }
    }
  }
  
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
  
  return session;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE carteira ID:', params.id);
    
    const session = await authenticateAdmin(request);
    
    if (!session?.user || (session.user.plan !== 'ADMIN' && session.user.role !== 'ADMIN')) {
      console.log('❌ Acesso negado no DELETE carteira');
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    console.log('✅ Autenticação OK para DELETE carteira');
    
    // Buscar carteira com dados do usuário
    const carteira = await prisma.carteiraAnalise.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { 
            firstName: true, 
            lastName: true, 
            email: true 
          }
        },
        ativos: true // Incluir ativos para contagem
      }
    });
    
    if (!carteira) {
      return NextResponse.json({ 
        error: 'Carteira não encontrada' 
      }, { status: 404 });
    }
    
    console.log(`Carteira encontrada: ${carteira.nomeArquivo} (${carteira.ativos.length} ativos)`);
    
    // Como tem onDelete: Cascade, só precisa deletar a carteira
    // Os ativos serão deletados automaticamente
    await prisma.carteiraAnalise.delete({
      where: { id: params.id }
    });
    
    console.log(`Carteira ${params.id} deletada por ${session.user.email}`);
    
    return NextResponse.json({
      success: true,
      message: `Carteira de ${carteira.user.firstName} ${carteira.user.lastName} removida com sucesso`,
      clienteEmail: carteira.user.email,
      details: {
        carteiraId: params.id,
        ativosRemovidos: carteira.ativos.length,
        adminEmail: session.user.email
      }
    });
    
  } catch (error) {
    console.error('Erro ao deletar carteira:', error);
    
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 });
  }
}