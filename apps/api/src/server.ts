import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import { Env } from '@dukeauth/core';
import { errorHandler } from './middleware/errors';
import { tenantResolver } from './middleware/tenant';
import authRouter from './routes/auth';
import accountRouter from './routes/account';
import productsRouter from './routes/products';
import uploadsRouter from './routes/uploads';
import billingRouter, { billingWebhookHandler } from './routes/billing';
import apiKeysRouter from './routes/apikeys';
import ordersRouter, { ordersWebhookHandler } from './routes/orders';
import nftsRouter from './routes/nfts';

export const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
// Stripe webhook needs raw body; mount it before JSON parser
app.post('/billing/webhook', express.raw({ type: 'application/json' }), billingWebhookHandler);
app.post('/orders/webhook', express.raw({ type: 'application/json' }), ordersWebhookHandler);
app.use(express.json({ limit: '2mb' }));
app.use(pinoHttp({ logger }));
app.use(rateLimit({ windowMs: 60_000, max: Env.RATE_LIMIT_MAX() }));

// Tenant resolver attaches req.orgId when possible
app.use(tenantResolver);

app.use('/auth', authRouter);
app.use('/account', accountRouter);
app.use('/products', productsRouter);
app.use('/uploads', uploadsRouter);
app.use('/billing', billingRouter);
app.use('/apikeys', apiKeysRouter);
app.use('/orders', ordersRouter);
app.use('/nfts', nftsRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(errorHandler);
