import { Router } from 'express';
import { branchesController } from './branches.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { auditLog } from '../../middleware/auditLog';

const router = Router();

// Public branch directory (for customer app / website branch selection)
router.get('/', branchesController.getBranches);
router.get('/:id', branchesController.getBranchById);

// Super Admin branch management
router.post(
  '/',
  authenticate,
  authorize('branches', 'create'),
  auditLog('branches', 'CREATE_BRANCH'),
  branchesController.createBranch
);

router.put(
  '/:id',
  authenticate,
  authorize('branches', 'edit'),
  auditLog('branches', 'UPDATE_BRANCH'),
  branchesController.updateBranch
);

export const branchesRoutes = router;
