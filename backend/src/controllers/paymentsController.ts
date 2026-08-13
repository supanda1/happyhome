import { Request, Response } from 'express';
import pool from '../config/database';

interface PaymentMethodInfo {
  method: string;
  name: string;
  description: string;
  icon: string;
  gateway: string;
  is_default: string;
}

interface PaymentInitiateRequest {
  order_id: string;
  payment_method: string;
  return_url?: string;
  customer_data?: any;
}

export class PaymentsController {

  static async getPaymentMethods(req: Request, res: Response) {
    try {
      const paymentMethods: PaymentMethodInfo[] = [
        {
          method: 'credit_card',
          name: 'Credit Card',
          description: 'Visa, MasterCard, American Express, RuPay',
          icon: 'credit-card',
          gateway: 'Razorpay',
          is_default: 'true'
        },
        {
          method: 'debit_card',
          name: 'Debit Card',
          description: 'All major bank debit cards',
          icon: 'debit-card',
          gateway: 'Razorpay',
          is_default: 'true'
        },
        {
          method: 'net_banking',
          name: 'Net Banking',
          description: '50+ banks including SBI, HDFC, Axis',
          icon: 'bank',
          gateway: 'Razorpay',
          is_default: 'true'
        },
        {
          method: 'upi',
          name: 'UPI',
          description: 'PhonePe, GPay, Paytm, BHIM',
          icon: 'upi',
          gateway: 'Razorpay',
          is_default: 'true'
        },
        {
          method: 'wallet',
          name: 'Digital Wallets',
          description: 'Paytm Wallet, MobiKwik, Amazon Pay',
          icon: 'wallet',
          gateway: 'Razorpay',
          is_default: 'true'
        },
        {
          method: 'emi',
          name: 'EMI Options',
          description: 'Credit card EMI and cardless EMI',
          icon: 'emi',
          gateway: 'Razorpay',
          is_default: 'true'
        }
      ];

      res.json({
        success: true,
        payment_methods: paymentMethods
      });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment methods'
      });
    }
  }

  static async getGatewayInfo(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        gateway: {
          name: 'Razorpay',
          provider: 'Razorpay',
          type: 'Payment Gateway',
          description: 'All payments are processed securely through Razorpay\'s certified payment gateway',
          supported_methods: ['Credit Cards', 'Debit Cards', 'Net Banking', 'UPI', 'Digital Wallets', 'EMI'],
          security_features: ['SSL Encryption', 'PCI DSS Compliant', '3D Secure', 'Fraud Detection'],
          is_default: true,
          test_mode: process.env.NODE_ENV === 'development',
          display_message: '🔒 Secure payments powered by Razorpay',
          logo_url: '/static/images/razorpay-logo.png'
        }
      });
    } catch (error) {
      console.error('Error fetching gateway info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch gateway information'
      });
    }
  }

  static async getPaymentConfig(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        config: {
          default_gateway: 'Razorpay',
          gateway_display_name: 'Razorpay Secure Gateway',
          show_gateway_selection: false,
          display_gateway_info: true,
          gateway_badge: '🔒 Razorpay Secure',
          trust_indicators: [
            '🔒 Bank-Grade Security',
            '✅ PCI DSS Certified',
            '🛡️ Fraud Protection',
            '💳 All Cards Accepted'
          ]
        }
      });
    } catch (error) {
      console.error('Error fetching payment config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment configuration'
      });
    }
  }

  static async initiatePayment(req: Request, res: Response) {
    try {
      const { order_id, payment_method, return_url, customer_data }: PaymentInitiateRequest = req.body;

      console.log('🚀 Payment Initiation Request:', {
        order_id,
        payment_method,
        gateway: 'Razorpay',
        timestamp: new Date().toISOString()
      });

      // Get order details
      const orderQuery = `
        SELECT o.*, u.first_name, u.last_name, u.email, u.phone 
        FROM orders o 
        JOIN users u ON o.customer_id = u.id 
        WHERE o.id = $1
      `;
      const orderResult = await pool.query(orderQuery, [order_id]);
      
      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      const order = orderResult.rows[0];
      
      // Check if order is already paid
      if (order.is_paid) {
        return res.status(400).json({
          success: false,
          error: 'Order is already paid'
        });
      }

      // Check for existing pending payments
      const pendingPaymentQuery = `
        SELECT id FROM payments 
        WHERE order_id = $1 AND payment_status IN ('pending', 'initiated')
      `;
      const pendingResult = await pool.query(pendingPaymentQuery, [order_id]);
      
      if (pendingResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Payment already in progress for this order'
        });
      }

      // Generate transaction ID
      const transactionId = `TXN_${Date.now()}_${order_id.slice(-8)}`;
      
      // Create payment record
      const insertPaymentQuery = `
        INSERT INTO payments (
          id, order_id, transaction_id, amount, currency, payment_method,
          payment_status, customer_name, customer_email, customer_phone,
          gateway_name, initiated_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 'INR', $4, 'initiated',
          $5, $6, $7, 'Razorpay', NOW(), NOW(), NOW()
        ) RETURNING *
      `;
      
      const customerName = `${order.first_name} ${order.last_name}`;
      const paymentResult = await pool.query(insertPaymentQuery, [
        order_id,
        transactionId,
        order.final_amount,
        payment_method,
        customerName,
        order.email,
        order.phone
      ]);

      const payment = paymentResult.rows[0];

      console.log('✅ Payment Initiated Successfully:', {
        transaction_id: transactionId,
        amount: order.final_amount,
        customer: customerName,
        payment_method
      });

      // Return payment details - frontend will use Razorpay checkout
      res.json({
        success: true,
        payment: {
          id: payment.id,
          transaction_id: transactionId,
          amount: order.final_amount,
          currency: 'INR',
          payment_method,
          payment_status: 'initiated',
          customer_name: customerName,
          customer_email: order.email,
          created_at: payment.created_at
        },
        message: 'Payment initiated successfully'
      });

    } catch (error) {
      console.error('❌ Payment Initiation Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate payment'
      });
    }
  }

  static async handlePaymentCallback(req: Request, res: Response) {
    try {
      const { transaction_id, status, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
      
      console.log('🔄 Payment Callback Received:', {
        timestamp: new Date().toISOString(),
        transaction_id,
        status
      });

      if (!transaction_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing transaction ID'
        });
      }

      // Update payment status
      const updateQuery = `
        UPDATE payments 
        SET 
          payment_status = $1,
          gateway_transaction_id = $2,
          gateway_status_code = $3,
          gateway_response = $4,
          completed_at = CASE WHEN $1 = 'success' THEN NOW() ELSE NULL END,
          updated_at = NOW()
        WHERE transaction_id = $5
        RETURNING *
      `;

      const paymentStatus = status === 'success' ? 'success' : 'failed';
      
      const paymentResult = await pool.query(updateQuery, [
        paymentStatus,
        razorpay_payment_id || null,
        status,
        JSON.stringify({ razorpay_order_id, razorpay_signature }),
        transaction_id
      ]);

      if (paymentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Payment record not found'
        });
      }

      const payment = paymentResult.rows[0];

      // Update order payment status if successful
      if (paymentStatus === 'success') {
        await pool.query(`
          UPDATE orders 
          SET is_paid = true, payment_status = 'paid', updated_at = NOW() 
          WHERE id = $1
        `, [payment.order_id]);
        
        console.log('✅ Order Payment Completed:', {
          order_id: payment.order_id,
          transaction_id,
          razorpay_payment_id,
          amount: payment.amount
        });
      } else {
        console.log('❌ Payment Failed:', {
          order_id: payment.order_id,
          transaction_id,
          reason: status
        });
      }

      res.json({
        success: true,
        payment_status: paymentStatus,
        order_id: payment.order_id
      });

    } catch (error) {
      console.error('❌ Payment Callback Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process payment callback'
      });
    }
  }

  static async generateUPIQR(req: Request, res: Response) {
    try {
      const { order_id, amount } = req.query as { order_id?: string; amount?: string };

      const parsedAmount = parseFloat(amount || '0');
      if (!parsedAmount || parsedAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Valid amount is required' });
      }

      const merchantUpiId = process.env.MERCHANT_UPI_ID || 'happyhomes@upi';
      const merchantName = process.env.MERCHANT_NAME || 'Happy Homes Services';
      const transactionNote = order_id ? `Order ${order_id}` : 'Happy Homes Payment';

      const upiUri = [
        `upi://pay?pa=${encodeURIComponent(merchantUpiId)}`,
        `pn=${encodeURIComponent(merchantName)}`,
        `am=${parsedAmount.toFixed(2)}`,
        `cu=INR`,
        `tn=${encodeURIComponent(transactionNote)}`,
      ].join('&');

      let qrCodeLib: typeof import('qrcode');
      try {
        qrCodeLib = await import('qrcode');
      } catch {
        return res.status(500).json({ success: false, error: 'QR code service is unavailable. Please use the UPI ID to pay manually.' });
      }

      let qrDataUrl: string;
      try {
        qrDataUrl = await qrCodeLib.toDataURL(upiUri, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: { dark: '#1a1a2e', light: '#ffffff' },
        });
      } catch {
        return res.status(500).json({ success: false, error: 'Failed to generate QR code. Please use the UPI ID to pay manually.' });
      }

      res.json({
        success: true,
        upi_uri: upiUri,
        qr_data_url: qrDataUrl,
        merchant_upi_id: merchantUpiId,
        merchant_name: merchantName,
        amount: parsedAmount,
        order_id: order_id || null,
      });
    } catch (error) {
      console.error('UPI QR generation error:', error);
      res.status(500).json({ success: false, error: 'Failed to generate UPI QR code' });
    }
  }

  static async getPaymentHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 20;
      const statusFilter = req.query.status_filter as string;
      
      const offset = (page - 1) * perPage;
      
      let query = `
        SELECT p.*, o.order_number 
        FROM payments p 
        JOIN orders o ON p.order_id = o.id 
        WHERE o.customer_id = $1
      `;
      let params: any[] = [userId];
      let paramCount = 1;

      if (statusFilter) {
        paramCount++;
        query += ` AND p.payment_status = $${paramCount}`;
        params.push(statusFilter);
      }

      query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(perPage, offset);

      const result = await pool.query(query, params);
      
      let countQuery = `
        SELECT COUNT(*) 
        FROM payments p 
        JOIN orders o ON p.order_id = o.id 
        WHERE o.customer_id = $1
      `;
      let countParams = [userId];
      
      if (statusFilter) {
        countQuery += ` AND p.payment_status = $2`;
        countParams.push(statusFilter);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        payments: result.rows,
        total_count: totalCount,
        page,
        per_page: perPage,
        has_next: (offset + perPage) < totalCount,
        has_prev: page > 1
      });

    } catch (error) {
      console.error('Error fetching payment history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment history'
      });
    }
  }
}