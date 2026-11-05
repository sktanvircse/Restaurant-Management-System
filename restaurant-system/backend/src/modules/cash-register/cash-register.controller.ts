import { Request, Response, NextFunction } from 'express';
import { cashRegisterService } from './cash-register.service';
import { apiSuccess } from '../../utils/response';

export class CashRegisterController {
  openSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { openingBalance, notes } = req.body;
      const branchId = req.user!.branchId;
      const cashierId = req.user!.id;

      const session = await cashRegisterService.openSession(
        cashierId,
        branchId,
        openingBalance,
        notes
      );
      apiSuccess(res, session, 'Cash register session opened successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getCurrentSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.user!.branchId;
      const cashierId = req.user!.id;

      const result = await cashRegisterService.getCurrentSession(cashierId, branchId);
      apiSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  closeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { closingBalance, notes } = req.body;
      const branchId = req.user!.branchId;
      const cashierId = req.user!.id;

      const session = await cashRegisterService.closeSession(
        cashierId,
        branchId,
        closingBalance,
        notes
      );
      apiSuccess(res, session, 'Cash register closed successfully');
    } catch (error) {
      next(error);
    }
  };

  getSessionHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const cashierId = req.query.cashierId ? parseInt(req.query.cashierId as string, 10) : undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const history = await cashRegisterService.getSessionHistory({
        branchId,
        cashierId,
        startDate,
        endDate,
      });
      apiSuccess(res, history);
    } catch (error) {
      next(error);
    }
  };
}

export const cashRegisterController = new CashRegisterController();
