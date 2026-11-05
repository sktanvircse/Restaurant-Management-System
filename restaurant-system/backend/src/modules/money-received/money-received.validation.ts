import { z } from 'zod';

export const createMoneyReceivedSchema = z.object({
  branchId: z.number().int().positive().optional(),
  source: z.string().min(2, 'Source is required (e.g. Order, Advance, Deposit)'),
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMethod: z.string().min(2, 'Payment method is required'),
  referenceNo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
