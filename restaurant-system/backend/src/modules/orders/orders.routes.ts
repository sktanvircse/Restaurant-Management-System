import { Router } from 'express';
import { ordersController } from './orders.controller';
import { authenticate, optionalCustomer } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  voidOrderSchema,
} from './orders.validation';

const router = Router();

// ==========================================
// ORDER PLACEMENT
// (Available for Staff, Authenticated Customer, or Guest)
// ==========================================
router.post(
  '/',
  optionalCustomer,
  validate({ body: createOrderSchema }),
  ordersController.createOrder
);

// ==========================================
// KITCHEN LIVE ORDERS (KDS Screen)
// ==========================================
router.get(
  '/kitchen',
  authenticate,
  authorize('kitchen', 'view'),
  ordersController.getKitchenOrders
);

// ==========================================
// ORDER MANAGEMENT (Staff & Customers)
// ==========================================
router.get(
  '/',
  authenticate,
  authorize('orders', 'view'),
  ordersController.getOrders
);

router.get(
  '/:id',
  authenticate,
  authorize('orders', 'view'),
  ordersController.getOrderById
);

// Status Transition (Pending -> Confirmed -> Preparing -> Ready -> Served -> Billed -> Paid)
router.patch(
  '/:id/status',
  authenticate,
  authorize('orders', 'edit'),
  auditLog('orders', 'UPDATE_STATUS'),
  validate({ body: updateOrderStatusSchema }),
  ordersController.updateOrderStatus
);

// Void Order (Manager/Admin approval only)
router.post(
  '/:id/void',
  authenticate,
  authorize('orders', 'approve'),
  auditLog('orders', 'VOID_ORDER'),
  validate({ body: voidOrderSchema }),
  ordersController.voidOrder
);

export const ordersRoutes = router;
