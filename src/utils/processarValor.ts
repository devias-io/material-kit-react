/**
 * Processa valores monetários em formato brasileiro ou americano
 * Versão corrigida que resolve problemas de conversão
 */

const BRAZILIAN_PATTERN = /^-?\d{1,3}(\.\d{3})*,\d+$/;
const AMERICAN_PATTERN = /^-?\d{1,3}(,\d{3})*\.\d+$/;

const DIGITOS_COM_PONTOS_PATTERN = /^\d{1,3}(\.\d{3})+$/;

const normalizarDecimalComVirgula = (entrada: string): string => {
  const negativo = entrada.startsWith('-');
  const semSinal = negativo ? entrada.slice(1) : entrada;
  const ultimaVirgula = semSinal.lastIndexOf(',');
  
  if (ultimaVirgula === -1) {
    return entrada;
  }
  
  const parteInteira = semSinal.slice(0, ultimaVirgula).replace(/[^\d]/g, '');
  const parteDecimal = semSinal.slice(ultimaVirgula + 1).replace(/[^\d]/g, '');
  
  if (parteDecimal.length === 0) {
    return `${negativo ? '-' : ''}${parteInteira || '0'}`;
  }
  
  return `${negativo ? '-' : ''}${parteInteira || '0'}.${parteDecimal}`;
};

export const processarValor = (valorRaw: string | number): number => {
  // Tratar casos nulos/vazios
  if (valorRaw === null || valorRaw === undefined || valorRaw === '') {
    return 0;
  }
  
  // Se já é número, retornar diretamente
  if (typeof valorRaw === 'number') {
    return isNaN(valorRaw) ? 0 : valorRaw;
  }
  
  // Limpar e normalizar string
  let valor = valorRaw
    .toString()
    .replace(/R\$\s*/gi, '')  // Remove R$ com espaços
    .replace(/\s+/g, '')      // Remove todos os espaços
    .trim();

  const apenasDigitosEPontos = DIGITOS_COM_PONTOS_PATTERN.test(valor);

  if (valor === '') {
    return 0;
  }
  
  // 🇧🇷 FORMATO BRASILEIRO: 1.234.567,89
  if (BRAZILIAN_PATTERN.test(valor)) {
    valor = valor.replace(/\./g, '').replace(',', '.');
  }
  // 🇺🇸 FORMATO AMERICANO: 1,234,567.89
  else if (AMERICAN_PATTERN.test(valor)) {
    valor = valor.replace(/,/g, '');
  }
  // 🔀 FORMATOS MISTOS (ponto E vírgula)
  else if (valor.includes('.') && valor.includes(',')) {
    const ultimaVirgula = valor.lastIndexOf(',');
    const ultimoPonto = valor.lastIndexOf('.');
    
    // Se a vírgula vem depois do ponto: formato brasileiro
    if (ultimaVirgula > ultimoPonto) {
      // Ex: "1.234,56" → brasileiro
      valor = valor.replace(/\./g, '').replace(',', '.');
    }
    // Se o ponto vem depois da vírgula: formato americano
    else {
      // Ex: "1,234.56" → americano
      valor = valor.replace(/,/g, '');
    }
  }
  // 🇧🇷 APENAS VÍRGULA (formato brasileiro simples)
  else if (valor.includes(',') && !valor.includes('.')) {
    const quantidadeDeVirgulas = (valor.match(/,/g) || []).length;

    if (quantidadeDeVirgulas > 1) {
      valor = valor.replace(/,/g, '');
    } else {
      valor = normalizarDecimalComVirgula(valor);
    }
  }
  // 🧹 REMOVER VÍRGULAS RESTANTES (caso não tenham sido tratadas)
  else {
    valor = valor.replace(/,/g, '');
  }
  
  // Se restaram apenas milhares separados por ponto (ex.: "182.073.774"),
  // remover os pontos para preservar todos os dígitos antes da conversão.
  if (apenasDigitosEPontos) {
    valor = valor.replace(/\./g, '');
  }

  // Converter para número
  const valorNumerico = parseFloat(valor);
  return isNaN(valorNumerico) ? 0 : valorNumerico;
};

// Função de teste para validar a correção
export const testarProcessarValor = () => {
  const testes = [
    // Formato brasileiro
    { input: '1.234,56', expected: 1234.56, desc: 'Brasileiro padrão' },
    { input: '1.234.567,89', expected: 1234567.89, desc: 'Brasileiro com milhares' },
    { input: '123,45', expected: 123.45, desc: 'Brasileiro simples' },
    
    // Formato americano
    { input: '1,234.56', expected: 1234.56, desc: 'Americano padrão' },
    { input: '1,234,567.89', expected: 1234567.89, desc: 'Americano com milhares' },
    { input: '123.45', expected: 123.45, desc: 'Americano simples' },
    
    // Com R$
    { input: 'R$ 1.234,56', expected: 1234.56, desc: 'Com R$ brasileiro' },
    { input: 'R$1,234.56', expected: 1234.56, desc: 'Com R$ americano' },
    
    // Casos edge
    { input: '0', expected: 0, desc: 'Zero' },
    { input: '', expected: 0, desc: 'String vazia' },
    { input: '1000', expected: 1000, desc: 'Número simples' },
    {
      input: '182.073.774',
      expected: 182073774,
      desc: 'Milhares com pontos sem decimais'
    }
  ];
  
  console.log('🧪 TESTANDO processarValor:');
  testes.forEach(({ input, expected, desc }) => {
    const resultado = processarValor(input);
    const sucesso = resultado === expected;
    console.log(`${sucesso ? '✅' : '❌'} ${desc}: "${input}" → ${resultado} (esperado: ${expected})`);
  });
};

export default processarValor;
