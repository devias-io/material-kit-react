import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

type EndpointInfo = {
  path: string;
  description: string;
  method?: 'GET' | 'POST' | 'OPTIONS';
};

const ENDPOINTS: EndpointInfo[] = [
  {
    path: '/api/financial/market-data',
    description: 'Resumo de mercado com Ibovespa, Small Caps e métricas agregadas.',
    method: 'GET',
  },
  {
    path: '/api/financial/fii-market-data',
    description: 'Dados agregados dos FIIs incluindo IFIX e desempenho simulado da carteira.',
    method: 'GET',
  },
  {
    path: '/api/financial/quotes',
    description: 'Cotação em lote via parâmetro "symbols" com tickers separados por vírgula.',
    method: 'GET',
  },
  {
    path: '/api/b3/market-data',
    description: 'Alias compatível para os dados consolidados da B3 (Ibovespa e Small Caps).',
    method: 'GET',
  },
  {
    path: '/api/b3/investments',
    description: 'Alias compatível que descreve as carteiras simuladas utilizadas na área do assinante.',
    method: 'GET',
  },
  {
    path: '/api/dividend-yield/batch',
    description: 'Calcula DY em lote para múltiplos tickers (POST com { tickers: string[] }).',
    method: 'POST',
  },
];

export async function GET() {
  const timestamp = new Date().toISOString();
  const body = {
    success: true,
    message: 'API financeira ativa. Utilize os endpoints listados abaixo para obter dados detalhados.',
    timestamp,
    endpoints: ENDPOINTS,
    rotas: {
      lista: ENDPOINTS.map(endpoint => endpoint.path),
      metodos: ENDPOINTS.reduce<Record<string, EndpointInfo['method']>>((acc, endpoint) => {
        acc[endpoint.path] = endpoint.method ?? 'GET';
        return acc;
      }, {}),
      mapa: ENDPOINTS.reduce<Record<string, string>>((acc, endpoint) => {
        acc[endpoint.path] = endpoint.description;
        return acc;
      }, {}),
      // Compatibilidade com clientes que verificam a existência de rotas.
      exists: null as null,
      existe: ENDPOINTS.reduce<Record<string, boolean>>((acc, endpoint) => {
        acc[endpoint.path] = true;
        return acc;
      }, {}),
    },
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
