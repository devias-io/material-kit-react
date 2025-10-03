import { useState, useCallback, useEffect } from 'react';

// 🔥 HOOK PARA BUSCAR COTAÇÃO COMPLETA COM ESTRATÉGIA MOBILE/DESKTOP
export function useCotacaoCompleta(ticker: string, ehBDREstrangeiro: boolean = false) {
  const [cotacaoCompleta, setCotacaoCompleta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Detecção de dispositivo
  const [isMobile, setIsMobile] = useState(false);
  const [deviceDetected, setDeviceDetected] = useState(false);

  // Detectar dispositivo
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const mobile = width <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      setDeviceDetected(true);
      console.log('📱 Cotação - Dispositivo detectado:', { width, isMobile: mobile, deviceDetected: true });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const buscarCotacaoCompleta = useCallback(async () => {
    if (!ticker) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      const BRAPI_TOKEN = 'jJrMYVy9MATGEicx3GxBp8';
      let cotacaoObtida = false;
      let cotacaoData: any = null;
      
      console.log(`🔍 Buscando cotação para ${ticker}:`, { isMobile, deviceDetected });

      const executarTentativa = async (
        descricao: string,
        url: string,
        init?: RequestInit
      ) => {
        try {
          console.log(`${descricao}`);
          const response = await fetch(url, init);

          if (!response.ok) {
            console.log(`${descricao} - resposta não OK:`, response.status);
            return;
          }

          const data = await response.json();
          if (data.results?.[0]?.regularMarketPrice > 0) {
            cotacaoData = data.results[0];
            cotacaoObtida = true;
            console.log(`${descricao} ✅`);
          } else {
            console.log(`${descricao} - dados inválidos`);
          }
        } catch (error: any) {
          console.log(`${descricao} ❌:`, error?.message || error);
        }
      };

      const baseUrl = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}`;

      const tentativasMobile = [
        {
          descricao: `📱🔄 ${ticker}: Tentativa 1 - User-Agent Desktop`,
          url: baseUrl,
          init: {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache'
            }
          } as RequestInit
        },
        {
          descricao: `📱🔄 ${ticker}: Tentativa 2 - Sem User-Agent`,
          url: baseUrl,
          init: {
            method: 'GET',
            headers: {
              Accept: 'application/json'
            }
          } as RequestInit
        },
        {
          descricao: `📱🔄 ${ticker}: Tentativa 3 - URL simplificada`,
          url: `${baseUrl}&range=1d`,
          init: {
            method: 'GET',
            mode: 'cors'
          } as RequestInit
        }
      ];

      const tentativasDesktop = [
        {
          descricao: `🖥️🔄 ${ticker}: Tentativa 1 - Sem User-Agent`,
          url: baseUrl,
          init: {
            method: 'GET',
            headers: {
              Accept: 'application/json'
            }
          } as RequestInit
        },
        {
          descricao: `🖥️🔄 ${ticker}: Tentativa 2 - URL simplificada`,
          url: `${baseUrl}&range=1d`,
          init: {
            method: 'GET',
            mode: 'cors'
          } as RequestInit
        }
      ];

      const tentativas = isMobile ? tentativasMobile : tentativasDesktop;

      for (const tentativa of tentativas) {
        if (cotacaoObtida) {
          break;
        }

        await executarTentativa(tentativa.descricao, tentativa.url, tentativa.init);
      }

      // ✅ PROCESSAR RESULTADO
      if (cotacaoObtida && cotacaoData) {
        const parseNumero = (valor: any) => {
          if (typeof valor === 'number' && !Number.isNaN(valor)) {
            return valor;
          }

          if (typeof valor === 'string') {
            const convertido = Number(valor);
            if (!Number.isNaN(convertido)) {
              return convertido;
            }
          }

          return undefined;
        };

        const calcularVariacaoPercentual = (dados: any) => {
          const variacaoPercentual = parseNumero(dados?.regularMarketChangePercent);
          if (variacaoPercentual !== undefined) {
            return variacaoPercentual;
          }

          const variacao = parseNumero(dados?.regularMarketChange);
          const precoAtual = parseNumero(dados?.regularMarketPrice);

          if (variacao !== undefined && precoAtual !== undefined) {
            const precoAnterior = precoAtual - variacao;
            if (precoAnterior) {
              return (variacao / precoAnterior) * 100;
            }
          }

          return 0;
        };

        const cotacaoAtivo = {
          regularMarketPrice: parseNumero(cotacaoData.regularMarketPrice) ?? 0,
          regularMarketChange: parseNumero(cotacaoData.regularMarketChange) ?? 0,
          regularMarketChangePercent: calcularVariacaoPercentual(cotacaoData),
          regularMarketVolume: parseNumero(cotacaoData.regularMarketVolume) ?? 0,
          shortName: cotacaoData.shortName || cotacaoData.longName,
          dadosCompletos: cotacaoData,
          isBDREstrangeiro: ehBDREstrangeiro
        };
        
        setCotacaoCompleta(cotacaoAtivo);
        console.log(`✅ Cotação ${ticker} salva:`, cotacaoAtivo.regularMarketPrice);
      } else {
        console.log(`❌ Falha ao obter cotação para ${ticker}`);
        throw new Error('Cotação não encontrada');
      }
      
    } catch (err: any) {
      console.error(`❌ Erro geral ao buscar cotação para ${ticker}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ticker, isMobile, deviceDetected, ehBDREstrangeiro]);

  // Executar busca quando dispositivo for detectado
  useEffect(() => {
    if (deviceDetected) {
      console.log('🔥 Cotação: Executando busca após detecção de dispositivo:', { isMobile, deviceDetected });
      buscarCotacaoCompleta();
    }
  }, [buscarCotacaoCompleta, deviceDetected, isMobile]);

  return {
    cotacaoCompleta,
    loading,
    error,
    refetch: buscarCotacaoCompleta,
    isMobile,
    deviceDetected
  };
}