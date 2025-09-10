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
});

export const productCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  currency: z.literal('USD').default('USD'),
  inventory: z.number().int().nonnegative(),
  images: z.array(z.string()).default([]),
  attributes: z.record(z.any()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

export const productUpdateSchema = productCreateSchema.partial();

export const signUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  filename: z.string().min(1),
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
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type SignUploadInput = z.infer<typeof signUploadSchema>;
export type ApiKeyCreateInput = z.infer<typeof apiKeyCreateSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
