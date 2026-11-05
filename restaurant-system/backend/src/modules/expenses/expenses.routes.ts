import { Router } from 'express';
import { expensesController } from './expenses.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import {
  createExpenseCategorySchema,
  createExpenseSchema,
} from './expenses.validation';

const router = Router();

// Categories
router.get(
  '/categories',
  authenticate,
  authorize('expenses', 'view'),
  expensesController.getCategories
);

router.post(
  '/categories',
  authenticate,
  authorize('expenses', 'create'),
  validate({ body: createExpenseCategorySchema }),
  expensesController.createCategory
);

// Expenses
router.get(
  '/',
  authenticate,
  authorize('expenses', 'view'),
  expensesController.getExpenses
);

router.post(
  '/',
  authenticate,
  authorize('expenses', 'create'),
  auditLog('expenses', 'RECORD_EXPENSE'),
  validate({ body: createExpenseSchema }),
  expensesController.createExpense
);

router.delete(
  '/:id',
  authenticate,
  authorize('expenses', 'delete'),
  auditLog('expenses', 'DELETE_EXPENSE'),
  expensesController.deleteExpense
);

export const expensesRoutes = router;
