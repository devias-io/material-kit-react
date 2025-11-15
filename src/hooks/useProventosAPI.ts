// /src/hooks/useProventosAPI.ts
// 🌐 HOOK PARA INTEGRAÇÃO COM API CENTRALIZADA DE PROVENTOS

import { useState, useEffect, useCallback } from 'react';

// 📊 TIPOS DE DADOS
interface Provento {
  id: string;
  ticker: string;
  valor: number;
  tipo: string;
  data: string;
  dataObj: Date;
  dataFormatada: string;
  valorFormatado: string;
  dividendYield?: number;
  fonte?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EstatisticasProventos {
  totalEmpresas: number;
  totalProventos: number;
  valorTotal: number;
  dataUltimoUpload: string;
}

interface UploadMetadata {
  nomeArquivo?: string;
  tamanhoArquivo?: number;
  totalLinhas?: number;
  linhasProcessadas?: number;
  linhasComErro?: number;
  origem?: 'arquivo' | 'texto';
}

// 🔥 FUNÇÃO PRINCIPAL - CALCULAR PROVENTOS VIA API
export async function calcularProventosAtivoAPI(
  ticker: string, 
  dataEntrada: string
): Promise<number> {
  try {
    console.log(`🌐 [API] Calculando proventos para ${ticker} desde ${dataEntrada}`);
    
    // 📅 CONVERTER DATA DE ENTRADA PARA FILTRO
    const [dia, mes, ano] = dataEntrada.split('/');
    const dataEntradaObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    
    // 🔍 BUSCAR PROVENTOS DO TICKER VIA API
    const response = await fetch(`/api/proventos/${ticker.toUpperCase()}`);
    
    if (!response.ok) {
      console.error(`❌ [API] Erro ${response.status} para ${ticker}`);
      return 0;
    }
    
    const proventos: Provento[] = await response.json();
    console.log(`📊 [API] ${ticker}: ${proventos.length} proventos encontrados`);
    
    // 💰 FILTRAR E SOMAR PROVENTOS POSTERIORES À DATA DE ENTRADA
    const proventosFiltrados = proventos.filter(provento => {
      const dataProvento = new Date(provento.dataObj);
      return dataProvento >= dataEntradaObj;
    });
    
    const totalProventos = proventosFiltrados.reduce((total, provento) => {
      return total + provento.valor;
    }, 0);
    
    console.log(`✅ [API] ${ticker}: R$ ${totalProventos.toFixed(2)} em proventos desde ${dataEntrada}`);
    return totalProventos;
    
  } catch (error) {
    console.error(`❌ [API] Erro ao calcular proventos de ${ticker}:`, error);
    return 0;
  }
}

// 📊 HOOK PARA ESTATÍSTICAS GERAIS (NOME ORIGINAL)
export function useEstatisticasProventos() {
  const [stats, setStats] = useState<EstatisticasProventos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/proventos/estatisticas');
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  
  return { stats, loading, error, refetch: fetchStats };
}

// 📊 HOOK PARA ESTATÍSTICAS GERAIS (NOME PARA PÁGINA)
export function useProventosEstatisticas() {
  const [estatisticas, setEstatisticas] = useState<EstatisticasProventos>({
    totalEmpresas: 0,
    totalProventos: 0,
    valorTotal: 0,
    dataUltimoUpload: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const carregarEstatisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/proventos/estatisticas');
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
      const data = await response.json();
      setEstatisticas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    carregarEstatisticas();
  }, [carregarEstatisticas]);
  
  return { 
    estatisticas, 
    loading, 
    error, 
    carregarEstatisticas 
  };
}

// 📋 HOOK PARA LISTAR TODOS OS PROVENTOS
export function useListarProventos() {
  const [proventos, setProventos] = useState<Provento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProventos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/proventos');
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
      const data = await response.json();
      setProventos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchProventos();
  }, [fetchProventos]);
  
  return { proventos, loading, error, refetch: fetchProventos };
}

