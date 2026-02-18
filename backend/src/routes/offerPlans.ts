import { Router } from 'express';
import {
  getOfferPlans,
  getActiveOfferPlans,
  createOfferPlan,
  updateOfferPlan,
  deleteOfferPlan,
  getOfferPlanById,
  calculateOfferTotals
} from '../controllers/offerPlansController';
import { requireAdminAuth } from '../middleware/auth';

const router = Router();

// Public endpoints (customer access)
// Get active offer plans only (for customer browsing)
router.get('/active', getActiveOfferPlans);

// Calculate offer totals (for customer checkout)
router.post('/calculate', calculateOfferTotals);

// Admin-only endpoints (offer plan management)
// Get all offer plans (admin management)
router.get('/', requireAdminAuth, getOfferPlans);

// Get offer plan by ID (admin management)
router.get('/:id', requireAdminAuth, getOfferPlanById);

// Create new offer plan
router.post('/', requireAdminAuth, createOfferPlan);

// Update offer plan
router.put('/:id', requireAdminAuth, updateOfferPlan);

// Delete offer plan
router.delete('/:id', requireAdminAuth, deleteOfferPlan);

export default router;