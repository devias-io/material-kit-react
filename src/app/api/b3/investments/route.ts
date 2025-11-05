import { NextResponse } from 'next/server';
import { DEFAULT_CARTEIRAS_DATA, type CarteiraAtivoBase } from '@/data/carteiras-default';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

interface CarteiraResumo {
  chave: keyof typeof DEFAULT_CARTEIRAS_DATA;
  nome: string;
  totalAtivos: number;
  tickers: string[];
  setores: string[];
}

const NOMES_CARTEIRAS: Record<keyof typeof DEFAULT_CARTEIRAS_DATA, string> = {
  smallCaps: 'Small Caps',
  microCaps: 'Micro Caps',
  dividendos: 'Dividendos',
  fiis: 'FIIs',
  cfRendaTurbinada: 'CF Renda Turbinada',
  dividendosInternacional: 'Dividendos Internacional',
  etfs: 'ETFs',
  projetoAmerica: 'Projeto América',
  exteriorStocks: 'Exterior Stocks',
};

function resumirCarteira(
  chave: keyof typeof DEFAULT_CARTEIRAS_DATA,
  ativos: CarteiraAtivoBase[]
): CarteiraResumo {
  const tickers = ativos.map(ativo => ativo.ticker);
  const setores = Array.from(new Set(ativos.map(ativo => ativo.setor))).filter(Boolean);

  return {
    chave,
    nome: NOMES_CARTEIRAS[chave],
    totalAtivos: ativos.length,
    tickers,
    setores,
  };
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const resumos = (Object.keys(DEFAULT_CARTEIRAS_DATA) as (keyof typeof DEFAULT_CARTEIRAS_DATA)[])
    .map(chave => {
      const ativos = DEFAULT_CARTEIRAS_DATA[chave] as CarteiraAtivoBase[];
      return resumirCarteira(chave, ativos);
    });

  const totais = resumos.reduce(
    (acc, resumo) => {
      acc.totalAtivos += resumo.totalAtivos;
      resumo.tickers.forEach(ticker => acc.tickers.add(ticker));
      resumo.setores.forEach(setor => acc.setores.add(setor));
      return acc;
    },
    { totalAtivos: 0, tickers: new Set<string>(), setores: new Set<string>() }
  );

  const body = {
    success: true,
    timestamp,
    totalCategorias: resumos.length,
    totais: {
      totalAtivos: totais.totalAtivos,
      totalTickers: totais.tickers.size,
      totalSetores: totais.setores.size,
    },
    categorias: resumos,
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  });
}
