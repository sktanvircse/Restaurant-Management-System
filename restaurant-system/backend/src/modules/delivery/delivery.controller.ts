import { Request, Response, NextFunction } from 'express';
import { deliveryService } from './delivery.service';
import { apiSuccess } from '../../utils/response';

export class DeliveryController {
  // Zones
  getZones = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const zones = await deliveryService.getZones(branchId);
      apiSuccess(res, zones);
    } catch (error) {
      next(error);
    }
  };

  createZone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zone = await deliveryService.createZone(req.body);
      apiSuccess(res, zone, 'Delivery zone created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateZone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zone = await deliveryService.updateZone(parseInt(req.params.id, 10), req.body);
      apiSuccess(res, zone, 'Delivery zone updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteZone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await deliveryService.deleteZone(parseInt(req.params.id, 10));
      apiSuccess(res, result, 'Delivery zone deactivated');
    } catch (error) {
      next(error);
    }
  };

  // Riders
  getRiders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const onlyAvailable = req.query.available === 'true';
      const riders = await deliveryService.getRiders(branchId, onlyAvailable);
      apiSuccess(res, riders);
    } catch (error) {
      next(error);
    }
  };

  createRider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rider = await deliveryService.createRider(req.body);
      apiSuccess(res, rider, 'Rider registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateRiderAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rider = await deliveryService.updateRiderAvailability(
        parseInt(req.params.id, 10),
        req.body.isAvailable
      );
      apiSuccess(res, rider, `Rider availability set to ${rider.isAvailable}`);
    } catch (error) {
      next(error);
    }
  };

  // Deliveries
  assignDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId, riderId } = req.body;
      const delivery = await deliveryService.assignDelivery(orderId, riderId);
      apiSuccess(res, delivery, 'Delivery assigned to rider successfully');
    } catch (error) {
      next(error);
    }
  };

  updateDeliveryStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, notes } = req.body;
      const delivery = await deliveryService.updateDeliveryStatus(
        parseInt(req.params.id, 10),
        status,
        notes
      );
      apiSuccess(res, delivery, `Delivery status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  };

  submitCODCash = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const delivery = await deliveryService.submitCODCash(
        parseInt(req.params.id, 10),
        req.user!.id
      );
      apiSuccess(res, delivery, 'COD cash collected and recorded successfully');
    } catch (error) {
      next(error);
    }
  };

  getActiveDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const deliveries = await deliveryService.getActiveDeliveries(branchId);
      apiSuccess(res, deliveries);
    } catch (error) {
      next(error);
    }
  };

  getMyDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deliveries = await deliveryService.getRiderDeliveries(req.user!.id);
      apiSuccess(res, deliveries);
    } catch (error) {
      next(error);
    }
  };
}

export const deliveryController = new DeliveryController();
