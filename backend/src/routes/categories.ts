import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById
} from '../controllers/categoriesController';
import { requireAdminAuth, authenticateToken, requireSuperAdminOrPermission } from '../middleware/auth';
import { validationChains, validateUUID } from '../middleware/validation';

const router = express.Router();

// Public endpoints (no auth required)
// GET /api/categories - Get all categories
router.get('/', getCategories);

// GET /api/categories/:id - Get category by ID
router.get('/:id', ...validateUUID('id'), getCategoryById);

// Superadmin or permission-based endpoints
// POST /api/categories - Create new category (superadmin OR admin with categories_create permission)
router.post('/', 
  authenticateToken, 
  requireSuperAdminOrPermission('categories', true, false), 
  ...validationChains.category.create, 
  createCategory
);

// PUT /api/categories/:id - Update category (superadmin OR admin with categories_edit permission)
router.put('/:id', 
  authenticateToken, 
  requireSuperAdminOrPermission('categories', false, true), 
  ...validateUUID('id'),
  ...validationChains.category.update, 
  updateCategory
);

// DELETE /api/categories/:id - Delete category (superadmin only for now)
router.delete('/:id', requireAdminAuth, ...validateUUID('id'), deleteCategory);

export default router;