import { z } from 'zod';

export const createReservationSchema = z.object({
  branchId: z.number().int().positive('Branch ID is required'),
  guestName: z.string().min(2, 'Guest name is required'),
  guestPhone: z.string().min(10, 'Valid phone number is required'),
  guestEmail: z.string().email('Invalid email').optional().nullable(),
  reservedAt: z.string().datetime('Valid reservation datetime is required'),
  partySize: z.number().int().min(1, 'Party size must be at least 1'),
  tablePreference: z.string().optional().nullable(),
  tableId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateReservationStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  tableId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});
