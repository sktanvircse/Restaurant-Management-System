import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate, optionalCustomer } from '../../middleware/auth';

const router = Router();

router.get('/', optionalCustomer, notificationsController.getMyNotifications);
router.patch('/:id/read', optionalCustomer, notificationsController.markAsRead);
router.post('/read-all', optionalCustomer, notificationsController.markAllAsRead);
router.post('/register-token', optionalCustomer, notificationsController.registerDeviceToken);

export const notificationsRoutes = router;
