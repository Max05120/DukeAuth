import { Router } from 'express';
import { prisma } from '@dukeauth/db';
import { validate } from '../middleware/validate';
import { accountRegisterSchema, loginSchema } from '@dukeauth/core';
import { HttpError } from '../middleware/errors';
import { hashPassword, verifyPassword, issueTokens } from '@dukeauth/security';

const router = Router();

// Customer register for the resolved tenant (subdomain or API key)
router.post('/register', validate(accountRegisterSchema), async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const { email, password } = req.body as any;
    const passwordHash = await hashPassword(password);
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email },
        update: {},
        create: { email, passwordHash },
      });
      // Ensure membership as CUSTOMER in this org
      await tx.$executeRawUnsafe(`SET LOCAL dukeauth.tenant_id='${req.orgId}'`);
      await tx.organizationMembership.upsert({
        where: { userId_organizationId: { userId: user.id, organizationId: req.orgId! } },
        update: { role: 'CUSTOMER' },
        create: { userId: user.id, organizationId: req.orgId!, role: 'CUSTOMER' },
      });
      return { user };
    });
    const tokens = await issueTokens(result.user.id);
    res.status(201).json(tokens);
  } catch (e: any) {
    if (e.code === 'P2002') return next(new HttpError(409, 'Email already in use'));
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

export default router;

