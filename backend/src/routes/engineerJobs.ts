import express from 'express';
import { EngineerJobsController } from '../controllers/engineerJobsController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/my-jobs', requireAuth, EngineerJobsController.getMyJobs);
router.post('/my-jobs/:jobId/accept', requireAuth, EngineerJobsController.acceptJob);
router.post('/my-jobs/:jobId/reject', requireAuth, EngineerJobsController.rejectJob);
router.post('/my-jobs/:jobId/start', requireAuth, EngineerJobsController.startJob);
router.post('/my-jobs/:jobId/complete', requireAuth, EngineerJobsController.completeJob);

export default router;
