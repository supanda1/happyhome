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
// PAYMENT AUDIT ROUTES (Admin only) - MUST be before /:id route
// =====================================================================

// GET /api/admin/payments/audit - Get paginated payments list with filters
router.get('/audit', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const pool = require('../config/database').default;
    
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 20, 10000);
    const offset = (page - 1) * perPage;
    
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (req.query.status) {
      conditions.push(`p.payment_status = $${paramIndex++}`);
      params.push(req.query.status);
    }
    
    if (req.query.gateway) {
      conditions.push(`LOWER(p.gateway_name) = LOWER($${paramIndex++})`);
      params.push(req.query.gateway);
    }
    
    if (req.query.date_from) {
      conditions.push(`p.created_at >= $${paramIndex++}`);
      params.push(req.query.date_from);
    }
    
    if (req.query.date_to) {
      conditions.push(`p.created_at <= $${paramIndex++}::date + interval '1 day'`);
      params.push(req.query.date_to);
    }
    
    if (req.query.customer_email) {
      conditions.push(`LOWER(p.customer_email) LIKE LOWER($${paramIndex++})`);
      params.push(`%${req.query.customer_email}%`);
    }
    
    if (req.query.has_refund === 'true') {
      conditions.push(`p.payment_status = 'refunded'`);
    } else if (req.query.has_refund === 'false') {
      conditions.push(`p.payment_status != 'refunded'`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN p.payment_status = 'success' THEN p.amount ELSE 0 END), 0) as total_received,
        COALESCE(SUM(CASE WHEN p.payment_status = 'refunded' THEN p.amount ELSE 0 END), 0) as total_refunded,
        COALESCE(SUM(CASE WHEN p.payment_status = 'success' THEN p.amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN p.payment_status = 'refunded' THEN p.amount ELSE 0 END), 0) as net_received
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      ${whereClause}
    `;
    const summaryResult = await pool.query(summaryQuery, params);
    
    const paymentsQuery = `
      SELECT 
        p.id,
        p.order_id,
        p.transaction_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_status,
        COALESCE(p.customer_name, 'Guest') as customer_name,
        COALESCE(p.customer_email, '') as customer_email,
        COALESCE(p.customer_phone, '') as customer_phone,
        COALESCE(p.gateway_name, 'Razorpay') as gateway_name,
        p.gateway_transaction_id,
        NULL as razorpay_order_id,
        NULL as razorpay_payment_id,
        NULL as refund_id,
        CASE WHEN p.payment_status = 'refunded' THEN p.amount ELSE 0 END as refund_amount,
        CASE WHEN p.payment_status = 'refunded' THEN 'completed' ELSE NULL END as refund_status,
        NULL as refund_reason,
        NULL as refunded_at,
        p.initiated_at,
        p.completed_at,
        p.failed_at,
        p.failure_reason,
        p.created_at,
        p.updated_at,
        o.order_number,
        o.total_amount as order_amount,
        o.status as order_status
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    const paymentsResult = await pool.query(paymentsQuery, [...params, perPage, offset]);
    
    res.json({
      success: true,
      data: {
        payments: paymentsResult.rows,
        pagination: {
          page,
          per_page: perPage,
          total,
          total_pages: Math.ceil(total / perPage)
        },
        summary: {
          total_transactions: parseInt(summaryResult.rows[0].total_transactions),
          total_received: parseFloat(summaryResult.rows[0].total_received),
          total_refunded: parseFloat(summaryResult.rows[0].total_refunded),
          net_received: parseFloat(summaryResult.rows[0].net_received)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payment audit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment audit data'
    });
  }
});

