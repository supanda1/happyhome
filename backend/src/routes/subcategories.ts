import express from 'express';
import {
  getSubcategories,
  getSubcategoriesByCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getSubcategoryById
} from '../controllers/subcategoriesController';
import { requireAdminAuth } from '../middleware/auth';
import { validateUUID, commonValidations, handleValidationErrors } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// Subcategory validation chains
const subcategoryValidation = {
  create: [
    commonValidations.requiredString('name', 2, 100),
    commonValidations.requiredString('description', 5, 500),
    commonValidations.optionalString('icon', 10),
    commonValidations.uuid('category_id'),
    commonValidations.boolean('is_active'),
    commonValidations.positiveInteger('sort_order'),
    handleValidationErrors
  ],
  
  update: [
    ...validateUUID('id'),
    commonValidations.optionalString('name', 100),
    commonValidations.optionalString('description', 500),
    commonValidations.optionalString('icon', 10),
    commonValidations.optionalUUID('category_id'),
    commonValidations.boolean('is_active'),
    body('sort_order').optional().isInt({ min: 0 }),
    handleValidationErrors
  ]
};

// Public endpoints (no auth required)
// GET /api/subcategories - Get all subcategories
router.get('/', getSubcategories);

// GET /api/subcategories/category/:categoryId - Get subcategories by category (must come before /:id)
router.get('/category/:categoryId', ...validateUUID('categoryId'), getSubcategoriesByCategory);

// GET /api/subcategories/:id - Get subcategory by ID
router.get('/:id', ...validateUUID('id'), getSubcategoryById);

// Admin-only endpoints (authentication required)
// POST /api/subcategories - Create new subcategory
router.post('/', requireAdminAuth, ...subcategoryValidation.create, createSubcategory);

// PUT /api/subcategories/:id - Update subcategory
router.put('/:id', requireAdminAuth, ...subcategoryValidation.update, updateSubcategory);

// DELETE /api/subcategories/:id - Delete subcategory
router.delete('/:id', requireAdminAuth, ...validateUUID('id'), deleteSubcategory);

export default router;