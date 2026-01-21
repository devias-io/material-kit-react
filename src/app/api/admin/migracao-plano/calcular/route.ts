export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPaymentMethodDisplayName, formatInstallments } from '@/lib/payment-normalization';

// Valores dos planos
const VALOR_LITE = 511.86;
const VALOR_VIP = 1297.00;
const MESES_ANO = 12;

/**
 * Calcula meses entre duas datas
 */
function calcularMesesEntreDatas(dataInicio: Date, dataFim: Date): number {
  const anos = dataFim.getFullYear() - dataInicio.getFullYear();
  const meses = dataFim.getMonth() - dataInicio.getMonth();
  return anos * 12 + meses;
}

/**
 * GET /api/admin/migracao-plano/calcular?email=cliente@email.com
 * Busca cliente e calcula valor da migração
 */
export async function GET(request: NextRequest) {
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
      select: { customPermissions: true }
    });

    const permissions = JSON.parse(sessionUser?.customPermissions || '[]');
    if (!permissions.includes('admin')) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    // Extrair parâmetros
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar cliente
    const cliente = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        purchases: {
          where: {
            status: 'COMPLETED',
            amount: { gt: 0 }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
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

    // Verificar se tem data de expiração
    if (!cliente.expirationDate) {
      return NextResponse.json(
        { error: 'Cliente não tem data de expiração definida' },
        { status: 400 }
      );
    }

    // Buscar compra original
    const compraOriginal = cliente.purchases[0];
    if (!compraOriginal) {
      return NextResponse.json(
        { error: 'Não foi encontrada compra do cliente' },
        { status: 404 }
      );
    }

    // Calcular meses utilizados e restantes
    const dataAtual = new Date();
    const dataContratacao = cliente.createdAt;
    const dataExpiracao = new Date(cliente.expirationDate);

    // Garantir que a data de expiração não passou
    if (dataExpiracao <= dataAtual) {
      return NextResponse.json(
        { error: 'O plano do cliente já expirou' },
        { status: 400 }
      );
    }

    const mesesUtilizados = Math.max(0, calcularMesesEntreDatas(dataContratacao, dataAtual));
    const mesesRestantes = Math.max(0, calcularMesesEntreDatas(dataAtual, dataExpiracao));

    // Calcular diferença mensal entre planos
    const diferencaMensal = (VALOR_VIP - VALOR_LITE) / MESES_ANO;

    // Calcular desconto (proporcional aos meses restantes)
    const valorDesconto = diferencaMensal * mesesRestantes;

    // Calcular valor final da migração
    const valorFinalMigracao = Math.max(0, VALOR_VIP - valorDesconto);

    // Preparar resposta
    const response = {
      cliente: {
        id: cliente.id,
        nome: `${cliente.firstName} ${cliente.lastName}`,
        email: cliente.email,
        planoAtual: cliente.plan,
        dataContratacao: dataContratacao.toISOString(),
        dataExpiracao: dataExpiracao.toISOString(),
        status: cliente.status,
        origin: cliente.origin
      },
      compraOriginal: {
        id: compraOriginal.id,
        valor: compraOriginal.amount,
        valorFormatado: `R$ ${compraOriginal.amount.toFixed(2)}`,
        formaPagamento: getPaymentMethodDisplayName(compraOriginal.paymentMethod),
        formaPagamentoCodigo: compraOriginal.paymentMethod,
        numeroParcelas: compraOriginal.installments,
        parcelamentoFormatado: formatInstallments(compraOriginal.installments, compraOriginal.amount),
        plataforma: compraOriginal.platform,
        dataCompra: compraOriginal.createdAt.toISOString(),
        produtoNome: compraOriginal.productName
      },
      calculo: {
        valorLite: VALOR_LITE,
        valorLiteFormatado: `R$ ${VALOR_LITE.toFixed(2)}`,
        valorVip: VALOR_VIP,
        valorVipFormatado: `R$ ${VALOR_VIP.toFixed(2)}`,
        mesesUtilizados,
        mesesRestantes,
        diferencaMensal,
        diferencaMensalFormatada: `R$ ${diferencaMensal.toFixed(2)}`,
        valorDesconto,
        valorDescontoFormatado: `R$ ${valorDesconto.toFixed(2)}`,
        valorFinalMigracao,
        valorFinalMigracaoFormatado: `R$ ${valorFinalMigracao.toFixed(2)}`
      },
      observacoes: [
        compraOriginal.installments > 1
          ? `As ${compraOriginal.installments} parcelas do CF LITE (${formatInstallments(compraOriginal.installments, compraOriginal.amount)}) continuarão sendo cobradas`
          : 'O pagamento do CF LITE foi à vista',
        'O plano VIP terá validade de 1 ano a partir da data da compra',
        `O desconto de R$ ${valorDesconto.toFixed(2)} será aplicado no valor do VIP`
      ]
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Erro ao calcular migração:', error);
    return NextResponse.json(
      {
        error: 'Erro interno ao calcular migração',
        message: error.message
      },
      { status: 500 }
    );
  }
}
