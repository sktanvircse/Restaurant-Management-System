import { PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { io } from '../../server';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class PaymentsService {
  /**
   * Process a single payment (Cash, Card, bKash, Nagad, etc.)
   */
  async processPayment(
    data: {
      orderId: number;
      method: string;
      amount: number;
      paymentMethodId?: number | null;
      transactionId?: string | null;
      notes?: string | null;
    },
    processedByUserId?: number
  ) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        payments: { where: { status: 'COMPLETED' } },
        tableSession: { include: { table: true } },
      },
    });

    if (!order || order.deletedAt) throw new NotFoundError('Order not found');
    if (order.status === 'PAID') throw new BadRequestError('This order is already fully paid');
    if (order.status === 'VOIDED' || order.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot accept payment for an order with status ${order.status}`);
    }

    const totalPaidSoFar = order.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const orderTotal = Number(order.totalAmount);
    const remainingBalance = Math.round((orderTotal - totalPaidSoFar) * 100) / 100;

    if (data.amount > remainingBalance) {
      // Allow slight overpayment with change calculation, but record the exact bill amount
      // or record as paid with change returned
    }

    // Find active cash register session for this cashier/branch
    let activeRegisterSession: any = null;
    if (processedByUserId) {
      activeRegisterSession = await prisma.cashRegisterSession.findFirst({
        where: {
          branchId: order.branchId,
          cashierId: processedByUserId,
          status: 'OPEN',
        },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          method: data.method,
          paymentMethodId: data.paymentMethodId || null,
          amount: data.amount,
          transactionId: data.transactionId || null,
          status: 'COMPLETED',
          processedBy: processedByUserId || null,
        },
      });

      // 2. If Cash payment, record in money_received automatically
      if (data.method.toUpperCase() === 'CASH' && processedByUserId) {
        await tx.moneyReceived.create({
          data: {
            branchId: order.branchId,
            cashRegisterSessionId: activeRegisterSession?.id || null,
            source: `Order #${order.orderNumber}`,
            amount: data.amount,
            paymentMethod: 'Cash',
            referenceNo: order.orderNumber,
            notes: data.notes || `Cash payment for order ${order.orderNumber}`,
            createdBy: processedByUserId,
          },
        });
      }

      // 3. Check if order is now fully paid
      const newTotalPaid = totalPaidSoFar + data.amount;
      const isFullyPaid = newTotalPaid >= orderTotal - 0.01; // tolerance for rounding

      let updatedOrder = order;
      if (isFullyPaid) {
        updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: 'PAID' },
          include: {
            payments: true,
            tableSession: { include: { table: true } },
          },
        });

        // Record status change to PAID
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: 'PAID',
            changedBy: processedByUserId || null,
            note: `Order paid in full (${data.method}: ${data.amount})`,
          },
        });

        // Close table session if dine-in
        if (order.tableSessionId) {
          await tx.tableSession.update({
            where: { id: order.tableSessionId },
            data: { status: 'CLOSED', closedAt: new Date() },
          });

          if (order.tableSession?.tableId) {
            await tx.table.update({
              where: { id: order.tableSession.tableId },
              data: { status: 'AVAILABLE' },
            });
          }
        }
      }

      return {
        payment,
        isFullyPaid,
        order: updatedOrder,
        remainingBalance: Math.max(0, Math.round((orderTotal - newTotalPaid) * 100) / 100),
      };
    });

    // Real-Time Socket Emissions
    io.to(`branch:${order.branchId}`).emit('payment:completed', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: result.payment.id,
      amount: data.amount,
      method: data.method,
      isFullyPaid: result.isFullyPaid,
      remainingBalance: result.remainingBalance,
    });

    if (result.isFullyPaid) {
      io.to(`branch:${order.branchId}`).emit('order:status', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: 'PAID',
      });
      io.to(`order:${order.id}`).emit('order:status', {
        orderId: order.id,
        status: 'PAID',
      });
      if (order.customerId) {
        io.to(`customer:${order.customerId}`).emit('order:status', {
          orderId: order.id,
          status: 'PAID',
        });
      }
      if (order.tableSession?.tableId) {
        io.to(`branch:${order.branchId}`).emit('table:updated', {
          id: order.tableSession.tableId,
          status: 'AVAILABLE',
        });
      }
    }

    return result;
  }

  /**
   * Process Split Payment (e.g. half cash, half bKash)
   */
  async processSplitPayment(
    orderId: number,
    payments: Array<{ method: string; amount: number; transactionId?: string | null }>,
    processedByUserId?: number
  ) {
    const results = [];
    for (const p of payments) {
      const res = await this.processPayment(
        {
          orderId,
          method: p.method,
          amount: p.amount,
          transactionId: p.transactionId,
        },
        processedByUserId
      );
      results.push(res);
    }
    return results;
  }

  /**
   * Initiate SSLCommerz Online Payment Gateway Session
   */
  async initiateSSLCommerz(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, branch: true },
    });

    if (!order) throw new NotFoundError('Order not found');
    if (order.status === 'PAID') throw new BadRequestError('Order is already paid');

    const tranId = `TRAN-${order.id}-${Date.now()}`;

    // Create a pending Payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'SSLCommerz',
        amount: order.totalAmount,
        transactionId: tranId,
        status: 'PENDING',
      },
    });

    // Sandbox Gateway URL (or mock URL if in development)
    const gatewayUrl = `https://sandbox.sslcommerz.com/gwprocess/v4/api.php?tran_id=${tranId}&amount=${order.totalAmount}`;

    logger.info(`[SSLCommerz Initiate] Order: ${order.orderNumber} | TranId: ${tranId} | Amount: ${order.totalAmount}`);

    return {
      paymentId: payment.id,
      transactionId: tranId,
      gatewayUrl,
      amount: order.totalAmount,
      currency: order.branch.currency,
    };
  }

  /**
   * SSLCommerz IPN / Callback Handler
   */
  async handleSSLCommerzIPN(data: any) {
    const { tran_id, val_id, status } = data;
    if (!tran_id) throw new BadRequestError('Transaction ID missing');

    const payment = await prisma.payment.findFirst({
      where: { transactionId: tran_id },
      include: { order: true },
    });

    if (!payment) throw new NotFoundError('Payment transaction not found');

    if (status === 'VALID' || status === 'VALIDATED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          gatewayResponse: data,
        },
      });

      // Mark order as PAID
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAID' },
      });

      io.to(`branch:${payment.order.branchId}`).emit('payment:completed', {
        orderId: payment.orderId,
        orderNumber: payment.order.orderNumber,
        method: 'SSLCommerz',
        amount: payment.amount,
        isFullyPaid: true,
      });

      return { status: 'SUCCESS', message: 'Payment verified and order updated' };
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', gatewayResponse: data },
      });
      return { status: 'FAILED', message: 'Payment validation failed' };
    }
  }

  async getPaymentsByOrder(orderId: number) {
    return prisma.payment.findMany({
      where: { orderId },
      include: {
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentMethods(branchId?: number) {
    return prisma.paymentMethod.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        isActive: true,
      },
    });
  }
}

export const paymentsService = new PaymentsService();
