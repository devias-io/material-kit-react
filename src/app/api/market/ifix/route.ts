import { buildCacheHeaders } from '@/server/cache-headers';

const IFIX_CACHE_HEADERS = buildCacheHeaders({ ttl: 90, swr: 600 });

export async function GET() {
  try {
    const agora = new Date();
    const hora = agora.getHours();
    const minuto = agora.getMinutes();
    
    // Simulação realista
    const isHorarioComercial = hora >= 9 && hora <= 18;
    const valorBase = 3440;
    const variacao = (Math.random() - 0.5) * (isHorarioComercial ? 3 : 1);
    const novoValor = valorBase * (1 + variacao / 100);
    
    const dadosIfix = {
      valor: novoValor,
      valorFormatado: novoValor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      variacao: valorBase * (variacao / 100),
      variacaoPercent: variacao,
      trend: variacao >= 0 ? 'up' : 'down',
      timestamp: agora.toISOString(),
      fonte: 'SIMULAÇÃO_VERCEL',
      nota: `Atualizado ${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`,
      symbol: 'IFIX'
    };

    console.log('API IFIX chamada:', dadosIfix);

    return new Response(JSON.stringify({
      ifix: dadosIfix,
      success: true,
      timestamp: agora.toISOString(),
      debug: 'API funcionando no Vercel'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        ...IFIX_CACHE_HEADERS
      }
    });

  } catch (error) {
    console.error('Erro na API IFIX:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
