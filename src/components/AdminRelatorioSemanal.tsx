'use client';

import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Calendar, DollarSign, Building, Globe, Zap, Bell, Plus, Trash2, Save, Eye, AlertCircle, CheckCircle, BarChart3, Users, Clock, FileText, Target, Briefcase, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link, Palette, ExternalLink, PieChart, Activity, Image, Upload, Edit, Archive, Search, Filter, LineChart, Coins, ToggleLeft, ToggleRight, TrendingDown as TrendingDownIcon } from 'lucide-react';
import { useAuthAccess } from '@/hooks/use-auth-access';

// Interface unificada para item de relatório (notícia ou provento)
interface ItemRelatorioSemanal {
  // Campos comuns
  ticker: string;
  empresa: string;
  
  // Identificador de tipo
  isProvento?: boolean;
  
  // Campos para notícias/análises
  titulo?: string;
  resumo?: string;
  analise?: string;
  recomendacao?: 'COMPRA' | 'VENDA' | 'MANTER';
  impacto?: 'positivo' | 'negativo' | 'neutro';
  precoAlvo?: number;
  destaque?: string;
  
  // 🆕 Análise Trimestral Vinculada
  temAnaliseTrismestral?: boolean;
  analiseTrismestralId?: string;
  analiseTrismestralTicker?: string;
  analiseTrismestralTitulo?: string;
  analiseTrismestralTrimestre?: string;
  
  // Campos para proventos
  tipoProvento?: 'Dividendo' | 'JCP' | 'Bonificação';
  valor?: string;
  dy?: string;
  datacom?: string;
  pagamento?: string;
}

interface RelatorioSemanalData {
  id?: string;
  semana: string;
  dataPublicacao: string;
  titulo: string;
  authorId: string; // ADICIONAR
  autor?: string;   // ADICIONAR
  
  // Seções do relatório - SEM PROVENTOS SEPARADOS
  macro: ItemRelatorioSemanal[];
  dividendos: ItemRelatorioSemanal[];
  smallCaps: ItemRelatorioSemanal[];
  microCaps: ItemRelatorioSemanal[];
  
  // Internacional separado
  exteriorStocks: ItemRelatorioSemanal[];
  exteriorETFs: ItemRelatorioSemanal[];
  exteriorDividendos: ItemRelatorioSemanal[];
  exteriorProjetoAmerica: ItemRelatorioSemanal[];
  
  status: 'draft' | 'published';
  createdAt?: DateTime; // ADICIONAR
  updatedAt?: DateTime; // ADICIONAR

}

// Rich Text Editor Component (mantém igual)
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Digite seu texto...",
  style = {},
  minHeight = "120px"
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [currentFormat, setCurrentFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false
  });

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const updateFormatState = useCallback(() => {
    if (!editorRef.current) return;
    
    setCurrentFormat({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough')
    });
  }, []);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateFormatState();
    
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange, updateFormatState]);

  const insertLink = useCallback(() => {
    const url = prompt('Digite a URL do link:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

const insertImage = useCallback(() => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        
        // Criar elemento img com estilos
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '8px';
        img.style.margin = '8px 0';
        
        // Inserir no editor
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(img);
          range.collapse(false);
        }
        
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  input.click();
}, [execCommand, onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateFormatState();
  }, [onChange, updateFormatState]);

  const handleFocus = useCallback(() => {
    setIsEditorFocused(true);
    updateFormatState();
  }, [updateFormatState]);

  const handleBlur = useCallback(() => {
    setIsEditorFocused(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  }, [execCommand]);

  return (
    <div style={{
      border: `2px solid ${isEditorFocused ? '#2563eb' : '#e5e7eb'}`,
      borderRadius: '12px',
      backgroundColor: 'white',
      transition: 'border-color 0.2s',
      ...style
    }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: '12px 12px 0 0'
      }}>
        <button
          onClick={() => execCommand('bold')}
          style={{
            padding: '6px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: currentFormat.bold ? '#2563eb' : 'transparent',
            color: currentFormat.bold ? 'white' : '#6b7280',
            cursor: 'pointer'
          }}
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => execCommand('italic')}
          style={{
            padding: '6px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: currentFormat.italic ? '#2563eb' : 'transparent',
            color: currentFormat.italic ? 'white' : '#6b7280',
            cursor: 'pointer'
          }}
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => execCommand('insertUnorderedList')}
          style={{
            padding: '6px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            cursor: 'pointer'
          }}
        >
          <List size={14} />
        </button>
        <button
          onClick={insertLink}
          style={{
            padding: '6px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            cursor: 'pointer'
          }}
        >
          <Link size={14} />
        </button>

<button
  onClick={insertImage}
  style={{
    padding: '6px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    cursor: 'pointer'
  }}
>
  <Image size={14} />
</button>

      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          padding: '12px',
          minHeight: minHeight,
          outline: 'none',
          lineHeight: '1.5',
          fontSize: '14px',
          color: '#1f2937',
          borderRadius: '0 0 12px 12px'
        }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

// Utilitário para gerar número da semana
const getWeekNumber = (date: Date): string => {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNumber = Math.ceil(diff / oneWeek);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
};

