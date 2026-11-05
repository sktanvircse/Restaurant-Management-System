import { z } from 'zod';

export const updateCustomerProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(10).optional().nullable(),
  avatar: z.string().optional().nullable(),
});

export const createAddressSchema = z.object({
  label: z.string().default('Home'),
  line1: z.string().min(3, 'Address line 1 is required'),
  line2: z.string().optional().nullable(),
  city: z.string().default('Dhaka'),
  area: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();
