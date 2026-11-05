import { Request, Response, NextFunction } from 'express';
import { refundsService } from './refunds.service';
import { apiSuccess } from '../../utils/response';
import { RefundStatus } from '@prisma/client';

export class RefundsController {
  requestRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refund = await refundsService.requestRefund(req.body, req.user!.id);
      apiSuccess(res, refund, 'Refund request submitted for approval', 201);
    } catch (error) {
      next(error);
    }
  };

  resolveRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, note } = req.body;
      const result = await refundsService.resolveRefund(
        parseInt(req.params.id, 10),
        status,
        req.user!.id,
        note
      );
      apiSuccess(res, result, `Refund request ${status.toLowerCase()}`);
    } catch (error) {
      next(error);
    }
  };

  getRefunds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const status = req.query.status as RefundStatus | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await refundsService.getRefunds({ branchId, status, page, limit });
      apiSuccess(res, result.data, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };
}

export const refundsController = new RefundsController();
