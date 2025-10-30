import { useState, useEffect, useCallback } from 'react';
import { fetchDividendYieldIntegrado } from '@/utils/fetchDividendYieldIntegrado';

// 🔥 HOOK INTEGRADO PARA DY - EXTRAÍDO DO CÓDIGO ORIGINAL
export function useDividendYieldIntegrado(ticker: string) {
  const [dyData, setDyData] = useState<{
    dy12Meses: number;
    dyFormatado: string;
    fonte: string;
  }>({
    dy12Meses: 0,
    dyFormatado: '0,00%',
    fonte: 'indisponível'
  });
  const [loading, setLoading] = useState(true);

  // 🔥 DETECTAR DISPOSITIVO COM ESTADO DE DETECÇÃO COMPLETA
  const [isMobile, setIsMobile] = useState(false);
  const [deviceDetected, setDeviceDetected] = useState(false);

  // 🔥 DETECÇÃO DE DISPOSITIVO
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const mobile = width <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      setDeviceDetected(true);
      console.log('📱 DY - Dispositivo detectado:', { width, isMobile: mobile, deviceDetected: true });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const fetchDY = useCallback(async () => {
    if (!ticker) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`📈 Buscando DY para ${ticker} usando estratégia mobile-first...`);
      console.log('📱 Device Info:', { isMobile, deviceDetected });

      const resultado = await fetchDividendYieldIntegrado(ticker, isMobile);

      setDyData({
        dy12Meses: resultado.dy12Meses,
        dyFormatado: resultado.dyFormatado,
        fonte: resultado.fonte
      });

      console.log(`✅ DY FINAL ${ticker}:`, {
        valor: resultado.dy12Meses,
        formatado: resultado.dyFormatado,
        fonte: resultado.fonte,
        dispositivo: isMobile ? 'mobile' : 'desktop'
      });
    } catch (error) {
      console.error(`❌ Erro geral ao buscar DY para ${ticker}:`, error);
      setDyData({
        dy12Meses: 0,
        dyFormatado: '0,00%',
        fonte: 'erro'
      });
    } finally {
      setLoading(false);
    }
  }, [ticker, isMobile, deviceDetected]);

  // ✅ USEEFFECT CORRIGIDO: Aguarda detecção E re-executa quando isMobile muda
  useEffect(() => {
    if (deviceDetected) {
      console.log('🔥 DY: Executando busca após detecção de dispositivo:', { isMobile, deviceDetected });
      fetchDY();
    }
  }, [fetchDY, deviceDetected, isMobile]);

  return {
    dy12Meses: dyData.dy12Meses,
    dyFormatado: dyData.dyFormatado,
    loading,
    fonte: dyData.fonte,
    refetch: fetchDY,
    isMobile,
    deviceDetected
  };
}
