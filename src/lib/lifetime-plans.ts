export const LIFETIME_PLANS = new Set<
  | 'RENDA_TURBINADA'
  | 'RENDA_TURBINADA_T2'
  | 'RENDA_TURBINADA_T3'
  | 'RENDA_PASSIVA'
  | 'FIIS'
>(['RENDA_TURBINADA', 'RENDA_TURBINADA_T2', 'RENDA_TURBINADA_T3', 'RENDA_PASSIVA', 'FIIS']);

export function isLifetimePlan(plan?: string | null): boolean {
  if (!plan) {
    return false;
  }

  return LIFETIME_PLANS.has(plan as 'RENDA_TURBINADA' | 'RENDA_TURBINADA_T2' | 'RENDA_TURBINADA_T3' | 'RENDA_PASSIVA' | 'FIIS');
}
