import type { Request, Response, NextFunction } from 'express';
import { HttpError } from './errors';
import { verifyAccessToken } from '@dukeauth/security';
import { prisma } from '@dukeauth/db';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.header('authorization');
  if (!auth) return next(new HttpError(401, 'Missing Authorization'));
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new HttpError(401, 'Invalid Authorization'));
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.jti = payload.jti;
    return next();
  } catch {
    return next(new HttpError(401, 'Invalid token'));
  }
}

export function requireRole(roles: Array<'OWNER' | 'ADMIN' | 'STAFF'>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userId) return next(new HttpError(401, 'Unauthorized'));
    if (!req.orgId) return next(new HttpError(400, 'No tenant resolved'));
    const membership = await prisma.organizationMembership.findFirst({
      where: { userId: req.userId, organizationId: req.orgId },
    });
    if (!membership) return next(new HttpError(403, 'Forbidden'));
    if (roles.includes(membership.role as any)) return next();
    return next(new HttpError(403, 'Insufficient role'));
  };
}
