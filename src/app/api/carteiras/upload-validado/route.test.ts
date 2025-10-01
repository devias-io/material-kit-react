import { normalizarLinha } from './route';

describe('normalizarLinha - upload validado', () => {
  it('usa dados do resumo da linha validada para valores numéricos', () => {
    const linhaValidada = {
      sheetName: 'Ações',
      categoria: 'Ações',
      values: ['PETR4', 'Petrobras PN', '10', '27,50', 'R$ 275,00', '12,5%'],
      resumo: {
        quantidade: 10,
        precoMedio: 27.5,
        valorInvestido: 275,
        valorAtual: 300,
        moeda: 'BRL'
      }
    };

    const resultado = normalizarLinha(linhaValidada);

    expect(resultado).not.toBeNull();
    expect(resultado).toMatchObject({
      categoria: 'acoes',
      ticker: 'PETR4',
      nome: 'Petrobras PN',
      quantidade: 10,
      precoMedio: 27.5,
      valorInvestido: 275,
      valorAtual: 300,
      cotacaoAtual: 27.5,
      moeda: 'BRL'
    });
  });
});
