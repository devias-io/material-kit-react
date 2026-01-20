'use client';

import React, { useState, useEffect } from 'react';

// 🔥 HOOK PARA BUSCAR DADOS REAIS DOS BDRs
function useBDRDataAPI(bdrTicker) {
  const [bdrData, setBDRData] = React.useState(null);
  const [bdrLoading, setBDRLoading] = React.useState(true);

  const fetchBDRData = React.useCallback(async () => {
    if (!bdrTicker) {
      setBDRLoading(false);
      return;
    }

    try {
      console.log(`🇧🇷 Buscando cotação do BDR: ${bdrTicker}...`);
      
      const response = await fetch(`/api/brapi/quote?tickers=${bdrTicker}`);
      const data = await response.json();

      if (data?.results?.[0]) {
        const result = data.results[0];
        setBDRData({
          symbol: result.symbol,
          price: result.regularMarketPrice,
          change: result.regularMarketChange,
          changePercent: result.regularMarketChangePercent
        });
        console.log(`✅ BDR ${bdrTicker}: R$ ${result.regularMarketPrice}`);
      }
    } catch (err) {
      console.error(`❌ Erro BDR ${bdrTicker}:`, err);
    } finally {
      setBDRLoading(false);
    }
  }, [bdrTicker]);

  React.useEffect(() => {
    fetchBDRData();
  }, [fetchBDRData]);

  return { bdrData, bdrLoading };
}

