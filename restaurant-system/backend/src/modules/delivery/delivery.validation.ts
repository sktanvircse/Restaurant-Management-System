import { z } from 'zod';

export const createZoneSchema = z.object({
  branchId: z.number().int().positive(),
  name: z.string().min(2, 'Zone name is required'),
  deliveryCharge: z.number().min(0, 'Delivery charge must be 0 or positive'),
  estimatedMinutes: z.number().int().min(5).default(30),
  isActive: z.boolean().default(true),
});

export const updateZoneSchema = createZoneSchema.partial();

export const createRiderSchema = z.object({
  userId: z.number().int().positive('User ID is required'),
  branchId: z.number().int().positive('Branch ID is required'),
  vehicleType: z.string().default('Motorcycle'),
  vehicleNumber: z.string().optional().nullable(),
  isAvailable: z.boolean().default(true),
});

export const updateRiderAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const assignDeliverySchema = z.object({
  orderId: z.number().int().positive(),
  riderId: z.number().int().positive(),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'FAILED', 'RETURNED']),
  notes: z.string().optional().nullable(),
});

export const submitCODSchema = z.object({
  codAmount: z.number().positive('COD Amount must be greater than 0'),
});
