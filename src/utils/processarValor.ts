const BRAZILIAN_PATTERN = /^-?\d{1,3}(\.\d{3})*,\d+$/;
const AMERICAN_PATTERN = /^-?\d{1,3}(,\d{3})*\.\d+$/;
const AMERICAN_MULTIPLE_THOUSANDS_PATTERN = /^-?\d{1,3}(,\d{3}){2,}$/;

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

export const processarValor = (valorRaw: string): number => {
  if (!valorRaw || valorRaw === '') {
    return 0;
  }

  let valor = valorRaw
    .toString()
    .replace(/R\$\s*/g, '')
    .replace(/\s/g, '')
    .trim();

  if (valor === '') {
    return 0;
  }

  if (BRAZILIAN_PATTERN.test(valor)) {
    valor = valor.replace(/\./g, '').replace(',', '.');
  } else if (AMERICAN_PATTERN.test(valor) || AMERICAN_MULTIPLE_THOUSANDS_PATTERN.test(valor)) {
    valor = valor.replace(/,/g, '');
  } else if (valor.includes('.') && valor.includes(',')) {
    const lastComma = valor.lastIndexOf(',');
    const lastDot = valor.lastIndexOf('.');
    const dotCount = (valor.match(/\./g) || []).length;

    if (dotCount === 1 && lastDot < lastComma) {
      const digitsBetween = valor.slice(lastDot + 1, lastComma).replace(/\D/g, '');

      if (digitsBetween.length > 3) {
        valor = valor.replace(/,/g, '');
      } else {
        valor = normalizarDecimalComVirgula(valor);
      }
    } else if (lastDot > lastComma) {
      valor = valor.replace(/,/g, '');
    } else {
      valor = normalizarDecimalComVirgula(valor);
    }
  } else if (valor.includes(',')) {
    valor = normalizarDecimalComVirgula(valor);
  } else {
    valor = valor.replace(/,/g, '');
  }

  const valorNumerico = parseFloat(valor);
  return Number.isNaN(valorNumerico) ? 0 : valorNumerico;
};
