import { NextRequest, NextResponse } from 'next/server';
import { ViesOverride } from '@prisma/client';
import { prisma } from '@/lib/prisma';

import { auth } from '@/lib/auth';

const CARTEIRA_MODEL_MAP = {
  microCaps: prisma.userMicroCaps,
  smallCaps: prisma.userSmallCaps,
  dividendos: prisma.userDividendos,
  fiis: prisma.userFiis,
  cfRendaTurbinada: prisma.userRendaTurbinada,
  dividendosInternacional: prisma.userDividendosInternacional,
  etfs: prisma.userEtfs,
  projetoAmerica: prisma.userProjetoAmerica,
  exteriorStocks: prisma.userExteriorStocks
} as const;

type Carteira = keyof typeof CARTEIRA_MODEL_MAP;

const VIES_OVERRIDE_VALUES: ViesOverride[] = ['AUTO', 'MANTER'];

const normalizarTicker = (ticker: string | string[] | undefined) =>
  (Array.isArray(ticker) ? ticker[0] : ticker)?.toUpperCase().trim();

const obterCarteiraValida = (carteira: string | string[] | undefined): Carteira | null => {
  const valor = Array.isArray(carteira) ? carteira[0] : carteira;
  if (!valor) {
    return null;
  }

  return valor in CARTEIRA_MODEL_MAP ? (valor as Carteira) : null;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { ticker?: string } }
) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  if (user.plan !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
  }

  const tickerNormalizado = normalizarTicker(params.ticker);

  if (!tickerNormalizado) {
    return NextResponse.json({ error: 'Ticker obrigatório' }, { status: 400 });
  }

  let body: { carteira?: string; viesOverride?: ViesOverride };

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const carteiraValida = obterCarteiraValida(body.carteira);

  if (!carteiraValida) {
    return NextResponse.json({ error: 'Carteira inválida' }, { status: 400 });
  }

  const overrideSolicitado = body.viesOverride as ViesOverride | undefined;

  if (!overrideSolicitado || !VIES_OVERRIDE_VALUES.includes(overrideSolicitado)) {
    return NextResponse.json({ error: 'Valor de viés inválido' }, { status: 400 });
  }

  const delegate = CARTEIRA_MODEL_MAP[carteiraValida];

  try {
    const updateResult = await delegate.updateMany({
      where: { ticker: tickerNormalizado },
      data: {
        viesOverride: overrideSolicitado,
        editadoEm: new Date()
      }
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: 'Ativo não encontrado' }, { status: 404 });
    }

    const ativosAtualizados = await delegate.findMany({
      where: { ticker: tickerNormalizado },
      orderBy: { editadoEm: 'desc' }
    });

    return NextResponse.json({
      ticker: tickerNormalizado,
      carteira: carteiraValida,
      viesOverride: overrideSolicitado,
      ativosAtualizados
    });
  } catch (error) {
    console.error('Erro ao atualizar viés manual:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar viés' }, { status: 500 });
  }
}
