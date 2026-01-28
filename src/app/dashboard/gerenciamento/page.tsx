'use client';

import React, { useState } from 'react';
import { useDataStore } from '../../../hooks/useDataStore';
import { useUser } from '@/hooks/use-user'; // 🔥 IMPORTAR HOOK DE USUÁRIO

export default function GerenciamentoPage() {
  // 🔒 VERIFICAÇÃO DE ADMIN LOGO NO INÍCIO
  const { user } = useUser();
  
  // 🚫 BLOQUEAR ACESSO SE NÃO FOR ADMIN
  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>⏳</div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 16px 0'
          }}>
            Verificando Autenticação...
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: '16px',
            margin: '0'
          }}>
            Aguarde enquanto verificamos suas credenciais.
          </p>
        </div>
      </div>
    );
  }

  if (user.plan !== 'ADMIN') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          border: '2px solid #ef4444',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🚫</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#dc2626',
            margin: '0 0 16px 0'
          }}>
            Acesso Negado
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: '16px',
            margin: '0 0 24px 0',
            lineHeight: '1.6'
          }}>
            Esta página é restrita a <strong>administradores</strong>.<br/>
            Seu plano atual: <span style={{ 
              color: '#dc2626', 
              fontWeight: '600',
              backgroundColor: '#fee2e2',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>{user.plan}</span>
          </p>
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#991b1b',
              margin: '0 0 8px 0'
            }}>
              📋 Informações da Conta:
            </h3>
            <div style={{ fontSize: '12px', color: '#7f1d1d', textAlign: 'left' }}>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Nome:</strong> {user.firstName} {user.lastName}</div>
              <div><strong>Plano:</strong> {user.plan}</div>
              <div><strong>Status:</strong> {user.status}</div>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            🏠 Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 🔥 SE CHEGOU ATÉ AQUI, É ADMIN - CARREGAR INTERFACE NORMAL
  const { 
    dados, 
    CARTEIRAS_CONFIG, 
    adicionarAtivo, 
    editarAtivo, 
    removerAtivo,
    reordenarAtivos,
    atualizarViesOverride,
    obterEstatisticas,
    setDados
  } = useDataStore({ autoLoad: true });
  
  const [carteiraAtiva, setCarteiraAtiva] = useState('smallCaps');
  const [modoEdicao, setModoEdicao] = useState(null);
  
  // 🔥 ESTADOS PARA IMPORTAÇÃO CSV
  const [modoImportacao, setModoImportacao] = useState(false);
  const [arquivoCSV, setArquivoCSV] = useState(null);
  const [dadosCSV, setDadosCSV] = useState([]);
  const [previewCSV, setPreviewCSV] = useState([]);
  const [relatorioImportacao, setRelatorioImportacao] = useState(null);

  const [viesOverridesEmProcesso, setViesOverridesEmProcesso] = useState<Record<string, boolean>>({});
  
  // 🔥 NOVO ESTADO PARA CONTROLAR MOEDA DO PREÇO TETO
  const [moedaPrecoTeto, setMoedaPrecoTeto] = useState('BRL');
  
  const [formData, setFormData] = useState({
    ticker: '',
    setor: '',
    dataEntrada: '',
    precoEntrada: '',
    precoTeto: '',
    precoTetoBDR: '',
    dataSaida: '',
    precoSaida: '',
    motivoEncerramento: ''
  });

  const handleAtualizarViesManual = async (
    ativoId: string,
    ticker: string,
    novoValor: string
  ) => {
    const valorNormalizado = (novoValor === 'MANTER' ? 'MANTER' : 'AUTO') as 'AUTO' | 'MANTER';

    setViesOverridesEmProcesso(prev => ({ ...prev, [ativoId]: true }));

    try {
      await atualizarViesOverride({
        carteira: carteiraAtiva,
        ticker,
        viesOverride: valorNormalizado
      });
    } catch (error) {
      console.error('Erro ao atualizar viés manual:', error);
    } finally {
      setViesOverridesEmProcesso(prev => ({ ...prev, [ativoId]: false }));
    }
  };

  const carteiraConfig = CARTEIRAS_CONFIG[carteiraAtiva];
  const ativos = dados[carteiraAtiva] || [];
  const estatisticas = obterEstatisticas();
  
  // 📊 SEPARAR ATIVOS ATIVOS E ENCERRADOS
  const ativosAtivos = ativos.filter((ativo) => !ativo.posicaoEncerrada);
  const ativosEncerrados = ativos.filter((ativo) => ativo.posicaoEncerrada);
  
  // 🔥 VERIFICAR SE É CARTEIRA INTERNACIONAL
  const isCarteiraInternacional = ['dividendosInternacional', 'etfs', 'projetoAmerica', 'exteriorStocks'].includes(carteiraAtiva);
  
  // Verificar se a carteira atual tem preço teto E não é ETF
  const temPrecoTeto = carteiraConfig.campos.includes('precoTeto') && carteiraAtiva !== 'etfs';
  
  // Para o Projeto América, verificar se o setor não é ETF
  const mostraPrecoTeto = carteiraAtiva === 'projetoAmerica' 
    ? formData.setor !== 'ETF' && formData.setor !== ''
    : temPrecoTeto;

  // 📄 FUNÇÕES PARA IMPORTAÇÃO CSV
  const gerarTemplateCSV = () => {
    const headers = ['ticker', 'setor', 'dataEntrada', 'precoEntrada'];
    
    // Adicionar colunas específicas baseadas na carteira
    if (temPrecoTeto) {
      headers.push('precoTeto');
      if (isCarteiraInternacional) {
        headers.push('precoTetoBDR');
      }
    }
    
    // Exemplos em ambos os formatos (internacional e brasileiro)
    const exemploInternacional = {
      ticker: 'PETR4',
      setor: 'Petróleo',
      dataEntrada: '15/01/2024',
      precoEntrada: '35.50'
    };
    
    const exemploBrasileiro = {
      ticker: 'VALE3',
      setor: 'Mineração',
      dataEntrada: '20/01/2024',
      precoEntrada: 'R$ 65,80'
    };
    
    if (temPrecoTeto) {
      exemploInternacional.precoTeto = carteiraConfig.moeda === 'USD' ? '45.00' : '42.00';
      exemploBrasileiro.precoTeto = carteiraConfig.moeda === 'USD' ? 'R$ 75.00' : 'R$ 75,00';
      
      if (isCarteiraInternacional) {
        exemploInternacional.precoTetoBDR = '245.00';
        exemploBrasileiro.precoTetoBDR = 'R$ 390,00';
      }
    }
    
    const csvContent = [
      headers.join(','),
      '# Formato Internacional (recomendado)',
      headers.map(h => exemploInternacional[h] || '').join(','),
      '# Formato Brasileiro (também aceito)',
      headers.map(h => exemploBrasileiro[h] || '').join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_${carteiraAtiva}.csv`;
    link.click();
  };

  const processarArquivoCSV = async (arquivo) => {
    if (!arquivo) return;

    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      let text = e.target.result;
      
      console.log('📄 PROCESSANDO CSV - Formato original detectado...');
      
      // 🔧 CORREÇÕES AUTOMÁTICAS PARA FORMATO BRASILEIRO
      
      // 1. Detectar se usa ponto e vírgula como separador
      const primeiraLinha = text.split('\n')[0];
      const usaPontoVirgula = primeiraLinha.includes(';') && !primeiraLinha.includes(',');
      
      if (usaPontoVirgula) {
        console.log('🔧 Detectado separador ";" - convertendo para ","');
        text = text.replace(/;/g, ',');
      }
      
      // 2. Corrigir formato brasileiro de preços (R$ X,XX → X.XX)
      const temFormatoBrasileiro = text.includes('R$');
      
      if (temFormatoBrasileiro) {
        console.log('🔧 Detectado formato "R$ X,XX" - convertendo para "X.XX"');
        text = text.replace(/R\$ ?(\d+),(\d+)/g, '$1.$2');
        text = text.replace(/R\$ ?(\d+)/g, '$1');
      }
      
      // 3. Limpar caracteres especiais de encoding
      text = text.replace(/ /g, 'í').replace(/ç/g, 'ç').replace(/ã/g, 'ã');
      
      console.log('✅ CSV corrigido para formato padrão');
      
      // Parse usando JavaScript nativo (sem dependências externas) com suporte a CSV complexo
      const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];
          
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i++; // Skip next quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        result.push(current.trim());
        return result;
      };
      
      const linhas = text.split('\n').filter(linha => linha.trim() !== '');
      
      if (linhas.length < 2) {
        console.log('❌ Arquivo CSV deve ter pelo menos 2 linhas (header + dados)');
        setPreviewCSV({ validos: [], erros: [{ linha: 1, dados: {}, erros: ['Arquivo CSV inválido'] }] });
        return;
      }
      
      // Extrair headers usando parser robusto
      const headers = parseCSVLine(linhas[0]).map(h => h.replace(/"/g, ''));
      console.log('📄 Headers encontrados:', headers);
      
      // Verificar se os headers obrigatórios existem
      const headersObrigatorios = ['ticker', 'setor', 'dataEntrada', 'precoEntrada'];
      const headersFaltando = headersObrigatorios.filter(h => !headers.includes(h));
      
      if (headersFaltando.length > 0) {
        console.log('❌ Headers obrigatórios faltando:', headersFaltando);
        setPreviewCSV({ 
          validos: [], 
          erros: [{ 
            linha: 1, 
            dados: {}, 
            erros: [`Headers obrigatórios faltando: ${headersFaltando.join(', ')}`] 
          }] 
        });
        return;
      }
      
      console.log('📄 Linhas de dados:', linhas.length - 1);
      
      const dados = [];
      const erros = [];
      
      // Processar cada linha de dados (pular header)
      linhas.slice(1).forEach((linha, index) => {
        // Pular linhas que começam com # (comentários)
        if (linha.trim().startsWith('#')) return;
        
        const valores = parseCSVLine(linha).map(v => v.replace(/"/g, ''));
        
        // Criar objeto da linha
        const objetoLinha = {};
        headers.forEach((header, i) => {
          objetoLinha[header] = valores[i] || '';
        });
        
        console.log(`📋 Processando linha ${index + 2}:`, objetoLinha);
        // Validação básica
        const errosLinha = [];
        
        if (!objetoLinha.ticker || objetoLinha.ticker.toString().trim() === '') {
          errosLinha.push('Ticker obrigatório');
        }
        if (!objetoLinha.setor || objetoLinha.setor.toString().trim() === '') {
          errosLinha.push('Setor obrigatório');
        }
        if (!objetoLinha.dataEntrada || objetoLinha.dataEntrada.toString().trim() === '') {
          errosLinha.push('Data entrada obrigatória');
        }
        
        // Validar preço entrada
        const precoEntrada = parseFloat(objetoLinha.precoEntrada);
        if (!objetoLinha.precoEntrada || isNaN(precoEntrada) || precoEntrada <= 0) {
          errosLinha.push('Preço entrada deve ser um número válido > 0');
        }
        
        // Validar preço teto se existir
        let precoTeto = undefined;
        if (objetoLinha.precoTeto && objetoLinha.precoTeto.trim() !== '') {
          precoTeto = parseFloat(objetoLinha.precoTeto);
          if (isNaN(precoTeto)) {
            errosLinha.push('Preço teto deve ser um número válido');
          }
        }
        
        // Validar preço teto BDR se existir
        let precoTetoBDR = undefined;
        if (objetoLinha.precoTetoBDR && objetoLinha.precoTetoBDR.trim() !== '') {
          precoTetoBDR = parseFloat(objetoLinha.precoTetoBDR);
          if (isNaN(precoTetoBDR)) {
            errosLinha.push('Preço teto BDR deve ser um número válido');
          }
        }
        
        if (errosLinha.length > 0) {
          erros.push({
            linha: index + 2, // +2 porque index é 0-based e pulamos header
            dados: objetoLinha,
            erros: errosLinha
          });
        } else {
          dados.push({
            ticker: objetoLinha.ticker.toString().trim().toUpperCase(),
            setor: objetoLinha.setor.toString().trim(),
            dataEntrada: objetoLinha.dataEntrada.toString().trim(),
            precoEntrada: precoEntrada,
            precoTeto: precoTeto,
            precoTetoBDR: precoTetoBDR
          });
        }
      });
      
      console.log('✅ Dados válidos processados:', dados.length);
      console.log('❌ Erros encontrados:', erros.length);
      
      setDadosCSV(dados);
      setPreviewCSV({ validos: dados, erros });
    };
    
    fileReader.readAsText(arquivo, 'UTF-8');
  };

  const confirmarImportacao = () => {
    if (dadosCSV.length === 0) {
      alert('Nenhum dado válido para importar!');
      return;
    }

    const sucessos = [];
    const falhas = [];

    dadosCSV.forEach((dadosAtivo, index) => {
      try {
        const novoAtivo = adicionarAtivo(carteiraAtiva, {
          ticker: dadosAtivo.ticker.toUpperCase(),
          setor: dadosAtivo.setor,
          dataEntrada: dadosAtivo.dataEntrada,
          precoEntrada: dadosAtivo.precoEntrada,
          precoTeto: dadosAtivo.precoTeto,
          precoTetoBDR: dadosAtivo.precoTetoBDR
        });
        
        sucessos.push({
          ticker: dadosAtivo.ticker.toUpperCase(),
          linha: index + 2
        });
      } catch (error) {
        falhas.push({
          ticker: dadosAtivo.ticker,
          linha: index + 2,
          erro: error.message
        });
      }
    });

    setRelatorioImportacao({
      total: dadosCSV.length,
      sucessos: sucessos.length,
      falhas: falhas.length,
      detalhes: { sucessos, falhas }
    });

    console.log('📊 IMPORTAÇÃO CONCLUÍDA:', {
      sucessos: sucessos.length,
      falhas: falhas.length
    });
  };

  const fecharImportacao = () => {
    setModoImportacao(false);
    setArquivoCSV(null);
    setDadosCSV([]);
    setPreviewCSV([]);
    setRelatorioImportacao(null);
  };

  // 🔥 FUNÇÃO PARA ATUALIZAR PREÇO TETO BDR EM LOTE
  const atualizarPrecoTetoBDRLote = async () => {
    if (!isCarteiraInternacional) return;
    
    const cotacaoUSD = 5.85; // Valor exemplo - você pode buscar de uma API
    const ativosParaAtualizar = ativosAtivos.filter(ativo => 
      ativo.precoTeto && !ativo.precoTetoBDR
    );
    
    if (ativosParaAtualizar.length === 0) {
      alert('Nenhum ativo com preço teto em USD encontrado para conversão.');
      return;
    }
    
    const confirmacao = confirm(
      `Deseja converter ${ativosParaAtualizar.length} preços teto de USD para BRL?\n` +
      `Cotação usada: $1 = R$ ${cotacaoUSD.toFixed(2)}\n\n` +
      `Ativos: ${ativosParaAtualizar.map(a => a.ticker).join(', ')}\n\n` +
      `⚠️ ATENÇÃO: Isso não vai apagar o preço USD, apenas adicionar o BDR!`
    );
    
    if (!confirmacao) return;
    
    ativosParaAtualizar.forEach(ativo => {
      const precoTetoBRL = ativo.precoTeto * cotacaoUSD;
      editarAtivo(carteiraAtiva, ativo.id, {
        ...ativo,
        precoTetoBDR: parseFloat(precoTetoBRL.toFixed(2)) // Manter o USD também
      });
    });
    
    alert(`✅ ${ativosParaAtualizar.length} preços teto convertidos para BRL!\n🔄 Agora você tem ambos os valores: USD e BDR.`);
  };

  // 🎯 HANDLER PARA FORMULÁRIO
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const iniciarAdicao = () => {
    setFormData({
      ticker: '',
      setor: '',
      dataEntrada: '',
      precoEntrada: '',
      precoTeto: '',
      precoTetoBDR: '',
      dataSaida: '',
      precoSaida: '',
      motivoEncerramento: ''
    });
    
    // 🔥 DEFINIR MOEDA PADRÃO BASEADA NA CARTEIRA
    setMoedaPrecoTeto(isCarteiraInternacional ? 'USD' : 'BRL');
    setModoEdicao({ tipo: 'adicionar', ativo: null });
  };

  const iniciarEdicao = (ativo) => {
    setFormData({
      ticker: ativo.ticker,
      setor: ativo.setor,
      dataEntrada: ativo.dataEntrada,
      precoEntrada: ativo.precoEntrada.toString(),
      precoTeto: ativo.precoTeto ? ativo.precoTeto.toString() : '',
      precoTetoBDR: ativo.precoTetoBDR ? ativo.precoTetoBDR.toString() : '',
      dataSaida: ativo.dataSaida || '',
      precoSaida: ativo.precoSaida ? ativo.precoSaida.toString() : '',
      motivoEncerramento: ativo.motivoEncerramento || ''
    });
    
    // 🔥 DETECTAR MOEDA BASEADA NOS CAMPOS EXISTENTES
    if (ativo.precoTetoBDR) {
      setMoedaPrecoTeto('BRL');
    } else {
      setMoedaPrecoTeto(isCarteiraInternacional ? 'USD' : 'BRL');
    }
    
    setModoEdicao({ tipo: 'editar', ativo });
  };

  // 🔥 NOVA FUNÇÃO PARA ENCERRAR POSIÇÃO
  const iniciarEncerramento = (ativo) => {
    setFormData({
      ticker: ativo.ticker,
      setor: ativo.setor,
      dataEntrada: ativo.dataEntrada,
      precoEntrada: ativo.precoEntrada.toString(),
      precoTeto: ativo.precoTeto ? ativo.precoTeto.toString() : '',
      precoTetoBDR: ativo.precoTetoBDR ? ativo.precoTetoBDR.toString() : '',
      dataSaida: '',
      precoSaida: '',
      motivoEncerramento: ''
    });
    setModoEdicao({ tipo: 'encerrar', ativo });
  };

  // 🔥 NOVA FUNÇÃO PARA REATIVAR POSIÇÃO
  const reativarPosicao = (ativo) => {
    if (confirm(`Tem certeza que deseja reativar a posição ${ativo.ticker}?`)) {
      const dadosAtualizados = {
        ...ativo,
        posicaoEncerrada: false,
        dataSaida: undefined,
        precoSaida: undefined,
        motivoEncerramento: undefined
      };
      
      editarAtivo(carteiraAtiva, ativo.id, dadosAtualizados);
      console.log('🔄 POSIÇÃO REATIVADA:', ativo.ticker);
    }
  };

  const salvarAtivo = () => {
    if (!formData.ticker || !formData.setor || !formData.dataEntrada || !formData.precoEntrada) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    // 🔥 VALIDAÇÃO PARA ENCERRAMENTO DE POSIÇÃO
    if (modoEdicao?.tipo === 'encerrar') {
      if (!formData.dataSaida || !formData.precoSaida || !formData.motivoEncerramento) {
        alert('Para encerrar a posição, preencha: Data de Saída, Preço de Saída e Motivo!');
        return;
      }
    }

    // 🔥 PREPARAR DADOS DO PREÇO TETO BASEADO NA MOEDA SELECIONADA
    type CampoPrecoTeto = 'precoTeto' | 'precoTetoBDR';

    const dadosPrecoTeto: Partial<Record<CampoPrecoTeto, number | null>> = {};

    const limparCampoPrecoTeto = (campo: CampoPrecoTeto) => {
      if (modoEdicao?.ativo) {
        dadosPrecoTeto[campo] = null;
      }
    };

    if (mostraPrecoTeto) {
      if (isCarteiraInternacional) {
        // Para carteiras internacionais, permite ambos os valores
        if (formData.precoTeto && formData.precoTeto.trim() !== '') {
          dadosPrecoTeto.precoTeto = parseFloat(formData.precoTeto);
        } else {
          limparCampoPrecoTeto('precoTeto');
        }

        if (formData.precoTetoBDR && formData.precoTetoBDR.trim() !== '') {
          dadosPrecoTeto.precoTetoBDR = parseFloat(formData.precoTetoBDR);
        } else {
          limparCampoPrecoTeto('precoTetoBDR');
        }
      } else if (formData.precoTeto && formData.precoTeto.trim() !== '') {
        // Para carteiras nacionais, apenas USD/BRL normal
        dadosPrecoTeto.precoTeto = parseFloat(formData.precoTeto);
      } else {
        limparCampoPrecoTeto('precoTeto');
      }
    }

    const dadosAtivo = {
      ticker: formData.ticker.toUpperCase(),
      setor: formData.setor,
      dataEntrada: formData.dataEntrada,
      precoEntrada: parseFloat(formData.precoEntrada),
      ...dadosPrecoTeto,
      // 🔥 CAMPOS PARA POSIÇÃO ENCERRADA
      ...(modoEdicao?.tipo === 'encerrar' && {
        posicaoEncerrada: true,
        dataSaida: formData.dataSaida,
        precoSaida: parseFloat(formData.precoSaida),
        motivoEncerramento: formData.motivoEncerramento
      })
    };

    console.log('💾 SALVANDO ATIVO:', dadosAtivo);

    if (modoEdicao?.tipo === 'adicionar') {
      const novoAtivo = adicionarAtivo(carteiraAtiva, dadosAtivo);
      console.log('➕ ATIVO ADICIONADO:', novoAtivo);
    } else if (modoEdicao?.ativo) {
      editarAtivo(carteiraAtiva, modoEdicao.ativo.id, dadosAtivo);
      console.log('✏️ ATIVO EDITADO:', modoEdicao.ativo.id, dadosAtivo);
    }

    cancelarEdicao();
  };

  const cancelarEdicao = () => {
    setModoEdicao(null);
    setMoedaPrecoTeto('BRL');
    setFormData({
      ticker: '',
      setor: '',
      dataEntrada: '',
      precoEntrada: '',
      precoTeto: '',
      precoTetoBDR: '',
      dataSaida: '',
      precoSaida: '',
      motivoEncerramento: ''
    });
  };

  const confirmarRemocao = (ativo) => {
    if (confirm(`Tem certeza que deseja remover ${ativo.ticker}?`)) {
      removerAtivo(carteiraAtiva, ativo.id);
    }
  };

  // 🔄 FUNÇÕES DE REORDENAÇÃO CORRIGIDAS
  const moverAtivo = (index, direcao) => {
    const novaOrdem = [...ativosAtivos]; // Usar apenas ativos ativos para reordenação
    const ativoAtual = novaOrdem[index];
    
    if (direcao === 'up' && index > 0) {
      // Mover para cima
      novaOrdem[index] = novaOrdem[index - 1];
      novaOrdem[index - 1] = ativoAtual;
    } else if (direcao === 'down' && index < novaOrdem.length - 1) {
      // Mover para baixo
      novaOrdem[index] = novaOrdem[index + 1];
      novaOrdem[index + 1] = ativoAtual;
    }
    
    console.log('🔼🔽 MOVENDO ATIVO:', ativoAtual.ticker, direcao);
    // Combinar ativos ativos reordenados com encerrados
    const todosAtivos = [...novaOrdem, ...ativosEncerrados];
    reordenarAtivos(carteiraAtiva, todosAtivos);
  };

  const moverParaPosicao = (ativo, novaPosicao) => {
    const indexAtual = ativosAtivos.findIndex((a) => a.id === ativo.id);
    if (indexAtual === -1 || novaPosicao < 1 || novaPosicao > ativosAtivos.length) return;
    
    const novaOrdem = [...ativosAtivos];
    const ativoMovido = novaOrdem.splice(indexAtual, 1)[0];
    novaOrdem.splice(novaPosicao - 1, 0, ativoMovido);
    
    console.log('📍 MOVENDO PARA POSIÇÃO:', ativo.ticker, 'posição', novaPosicao);
    const todosAtivos = [...novaOrdem, ...ativosEncerrados];
    reordenarAtivos(carteiraAtiva, todosAtivos);
  };

  const [posicaoEdicao, setPosicaoEdicao] = useState(null);

  const formatCurrency = (value, moeda = 'BRL') => {
    const currency = moeda === 'USD' ? 'USD' : 'BRL';
    const locale = moeda === 'USD' ? 'en-US' : 'pt-BR';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(value);
  };

  // 💰 CALCULAR PERFORMANCE DE POSIÇÃO ENCERRADA
  const calcularPerformanceEncerrada = (ativo) => {
    if (!ativo.precoSaida) return 0;
    return ((ativo.precoSaida - ativo.precoEntrada) / ativo.precoEntrada) * 100;
  };

  // 🔥 FUNÇÃO PARA EXIBIR PREÇO TETO FORMATADO
  const exibirPrecoTeto = (ativo) => {
    if (!ativo.precoTeto && !ativo.precoTetoBDR) return '-';
    
    if (ativo.precoTetoBDR) {
      return React.createElement('div', {},
        React.createElement('div', { 
          style: { fontWeight: '600', color: '#059669' }
        }, formatCurrency(ativo.precoTetoBDR, 'BRL')),
        React.createElement('div', { 
          style: { fontSize: '10px', color: '#6b7280' }
        }, 'BDR (R$)')
      );
    } else if (ativo.precoTeto) {
      return React.createElement('div', {},
        React.createElement('div', { 
          style: { fontWeight: '600', color: '#374151' }
        }, formatCurrency(ativo.precoTeto, carteiraConfig.moeda)),
        isCarteiraInternacional && React.createElement('div', { 
          style: { fontSize: '10px', color: '#6b7280' }
        }, 'USD')
      );
    }
    
    return '-';
  };

  // 🔥 FUNÇÃO PARA DEBUGGAR O ESTADO
  React.useEffect(() => {
    window.debugGerenciamento = () => {
      console.log('🔍 === DEBUG GERENCIAMENTO ===');
      console.log('📊 Dados atuais:', dados);
      console.log('🎯 Carteira ativa:', carteiraAtiva);
      console.log('📋 Ativos ativos:', ativosAtivos);
      console.log('🔒 Ativos encerrados:', ativosEncerrados);
      console.log('💰 Moeda preço teto:', moedaPrecoTeto);
      console.log('🌍 É carteira internacional:', isCarteiraInternacional);
      console.log('💾 LocalStorage atual:', localStorage.getItem('carteiras-dados'));
      
      // Debug específico para BDR
      console.log('💱 === ANÁLISE BDR ===');
      const ativosComBDR = ativosAtivos.filter(a => a.precoTetoBDR);
      const ativosComUSD = ativosAtivos.filter(a => a.precoTeto);
      console.log('📊 Ativos com preço BDR:', ativosComBDR.map(a => ({
        ticker: a.ticker,
        precoTetoBDR: a.precoTetoBDR
      })));
      console.log('💲 Ativos com preço USD:', ativosComUSD.map(a => ({
        ticker: a.ticker,
        precoTeto: a.precoTeto
      })));
    };

    console.log('🔧 Função debugGerenciamento() criada. Execute no console para debug.');

    return () => {
      delete window.debugGerenciamento;
    };
  }, [dados, carteiraAtiva, ativosAtivos, ativosEncerrados, moedaPrecoTeto, isCarteiraInternacional]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      padding: '24px' 
    }}>
      {/* 🔒 HEADER COM INDICAÇÃO DE ADMIN */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          backgroundColor: '#059669',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>👑</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px' }}>
              Modo Administrador Ativo
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              Logado como: {user.firstName} {user.lastName} ({user.email}) • Plano: {user.plan}
            </div>
          </div>
        </div>
        
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: '800', 
          color: '#1e293b',
          margin: '0 0 8px 0'
        }}>
          🎛️ Gerenciamento de Carteiras
        </h1>
        <p style={{ 
          color: '#64748b', 
          fontSize: '18px',
          margin: '0',
          lineHeight: '1.5'
        }}>
          Gerencie todos os ativos das suas carteiras em um só lugar • {estatisticas.totalAtivos} ativos no total
          <span style={{ 
            backgroundColor: '#10b981', 
            color: 'white', 
            padding: '4px 8px', 
            borderRadius: '6px', 
            fontSize: '14px', 
            marginLeft: '12px' 
          }}>
            ✅ PREÇO TETO BDR DISPONÍVEL
          </span>
          <span style={{ 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            padding: '4px 8px', 
            borderRadius: '6px', 
            fontSize: '14px', 
            marginLeft: '8px' 
          }}>
            🚀 CSV NATIVO
          </span>
        </p>
      </div>

      {/* Estatísticas Rápidas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {Object.entries(CARTEIRAS_CONFIG).map(([key, config]) => {
          const totalAtivos = dados[key]?.length || 0;
          const ativosAtivosCount = dados[key]?.filter((a) => !a.posicaoEncerrada).length || 0;
          const ativosEncerradosCount = totalAtivos - ativosAtivosCount;
          const isInternacional = ['dividendosInternacional', 'etfs', 'projetoAmerica', 'exteriorStocks'].includes(key);
          
          return (
            <div
              key={key}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderLeft: `4px solid ${config.color}`,
                transform: carteiraAtiva === key ? 'scale(1.02)' : 'scale(1)',
                boxShadow: carteiraAtiva === key ? '0 4px 12px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onClick={() => setCarteiraAtiva(key)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px' }}>{config.icon}</span>
                <div>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    color: '#1e293b',
                    margin: '0'
                  }}>
                    {config.nome}
                  </h3>
                  {isInternacional && (
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#059669',
                      fontWeight: '600',
                      marginTop: '2px'
                    }}>
                      🔄 BDR Support
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: config.color }}>
                {ativosAtivosCount}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                ativos {ativosEncerradosCount > 0 && `• ${ativosEncerradosCount} encerrados`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Painel Principal */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header da Carteira */}
        <div style={{
          padding: '32px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '800',
                color: '#1e293b',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '32px' }}>{carteiraConfig.icon}</span>
                {carteiraConfig.nome}
                {isCarteiraInternacional && (
                  <span style={{
                    backgroundColor: '#059669',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    💱 USD/BRL
                  </span>
                )}
              </h2>
              <p style={{
                color: '#64748b',
                fontSize: '16px',
                margin: '0'
              }}>
                {ativosAtivos.length} ativos • {ativosEncerrados.length} encerrados • Moeda: {carteiraConfig.moeda}
                {isCarteiraInternacional && (
                  <span style={{ color: '#059669', fontWeight: '600', marginLeft: '8px' }}>
                    • Preço Teto BDR Disponível
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={iniciarAdicao}
                style={{
                  backgroundColor: carteiraConfig.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                ➕ Adicionar Ativo
              </button>

              {/* 🔥 NOVO BOTÃO PARA IMPORTAÇÃO CSV */}
              <button
                onClick={() => setModoImportacao(true)}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                📄 Importar CSV
              </button>
              
              {/* 🔥 BOTÃO PARA CONVERSÃO EM LOTE USD → BRL */}
              {isCarteiraInternacional && ativosAtivos.some(a => a.precoTeto && !a.precoTetoBDR) && (
                <button
                  onClick={atualizarPrecoTetoBDRLote}
                  style={{
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  title="Converter preços teto de USD para BRL"
                >
                  💱 Converter USD → BRL
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 📄 MODAL DE IMPORTAÇÃO CSV */}
        {modoImportacao && (
          <div style={{
            padding: '24px',
            backgroundColor: '#eff6ff',
            borderBottom: '1px solid #bfdbfe'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e40af',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📄 Importação em Lote via CSV
            </h3>

            {!relatorioImportacao ? (
              <div>
                {/* 📥 ÁREA DE UPLOAD */}
                <div style={{
                  border: '2px dashed #3b82f6',
                  borderRadius: '8px',
                  padding: '32px',
                  textAlign: 'center',
                  marginBottom: '20px',
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e40af',
                    margin: '0 0 8px 0'
                  }}>
                    Selecione o arquivo CSV
                  </h4>
                  <p style={{
                    color: '#64748b',
                    margin: '0 0 20px 0'
                  }}>
                    Colunas obrigatórias: ticker, setor, dataEntrada, precoEntrada
                    {temPrecoTeto && ' • precoTeto (opcional)'}
                    {isCarteiraInternacional && ' • precoTetoBDR (opcional)'}
                  </p>
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '16px',
                    fontSize: '12px'
                  }}>
                    <strong>🇧🇷 Suporte automático ao formato brasileiro:</strong><br/>
                    ✅ Separador ponto e vírgula (;)<br/>
                    ✅ Preços no formato "R$ 3,47"<br/>
                    ✅ Conversão automática para formato internacional<br/>
                    ✅ Processing 100% nativo (sem dependências externas)
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const arquivo = e.target.files[0];
                      setArquivoCSV(arquivo);
                      if (arquivo) {
                        processarArquivoCSV(arquivo);
                      }
                    }}
                    style={{
                      marginBottom: '16px'
                    }}
                  />
                  <div>
                    <button
                      onClick={gerarTemplateCSV}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      📥 Baixar Template CSV
                    </button>
                  </div>
                </div>

                {/* 👀 PREVIEW DOS DADOS */}
                {previewCSV.validos && previewCSV.validos.length > 0 && (
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#10b981',
                      margin: '0 0 16px 0'
                    }}>
                      ✅ Dados Válidos para Importação ({previewCSV.validos.length})
                    </h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Ticker</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Setor</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Data Entrada</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Preço Entrada</th>
                            {temPrecoTeto && (
                              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Preço Teto</th>
                            )}
                            {isCarteiraInternacional && (
                              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Preço Teto BDR</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {previewCSV.validos.slice(0, 5).map((item, index) => (
                            <tr key={index}>
                              <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{item.ticker}</td>
                              <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{item.setor}</td>
                              <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{item.dataEntrada}</td>
                              <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{formatCurrency(item.precoEntrada, carteiraConfig.moeda)}</td>
                              {temPrecoTeto && (
                                <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                                  {item.precoTeto ? formatCurrency(item.precoTeto, carteiraConfig.moeda) : '-'}
                                </td>
                              )}
                              {isCarteiraInternacional && (
                                <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                                  {item.precoTetoBDR ? formatCurrency(item.precoTetoBDR, 'BRL') : '-'}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {previewCSV.validos.length > 5 && (
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#6b7280', 
                          textAlign: 'center', 
                          margin: '8px 0 0 0' 
                        }}>
                          ... e mais {previewCSV.validos.length - 5} itens
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ❌ ERROS ENCONTRADOS */}
                {previewCSV.erros && previewCSV.erros.length > 0 && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px solid #fecaca'
                  }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#dc2626',
                      margin: '0 0 16px 0'
                    }}>
                      ❌ Erros Encontrados ({previewCSV.erros.length})
                    </h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {previewCSV.erros.slice(0, 3).map((erro, index) => (
                        <div key={index} style={{
                          padding: '8px',
                          backgroundColor: '#fee2e2',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          fontSize: '12px'
                        }}>
                          <strong>Linha {erro.linha}:</strong> {erro.dados.ticker || 'N/A'} - {erro.erros.join(', ')}
                        </div>
                      ))}
                      {previewCSV.erros.length > 3 && (
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>
                          ... e mais {previewCSV.erros.length - 3} erros
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 🎯 BOTÕES DE AÇÃO */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={confirmarImportacao}
                    disabled={dadosCSV.length === 0}
                    style={{
                      backgroundColor: dadosCSV.length > 0 ? '#10b981' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: dadosCSV.length > 0 ? 'pointer' : 'not-allowed'
                    }}
                  >
                    🚀 Importar {dadosCSV.length} Ativos
                  </button>
                  <button
                    onClick={fecharImportacao}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </div>
            ) : (
              /* 📊 RELATÓRIO DE IMPORTAÇÃO */
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#10b981',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📊 Relatório de Importação
                </h4>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6' }}>
                      {relatorioImportacao.total}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Total</div>
                  </div>
                  <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>
                      {relatorioImportacao.sucessos}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Sucessos</div>
                  </div>
                  <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#dc2626' }}>
                      {relatorioImportacao.falhas}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Falhas</div>
                  </div>
                </div>

                {relatorioImportacao.detalhes.sucessos.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h5 style={{ color: '#10b981', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
                      ✅ Ativos Importados com Sucesso:
                    </h5>
                    <div style={{ fontSize: '12px', color: '#374151' }}>
                      {relatorioImportacao.detalhes.sucessos.map(s => s.ticker).join(', ')}
                    </div>
                  </div>
                )}

                {relatorioImportacao.detalhes.falhas.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h5 style={{ color: '#dc2626', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
                      ❌ Falhas na Importação:
                    </h5>
                    <div style={{ fontSize: '12px', color: '#374151' }}>
                      {relatorioImportacao.detalhes.falhas.map(f => `${f.ticker} (${f.erro})`).join(', ')}
                    </div>
                  </div>
                )}

                <button
                  onClick={fecharImportacao}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Concluir
                </button>
              </div>
            )}
          </div>
        )}

        {/* Formulário de Adição/Edição/Encerramento */}
        {modoEdicao && (
          <div style={{
            padding: '24px',
            backgroundColor: modoEdicao.tipo === 'encerrar' ? '#fef2f2' : '#fffbeb',
            borderBottom: `1px solid ${modoEdicao.tipo === 'encerrar' ? '#fecaca' : '#fde68a'}`
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: modoEdicao.tipo === 'encerrar' ? '#991b1b' : '#92400e',
              margin: '0 0 20px 0'
            }}>
              {modoEdicao.tipo === 'adicionar' && '➕ Adicionar Novo Ativo'}
              {modoEdicao.tipo === 'editar' && `✏️ Editando: ${modoEdicao.ativo?.ticker}`}
              {modoEdicao.tipo === 'encerrar' && `🔒 Encerrando Posição: ${modoEdicao.ativo?.ticker}`}
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Ticker *
                </label>
                <input
                  type="text"
                  placeholder="Ex: PETR4 ou AAPL"
                  value={formData.ticker}
                  onChange={(e) => handleInputChange('ticker', e.target.value)}
                  disabled={modoEdicao.tipo !== 'adicionar'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: modoEdicao.tipo !== 'adicionar' ? '#f9fafb' : 'white'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Setor *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Petróleo ou Tecnologia"
                  value={formData.setor}
                  onChange={(e) => handleInputChange('setor', e.target.value)}
                  disabled={modoEdicao.tipo === 'encerrar'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: modoEdicao.tipo === 'encerrar' ? '#f9fafb' : 'white'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Data de Entrada *
                </label>
                <input
                  type="date"
                  value={formData.dataEntrada.split('/').reverse().join('-')}
                  onChange={(e) => {
                    const [ano, mes, dia] = e.target.value.split('-');
                    handleInputChange('dataEntrada', `${dia}/${mes}/${ano}`);
                  }}
                  disabled={modoEdicao.tipo === 'encerrar'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: modoEdicao.tipo === 'encerrar' ? '#f9fafb' : 'white'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Preço de Entrada ({carteiraConfig.moeda === 'USD' ? 'USD' : 'R$'}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.precoEntrada}
                  onChange={(e) => handleInputChange('precoEntrada', e.target.value)}
                  disabled={modoEdicao.tipo === 'encerrar'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: modoEdicao.tipo === 'encerrar' ? '#f9fafb' : 'white'
                  }}
                />
              </div>

              {/* 🔥 SEÇÃO PREÇO TETO COM CAMPOS SEPARADOS PARA USD E BDR */}
              {mostraPrecoTeto && modoEdicao.tipo !== 'encerrar' && (
                <>
                  {/* Campo Preço Teto Original (USD para internacionais, BRL para nacionais) */}
                  <div>
                    <label style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      display: 'block',
                      marginBottom: '8px'
                    }}>
                      Preço Teto {carteiraConfig.moeda}
                      {isCarteiraInternacional && (
                        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>
                          {' '}(Ativo Original)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`0.00 (${carteiraConfig.moeda})`}
                      value={formData.precoTeto}
                      onChange={(e) => handleInputChange('precoTeto', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #3b82f6',
                        fontSize: '14px',
                        backgroundColor: '#eff6ff'
                      }}
                    />
                    <div style={{
                      marginTop: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#3b82f6'
                    }}>
                      💲 Preço em {carteiraConfig.moeda}
                    </div>
                  </div>

                  {/* Campo Preço Teto BDR (apenas para carteiras internacionais) */}
                  {isCarteiraInternacional && (
                    <div>
                      <label style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#059669',
                        display: 'block',
                        marginBottom: '8px'
                      }}>
                        Preço Teto BDR
                        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>
                          {' '}(R$ - Brasil)
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00 (R$ - BDR)"
                        value={formData.precoTetoBDR}
                        onChange={(e) => handleInputChange('precoTetoBDR', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '2px solid #059669',
                          fontSize: '14px',
                          backgroundColor: '#f0fdf4'
                        }}
                      />
                      <div style={{
                        marginTop: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#059669'
                      }}>
                        🇧🇷 Preço em Real (para BDRs)
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 🔥 CAMPOS PARA ENCERRAMENTO DE POSIÇÃO */}
              {modoEdicao.tipo === 'encerrar' && (
                <>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#991b1b',
                      marginBottom: '8px'
                    }}>
                      Data de Saída *
                    </label>
                    <input
                      type="date"
                      value={formData.dataSaida.split('/').reverse().join('-')}
                      onChange={(e) => {
                        const [ano, mes, dia] = e.target.value.split('-');
                        handleInputChange('dataSaida', `${dia}/${mes}/${ano}`);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #fca5a5',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#991b1b',
                      marginBottom: '8px'
                    }}>
                      Preço de Saída ({carteiraConfig.moeda === 'USD' ? 'USD' : 'R$'}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.precoSaida}
                      onChange={(e) => handleInputChange('precoSaida', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #fca5a5',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#991b1b',
                      marginBottom: '8px'
                    }}>
                      Motivo do Encerramento *
                    </label>
                    <select
                      value={formData.motivoEncerramento}
                      onChange={(e) => handleInputChange('motivoEncerramento', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #fca5a5',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Selecione o motivo</option>
                      <option value="Take Profit">Take Profit - Meta de lucro atingida</option>
                      <option value="Stop Loss">Stop Loss - Corte de perdas</option>
                      <option value="Tese Alterada">Tese de investimento alterada</option>
                      <option value="Rebalanceamento">Rebalanceamento de carteira</option>
                      <option value="Necessidade de Liquidez">Necessidade de liquidez</option>
                      <option value="Deterioração Fundamentalista">Deterioração fundamentalista</option>
                      <option value="Outro">Outro motivo</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={salvarAtivo}
                style={{
                  backgroundColor: modoEdicao.tipo === 'encerrar' ? '#dc2626' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {modoEdicao.tipo === 'encerrar' ? '🔒 Encerrar Posição' : '💾 Salvar'}
              </button>
              <button
                onClick={cancelarEdicao}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de Ativos Ativos */}
        <div
          style={{
            margin: '0 24px 16px 24px',
            backgroundColor: '#ecfeff',
            border: '1px solid #67e8f9',
            borderRadius: '12px',
            padding: '16px',
            color: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <strong style={{ fontSize: '14px' }}>⚙️ Controle de viés manual</strong>
          <span style={{ fontSize: '13px', lineHeight: 1.5 }}>
            Use o seletor abaixo para alternar entre o cálculo automático e o modo <em>Manter</em> para cada ativo.
            Alterações são aplicadas imediatamente e podem ser revertidas escolhendo <em>Automático</em> novamente.
          </span>
        </div>

        <div style={{ padding: '24px' }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📈 Posições Ativas ({ativosAtivos.length})
          </h3>
          
          {ativosAtivos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Nenhum ativo ativo encontrado
              </h3>
              <p style={{ fontSize: '14px' }}>
                Adicione o primeiro ativo desta carteira clicando no botão acima ou importe via CSV.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      POSIÇÃO
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      TICKER
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      SETOR
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      ENTRADA
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      PREÇO ENTRADA
                    </th>
                    {/* 🔥 COLUNAS SEPARADAS PARA USD E BDR */}
                    {(temPrecoTeto && carteiraAtiva !== 'projetoAmerica') || 
                     (carteiraAtiva === 'projetoAmerica') ? (
                      <>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                          PREÇO TETO {carteiraConfig.moeda}
                          {isCarteiraInternacional && (
                            <div style={{ fontSize: '10px', fontWeight: '400', color: '#6b7280' }}>
                              (Ativo Original)
                            </div>
                          )}
                        </th>
                        {isCarteiraInternacional && (
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#059669', fontSize: '14px' }}>
                            PREÇO TETO BDR
                            <div style={{ fontSize: '10px', fontWeight: '400', color: '#6b7280' }}>
                              (R$ - Brasil)
                            </div>
                          </th>
                        )}
                      </>
                    ) : null}
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      VIÉS MANUAL
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: '14px' }}>
                      AÇÕES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ativosAtivos.map((ativo, index) => (
                    <tr key={ativo.id} style={{ 
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.2s'
                    }}>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <div style={{ 
                            fontWeight: '800', 
                            color: carteiraConfig.color,
                            fontSize: '16px',
                            minWidth: '24px'
                          }}>
                            {index + 1}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <button
                              onClick={() => moverAtivo(index, 'up')}
                              disabled={index === 0}
                              style={{
                                backgroundColor: index === 0 ? '#f3f4f6' : '#3b82f6',
                                color: index === 0 ? '#9ca3af' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '2px 4px',
                                fontSize: '10px',
                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                lineHeight: 1
                              }}
                              title="Mover para cima"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moverAtivo(index, 'down')}
                              disabled={index === ativosAtivos.length - 1}
                              style={{
                                backgroundColor: index === ativosAtivos.length - 1 ? '#f3f4f6' : '#3b82f6',
                                color: index === ativosAtivos.length - 1 ? '#9ca3af' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '2px 4px',
                                fontSize: '10px',
                                cursor: index === ativosAtivos.length - 1 ? 'not-allowed' : 'pointer',
                                lineHeight: 1
                              }}
                              title="Mover para baixo"
                            >
                              ▼
                            </button>
                          </div>
                          <div>
                            {posicaoEdicao?.ativoId === ativo.id ? (
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <input
                                  type="number"
                                  min="1"
                                  max={ativosAtivos.length}
                                  value={posicaoEdicao.novaPosicao}
                                  onChange={(e) => setPosicaoEdicao({
                                    ativoId: ativo.id,
                                    novaPosicao: e.target.value
                                  })}
                                  style={{
                                    width: '50px',
                                    padding: '2px 4px',
                                    borderRadius: '4px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '12px',
                                    textAlign: 'center'
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    moverParaPosicao(ativo, parseInt(posicaoEdicao.novaPosicao));
                                    setPosicaoEdicao(null);
                                  }}
                                  style={{
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setPosicaoEdicao(null)}
                                  style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setPosicaoEdicao({
                                  ativoId: ativo.id,
                                  novaPosicao: (index + 1).toString()
                                })}
                                style={{
                                  backgroundColor: '#f59e0b',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  cursor: 'pointer'
                                }}
                                title="Mover para posição específica"
                              >
                                📍
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            backgroundColor: carteiraConfig.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}>
                            {ativo.ticker.slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '16px' }}>
                              {ativo.ticker}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#64748b' }}>
                        {ativo.setor}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                        {ativo.dataEntrada}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                        {formatCurrency(ativo.precoEntrada, carteiraConfig.moeda)}
                      </td>
                      {/* 🔥 COLUNAS SEPARADAS PARA USD E BDR */}
                      {(temPrecoTeto && carteiraAtiva !== 'projetoAmerica') || 
                       (carteiraAtiva === 'projetoAmerica') ? (
                        <>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            {(carteiraAtiva === 'projetoAmerica' && ativo.setor === 'ETF') ? 
                              '-' : 
                              (ativo.precoTeto ? 
                                <div>
                                  <div style={{ fontWeight: '600', color: '#374151' }}>
                                    {formatCurrency(ativo.precoTeto, carteiraConfig.moeda)}
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#6b7280' }}>
                                    {carteiraConfig.moeda}
                                  </div>
                                </div>
                                : '-'
                              )
                            }
                          </td>
                          {isCarteiraInternacional && (
                            <td style={{ padding: '16px', textAlign: 'center' }}>
                              {(carteiraAtiva === 'projetoAmerica' && ativo.setor === 'ETF') ? 
                                '-' : 
                                (ativo.precoTetoBDR ? 
                                  <div>
                                    <div style={{ fontWeight: '600', color: '#059669' }}>
                                      {formatCurrency(ativo.precoTetoBDR, 'BRL')}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                                      BDR (R$)
                                    </div>
                                  </div>
                                  : '-'
                                )
                              }
                            </td>
                          )}
                        </>
                      ) : null}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                          <select
                            value={ativo.viesOverride || 'AUTO'}
                            onChange={(e) => handleAtualizarViesManual(ativo.id, ativo.ticker, e.target.value)}
                            disabled={!!viesOverridesEmProcesso[ativo.id]}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5f5',
                              fontWeight: '600',
                              backgroundColor: '#ffffff',
                              color: '#1e293b',
                              cursor: viesOverridesEmProcesso[ativo.id] ? 'wait' : 'pointer'
                            }}
                          >
                            <option value="AUTO">Automático</option>
                            <option value="MANTER">Manter</option>
                          </select>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {viesOverridesEmProcesso[ativo.id]
                              ? 'Salvando...'
                              : ativo.viesOverride === 'MANTER'
                                ? 'Viés fixado em “Manter”'
                                : 'Usando cálculo automático'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => iniciarEdicao(ativo)}
                            style={{
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => iniciarEncerramento(ativo)}
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
                              gap: '4px'
                            }}
                          >
                            🔒 Encerrar
                          </button>
                          <button
                            onClick={() => confirmarRemocao(ativo)}
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            🗑️ Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 🔥 SEÇÃO DE POSIÇÕES ENCERRADAS */}
        {ativosEncerrados.length > 0 && (
          <div style={{ 
            padding: '24px',
            backgroundColor: '#fef2f2',
            borderTop: '1px solid #fecaca'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#991b1b',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔒 Posições Encerradas ({ativosEncerrados.length})
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fee2e2' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#991b1b', fontSize: '14px' }}>
                      TICKER
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#991b1b', fontSize: '14px' }}>
                      ENTRADA
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#991b1b', fontSize: '14px' }}>
                      SAÍDA
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#991b1b', fontSize: '14px' }}>
                      PREÇO ENTRADA
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#991b1b', fontSize: '14px' }}>
                      PREÇO SAÍDA
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#991b1b', fontSize: '14px' }}>
                      PERFORMANCE
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#991b1b', fontSize: '14px' }}>
                      MOTIVO
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#991b1b', fontSize: '14px' }}>
                      AÇÕES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ativosEncerrados.map((ativo) => {
                    const performance = calcularPerformanceEncerrada(ativo);
                    return (
                      <tr key={ativo.id} style={{ 
                        borderBottom: '1px solid #fecaca',
                        backgroundColor: '#fef2f2'
                      }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              backgroundColor: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}>
                              {ativo.ticker.slice(0, 2)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '16px' }}>
                                {ativo.ticker}
                              </div>
                              <div style={{ fontSize: '12px', color: '#b91c1c' }}>
                                {ativo.setor}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#991b1b' }}>
                          {ativo.dataEntrada}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#991b1b' }}>
                          {ativo.dataSaida}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#991b1b' }}>
                          {formatCurrency(ativo.precoEntrada, carteiraConfig.moeda)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#991b1b' }}>
                          {formatCurrency(ativo.precoSaida, carteiraConfig.moeda)}
                        </td>
                        <td style={{ 
                          padding: '16px', 
                          textAlign: 'center', 
                          fontWeight: '800',
                          color: performance >= 0 ? '#059669' : '#dc2626'
                        }}>
                          {performance >= 0 ? '+' : ''}{performance.toFixed(1)}%
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#991b1b' }}>
                          {ativo.motivoEncerramento}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => reativarPosicao(ativo)}
                              style={{
                                backgroundColor: '#059669',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              🔄 Reativar
                            </button>
                            <button
                              onClick={() => confirmarRemocao(ativo)}
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              🗑️ Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer com Informações */}
      <div style={{
        marginTop: '32px',
        padding: '20px',
        backgroundColor: '#059669',
        borderRadius: '12px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>
          💱 Sistema de Preço Teto BDR + 📄 Importação CSV Nativa
        </h3>
        <p style={{ fontSize: '14px', margin: '0', opacity: 0.9 }}>
          Para carteiras internacionais, você pode definir preços teto tanto em USD quanto em BRL (para BDRs). 
          Importação CSV com processamento 100% nativo - sem dependências externas! 🚀
        </p>
      </div>
    </div>
  );
}