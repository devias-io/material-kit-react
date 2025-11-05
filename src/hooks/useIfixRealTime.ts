// hooks/useIfixRealTime.ts - VERSÃO COM YAHOO FINANCE + FALLBACKS
import { useState, useEffect, useCallback } from 'react';
import { createStaticIfixFallbackPayload } from '@/utils/ifixConstants';
import { debugError, debugLog } from '@/utils/logger';

interface IfixData {
  valor: number;
  valorFormatado: string;
  variacao: number;
  variacaoPercent: number;
  trend: 'up' | 'down';
  timestamp: string;
  fonte: string;
}

export function useIfixRealTime() {
  const [ifixData, setIfixData] = useState<IfixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarIfixReal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      debugLog('🔍 BUSCANDO IFIX REAL - MÚLTIPLAS FONTES...');

      // 🎯 TENTATIVA 1: YAHOO FINANCE (MAIS CONFIÁVEL)
      try {
        debugLog('📊 Tentativa 1: Yahoo Finance IFIX.SA...');
        
        // Yahoo Finance usa endpoints não-oficiais, mas funcionais
        const yahooUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/IFIX.SA';
        
        const yahooResponse = await fetch(yahooUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (yahooResponse.ok) {
          const yahooData = await yahooResponse.json();
          debugLog('📊 Resposta Yahoo Finance:', yahooData);

          if (yahooData.chart && yahooData.chart.result && yahooData.chart.result.length > 0) {
            const chartData = yahooData.chart.result[0];
            const meta = chartData.meta;
            
            if (meta && meta.regularMarketPrice) {
              const precoAtual = meta.regularMarketPrice;
              const fechamentoAnterior = meta.previousClose || meta.chartPreviousClose;
              const variacao = precoAtual - fechamentoAnterior;
              const variacaoPercent = ((variacao / fechamentoAnterior) * 100);
              
              const dadosIfix = {
                valor: precoAtual,
                valorFormatado: precoAtual.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }),
                variacao: variacao,
                variacaoPercent: variacaoPercent,
                trend: variacaoPercent >= 0 ? 'up' : 'down',
                timestamp: new Date().toISOString(),
                fonte: 'YAHOO_FINANCE'
              };

              debugLog('✅ IFIX REAL (YAHOO) PROCESSADO:', dadosIfix);
              setIfixData(dadosIfix);
              return; // Sucesso, sair da função
            }
          }
        }
        
        debugLog('⚠️ Yahoo Finance falhou, tentando alternativa...');
      } catch (yahooError) {
        debugError('❌ Erro Yahoo Finance:', yahooError);
      }

      // 🎯 TENTATIVA 2: BRAPI (COMO BACKUP)
      try {
        debugLog('📊 Tentativa 2: BRAPI IFIX.SA...');
        
        const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
        const brapiUrl = `https://brapi.dev/api/quote/IFIX.SA?token=${BRAPI_TOKEN}`;
        
        const brapiResponse = await fetch(brapiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'IFIX-Real-Time-App'
          }
        });

        if (brapiResponse.ok) {
          const brapiData = await brapiResponse.json();
          debugLog('📊 Resposta BRAPI:', brapiData);

          if (brapiData.results && brapiData.results.length > 0) {
            const ifixBrapi = brapiData.results[0];
            
            if (ifixBrapi.regularMarketPrice && ifixBrapi.regularMarketPrice > 0) {
              const dadosIfix = {
                valor: ifixBrapi.regularMarketPrice,
                valorFormatado: ifixBrapi.regularMarketPrice.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }),
                variacao: ifixBrapi.regularMarketChange || 0,
                variacaoPercent: ifixBrapi.regularMarketChangePercent || 0,
                trend: (ifixBrapi.regularMarketChangePercent || 0) >= 0 ? 'up' : 'down',
                timestamp: new Date().toISOString(),
                fonte: 'BRAPI_REAL'
              };

              debugLog('✅ IFIX REAL (BRAPI) PROCESSADO:', dadosIfix);
              setIfixData(dadosIfix);
              return; // Sucesso, sair da função
            }
          }
        }
        
        debugLog('⚠️ BRAPI também falhou, tentando API própria...');
      } catch (brapiError) {
        debugError('❌ Erro BRAPI:', brapiError);
      }

      // 🎯 TENTATIVA 3: API PRÓPRIA (SIMULAÇÃO COMO BACKUP)
      try {
        debugLog('📊 Tentativa 3: API própria (fallback)...');
        
        const fallbackResponse = await fetch('/api/dados-ifix');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          debugLog('🔄 Dados de fallback (API própria):', fallbackData);
          
          const dadosFallback = {
            valor: fallbackData.valor,
            valorFormatado: fallbackData.valorFormatado,
            variacao: fallbackData.variacao,
            variacaoPercent: fallbackData.variacaoPercent,
            trend: fallbackData.trend,
            timestamp: new Date().toISOString(),
            fonte: 'FALLBACK_API_PROPRIA'
          };
          
          debugLog('✅ IFIX FALLBACK PROCESSADO:', dadosFallback);
          setIfixData(dadosFallback);
          return; // Sucesso, sair da função
        }
        
        debugLog('⚠️ API própria também falhou, usando valor fixo...');
      } catch (fallbackErr) {
        debugError('❌ Erro API própria:', fallbackErr);
      }

      // 🎯 FALLBACK FINAL: VALOR FIXO (NUNCA FALHA)
      debugLog('🔄 Usando fallback final com valor fixo...');
      setIfixData(createStaticIfixFallbackPayload('FALLBACK_FIXO'));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro geral desconhecido';
      debugError('❌ Erro geral ao buscar IFIX:', err);
      setError(errorMessage);

      // FALLBACK DE EMERGÊNCIA
      setIfixData(createStaticIfixFallbackPayload('EMERGENCIA'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarIfixReal();

    // 🔄 ATUALIZAR A CADA 5 MINUTOS (IGUAL AO IBOVESPA)
    const interval = setInterval(buscarIfixReal, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [buscarIfixReal]);

  return { ifixData, loading, error, refetch: buscarIfixReal };
}
