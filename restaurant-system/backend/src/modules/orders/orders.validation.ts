import { z } from 'zod';

export const orderItemInputSchema = z.object({
  menuItemId: z.number().int().positive('Menu item ID is required'),
  variantId: z.number().int().positive().optional().nullable(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional().nullable(),
  addonIds: z.array(z.number().int().positive()).optional(),
});

export const createOrderSchema = z.object({
  branchId: z.number().int().positive('Branch ID is required'),
  type: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
  
  // Dine-in fields
  tableId: z.number().int().positive().optional().nullable(),
  tableToken: z.string().optional().nullable(), // QR token
  tableSessionId: z.number().int().positive().optional().nullable(),
  
  // Customer / Guest fields
  customerId: z.number().int().positive().optional().nullable(),
  guestName: z.string().optional().nullable(),
  guestPhone: z.string().optional().nullable(),
  
  // Delivery fields
  addressId: z.number().int().positive().optional().nullable(),
  deliveryZoneId: z.number().int().positive().optional().nullable(),
  deliveryAddress: z
    .object({
      line1: z.string().min(3),
      line2: z.string().optional(),
      area: z.string().optional(),
      city: z.string().default('Dhaka'),
    })
    .optional(),
  
  notes: z.string().optional().nullable(),
  couponCode: z.string().optional().nullable(),
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'SERVED',
    'BILLED',
    'PICKED_UP',
    'ASSIGNED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'PAID',
    'CANCELLED',
    'VOIDED',
  ]),
  note: z.string().optional().nullable(),
});

export const voidOrderSchema = z.object({
  reason: z.string().min(5, 'A reason of at least 5 characters is required to void an order'),
});
