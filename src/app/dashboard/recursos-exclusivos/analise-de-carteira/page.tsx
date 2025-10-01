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
  const [portfolioData, setPortfolioData] = useState({
    groups: {},
    totals: {
      totalCarteira: 0,
      totalAtivos: 0
    }
  });
  const [rawPortfolioRows, setRawPortfolioRows] = useState([]);
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

  const BASE_HEADERS = ['ATIVO', 'CATEGORIA', 'QTDE', 'PREÇO MÉDIO', 'VALOR INVESTIDO', '% DA CARTEIRA'];

  const expectedHeaders = [
    {
      key: 'ativo',
      labels: ['ATIVO', 'TICKER', 'CÓDIGO', 'CODIGO'],
      required: true
    },
    {
      key: 'categoria',
      labels: ['CATEGORIA', 'CLASSE', 'TIPO'],
      required: false
    },
    {
      key: 'quantidade',
      labels: ['QTDE', 'QUANTIDADE', 'QTD'],
      required: true
    },
    {
      key: 'precoMedio',
      labels: ['PREÇO MÉDIO', 'PRECO MEDIO', 'PREÇO MEDIO', 'PRECO MÉDIO'],
      required: true
    }
  ];

  const ignoredSheetNames = ['planilha1', 'sheet1'];

  const groupDisplayNames = {
    acoes: 'Ações',
    fiis: 'FIIs',
    rendaFixa: 'Renda Fixa',
    cripto: 'Criptomoedas',
    exterior: 'Exterior',
    fundos: 'Fundos',
    outros: 'Outros'
  };

  const categoryGroupMap = {
    acoes: 'acoes',
    acao: 'acoes',
    'renda variavel': 'acoes',
    fiis: 'fiis',
    fii: 'fiis',
    'fundo imobiliario': 'fiis',
    'fundos imobiliarios': 'fiis',
    'tesouro direto': 'rendaFixa',
    'tesouro selic': 'rendaFixa',
    'tesouro ipca': 'rendaFixa',
    'renda fixa': 'rendaFixa',
    cdb: 'rendaFixa',
    lci: 'rendaFixa',
    lca: 'rendaFixa',
    cri: 'rendaFixa',
    cra: 'rendaFixa',
    poupanca: 'rendaFixa',
    'cripto': 'cripto',
    'criptomoeda': 'cripto',
    'criptomoedas': 'cripto',
    bitcoin: 'cripto',
    ethereum: 'cripto',
    stock: 'exterior',
    stocks: 'exterior',
    reits: 'exterior',
    reit: 'exterior',
    adr: 'exterior',
    bdr: 'exterior',
    'acoes internacionais': 'exterior',
    exterior: 'exterior',
    'fundos': 'fundos',
    'fundo de investimento': 'fundos',
    'fundos de investimento': 'fundos',
    'fundos multimercado': 'fundos',
    etf: 'fundos'
  };

  const normalizeText = (text) => {
    if (text === null || text === undefined) return '';
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  };

  const mapCategoryToGroup = (category) => {
    const normalized = normalizeText(category);
    if (!normalized) return 'outros';
    if (categoryGroupMap[normalized]) return categoryGroupMap[normalized];

    const normalizedNoSpace = normalized.replace(/\s/g, '');
    if (categoryGroupMap[normalizedNoSpace]) return categoryGroupMap[normalizedNoSpace];

    const match = Object.keys(categoryGroupMap).find(key => normalized.includes(key) || normalizedNoSpace.includes(key));
    return match ? categoryGroupMap[match] : 'outros';
  };

  const deriveCategoryFromSheetName = (sheetName) => {
    const normalizedSheetName = normalizeText(sheetName);
    if (!normalizedSheetName) return '';

    const normalizedGroupEntries = Object.entries(groupDisplayNames).map(([groupKey, displayName]) => ({
      groupKey,
      displayName,
      normalizedDisplay: normalizeText(displayName)
    }));

    const directDisplayMatch = normalizedGroupEntries.find(({ normalizedDisplay }) =>
      normalizedDisplay && normalizedSheetName.includes(normalizedDisplay)
    );
    if (directDisplayMatch) {
      return directDisplayMatch.displayName;
    }

    const categoryGroupMatch = Object.entries(categoryGroupMap).find(([rawCategoryKey, groupKey]) => {
      const normalizedCategoryKey = normalizeText(rawCategoryKey);
      if (!normalizedCategoryKey) return false;
      return normalizedSheetName.includes(normalizedCategoryKey) || normalizedSheetName.replace(/\s/g, '').includes(normalizedCategoryKey);
    });

    if (categoryGroupMatch) {
      const [, groupKey] = categoryGroupMatch;
      return groupDisplayNames[groupKey] || groupKey;
    }

    return '';
  };

  const parseNumber = (value) => {
    if (value === null || value === undefined) return NaN;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : NaN;
    }

    const stringValue = String(value).trim();
    if (!stringValue) return NaN;

    const sanitized = stringValue.replace(/[^0-9,.-]/g, '');
    if (!sanitized) return NaN;

    const usesCommaAsDecimal = sanitized.includes(',');
    const normalized = usesCommaAsDecimal
      ? sanitized.replace(/\./g, '').replace(',', '.')
      : sanitized;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  };

  const formatCurrency = (value, currency = 'BRL') => {
    if (!Number.isFinite(value)) return '';
    try {
      return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', {
        style: 'currency',
        currency
      }).format(value);
    } catch (error) {
      return value.toFixed(2);
    }
  };

  const createGroup = (groupKey) => ({
    key: groupKey,
    displayName: groupDisplayNames[groupKey] || groupKey,
    headers: BASE_HEADERS,
    data: [],
    totalInvestido: 0,
    percentualCarteira: 0
  });

  const buildPortfolioStructure = (rows) => {
    const groups = {};
    const errorsColetados = [];
    let valorTotalCarteira = 0;
    let totalAtivosValidos = 0;

    const obterGrupo = (groupKey) => {
      if (!groups[groupKey]) {
        groups[groupKey] = createGroup(groupKey);
      }
      return groups[groupKey];
    };

    const toTrimmedString = (value) => {
      if (value === null || value === undefined) return '';
      return String(value).trim();
    };

    rows.forEach((row, index) => {
      const ativo = toTrimmedString(row.ativo);
      const categoria = toTrimmedString(row.categoria);
      const qtdeRaw = row.qtde ?? row.quantidade ?? '';
      const precoMedioRaw = row.precoMedio ?? row.preco ?? '';
      const qtdeTexto = toTrimmedString(qtdeRaw);
      const precoTexto = toTrimmedString(precoMedioRaw);
      const isEmptyRow = !ativo && !categoria && !qtdeTexto && !precoTexto;

      if (isEmptyRow && !row.isDraft) {
        return;
      }

      const groupKey = mapCategoryToGroup(categoria);
      const grupo = obterGrupo(groupKey);

      const quantidade = parseNumber(qtdeRaw);
      const precoMedio = parseNumber(precoMedioRaw);
      const linhaReferencia = row.sourceRowNumber || index + 1;

      const deveValidar = !row.isDraft;

      if (deveValidar) {
        if (!ativo) {
          errorsColetados.push(`Linha ${linhaReferencia}: Campo ATIVO não pode estar vazio.`);
        }
        if (!categoria) {
          errorsColetados.push(`Linha ${linhaReferencia}: Campo CATEGORIA não pode estar vazio.`);
        }
        if (Number.isNaN(quantidade)) {
          errorsColetados.push(`Linha ${linhaReferencia}: Valor de QTDE inválido (${qtdeRaw || 'vazio'}).`);
        }
        if (Number.isNaN(precoMedio)) {
          errorsColetados.push(`Linha ${linhaReferencia}: Valor de PREÇO MÉDIO inválido (${precoMedioRaw || 'vazio'}).`);
        }
      }

      const moeda = groupKey === 'exterior' ? 'USD' : 'BRL';
      const valorInvestido = !Number.isNaN(quantidade) && !Number.isNaN(precoMedio)
        ? quantidade * precoMedio
        : 0;

      if (valorInvestido > 0) {
        grupo.totalInvestido += valorInvestido;
        valorTotalCarteira += valorInvestido;
        totalAtivosValidos += 1;
      }

      grupo.data.push({
        id: row.id,
        values: [
          ativo,
          categoria,
          qtdeRaw ?? '',
          precoMedioRaw ?? '',
          valorInvestido > 0 ? formatCurrency(valorInvestido, moeda) : '',
          ''
        ],
        isValid: deveValidar
          ? Boolean(ativo && categoria && !Number.isNaN(quantidade) && !Number.isNaN(precoMedio))
          : false,
        resumo: {
          valorInvestido,
          quantidade: Number.isNaN(quantidade) ? null : quantidade,
          precoMedio: Number.isNaN(precoMedio) ? null : precoMedio,
          percentualCarteira: '0.00',
          moeda
        },
        sourceRowNumber: row.sourceRowNumber
      });
    });

    Object.values(groups).forEach((grupo) => {
      const percentualGrupo = valorTotalCarteira > 0
        ? (grupo.totalInvestido / valorTotalCarteira) * 100
        : 0;
      grupo.percentualCarteira = percentualGrupo;

      grupo.data = grupo.data.map((linha) => {
        const percentualLinha = linha.resumo.valorInvestido > 0 && valorTotalCarteira > 0
          ? (linha.resumo.valorInvestido / valorTotalCarteira) * 100
          : 0;

        return {
          ...linha,
          values: [
            linha.values[0],
            linha.values[1],
            linha.values[2],
            linha.values[3],
            linha.resumo.valorInvestido > 0
              ? formatCurrency(linha.resumo.valorInvestido, linha.resumo.moeda)
              : linha.values[4],
            linha.resumo.valorInvestido > 0 ? `${percentualLinha.toFixed(2)}%` : ''
          ],
          resumo: {
            ...linha.resumo,
            percentualCarteira: percentualLinha.toFixed(2)
          }
        };
      });
    });

    return {
      groups,
      totals: {
        totalCarteira: valorTotalCarteira,
        totalAtivos: totalAtivosValidos
      },
      errors: errorsColetados
    };
  };

  const updatePortfolioFromRows = (rows) => {
    const { groups, totals, errors: validationErrors } = buildPortfolioStructure(rows);
    setPortfolioData({ groups, totals });
    setErrors(validationErrors);
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

      const prioritizedSheetNames = (() => {
        const filtered = workbook.SheetNames.filter((name) => !ignoredSheetNames.includes(name.trim().toLowerCase()));
        return filtered.length > 0 ? filtered : workbook.SheetNames;
      })();

      const coletarPlanilhasValidas = (sheetNames) => {
        const resultado = [];

        for (const sheetName of sheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) continue;

          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });

          for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
            const row = jsonData[rowIndex];
            if (!row || row.length === 0) continue;

            const normalizedCells = row.map((cell) => normalizeText(cell));
            const headerMapCandidate = {};

            expectedHeaders.forEach((header) => {
              const foundIndex = normalizedCells.findIndex((cell) =>
                header.labels.some((label) => {
                  const normalizedLabel = normalizeText(label);
                  return normalizedLabel && cell.includes(normalizedLabel);
                })
              );

              if (foundIndex !== -1) {
                headerMapCandidate[header.key] = foundIndex;
              }
            });

            const allRequiredPresent = expectedHeaders
              .filter((header) => header.required)
              .every((header) => headerMapCandidate[header.key] !== undefined);

            if (allRequiredPresent) {
              resultado.push({
                sheetName,
                headerRowIndex: rowIndex,
                headerColumnMap: headerMapCandidate,
                jsonData
              });
              break;
            }
          }
        }

        return resultado;
      };

      let planilhasValidas = coletarPlanilhasValidas(prioritizedSheetNames);

      if (planilhasValidas.length === 0 && prioritizedSheetNames.length !== workbook.SheetNames.length) {
        planilhasValidas = coletarPlanilhasValidas(workbook.SheetNames);
      }

      if (planilhasValidas.length === 0) {
        setErrors(['Não foi possível localizar uma aba com os cabeçalhos ATIVO, QTDE e PREÇO MÉDIO.']);
        setPortfolioData({
          groups: {},
          totals: {
            totalCarteira: 0,
            totalAtivos: 0
          }
        });
        setRawPortfolioRows([]);
        setEtapaAtual(1);
        return;
      }

      const linhasProcessadas = [];

      planilhasValidas.forEach(({ sheetName, headerRowIndex, headerColumnMap, jsonData }) => {
        const linhasDados = jsonData.slice(headerRowIndex + 1);
        const fallbackCategoria = deriveCategoryFromSheetName(sheetName);

        linhasDados.forEach((row, rowIndex) => {
          if (!row) return;

          const ativo = headerColumnMap.ativo !== undefined ? row[headerColumnMap.ativo] : '';
          const categoriaDaLinha = headerColumnMap.categoria !== undefined
            ? row[headerColumnMap.categoria]
            : fallbackCategoria;
          const qtde = headerColumnMap.quantidade !== undefined ? row[headerColumnMap.quantidade] : '';
          const precoMedio = headerColumnMap.precoMedio !== undefined ? row[headerColumnMap.precoMedio] : '';

          const hasCoreContent = [ativo, qtde, precoMedio].some((valor) => {
            if (valor === null || valor === undefined) return false;
            return String(valor).trim() !== '';
          });

          const hasContent = hasCoreContent || (categoriaDaLinha && String(categoriaDaLinha).trim() !== '');

          if (!hasContent || !hasCoreContent) {
            return;
          }

          const normalizedSheetId = normalizeText(sheetName).replace(/\s+/g, '-');

          linhasProcessadas.push({
            id: `linha_${normalizedSheetId}_${headerRowIndex + rowIndex + 2}_${rowIndex}`,
            ativo,
            categoria: categoriaDaLinha,
            qtde,
            precoMedio,
            sourceRowNumber: headerRowIndex + rowIndex + 2,
            sheetName
          });
        });
      });

      updatePortfolioFromRows(linhasProcessadas);
      setRawPortfolioRows(linhasProcessadas);
      setEtapaAtual(2.5);

    } catch (error) {
      setErrors(['Erro ao processar arquivo: ' + error.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  const editCell = (_groupKey, rowId, colIndex, newValue) => {
    if (colIndex >= 4) {
      return;
    }

    setRawPortfolioRows((prevRows) => {
      const updatedRows = prevRows.map((row) => {
        if (row.id !== rowId) return row;

        const updatedRow = { ...row };

        if (colIndex === 0) updatedRow.ativo = newValue;
        if (colIndex === 1) updatedRow.categoria = newValue;
        if (colIndex === 2) updatedRow.qtde = newValue;
        if (colIndex === 3) updatedRow.precoMedio = newValue;

        if (updatedRow.isDraft) {
          const hasAllRequired = [updatedRow.ativo, updatedRow.categoria, updatedRow.qtde, updatedRow.precoMedio].every((valor) => {
            if (valor === null || valor === undefined) return false;
            return String(valor).trim() !== '';
          });

          if (hasAllRequired) {
            updatedRow.isDraft = false;
          }
        }

        return updatedRow;
      });

      updatePortfolioFromRows(updatedRows);
      return updatedRows;
    });
  };

  const removeRow = (_groupKey, rowId) => {
    setRawPortfolioRows((prevRows) => {
      const updatedRows = prevRows.filter((row) => row.id !== rowId);
      updatePortfolioFromRows(updatedRows);
      if (editingCell && editingCell.startsWith(`${rowId}_`)) {
        setEditingCell(null);
      }
      return updatedRows;
    });
  };

  const addRow = (groupKey) => {
    const newRow = {
      id: `${groupKey}_${Date.now()}`,
      ativo: '',
      categoria: groupDisplayNames[groupKey] || '',
      qtde: '',
      precoMedio: '',
      isDraft: true
    };

    setRawPortfolioRows((prevRows) => {
      const updatedRows = [...prevRows, newRow];
      updatePortfolioFromRows(updatedRows);
      return updatedRows;
    });
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
        portfolioData,
        portfolioRows: rawPortfolioRows,
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
        
        const totalGrupos = Object.keys(portfolioData.groups || {}).length;
        const totalAtivos = portfolioData.totals?.totalAtivos || 0;
        const valorTotalCarteira = portfolioData.totals?.totalCarteira || 0;

        alert(`Carteira enviada com sucesso!

Dados validados processados:
• Grupos identificados: ${totalGrupos}
• Total de ativos válidos: ${totalAtivos}
• Valor total da carteira: R$ ${valorTotalCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
        setPortfolioData({
          groups: {},
          totals: {
            totalCarteira: 0,
            totalAtivos: 0
          }
        });
        setRawPortfolioRows([]);
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
        setPortfolioData({
          groups: {},
          totals: {
            totalCarteira: 0,
            totalAtivos: 0
          }
        });
        setRawPortfolioRows([]);
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
                    <p style={{ fontSize: '14px', color: '#2563eb', fontWeight: '600', margin: '0 0 4px 0' }}>Grupos Processados</p>
                    <p style={{ fontSize: '32px', fontWeight: '800', color: '#1e40af', margin: 0 }}>
                      {Object.keys(portfolioData.groups || {}).length}
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
                      {portfolioData.totals?.totalAtivos || 0}
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
                      R$ {(portfolioData.totals?.totalCarteira || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              {showPreview && Object.entries(portfolioData.groups || {}).map(([groupKey, groupData]) => (
                <div key={groupKey} style={{
                  backgroundColor: '#ffffff',
                  borderRadius: isMobile ? '12px' : '16px',
                  border: '1px solid #e2e8f0',
                  padding: isMobile ? '20px' : '32px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                      📊 {groupData.displayName || groupKey}
                    </h3>
                    <button
                      onClick={() => addRow(groupKey)}
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
                          {groupData.headers?.map((header, index) => (
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
                        {groupData.data?.map((row) => (
                          <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            {row.values.map((value, colIndex) => {
                              const isEditable = colIndex < 4;
                              const cellKey = `${row.id}_${colIndex}`;
                              return (
                                <td key={colIndex} style={{ padding: '8px', fontSize: '14px' }}>
                                {isEditable && editingCell === cellKey ? (
                                  <input
                                    type="text"
                                    value={value || ''}
                                    onChange={(e) => editCell(groupKey, row.id, colIndex, e.target.value)}
                                    onBlur={() => setEditingCell(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
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
                                    onClick={() => {
                                      if (isEditable) {
                                        setEditingCell(cellKey);
                                      }
                                    }}
                                    style={{
                                      cursor: isEditable ? 'pointer' : 'default',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      minHeight: '20px'
                                    }}
                                  >
                                    {value || '-'}
                                  </div>
                                )}
                                </td>
                              );
                            })}
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button
                                onClick={() => removeRow(groupKey, row.id)}
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
                    setPortfolioData({
                      groups: {},
                      totals: {
                        totalCarteira: 0,
                        totalAtivos: 0
                      }
                    });
                    setRawPortfolioRows([]);
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
                  setPortfolioData({
                    groups: {},
                    totals: {
                      totalCarteira: 0,
                      totalAtivos: 0
                    }
                  });
                  setRawPortfolioRows([]);
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