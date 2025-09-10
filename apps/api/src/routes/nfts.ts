import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { nftCreateSchema } from '@dukeauth/core';
import { withTenant, prisma } from '@dukeauth/db';
import { HttpError } from '../middleware/errors';
import { enqueueMint } from '@dukeauth/core';

const router = Router();

const PLAN_LIMITS: Record<string, number> = {
  Starter: 50,
  Pro: 500,
  Enterprise: Number.MAX_SAFE_INTEGER,
};

async function assertMintQuota(orgId: string) {
  const sub = await withTenant(orgId, (tx) => tx.subscription.findFirst({ where: { organizationId: orgId } }));
  const plan = sub?.plan || 'Starter';
  const limit = PLAN_LIMITS[plan] ?? 50;
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const minted = await withTenant(orgId, (tx) =>
    tx.nft.count({ where: { createdAt: { gte: start, lt: end } } }),
  );
  if (minted >= limit) throw new HttpError(402, 'Mint quota exceeded for current plan');
}

router.post('/', requireAuth, requireRole(['OWNER', 'ADMIN', 'STAFF']), validate(nftCreateSchema), async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const { productId, to, tokenURI } = req.body as any;
    await assertMintQuota(req.orgId);
    const nft = await withTenant(req.orgId, (tx) =>
      tx.nft.create({
        data: {
          organizationId: req.orgId!,
          productId,
          metadata: { to, tokenURI },
        },
      }),
    );
    await enqueueMint({ organizationId: req.orgId, nftId: nft.id });
    res.status(201).json({ id: nft.id });
  } catch (e) {
    next(e);
  }
});

// Public provenance endpoint
router.get('/:id/provenance', async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const nft = await withTenant(req.orgId, (tx) => tx.nft.findUnique({ where: { id: req.params.id } }));
    if (!nft) throw new HttpError(404, 'NFT not found');
    const product = nft.productId
      ? await withTenant(req.orgId, (tx) => tx.product.findUnique({ where: { id: nft.productId! } }))
      : null;
    res.json({
      nft: { id: nft.id, txHash: (nft.metadata as any)?.txHash || nft.txHash, tokenId: nft.tokenId, chain: nft.chain },
      product: product
        ? {
            title: product.title,
            sku: product.sku,
            material: product.material,
            origin: product.origin,
            manufacturingDate: product.manufacturingDate,
            rarity: product.rarity,
            collection: product.collection,
            images: product.images,
            videos: product.videos,
          }
        : null,
    });
  } catch (e) {
    next(e);
  }
});

export default router;

