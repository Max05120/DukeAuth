import { Router } from 'express';
import { withTenant, prisma } from '@dukeauth/db';
import { HttpError } from '../middleware/errors';
import { orderCreateSchema } from '@dukeauth/core';
import { validate } from '../middleware/validate';
import Stripe from 'stripe';
import { Env } from '@dukeauth/core';

const router = Router();
const stripe = new Stripe(Env.STRIPE_SECRET_KEY(), { apiVersion: '2024-06-20' });

router.post('/', validate(orderCreateSchema), async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const { productId, quantity, buyerEmail } = req.body as any;
    const product = await withTenant(req.orgId, (tx) => tx.product.findUnique({ where: { id: productId } }));
    if (!product) throw new HttpError(404, 'Product not found');
    const amountCents = product.priceCents * (quantity || 1);

    // Create order in DB first (PENDING)
    const order = await withTenant(req.orgId, (tx) =>
      tx.order.create({
        data: {
          organizationId: req.orgId!,
          userId: req.userId,
          buyerEmail: buyerEmail || null,
          status: 'PENDING',
          amountCents,
          currency: product.currency,
        },
      }),
    );

    // Create Stripe PaymentIntent
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: (product.currency || 'USD').toLowerCase(),
      metadata: { orderId: order.id, orgId: req.orgId! },
      receipt_email: buyerEmail,
      automatic_payment_methods: { enabled: true },
    });

    await withTenant(req.orgId, (tx) => tx.order.update({ where: { id: order.id }, data: { stripePaymentIntentId: pi.id } }));

    res.status(201).json({ orderId: order.id, clientSecret: pi.client_secret });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!req.orgId) throw new HttpError(400, 'Tenant not resolved');
    const order = await withTenant(req.orgId, (tx) => tx.order.findUnique({ where: { id: req.params.id } }));
    if (!order) throw new HttpError(404, 'Order not found');
    res.json(order);
  } catch (e) {
    next(e);
  }
});

export default router;

