import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import {
  createIngredientSchema,
  updateIngredientSchema,
  recordStockMovementSchema,
  recordWastageSchema,
  createRecipeSchema,
} from './inventory.validation';

const router = Router();

// ==========================================
// INGREDIENTS
// ==========================================
router.get(
  '/ingredients',
  authenticate,
  authorize('inventory', 'view'),
  inventoryController.getIngredients
);

router.get(
  '/ingredients/:id',
  authenticate,
  authorize('inventory', 'view'),
  inventoryController.getIngredientById
);

router.post(
  '/ingredients',
  authenticate,
  authorize('inventory', 'create'),
  auditLog('inventory', 'CREATE_INGREDIENT'),
  validate({ body: createIngredientSchema }),
  inventoryController.createIngredient
);

router.put(
  '/ingredients/:id',
  authenticate,
  authorize('inventory', 'edit'),
  auditLog('inventory', 'UPDATE_INGREDIENT'),
  validate({ body: updateIngredientSchema }),
  inventoryController.updateIngredient
);

router.delete(
  '/ingredients/:id',
  authenticate,
  authorize('inventory', 'delete'),
  auditLog('inventory', 'DELETE_INGREDIENT'),
  inventoryController.deleteIngredient
);

// ==========================================
// STOCK MOVEMENTS & WASTAGE
// ==========================================
router.post(
  '/movements',
  authenticate,
  authorize('inventory', 'create'),
  auditLog('inventory', 'RECORD_STOCK_MOVEMENT'),
  validate({ body: recordStockMovementSchema }),
  inventoryController.recordStockMovement
);

router.post(
  '/wastage',
  authenticate,
  authorize('inventory', 'create'),
  auditLog('inventory', 'RECORD_WASTAGE'),
  validate({ body: recordWastageSchema }),
  inventoryController.recordWastage
);

router.get(
  '/movements',
  authenticate,
  authorize('inventory', 'view'),
  inventoryController.getStockMovements
);

// ==========================================
// RECIPES
// ==========================================
router.get(
  '/recipes/:menuItemId',
  authenticate,
  authorize('recipes', 'view'),
  inventoryController.getRecipesByMenuItem
);

router.post(
  '/recipes',
  authenticate,
  authorize('recipes', 'create'),
  auditLog('recipes', 'SAVE_RECIPE'),
  validate({ body: createRecipeSchema }),
  inventoryController.saveRecipe
);

router.delete(
  '/recipes/:id',
  authenticate,
  authorize('recipes', 'delete'),
  auditLog('recipes', 'DELETE_RECIPE'),
  inventoryController.deleteRecipe
);

export const inventoryRoutes = router;