// 🎯 HOOK PARA PROVENTOS DE UM TICKER ESPECÍFICO
export function useProventosTicker(ticker: string) {
  const [proventos, setProventos] = useState<Provento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProventosTicker = useCallback(async () => {
    if (!ticker) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/proventos/${ticker.toUpperCase()}`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
      const data = await response.json();
      setProventos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [ticker]);
  
  useEffect(() => {
    fetchProventosTicker();
  }, [fetchProventosTicker]);
  
  return { proventos, loading, error, refetch: fetchProventosTicker };
}

// 📤 HOOK PARA UPLOAD DE PROVENTOS (NOME ORIGINAL)
export function useUploadProventos() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const uploadProventos = useCallback(async (proventos: any[]) => {
    try {
      setUploading(true);
      setError(null);
      
      const response = await fetch('/api/proventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proventos })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Upload concluído:', result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro no upload';
      setError(errorMsg);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);
  
  return { uploadProventos, uploading, error };
}

// 📤 HOOK PARA UPLOAD DE PROVENTOS (NOME PARA PÁGINA)
export function useProventosUpload() {
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const uploadProventos = useCallback(async (proventos: any[], metadata?: UploadMetadata) => {
    try {
      setLoading(true);
      setProgresso(0);
      setError(null);
      
      // Simular progresso
      const interval = setInterval(() => {
        setProgresso(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const response = await fetch('/api/proventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          proventos,
          metadata 
        })
      });
      
      clearInterval(interval);
      setProgresso(100);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Upload concluído:', result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro no upload';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
      setTimeout(() => setProgresso(0), 1000);
    }
  }, []);
  
  const limparTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/proventos', {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Dados limpos:', result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao limpar dados';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { 
    uploadProventos, 
    limparTodos,
    loading, 
    progresso,
    error 
  };
}

// 📥 HOOK PARA EXPORTAR PROVENTOS (NOVO)
export function useProventosExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const exportarDados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar todos os proventos
      const response = await fetch('/api/proventos');
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
      const proventos = await response.json();
      
      // Converter para CSV
      const headers = ['ticker', 'valor', 'data', 'tipo', 'dataFormatada', 'valorFormatado'];
      const csvContent = [
        headers.join(','),
        ...proventos.map((p: any) => [
          p.ticker,
          p.valor.toString().replace('.', ','),
          p.data,
          p.tipo,
          p.dataFormatada,
          p.valorFormatado
        ].join(','))
      ].join('\n');
      
      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `proventos_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Export concluído');
      return { success: true, total: proventos.length };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro no export';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { 
    exportarDados, 
    loading, 
    error 
  };
}

// 🔄 FUNÇÃO PARA MIGRAÇÃO DO LOCALSTORAGE
export async function migrarLocalStorageParaAPI() {
  try {
    console.log('🔄 Iniciando migração do localStorage para API...');
    
    // 📊 BUSCAR DADOS DO LOCALSTORAGE
    const masterData = localStorage.getItem('proventos_central_master');
    if (!masterData) {
      console.log('ℹ️ Nenhum dado encontrado no localStorage');
      return { success: true, message: 'Nenhum dado para migrar' };
    }
    
    const proventos = JSON.parse(masterData);
    console.log(`📊 Encontrados ${proventos.length} proventos no localStorage`);
    
    // 📤 ENVIAR PARA API
    const response = await fetch('/api/proventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        proventos: proventos.map(p => ({
          ticker: p.ticker,
          valor: p.valor,
          tipo: p.tipo || 'dividendo',
          data: p.data,
          dataObj: p.dataObj,
          dataFormatada: p.dataFormatada,
          valorFormatado: p.valorFormatado,
          dividendYield: p.dividendYield
        }))
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Migração concluída:', result);
    
    // 🗑️ OPCIONAL: LIMPAR LOCALSTORAGE APÓS MIGRAÇÃO
    // localStorage.removeItem('proventos_central_master');
    
    return { success: true, ...result };
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    return { success: false, error: error.message };
  }
}

// 🧪 FUNÇÃO DE TESTE DA API
export async function testarConectividadeAPI(): Promise<boolean> {
  try {
    const response = await fetch('/api/proventos/estatisticas');
    return response.ok;
  } catch {
    return false;
  }
}