import { Router } from 'express';
import Stripe from 'stripe';
import { Env, checkoutSchema } from '@dukeauth/core';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma, withTenant } from '@dukeauth/db';
import type { Request, Response } from 'express';

const router = Router();
const stripe = new Stripe(Env.STRIPE_SECRET_KEY(), { apiVersion: '2024-06-20' });

function priceForPlan(plan: 'Starter' | 'Pro' | 'Enterprise'): string {
  switch (plan) {
    case 'Starter':
      return Env.STRIPE_PRICE_STARTER();
    case 'Pro':
      return Env.STRIPE_PRICE_PRO();
    case 'Enterprise':
      return Env.STRIPE_PRICE_ENTERPRISE();
  }
}

router.post('/checkout', requireAuth, requireRole(['OWNER', 'ADMIN']), validate(checkoutSchema), async (req, res, next) => {
  try {
    if (!req.orgId) return res.status(400).json({ error: 'Tenant not resolved' });
    const { plan } = req.body as { plan: 'Starter' | 'Pro' | 'Enterprise' };
    const price = priceForPlan(plan);
    if (!price) return res.status(400).json({ error: 'Plan not configured' });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      success_url: `${Env.API_BASE_URL()}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Env.API_BASE_URL()}/billing/cancel`,
      client_reference_id: req.orgId,
      metadata: { orgId: req.orgId, plan },
    });

    res.json({ url: session.url });
  } catch (e) {
    next(e);
  }
});

export async function billingWebhookHandler(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).send('Missing signature');
  const secret = Env.STRIPE_WEBHOOK_SECRET();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, secret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = (session.client_reference_id || session.metadata?.orgId) as string | undefined;
      const plan = (session.metadata?.plan as string) || 'Starter';
      if (orgId) {
        let periodEnd: Date | undefined;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
          );
          if (sub.current_period_end) periodEnd = new Date(sub.current_period_end * 1000);
        }
        await withTenant(orgId, async (tx) => {
          const existing = await tx.subscription.findFirst({ where: { organizationId: orgId } });
          if (existing) {
            await tx.subscription.update({ where: { id: existing.id }, data: { status: 'ACTIVE', plan, currentPeriodEnd: periodEnd } });
          } else {
            await tx.subscription.create({ data: { organizationId: orgId, status: 'ACTIVE', plan, currentPeriodEnd: periodEnd } });
          }
        });
      }
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send('Webhook handling error');
  }

  res.json({ received: true });
}

export default router;
