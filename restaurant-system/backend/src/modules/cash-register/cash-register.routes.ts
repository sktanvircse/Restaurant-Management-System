import { Router } from 'express';
import { cashRegisterController } from './cash-register.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import {
  openSessionSchema,
  closeSessionSchema,
} from './cash-register.validation';

const router = Router();

router.get(
  '/current',
  authenticate,
  authorize('cash_register', 'view'),
  cashRegisterController.getCurrentSession
);

router.post(
  '/open',
  authenticate,
  authorize('cash_register', 'create'),
  auditLog('cash_register', 'OPEN_SESSION'),
  validate({ body: openSessionSchema }),
  cashRegisterController.openSession
);

router.post(
  '/close',
  authenticate,
  authorize('cash_register', 'edit'),
  auditLog('cash_register', 'CLOSE_SESSION'),
  validate({ body: closeSessionSchema }),
  cashRegisterController.closeSession
);

router.get(
  '/history',
  authenticate,
  authorize('cash_register', 'view'),
  cashRegisterController.getSessionHistory
);

export const cashRegisterRoutes = router;
