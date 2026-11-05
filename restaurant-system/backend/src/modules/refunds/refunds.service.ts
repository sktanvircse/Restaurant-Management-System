import { RefundStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { io } from '../../server';
import { formatPaginatedResult } from '../../utils/pagination';

export class RefundsService {
  async requestRefund(
    data: {
      orderId: number;
      paymentId?: number | null;
      amount: number;
      reason: string;
    },
    requestedByUserId: number
  ) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { payments: { where: { status: 'COMPLETED' } } },
    });

    if (!order) throw new NotFoundError('Order not found');

    const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    if (totalPaid <= 0) {
      throw new BadRequestError('Cannot refund an order with no completed payments');
    }

    if (data.amount > totalPaid) {
      throw new BadRequestError(`Refund amount (${data.amount}) cannot exceed total paid (${totalPaid})`);
    }

    const refund = await prisma.refund.create({
      data: {
        orderId: order.id,
        paymentId: data.paymentId || order.payments[0]?.id || null,
        amount: data.amount,
        reason: data.reason,
        status: 'PENDING',
        requestedBy: requestedByUserId,
      },
      include: {
        order: { select: { id: true, orderNumber: true, totalAmount: true } },
        requestedByUser: { select: { id: true, name: true } },
      },
    });

    io.to(`branch:${order.branchId}`).emit('refund:requested', refund);
    return refund;
  }

  async resolveRefund(
    refundId: number,
    status: 'APPROVED' | 'REJECTED',
    approvedByUserId: number,
    note?: string | null
  ) {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: { order: { include: { payments: true } } },
    });

    if (!refund) throw new NotFoundError('Refund request not found');
    if (refund.status !== 'PENDING') {
      throw new BadRequestError(`Refund has already been ${refund.status.toLowerCase()}`);
    }

    const resolved = await prisma.$transaction(async (tx) => {
      const updated = await tx.refund.update({
        where: { id: refundId },
        data: {
          status,
          approvedBy: approvedByUserId,
          resolvedAt: new Date(),
        },
      });

      if (status === 'APPROVED' && refund.paymentId) {
        await tx.payment.update({
          where: { id: refund.paymentId },
          data: {
            status: Number(refund.amount) >= Number(refund.order.totalAmount) ? 'REFUNDED' : 'PARTIAL_REFUND',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: approvedByUserId,
          action: `REFUND_${status}`,
          module: 'payments',
          entityType: 'refund',
          entityId: refundId,
          newValues: { status, note },
        },
      });

      return updated;
    });

    io.to(`branch:${refund.order.branchId}`).emit('refund:resolved', {
      refundId,
      orderId: refund.orderId,
      status,
      resolvedAt: new Date(),
    });

    return resolved;
  }

  async getRefunds(params: {
    branchId?: number;
    status?: RefundStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.branchId ? { order: { branchId: params.branchId } } : {}),
    };

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: {
          order: { select: { id: true, orderNumber: true, totalAmount: true } },
          requestedByUser: { select: { id: true, name: true } },
          approvedByUser: { select: { id: true, name: true } },
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.refund.count({ where }),
    ]);

    return formatPaginatedResult(refunds, total, page, limit);
  }
}

export const refundsService = new RefundsService();
