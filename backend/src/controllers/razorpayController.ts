/**
 * Razorpay Payment Controller
 * 
 * Production-grade implementation for:
 * - Order creation
 * - Payment verification with signature validation
 * - Payment status checking
 * - Refund processing
 * 
 * Security: All sensitive operations use HMAC-SHA256 signature validation
 */

import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import pool from '../config/database';

// Lazy-initialized Razorpay instance (prevents crash on startup if keys missing)
let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (razorpayInstance) {
    return razorpayInstance;
  }
  
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured. RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required.');
  }
  
  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  
  return razorpayInstance;
}

// Alias for backward compatibility in this file
const getRazorpay = getRazorpayInstance;

// Types
interface CreateOrderRequest {
  order_id: string; // Our internal order ID
  amount: number; // Amount in rupees (will be converted to paise)
  currency?: string;
  notes?: Record<string, string>;
}

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: string; // Our internal order ID
}

interface RefundRequest {
  payment_id: string;
  amount?: number; // Partial refund amount in rupees (optional, full refund if not provided)
  reason?: string;
}

export class RazorpayController {
  
  /**
   * Get Razorpay configuration for frontend
   * Returns public key only (never expose secret)
   */
  static async getConfig(req: Request, res: Response) {
    try {
      const keyId = process.env.RAZORPAY_KEY_ID;
      
      if (!keyId) {
        return res.status(500).json({
          success: false,
          error: 'Razorpay is not configured. Please contact support.',
        });
      }

      res.json({
        success: true,
        config: {
          key_id: keyId,
          currency: 'INR',
          name: 'Happy Homes Services',
          description: 'Household Services Payment',
          image: '/logo.png',
          theme: {
            color: '#6366f1', // Indigo color matching the app theme
          },
        },
      });
    } catch (error) {
      console.error('Error getting Razorpay config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment configuration',
      });
    }
  }

  /**
   * Create Razorpay Order
   * This must be called before initiating payment on frontend
   */
  static async createOrder(req: Request, res: Response) {
    try {
      const { order_id, amount, currency = 'INR', notes = {} }: CreateOrderRequest = req.body;
      const userId = req.user?.userId;

      console.log('🚀 Razorpay Order Creation Request:', {
        order_id,
        amount,
        currency,
        userId,
        timestamp: new Date().toISOString(),
      });

      // Validation
      if (!order_id) {
        return res.status(400).json({
          success: false,
          error: 'Order ID is required',
        });
      }

      if (!amount || amount < 1) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be at least ₹1',
        });
      }

      // Verify order exists and belongs to user
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
          error: 'Order not found',
        });
      }

      const order = orderResult.rows[0];

      // Verify order belongs to authenticated user
      if (order.customer_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to pay for this order',
        });
      }

      // Check if order is already paid
      if (order.is_paid) {
        return res.status(400).json({
          success: false,
          error: 'This order has already been paid',
        });
      }

      // Check for existing Razorpay order that's not expired
      const existingRazorpayOrderQuery = `
        SELECT razorpay_order_id FROM payments 
        WHERE order_id = $1 
          AND payment_status IN ('created', 'pending') 
          AND created_at > NOW() - INTERVAL '30 minutes'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const existingResult = await pool.query(existingRazorpayOrderQuery, [order_id]);

      if (existingResult.rows.length > 0) {
        // Return existing order instead of creating new one
        const existingRazorpayOrderId = existingResult.rows[0].razorpay_order_id;
        
        try {
          const existingOrder = await getRazorpay().orders.fetch(existingRazorpayOrderId);
          
          if (existingOrder.status === 'created') {
            console.log('♻️ Returning existing Razorpay order:', existingRazorpayOrderId);
            return res.json({
              success: true,
              razorpay_order_id: existingOrder.id,
              amount: existingOrder.amount,
              currency: existingOrder.currency,
              order_id: order_id,
              customer: {
                name: `${order.first_name} ${order.last_name}`,
                email: order.email,
                phone: order.phone,
              },
            });
          }
        } catch {
          // Existing order not found or expired, create new one
          console.log('⚠️ Existing Razorpay order not valid, creating new one');
        }
      }

      // Create Razorpay order
      // Amount must be in paise (1 INR = 100 paise)
      const amountInPaise = Math.round(amount * 100);
      const receipt = `order_${order_id.slice(-8)}_${Date.now()}`;

      const razorpayOrder = await getRazorpay().orders.create({
        amount: amountInPaise,
        currency,
        receipt,
        notes: {
          order_id: order_id,
          customer_id: userId || '',
          customer_name: `${order.first_name} ${order.last_name}`,
          customer_email: order.email,
          ...notes,
        },
      }) as { id: string; amount: number; currency: string; receipt: string };

      // Save payment record to database
      const insertPaymentQuery = `
        INSERT INTO payments (
          id, order_id, razorpay_order_id, amount, currency,
          payment_status, customer_name, customer_email, customer_phone,
          gateway_name, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 'created',
          $5, $6, $7, 'razorpay', NOW(), NOW()
        ) RETURNING id
      `;

      await pool.query(insertPaymentQuery, [
        order_id,
        razorpayOrder.id,
        amount,
        currency,
        `${order.first_name} ${order.last_name}`,
        order.email,
        order.phone,
      ]);

      console.log('✅ Razorpay Order Created:', {
        razorpay_order_id: razorpayOrder.id,
        amount: amountInPaise,
        currency,
        receipt: razorpayOrder.receipt,
      });

      res.json({
        success: true,
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: order_id,
        customer: {
          name: `${order.first_name} ${order.last_name}`,
          email: order.email,
          phone: order.phone,
        },
      });

    } catch (error) {
      console.error('❌ Razorpay Order Creation Error:', error);
      
      // Handle specific Razorpay errors
      if (error instanceof Error) {
        if (error.message.includes('key_id')) {
          return res.status(500).json({
            success: false,
            error: 'Payment gateway configuration error. Please contact support.',
          });
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create payment order. Please try again.',
      });
    }
  }

  /**
   * Verify Payment Signature
   * CRITICAL: This validates that the payment was actually made through Razorpay
   * Uses timing-safe comparison to prevent timing attacks
   */
  static async verifyPayment(req: Request, res: Response) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        order_id,
      }: VerifyPaymentRequest = req.body;

      console.log('🔐 Payment Verification Request:', {
        razorpay_order_id,
        razorpay_payment_id,
        order_id,
        timestamp: new Date().toISOString(),
      });

      // Validate required fields
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing payment verification fields',
        });
      }

      // SECURITY: Retrieve order_id from our database, not from client
      // This prevents spoofing attacks
      const paymentQuery = `
        SELECT p.*, o.customer_id, o.final_amount, o.is_paid
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        WHERE p.razorpay_order_id = $1
      `;
      const paymentResult = await pool.query(paymentQuery, [razorpay_order_id]);

      if (paymentResult.rows.length === 0) {
        console.error('🚨 SECURITY: Payment record not found for Razorpay order:', razorpay_order_id);
        return res.status(400).json({
          success: false,
          error: 'Payment record not found',
        });
      }

      const paymentRecord = paymentResult.rows[0];

      // Check if already verified
      if (paymentRecord.payment_status === 'success') {
        return res.json({
          success: true,
          message: 'Payment already verified',
          order_id: paymentRecord.order_id,
          payment_id: razorpay_payment_id,
        });
      }

      // Generate signature for verification
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keySecret) {
        console.error('🚨 CRITICAL: RAZORPAY_KEY_SECRET not configured');
        return res.status(500).json({
          success: false,
          error: 'Payment verification configuration error',
        });
      }

      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');

      // SECURITY: Use timing-safe comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpay_signature)
      );

      if (!isValid) {
        console.error('🚨 SECURITY ALERT: Signature mismatch!', {
          razorpay_order_id,
          razorpay_payment_id,
          timestamp: new Date().toISOString(),
        });

        // Update payment status to failed
        await pool.query(
          `UPDATE payments SET payment_status = 'failed', failure_reason = 'Signature verification failed', updated_at = NOW() WHERE razorpay_order_id = $1`,
          [razorpay_order_id]
        );

        return res.status(400).json({
          success: false,
          error: 'Payment verification failed. Please contact support if money was deducted.',
        });
      }

      // Fetch payment details from Razorpay to confirm status
      const razorpayPayment = await getRazorpay().payments.fetch(razorpay_payment_id) as {
        status: string;
        method: string;
        amount: number;
      };

      if (razorpayPayment.status !== 'captured') {
        console.warn('⚠️ Payment not captured yet:', {
          payment_id: razorpay_payment_id,
          status: razorpayPayment.status,
        });

        // For authorized but not captured payments
        if (razorpayPayment.status === 'authorized') {
          return res.status(202).json({
            success: true,
            message: 'Payment authorized, awaiting capture',
            status: razorpayPayment.status,
          });
        }

        return res.status(400).json({
          success: false,
          error: `Payment is in ${razorpayPayment.status} state`,
        });
      }

      // Update payment record
      await pool.query(
        `UPDATE payments 
         SET razorpay_payment_id = $1, 
             razorpay_signature = $2, 
             payment_status = 'success',
             payment_method = $3,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE razorpay_order_id = $4`,
        [
          razorpay_payment_id,
          razorpay_signature,
          razorpayPayment.method || 'unknown',
          razorpay_order_id,
        ]
      );

      // Update order as paid
      await pool.query(
        `UPDATE orders 
         SET is_paid = true, 
             payment_status = 'paid',
             payment_method = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [razorpayPayment.method || 'razorpay', paymentRecord.order_id]
      );

      console.log('✅ Payment Verified Successfully:', {
        order_id: paymentRecord.order_id,
        razorpay_order_id,
        razorpay_payment_id,
        method: razorpayPayment.method,
        amount: razorpayPayment.amount / 100,
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        order_id: paymentRecord.order_id,
        payment_id: razorpay_payment_id,
        method: razorpayPayment.method,
        amount: razorpayPayment.amount / 100,
      });

    } catch (error) {
      console.error('❌ Payment Verification Error:', error);
      res.status(500).json({
        success: false,
        error: 'Payment verification failed. Please contact support.',
      });
    }
  }

  /**
   * Get Payment Status
   * Fetch current status of a payment from Razorpay
   */
  static async getPaymentStatus(req: Request, res: Response) {
    try {
      const { payment_id } = req.params;

      if (!payment_id) {
        return res.status(400).json({
          success: false,
          error: 'Payment ID is required',
        });
      }

      // Fetch from Razorpay
      const payment = await getRazorpay().payments.fetch(payment_id) as {
        id: string;
        order_id: string;
        status: string;
        method: string;
        amount: number;
        currency: string;
        email: string;
        contact: string;
        created_at: number;
        captured: boolean;
        error_code: string | null;
        error_description: string | null;
      };

      res.json({
        success: true,
        payment: {
          id: payment.id,
          order_id: payment.order_id,
          status: payment.status,
          method: payment.method,
          amount: payment.amount / 100, // Convert to rupees
          currency: payment.currency,
          email: payment.email,
          contact: payment.contact,
          created_at: payment.created_at,
          captured: payment.captured,
          error_code: payment.error_code,
          error_description: payment.error_description,
        },
      });

    } catch (error) {
      console.error('Error fetching payment status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment status',
      });
    }
  }

  /**
   * Create Refund
   * Process full or partial refund for a payment
   */
  static async createRefund(req: Request, res: Response) {
    try {
      const { payment_id, amount, reason = 'customer_request' }: RefundRequest = req.body;

      console.log('💰 Refund Request:', {
        payment_id,
        amount,
        reason,
        timestamp: new Date().toISOString(),
      });

      if (!payment_id) {
        return res.status(400).json({
          success: false,
          error: 'Payment ID is required',
        });
      }

      // Fetch payment to verify it can be refunded
      const payment = await getRazorpay().payments.fetch(payment_id) as {
        status: string;
        amount: number;
      };

      if (payment.status !== 'captured') {
        return res.status(400).json({
          success: false,
          error: `Cannot refund payment in ${payment.status} state`,
        });
      }

      // Calculate refund amount (in paise)
      const refundAmountPaise = amount 
        ? Math.round(amount * 100) 
        : payment.amount; // Full refund if amount not specified

      // Create refund
      const refund = await getRazorpay().payments.refund(payment_id, {
        amount: refundAmountPaise,
        speed: 'normal', // 'normal' or 'optimum' (instant)
        receipt: `refund_${payment_id}_${Date.now()}`,
        notes: {
          reason: reason || 'customer_request',
          initiated_at: new Date().toISOString(),
          initiated_by: req.user?.userId || 'system',
        },
      }) as {
        id: string;
        payment_id: string;
        amount: number;
        currency: string;
        status: string;
        speed_requested: string;
      };

      // Update payment record
      await pool.query(
        `UPDATE payments 
         SET payment_status = CASE 
           WHEN $1 = amount * 100 THEN 'refunded'
           ELSE 'partially_refunded'
         END,
         refund_id = $2,
         refund_amount = $3,
         refund_status = $4,
         updated_at = NOW()
         WHERE razorpay_payment_id = $5`,
        [
          refundAmountPaise,
          refund.id,
          refundAmountPaise / 100,
          refund.status,
          payment_id,
        ]
      );

      console.log('✅ Refund Created:', {
        refund_id: refund.id,
        payment_id,
        amount: refundAmountPaise / 100,
        status: refund.status,
      });

      res.json({
        success: true,
        refund: {
          id: refund.id,
          payment_id: refund.payment_id,
          amount: refund.amount / 100,
          currency: refund.currency,
          status: refund.status,
          speed_requested: refund.speed_requested,
        },
        message: `Refund of ₹${refundAmountPaise / 100} initiated successfully`,
      });

    } catch (error) {
      console.error('❌ Refund Error:', error);
      
      if (error instanceof Error && error.message.includes('already been fully refunded')) {
        return res.status(400).json({
          success: false,
          error: 'This payment has already been refunded',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Refund processing failed. Please try again.',
      });
    }
  }

  /**
   * Get Refund Status
   */
  static async getRefundStatus(req: Request, res: Response) {
    try {
      const { refund_id } = req.params;

      if (!refund_id) {
        return res.status(400).json({
          success: false,
          error: 'Refund ID is required',
        });
      }

      const refund = await getRazorpay().refunds.fetch(refund_id) as {
        id: string;
        payment_id: string;
        amount: number;
        currency: string;
        status: string;
        speed_requested: string;
        speed_processed: string;
        created_at: number;
      };

      res.json({
        success: true,
        refund: {
          id: refund.id,
          payment_id: refund.payment_id,
          amount: refund.amount / 100,
          currency: refund.currency,
          status: refund.status,
          speed_requested: refund.speed_requested,
          speed_processed: refund.speed_processed,
          created_at: refund.created_at,
        },
      });

    } catch (error) {
      console.error('Error fetching refund status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch refund status',
      });
    }
  }

  /**
   * Get available payment methods
   */
  static async getPaymentMethods(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        methods: [
          {
            id: 'card',
            name: 'Credit / Debit Card',
            description: 'Visa, MasterCard, RuPay, American Express',
            icon: 'credit-card',
            enabled: true,
          },
          {
            id: 'upi',
            name: 'UPI',
            description: 'Google Pay, PhonePe, Paytm, BHIM',
            icon: 'smartphone',
            enabled: true,
          },
          {
            id: 'netbanking',
            name: 'Net Banking',
            description: 'All major banks supported',
            icon: 'building',
            enabled: true,
          },
          {
            id: 'wallet',
            name: 'Wallets',
            description: 'Paytm, MobiKwik, Amazon Pay',
            icon: 'wallet',
            enabled: true,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment methods',
      });
    }
  }
}

export default RazorpayController;
