import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { apiSuccess } from '../../utils/response';

export class PaymentsController {
  processPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await paymentsService.processPayment(req.body, req.user?.id);
      apiSuccess(res, result, 'Payment processed successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  processSplitPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId, payments } = req.body;
      const result = await paymentsService.processSplitPayment(orderId, payments, req.user?.id);
      apiSuccess(res, result, 'Split payments processed successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  initiateSSLCommerz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.body;
      const result = await paymentsService.initiateSSLCommerz(orderId);
      apiSuccess(res, result, 'SSLCommerz payment session initiated');
    } catch (error) {
      next(error);
    }
  };

  sslcommerzIPN = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await paymentsService.handleSSLCommerzIPN(req.body);
      apiSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getPaymentsByOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payments = await paymentsService.getPaymentsByOrder(parseInt(req.params.orderId, 10));
      apiSuccess(res, payments);
    } catch (error) {
      next(error);
    }
  };

  getPaymentMethods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const methods = await paymentsService.getPaymentMethods(branchId);
      apiSuccess(res, methods);
    } catch (error) {
      next(error);
    }
  };
}

export const paymentsController = new PaymentsController();
