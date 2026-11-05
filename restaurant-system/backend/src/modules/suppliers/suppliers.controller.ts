import { Request, Response, NextFunction } from 'express';
import { suppliersService } from './suppliers.service';
import { apiSuccess } from '../../utils/response';
import { PurchaseOrderStatus } from '@prisma/client';

export class SuppliersController {
  // Suppliers
  getSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const suppliers = await suppliersService.getSuppliers(branchId);
      apiSuccess(res, suppliers);
    } catch (error) {
      next(error);
    }
  };

  createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.body.branchId || req.user!.branchId;
      const supplier = await suppliersService.createSupplier({ ...req.body, branchId });
      apiSuccess(res, supplier, 'Supplier created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const supplier = await suppliersService.updateSupplier(parseInt(req.params.id, 10), req.body);
      apiSuccess(res, supplier, 'Supplier updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await suppliersService.deleteSupplier(parseInt(req.params.id, 10));
      apiSuccess(res, result, 'Supplier removed');
    } catch (error) {
      next(error);
    }
  };

  // Purchase Orders
  createPurchaseOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.body.branchId || req.user!.branchId;
      const po = await suppliersService.createPurchaseOrder(
        { ...req.body, branchId },
        req.user!.id
      );
      apiSuccess(res, po, 'Purchase Order created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getPurchaseOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const status = req.query.status as PurchaseOrderStatus | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await suppliersService.getPurchaseOrders({ branchId, status, page, limit });
      apiSuccess(res, result.data, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  receivePurchaseOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { receivedItems } = req.body;
      const po = await suppliersService.receivePurchaseOrder(
        parseInt(req.params.id, 10),
        receivedItems,
        req.user!.id
      );
      apiSuccess(res, po, 'Purchase Order items received and inventory updated');
    } catch (error) {
      next(error);
    }
  };
}

export const suppliersController = new SuppliersController();
