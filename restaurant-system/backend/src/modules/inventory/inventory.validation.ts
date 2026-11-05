import { z } from 'zod';

export const createIngredientSchema = z.object({
  branchId: z.number().int().positive(),
  name: z.string().min(2, 'Ingredient name is required'),
  unit: z.string().min(1, 'Unit is required (e.g. kg, L, pcs)'),
  currentStock: z.number().min(0).default(0),
  lowStockThreshold: z.number().min(0).default(5),
  costPerUnit: z.number().min(0).default(0),
  supplierId: z.number().int().positive().optional().nullable(),
});

export const updateIngredientSchema = createIngredientSchema.partial();

export const recordStockMovementSchema = z.object({
  ingredientId: z.number().int().positive(),
  branchId: z.number().int().positive().optional(),
  type: z.enum(['PURCHASE', 'ADJUSTMENT', 'DEDUCTION', 'WASTAGE', 'RETURN']),
  quantity: z.number(), // positive for in/purchases, negative for out/deductions
  costPerUnit: z.number().optional().nullable(),
  reference: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const recordWastageSchema = z.object({
  ingredientId: z.number().int().positive(),
  branchId: z.number().int().positive().optional(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  reason: z.string().min(3, 'Wastage reason is required'),
});

export const createRecipeSchema = z.object({
  menuItemId: z.number().int().positive(),
  variantId: z.number().int().positive().optional().nullable(),
  ingredientId: z.number().int().positive(),
  quantity: z.number().positive('Recipe quantity must be positive'),
  unit: z.string().min(1),
});
