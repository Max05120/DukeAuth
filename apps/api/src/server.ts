import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Env } from '@dukeauth/core';
import { errorHandler } from './middleware/errors';
import { tenantResolver } from './middleware/tenant';
import authRouter from './routes/auth';
import productsRouter from './routes/products';
import uploadsRouter from './routes/uploads';
import apiKeysRouter from './routes/apikeys';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60_000, max: Env.RATE_LIMIT_MAX() }));

// Tenant resolver attaches req.orgId when possible
app.use(tenantResolver);

app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/uploads', uploadsRouter);
app.use('/apikeys', apiKeysRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(errorHandler);
