import { Request, Response, NextFunction } from 'express';
import { couponsService } from './coupons.service';
import { apiSuccess } from '../../utils/response';

export class CouponsController {
  getCoupons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const coupons = await couponsService.getCoupons(branchId);
      apiSuccess(res, coupons);
    } catch (error) {
      next(error);
    }
  };

  createCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.body.branchId || req.user!.branchId;
      const coupon = await couponsService.createCoupon({ ...req.body, branchId });
      apiSuccess(res, coupon, 'Coupon created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const coupon = await couponsService.updateCoupon(parseInt(req.params.id, 10), req.body);
      apiSuccess(res, coupon, 'Coupon updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await couponsService.deleteCoupon(parseInt(req.params.id, 10));
      apiSuccess(res, result, 'Coupon deactivated');
    } catch (error) {
      next(error);
    }
  };

  validateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { branchId, code, orderAmount } = req.body;
      const result = await couponsService.validateCoupon(branchId, code, orderAmount);
      apiSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getMyLoyaltyPoints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await couponsService.getLoyaltyHistory(req.customer!.id);
      apiSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

export const couponsController = new CouponsController();
