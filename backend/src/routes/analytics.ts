import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { requireAdminAuth } from '../middleware/auth';

const router = express.Router();

// Admin-only endpoints (analytics contain sensitive business data)
// GET /api/analytics/overview - Get analytics overview with revenue breakdown
router.get('/overview', requireAdminAuth, AnalyticsController.getAnalyticsOverview);

// GET /api/analytics/export - Export analytics data in CSV or Excel format
router.get('/export', requireAdminAuth, AnalyticsController.exportAnalyticsData);

export default router;