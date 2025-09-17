import { Router } from 'express';
import {
  getReviewSettings,
  updateReviewSettings,
  resetReviewSettings,
  getReviewStatistics
} from '../controllers/reviewSettingsController';
import { requireAdminAuth } from '../middleware/auth';

const router = Router();

// Admin-only endpoints (review settings are admin configuration)
// Get review statistics for dashboard (must come before /:id patterns)
router.get('/statistics', requireAdminAuth, getReviewStatistics);

// Get review settings
router.get('/', requireAdminAuth, getReviewSettings);

// Update review settings
router.put('/', requireAdminAuth, updateReviewSettings);

// Reset review settings to defaults
router.post('/reset', requireAdminAuth, resetReviewSettings);

export default router;