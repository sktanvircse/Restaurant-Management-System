import { Router } from 'express';
import { menuController } from './menu.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import {
  createCategorySchema,
  updateCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  toggleAvailabilitySchema,
} from './menu.validation';

const router = Router();

// ==========================================
// PUBLIC / GUEST MENU BROWSING
// ==========================================
router.get('/categories', menuController.getCategories);
router.get('/categories/:id', menuController.getCategoryById);
router.get('/items', menuController.getMenuItems);
router.get('/items/:id', menuController.getMenuItemById);

// ==========================================
// PROTECTED CATEGORIES MANAGEMENT (Staff)
// ==========================================
router.post(
  '/categories',
  authenticate,
  authorize('menu', 'create'),
  auditLog('menu', 'CREATE_CATEGORY'),
  validate({ body: createCategorySchema }),
  menuController.createCategory
);

router.put(
  '/categories/:id',
  authenticate,
  authorize('menu', 'edit'),
  auditLog('menu', 'UPDATE_CATEGORY'),
  validate({ body: updateCategorySchema }),
  menuController.updateCategory
);

router.delete(
  '/categories/:id',
  authenticate,
  authorize('menu', 'delete'),
  auditLog('menu', 'DELETE_CATEGORY'),
  menuController.deleteCategory
);

// ==========================================
// PROTECTED MENU ITEMS MANAGEMENT (Staff)
// ==========================================
router.post(
  '/items',
  authenticate,
  authorize('menu', 'create'),
  auditLog('menu', 'CREATE_MENU_ITEM'),
  validate({ body: createMenuItemSchema }),
  menuController.createMenuItem
);

router.put(
  '/items/:id',
  authenticate,
  authorize('menu', 'edit'),
  auditLog('menu', 'UPDATE_MENU_ITEM'),
  validate({ body: updateMenuItemSchema }),
  menuController.updateMenuItem
);

// 86 Out-of-Stock Toggle (Manager, Chef, Kitchen staff)
router.patch(
  '/items/:id/availability',
  authenticate,
  authorize('menu', 'edit'),
  auditLog('menu', 'TOGGLE_AVAILABILITY'),
  validate({ body: toggleAvailabilitySchema }),
  menuController.toggleAvailability
);

router.delete(
  '/items/:id',
  authenticate,
  authorize('menu', 'delete'),
  auditLog('menu', 'DELETE_MENU_ITEM'),
  menuController.deleteMenuItem
);

export const menuRoutes = router;
