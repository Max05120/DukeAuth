import { PrismaClient } from '@prisma/client';
import type { TenantId } from '@dukeauth/core';

export const prisma = new PrismaClient();

// Runs the callback in a transaction with the session GUC set to the tenant id.
export async function withTenant<T>(tenantId: TenantId, cb: (tx: PrismaClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    // Use set_config with is_local = true so it resets at end of transaction
    await tx.$queryRawUnsafe(`SELECT set_config('dukeauth.tenant_id', $1, true)`, tenantId);
    return cb(tx as unknown as PrismaClient);
  });
}

export type { Prisma, User, Organization, Product } from '@prisma/client';

