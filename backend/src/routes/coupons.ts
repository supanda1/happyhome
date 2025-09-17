import express from 'express';
import {
  getCoupons,
  getActiveCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponById,
  validateCoupon
} from '../controllers/couponsController';
import { requireAdminAuth } from '../middleware/auth';
import { validationChains, validateUUID, commonValidations, handleValidationErrors } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// Coupon validation for validate endpoint
const validateCouponValidation = [
  commonValidations.requiredString('couponCode', 1, 50),
  commonValidations.positiveNumber('orderTotal'),
  commonValidations.optionalArray('items'),
  handleValidationErrors
];

// Coupon update validation (similar to create but optional fields)
const updateCouponValidation = [
  ...validateUUID('id'),
  commonValidations.optionalString('code', 50),
  commonValidations.optionalString('title', 200),
  commonValidations.optionalString('description'),
  commonValidations.optionalEnum('discount_type', ['percentage', 'fixed_amount', 'free_service']),
  body('discount_value').optional().isFloat({ min: 0 }),
  body('minimum_order_amount').optional().isFloat({ min: 0 }),
  body('maximum_discount_amount').optional().isFloat({ min: 0 }),
  commonValidations.optionalDate('valid_from'),
  commonValidations.optionalDate('valid_until'),
  body('usage_limit').optional().isInt({ min: 1 }),
  body('usage_limit_per_user').optional().isInt({ min: 1 }),
  commonValidations.boolean('is_active'),
  commonValidations.boolean('first_time_users_only'),
  commonValidations.optionalArray('applicable_categories'),
  commonValidations.optionalArray('applicable_services'),
  handleValidationErrors
];

// Public endpoints (customer access)
// GET /api/coupons/active - Get active coupons only (for customer use)
router.get('/active', getActiveCoupons);

// POST /api/coupons/validate - Validate coupon for order (customer use)
router.post('/validate', ...validateCouponValidation, validateCoupon);

// Admin-only endpoints (authentication required)
// GET /api/coupons - Get all coupons (admin management)
router.get('/', requireAdminAuth, getCoupons);

// GET /api/coupons/:id - Get coupon by ID (admin management)
router.get('/:id', requireAdminAuth, ...validateUUID('id'), getCouponById);

// POST /api/coupons - Create new coupon
router.post('/', requireAdminAuth, ...validationChains.coupon.create, createCoupon);

// PUT /api/coupons/:id - Update coupon
router.put('/:id', requireAdminAuth, ...updateCouponValidation, updateCoupon);

// DELETE /api/coupons/:id - Delete coupon
router.delete('/:id', requireAdminAuth, ...validateUUID('id'), deleteCoupon);

export default router;