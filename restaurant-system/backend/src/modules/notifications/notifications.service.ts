import { NotificationType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { io } from '../../server';
import { formatPaginatedResult } from '../../utils/pagination';

export class NotificationsService {
  async createNotification(data: {
    userId?: number | null;
    customerId?: number | null;
    type: NotificationType;
    title: string;
    body: string;
    data?: any;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId || null,
        customerId: data.customerId || null,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data || undefined,
      },
    });

    if (data.userId) {
      io.to(`user:${data.userId}`).emit('notification:new', notification);
    }
    if (data.customerId) {
      io.to(`customer:${data.customerId}`).emit('notification:new', notification);
    }

    return notification;
  }

  async getMyNotifications(userId?: number, customerId?: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: any = {
      ...(userId ? { userId } : {}),
      ...(customerId ? { customerId } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    const result = formatPaginatedResult(notifications, total, page, limit);
    return {
      ...result,
      meta: {
        ...result.meta,
        unreadCount,
      },
    };
  }

  async markAsRead(id: number) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId?: number, customerId?: number) {
    const where: any = {
      ...(userId ? { userId } : {}),
      ...(customerId ? { customerId } : {}),
      isRead: false,
    };

    return prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });
  }

  // Device push tokens (Expo)
  async registerDeviceToken(data: {
    userId?: number | null;
    customerId?: number | null;
    token: string;
    platform: string;
  }) {
    return prisma.deviceToken.upsert({
      where: { token: data.token },
      update: {
        userId: data.userId || null,
        customerId: data.customerId || null,
        platform: data.platform,
      },
      create: {
        token: data.token,
        platform: data.platform,
        userId: data.userId || null,
        customerId: data.customerId || null,
      },
    });
  }
}

export const notificationsService = new NotificationsService();
