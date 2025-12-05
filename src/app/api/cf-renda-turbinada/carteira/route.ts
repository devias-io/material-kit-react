import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

type CarteiraPayload = {
  id?: unknown;
  ordem?: unknown;
  ativoBase?: unknown;
  codigoOpcao?: unknown;
  strike?: unknown;
  premio?: unknown;
  premioCustom?: unknown;
  rendaPercentual?: unknown;
  garantia?: unknown;
  precoReferencia?: unknown;
  vencimento?: unknown;
  tipoOperacao?: unknown;
  status?: unknown;
  observacao?: unknown;
};

const DEFAULT_OPERATIONS = {
  puts: [
    {
      id: 'put-1',
      ordem: 1,
      ativoBase: 'BBSE3',
      codigoOpcao: 'BBSEX352',
      strike: 33.26,
      premio: null,
      premioCustom: 'R$ 0,44 e R$ 0,47',
      rendaPercentual: 1.31,
      garantia: 3326.0,
      precoReferencia: 33.26,
      vencimento: '19/12/2025',
      tipoOperacao: 'PUT',
      status: 'Aberta'
    },
    {
      id: 'put-2',
      ordem: 2,
      ativoBase: 'B3SA3',
      codigoOpcao: 'B3SAX132',
      strike: 13.02,
      premio: 0.28,
      rendaPercentual: 2.08,
      garantia: 1302.0,
      precoReferencia: 13.02,
      vencimento: '19/12/2025',
      tipoOperacao: 'PUT',
      status: 'Fechada'
    },
    {
      id: 'put-3',
      ordem: 3,
      ativoBase: 'PETR4',
      codigoOpcao: 'PETRX326',
      strike: 32.0,
      premio: null,
      premioCustom: 'R$ 0,62 e R$ 0,65',
      rendaPercentual: 1.95,
      garantia: 3200.0,
      precoReferencia: 32.0,
      vencimento: '19/12/2025',
      tipoOperacao: 'PUT',
      status: 'Aberta'
    },
    {
      id: 'put-4',
      ordem: 4,
      ativoBase: 'BBAS3',
      codigoOpcao: 'BBASX228',
      strike: 22.44,
      premio: null,
      premioCustom: 'R$ 0,59 e R$ 0,63',
      rendaPercentual: 2.69,
      garantia: 2244.0,
      precoReferencia: 22.44,
      vencimento: '19/12/2025',
      tipoOperacao: 'PUT',
      status: 'Aberta'
    }
  ],
  calls: [
    {
      id: 'call-1',
      ordem: 1,
      ativoBase: 'VALE3',
      codigoOpcao: 'VALEL70',
      strike: 66.29,
      premio: 1.52,
      rendaPercentual: 2.33,
      garantia: null,
      precoReferencia: 66.29,
      vencimento: '19/12/2025',
      tipoOperacao: 'CALL',
      status: 'Encerrada'
    },
    {
      id: 'call-2',
      ordem: 2,
      ativoBase: 'PETR4',
      codigoOpcao: 'PETRL41',
      strike: 34.25,
      premio: 0.7,
      rendaPercentual: 2.1,
      garantia: null,
      precoReferencia: 34.25,
      vencimento: '19/12/2025',
      tipoOperacao: 'CALL',
      status: 'Encerrada'
    },
    {
      id: 'call-3',
      ordem: 3,
      ativoBase: 'SANB11',
      codigoOpcao: 'SANBL345',
      strike: 34.1,
      premio: 0.66,
      rendaPercentual: 2.0,
      garantia: null,
      precoReferencia: 34.1,
      vencimento: '19/12/2025',
      tipoOperacao: 'CALL',
      status: 'Encerrada'
    },
    {
      id: 'call-4',
      ordem: 4,
      ativoBase: 'VALE3',
      codigoOpcao: 'VALEL69',
      strike: 65.79,
      premio: null,
      premioCustom: 'R$ 1,35 a R$ 1,38',
      rendaPercentual: 2.08,
      garantia: null,
      precoReferencia: 65.79,
      vencimento: '19/12/2025',
      tipoOperacao: 'CALL',
      status: 'Aberta'
    },
    {
      id: 'call-5',
      ordem: 5,
      ativoBase: 'B3SA3',
      codigoOpcao: 'B3SAL149',
      strike: 14.77,
      premio: null,
      premioCustom: 'R$ 0,31 a R$ 0,34',
      rendaPercentual: 2.26,
      garantia: null,
      precoReferencia: 14.77,
      vencimento: '19/12/2025',
      tipoOperacao: 'CALL',
      status: 'Aberta'
    }
  ]
};

