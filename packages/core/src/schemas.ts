import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(2),
  subdomain: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totp: z.string().optional(),
});

export const accountRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const orderCreateSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  buyerEmail: z.string().email().optional(),
  buyerWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
});

export const brandingUpdateSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  customDomain: z.string().optional(),
});

export const productCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  currency: z.literal('USD').default('USD'),
  inventory: z.number().int().nonnegative(),
  images: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
  collection: z.string().optional(),
  sku: z.string().optional(),
  material: z.string().optional(),
  origin: z.string().optional(),
  manufacturingDate: z.string().datetime().optional(),
  rarity: z.string().optional(),
  variant: z.string().optional(),
  attributes: z.record(z.any()).optional(),
  mintOn: z.enum(['MANUAL', 'ON_CREATE']).default('MANUAL'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

export const productUpdateSchema = productCreateSchema.partial();

export const signUploadSchema = z.object({
  contentType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'model/gltf+json',
  ]),
  filename: z.string().min(1),
});

export const nftCreateSchema = z.object({
  productId: z.string().min(1),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenURI: z.string().url(),
});

export const apiKeyCreateSchema = z.object({
  name: z.string().optional(),
});

export const checkoutSchema = z.object({
  plan: z.enum(['Starter', 'Pro', 'Enterprise']),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AccountRegisterInput = z.infer<typeof accountRegisterSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type BrandingUpdateInput = z.infer<typeof brandingUpdateSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type SignUploadInput = z.infer<typeof signUploadSchema>;
export type ApiKeyCreateInput = z.infer<typeof apiKeyCreateSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type NftCreateInput = z.infer<typeof nftCreateSchema>;
