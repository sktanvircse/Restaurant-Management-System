import { z } from 'zod';

export const createExpenseCategorySchema = z.object({
  branchId: z.number().int().positive(),
  name: z.string().min(2, 'Category name is required'),
  isActive: z.boolean().default(true),
});

export const createExpenseSchema = z.object({
  branchId: z.number().int().positive(),
  expenseCategoryId: z.number().int().positive('Category ID is required'),
  description: z.string().min(3, 'Description is required'),
  amount: z.number().positive('Expense amount must be positive'),
  paymentMethod: z.string().min(2, 'Payment method is required'),
  receiptUrl: z.string().optional().nullable(),
  expenseDate: z.string(), // YYYY-MM-DD
});

export const updateExpenseSchema = createExpenseSchema.partial();
