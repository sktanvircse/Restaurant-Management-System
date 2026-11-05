import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { io } from '../../server';

export class CashRegisterService {
  async openSession(cashierId: number, branchId: number, openingBalance: number, notes?: string | null) {
    // Check if cashier already has an open session in this branch
    const existing = await prisma.cashRegisterSession.findFirst({
      where: {
        cashierId,
        branchId,
        status: 'OPEN',
      },
    });

    if (existing) {
      throw new BadRequestError('You already have an active open cash register session');
    }

    const session = await prisma.cashRegisterSession.create({
      data: {
        branchId,
        cashierId,
        openingBalance,
        status: 'OPEN',
        notes: notes || null,
      },
      include: {
        cashier: { select: { id: true, name: true, email: true } },
      },
    });

    io.to(`branch:${branchId}`).emit('register:session:opened', session);
    return session;
  }

  async getCurrentSession(cashierId: number, branchId: number) {
    const session = await prisma.cashRegisterSession.findFirst({
      where: {
        cashierId,
        branchId,
        status: 'OPEN',
      },
      include: {
        cashier: { select: { id: true, name: true, email: true } },
        moneyReceived: true,
      },
    });

    if (!session) return null;

    // Calculate real-time cash sales taken during this session
    const cashPayments = await prisma.payment.findMany({
      where: {
        processedBy: cashierId,
        method: { equals: 'Cash' },
        status: 'COMPLETED',
        createdAt: { gte: session.openedAt },
      },
    });

    const otherPayments = await prisma.payment.findMany({
      where: {
        processedBy: cashierId,
        method: { not: 'Cash' },
        status: 'COMPLETED',
        createdAt: { gte: session.openedAt },
      },
    });

    const totalCashSales = cashPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalDigitalSales = otherPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const extraMoneyReceived = session.moneyReceived
      .filter((m) => !m.source.startsWith('Order #'))
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const expectedCashInDrawer =
      Number(session.openingBalance) + totalCashSales + extraMoneyReceived;

    return {
      session,
      summary: {
        openingBalance: Number(session.openingBalance),
        totalCashSales,
        totalDigitalSales,
        extraMoneyReceived,
        expectedCashInDrawer: Math.round(expectedCashInDrawer * 100) / 100,
        transactionsCount: cashPayments.length + otherPayments.length,
      },
    };
  }

  async closeSession(cashierId: number, branchId: number, closingBalance: number, notes?: string | null) {
    const session = await prisma.cashRegisterSession.findFirst({
      where: {
        cashierId,
        branchId,
        status: 'OPEN',
      },
      include: { moneyReceived: true },
    });

    if (!session) {
      throw new NotFoundError('No active open cash register session found to close');
    }

    // Calculate expected balance
    const cashPayments = await prisma.payment.findMany({
      where: {
        processedBy: cashierId,
        method: { equals: 'Cash' },
        status: 'COMPLETED',
        createdAt: { gte: session.openedAt },
      },
    });

    const totalCashSales = cashPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const extraMoneyReceived = session.moneyReceived
      .filter((m) => !m.source.startsWith('Order #'))
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const expectedBalance =
      Number(session.openingBalance) + totalCashSales + extraMoneyReceived;

    const diff = Math.round((closingBalance - expectedBalance) * 100) / 100;
    const shortage = diff < 0 ? Math.abs(diff) : 0;
    const excess = diff > 0 ? diff : 0;

    const closed = await prisma.cashRegisterSession.update({
      where: { id: session.id },
      data: {
        closingBalance,
        expectedBalance,
        shortage,
        excess,
        closedAt: new Date(),
        status: 'CLOSED',
        notes: notes || session.notes,
      },
      include: {
        cashier: { select: { id: true, name: true, email: true } },
      },
    });

    io.to(`branch:${branchId}`).emit('register:session:closed', closed);
    return closed;
  }

  async getSessionHistory(params: {
    branchId?: number;
    cashierId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    return prisma.cashRegisterSession.findMany({
      where: {
        ...(params.branchId ? { branchId: params.branchId } : {}),
        ...(params.cashierId ? { cashierId: params.cashierId } : {}),
        ...(params.startDate || params.endDate
          ? {
              openedAt: {
                ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
                ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
              },
            }
          : {}),
      },
      include: {
        cashier: { select: { id: true, name: true, email: true } },
        moneyReceived: true,
      },
      orderBy: { openedAt: 'desc' },
    });
  }
}

export const cashRegisterService = new CashRegisterService();
