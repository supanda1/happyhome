import express from 'express';
import {
  getServices,
  getServicesByCategory,
  getServicesBySubcategory,
  createService,
  updateService,
  deleteService,
  getServiceById
} from '../controllers/servicesController';
import { requireAdminAuth, authenticateToken, requireSuperAdminOrPermission } from '../middleware/auth';
import { validationChains, validateUUID } from '../middleware/validation';

const router = express.Router();

// Public endpoints (no auth required)
// GET /api/services - Get all services
router.get('/', getServices);

// GET /api/services/category/:categoryId - Get services by category (must come before /:id)
router.get('/category/:categoryId', ...validateUUID('categoryId'), getServicesByCategory);

// GET /api/services/subcategory/:subcategoryId - Get services by subcategory (must come before /:id)
router.get('/subcategory/:subcategoryId', ...validateUUID('subcategoryId'), getServicesBySubcategory);

// GET /api/services/:id - Get service by ID
router.get('/:id', ...validateUUID('id'), getServiceById);

// Superadmin or permission-based endpoints
// POST /api/services - Create new service (superadmin OR admin with services_create permission)
router.post('/', 
  authenticateToken, 
  requireSuperAdminOrPermission('services', true, false), 
  ...validationChains.service.create, 
  createService
);

// PUT /api/services/:id - Update service (superadmin OR admin with services_edit permission)
router.put('/:id', 
  authenticateToken, 
  requireSuperAdminOrPermission('services', false, true), 
  ...validateUUID('id'), 
  updateService
);

// DELETE /api/services/:id - Delete service (superadmin only for now)
router.delete('/:id', requireAdminAuth, ...validateUUID('id'), deleteService);

export default router;