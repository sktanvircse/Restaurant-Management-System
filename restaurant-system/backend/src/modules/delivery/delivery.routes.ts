import { Router } from 'express';
import { deliveryController } from './delivery.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import {
  createZoneSchema,
  updateZoneSchema,
  createRiderSchema,
  updateRiderAvailabilitySchema,
  assignDeliverySchema,
  updateDeliveryStatusSchema,
  submitCODSchema,
} from './delivery.validation';

const router = Router();

// ==========================================
// ZONES
// ==========================================
router.get('/zones', deliveryController.getZones);

router.post(
  '/zones',
  authenticate,
  authorize('delivery', 'create'),
  validate({ body: createZoneSchema }),
  deliveryController.createZone
);

router.put(
  '/zones/:id',
  authenticate,
  authorize('delivery', 'edit'),
  validate({ body: updateZoneSchema }),
  deliveryController.updateZone
);

router.delete(
  '/zones/:id',
  authenticate,
  authorize('delivery', 'delete'),
  deliveryController.deleteZone
);

// ==========================================
// RIDERS
// ==========================================
router.get(
  '/riders',
  authenticate,
  authorize('delivery', 'view'),
  deliveryController.getRiders
);

router.post(
  '/riders',
  authenticate,
  authorize('delivery', 'create'),
  validate({ body: createRiderSchema }),
  deliveryController.createRider
);

router.patch(
  '/riders/:id/availability',
  authenticate,
  validate({ body: updateRiderAvailabilitySchema }),
  deliveryController.updateRiderAvailability
);

// ==========================================
// DELIVERIES & DISPATCH
// ==========================================
router.get(
  '/active',
  authenticate,
  authorize('delivery', 'view'),
  deliveryController.getActiveDeliveries
);

router.get(
  '/my-deliveries',
  authenticate,
  deliveryController.getMyDeliveries
);

router.post(
  '/assign',
  authenticate,
  authorize('delivery', 'edit'),
  auditLog('delivery', 'ASSIGN_RIDER'),
  validate({ body: assignDeliverySchema }),
  deliveryController.assignDelivery
);

router.patch(
  '/:id/status',
  authenticate,
  validate({ body: updateDeliveryStatusSchema }),
  deliveryController.updateDeliveryStatus
);

router.post(
  '/:id/collect-cod',
  authenticate,
  authorize('payments', 'create'),
  auditLog('payments', 'COLLECT_COD'),
  deliveryController.submitCODCash
);

export const deliveryRoutes = router;
