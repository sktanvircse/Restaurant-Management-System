import { Request, Response, NextFunction } from 'express';
import { menuService } from './menu.service';
import { apiSuccess } from '../../utils/response';

export class MenuController {
  // Categories
  getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await menuService.getCategories(branchId, includeInactive);
      apiSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await menuService.getCategoryById(parseInt(req.params.id, 10));
      apiSuccess(res, category);
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await menuService.createCategory(req.body);
      apiSuccess(res, category, 'Category created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await menuService.updateCategory(parseInt(req.params.id, 10), req.body);
      apiSuccess(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await menuService.deleteCategory(parseInt(req.params.id, 10));
      apiSuccess(res, result, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // Menu Items
  getMenuItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;
      const station = req.query.station as string | undefined;
      const search = req.query.search as string | undefined;
      const isAvailable = req.query.isAvailable !== undefined ? req.query.isAvailable === 'true' : undefined;
      const isFeatured = req.query.isFeatured !== undefined ? req.query.isFeatured === 'true' : undefined;

      const items = await menuService.getMenuItems({
        branchId,
        categoryId,
        station,
        search,
        isAvailable,
        isFeatured,
      });

      apiSuccess(res, items);
    } catch (error) {
      next(error);
    }
  };

  getMenuItemById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await menuService.getMenuItemById(parseInt(req.params.id, 10));
      apiSuccess(res, item);
    } catch (error) {
      next(error);
    }
  };

  createMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await menuService.createMenuItem(req.body, req.user?.id);
      apiSuccess(res, item, 'Menu item created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await menuService.updateMenuItem(parseInt(req.params.id, 10), req.body);
      apiSuccess(res, item, 'Menu item updated successfully');
    } catch (error) {
      next(error);
    }
  };

  toggleAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await menuService.toggleAvailability(
        parseInt(req.params.id, 10),
        req.body.isAvailable
      );
      apiSuccess(res, item, `Item is now ${item.isAvailable ? 'available' : 'marked out-of-stock'}`);
    } catch (error) {
      next(error);
    }
  };

  deleteMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await menuService.softDeleteMenuItem(parseInt(req.params.id, 10));
      apiSuccess(res, result, 'Menu item removed successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const menuController = new MenuController();
