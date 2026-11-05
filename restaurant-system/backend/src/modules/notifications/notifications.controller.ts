import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { apiSuccess } from '../../utils/response';

export class NotificationsController {
  getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const customerId = req.customer?.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await notificationsService.getMyNotifications(userId, customerId, page, limit);
      apiSuccess(res, result.data, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notification = await notificationsService.markAsRead(parseInt(req.params.id, 10));
      apiSuccess(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const customerId = req.customer?.id;
      await notificationsService.markAllAsRead(userId, customerId);
      apiSuccess(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  };

  registerDeviceToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, platform } = req.body;
      const userId = req.user?.id;
      const customerId = req.customer?.id;

      const device = await notificationsService.registerDeviceToken({
        token,
        platform: platform || 'expo',
        userId,
        customerId,
      });
      apiSuccess(res, device, 'Device push token registered', 201);
    } catch (error) {
      next(error);
    }
  };
}

export const notificationsController = new NotificationsController();
