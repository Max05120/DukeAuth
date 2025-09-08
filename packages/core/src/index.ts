export * from './schemas';
export * from './env';
export * from './queues';
export * from './email';

export type Role = 'OWNER' | 'ADMIN' | 'STAFF' | 'VIEWER';
export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export const CURRENCY = 'USD' as const;

export const Plans = {
  Starter: 'Starter',
  Pro: 'Pro',
  Enterprise: 'Enterprise',
} as const;
