import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { apiSuccess } from '../../utils/response';

export class SettingsController {
  getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const settings = await settingsService.getSettings(branchId);
      apiSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  };

  updateSetting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { key, value, branchId } = req.body;
      const setting = await settingsService.updateSetting(
        key,
        String(value),
        branchId || null,
        req.user?.id
      );
      apiSuccess(res, setting, 'Setting updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const settingsController = new SettingsController();
