import { useState, useEffect, useCallback } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import { useResponsive } from './useResponsive';
import { useApiStrategy } from './useApiStrategy';
import { calcularViesAutomatico, calcularProventosAtivo } from '@/utils/micro-caps/calculationUtils';
import { aplicarViesOverride } from '@/utils/vies';
import type { Ativo, Cotacao } from '@/types/microCaps';

// 🚀 HOOK PRINCIPAL PARA DADOS DE MICRO CAPS
export function useMicroCapsData() {
  const { dados } = useDataStore();
  const { isMobile, screenWidth } = useResponsive();
  const { fetchQuotes, fetchDividendYields } = useApiStrategy(isMobile);
  
  const [ativosAtualizados, setAtivosAtualizados] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const microCapsData = dados.microCaps || [];

  // 🔄 PROCESSAR DADOS DOS ATIVOS
  const processarAtivos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 MICRO CAPS - PROCESSAMENTO INICIADO');
      console.log('📱 Device Info:', { isMobile, screenWidth });
      console.log('📊 Ativos para processar:', microCapsData.length);

      if (microCapsData.length === 0) {
        setAtivosAtualizados([]);
        return;
      }

      const tickers = microCapsData.map(ativo => ativo.ticker);
      console.log('🎯 Tickers:', tickers.join(', '));

      // 📈 BUSCAR COTAÇÕES E DY EM PARALELO
      console.log('🔄 Buscando cotações e DY...');
      const [cotacoesMap, dyMap] = await Promise.all([
        fetchQuotes(tickers),
        fetchDividendYields(tickers)
      ]);

      console.log(`📊 RESULTADO: ${cotacoesMap.size}/${tickers.length} cotações, ${dyMap.size}/${tickers.length} DY`);

      // 🔥 PROCESSAR CADA ATIVO
      const ativosProcessados = microCapsData.map((ativo, index) => {
        const cotacao = cotacoesMap.get(ativo.ticker);
        const dyAPI = dyMap.get(ativo.ticker) || '0,00%';
        
        if (cotacao) {
          // ✅ COTAÇÃO VÁLIDA
          const precoAtual = cotacao.precoAtual;
          const performanceAcao = ((precoAtual - ativo.precoEntrada) / ativo.precoEntrada) * 100;
          
          // 💰 CALCULAR PROVENTOS DO PERÍODO
          const proventosAtivo = calcularProventosAtivo(ativo.ticker, ativo.dataEntrada);
          
          // 🎯 PERFORMANCE TOTAL (AÇÃO + PROVENTOS)
          const performanceProventos = ativo.precoEntrada > 0 ? (proventosAtivo / ativo.precoEntrada) * 100 : 0;
          const performanceTotal = performanceAcao + performanceProventos;
          
          return {
            ...ativo,
            id: String(ativo.id || index + 1),
            precoAtual,
            performance: performanceTotal,
            performanceAcao: performanceAcao,
            performanceProventos: performanceProventos,
            proventosAtivo: proventosAtivo,
            variacao: cotacao.variacao,
            variacaoPercent: cotacao.variacaoPercent,
            volume: cotacao.volume,
            vies: aplicarViesOverride(
              ativo.viesOverride,
              calcularViesAutomatico(ativo.precoTeto, `R$ ${precoAtual.toFixed(2).replace('.', ',')}`)
            ),
            dy: dyAPI,
            statusApi: 'success' as const,
            nomeCompleto: cotacao.nome,
            rank: `${index + 1}°`
          };
        } else {
          // ⚠️ SEM COTAÇÃO - USAR DADOS DE ENTRADA
          console.log(`⚠️ ${ativo.ticker}: Sem cotação disponível`);
          
          const proventosAtivo = calcularProventosAtivo(ativo.ticker, ativo.dataEntrada);
          const performanceProventos = ativo.precoEntrada > 0 ? (proventosAtivo / ativo.precoEntrada) * 100 : 0;
          
          return {
            ...ativo,
            id: String(ativo.id || index + 1),
            precoAtual: ativo.precoEntrada,
            performance: performanceProventos,
            performanceAcao: 0,
            performanceProventos: performanceProventos,
            proventosAtivo: proventosAtivo,
            variacao: 0,
            variacaoPercent: 0,
            volume: 0,
            vies: aplicarViesOverride(
              ativo.viesOverride,
              calcularViesAutomatico(ativo.precoTeto, `R$ ${ativo.precoEntrada.toFixed(2).replace('.', ',')}`)
            ),
            dy: dyAPI,
            statusApi: 'success' as const,
            nomeCompleto: ativo.ticker,
            rank: `${index + 1}°`
          };
        }
      });

      setAtivosAtualizados(ativosProcessados);

      // 📊 LOGS DE RESULTADO
      const sucessos = cotacoesMap.size;
      if (sucessos === 0) {
        setError('Nenhuma cotação obtida');
      } else if (sucessos < tickers.length / 2) {
        setError(`Apenas ${sucessos} de ${tickers.length} cotações obtidas`);
      }

      console.log('✅ PROCESSAMENTO CONCLUÍDO:', {
        totalAtivos: ativosProcessados.length,
        cotacoesObtidas: sucessos,
        dyObtidos: dyMap.size,
        device: isMobile ? 'Mobile' : 'Desktop'
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro no processamento de micro caps:', err);
      
      // 🔄 FALLBACK: Processar apenas com dados de entrada
      console.log('🔄 Executando fallback...');
      
      const ativosFallback = microCapsData.map((ativo, index) => {
        const proventosAtivo = calcularProventosAtivo(ativo.ticker, ativo.dataEntrada);
        const performanceProventos = ativo.precoEntrada > 0 ? (proventosAtivo / ativo.precoEntrada) * 100 : 0;
        
        return {
          ...ativo,
          id: String(ativo.id || index + 1),
          precoAtual: ativo.precoEntrada,
          performance: performanceProventos,
          performanceAcao: 0,
          performanceProventos: performanceProventos,
          proventosAtivo: proventosAtivo,
          variacao: 0,
          variacaoPercent: 0,
          volume: 0,
          vies: aplicarViesOverride(
            ativo.viesOverride,
            calcularViesAutomatico(ativo.precoTeto, `R$ ${ativo.precoEntrada.toFixed(2).replace('.', ',')}`)
          ),
          dy: '0,00%',
          statusApi: 'error' as const,
          nomeCompleto: ativo.ticker,
          rank: `${index + 1}°`
        };
      });
      
      setAtivosAtualizados(ativosFallback);
      
    } finally {
      setLoading(false);
    }
  }, [microCapsData, isMobile, screenWidth, fetchQuotes, fetchDividendYields]);

  // ✨ EXECUTAR QUANDO OS DADOS MUDAREM
  useEffect(() => {
    if (microCapsData.length > 0) {
      processarAtivos();
    } else {
      setAtivosAtualizados([]);
      setLoading(false);
    }
  }, [processarAtivos]);

  // 🔄 FUNÇÃO DE REFRESH MANUAL
  const refetch = useCallback(() => {
    console.log('🔄 Refresh manual solicitado');
    processarAtivos();
  }, [processarAtivos]);

  return {
    ativosAtualizados,
    loading,
    error,
    refetch,
    isMobile,
    screenWidth,
    // Estatísticas extras
    stats: {
      totalAtivos: ativosAtualizados.length,
      ativosComCotacao: ativosAtualizados.filter(a => a.statusApi === 'success' && a.variacao !== 0).length,
      ativosComDY: ativosAtualizados.filter(a => a.dy !== '0,00%').length
    }
  };
}