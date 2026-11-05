import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';
import { apiSuccess } from '../../utils/response';

export class ReportsController {
  getSalesReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const report = await reportsService.getSalesReport({ branchId, startDate, endDate });
      apiSuccess(res, report);
    } catch (error) {
      next(error);
    }
  };

  getProfitLossReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const report = await reportsService.getProfitLossReport({ branchId, startDate, endDate });
      apiSuccess(res, report);
    } catch (error) {
      next(error);
    }
  };

  getVATReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const report = await reportsService.getVATReport({ branchId, startDate, endDate });
      apiSuccess(res, report);
    } catch (error) {
      next(error);
    }
  };

  getCashReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const report = await reportsService.getCashReport({ branchId, startDate, endDate });
      apiSuccess(res, report);
    } catch (error) {
      next(error);
    }
  };
}

export const reportsController = new ReportsController();
