import { DeliveryStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { io } from '../../server';

export class DeliveryService {
  // ==========================================
  // DELIVERY ZONES
  // ==========================================

  async getZones(branchId?: number) {
    return prisma.deliveryZone.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createZone(data: {
    branchId: number;
    name: string;
    deliveryCharge: number;
    estimatedMinutes?: number;
    isActive?: boolean;
  }) {
    return prisma.deliveryZone.create({
      data: {
        branchId: data.branchId,
        name: data.name,
        deliveryCharge: data.deliveryCharge,
        estimatedMinutes: data.estimatedMinutes ?? 30,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateZone(id: number, data: any) {
    const zone = await prisma.deliveryZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundError('Delivery zone not found');
    return prisma.deliveryZone.update({ where: { id }, data });
  }

  async deleteZone(id: number) {
    const zone = await prisma.deliveryZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundError('Delivery zone not found');
    await prisma.deliveryZone.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }

  // ==========================================
  // RIDERS
  // ==========================================

  async getRiders(branchId?: number, onlyAvailable = false) {
    return prisma.rider.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(onlyAvailable ? { isAvailable: true } : {}),
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
        _count: {
          select: {
            deliveries: {
              where: {
                status: { in: ['ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'] },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRider(data: {
    userId: number;
    branchId: number;
    vehicleType?: string;
    vehicleNumber?: string | null;
    isAvailable?: boolean;
  }) {
    const existing = await prisma.rider.findUnique({ where: { userId: data.userId } });
    if (existing) throw new BadRequestError('User is already registered as a rider');

    return prisma.rider.create({
      data: {
        userId: data.userId,
        branchId: data.branchId,
        vehicleType: data.vehicleType || 'Motorcycle',
        vehicleNumber: data.vehicleNumber || null,
        isAvailable: data.isAvailable ?? true,
      },
      include: { user: true },
    });
  }

  async updateRiderAvailability(riderId: number, isAvailable: boolean) {
    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    if (!rider) throw new NotFoundError('Rider not found');

    const updated = await prisma.rider.update({
      where: { id: riderId },
      data: { isAvailable },
      include: { user: true },
    });

    io.to(`branch:${rider.branchId}`).emit('rider:availability', {
      riderId,
      isAvailable,
    });

    return updated;
  }

  // ==========================================
  // DELIVERIES & DISPATCH
  // ==========================================

  async assignDelivery(orderId: number, riderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    });
    if (!order) throw new NotFoundError('Order not found');

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      include: { user: true },
    });
    if (!rider) throw new NotFoundError('Rider not found');

    const delivery = await prisma.$transaction(async (tx) => {
      let d = order.delivery;
      if (!d) {
        d = await tx.delivery.create({
          data: {
            orderId: order.id,
            riderId,
            status: 'ASSIGNED',
            assignedAt: new Date(),
            codAmount: order.totalAmount,
          },
        });
      } else {
        d = await tx.delivery.update({
          where: { id: d.id },
          data: {
            riderId,
            status: 'ASSIGNED',
            assignedAt: new Date(),
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'ASSIGNED' },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: 'ASSIGNED',
          note: `Delivery assigned to rider ${rider.user.name}`,
        },
      });

      return d;
    });

    // Notify Rider in real-time
    io.to(`rider:${rider.userId}`).emit('delivery:assigned', {
      deliveryId: delivery.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    });

    io.to(`branch:${order.branchId}`).emit('delivery:updated', {
      orderId: order.id,
      riderName: rider.user.name,
      status: 'ASSIGNED',
    });

    return delivery;
  }

  async updateDeliveryStatus(
    deliveryId: number,
    status: DeliveryStatus,
    notes?: string | null
  ) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true, rider: { include: { user: true } } },
    });
    if (!delivery) throw new NotFoundError('Delivery not found');

    const data: any = { status, notes: notes || delivery.notes };
    if (status === 'PICKED_UP') data.pickedUpAt = new Date();
    if (status === 'DELIVERED') data.deliveredAt = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const d = await tx.delivery.update({
        where: { id: deliveryId },
        data,
      });

      let orderStatus: any = delivery.order.status;
      if (status === 'PICKED_UP' || status === 'ON_THE_WAY') orderStatus = 'OUT_FOR_DELIVERY';
      if (status === 'DELIVERED') orderStatus = 'DELIVERED';
      if (status === 'FAILED') orderStatus = 'FAILED';
      if (status === 'RETURNED') orderStatus = 'RETURNED';

      if (orderStatus !== delivery.order.status) {
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: orderStatus },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: delivery.orderId,
            fromStatus: delivery.order.status,
            toStatus: orderStatus,
            note: notes || `Delivery updated to ${status}`,
          },
        });
      }

      return d;
    });

    // Live update broadcast
    io.to(`order:${delivery.orderId}`).emit('delivery:tracking', {
      orderId: delivery.orderId,
      status,
      updatedAt: new Date(),
    });

    io.to(`branch:${delivery.order.branchId}`).emit('delivery:updated', {
      orderId: delivery.orderId,
      status,
    });

    return updated;
  }

  /**
   * Cash on Delivery (COD) cash submission by rider to cashier/accountant
   */
  async submitCODCash(deliveryId: number, cashierUserId: number) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true, rider: { include: { user: true } } },
    });

    if (!delivery) throw new NotFoundError('Delivery not found');
    if (delivery.codCollected) throw new BadRequestError('COD cash already collected for this delivery');

    const activeSession = await prisma.cashRegisterSession.findFirst({
      where: {
        branchId: delivery.order.branchId,
        cashierId: cashierUserId,
        status: 'OPEN',
      },
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark delivery COD collected
      const d = await tx.delivery.update({
        where: { id: deliveryId },
        data: { codCollected: true },
      });

      // 2. Create Payment record (Cash)
      await tx.payment.create({
        data: {
          orderId: delivery.orderId,
          method: 'Cash',
          amount: delivery.codAmount,
          status: 'COMPLETED',
          processedBy: cashierUserId,
        },
      });

      // 3. Mark order as PAID if not already
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: 'PAID' },
      });

      // 4. Log in money_received for drawer reconciliation
      await tx.moneyReceived.create({
        data: {
          branchId: delivery.order.branchId,
          cashRegisterSessionId: activeSession?.id || null,
          source: `COD Delivery #${delivery.order.orderNumber}`,
          amount: delivery.codAmount,
          paymentMethod: 'Cash',
          referenceNo: delivery.order.orderNumber,
          notes: `Rider ${delivery.rider?.user.name} submitted COD cash`,
          createdBy: cashierUserId,
        },
      });

      // 5. Update rider total earnings / delivery count
      if (delivery.riderId) {
        await tx.rider.update({
          where: { id: delivery.riderId },
          data: {
            totalEarnings: { increment: 40 }, // Flat delivery commission
          },
        });
      }

      return d;
    });

    io.to(`branch:${delivery.order.branchId}`).emit('delivery:cod:collected', {
      deliveryId,
      orderId: delivery.orderId,
      amount: delivery.codAmount,
    });

    return result;
  }

  async getActiveDeliveries(branchId?: number) {
    return prisma.delivery.findMany({
      where: {
        ...(branchId ? { order: { branchId } } : {}),
        status: { in: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'] },
      },
      include: {
        order: {
          include: {
            customer: true,
            items: { include: { menuItem: true } },
          },
        },
        rider: { include: { user: true } },
        address: true,
        deliveryZone: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRiderDeliveries(userId: number) {
    const rider = await prisma.rider.findUnique({ where: { userId } });
    if (!rider) throw new NotFoundError('Rider profile not found for this user');

    return prisma.delivery.findMany({
      where: { riderId: rider.id },
      include: {
        order: {
          include: {
            customer: true,
            items: { include: { menuItem: true } },
          },
        },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const deliveryService = new DeliveryService();
