// app/api/cron/update-ativos/route.ts
export async function GET() {
  // Verificar auth do cron
  if (process.env.NODE_ENV === 'production') {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  const ativosPopulares = [
    'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'BBAS3', 
    'AAPL', 'NVDA', 'GOOGL', 'META', 'AMZN'
  ];
  
  let sucessos = 0;
  let erros = 0;
  
  for (const ticker of ativosPopulares) {
    try {
      const dados = await fetchDadosConsolidados(ticker);
      await CacheService.set(CacheService.getCacheKey(ticker), dados, 600);
      sucessos++;
    } catch (error) {
      console.error(`Erro ao atualizar ${ticker}:`, error);
      erros++;
    }
  }
  
  return Response.json({
    success: true,
    processados: ativosPopulares.length,
    sucessos,
    erros,
    timestamp: new Date().toISOString()
  });
}