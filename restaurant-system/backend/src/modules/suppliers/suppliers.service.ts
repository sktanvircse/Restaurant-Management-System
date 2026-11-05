import { PurchaseOrderStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { formatPaginatedResult } from '../../utils/pagination';

export class SuppliersService {
  // ==========================================
  // SUPPLIERS
  // ==========================================

  async getSuppliers(branchId?: number) {
    return prisma.supplier.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        deletedAt: null,
      },
      include: {
        _count: {
          select: { ingredients: true, purchaseOrders: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createSupplier(data: {
    branchId: number;
    name: string;
    contactPerson?: string | null;
    phone: string;
    email?: string | null;
    address?: string | null;
    isActive?: boolean;
  }) {
    return prisma.supplier.create({
      data: {
        branchId: data.branchId,
        name: data.name,
        contactPerson: data.contactPerson || null,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateSupplier(id: number, data: any) {
    const supplier = await prisma.supplier.findFirst({ where: { id, deletedAt: null } });
    if (!supplier) throw new NotFoundError('Supplier not found');

    return prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async deleteSupplier(id: number) {
    const supplier = await prisma.supplier.findFirst({ where: { id, deletedAt: null } });
    if (!supplier) throw new NotFoundError('Supplier not found');

    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  // ==========================================
  // PURCHASE ORDERS
  // ==========================================

  private async generatePONumber(branchId: number): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.purchaseOrder.count({
      where: {
        branchId,
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });

    return `PO${branchId}-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }

  async createPurchaseOrder(
    data: {
      branchId: number;
      supplierId: number;
      notes?: string | null;
      items: Array<{
        ingredientId: number;
        quantity: number;
        unitCost: number;
      }>;
    },
    createdByUserId: number
  ) {
    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier) throw new NotFoundError('Supplier not found');

    const orderNumber = await this.generatePONumber(data.branchId);

    let totalAmount = 0;
    const itemsData = data.items.map((item) => {
      const lineCost = item.quantity * item.unitCost;
      totalAmount += lineCost;
      return {
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: lineCost,
      };
    });

    return prisma.purchaseOrder.create({
      data: {
        orderNumber,
        branchId: data.branchId,
        supplierId: data.supplierId,
        totalAmount,
        notes: data.notes || null,
        createdBy: createdByUserId,
        status: 'DRAFT',
        items: {
          create: itemsData,
        },
      },
      include: {
        supplier: true,
        items: { include: { ingredient: true } },
      },
    });
  }

  async getPurchaseOrders(params: {
    branchId?: number;
    status?: PurchaseOrderStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(params.branchId ? { branchId: params.branchId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [pos, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
          createdByUser: { select: { id: true, name: true } },
          items: { include: { ingredient: { select: { id: true, name: true, unit: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return formatPaginatedResult(pos, total, page, limit);
  }

  /**
   * Receive goods for a Purchase Order:
   * Increments current stock for each received ingredient and records a PURCHASE stock movement!
   */
  async receivePurchaseOrder(
    poId: number,
    receivedItems: Array<{ purchaseItemId: number; receivedQty: number }>,
    receivedByUserId: number
  ) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: { include: { ingredient: true } } },
    });

    if (!po) throw new NotFoundError('Purchase Order not found');
    if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot receive goods on PO with status ${po.status}`);
    }

    const itemMap = new Map(po.items.map((i) => [i.id, i]));

    const result = await prisma.$transaction(async (tx) => {
      for (const rec of receivedItems) {
        const item = itemMap.get(rec.purchaseItemId);
        if (!item) continue;

        // 1. Update purchase item receivedQty
        await tx.purchaseItem.update({
          where: { id: rec.purchaseItemId },
          data: {
            receivedQty: { increment: rec.receivedQty },
          },
        });

        // 2. Increment ingredient current stock & update costPerUnit
        await tx.ingredient.update({
          where: { id: item.ingredientId },
          data: {
            currentStock: { increment: rec.receivedQty },
            costPerUnit: item.unitCost,
          },
        });

        // 3. Record stock movement
        await tx.stockMovement.create({
          data: {
            ingredientId: item.ingredientId,
            branchId: po.branchId,
            type: 'PURCHASE',
            quantity: rec.receivedQty,
            costPerUnit: item.unitCost,
            reference: po.orderNumber,
            note: `Received from PO ${po.orderNumber}`,
            createdBy: receivedByUserId,
          },
        });
      }

      // Check if all items are fully received
      const updatedPo = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true },
      });

      const allReceived = updatedPo?.items.every(
        (i) => Number(i.receivedQty) >= Number(i.quantity)
      );

      const finalStatus: PurchaseOrderStatus = allReceived ? 'RECEIVED' : 'PARTIAL';

      return tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: finalStatus,
          receivedAt: new Date(),
        },
        include: {
          supplier: true,
          items: { include: { ingredient: true } },
        },
      });
    });

    return result;
  }
}

export const suppliersService = new SuppliersService();
