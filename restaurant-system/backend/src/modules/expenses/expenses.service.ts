import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';
import { formatPaginatedResult } from '../../utils/pagination';

export class ExpensesService {
  // Categories
  async getCategories(branchId?: number) {
    return prisma.expenseCategory.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        isActive: true,
      },
      include: {
        _count: { select: { expenses: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(data: { branchId: number; name: string; isActive?: boolean }) {
    return prisma.expenseCategory.create({
      data: {
        branchId: data.branchId,
        name: data.name,
        isActive: data.isActive ?? true,
      },
    });
  }

  // Expenses
  async createExpense(
    data: {
      branchId: number;
      expenseCategoryId: number;
      description: string;
      amount: number;
      paymentMethod: string;
      receiptUrl?: string | null;
      expenseDate: string;
    },
    createdByUserId: number
  ) {
    return prisma.expense.create({
      data: {
        branchId: data.branchId,
        expenseCategoryId: data.expenseCategoryId,
        description: data.description,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        receiptUrl: data.receiptUrl || null,
        expenseDate: new Date(data.expenseDate),
        createdBy: createdByUserId,
      },
      include: {
        expenseCategory: true,
        createdByUser: { select: { id: true, name: true } },
      },
    });
  }

  async getExpenses(params: {
    branchId?: number;
    expenseCategoryId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(params.branchId ? { branchId: params.branchId } : {}),
      ...(params.expenseCategoryId ? { expenseCategoryId: params.expenseCategoryId } : {}),
      ...(params.startDate || params.endDate
        ? {
            expenseDate: {
              ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
              ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
            },
          }
        : {}),
    };

    const [expenses, total, summary] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          expenseCategory: true,
          createdByUser: { select: { id: true, name: true } },
        },
        orderBy: { expenseDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    const result = formatPaginatedResult(expenses, total, page, limit);
    return {
      ...result,
      meta: {
        ...result.meta,
        totalExpensesSum: summary._sum.amount || 0,
      },
    };
  }

  async deleteExpense(id: number) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundError('Expense not found');

    await prisma.expense.delete({ where: { id } });
    return { success: true };
  }
}

export const expensesService = new ExpensesService();
