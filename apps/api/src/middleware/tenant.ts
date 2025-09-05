import type { Request, Response, NextFunction } from 'express';
import { parseSubdomain, getEnv } from '@dukeauth/core';
import { prisma } from '@dukeauth/db';
import { sha256 } from '@dukeauth/security';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      tenantId?: string;
      userId?: string;
      jti?: string;
    }
  }
}

export async function tenantResolver(req: Request, res: Response, next: NextFunction) {
  const env = getEnv();
  const host = req.headers.host as string | undefined;
  const apiKey = (req.headers['x-api-key'] || req.headers['x-api-key'.toLowerCase()]) as
    | string
    | undefined;

  let orgId: string | undefined;

  if (apiKey) {
    const hash = sha256(apiKey);
    const key = await prisma.apiKey.findFirst({ where: { hash } });
    if (key) {
      orgId = key.organizationId;
      // Best-effort last used update
      void prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
    }
  }

  if (!orgId) {
    const sub = parseSubdomain(host, env.ROOT_DOMAIN);
    if (sub) {
      const org = await prisma.organization.findFirst({ where: { slug: sub } });
      if (org) orgId = org.id;
    }
  }

  if (orgId) res.locals.tenantId = orgId;
  return next();
}

