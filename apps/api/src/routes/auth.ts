import { Router } from 'express';
import { z } from 'zod';
import { getEnv } from '@dukeauth/core';
import { prisma } from '@dukeauth/db';
import { hashPassword, verifyPassword, issueTokens, verifyAccessToken, rotateRefreshToken, revokeSession } from '@dukeauth/security';
import { validateBody } from '../middleware/validate';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2),
  orgSlug: z.string().regex(/^[a-z0-9-]+$/)
});

router.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const env = getEnv();
    const { email, password, orgName, orgSlug } = req.body as z.infer<typeof registerSchema>;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await hashPassword(password, env);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, passwordHash } });
      const org = await tx.organization.create({ data: { name: orgName, slug: orgSlug } });
      await tx.organizationMembership.create({
        data: { userId: user.id, organizationId: org.id, role: 'OWNER' }
      });
      return { user, org };
    });

    const tokens = await issueTokens(result.user.id, env);
    res.status(201).json({ userId: result.user.id, organizationId: result.org.id, ...tokens });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const env = getEnv();
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await verifyPassword(password, user.passwordHash, env);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const tokens = await issueTokens(user.id, env);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const env = getEnv();
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (!token) return res.status(401).json({ error: 'Missing token' });
    const payload = verifyAccessToken(token, env);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });
    await revokeSession(payload.jti);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

const refreshSchema = z.object({ refreshToken: z.string().min(10) });
router.post('/refresh', validateBody(refreshSchema), async (req, res, next) => {
  try {
    const env = getEnv();
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    const tokens = await rotateRefreshToken(refreshToken, env);
    if (!tokens) return res.status(401).json({ error: 'Invalid refresh token' });
    res.json(tokens);
  } catch (err) {
    next(err);
  }
});

export default router;

