import { z } from 'zod';

export const createSupplierSchema = z.object({
  branchId: z.number().int().positive(),
  name: z.string().min(2, 'Supplier name is required'),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().min(6, 'Valid phone number is required'),
  email: z.string().email('Invalid email').optional().nullable(),
  address: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const createPurchaseOrderSchema = z.object({
  branchId: z.number().int().positive(),
  supplierId: z.number().int().positive('Supplier ID is required'),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        ingredientId: z.number().int().positive('Ingredient ID is required'),
        quantity: z.number().positive('Quantity must be positive'),
        unitCost: z.number().min(0, 'Unit cost must be 0 or positive'),
      })
    )
    .min(1, 'At least one purchase item is required'),
});

export const receivePurchaseOrderSchema = z.object({
  receivedItems: z
    .array(
      z.object({
        purchaseItemId: z.number().int().positive(),
        receivedQty: z.number().positive('Received quantity must be positive'),
      })
    )
    .min(1, 'At least one received item line is required'),
});
