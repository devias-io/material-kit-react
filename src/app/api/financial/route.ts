import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET() {
  const timestamp = new Date().toISOString();

  return NextResponse.json({
    success: true,
    message: 'API financeira ativa. Utilize os endpoints específicos listados para obter dados detalhados.',
    timestamp,
    endpoints: [
      {
        path: '/api/financial/market-data',
        description: 'Resumo de mercado com Ibovespa, Small Caps e métricas agregadas.',
      },
      {
        path: '/api/financial/fii-market-data',
        description: 'Dados agregados dos FIIs incluindo IFIX e desempenho simulado da carteira.',
      },
      {
        path: '/api/financial/quotes?symbols=ITUB4,VALE3',
        description: 'Cotação em lote via símbolos separados por vírgula.',
      },
    ],
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  });
}
