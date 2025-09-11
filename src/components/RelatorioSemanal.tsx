'use client';

import React, { useState, useEffect } from 'react';

console.log('🟢 [DEBUG] Arquivo RelatorioSemanal.tsx carregado');

// Interfaces
interface MacroNews {
  id: string;
  title: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  sectors: string[];
  recommendations: string[];
}

interface DividendoInfo {
  id: string;
  ticker: string;
  company: string;
  type: 'JCP' | 'Dividendo';
  value: string;
  dy: string;
  exDate: string;
  payDate: string;
  status: 'confirmed' | 'announced';
}

interface StockNews {
  id: string;
  ticker: string;
  company: string;
  news: string;
  impact: 'positive' | 'negative' | 'neutral';
  highlight: string;
  recommendation: string;
}

interface RelatorioData {
  id?: string;
  date: string;
  weekOf: string;
  macro: MacroNews[];
  proventos: DividendoInfo[];
  dividendos: StockNews[];
  smallCaps: StockNews[];
  microCaps: StockNews[];
  exterior: StockNews[];
  status: 'draft' | 'published';
}

console.log('🟢 [DEBUG] Interfaces definidas');

// ✅ COMPONENTE PRINCIPAL COM DEBUG
function AdminRelatorioSemanal() {
  console.log('🟢 [DEBUG] AdminRelatorioSemanal função iniciada');
  
  const [relatorio, setRelatorio] = useState<RelatorioData>({
    date: new Date().toISOString().split('T')[0],
    weekOf: `Semana de ${new Date().toLocaleDateString('pt-BR')}`,
    macro: [],
    proventos: [],
    dividendos: [],
    smallCaps: [],
    microCaps: [],
    exterior: [],
    status: 'draft'
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🟢 [DEBUG] Estados inicializados:', { relatorio, saving, saved, error });

  // 📚 CARREGAR RELATÓRIO EXISTENTE
  useEffect(() => {
    console.log('🟢 [DEBUG] useEffect executado');
    
    const loadRelatorio = async () => {
      try {
        console.log('🔄 [DEBUG] Iniciando carregamento do relatório...');
        
        const response = await fetch('/api/relatorio-semanal');
        console.log('📡 [DEBUG] Response recebida:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📄 [DEBUG] Dados JSON recebidos:', data);
          console.log('📄 [DEBUG] Tipo dos dados:', typeof data);
          console.log('📄 [DEBUG] Possui ID?', !!data?.id);
          
          if (data && data.id) {
            console.log('✅ [DEBUG] Setando relatório no estado');
            setRelatorio(data);
          } else {
            console.log('ℹ️ [DEBUG] Nenhum relatório encontrado ou sem ID');
          }
        } else {
          console.warn('⚠️ [DEBUG] Response não ok:', response.status, response.statusText);
          const errorText = await response.text();
          console.warn('⚠️ [DEBUG] Texto do erro:', errorText);
        }
      } catch (error) {
        console.error('❌ [DEBUG] Erro no fetch:', error);
        console.error('❌ [DEBUG] Stack trace:', error instanceof Error ? error.stack : 'Sem stack');
        setError('Erro ao carregar relatório: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      }
    };
    
    loadRelatorio();
  }, []);

  // 💾 SALVAR RELATÓRIO
  const saveRelatorio = async () => {
    console.log('💾 [DEBUG] Iniciando salvamento...');
    setSaving(true);
    setError(null);
    
    try {
      const method = relatorio.id ? 'PUT' : 'POST';
      
      console.log('📤 [DEBUG] Preparando requisição:', {
        method,
        url: '/api/relatorio-semanal',
        headers: {
          'Content-Type': 'application/json'
        },
        bodySize: JSON.stringify(relatorio).length
      });
      
      const response = await fetch('/api/relatorio-semanal', {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(relatorio)
      });
      
      console.log('📡 [DEBUG] Response do salvamento:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('❌ [DEBUG] Erro na resposta:', errorData);
        throw new Error(errorData.error || `Erro ${response.status}`);
      }
      
      const savedRelatorio = await response.json();
      console.log('✅ [DEBUG] Relatório salvo com sucesso:', savedRelatorio);
      
      setRelatorio(savedRelatorio);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro no salvamento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(`Erro ao salvar: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // 📤 PUBLICAR RELATÓRIO
  const publishRelatorio = async () => {
    console.log('📤 [DEBUG] Iniciando publicação...');
    setSaving(true);
    setError(null);
    
    try {
      const publishedReport = { ...relatorio, status: 'published' as const };

      console.log('📤 [DEBUG] Dados para publicação:', publishedReport);
      
      const response = await fetch('/api/relatorio-semanal', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(publishedReport)
      });
      
      console.log('📡 [DEBUG] Response da publicação:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('❌ [DEBUG] Erro na publicação:', errorData);
        throw new Error(errorData.error || 'Erro ao publicar');
      }
      
      const savedRelatorio = await response.json();
      console.log('✅ [DEBUG] Relatório publicado:', savedRelatorio);
      setRelatorio(savedRelatorio);
      alert('✅ Relatório publicado com sucesso!');
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro na publicação:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(`Erro ao publicar: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  console.log('🟢 [DEBUG] Renderizando componente...');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#1f2937', marginBottom: '10px' }}>🟢 Admin - Relatório Semanal (DEBUG MODE)</h1>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>Componente carregado e funcionando! Verifique o console para logs detalhados.</p>
        
        {/* DEBUG INFO */}
        <div style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '15px', 
          borderRadius: '6px', 
          marginBottom: '20px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <strong>🔍 Estado Atual:</strong><br/>
          • ID do Relatório: {relatorio.id || 'Não definido'}<br/>
          • Status: {relatorio.status}<br/>
          • Data: {relatorio.date}<br/>
          • Salvando: {saving ? 'Sim' : 'Não'}<br/>
          • Erro: {error || 'Nenhum'}<br/>
          • Itens Macro: {relatorio.macro.length}<br/>
          • Itens Proventos: {relatorio.proventos.length}
        </div>
        
        {error && (
          <div style={{ 
            color: '#dc2626', 
            padding: '12px', 
            border: '1px solid #fca5a5', 
            borderRadius: '6px', 
            backgroundColor: '#fef2f2',
            marginBottom: '20px' 
          }}>
            ❌ {error}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button 
            onClick={() => {
              console.log('🔄 [DEBUG] Botão salvar clicado');
              saveRelatorio();
            }} 
            disabled={saving}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: saving ? '#94a3b8' : '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {saving ? '⏳ Salvando...' : '💾 Salvar Rascunho'}
          </button>
          
          <button 
            onClick={() => {
              console.log('📤 [DEBUG] Botão publicar clicado');
              publishRelatorio();
            }} 
            disabled={saving}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: saving ? '#94a3b8' : '#059669', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {saving ? '⏳ Publicando...' : '📤 Publicar'}
          </button>
          
          <button 
            onClick={() => {
              console.log('🧪 [DEBUG] Teste de console');
              console.log('🧪 [DEBUG] Estado atual completo:', {
                relatorio,
                saving,
                saved,
                error,
                timestamp: new Date().toISOString()
              });
            }}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: '#7c3aed', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🧪 Debug Console
          </button>
        </div>
        
        {saved && (
          <div style={{ 
            color: '#059669', 
            padding: '12px',
            backgroundColor: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            marginTop: '10px'
          }}>
            ✅ Salvo com sucesso! (Auto-hide em 3s)
          </div>
        )}
        
        {/* NETWORK DEBUG */}
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#374151', marginBottom: '15px' }}>🌐 Teste de Rede</h3>
          <button
            onClick={async () => {
              console.log('🌐 [DEBUG] Testando conectividade...');
              try {
                const response = await fetch('/api/relatorio-semanal');
                console.log('🌐 [DEBUG] Teste GET:', response.status);
                const data = await response.json();
                console.log('🌐 [DEBUG] Dados:', data);
              } catch (error) {
                console.error('🌐 [DEBUG] Erro no teste:', error);
              }
            }}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#f59e0b', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🧪 Testar API
          </button>
        </div>
      </div>
    </div>
  );
}

console.log('🟢 [DEBUG] Função AdminRelatorioSemanal definida');

// ✅ EXPORTS COM DEBUG
console.log('🟢 [DEBUG] Definindo exports...');

export default AdminRelatorioSemanal;
export { AdminRelatorioSemanal };
export const RelatorioSemanal = AdminRelatorioSemanal;

console.log('🟢 [DEBUG] Exports definidos - arquivo completo!');