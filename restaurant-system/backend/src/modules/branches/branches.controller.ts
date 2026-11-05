import { Request, Response, NextFunction } from 'express';
import { branchesService } from './branches.service';
import { apiSuccess } from '../../utils/response';

export class BranchesController {
  getBranches = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branches = await branchesService.getBranches();
      apiSuccess(res, branches);
    } catch (error) {
      next(error);
    }
  };

  getBranchById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = await branchesService.getBranchById(parseInt(req.params.id, 10));
      apiSuccess(res, branch);
    } catch (error) {
      next(error);
    }
  };

  createBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = await branchesService.createBranch(req.body);
      apiSuccess(res, branch, 'Branch created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branch = await branchesService.updateBranch(parseInt(req.params.id, 10), req.body);
      apiSuccess(res, branch, 'Branch updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const branchesController = new BranchesController();
