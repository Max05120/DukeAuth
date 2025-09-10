import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { brandingUpdateSchema } from '@dukeauth/core';
import { withTenant } from '@dukeauth/db';
import { HttpError } from '../middleware/errors';

const router = Router();

router.patch('/', requireAuth, requireRole(['OWNER', 'ADMIN']), validate(brandingUpdateSchema), async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const data = req.body as any;
    const mp = await withTenant(req.orgId, async (tx) => {
      const existing = await tx.marketplace.findFirst({ where: { organizationId: req.orgId! } });
      if (!existing) throw new HttpError(404, 'Marketplace not found');
      return tx.marketplace.update({
        where: { id: existing.id },
        data: {
          logoUrl: data.logoUrl,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          accentColor: data.accentColor,
          fontFamily: data.fontFamily,
          theme: data.theme,
          customDomain: data.customDomain,
        },
      });
    });
    res.json(mp);
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const mp = await withTenant(req.orgId, (tx) => tx.marketplace.findFirst({ where: { organizationId: req.orgId! } }));
    if (!mp) throw new HttpError(404, 'Marketplace not found');
    res.json(mp);
  } catch (e) {
    next(e);
  }
});

export default router;

