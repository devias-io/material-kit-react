'use client';

import React, { useState, useEffect } from 'react';
import EnhancedAdminFeedback from '@/components/EnhancedAdminFeedback';
import { API_CONFIG, buildBatchApiUrl } from '@/config/apiConfig';

export default function AdminCarteirasPage() {
  const [currentTab, setCurrentTab] = useState(0);
  const [carteiras, setCarteiras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [pontuacao, setPontuacao] = useState('');
  const [recomendacoes, setRecomendacoes] = useState('');
  const [showAdvancedFeedback, setShowAdvancedFeedback] = useState(false);
  const [expandedAnalysed, setExpandedAnalysed] = useState(new Set());
  const [expandedResumoAtivos, setExpandedResumoAtivos] = useState(new Set());
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(null);
  const [precosAtuais, setPrecosAtuais] = useState(new Map());
  const [statusCotacoes, setStatusCotacoes] = useState(new Map());
  
  const [stats, setStats] = useState({
    total: 0,
    pendente: 0,
    em_analise: 0,
    analisada: 0,
    cancelada: 0
  });

  const parseNumero = (valor) => {
    if (valor === null || valor === undefined || valor === '') return null;
    if (typeof valor === 'number') {
      return Number.isFinite(valor) ? valor : null;
    }
    if (typeof valor === 'string') {
      const normalizado = valor
        .replace(/R\$/gi, '')
        .replace(/\s+/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '');
      if (!normalizado) return null;
      const convertido = parseFloat(normalizado);
      return Number.isNaN(convertido) ? null : convertido;
    }
    return null;
  };

  const formatCurrency = (valor) => {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor);
    } catch (error) {
      const numero = Number(valor);
      return Number.isNaN(numero) ? '—' : `R$ ${numero.toFixed(2)}`;
    }
  };

  const formatPercent = (valor) => {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
    const sinal = valor > 0 ? '+' : '';
    return `${sinal}${valor.toFixed(1)}%`;
  };

  const formatQuantidade = (valor) => {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
      maximumFractionDigits: 2
    });
  };

  const coletarTickers = (dadosEstruturados) => {
    if (!dadosEstruturados) return [];

    const camposCodigo = ['codigo', 'ticker', 'sigla', 'ativo', 'symbol', 'papel'];
    const categoriasIgnoradas = new Set(['rendaFixa', 'reserva', 'cripto']);
    const tickers = new Set();

    Object.entries(dadosEstruturados).forEach(([categoria, itens]) => {
      if (categoriasIgnoradas.has(categoria) || !Array.isArray(itens)) {
        return;
      }

      itens.forEach((item) => {
        if (!item || typeof item !== 'object') return;

        for (const campo of camposCodigo) {
          const valor = item[campo];
          if (typeof valor === 'string') {
            const normalizado = valor.trim().toUpperCase();
            if (normalizado) {
              tickers.add(normalizado);
              break;
            }
          }
        }
      });
    });

    return Array.from(tickers);
  };

  const consolidarAtivosCarteira = (dadosEstruturados, cotacoes) => {
    if (!dadosEstruturados) return [];

    const ativosTemporarios = [];

    const calcularValor = (valorInformado, quantidade, preco) => {
      if (valorInformado !== null && valorInformado !== undefined) {
        return valorInformado;
      }
      if (quantidade !== null && quantidade !== undefined && preco !== null && preco !== undefined) {
        return quantidade * preco;
      }
      return null;
    };

    const calcularRentabilidade = (rentabilidade, valorInvestido, valorAtual) => {
      if (rentabilidade !== null && rentabilidade !== undefined) {
        return rentabilidade;
      }
      if (
        valorInvestido !== null &&
        valorInvestido !== undefined &&
        valorAtual !== null &&
        valorAtual !== undefined &&
        valorInvestido !== 0
      ) {
        return ((valorAtual - valorInvestido) / valorInvestido) * 100;
      }
      return null;
    };

    const adicionarAtivo = (ativo, incluirNoTotal = true) => {
      ativosTemporarios.push({
        ...ativo,
        incluirNoTotal
      });
    };

    const montarObservacoes = (...itens) => itens.filter(Boolean).join(' • ');

    const obterCotacao = (codigo) => {
      if (!cotacoes || !codigo || typeof codigo !== 'string') return null;
      const normalizado = codigo.trim().toUpperCase();
      if (!normalizado) return null;

      let valorCotacao = null;

      if (cotacoes instanceof Map) {
        valorCotacao = cotacoes.get(normalizado);
      } else if (typeof cotacoes === 'object') {
        valorCotacao = cotacoes[normalizado];
      }

      return typeof valorCotacao === 'number' && !Number.isNaN(valorCotacao) ? valorCotacao : null;
    };

    // Ações
    (dadosEstruturados.acoes || []).forEach((acao, index) => {
      const quantidade = parseNumero(acao.quantidade);
      const precoMedio = parseNumero(acao.precoMedio);
      const precoInformado = parseNumero(
        acao.cotacaoAtual ?? acao.cotacao ?? (acao.valorAtual && quantidade ? acao.valorAtual / quantidade : null)
      );
      const codigoAtivo = typeof acao.codigo === 'string' ? acao.codigo : '';
      const precoCotacao = obterCotacao(codigoAtivo);
      const precoAtual = precoCotacao ?? precoInformado;
      const valorInvestido = calcularValor(parseNumero(acao.valorInvestido), quantidade, precoMedio);
      let valorAtual = calcularValor(
        precoCotacao !== null ? null : parseNumero(acao.valorAtual),
        quantidade,
        (precoAtual ?? precoMedio)
      );

      if (precoCotacao !== null && (valorAtual === null || valorAtual === undefined)) {
        const valorInformado = parseNumero(acao.valorAtual);
        if (valorInformado !== null && valorInformado !== undefined) {
          valorAtual = valorInformado;
        } else if (typeof quantidade === 'number' && Number.isFinite(quantidade)) {
          valorAtual = quantidade * precoCotacao;
        }
      }

      if (valorAtual === null || valorAtual === undefined) {
        const valorInformado = parseNumero(acao.valorAtual);
        if (valorInformado !== null && valorInformado !== undefined) {
          valorAtual = valorInformado;
        }
      }

      let rentabilidade = precoCotacao !== null
        ? calcularRentabilidade(null, valorInvestido, valorAtual)
        : calcularRentabilidade(parseNumero(acao.rentabilidade), valorInvestido, valorAtual);

      if (rentabilidade === null || Number.isNaN(rentabilidade)) {
        rentabilidade = parseNumero(acao.rentabilidade);
      }
      const pesoInformado = parseNumero(acao.pesoCarteira);

      adicionarAtivo({
        id: `acao-${index}-${acao.codigo || 'nd'}`,
        codigo: acao.codigo || '—',
        nome: acao.nome || acao.codigo || 'Ação sem identificação',
        categoria: 'Ações',
        quantidade,
        precoMedio,
        precoAtual,
        valorInvestido,
        valorAtual,
        rentabilidade,
        pesoInformado,
        segmento: acao.setor || acao.segmento || acao.subsetor || '',
        observacoes: montarObservacoes(acao.observacoes)
      });
    });

    // FIIs
    (dadosEstruturados.fiis || []).forEach((fii, index) => {
      const quantidade = parseNumero(fii.quantidade);
      const precoMedio = parseNumero(fii.precoMedio);
      const precoInformado = parseNumero(
        fii.cotacaoAtual ?? fii.cotacao ?? (fii.valorAtual && quantidade ? fii.valorAtual / quantidade : null)
      );
      const codigoAtivo = typeof fii.codigo === 'string' ? fii.codigo : '';
      const precoCotacao = obterCotacao(codigoAtivo);
      const precoAtual = precoCotacao ?? precoInformado;
      const valorInvestido = calcularValor(parseNumero(fii.valorInvestido), quantidade, precoMedio);
      let valorAtual = calcularValor(
        precoCotacao !== null ? null : parseNumero(fii.valorAtual),
        quantidade,
        (precoAtual ?? precoMedio)
      );

      if (precoCotacao !== null && (valorAtual === null || valorAtual === undefined)) {
        const valorInformado = parseNumero(fii.valorAtual);
        if (valorInformado !== null && valorInformado !== undefined) {
          valorAtual = valorInformado;
        } else if (typeof quantidade === 'number' && Number.isFinite(quantidade)) {
          valorAtual = quantidade * precoCotacao;
        }
      }

      if (valorAtual === null || valorAtual === undefined) {
        const valorInformado = parseNumero(fii.valorAtual);
        if (valorInformado !== null && valorInformado !== undefined) {
          valorAtual = valorInformado;
        }
      }

      let rentabilidade = precoCotacao !== null
        ? calcularRentabilidade(null, valorInvestido, valorAtual)
        : calcularRentabilidade(parseNumero(fii.rentabilidade), valorInvestido, valorAtual);

      if (rentabilidade === null || Number.isNaN(rentabilidade)) {
        rentabilidade = parseNumero(fii.rentabilidade);
      }
      const pesoInformado = parseNumero(fii.pesoCarteira);

      adicionarAtivo({
        id: `fii-${index}-${fii.codigo || 'nd'}`,
        codigo: fii.codigo || '—',
        nome: fii.nome || fii.codigo || 'FII sem identificação',
        categoria: 'FIIs',
        quantidade,
        precoMedio,
        precoAtual,
        valorInvestido,
        valorAtual,
        rentabilidade,
        pesoInformado,
        segmento: fii.segmento || fii.setor || '',
        observacoes: montarObservacoes(fii.observacoes)
      });
    });

    // Renda Fixa
    (dadosEstruturados.rendaFixa || []).forEach((item, index) => {
      const valorInvestido = parseNumero(item.valorInvestido);
      const valorAtual = calcularValor(parseNumero(item.valorAtual), null, null) ?? valorInvestido;
      const rentabilidade = calcularRentabilidade(parseNumero(item.rentabilidade), valorInvestido, valorAtual);
      const pesoInformado = parseNumero(item.pesoCarteira);

      adicionarAtivo({
        id: `renda-fixa-${index}`,
        codigo: item.produto || 'RENDA FIXA',
        nome: item.banco ? `${item.banco}${item.produto ? ` • ${item.produto}` : ''}` : item.produto || 'Renda Fixa',
        categoria: 'Renda Fixa',
        quantidade: null,
        precoMedio: null,
        precoAtual: null,
        valorInvestido,
        valorAtual,
        rentabilidade,
        pesoInformado,
        segmento: item.tipo || '',
        observacoes: montarObservacoes(item.vencimento ? `Vencimento: ${item.vencimento}` : '', item.observacoes)
      });
    });

    // Exterior
    (dadosEstruturados.exterior || []).forEach((ativo, index) => {
      const quantidade = parseNumero(ativo.quantidade);
      const taxaCambio = parseNumero(ativo.taxaCambio) ?? 5.5;
      const precoMedioUSD = parseNumero(ativo.precoMedioUSD);
      const precoAtualUSD = parseNumero(ativo.cotacaoUSD ?? ativo.cotacaoAtualUSD);
      const precoMedio = precoMedioUSD !== null ? precoMedioUSD * taxaCambio : null;
      const precoInformado = precoAtualUSD !== null ? precoAtualUSD * taxaCambio : null;
      const codigoAtivo = typeof ativo.codigo === 'string' ? ativo.codigo : '';
      const precoCotacao = obterCotacao(codigoAtivo);
      const precoAtual = precoCotacao ?? precoInformado;
      const valorInvestido = calcularValor(parseNumero(ativo.valorInvestido), quantidade, precoMedio);
      let valorAtual = calcularValor(
        precoCotacao !== null ? null : parseNumero(ativo.valorAtual),
        quantidade,
        (precoAtual ?? precoMedio)
      );

      if (precoCotacao !== null && (valorAtual === null || valorAtual === undefined)) {
        const valorInformado = parseNumero(ativo.valorAtual);
        if (valorInformado !== null && valorInformado !== undefined) {
          valorAtual = valorInformado;
        } else if (typeof quantidade === 'number' && Number.isFinite(quantidade)) {
          valorAtual = quantidade * precoCotacao;
        }
      }

      if (valorAtual === null || valorAtual === undefined) {
        const valorInformado = parseNumero(ativo.valorAtual);
        if (valorInformado !== null && valorInformado !== undefined) {
          valorAtual = valorInformado;
        }
      }

      let rentabilidade = precoCotacao !== null
        ? calcularRentabilidade(null, valorInvestido, valorAtual)
        : calcularRentabilidade(parseNumero(ativo.rentabilidade), valorInvestido, valorAtual);

      if (rentabilidade === null || Number.isNaN(rentabilidade)) {
        rentabilidade = parseNumero(ativo.rentabilidade);
      }
      const pesoInformado = parseNumero(ativo.pesoCarteira);

      adicionarAtivo({
        id: `exterior-${index}-${ativo.codigo || 'nd'}`,
        codigo: ativo.codigo || '—',
        nome: ativo.nome || ativo.codigo || 'Ativo Exterior',
        categoria: 'Exterior',
        quantidade,
        precoMedio,
        precoAtual,
        valorInvestido,
        valorAtual,
        rentabilidade,
        pesoInformado,
        segmento: ativo.setor || ativo.segmento || '',
        observacoes: montarObservacoes(ativo.pais, ativo.bolsa)
      });
    });

    // Cripto
    (dadosEstruturados.cripto || []).forEach((cripto, index) => {
      const quantidade = parseNumero(cripto.quantidade);
      const precoMedio = parseNumero(cripto.precoMedio);
      const valorInvestido = calcularValor(parseNumero(cripto.valorInvestido), quantidade, precoMedio);
      const valorAtual = calcularValor(parseNumero(cripto.valorAtual), quantidade, parseNumero(cripto.cotacaoAtual) ?? precoMedio);
      const rentabilidade = calcularRentabilidade(parseNumero(cripto.rentabilidade), valorInvestido, valorAtual);
      const pesoInformado = parseNumero(cripto.pesoCarteira);

      adicionarAtivo({
        id: `cripto-${index}-${cripto.criptomoeda || 'nd'}`,
        codigo: cripto.criptomoeda || 'CRIPTO',
        nome: cripto.exchange ? `${cripto.exchange}${cripto.criptomoeda ? ` • ${cripto.criptomoeda}` : ''}` : cripto.criptomoeda || 'Criptoativo',
        categoria: 'Cripto',
        quantidade,
        precoMedio,
        precoAtual: null,
        valorInvestido,
        valorAtual,
        rentabilidade,
        pesoInformado,
        segmento: cripto.tipo || '',
        observacoes: montarObservacoes(cripto.exchange)
      });
    });

    // Reserva (não conta no peso geral)
    (dadosEstruturados.reserva || []).forEach((item, index) => {
      const valor = parseNumero(item.valor);
      adicionarAtivo({
        id: `reserva-${index}-${item.onde || 'nd'}`,
        codigo: item.onde || 'RESERVA',
        nome: item.banco ? `${item.banco}${item.onde ? ` • ${item.onde}` : ''}` : item.onde || 'Reserva',
        categoria: 'Reserva',
        quantidade: null,
        precoMedio: null,
        precoAtual: null,
        valorInvestido: valor,
        valorAtual: valor,
        rentabilidade: null,
        pesoInformado: 0,
        segmento: item.tipo || '',
        observacoes: montarObservacoes(item.observacoes)
      }, false);
    });

    const totalParaPeso = ativosTemporarios.reduce((acumulado, ativo) => {
      if (!ativo.incluirNoTotal) return acumulado;
      const baseValor =
        typeof ativo.valorAtual === 'number'
          ? ativo.valorAtual
          : typeof ativo.valorInvestido === 'number'
            ? ativo.valorInvestido
            : 0;
      return acumulado + (Number.isFinite(baseValor) ? baseValor : 0);
    }, 0);

    return ativosTemporarios.map((ativo) => {
      const baseValor =
        typeof ativo.valorAtual === 'number'
          ? ativo.valorAtual
          : typeof ativo.valorInvestido === 'number'
            ? ativo.valorInvestido
            : 0;

      const pesoCalculado =
        typeof ativo.pesoInformado === 'number' && !Number.isNaN(ativo.pesoInformado)
          ? ativo.pesoInformado
          : ativo.incluirNoTotal && totalParaPeso > 0
            ? (baseValor / totalParaPeso) * 100
            : null;

      const restante = { ...ativo };
      delete restante.incluirNoTotal;
      delete restante.pesoInformado;

      return {
        ...restante,
        peso: pesoCalculado
      };
    });
  };

  const carregarPrecosBrapi = async (carteiraId, dadosEstruturados) => {
    if (!dadosEstruturados) return;

    if (precosAtuais.has(carteiraId)) {
      return;
    }

    const statusAtual = statusCotacoes.get(carteiraId);
    if (statusAtual?.loading) {
      return;
    }

    const tickers = coletarTickers(dadosEstruturados);

    if (!tickers.length) {
      setPrecosAtuais((prev) => {
        const atualizado = new Map(prev);
        atualizado.set(carteiraId, {});
        return atualizado;
      });
      setStatusCotacoes((prev) => {
        const atualizado = new Map(prev);
        atualizado.set(carteiraId, { loading: false, error: null });
        return atualizado;
      });
      return;
    }

    setStatusCotacoes((prev) => {
      const atualizado = new Map(prev);
      atualizado.set(carteiraId, { loading: true, error: null });
      return atualizado;
    });

    const url = buildBatchApiUrl(tickers);
    const headers = { ...API_CONFIG.DEFAULT_HEADERS };
    const maxTentativas = Math.max(1, API_CONFIG.MAX_RETRIES || 1);
    const atrasoTentativas = API_CONFIG.RETRY_DELAY || 0;

    let tentativa = 0;
    let ultimoErro = null;

    while (tentativa < maxTentativas) {
      try {
        const response = await fetch(url, {
          headers,
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const data = await response.json();
        const resultados = Array.isArray(data?.results) ? data.results : [];
        const cotacoesRecebidas = resultados.reduce((acumulado, item) => {
          if (!item || typeof item !== 'object') return acumulado;

          const simbolo = (item.symbol || item.ticker || item.stock || '').toString().trim().toUpperCase();
          const preco = item.regularMarketPrice;

          if (simbolo && typeof preco === 'number' && !Number.isNaN(preco)) {
            acumulado[simbolo] = preco;
          }

          return acumulado;
        }, {});

        setPrecosAtuais((prev) => {
          const atualizado = new Map(prev);
          atualizado.set(carteiraId, cotacoesRecebidas);
          return atualizado;
        });

        setStatusCotacoes((prev) => {
          const atualizado = new Map(prev);
          atualizado.set(carteiraId, { loading: false, error: null });
          return atualizado;
        });

        return;
      } catch (erro) {
        ultimoErro = erro;
        tentativa += 1;

        if (tentativa < maxTentativas && atrasoTentativas > 0) {
          await new Promise((resolver) => setTimeout(resolver, atrasoTentativas));
        }
      }
    }

    setStatusCotacoes((prev) => {
      const atualizado = new Map(prev);
      atualizado.set(carteiraId, {
        loading: false,
        error: ultimoErro?.message || 'Erro ao carregar cotações'
      });
      return atualizado;
    });

    console.error(`Erro ao carregar cotações da carteira ${carteiraId}:`, ultimoErro);
    alert('Não foi possível atualizar as cotações agora. Exibindo os valores informados originalmente.');
  };

  const toggleResumoAtivos = (carteiraId, dadosEstruturados) => {
    const jaExpandido = expandedResumoAtivos.has(carteiraId);

    setExpandedResumoAtivos((prev) => {
      const novo = new Set(prev);
      if (novo.has(carteiraId)) {
        novo.delete(carteiraId);
      } else {
        novo.add(carteiraId);
      }
      return novo;
    });

    if (!jaExpandido && !precosAtuais.has(carteiraId)) {
      carregarPrecosBrapi(carteiraId, dadosEstruturados);
    }
  };

  const renderResumoAtivosTabela = (carteiraId, dadosEstruturados) => {
    const cotacoesCarteira = precosAtuais.get(carteiraId);
    const statusCotacao = statusCotacoes.get(carteiraId) || { loading: false, error: null };
    const ativos = consolidarAtivosCarteira(dadosEstruturados, cotacoesCarteira);

    if (!ativos.length) {
      return null;
    }

    const totalValorInvestido = ativos.reduce((acumulado, ativo) => {
      return acumulado + (typeof ativo.valorInvestido === 'number' && !Number.isNaN(ativo.valorInvestido) ? ativo.valorInvestido : 0);
    }, 0);

    const totalValorAtual = ativos.reduce((acumulado, ativo) => {
      const valor = typeof ativo.valorAtual === 'number' && !Number.isNaN(ativo.valorAtual)
        ? ativo.valorAtual
        : (typeof ativo.valorInvestido === 'number' && !Number.isNaN(ativo.valorInvestido) ? ativo.valorInvestido : 0);
      return acumulado + valor;
    }, 0);

    const totalPeso = ativos.reduce((acumulado, ativo) => {
      return acumulado + (typeof ativo.peso === 'number' && !Number.isNaN(ativo.peso) ? ativo.peso : 0);
    }, 0);

    const rentabilidadeTotal = totalValorInvestido > 0
      ? ((totalValorAtual - totalValorInvestido) / totalValorInvestido) * 100
      : null;

    const rentabilidadeTotalColor =
      typeof rentabilidadeTotal === 'number'
        ? rentabilidadeTotal > 0
          ? '#16a34a'
          : rentabilidadeTotal < 0
            ? '#dc2626'
            : '#64748b'
        : '#64748b';

    const totalPesoColor =
      typeof totalPeso === 'number' && !Number.isNaN(totalPeso)
        ? totalPeso > 0
          ? '#2563eb'
          : '#64748b'
        : '#64748b';

    return (
      <div
        style={{
          marginTop: '20px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Visão Geral dos Ativos</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {ativos.length} {ativos.length === 1 ? 'ativo' : 'ativos'} consolidados • Patrimônio estimado: {formatCurrency(totalValorAtual)}
            </div>
          </div>
          <button
            onClick={() => toggleResumoAtivos(carteiraId, dadosEstruturados)}
            style={{
              backgroundColor: expandedResumoAtivos.has(carteiraId) ? '#1d4ed8' : '#3b82f6',
              color: 'white',
              padding: '10px 18px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
            }}
          >
            {expandedResumoAtivos.has(carteiraId) ? 'Ocultar tabela' : 'Exibir tabela'}
          </button>
        </div>

        {statusCotacao.error && !statusCotacao.loading && (
          <div
            style={{
              margin: '0 20px',
              marginTop: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Não foi possível atualizar todas as cotações automaticamente. Os valores originais foram mantidos.
          </div>
        )}

        {expandedResumoAtivos.has(carteiraId) && (
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: '#0f172a', fontSize: '12px', letterSpacing: '0.05em' }}>ATIVO</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: '#0f172a', fontSize: '12px', letterSpacing: '0.05em' }}>CATEGORIA</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', color: '#0f172a', fontSize: '12px', letterSpacing: '0.05em' }}>QTDE</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', color: '#0f172a', fontSize: '12px', letterSpacing: '0.05em' }}>PREÇO MÉDIO</th>
                    <th
                      style={{ textAlign: 'right', padding: '12px 8px', color: '#0f172a', fontSize: '12px', letterSpacing: '0.05em' }}
                    >
                      PREÇO ATUAL
                      {statusCotacao.loading && (
                        <div style={{ marginTop: '4px', fontSize: '10px', color: '#64748b', fontWeight: '500' }}>
                          Atualizando...
                        </div>
                      )}
                      {statusCotacao.error && !statusCotacao.loading && (
                        <div style={{ marginTop: '4px', fontSize: '10px', color: '#dc2626', fontWeight: '500' }}>
                          Falha ao atualizar
                        </div>
                      )}
                    </th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', color: '#0f172a', fontSize: '12px', letterSpacing: '0.05em' }}>VALOR INVESTIDO</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', color: '#0f172a', fontSize: '12px', letterSpacing: '0.05em' }}>VALOR ATUAL</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', color: '#0f172a', fontSize: '12px', letterSpacing: '0.05em' }}>RENTAB.</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', color: '#0f172a', fontSize: '12px', letterSpacing: '0.05em' }}>PESO</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: '#0f172a', fontSize: '12px', letterSpacing: '0.05em' }}>NOTAS</th>
                  </tr>
                </thead>
                <tbody>
                  {ativos.map((ativo, index) => {
                    const rentabilidadeColor =
                      typeof ativo.rentabilidade === 'number'
                        ? ativo.rentabilidade > 0
                          ? '#16a34a'
                          : ativo.rentabilidade < 0
                            ? '#dc2626'
                            : '#64748b'
                        : '#64748b';

                    const pesoColor =
                      typeof ativo.peso === 'number'
                        ? ativo.peso > 0
                          ? '#2563eb'
                          : '#64748b'
                        : '#64748b';

                    return (
                      <tr
                        key={`${ativo.id}-${index}`}
                        style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
                      >
                        <td style={{ padding: '12px 8px', color: '#1e293b', fontWeight: '600' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>{ativo.codigo}</span>
                            {ativo.nome && <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{ativo.nome}</span>}
                            {ativo.segmento && <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>{ativo.segmento}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px', color: '#475569', fontWeight: '600' }}>{ativo.categoria}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1e293b' }}>{formatQuantidade(ativo.quantidade)}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1e293b' }}>{formatCurrency(ativo.precoMedio)}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1e293b' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            <span>{formatCurrency(ativo.precoAtual)}</span>
                            {statusCotacao.loading && index === 0 && (
                              <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>Atualizando...</span>
                            )}
                            {statusCotacao.error && !statusCotacao.loading && index === 0 && (
                              <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: '500' }}>Usando dados originais</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1e293b' }}>{formatCurrency(ativo.valorInvestido)}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1e293b' }}>{formatCurrency(ativo.valorAtual)}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: rentabilidadeColor }}>{formatPercent(ativo.rentabilidade)}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: pesoColor }}>{formatPercent(ativo.peso)}</td>
                        <td style={{ padding: '12px 8px', color: '#475569' }}>{ativo.observacoes || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#eff6ff', borderTop: '2px solid #bfdbfe' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '700', color: '#1d4ed8' }} colSpan={2}>TOTAL CONSOLIDADO</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1e293b' }}>—</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1e293b' }}>—</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1e293b' }}>—</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700', color: '#1e293b' }}>{formatCurrency(totalValorInvestido)}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700', color: '#1e293b' }}>{formatCurrency(totalValorAtual)}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700', color: rentabilidadeTotalColor }}>{formatPercent(rentabilidadeTotal)}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700', color: totalPesoColor }}>{formatPercent(totalPeso)}</td>
                    <td style={{ padding: '12px 8px', color: '#475569' }}>—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    carregarCarteiras();
  }, []);

  // Função para avaliar carteira automaticamente
  const avaliarCarteira = (dadosEstruturados) => {
    if (!dadosEstruturados) return null;

    let pontuacao = 0;
    const checks = {
      quantidadeAtivos: false,
      concentracao: true,
      reservaEmergencia: false,
      temAcoes: false,
      temFIIs: false,
      exteriorDireto: false,
      exteriorIndireto: false,
      bonsFundamentos: true
    };

    let totalAtivos = 0;
    let valorTotalCarteira = 0;
    const alertas = [];

    // Contar ativos e calcular valor total
    ['acoes', 'fiis', 'rendaFixa', 'exterior', 'cripto'].forEach(categoria => {
      const itens = dadosEstruturados[categoria] || [];
      totalAtivos += itens.length;
      itens.forEach(item => {
        valorTotalCarteira += item.valorAtual || item.valorInvestido || 0;
      });
    });

    // Check 1: Quantidade de ativos (15-30) - 2 pontos
    if (totalAtivos >= 15 && totalAtivos <= 30) {
      checks.quantidadeAtivos = true;
      pontuacao += 2;
    } else if (totalAtivos > 30) {
      alertas.push(`Carteira muito pulverizada: ${totalAtivos} ativos (recomendado: 15-30)`);
    } else {
      alertas.push(`Poucos ativos na carteira: ${totalAtivos} (recomendado: 15-30)`);
    }

    // Check 2: Concentração - verificar se algum ativo > 5% - 2 pontos
    ['acoes', 'fiis', 'exterior'].forEach(categoria => {
      const itens = dadosEstruturados[categoria] || [];
      itens.forEach(item => {
        const percentual = valorTotalCarteira > 0 ? (item.valorAtual || item.valorInvestido || 0) / valorTotalCarteira * 100 : 0;
        if (percentual > 5) {
          checks.concentracao = false;
          alertas.push(`Concentração elevada em ${item.codigo || item.nome}: ${percentual.toFixed(1)}%`);
        }
      });
    });
    if (checks.concentracao) pontuacao += 2;

    // Check 3: Reserva de emergência - 1 ponto
    if (dadosEstruturados.reserva && dadosEstruturados.reserva.length > 0) {
      checks.reservaEmergencia = true;
      pontuacao += 1;
    }

    // Check 4: Investe em ações - 1 ponto
    if (dadosEstruturados.acoes && dadosEstruturados.acoes.length > 0) {
      checks.temAcoes = true;
      pontuacao += 1;
    }

    // Check 5: Investe em FIIs - 1 ponto
    if (dadosEstruturados.fiis && dadosEstruturados.fiis.length > 0) {
      checks.temFIIs = true;
      pontuacao += 1;
    }

    // Check 6: Investe diretamente no exterior - 2 pontos
    if (dadosEstruturados.exterior && dadosEstruturados.exterior.length > 0) {
      checks.exteriorDireto = true;
      pontuacao += 2;
    } else {
      alertas.push('Sem exposição internacional direta - considere diversificar geograficamente');
    }

    // Determinar perfil baseado na pontuação
    let perfil = 'CONSERVADOR';
    let avaliacaoGeral = 'REGULAR';
    
    if (pontuacao >= 8) {
      perfil = 'MODERADO';
      avaliacaoGeral = 'MUITO BOM';
    } else if (pontuacao >= 6) {
      perfil = 'ARROJADO';
      avaliacaoGeral = 'BOM';
    }

    return {
      pontuacao,
      pontuacaoMaxima: 10,
      checks,
      perfil,
      avaliacaoGeral,
      alertas,
      totalAtivos,
      valorTotalCarteira,
      metricas: {
        qualidade: Math.min(100, (pontuacao / 10) * 100),
        diversificacao: Math.min(100, (totalAtivos / 25) * 100),
        adaptacao: Math.min(100, checks.concentracao ? 85 : 60)
      }
    };
  };

  // Componente Gauge Chart
  const GaugeChart = ({ label, value, color = '#10b981' }) => {
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = `${(value / 100) * circumference} ${circumference}`;
    
    return (
      <div style={{ textAlign: 'center', margin: '0 20px' }}>
        <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 8px' }}>
          <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke={color} 
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '18px',
            fontWeight: '700',
            color: color
          }}>
            {Math.round(value)}%
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
          {label}
        </div>
      </div>
    );
  };

  // Modal de Análise Detalhada
  const DetailedAnalysisModal = ({ carteira, analise, onClose }) => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '90%',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        {/* Header do Modal */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>
              Análise Detalhada da Carteira
            </h2>
            <p style={{ margin: 0, opacity: 0.9 }}>
              {carteira.nomeArquivo} • {carteira.cliente?.name || 'Cliente não informado'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '32px' }}>
          {/* Avaliação Geral */}
          <div style={{
            background: `linear-gradient(135deg, ${analise.avaliacaoGeral === 'MUITO BOM' ? '#10b981' : analise.avaliacaoGeral === 'BOM' ? '#3b82f6' : '#f59e0b'} 0%, ${analise.avaliacaoGeral === 'MUITO BOM' ? '#059669' : analise.avaliacaoGeral === 'BOM' ? '#2563eb' : '#d97706'} 100%)`,
            color: 'white',
            padding: '24px',
            borderRadius: '16px',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              ANÁLISE DE CARTEIRA
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
              AVALIAÇÃO: {analise.avaliacaoGeral}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>
              Pontuação: {analise.pontuacao}/{analise.pontuacaoMaxima} pontos
            </div>
          </div>

          {/* Métricas Visuais */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <GaugeChart 
              label="Qualidade da carteira" 
              value={analise.metricas.qualidade}
              color="#10b981"
            />
            <GaugeChart 
              label="Diversificação" 
              value={analise.metricas.diversificacao}
              color="#3b82f6"
            />
            <GaugeChart 
              label="Adaptação ao perfil" 
              value={analise.metricas.adaptacao}
              color="#8b5cf6"
            />
          </div>

          {/* Checklist */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '20px'
            }}>
              CHECK-LIST DA CARTEIRA:
            </h3>
            
            <div style={{ display: 'grid', gap: '8px' }}>
              {[
                { key: 'quantidadeAtivos', label: 'POSSUI ENTRE 15-30 ATIVOS (PODE SER MAIS)', pontos: 2 },
                { key: 'concentracao', label: 'NENHUM ATIVO COM CONCENTRAÇÃO ELEVADA', pontos: 2 },
                { key: 'reservaEmergencia', label: 'POSSUI RESERVA DE EMERGÊNCIA/CAIXA/RENDA FIXA', pontos: 1 },
                { key: 'temAcoes', label: 'INVESTE EM AÇÕES', pontos: 1 },
                { key: 'temFIIs', label: 'INVESTE EM FUNDOS IMOBILIÁRIOS', pontos: 1 },
                { key: 'exteriorDireto', label: 'INVESTE DIRETAMENTE NO EXTERIOR', pontos: 2 },
                { key: 'exteriorIndireto', label: 'INVESTE INDIRETAMENTE NO EXTERIOR', pontos: 1 },
                { key: 'bonsFundamentos', label: 'MAIORIA DOS ATIVOS TEM BONS FUNDAMENTOS', pontos: 1 }
              ].map(item => (
                <div key={item.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 0',
                  fontSize: '14px'
                }}>
                  <span style={{
                    fontSize: '18px',
                    color: analise.checks[item.key] ? '#10b981' : '#ef4444'
                  }}>
                    {analise.checks[item.key] ? '✓' : '✗'}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>
                    ({item.pontos} PONTOS)
                  </span>
                  <span style={{ 
                    color: analise.checks[item.key] ? '#059669' : '#dc2626',
                    fontWeight: '500'
                  }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #3b82f6'
            }}>
              <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>
                SEU SOMATÓRIO FOI DE {analise.pontuacao} PONTOS.
              </div>
              <div style={{ fontSize: '14px', color: '#1e40af', marginTop: '8px' }}>
                <strong>SEU PERFIL É: {analise.perfil}</strong>
              </div>
            </div>
          </div>

          {/* Alertas */}
          {analise.alertas.length > 0 && (
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#92400e',
                marginBottom: '12px'
              }}>
                Pontos de Atenção:
              </h4>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                color: '#78350f'
              }}>
                {analise.alertas.map((alerta, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>
                    {alerta}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const carregarCarteiras = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/carteiras');
      const data = await response.json();

      if (response.ok) {
        setCarteiras(data.carteiras || []);
        setStats(data.estatisticas || stats);
      } else {
        setError(data.error || 'Erro ao carregar carteiras');
      }
    } catch (err) {
      setError('Erro de conexão');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const matchesStatus = (status, statuses) => statuses.includes((status ?? '').toLowerCase());

  const carteirasPendentes = carteiras.filter(c =>
    matchesStatus(c.status, ['pendente', 'nova', 'em_analise', 'processing', 'pending'])
  ).sort((a, b) => {
    const diasA = Math.floor((new Date() - new Date(a.dataEnvio)) / (1000 * 60 * 60 * 24));
    const diasB = Math.floor((new Date() - new Date(b.dataEnvio)) / (1000 * 60 * 60 * 24));
    return diasB - diasA;
  });

  const carteirasAnalisadas = carteiras.filter(c =>
    matchesStatus(c.status, ['analisada', 'fechada', 'completed'])
  ).sort((a, b) => {
    const dataA = a.dataAnalise || a.updatedAt || a.dataEnvio;
    const dataB = b.dataAnalise || b.updatedAt || b.dataEnvio;
    return new Date(dataB) - new Date(dataA);
  });

  const toggleExpandedAnalysed = (carteiraId) => {
    const newExpanded = new Set(expandedAnalysed);
    if (newExpanded.has(carteiraId)) {
      newExpanded.delete(carteiraId);
    } else {
      newExpanded.add(carteiraId);
    }
    setExpandedAnalysed(newExpanded);
  };

  const handleDeleteCarteira = async (carteiraId, clienteNome) => {
    const clienteEmail = carteiras.find(c => c.id === carteiraId)?.cliente?.email || 
                        carteiras.find(c => c.id === carteiraId)?.user?.email || 
                        'Email não encontrado';
    
    if (!confirm(`Tem certeza que deseja DELETAR a carteira de ${clienteNome}?\n\nEsta ação permitirá que o cliente envie uma nova carteira.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/carteiras/${carteiraId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Sucesso: ${result.message}\n\nO cliente ${clienteEmail} agora pode enviar uma nova carteira.`);
        carregarCarteiras();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      alert('Erro ao remover carteira');
      console.error(error);
    }
  };

  const salvarAnalise = async (dadosAnalise) => {
    try {
      const response = await fetch('/api/admin/carteiras', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dadosAnalise.id,
          feedback: dadosAnalise.feedback,
          pontuacao: dadosAnalise.pontuacao,
          recomendacoes: dadosAnalise.recomendacoes,
          status: dadosAnalise.status,
          avaliacaoQualidade: dadosAnalise.avaliacaoQualidade,
          avaliacaoDiversificacao: dadosAnalise.avaliacaoDiversificacao,
          avaliacaoAdaptacao: dadosAnalise.avaliacaoAdaptacao,
          dadosEstruturados: dadosAnalise.dadosEstruturados,
          dataAnalise: dadosAnalise.dataAnalise
        })
      });

      if (response.ok) {
        alert('Análise salva com sucesso!');
        setEditando(null);
        setShowAdvancedFeedback(false);
        carregarCarteiras();
      } else {
        const data = await response.json();
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao salvar análise');
      console.error(err);
    }
  };

  const salvarAnaliseSimples = async (carteiraId) => {
    try {
      const response = await fetch('/api/admin/carteiras', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: carteiraId,
          feedback,
          pontuacao: parseFloat(pontuacao),
          recomendacoes: recomendacoes.split('\n').filter(r => r.trim()),
          status: 'ANALISADA'
        })
      });

      if (response.ok) {
        alert('Análise salva com sucesso!');
        setEditando(null);
        setFeedback('');
        setPontuacao('');
        setRecomendacoes('');
        carregarCarteiras();
      } else {
        const data = await response.json();
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao salvar análise');
      console.error(err);
    }
  };

  const iniciarEdicao = (carteira) => {
    setEditando(carteira.id);
    setFeedback(carteira.feedback || '');
    setPontuacao(carteira.pontuacao || '');
    setRecomendacoes(carteira.recomendacoes ? carteira.recomendacoes.join('\n') : '');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'analisada': 
        return '#10b981';
      case 'processing':
      case 'em_analise':
      case 'em análise':
        return '#f59e0b';
      case 'pending':
      case 'pendente':
      case 'nova':
        return '#64748b';
      case 'error':
      case 'erro':
        return '#ef4444';
      case 'cancelled':
      case 'cancelada':
      case 'fechada':
        return '#6b7280';
      default: 
        return '#64748b';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'analisada':
        return 'Analisada';
      case 'processing':
      case 'em_analise':
      case 'em análise':
        return 'Em Análise';
      case 'pending':
      case 'pendente':
      case 'nova':
        return 'Pendente';
      case 'error':
      case 'erro':
        return 'Erro';
      case 'cancelled':
      case 'cancelada':
      case 'fechada':
        return 'Fechada';
      default: 
        return 'Pendente';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'analisada':
        return '✅';
      case 'processing':
      case 'em_analise':
      case 'em análise':
        return '⏳';
      case 'pending':
      case 'pendente':
      case 'nova':
        return '📋';
      case 'error':
      case 'erro':
        return '❌';
      case 'cancelled':
      case 'cancelada':
      case 'fechada':
        return '🚫';
      default: 
        return '📋';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPrazoInfo = (dataEnvio) => {
    const diasDesdeEnvio = Math.floor((new Date() - new Date(dataEnvio)) / (1000 * 60 * 60 * 24));
    const diasRestantes = 30 - diasDesdeEnvio;
    
    let corPrazo = '#10b981';
    let iconePrazo = '✅';
    let textoPrazo = `${diasDesdeEnvio} dias atrás`;
    
    if (diasRestantes <= 0) {
      corPrazo = '#dc2626';
      iconePrazo = '🚨';
      textoPrazo = `ATRASADO (${Math.abs(diasRestantes)} dias)`;
    } else if (diasRestantes <= 5) {
      corPrazo = '#ea580c';
      iconePrazo = '⚠️';
      textoPrazo = `URGENTE (${diasRestantes} dias restantes)`;
    } else if (diasRestantes <= 10) {
      corPrazo = '#f59e0b';
      iconePrazo = '⏰';
      textoPrazo = `${diasRestantes} dias restantes`;
    }
    
    return { corPrazo, iconePrazo, textoPrazo };
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        gap: '16px',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ color: '#64748b' }}>Carregando painel administrativo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        padding: '24px',
        margin: '20px',
        color: '#dc2626',
        textAlign: 'center',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Erro de Acesso</h3>
        <p style={{ marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={carregarCarteiras}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#1e293b',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              Painel Administrativo
            </h1>
            <p style={{
              color: '#64748b',
              margin: 0,
              fontSize: '16px'
            }}>
              Sistema inteligente de análise de carteiras com avaliação automática
            </p>
          </div>
          
          <button
            onClick={carregarCarteiras}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '32px', color: '#3b82f6', fontWeight: '800', marginBottom: '8px' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Total de Carteiras</div>
        </div>
        
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '32px', color: '#f59e0b', fontWeight: '800', marginBottom: '8px' }}>
            {carteirasPendentes.length}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Pendentes</div>
        </div>
        
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '32px', color: '#10b981', fontWeight: '800', marginBottom: '8px' }}>
            {carteirasAnalisadas.length}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Analisadas</div>
        </div>
        
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '32px', color: '#ef4444', fontWeight: '800', marginBottom: '8px' }}>
            {carteirasPendentes.filter(c => {
              const diasDesdeEnvio = Math.floor((new Date() - new Date(c.dataEnvio)) / (1000 * 60 * 60 * 24));
              return diasDesdeEnvio > 30;
            }).length}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Atrasadas</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex' }}>
            <button
              onClick={() => setCurrentTab(0)}
              style={{
                padding: '20px 32px',
                border: 'none',
                backgroundColor: currentTab === 0 ? '#ffffff' : 'transparent',
                color: currentTab === 0 ? '#1e293b' : '#64748b',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: currentTab === 0 ? '3px solid #3b82f6' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📋 Carteiras Pendentes ({carteirasPendentes.length})
            </button>
            <button
              onClick={() => setCurrentTab(1)}
              style={{
                padding: '20px 32px',
                border: 'none',
                backgroundColor: currentTab === 1 ? '#ffffff' : 'transparent',
                color: currentTab === 1 ? '#1e293b' : '#64748b',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: currentTab === 1 ? '3px solid #3b82f6' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ✅ Carteiras Analisadas ({carteirasAnalisadas.length})
            </button>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div style={{ padding: '24px' }}>
          {/* ABA PENDENTES */}
          {currentTab === 0 && (
            <>
              {carteirasPendentes.length === 0 ? (
                <div style={{
                  padding: '64px',
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>
                    Todas as carteiras foram analisadas!
                  </h3>
                  <p style={{ fontSize: '16px', margin: 0 }}>
                    Não há carteiras pendentes no momento
                  </p>
                </div>
              ) : (
                <div>
                  {carteirasPendentes.map((carteira) => {
                    // Processar dados estruturados
                    let dadosEstruturados = null;
                    let analise = null;
                    
                    try {
                      dadosEstruturados = carteira.dadosEstruturados && typeof carteira.dadosEstruturados === 'string' 
                        ? JSON.parse(carteira.dadosEstruturados) 
                        : carteira.dadosEstruturados;
                      
                      if (dadosEstruturados) {
                        analise = avaliarCarteira(dadosEstruturados);
                      }
                    } catch (error) {
                      console.error('Erro ao processar dados estruturados:', error);
                    }

                    return (
                      <div key={carteira.id} style={{
                        marginBottom: '24px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}>
                        {/* Header da Carteira Pendente */}
                        <div style={{
                          padding: '24px',
                          borderBottom: '1px solid #f1f5f9'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'start',
                            marginBottom: '20px',
                            flexWrap: 'wrap',
                            gap: '16px'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <h3 style={{
                                  fontSize: '20px',
                                  fontWeight: '700',
                                  color: '#1e293b',
                                  margin: 0
                                }}>
                                  {carteira.nomeArquivo}
                                </h3>
                                
                                {analise && (
                                  <>
                                    <div style={{
                                      padding: '4px 12px',
                                      borderRadius: '20px',
                                      backgroundColor: analise.avaliacaoGeral === 'MUITO BOM' ? '#dcfce7' : 
                                                      analise.avaliacaoGeral === 'BOM' ? '#dbeafe' : '#fef3c7',
                                      color: analise.avaliacaoGeral === 'MUITO BOM' ? '#166534' : 
                                             analise.avaliacaoGeral === 'BOM' ? '#1e40af' : '#92400e',
                                      fontSize: '12px',
                                      fontWeight: '600'
                                    }}>
                                      {analise.avaliacaoGeral}
                                    </div>
                                    
                                    <div style={{
                                      padding: '4px 12px',
                                      borderRadius: '20px',
                                      backgroundColor: '#f0f9ff',
                                      color: '#1e40af',
                                      fontSize: '12px',
                                      fontWeight: '600'
                                    }}>
                                      {analise.pontuacao}/{analise.pontuacaoMaxima}
                                    </div>

                                    <button
                                      onClick={() => setShowDetailedAnalysis(carteira)}
                                      style={{
                                        background: 'none',
                                        border: '1px solid #3b82f6',
                                        color: '#3b82f6',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                      }}
                                    >
                                      Ver Análise
                                    </button>
                                  </>
                                )}
                              </div>
                              
                              <div style={{
                                fontSize: '14px',
                                color: '#64748b',
                                marginBottom: '8px'
                              }}>
                                <strong>
                                  {carteira.cliente?.name || 
                                   (carteira.user ? `${carteira.user.firstName || ''} ${carteira.user.lastName || ''}`.trim() : '') || 
                                   'Cliente não informado'}
                                </strong>
                                {(carteira.cliente?.email || carteira.user?.email) && (
                                  <span style={{ marginLeft: '8px' }}>
                                    ({carteira.cliente?.email || carteira.user?.email})
                                  </span>
                                )}
                              </div>
                              
                              <div style={{
                                fontSize: '14px',
                                color: '#64748b'
                              }}>
                                Enviado em: {formatDate(carteira.dataEnvio)}
                              </div>
                              
                              {/* Indicador de prazo */}
                              {(() => {
                                const { corPrazo, iconePrazo, textoPrazo } = getPrazoInfo(carteira.dataEnvio);
                                return (
                                  <div style={{
                                    fontSize: '13px',
                                    color: corPrazo,
                                    fontWeight: '600',
                                    marginTop: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <span>{iconePrazo}</span>
                                    {textoPrazo}
                                    <span style={{ 
                                      fontSize: '11px', 
                                      color: '#9ca3af',
                                      fontWeight: '400'
                                    }}>
                                      (prazo: 30 dias)
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>

                            <div style={{
                              padding: '8px 16px',
                              borderRadius: '24px',
                              backgroundColor: getStatusColor(carteira.status),
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span>{getStatusIcon(carteira.status)}</span>
                              {getStatusText(carteira.status)}
                            </div>
                          </div>

                          {/* Mini Dashboard se tiver análise */}
                          {analise && (
                            <div style={{
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '20px',
                              marginBottom: '20px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '16px' }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                                    {Math.round(analise.metricas.qualidade)}%
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>Qualidade</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                                    {Math.round(analise.metricas.diversificacao)}%
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>Diversificação</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
                                    {Math.round(analise.metricas.adaptacao)}%
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>Adaptação</div>
                                </div>
                              </div>

                              {/* Alertas principais */}
                              {analise.alertas.length > 0 && (
                                <div style={{
                                  backgroundColor: '#fef3c7',
                                  border: '1px solid #f59e0b',
                                  borderRadius: '8px',
                                  padding: '12px'
                                }}>
                                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
                                    Principais Alertas:
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#78350f' }}>
                                    {analise.alertas.slice(0, 2).map((alerta, idx) => (
                                      <div key={idx}>• {alerta}</div>
                                    ))}
                                    {analise.alertas.length > 2 && (
                                      <div>• E mais {analise.alertas.length - 2} alertas...</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Dados da Carteira */}
                          {dadosEstruturados ? (
                            <div>
                              {(() => {
                                const categorias = [
                                  { key: 'acoes', nome: 'Ações', emoji: '📈', cor: '#10b981' },
                                  { key: 'fiis', nome: 'FIIs', emoji: '🏘️', cor: '#3b82f6' },
                                  { key: 'rendaFixa', nome: 'Renda Fixa', emoji: '💰', cor: '#8b5cf6' },
                                  { key: 'exterior', nome: 'Exterior', emoji: '🌎', cor: '#f59e0b' },
                                  { key: 'cripto', nome: 'Cripto', emoji: '₿', cor: '#ef4444' },
                                  { key: 'reserva', nome: 'Reserva', emoji: '🏦', cor: '#6b7280' }
                                ];

                                const categoriasComDados = categorias.filter(cat => 
                                  dadosEstruturados[cat.key] && dadosEstruturados[cat.key].length > 0
                                );

                                let valorTotalCalculado = 0;
                                categoriasComDados.forEach(cat => {
                                  const itens = dadosEstruturados[cat.key] || [];
                                  itens.forEach(item => {
                                    if (cat.key === 'reserva') return;
                                    valorTotalCalculado += item.valorAtual || item.valorInvestido || item.valor || 0;
                                  });
                                });

                                return (
                                  <div style={{ marginBottom: '20px' }}>
                                    <div style={{
                                      backgroundColor: '#f0f9ff',
                                      border: '2px solid #3b82f6',
                                      borderRadius: '12px',
                                      padding: '20px',
                                      marginBottom: '16px',
                                      textAlign: 'center'
                                    }}>
                                      <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '8px', fontWeight: '600' }}>
                                        VALOR TOTAL DA CARTEIRA
                                      </div>
                                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e40af' }}>
                                        R$ {valorTotalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </div>
                                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                        {analise?.totalAtivos || categoriasComDados.reduce((total, cat) => total + (dadosEstruturados[cat.key]?.length || 0), 0)} ativos em {categoriasComDados.length} categorias
                                      </div>
                                    </div>

                                    <div style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                      gap: '12px'
                                    }}>
                                      {categoriasComDados.map(categoria => {
                                        const itens = dadosEstruturados[categoria.key] || [];
                                        let valorCategoria = 0;
                                        let quantidadeAtivos = itens.length;

                                        itens.forEach(item => {
                                          if (categoria.key === 'reserva') {
                                            valorCategoria += item.valor || 0;
                                          } else {
                                            valorCategoria += item.valorAtual || item.valorInvestido || item.valor || 0;
                                          }
                                        });

                                        const percentual = categoria.key === 'reserva' 
                                          ? 0
                                          : valorTotalCalculado > 0 ? (valorCategoria / valorTotalCalculado) * 100 : 0;

                                        return (
                                          <div key={categoria.key} style={{
                                            backgroundColor: '#ffffff',
                                            border: `1px solid ${categoria.cor}20`,
                                            borderLeft: `4px solid ${categoria.cor}`,
                                            borderRadius: '8px',
                                            padding: '16px'
                                          }}>
                                            <div style={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: '8px',
                                              marginBottom: '8px'
                                            }}>
                                              <span style={{ fontSize: '16px' }}>{categoria.emoji}</span>
                                              <div style={{ 
                                                fontSize: '13px', 
                                                color: '#64748b', 
                                                fontWeight: '600',
                                                textTransform: 'uppercase'
                                              }}>
                                                {categoria.nome}
                                              </div>
                                            </div>
                                            
                                            <div style={{ fontSize: '16px', fontWeight: '700', color: categoria.cor, marginBottom: '4px' }}>
                                              {categoria.key === 'exterior' ? 
                                                `US$ ${(valorCategoria / 5.5).toLocaleString('en-US', { minimumFractionDigits: 2 })}` :
                                                `R$ ${valorCategoria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                              }
                                            </div>
                                            
                                            <div style={{ 
                                              display: 'flex', 
                                              justifyContent: 'space-between', 
                                              alignItems: 'center',
                                              fontSize: '12px', 
                                              color: '#64748b' 
                                            }}>
                                              <span>{quantidadeAtivos} {quantidadeAtivos === 1 ? 'ativo' : 'ativos'}</span>
                                              {categoria.key !== 'reserva' && (
                                                <span style={{ fontWeight: '600' }}>
                                                  {percentual.toFixed(1)}%
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}

                              {renderResumoAtivosTabela(carteira.id, dadosEstruturados)}
                            </div>
                          ) : (
                            // Fallback para carteiras antigas
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                              gap: '16px',
                              marginBottom: '20px'
                            }}>
                              <div style={{
                                backgroundColor: '#f8fafc',
                                padding: '16px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                              }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                                  VALOR TOTAL
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                                  {carteira.valorTotal ? 
                                    `R$ ${carteira.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                                    : 'N/A'
                                  }
                                </div>
                              </div>

                              <div style={{
                                backgroundColor: '#f8fafc',
                                padding: '16px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                              }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                                  ATIVOS
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
                                  {carteira.quantidadeAtivos || 'N/A'}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Questionário se existir */}
                          {carteira.questionario && (
                            <div style={{
                              backgroundColor: '#f0f9ff',
                              border: '1px solid #3b82f6',
                              borderRadius: '12px',
                              padding: '20px',
                              marginBottom: '20px'
                            }}>
                              <h4 style={{
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#1e40af',
                                margin: '0 0 16px 0'
                              }}>
                                Questionário do Cliente
                              </h4>
                              
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '12px',
                                fontSize: '14px'
                              }}>
                                {(() => {
                                  try {
                                    const questionarioData = typeof carteira.questionario === 'string' 
                                      ? JSON.parse(carteira.questionario) 
                                      : carteira.questionario;
                                      
                                    return Object.entries(questionarioData).slice(0, 4).map(([key, value], index) => (
                                      <div key={index} style={{
                                        backgroundColor: '#ffffff',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0'
                                      }}>
                                        <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                        </div>
                                        <div style={{ color: '#64748b' }}>
                                          {typeof value === 'string' && value.length > 80 ? 
                                            value.substring(0, 80) + '...' : 
                                            String(value)
                                          }
                                        </div>
                                      </div>
                                    ));
                                  } catch (error) {
                                    return (
                                      <div style={{ 
                                        color: '#ef4444', 
                                        fontSize: '14px',
                                        padding: '12px',
                                        backgroundColor: '#fee2e2',
                                        borderRadius: '6px'
                                      }}>
                                        Erro ao carregar questionário
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          )}

                          {/* Botões de Análise */}
                          {editando === carteira.id && showAdvancedFeedback ? (
                            <EnhancedAdminFeedback
                              carteira={carteira}
                              onSave={salvarAnalise}
                              onCancel={() => {
                                setEditando(null);
                                setShowAdvancedFeedback(false);
                              }}
                            />
                          ) : editando === carteira.id ? (
                            <div style={{
                              backgroundColor: '#fefce8',
                              border: '2px solid #fbbf24',
                              borderRadius: '12px',
                              padding: '24px'
                            }}>
                              <h4 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#92400e',
                                margin: '0 0 20px 0'
                              }}>
                                Análise Simples
                              </h4>

                              <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                  display: 'block',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  marginBottom: '6px',
                                  color: '#374151'
                                }}>
                                  Pontuação (0-10):
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={pontuacao}
                                  onChange={(e) => setPontuacao(e.target.value)}
                                  style={{
                                    width: '120px',
                                    padding: '10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                  }}
                                />
                              </div>

                              <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                  display: 'block',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  marginBottom: '6px',
                                  color: '#374151'
                                }}>
                                  Feedback da Análise:
                                </label>
                                <textarea
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  placeholder="Escreva sua análise detalhada da carteira..."
                                  rows={5}
                                  style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </div>

                              <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                  display: 'block',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  marginBottom: '6px',
                                  color: '#374151'
                                }}>
                                  Recomendações (uma por linha):
                                </label>
                                <textarea
                                  value={recomendacoes}
                                  onChange={(e) => setRecomendacoes(e.target.value)}
                                  placeholder="Digite cada recomendação em uma linha separada..."
                                  rows={4}
                                  style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </div>

                              <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                  onClick={() => salvarAnaliseSimples(carteira.id)}
                                  style={{
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    padding: '12px 24px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Salvar Análise
                                </button>
                                
                                <button
                                  onClick={() => setEditando(null)}
                                  style={{
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    padding: '12px 24px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => {
                                  setEditando(carteira.id);
                                  setShowAdvancedFeedback(true);
                                }}
                                style={{
                                  backgroundColor: '#3b82f6',
                                  color: 'white',
                                  padding: '12px 24px',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Nova Análise Avançada
                              </button>
                              
                              <button
                                onClick={() => iniciarEdicao(carteira)}
                                style={{
                                  backgroundColor: '#6b7280',
                                  color: 'white',
                                  padding: '12px 24px',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Análise Simples
                              </button>

                              <button
                                onClick={() => handleDeleteCarteira(
                                  carteira.id, 
                                  carteira.cliente?.name || 
                                  (carteira.user ? `${carteira.user.firstName || ''} ${carteira.user.lastName || ''}`.trim() : '') || 
                                  'Cliente não informado'
                                )}
                                style={{
                                  backgroundColor: '#dc2626',
                                  color: 'white',
                                  padding: '12px 24px',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Deletar Carteira
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ABA ANALISADAS */}
          {currentTab === 1 && (
            <>
              {carteirasAnalisadas.length === 0 ? (
                <div style={{
                  padding: '64px',
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '24px' }}>📊</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>
                    Nenhuma carteira analisada ainda
                  </h3>
                  <p style={{ fontSize: '16px', margin: 0 }}>
                    As carteiras analisadas aparecerão aqui
                  </p>
                </div>
              ) : (
                <div>
                  {carteirasAnalisadas.map((carteira) => (
                    <div key={carteira.id} style={{
                      marginBottom: '16px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      {/* Header Compacto - Clicável */}
                      <div 
                        onClick={() => toggleExpandedAnalysed(carteira.id)}
                        style={{
                          padding: '20px 24px',
                          cursor: 'pointer',
                          borderBottom: expandedAnalysed.has(carteira.id) ? '1px solid #f1f5f9' : 'none',
                          backgroundColor: expandedAnalysed.has(carteira.id) ? '#f8fafc' : '#ffffff',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '16px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              marginBottom: '8px'
                            }}>
                              <h4 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#1e293b',
                                margin: 0
                              }}>
                                {carteira.nomeArquivo}
                              </h4>
                              
                              <div style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                backgroundColor: getStatusColor(carteira.status),
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                {getStatusText(carteira.status)}
                              </div>

                              {carteira.pontuacao && (
                                <div style={{
                                  padding: '4px 12px',
                                  borderRadius: '20px',
                                  backgroundColor: '#f0f9ff',
                                  color: '#1e40af',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {carteira.pontuacao.toFixed(1)}/10
                                </div>
                              )}
                            </div>
                            
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              fontSize: '14px',
                              color: '#64748b'
                            }}>
                              <span>
                                <strong>
                                  {carteira.cliente?.name || 
                                   (carteira.user ? `${carteira.user.firstName || ''} ${carteira.user.lastName || ''}`.trim() : '') || 
                                   'Cliente não informado'}
                                </strong>
                              </span>
                              <span>•</span>
                              <span>Analisada em: {formatDate(carteira.dataAnalise || carteira.updatedAt)}</span>
                              {(() => {
                                // Tentar calcular valor com dados estruturados
                                let dadosEstruturados = null;
                                try {
                                  dadosEstruturados = carteira.dadosEstruturados && typeof carteira.dadosEstruturados === 'string' 
                                    ? JSON.parse(carteira.dadosEstruturados) 
                                    : carteira.dadosEstruturados;
                                } catch (error) {
                                  console.error('Erro ao parsear dados estruturados na listagem:', error);
                                }

                                if (dadosEstruturados && (dadosEstruturados.acoes || dadosEstruturados.fiis)) {
                                  let valorTotal = 0;
                                  let totalAtivos = 0;
                                  
                                  ['acoes', 'fiis', 'rendaFixa', 'exterior', 'cripto'].forEach(categoria => {
                                    const itens = dadosEstruturados[categoria] || [];
                                    itens.forEach(item => {
                                      valorTotal += item.valorAtual || item.valorInvestido || item.valor || 0;
                                    });
                                    totalAtivos += itens.length;
                                  });

                                  return (
                                    <>
                                      <span>•</span>
                                      <span>R$ {valorTotal.toLocaleString('pt-BR')} ({totalAtivos} ativos)</span>
                                    </>
                                  );
                                } else if (carteira.valorTotal) {
                                  return (
                                    <>
                                      <span>•</span>
                                      <span>R$ {carteira.valorTotal.toLocaleString('pt-BR')}</span>
                                    </>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>

                          <div style={{
                            fontSize: '20px',
                            color: '#9ca3af',
                            transform: expandedAnalysed.has(carteira.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}>
                            ▼
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo Expandido */}
                      {expandedAnalysed.has(carteira.id) && (
                        <div style={{ padding: '24px' }}>
                          {/* Análise Existente */}
                          {carteira.feedback && (
                            <div style={{
                              backgroundColor: '#f0fdf4',
                              border: '2px solid #bbf7d0',
                              borderRadius: '12px',
                              padding: '20px',
                              marginBottom: '20px'
                            }}>
                              <h4 style={{
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#065f46',
                                margin: '0 0 12px 0'
                              }}>
                                Análise Realizada
                              </h4>
                              <p style={{
                                fontSize: '14px',
                                color: '#374151',
                                margin: '0 0 12px 0',
                                lineHeight: '1.6'
                              }}>
                                {carteira.feedback}
                              </p>
                              
                              {carteira.recomendacoes && carteira.recomendacoes.length > 0 && (
                                <div>
                                  <strong style={{ fontSize: '14px', color: '#065f46', display: 'block', marginBottom: '8px' }}>
                                    Recomendações:
                                  </strong>
                                  <ul style={{
                                    fontSize: '14px',
                                    color: '#374151',
                                    margin: '0',
                                    paddingLeft: '20px'
                                  }}>
                                    {carteira.recomendacoes.map((rec, recIndex) => (
                                      <li key={recIndex} style={{ marginBottom: '4px' }}>{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {(() => {
                            try {
                              const dadosEstruturados = carteira.dadosEstruturados && typeof carteira.dadosEstruturados === 'string'
                                ? JSON.parse(carteira.dadosEstruturados)
                                : carteira.dadosEstruturados;

                              return renderResumoAtivosTabela(carteira.id, dadosEstruturados);
                            } catch (error) {
                              console.error('Erro ao processar dados estruturados da carteira analisada:', error);
                              return null;
                            }
                          })()}

                          {/* Questionário se existir */}
                          {carteira.questionario && (
                            <div style={{
                              backgroundColor: '#f0f9ff',
                              border: '1px solid #3b82f6',
                              borderRadius: '12px',
                              padding: '20px',
                              marginBottom: '20px'
                            }}>
                              <h4 style={{
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#1e40af',
                                margin: '0 0 16px 0'
                              }}>
                                Questionário do Cliente
                              </h4>
                              
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '12px',
                                fontSize: '14px'
                              }}>
                                {(() => {
                                  try {
                                    const questionarioData = typeof carteira.questionario === 'string' 
                                      ? JSON.parse(carteira.questionario) 
                                      : carteira.questionario;
                                      
                                    return Object.entries(questionarioData).map(([key, value], index) => (
                                      <div key={index} style={{
                                        backgroundColor: '#ffffff',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0'
                                      }}>
                                        <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                        </div>
                                        <div style={{ color: '#64748b' }}>
                                          {String(value)}
                                        </div>
                                      </div>
                                    ));
                                  } catch (error) {
                                    return (
                                      <div style={{ 
                                        color: '#ef4444', 
                                        fontSize: '14px',
                                        padding: '12px',
                                        backgroundColor: '#fee2e2',
                                        borderRadius: '6px'
                                      }}>
                                        Erro ao carregar questionário
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          )}

                          {/* Botões de Ação para Carteiras Analisadas */}
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => {
                                setEditando(carteira.id);
                                setShowAdvancedFeedback(true);
                              }}
                              style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              Editar Análise
                            </button>
                            
                            <button
                              onClick={() => handleDeleteCarteira(
                                carteira.id, 
                                carteira.cliente?.name || 
                                (carteira.user ? `${carteira.user.firstName || ''} ${carteira.user.lastName || ''}`.trim() : '') || 
                                'Cliente não informado'
                              )}
                              style={{
                                backgroundColor: '#dc2626',
                                color: 'white',
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              Deletar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Análise Detalhada */}
      {showDetailedAnalysis && (
        <DetailedAnalysisModal
          carteira={showDetailedAnalysis}
          analise={(() => {
            try {
              const dadosEstruturados = showDetailedAnalysis.dadosEstruturados && typeof showDetailedAnalysis.dadosEstruturados === 'string' 
                ? JSON.parse(showDetailedAnalysis.dadosEstruturados) 
                : showDetailedAnalysis.dadosEstruturados;
              return dadosEstruturados ? avaliarCarteira(dadosEstruturados) : null;
            } catch (error) {
              return null;
            }
          })()}
          onClose={() => setShowDetailedAnalysis(null)}
        />
      )}
    </div>
  );
}