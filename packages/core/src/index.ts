export type TenantId = string;

export interface Env {
  DATABASE_URL: string;
  REDIS_URL?: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  BCRYPT_PEPPER?: string;
  ROOT_DOMAIN?: string;
  AWS_REGION?: string;
  AWS_S3_BUCKET?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  POLYGON_RPC_URL?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

export const getEnv = (): Env => {
  const e = process.env as Record<string, string | undefined>;
  if (!e.DATABASE_URL) throw new Error('DATABASE_URL missing');
  if (!e.JWT_SECRET) throw new Error('JWT_SECRET missing');
  if (!e.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET missing');
  return e as Env;
};

export const parseSubdomain = (host?: string, rootDomain?: string): string | null => {
  if (!host || !rootDomain) return null;
  const cleanHost = host.split(':')[0].toLowerCase();
  const cleanRoot = rootDomain.toLowerCase();
  if (!cleanHost.endsWith(cleanRoot)) return null;
  const remainder = cleanHost.slice(0, -cleanRoot.length).replace(/\.$/, '');
  if (!remainder) return null;
  const parts = remainder.split('.').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
};