// ========================================
// COMPONENTE HISTÓRICO DE DIVIDENDOS - ATIVOS EXTERIOR
// ========================================
const HistoricoDividendosExterior = ({ ticker, dataEntrada }) => {
  const [proventos, setProventos] = React.useState([]);
  const [mostrarTodos, setMostrarTodos] = React.useState(false);

  React.useEffect(() => {
    if (ticker && typeof window !== 'undefined') {
      let dadosSalvos = null;
      
      // ✅ Buscar dados de múltiplas fontes possíveis para ativos no exterior
      dadosSalvos = localStorage.getItem(`dividendos_exterior_${ticker}`) || 
                   localStorage.getItem(`dividendos_us_${ticker}`) ||
                   localStorage.getItem(`proventos_${ticker}`) ||
                   localStorage.getItem(`dividends_${ticker}`);
      
      console.log(`🔍 Buscando dados de dividendos exterior para ${ticker}:`, {
        dividendos_exterior: !!localStorage.getItem(`dividendos_exterior_${ticker}`),
        dividendos_us: !!localStorage.getItem(`dividendos_us_${ticker}`),
        proventos: !!localStorage.getItem(`proventos_${ticker}`),
        dividends: !!localStorage.getItem(`dividends_${ticker}`)
      });

      // ✅ Buscar do sistema central como fallback
      if (!dadosSalvos) {
        const proventosCentral = localStorage.getItem('proventos_central_master');
        if (proventosCentral) {
          try {
            const todosDados = JSON.parse(proventosCentral);
            const dadosTicker = todosDados.filter(item => item.ticker === ticker);
            if (dadosTicker.length > 0) {
              dadosSalvos = JSON.stringify(dadosTicker);
              console.log(`✅ Dados encontrados no sistema central para ${ticker}:`, dadosTicker.length);
            }
          } catch (err) {
            console.error('Erro ao buscar do sistema central:', err);
          }
        }
      }
      
      if (dadosSalvos) {
        try {
          const proventosSalvos = JSON.parse(dadosSalvos);
          const proventosLimitados = proventosSalvos.slice(0, 500).map(item => ({
            ...item,
            dataObj: new Date(item.dataCom || item.data || item.dataObj || item.dataFormatada || item.exDate)
          }));
          
          // Filtrar dados inválidos
          const proventosValidos = proventosLimitados.filter(item => 
            item.dataObj && !isNaN(item.dataObj.getTime()) && item.valor && item.valor > 0
          );
          
          proventosValidos.sort((a, b) => b.dataObj.getTime() - a.dataObj.getTime());
          setProventos(proventosValidos);
          
          console.log(`✅ Dividendos carregados para ${ticker}:`, {
            total: proventosValidos.length,
            primeiros2: proventosValidos.slice(0, 2)
          });
          
        } catch (err) {
          console.error('Erro ao carregar dividendos salvos:', err);
          setProventos([]);
        }
      } else {
        console.log(`❌ Nenhum dado encontrado para ${ticker}. Chaves verificadas:`, {
          localStorage_keys: Object.keys(localStorage).filter(key => 
            key.includes(ticker) || key.includes('provento') || key.includes('dividendo') || key.includes('dividend')
          )
        });
        setProventos([]);
      }
    }
  }, [ticker]);

  const formatarValor = (valor) => {
    if (!valor) return '$0.00';
    return `$${Number(valor).toFixed(2)}`;
  };

  const { totalProventos, mediaProvento, ultimoProvento } = React.useMemo(() => {
    const total = proventos.reduce((sum, item) => sum + item.valor, 0);
    const media = proventos.length > 0 ? total / proventos.length : 0;
    const ultimo = proventos.length > 0 ? proventos[0] : null;

    return {
      totalProventos: total,
      mediaProvento: media,
      ultimoProvento: ultimo
    };
  }, [proventos]);

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>💰</span>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            margin: 0, 
            color: '#1f2937' 
          }}>
            Histórico de Dividendos
          </h3>
        </div>
      </div>

      {proventos.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '32px 0', 
          color: '#6b7280' 
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            ❌ Nenhum dividendo carregado para {ticker}
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px' }}>
            📅 Data de entrada: {dataEntrada}
          </p>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px'
            }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#0ea5e9',
                margin: '0 0 4px 0'
              }}>
                {proventos.length}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Pagamentos
              </div>
            </div>
            
            <div style={{
              textAlign: 'center',
              padding: '16px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px'
            }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#22c55e',
                margin: '0 0 4px 0'
              }}>
                {formatarValor(totalProventos).replace('$', '')}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Total
              </div>
            </div>
            
            <div style={{
              textAlign: 'center',
              padding: '16px',
              backgroundColor: '#fefce8',
              borderRadius: '8px'
            }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#eab308',
                margin: '0 0 4px 0'
              }}>
                {formatarValor(mediaProvento).replace('$', '')}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Média
              </div>
            </div>
            
            <div style={{
              textAlign: 'center',
              padding: '16px',
              backgroundColor: '#fdf4ff',
              borderRadius: '8px'
            }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#a855f7',
                margin: '0 0 4px 0'
              }}>
                {ultimoProvento ? 
                  (ultimoProvento.dataFormatada?.replace(/\/\d{4}/, '') || 
                   ultimoProvento.dataObj.toLocaleDateString('pt-BR').replace(/\/\d{4}/, '')) : 'N/A'}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Último
              </div>
            </div>
          </div>
          
          {/* Botão Mostrar Todos */}
          {proventos.length > 10 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '16px' 
            }}>
              <button
                onClick={() => setMostrarTodos(!mostrarTodos)}
                style={{
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  backgroundColor: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f1f5f9';
                  e.target.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                {mostrarTodos 
                  ? `📋 Mostrar apenas 10 recentes` 
                  : `📋 Mostrar todos os ${proventos.length} dividendos`
                }
              </button>
            </div>
          )}

          {/* Tabela */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              maxHeight: mostrarTodos ? '400px' : 'auto',
              overflowY: mostrarTodos ? 'auto' : 'visible'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      fontWeight: '700',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      Ativo
                    </th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      fontWeight: '700',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      Valor
                    </th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'center', 
                      fontWeight: '700',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      Ex-Dividend
                    </th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'center', 
                      fontWeight: '700',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      Pagamento
                    </th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'center', 
                      fontWeight: '700',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      Tipo
                    </th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      fontWeight: '700',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      Yield
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(mostrarTodos ? proventos : proventos.slice(0, 10)).map((provento, index) => (
                    <tr key={`${provento.data || provento.dataCom}-${index}`}
                        style={{ borderTop: index > 0 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ 
                        padding: '12px', 
                        fontWeight: '500',
                        fontSize: '14px'
                      }}>
                        {ticker}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right',
                        fontWeight: '700', 
                        color: '#22c55e',
                        fontSize: '14px'
                      }}>
                        {provento.valorFormatado || formatarValor(provento.valor)}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}>
                        {provento.dataComFormatada || 
                         provento.dataFormatada || 
                         provento.dataObj?.toLocaleDateString('pt-BR') || 
                         'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}>
                        {provento.dataPagamentoFormatada || 
                         provento.dataFormatada || 
                         provento.dataObj?.toLocaleDateString('pt-BR') || 
                         'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'center'
                      }}>
                        <span style={{
                          border: '1px solid #e2e8f0',
                          color: '#64748b',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {provento.tipo || 'Dividend'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right',
                        fontWeight: '700', 
                        color: '#1976d2',
                        fontSize: '14px'
                      }}>
                        {provento.dividendYield ? 
                          `${(provento.dividendYield > 0 && provento.dividendYield < 1 ? 
                             provento.dividendYield * 100 : 
                             provento.dividendYield).toFixed(2)}%` : 
                          '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Footer */}
          {proventos.length > 10 && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <p style={{ 
                fontSize: '12px', 
                color: '#6b7280',
                margin: 0
              }}>
                {mostrarTodos 
                  ? `Mostrando todos os ${proventos.length} dividendos com rolagem`
                  : `Mostrando os 10 mais recentes • Total: ${proventos.length}`
                }
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ========================================
// COMPONENTE AGENDA CORPORATIVA - VERSÃO INTERNACIONAL
// ========================================
const AgendaCorporativaInternacional = React.memo(({ ticker, dataEntrada }) => {
  const [eventos, setEventos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [debugInfo, setDebugInfo] = React.useState(null);
  const [showDebug, setShowDebug] = React.useState(false);

  // Função para calcular dias até o evento
  const calcularDiasAteEvento = React.useCallback((dataEvento) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const evento = new Date(dataEvento);
    evento.setHours(0, 0, 0, 0);
    
    const diffTime = evento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, []);

  // Função para formatar a proximidade do evento
  const formatarProximidade = React.useCallback((dias) => {
    if (dias < 0) return 'Passou';
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Amanhã';
    if (dias <= 7) return `Em ${dias} dias`;
    if (dias <= 30) return `Em ${Math.ceil(dias / 7)} semanas`;
    return `Em ${Math.ceil(dias / 30)} meses`;
  }, []);

  // 🔄 Função principal para carregar eventos - MESMA LÓGICA DO ARQUIVO 1
  const carregarEventos = React.useCallback(() => {
    if (!ticker) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 🔄 BUSCAR DADOS DA CENTRAL DA AGENDA (MESMO LOCAL DAS AÇÕES BRASILEIRAS)
      const agendaCorporativaCentral = localStorage.getItem('agenda_corporativa_central');
      
      const debug = {
        ticker,
        agendaCentralExiste: !!agendaCorporativaCentral,
        agendaCentralSize: agendaCorporativaCentral ? agendaCorporativaCentral.length : 0,
        dadosRaw: null,
        eventosTicker: null,
        eventosValidos: [],
        erros: []
      };

      console.log(`🔍 [DEBUG] Carregando eventos da CENTRAL para ${ticker} (Internacional):`, debug);

      if (!agendaCorporativaCentral) {
        debug.erros.push('localStorage agenda_corporativa_central não encontrado - use /central-agenda para fazer upload do CSV');
        setDebugInfo(debug);
        setEventos([]);
        setLoading(false);
        return;
      }

      let dadosAgenda;
      try {
        dadosAgenda = JSON.parse(agendaCorporativaCentral);
        debug.dadosRaw = dadosAgenda;
      } catch (parseError) {
        debug.erros.push(`Erro ao fazer parse do JSON: ${parseError.message}`);
        setDebugInfo(debug);
        setEventos([]);
        setLoading(false);
        return;
      }

      // 🎯 FILTRAR EVENTOS DO TICKER ESPECÍFICO (EXATA MESMA LÓGICA)
      const eventosTicker = Array.isArray(dadosAgenda) 
        ? dadosAgenda.filter((evento) => evento.ticker === ticker)
        : [];

      debug.eventosTicker = eventosTicker;

      if (eventosTicker.length === 0) {
        debug.erros.push(`Nenhum evento encontrado para ticker ${ticker} na central`);
        
        // Mostrar quais tickers estão disponíveis
        if (Array.isArray(dadosAgenda)) {
          const tickersDisponiveis = [...new Set(dadosAgenda.map((e) => e.ticker))];
          debug.tickersDisponiveis = tickersDisponiveis;
        }
        
        setDebugInfo(debug);
        setEventos([]);
        setLoading(false);
        return;
      }

      // 🔄 PROCESSAR E VALIDAR EVENTOS (MESMA LÓGICA)
      const eventosProcessados = eventosTicker.map((evento, index) => {
        try {
          // Converter data_evento para Date
          let dataEvento;
          
          if (evento.data_evento) {
            // Parser inteligente de datas - aceita múltiplos formatos
            const parseDataInteligente = (dataString) => {
              if (!dataString) return null;
              
              // Remover espaços e normalizar separadores
              const data = dataString.trim().replace(/\//g, '-').replace(/\./g, '-');
              
              const match = data.match(/^(\d{1,4})-(\d{1,2})-(\d{1,2})$/);
              if (!match) return null;
              
              const [, parte1, parte2, parte3] = match;
              let ano, mes, dia;
              
              // Detectar formato baseado nos valores
              if (parte1.length === 4) {
                // Começa com ano (4 dígitos)
                ano = parseInt(parte1);
                
                if (parseInt(parte2) > 12) {
                  // YYYY-DD-MM
                  dia = parseInt(parte2);
                  mes = parseInt(parte3);
                } else if (parseInt(parte3) > 12) {
                  // YYYY-MM-DD
                  mes = parseInt(parte2);
                  dia = parseInt(parte3);
                } else {
                  // Ambos podem ser mês/dia, assumir YYYY-MM-DD como padrão
                  mes = parseInt(parte2);
                  dia = parseInt(parte3);
                }
              } else {
                // Não começa com ano
                ano = parseInt(parte3);
                
                if (parseInt(parte1) > 12) {
                  // DD-MM-YYYY
                  dia = parseInt(parte1);
                  mes = parseInt(parte2);
                } else {
                  // Assumir formato brasileiro como padrão
                  dia = parseInt(parte1);
                  mes = parseInt(parte2);
                }
              }
              
              // Validar valores
              if (ano < 1900 || ano > 2100) return null;
              if (mes < 1 || mes > 12) return null;
              if (dia < 1 || dia > 31) return null;
              
              // Criar data com horário fixo para evitar problemas de timezone
              return new Date(ano, mes - 1, dia, 12, 0, 0);
            };

            // Usar o parser inteligente
            dataEvento = parseDataInteligente(evento.data_evento);
            if (!dataEvento) {
              console.error(`Data inválida: ${evento.data_evento}`);
              return null;
            }
          } else if (evento.data) {
            dataEvento = new Date(evento.data);
          } else {
            throw new Error('Campo data_evento não encontrado');
          }

          if (isNaN(dataEvento.getTime())) {
            throw new Error(`Data inválida: ${evento.data_evento || evento.data}`);
          }

          return {
            id: evento.id || `${ticker}-${index}`,
            ticker: evento.ticker,
            tipo: evento.tipo_evento || evento.tipo,
            titulo: evento.titulo,
            descricao: evento.descricao,
            data: evento.data_evento || evento.data,
            dataObj: dataEvento,
            status: evento.status,
            prioridade: evento.prioridade,
            categoria: evento.tipo_evento || evento.tipo,
            estimado: evento.status?.toLowerCase() === 'estimado',
            observacoes: evento.observacoes
          };
        } catch (error) {
          debug.erros.push(`Evento ${index}: ${error.message}`);
          return null;
        }
      }).filter(Boolean);

      // Ordenar eventos por data
      eventosProcessados.sort((a, b) => a.dataObj.getTime() - b.dataObj.getTime());

      debug.eventosValidos = eventosProcessados.map(e => ({
        id: e.id,
        titulo: e.titulo,
        data: e.dataObj.toISOString(),
        tipo: e.tipo
      }));

      setDebugInfo(debug);
      setEventos(eventosProcessados);
      
      console.log(`✅ [DEBUG] Eventos carregados da CENTRAL para ${ticker} (Internacional):`, {
        total: eventosProcessados.length,
        eventos: debug.eventosValidos
      });

    } catch (error) {
      console.error(`❌ [DEBUG] Erro geral ao carregar eventos internacionais:`, error);
      setDebugInfo({
        ticker,
        erros: [`Erro geral: ${error.message}`]
      });
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  // Carregar eventos ao montar o componente
  React.useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

  // 🎨 RENDER DO COMPONENTE (MESMA INTERFACE)
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>📅</span>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            margin: 0, 
            color: '#1f2937' 
          }}>
            Agenda Corporativa
          </h3>
        </div>
      </div>

      {/* ESTADO DE LOADING */}
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '32px 0' 
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid #e2e8f0',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '12px'
          }} />
          <p style={{ 
            color: '#6b7280', 
            fontSize: '14px',
            margin: 0
          }}>
            Carregando eventos...
          </p>
        </div>
      ) : eventos.length === 0 ? (
/* ESTADO SEM EVENTOS */
<div style={{ 
  textAlign: 'center', 
  padding: '32px 0', 
  color: '#6b7280' 
}}>
  <h4 style={{ 
    fontSize: '18px', 
    margin: '0 0 12px 0',
    color: '#374151' 
  }}>
    📭 Nenhum evento encontrado para {ticker}
  </h4>
</div>
      ) : (
        /* LISTA DE EVENTOS */
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {eventos.slice(0, 4).map((evento, index) => {
              const diasAteEvento = calcularDiasAteEvento(evento.dataObj);
              const proximidade = formatarProximidade(diasAteEvento);
              
              return (
                <div key={evento.id} style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  cursor: 'default',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                }}>
                  <div style={{ padding: '20px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '24px'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '16px',
                          marginBottom: '12px'
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ 
                              fontWeight: 600,
                              fontSize: '16px',
                              margin: '0 0 8px 0',
                              color: '#1e293b'
                            }}>
                              {evento.titulo}
                            </h4>
                            
                            <p style={{ 
                              color: '#64748b', 
                              fontSize: '14px',
                              lineHeight: 1.4,
                              margin: '0 0 12px 0'
                            }}>
                              {evento.descricao}
                            </p>

                            <div style={{ 
                              display: 'flex', 
                              gap: '8px', 
                              alignItems: 'center',
                              flexWrap: 'wrap'
                            }}>
                              <div style={{ 
                                backgroundColor: diasAteEvento <= 7 ? '#f59e0b' : '#6b7280',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 500,
                                padding: '4px 12px',
                                borderRadius: '6px'
                              }}>
                                {proximidade}
                              </div>
                              
                              <div style={{ 
                                fontSize: '12px',
                                border: '1px solid #d1d5db',
                                color: '#6b7280',
                                padding: '4px 12px',
                                borderRadius: '6px'
                              }}>
                                {evento.tipo}
                              </div>
                            </div>
                          </div>

                          <div style={{ 
                            textAlign: 'right',
                            minWidth: '120px',
                            flexShrink: 0
                          }}>
                            <div style={{ 
                              fontWeight: 700,
                              color: diasAteEvento <= 7 ? '#f59e0b' : '#3b82f6',
                              fontSize: '24px',
                              lineHeight: 1
                            }}>
                              {evento.dataObj.getDate()}
                            </div>
                            <div style={{ 
                              fontWeight: 600,
                              color: '#64748b',
                              fontSize: '14px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginTop: '4px'
                            }}>
                              {evento.dataObj.toLocaleDateString('pt-BR', {
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div style={{ 
                              fontSize: '12px',
                              color: '#64748b',
                              marginTop: '4px'
                            }}>
                              {evento.dataObj.toLocaleDateString('pt-BR', {
                                weekday: 'long'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {eventos.length > 4 && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <p style={{ 
                fontSize: '12px', 
                color: '#6b7280',
                margin: 0
              }}>
                Mostrando os próximos 4 eventos • Total: {eventos.length}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
});

// ========================================
// GERENCIADOR DE RELATÓRIOS - VERSÃO INTERNACIONAL
// ========================================

// Funções utilitárias (mesmas do arquivo 1)
const calcularHash = async (arquivo) => {
  const buffer = await arquivo.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const processarPdfHibrido = async (arquivo) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      resolve({
        arquivoPdf: reader.result,
        nomeArquivoPdf: arquivo.name,
        tamanhoArquivo: arquivo.size,
        dataUploadPdf: new Date().toISOString()
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(arquivo);
  });
};

const GerenciadorRelatoriosInternacional = React.memo(({ ticker }) => {
  const [relatorios, setRelatorios] = React.useState([]);
  const [dialogVisualizacao, setDialogVisualizacao] = React.useState(false);
  const [relatorioSelecionado, setRelatorioSelecionado] = React.useState(null);
  const [loadingIframe, setLoadingIframe] = React.useState(false);
  const [timeoutError, setTimeoutError] = React.useState(false);
  
  // Estados para re-upload de PDFs grandes
  const [dialogReupload, setDialogReupload] = React.useState(false);
  const [relatorioReupload, setRelatorioReupload] = React.useState(null);
  const [arquivoReupload, setArquivoReupload] = React.useState(null);

  // ✅ CARREGAMENTO CENTRALIZADO (EXATA MESMA LÓGICA DO ARQUIVO 1)
  React.useEffect(() => {
    carregarRelatoriosCentralizados();
    
    // Listener para mudanças no localStorage (sincronização em tempo real)
    const handleStorageChange = (e) => {
      if (e.key === 'relatorios_central') {
        carregarRelatoriosCentralizados();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [ticker]);

  const carregarRelatoriosCentralizados = React.useCallback(() => {
    try {
      const dadosCentralizados = localStorage.getItem('relatorios_central');
      
      if (dadosCentralizados) {
        const dados = JSON.parse(dadosCentralizados);
        const relatoriosTicker = dados[ticker] || [];
        
        // Converter para formato compatível
        const relatoriosFormatados = relatoriosTicker.map((rel) => ({
          ...rel,
          arquivo: rel.arquivoPdf ? 'PDF_CENTRALIZADO' : undefined,
          tamanho: rel.tamanhoArquivo ? `${(rel.tamanhoArquivo / 1024 / 1024).toFixed(1)} MB` : undefined
        }));
        
        setRelatorios(relatoriosFormatados);
        console.log(`✅ Relatórios carregados para ${ticker} (Internacional):`, relatoriosFormatados.length);
      } else {
        setRelatorios([]);
        console.log(`❌ Nenhum relatório encontrado para ${ticker} (Internacional)`);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios internacionais:', error);
      setRelatorios([]);
    }
  }, [ticker]);

  // Re-upload para PDFs grandes (MESMA LÓGICA)
  const handleReuploadPdf = React.useCallback(async (arquivo, relatorio) => {
    try {
      if (relatorio.hashArquivo) {
        const novoHash = await calcularHash(arquivo);
        if (novoHash !== relatorio.hashArquivo) {
          if (!confirm('⚠️ O arquivo selecionado parece ser diferente do original. Continuar mesmo assim?')) {
            return;
          }
        }
      }

      const dadosPdf = await processarPdfHibrido(arquivo);
      const dadosCentralizados = JSON.parse(localStorage.getItem('relatorios_central') || '{}');
      
      if (dadosCentralizados[ticker]) {
        const index = dadosCentralizados[ticker].findIndex((r) => r.id === relatorio.id);
        if (index !== -1) {
          dadosCentralizados[ticker][index] = {
            ...dadosCentralizados[ticker][index],
            ...dadosPdf,
            solicitarReupload: false
          };
          
          localStorage.setItem('relatorios_central', JSON.stringify(dadosCentralizados));
          carregarRelatoriosCentralizados();
          
          setDialogReupload(false);
          setArquivoReupload(null);
          setRelatorioReupload(null);
          
          alert('✅ PDF atualizado com sucesso!');
        }
      }
      
    } catch (error) {
      console.error('Erro no re-upload:', error);
      alert('❌ Erro ao processar arquivo');
    }
  }, [ticker, carregarRelatoriosCentralizados]);

  // Download de PDF (MESMA LÓGICA)
  const baixarPdf = React.useCallback((relatorio) => {
    if (!relatorio.arquivoPdf) {
      if (relatorio.solicitarReupload) {
        setRelatorioReupload(relatorio);
        setDialogReupload(true);
        return;
      } else {
        alert('❌ Arquivo PDF não encontrado!');
        return;
      }
    }
    
    try {
      const link = document.createElement('a');
      link.href = relatorio.arquivoPdf;
      link.download = relatorio.nomeArquivoPdf || `${relatorio.nome.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Feedback visual
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #22c55e; color: white;
        padding: 12px 20px; border-radius: 8px; z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      toast.textContent = '📥 Download iniciado!';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
      
    } catch (error) {
      alert('❌ Erro ao baixar o arquivo. Tente novamente.');
    }
  }, []);

  const getIconePorTipo = React.useCallback((tipo) => {
    switch (tipo) {
      case 'iframe': return '🖼️';
      case 'canva': return '🎨';
      case 'link': return '🔗';
      case 'pdf': return '📄';
      default: return '📄';
    }
  }, []);

  // ✅ INTERFACE LIMPA - MESMA DO ARQUIVO 1
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>📋</span>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            margin: 0, 
            color: '#1f2937' 
          }}>
            Relatórios da Empresa
          </h3>
        </div>
      </div>

      {relatorios.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '32px 0', 
          color: '#6b7280' 
        }}>
          <h4 style={{ 
            fontSize: '16px',
            margin: '0 0 8px 0',
            color: '#374151'
          }}>
            Nenhum relatório cadastrado para {ticker}
          </h4>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {relatorios.map((relatorio) => (
            <div key={relatorio.id} style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              backgroundColor: 'white',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
            }}>
              <div style={{ padding: '20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  {/* Informações do relatório */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <span>{getIconePorTipo(relatorio.tipoVisualizacao)}</span>
                      <h4 style={{ 
                        fontSize: '16px', 
                        fontWeight: 600,
                        margin: 0,
                        color: '#1f2937'
                      }}>
                        {relatorio.nome}
                      </h4>
                      {relatorio.solicitarReupload && (
                        <div style={{ 
                          fontSize: '11px',
                          border: '1px solid #f59e0b',
                          color: '#d97706',
                          backgroundColor: '#fef3c7',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          Re-upload
                        </div>
                      )}
                    </div>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#64748b',
                        margin: 0
                      }}>
                        {relatorio.tipo} • {relatorio.dataReferencia}
                      </p>
                      {relatorio.tamanhoArquivo && (
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#64748b',
                          margin: '4px 0 0 0'
                        }}>
                          📊 {(relatorio.tamanhoArquivo / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Botões de ação */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {/* Botão de visualização */}
                    <button
                      onClick={() => {
                        setRelatorioSelecionado(relatorio);
                        setDialogVisualizacao(true);
                        setLoadingIframe(true);
                        setTimeoutError(false);
                      }}
                      style={{
                        backgroundColor: '#e3f2fd',
                        border: '1px solid #bbdefb',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#1976d2',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#bbdefb';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#e3f2fd';
                      }}
                      title="Visualizar conteúdo"
                    >
                      👁 Ver
                    </button>
                    
                    {/* Botão de download/re-upload */}
                    {(relatorio.arquivoPdf || relatorio.nomeArquivoPdf) && (
                      <button
                        onClick={() => baixarPdf(relatorio)}
                        style={{
                          backgroundColor: relatorio.solicitarReupload ? '#fef3c7' : '#f0fdf4',
                          border: `1px solid ${relatorio.solicitarReupload ? '#fde68a' : '#bbf7d0'}`,
                          borderRadius: '6px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: relatorio.solicitarReupload ? '#d97706' : '#22c55e',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (relatorio.solicitarReupload) {
                            e.target.style.backgroundColor = '#fde68a';
                          } else {
                            e.target.style.backgroundColor = '#bbf7d0';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (relatorio.solicitarReupload) {
                            e.target.style.backgroundColor = '#fef3c7';
                          } else {
                            e.target.style.backgroundColor = '#f0fdf4';
                          }
                        }}
                        title={relatorio.solicitarReupload ? "Re-upload necessário" : "Baixar PDF"}
                      >
                        {relatorio.solicitarReupload ? '📤 Upload' : '📥 PDF'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de visualização (MESMA LÓGICA) */}
      {dialogVisualizacao && relatorioSelecionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={() => {
          setDialogVisualizacao(false);
          setLoadingIframe(false);
          setTimeoutError(false);
          setRelatorioSelecionado(null);
        }}>
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            width: '95%',
            height: '95%',
            maxWidth: '1200px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}>
            
            {/* Header do dialog */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              backgroundColor: 'white',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div>
                <h3 style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '18px',
                  fontWeight: 600,
                  margin: '0 0 4px 0',
                  color: '#1f2937'
                }}>
                  {getIconePorTipo(relatorioSelecionado?.tipoVisualizacao || '')} 
                  {relatorioSelecionado?.nome}
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: '#64748b',
                  margin: 0
                }}>
                  {relatorioSelecionado?.tipo} • {relatorioSelecionado?.dataReferencia}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    const src = relatorioSelecionado.tipoVisualizacao === 'canva' 
                      ? relatorioSelecionado.linkCanva 
                      : relatorioSelecionado.linkExterno;
                    if (src) window.open(src, '_blank');
                  }}
                  style={{
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                  title="Abrir em nova aba"
                >
                  🔗
                </button>
                <button 
                  onClick={() => {
                    setDialogVisualizacao(false);
                    setLoadingIframe(false);
                    setTimeoutError(false);
                    setRelatorioSelecionado(null);
                  }}
                  style={{
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Conteúdo do dialog */}
            <div style={{ position: 'relative', flex: 1, backgroundColor: '#f8fafc' }}>
              {loadingIframe && !timeoutError && (
                <div style={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e2e8f0',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                  }} />
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Carregando conteúdo...
                  </p>
                </div>
              )}

              {timeoutError && (
                <div style={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                  textAlign: 'center',
                  maxWidth: '400px',
                  padding: '24px'
                }}>
                  <h4 style={{
                    fontSize: '18px',
                    color: '#ef4444',
                    margin: '0 0 16px 0'
                  }}>
                    ⚠️ Erro ao Carregar
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '0 0 24px 0'
                  }}>
                    O conteúdo não pôde ser carregado.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => {
                        setTimeoutError(false);
                        setLoadingIframe(true);
                      }}
                      style={{
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🔄 Tentar Novamente
                    </button>
                    <button 
                      onClick={() => {
                        const src = relatorioSelecionado.tipoVisualizacao === 'canva' 
                          ? relatorioSelecionado.linkCanva 
                          : relatorioSelecionado.linkExterno;
                        if (src) window.open(src, '_blank');
                      }}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🔗 Abrir em Nova Aba
                    </button>
                  </div>
                </div>
              )}

              {/* Iframe principal */}
              <iframe
                src={(() => {
                  const relatorio = relatorioSelecionado;
                  
                  let url = '';
                  if (relatorio.tipoVisualizacao === 'canva') {
                    url = relatorio.linkCanva || '';
                  } else {
                    url = relatorio.linkExterno || '';
                  }
                  
                  if (!url) return '';
                  
                  // Processar Canva automaticamente
                  if (url.includes('canva.com')) {
                    if (url.includes('?embed')) return url;
                    if (url.includes('/view')) return url + '?embed';
                    if (url.includes('/design/')) return url.replace(/\/(edit|preview).*$/, '/view?embed');
                  }
                  
                  return url;
                })()}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 'none', 
                  borderRadius: '8px',
                  opacity: timeoutError ? 0.3 : 1
                }}
                allowFullScreen
                onLoad={() => {
                  setLoadingIframe(false);
                  setTimeoutError(false);
                }}
                onError={() => {
                  setLoadingIframe(false);
                  setTimeoutError(true);
                }}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                referrerPolicy="no-referrer-when-downgrade"
              />
              
              {!loadingIframe && !timeoutError && (
                <div style={{ 
                  position: 'absolute', 
                  top: '16px', 
                  right: '16px',
                  zIndex: 1
                }}>
                  <button
                    onClick={() => {
                      const src = relatorioSelecionado.tipoVisualizacao === 'canva' 
                        ? relatorioSelecionado.linkCanva 
                        : relatorioSelecionado.linkExterno;
                      if (src) window.open(src, '_blank');
                    }}
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '8px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                    title="Abrir em nova aba"
                  >
                    🔗
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog de re-upload (MESMA LÓGICA) */}
      {dialogReupload && relatorioReupload && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={() => setDialogReupload(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            padding: '24px'
          }}
          onClick={(e) => e.stopPropagation()}>
            
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              margin: '0 0 16px 0',
              color: '#1f2937'
            }}>
              📤 Re-upload de PDF
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#92400e',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  <strong>📁 PDF Grande Detectado:</strong><br/>
                  • <strong>Arquivo:</strong> {relatorioReupload.nomeArquivoPdf}<br/>
                  • <strong>Tamanho:</strong> {relatorioReupload.tamanhoArquivo ? (relatorioReupload.tamanhoArquivo / 1024 / 1024).toFixed(2) : 'N/A'} MB<br/>
                  • <strong>Motivo:</strong> PDFs >3MB são armazenados como referência
                </p>
              </div>
              
              <input
                accept="application/pdf"
                style={{ display: 'none' }}
                id="reupload-pdf-input"
                type="file"
                onChange={(e) => {
                  const arquivo = e.target.files?.[0];
                  if (arquivo && arquivo.size <= 10 * 1024 * 1024) {
                    setArquivoReupload(arquivo);
                  } else {
                    alert('Arquivo muito grande! Máximo 10MB.');
                  }
                }}
              />
              <label htmlFor="reupload-pdf-input">
                <button
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  ☁️ {arquivoReupload ? '✅ Arquivo Selecionado' : '📁 Selecionar PDF'}
                </button>
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDialogReupload(false)}
                style={{
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (arquivoReupload && relatorioReupload) {
                    handleReuploadPdf(arquivoReupload, relatorioReupload);
                  }
                }}
                disabled={!arquivoReupload}
                style={{
                  background: arquivoReupload ? '#22c55e' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: arquivoReupload ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                📤 Fazer Upload
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});


export default function EmpresaExteriorDetalhes() {

  const getBackURL = (staticData, ticker) => {
    const baseURL = 'https://membros-fatosda-bolsa.vercel.app/dashboard/internacional';
    
    // Se não tem dados estáticos, verifica se é um ETF conhecido pelo ticker
    if (!staticData) {
      const knownETFs = ['VOO', 'IJS', 'QUAL', 'QQQ', 'VNQ', 'SCHP', 'IAU', 'HERO', 'SOXX', 'MCHI', 'TFLO'];
      
      if (knownETFs.includes(ticker)) {
        return `${baseURL}/etfs`;
      }
      
      return `${baseURL}/stocks`;
    }
    
    // Se tem dados estáticos, usa o tipo para determinar a página
    // Se está em múltiplas carteiras, prioriza o Projeto América
    if (staticData.multiplePortfolios && staticData.portfoliosList.includes('PROJETO_AMERICA')) {
      return `${baseURL}/projeto-america`;
    }
    
    switch (staticData.tipo) {
      case 'PROJETO_AMERICA':
        return `${baseURL}/projeto-america`;
      case 'ETF':
        return `${baseURL}/etfs`;
      case 'DIVIDEND':
        return `${baseURL}/dividendos`;
      case 'STOCK':
      case 'STOCK_API':
      default:
        return `${baseURL}/stocks`;
    }
  };

  // Função para o botão de volta inteligente
  const handleSmartBack = (staticData, ticker) => {
    const backURL = getBackURL(staticData, ticker);
    
    // Primeiro tenta usar o history.back() se a página anterior for a correta
    if (document.referrer && document.referrer.includes('/dashboard/internacional/')) {
      const referrerType = document.referrer.split('/').pop();
      const expectedType = backURL.split('/').pop();
      
      if (referrerType === expectedType) {
        window.history.back();
        return;
      }
    }
    
    // Se não, redireciona diretamente para a página correta
    window.location.href = backURL;
  };
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState(null);
  const [staticData, setStaticData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [apiData, setApiData] = useState({ stocks: [], dividends: [] });
  
  // 🇧🇷 Buscar dados do BDR se existir
  const { bdrData, bdrLoading } = useBDRDataAPI(staticData?.bdr);

    const spinKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  // 🗄️ BANCO DE DADOS ESTÁTICO DAS EMPRESAS
const exteriorStocksDatabase = {
  'AMD': {
    rank: '1º',
    name: 'Advanced Micro Devices Inc.',
    setor: 'Tecnologia',
    dataEntrada: '29/05/2025',
    precoQueIniciou: 'US$112,86',
    precoTeto: 'US$135,20',
    avatar: 'https://logo.clearbit.com/amd.com',
    tipo: 'STOCK',
    bdr: 'A1MD34',
    bdrTeto: 'R$ 93,20'
  },
  'XP': {
    rank: '2º',
    name: 'XP Inc.',
    setor: 'Financial Services',
    dataEntrada: '26/05/2023',
    precoQueIniciou: 'US$18,41',
    precoTeto: 'US$24,34',
    avatar: 'https://logo.clearbit.com/xpi.com.br',
    tipo: 'STOCK',
    bdr: 'XPBR31',
    bdrTeto: 'R$ 119,00'
  },
  'HD': {
    rank: '3º',
    name: 'Home Depot Inc.',
    setor: 'Varejo',
    dataEntrada: '24/02/2023',
    precoQueIniciou: 'US$299,31',
    precoTeto: 'US$366,78',
    avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNVCjcsiLtCJcZB7cBiq-VvWXAJ8WcRzvzXg&s',
    tipo: 'STOCK',
    bdr: 'HOME34',
    bdrTeto: 'R$ 65,88'
  },
  'AAPL': {
    rank: '4º',
    name: 'Apple Inc.',
    setor: 'Tecnologia',
    dataEntrada: '05/05/2022',
    precoQueIniciou: 'US$156,77',
    precoTeto: 'US$170,00',
    avatar: 'https://logo.clearbit.com/apple.com',
    tipo: 'STOCK',
    bdr: 'AAPL34',
    bdrTeto: 'R$ 42,39'
  },
  'FIVE': {
    rank: '5º',
    name: 'Five Below Inc.',
    setor: 'Varejo',
    dataEntrada: '17/03/2022',
    precoQueIniciou: 'US$163,41',
    precoTeto: 'US$179,00',
    avatar: 'https://logo.clearbit.com/fivebelow.com',
    tipo: 'STOCK'
  },
  'AMAT': {
    rank: '6º',
    name: 'Applied Materials Inc.',
    setor: 'Semicondutores',
    dataEntrada: '07/04/2022',
    precoQueIniciou: 'US$122,40',
    precoTeto: 'US$151,30',
    avatar: 'https://logo.clearbit.com/appliedmaterials.com',
    tipo: 'STOCK',
    bdr: 'A1MT34',
    bdrTeto: 'R$ 74,00'
  },
  'COST': {
    rank: '7º',
    name: 'Costco Wholesale Corporation',
    setor: 'Consumer Discretionary',
    dataEntrada: '23/06/2022',
    precoQueIniciou: 'US$459,00',
    precoTeto: 'US$571,00',
    avatar: 'https://logo.clearbit.com/costco.com',
    tipo: 'STOCK',
    bdr: 'COWC34',
    bdrTeto: 'R$ 71,91'
  },
  'GOOGL': {
    rank: '8º',
    name: 'Alphabet Inc.',
    setor: 'Tecnologia',
    dataEntrada: '06/03/2022',
    precoQueIniciou: 'US$131,83',
    precoTeto: 'US$153,29',
    avatar: 'https://logo.clearbit.com/google.com',
    tipo: 'STOCK',
    bdr: 'GOGL34',
    bdrTeto: 'R$ 54,60'
  },
  'META': {
    rank: '9º',
    name: 'Meta Platforms Inc.',
    setor: 'Tecnologia',
    dataEntrada: '17/02/2022',
    precoQueIniciou: 'US$213,92',
    precoTeto: 'US$322,00',
    avatar: 'https://logo.clearbit.com/meta.com',
    tipo: 'STOCK',
    bdr: 'M1TA34',
    bdrTeto: 'R$ 54,45'
  },
  'BRK-B': {
    rank: '10º',
    name: 'Berkshire Hathaway Inc.',
    setor: 'Holding',
    dataEntrada: '11/05/2021',
    precoQueIniciou: 'US$286,35',
    precoTeto: 'US$330,00',
    avatar: 'https://logo.clearbit.com/berkshirehathaway.com',
    tipo: 'STOCK',
    bdr: 'BERK34',
    bdrTeto: 'R$ 71,34'
  }
};
  
  // 🗄️ BANCO DE DADOS ESTÁTICO DOS DIVIDENDOS INTERNACIONAIS
const exteriorDividendsDatabase = {
  'OXY': {
    rank: '1º',
    name: 'Occidental Petroleum Corporation',
    setor: 'STOCK - Petroleum',
    dataEntrada: '14/04/2023',
    precoQueIniciou: 'US$37,92',
    precoTeto: 'US$60,10',
    avatar: 'https://logo.clearbit.com/oxy.com',
    tipo: 'DIVIDEND',
    dy: '2,34%',
    bdr: 'OXYP34',
    bdrTeto: 'R$ 58,54'
  },
  'ADC': {
    rank: '2º',
    name: 'Agree Realty Corporation',
    setor: 'REIT - Net Lease',
    dataEntrada: '15/03/2023',
    precoQueIniciou: 'US$58,25',
    precoTeto: 'US$72,80',
    avatar: 'https://logo.clearbit.com/agreerealty.com',
    tipo: 'DIVIDEND',
    dy: '4,12%'
    // Não tem BDR disponível
  },
  'VZ': {
    rank: '3º',
    name: 'Verizon Communications Inc.',
    setor: 'Stock - Telecom',
    dataEntrada: '28/03/2022',
    precoQueIniciou: 'US$51,17',
    precoTeto: 'US$51,12',
    avatar: 'https://logo.clearbit.com/verizon.com',
    tipo: 'DIVIDEND',
    dy: '6,57%',
    bdr: 'VERZ34',
    bdrTeto: 'R$ 44,39'
  },
  'O': {
    rank: '4º',
    name: 'Realty Income Corporation',
    setor: 'REIT - Net Lease',
    dataEntrada: '01/02/2024',
    precoQueIniciou: 'US$54,39',
    precoTeto: 'US$58,91',
    avatar: 'https://logo.clearbit.com/realtyincome.com',
    tipo: 'DIVIDEND',
    dy: '6,13%',
    bdr: 'R1IN34',
    bdrTeto: 'R$ 146,30'
  },
  'AVB': {
    rank: '5º',
    name: 'AvalonBay Communities Inc.',
    setor: 'REIT - Apartamentos',
    dataEntrada: '10/02/2022',
    precoQueIniciou: 'US$242,00',
    precoTeto: 'US$340,00',
    avatar: 'https://logo.clearbit.com/avalonbay.com',
    tipo: 'DIVIDEND',
    dy: '3,96%',
    bdr: 'A1VB34',
    bdrTeto: 'R$ 445,86'
  },
  'STAG': {
    rank: '6º',
    name: 'Stag Industrial Inc.',
    setor: 'REIT - Industrial',
    dataEntrada: '24/03/2022',
    precoQueIniciou: 'US$40,51',
    precoTeto: 'US$42,87',
    avatar: 'https://logo.clearbit.com/stagindustrial.com',
    tipo: 'DIVIDEND',
    dy: '4,55%',
    bdr: 'S2TA34',
    bdrTeto: 'R$ 44,06'
  }
};
  
  // 🗄️ BANCO DE DADOS ESTÁTICO DOS ETFs INTERNACIONAIS
const exteriorETFsDatabase = {
  'VOO': {
    rank: '1º',
    name: 'Vanguard S&P 500 ETF',
    setor: 'Large Cap',
    dataEntrada: '03/06/2021',
    precoQueIniciou: 'US$383,95',
    precoTeto: 'US$520,00',
    avatar: 'https://logo.clearbit.com/vanguard.com',
    tipo: 'ETF',
    dy: '1,32%'
  },
  'IJS': {
    rank: '2º',
    name: 'iShares Core S&P Small-Cap ETF',
    setor: 'Small Caps',
    dataEntrada: '21/07/2021',
    precoQueIniciou: 'US$100,96',
    precoTeto: 'US$125,00',
    avatar: 'https://logo.clearbit.com/ishares.com',
    tipo: 'ETF',
    dy: '1,85%'
  },
  'QUAL': {
    rank: '3º',
    name: 'iShares MSCI USA Quality Factor ETF',
    setor: 'Total Market',
    dataEntrada: '11/06/2021',
    precoQueIniciou: 'US$130,13',
    precoTeto: 'US$170,00',
    avatar: 'https://logo.clearbit.com/ishares.com',
    tipo: 'ETF',
    dy: '1,45%'
  },
  'QQQ': {
    rank: '4º',
    name: 'Invesco QQQ Trust ETF',
    setor: 'Large Cap',
    dataEntrada: '09/06/2021',
    precoQueIniciou: 'US$337,18',
    precoTeto: 'US$495,00',
    avatar: 'https://logo.clearbit.com/invesco.com',
    tipo: 'ETF',
    dy: '0,68%'
  },
  'VNQ': {
    rank: '5º',
    name: 'Vanguard Real Estate ETF',
    setor: 'Real Estate (USA)',
    dataEntrada: '12/07/2021',
    precoQueIniciou: 'US$105,96',
    precoTeto: 'US$115,00',
    avatar: 'https://logo.clearbit.com/vanguard.com',
    tipo: 'ETF',
    dy: '3,85%'
  },
  'SCHP': {
    rank: '6º',
    name: 'Schwab U.S. TIPS ETF',
    setor: 'Renda Fixa',
    dataEntrada: '22/11/2021',
    precoQueIniciou: 'US$63,14',
    precoTeto: 'US$67,00',
    avatar: 'https://logo.clearbit.com/schwab.com',
    tipo: 'ETF',
    dy: '3,25%'
  },
  'IAU': {
    rank: '7º',
    name: 'iShares Gold Trust ETF',
    setor: 'Ouro',
    dataEntrada: '07/06/2021',
    precoQueIniciou: 'US$36,04',
    precoTeto: 'US$45,00',
    avatar: 'https://logo.clearbit.com/ishares.com',
    tipo: 'ETF',
    dy: '0,00%'
  },
  'HERO': {
    rank: '8º',
    name: 'Global X Video Games & Esports ETF',
    setor: 'Games',
    dataEntrada: '15/07/2021',
    precoQueIniciou: 'US$31,28',
    precoTeto: 'US$35,00',
    avatar: 'https://logo.clearbit.com/globalxetfs.com',
    tipo: 'ETF',
    dy: '0,00%'
  },
  'SOXX': {
    rank: '9º',
    name: 'iShares Semiconductor ETF',
    setor: 'Semicondutores',
    dataEntrada: '04/08/2021',
    precoQueIniciou: 'US$156,03',
    precoTeto: 'US$250,00',
    avatar: 'https://logo.clearbit.com/ishares.com',
    tipo: 'ETF',
    dy: '1,12%'
  },
  'MCHI': {
    rank: '10º',
    name: 'iShares MSCI China ETF',
    setor: 'Empresas Chinesas',
    dataEntrada: '01/02/2023',
    precoQueIniciou: 'US$53,58',
    precoTeto: 'US$60,00',
    avatar: 'https://logo.clearbit.com/ishares.com',
    tipo: 'ETF',
    dy: '2,45%'
  },
  'TFLO': {
    rank: '11º',
    name: 'iShares Treasury Floating Rate Bond ETF',
    setor: 'Renda Fixa',
    dataEntrada: '21/03/2023',
    precoQueIniciou: 'US$50,50',
    precoTeto: 'US$52,00',
    avatar: 'https://logo.clearbit.com/ishares.com',
    tipo: 'ETF',
    dy: '4,75%'
  }
};

// 🗄️ BANCO DE DADOS ESTÁTICO DO PROJETO AMÉRICA
const projetoAmericaDatabase = {
  'NVDA': {
    rank: '1º',
    name: 'NVIDIA Corporation',
    setor: 'Semicondutores',
    dataEntrada: '09/04/2025',
    precoQueIniciou: 'US$98,88',
    precoTeto: 'US$110,00',
    avatar: 'https://logo.clearbit.com/nvidia.com',
    tipo: 'PROJETO_AMERICA',
    bdr: 'NVDC34',
    bdrTeto: 'R$ 13,85'
  },
  'AMZN': {
    rank: '2º',
    name: 'Amazon.com Inc.',
    setor: 'E-commerce/Cloud',
    dataEntrada: '16/04/2025',
    precoQueIniciou: 'US$176,29',
    precoTeto: 'US$203,00',
    avatar: 'https://logo.clearbit.com/amazon.com',
    tipo: 'PROJETO_AMERICA',
    bdr: 'AMZO34',
    bdrTeto: 'R$ 59,90'
  },
  'PEP': {
    rank: '3º',
    name: 'PepsiCo Inc.',
    setor: 'Bebidas/Alimentos',
    dataEntrada: '22/04/2025',
    precoQueIniciou: 'US$141,78',
    precoTeto: 'US$149,66',
    avatar: 'https://logo.clearbit.com/pepsico.com',
    tipo: 'PROJETO_AMERICA',
    bdr: 'PEPB34',
    bdrTeto: 'R$ 57,15'
  },
  'IAU': {
    rank: '4º',
    name: 'iShares Gold Trust ETF',
    setor: 'Ouro',
    dataEntrada: '30/04/2025',
    precoQueIniciou: 'US$62,48',
    precoTeto: '-',
    avatar: 'https://logo.clearbit.com/ishares.com',
    tipo: 'PROJETO_AMERICA',
    bdr: 'GOLD11',
    bdrTeto: 'não tem'
  },
  'WPC': {
    rank: '5º',
    name: 'W. P. Carey Inc.',
    setor: 'REIT',
    dataEntrada: '07/05/2025',
    precoQueIniciou: 'US$62,17',
    precoTeto: 'US$65,00',
    avatar: 'https://logo.clearbit.com/wpcarey.com',
    tipo: 'PROJETO_AMERICA'
  },
  'NOBL': {
    rank: '6º',
    name: 'ProShares S&P 500 Dividend Aristocrats ETF',
    setor: 'Dividend Aristocrats',
    dataEntrada: '14/05/2025',
    precoQueIniciou: 'US$99,26',
    precoTeto: '-',
    avatar: 'https://logo.clearbit.com/proshares.com',
    tipo: 'PROJETO_AMERICA'
  },
  'CRM': {
    rank: '7º',
    name: 'Salesforce Inc.',
    setor: 'Software/CRM',
    dataEntrada: '21/05/2025',
    precoQueIniciou: 'US$286,85',
    precoTeto: 'US$310,00',
    avatar: 'https://logo.clearbit.com/salesforce.com',
    tipo: 'PROJETO_AMERICA',
    bdr: 'SSFO34',
    bdrTeto: 'R$ 80,00'
  },
  'AMD': {
    rank: '8º',
    name: 'Advanced Micro Devices Inc.',
    setor: 'Semicondutores',
    dataEntrada: '29/05/2025',
    precoQueIniciou: 'US$112,86',
    precoTeto: 'US$135,20',
    avatar: 'https://logo.clearbit.com/amd.com',
    tipo: 'PROJETO_AMERICA',
    bdr: 'A1MD34',
    bdrTeto: 'R$ 95,00'
  },
  'TLT': {
    rank: '9º',
    name: 'iShares 20+ Year Treasury Bond ETF',
    setor: 'Renda Fixa',
    dataEntrada: '05/06/2025',
    precoQueIniciou: 'US$86,82',
    precoTeto: '-',
    avatar: 'https://logo.clearbit.com/ishares.com',
    tipo: 'PROJETO_AMERICA',
    bdr: 'BTL139'
  },
  'QQQ': {
    rank: '10º',
    name: 'Invesco QQQ Trust ETF',
    setor: 'Large Cap Tech',
    dataEntrada: '12/06/2025',
    precoQueIniciou: 'US$533,98',
    precoTeto: '-',
    avatar: 'https://logo.clearbit.com/invesco.com',
    tipo: 'PROJETO_AMERICA',
    bdr: 'NASD11'
  },
  'NNN': {
    rank: '11º',
    name: 'National Retail Properties Inc.',
    setor: 'REIT - Net Lease',
    dataEntrada: '18/06/2025',
    precoQueIniciou: 'US$42,90',
    precoTeto: 'US$45,00',
    avatar: 'https://logo.clearbit.com/nnnreit.com',
    tipo: 'PROJETO_AMERICA'
  },
  'PYPL': {
    rank: '12º',
    name: 'PayPal Holdings Inc.',
    setor: 'Fintech/Pagamentos',
    dataEntrada: '27/06/2025',
    precoQueIniciou: 'US$72,16',
    precoTeto: 'US$107,00',
    avatar: 'https://logo.clearbit.com/paypal.com',
    tipo: 'PROJETO_AMERICA',
    bdr: 'PYPL34',
    bdrTeto: 'R$ 29,30'
  }
};

  // 🔗 FUNÇÃO PARA BUSCAR DADOS DAS APIs
const fetchAPIData = async () => {
  console.log('🔍 Buscando dados das APIs...');
  
  try {
    // Buscar dados de stocks
    const stocksResponse = await fetch('/api/financial/stocks', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });

    let stocksData = [];
    if (stocksResponse.ok) {
      const stocksResult = await stocksResponse.json();
      stocksData = stocksResult.stocks || [];
      console.log('✅ Dados de stocks da API:', stocksData.length, 'itens');
    }

    // Buscar dados de dividendos
    const dividendsResponse = await fetch('/api/financial/dividends', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });

    let dividendsData = [];
    if (dividendsResponse.ok) {
      const dividendsResult = await dividendsResponse.json();
      dividendsData = dividendsResult.dividends || [];
      console.log('✅ Dados de dividendos da API:', dividendsData.length, 'itens');
    }

    setApiData({ stocks: stocksData, dividends: dividendsData });
    return { stocks: stocksData, dividends: dividendsData };
  } catch (err) {
    console.error('❌ Erro ao buscar dados das APIs:', err);
    setApiData({ stocks: [], dividends: [] });
    return { stocks: [], dividends: [] };
  }
};

// 🎯 FUNÇÃO PARA ENCONTRAR EMPRESA (STATIC + API + MÚLTIPLAS CARTEIRAS)
const findCompanyData = (tickerSymbol, apiData) => {
  console.log(`🔍 Procurando dados para ${tickerSymbol}...`);
  
  // Array para armazenar todas as carteiras onde o ativo foi encontrado
  const carteirasEncontradas = [];
  let dadosPrincipais = null;
  
  // 1. Verifica no Projeto América primeiro (mais recente)
  if (projetoAmericaDatabase[tickerSymbol]) {
    console.log(`✅ Encontrado no Projeto América: ${tickerSymbol}`);
    dadosPrincipais = { ...projetoAmericaDatabase[tickerSymbol], carteiras: ['PROJETO_AMERICA'] };
    carteirasEncontradas.push('PROJETO_AMERICA');
  }
  
  // 2. Verifica em stocks estáticos
  if (exteriorStocksDatabase[tickerSymbol]) {
    console.log(`✅ Encontrado em stocks estáticos: ${tickerSymbol}`);
    if (!dadosPrincipais) {
      dadosPrincipais = { ...exteriorStocksDatabase[tickerSymbol], carteiras: ['STOCKS'] };
    } else {
      dadosPrincipais.carteiras.push('STOCKS');
    }
    carteirasEncontradas.push('STOCKS');
  }

  // 3. Verifica em dividendos estáticos
  if (exteriorDividendsDatabase[tickerSymbol]) {
    console.log(`✅ Encontrado em dividendos estáticos: ${tickerSymbol}`);
    if (!dadosPrincipais) {
      dadosPrincipais = { ...exteriorDividendsDatabase[tickerSymbol], carteiras: ['DIVIDENDS'] };
    } else {
      dadosPrincipais.carteiras.push('DIVIDENDS');
    }
    carteirasEncontradas.push('DIVIDENDS');
  }

  // 4. Verifica em ETFs estáticos
  if (exteriorETFsDatabase[tickerSymbol]) {
    console.log(`✅ Encontrado em ETFs estáticos: ${tickerSymbol}`);
    if (!dadosPrincipais) {
      dadosPrincipais = { ...exteriorETFsDatabase[tickerSymbol], carteiras: ['ETFS'] };
    } else {
      dadosPrincipais.carteiras.push('ETFS');
    }
    carteirasEncontradas.push('ETFS');
  }
  
  // Se foi encontrado em alguma carteira estática
  if (dadosPrincipais) {
    // Se está em múltiplas carteiras, ajusta o tipo para mostrar isso
    if (carteirasEncontradas.length > 1) {
      dadosPrincipais.multiplePortfolios = true;
      dadosPrincipais.portfoliosList = carteirasEncontradas;
      console.log(`🔄 ${tickerSymbol} encontrado em múltiplas carteiras:`, carteirasEncontradas);
    }
    return dadosPrincipais;
  }
  
  // 5. Busca nos dados de stocks da API
  const stockFromAPI = apiData.stocks.find(stock => 
    (stock.ticker || stock.symbol)?.toUpperCase() === tickerSymbol.toUpperCase()
  );
  
  if (stockFromAPI) {
    console.log(`✅ Encontrado na API de stocks: ${tickerSymbol}`);
    return {
      rank: `API-S${stockFromAPI.id || '?'}`,
      name: stockFromAPI.name || stockFromAPI.longName || `${tickerSymbol} Corporation`,
      setor: stockFromAPI.sector || stockFromAPI.industry || 'Setor não informado',
      dataEntrada: stockFromAPI.entryDate || new Date().toLocaleDateString('pt-BR'),
      precoQueIniciou: `US${stockFromAPI.entryPrice || '0.00'}`,
      precoTeto: `US${stockFromAPI.targetPrice || '0.00'}`,
      avatar: getCompanyAvatar(tickerSymbol, stockFromAPI.name),
      tipo: 'STOCK_API',
      carteiras: ['API_STOCKS']
    };
  }

  // 6. Busca nos dados de dividendos da API
  const dividendFromAPI = apiData.dividends.find(dividend => 
    (dividend.ticker || dividend.symbol)?.toUpperCase() === tickerSymbol.toUpperCase()
  );
  
  if (dividendFromAPI) {
    console.log(`✅ Encontrado na API de dividendos: ${tickerSymbol}`);
    return {
      rank: `API-D${dividendFromAPI.id || '?'}`,
      name: dividendFromAPI.name || dividendFromAPI.longName || `${tickerSymbol} Corporation`,
      setor: dividendFromAPI.sector || dividendFromAPI.industry || 'Dividendos',
      dataEntrada: dividendFromAPI.entryDate || new Date().toLocaleDateString('pt-BR'),
      precoQueIniciou: `US${dividendFromAPI.entryPrice || '0.00'}`,
      precoTeto: `US${dividendFromAPI.targetPrice || '0.00'}`,
      avatar: getCompanyAvatar(tickerSymbol, dividendFromAPI.name),
      tipo: 'DIVIDEND_API',
      dy: `${dividendFromAPI.dividendYield || '0'}%`,
      carteiras: ['API_DIVIDENDS']
    };
  }

  console.log(`⚠️ ${tickerSymbol} não encontrado em nenhuma fonte`);
  return null;
};
  
  // 🎨 FUNÇÃO PARA OBTER AVATAR/ÍCONE DA EMPRESA
  const getCompanyAvatar = (symbol, companyName) => {
    const knownLogos = {
      // Empresas já na cobertura
      'AMD': 'https://logo.clearbit.com/amd.com',
      'AAPL': 'https://logo.clearbit.com/apple.com',
      'GOOGL': 'https://logo.clearbit.com/google.com',
      'META': 'https://logo.clearbit.com/meta.com',
      'HD': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNVCjcsiLtCJcZB7cBiq-VvWXAJ8WcRzvzXg&s',
      'COST': 'https://logo.clearbit.com/costco.com',
      'AMAT': 'https://logo.clearbit.com/appliedmaterials.com',
      'XP': 'https://logo.clearbit.com/xpi.com.br',
      'FIVE': 'https://logo.clearbit.com/fivebelow.com',
      'BRK-B': 'https://s3-symbol-logo.tradingview.com/berkshire-hathaway--600.png?v=1',
      // Empresas já na cobertura de DIVIDENDOS
      'OXY': 'https://logo.clearbit.com/oxy.com',
      'ADC': 'https://logo.clearbit.com/agreerealty.com',
      'VZ': 'https://logo.clearbit.com/verizon.com',
      'O': 'https://logo.clearbit.com/realtyincome.com',
      'AVB': 'https://logo.clearbit.com/avalonbay.com',
      'STAG': 'https://logo.clearbit.com/stagindustrial.com',
      
      // Empresas do PROJETO AMÉRICA
      'NVDA': 'https://logo.clearbit.com/nvidia.com',
      'AMZN': 'https://logo.clearbit.com/amazon.com',
      'PEP': 'https://logo.clearbit.com/pepsico.com',
      'IAU': 'https://logo.clearbit.com/ishares.com',
      'WPC': 'https://logo.clearbit.com/wpcarey.com',
      'NOBL': 'https://logo.clearbit.com/proshares.com',
      'CRM': 'https://logo.clearbit.com/salesforce.com',
      'TLT': 'https://logo.clearbit.com/ishares.com',
      'NNN': 'https://logo.clearbit.com/nnnreit.com',
      'PYPL': 'https://logo.clearbit.com/paypal.com',
      
      // Empresas populares sem cobertura
      'TSLA': 'https://logo.clearbit.com/tesla.com',
      'MSFT': 'https://logo.clearbit.com/microsoft.com',
      'NVDA': 'https://logo.clearbit.com/nvidia.com',
      'NFLX': 'https://logo.clearbit.com/netflix.com',
      'UBER': 'https://logo.clearbit.com/uber.com',
      'SPOT': 'https://logo.clearbit.com/spotify.com',
      'SHOP': 'https://logo.clearbit.com/shopify.com',
      'PYPL': 'https://logo.clearbit.com/paypal.com',
      'ADBE': 'https://logo.clearbit.com/adobe.com',
      'CRM': 'https://logo.clearbit.com/salesforce.com',
      'ZOOM': 'https://logo.clearbit.com/zoom.us',
      'DOCU': 'https://logo.clearbit.com/docusign.com',
      'ROKU': 'https://logo.clearbit.com/roku.com',
      'SNAP': 'https://logo.clearbit.com/snapchat.com',
      'TWTR': 'https://logo.clearbit.com/twitter.com',
      'PINS': 'https://logo.clearbit.com/pinterest.com',
      'PLTR': 'https://logo.clearbit.com/palantir.com',
      'CRWD': 'https://logo.clearbit.com/crowdstrike.com',
      'ZM': 'https://logo.clearbit.com/zoom.us',
      'OKTA': 'https://logo.clearbit.com/okta.com',
      'SNOW': 'https://logo.clearbit.com/snowflake.com',
      'DDOG': 'https://logo.clearbit.com/datadoghq.com',
      'NET': 'https://logo.clearbit.com/cloudflare.com',
      'FTNT': 'https://logo.clearbit.com/fortinet.com',
      'PANW': 'https://logo.clearbit.com/paloaltonetworks.com',
      'WDAY': 'https://logo.clearbit.com/workday.com',
      'VEEV': 'https://logo.clearbit.com/veeva.com',
      'SPLK': 'https://logo.clearbit.com/splunk.com',
      'TEAM': 'https://logo.clearbit.com/atlassian.com',
      'ZS': 'https://logo.clearbit.com/zscaler.com',
      'ESTC': 'https://logo.clearbit.com/elastic.co',
      'MDB': 'https://logo.clearbit.com/mongodb.com',
      'COIN': 'https://logo.clearbit.com/coinbase.com',
      'SQ': 'https://logo.clearbit.com/squareup.com',
      'ABNB': 'https://logo.clearbit.com/airbnb.com',
      'DASH': 'https://logo.clearbit.com/doordash.com',
      'LYFT': 'https://logo.clearbit.com/lyft.com',
      'RBLX': 'https://logo.clearbit.com/roblox.com',
      'U': 'https://logo.clearbit.com/unity.com',
      'HOOD': 'https://logo.clearbit.com/robinhood.com',
      'SOFI': 'https://logo.clearbit.com/sofi.com',
      'UPST': 'https://logo.clearbit.com/upstart.com',
      'AFRM': 'https://logo.clearbit.com/affirm.com',
      'PTON': 'https://logo.clearbit.com/onepeloton.com',
      'ZG': 'https://logo.clearbit.com/zillow.com',
      'CHWY': 'https://logo.clearbit.com/chewy.com',
      'ETSY': 'https://logo.clearbit.com/etsy.com',
      'EBAY': 'https://logo.clearbit.com/ebay.com',
      'AMZN': 'https://logo.clearbit.com/amazon.com',
      'WMT': 'https://logo.clearbit.com/walmart.com',
      'TGT': 'https://logo.clearbit.com/target.com',
      'NKE': 'https://logo.clearbit.com/nike.com',
      'SBUX': 'https://logo.clearbit.com/starbucks.com',
      'MCD': 'https://logo.clearbit.com/mcdonalds.com',
      'KO': 'https://logo.clearbit.com/coca-cola.com',
      'PEP': 'https://logo.clearbit.com/pepsico.com',
      'DIS': 'https://logo.clearbit.com/disney.com',
      'BA': 'https://logo.clearbit.com/boeing.com',
      'CAT': 'https://logo.clearbit.com/caterpillar.com',
      'MMM': 'https://logo.clearbit.com/3m.com',
      'GE': 'https://logo.clearbit.com/ge.com',
      'F': 'https://logo.clearbit.com/ford.com',
      'GM': 'https://logo.clearbit.com/gm.com',
      'JPM': 'https://logo.clearbit.com/jpmorganchase.com',
      'BAC': 'https://logo.clearbit.com/bankofamerica.com',
      'WFC': 'https://logo.clearbit.com/wellsfargo.com',
      'GS': 'https://logo.clearbit.com/goldmansachs.com',
      'MS': 'https://logo.clearbit.com/morganstanley.com',
      'V': 'https://logo.clearbit.com/visa.com',
      'MA': 'https://logo.clearbit.com/mastercard.com',
      'AXP': 'https://logo.clearbit.com/americanexpress.com'
    };

    // 1. Se o ticker tem logo conhecido, retorna (MESMA LÓGICA das empresas com cobertura)
    if (knownLogos[symbol]) {
      return knownLogos[symbol];
    }

    // 2. Se não tem logo conhecido, gera ícone automático baseado no ticker
    return `https://ui-avatars.com/api/?name=${symbol}&size=128&background=8b5cf6&color=ffffff&bold=true&format=png`;
  };
  
useEffect(() => {
  setMounted(true);
  const path = window.location.pathname;
  const tickerFromUrl = path.split('/').pop() || '';
  const cleanTicker = tickerFromUrl.toUpperCase();
  setTicker(cleanTicker);

  const initializeData = async () => {
    // Buscar dados das APIs primeiro
    const apis = await fetchAPIData();
    
    // Procurar dados da empresa
    const staticInfo = findCompanyData(cleanTicker, apis);
    setStaticData(staticInfo);

    if (cleanTicker) {
      fetchStockData(cleanTicker, staticInfo);
    }
  };

  initializeData();
}, []);
  
  const fetchStockData = async (tickerSymbol, staticInfo) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/brapi/quote?tickers=${tickerSymbol}`);
      const data = await response.json();

      if (!data || !data.results || data.results.length === 0) {
        throw new Error('Sem dados da API');
      }

      const result = data.results[0];
      const precoAtual = result.regularMarketPrice || 0;
      const precoIniciou = staticInfo ? parseFloat(staticInfo.precoQueIniciou.replace('US$', '')) : precoAtual;
const precoTeto = staticInfo ? parseFloat(staticInfo.precoTeto.replace('US$', '')) : precoAtual * 1.2;
const change = result.regularMarketChange || 0;
const changePercent = result.regularMarketChangePercent || 0;

      const realData = {
        name: staticInfo?.name || result.shortName || result.longName || tickerSymbol,
        rank: staticInfo?.rank || null,
        setor: staticInfo?.setor || result.sector || 'Setor não identificado',
        dataEntrada: staticInfo?.dataEntrada || 'N/A',
        precoQueIniciou: staticInfo?.precoQueIniciou || `US${precoAtual.toFixed(2)}`,
        precoTeto: staticInfo?.precoTeto || `US${(precoAtual * 1.2).toFixed(2)}`,
        avatar: staticInfo?.avatar || getCompanyAvatar(tickerSymbol, result.shortName || result.longName) || result.logourl,
        price: precoAtual,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        dayLow: result.regularMarketDayLow || precoAtual * 0.98,
        dayHigh: result.regularMarketDayHigh || precoAtual * 1.02,
        open: result.regularMarketOpen || precoAtual,
        volume: result.regularMarketVolume ? `${(result.regularMarketVolume / 1e6).toFixed(1)}M` : `${(Math.random() * 50 + 5).toFixed(1)}M`,
        week52High: result.fiftyTwoWeekHigh || precoAtual * 1.3,
        week52Low: result.fiftyTwoWeekLow || precoAtual * 0.7,
        marketCap: (typeof result.marketCap === 'number' && isFinite(result.marketCap))
          ? `${(result.marketCap / 1e9).toFixed(2)}B`
          : generateMarketCap(tickerSymbol),
        peRatio: (typeof result.trailingPE === 'number' && isFinite(result.trailingPE))
          ? Number(result.trailingPE.toFixed(2))
          : Number((Math.random() * 30 + 15).toFixed(1)),
        dividendYield: (typeof result.dividendYield === 'number' && isFinite(result.dividendYield))
          ? `${(result.dividendYield * 100).toFixed(2)}%`
          : generateDividendYield(staticInfo?.setor || 'Diversos'),
        isPositive: change >= 0,
        performanceVsInicio: staticInfo ? changePercent : 0,
        distanciaDoTeto: staticInfo ? ((precoTeto - precoAtual) / precoTeto * 100) : 0,
        vies: staticInfo ? ((precoAtual / precoTeto) >= 0.95 ? 'AGUARDAR' : 'COMPRA') : 'N/A',
        tipo: staticInfo?.tipo || 'SEM_COBERTURA',
        dy: staticInfo?.dy || null
      };

      // Debug do avatar
      console.log('🎯 Avatar URL gerada:', realData.avatar);
      console.log('📊 Dados completos:', realData);

      setStockData(realData);
    } catch (err) {
      console.error('Erro na API, usando dados simulados:', err);
      const mockData = generateMockData(tickerSymbol, staticInfo);
      setStockData(mockData);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (symbol, staticInfo) => {
    if (staticInfo) {
      const precoIniciou = parseFloat(staticInfo.precoQueIniciou.replace('US$', ''));
      const precoTeto = parseFloat(staticInfo.precoTeto.replace('US$', '')); 
      
      const variacao = (Math.random() - 0.3) * 0.4;
      const precoAtual = precoIniciou * (1 + variacao);
      const change = precoAtual - precoIniciou;
      const changePercent = (change / precoIniciou) * 100;
      
      return {
        name: staticInfo.name,
        rank: staticInfo.rank,
        setor: staticInfo.setor,
        dataEntrada: staticInfo.dataEntrada,
        precoQueIniciou: staticInfo.precoQueIniciou,
        precoTeto: staticInfo.precoTeto,
        avatar: getCompanyAvatar(symbol, staticInfo?.name),
        price: Number(precoAtual.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        dayLow: Number((precoAtual - Math.random() * 3).toFixed(2)),
        dayHigh: Number((precoAtual + Math.random() * 5).toFixed(2)),
        open: Number((precoAtual + (Math.random() - 0.5) * 2).toFixed(2)),
        volume: `${(Math.random() * 20 + 1).toFixed(1)}M`,
        week52High: Number((precoTeto * (0.95 + Math.random() * 0.1)).toFixed(2)),
        week52Low: Number((precoIniciou * (0.8 + Math.random() * 0.2)).toFixed(2)),
        marketCap: generateMarketCap(symbol),
        peRatio: Number((Math.random() * 30 + 15).toFixed(1)),
        dividendYield: generateDividendYield(staticInfo.setor),
        isPositive: change >= 0,
        performanceVsInicio: changePercent,
        distanciaDoTeto: ((precoTeto - precoAtual) / precoTeto * 100),
        vies: (precoAtual / precoTeto) >= 0.95 ? 'AGUARDAR' : 'COMPRA'
      };
    }

    const basePrice = Math.random() * 300 + 50;
    const change = (Math.random() - 0.5) * 20;
    const isPositive = change > 0;
    
    return {
      name: `${symbol} Corporation`,
      rank: 'N/A',
      setor: 'Diversos',
      dataEntrada: 'N/A',
      precoQueIniciou: 'N/A',
      precoTeto: 'N/A',
      avatar: getCompanyAvatar(symbol, `${symbol} Corporation`),
      price: Number(basePrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number((change / basePrice * 100).toFixed(2)),
      dayLow: Number((basePrice - Math.random() * 5).toFixed(2)),
      dayHigh: Number((basePrice + Math.random() * 5).toFixed(2)),
      open: Number((basePrice + (Math.random() - 0.5) * 3).toFixed(2)),
      volume: `${(Math.random() * 50 + 1).toFixed(1)}M`,
      week52High: Number((basePrice * (1 + Math.random() * 0.5)).toFixed(2)),
      week52Low: Number((basePrice * (1 - Math.random() * 0.3)).toFixed(2)),
      marketCap: `${(Math.random() * 500 + 50).toFixed(0)}B`,
      peRatio: Number((Math.random() * 40 + 10).toFixed(1)),
      dividendYield: `${(Math.random() * 3).toFixed(2)}%`,
      isPositive,
      performanceVsInicio: 0,
      distanciaDoTeto: 0,
      vies: 'N/A'
    };
  };

  const generateMarketCap = (symbol) => {
    const caps = {
      'AAPL': '$3.1T',
      'MSFT': '$2.8T',
      'GOOGL': '$1.8T',
      'META': '$789B',
      'AMD': '$240B',
      'HD': '$410B',
      'COST': '$380B',
      'XP': '$12B',
      'AMAT': '$180B',
      'FIVE': '$8B',
      'BRK-B': '$890B'
    };
    return caps[symbol] || `${(Math.random() * 500 + 50).toFixed(0)}B`;
  };

  const generateDividendYield = (setor) => {
    const yields = {
      'Tecnologia': () => `${(Math.random() * 1.5).toFixed(2)}%`,
      'Varejo': () => `${(Math.random() * 2 + 1.5).toFixed(2)}%`,
      'Financial Services': () => `${(Math.random() * 3 + 2).toFixed(2)}%`,
      'Semicondutores': () => `${(Math.random() * 1.2).toFixed(2)}%`,
      'Consumer Discretionary': () => `${(Math.random() * 2.5 + 1).toFixed(2)}%`,
      'Holding': () => `${(Math.random() * 2 + 1).toFixed(2)}%`
    };
    
    return yields[setor] ? yields[setor]() : `${(Math.random() * 2 + 0.5).toFixed(2)}%`;
  };

  if (!mounted || loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h2 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>Carregando {ticker}</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {staticData ? `Buscando dados de ${staticData.name}...` : 'Buscando dados atualizados...'}
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          border: '2px solid #fca5a5'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>Erro</h2>
          <p style={{ color: '#6b7280', margin: '0 0 20px 0' }}>{error}</p>
          <button 
            onClick={() => fetchStockData(ticker, staticData)}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!stockData) return null;

  const containerStyle = {
    minHeight: '100vh',
    background: 'white',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const maxWidthStyle = {
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };

  const priceCardStyle = {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '24px'
  };

  const priceHeaderStyle = {
    background: stockData.isPositive 
      ? 'linear-gradient(90deg, #059669 0%, #10b981 100%)'
      : 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
    color: 'white',
    padding: '24px'
  };

  const priceFlexStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  };

    // CSS para animação de loading
  const pulseAnimation = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  
  return (
    <div style={containerStyle}>
      <style>{spinKeyframes}</style>
      <div style={maxWidthStyle}>

{/* ✅ HEADER COM BOTÃO DE VOLTA INTELIGENTE */}
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
  background: 'white',
  padding: '16px 24px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e2e8f0'
}}>
  {/* Botão de Volta Inteligente */}
  <button
    onClick={() => handleSmartBack(staticData, ticker)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.target.style.backgroundColor = '#f9fafb';
      e.target.style.borderColor = '#9ca3af';
    }}
    onMouseLeave={(e) => {
      e.target.style.backgroundColor = 'white';
      e.target.style.borderColor = '#d1d5db';
    }}
    title={`Voltar para ${getBackURL(staticData, ticker).split('/').pop()}`}
  >
    <span style={{ fontSize: '16px' }}>←</span>
    Voltar para {(() => {
      const type = getBackURL(staticData, ticker).split('/').pop();
      switch (type) {
        case 'projeto-america': return 'Projeto América';
        case 'etfs': return 'ETFs';
        case 'dividendos': return 'Dividendos';
        case 'stocks': return 'Stocks';
        default: return 'Lista';
      }
    })()}
  </button>
  
  {/* Status da API/Dados */}
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }}>
    {/* Badge do tipo de ativo */}
    <div style={{
      background: (() => {
        if (staticData) {
          if (staticData.tipo === 'PROJETO_AMERICA') return '#f0f9ff';
          if (staticData.tipo === 'DIVIDEND') return '#dcfce7';
          if (staticData.tipo === 'ETF') return '#fef3c7';
          return '#dbeafe';
        }
        const knownETFs = ['VOO', 'IJS', 'QUAL', 'QQQ', 'VNQ', 'SCHP', 'IAU', 'HERO', 'SOXX', 'MCHI', 'TFLO'];
        if (knownETFs.includes(ticker)) return '#fef3c7';
        return '#f3f4f6';
      })(),
      color: (() => {
        if (staticData) {
          if (staticData.tipo === 'PROJETO_AMERICA') return '#0369a1';
          if (staticData.tipo === 'DIVIDEND') return '#059669';
          if (staticData.tipo === 'ETF') return '#d97706';
          return '#3b82f6';
        }
        const knownETFs = ['VOO', 'IJS', 'QUAL', 'QQQ', 'VNQ', 'SCHP', 'IAU', 'HERO', 'SOXX', 'MCHI', 'TFLO'];
        if (knownETFs.includes(ticker)) return '#d97706';
        return '#6b7280';
      })(),
      padding: '4px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase'
    }}>
      {(() => {
        if (staticData) {
          if (staticData.tipo === 'PROJETO_AMERICA') return '🇺🇸 PROJETO AMÉRICA';
          if (staticData.tipo === 'DIVIDEND') return '💰 DIVIDEND';
          if (staticData.tipo === 'ETF') return '📊 ETF';
          return '📈 STOCK';
        }
        const knownETFs = ['VOO', 'IJS', 'QUAL', 'QQQ', 'VNQ', 'SCHP', 'IAU', 'HERO', 'SOXX', 'MCHI', 'TFLO'];
        if (knownETFs.includes(ticker)) return '📊 ETF';
        return '❓ SEM COBERTURA';
      })()}
    </div>

    {/* Badge de múltiplas carteiras */}
    {staticData?.multiplePortfolios && (
      <div style={{
        background: '#fefce8',
        color: '#d97706',
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        📂 MÚLTIPLAS CARTEIRAS
      </div>
    )}

    {loading ? (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#dbeafe',
        color: '#1e40af',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '14px'
      }}>
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid #e2e8f0',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        Carregando...
      </div>
    ) : error ? (
      <div style={{
        background: '#fef2f2',
        color: '#b91c1c',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '14px'
      }}>
        ⚠️ Erro na API
      </div>
    ) : stockData && stockData.price > 0 ? (
      <div style={{
        background: '#f0fdf4',
        color: '#15803d',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '14px'
      }}>
        ✅ Dados da API BRAPI
      </div>
    ) : (
      <div style={{
        background: '#f8fafc',
        color: '#64748b',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '14px'
      }}>
        📊 Dados simulados
      </div>
    )}
    
    {/* Botão de Refresh */}
    <button
      onClick={() => fetchStockData(ticker, staticData)}
      disabled={loading}
      style={{
        background: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        padding: '8px',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1,
        fontSize: '16px'
      }}
      title="Atualizar dados"
    >
      🔄
    </button>
  </div>
</div>
        {/* Card principal da empresa - NOVO ESTILO */}
        <div style={{
          marginBottom: '32px',
          background: staticData?.tipo === 'PROJETO_AMERICA' 
            ? 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)'
            : staticData?.tipo === 'ETF' 
            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' 
            : staticData?.tipo === 'DIVIDEND' 
            ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
            : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '32px' }}>
            <div style={{
              display: 'flex',
              flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
              gap: '24px',
              alignItems: window.innerWidth <= 768 ? 'center' : 'flex-start'
            }}>
              
              {/* AVATAR DA EMPRESA */}
              <div style={{
                width: window.innerWidth <= 768 ? '100px' : '120px',
                height: window.innerWidth <= 768 ? '100px' : '120px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '3px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#374151',
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Fallback com iniciais */}
                <span style={{ 
                  position: 'absolute', 
                  zIndex: 1,
                  fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem'
                }}>
                  {ticker.slice(0, 2)}
                </span>
                
                {/* Imagem da empresa */}
                {stockData?.avatar && (
                  <img
                    src={stockData.avatar}
                    alt={stockData.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: 2,
                      objectFit: 'cover'
                    }}
                    onLoad={(e) => {
                      const valid = e.target.naturalWidth > 1 && e.target.naturalHeight > 1;
                      if (valid) {
                        const fallback = e.target.parentElement.querySelector('span');
                        if (fallback) fallback.style.display = 'none';
                      } else {
                        e.target.style.display = 'none';
                      }
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
              </div>
              
              {/* INFORMAÇÕES DA EMPRESA (CENTRO) */}
              <div style={{ 
                flex: 1, 
                textAlign: window.innerWidth <= 768 ? 'center' : 'left',
                minWidth: 0
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                  gap: '12px',
                  alignItems: window.innerWidth <= 768 ? 'center' : 'flex-start',
                  marginBottom: '8px',
                  flexWrap: 'wrap'
                }}>
                  <h1 style={{ 
                    fontSize: window.innerWidth <= 768 ? '2rem' : '2.5rem', 
                    fontWeight: 700, 
                    margin: 0,
                    color: '#1f2937'
                  }}>
                    {ticker}
                  </h1>
                  
                  {/* Badges de tipo */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{
                      background: (() => {
                        if (staticData) {
                          if (staticData.tipo === 'PROJETO_AMERICA') return '#f0f9ff';
                          if (staticData.tipo === 'DIVIDEND') return '#dcfce7';
                          if (staticData.tipo === 'ETF') return '#fef3c7';
                          return '#dbeafe';
                        }
                        return '#f3f4f6';
                      })(),
                      color: (() => {
                        if (staticData) {
                          if (staticData.tipo === 'PROJETO_AMERICA') return '#0369a1';
                          if (staticData.tipo === 'DIVIDEND') return '#059669';
                          if (staticData.tipo === 'ETF') return '#d97706';
                          return '#3b82f6';
                        }
                        return '#6b7280';
                      })(),
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {(() => {
                        if (staticData) {
                          if (staticData.tipo === 'PROJETO_AMERICA') return '🇺🇸 PROJETO AMÉRICA';
                          if (staticData.tipo === 'DIVIDEND') return '💰 DIVIDEND';
                          if (staticData.tipo === 'ETF') return '📊 ETF';
                          return '📈 STOCK';
                        }
                        return 'SEM COBERTURA';
                      })()}
                    </div>
                    
                    {/* Badge de múltiplas carteiras */}
                    {staticData?.multiplePortfolios && (
                      <div style={{
                        background: '#fefce8',
                        color: '#d97706',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        📂 {staticData.portfoliosList.length} CARTEIRAS
                      </div>
                    )}
                    
                    {stockData?.rank && (
                      <div style={{
                        background: '#f3f4f6',
                        color: '#6b7280',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {stockData.rank}
                      </div>
                    )}
                  </div>
                </div>
                
                <h2 style={{ 
                  fontSize: window.innerWidth <= 768 ? '1.1rem' : '1.25rem', 
                  fontWeight: 600, 
                  margin: '0 0 16px 0',
                  color: '#374151'
                }}>
                  {stockData.name}
                </h2>
                
                <div style={{
                  background: '#e2e8f0',
                  color: '#475569',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'inline-block',
                  marginBottom: '16px'
                }}>
                  USD • {stockData.setor}
                  {stockData.dy && ` • DY: ${stockData.dy}`}
                </div>
                
                <p style={{ 
                  fontSize: '16px',
                  lineHeight: 1.6,
                  color: '#4b5563',
                  margin: 0,
                  maxWidth: '600px'
                }}>
  Empresa listada no mercado americano com foco em {stockData.setor.toLowerCase()}.
  {!staticData && ' Empresa sem cobertura ativa.'}
                </p>
                
                {/* Alertas importantes */}
                {!staticData && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    color: '#b91c1c',
                    fontWeight: 600,
                    marginTop: '16px',
                    fontSize: '14px'
                  }}>
                    ⚠️ Empresa sem cobertura – este ativo não está em nossa carteira de recomendações.
                  </div>
                )}
              </div>
              
              {/* PREÇO E VARIAÇÃO (DIREITA) */}
              <div style={{ 
                textAlign: window.innerWidth <= 768 ? 'center' : 'right',
                minWidth: window.innerWidth <= 768 ? 'auto' : '200px'
              }}>
                {loading ? (
                  <div style={{ 
                    width: '150px', 
                    height: '60px', 
                    background: '#e2e8f0', 
                    borderRadius: '8px',
                    animation: 'pulse 2s infinite'
                  }} />
                ) : (
                  <>
                    <div style={{ 
                      fontSize: window.innerWidth <= 768 ? '2.5rem' : '3rem', 
                      fontWeight: 700,
                      color: '#1f2937',
                      lineHeight: 1,
                      marginBottom: '8px'
                    }}>
                      ${stockData.price}
                    </div>
                    
                    {stockData.isPositive !== undefined && (
                      <div style={{ 
                        color: stockData.isPositive ? '#22c55e' : '#ef4444', 
                        fontWeight: 700, 
                        fontSize: window.innerWidth <= 768 ? '1rem' : '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: window.innerWidth <= 768 ? 'center' : 'flex-end',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '1.5rem' }}>
                          {stockData.isPositive ? '↗' : '↘'}
                        </span>
                        <span>
                          {stockData.isPositive ? '+' : ''}{stockData.change} ({stockData.changePercent}%)
                        </span>
                      </div>
                    )}
                    
{/* Info adicional sobre BDR se existir */}
{staticData?.bdr && bdrData && (
  <div style={{
    marginTop: '12px',
    padding: '10px 14px',  // Aumentei o padding também
    background: 'rgba(34, 197, 94, 0.1)',
    borderRadius: '6px',
    fontSize: '14px'  // Aumentei de 12px para 14px
  }}>
    <div style={{ fontWeight: 600, color: '#059669', fontSize: '15px' }}>
      🇧🇷 {staticData.bdr}
    </div>
    <div style={{ color: '#374151', fontSize: '14px' }}>
      R$ {bdrData.price}
    </div>
  </div>
)}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {staticData && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '20px' }}>📊</span>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                margin: 0, 
                color: '#1f2937' 
              }}>
                Dados da Carteira
              </h3>
            </div>

            {/* Alertas de múltiplas carteiras */}
            {staticData.multiplePortfolios && (
              <div style={{
                background: '#fefce8',
                border: '1px solid #fde68a',
                padding: '16px 20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#d97706',
                  margin: '0 0 12px 0'
                }}>
                  📂 Ativo presente em múltiplas carteiras
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {staticData.portfoliosList.map((portfolio, index) => (
                    <div key={index} style={{
                      background: 'white',
                      color: '#d97706',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: '1px solid #fde68a'
                    }}>
                      {(() => {
                        switch (portfolio) {
                          case 'PROJETO_AMERICA': return '🇺🇸 Projeto América';
                          case 'STOCKS': return '📈 Stocks';
                          case 'DIVIDENDS': return '💰 Dividendos';
                          case 'ETFS': return '📊 ETFs';
                          default: return portfolio;
                        }
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(4, 1fr)', 
              gap: '20px' 
            }}>
              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#64748b', 
                  margin: '0 0 8px 0', 
                  fontWeight: '600', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Data de Entrada
                </p>
                <p style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#1f2937', 
                  margin: 0 
                }}>
                  {stockData.dataEntrada}
                </p>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: '#f0f9ff',
                borderRadius: '12px',
                border: '1px solid #bae6fd'
              }}>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#0369a1', 
                  margin: '0 0 8px 0', 
                  fontWeight: '600', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Preço de Entrada
                </p>
                <p style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#0f172a', 
                  margin: 0 
                }}>
                  {stockData.precoQueIniciou}
                </p>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: '#f0fdf4',
                borderRadius: '12px',
                border: '1px solid #bbf7d0'
              }}>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#059669', 
                  margin: '0 0 8px 0', 
                  fontWeight: '600', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Preço Teto
                </p>
                <p style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#0f172a', 
                  margin: 0,
                  lineHeight: 1.2
                }}>
                  {stockData.precoTeto}
                  {staticData?.bdrTeto && (
                    <span style={{ 
                      fontSize: '14px', 
                      color: '#059669',
                      display: 'block',
                      marginTop: '4px'
                    }}>
                      {staticData.bdrTeto}
                    </span>
                  )}
                </p>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: stockData.vies === 'COMPRA' ? '#f0fdf4' : '#fefce8',
                borderRadius: '12px',
                border: `1px solid ${stockData.vies === 'COMPRA' ? '#bbf7d0' : '#fde68a'}`
              }}>
                <p style={{ 
                  fontSize: '12px', 
                  color: stockData.vies === 'COMPRA' ? '#059669' : '#d97706', 
                  margin: '0 0 8px 0', 
                  fontWeight: '600', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Viés Atual
                </p>
                <div style={{
                  display: 'inline-block',
                  background: stockData.vies === 'COMPRA' ? '#22c55e' : '#f59e0b',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {stockData.vies}
                </div>
              </div>
            </div>
          </div>
        )}

{/* Dados Técnicos */}

{/* Cards lado a lado: Dados Técnicos + Indicadores Financeiros */}
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
  gap: '24px',
  marginBottom: '24px'
}}>
  
  {/* Dados Técnicos */}
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '20px'
    }}>
      <span style={{ fontSize: '20px' }}>📈</span>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        margin: 0, 
        color: '#1f2937' 
      }}>
        Dados Técnicos
      </h3>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Volume */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <span style={{ 
          color: '#6b7280', 
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Volume
        </span>
        <span style={{ 
          color: '#1f2937', 
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {stockData.volume}
        </span>
      </div>

      {/* Abertura */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <span style={{ 
          color: '#6b7280', 
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Abertura
        </span>
        <span style={{ 
          color: '#1f2937', 
          fontSize: '14px',
          fontWeight: '600'
        }}>
          ${stockData.open}
        </span>
      </div>

      {/* Máx. 52s */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <span style={{ 
          color: '#6b7280', 
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Máx. 52s
        </span>
        <span style={{ 
          color: '#1f2937', 
          fontSize: '14px',
          fontWeight: '600'
        }}>
          ${stockData.week52High}
        </span>
      </div>

      {/* Mín. 52s */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0'
      }}>
        <span style={{ 
          color: '#6b7280', 
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Mín. 52s
        </span>
        <span style={{ 
          color: '#1f2937', 
          fontSize: '14px',
          fontWeight: '600'
        }}>
          ${stockData.week52Low}
        </span>
      </div>
    </div>
  </div>

  {/* Indicadores Financeiros */}
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '20px'
    }}>
      <span style={{ fontSize: '20px' }}>💼</span>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        margin: 0, 
        color: '#1f2937' 
      }}>
        Indicadores Financeiros
      </h3>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Market Cap */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <span style={{ 
          color: '#6b7280', 
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Market Cap
        </span>
        <span style={{ 
          color: '#1f2937', 
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {stockData.marketCap}
        </span>
      </div>

      {/* P/E Ratio */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <span style={{ 
          color: '#6b7280', 
          fontSize: '14px',
          fontWeight: '500'
        }}>
          P/E Ratio
        </span>
        <span style={{ 
          color: '#1f2937', 
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {stockData.peRatio}
        </span>
      </div>

      {/* Dividend Yield */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0'
      }}>
        <span style={{ 
          color: '#6b7280', 
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Dividend Yield
        </span>
        <span style={{ 
          color: '#1f2937', 
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {stockData.dividendYield}
        </span>
      </div>
    </div>
  </div>
</div>
        
        {/* Histórico de Dividendos */}
        <HistoricoDividendosExterior 
          ticker={ticker} 
          dataEntrada={staticData?.dataEntrada || 'N/A'} 
        />

        {/* Gerenciador de Relatórios */}
<GerenciadorRelatoriosInternacional ticker={ticker} />
        
        {/* Agenda Corporativa */}
<AgendaCorporativaInternacional 
  ticker={ticker} 
  dataEntrada={staticData?.dataEntrada || 'N/A'} 
/>
        
        <div style={{
          background: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            ✅ {staticData ? 
              `Dados da carteira ${staticData.tipo === 'PROJETO_AMERICA' ? 'Projeto América' : 
                staticData.tipo === 'DIVIDEND' ? 'Exterior Dividendos' :
                staticData.tipo === 'ETF' ? 'Exterior ETFs' : 'Exterior Stocks'} para ${ticker}` : 
              `Dados simulados para ${ticker}`} • {new Date().toLocaleString('pt-BR')}
            {staticData?.multiplePortfolios && ` • Presente em ${staticData.portfoliosList.length} carteiras`}
          </p>
        </div>
      </div>
    </div>
  );
}
