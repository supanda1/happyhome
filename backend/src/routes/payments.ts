import express, { Request, Response } from 'express';
import { PaymentsController } from '../controllers/paymentsController';
import { requireAuth, requireAdminAuth } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import { handleValidationErrors, validateUUID } from '../middleware/validation';

const router = express.Router();

// Validation chains for payment routes
const initiatePaymentValidation = [
  body('order_id')
    .isUUID(4)
    .withMessage('Order ID must be a valid UUID'),
  body('payment_method')
    .isIn(['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet', 'emi'])
    .withMessage('Invalid payment method'),
  body('return_url')
    .optional()
    .isURL()
    .withMessage('Return URL must be a valid URL'),
  handleValidationErrors
];

const paymentHistoryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('per_page')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Per page must be between 1 and 100'),
  query('status_filter')
    .optional()
    .isIn(['pending', 'initiated', 'processing', 'success', 'failed', 'cancelled', 'refunded'])
    .withMessage('Invalid status filter'),
  handleValidationErrors
];

// =====================================================================
// PUBLIC ROUTES (No Authentication Required)
// =====================================================================

// GET /api/payments/methods - Get available payment methods
router.get('/methods', PaymentsController.getPaymentMethods);

// GET /api/payments/gateway-info - Get payment gateway information  
router.get('/gateway-info', PaymentsController.getGatewayInfo);

// GET /api/payments/upi-qr - Generate UPI QR code for a given amount/order
router.get('/upi-qr', PaymentsController.generateUPIQR);

// GET /api/payments/config - Get payment configuration for frontend
router.get('/config', PaymentsController.getPaymentConfig);

// POST /api/payments/callback - Handle payment callback from gateway
router.post('/callback', PaymentsController.handlePaymentCallback);

// GET /api/payments/callback/success - Payment success page
router.get('/callback/success', (req, res) => {
  const successHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Successful - Happy Homes</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container { 
                max-width: 500px; 
                background: white; 
                padding: 40px; 
                border-radius: 15px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .success-icon { 
                color: #28a745; 
                font-size: 80px; 
                margin-bottom: 20px; 
                animation: bounce 1s ease-in-out;
            }
            @keyframes bounce {
                0%, 20%, 60%, 100% { transform: translateY(0); }
                40% { transform: translateY(-20px); }
                80% { transform: translateY(-10px); }
            }
            h1 { 
                color: #28a745; 
                margin-bottom: 15px; 
                font-size: 28px;
            }
            p { 
                color: #666; 
                margin-bottom: 30px; 
                font-size: 16px;
                line-height: 1.5;
            }
            .btn { 
                background: #007bff; 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 8px; 
                display: inline-block; 
                font-weight: 500;
                transition: background 0.3s ease;
            }
            .btn:hover { 
                background: #0056b3; 
                transform: translateY(-2px);
            }
            .gateway-info {
                margin-top: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                font-size: 14px;
                color: #6c757d;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">✓</div>
            <h1>Payment Successful!</h1>
            <p>Your payment has been processed successfully. You will receive a confirmation email shortly.</p>
            <a href="/orders" class="btn">View My Orders</a>
            <div class="gateway-info">
                🔒 Secure Payment Gateway<br>
                Your transaction is protected with bank-grade security
            </div>
        </div>
    </body>
    </html>
  `;
  res.send(successHtml);
});

// GET /api/payments/callback/failed - Payment failed page  
router.get('/callback/failed', (req, res) => {
  const failedHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Failed - Happy Homes</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container { 
                max-width: 500px; 
                background: white; 
                padding: 40px; 
                border-radius: 15px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .error-icon { 
                color: #dc3545; 
                font-size: 80px; 
                margin-bottom: 20px; 
                animation: shake 0.5s ease-in-out;
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            h1 { 
                color: #dc3545; 
                margin-bottom: 15px; 
                font-size: 28px;
            }
            p { 
                color: #666; 
                margin-bottom: 30px; 
                font-size: 16px;
                line-height: 1.5;
            }
            .btn { 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 8px; 
                display: inline-block; 
                margin: 5px;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            .btn-primary { background: #007bff; }
            .btn-primary:hover { background: #0056b3; transform: translateY(-2px); }
            .btn-retry { background: #28a745; }
            .btn-retry:hover { background: #1e7e34; transform: translateY(-2px); }
            .gateway-info {
                margin-top: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                font-size: 14px;
                color: #6c757d;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="error-icon">✗</div>
            <h1>Payment Failed</h1>
            <p>Your payment could not be processed. This might be due to insufficient funds, network issues, or other banking restrictions. Please try again or use a different payment method.</p>
            <a href="/orders" class="btn btn-primary">View Orders</a>
            <a href="javascript:history.back()" class="btn btn-retry">Try Again</a>
            <div class="gateway-info">
                🔒 Secure Payment Gateway<br>
                💳 Try a different payment method or contact your bank
            </div>
        </div>
    </body>
    </html>
  `;
  res.send(failedHtml);
});

// =====================================================================
// AUTHENTICATED USER ROUTES
// =====================================================================

// POST /api/payments/initiate - Initiate payment for an order
router.post('/initiate', requireAuth, ...initiatePaymentValidation, PaymentsController.initiatePayment);

// GET /api/payments/history - Get payment history for current user
router.get('/history', requireAuth, ...paymentHistoryValidation, PaymentsController.getPaymentHistory);

// GET /api/payments/:id - Get payment details by ID
router.get('/:id', requireAuth, ...validateUUID('id'), (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Payment details endpoint not implemented yet' });
});

// POST /api/payments/verify - Verify payment status with gateway
router.post('/verify', requireAuth, [
  body('transaction_id').notEmpty().withMessage('Transaction ID is required'),
  handleValidationErrors
], (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Payment verification endpoint not implemented yet' });
});

// =====================================================================
// ADMIN ONLY ROUTES
// =====================================================================

// POST /api/payments/refund - Process refund for a payment (Admin only)
router.post('/refund', requireAdminAuth, [
  body('payment_id').isUUID(4).withMessage('Payment ID must be a valid UUID'),
  body('refund_amount').isFloat({ min: 0.01 }).withMessage('Refund amount must be greater than 0'),
  body('refund_reason').notEmpty().withMessage('Refund reason is required'),
  handleValidationErrors
], (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Payment refund endpoint not implemented yet' });
});

// POST /api/payments/webhook - Handle payment webhook from gateway (Admin/System)
router.post('/webhook', (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Payment webhook endpoint not implemented yet' });
});

// GET /api/payments/stats - Get payment statistics (Admin only)
router.get('/stats', requireAdminAuth, (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Payment stats endpoint not implemented yet' });
});

// GET /api/payments/order/:orderId - Get order with all its payments
router.get('/order/:orderId', requireAuth, ...validateUUID('orderId'), (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Order payments endpoint not implemented yet' });
});

export default router;