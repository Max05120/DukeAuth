import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { apiKeyCreateSchema } from '@dukeauth/core';
import { prisma, withTenant } from '@dukeauth/db';
import { generateApiKey } from '@dukeauth/security/src/apikey';
import { HttpError } from '../middleware/errors';

const router = Router();

router.post('/', requireAuth, requireRole(['OWNER', 'ADMIN']), validate(apiKeyCreateSchema), async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const { name } = req.body as any;
    const { key, prefix, hash } = generateApiKey('duk');
    await withTenant(req.orgId, (tx) =>
      tx.apiKey.create({ data: { organizationId: req.orgId!, name, prefix, keyHash: hash } }),
    );
    res.status(201).json({ key, prefix });
  } catch (e) {
    next(e);
  }
});

export default router;
