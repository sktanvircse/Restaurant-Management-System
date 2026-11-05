import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { auditLog } from '../../middleware/auditLog';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('settings', 'view'),
  settingsController.getSettings
);

router.post(
  '/',
  authenticate,
  authorize('settings', 'edit'),
  auditLog('settings', 'UPDATE_SETTING'),
  settingsController.updateSetting
);

export const settingsRoutes = router;
