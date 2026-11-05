import { Request, Response, NextFunction } from 'express';
import { customersService } from './customers.service';
import { apiSuccess } from '../../utils/response';

export class CustomersController {
  getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await customersService.getCustomers(search, page, limit);
      apiSuccess(res, result.data, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customer = await customersService.getCustomerById(parseInt(req.params.id, 10));
      apiSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  };

  getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customer = await customersService.getCustomerById(req.customer!.id);
      apiSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  };

  updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await customersService.updateProfile(req.customer!.id, req.body);
      apiSuccess(res, updated, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getMyAddresses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const addresses = await customersService.getAddresses(req.customer!.id);
      apiSuccess(res, addresses);
    } catch (error) {
      next(error);
    }
  };

  addAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const address = await customersService.addAddress(req.customer!.id, req.body);
      apiSuccess(res, address, 'Address added successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await customersService.deleteAddress(
        req.customer!.id,
        parseInt(req.params.addressId, 10)
      );
      apiSuccess(res, result, 'Address deleted');
    } catch (error) {
      next(error);
    }
  };

  getMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await customersService.getCustomerOrders(req.customer!.id, page, limit);
      apiSuccess(res, result.data, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };
}

export const customersController = new CustomersController();
