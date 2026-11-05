import { StockMovementType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { io } from '../../server';
import { formatPaginatedResult } from '../../utils/pagination';

export class InventoryService {
  // ==========================================
  // INGREDIENTS
  // ==========================================

  async getIngredients(branchId?: number, lowStockOnly = false) {
    const ingredients = await prisma.ingredient.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        deletedAt: null,
      },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { name: 'asc' },
    });

    if (lowStockOnly) {
      return ingredients.filter(
        (i) => Number(i.currentStock) <= Number(i.lowStockThreshold)
      );
    }

    return ingredients;
  }

  async getIngredientById(id: number) {
    const ingredient = await prisma.ingredient.findFirst({
      where: { id, deletedAt: null },
      include: {
        supplier: true,
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!ingredient) throw new NotFoundError('Ingredient not found');
    return ingredient;
  }

  async createIngredient(data: {
    branchId: number;
    name: string;
    unit: string;
    currentStock?: number;
    lowStockThreshold?: number;
    costPerUnit?: number;
    supplierId?: number | null;
  }) {
    return prisma.ingredient.create({
      data: {
        branchId: data.branchId,
        name: data.name,
        unit: data.unit,
        currentStock: data.currentStock ?? 0,
        lowStockThreshold: data.lowStockThreshold ?? 5,
        costPerUnit: data.costPerUnit ?? 0,
        supplierId: data.supplierId || null,
      },
    });
  }

  async updateIngredient(id: number, data: any) {
    const ingredient = await prisma.ingredient.findFirst({ where: { id, deletedAt: null } });
    if (!ingredient) throw new NotFoundError('Ingredient not found');

    return prisma.ingredient.update({
      where: { id },
      data,
    });
  }

  async deleteIngredient(id: number) {
    const ingredient = await prisma.ingredient.findFirst({ where: { id, deletedAt: null } });
    if (!ingredient) throw new NotFoundError('Ingredient not found');

    await prisma.ingredient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  // ==========================================
  // STOCK MOVEMENTS & WASTAGE
  // ==========================================

  async recordStockMovement(
    data: {
      ingredientId: number;
      branchId?: number;
      type: StockMovementType;
      quantity: number;
      costPerUnit?: number | null;
      reference?: string | null;
      note?: string | null;
    },
    createdByUserId: number
  ) {
    const ingredient = await prisma.ingredient.findUnique({ where: { id: data.ingredientId } });
    if (!ingredient) throw new NotFoundError('Ingredient not found');

    const branchId = data.branchId || ingredient.branchId;

    // Determine stock direction
    let stockDelta = data.quantity;
    if (data.type === 'DEDUCTION' || data.type === 'WASTAGE' || data.type === 'RETURN') {
      stockDelta = -Math.abs(data.quantity);
    } else if (data.type === 'PURCHASE') {
      stockDelta = Math.abs(data.quantity);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedIngredient = await tx.ingredient.update({
        where: { id: data.ingredientId },
        data: {
          currentStock: {
            increment: stockDelta,
          },
          ...(data.costPerUnit ? { costPerUnit: data.costPerUnit } : {}),
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          ingredientId: data.ingredientId,
          branchId,
          type: data.type,
          quantity: data.quantity,
          costPerUnit: data.costPerUnit || ingredient.costPerUnit,
          reference: data.reference || null,
          note: data.note || null,
          createdBy: createdByUserId,
        },
      });

      // Low stock check
      if (Number(updatedIngredient.currentStock) <= Number(updatedIngredient.lowStockThreshold)) {
        io.to(`branch:${branchId}`).emit('stock:low', {
          ingredientId: updatedIngredient.id,
          name: updatedIngredient.name,
          currentStock: updatedIngredient.currentStock,
          unit: updatedIngredient.unit,
          threshold: updatedIngredient.lowStockThreshold,
        });
      }

      return { movement, updatedIngredient };
    });

    return result;
  }

  async recordWastage(
    data: {
      ingredientId: number;
      branchId?: number;
      quantity: number;
      reason: string;
    },
    recordedByUserId: number
  ) {
    const ingredient = await prisma.ingredient.findUnique({ where: { id: data.ingredientId } });
    if (!ingredient) throw new NotFoundError('Ingredient not found');

    const branchId = data.branchId || ingredient.branchId;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Wastage record
      const wastage = await tx.wastage.create({
        data: {
          branchId,
          ingredientId: data.ingredientId,
          quantity: data.quantity,
          reason: data.reason,
          recordedBy: recordedByUserId,
        },
      });

      // 2. Decrement stock
      const updatedIngredient = await tx.ingredient.update({
        where: { id: data.ingredientId },
        data: {
          currentStock: {
            decrement: data.quantity,
          },
        },
      });

      // 3. Record stock movement
      await tx.stockMovement.create({
        data: {
          ingredientId: data.ingredientId,
          branchId,
          type: 'WASTAGE',
          quantity: data.quantity,
          costPerUnit: ingredient.costPerUnit,
          reference: `Wastage #${wastage.id}`,
          note: data.reason,
          createdBy: recordedByUserId,
        },
      });

      return { wastage, updatedIngredient };
    });

    return result;
  }

  async getStockMovements(params: {
    ingredientId?: number;
    branchId?: number;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(params.ingredientId ? { ingredientId: params.ingredientId } : {}),
      ...(params.branchId ? { branchId: params.branchId } : {}),
    };

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          ingredient: { select: { id: true, name: true, unit: true } },
          createdByUser: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return formatPaginatedResult(movements, total, page, limit);
  }

  // ==========================================
  // RECIPES
  // ==========================================

  async getRecipesByMenuItem(menuItemId: number) {
    return prisma.recipe.findMany({
      where: { menuItemId },
      include: {
        ingredient: true,
        variant: true,
      },
    });
  }

  async saveRecipe(data: {
    menuItemId: number;
    variantId?: number | null;
    ingredientId: number;
    quantity: number;
    unit: string;
  }) {
    return prisma.recipe.upsert({
      where: {
        menuItemId_variantId_ingredientId: {
          menuItemId: data.menuItemId,
          variantId: data.variantId || null as any,
          ingredientId: data.ingredientId,
        },
      },
      update: {
        quantity: data.quantity,
        unit: data.unit,
      },
      create: {
        menuItemId: data.menuItemId,
        variantId: data.variantId || null,
        ingredientId: data.ingredientId,
        quantity: data.quantity,
        unit: data.unit,
      },
      include: { ingredient: true },
    });
  }

  async deleteRecipe(id: number) {
    await prisma.recipe.delete({ where: { id } });
    return { success: true };
  }
}

export const inventoryService = new InventoryService();
