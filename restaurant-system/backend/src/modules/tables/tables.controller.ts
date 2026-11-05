import { Request, Response, NextFunction } from 'express';
import { tablesService } from './tables.service';
import { apiSuccess } from '../../utils/response';
import { TableStatus } from '@prisma/client';

export class TablesController {
  getTables = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const section = req.query.section as string | undefined;
      const status = req.query.status as TableStatus | undefined;

      const tables = await tablesService.getTables(branchId, section, status);
      apiSuccess(res, tables);
    } catch (error) {
      next(error);
    }
  };

  getTableById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const table = await tablesService.getTableById(parseInt(req.params.id, 10));
      apiSuccess(res, table);
    } catch (error) {
      next(error);
    }
  };

  getTableByToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const table = await tablesService.getTableByToken(req.params.token);
      apiSuccess(res, table);
    } catch (error) {
      next(error);
    }
  };

  createTable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const table = await tablesService.createTable(req.body);
      apiSuccess(res, table, 'Table created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateTable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const table = await tablesService.updateTable(parseInt(req.params.id, 10), req.body);
      apiSuccess(res, table, 'Table updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getTableQRCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const qrData = await tablesService.getTableQRCode(parseInt(req.params.id, 10));
      apiSuccess(res, qrData);
    } catch (error) {
      next(error);
    }
  };

  openTableSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await tablesService.openTableSession(
        parseInt(req.params.id, 10),
        req.user?.id
      );
      apiSuccess(res, session, 'Table session opened');
    } catch (error) {
      next(error);
    }
  };

  closeTableSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await tablesService.closeTableSession(parseInt(req.params.id, 10));
      apiSuccess(res, result, 'Table session closed');
    } catch (error) {
      next(error);
    }
  };

  updateTableStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const table = await tablesService.updateTableStatus(
        parseInt(req.params.id, 10),
        req.body.status
      );
      apiSuccess(res, table, `Table status changed to ${table.status}`);
    } catch (error) {
      next(error);
    }
  };

  transferTable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fromTableId, toTableId } = req.body;
      const result = await tablesService.transferTable(fromTableId, toTableId);
      apiSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  };

  deleteTable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await tablesService.deleteTable(parseInt(req.params.id, 10));
      apiSuccess(res, result, 'Table deactivated');
    } catch (error) {
      next(error);
    }
  };
}

export const tablesController = new TablesController();
