import { z } from 'zod';

export const createReviewSchema = z.object({
  orderId: z.number().int().positive('Order ID is required'),
  foodRating: z.number().int().min(1).max(5),
  serviceRating: z.number().int().min(1).max(5).optional().nullable(),
  overallRating: z.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
});

export const replyReviewSchema = z.object({
  managerReply: z.string().min(2, 'Reply text is required'),
});
