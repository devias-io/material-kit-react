import React, { useState, useEffect } from 'react';

const STATUS_PADRAO = 'regular';
const NOTA_PADRAO = 5;
const RECOMENDACAO_PADRAO = 'manter';

const gerarIdManual = () => `manual-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const sanitizarListaPontos = (lista) => {
  if (!Array.isArray(lista)) {
    return [];
  }

  return lista
    .map(item => {
      if (typeof item === 'string') {
        const texto = item.trim();
        return texto;
      }
      return item;
    })
    .filter(item => {
      if (typeof item === 'string') {
        return item.length > 0;
      }
      return Boolean(item);
    });
};

const EnhancedAdminFeedback = ({ carteira, onSave, onCancel }) => {
  const [activeSection, setActiveSection] = useState('general');
  const [loadingAtivos, setLoadingAtivos] = useState(false);
  const [ativosInfo, setAtivosInfo] = useState([]);

  const initialAtivosAnalise = (carteira?.ativosAnalise || []).map(ativo => ({
    ...ativo,
    id: ativo.id || ativo.codigo || gerarIdManual(),
    codigo: ativo.codigo || '',
    status: ativo.status || STATUS_PADRAO,
    nota: typeof ativo.nota === 'number' ? ativo.nota : NOTA_PADRAO,
    comentario: ativo.comentario || '',
    recomendacao: ativo.recomendacao || RECOMENDACAO_PADRAO,
    temInformacao: ativo.temInformacao ?? false,
    informacaoCompleta: ativo.informacaoCompleta ?? null
  }));

  const [feedbackData, setFeedbackData] = useState(() => ({
    pontuacaoGeral: carteira?.pontuacao || 8.0,
    avaliacoes: {
      qualidade: carteira?.avaliacaoQualidade || 85,
      diversificacao: carteira?.avaliacaoDiversificacao || 80,
      adaptacao: carteira?.avaliacaoAdaptacao || 85
    },
    feedbackGeral: carteira?.feedback || '',
    recomendacoes: carteira?.recomendacoes || [],
    ativosAnalise: initialAtivosAnalise,
    setoresAnalise: carteira?.setoresAnalise || [],
    alertas: carteira?.alertas || [],
    proximosPassos: carteira?.proximosPassos || []
  }));

  const [selectedAtivoId, setSelectedAtivoId] = useState(() => {
    const primeiroAtivo = initialAtivosAnalise[0];
    return primeiroAtivo ? (primeiroAtivo.id || primeiroAtivo.codigo) : null;
  });

  const [novaRecomendacao, setNovaRecomendacao] = useState({
    categoria: '',
    prioridade: 'média',
    titulo: '',
    descricao: '',
    impacto: ''
  });

  const categorias = ['Diversificação', 'Qualidade', 'Risco', 'Setores', 'Alocação', 'Compliance'];
  const prioridades = ['baixa', 'média', 'alta'];
  const statusAtivos = ['excelente', 'bom', 'regular', 'ruim', 'alerta'];
  const tiposAtivos = ['acao', 'fii', 'etf', 'bdr', 'fundo', 'outro'];

  const obterIdentificadorAtivo = (ativo) => ativo?.id || ativo?.codigo || '';

  // Carregar informações dos ativos automaticamente
  useEffect(() => {
    if (carteira?.id) {
      loadAtivosInformacoes();
    }
  }, [carteira?.id]);

  const loadAtivosInformacoes = async () => {
    setLoadingAtivos(true);
    try {
      const response = await fetch(`/api/carteiras/${carteira.id}/ativos-info`);
      const data = await response.json();

      if (data.success) {
        const ativosApi = Array.isArray(data.ativos) ? data.ativos : [];
        const colecaoBase = ativosApi.map(ativo => {
          const temInformacao = Boolean(ativo.temInformacao && ativo.informacao);
          const infoOriginal = temInformacao ? ativo.informacao : null;
          const infoSanitizada = infoOriginal
            ? {
                ...infoOriginal,
                pontosFortes: sanitizarListaPontos(infoOriginal.pontosFortes),
                pontosFracos: sanitizarListaPontos(infoOriginal.pontosFracos)
              }
            : null;
          const qualidade =
            temInformacao && typeof infoSanitizada?.qualidade === 'number' ? infoSanitizada.qualidade : null;

          const ativoParaComentario = infoSanitizada ? { ...ativo, informacao: infoSanitizada } : ativo;

          return {
            id: ativo.codigo || gerarIdManual(),
            codigo: ativo.codigo || '',
            tipo: (ativo.tipo || 'acao').toLowerCase(),
            status: qualidade !== null ? mapearQualidadeParaStatus(qualidade) : STATUS_PADRAO,
            nota: qualidade !== null ? qualidade : NOTA_PADRAO,
            comentario: temInformacao ? gerarComentarioAutomatico(ativoParaComentario) : '',
            recomendacao: infoSanitizada?.recomendacao
              ? infoSanitizada.recomendacao.toLowerCase()
              : RECOMENDACAO_PADRAO,
            valorCarteira: ativo.valorTotal ?? ativo.valorCarteira ?? null,
            pesoCarteira: ativo.pesoCarteira ?? null,
            temInformacao,
            informacaoCompleta: infoSanitizada
          };
        });

        setAtivosInfo(colecaoBase);

        let ativosMesclados = [];
        setFeedbackData(prev => {
          const anteriores = prev.ativosAnalise || [];
          const codigosBase = new Set(colecaoBase.map(item => item.codigo));
          const anterioresPorCodigo = new Map(anteriores.map(item => [item.codigo, item]));

          const baseMesclada = colecaoBase.map(base => {
            const existente = anterioresPorCodigo.get(base.codigo);

            if (existente) {
              return {
                ...base,
                ...existente,
                id: existente.id || base.id || gerarIdManual(),
                codigo: base.codigo || existente.codigo || '',
                temInformacao: base.temInformacao,
                informacaoCompleta: base.informacaoCompleta,
                valorCarteira: base.valorCarteira ?? existente.valorCarteira ?? null,
                pesoCarteira: base.pesoCarteira ?? existente.pesoCarteira ?? null,
                comentario: existente.comentario || base.comentario,
                status: existente.status || base.status,
                nota: typeof existente.nota === 'number' ? existente.nota : base.nota,
                recomendacao: existente.recomendacao || base.recomendacao
              };
            }

            return base;
          });

          const extras = anteriores
            .filter(item => !item.codigo || !codigosBase.has(item.codigo))
            .map(item => ({
              ...item,
              id: item.id || item.codigo || gerarIdManual(),
              codigo: item.codigo || '',
              status: item.status || STATUS_PADRAO,
              nota: typeof item.nota === 'number' ? item.nota : NOTA_PADRAO,
              recomendacao: item.recomendacao || RECOMENDACAO_PADRAO,
              temInformacao: item.temInformacao ?? false,
              informacaoCompleta: item.informacaoCompleta ?? null
            }));

          ativosMesclados = [...baseMesclada, ...extras];

          return {
            ...prev,
            ativosAnalise: ativosMesclados
          };
        });

        setSelectedAtivoId(prevSelecionado => {
          if (prevSelecionado && ativosMesclados.some(item => (item.id || item.codigo) === prevSelecionado)) {
            return prevSelecionado;
          }

          return ativosMesclados[0] ? (ativosMesclados[0].id || ativosMesclados[0].codigo) : null;
        });

      } else {
        console.error('Erro ao carregar informações dos ativos:', data.error);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoadingAtivos(false);
    }
  };

  // Função para mapear qualidade (0-10) para status visual
  const mapearQualidadeParaStatus = (qualidade) => {
    if (qualidade >= 9) return 'excelente';
    if (qualidade >= 7) return 'bom';
    if (qualidade >= 5) return 'regular';
    if (qualidade >= 3) return 'ruim';
    return 'alerta';
  };

  // Função para gerar comentário automático baseado nas informações do banco
  const gerarComentarioAutomatico = (ativo) => {
    const info = ativo?.informacao;

    if (!info) {
      return '';
    }

    let comentario = '';
    const peso = ativo?.pesoCarteira ?? info?.pesoCarteira;
    const valor = ativo?.valorCarteira ?? ativo?.valorTotal ?? info?.valorCarteira;
    const nomeReferencia = info?.nome ? `${info.nome}${ativo?.codigo ? ` (${ativo.codigo})` : ''}` : ativo?.codigo;

    if (nomeReferencia) {
      comentario += `${nomeReferencia}${info?.setor ? ` - Setor: ${info.setor}` : ''}. `;
    }

    if (typeof peso === 'number' && typeof valor === 'number') {
      comentario += `Representa ${peso}% da carteira (R$ ${valor.toLocaleString('pt-BR')}). `;
    } else if (typeof peso === 'number') {
      comentario += `Participação de ${peso}% na carteira. `;
    }

    if (info?.fundamentosResumo) {
      comentario += `${info.fundamentosResumo} `;
    }

    const pontosFortesSanitizados = sanitizarListaPontos(info?.pontosFortes);
    if (pontosFortesSanitizados.length > 0) {
      comentario += `Pontos fortes: ${pontosFortesSanitizados.join(', ')}. `;
    }

    const pontosFracosSanitizados = sanitizarListaPontos(info?.pontosFracos);
    if (pontosFracosSanitizados.length > 0) {
      comentario += `Pontos de atenção: ${pontosFracosSanitizados.join(', ')}. `;
    }

    if (info?.risco) {
      comentario += `Risco classificado como ${info.risco.toLowerCase()}. `;
    }

    if (info?.dividend_yield && String(ativo?.tipo).toUpperCase() === 'ACAO') {
      comentario += `Dividend yield atual: ${info.dividend_yield}%. `;
    }

    if (info?.observacoes) {
      comentario += `${info.observacoes} `;
    }

    return comentario.trim();
  };

  const handleAtivoChange = (campo, valor) => {
    if (!selectedAtivoId) return;

    setFeedbackData(prev => ({
      ...prev,
      ativosAnalise: (prev.ativosAnalise || []).map(ativo => {
        if (obterIdentificadorAtivo(ativo) === selectedAtivoId) {
          return {
            ...ativo,
            [campo]: valor
          };
        }
        return ativo;
      })
    }));
  };

  const adicionarAtivoManual = () => {
    const novoId = gerarIdManual();
    const novoAtivo = {
      id: novoId,
      codigo: '',
      tipo: 'acao',
      status: STATUS_PADRAO,
      nota: NOTA_PADRAO,
      comentario: '',
      recomendacao: RECOMENDACAO_PADRAO,
      valorCarteira: null,
      pesoCarteira: null,
      temInformacao: false,
      informacaoCompleta: null
    };

    setFeedbackData(prev => ({
      ...prev,
      ativosAnalise: [...(prev.ativosAnalise || []), novoAtivo]
    }));
    setSelectedAtivoId(novoId);
  };

  const removerAtivo = (id) => {
    let restantes = [];

    setFeedbackData(prev => {
      const filtrados = (prev.ativosAnalise || []).filter(ativo => obterIdentificadorAtivo(ativo) !== id);
      restantes = filtrados;
      return {
        ...prev,
        ativosAnalise: filtrados
      };
    });

    setSelectedAtivoId(prevSelecionado => {
      if (prevSelecionado === id) {
        return restantes[0] ? obterIdentificadorAtivo(restantes[0]) : null;
      }
      return prevSelecionado;
    });
  };

  const handleSave = () => {
    const dadosCompletos = {
      ...carteira,
      pontuacao: feedbackData.pontuacaoGeral,
      avaliacaoQualidade: feedbackData.avaliacoes.qualidade,
      avaliacaoDiversificacao: feedbackData.avaliacoes.diversificacao,
      avaliacaoAdaptacao: feedbackData.avaliacoes.adaptacao,
      feedback: feedbackData.feedbackGeral,
      recomendacoes: feedbackData.recomendacoes.map(r => r.titulo || r),
      status: 'ANALISADA',
      dataAnalise: new Date().toISOString(),
      dadosEstruturados: {
        avaliacoes: feedbackData.avaliacoes,
        recomendacoesDetalhadas: feedbackData.recomendacoes,
        ativosAnalise: feedbackData.ativosAnalise,
        setoresAnalise: feedbackData.setoresAnalise,
        alertas: feedbackData.alertas,
        proximosPassos: feedbackData.proximosPassos,
        ativosInformacoes: ativosInfo
      }
    };
    
    onSave(dadosCompletos);
  };

  const addRecomendacao = () => {
    if (novaRecomendacao.titulo && novaRecomendacao.descricao) {
      setFeedbackData(prev => ({
        ...prev,
        recomendacoes: [...prev.recomendacoes, { ...novaRecomendacao, id: Date.now() }]
      }));
      setNovaRecomendacao({
        categoria: '',
        prioridade: 'média',
        titulo: '',
        descricao: '',
        impacto: ''
      });
    }
  };

  const removeRecomendacao = (index) => {
    setFeedbackData(prev => ({
      ...prev,
      recomendacoes: prev.recomendacoes.filter((_, i) => i !== index)
    }));
  };

  const ScoreSlider = ({ label, value, onChange, max = 100 }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{label}</label>
        <span style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6' }}>{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`,
          outline: 'none',
          appearance: 'none'
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );

  const SectionButton = ({ id, label, icon, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '12px 16px',
        textAlign: 'left',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: active ? '#eff6ff' : 'transparent',
        color: active ? '#1d4ed8' : '#6b7280',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.target.style.backgroundColor = '#f9fafb';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.target.style.backgroundColor = 'transparent';
        }
      }}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span>
      {label}
    </button>
  );

  const ativosAnaliseLista = feedbackData.ativosAnalise || [];
  const ativoSelecionado = ativosAnaliseLista.find(ativo => obterIdentificadorAtivo(ativo) === selectedAtivoId);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '2px solid #e5e7eb',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      maxWidth: '1200px',
      margin: '20px auto'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
        color: 'white',
        padding: '24px 32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>
              Análise Avançada de Carteira
            </h2>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Cliente: <strong>{carteira?.cliente?.name || carteira?.user?.firstName + ' ' + carteira?.user?.lastName || 'N/A'}</strong> • 
              Arquivo: <strong>{carteira?.nomeArquivo}</strong>
            </p>
            {loadingAtivos && (
              <p style={{ margin: '8px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
                Carregando informações dos ativos...
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                border: '1px solid rgba(255,255,255,0.3)',
                backgroundColor: 'transparent',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                border: 'none',
                backgroundColor: '#10b981',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Salvar Análise
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <div style={{
          width: '250px',
          backgroundColor: '#f8fafc',
          borderRight: '1px solid #e5e7eb',
          padding: '24px 16px'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
              Seções da Análise
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <SectionButton
              id="general"
              label="Avaliação Geral"
              icon="📈"
              active={activeSection === 'general'}
              onClick={setActiveSection}
            />
            <SectionButton
              id="recommendations"
              label="Recomendações"
              icon="💡"
              active={activeSection === 'recommendations'}
              onClick={setActiveSection}
            />
            <SectionButton
              id="assets"
              label="Análise de Ativos"
              icon="🏢"
              active={activeSection === 'assets'}
              onClick={setActiveSection}
            />
            <SectionButton
              id="feedback"
              label="Feedback Textual"
              icon="✏️"
              active={activeSection === 'feedback'}
              onClick={setActiveSection}
            />
          </div>

          {/* Status dos Ativos Carregados */}
          {ativosInfo.length > 0 && (
            <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '600', margin: '0 0 8px 0', color: '#1e40af' }}>
                STATUS DOS ATIVOS
              </h4>
              <div style={{ fontSize: '12px', color: '#374151' }}>
                <div>Total: {ativosInfo.length}</div>
                <div>Com informação: {ativosInfo.filter(a => a.temInformacao).length}</div>
                <div>Sem informação: {ativosInfo.filter(a => !a.temInformacao).length}</div>
                <div style={{ marginTop: '8px', fontWeight: '600', color: '#1e40af' }}>
                  Cobertura: {ativosInfo.length > 0 ? 
                    Math.round((ativosInfo.filter(a => a.temInformacao).length / ativosInfo.length) * 100) : 0
                  }%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '32px' }}>
          {/* Avaliação Geral */}
          {activeSection === 'general' && (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>
                Avaliação Geral da Carteira
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '32px',
                marginBottom: '32px'
              }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#374151' }}>
                    Pontuação Geral (0-10)
                  </h4>
                  <ScoreSlider
                    label="Nota da Carteira"
                    value={feedbackData.pontuacaoGeral * 10}
                    max={100}
                    onChange={(val) => setFeedbackData(prev => ({
                      ...prev,
                      pontuacaoGeral: val / 10
                    }))}
                  />
                  <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    marginTop: '16px'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#1d4ed8' }}>
                      {feedbackData.pontuacaoGeral.toFixed(1)}/10
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Pontuação Final</div>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#374151' }}>
                    Métricas Detalhadas
                  </h4>
                  <ScoreSlider
                    label="Qualidade dos Ativos"
                    value={feedbackData.avaliacoes.qualidade}
                    onChange={(val) => setFeedbackData(prev => ({
                      ...prev,
                      avaliacoes: { ...prev.avaliacoes, qualidade: val }
                    }))}
                  />
                  <ScoreSlider
                    label="Diversificação"
                    value={feedbackData.avaliacoes.diversificacao}
                    onChange={(val) => setFeedbackData(prev => ({
                      ...prev,
                      avaliacoes: { ...prev.avaliacoes, diversificacao: val }
                    }))}
                  />
                  <ScoreSlider
                    label="Adaptação ao Perfil"
                    value={feedbackData.avaliacoes.adaptacao}
                    onChange={(val) => setFeedbackData(prev => ({
                      ...prev,
                      avaliacoes: { ...prev.avaliacoes, adaptacao: val }
                    }))}
                  />
                </div>
              </div>

              {/* Preview das métricas */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginTop: '24px'
              }}>
                {[
                  { label: 'Qualidade', value: feedbackData.avaliacoes.qualidade, color: '#10b981' },
                  { label: 'Diversificação', value: feedbackData.avaliacoes.diversificacao, color: '#3b82f6' },
                  { label: 'Adaptação', value: feedbackData.avaliacoes.adaptacao, color: '#8b5cf6' }
                ].map((metric, index) => (
                  <div key={index} style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: metric.color }}>
                      {metric.value}%
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recomendações */}
          {activeSection === 'recommendations' && (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>
                Recomendações Personalizadas
              </h3>
              
              {/* Form para nova recomendação */}
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fbbf24',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#92400e' }}>
                  Adicionar Nova Recomendação
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                      Categoria
                    </label>
                    <select
                      value={novaRecomendacao.categoria}
                      onChange={(e) => setNovaRecomendacao(prev => ({...prev, categoria: e.target.value}))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Selecione...</option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                      Prioridade
                    </label>
                    <select
                      value={novaRecomendacao.prioridade}
                      onChange={(e) => setNovaRecomendacao(prev => ({...prev, prioridade: e.target.value}))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      {prioridades.map(pri => (
                        <option key={pri} value={pri}>{pri.charAt(0).toUpperCase() + pri.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                    Título da Recomendação
                  </label>
                  <input
                    type="text"
                    value={novaRecomendacao.titulo}
                    onChange={(e) => setNovaRecomendacao(prev => ({...prev, titulo: e.target.value}))}
                    placeholder="Ex: Aumentar exposição internacional"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                    Descrição
                  </label>
                  <textarea
                    value={novaRecomendacao.descricao}
                    onChange={(e) => setNovaRecomendacao(prev => ({...prev, descricao: e.target.value}))}
                    placeholder="Descreva a recomendação em detalhes..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                    Impacto Esperado
                  </label>
                  <input
                    type="text"
                    value={novaRecomendacao.impacto}
                    onChange={(e) => setNovaRecomendacao(prev => ({...prev, impacto: e.target.value}))}
                    placeholder="Ex: Redução de risco país e proteção cambial"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <button
                  onClick={addRecomendacao}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Adicionar Recomendação
                </button>
              </div>

              {/* Lista de recomendações */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {feedbackData.recomendacoes.map((rec, index) => (
                  <div key={index} style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: 
                            rec.prioridade === 'alta' ? '#fee2e2' :
                            rec.prioridade === 'média' ? '#fef3c7' : '#dbeafe',
                          color:
                            rec.prioridade === 'alta' ? '#dc2626' :
                            rec.prioridade === 'média' ? '#d97706' : '#2563eb'
                        }}>
                          {rec.prioridade?.charAt(0).toUpperCase() + rec.prioridade?.slice(1)}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{rec.categoria}</span>
                      </div>
                      <button
                        onClick={() => removeRecomendacao(index)}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Remover
                      </button>
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                      {rec.titulo}
                    </h4>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>
                      {rec.descricao}
                    </p>
                    {rec.impacto && (
                      <p style={{ fontSize: '14px', color: '#059669', margin: 0 }}>
                        <strong>Impacto:</strong> {rec.impacto}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Análise de Ativos */}
          {activeSection === 'assets' && (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>
                Análise Individual de Ativos
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                <div style={{
                  flex: '0 0 320px',
                  minWidth: '260px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                        Ativos analisados
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                        Selecione um ativo para editar os detalhes.
                      </p>
                    </div>
                    <button
                      onClick={adicionarAtivoManual}
                      style={{
                        backgroundColor: '#1d4ed8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      + Novo
                    </button>
                  </div>

                  {ativosInfo.length > 0 && (
                    <div style={{
                      backgroundColor: '#eff6ff',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '12px',
                      color: '#1e3a8a',
                      marginBottom: '12px'
                    }}>
                      <div>Total (API): {ativosInfo.length}</div>
                      <div>Pré-carregados: {ativosInfo.filter(a => a.temInformacao).length}</div>
                      <div>Sem informação: {ativosInfo.filter(a => !a.temInformacao).length}</div>
                    </div>
                  )}

                  <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span>🟢 Pré-carregado</span>
                    <span>🟠 Sem informação</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                    {ativosAnaliseLista.length > 0 ? (
                      ativosAnaliseLista.map(ativo => {
                        const idAtivo = obterIdentificadorAtivo(ativo);
                        const selecionado = idAtivo === selectedAtivoId;
                        const temInformacao = Boolean(ativo.temInformacao);
                        const statusLabel = ativo.status ? ativo.status.charAt(0).toUpperCase() + ativo.status.slice(1) : 'Sem status';
                        return (
                          <button
                            key={idAtivo}
                            onClick={() => setSelectedAtivoId(idAtivo)}
                            style={{
                              border: selecionado ? '2px solid #1d4ed8' : '1px solid #e5e7eb',
                              backgroundColor: selecionado ? '#eff6ff' : '#ffffff',
                              borderRadius: '8px',
                              padding: '12px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
                                {ativo.codigo || 'Novo ativo'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                {statusLabel}
                                {typeof ativo.pesoCarteira === 'number' && !Number.isNaN(ativo.pesoCarteira)
                                  ? ` • ${ativo.pesoCarteira}% da carteira`
                                  : ''}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1f2937' }}>
                              <span>{temInformacao ? '🟢' : '🟠'}</span>
                              {typeof ativo.nota === 'number' && !Number.isNaN(ativo.nota) && (
                                <span style={{ fontWeight: '600', color: '#2563eb' }}>
                                  {ativo.nota.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px dashed #cbd5f5',
                        padding: '16px',
                        fontSize: '12px',
                        color: '#6b7280',
                        textAlign: 'center'
                      }}>
                        Nenhum ativo disponível. Clique em “+ Novo” para adicionar manualmente.
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  flex: 1,
                  minWidth: '320px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  {ativoSelecionado ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <h4 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
                            {ativoSelecionado.codigo || 'Novo ativo'}
                          </h4>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                            Ajuste as informações abaixo para personalizar a análise.
                          </p>
                        </div>
                        {ativoSelecionado.temInformacao ? (
                          <span style={{
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '999px',
                            padding: '4px 10px'
                          }}>
                            Pré-carregado
                          </span>
                        ) : (
                          <span style={{
                            backgroundColor: '#fef3c7',
                            color: '#b45309',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '999px',
                            padding: '4px 10px'
                          }}>
                            Sem informação
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                            Código do ativo
                          </label>
                          <input
                            type="text"
                            value={ativoSelecionado.codigo || ''}
                            onChange={(e) => handleAtivoChange('codigo', e.target.value.toUpperCase())}
                            placeholder="Ex: ITUB4"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                            Tipo
                          </label>
                          <select
                            value={ativoSelecionado.tipo || 'acao'}
                            onChange={(e) => handleAtivoChange('tipo', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          >
                            {tiposAtivos.map(tipo => (
                              <option key={tipo} value={tipo}>
                                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                              </option>
                            ))}
                            {ativoSelecionado.tipo && !tiposAtivos.includes(ativoSelecionado.tipo) && (
                              <option value={ativoSelecionado.tipo}>{ativoSelecionado.tipo}</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                            Status
                          </label>
                          <select
                            value={ativoSelecionado.status || STATUS_PADRAO}
                            onChange={(e) => handleAtivoChange('status', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          >
                            {statusAtivos.map(status => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                            {ativoSelecionado.status && !statusAtivos.includes(ativoSelecionado.status) && (
                              <option value={ativoSelecionado.status}>{ativoSelecionado.status}</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                            Nota (0-10)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={ativoSelecionado.nota ?? ''}
                            onChange={(e) => {
                              const valor = e.target.value;
                              handleAtivoChange('nota', valor === '' ? null : parseFloat(valor));
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                            Peso na carteira (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={ativoSelecionado.pesoCarteira ?? ''}
                            onChange={(e) => {
                              const valor = e.target.value;
                              handleAtivoChange('pesoCarteira', valor === '' ? null : parseFloat(valor));
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                            Valor na carteira (R$)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ativoSelecionado.valorCarteira ?? ''}
                            onChange={(e) => {
                              const valor = e.target.value;
                              handleAtivoChange('valorCarteira', valor === '' ? null : parseFloat(valor));
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                          Recomendação
                        </label>
                        <input
                          type="text"
                          value={ativoSelecionado.recomendacao || ''}
                          onChange={(e) => handleAtivoChange('recomendacao', e.target.value)}
                          placeholder="Ex: Manter posição"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                          Comentário detalhado
                        </label>
                        <textarea
                          value={ativoSelecionado.comentario || ''}
                          onChange={(e) => handleAtivoChange('comentario', e.target.value)}
                          rows={5}
                          placeholder="Descreva a tese, riscos e próximos passos para o ativo."
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Última atualização automática: {ativoSelecionado.temInformacao ? 'informações importadas da API' : 'preenchimento manual'}
                        </div>
                        <button
                          onClick={() => removerAtivo(obterIdentificadorAtivo(ativoSelecionado))}
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Remover ativo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px dashed #cbd5f5',
                      borderRadius: '12px',
                      padding: '32px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      Selecione um ativo na lista ao lado ou adicione um novo para começar a análise.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Feedback Textual */}
          {activeSection === 'feedback' && (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>
                Feedback Textual da Carteira
              </h3>
              
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#374151'
                }}>
                  Análise Completa da Carteira
                </label>
                <textarea
                  value={feedbackData.feedbackGeral}
                  onChange={(e) => setFeedbackData(prev => ({...prev, feedbackGeral: e.target.value}))}
                  placeholder="Escreva uma análise geral da carteira, pontos fortes, pontos de atenção, e orientações gerais para o cliente..."
                  rows={12}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <span>Dica: Seja específico e construtivo no feedback</span>
                  <span>{feedbackData.feedbackGeral.length} caracteres</span>
                </div>
              </div>

              {/* Preview do feedback */}
              {feedbackData.feedbackGeral && (
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '24px',
                  marginTop: '24px'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
                    Preview do Feedback
                  </h4>
                  <div style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#374151',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {feedbackData.feedbackGeral}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdminFeedback;