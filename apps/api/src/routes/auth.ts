import { Router } from 'express';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '@dukeauth/core';
import { prisma, withTenant } from '@dukeauth/db';
import { hashPassword, verifyPassword, issueTokens, rotateRefreshToken, revokeSession } from '@dukeauth/security';
import { HttpError } from '../middleware/errors';

const router = Router();

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, organizationName, subdomain } = req.body as any;
    const passwordHash = await hashPassword(password);
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, passwordHash } });
      const org = await tx.organization.create({ data: { name: organizationName } });
      // Bind tenant for RLS-checked inserts
      await tx.$executeRawUnsafe(`SET LOCAL dukeauth.tenant_id='${org.id}'`);
      await tx.organizationMembership.create({
        data: { userId: user.id, organizationId: org.id, role: 'OWNER' },
      });
      await tx.marketplace.create({ data: { organizationId: org.id, subdomain } });
      return { user, org };
    });
    const tokens = await issueTokens(result.user.id);
    res.status(201).json({ userId: result.user.id, organizationId: result.org.id, ...tokens });
  } catch (e: any) {
    if (e.code === 'P2002') return next(new HttpError(409, 'Duplicate email or subdomain'));
    next(e);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as any;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new HttpError(401, 'Invalid credentials');
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw new HttpError(401, 'Invalid credentials');
    const tokens = await issueTokens(user.id);
    res.json(tokens);
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const auth = req.header('authorization');
    if (!auth) throw new HttpError(401, 'Missing Authorization');
    const [scheme, token] = auth.split(' ');
    if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Invalid Authorization');
    const tokens = await rotateRefreshToken(token);
    res.json(tokens);
  } catch (e) {
    next(e);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const auth = req.header('authorization');
    if (!auth) throw new HttpError(401, 'Missing Authorization');
    const [scheme, token] = auth.split(' ');
    if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Invalid Authorization');
    // Best-effort: decode without verify to extract jti; or require access token
    const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString('utf8'));
    if (!payload?.jti) throw new HttpError(400, 'Invalid token');
    await revokeSession(payload.jti);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
