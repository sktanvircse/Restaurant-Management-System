import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import {
  createPaymentSchema,
  splitPaymentSchema,
  sslcommerzInitiateSchema,
} from './payments.validation';

const router = Router();

// Process Single Payment
router.post(
  '/',
  authenticate,
  authorize('payments', 'create'),
  auditLog('payments', 'PROCESS_PAYMENT'),
  validate({ body: createPaymentSchema }),
  paymentsController.processPayment
);

// Process Split Payment
router.post(
  '/split',
  authenticate,
  authorize('payments', 'create'),
  auditLog('payments', 'PROCESS_SPLIT_PAYMENT'),
  validate({ body: splitPaymentSchema }),
  paymentsController.processSplitPayment
);

// SSLCommerz Online Payment Initiation (Public/Customer)
router.post(
  '/sslcommerz/initiate',
  validate({ body: sslcommerzInitiateSchema }),
  paymentsController.initiateSSLCommerz
);

// SSLCommerz Webhook / IPN Listener
router.post('/sslcommerz/ipn', paymentsController.sslcommerzIPN);

// Get payments for an order
router.get(
  '/order/:orderId',
  authenticate,
  authorize('payments', 'view'),
  paymentsController.getPaymentsByOrder
);

// Get available payment methods
router.get('/methods', paymentsController.getPaymentMethods);

export const paymentsRoutes = router;
