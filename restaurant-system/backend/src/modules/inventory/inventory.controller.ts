import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service';
import { apiSuccess } from '../../utils/response';

export class InventoryController {
  // Ingredients
  getIngredients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const lowStockOnly = req.query.lowStock === 'true';

      const ingredients = await inventoryService.getIngredients(branchId, lowStockOnly);
      apiSuccess(res, ingredients);
    } catch (error) {
      next(error);
    }
  };

  getIngredientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ingredient = await inventoryService.getIngredientById(parseInt(req.params.id, 10));
      apiSuccess(res, ingredient);
    } catch (error) {
      next(error);
    }
  };

  createIngredient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.body.branchId || req.user!.branchId;
      const ingredient = await inventoryService.createIngredient({ ...req.body, branchId });
      apiSuccess(res, ingredient, 'Ingredient created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateIngredient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ingredient = await inventoryService.updateIngredient(
        parseInt(req.params.id, 10),
        req.body
      );
      apiSuccess(res, ingredient, 'Ingredient updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteIngredient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await inventoryService.deleteIngredient(parseInt(req.params.id, 10));
      apiSuccess(res, result, 'Ingredient deleted');
    } catch (error) {
      next(error);
    }
  };

  // Stock movements
  recordStockMovement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.body.branchId || req.user!.branchId;
      const result = await inventoryService.recordStockMovement(
        { ...req.body, branchId },
        req.user!.id
      );
      apiSuccess(res, result, 'Stock movement recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  recordWastage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.body.branchId || req.user!.branchId;
      const result = await inventoryService.recordWastage(
        { ...req.body, branchId },
        req.user!.id
      );
      apiSuccess(res, result, 'Wastage recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getStockMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const ingredientId = req.query.ingredientId ? parseInt(req.query.ingredientId as string, 10) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await inventoryService.getStockMovements({ ingredientId, branchId, page, limit });
      apiSuccess(res, result.data, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  // Recipes
  getRecipesByMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recipes = await inventoryService.getRecipesByMenuItem(parseInt(req.params.menuItemId, 10));
      apiSuccess(res, recipes);
    } catch (error) {
      next(error);
    }
  };

  saveRecipe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recipe = await inventoryService.saveRecipe(req.body);
      apiSuccess(res, recipe, 'Recipe ingredient saved successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  deleteRecipe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await inventoryService.deleteRecipe(parseInt(req.params.id, 10));
      apiSuccess(res, result, 'Recipe ingredient removed');
    } catch (error) {
      next(error);
    }
  };
}

export const inventoryController = new InventoryController();
