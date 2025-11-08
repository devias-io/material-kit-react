export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { enviarEmailCredenciais } from '@/lib/auth/email';
import { hashPassword, gerarSenhaSegura } from '@/lib/auth/password'; // ✅ ADICIONADO
import { auth } from '@/lib/auth';
import { isLifetimePlan } from '@/lib/lifetime-plans';

const prisma = new PrismaClient({
  datasourceUrl: process.env.NODE_ENV === 'production' 
    ? process.env.DATABASE_URL 
    : 'file:./dev.db'
});

// Função de autenticação
async function verifyAuth() {
  try {
    const session = await auth();
    if (session?.user?.plan === 'ADMIN') {
      return session.user;
    }
    return null;
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 GET /api/admin/users - COM INTEGRAÇÃO HOTMART');
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };
    
    // Verificar autenticação
    const admin = await verifyAuth();
    if (!admin) {
      return NextResponse.json(
        { 
          error: 'Acesso negado. Você precisa ser administrador.',
          code: 'UNAUTHORIZED'
        }, 
        { status: 401, headers }
      );
    }
    
    console.log('✅ Admin autorizado, conectando ao banco...');
    
    // Testar conexão básica
    try {
      await prisma.$connect();
      console.log('✅ Conectado ao banco');
      
    } catch (connectionError: any) {
      console.error('❌ Erro de conexão:', connectionError);
      return NextResponse.json(
        { 
          error: 'Erro de conexão com o banco',
          code: 'DATABASE_CONNECTION_ERROR',
          details: connectionError.message
        }, 
        { status: 503, headers }
      );
    }
    
    console.log('🔄 Buscando usuários com dados do Hotmart...');
    
    // Estratégia: tentar diferentes abordagens até uma funcionar
    let users;
    const hotmartDataMap = new Map();
    const purchasesMap = new Map();
    
    try {
      // 1. Primeiro, buscar usuários básicos
      console.log('📊 Buscando usuários...');
      users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
      console.log(`✅ Encontrados ${users.length} usuários`);
      
      // 2. Tentar buscar dados do Hotmart separadamente
      console.log('🔄 Buscando dados do Hotmart...');
      try {
        const hotmartData = await prisma.hotmartData.findMany();
        console.log(`✅ Encontrados ${hotmartData.length} registros Hotmart`);
        
        // Criar mapa para associar dados do Hotmart aos usuários
        hotmartData.forEach(data => {
          hotmartDataMap.set(data.userId, data);
        });
        
      } catch (hotmartError) {
        console.warn('⚠️ Erro ao buscar HotmartData (pode não existir ainda):', hotmartError.message);
      }
      
      // 3. Tentar buscar purchases separadamente
      console.log('🔄 Buscando purchases...');
      try {
        const purchases = await prisma.purchase.findMany();
        console.log(`✅ Encontradas ${purchases.length} purchases`);
        
        // Agrupar purchases por usuário
        purchases.forEach(purchase => {
          if (!purchasesMap.has(purchase.userId)) {
            purchasesMap.set(purchase.userId, []);
          }
          purchasesMap.get(purchase.userId).push(purchase);
        });
        
      } catch (purchaseError) {
        console.warn('⚠️ Erro ao buscar Purchases (pode não existir ainda):', purchaseError.message);
      }
      
    } catch (queryError: any) {
      console.error('❌ Erro na query de usuários:', queryError);
      return NextResponse.json(
        { 
          error: 'Erro ao buscar usuários no banco',
          code: 'QUERY_ERROR',
          details: queryError.message
        }, 
        { status: 500, headers }
      );
    }
    
    // Formatar dados incluindo informações do Hotmart
    console.log('🔄 Formatando dados com integração Hotmart...');
    const formattedUsers = users.map((user, index) => {
      try {
        console.log(`Formatando usuário ${index + 1}:`, user.email);
        
        // Pegar dados do Hotmart para este usuário
        const hotmartInfo = hotmartDataMap.get(user.id);
        
        // Calcular total de compras
        const userPurchases = purchasesMap?.get(user.id) || [];
        const totalPurchases = userPurchases
          .filter(p => p.status === 'COMPLETED')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        return {
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email,
          avatar: user.avatar || null,
          plan: user.plan,
          status: user.status,
          origin: user.origin,
          
          // 🔥 DADOS DO HOTMART (essenciais para liberação de membros)
          hotmartCustomerId: hotmartInfo?.hotmartCustomerId || user.hotmartCustomerId || null,
          
          createdAt: user.createdAt?.toISOString() ?? null,
          lastLogin: user.lastLogin?.toISOString() || null,
          totalPurchases,
          purchaseCount: userPurchases.length,
          
          // 🔥 DATA DE EXPIRAÇÃO (crítica para controle de acesso)
          expirationDate: hotmartInfo?.expirationDate?.toISOString() || null,
          
          // 🔥 STATUS DO HOTMART (importante para validação)
          hotmartStatus: hotmartInfo?.status || null,
          hotmartProductId: hotmartInfo?.productId || null,
          hotmartProductName: hotmartInfo?.productName || null,
          hotmartPurchaseDate: hotmartInfo?.purchaseDate?.toISOString() || null
        };
      } catch (formatError) {
        console.error(`❌ Erro ao formatar usuário ${user.email}:`, formatError);
        // Retornar dados básicos em caso de erro
        return {
          id: user.id,
          firstName: user.firstName || 'N/A',
          lastName: user.lastName || 'N/A',
          email: user.email,
          avatar: null,
          plan: user.plan,
          status: user.status,
          origin: user.origin,
          hotmartCustomerId: user.hotmartCustomerId || null,
          createdAt: user.createdAt?.toISOString() ?? null,
          lastLogin: null,
          totalPurchases: 0,
          purchaseCount: 0,
          expirationDate: null,
          hotmartStatus: null,
          hotmartProductId: null,
          hotmartProductName: null,
          hotmartPurchaseDate: null
        };
      }
    });
    
    // Estatísticas com dados do Hotmart
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'ACTIVE').length,
      expiredUsers: formattedUsers.filter(u => {
        if (!u.expirationDate) return false;
        return new Date(u.expirationDate) < new Date();
      }).length,
      hotmartIntegrated: formattedUsers.filter(u => u.hotmartCustomerId).length
    };
    
    const response = {
      success: true,
      users: formattedUsers,
      total: users.length,
      timestamp: new Date().toISOString(),
      admin: {
        id: admin.id,
        email: admin.email
      },
      source: 'database_with_hotmart',
      stats,
      hotmartIntegration: {
        enabled: true,
        usersWithHotmart: stats.hotmartIntegrated,
        message: 'Integração Hotmart ativa para controle de membros'
      }
    };
    
    console.log(`✅ SUCESSO! Retornando ${formattedUsers.length} usuários com dados Hotmart`);
    console.log(`📊 Stats: ${stats.hotmartIntegrated} usuários com integração Hotmart`);
    
    return NextResponse.json(response, {
      status: 200,
      headers
    });
    
  } catch (error: any) {
    console.error('❌ Erro inesperado geral:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } finally {
    try {
      await prisma.$disconnect();
      console.log('🔌 Desconectado do banco');
    } catch (disconnectError) {
      console.error('❌ Erro ao desconectar:', disconnectError);
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/admin/users - CRIANDO COM HASH SEGURO');
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Verificar autenticação
    const admin = await verifyAuth();
    if (!admin) {
      return NextResponse.json(
        { 
          error: 'Acesso negado para criação de usuários',
          code: 'UNAUTHORIZED'
        }, 
        { status: 403, headers }
      );
    }
    
    // Parse do JSON
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { 
          error: 'Dados JSON inválidos',
          code: 'INVALID_JSON'
        }, 
        { status: 400, headers }
      );
    }
    
    const {
      firstName,
      lastName,
      email,
      plan,
      expirationDate,
      hotmartCustomerId,
      customPermissions: customPermissionsInput
    } = requestData;
    console.log('📝 Criando usuário com senha segura:', { firstName, lastName, email, plan });
    
    // Validações
    if (!firstName || !lastName || !email || !plan) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: firstName, lastName, email, plan',
        code: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400, headers });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Email inválido',
        code: 'INVALID_EMAIL'
      }, { status: 400, headers });
    }
    
    const normalizeCustomPermissions = (value: unknown): string[] => {
      if (!value) {
        return [];
      }

      if (Array.isArray(value)) {
        return value.map(permission => String(permission).trim()).filter(Boolean);
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();

        if (!trimmed) {
          return [];
        }

        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.map(permission => String(permission).trim()).filter(Boolean);
          }
        } catch (error) {
          // trataremos como permissão simples
        }

        return [trimmed];
      }

      return [];
    };

    const normalizedCustomPermissions = Array.from(new Set(normalizeCustomPermissions(customPermissionsInput)));
    const effectiveCustomPermissions = normalizedCustomPermissions;

    // Conectar ao banco
    await prisma.$connect();
    console.log('✅ Conectado ao banco para criação');
    
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        error: 'Usuário já existe com este email',
        code: 'USER_ALREADY_EXISTS'
      }, { status: 400, headers });
    }
    
    // Normalizar data de expiração considerando planos vitalícios
    let normalizedExpirationDate: Date | null = null;
    if (expirationDate) {
      const parsed = new Date(expirationDate);
      if (isNaN(parsed.getTime())) {
        console.warn(`⚠️ Data de expiração inválida recebida (${expirationDate}). Ignorando.`);
      } else {
        normalizedExpirationDate = parsed;
      }
    }

    if (isLifetimePlan(plan)) {
      if (normalizedExpirationDate) {
        console.log(`⚠️ Plano ${plan} é vitalício. Ignorando data personalizada de expiração.`);
      }
      normalizedExpirationDate = null;
    }

    // ✅ GERAR SENHA SEGURA
    const tempPassword = gerarSenhaSegura();
    console.log(`🔑 Senha segura gerada: ${tempPassword}`);
    
    // ✅ HASH DA SENHA
    const hashedPassword = await hashPassword(tempPassword);
    console.log('🔒 Senha hasheada com sucesso');
    
    // Criar usuário no banco
    const novoUsuario = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        password: hashedPassword, // ✅ USANDO HASH SEGURO
        plan: plan as any,
        status: 'ACTIVE',
        origin: 'MANUAL',
        mustChangePassword: true, // ✅ FORÇA MUDANÇA NO PRIMEIRO ACESSO
        hotmartCustomerId: hotmartCustomerId || null,
        expirationDate: normalizedExpirationDate,
        customPermissions: JSON.stringify(effectiveCustomPermissions)
      }
    });

    // Se há dados do Hotmart, criar registro separado
    if (normalizedExpirationDate || hotmartCustomerId) {
      try {
        console.log('🔄 Criando dados do Hotmart...');
        await prisma.hotmartData.create({
          data: {
            userId: novoUsuario.id,
            hotmartCustomerId: hotmartCustomerId || `MANUAL_${Date.now()}`,
            productId: 'MANUAL_CREATION',
            productName: `Plano ${plan}`,
            purchaseDate: new Date(),
            expirationDate: normalizedExpirationDate,
            status: 'ACTIVE'
          }
        });
        console.log('✅ Dados do Hotmart criados');
      } catch (hotmartError) {
        console.warn('⚠️ Erro ao criar dados Hotmart (usuário já foi criado):', hotmartError);
      }
    }
    
    console.log('✅ Usuário criado com senha segura:', novoUsuario.email);
    
    // 📧 ENVIAR EMAIL COM CREDENCIAIS
    let emailSent = false;
    let emailError = null;
    
    try {
      console.log(`📧 Enviando email de credenciais para ${email}...`);
      await enviarEmailCredenciais(email, firstName, tempPassword, plan);
      emailSent = true;
      console.log('✅ Email enviado com sucesso!');
    } catch (error: any) {
      emailError = error.message;
      console.error('❌ Erro ao enviar email:', error);
      // Não falha a criação do usuário por causa do email
    }
    
    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Usuário criado com sucesso! Email com credenciais enviado.' 
        : 'Usuário criado com senha segura, mas houve erro no envio do email.',
      user: {
        id: novoUsuario.id,
        email: novoUsuario.email,
        firstName: novoUsuario.firstName,
        lastName: novoUsuario.lastName,
        plan: novoUsuario.plan,
        status: novoUsuario.status,
        hotmartCustomerId: novoUsuario.hotmartCustomerId,
        origin: novoUsuario.origin,
        customPermissions: effectiveCustomPermissions
      },
      email: {
        sent: emailSent,
        error: emailError
      },
      // ✅ Só retorna a senha se o email falhou (para segurança)
      tempPassword: emailSent ? undefined : tempPassword,
      security: {
        passwordHashed: true,
        passwordSecure: true,
        message: 'Senha gerada e armazenada com hash seguro'
      },
      hotmartIntegration: {
        enabled: true,
        message: 'Usuário preparado para validação via Hotmart'
      }
    }, {
      status: 201,
      headers
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário:', error);
    
    let errorMessage = 'Erro interno ao criar usuário';
    let errorCode = 'CREATION_ERROR';
    
    if (error.code === 'P2002') {
      errorMessage = 'Email já está em uso';
      errorCode = 'EMAIL_ALREADY_EXISTS';
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { 
      status: 500,
      headers
    });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('❌ Erro ao desconectar:', disconnectError);
    }
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Email',
    },
  });
}