// GET /api/admin/payments/audit/stats - Get payment statistics
router.get('/audit/stats', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const pool = require('../config/database').default;
    const period = req.query.period as string || '30d';
    
    let dateFilter = '';
    let days = 30;
    switch (period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
      case 'all': days = 0; break;
      default: days = 30;
    }
    
    if (days > 0) {
      dateFilter = `WHERE p.created_at >= NOW() - INTERVAL '${days} days'`;
    }
    
    const overviewQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(p.amount), 0) as gross_amount,
        COALESCE(SUM(CASE WHEN p.payment_status = 'success' THEN p.amount ELSE 0 END), 0) as total_received,
        COALESCE(SUM(CASE WHEN p.payment_status = 'refunded' THEN p.amount ELSE 0 END), 0) as total_refunded,
        COALESCE(SUM(CASE WHEN p.payment_status = 'success' THEN p.amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN p.payment_status = 'refunded' THEN p.amount ELSE 0 END), 0) as net_received,
        COUNT(CASE WHEN p.payment_status = 'success' THEN 1 END) as successful_count,
        COUNT(CASE WHEN p.payment_status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN p.payment_status IN ('pending', 'initiated', 'processing') THEN 1 END) as pending_count,
        COUNT(CASE WHEN p.payment_status = 'refunded' THEN 1 END) as refund_count,
        ROUND(
          COUNT(CASE WHEN p.payment_status = 'success' THEN 1 END)::numeric * 100 / 
          NULLIF(COUNT(*)::numeric, 0), 2
        ) as success_rate,
        ROUND(
          COALESCE(AVG(CASE WHEN p.payment_status = 'success' THEN p.amount END), 0)::numeric, 2
        ) as avg_transaction_value
      FROM payments p
      ${dateFilter}
    `;
    const overviewResult = await pool.query(overviewQuery);
    
    const gatewayQuery = `
      SELECT 
        COALESCE(p.gateway_name, 'Unknown') as gateway,
        COUNT(*) as transactions,
        COALESCE(SUM(CASE WHEN p.payment_status = 'success' THEN p.amount ELSE 0 END), 0) as amount_received,
        COUNT(CASE WHEN p.payment_status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN p.payment_status = 'failed' THEN 1 END) as failed,
        ROUND(
          COUNT(CASE WHEN p.payment_status = 'success' THEN 1 END)::numeric * 100 / 
          NULLIF(COUNT(*)::numeric, 0), 2
        )::text as success_rate
      FROM payments p
      ${dateFilter}
      GROUP BY p.gateway_name
      ORDER BY transactions DESC
    `;
    const gatewayResult = await pool.query(gatewayQuery);
    
    const methodQuery = `
      SELECT 
        COALESCE(p.payment_method, 'unknown') as method,
        COUNT(*) as transactions,
        COALESCE(SUM(CASE WHEN p.payment_status = 'success' THEN p.amount ELSE 0 END), 0) as amount_received,
        COUNT(CASE WHEN p.payment_status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN p.payment_status = 'failed' THEN 1 END) as failed
      FROM payments p
      ${dateFilter}
      GROUP BY p.payment_method
      ORDER BY transactions DESC
    `;
    const methodResult = await pool.query(methodQuery);
    
    const dailyDays = Math.min(days || 30, 30);
    const dailyQuery = `
      SELECT 
        DATE(p.created_at) as date,
        COUNT(*) as transactions,
        COALESCE(SUM(CASE WHEN p.payment_status = 'success' THEN p.amount ELSE 0 END), 0) as amount_received,
        COUNT(CASE WHEN p.payment_status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN p.payment_status = 'refunded' THEN 1 END) as refunded
      FROM payments p
      WHERE p.created_at >= NOW() - INTERVAL '${dailyDays} days'
      GROUP BY DATE(p.created_at)
      ORDER BY date DESC
    `;
    const dailyResult = await pool.query(dailyQuery);
    
    const overview = overviewResult.rows[0];
    
    res.json({
      success: true,
      data: {
        period,
        overview: {
          total_transactions: parseInt(overview.total_transactions) || 0,
          gross_amount: parseFloat(overview.gross_amount) || 0,
          total_received: parseFloat(overview.total_received) || 0,
          total_refunded: parseFloat(overview.total_refunded) || 0,
          net_received: parseFloat(overview.net_received) || 0,
          successful_count: parseInt(overview.successful_count) || 0,
          failed_count: parseInt(overview.failed_count) || 0,
          pending_count: parseInt(overview.pending_count) || 0,
          refund_count: parseInt(overview.refund_count) || 0,
          success_rate: parseFloat(overview.success_rate) || 0,
          avg_transaction_value: parseFloat(overview.avg_transaction_value) || 0
        },
        by_gateway: gatewayResult.rows.map((row: Record<string, string>) => ({
          gateway: row.gateway,
          transactions: parseInt(row.transactions),
          amount_received: parseFloat(row.amount_received),
          successful: parseInt(row.successful),
          failed: parseInt(row.failed),
          success_rate: row.success_rate
        })),
        by_payment_method: methodResult.rows.map((row: Record<string, string>) => ({
          method: row.method,
          transactions: parseInt(row.transactions),
          amount_received: parseFloat(row.amount_received),
          successful: parseInt(row.successful),
          failed: parseInt(row.failed)
        })),
        daily_breakdown: dailyResult.rows.map((row: Record<string, string>) => ({
          date: row.date,
          transactions: parseInt(row.transactions),
          amount_received: parseFloat(row.amount_received),
          successful: parseInt(row.successful),
          refunded: parseInt(row.refunded)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment statistics'
    });
  }
});

// GET /api/admin/payments/audit/:paymentId - Get payment details with audit trail
router.get('/audit/:paymentId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const pool = require('../config/database').default;
    const { paymentId } = req.params;
    
    const paymentQuery = `
      SELECT 
        p.*,
        COALESCE(p.customer_name, 'Guest') as customer_name,
        COALESCE(p.customer_email, '') as customer_email,
        COALESCE(p.customer_phone, '') as customer_phone,
        o.order_number,
        o.total_amount as order_amount,
        o.status as order_status,
        o.created_at as order_created_at,
        NULL as refunded_by_name
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.id = $1
    `;
    const paymentResult = await pool.query(paymentQuery, [paymentId]);
    
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    let auditTrail: any[] = [];
    try {
      const auditQuery = `
        SELECT 
          al.id,
          al.payment_id,
          al.order_id,
          al.action,
          al.previous_status,
          al.new_status,
          al.amount,
          0 as refund_amount,
          al.gateway_name,
          al.gateway_transaction_id,
          al.triggered_by,
          u.name as triggered_by_user_name,
          u.email as triggered_by_user_email,
          al.reason,
          al.created_at
        FROM payment_audit_log al
        LEFT JOIN users u ON al.triggered_by = u.id
        WHERE al.payment_id = $1
        ORDER BY al.created_at DESC
      `;
      const auditResult = await pool.query(auditQuery, [paymentId]);
      auditTrail = auditResult.rows;
    } catch (auditError) {
      console.log('Payment audit log table may not exist');
    }
    
    res.json({
      success: true,
      data: {
        payment: paymentResult.rows[0],
        audit_trail: auditTrail
      }
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment details'
    });
  }
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