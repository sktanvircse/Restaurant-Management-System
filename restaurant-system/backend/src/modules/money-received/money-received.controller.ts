import { Request, Response, NextFunction } from 'express';
import { moneyReceivedService } from './money-received.service';
import { apiSuccess } from '../../utils/response';

export class MoneyReceivedController {
  recordMoneyReceived = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.body.branchId || req.user!.branchId;
      const result = await moneyReceivedService.recordMoneyReceived(
        { ...req.body, branchId },
        req.user!.id
      );
      apiSuccess(res, result, 'Money received recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getMoneyReceivedList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const source = req.query.source as string | undefined;
      const paymentMethod = req.query.paymentMethod as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await moneyReceivedService.getMoneyReceivedList({
        branchId,
        startDate,
        endDate,
        source,
        paymentMethod,
        page,
        limit,
      });

      apiSuccess(res, result.data, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  getDailySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user!.branchId;
      const date = req.query.date as string | undefined;

      const summary = await moneyReceivedService.getDailySummary(branchId, date);
      apiSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  };
}

export const moneyReceivedController = new MoneyReceivedController();
