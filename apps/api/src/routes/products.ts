import { Router } from 'express';
import { withTenant, prisma } from '@dukeauth/db';
import { HttpError } from '../middleware/errors';
import { enqueueMint, productCreateSchema, productUpdateSchema } from '@dukeauth/core';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// List products (tenant-scoped)
router.get('/', async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const products = await withTenant(req.orgId, (tx) => tx.product.findMany());
    res.json(products);
  } catch (e) {
    next(e);
  }
});

// Get by id
router.get('/:id', async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const product = await withTenant(req.orgId, (tx) => tx.product.findUnique({ where: { id: req.params.id } }));
    if (!product) throw new HttpError(404, 'Not found');
    res.json(product);
  } catch (e) {
    next(e);
  }
});

// Create
router.post('/', requireAuth, requireRole(['OWNER', 'ADMIN', 'STAFF']), validate(productCreateSchema), async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const data = req.body as any;
    const product = await withTenant(req.orgId, (tx) =>
      tx.product.create({
        data: {
          organizationId: req.orgId!,
          title: data.title,
          description: data.description,
          priceCents: data.priceCents,
          currency: data.currency,
          inventory: data.inventory,
          images: data.images ?? [],
          videos: data.videos ?? [],
          collection: data.collection,
          sku: data.sku,
          material: data.material,
          origin: data.origin,
          manufacturingDate: data.manufacturingDate ? new Date(data.manufacturingDate) : null,
          rarity: data.rarity,
          variant: data.variant,
          attributes: data.attributes,
          mintOn: data.mintOn ?? 'MANUAL',
          status: data.status,
        },
      }),
    );
    // Auto-mint if policy and status allow, enforce quotas at /nfts endpoint
    if (product.mintOn === 'ON_CREATE' && product.status === 'PUBLISHED') {
      // Create bare NFT with metadata placeholder; actual to/tokenURI should be provided via product attributes or later update
      const to = (product.attributes as any)?.ownerAddress;
      const tokenURI = (product.attributes as any)?.tokenURI;
      if (to && tokenURI) {
        const nft = await withTenant(req.orgId, (tx) =>
          tx.nft.create({ data: { organizationId: req.orgId!, productId: product.id, metadata: { to, tokenURI } } }),
        );
        await enqueueMint({ organizationId: req.orgId!, nftId: nft.id });
      }
    }
    res.status(201).json(product);
  } catch (e) {
    next(e);
  }
});

// Patch
router.patch('/:id', requireAuth, requireRole(['OWNER', 'ADMIN', 'STAFF']), validate(productUpdateSchema), async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const data = req.body as any;
    const product = await withTenant(req.orgId, (tx) =>
      tx.product.update({ where: { id: req.params.id }, data }),
    );
    res.json(product);
  } catch (e) {
    next(e);
  }
});

// Delete
router.delete('/:id', requireAuth, requireRole(['OWNER', 'ADMIN', 'STAFF']), async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    await withTenant(req.orgId, (tx) => tx.product.delete({ where: { id: req.params.id } }));
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
