import { Router } from 'express';
import { suppliersController } from './suppliers.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import {
  createSupplierSchema,
  updateSupplierSchema,
  createPurchaseOrderSchema,
  receivePurchaseOrderSchema,
} from './suppliers.validation';

const router = Router();

// ==========================================
// SUPPLIERS
// ==========================================
router.get(
  '/suppliers',
  authenticate,
  authorize('suppliers', 'view'),
  suppliersController.getSuppliers
);

router.post(
  '/suppliers',
  authenticate,
  authorize('suppliers', 'create'),
  auditLog('suppliers', 'CREATE_SUPPLIER'),
  validate({ body: createSupplierSchema }),
  suppliersController.createSupplier
);

router.put(
  '/suppliers/:id',
  authenticate,
  authorize('suppliers', 'edit'),
  auditLog('suppliers', 'UPDATE_SUPPLIER'),
  validate({ body: updateSupplierSchema }),
  suppliersController.updateSupplier
);

router.delete(
  '/suppliers/:id',
  authenticate,
  authorize('suppliers', 'delete'),
  auditLog('suppliers', 'DELETE_SUPPLIER'),
  suppliersController.deleteSupplier
);

// ==========================================
// PURCHASE ORDERS
// ==========================================
router.get(
  '/purchase-orders',
  authenticate,
  authorize('suppliers', 'view'),
  suppliersController.getPurchaseOrders
);

router.post(
  '/purchase-orders',
  authenticate,
  authorize('suppliers', 'create'),
  auditLog('suppliers', 'CREATE_PO'),
  validate({ body: createPurchaseOrderSchema }),
  suppliersController.createPurchaseOrder
);

router.post(
  '/purchase-orders/:id/receive',
  authenticate,
  authorize('suppliers', 'edit'),
  auditLog('suppliers', 'RECEIVE_PO'),
  validate({ body: receivePurchaseOrderSchema }),
  suppliersController.receivePurchaseOrder
);

export const suppliersRoutes = router;
