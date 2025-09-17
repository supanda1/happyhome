import { Router } from 'express';
import {
  getBanners,
  getActiveBannersByPosition,
  createBanner,
  updateBanner,
  deleteBanner,
  getBannerById
} from '../controllers/bannersController';
import { requireAdminAuth } from '../middleware/auth';
import { validationChains, validateUUID, commonValidations, handleValidationErrors } from '../middleware/validation';
import { param, body } from 'express-validator';

const router = Router();

// Position validation for banner position endpoint
const positionValidation = [
  param('position')
    .isIn(['hero', 'secondary', 'promotional'])
    .withMessage('Position must be one of: hero, secondary, promotional'),
  handleValidationErrors
];

// Banner update validation (similar to create but optional fields)
const updateBannerValidation = [
  ...validateUUID('id'),
  commonValidations.optionalString('title', 200),
  commonValidations.optionalString('subtitle', 300),
  commonValidations.optionalString('description'),
  commonValidations.optionalString('button_text', 100),
  commonValidations.optionalString('button_link', 500),
  commonValidations.optionalString('image_url', 500),
  body('background_color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Background color must be a valid hex color'),
  body('text_color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Text color must be a valid hex color'),
  commonValidations.optionalEnum('position_type', ['hero', 'secondary', 'promotional']),
  commonValidations.boolean('is_active'),
  body('sort_order').optional().isInt({ min: 0 }),
  handleValidationErrors
];

// Public endpoints (customer access)
// Get active banners by position type (for website display)
router.get('/position/:position', ...positionValidation, getActiveBannersByPosition);

// Admin-only endpoints (authentication required)
// Get all banners (admin management)
router.get('/', requireAdminAuth, getBanners);

// Get banner by ID (admin management)
router.get('/:id', requireAdminAuth, ...validateUUID('id'), getBannerById);

// Create new banner
router.post('/', requireAdminAuth, ...validationChains.banner.create, createBanner);

// Update banner
router.put('/:id', requireAdminAuth, ...updateBannerValidation, updateBanner);

// Delete banner
router.delete('/:id', requireAdminAuth, ...validateUUID('id'), deleteBanner);

export default router;