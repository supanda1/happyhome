import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { requireAdminAuth } from '../middleware/auth';

const router = express.Router();

// Conditional authentication for development
const conditionalAuth = process.env.NODE_ENV === 'development' ? 
  (_req: any, _res: any, next: any) => next() : // Skip auth in development
  requireAdminAuth; // Require auth in production

// Admin-only endpoints (analytics contain sensitive business data)
// GET /api/analytics/overview - Get analytics overview with revenue breakdown
router.get('/overview', conditionalAuth, AnalyticsController.getAnalyticsOverview);

// GET /api/analytics/export - Export analytics data in CSV or Excel format
router.get('/export', conditionalAuth, AnalyticsController.exportAnalyticsData);

export default router;