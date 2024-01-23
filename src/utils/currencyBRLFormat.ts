export function currencyBrlFormat(n: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      
    }).format(n);
}