// 🆕 COMPONENTE UNIFICADO PARA CRIAR ITEM (NOTÍCIA OU PROVENTO)
const ItemEditor = memo(({ 
  item, 
  onUpdate, 
  onRemove,
  secaoNome 
}: { 
  item: ItemRelatorioSemanal;
  onUpdate: (item: ItemRelatorioSemanal) => void;
  onRemove: () => void;
  secaoNome: string;
}) => {
  const isProvento = item.isProvento || false;
  
  // 🆕 Estado para análises trimestrais
  const [analisesDisponiveis, setAnalisesDisponiveis] = useState<any[]>([]);
  const [carregandoAnalises, setCarregandoAnalises] = useState(false);
  const [errorAnalises, setErrorAnalises] = useState<string | null>(null);

  // 🆕 Carregar análises trimestrais da API
  const carregarAnalisesTrimestrais = useCallback(async () => {
    if (carregandoAnalises || analisesDisponiveis.length > 0) return;
    
    setCarregandoAnalises(true);
    setErrorAnalises(null);
    
    try {
      console.log('🔍 Buscando análises trimestrais para seleção...');
      const response = await fetch('/api/analises-trimestrais');
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const todasAnalises = await response.json();
      
      // Filtrar apenas análises publicadas e ordenar
      const analisesPublicadas = todasAnalises
        .filter((analise: any) => analise.status === 'published')
        .sort((a: any, b: any) => {
          // Ordenar por ticker primeiro, depois por trimestre
          if (a.ticker !== b.ticker) {
            return a.ticker.localeCompare(b.ticker);
          }
          return b.trimestre.localeCompare(a.trimestre); // Mais recente primeiro
        });
      
      console.log(`✅ ${analisesPublicadas.length} análises disponíveis para vinculação`);
      setAnalisesDisponiveis(analisesPublicadas);
      
    } catch (error) {
      console.error('❌ Erro ao carregar análises:', error);
      setErrorAnalises('Erro ao carregar análises trimestrais');
    } finally {
      setCarregandoAnalises(false);
    }
  }, [analisesDisponiveis.length, carregandoAnalises]);

  // 🆕 Carregar análises quando componente monta e usuário marca "tem análise"
  useEffect(() => {
    if (!isProvento && item.temAnaliseTrismestral) {
      carregarAnalisesTrimestrais();
    }
  }, [isProvento, item.temAnaliseTrismestral, carregarAnalisesTrimestrais]);

  // Função para alternar entre notícia e provento
  const toggleTipo = () => {
    if (isProvento) {
      // Mudando de provento para notícia - limpar campos de provento
      onUpdate({
        ticker: item.ticker,
        empresa: item.empresa,
        isProvento: false,
        titulo: '',
        resumo: '',
        analise: ''
      });
    } else {
      // Mudando de notícia para provento - limpar campos de notícia
      onUpdate({
        ticker: item.ticker,
        empresa: item.empresa,
        isProvento: true,
        tipoProvento: 'Dividendo',
        valor: '',
        dy: '',
        datacom: '',
        pagamento: ''
      });
    }
  };

  // 🆕 Toggle para análise trimestral
  const toggleAnaliseTrismestral = () => {
    if (item.temAnaliseTrismestral) {
      // Desabilitar análise trimestral - limpar campos
      onUpdate({
        ...item,
        temAnaliseTrismestral: false,
        analiseTrismestralId: undefined,
        analiseTrismestralTicker: undefined,
        analiseTrismestralTitulo: undefined,
        analiseTrismestralTrimestre: undefined
      });
    } else {
      // Habilitar análise trimestral
      onUpdate({
        ...item,
        temAnaliseTrismestral: true
      });
      
      // Carregar análises se ainda não carregou
      carregarAnalisesTrimestrais();
    }
  };

  // 🆕 Selecionar análise trimestral
  const selecionarAnalise = (analiseId: string) => {
    const analiseSelecionada = analisesDisponiveis.find(a => a.id === analiseId);
    
    if (analiseSelecionada) {
      onUpdate({
        ...item,
        analiseTrismestralId: analiseSelecionada.id,
        analiseTrismestralTicker: analiseSelecionada.ticker,
        analiseTrismestralTitulo: analiseSelecionada.titulo,
        analiseTrismestralTrimestre: analiseSelecionada.trimestre
      });
    } else {
      // Limpar seleção
      onUpdate({
        ...item,
        analiseTrismestralId: '',
        analiseTrismestralTicker: '',
        analiseTrismestralTitulo: '',
        analiseTrismestralTrimestre: ''
      });
    }
  };

  return (
    <div style={{
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '16px',
      backgroundColor: isProvento ? '#fefce8' : 'white',
      position: 'relative'
    }}>
      {/* Botão remover */}
      <button
        onClick={onRemove}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Trash2 size={12} />
      </button>

      {/* 🆕 TOGGLE PARA ESCOLHER TIPO */}
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: isProvento ? '#fef3c7' : '#f0f9ff',
        borderRadius: '8px',
        border: `1px solid ${isProvento ? '#fde68a' : '#bae6fd'}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: isProvento ? '#92400e' : '#0c4a6e'
            }}>
              {isProvento ? '💰 Provento' : '📰 Notícia/Análise'}
            </span>
            <span style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              {isProvento ? 'Dividendo, JCP ou Bonificação' : 'Notícia ou análise da empresa'}
            </span>
          </div>
          
          <button
            onClick={toggleTipo}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#6b7280',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            {isProvento ? <ToggleRight size={24} color="#f59e0b" /> : <ToggleLeft size={24} />}
            Alternar tipo
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>

        {/* Campos comuns - exceto para Panorama Macro */}
        {secaoNome !== 'Panorama Macro' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              placeholder="Ticker"
              value={item.ticker}
              onChange={(e) => onUpdate({ ...item, ticker: e.target.value.toUpperCase() })}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            />
            <input
              placeholder="Empresa"
              value={item.empresa}
              onChange={(e) => onUpdate({ ...item, empresa: e.target.value })}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        )}

        {/* 🆕 CAMPOS ESPECÍFICOS BASEADO NO TIPO */}
        {isProvento ? (
          // CAMPOS PARA PROVENTO
          <div style={{
            padding: '12px',
            backgroundColor: '#fffbeb',
            borderRadius: '8px',
            border: '1px solid #fde68a'
          }}>
            <h5 style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#92400e',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <DollarSign size={16} />
              Informações do Provento
            </h5>

<div style={{ marginBottom: '12px' }}>
  <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
    Resumo do Provento
  </label>
  <RichTextEditor
    value={item.resumo || ''}
    onChange={(value) => onUpdate({ ...item, resumo: value })}
    placeholder="Resumo sobre o provento..."
    minHeight="60px"
  />
</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                  Tipo
                </label>
                <select
                  value={item.tipoProvento || 'Dividendo'}
                  onChange={(e) => onUpdate({ ...item, tipoProvento: e.target.value as any })}
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Dividendo">Dividendo</option>
                  <option value="JCP">JCP</option>
                  <option value="Bonificação">Bonificação</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                  Valor
                </label>
                <input
                  placeholder="R$ 0,50"
                  value={item.valor || ''}
                  onChange={(e) => onUpdate({ ...item, valor: e.target.value })}
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                  Dividend Yield
                </label>
                <input
                  placeholder="5,2%"
                  value={item.dy || ''}
                  onChange={(e) => onUpdate({ ...item, dy: e.target.value })}
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                  Data-com
                </label>
                <input
                  type="date"
                  value={item.datacom || ''}
                  onChange={(e) => onUpdate({ ...item, datacom: e.target.value })}
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                  Pagamento
                </label>
                <input
                  type="date"
                  value={item.pagamento || ''}
                  onChange={(e) => onUpdate({ ...item, pagamento: e.target.value })}
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
// CAMPOS PARA NOTÍCIA/ANÁLISE
          <>
            {/* Verificar se é seção Panorama Macro */}
            {secaoNome === 'Panorama Macro' ? (
              // CAMPOS SIMPLIFICADOS PARA PANORAMA MACRO
              <>
                <input
                  placeholder="Título da notícia"
                  value={item.titulo || ''}
                  onChange={(e) => onUpdate({ ...item, titulo: e.target.value })}
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '14px'
                  }}
                />

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Análise Completa
                  </label>
                  <RichTextEditor
                    value={item.analise || ''}
                    onChange={(value) => onUpdate({ ...item, analise: value })}
                    placeholder="Análise detalhada..."
                    minHeight="100px"
                  />
                </div>
              </>
            ) : (
// CAMPOS PARA OUTRAS SEÇÕES (simplificados)
              <>
                <input
                  placeholder="Título da notícia/análise"
                  value={item.titulo || ''}
                  onChange={(e) => onUpdate({ ...item, titulo: e.target.value })}
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '14px'
                  }}
                />

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Análise Completa
                  </label>
                  <RichTextEditor
                    value={item.analise || ''}
                    onChange={(value) => onUpdate({ ...item, analise: value })}
                    placeholder="Análise detalhada..."
                    minHeight="100px"
                  />
                </div>
              </>
            )}

            {/* 🆕 SEÇÃO ANÁLISE TRIMESTRAL VINCULADA */}
            <div style={{
              padding: '16px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              marginTop: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <h5 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#15803d',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <BarChart3 size={16} />
                    Análise Trimestral Vinculada
                  </h5>
                  <span style={{
                    fontSize: '12px',
                    color: '#166534'
                  }}>
                    Permite aos leitores acessar análise completa
                  </span>
                </div>

                <button
                  onClick={toggleAnaliseTrismestral}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#15803d',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  {item.temAnaliseTrismestral ? (
                    <>
                      <ToggleRight size={24} color="#16a34a" />
                      Ativado
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={24} />
                      Ativar
                    </>
                  )}
                </button>
              </div>

              {item.temAnaliseTrismestral && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {/* Dropdown para selecionar análise */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#166534',
                      marginBottom: '8px'
                    }}>
                      Selecionar Análise Trimestral
                    </label>

                    {carregandoAnalises ? (
                      <div style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: '#166534',
                        fontSize: '14px'
                      }}>
                        ⏳ Carregando análises disponíveis...
                      </div>
                    ) : errorAnalises ? (
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        color: '#dc2626',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <AlertCircle size={16} />
                        {errorAnalises}
                        <button
                          onClick={carregarAnalisesTrimestrais}
                          style={{
                            marginLeft: 'auto',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Tentar novamente
                        </button>
                      </div>
                    ) : (
                      <select
                        value={item.analiseTrismestralId || ''}
                        onChange={(e) => selecionarAnalise(e.target.value)}
                        style={{
                          width: '100%',
                          border: '1px solid #bbf7d0',
                          borderRadius: '6px',
                          padding: '10px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">
                          {analisesDisponiveis.length === 0 
                            ? 'Nenhuma análise disponível'
                            : 'Selecione uma análise...'
                          }
                        </option>
                        {analisesDisponiveis.map((analise) => (
                          <option key={analise.id} value={analise.id}>
                            {analise.ticker} - {analise.trimestre} - {analise.titulo}
                          </option>
                        ))}
                      </select>
                    )}

                    {analisesDisponiveis.length > 0 && !carregandoAnalises && (
                      <div style={{
                        fontSize: '12px',
                        color: '#166534',
                        marginTop: '4px'
                      }}>
                        💡 {analisesDisponiveis.length} análises disponíveis para vinculação
                      </div>
                    )}
                  </div>

                  {/* Preview da análise selecionada */}
                  {item.analiseTrismestralId && item.analiseTrismestralTicker && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#dcfce7',
                      border: '1px solid #86efac',
                      borderRadius: '8px'
                    }}>
                      <h6 style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#15803d',
                        margin: '0 0 8px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <CheckCircle size={14} />
                        Análise Selecionada
                      </h6>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: '#166534'
                      }}>
                        <span style={{
                          backgroundColor: '#16a34a',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {item.analiseTrismestralTicker}
                        </span>
                        
                        <span style={{
                          backgroundColor: '#15803d',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {item.analiseTrismestralTrimestre}
                        </span>
                        
                        <span style={{ fontWeight: '500', flex: 1 }}>
                          {item.analiseTrismestralTitulo}
                        </span>

                        <span style={{
                          backgroundColor: '#22c55e',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <ExternalLink size={12} />
                          VINCULADO
                        </span>
                      </div>
                      
                      <div style={{
                        fontSize: '12px',
                        color: '#16a34a',
                        marginTop: '8px',
                        fontStyle: 'italic'
                      }}>
                        📊 Os leitores verão um botão "Ver Análise Trimestral" neste item do relatório
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {item.destaque && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Destaque Especial
                </label>
                <RichTextEditor
                  value={item.destaque}
                  onChange={(value) => onUpdate({ ...item, destaque: value })}
                  placeholder="Destaque especial ou observação importante..."
                  minHeight="60px"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

// Componente para seção do relatório
const SecaoEditor = memo(({ 
  titulo, 
  items, 
  onAddItem, 
  onUpdateItem, 
  onRemoveItem,
  cor,
  icone: Icone,
  descricao
}: {
  titulo: string;
  items: ItemRelatorioSemanal[];
  onAddItem: () => void;
  onUpdateItem: (index: number, item: ItemRelatorioSemanal) => void;
  onRemoveItem: (index: number) => void;
  cor: string;
  icone: any;
  descricao?: string;
}) => {
  // Contar proventos e notícias
  const totalProventos = items.filter(item => item.isProvento).length;
  const totalNoticias = items.filter(item => !item.isProvento).length;
  const totalComAnalise = items.filter(item => !item.isProvento && item.temAnaliseTrismestral && item.analiseTrismestralId).length;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div>
          <h4 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: cor,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Icone size={20} />
            {titulo} ({items.length})
          </h4>
          {descricao && (
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '4px 0 0 28px'
            }}>
              {descricao}
            </p>
          )}
          {items.length > 0 && (
            <div style={{
              fontSize: '11px',
              color: '#6b7280',
              margin: '4px 0 0 28px',
              display: 'flex',
              gap: '12px'
            }}>
              {totalNoticias > 0 && <span>📰 {totalNoticias} notícia{totalNoticias > 1 ? 's' : ''}</span>}
              {totalProventos > 0 && <span>💰 {totalProventos} provento{totalProventos > 1 ? 's' : ''}</span>}
              {totalComAnalise > 0 && <span>📊 {totalComAnalise} c/ análise trimestral</span>}
            </div>
          )}
        </div>
        
        <button
          onClick={onAddItem}
          style={{
            backgroundColor: cor,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600'
          }}
        >
          <Plus size={14} />
          Adicionar
        </button>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#64748b',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '2px dashed #cbd5e1'
          }}>
            <Icone size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>
              Nenhum item adicionado ainda.
              <br />
              Clique em "Adicionar" para começar.
            </p>
          </div>
        ) : (
          items.map((item, index) => (
            <ItemEditor
              key={index}
              item={item}
              onUpdate={(updatedItem) => onUpdateItem(index, updatedItem)}
              onRemove={() => onRemoveItem(index)}
              secaoNome={titulo}
            />
          ))
        )}
      </div>
    </div>
  );
});

// 🎯 COMPONENTE DE CRIAÇÃO DE RELATÓRIO - ATUALIZADO SEM SEÇÃO PROVENTOS
const CriarRelatorioForm = memo(({ 
  onSave,
  relatorioEditando 
}: { 
  onSave: (relatorio: RelatorioSemanalData) => void;
  relatorioEditando?: RelatorioSemanalData | null;
}) => {
  const [relatorio, setRelatorio] = useState<RelatorioSemanalData>(() => {
    if (relatorioEditando) {
      return relatorioEditando;
    }
    
    const hoje = new Date();
    return {
      id: Date.now().toString(),
      semana: getWeekNumber(hoje),
      dataPublicacao: hoje.toISOString().split('T')[0],
      titulo: '',
      macro: [],
      dividendos: [],
      smallCaps: [],
      microCaps: [],
      exteriorStocks: [],
      exteriorETFs: [],
      exteriorDividendos: [],
      exteriorProjetoAmerica: [],
      status: 'draft'
    };
  });

  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (relatorioEditando) {
      setRelatorio(relatorioEditando);
    }
  }, [relatorioEditando]);

  const updateField = useCallback((field: keyof RelatorioSemanalData, value: any) => {
    setRelatorio(prev => ({ ...prev, [field]: value }));
  }, []);

  const addItem = useCallback((secao: keyof Pick<RelatorioSemanalData, 'macro' | 'dividendos' | 'smallCaps' | 'microCaps' | 'exteriorStocks' | 'exteriorETFs' | 'exteriorDividendos' | 'exteriorProjetoAmerica'>) => {
    setRelatorio(prev => {
      // Por padrão, criar uma notícia
      const newItem: ItemRelatorioSemanal = {
        ticker: '',
        empresa: '',
        isProvento: false,
        titulo: '',
        resumo: '',
        analise: ''
      };
      
      return {
        ...prev,
        [secao]: [...(prev[secao] as ItemRelatorioSemanal[]), newItem]
      };
    });
  }, []);

  const updateItem = useCallback((secao: keyof Pick<RelatorioSemanalData, 'macro' | 'dividendos' | 'smallCaps' | 'microCaps' | 'exteriorStocks' | 'exteriorETFs' | 'exteriorDividendos' | 'exteriorProjetoAmerica'>, index: number, item: ItemRelatorioSemanal) => {
    setRelatorio(prev => ({
      ...prev,
      [secao]: (prev[secao] as ItemRelatorioSemanal[]).map((existing, i) => i === index ? item : existing)
    }));
  }, []);

  const removeItem = useCallback((secao: keyof Pick<RelatorioSemanalData, 'macro' | 'dividendos' | 'smallCaps' | 'microCaps' | 'exteriorStocks' | 'exteriorETFs' | 'exteriorDividendos' | 'exteriorProjetoAmerica'>, index: number) => {
    setRelatorio(prev => ({
      ...prev,
      [secao]: (prev[secao] as ItemRelatorioSemanal[]).filter((_, i) => i !== index)
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSalvando(true);
    
    try {
      if (!relatorio.semana || !relatorio.titulo) {
        alert('Por favor, preencha pelo menos a Semana e o Título.');
        return;
      }
      
      await onSave(relatorio);
      
      if (!relatorioEditando) {
        const hoje = new Date();
        setRelatorio({
          id: Date.now().toString(),
          semana: getWeekNumber(hoje),
          dataPublicacao: hoje.toISOString().split('T')[0],
          titulo: '',
          macro: [],
          dividendos: [],
          smallCaps: [],
          microCaps: [],
          exteriorStocks: [],
          exteriorETFs: [],
          exteriorDividendos: [],
          exteriorProjetoAmerica: [],
          status: 'draft'
        });
      }
      
      alert('✅ Relatório salvo com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao salvar relatório');
    } finally {
      setSalvando(false);
    }
  }, [relatorio, onSave, relatorioEditando]);

  // 🆕 SEÇÕES ATUALIZADAS SEM PROVENTOS SEPARADOS
  const secoes = [
    { key: 'macro' as const, titulo: 'Panorama Macro', cor: '#2563eb', icone: Globe, descricao: 'Notícias macroeconômicas gerais' },
    { key: 'dividendos' as const, titulo: 'Dividendos', cor: '#22c55e', icone: Calendar, descricao: 'Empresas boas pagadoras - notícias e proventos' },
    { key: 'smallCaps' as const, titulo: 'Small Caps', cor: '#2563eb', icone: Building, descricao: 'Empresas de médio porte - notícias e proventos' },
    { key: 'microCaps' as const, titulo: 'Micro Caps', cor: '#ea580c', icone: Zap, descricao: 'Empresas de pequeno porte - notícias e proventos' },
  ];

  // SEÇÃO INTERNACIONAL SEPARADA
  const secoesInternacional = [
    { key: 'exteriorStocks' as const, titulo: 'Internacional - Stocks', cor: '#7c3aed', icone: TrendingUp, descricao: 'Ações internacionais - notícias e proventos' },
    { key: 'exteriorETFs' as const, titulo: 'Internacional - ETFs', cor: '#6366f1', icone: LineChart, descricao: 'ETFs internacionais - notícias e distribuições' },
    { key: 'exteriorDividendos' as const, titulo: 'Internacional - Dividendos', cor: '#0ea5e9', icone: Coins, descricao: 'Empresas internacionais pagadoras - notícias e dividendos' },
    { key: 'exteriorProjetoAmerica' as const, titulo: 'Internacional - Projeto América', cor: '#dc2626', icone: Target, descricao: 'Conteúdo exclusivo do Projeto América' },
  ];

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header com botão salvar */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
            {relatorioEditando ? '✏️ Editando Relatório' : '✨ Criar Novo Relatório'}
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            🆕 Agora com vinculação a análises trimestrais
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={salvando}
          style={{
            backgroundColor: '#059669',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: salvando ? 'not-allowed' : 'pointer',
            opacity: salvando ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
          }}
        >
          <Save size={16} />
          {salvando ? 'Salvando...' : 'Salvar Relatório'}
        </button>
      </div>

      {/* Informações básicas */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} />
          Informações Básicas
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Semana *
            </label>
            <input
              type="text"
              value={relatorio.semana}
              onChange={(e) => updateField('semana', e.target.value)}
              placeholder="2025-W03"
              style={{
                width: '100%',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontWeight: '600'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Data de Publicação
            </label>
            <input
              type="date"
              value={relatorio.dataPublicacao}
              onChange={(e) => updateField('dataPublicacao', e.target.value)}
              style={{
                width: '100%',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Título do Relatório *
          </label>
          <input
            type="text"
            value={relatorio.titulo}
            onChange={(e) => updateField('titulo', e.target.value)}
            placeholder="Relatório Semanal - 3ª Semana de Janeiro de 2025"
            style={{
              width: '100%',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* 🆕 AVISO SOBRE NOVA FUNCIONALIDADE */}
      <div style={{
        backgroundColor: '#f0fdf4',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #86efac'
      }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#15803d',
          margin: '0 0 12px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <BarChart3 size={20} />
          🆕 Nova Funcionalidade: Análises Trimestrais Vinculadas
        </h4>
        <div style={{ fontSize: '14px', color: '#166534', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            Agora você pode <strong>vincular análises trimestrais</strong> às notícias dos relatórios semanais!
          </p>
          <ul style={{ margin: '8px 0', paddingLeft: '24px' }}>
            <li>Em qualquer notícia, ative "Análise Trimestral Vinculada"</li>
            <li>Selecione a análise desejada da lista disponível</li>
            <li>Os leitores verão um botão para acessar a análise completa</li>
            <li>Integração perfeita entre relatórios semanais e análises trimestrais</li>
          </ul>
        </div>
      </div>

      {/* Seções nacionais */}
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '-8px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#0c4a6e',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🇧🇷 Mercado Nacional
        </h3>
      </div>
      
      {secoes.map((secao) => (
        <SecaoEditor
          key={secao.key}
          titulo={secao.titulo}
          items={relatorio[secao.key]}
          onAddItem={() => addItem(secao.key)}
          onUpdateItem={(index, item) => updateItem(secao.key, index, item)}
          onRemoveItem={(index) => removeItem(secao.key, index)}
          cor={secao.cor}
          icone={secao.icone}
          descricao={secao.descricao}
        />
      ))}

      {/* SEPARADOR PARA SEÇÕES INTERNACIONAIS */}
      <div style={{
        backgroundColor: '#faf5ff',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '-8px',
        border: '1px solid #e9d5ff'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#6b21a8',
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🌎 Mercado Internacional
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#7c3aed',
          margin: 0
        }}>
          Conteúdo separado por categoria para controle granular de permissões
        </p>
      </div>

      {/* SEÇÕES INTERNACIONAIS SEPARADAS */}
      {secoesInternacional.map((secao) => (
        <SecaoEditor
          key={secao.key}
          titulo={secao.titulo}
          items={relatorio[secao.key]}
          onAddItem={() => addItem(secao.key)}
          onUpdateItem={(index, item) => updateItem(secao.key, index, item)}
          onRemoveItem={(index) => removeItem(secao.key, index)}
          cor={secao.cor}
          icone={secao.icone}
          descricao={secao.descricao}
        />
      ))}
    </div>
  );
});

// 📋 COMPONENTE DE RELATÓRIOS PUBLICADOS
const RelatoriosPublicados = memo(({ 
  relatorios, 
  onEdit, 
  onUnpublish,
  onDelete 
}: { 
  relatorios: RelatorioSemanalData[];
  onEdit: (relatorio: RelatorioSemanalData) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [filtroSemana, setFiltroSemana] = useState('');

  const relatoriosPublicados = relatorios.filter(r => r.status === 'published');
  
  const relatoriosFiltrados = relatoriosPublicados.filter(relatorio => {
    return !filtroSemana || relatorio.semana.toLowerCase().includes(filtroSemana.toLowerCase());
  });

  const relatoriosPorSemana = relatoriosFiltrados
    .sort((a, b) => b.semana.localeCompare(a.semana))
    .reduce((acc, relatorio) => {
      if (!acc[relatorio.semana]) {
        acc[relatorio.semana] = [];
      }
      acc[relatorio.semana].push(relatorio);
      return acc;
    }, {} as Record<string, RelatorioSemanalData[]>);

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Filtros */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} />
          Filtros
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Filtrar por Semana
            </label>
            <input
              type="text"
              value={filtroSemana}
              onChange={(e) => setFiltroSemana(e.target.value)}
              placeholder="Ex: 2025-W03"
              style={{
                width: '100%',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button
              onClick={() => setFiltroSemana('')}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
        
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#64748b' }}>
          Mostrando {relatoriosFiltrados.length} de {relatoriosPublicados.length} relatórios publicados
        </div>
      </div>

      {/* Lista de Relatórios */}
      {relatoriosFiltrados.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '64px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
            {relatoriosPublicados.length === 0 ? 'Nenhum Relatório Publicado' : 'Nenhum relatório corresponde aos filtros'}
          </h3>
          <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '32px' }}>
            {relatoriosPublicados.length === 0 
              ? 'Publique seus primeiros relatórios para vê-los aqui.'
              : 'Tente ajustar os filtros para encontrar os relatórios desejados.'
            }
          </p>
        </div>
      ) : (
        Object.entries(relatoriosPorSemana).map(([semana, relatoriosDaSemana]) => (
          <div key={semana} style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
                  Semana {semana}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  {relatoriosDaSemana.length} relatório{relatoriosDaSemana.length > 1 ? 's' : ''}
                </p>
              </div>
              
              <div style={{
                backgroundColor: '#f0f9ff',
                color: '#0c4a6e',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid #7dd3fc'
              }}>
                📅 {semana}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {relatoriosDaSemana.map((relatorio) => {
                // Calcular totais - contar todos os itens
                const totalItens = relatorio.macro.length + 
                  relatorio.dividendos.length + relatorio.smallCaps.length + 
                  relatorio.microCaps.length + 
                  (relatorio.exteriorStocks?.length || 0) +
                  (relatorio.exteriorETFs?.length || 0) +
                  (relatorio.exteriorDividendos?.length || 0) +
                  (relatorio.exteriorProjetoAmerica?.length || 0);

                // Contar proventos, notícias e análises vinculadas
                const allItems = [
                  ...relatorio.macro,
                  ...relatorio.dividendos,
                  ...relatorio.smallCaps,
                  ...relatorio.microCaps,
                  ...(relatorio.exteriorStocks || []),
                  ...(relatorio.exteriorETFs || []),
                  ...(relatorio.exteriorDividendos || []),
                  ...(relatorio.exteriorProjetoAmerica || [])
                ];
                
                const totalProventos = allItems.filter(item => item.isProvento).length;
                const totalNoticias = allItems.filter(item => !item.isProvento).length;
                const totalComAnalise = allItems.filter(item => !item.isProvento && item.temAnaliseTrismestral && item.analiseTrismestralId).length;

                return (
                  <div key={relatorio.id} style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    backgroundColor: '#f8fafc'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>
                          {relatorio.titulo}
                        </h4>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                          <span>📅 {new Date(relatorio.dataPublicacao).toLocaleDateString('pt-BR')}</span>
                          <span>📊 {totalItens} itens</span>
                          {totalNoticias > 0 && <span>📰 {totalNoticias} notícias</span>}
                          {totalProventos > 0 && <span>💰 {totalProventos} proventos</span>}
                          {totalComAnalise > 0 && (
                            <span style={{
                              backgroundColor: '#22c55e',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              📊 {totalComAnalise} c/ análise
                            </span>
                          )}
                        </div>

                        {/* Resumo das seções */}
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          flexWrap: 'wrap',
                          marginTop: '12px'
                        }}>
                          {relatorio.macro.length > 0 && (
                            <span style={{ 
                              fontSize: '12px',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontWeight: '600'
                            }}>
                              Macro: {relatorio.macro.length}
                            </span>
                          )}
                          
                          {relatorio.dividendos.length > 0 && (
                            <span style={{ 
                              fontSize: '12px',
                              backgroundColor: '#f0fdf4',
                              color: '#166534',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontWeight: '600'
                            }}>
                              Dividendos: {relatorio.dividendos.length}
                            </span>
                          )}

                          {relatorio.smallCaps.length > 0 && (
                            <span style={{ 
                              fontSize: '12px',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontWeight: '600'
                            }}>
                              Small Caps: {relatorio.smallCaps.length}
                            </span>
                          )}

                          {(relatorio.exteriorStocks?.length || 0) > 0 && (
                            <span style={{ 
                              fontSize: '12px',
                              backgroundColor: '#faf5ff',
                              color: '#7c2d12',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontWeight: '600'
                            }}>
                              Int. Stocks: {relatorio.exteriorStocks?.length}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ 
                        textAlign: 'right',
                        minWidth: '150px',
                        marginLeft: '20px'
                      }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => onEdit(relatorio)}
                            style={{
                              backgroundColor: '#374151',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: '600'
                            }}
                            title="Editar relatório"
                          >
                            <Edit size={14} />
                            Editar
                          </button>
                          
                          <button
                            onClick={() => onUnpublish(relatorio.id!)}
                            style={{
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: '600'
                            }}
                            title="Despublicar (volta para rascunho)"
                          >
                            <Archive size={14} />
                            Despublicar
                          </button>
                          
                          <button
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.')) {
                                onDelete(relatorio.id!);
                              }
                            }}
                            style={{
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: '600'
                            }}
                            title="Excluir relatório"
                          >
                            <Trash2 size={14} />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
});

// Componente de Rascunhos
const RascunhosRelatorios = memo(({ 
  relatorios, 
  onEdit, 
  onPublish,
  onDelete 
}: { 
  relatorios: RelatorioSemanalData[];
  onEdit: (relatorio: RelatorioSemanalData) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const rascunhos = relatorios.filter(r => r.status === 'draft');

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {rascunhos.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '64px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
            Nenhum Rascunho
          </h3>
          <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '32px' }}>
            Todos os seus rascunhos foram publicados ou você ainda não criou nenhum.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
            📝 Rascunhos ({rascunhos.length})
          </h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            {rascunhos.map((relatorio) => {
              const totalItens = relatorio.macro.length + 
                relatorio.dividendos.length + relatorio.smallCaps.length + 
                relatorio.microCaps.length + 
                (relatorio.exteriorStocks?.length || 0) +
                (relatorio.exteriorETFs?.length || 0) +
                (relatorio.exteriorDividendos?.length || 0) +
                (relatorio.exteriorProjetoAmerica?.length || 0);

              return (
                <div key={relatorio.id} style={{
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#fefce8'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#92400e', margin: 0 }}>
                          {relatorio.titulo || 'Título não definido'}
                        </h4>
                        <span style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {relatorio.semana}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '8px' }}>
{totalItens} itens
                      </div>
                      
                      <div style={{ fontSize: '12px', color: '#a16207' }}>
                        Criado em: {new Date(relatorio.dataPublicacao).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onEdit(relatorio)}
                        style={{
                          backgroundColor: '#374151',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '600'
                        }}
                      >
                        <Edit size={14} />
                        Editar
                      </button>
                      
                      <button
                        onClick={() => onPublish(relatorio.id!)}
                        style={{
                          backgroundColor: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '600'
                        }}
                      >
                        <Eye size={14} />
                        Publicar
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este rascunho?')) {
                            onDelete(relatorio.id!);
                          }
                        }}
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '600'
                        }}
                      >
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

// 🏠 COMPONENTE PRINCIPAL
const AdminRelatorioSemanal = () => {
  const { hasRelatorioSemanalAdminAccess, loading: authLoading, user } = useAuthAccess();
  const [relatorios, setRelatorios] = useState<RelatorioSemanalData[]>([]);
  const [activeTab, setActiveTab] = useState<'criar' | 'publicados' | 'rascunhos'>('criar');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relatorioEditando, setRelatorioEditando] = useState<RelatorioSemanalData | null>(null);

// Substitua as funções de carregamento e salvamento no código de administração:

// 📚 CARREGAR RELATÓRIOS DA API - COM MIGRAÇÃO
useEffect(() => {
  const loadRelatorios = async () => {
    try {
      console.log('🔄 Carregando relatórios da API...');
      setLoading(true);

      // Recuperar token (se disponível) do cookie ou localStorage
      const token =
        typeof window !== 'undefined'
          ?
              document.cookie.match(/auth-token=([^;]+)/)?.[1] ||
              localStorage.getItem('auth-token') ||
              ''
          : '';

      const response = await fetch('/api/relatorio-semanal?admin=true', {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(user?.email ? { 'X-User-Email': user.email } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const relatoriosAPI = await response.json();
      
      // ✅ APLICAR CORREÇÃO DO NULL
      const dadosSeguro = relatoriosAPI || [];
      console.log(`✅ ${dadosSeguro.length} relatórios carregados da API`);
      
      setRelatorios(dadosSeguro);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Erro ao carregar relatórios da API:', error);
      
      // Fallback: tentar IndexedDB como backup
      try {
        console.log('🔄 Tentando fallback para IndexedDB...');
        const request = indexedDB.open('RelatoriosSemanaisDB', 3);
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          if (!db.objectStoreNames.contains('relatorios')) {
            setError('Nenhum relatório disponível');
            setLoading(false);
            return;
          }
          
          const transaction = db.transaction(['relatorios'], 'readonly');
          const store = transaction.objectStore('relatorios');
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            const relatoriosIndexedDB = getAllRequest.result || [];
            console.log(`📦 ${relatoriosIndexedDB.length} relatórios encontrados no IndexedDB`);
            setRelatorios(relatoriosIndexedDB);
            setLoading(false);
          };
        };
        
        request.onerror = () => {
          setError('Erro ao conectar com dados locais');
          setLoading(false);
        };
        
      } catch (fallbackError) {
        console.error('❌ Fallback também falhou:', fallbackError);
        setError('Erro ao carregar relatórios');
        setLoading(false);
      }
    }
  };
  
  loadRelatorios();
}, [user]);

// 💾 SALVAR RELATÓRIO NA API
const saveRelatorio = useCallback(async (relatorio: RelatorioSemanalData) => {
  setSaving(true);
  setError(null);
  
  try {
    console.log('💾 Salvando relatório na API...', relatorio);
    
    // ADICIONAR headers de autenticação
    const response = await fetch('/api/relatorio-semanal', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(relatorio)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
    
    const relatorioSalvo = await response.json();
    console.log('✅ Relatório salvo na API:', relatorioSalvo.id);
    
    setRelatorios(prev => {
      const existing = prev.find(r => r.id === relatorioSalvo.id);
      if (existing) {
        return prev.map(r => r.id === relatorioSalvo.id ? relatorioSalvo : r);
      } else {
        return [...prev, relatorioSalvo];
      }
    });
    
    setRelatorioEditando(null);
    
  } catch (error) {
    console.error('❌ Erro ao salvar na API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    setError(`Erro ao salvar: ${errorMessage}`);
  } finally {
    setSaving(false);
  }
}, []);

  // Outras funções mantêm iguais
  const publishRelatorio = useCallback(async (id: string) => {
    const relatorio = relatorios.find(r => r.id === id);
    if (!relatorio) return;
    
    const relatorioPublicado = { ...relatorio, status: 'published' as const };
    await saveRelatorio(relatorioPublicado);
  }, [relatorios, saveRelatorio]);

  const unpublishRelatorio = useCallback(async (id: string) => {
    const relatorio = relatorios.find(r => r.id === id);
    if (!relatorio) return;
    
    const relatorioRascunho = { ...relatorio, status: 'draft' as const };
    await saveRelatorio(relatorioRascunho);
  }, [relatorios, saveRelatorio]);

const deleteRelatorio = useCallback(async (id: string) => {
  setSaving(true);
  setError(null);
  
  try {
    console.log('🗑️ Iniciando exclusão do relatório:', id);
    
    // Encontrar o relatório
    const relatorio = relatorios.find(r => r.id === id);
    if (!relatorio) {
      throw new Error('Relatório não encontrado');
    }
    
    // Se estiver publicado, despublicar primeiro
    if (relatorio.status === 'published') {
      console.log('📝 Despublicando antes de excluir...');
      
      const relatorioRascunho = { ...relatorio, status: 'draft' as const };
      
      const unpublishResponse = await fetch('/api/relatorio-semanal', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(relatorioRascunho)
      });
      
      if (!unpublishResponse.ok) {
        throw new Error('Erro ao despublicar relatório');
      }
      
      console.log('✅ Relatório despublicado');
    }
    
    // Agora excluir
    console.log('🗑️ Excluindo relatório...');
    
    const deleteResponse = await fetch(`/api/relatorio-semanal?id=${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      throw new Error(errorData.error || `Erro HTTP: ${deleteResponse.status}`);
    }
    
    setRelatorios(prev => prev.filter(r => r.id !== id));
    console.log('✅ Relatório excluído com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao excluir:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    setError(`Erro ao excluir relatório: ${errorMessage}`);
  } finally {
    setSaving(false);
  }
}, [relatorios]);

const editRelatorio = useCallback((relatorio: RelatorioSemanalData) => {
    setRelatorioEditando(relatorio);
    setActiveTab('criar');
  }, []);

  const totalRelatorios = relatorios.length;
  const relatoriosDraft = relatorios.filter(r => r.status === 'draft').length;
  const relatoriosPublicados = relatorios.filter(r => r.status === 'published').length;

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #22c55e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
            Verificando permissões administrativas...
          </h2>
        </div>
      </div>
    );
  }

  if (!hasRelatorioSemanalAdminAccess()) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ 
          textAlign: 'center', 
          backgroundColor: 'white', 
          padding: '48px 32px', 
          borderRadius: '16px', 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>📝</div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#dc2626', 
            marginBottom: '16px' 
          }}>
            Acesso Administrativo Negado
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '24px'
          }}>
            Esta área é restrita a <strong>administradores</strong> do sistema. Você não possui as permissões necessárias para gerenciar relatórios semanais.
          </p>
          <p style={{ 
            color: '#64748b', 
            fontSize: '14px',
            marginBottom: '32px'
          }}>
            Usuário: <strong>{user?.email || 'N/A'}</strong> | 
            Plano: <strong>{user?.plan || 'N/A'}</strong>
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              backgroundColor: '#22c55e',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }


  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
            Carregando relatórios...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header Moderno */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
        color: 'white',
        borderBottom: '4px solid #22c55e'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={28} style={{ color: 'white' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 4px 0' }}>
                  Relatórios Semanais
                </h1>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '16px' }}>
                  🆕 Agora com vinculação a análises trimestrais
                </p>
              </div>
            </div>
            
            {/* Status Cards */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                minWidth: '100px'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>
                  {totalRelatorios}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Total</div>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                minWidth: '100px'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#fbbf24' }}>
                  {relatoriosDraft}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Rascunhos</div>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                minWidth: '100px'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  {relatoriosPublicados}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Publicados</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Sistema de Abas */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          marginBottom: '32px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {/* Tab Headers */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}>
            <button
              onClick={() => setActiveTab('criar')}
              style={{
                flex: 1,
                padding: '20px 24px',
                border: 'none',
                backgroundColor: activeTab === 'criar' ? 'white' : 'transparent',
                color: activeTab === 'criar' ? '#1e293b' : '#64748b',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: activeTab === 'criar' ? '3px solid #22c55e' : '3px solid transparent',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Plus size={20} />
              {relatorioEditando ? 'Editar Relatório' : 'Criar Relatórios'}
              {relatorioEditando && (
                <span style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}>
                  EDITANDO
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('publicados')}
              style={{
                flex: 1,
                padding: '20px 24px',
                border: 'none',
                backgroundColor: activeTab === 'publicados' ? 'white' : 'transparent',
                color: activeTab === 'publicados' ? '#1e293b' : '#64748b',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: activeTab === 'publicados' ? '3px solid #22c55e' : '3px solid transparent',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Eye size={20} />
              Publicados ({relatoriosPublicados})
            </button>
            
            <button
              onClick={() => setActiveTab('rascunhos')}
              style={{
                flex: 1,
                padding: '20px 24px',
                border: 'none',
                backgroundColor: activeTab === 'rascunhos' ? 'white' : 'transparent',
                color: activeTab === 'rascunhos' ? '#1e293b' : '#64748b',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: activeTab === 'rascunhos' ? '3px solid #22c55e' : '3px solid transparent',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <FileText size={20} />
              Rascunhos ({relatoriosDraft})
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ padding: '32px' }}>
            {activeTab === 'criar' && (
              relatorioEditando ? (
                <div>
                  <div style={{
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '16px', fontWeight: '600' }}>
                      ✏️ Editando Relatório
                    </h4>
                    <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                      Você está editando: <strong>{relatorioEditando.titulo || relatorioEditando.semana}</strong>
                    </p>
                    <button
                      onClick={() => setRelatorioEditando(null)}
                      style={{
                        marginTop: '12px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancelar Edição
                    </button>
                  </div>
                  <CriarRelatorioForm onSave={saveRelatorio} relatorioEditando={relatorioEditando} />
                </div>
              ) : (
                <CriarRelatorioForm onSave={saveRelatorio} />
              )
            )}
            
            {activeTab === 'publicados' && (
              <RelatoriosPublicados 
                relatorios={relatorios}
                onEdit={editRelatorio}
                onUnpublish={unpublishRelatorio}
                onDelete={deleteRelatorio}
              />
            )}
            
            {activeTab === 'rascunhos' && (
              <RascunhosRelatorios 
                relatorios={relatorios}
                onEdit={editRelatorio}
                onPublish={publishRelatorio}
                onDelete={deleteRelatorio}
              />
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRelatorioSemanal;