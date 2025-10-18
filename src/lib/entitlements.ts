import type { PrismaClient, UserEntitlement } from '@prisma/client';

export const ADDON_PLANS = new Set<string>(['AMERICA']);

export function isAddonPlan(plan?: string | null): boolean {
  if (!plan) {
    return false;
  }
  return ADDON_PLANS.has(plan);
}

export async function activateEntitlement(
  prisma: PrismaClient,
  params: { userId: string; code: string; origin?: string | null; expiresAt?: Date | null }
): Promise<UserEntitlement> {
  const { userId, code, origin, expiresAt } = params;

  return prisma.userEntitlement.upsert({
    where: {
      userId_code: {
        userId,
        code,
      },
    },
    create: {
      userId,
      code,
      status: 'ACTIVE',
      origin: origin ?? null,
      expiresAt: expiresAt ?? null,
    },
    update: {
      status: 'ACTIVE',
      origin: origin ?? null,
      expiresAt: expiresAt ?? null,
    },
  });
}

export async function deactivateEntitlement(
  prisma: PrismaClient,
  params: { userId: string; code: string; origin?: string | null }
): Promise<UserEntitlement> {
  const { userId, code, origin } = params;

  return prisma.userEntitlement.upsert({
    where: {
      userId_code: {
        userId,
        code,
      },
    },
    create: {
      userId,
      code,
      status: 'INACTIVE',
      origin: origin ?? null,
    },
    update: {
      status: 'INACTIVE',
      origin: origin ?? null,
    },
  });
}

export function getActiveEntitlementCodes(entitlements: Array<Pick<UserEntitlement, 'code' | 'status' | 'expiresAt'>>): string[] {
  const now = new Date();
  return entitlements
    .filter(entitlement => {
      if (entitlement.status !== 'ACTIVE') {
        return false;
      }

      if (entitlement.expiresAt && entitlement.expiresAt < now) {
        return false;
      }

      return true;
    })
    .map(entitlement => entitlement.code);
}
