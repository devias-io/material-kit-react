/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { aplicarViesOverride } from '@/utils/vies';

export interface FII {
  id: string;
  avatar: string;
  ticker: string;
  setor: string;
  dataEntrada: string;
  precoEntrada: string;
  precoAtual: string;
  dy: string;
  precoTeto: string;
  vies: string;
  viesOverride?: 'AUTO' | 'MANTER';
  performance?: number;
  variacao?: number;
  variacaoPercent?: number;
  volume?: number;
  statusApi?: string;
  nomeCompleto?: string;
}

// 🔥 DETECTAR SE É MOBILE
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 🔥 FUNÇÃO PARA CALCULAR O VIÉS AUTOMATICAMENTE
function calcularViesAutomatico(precoTeto: number | undefined, precoAtual: string): string {
  if (!precoTeto || precoAtual === 'N/A') {
    return 'Aguardar';
  }
  
  // Remover formatação e converter para números
  const precoAtualNum = parseFloat(precoAtual.replace('R$ ', '').replace(',', '.'));
  
  if (isNaN(precoAtualNum)) {
    return 'Aguardar';
  }
  
  // 🎯 LÓGICA CORRETA: Preço Atual < Preço Teto = COMPRA (FII está barato)
  if (precoAtualNum < precoTeto) {
    return 'Compra';
  } else {
    return 'Aguardar';
  }
}

// 🎯 FUNÇÃO PARA CALCULAR DY DOS ÚLTIMOS 12 MESES BASEADO NOS PROVENTOS UPLOADADOS
function calcularDY12Meses(ticker: string, precoAtual: number): string {
  try {
    if (typeof window === 'undefined' || precoAtual <= 0) return '0,00%';
    
    // Buscar proventos do ticker específico no localStorage
    const proventosData = localStorage.getItem(`proventos_${ticker}`);
    if (!proventosData) return '0,00%';
    
    const proventos = JSON.parse(proventosData);
    if (!Array.isArray(proventos) || proventos.length === 0) return '0,00%';
    
    // Data de 12 meses atrás
    const hoje = new Date();
    const umAnoAtras = new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate());
    
    console.log(`🔍 Calculando DY para ${ticker}:`);
    
    // Filtrar proventos dos últimos 12 meses
    const proventosUltimos12Meses = proventos.filter((provento: any) => {
      let dataProvento: Date;
      
      // Tentar várias formas de parsing da data
      if (provento.dataObj) {
        dataProvento = new Date(provento.dataObj);
      } else if (provento.dataCom) {
        if (provento.dataCom.includes('/')) {
          const [d, m, a] = provento.dataCom.split('/');
          dataProvento = new Date(+a, +m - 1, +d);
        } else {
          dataProvento = new Date(provento.dataCom);
        }
      } else if (provento.data) {
        if (provento.data.includes('/')) {
          const [d, m, a] = provento.data.split('/');
          dataProvento = new Date(+a, +m - 1, +d);
        } else {
          dataProvento = new Date(provento.data);
        }
      } else {
        return false;
      }
      
      return dataProvento >= umAnoAtras && dataProvento <= hoje;
    });
    
    if (proventosUltimos12Meses.length === 0) {
      console.log(`❌ ${ticker}: Nenhum provento nos últimos 12 meses`);
      return '0,00%';
    }
    
    // Somar valores dos proventos
    const totalProventos = proventosUltimos12Meses.reduce((total: number, provento: any) => {
      const valor = typeof provento.valor === 'number' ? provento.valor : parseFloat(provento.valor?.toString().replace(',', '.') || '0');
      return total + (isNaN(valor) ? 0 : valor);
    }, 0);
    
    if (totalProventos <= 0) {
      return '0,00%';
    }
    
    // Calcular DY: (Total Proventos 12 meses / Preço Atual) * 100
    const dy = (totalProventos / precoAtual) * 100;
    
    return `${dy.toFixed(2).replace('.', ',')}%`;
    
  } catch (error) {
    console.error(`❌ Erro ao calcular DY para ${ticker}:`, error);
    return '0,00%';
  }
}

