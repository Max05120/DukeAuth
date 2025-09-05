import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errors';
import { tenantResolver } from './middleware/tenant';

import authRoutes from './routes/auth';
import productsRoutes from './routes/products';
import uploadsRoutes from './routes/uploads';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  })
);

app.get('/health', (_req, res) => res.json({ ok: true }));

// Resolve tenant from subdomain or API key
app.use(tenantResolver);

app.use('/auth', authRoutes);
app.use('/products', productsRoutes);
app.use('/uploads', uploadsRoutes);

app.use(errorHandler);

const port = parseInt(process.env.PORT || '3000', 10);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
});

