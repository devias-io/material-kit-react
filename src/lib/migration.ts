import 'server-only';

import type { Purchase, User } from '@prisma/client';

export type MigrationSimulation = {
  fromPlan: string;
  toPlan: string;
  totalPaid: number;
  installmentsTotal: number | null;
  monthsRemaining: number;
  credit: number;
  vipPrice: number;
  finalPrice: number;
  notices: string[];
  purchaseDate: string;
  expirationDate: string | null;
};

const DEFAULT_ALLOWED_FROM_PLANS = new Set(['LITE', 'LITE_V2']);
const DEFAULT_VIP_PRICE = 1297;
const DEFAULT_PLAN_DURATION_MONTHS = 12;

const MIGRATION_NOTICES = [
  'Não é possível cancelar a cobrança do plano atual. Em caso de parcelamento, o cliente continuará pagando as parcelas.',
  'O plano VIP começa a contar a partir da data da compra e o vencimento será 1 ano após essa data.'
];

export function getVipMigrationPrice(): number {
  const raw = process.env.MIGRATION_VIP_PRICE;
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_VIP_PRICE;
  }
  return parsed;
}

export function getAllowedMigrationPlans(): Set<string> {
  const raw = process.env.MIGRATION_ALLOWED_FROM_PLANS;
  if (!raw) {
    return new Set(DEFAULT_ALLOWED_FROM_PLANS);
  }

  const parsed = raw
    .split(',')
    .map((plan) => plan.trim())
    .filter(Boolean);

  if (parsed.length === 0) {
    return new Set(DEFAULT_ALLOWED_FROM_PLANS);
  }

  return new Set(parsed);
}

export function isPlanEligibleForVipMigration(plan: string): boolean {
  return getAllowedMigrationPlans().has(plan);
}

export function getMigrationCheckoutUrl(origin?: string | null): string | null {
  const normalizedOrigin = origin?.toUpperCase() ?? '';

  const urlByOrigin: Record<string, string | undefined> = {
    HOTMART: process.env.MIGRATION_CHECKOUT_HOTMART_URL,
    KIWIFY: process.env.MIGRATION_CHECKOUT_KIWIFY_URL,
    EDUZZ: process.env.MIGRATION_CHECKOUT_EDUZZ_URL,
    MANUAL: process.env.MIGRATION_CHECKOUT_DEFAULT_URL,
  };

  return urlByOrigin[normalizedOrigin] || process.env.MIGRATION_CHECKOUT_DEFAULT_URL || null;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateMonthsRemaining(expirationDate: Date, now: Date): number {
  const diffMs = expirationDate.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 0;
  }

  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.ceil(daysRemaining / 30));
}

export function buildMigrationSimulation({
  user,
  purchase,
  targetPlan = 'VIP',
  now = new Date(),
}: {
  user: Pick<User, 'plan' | 'expirationDate' | 'origin'>;
  purchase: Pick<Purchase, 'amount' | 'totalPaid' | 'installmentsTotal' | 'createdAt'>;
  targetPlan?: string;
  now?: Date;
}): MigrationSimulation {
  if (targetPlan !== 'VIP') {
    throw new Error('Plano de migração inválido.');
  }

  if (!isPlanEligibleForVipMigration(user.plan)) {
    throw new Error('Plano atual não elegível para migração.');
  }

  if (!user.expirationDate) {
    throw new Error('Plano atual sem data de expiração válida.');
  }

  const totalPaid = typeof purchase.totalPaid === 'number' ? purchase.totalPaid : purchase.amount;
  const monthsRemaining = calculateMonthsRemaining(user.expirationDate, now);
  const credit = roundCurrency((totalPaid / DEFAULT_PLAN_DURATION_MONTHS) * monthsRemaining);
  const vipPrice = getVipMigrationPrice();
  const finalPrice = roundCurrency(Math.max(0, vipPrice - credit));

  return {
    fromPlan: user.plan,
    toPlan: targetPlan,
    totalPaid,
    installmentsTotal: purchase.installmentsTotal ?? null,
    monthsRemaining,
    credit,
    vipPrice,
    finalPrice,
    notices: MIGRATION_NOTICES,
    purchaseDate: purchase.createdAt.toISOString(),
    expirationDate: user.expirationDate ? user.expirationDate.toISOString() : null,
  };
}
