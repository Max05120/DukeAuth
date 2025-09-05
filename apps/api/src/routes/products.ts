import { Router } from 'express';
import { z } from 'zod';
import { withTenant, prisma } from '@dukeauth/db';
import { validateBody } from '../middleware/validate';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().default('USD'),
  active: z.boolean().default(true),
  marketplaceId: z.string().optional()
});

router.get('/', async (req, res, next) => {
  try {
    const orgId = res.locals.tenantId;
    if (!orgId) return res.status(400).json({ error: 'Tenant not resolved' });
    const products = await withTenant(orgId, () => prisma.product.findMany({ orderBy: { createdAt: 'desc' } }));
    res.json({ items: products });
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody(createSchema), async (req, res, next) => {
  try {
    const orgId = res.locals.tenantId;
    if (!orgId) return res.status(400).json({ error: 'Tenant not resolved' });
    const data = req.body as z.infer<typeof createSchema>;
    const product = await withTenant(orgId, (tx) =>
      tx.product.create({
        data: {
          organizationId: orgId,
          name: data.name,
          description: data.description,
          priceCents: data.priceCents,
          currency: data.currency,
          active: data.active,
          marketplaceId: data.marketplaceId ?? null
        }
      })
    );
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

const updateSchema = createSchema.partial();
router.put('/:id', validateBody(updateSchema), async (req, res, next) => {
  try {
    const orgId = res.locals.tenantId;
    if (!orgId) return res.status(400).json({ error: 'Tenant not resolved' });
    const { id } = req.params;
    const product = await withTenant(orgId, (tx) =>
      tx.product.update({ where: { id }, data: req.body })
    );
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const orgId = res.locals.tenantId;
    if (!orgId) return res.status(400).json({ error: 'Tenant not resolved' });
    const { id } = req.params;
    await withTenant(orgId, (tx) => tx.product.delete({ where: { id } }));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;

