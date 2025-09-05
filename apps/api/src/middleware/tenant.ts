import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@dukeauth/db';
import { Env, parseSubdomain } from '@dukeauth/core';
import { sha256 } from '@dukeauth/security/src/apikey';

export async function tenantResolver(req: Request, _res: Response, next: NextFunction) {
  try {
    const apiKey = req.header('x-api-key');
    if (apiKey) {
      const keyHash = sha256(apiKey);
      const key = await prisma.apiKey.findUnique({ where: { keyHash } });
      if (key) {
        req.orgId = key.organizationId;
        await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
        return next();
      }
    }

    const host = req.headers.host || '';
    const sub = parseSubdomain(host, Env.ROOT_DOMAIN());
    if (sub) {
      const mp = await prisma.marketplace.findUnique({ where: { subdomain: sub } });
      if (mp) req.orgId = mp.organizationId;
    }
    return next();
  } catch (e) {
    return next(e);
  }
}
