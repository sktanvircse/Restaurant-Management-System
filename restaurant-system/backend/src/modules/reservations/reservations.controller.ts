import { Request, Response, NextFunction } from 'express';
import { reservationsService } from './reservations.service';
import { apiSuccess } from '../../utils/response';
import { ReservationStatus } from '@prisma/client';

export class ReservationsController {
  createReservation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.customer?.id || null;
      const reservation = await reservationsService.createReservation(req.body, customerId);
      apiSuccess(res, reservation, 'Table reservation requested successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getReservations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const date = req.query.date as string | undefined;
      const status = req.query.status as ReservationStatus | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await reservationsService.getReservations({ branchId, date, status, page, limit });
      apiSuccess(res, result.data, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, tableId, notes } = req.body;
      const reservation = await reservationsService.updateStatus(
        parseInt(req.params.id, 10),
        status,
        tableId,
        notes
      );
      apiSuccess(res, reservation, `Reservation status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  };
}

export const reservationsController = new ReservationsController();
