import { Router } from 'express';
import { tablesController } from './tables.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import {
  createTableSchema,
  updateTableSchema,
  updateTableStatusSchema,
  transferTableSchema,
} from './tables.validation';

const router = Router();

// ==========================================
// PUBLIC QR CODE TABLE LOOKUP (For customers scanning QR)
// ==========================================
router.get('/by-token/:token', tablesController.getTableByToken);

// ==========================================
// PROTECTED TABLE MANAGEMENT (Staff)
// ==========================================
router.get(
  '/',
  authenticate,
  authorize('tables', 'view'),
  tablesController.getTables
);

router.get(
  '/:id',
  authenticate,
  authorize('tables', 'view'),
  tablesController.getTableById
);

router.get(
  '/:id/qr',
  authenticate,
  authorize('tables', 'view'),
  tablesController.getTableQRCode
);

router.post(
  '/',
  authenticate,
  authorize('tables', 'create'),
  auditLog('tables', 'CREATE_TABLE'),
  validate({ body: createTableSchema }),
  tablesController.createTable
);

router.put(
  '/:id',
  authenticate,
  authorize('tables', 'edit'),
  auditLog('tables', 'UPDATE_TABLE'),
  validate({ body: updateTableSchema }),
  tablesController.updateTable
);

router.post(
  '/:id/open',
  authenticate,
  authorize('tables', 'edit'),
  tablesController.openTableSession
);

router.post(
  '/:id/close',
  authenticate,
  authorize('tables', 'edit'),
  tablesController.closeTableSession
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('tables', 'edit'),
  validate({ body: updateTableStatusSchema }),
  tablesController.updateTableStatus
);

router.post(
  '/transfer',
  authenticate,
  authorize('tables', 'edit'),
  auditLog('tables', 'TRANSFER_TABLE'),
  validate({ body: transferTableSchema }),
  tablesController.transferTable
);

router.delete(
  '/:id',
  authenticate,
  authorize('tables', 'delete'),
  auditLog('tables', 'DELETE_TABLE'),
  tablesController.deleteTable
);

export const tablesRoutes = router;
