import { prisma } from '../../config/prisma';
import { io } from '../../server';
import { formatPaginatedResult } from '../../utils/pagination';

export class MoneyReceivedService {
  async recordMoneyReceived(
    data: {
      branchId: number;
      source: string;
      amount: number;
      paymentMethod: string;
      referenceNo?: string | null;
      notes?: string | null;
    },
    createdByUserId: number
  ) {
    // Find active register session if any
    const activeSession = await prisma.cashRegisterSession.findFirst({
      where: {
        branchId: data.branchId,
        cashierId: createdByUserId,
        status: 'OPEN',
      },
    });

    const entry = await prisma.moneyReceived.create({
      data: {
        branchId: data.branchId,
        cashRegisterSessionId: activeSession?.id || null,
        source: data.source,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        referenceNo: data.referenceNo || null,
        notes: data.notes || null,
        createdBy: createdByUserId,
      },
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
      },
    });

    io.to(`branch:${data.branchId}`).emit('money:received', entry);
    return entry;
  }

  async getMoneyReceivedList(params: {
    branchId?: number;
    startDate?: string;
    endDate?: string;
    source?: string;
    paymentMethod?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(params.branchId ? { branchId: params.branchId } : {}),
      ...(params.source ? { source: { contains: params.source } } : {}),
      ...(params.paymentMethod ? { paymentMethod: params.paymentMethod } : {}),
      ...(params.startDate || params.endDate
        ? {
            createdAt: {
              ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
              ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
            },
          }
        : {}),
    };

    const [entries, total] = await Promise.all([
      prisma.moneyReceived.findMany({
        where,
        include: {
          createdByUser: { select: { id: true, name: true } },
          cashRegisterSession: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.moneyReceived.count({ where }),
    ]);

    return formatPaginatedResult(entries, total, page, limit);
  }

  async getDailySummary(branchId: number, dateString?: string) {
    const targetDate = dateString ? new Date(dateString) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const entries = await prisma.moneyReceived.findMany({
      where: {
        branchId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const byMethod: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let totalAmount = 0;

    for (const e of entries) {
      const amt = Number(e.amount);
      totalAmount += amt;

      byMethod[e.paymentMethod] = (byMethod[e.paymentMethod] || 0) + amt;
      bySource[e.source] = (bySource[e.source] || 0) + amt;
    }

    return {
      date: startOfDay.toISOString().slice(0, 10),
      totalAmount,
      totalEntries: entries.length,
      breakdownByMethod: byMethod,
      breakdownBySource: bySource,
      entries,
    };
  }
}

export const moneyReceivedService = new MoneyReceivedService();
