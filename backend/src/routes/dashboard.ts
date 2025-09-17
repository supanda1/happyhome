import { Router } from 'express';
import { getDashboardStats, getSystemHealth } from '../controllers/dashboardController';
import { requireAdminAuth } from '../middleware/auth';

const router = Router();

// Public endpoint (for monitoring/health checks)
router.get('/health', getSystemHealth);

// Admin-only endpoints (contain sensitive business metrics)
router.get('/stats', requireAdminAuth, getDashboardStats);

export default router;