import { Router } from 'express';
import { reservationsController } from './reservations.controller';
import { authenticate, optionalCustomer } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import {
  createReservationSchema,
  updateReservationStatusSchema,
} from './reservations.validation';

const router = Router();

// Public / Customer Booking
router.post(
  '/',
  optionalCustomer,
  validate({ body: createReservationSchema }),
  reservationsController.createReservation
);

// Staff management
router.get(
  '/',
  authenticate,
  authorize('reservations', 'view'),
  reservationsController.getReservations
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('reservations', 'edit'),
  auditLog('reservations', 'UPDATE_RESERVATION'),
  validate({ body: updateReservationStatusSchema }),
  reservationsController.updateStatus
);

export const reservationsRoutes = router;