// 🚀 FUNÇÃO PARA FETCH COM HEADERS MOBILE-FRIENDLY
async function fetchWithMobileHeaders(url: string, isMobile: boolean, signal?: AbortSignal) {
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
  };

  if (isMobile) {
    // Headers específicos para mobile que podem ajudar com CORS
    headers['X-Requested-With'] = 'XMLHttpRequest';
    headers['User-Agent'] = 'Mozilla/5.0 (Mobile)';
  } else {
    headers['User-Agent'] = 'FIIs-Portfolio-App';
  }

  const controller = new AbortController();
  const timeout = isMobile ? 5000 : 8000; // Timeout menor para mobile
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: signal ?? controller.signal,
      mode: 'cors', // Explicitamente definir CORS
      credentials: 'omit' // Não enviar credentials para evitar problemas CORS
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// 🚀 HOOK CORRIGIDO PARA MOBILE
export function useFiisCotacoesBrapi() {
  const { dados } = useDataStore({ autoInit: true });
  const [fiis, setFiis] = useState<FII[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const isVisible = usePageVisibility();
  const controllerRef = useRef<AbortController | null>(null);

  // 📊 OBTER DADOS DA CARTEIRA FIIS DO DATASTORE
  const fiisData = dados.fiis || [];

  const fetchCotacoes = useCallback(async () => {
    // Cancelar request anterior se existir
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    // Criar novo controller
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      setErro(null);

      const isMobile = isMobileDevice();
      console.log(`🔥 [${isMobile ? 'MOBILE' : 'DESKTOP'}] BUSCANDO COTAÇÕES INTEGRADAS PARA FIIS`);
      console.log('📋 Ativos do DataStore:', fiisData);

      if (fiisData.length === 0) {
        console.log('⚠️ Nenhum FII encontrado no DataStore');
        setFiis([]);
        setLoading(false);
        return;
      }

      // Verifica se já fez uma requisição nos últimos 2 minutos
      const agora = new Date();
      if (ultimaAtualizacao && (agora.getTime() - ultimaAtualizacao.getTime()) < 2 * 60 * 1000) {
        console.log('⏰ Aguardando intervalo mínimo entre requisições...');
        setLoading(false);
        return;
      }

      // 🔑 TOKEN BRAPI FUNCIONANDO

      // 📋 EXTRAIR TODOS OS TICKERS
      const tickers = fiisData.map(fii => fii.ticker);
      console.log('🎯 Tickers para buscar:', tickers.join(', '));

      // 🔄 ESTRATÉGIA DIFERENTE PARA MOBILE E DESKTOP
      const cotacoesMap = new Map();
      let sucessosTotal = 0;
      let falhasTotal = 0;

      if (isMobile) {
        // 📱 ESTRATÉGIA MOBILE: Lotes menores, menos chamadas simultâneas
        console.log('📱 Usando estratégia MOBILE...');
        
        const LOTE_SIZE_MOBILE = 3; // Lotes ainda menores para mobile
        
        for (let i = 0; i < tickers.length; i += LOTE_SIZE_MOBILE) {
          const lote = tickers.slice(i, i + LOTE_SIZE_MOBILE);
          const tickersString = lote.join(',');
          
          const apiUrl = `/api/financial/quotes?symbols=${encodeURIComponent(tickersString)}`;
          
          console.log(`📱 Lote mobile ${Math.floor(i/LOTE_SIZE_MOBILE) + 1}: ${lote.join(', ')}`);

          try {
            const response = await fetchWithMobileHeaders(apiUrl, true, controller.signal);

            if (response.ok) {
              const apiData = await response.json();
              console.log(`📊 [MOBILE] Resposta para lote ${Math.floor(i/LOTE_SIZE_MOBILE) + 1}:`, apiData);

              const results = apiData.results ?? apiData.quotes ?? [];
              if (Array.isArray(results)) {
                results.forEach((quote: any) => {
                  if (quote.symbol && quote.regularMarketPrice && quote.regularMarketPrice > 0) {
                    cotacoesMap.set(quote.symbol, {
                      precoAtual: quote.regularMarketPrice,
                      variacao: quote.regularMarketChange || 0,
                      variacaoPercent: quote.regularMarketChangePercent || 0,
                      volume: quote.regularMarketVolume || 0,
                      nome: quote.shortName || quote.longName,
                      dadosCompletos: quote
                    });
                    sucessosTotal++;
                    console.log(`✅ [MOBILE] ${quote.symbol}: R$ ${quote.regularMarketPrice}`);
                  } else {
                    console.warn(`⚠️ [MOBILE] ${quote.symbol}: Dados inválidos`);
                    falhasTotal++;
                  }
                });
              }
            } else {
              console.error(`❌ [MOBILE] Erro HTTP ${response.status} para lote: ${lote.join(', ')}`);
              falhasTotal += lote.length;
            }
          } catch (loteError) {
            console.error(`❌ [MOBILE] Erro no lote ${lote.join(', ')}:`, loteError);
            falhasTotal += lote.length;
            
            // Se for erro CORS, parar tentativas
            if (loteError instanceof TypeError && loteError.message.includes('Failed to fetch')) {
              console.log('🚨 [MOBILE] CORS detectado, parando tentativas de API...');
              break;
            }
          }

          // DELAY maior entre requisições no mobile
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } else {
        // 🖥️ ESTRATÉGIA DESKTOP: Estratégia original
        console.log('🖥️ Usando estratégia DESKTOP...');
        
        const LOTE_SIZE = 5;
        
        for (let i = 0; i < tickers.length; i += LOTE_SIZE) {
          const lote = tickers.slice(i, i + LOTE_SIZE);
          const tickersString = lote.join(',');
          
          const apiUrl = `/api/financial/quotes?symbols=${encodeURIComponent(tickersString)}&range=1d&interval=1d&fundamental=true`;
          
          console.log(`🖥️ Lote desktop ${Math.floor(i/LOTE_SIZE) + 1}: ${lote.join(', ')}`);

          try {
            const response = await fetchWithMobileHeaders(apiUrl, false, controller.signal);

            if (response.ok) {
              const apiData = await response.json();
              console.log(`📊 [DESKTOP] Resposta para lote ${Math.floor(i/LOTE_SIZE) + 1}:`, apiData);

              const results = apiData.results ?? apiData.quotes ?? [];
              if (Array.isArray(results)) {
                results.forEach((quote: any) => {
                  if (quote.symbol && quote.regularMarketPrice && quote.regularMarketPrice > 0) {
                    cotacoesMap.set(quote.symbol, {
                      precoAtual: quote.regularMarketPrice,
                      variacao: quote.regularMarketChange || 0,
                      variacaoPercent: quote.regularMarketChangePercent || 0,
                      volume: quote.regularMarketVolume || 0,
                      nome: quote.shortName || quote.longName,
                      dadosCompletos: quote
                    });
                    sucessosTotal++;
                    console.log(`✅ [DESKTOP] ${quote.symbol}: R$ ${quote.regularMarketPrice}`);
                  } else {
                    console.warn(`⚠️ [DESKTOP] ${quote.symbol}: Dados inválidos`);
                    falhasTotal++;
                  }
                });
              }
            } else {
              console.error(`❌ [DESKTOP] Erro HTTP ${response.status} para lote: ${lote.join(', ')}`);
              falhasTotal += lote.length;
            }
          } catch (loteError) {
            console.error(`❌ [DESKTOP] Erro no lote ${lote.join(', ')}:`, loteError);
            falhasTotal += lote.length;
          }

          // DELAY menor para desktop
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      console.log(`✅ [${isMobile ? 'MOBILE' : 'DESKTOP'}] Total processado: ${sucessosTotal} sucessos, ${falhasTotal} falhas`);

      // 🔥 COMBINAR DADOS DO DATASTORE COM COTAÇÕES REAIS
      const ativosComCotacoes = fiisData.map((fii, index) => {
        const cotacao = cotacoesMap.get(fii.ticker);
        
        console.log(`\n🔄 Processando ${fii.ticker}:`);
        console.log(`💵 Preço entrada: R$ ${fii.precoEntrada}`);
        
        if (cotacao && cotacao.precoAtual > 0) {
          // 📊 PREÇO E PERFORMANCE REAIS
          const precoAtualNum = cotacao.precoAtual;
          const performance = ((precoAtualNum - fii.precoEntrada) / fii.precoEntrada) * 100;
          
          console.log(`💰 Preço atual: R$ ${precoAtualNum}`);
          console.log(`📈 Performance: ${performance.toFixed(2)}%`);
          
          // VALIDAR SE O PREÇO FAZ SENTIDO
          const diferencaPercent = Math.abs(performance);
          if (diferencaPercent > 500) {
            console.warn(`🚨 ${fii.ticker}: Preço suspeito! Diferença de ${diferencaPercent.toFixed(1)}% - usando preço de entrada`);
            return {
              ...fii,
              id: String(fii.id || index + 1),
              avatar: `https://www.ivalor.com.br/media/emp/logos/${fii.ticker.replace(/\d+$/, '')}.png`,
              precoAtual: `R$ ${fii.precoEntrada.toFixed(2).replace('.', ',')}`,
              precoEntrada: `R$ ${fii.precoEntrada.toFixed(2).replace('.', ',')}`,
              precoTeto: fii.precoTeto ? `R$ ${fii.precoTeto.toFixed(2).replace('.', ',')}` : undefined,
              performance: 0,
              variacao: 0,
              variacaoPercent: 0,
              volume: 0,
              vies: aplicarViesOverride(
                fii.viesOverride,
                calcularViesAutomatico(fii.precoTeto, `R$ ${fii.precoEntrada.toFixed(2).replace('.', ',')}`)
              ),
              dy: '0,00%',
              statusApi: 'suspicious_price',
              nomeCompleto: cotacao.nome
            };
          }
          
          const precoAtualFormatado = `R$ ${precoAtualNum.toFixed(2).replace('.', ',')}`;
          const precoEntradaFormatado = `R$ ${fii.precoEntrada.toFixed(2).replace('.', ',')}`;
          const precoTetoFormatado = fii.precoTeto ? `R$ ${fii.precoTeto.toFixed(2).replace('.', ',')}` : undefined;
          
          return {
            ...fii,
            id: String(fii.id || index + 1),
            avatar: `https://www.ivalor.com.br/media/emp/logos/${fii.ticker.replace(/\d+$/, '')}.png`,
            precoAtual: precoAtualFormatado,
            precoEntrada: precoEntradaFormatado,
            precoTeto: precoTetoFormatado,
            performance: performance,
            variacao: cotacao.variacao,
            variacaoPercent: cotacao.variacaoPercent,
            volume: cotacao.volume,
            vies: aplicarViesOverride(
              fii.viesOverride,
              calcularViesAutomatico(fii.precoTeto, precoAtualFormatado)
            ),
            dy: calcularDY12Meses(fii.ticker, precoAtualNum),
            statusApi: 'success',
            nomeCompleto: cotacao.nome
          };
        } else {
          // ⚠️ FALLBACK PARA FIIS SEM COTAÇÃO
          console.warn(`⚠️ ${fii.ticker}: Sem cotação válida, usando preço de entrada`);
          
          const precoEntradaFormatado = `R$ ${fii.precoEntrada.toFixed(2).replace('.', ',')}`;
          const precoTetoFormatado = fii.precoTeto ? `R$ ${fii.precoTeto.toFixed(2).replace('.', ',')}` : undefined;
          
          return {
            ...fii,
            id: String(fii.id || index + 1),
            avatar: `https://www.ivalor.com.br/media/emp/logos/${fii.ticker.replace(/\d+$/, '')}.png`,
            precoAtual: precoEntradaFormatado,
            precoEntrada: precoEntradaFormatado,
            precoTeto: precoTetoFormatado,
            performance: 0,
            variacao: 0,
            variacaoPercent: 0,
            volume: 0,
            vies: aplicarViesOverride(
              fii.viesOverride,
              calcularViesAutomatico(fii.precoTeto, precoEntradaFormatado)
            ),
            dy: calcularDY12Meses(fii.ticker, fii.precoEntrada),
            statusApi: 'not_found',
            nomeCompleto: 'N/A'
          };
        }
      });

      // 📊 ESTATÍSTICAS FINAIS
      const sucessos = ativosComCotacoes.filter(a => a.statusApi === 'success').length;
      const suspeitos = ativosComCotacoes.filter(a => a.statusApi === 'suspicious_price').length;
      const naoEncontrados = ativosComCotacoes.filter(a => a.statusApi === 'not_found').length;
      
      console.log(`\n📊 [${isMobile ? 'MOBILE' : 'DESKTOP'}] ESTATÍSTICAS FINAIS:`);
      console.log(`✅ Sucessos: ${sucessos}/${ativosComCotacoes.length}`);
      console.log(`🚨 Preços suspeitos: ${suspeitos}/${ativosComCotacoes.length}`);
      console.log(`❌ Não encontrados: ${naoEncontrados}/${ativosComCotacoes.length}`);

      setFiis(ativosComCotacoes);
      setUltimaAtualizacao(new Date());

      // ⚠️ ALERTAR SOBRE QUALIDADE DOS DADOS
      if (sucessos === 0 && isMobile) {
        setErro(`CORS bloqueou APIs no mobile. Usando dados locais.`);
      } else if (sucessos < ativosComCotacoes.length / 2) {
        setErro(`Apenas ${sucessos} de ${ativosComCotacoes.length} FIIs com cotação válida`);
      } else if (suspeitos > 0) {
        setErro(`${suspeitos} FIIs com preços suspeitos foram ignorados`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setErro(errorMessage);
      console.error('❌ Erro geral ao buscar cotações:', err);
      
      // 🔄 FALLBACK: USAR DADOS DO DATASTORE SEM COTAÇÕES
      console.log('🔄 Usando fallback com dados do DataStore...');
      const ativosFallback = fiisData.map((fii, index) => ({
        ...fii,
        id: String(fii.id || index + 1),
        avatar: `https://www.ivalor.com.br/media/emp/logos/${fii.ticker.replace(/\d+$/, '')}.png`,
        precoAtual: `R$ ${fii.precoEntrada.toFixed(2).replace('.', ',')}`,
        precoEntrada: `R$ ${fii.precoEntrada.toFixed(2).replace('.', ',')}`,
        precoTeto: fii.precoTeto ? `R$ ${fii.precoTeto.toFixed(2).replace('.', ',')}` : undefined,
        performance: 0,
        variacao: 0,
        variacaoPercent: 0,
        volume: 0,
        vies: aplicarViesOverride(
          fii.viesOverride,
          calcularViesAutomatico(fii.precoTeto, `R$ ${fii.precoEntrada.toFixed(2).replace('.', ',')}`)
        ),
        dy: calcularDY12Meses(fii.ticker, fii.precoEntrada),
        statusApi: 'error',
        nomeCompleto: 'Erro'
      }));
      setFiis(ativosFallback);
    } finally {
      setLoading(false);
    }
  }, [fiisData, ultimaAtualizacao]);

  // 🔄 EXECUTAR QUANDO OS DADOS DO DATASTORE MUDAREM
  useEffect(() => {
    console.log('🔄 EFFECT DISPARADO - DADOS DO DATASTORE MUDARAM');
    console.log('📊 FIIs data length:', dados.fiis?.length || 0);

    const timeout = setTimeout(() => {
      if (fiisData.length > 0) {
        fetchCotacoes();
      } else {
        setLoading(false);
        setFiis([]);
      }
    }, 300); // debounce de 300ms

    return () => clearTimeout(timeout);
  }, [dados.fiis?.length, fetchCotacoes]);

  // ATUALIZAR COTAÇÕES A CADA 15 MINUTOS
  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const interval = setInterval(() => {
      const agora = new Date();
      const hora = agora.getHours();
      const diaSemana = agora.getDay();
      
      // Segunda a sexta, das 10h às 17h (horário comercial)
      if (diaSemana >= 1 && diaSemana <= 5 && hora >= 10 && hora <= 17 && fiisData.length > 0) {
        console.log('🔄 Auto-atualizando carteira de FIIs...');
        fetchCotacoes();
      }
    }, 15 * 60 * 1000); // 15 minutos

    return () => {
      clearInterval(interval);
      controllerRef.current?.abort(); // Cancelar ao desmontar
    };
  }, [fetchCotacoes, fiisData.length, isVisible]);

  return { 
    fiis, 
    loading, 
    erro, 
    refetch: fetchCotacoes 
  };
}
