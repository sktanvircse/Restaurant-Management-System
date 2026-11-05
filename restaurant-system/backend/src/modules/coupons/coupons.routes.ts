import { Router } from 'express';
import { couponsController } from './coupons.controller';
import { authenticate, authenticateCustomer } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
} from './coupons.validation';

const router = Router();

// Public / Customer validate coupon
router.post(
  '/validate',
  validate({ body: validateCouponSchema }),
  couponsController.validateCoupon
);

// Customer Loyalty points
router.get(
  '/my-loyalty',
  authenticateCustomer,
  couponsController.getMyLoyaltyPoints
);

// Staff management
router.get(
  '/',
  authenticate,
  authorize('coupons', 'view'),
  couponsController.getCoupons
);

router.post(
  '/',
  authenticate,
  authorize('coupons', 'create'),
  auditLog('coupons', 'CREATE_COUPON'),
  validate({ body: createCouponSchema }),
  couponsController.createCoupon
);

router.put(
  '/:id',
  authenticate,
  authorize('coupons', 'edit'),
  auditLog('coupons', 'UPDATE_COUPON'),
  validate({ body: updateCouponSchema }),
  couponsController.updateCoupon
);

router.delete(
  '/:id',
  authenticate,
  authorize('coupons', 'delete'),
  auditLog('coupons', 'DELETE_COUPON'),
  couponsController.deleteCoupon
);

export const couponsRoutes = router;
