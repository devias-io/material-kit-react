export function getFrequenciaDividendos(ticker: string): number {
  const tickerUpper = ticker.toUpperCase();

  const empresasAnuais = ['XP', 'NU', 'PAGS', 'STNE', 'ARCO', 'BRFS'];
  if (empresasAnuais.includes(tickerUpper)) {
    return 1;
  }

  const empresasSemestrais = ['VALE', 'ITUB', 'BBD'];
  if (empresasSemestrais.includes(tickerUpper)) {
    return 2;
  }

  return 4;
}

export function extrairNumeroBrApi(valor: any): number | null {
  if (valor === null || valor === undefined) {
    return null;
  }

  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor === 'object') {
    if (typeof valor.raw === 'number' && Number.isFinite(valor.raw)) {
      return valor.raw;
    }

    if (typeof valor.fmt === 'string') {
      return extrairNumeroBrApi(valor.fmt);
    }
  }

  if (typeof valor === 'string') {
    const cleaned = valor.trim();
    if (!cleaned) {
      return null;
    }

    const isPercent = cleaned.includes('%');
    const numericOnly = cleaned
      .replace(/[^0-9.,%-]/g, '')
      .replace(/%/g, '')
      .replace(/\s+/g, '');

    let normalizado = numericOnly;
    const possuiVirgula = normalizado.includes(',');
    const possuiPonto = normalizado.includes('.');

    if (possuiVirgula && possuiPonto) {
      if (normalizado.lastIndexOf('.') > normalizado.lastIndexOf(',')) {
        normalizado = normalizado.replace(/,/g, '');
      } else {
        normalizado = normalizado.replace(/\./g, '').replace(',', '.');
      }
    } else if (possuiVirgula) {
      normalizado = normalizado.replace(/,/g, '.');
    }

    const parsed = Number.parseFloat(normalizado);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return isPercent ? parsed / 100 : parsed;
  }

  return null;
}

function normalizarDividendYield(valor: number | null): number | null {
  if (valor === null || valor === undefined) {
    return null;
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    return null;
  }

  return valor > 1 ? valor / 100 : valor;
}

function extrairDividendYield(valor: any): number | null {
  const numero = extrairNumeroBrApi(valor);
  if (numero === null) {
    return null;
  }

  return normalizarDividendYield(numero);
}

function obterValorDividendo(item: any): number | null {
  if (!item) {
    return null;
  }

  return extrairNumeroBrApi(
    item.rate ??
      item.value ??
      item.amount ??
      item.cashAmount ??
      item.grossAmount ??
      item.dividend ??
      item.dividendAmount
  );
}

function somarDividendosUltimos12Meses(cashDividends: any[]): number {
  if (!Array.isArray(cashDividends)) {
    return 0;
  }

  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 1);

  return cashDividends.reduce((total: number, item: any) => {
    const valor = obterValorDividendo(item);
    if (!valor || valor <= 0) {
      return total;
    }

    const dataRaw = item?.paymentDate || item?.approvedOn || item?.recordDate || item?.exDate || item?.date;
    if (!dataRaw) {
      return total;
    }

    const data = new Date(dataRaw);
    if (Number.isNaN(data.getTime()) || data < limite) {
      return total;
    }

    return total + valor;
  }, 0);
}

function encontrarUltimoDividendo(cashDividends: any[]): number | null {
  if (!Array.isArray(cashDividends)) {
    return null;
  }

  for (const item of cashDividends) {
    const valor = obterValorDividendo(item);
    if (valor && valor > 0) {
      return valor;
    }
  }

  return null;
}

export function calcularDyAPartirDoResultado(
  result: any,
  ticker: string
): { valor: number | null; origem: string } {
  if (!result) {
    return { valor: null, origem: 'sem_resultado' };
  }

  const fontesDiretas = [
    { valor: result.dividendYield, origem: 'dividendYield' },
    { valor: result.dividendsData?.yield, origem: 'dividendsData.yield' },
    { valor: result.dividendsData?.cashDividends?.[0]?.yield, origem: 'dividendsData.cashDividends[0].yield' },
    { valor: result.lastDividends?.[0]?.yield, origem: 'lastDividends[0].yield' }
  ];

  for (const fonte of fontesDiretas) {
    const numero = extrairDividendYield(fonte.valor);
    if (numero && numero > 0) {
      return { valor: numero, origem: fonte.origem };
    }
  }

  const precoAtual = extrairNumeroBrApi(
    result.regularMarketPrice ??
      result.regularMarketPreviousClose ??
      result.price?.regularMarketPrice ??
      result.regularMarketOpen
  );
  if (!precoAtual || precoAtual <= 0) {
    return { valor: null, origem: 'sem_preco' };
  }

  const cashDividends = Array.isArray(result.dividendsData?.cashDividends)
    ? result.dividendsData.cashDividends
    : Array.isArray(result.cashDividends)
      ? result.cashDividends
      : [];

  const soma12Meses = somarDividendosUltimos12Meses(cashDividends);
  if (soma12Meses > 0) {
    const dyCalculado = soma12Meses / precoAtual;
    if (dyCalculado > 0) {
      return { valor: dyCalculado, origem: 'calc:cashDividends.12m' };
    }
  }

  const ultimoDividendo = encontrarUltimoDividendo(cashDividends);
  if (ultimoDividendo && ultimoDividendo > 0) {
    const frequencia = getFrequenciaDividendos(ticker);
    const dyCalculado = (ultimoDividendo * frequencia) / precoAtual;
    if (dyCalculado > 0) {
      return { valor: dyCalculado, origem: 'calc:cashDividends.lastDividend' };
    }
  }

  return { valor: null, origem: 'nao_encontrado' };
}

export function formatarDy(valor: number): string {
  const percentual = Number.isFinite(valor) ? valor * 100 : 0;
  return `${percentual.toFixed(2).replace('.', ',')}%`;
}
