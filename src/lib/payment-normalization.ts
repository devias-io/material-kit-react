/**
 * Normaliza formas de pagamento vindas de diferentes plataformas
 * para um formato padrão do sistema
 */

export type PaymentMethod =
  | 'credit_card'
  | 'pix'
  | 'boleto'
  | 'paypal'
  | 'wallet'
  | 'debit_card'
  | 'other';

/**
 * Mapeia os valores de forma de pagamento de cada plataforma
 * para o formato padrão do sistema
 */
export function normalizePaymentMethod(rawMethod: string | null | undefined): string {
  if (!rawMethod) return 'other';

  const method = rawMethod.toLowerCase().trim();

  // Cartão de crédito
  if (
    method === 'credit_card' ||
    method === 'creditcard' ||
    method === 'cartao_credito' ||
    method === 'cartao' ||
    method.includes('credit')
  ) {
    return 'credit_card';
  }

  // PIX
  if (method === 'pix') {
    return 'pix';
  }

  // Boleto bancário
  if (
    method === 'boleto' ||
    method === 'billet' ||
    method === 'bank_slip' ||
    method === 'financed_billet' ||
    method.includes('boleto')
  ) {
    return 'boleto';
  }

  // Cartão de débito
  if (
    method === 'debit_card' ||
    method === 'direct_debit' ||
    method.includes('debit')
  ) {
    return 'debit_card';
  }

  // PayPal
  if (
    method === 'paypal' ||
    method === 'paypal_internacional' ||
    method.includes('paypal')
  ) {
    return 'paypal';
  }

  // Carteira digital (Hotmart wallet, etc)
  if (
    method === 'wallet' ||
    method === 'balance_hotmart' ||
    method === 'hotcard' ||
    method.includes('wallet')
  ) {
    return 'wallet';
  }

  // Google Pay / Samsung Pay
  if (method.includes('google_pay') || method.includes('samsung_pay')) {
    return 'wallet';
  }

  // Transferência bancária
  if (
    method === 'direct_bank_transfer' ||
    method === 'manual_transfer' ||
    method.includes('transfer')
  ) {
    return 'other';
  }

  // Parcelamento financiado
  if (method.includes('financed')) {
    return 'credit_card';
  }

  // Outros ou não identificado
  return 'other';
}

/**
 * Retorna o nome amigável da forma de pagamento para exibição
 */
export function getPaymentMethodDisplayName(method: string | null | undefined): string {
  const normalized = normalizePaymentMethod(method);

  const displayNames: Record<string, string> = {
    credit_card: 'Cartão de Crédito',
    pix: 'PIX',
    boleto: 'Boleto Bancário',
    debit_card: 'Cartão de Débito',
    paypal: 'PayPal',
    wallet: 'Carteira Digital',
    other: 'Outro',
  };

  return displayNames[normalized] || 'Não informado';
}

/**
 * Formata a informação de parcelamento para exibição
 */
export function formatInstallments(installments: number | null | undefined, amount: number): string {
  if (!installments || installments <= 1) {
    return 'À vista';
  }

  const installmentValue = amount / installments;
  return `${installments}x de R$ ${installmentValue.toFixed(2)}`;
}

/**
 * Normaliza o número de parcelas
 */
export function normalizeInstallments(installments: number | null | undefined): number {
  if (!installments || installments < 1) {
    return 1;
  }
  return installments;
}
