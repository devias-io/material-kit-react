'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const getStatusColor = (status) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'completed':
    case 'analisada':
      return '#10b981';
    case 'processing':
    case 'em_analise':
    case 'em análise':
      return '#f59e0b';
    case 'pending':
    case 'pendente':
      return '#64748b';
    default:
      return '#64748b';
  }
};

const getStatusText = (status) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'completed':
    case 'analisada':
      return 'Analisada';
    case 'processing':
    case 'em_analise':
    case 'em análise':
      return 'Em Análise';
    case 'pending':
    case 'pendente':
      return 'Pendente';
    default:
      return 'Pendente';
  }
};

const getStatusIcon = (status) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'completed':
    case 'analisada':
      return '✅';
    case 'processing':
    case 'em_analise':
    case 'em análise':
      return '⏳';
    case 'pending':
    case 'pendente':
      return '📋';
    default:
      return '📋';
  }
};

function AnaliseCarteiraClientePage() {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [respostas, setRespostas] = useState({
    tempoInvestimento: '',
    motivoMercado: '',
    objetivoCarteira: '',
    toleranciaOscilacao: '',
    comportamentoQueda: '',
    reservaEmergencia: '',
    reservaOportunidade: '',
    rendaMensal: '',
    valorAporte: '',
    nivelConhecimento: ''
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jaEnviouCarteira, setJaEnviouCarteira] = useState(false);
  const [carregandoVerificacao, setCarregandoVerificacao] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Estados para validação
  const [portfolioData, setPortfolioData] = useState({});
  const [errors, setErrors] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const verificarSeJaEnviou = async () => {
      try {
        const response = await fetch('/api/carteiras/minhas');
        const data = await response.json();
        
        if (response.ok && data.carteiras && data.carteiras.length > 0) {
          setJaEnviouCarteira(true);
        }
      } catch (error) {
        console.error('Erro ao verificar carteiras:', error);
      } finally {
        setCarregandoVerificacao(false);
      }
    };

    verificarSeJaEnviou();
  }, []);

  // Estrutura simplificada - apenas campos essenciais
  const expectedSheets = {
    'Ações': ['ATIVO', 'QUANTIDADE', 'PREÇO MÉDIO'],
    'FIIs': ['ATIVO', 'QUANTIDADE', 'PREÇO MÉDIO'], 
    'Exterior': ['ATIVO', 'QUANTIDADE', 'PREÇO MÉDIO'],
    'Renda Fixa': ['PRODUTO', 'VALOR INVESTIDO', 'VENCIMENTO'],
    'Cripto': ['CRIPTOMOEDA', 'QUANTIDADE', 'PREÇO MÉDIO'],
    'Reserva': ['ONDE ESTÁ', 'VALOR']
  };

  // Baixar modelo Excel via endpoint
  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/carteiras/modelo-excel');
      if (!response.ok) throw new Error('Erro ao baixar modelo');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Modelo-Carteira-Completo.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar modelo:', error);
      alert('Erro ao baixar modelo. Tente novamente.');
    }
  };

  // Processar arquivo Excel com validação
  const processExcelFile = async (file) => {
    setIsProcessing(true);
    setErrors([]);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const processedData = {};
      const validationErrors = [];

      // Processar cada aba esperada
      Object.keys(expectedSheets).forEach(sheetName => {
        const possibleNames = [
          sheetName,
          sheetName.toLowerCase(),
          sheetName.toUpperCase(),
          sheetName.replace(/s$/, ''),
        ];

        const foundSheet = workbook.SheetNames.find(name => 
          possibleNames.some(possible => 
            name.toLowerCase().includes(possible.toLowerCase())
          )
        );

        if (foundSheet) {
          const worksheet = workbook.Sheets[foundSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Encontrar linha de cabeçalho de forma mais inteligente
          let headerRowIndex = -1;
          for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
            if (jsonData[i] && jsonData[i].some(cell => {
              if (!cell || typeof cell !== 'string') return false;
              const cellUpper = cell.toUpperCase();
              return (
                cellUpper.includes('ATIVO') || 
                cellUpper.includes('CÓDIGO') ||
                cellUpper.includes('PRODUTO') ||
                cellUpper.includes('CRIPTO') ||
                cellUpper.includes('ONDE ESTÁ')
              ) && (
                // Se tem "ATIVO" deve ter também "QUANTIDADE" na mesma linha
                jsonData[i].some(c => c && typeof c === 'string' && c.toUpperCase().includes('QUANTIDADE')) ||
                // Ou se tem "PRODUTO" deve ter "VALOR" 
                jsonData[i].some(c => c && typeof c === 'string' && c.toUpperCase().includes('VALOR')) ||
                // Ou se tem "ONDE ESTÁ" deve ter "VALOR"
                jsonData[i].some(c => c && typeof c === 'string' && c.toUpperCase().includes('VALOR'))
              );
            })) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex !== -1) {
            const headers = jsonData[headerRowIndex];
            const dataRows = jsonData.slice(headerRowIndex + 1).filter(row => 
              row && row.some(cell => cell !== undefined && cell !== '' && cell !== null)
            );

            processedData[sheetName] = {
              originalSheetName: foundSheet,
              headers: headers,
              data: dataRows.map((row, index) => ({
                id: `${sheetName}_${index}`,
                values: row.map(cell => cell === undefined || cell === null ? '' : cell),
                isValid: true
              }))
            };

            // Validação mais inteligente - só erros reais
            dataRows.forEach((row, index) => {
              const temDadosImportantes = row.some((cell, cellIndex) => {
                if (cellIndex < 3) {
                  return cell !== undefined && cell !== '' && cell !== null && String(cell).trim() !== '';
                }
                return false;
              });
              
              if (!temDadosImportantes) return;
              
              // Pular linhas que parecem ser cabeçalhos
              const primeiraColuna = String(row[0] || '').toUpperCase();
              if (primeiraColuna.includes('ATIVO') || 
                  primeiraColuna.includes('PRODUTO') || 
                  primeiraColuna.includes('CRIPTO') ||
                  primeiraColuna.includes('ONDE') ||
                  primeiraColuna.includes('CÓDIGO')) {
                return; // Pular linha de cabeçalho
              }
              
              // Validar apenas tipos de dados incorretos
              if (['Ações', 'FIIs', 'Exterior'].includes(sheetName)) {
                const quantidade = row[1];
                const precoMedio = row[2];
                
                // Validar quantidade se não for vazia e não for cabeçalho
                if (quantidade && quantidade !== '' && String(quantidade).trim() !== '') {
                  const quantidadeStr = String(quantidade).toUpperCase();
                  if (!quantidadeStr.includes('QUANTIDADE')) {
                    // Aceitar vírgula ou ponto como separador decimal
                    const quantidadeNormalizada = String(quantidade).replace(',', '.');
                    if (isNaN(Number(quantidadeNormalizada))) {
                      validationErrors.push(`${sheetName} - Linha ${index + 1}: "${quantidade}" não é um número válido para quantidade`);
                    }
                  }
                }
                
                // Validar preço se não for vazio e não for cabeçalho
                if (precoMedio && precoMedio !== '' && String(precoMedio).trim() !== '') {
                  const precoStr = String(precoMedio).toUpperCase();
                  if (!precoStr.includes('PREÇO') && !precoStr.includes('PRECO')) {
                    // Aceitar vírgula ou ponto como separador decimal
                    const precoNormalizado = String(precoMedio).replace(',', '.');
                    if (isNaN(Number(precoNormalizado))) {
                      validationErrors.push(`${sheetName} - Linha ${index + 1}: "${precoMedio}" não é um número válido para preço`);
                    }
                  }
                }
              }
              
              if (sheetName === 'Cripto') {
                const quantidade = row[1];
                const preco = row[2];
                
                if (quantidade && quantidade !== '' && String(quantidade).trim() !== '') {
                  const quantidadeStr = String(quantidade).toUpperCase();
                  if (!quantidadeStr.includes('QUANTIDADE')) {
                    const quantidadeNormalizada = String(quantidade).replace(',', '.');
                    if (isNaN(Number(quantidadeNormalizada))) {
                      validationErrors.push(`${sheetName} - Linha ${index + 1}: "${quantidade}" não é um número válido para quantidade`);
                    }
                  }
                }
                
                if (preco && preco !== '' && String(preco).trim() !== '') {
                  const precoStr = String(preco).toUpperCase();
                  if (!precoStr.includes('PREÇO') && !precoStr.includes('PRECO')) {
                    const precoNormalizado = String(preco).replace(',', '.');
                    if (isNaN(Number(precoNormalizado))) {
                      validationErrors.push(`${sheetName} - Linha ${index + 1}: "${preco}" não é um número válido para preço`);
                    }
                  }
                }
              }
              
              if (sheetName === 'Renda Fixa') {
                const valor = row[2];
                if (valor && valor !== '' && String(valor).trim() !== '') {
                  const valorStr = String(valor).toUpperCase();
                  if (!valorStr.includes('VALOR')) {
                    const valorNormalizado = String(valor).replace(',', '.');
                    if (isNaN(Number(valorNormalizado))) {
                      validationErrors.push(`${sheetName} - Linha ${index + 1}: "${valor}" não é um número válido para valor`);
                    }
                  }
                }
              }
            });
          }
        }
      });

      // Processar dados e calcular valores básicos após validação
      const dadosComCalculos = {};
      let valorTotalCarteira = 0;

      // Primeiro, calcular valor total para percentuais
      Object.entries(processedData).forEach(([sheetName, sheetData]) => {
        sheetData.data.forEach(row => {
          if (['Ações', 'FIIs', 'Exterior'].includes(sheetName)) {
            const quantidade = parseFloat(String(row.values[1] || '').replace(',', '.')) || 0;
            const precoMedio = parseFloat(String(row.values[2] || '').replace(',', '.')) || 0;
            if (quantidade > 0 && precoMedio > 0) {
              valorTotalCarteira += quantidade * precoMedio;
            }
          } else if (sheetName === 'Renda Fixa') {
            const valorInvestido = parseFloat(String(row.values[2] || '').replace(',', '.')) || 0;
            if (valorInvestido > 0) {
              valorTotalCarteira += valorInvestido;
            }
          } else if (sheetName === 'Cripto') {
            const quantidade = parseFloat(String(row.values[1] || '').replace(',', '.')) || 0;
            const precoMedio = parseFloat(String(row.values[2] || '').replace(',', '.')) || 0;
            if (quantidade > 0 && precoMedio > 0) {
              valorTotalCarteira += quantidade * precoMedio;
            }
          }
        });
      });

      // Agora processar com cálculos
      Object.entries(processedData).forEach(([sheetName, sheetData]) => {
        const dadosCalculados = sheetData.data.map(row => {
          const novoRow = { ...row };
          
          if (['Ações', 'FIIs', 'Exterior'].includes(sheetName)) {
            const ativo = row.values[0];
            const quantidadeRaw = row.values[1];
            const precoMedioRaw = row.values[2];
            
            // Normalizar números (aceitar vírgula e ponto)
            const quantidade = parseFloat(String(quantidadeRaw).replace(',', '.')) || 0;
            const precoMedio = parseFloat(String(precoMedioRaw).replace(',', '.')) || 0;
            
            if (ativo && quantidade > 0 && precoMedio > 0) {
              const valorInvestido = quantidade * precoMedio;
              const valorAtual = valorInvestido;
              const percentualCarteira = valorTotalCarteira > 0 ? (valorAtual / valorTotalCarteira * 100) : 0;
              
              // Formatação com moeda
              const moeda = sheetName === 'Exterior' ? 'USD' : 'BRL';
              const cotacaoFormatada = sheetName === 'Exterior' 
                ? `US$ ${precoMedio.toFixed(2)}` 
                : `R$ ${precoMedio.toFixed(2)}`;
              const valorInvestidoFormatado = sheetName === 'Exterior' 
                ? `US$ ${valorInvestido.toFixed(2)}` 
                : `R$ ${valorInvestido.toFixed(2)}`;
              const valorAtualFormatado = sheetName === 'Exterior' 
                ? `US$ ${valorAtual.toFixed(2)}` 
                : `R$ ${valorAtual.toFixed(2)}`;
              
              const valoresCompletos = [...row.values];
              valoresCompletos[3] = cotacaoFormatada;
              valoresCompletos[4] = valorInvestidoFormatado;
              valoresCompletos[5] = valorAtualFormatado;
              valoresCompletos[6] = '0%';
              valoresCompletos[7] = `${percentualCarteira.toFixed(2)}%`;
              
              novoRow.values = valoresCompletos;
              novoRow.calculado = true;
              novoRow.resumo = {
                valorInvestido,
                valorAtual,
                percentualCarteira: percentualCarteira.toFixed(2),
                moeda
              };
            }
          } else if (sheetName === 'Renda Fixa') {
            const produto = row.values[0];
            const valorInvestidoRaw = row.values[2];
            const valorInvestido = parseFloat(String(valorInvestidoRaw).replace(',', '.')) || 0;
            
            if (produto && valorInvestido > 0) {
              const valorAtual = valorInvestido;
              const percentualCarteira = valorTotalCarteira > 0 ? (valorAtual / valorTotalCarteira * 100) : 0;
              
              const valoresCompletos = [...row.values];
              valoresCompletos[3] = `R$ ${valorAtual.toFixed(2)}`;
              valoresCompletos[5] = '0%';
              valoresCompletos[6] = `${percentualCarteira.toFixed(2)}%`;
              
              novoRow.values = valoresCompletos;
              novoRow.calculado = true;
              novoRow.resumo = {
                valorInvestido,
                valorAtual,
                percentualCarteira: percentualCarteira.toFixed(2),
                moeda: 'BRL'
              };
            }
          } else if (sheetName === 'Cripto') {
            const cripto = row.values[0];
            const quantidadeRaw = row.values[1];
            const precoMedioRaw = row.values[2];
            
            const quantidade = parseFloat(String(quantidadeRaw).replace(',', '.')) || 0;
            const precoMedio = parseFloat(String(precoMedioRaw).replace(',', '.')) || 0;
            
            if (cripto && quantidade > 0 && precoMedio > 0) {
              const valorAtual = quantidade * precoMedio;
              const percentualCarteira = valorTotalCarteira > 0 ? (valorAtual / valorTotalCarteira * 100) : 0;
              
              const valoresCompletos = [...row.values];
              valoresCompletos[3] = `R$ ${precoMedio.toFixed(2)}`;
              valoresCompletos[4] = `R$ ${valorAtual.toFixed(2)}`;
              valoresCompletos[6] = '0%';
              valoresCompletos[7] = `${percentualCarteira.toFixed(2)}%`;
              
              novoRow.values = valoresCompletos;
              novoRow.calculado = true;
              novoRow.resumo = {
                valorInvestido: valorAtual,
                valorAtual,
                percentualCarteira: percentualCarteira.toFixed(2),
                moeda: 'BRL'
              };
            }
          }
          
          return novoRow;
        });

        dadosComCalculos[sheetName] = {
          ...sheetData,
          data: dadosCalculados
        };
      });

      setPortfolioData(dadosComCalculos);
      setErrors(validationErrors);
      setEtapaAtual(2.5);
      
    } catch (error) {
      setErrors(['Erro ao processar arquivo: ' + error.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Editar célula
  const editCell = (sheetName, rowId, colIndex, newValue) => {
    setPortfolioData(prev => ({
      ...prev,
      [sheetName]: {
        ...prev[sheetName],
        data: prev[sheetName].data.map(row =>
          row.id === rowId
            ? { ...row, values: row.values.map((val, idx) => idx === colIndex ? newValue : val) }
            : row
        )
      }
    }));
  };

  // Remover linha
  const removeRow = (sheetName, rowId) => {
    setPortfolioData(prev => ({
      ...prev,
      [sheetName]: {
        ...prev[sheetName],
        data: prev[sheetName].data.filter(row => row.id !== rowId)
      }
    }));
  };

  // Adicionar linha
  const addRow = (sheetName) => {
    const newId = `${sheetName}_${Date.now()}`;
    const emptyRow = new Array(expectedSheets[sheetName].length).fill('');
    
    setPortfolioData(prev => ({
      ...prev,
      [sheetName]: {
        ...prev[sheetName],
        data: [...(prev[sheetName]?.data || []), {
          id: newId,
          values: emptyRow,
          isValid: false
        }]
      }
    }));
  };

  const handleFileUpload = (file) => {
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setUploadedFile(file);
      processExcelFile(file);
    } else {
      alert('Por favor, envie apenas arquivos Excel (.xlsx ou .xls)');
    }
  };

  const perguntas = [
    {
      id: 'tempoInvestimento',
      pergunta: 'Há quanto tempo investe na bolsa?',
      tipo: 'select',
      opcoes: [
        'Nunca investi',
        'Menos de 1 ano',
        '1-2 anos',
        '3-5 anos',
        '6-10 anos',
        'Mais de 10 anos'
      ]
    },
    {
      id: 'motivoMercado',
      pergunta: 'Qual motivo o(a) levou até o mercado de ativos?',
      tipo: 'textarea'
    },
    {
      id: 'objetivoCarteira',
      pergunta: 'Qual seu objetivo com sua carteira?',
      tipo: 'select',
      opcoes: [
        'Dividendos (renda passiva)',
        'Crescimento (valorização)',
        'Equilibrio (dividendos + crescimento)',
        'Preservação de capital',
        'Aposentadoria',
        'Objetivo específico (casa, viagem, etc.)'
      ]
    },
    {
      id: 'toleranciaOscilacao',
      pergunta: 'Quanto você suportaria ver sua carteira total (% patrimônio líquido) oscilar para baixo?',
      tipo: 'select',
      opcoes: [
        'Até 5%',
        '5% - 10%',
        '10% - 20%',
        '20% - 30%',
        '30% - 50%',
        'Mais de 50%'
      ]
    },
    {
      id: 'comportamentoQueda',
      pergunta: 'Já passou por uma queda muito forte? Qual foi o seu comportamento?',
      tipo: 'textarea'
    },
    {
      id: 'reservaEmergencia',
      pergunta: 'Você já possui reserva de emergência? Onde está alocada?',
      tipo: 'textarea'
    },
    {
      id: 'reservaOportunidade',
      pergunta: 'Já possui uma reserva de oportunidade?',
      tipo: 'select',
      opcoes: [
        'Sim, tenho reserva de oportunidade',
        'Não, mas pretendo criar',
        'Não sei o que é reserva de oportunidade',
        'Não acho necessário'
      ]
    },
    {
      id: 'rendaMensal',
      pergunta: 'Qual sua renda mensal?',
      tipo: 'select',
      opcoes: [
        'Até R$ 2.000',
        'R$ 2.001 - R$ 5.000',
        'R$ 5.001 - R$ 10.000',
        'R$ 10.001 - R$ 20.000',
        'R$ 20.001 - R$ 50.000',
        'Acima de R$ 50.000'
      ]
    },
    {
      id: 'valorAporte',
      pergunta: 'Quanto sobra para aportar todos os meses?',
      tipo: 'select',
      opcoes: [
        'Até R$ 500',
        'R$ 501 - R$ 1.000',
        'R$ 1.001 - R$ 2.000',
        'R$ 2.001 - R$ 5.000',
        'R$ 5.001 - R$ 10.000',
        'Acima de R$ 10.000'
      ]
    },
    {
      id: 'nivelConhecimento',
      pergunta: 'Como você avalia seu conhecimento em relação à bolsa?',
      tipo: 'select',
      opcoes: [
        'Não sei nada',
        'Básico',
        'Intermediário',
        'Avançado',
        'Especialista'
      ]
    }
  ];

  const handleRespostaChange = (id, valor) => {
    setRespostas(prev => ({
      ...prev,
      [id]: valor
    }));
  };

  const todasPerguntasRespondidas = () => {
    return perguntas.every(pergunta => 
      respostas[pergunta.id] && respostas[pergunta.id].trim() !== ''
    );
  };

  const handleSubmit = async () => {
    if (!uploadedFile || !todasPerguntasRespondidas()) return;
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      const dadosValidados = {
        portfolioData: portfolioData,
        questionario: respostas,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        processedAt: new Date().toISOString()
      };
      
      formData.append('dadosValidados', JSON.stringify(dadosValidados));
      formData.append('questionario', JSON.stringify(respostas));
      
      console.log('📋 Enviando dados validados:', dadosValidados);
      
      const response = await fetch('/api/carteiras/upload-validado', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setJaEnviouCarteira(true);
        setEtapaAtual(3);
        
        alert(`Carteira enviada com sucesso!
        
Dados validados processados:
• Abas processadas: ${Object.keys(portfolioData).length}
• Total de ativos: ${Object.values(portfolioData).reduce((total, sheet) => total + (sheet.data?.length || 0), 0)}
• Arquivo: ${uploadedFile.name}
• Status: Dados validados e limpos

Nossa equipe entrará em contato em breve com a análise completa.`);
        
        // Reset
        setRespostas({
          tempoInvestimento: '', motivoMercado: '', objetivoCarteira: '',
          toleranciaOscilacao: '', comportamentoQueda: '', reservaEmergencia: '',
          reservaOportunidade: '', rendaMensal: '', valorAporte: '', nivelConhecimento: ''
        });
        setUploadedFile(null);
        setPortfolioData({});
        setErrors([]);
      } else {
        alert(`Erro: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro no envio:', error);
      alert('Erro ao enviar análise. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const HistoricoCarteiras = () => {
    const [carteiras, setCarteiras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [carteiraExpandida, setCarteiraExpandida] = useState(null);

    useEffect(() => {
      const buscarCarteiras = async () => {
        try {
          const response = await fetch('/api/carteiras/minhas');
          const data = await response.json();
          
          if (response.ok) {
            setCarteiras(data.carteiras);
          }
        } catch (error) {
          console.error('Erro ao buscar carteiras:', error);
        } finally {
          setLoading(false);
        }
      };

      buscarCarteiras();
    }, []);

    const toggleExpansao = (carteiraId) => {
      setCarteiraExpandida(carteiraExpandida === carteiraId ? null : carteiraId);
    };
    
    if (loading) {
      return (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: isMobile ? '12px' : '16px',
          border: '1px solid #e2e8f0',
          padding: isMobile ? '24px' : '32px',
          textAlign: 'center',
          marginTop: isMobile ? '20px' : '32px'
        }}>
          <div style={{ fontSize: isMobile ? '24px' : '32px', marginBottom: '12px' }}>⏳</div>
          <p style={{ color: '#64748b', fontSize: isMobile ? '14px' : '16px' }}>Carregando histórico...</p>
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        padding: isMobile ? '20px' : '32px',
        marginTop: isMobile ? '20px' : '32px'
      }}>
        <h3 style={{ 
          fontSize: isMobile ? '18px' : '24px', 
          fontWeight: '700', 
          color: '#1e293b', 
          marginBottom: isMobile ? '16px' : '24px',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '8px' : '12px'
        }}>
          📊 Minhas Análises de Carteira
        </h3>
        
        {carteiras.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '32px 16px' : '48px',
            backgroundColor: '#f8fafc',
            borderRadius: isMobile ? '8px' : '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: isMobile ? '32px' : '48px', marginBottom: '12px' }}>📈</div>
            <h4 style={{ 
              fontSize: isMobile ? '16px' : '18px', 
              fontWeight: '600', 
              color: '#64748b', 
              margin: '0 0 8px 0' 
            }}>
              Nenhuma carteira enviada ainda
            </h4>
            <p style={{ 
              color: '#64748b', 
              fontSize: isMobile ? '13px' : '14px', 
              margin: 0 
            }}>
              Envie sua primeira carteira para receber uma análise personalizada!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: isMobile ? '16px' : '20px' }}>
            {carteiras.map((carteira) => (
              <div key={carteira.id} style={{
                border: '1px solid #e2e8f0',
                borderRadius: isMobile ? '8px' : '12px',
                backgroundColor: '#f8fafc',
                overflow: 'hidden'
              }}>
                <div 
                  style={{
                    padding: isMobile ? '16px' : '24px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => toggleExpansao(carteira.id)}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'start', 
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{ flex: 1, minWidth: isMobile ? '200px' : 'auto' }}>
                      <h4 style={{ 
                        fontSize: isMobile ? '14px' : '18px', 
                        fontWeight: '600', 
                        color: '#1e293b', 
                        margin: '0 0 6px 0',
                        lineHeight: '1.3'
                      }}>
                        {carteira.nomeArquivo}
                      </h4>
                      <p style={{ 
                        fontSize: isMobile ? '12px' : '14px', 
                        color: '#64748b', 
                        margin: '0'
                      }}>
                        Enviado em: {new Date(carteira.dataEnvio || carteira.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <div style={{
                      padding: isMobile ? '4px 8px' : '8px 16px',
                      borderRadius: '16px',
                      fontSize: isMobile ? '10px' : '12px',
                      fontWeight: '600',
                      backgroundColor: getStatusColor(carteira.status),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ fontSize: isMobile ? '12px' : '14px' }}>
                        {getStatusIcon(carteira.status)}
                      </span>
                      {getStatusText(carteira.status)}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(120px, 1fr))' : 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: isMobile ? '12px' : '16px',
                  }}>
                    <div style={{
                      backgroundColor: '#ffffff',
                      padding: isMobile ? '8px' : '12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ 
                        fontSize: isMobile ? '10px' : '12px', 
                        color: '#64748b', 
                        marginBottom: '3px' 
                      }}>
                        VALOR TOTAL
                      </div>
                      <div style={{ 
                        fontSize: isMobile ? '12px' : '16px', 
                        fontWeight: '700', 
                        color: '#10b981' 
                      }}>
                        {carteira.valorTotal ? 
                          `R$ ${carteira.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                          : 'Processando...'
                        }
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#ffffff',
                      padding: isMobile ? '8px' : '12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ 
                        fontSize: isMobile ? '10px' : '12px', 
                        color: '#64748b', 
                        marginBottom: '3px' 
                      }}>
                        ATIVOS
                      </div>
                      <div style={{ 
                        fontSize: isMobile ? '12px' : '16px', 
                        fontWeight: '700', 
                        color: '#3b82f6' 
                      }}>
                        {carteira.quantidadeAtivos || 'Processando...'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (carregandoVerificacao) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px'
      }}>
        <div style={{ fontSize: isMobile ? '32px' : '48px' }}>⏳</div>
        <p style={{ 
          color: '#64748b', 
          fontSize: isMobile ? '14px' : '16px', 
          textAlign: 'center' 
        }}>
          Carregando suas análises...
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      padding: isMobile ? '12px' : '24px'
    }}>
      <div style={{ marginBottom: isMobile ? '20px' : '32px' }}>
        <h1 style={{ 
          fontSize: isMobile ? '24px' : '48px', 
          fontWeight: '800', 
          color: '#1e293b',
          margin: '0 0 8px 0',
          lineHeight: '1.2'
        }}>
          {jaEnviouCarteira ? 'Minhas Análises de Carteira' : 'Análise de Carteira Personalizada'}
        </h1>
        <p style={{ 
          color: '#64748b', 
          fontSize: isMobile ? '14px' : '18px',
          margin: '0',
          lineHeight: '1.5'
        }}>
          {jaEnviouCarteira 
            ? 'Acompanhe o status e resultados da sua análise de carteira'
            : 'Responda algumas perguntas e envie sua carteira para receber uma análise completa'
          }
        </p>
      </div>

      {!jaEnviouCarteira && (
        <>
          {/* Progress Bar */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: isMobile ? '8px' : '12px',
            padding: isMobile ? '16px' : '20px',
            marginBottom: isMobile ? '20px' : '32px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: isMobile ? '8px' : '16px',
              flexWrap: 'wrap'
            }}>
              {[
                { numero: 1, titulo: 'Questionário', ativo: etapaAtual === 1 },
                { numero: 2, titulo: 'Upload', ativo: etapaAtual === 2 },
                { numero: 2.5, titulo: 'Validação', ativo: etapaAtual === 2.5 },
                { numero: 3, titulo: 'Enviado', ativo: etapaAtual === 3 }
              ].map((etapa, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
                  <div style={{
                    width: isMobile ? '24px' : '32px',
                    height: isMobile ? '24px' : '32px',
                    borderRadius: '50%',
                    backgroundColor: etapa.ativo ? '#3b82f6' : (etapaAtual > etapa.numero ? '#10b981' : '#e2e8f0'),
                    color: etapa.ativo || etapaAtual > etapa.numero ? 'white' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: isMobile ? '11px' : '14px'
                  }}>
                    {etapaAtual > etapa.numero ? '✓' : etapa.numero === 2.5 ? '🔍' : etapa.numero}
                  </div>
                  <span style={{
                    fontWeight: '600',
                    color: etapa.ativo ? '#3b82f6' : (etapaAtual > etapa.numero ? '#10b981' : '#64748b'),
                    fontSize: isMobile ? '12px' : '16px'
                  }}>
                    {etapa.titulo}
                  </span>
                  {index < 3 && (
                    <div style={{
                      width: isMobile ? '20px' : '40px',
                      height: '2px',
                      backgroundColor: etapaAtual > etapa.numero ? '#10b981' : '#e2e8f0'
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Etapa 1: Questionário */}
          {etapaAtual === 1 && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: isMobile ? '12px' : '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              padding: isMobile ? '20px' : '32px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '32px' }}>
                <div style={{ fontSize: isMobile ? '32px' : '48px', marginBottom: '12px' }}>📋</div>
                <h2 style={{
                  fontSize: isMobile ? '20px' : '28px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 8px 0'
                }}>
                  Questionário de Perfil
                </h2>
                <p style={{
                  color: '#64748b',
                  fontSize: isMobile ? '14px' : '16px',
                  margin: '0'
                }}>
                  Essas informações nos ajudam a fazer uma análise mais precisa e personalizada
                </p>
              </div>

              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {perguntas.map((pergunta, index) => (
                  <div key={pergunta.id} style={{
                    marginBottom: isMobile ? '24px' : '32px',
                    padding: isMobile ? '16px' : '24px',
                    backgroundColor: '#f8fafc',
                    borderRadius: isMobile ? '8px' : '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '8px',
                      lineHeight: '1.4'
                    }}>
                      {index + 1}. {pergunta.pergunta}
                    </label>
                    
                    {pergunta.tipo === 'select' ? (
                      <select
                        value={respostas[pergunta.id]}
                        onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: isMobile ? '10px' : '12px',
                          fontSize: isMobile ? '13px' : '14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <option value="">Selecione uma opção...</option>
                        {pergunta.opcoes.map((opcao, i) => (
                          <option key={i} value={opcao}>{opcao}</option>
                        ))}
                      </select>
                    ) : (
                      <textarea
                        value={respostas[pergunta.id]}
                        onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
                        placeholder="Digite sua resposta..."
                        style={{
                          width: '100%',
                          minHeight: isMobile ? '60px' : '80px',
                          padding: isMobile ? '10px' : '12px',
                          fontSize: isMobile ? '13px' : '14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                      />
                    )}
                  </div>
                ))}

                <div style={{ textAlign: 'center', marginTop: isMobile ? '24px' : '32px' }}>
                  <button
                    onClick={() => setEtapaAtual(2)}
                    disabled={!todasPerguntasRespondidas()}
                    style={{
                      backgroundColor: todasPerguntasRespondidas() ? '#3b82f6' : '#9ca3af',
                      color: 'white',
                      padding: isMobile ? '12px 24px' : '16px 32px',
                      borderRadius: isMobile ? '8px' : '12px',
                      border: 'none',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '700',
                      cursor: todasPerguntasRespondidas() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      margin: '0 auto',
                      transition: 'all 0.2s'
                    }}
                  >
                    Próximo: Upload da Carteira →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 2: Upload */}
          {etapaAtual === 2 && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: isMobile ? '12px' : '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              padding: isMobile ? '20px' : '32px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '32px' }}>
                <div style={{ fontSize: isMobile ? '32px' : '48px', marginBottom: '12px' }}>📊</div>
                <h2 style={{
                  fontSize: isMobile ? '20px' : '28px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 8px 0'
                }}>
                  Envie sua Carteira de Investimentos
                </h2>
                <p style={{
                  color: '#64748b',
                  fontSize: isMobile ? '14px' : '16px',
                  margin: '0'
                }}>
                  Use nosso modelo para organizar seus investimentos
                </p>
              </div>

              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #3b82f6',
                borderRadius: isMobile ? '8px' : '12px',
                padding: isMobile ? '16px' : '24px',
                marginBottom: isMobile ? '20px' : '32px',
                textAlign: 'center'
              }}>
                <h3 style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: '700',
                  color: '#1e40af',
                  margin: '0 0 8px 0'
                }}>
                  Baixe o Modelo Simplificado
                </h3>
                <p style={{
                  color: '#1e40af',
                  fontSize: isMobile ? '13px' : '14px',
                  marginBottom: '12px',
                  lineHeight: '1.4'
                }}>
                  Apenas os campos essenciais: código do ativo, quantidade e preço médio
                </p>
                <button
                  onClick={downloadTemplate}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: isMobile ? '10px 20px' : '12px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    margin: '0 auto'
                  }}
                >
                  Baixar Modelo Excel Completo
                </button>
              </div>

              <div style={{
                border: '2px dashed #d1d5db',
                borderRadius: isMobile ? '8px' : '12px',
                padding: isMobile ? '24px 16px' : '48px',
                textAlign: 'center',
                backgroundColor: uploadedFile ? '#f0fdf4' : '#fafafa',
                borderColor: uploadedFile ? '#10b981' : '#d1d5db',
                marginBottom: isMobile ? '20px' : '24px'
              }}>
                {isProcessing ? (
                  <div>
                    <div style={{ fontSize: isMobile ? '32px' : '48px', marginBottom: '12px' }}>⏳</div>
                    <div style={{ 
                      fontWeight: '700', 
                      color: '#3b82f6', 
                      fontSize: isMobile ? '14px' : '18px', 
                      marginBottom: '6px'
                    }}>
                      Processando e validando dados...
                    </div>
                  </div>
                ) : uploadedFile ? (
                  <div>
                    <div style={{ fontSize: isMobile ? '32px' : '48px', marginBottom: '12px' }}>✅</div>
                    <div style={{ 
                      fontWeight: '700', 
                      color: '#1e293b', 
                      fontSize: isMobile ? '14px' : '18px', 
                      marginBottom: '6px'
                    }}>
                      {uploadedFile.name}
                    </div>
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setPortfolioData({});
                        setErrors([]);
                        setEtapaAtual(2);
                      }}
                      style={{
                        color: '#ef4444',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: isMobile ? '12px' : '14px',
                        textDecoration: 'underline'
                      }}
                    >
                      Enviar outro arquivo
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: isMobile ? '32px' : '48px', marginBottom: '12px' }}>📎</div>
                    <label style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: isMobile ? '10px 20px' : '12px 24px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '600',
                      border: 'none',
                      display: 'inline-block'
                    }}>
                      Escolher arquivo
                      <input
                        type="file"
                        style={{ display: 'none' }}
                        accept=".xlsx,.xls"
                        onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                      />
                    </label>
                    <div style={{ 
                      fontSize: isMobile ? '11px' : '12px', 
                      color: '#64748b', 
                      marginTop: '8px' 
                    }}>
                      Formatos aceitos: .xlsx, .xls (máximo 10MB)
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => setEtapaAtual(1)}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    padding: isMobile ? '10px 16px' : '12px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ← Voltar
                </button>
              </div>
            </div>
          )}

          {/* Etapa 2.5: Validação */}
          {etapaAtual === 2.5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: isMobile ? '12px' : '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                padding: isMobile ? '20px' : '32px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{
                    fontSize: isMobile ? '20px' : '28px',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: 0
                  }}>
                    🔍 Validação dos Dados
                  </h2>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 16px',
                      fontSize: '14px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {showPreview ? 'Ocultar' : 'Visualizar'} Dados
                  </button>
                </div>

                {errors.length > 0 && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626', margin: '0 0 8px 0' }}>
                      ⚠️ Problemas encontrados:
                    </h3>
                    <ul style={{ fontSize: '14px', color: '#dc2626', margin: 0, paddingLeft: '20px' }}>
                      {errors.map((error, index) => (
                        <li key={index} style={{ marginBottom: '4px' }}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    backgroundColor: '#eff6ff',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '14px', color: '#2563eb', fontWeight: '600', margin: '0 0 4px 0' }}>Abas Processadas</p>
                    <p style={{ fontSize: '32px', fontWeight: '800', color: '#1e40af', margin: 0 }}>
                      {Object.keys(portfolioData).length}
                    </p>
                  </div>
                  <div style={{
                    backgroundColor: '#f0fdf4',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '14px', color: '#16a34a', fontWeight: '600', margin: '0 0 4px 0' }}>Total de Ativos</p>
                    <p style={{ fontSize: '32px', fontWeight: '800', color: '#15803d', margin: 0 }}>
                      {Object.values(portfolioData).reduce((total, sheet) => total + (sheet.data?.filter(row => row.resumo).length || 0), 0)}
                    </p>
                  </div>
                  <div style={{
                    backgroundColor: '#fef2f2',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '14px', color: '#dc2626', fontWeight: '600', margin: '0 0 4px 0' }}>Erros Encontrados</p>
                    <p style={{ fontSize: '32px', fontWeight: '800', color: '#dc2626', margin: 0 }}>
                      {errors.length}
                    </p>
                  </div>
                  <div style={{
                    backgroundColor: '#fefce8',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '14px', color: '#ca8a04', fontWeight: '600', margin: '0 0 4px 0' }}>Valor Total</p>
                    <p style={{ fontSize: '20px', fontWeight: '800', color: '#a16207', margin: 0 }}>
                      R$ {Object.values(portfolioData).reduce((total, sheet) => {
                        return total + (sheet.data?.reduce((sheetTotal, row) => {
                          return sheetTotal + (row.resumo?.valorAtual || 0);
                        }, 0) || 0);
                      }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div style={{
                  backgroundColor: errors.length === 0 ? '#f0fdf4' : '#fefce8',
                  border: `1px solid ${errors.length === 0 ? '#16a34a' : '#ca8a04'}`,
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: errors.length === 0 ? '#15803d' : '#a16207',
                    margin: 0
                  }}>
                    {errors.length === 0 
                      ? '✅ Dados validados com sucesso! Você pode enviar sua carteira.' 
                      : '⚠️ Corrija os erros acima antes de enviar.'
                    }
                  </p>
                </div>
              </div>

              {/* Tabelas editáveis */}
              {showPreview && Object.entries(portfolioData).map(([sheetName, sheetData]) => (
                <div key={sheetName} style={{
                  backgroundColor: '#ffffff',
                  borderRadius: isMobile ? '12px' : '16px',
                  border: '1px solid #e2e8f0',
                  padding: isMobile ? '20px' : '32px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                      📊 {sheetName}
                    </h3>
                    <button
                      onClick={() => addRow(sheetName)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '14px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      + Adicionar
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                          {sheetData.headers?.map((header, index) => (
                            <th key={index} style={{
                              padding: '12px 8px',
                              textAlign: 'left',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#6b7280',
                              borderBottom: '1px solid #e5e7eb'
                            }}>
                              {header}
                            </th>
                          ))}
                          <th style={{
                            padding: '12px 8px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#6b7280',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheetData.data?.map((row) => (
                          <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            {row.values.map((value, colIndex) => (
                              <td key={colIndex} style={{ padding: '8px', fontSize: '14px' }}>
                                {editingCell === `${row.id}_${colIndex}` ? (
                                  <input
                                    type="text"
                                    value={value || ''}
                                    onChange={(e) => editCell(sheetName, row.id, colIndex, e.target.value)}
                                    onBlur={() => setEditingCell(null)}
                                    onKeyPress={(e) => e.key === 'Enter' && setEditingCell(null)}
                                    style={{
                                      width: '100%',
                                      padding: '4px 8px',
                                      fontSize: '14px',
                                      border: '2px solid #3b82f6',
                                      borderRadius: '4px',
                                      outline: 'none'
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <div
                                    onClick={() => setEditingCell(`${row.id}_${colIndex}`)}
                                    style={{
                                      cursor: 'pointer',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      minHeight: '20px'
                                    }}
                                  >
                                    {value || '-'}
                                  </div>
                                )}
                              </td>
                            ))}
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button
                                onClick={() => removeRow(sheetName, row.id)}
                                style={{
                                  color: '#dc2626',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '16px'
                                }}
                              >
                                ❌
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: isMobile ? '12px' : '16px',
                border: '1px solid #e2e8f0',
                padding: isMobile ? '20px' : '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px'
              }}>
                <button
                  onClick={() => {
                    setEtapaAtual(2);
                    setPortfolioData({});
                    setErrors([]);
                  }}
                  style={{
                    padding: isMobile ? '10px 16px' : '12px 24px',
                    border: '1px solid #d1d5db',
                    color: '#374151',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '600'
                  }}
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={errors.length > 0 || isSubmitting}
                  style={{
                    padding: isMobile ? '12px 24px' : '16px 32px',
                    backgroundColor: errors.length === 0 && !isSubmitting ? '#10b981' : '#9ca3af',
                    color: 'white',
                    borderRadius: isMobile ? '8px' : '12px',
                    border: 'none',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '700',
                    cursor: errors.length === 0 && !isSubmitting ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span>⏳</span>
                      Enviando...
                    </>
                  ) : (
                    <>
                      🚀 Enviar para Análise
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Etapa 3: Enviado */}
          {etapaAtual === 3 && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: isMobile ? '12px' : '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              padding: isMobile ? '32px 20px' : '48px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: isMobile ? '48px' : '64px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{
                fontSize: isMobile ? '24px' : '32px',
                fontWeight: '800',
                color: '#10b981',
                margin: '0 0 12px 0'
              }}>
                Análise Enviada com Sucesso!
              </h2>
              <p style={{
                color: '#64748b',
                fontSize: isMobile ? '14px' : '18px',
                margin: '0 0 24px 0',
                lineHeight: '1.6'
              }}>
                Recebemos seus dados validados. Nossa equipe irá analisar e enviar feedback em até 48 horas.
              </p>
              
              <button
                onClick={() => {
                  setEtapaAtual(1);
                  setRespostas({
                    tempoInvestimento: '', motivoMercado: '', objetivoCarteira: '',
                    toleranciaOscilacao: '', comportamentoQueda: '', reservaEmergencia: '',
                    reservaOportunidade: '', rendaMensal: '', valorAporte: '', nivelConhecimento: ''
                  });
                  setUploadedFile(null);
                  setPortfolioData({});
                  setErrors([]);
                }}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: isMobile ? '10px 20px' : '12px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🔄 Nova Análise
              </button>
            </div>
          )}
        </>
      )}

      <HistoricoCarteiras />
    </div>
  );
}

export default AnaliseCarteiraClientePage;