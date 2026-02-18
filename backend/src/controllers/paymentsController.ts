import { Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../config/database';

interface PaymentMethod {
  method: string;
  name: string;
  description: string;
  icon: string;
  gateway: string;
  is_default: string;
}

interface ICICIPaymentConfig {
  merchantId: string;
  accessCode: string;
  workingKey: string;
  gatewayUrl: string;
  returnUrl: string;
  cancelUrl: string;
}

interface PaymentInitiateRequest {
  order_id: string;
  payment_method: string;
  return_url?: string;
  customer_data?: any;
}

export class PaymentsController {
  
  private static iciciConfig: ICICIPaymentConfig = {
    merchantId: process.env.ICICI_MERCHANT_ID || '3067604',
    accessCode: process.env.ICICI_ACCESS_CODE || 'AVQX19JC44AV68QVXA',
    workingKey: process.env.ICICI_WORKING_KEY || 'E5BBC03C454D6E46A5B9DBC04B8316F3',
    gatewayUrl: 'https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction',
    returnUrl: 'http://localhost:8001/api/payments/callback',
    cancelUrl: 'http://localhost:8001/api/payments/callback/failed'
  };

  static async getPaymentMethods(req: Request, res: Response) {
    try {
      const paymentMethods: PaymentMethod[] = [
        {
          method: 'credit_card',
          name: 'Credit Card (ICICI Secure)',
          description: 'Visa, MasterCard, American Express, RuPay - Powered by ICICI Bank',
          icon: 'credit-card',
          gateway: 'ICICI',
          is_default: 'true'
        },
        {
          method: 'debit_card',
          name: 'Debit Card (ICICI Secure)',
          description: 'All major bank debit cards - Powered by ICICI Bank',
          icon: 'debit-card',
          gateway: 'ICICI',
          is_default: 'true'
        },
        {
          method: 'net_banking',
          name: 'Net Banking (ICICI Gateway)',
          description: '50+ banks including ICICI, SBI, HDFC - Secure ICICI Gateway',
          icon: 'bank',
          gateway: 'ICICI',
          is_default: 'true'
        },
        {
          method: 'upi',
          name: 'UPI (ICICI Secure)',
          description: 'PhonePe, GPay, Paytm, BHIM - Processed via ICICI Gateway',
          icon: 'upi',
          gateway: 'ICICI',
          is_default: 'true'
        },
        {
          method: 'wallet',
          name: 'Digital Wallets (ICICI)',
          description: 'Paytm Wallet, MobiKwik, Amazon Pay - Via ICICI Gateway',
          icon: 'wallet',
          gateway: 'ICICI',
          is_default: 'true'
        },
        {
          method: 'emi',
          name: 'EMI Options (ICICI)',
          description: 'Credit card EMI and cardless EMI - ICICI Gateway',
          icon: 'emi',
          gateway: 'ICICI',
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
          name: 'ICICI Bank',
          provider: 'ICICI',
          type: 'Bank Gateway',
          description: 'All payments are processed securely through ICICI Bank\'s certified payment gateway',
          supported_methods: ['Credit Cards', 'Debit Cards', 'Net Banking', 'UPI', 'Digital Wallets', 'EMI'],
          security_features: ['SSL Encryption', 'PCI DSS Compliant', '3D Secure', 'Fraud Detection'],
          is_default: true,
          test_mode: process.env.NODE_ENV === 'development',
          display_message: '🔒 Secure payments powered by ICICI Bank',
          logo_url: '/static/images/icici-logo.png'
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
          default_gateway: 'ICICI',
          gateway_display_name: 'ICICI Secure Gateway',
          show_gateway_selection: false,
          display_gateway_info: true,
          gateway_badge: '🏦 ICICI Bank Secure',
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

      console.log('🚀 ICICI Payment Initiation Request:', {
        order_id,
        payment_method,
        gateway: 'ICICI Bank',
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
          $5, $6, $7, 'ICICI', NOW(), NOW(), NOW()
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

      // Prepare ICICI payment parameters
      const paymentParams = {
        merchant_id: PaymentsController.iciciConfig.merchantId,
        order_id: transactionId,
        amount: order.final_amount,
        currency: 'INR',
        redirect_url: PaymentsController.iciciConfig.returnUrl,
        cancel_url: PaymentsController.iciciConfig.cancelUrl,
        billing_name: customerName,
        billing_email: order.email,
        billing_tel: order.phone,
        delivery_name: customerName,
        delivery_tel: order.phone,
        merchant_param1: order_id,
        merchant_param2: payment_method
      };

      // Encrypt payment data for ICICI
      const encryptedData = PaymentsController.encryptPaymentData(paymentParams);
      
      // Generate payment form HTML
      const paymentForm = `
        <form id="iciciPaymentForm" method="post" action="${PaymentsController.iciciConfig.gatewayUrl}">
          <input type="hidden" name="encRequest" value="${encryptedData}">
          <input type="hidden" name="access_code" value="${PaymentsController.iciciConfig.accessCode}">
        </form>
        <script>
          console.log('🏦 Redirecting to ICICI Payment Gateway...');
          document.getElementById('iciciPaymentForm').submit();
        </script>
      `;

      console.log('✅ ICICI Payment Initiated Successfully:', {
        transaction_id: transactionId,
        amount: order.final_amount,
        customer: customerName,
        payment_method,
        gateway_url: PaymentsController.iciciConfig.gatewayUrl
      });

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
        payment_form: paymentForm,
        gateway_url: PaymentsController.iciciConfig.gatewayUrl,
        message: 'Payment initiated successfully via ICICI Secure Gateway'
      });

    } catch (error) {
      console.error('❌ ICICI Payment Initiation Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate payment'
      });
    }
  }

  static async handlePaymentCallback(req: Request, res: Response) {
    try {
      const { encResp } = req.body;
      
      console.log('🔄 ICICI Payment Callback Received:', {
        timestamp: new Date().toISOString(),
        has_encrypted_response: !!encResp
      });

      if (!encResp) {
        return res.status(400).json({
          success: false,
          error: 'Missing encrypted response from payment gateway'
        });
      }

      // Decrypt response from ICICI
      const decryptedData = PaymentsController.decryptPaymentData(encResp);
      console.log('🔓 Decrypted ICICI Response:', decryptedData);

      const transactionId = decryptedData.order_id;
      const orderStatus = decryptedData.order_status;
      const orderId = decryptedData.merchant_param1;

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

      const paymentStatus = orderStatus === 'Success' ? 'success' : 'failed';
      const gatewayTxnId = decryptedData.tracking_id || decryptedData.bank_ref_no;
      
      const paymentResult = await pool.query(updateQuery, [
        paymentStatus,
        gatewayTxnId,
        orderStatus,
        JSON.stringify(decryptedData),
        transactionId
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
        `, [orderId]);
        
        console.log('✅ Order Payment Completed:', {
          order_id: orderId,
          transaction_id: transactionId,
          gateway_txn_id: gatewayTxnId,
          amount: payment.amount
        });
      } else {
        console.log('❌ Payment Failed:', {
          order_id: orderId,
          transaction_id: transactionId,
          reason: orderStatus
        });
      }

      // Redirect back to React frontend with order information
      const frontendBaseUrl = 'http://localhost:3000'; // React frontend URL
      
      if (paymentStatus === 'success') {
        console.log(`🎯 Redirecting to frontend success page with Order ID: ${orderId}`);
        res.redirect(`${frontendBaseUrl}/#checkout-success?orderId=${orderId}&amount=${payment.amount}&transactionId=${transactionId}&paymentStatus=success`);
      } else {
        console.log(`❌ Redirecting to frontend failed page with Order ID: ${orderId}`);
        res.redirect(`${frontendBaseUrl}/#checkout-failed?orderId=${orderId}&amount=${payment.amount}&transactionId=${transactionId}&paymentStatus=failed&reason=${encodeURIComponent(orderStatus)}`);
      }

    } catch (error) {
      console.error('❌ ICICI Payment Callback Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process payment callback'
      });
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
      
      // Get total count
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

  private static encryptPaymentData(data: any): string {
    try {
      const workingKey = PaymentsController.iciciConfig.workingKey;
      const plainText = new URLSearchParams(data).toString();
      
      // Create a 16-byte key from working key (pad or truncate as needed)
      const key = Buffer.alloc(16);
      const workingKeyBuffer = Buffer.from(workingKey, 'utf8');
      workingKeyBuffer.copy(key, 0, 0, Math.min(16, workingKeyBuffer.length));
      
      // Generate random IV
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Prepend IV to encrypted data
      return iv.toString('hex') + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  private static decryptPaymentData(encryptedData: string): any {
    try {
      const workingKey = PaymentsController.iciciConfig.workingKey;
      
      // Create a 16-byte key from working key (pad or truncate as needed)
      const key = Buffer.alloc(16);
      const workingKeyBuffer = Buffer.from(workingKey, 'utf8');
      workingKeyBuffer.copy(key, 0, 0, Math.min(16, workingKeyBuffer.length));
      
      // Extract IV from the beginning of encrypted data (first 32 hex chars = 16 bytes)
      const iv = Buffer.from(encryptedData.substring(0, 32), 'hex');
      const encrypted = encryptedData.substring(32);
      
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Parse the decrypted response
      const params = new URLSearchParams(decrypted);
      const result: any = {};
      
      for (const [key, value] of params.entries()) {
        result[key] = value;
      }
      
      return result;
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }
}