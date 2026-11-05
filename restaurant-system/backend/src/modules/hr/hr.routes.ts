import { Router } from 'express';
import { hrController } from './hr.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  createShiftSchema,
  recordAttendanceSchema,
  applyLeaveSchema,
  resolveLeaveSchema,
  generateSalarySheetSchema,
  paySalarySchema,
} from './hr.validation';

const router = Router();

// ==========================================
// EMPLOYEES
// ==========================================
router.get(
  '/employees',
  authenticate,
  authorize('hr', 'view'),
  hrController.getEmployees
);

router.get(
  '/employees/:id',
  authenticate,
  authorize('hr', 'view'),
  hrController.getEmployeeById
);

router.post(
  '/employees',
  authenticate,
  authorize('hr', 'create'),
  auditLog('hr', 'CREATE_EMPLOYEE'),
  validate({ body: createEmployeeSchema }),
  hrController.createEmployee
);

router.put(
  '/employees/:id',
  authenticate,
  authorize('hr', 'edit'),
  auditLog('hr', 'UPDATE_EMPLOYEE'),
  validate({ body: updateEmployeeSchema }),
  hrController.updateEmployee
);

// ==========================================
// SHIFTS
// ==========================================
router.get(
  '/shifts',
  authenticate,
  authorize('hr', 'view'),
  hrController.getShifts
);

router.post(
  '/shifts',
  authenticate,
  authorize('hr', 'create'),
  validate({ body: createShiftSchema }),
  hrController.createShift
);

// ==========================================
// ATTENDANCE
// ==========================================
router.post(
  '/attendance',
  authenticate,
  authorize('hr', 'create'),
  validate({ body: recordAttendanceSchema }),
  hrController.recordAttendance
);

router.get(
  '/attendance/sheet',
  authenticate,
  authorize('hr', 'view'),
  hrController.getAttendanceSheet
);

// ==========================================
// LEAVES
// ==========================================
router.post(
  '/leaves',
  authenticate,
  validate({ body: applyLeaveSchema }),
  hrController.applyLeave
);

router.patch(
  '/leaves/:id/resolve',
  authenticate,
  authorize('hr', 'approve'),
  auditLog('hr', 'RESOLVE_LEAVE'),
  validate({ body: resolveLeaveSchema }),
  hrController.resolveLeave
);

router.get(
  '/leaves',
  authenticate,
  authorize('hr', 'view'),
  hrController.getLeaves
);

// ==========================================
// SALARIES & PAYROLL
// ==========================================
router.post(
  '/salaries/generate',
  authenticate,
  authorize('salary', 'create'),
  auditLog('salary', 'GENERATE_PAYROLL'),
  validate({ body: generateSalarySheetSchema }),
  hrController.generateSalarySheet
);

router.post(
  '/salaries/:id/pay',
  authenticate,
  authorize('salary', 'approve'),
  auditLog('salary', 'PAY_SALARY'),
  validate({ body: paySalarySchema }),
  hrController.paySalary
);

router.get(
  '/salaries',
  authenticate,
  authorize('salary', 'view'),
  hrController.getSalaries
);

export const hrRoutes = router;
