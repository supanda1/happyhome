import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById
} from '../controllers/categoriesController';
import { requireAdminAuth } from '../middleware/auth';
import { validationChains, validateUUID } from '../middleware/validation';

const router = express.Router();

// Public endpoints (no auth required)
// GET /api/categories - Get all categories
router.get('/', getCategories);

// GET /api/categories/:id - Get category by ID
router.get('/:id', ...validateUUID('id'), getCategoryById);

// Admin-only endpoints (authentication required)
// POST /api/categories - Create new category
router.post('/', requireAdminAuth, ...validationChains.category.create, createCategory);

// PUT /api/categories/:id - Update category
router.put('/:id', requireAdminAuth, ...validationChains.category.update, updateCategory);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', requireAdminAuth, ...validateUUID('id'), deleteCategory);

export default router;