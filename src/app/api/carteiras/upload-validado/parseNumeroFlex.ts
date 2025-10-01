export function parseNumeroFlex(valor: unknown): number {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : 0;
  }

  if (typeof valor === 'string') {
    const trimmed = valor.trim();
    if (!trimmed) {
      return 0;
    }

    let somenteNumeros = trimmed
      .replace(/[^0-9,.-]/g, '')
      .replace(/(?!^)-/g, '');

    if (!somenteNumeros) {
      return 0;
    }

    const virgulas = (somenteNumeros.match(/,/g) || []).length;
    const pontos = (somenteNumeros.match(/\./g) || []).length;

    if (virgulas && pontos) {
      if (somenteNumeros.lastIndexOf(',') > somenteNumeros.lastIndexOf('.')) {
        somenteNumeros = somenteNumeros.replace(/\./g, '').replace(',', '.');
      } else {
        somenteNumeros = somenteNumeros.replace(/,/g, '');
      }
    } else if (virgulas) {
      somenteNumeros = somenteNumeros.replace(/,/g, '.');
    } else if (pontos) {
      const partes = somenteNumeros.split('.');
      const ultimaParte = partes[partes.length - 1];
      const primeiraParte = partes[0];
      const temMultiplosPontos = partes.length > 2;
      const primeiraParteEhZero = primeiraParte.replace(/^-/, '') === '0';
      const tratarComoMilhar =
        temMultiplosPontos ||
        (ultimaParte.length === 3 && !primeiraParteEhZero && primeiraParte.replace(/^-/, '').length <= 3);

      if (tratarComoMilhar) {
        somenteNumeros = somenteNumeros.replace(/\./g, '');
      }
    }

    const numero = parseFloat(somenteNumeros);
    return Number.isFinite(numero) ? numero : 0;
  }

  return 0;
}
