import express from 'express';
import {
  getServices,
  getServicesByCategory,
  createService,
  updateService,
  deleteService,
  getServiceById
} from '../controllers/servicesController';
import { requireAdminAuth } from '../middleware/auth';
import { validationChains, validateUUID } from '../middleware/validation';

const router = express.Router();

// Public endpoints (no auth required)
// GET /api/services - Get all services
router.get('/', getServices);

// GET /api/services/category/:categoryId - Get services by category (must come before /:id)
router.get('/category/:categoryId', ...validateUUID('categoryId'), getServicesByCategory);

// GET /api/services/:id - Get service by ID
router.get('/:id', ...validateUUID('id'), getServiceById);

// Admin-only endpoints (authentication required)
// POST /api/services - Create new service
router.post('/', requireAdminAuth, ...validationChains.service.create, createService);

// PUT /api/services/:id - Update service
router.put('/:id', requireAdminAuth, ...validateUUID('id'), updateService);

// DELETE /api/services/:id - Delete service
router.delete('/:id', requireAdminAuth, ...validateUUID('id'), deleteService);

export default router;