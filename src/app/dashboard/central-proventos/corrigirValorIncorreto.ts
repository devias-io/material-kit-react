const MIN_PLAUSIBLE_VALUE = 0.01;
const MAX_PLAUSIBLE_VALUE = 1000;

const correcoesEspecificas: Record<string, number> = {
  LEVE3: 1.9
};

const removerEspacos = (valor: string): string => valor.replace(/\s+/g, '');

const calcularCasasEmbutidas = (valorBruto: string): number | null => {
  const normalizado = removerEspacos(valorBruto.trim());
  if (!normalizado) {
    return null;
  }

  const [parteInteiraRaw = '', parteDecimalRaw = ''] = normalizado.split(',');
  const decimaisLimpos = parteDecimalRaw.replace(/\D/g, '');

  if (decimaisLimpos && decimaisLimpos !== '00') {
    return null;
  }

  const gruposInteiros = parteInteiraRaw.split('.').filter(Boolean);
  if (gruposInteiros.length < 3) {
    return null;
  }

  const casas = decimaisLimpos.length + (gruposInteiros.length - 1) * 3;
  return casas > 0 ? casas : null;
};

const estimarDivisorDinamico = (valorBruto?: string): number | null => {
  if (!valorBruto) {
    return null;
  }

  const casas = calcularCasasEmbutidas(valorBruto);
  if (casas === null) {
    return null;
  }

  const divisor = Math.pow(10, casas);
  return Number.isFinite(divisor) ? divisor : null;
};

export const corrigirValorIncorreto = (
  ticker: string,
  valor: number,
  valorBruto?: string
): number => {
  if (valor <= 50000) {
    return valor;
  }

  if (correcoesEspecificas[ticker]) {
    console.log(
      `🔧 Correção específica: ${ticker} ${valor} → ${correcoesEspecificas[ticker]}`
    );
    return correcoesEspecificas[ticker];
  }

  const divisorDinamico = estimarDivisorDinamico(valorBruto);
  if (divisorDinamico) {
    const valorCorrigido = valor / divisorDinamico;
    if (valorCorrigido >= MIN_PLAUSIBLE_VALUE && valorCorrigido <= MAX_PLAUSIBLE_VALUE) {
      console.log(
        `🔧 Correção dinâmica: ${ticker} ${valor} → ${valorCorrigido} (÷${divisorDinamico})`
      );
      return valorCorrigido;
    }
  }

  const divisoresFallback = [1e8, 1e7, 1e6, 1e5, 1e4];
  for (const divisor of divisoresFallback) {
    const teste = valor / divisor;
    if (teste >= MIN_PLAUSIBLE_VALUE && teste <= MAX_PLAUSIBLE_VALUE) {
      console.log(`🔧 Correção por divisor: ${ticker} ${valor} → ${teste} (÷${divisor})`);
      return teste;
    }
  }

  return valor;
};

export default corrigirValorIncorreto;
