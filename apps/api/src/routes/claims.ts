import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth, requireRole } from '../middleware/auth';
import { withTenant } from '@dukeauth/db';
import { HttpError } from '../middleware/errors';

const router = Router();

// Maker creates a claim token for a specific NFT (to be embedded as QR/NFC)
router.post('/:nftId', requireAuth, requireRole(['OWNER', 'ADMIN', 'STAFF']), async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const nftId = req.params.nftId;
    const token = crypto.randomBytes(24).toString('hex');
    const claim = await withTenant(req.orgId, (tx) => tx.claimToken.create({ data: { organizationId: req.orgId!, nftId, token } }));
    res.status(201).json({ token: claim.token });
  } catch (e) {
    next(e);
  }
});

// Public: resolve claim token to NFT provenance
router.get('/resolve/:token', async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const token = req.params.token;
    const claim = await withTenant(req.orgId, (tx) => tx.claimToken.findUnique({ where: { token } }));
    if (!claim) throw new HttpError(404, 'Invalid token');
    const nft = await withTenant(req.orgId, (tx) => tx.nft.findUnique({ where: { id: claim.nftId } }));
    if (!nft) throw new HttpError(404, 'NFT not found');
    res.json({ nftId: nft.id, txHash: (nft.metadata as any)?.txHash || nft.txHash });
  } catch (e) {
    next(e);
  }
});

export default router;

