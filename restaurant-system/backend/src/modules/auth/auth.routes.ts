import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authenticateCustomer } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { auditLog } from '../../middleware/auditLog';
import {
  loginSchema,
  registerStaffSchema,
  customerRegisterSchema,
  customerLoginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.validation';

const router = Router();

// Staff Auth
router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  authController.loginStaff
);

router.post(
  '/refresh',
  validate({ body: refreshTokenSchema }),
  authController.refreshStaffToken
);

router.post(
  '/logout',
  authenticate,
  authController.logoutStaff
);

router.post(
  '/register-staff',
  authenticate,
  authorize('users', 'create'),
  auditLog('users', 'CREATE_STAFF'),
  validate({ body: registerStaffSchema }),
  authController.registerStaff
);

router.get(
  '/me',
  authenticate,
  authController.getMe
);

router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

router.post(
  '/forgot-password',
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authRateLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);

// Customer Auth
router.post(
  '/customer/register',
  authRateLimiter,
  validate({ body: customerRegisterSchema }),
  authController.registerCustomer
);

router.post(
  '/customer/login',
  authRateLimiter,
  validate({ body: customerLoginSchema }),
  authController.loginCustomer
);

router.post(
  '/customer/refresh',
  validate({ body: refreshTokenSchema }),
  authController.refreshCustomerToken
);

router.post(
  '/customer/logout',
  authenticateCustomer,
  authController.logoutCustomer
);

export const authRoutes = router;
