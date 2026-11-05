import { Router } from 'express';
import { customersController } from './customers.controller';
import { authenticate, authenticateCustomer } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  updateCustomerProfileSchema,
  createAddressSchema,
} from './customers.validation';

const router = Router();

// ==========================================
// CUSTOMER SELF-SERVICE (Customer Website & Customer Mobile App)
// ==========================================
router.get('/me', authenticateCustomer, customersController.getMyProfile);
router.put(
  '/me',
  authenticateCustomer,
  validate({ body: updateCustomerProfileSchema }),
  customersController.updateMyProfile
);

router.get('/addresses', authenticateCustomer, customersController.getMyAddresses);
router.post(
  '/addresses',
  authenticateCustomer,
  validate({ body: createAddressSchema }),
  customersController.addAddress
);
router.delete('/addresses/:addressId', authenticateCustomer, customersController.deleteAddress);

router.get('/my-orders', authenticateCustomer, customersController.getMyOrders);

// ==========================================
// STAFF CUSTOMER MANAGEMENT (Admin, Manager, Cashier)
// ==========================================
router.get(
  '/',
  authenticate,
  authorize('customers', 'view'),
  customersController.getCustomers
);

router.get(
  '/:id',
  authenticate,
  authorize('customers', 'view'),
  customersController.getCustomerById
);

export const customersRoutes = router;
