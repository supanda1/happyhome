import express from 'express';
import {
  getSubcategories,
  getSubcategoriesByCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getSubcategoryById
} from '../controllers/subcategoriesController';
import { requireAdminAuth, authenticateToken, requireSuperAdminOrPermission } from '../middleware/auth';
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
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
    body('sort_order').optional().isInt({ min: 0 }).withMessage('sort_order must be a positive integer'),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.optionalString('name', 100),
    commonValidations.optionalString('description', 500),
    commonValidations.optionalString('icon', 10),
    commonValidations.optionalUUID('category_id'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
    body('sort_order').optional().isInt({ min: 0 }).withMessage('sort_order must be a positive integer'),
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

// Superadmin or permission-based endpoints
// POST /api/subcategories - Create new subcategory (superadmin OR admin with subcategories_create permission)
router.post('/', 
  authenticateToken, 
  requireSuperAdminOrPermission('subcategories', true, false), 
  ...subcategoryValidation.create, 
  createSubcategory
);

// PUT /api/subcategories/:id - Update subcategory (superadmin OR admin with subcategories_edit permission)
router.put('/:id', 
  authenticateToken, 
  requireSuperAdminOrPermission('subcategories', false, true), 
  ...validateUUID('id'),
  ...subcategoryValidation.update, 
  updateSubcategory
);

// DELETE /api/subcategories/:id - Delete subcategory (superadmin only for now)
router.delete('/:id', requireAdminAuth, ...validateUUID('id'), deleteSubcategory);

export default router;