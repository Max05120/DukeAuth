import 'dotenv/config';

export function getEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env ${name}`);
  return v;
}

export const Env = {
  DATABASE_URL: () => getEnv('DATABASE_URL'),
  REDIS_URL: () => getEnv('REDIS_URL', 'redis://localhost:6379'),
  JWT_SECRET: () => getEnv('JWT_SECRET'),
  JWT_REFRESH_SECRET: () => getEnv('JWT_REFRESH_SECRET', getEnv('JWT_SECRET')),
  PASSWORD_PEPPER: () => getEnv('PASSWORD_PEPPER'),
  ROOT_DOMAIN: () => getEnv('ROOT_DOMAIN', 'localhost'),
  RATE_LIMIT_MAX: () => parseInt(getEnv('RATE_LIMIT_MAX', '100'), 10),
  S3_ENDPOINT: () => getEnv('S3_ENDPOINT', 'http://localhost:4566'),
  S3_BUCKET: () => getEnv('S3_BUCKET'),
  S3_ACCESS_KEY: () => getEnv('S3_ACCESS_KEY', 'test'),
  S3_SECRET_KEY: () => getEnv('S3_SECRET_KEY', 'test'),
  AWS_REGION: () => getEnv('AWS_REGION', 'us-east-1'),
  POLYGON_RPC_URL: () => getEnv('POLYGON_RPC_URL', ''),
  MINTER_PRIVATE_KEY: () => getEnv('MINTER_PRIVATE_KEY', ''),
  API_BASE_URL: () => getEnv('API_BASE_URL', 'http://localhost:4000'),
  STRIPE_SECRET_KEY: () => getEnv('STRIPE_SECRET_KEY', ''),
  STRIPE_WEBHOOK_SECRET: () => getEnv('STRIPE_WEBHOOK_SECRET', ''),
  STRIPE_PRICE_STARTER: () => getEnv('STRIPE_PRICE_STARTER', ''),
  STRIPE_PRICE_PRO: () => getEnv('STRIPE_PRICE_PRO', ''),
  STRIPE_PRICE_ENTERPRISE: () => getEnv('STRIPE_PRICE_ENTERPRISE', ''),
  FROM_EMAIL: () => getEnv('FROM_EMAIL', 'noreply@example.com'),
  RESEND_API_KEY: () => getEnv('RESEND_API_KEY', ''),
};

export function parseSubdomain(host: string, rootDomain: string): string | null {
  const normalized = host.toLowerCase().split(':')[0];
  if (normalized === rootDomain || normalized === `www.${rootDomain}`) return null;
  const suffix = `.${rootDomain}`;
  if (!normalized.endsWith(suffix)) return null;
  const sub = normalized.slice(0, -suffix.length);
  if (!sub || sub.includes('.')) return null;
  return sub;
}
