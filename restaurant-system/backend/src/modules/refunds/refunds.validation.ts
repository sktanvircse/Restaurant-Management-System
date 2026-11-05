import { z } from 'zod';

export const requestRefundSchema = z.object({
  orderId: z.number().int().positive('Order ID is required'),
  paymentId: z.number().int().positive().optional().nullable(),
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const resolveRefundSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().optional().nullable(),
});
