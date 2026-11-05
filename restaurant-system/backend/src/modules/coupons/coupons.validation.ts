import { z } from 'zod';

export const createCouponSchema = z.object({
  branchId: z.number().int().positive(),
  code: z.string().min(3).max(30).toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FLAT', 'FREE_DELIVERY']),
  value: z.number().positive('Coupon value must be positive'),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  validFrom: z.string(), // ISO string
  validUntil: z.string(),
  isActive: z.boolean().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z.object({
  branchId: z.number().int().positive(),
  code: z.string().min(1),
  orderAmount: z.number().min(0),
});
