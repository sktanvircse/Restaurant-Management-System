import { Request, Response, NextFunction } from 'express';
import { expensesService } from './expenses.service';
import { apiSuccess } from '../../utils/response';

export class ExpensesController {
  getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const categories = await expensesService.getCategories(branchId);
      apiSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.body.branchId || req.user!.branchId;
      const category = await expensesService.createCategory({ ...req.body, branchId });
      apiSuccess(res, category, 'Expense category created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.body.branchId || req.user!.branchId;
      const expense = await expensesService.createExpense(
        { ...req.body, branchId },
        req.user!.id
      );
      apiSuccess(res, expense, 'Expense recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const expenseCategoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await expensesService.getExpenses({
        branchId,
        expenseCategoryId,
        startDate,
        endDate,
        page,
        limit,
      });

      apiSuccess(res, result.data, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await expensesService.deleteExpense(parseInt(req.params.id, 10));
      apiSuccess(res, result, 'Expense entry deleted');
    } catch (error) {
      next(error);
    }
  };
}

export const expensesController = new ExpensesController();
