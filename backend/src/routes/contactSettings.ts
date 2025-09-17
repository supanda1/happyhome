import { Router } from 'express';
import {
  getContactSettings,
  updateContactSettings,
  resetContactSettings
} from '../controllers/contactSettingsController';
import { requireAdminAuth } from '../middleware/auth';

const router = Router();

// Public endpoints (customers need to see contact information)
// Get contact settings
router.get('/', getContactSettings);
router.get('/contact', getContactSettings); // Frontend expects this path

// Admin-only endpoints (contact settings management)
// Update contact settings
router.put('/', requireAdminAuth, updateContactSettings);

// Reset contact settings to defaults
router.post('/reset', requireAdminAuth, resetContactSettings);

export default router;