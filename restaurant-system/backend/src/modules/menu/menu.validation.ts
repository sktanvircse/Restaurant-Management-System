import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2).optional(),
  branchId: z.number().int().positive(),
  parentId: z.number().int().positive().optional().nullable(),
  image: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createMenuItemSchema = z.object({
  categoryId: z.number().int().positive('Category ID is required'),
  branchId: z.number().int().positive('Branch ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  basePrice: z.number().min(0, 'Price must be positive or 0'),
  station: z.enum(['GRILL', 'FRY', 'DRINKS', 'DESSERT', 'MAIN']).default('MAIN'),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  allergens: z.string().optional().nullable(),
  prepTime: z.number().int().min(1).default(15),
  sortOrder: z.number().int().default(0),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        priceModifier: z.number().default(0),
        isDefault: z.boolean().default(false),
        isAvailable: z.boolean().default(true),
      })
    )
    .optional(),
  addonGroups: z
    .array(
      z.object({
        name: z.string().min(1),
        isRequired: z.boolean().default(false),
        minSelect: z.number().int().default(0),
        maxSelect: z.number().int().default(1),
        addons: z.array(
          z.object({
            name: z.string().min(1),
            price: z.number().min(0).default(0),
            isAvailable: z.boolean().default(true),
          })
        ),
      })
    )
    .optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});
