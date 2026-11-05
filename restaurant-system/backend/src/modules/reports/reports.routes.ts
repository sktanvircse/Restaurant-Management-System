import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();

router.get('/sales', authenticate, authorize('reports', 'view'), reportsController.getSalesReport);
router.get('/profit-loss', authenticate, authorize('reports', 'view'), reportsController.getProfitLossReport);
router.get('/vat', authenticate, authorize('reports', 'view'), reportsController.getVATReport);
router.get('/cash', authenticate, authorize('reports', 'view'), reportsController.getCashReport);

export const reportsRoutes = router;
