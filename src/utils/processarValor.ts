export const processarValor = (valorRaw: string) => {
  if (!valorRaw || valorRaw === '') return 0;

  let valor = valorRaw
    .toString()
    .replace(/R\$\s*/g, '')
    .replace(/\s/g, '')
    .trim();

  if (valor === '') return 0;

  if (valor.includes(',') && valor.includes('.')) {
    const ultimaVirgula = valor.lastIndexOf(',');
    const ultimoPonto = valor.lastIndexOf('.');

    if (ultimaVirgula > ultimoPonto) {
      valor = valor.replace(/\./g, '').replace(',', '.');
    } else {
      valor = valor.replace(/,/g, '');
    }
  } else if (valor.includes(',')) {
    const negativo = valor.startsWith('-');
    const valorSemSinal = negativo ? valor.slice(1) : valor;
    const quantidadeVirgulas = (valorSemSinal.match(/,/g) || []).length;

    const ultimaVirgula = valorSemSinal.lastIndexOf(',');
    const indicaMilhar =
      quantidadeVirgulas > 1 ||
      (quantidadeVirgulas === 1 && /,\d{3}$/.test(valorSemSinal));

    if (indicaMilhar) {
      const inteiro = valorSemSinal.replace(/,/g, '');
      valor = `${negativo ? '-' : ''}${inteiro}`;
    } else if (ultimaVirgula !== -1) {
      const parteInteira = valorSemSinal.slice(0, ultimaVirgula).replace(/,/g, '');
      const parteDecimal = valorSemSinal.slice(ultimaVirgula + 1);

      if (parteDecimal.length === 0) {
        valor = `${negativo ? '-' : ''}${parteInteira || '0'}`;
      } else {
        const inteiroNormalizado = parteInteira || '0';
        valor = `${negativo ? '-' : ''}${inteiroNormalizado}.${parteDecimal}`;
      }
    }
  }

  const valorNumerico = parseFloat(valor);
  return isNaN(valorNumerico) ? 0 : valorNumerico;
};
