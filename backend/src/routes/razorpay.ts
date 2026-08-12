/**
 * Razorpay Payment Routes
 * 
 * Endpoints:
 * - POST /api/razorpay/create-order - Create Razorpay order
 * - POST /api/razorpay/verify - Verify payment signature
 * - GET /api/razorpay/config - Get frontend config
 * - GET /api/razorpay/methods - Get payment methods
 * - GET /api/razorpay/payment/:payment_id - Get payment status
 * - POST /api/razorpay/refund - Create refund (Admin)
 * - GET /api/razorpay/refund/:refund_id - Get refund status
 */

import express from 'express';
import { body, param } from 'express-validator';
import { RazorpayController } from '../controllers/razorpayController';
import { requireAuth, requireAdminAuth } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// =====================================================================
// PUBLIC ROUTES (No Authentication Required)
// =====================================================================

// GET /api/razorpay/config - Get Razorpay configuration for frontend
router.get('/config', RazorpayController.getConfig);

// GET /api/razorpay/methods - Get available payment methods
router.get('/methods', RazorpayController.getPaymentMethods);

// =====================================================================
// AUTHENTICATED USER ROUTES
// =====================================================================

// POST /api/razorpay/create-order - Create Razorpay order for payment
router.post(
  '/create-order',
  requireAuth,
  [
    body('order_id')
      .isUUID(4)
      .withMessage('Order ID must be a valid UUID'),
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be at least ₹1'),
    body('currency')
      .optional()
      .isIn(['INR'])
      .withMessage('Only INR currency is supported'),
    handleValidationErrors,
  ],
  RazorpayController.createOrder
);

// POST /api/razorpay/verify - Verify payment after completion
router.post(
  '/verify',
  requireAuth,
  [
    body('razorpay_order_id')
      .notEmpty()
      .withMessage('Razorpay order ID is required'),
    body('razorpay_payment_id')
      .notEmpty()
      .withMessage('Razorpay payment ID is required'),
    body('razorpay_signature')
      .notEmpty()
      .withMessage('Razorpay signature is required'),
    body('order_id')
      .optional()
      .isUUID(4)
      .withMessage('Order ID must be a valid UUID'),
    handleValidationErrors,
  ],
  RazorpayController.verifyPayment
);

// GET /api/razorpay/payment/:payment_id - Get payment status
router.get(
  '/payment/:payment_id',
  requireAuth,
  [
    param('payment_id')
      .notEmpty()
      .withMessage('Payment ID is required'),
    handleValidationErrors,
  ],
  RazorpayController.getPaymentStatus
);

// =====================================================================
// ADMIN ONLY ROUTES
// =====================================================================

// POST /api/razorpay/refund - Process refund (Admin only)
router.post(
  '/refund',
  requireAdminAuth,
  [
    body('payment_id')
      .notEmpty()
      .withMessage('Payment ID is required'),
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Refund amount must be greater than 0'),
    body('reason')
      .optional()
      .isString()
      .withMessage('Reason must be a string'),
    handleValidationErrors,
  ],
  RazorpayController.createRefund
);

// GET /api/razorpay/refund/:refund_id - Get refund status
router.get(
  '/refund/:refund_id',
  requireAdminAuth,
  [
    param('refund_id')
      .notEmpty()
      .withMessage('Refund ID is required'),
    handleValidationErrors,
  ],
  RazorpayController.getRefundStatus
);

export default router;
