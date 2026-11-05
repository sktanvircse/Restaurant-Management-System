import { z } from 'zod';

export const createTableSchema = z.object({
  branchId: z.number().int().positive(),
  tableNumber: z.string().min(1, 'Table number is required'),
  capacity: z.number().int().min(1).default(4),
  section: z.string().optional().nullable(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'INACTIVE']).default('AVAILABLE'),
});

export const updateTableSchema = createTableSchema.partial();

export const updateTableStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'INACTIVE']),
});

export const openTableSessionSchema = z.object({
  guestCount: z.number().int().min(1).optional(),
});

export const transferTableSchema = z.object({
  fromTableId: z.number().int().positive(),
  toTableId: z.number().int().positive(),
});
