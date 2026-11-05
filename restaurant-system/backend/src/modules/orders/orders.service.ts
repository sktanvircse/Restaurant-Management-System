import { OrderStatus, OrderType, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { io } from '../../server';
import { logger } from '../../config/logger';

export class OrdersService {
  /**
   * Generates unique order number: e.g. SG1-20261105-0042
   */
  private async generateOrderNumber(branchId: number): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await prisma.order.count({
      where: {
        branchId,
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });

    const sequence = String(countToday + 1).padStart(4, '0');
    return `SG${branchId}-${dateStr}-${sequence}`;
  }

  /**
   * Creates an Order (Dine-in, Takeaway, or Delivery)
   */
  async createOrder(
    data: {
      branchId: number;
      type: OrderType;
      tableId?: number | null;
      tableToken?: string | null;
      tableSessionId?: number | null;
      customerId?: number | null;
      guestName?: string | null;
      guestPhone?: string | null;
      addressId?: number | null;
      deliveryZoneId?: number | null;
      deliveryAddress?: any;
      notes?: string | null;
      couponCode?: string | null;
      items: Array<{
        menuItemId: number;
        variantId?: number | null;
        quantity: number;
        notes?: string | null;
        addonIds?: number[];
      }>;
    },
    staffUserId?: number
  ) {
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId },
    });
    if (!branch || !branch.isActive) {
      throw new BadRequestError('Branch not found or inactive');
    }

    // 1. Resolve Table & Session for Dine-In
    let resolvedTableId = data.tableId || null;
    let resolvedTableSessionId = data.tableSessionId || null;

    if (data.type === 'DINE_IN') {
      if (data.tableToken) {
        const table = await prisma.table.findUnique({
          where: { qrToken: data.tableToken },
          include: { sessions: { where: { status: 'OPEN' } } },
        });
        if (!table) throw new BadRequestError('Invalid table QR token');
        resolvedTableId = table.id;
        resolvedTableSessionId = table.sessions[0]?.id || null;
      }

      if (!resolvedTableId) {
        throw new BadRequestError('Table selection is required for dine-in orders');
      }

      // If no active session, automatically open one
      if (!resolvedTableSessionId) {
        const session = await prisma.tableSession.create({
          data: {
            tableId: resolvedTableId,
            openedBy: staffUserId || null,
            status: 'OPEN',
          },
        });
        resolvedTableSessionId = session.id;

        await prisma.table.update({
          where: { id: resolvedTableId },
          data: { status: 'OCCUPIED' },
        });

        io.to(`branch:${branch.id}`).emit('table:updated', {
          id: resolvedTableId,
          status: 'OCCUPIED',
        });
      }
    }

    // 2. Fetch all menu items & compute pricing
    const itemIds = data.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds }, branchId: data.branchId, deletedAt: null },
      include: {
        variants: true,
        addonGroups: {
          include: { addons: true },
        },
      },
    });

    const menuMap = new Map(menuItems.map((m) => [m.id, m]));

    // Check item availability
    for (const itemInput of data.items) {
      const item = menuMap.get(itemInput.menuItemId);
      if (!item) {
        throw new BadRequestError(`Menu item ID ${itemInput.menuItemId} is not available in this branch`);
      }
      if (!item.isAvailable) {
        throw new BadRequestError(`'${item.name}' is currently out of stock`);
      }
    }

    // 3. Compute item lines, unit prices, addons
    let subtotal = 0;
    const orderItemsData: any[] = [];
    const stationSet = new Set<string>();

    for (const input of data.items) {
      const item = menuMap.get(input.menuItemId)!;
      let unitPrice = Number(item.basePrice);

      // Check variant modifier
      if (input.variantId) {
        const variant = item.variants.find((v) => v.id === input.variantId);
        if (variant) {
          unitPrice += Number(variant.priceModifier);
        }
      }

      let addonsTotal = 0;
      const orderItemAddons: any[] = [];

      if (input.addonIds && input.addonIds.length > 0) {
        const allAddons = item.addonGroups.flatMap((g) => g.addons);
        for (const addonId of input.addonIds) {
          const addon = allAddons.find((a) => a.id === addonId);
          if (addon && addon.isAvailable) {
            addonsTotal += Number(addon.price);
            orderItemAddons.push({
              addonId: addon.id,
              price: addon.price,
            });
          }
        }
      }

      const lineTotal = (unitPrice + addonsTotal) * input.quantity;
      subtotal += lineTotal;
      stationSet.add(item.station || 'MAIN');

      orderItemsData.push({
        menuItemId: item.id,
        variantId: input.variantId || null,
        quantity: input.quantity,
        unitPrice,
        totalPrice: lineTotal,
        notes: input.notes || null,
        kitchenStation: item.station || 'MAIN',
        addons: {
          create: orderItemAddons,
        },
      });
    }

    // 4. Validate and apply coupon if provided
    let discountAmount = 0;
    let appliedCouponId: number | null = null;

    if (data.couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          branchId: data.branchId,
          code: data.couponCode.toUpperCase(),
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      });

      if (coupon) {
        if (subtotal >= Number(coupon.minOrderAmount)) {
          if (coupon.type === 'PERCENTAGE') {
            discountAmount = (subtotal * Number(coupon.value)) / 100;
            if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
              discountAmount = Number(coupon.maxDiscount);
            }
          } else if (coupon.type === 'FLAT') {
            discountAmount = Number(coupon.value);
          }
          appliedCouponId = coupon.id;
        }
      }
    }

    // 5. Calculate Tax and Service Charge
    const taxRate = Number(branch.taxRate) || 0;
    const serviceRate = data.type === 'DINE_IN' ? Number(branch.serviceChargeRate) || 0 : 0;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = (taxableAmount * taxRate) / 100;
    const serviceCharge = (taxableAmount * serviceRate) / 100;

    // 6. Delivery charge calculation
    let deliveryCharge = 0;
    if (data.type === 'DELIVERY' && data.deliveryZoneId) {
      const zone = await prisma.deliveryZone.findUnique({
        where: { id: data.deliveryZoneId },
      });
      if (zone) {
        deliveryCharge = Number(zone.deliveryCharge);
      }
    }

    const totalAmount = Math.round(
      (taxableAmount + taxAmount + serviceCharge + deliveryCharge) * 100
    ) / 100;

    const orderNumber = await this.generateOrderNumber(branch.id);

    // 7. Execute Transaction: Create Order, Items, Tickets, History
    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          branchId: data.branchId,
          tableSessionId: resolvedTableSessionId,
          customerId: data.customerId || null,
          createdByUserId: staffUserId || null,
          type: data.type,
          status: 'PENDING',
          subtotal,
          discountAmount,
          taxAmount,
          serviceCharge,
          deliveryCharge,
          totalAmount,
          notes: data.notes || null,
          couponId: appliedCouponId,
          guestName: data.guestName || null,
          guestPhone: data.guestPhone || null,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
              variant: true,
              addons: { include: { addon: true } },
            },
          },
          tableSession: {
            include: { table: true },
          },
          customer: true,
        },
      });

      // Status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: null,
          toStatus: 'PENDING',
          changedBy: staffUserId || null,
          note: 'Order placed',
        },
      });

      // Create Kitchen Tickets for each station present
      for (const station of stationSet) {
        await tx.kitchenTicket.create({
          data: {
            orderId: order.id,
            branchId: order.branchId,
            station,
            status: 'NEW',
          },
        });
      }

      // If delivery, create delivery record
      if (data.type === 'DELIVERY') {
        let addressId = data.addressId || null;

        // If customer provided an inline delivery address
        if (!addressId && data.deliveryAddress && data.customerId) {
          const newAddress = await tx.address.create({
            data: {
              customerId: data.customerId,
              line1: data.deliveryAddress.line1,
              line2: data.deliveryAddress.line2 || null,
              city: data.deliveryAddress.city || 'Dhaka',
              area: data.deliveryAddress.area || null,
            },
          });
          addressId = newAddress.id;
        }

        await tx.delivery.create({
          data: {
            orderId: order.id,
            deliveryZoneId: data.deliveryZoneId || null,
            addressId,
            status: 'PENDING',
            codAmount: totalAmount,
          },
        });
      }

      // If coupon used, increment coupon used count & create coupon usage
      if (appliedCouponId) {
        await tx.coupon.update({
          where: { id: appliedCouponId },
          data: { usedCount: { increment: 1 } },
        });
        await tx.couponUsage.create({
          data: {
            couponId: appliedCouponId,
            orderId: order.id,
            customerId: data.customerId || null,
            discountApplied: discountAmount,
          },
        });
      }

      return order;
    });

    // 8. Real-Time Socket.IO Emissions
    // Kitchen Display
    io.to(`kitchen:${branch.id}`).emit('order:new', {
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      type: createdOrder.type,
      tableNumber: createdOrder.tableSession?.table?.tableNumber || null,
      items: createdOrder.items,
      createdAt: createdOrder.createdAt,
    });

    // POS & Branch staff
    io.to(`branch:${branch.id}`).emit('order:created', createdOrder);

    // Customer
    if (createdOrder.customerId) {
      io.to(`customer:${createdOrder.customerId}`).emit('order:created', createdOrder);
    }

    return createdOrder;
  }

  /**
   * Get Orders with Pagination and Filters
   */
  async getOrders(params: {
    branchId?: number;
    status?: OrderStatus;
    type?: OrderType;
    tableId?: number;
    customerId?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(params.branchId ? { branchId: params.branchId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.customerId ? { customerId: params.customerId } : {}),
      ...(params.tableId
        ? {
            tableSession: {
              tableId: params.tableId,
            },
          }
        : {}),
      ...(params.startDate || params.endDate
        ? {
            createdAt: {
              ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
              ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
            },
          }
        : {}),
      ...(params.search
        ? {
            OR: [
              { orderNumber: { contains: params.search } },
              { guestName: { contains: params.search } },
              { guestPhone: { contains: params.search } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              menuItem: { select: { id: true, name: true, image: true, station: true } },
              variant: { select: { id: true, name: true } },
              addons: { include: { addon: { select: { id: true, name: true } } } },
            },
          },
          tableSession: {
            include: {
              table: { select: { id: true, tableNumber: true, section: true } },
            },
          },
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          payments: {
            select: { id: true, method: true, amount: true, status: true },
          },
          delivery: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      orders,
      meta: { page, limit, total, totalPages },
    };
  }

  /**
   * Get Live Kitchen Orders (for Kitchen Display KDS)
   */
  async getKitchenOrders(branchId: number, station?: string) {
    return prisma.order.findMany({
      where: {
        branchId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'],
        },
        deletedAt: null,
      },
      include: {
        items: {
          where: station ? { kitchenStation: station } : {},
          include: {
            menuItem: { select: { id: true, name: true, prepTime: true, station: true } },
            variant: { select: { id: true, name: true } },
            addons: { include: { addon: { select: { id: true, name: true } } } },
          },
        },
        tableSession: {
          include: {
            table: { select: { tableNumber: true, section: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // oldest orders first
    });
  }

  /**
   * Get Full Order Details by ID
   */
  async getOrderById(id: number) {
    const order = await prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: {
          include: {
            menuItem: true,
            variant: true,
            addons: { include: { addon: true } },
          },
        },
        tableSession: {
          include: { table: true },
        },
        customer: true,
        assignedUser: { select: { id: true, name: true, email: true } },
        createdByUser: { select: { id: true, name: true } },
        statusHistory: {
          include: { changedByUser: { select: { id: true, name: true } } },
          orderBy: { changedAt: 'asc' },
        },
        payments: true,
        delivery: {
          include: {
            rider: { include: { user: { select: { id: true, name: true, phone: true } } } },
            address: true,
            deliveryZone: true,
          },
        },
        kitchenTickets: true,
        review: true,
      },
    });

    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  /**
   * Update Order Status with State Machine enforcement & recipe stock deduction
   */
  async updateOrderStatus(id: number, toStatus: OrderStatus, changedByUserId?: number, note?: string) {
    const order = await prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                recipes: {
                  include: { ingredient: true },
                },
              },
            },
          },
        },
        delivery: true,
        tableSession: true,
      },
    });

    if (!order) throw new NotFoundError('Order not found');

    const fromStatus = order.status;

    // If status is unchanged, skip
    if (fromStatus === toStatus) return order;

    // Check if terminal
    if (fromStatus === 'PAID' || fromStatus === 'VOIDED' || fromStatus === 'CANCELLED') {
      throw new BadRequestError(`Cannot update status of an order that is already ${fromStatus}`);
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: toStatus },
      });

      // Record status transition in history
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus,
          toStatus,
          changedBy: changedByUserId || null,
          note: note || `Status changed from ${fromStatus} to ${toStatus}`,
        },
      });

      // Update Kitchen tickets status if relevant
      if (toStatus === 'PREPARING') {
        await tx.kitchenTicket.updateMany({
          where: { orderId: id },
          data: { status: 'PREPARING', startedAt: new Date() },
        });
      } else if (toStatus === 'READY') {
        await tx.kitchenTicket.updateMany({
          where: { orderId: id },
          data: { status: 'READY', completedAt: new Date() },
        });
      }

      // If delivery and status changed, sync delivery record
      if (order.delivery) {
        let deliveryStatus: any = null;
        if (toStatus === 'ASSIGNED') deliveryStatus = 'ASSIGNED';
        else if (toStatus === 'OUT_FOR_DELIVERY') deliveryStatus = 'ON_THE_WAY';
        else if (toStatus === 'DELIVERED') deliveryStatus = 'DELIVERED';

        if (deliveryStatus) {
          await tx.delivery.update({
            where: { id: order.delivery.id },
            data: { status: deliveryStatus },
          });
        }
      }

      // -------------------------------------------------------------
      // AUTOMATED INVENTORY STOCK DEDUCTION
      // Triggered when order is marked SERVED (dine-in), PICKED_UP (takeaway), or DELIVERED (delivery)
      // -------------------------------------------------------------
      const isServedMoment =
        (toStatus === 'SERVED' && fromStatus !== 'SERVED') ||
        (toStatus === 'PICKED_UP' && fromStatus !== 'PICKED_UP') ||
        (toStatus === 'DELIVERED' && fromStatus !== 'DELIVERED');

      if (isServedMoment) {
        for (const orderItem of order.items) {
          const recipes = orderItem.menuItem.recipes;
          for (const recipe of recipes) {
            const deductionQty = Number(recipe.quantity) * orderItem.quantity;

            // Deduct from ingredient stock
            const updatedIngredient = await tx.ingredient.update({
              where: { id: recipe.ingredientId },
              data: {
                currentStock: {
                  decrement: deductionQty,
                },
              },
            });

            // Record stock movement
            await tx.stockMovement.create({
              data: {
                ingredientId: recipe.ingredientId,
                branchId: order.branchId,
                type: 'DEDUCTION',
                quantity: deductionQty,
                reference: order.orderNumber,
                note: `Auto-deducted for order ${order.orderNumber} (${orderItem.menuItem.name} x${orderItem.quantity})`,
                createdBy: changedByUserId || 1,
              },
            });

            // Check if stock is now below threshold
            if (Number(updatedIngredient.currentStock) <= Number(updatedIngredient.lowStockThreshold)) {
              logger.warn(`⚠️ LOW STOCK ALERT: ${updatedIngredient.name} (Current: ${updatedIngredient.currentStock} ${updatedIngredient.unit})`);
              io.to(`branch:${order.branchId}`).emit('stock:low', {
                ingredientId: updatedIngredient.id,
                name: updatedIngredient.name,
                currentStock: updatedIngredient.currentStock,
                unit: updatedIngredient.unit,
                threshold: updatedIngredient.lowStockThreshold,
              });
            }
          }
        }
      }

      return updated;
    });

    // Real-Time Socket Emissions
    io.to(`branch:${order.branchId}`).emit('order:status', {
      orderId: id,
      orderNumber: order.orderNumber,
      fromStatus,
      toStatus,
      updatedAt: new Date(),
    });

    io.to(`order:${id}`).emit('order:status', {
      orderId: id,
      status: toStatus,
    });

    if (order.customerId) {
      io.to(`customer:${order.customerId}`).emit('order:status', {
        orderId: id,
        status: toStatus,
      });
    }

    // Special sound alert emission when chef marks READY
    if (toStatus === 'READY') {
      io.to(`branch:${order.branchId}`).emit('kitchen:ready', {
        orderId: id,
        orderNumber: order.orderNumber,
        tableNumber: (order as any).tableSession?.table?.tableNumber || null,
        message: `Order ${order.orderNumber} is READY to serve!`,
      });
    }

    return updatedOrder;
  }

  /**
   * Void an order (Manager approval required)
   */
  async voidOrder(id: number, managerUserId: number, reason: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { tableSession: true },
    });

    if (!order) throw new NotFoundError('Order not found');
    if (order.status === 'PAID') {
      throw new BadRequestError('Paid orders cannot be voided; use refund instead');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const v = await tx.order.update({
        where: { id },
        data: { status: 'VOIDED' },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: 'VOIDED',
          changedBy: managerUserId,
          note: `ORDER VOIDED. Reason: ${reason}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: managerUserId,
          action: 'VOID_ORDER',
          module: 'orders',
          entityType: 'order',
          entityId: id,
          newValues: { reason, previousStatus: order.status },
        },
      });

      return v;
    });

    io.to(`branch:${order.branchId}`).emit('order:status', {
      orderId: id,
      orderNumber: order.orderNumber,
      status: 'VOIDED',
      reason,
    });

    return updated;
  }
}

export const ordersService = new OrdersService();