const serializeOperation = (operation: CarteiraPayload) => {
  const { id, ordem, ativoBase, codigoOpcao, vencimento, tipoOperacao, status } = operation;

  if (
    typeof id !== 'string' ||
    typeof ordem !== 'number' ||
    typeof ativoBase !== 'string' ||
    typeof codigoOpcao !== 'string' ||
    typeof vencimento !== 'string' ||
    (tipoOperacao !== 'PUT' && tipoOperacao !== 'CALL') ||
    (status !== 'Aberta' && status !== 'Fechada' && status !== 'Encerrada')
  ) {
    return null;
  }

  const parseNullableNumber = (value: unknown) => {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (value === null || value === undefined) return null;
    return null;
  };

  return {
    id,
    ordem,
    ativoBase,
    codigoOpcao,
    vencimento,
    tipoOperacao,
    status,
    strike: parseNullableNumber(operation.strike),
    premio: parseNullableNumber(operation.premio),
    premioCustom: typeof operation.premioCustom === 'string' ? operation.premioCustom : null,
    rendaPercentual: parseNullableNumber(operation.rendaPercentual),
    garantia: parseNullableNumber(operation.garantia),
    precoReferencia: parseNullableNumber(operation.precoReferencia),
    observacao: typeof operation.observacao === 'string' ? operation.observacao : null
  };
};

async function getUserPlan(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true }
  });

  return user?.plan;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let operations = await prisma.cfRendaTurbinadaCarteiraOperacao.findMany({
      orderBy: [
        { tipoOperacao: 'asc' },
        { ordem: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    if (operations.length === 0) {
      await prisma.cfRendaTurbinadaCarteiraOperacao.createMany({
        data: [...DEFAULT_OPERATIONS.puts, ...DEFAULT_OPERATIONS.calls].map(op => ({
          ...op
        }))
      });

      operations = await prisma.cfRendaTurbinadaCarteiraOperacao.findMany({
        orderBy: [
          { tipoOperacao: 'asc' },
          { ordem: 'asc' },
          { createdAt: 'asc' }
        ]
      });
    }

    const puts = operations.filter(op => op.tipoOperacao === 'PUT');
    const calls = operations.filter(op => op.tipoOperacao === 'CALL');

    return NextResponse.json({ puts, calls });
  } catch (error) {
    console.error('Erro ao listar operações da carteira recomendada:', error);
    return NextResponse.json({ error: 'Erro ao carregar operações' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const plan = await getUserPlan(session.user.id);

    if (plan !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { puts, calls } = body as { puts?: CarteiraPayload[]; calls?: CarteiraPayload[] };

    if (!Array.isArray(puts) || !Array.isArray(calls)) {
      return NextResponse.json({ error: 'Listas de operações são obrigatórias' }, { status: 400 });
    }

    const parsedOperations = [...puts, ...calls]
      .map(serializeOperation)
      .filter(Boolean) as ReturnType<typeof serializeOperation>[];

    if (parsedOperations.length !== puts.length + calls.length) {
      return NextResponse.json({ error: 'Dados de operação inválidos' }, { status: 400 });
    }

    const idsToKeep = parsedOperations.map(op => op.id);

    await prisma.$transaction(async tx => {
      await tx.cfRendaTurbinadaCarteiraOperacao.deleteMany({
        where: { id: { notIn: idsToKeep } }
      });

      for (const operation of parsedOperations) {
        await tx.cfRendaTurbinadaCarteiraOperacao.upsert({
          where: { id: operation.id },
          update: {
            ...operation
          },
          create: {
            ...operation
          }
        });
      }
    });

    const updated = await prisma.cfRendaTurbinadaCarteiraOperacao.findMany({
      orderBy: [
        { tipoOperacao: 'asc' },
        { ordem: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({
      puts: updated.filter(op => op.tipoOperacao === 'PUT'),
      calls: updated.filter(op => op.tipoOperacao === 'CALL')
    });
  } catch (error) {
    console.error('Erro ao salvar operações da carteira recomendada:', error);
    return NextResponse.json({ error: 'Erro ao salvar operações' }, { status: 500 });
  }
}
