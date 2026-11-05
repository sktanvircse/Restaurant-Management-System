import { prisma } from '../../config/prisma';

export class ReportsService {
  /**
   * Sales & Revenue Report (Daily, Weekly, Monthly, or Custom Range)
   */
  async getSalesReport(params: {
    branchId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const start = params.startDate ? new Date(params.startDate) : new Date(Date.now() - 30 * 86400000);
    const end = params.endDate ? new Date(params.endDate) : new Date();

    const orders = await prisma.order.findMany({
      where: {
        ...(params.branchId ? { branchId: params.branchId } : {}),
        status: 'PAID',
        createdAt: { gte: start, lte: end },
      },
      include: {
        items: {
          include: { menuItem: { select: { id: true, name: true, categoryId: true } } },
        },
      },
    });

    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalServiceCharge = 0;
    const byOrderType: Record<string, { count: number; revenue: number }> = {
      DINE_IN: { count: 0, revenue: 0 },
      TAKEAWAY: { count: 0, revenue: 0 },
      DELIVERY: { count: 0, revenue: 0 },
    };

    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const order of orders) {
      const total = Number(order.totalAmount);
      totalRevenue += total;
      totalDiscount += Number(order.discountAmount);
      totalTax += Number(order.taxAmount);
      totalServiceCharge += Number(order.serviceCharge);

      if (byOrderType[order.type]) {
        byOrderType[order.type].count++;
        byOrderType[order.type].revenue += total;
      }

      for (const item of order.items) {
        const key = String(item.menuItemId);
        if (!itemSales[key]) {
          itemSales[key] = {
            name: item.menuItem.name,
            quantity: 0,
            revenue: 0,
          };
        }
        itemSales[key].quantity += item.quantity;
        itemSales[key].revenue += Number(item.totalPrice);
      }
    }

    const topSellingItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      period: { start, end },
      totalOrders: orders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalServiceCharge: Math.round(totalServiceCharge * 100) / 100,
      averageOrderValue: orders.length ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0,
      byOrderType,
      topSellingItems,
    };
  }

  /**
   * Profit & Loss Report
   * P&L = Net Revenue (sales minus discounts) - (COGS + Operating Expenses + Salaries)
   */
  async getProfitLossReport(params: {
    branchId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const start = params.startDate ? new Date(params.startDate) : new Date(Date.now() - 30 * 86400000);
    const end = params.endDate ? new Date(params.endDate) : new Date();

    const [orders, expenses, stockMovements] = await Promise.all([
      prisma.order.findMany({
        where: {
          ...(params.branchId ? { branchId: params.branchId } : {}),
          status: 'PAID',
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.expense.findMany({
        where: {
          ...(params.branchId ? { branchId: params.branchId } : {}),
          expenseDate: { gte: start, lte: end },
        },
      }),
      prisma.stockMovement.findMany({
        where: {
          ...(params.branchId ? { branchId: params.branchId } : {}),
          type: 'DEDUCTION',
          createdAt: { gte: start, lte: end },
        },
      }),
    ]);

    const grossSales = orders.reduce((sum, o) => sum + Number(o.subtotal), 0);
    const discounts = orders.reduce((sum, o) => sum + Number(o.discountAmount), 0);
    const netSales = grossSales - discounts;

    // Cost of Goods Sold (COGS) based on deducted recipe ingredients
    const cogs = stockMovements.reduce(
      (sum, m) => sum + Math.abs(Number(m.quantity)) * Number(m.costPerUnit || 0),
      0
    );

    const grossProfit = netSales - cogs;

    // Operating Expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = grossProfit - totalExpenses;

    return {
      period: { start, end },
      revenue: {
        grossSales: Math.round(grossSales * 100) / 100,
        discounts: Math.round(discounts * 100) / 100,
        netSales: Math.round(netSales * 100) / 100,
      },
      costOfGoodsSold: Math.round(cogs * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      operatingExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMarginPercent: netSales ? Math.round((netProfit / netSales) * 10000) / 100 : 0,
    };
  }

  /**
   * VAT & Tax Report
   */
  async getVATReport(params: {
    branchId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const start = params.startDate ? new Date(params.startDate) : new Date(Date.now() - 30 * 86400000);
    const end = params.endDate ? new Date(params.endDate) : new Date();

    const orders = await prisma.order.findMany({
      where: {
        ...(params.branchId ? { branchId: params.branchId } : {}),
        status: 'PAID',
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        orderNumber: true,
        subtotal: true,
        taxAmount: true,
        serviceCharge: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalTaxCollected = orders.reduce((sum, o) => sum + Number(o.taxAmount), 0);
    const totalTaxableAmount = orders.reduce((sum, o) => sum + Number(o.subtotal), 0);

    return {
      period: { start, end },
      ordersCount: orders.length,
      totalTaxableAmount: Math.round(totalTaxableAmount * 100) / 100,
      totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
      orders,
    };
  }

  /**
   * Cash Reconciliation Report
   */
  async getCashReport(params: {
    branchId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const start = params.startDate ? new Date(params.startDate) : new Date(Date.now() - 30 * 86400000);
    const end = params.endDate ? new Date(params.endDate) : new Date();

    const sessions = await prisma.cashRegisterSession.findMany({
      where: {
        ...(params.branchId ? { branchId: params.branchId } : {}),
        openedAt: { gte: start, lte: end },
      },
      include: {
        cashier: { select: { id: true, name: true } },
      },
      orderBy: { openedAt: 'desc' },
    });

    const totalOpening = sessions.reduce((sum, s) => sum + Number(s.openingBalance), 0);
    const totalClosing = sessions.reduce((sum, s) => sum + Number(s.closingBalance || 0), 0);
    const totalShortage = sessions.reduce((sum, s) => sum + Number(s.shortage || 0), 0);
    const totalExcess = sessions.reduce((sum, s) => sum + Number(s.excess || 0), 0);

    return {
      period: { start, end },
      totalSessions: sessions.length,
      totalOpeningBalance: Math.round(totalOpening * 100) / 100,
      totalClosingBalance: Math.round(totalClosing * 100) / 100,
      totalShortage: Math.round(totalShortage * 100) / 100,
      totalExcess: Math.round(totalExcess * 100) / 100,
      sessions,
    };
  }
}

export const reportsService = new ReportsService();
