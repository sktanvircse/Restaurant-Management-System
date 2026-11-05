import { Router } from 'express';
import { moneyReceivedController } from './money-received.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import { createMoneyReceivedSchema } from './money-received.validation';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('money_received', 'create'),
  auditLog('money_received', 'RECORD_MONEY'),
  validate({ body: createMoneyReceivedSchema }),
  moneyReceivedController.recordMoneyReceived
);

router.get(
  '/',
  authenticate,
  authorize('money_received', 'view'),
  moneyReceivedController.getMoneyReceivedList
);

router.get(
  '/daily-summary',
  authenticate,
  authorize('money_received', 'view'),
  moneyReceivedController.getDailySummary
);

export const moneyReceivedRoutes = router;
