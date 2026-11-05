import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service';
import { apiSuccess } from '../../utils/response';
import { OrderStatus, OrderType } from '@prisma/client';

export class OrdersController {
  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // If customer is authenticated, attach customerId automatically
      const customerId = req.customer?.id || req.body.customerId || null;
      const staffUserId = req.user?.id || undefined;

      const order = await ordersService.createOrder(
        {
          ...req.body,
          customerId,
        },
        staffUserId
      );

      apiSuccess(res, order, 'Order placed successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const status = req.query.status as OrderStatus | undefined;
      const type = req.query.type as OrderType | undefined;
      const tableId = req.query.tableId ? parseInt(req.query.tableId as string, 10) : undefined;
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string, 10) : undefined;
      const search = req.query.search as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await ordersService.getOrders({
        branchId,
        status,
        type,
        tableId,
        customerId,
        search,
        startDate,
        endDate,
        page,
        limit,
      });

      apiSuccess(res, result.orders, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  getKitchenOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId || 1;
      const station = req.query.station as string | undefined;

      const orders = await ordersService.getKitchenOrders(branchId, station);
      apiSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await ordersService.getOrderById(parseInt(req.params.id, 10));
      apiSuccess(res, order);
    } catch (error) {
      next(error);
    }
  };

  updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, note } = req.body;
      const order = await ordersService.updateOrderStatus(
        parseInt(req.params.id, 10),
        status,
        req.user?.id,
        note
      );
      apiSuccess(res, order, `Order status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  };

  voidOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reason } = req.body;
      const order = await ordersService.voidOrder(
        parseInt(req.params.id, 10),
        req.user!.id,
        reason
      );
      apiSuccess(res, order, 'Order has been voided');
    } catch (error) {
      next(error);
    }
  };
}

export const ordersController = new OrdersController();
