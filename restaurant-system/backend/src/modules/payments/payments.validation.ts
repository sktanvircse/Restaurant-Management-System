import { z } from 'zod';

export const createPaymentSchema = z.object({
  orderId: z.number().int().positive('Order ID is required'),
  method: z.enum(['Cash', 'Card', 'bKash', 'Nagad', 'SSLCommerz', 'Other']),
  paymentMethodId: z.number().int().positive().optional().nullable(),
  amount: z.number().positive('Payment amount must be greater than 0'),
  transactionId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const splitPaymentSchema = z.object({
  orderId: z.number().int().positive('Order ID is required'),
  payments: z
    .array(
      z.object({
        method: z.enum(['Cash', 'Card', 'bKash', 'Nagad', 'SSLCommerz', 'Other']),
        amount: z.number().positive('Amount must be positive'),
        transactionId: z.string().optional().nullable(),
      })
    )
    .min(1, 'At least one payment line is required'),
});

export const sslcommerzInitiateSchema = z.object({
  orderId: z.number().int().positive('Order ID is required'),
});
