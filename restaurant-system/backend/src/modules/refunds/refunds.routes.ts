import { Router } from 'express';
import { refundsController } from './refunds.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import { requestRefundSchema, resolveRefundSchema } from './refunds.validation';

const router = Router();

// Cashier requests refund
router.post(
  '/',
  authenticate,
  authorize('payments', 'create'),
  auditLog('payments', 'REQUEST_REFUND'),
  validate({ body: requestRefundSchema }),
  refundsController.requestRefund
);

// Manager / Admin approves or rejects refund
router.patch(
  '/:id/resolve',
  authenticate,
  authorize('payments', 'approve'),
  auditLog('payments', 'RESOLVE_REFUND'),
  validate({ body: resolveRefundSchema }),
  refundsController.resolveRefund
);

// View refunds list
router.get(
  '/',
  authenticate,
  authorize('payments', 'view'),
  refundsController.getRefunds
);

export const refundsRoutes = router;
