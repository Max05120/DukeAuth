import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export async function withTenant<T>(organizationId: string, fn: (tx: PrismaClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL dukeauth.tenant_id='${organizationId}'`);
    return fn(tx);
  });
}

export type { Prisma, User, Organization, Product } from '@prisma/client';
