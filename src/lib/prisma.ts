import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const datasourceUrl = (() => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'file:./dev.db';
  }

  return undefined;
})();

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    datasourceUrl
      ? { datasourceUrl }
      : undefined
  );

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
export { prisma };
