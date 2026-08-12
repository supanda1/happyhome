/**
 * Razorpay Webhook Handler
 * 
 * CRITICAL: Webhooks provide reliable payment status updates
 * - Always validate signature before processing
 * - Return 200 immediately, process async
 * - Handle idempotency to prevent duplicate processing
 * 
 * Events handled:
 * - payment.captured - Payment successful
 * - payment.failed - Payment failed
 * - refund.created - Refund initiated
 * - refund.failed - Refund failed
 * - payment.dispute.created - Chargeback initiated
 */

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../config/database';

const router = express.Router();

/**
 * Validate Razorpay webhook signature
 * Uses timing-safe comparison to prevent timing attacks
 */
function validateWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/**
 * Check if webhook event was already processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT id FROM webhook_events WHERE event_id = $1',
      [eventId]
    );
    return result.rows.length > 0;
  } catch {
    // Table might not exist, return false to allow processing
    return false;
  }
}

/**
 * Mark event as processed
 */
async function markEventProcessed(eventId: string, eventType: string): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO webhook_events (id, event_id, event_type, processed_at) 
       VALUES (gen_random_uuid(), $1, $2, NOW())
       ON CONFLICT (event_id) DO NOTHING`,
      [eventId, eventType]
    );
  } catch (error) {
    console.error('Error marking event as processed:', error);
  }
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payload: any): Promise<void> {
  const payment = payload.payment?.entity;
  if (!payment) return;

  const razorpayOrderId = payment.order_id;
  const razorpayPaymentId = payment.id;

  console.log('💰 Webhook: Payment Captured', {
    payment_id: razorpayPaymentId,
    order_id: razorpayOrderId,
    amount: payment.amount / 100,
    method: payment.method,
  });

  // Update payment record
  await pool.query(
    `UPDATE payments 
     SET razorpay_payment_id = $1,
         payment_status = 'success',
         payment_method = $2,
         completed_at = NOW(),
         updated_at = NOW()
     WHERE razorpay_order_id = $3`,
    [razorpayPaymentId, payment.method, razorpayOrderId]
  );

  // Get our internal order ID
  const paymentResult = await pool.query(
    'SELECT order_id FROM payments WHERE razorpay_order_id = $1',
    [razorpayOrderId]
  );

  if (paymentResult.rows.length > 0) {
    const orderId = paymentResult.rows[0].order_id;

    // Update order as paid
    await pool.query(
      `UPDATE orders 
       SET is_paid = true, 
           payment_status = 'paid',
           payment_method = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [payment.method || 'razorpay', orderId]
    );

    console.log('✅ Webhook: Order marked as paid', { order_id: orderId });
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payload: any): Promise<void> {
  const payment = payload.payment?.entity;
  if (!payment) return;

  const razorpayOrderId = payment.order_id;
  const razorpayPaymentId = payment.id;

  console.error('❌ Webhook: Payment Failed', {
    payment_id: razorpayPaymentId,
    order_id: razorpayOrderId,
    error_code: payment.error_code,
    error_description: payment.error_description,
  });

  // Update payment record
  await pool.query(
    `UPDATE payments 
     SET razorpay_payment_id = $1,
         payment_status = 'failed',
         failure_reason = $2,
         updated_at = NOW()
     WHERE razorpay_order_id = $3`,
    [razorpayPaymentId, payment.error_description || 'Payment failed', razorpayOrderId]
  );
}

/**
 * Handle refund.created event
 */
async function handleRefundCreated(payload: any): Promise<void> {
  const refund = payload.refund?.entity;
  if (!refund) return;

  console.log('💸 Webhook: Refund Created', {
    refund_id: refund.id,
    payment_id: refund.payment_id,
    amount: refund.amount / 100,
    status: refund.status,
  });

  // Update payment record with refund info
  const isFullRefund = refund.amount === refund.payment?.amount;
  
  await pool.query(
    `UPDATE payments 
     SET payment_status = $1,
         refund_id = $2,
         refund_amount = $3,
         refund_status = $4,
         updated_at = NOW()
     WHERE razorpay_payment_id = $5`,
    [
      isFullRefund ? 'refunded' : 'partially_refunded',
      refund.id,
      refund.amount / 100,
      refund.status,
      refund.payment_id,
    ]
  );
}

/**
 * Handle refund.failed event
 */
async function handleRefundFailed(payload: any): Promise<void> {
  const refund = payload.refund?.entity;
  if (!refund) return;

  console.error('🚨 Webhook: Refund Failed - Manual intervention required', {
    refund_id: refund.id,
    payment_id: refund.payment_id,
    amount: refund.amount / 100,
  });

  // Update refund status
  await pool.query(
    `UPDATE payments 
     SET refund_status = 'failed',
         updated_at = NOW()
     WHERE razorpay_payment_id = $1`,
    [refund.payment_id]
  );

  // TODO: Send alert to admin/ops team
}

/**
 * Handle payment.dispute.created event
 */
async function handleDisputeCreated(payload: any): Promise<void> {
  const dispute = payload.dispute?.entity;
  if (!dispute) return;

  console.error('⚠️ Webhook: Dispute Created - Respond within 7 days', {
    dispute_id: dispute.id,
    payment_id: dispute.payment_id,
    amount: dispute.amount / 100,
    reason_code: dispute.reason_code,
  });

  // Get order info
  const paymentResult = await pool.query(
    'SELECT order_id FROM payments WHERE razorpay_payment_id = $1',
    [dispute.payment_id]
  );

  if (paymentResult.rows.length > 0) {
    const orderId = paymentResult.rows[0].order_id;

    // Update order status
    await pool.query(
      `UPDATE orders 
       SET payment_status = 'disputed',
           updated_at = NOW()
       WHERE id = $1`,
      [orderId]
    );
  }

  // TODO: Send urgent alert to admin team
}

/**
 * Main webhook endpoint
 * CRITICAL: Use express.raw() to preserve raw body for signature verification
 */
router.post(
  '/razorpay',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'] as string;

    // Get raw body as string
    const rawBody = req.body.toString();

    console.log('🔔 Razorpay Webhook Received:', {
      timestamp: new Date().toISOString(),
      has_signature: !!signature,
      content_length: rawBody.length,
    });

    // Validate signature if webhook secret is configured
    if (webhookSecret && signature) {
      const isValid = validateWebhookSignature(rawBody, signature, webhookSecret);

      if (!isValid) {
        console.error('🚨 SECURITY: Invalid webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } else if (process.env.NODE_ENV === 'production') {
      // In production, require signature validation
      console.error('🚨 SECURITY: Missing webhook signature in production');
      return res.status(400).json({ error: 'Signature required' });
    }

    // Parse event
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      console.error('Invalid JSON in webhook payload');
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    const eventId = event.id || `${event.event}_${Date.now()}`;
    const eventType = event.event;

    // Check for replay attack (events older than 5 minutes)
    const eventAge = Math.floor(Date.now() / 1000) - (event.created_at || 0);
    if (eventAge > 300) {
      console.warn('⚠️ Stale webhook ignored', { eventId, ageSeconds: eventAge });
      return res.status(200).json({ status: 'ignored_stale' });
    }

    // CRITICAL: Return 200 immediately (Razorpay expects response within 5 seconds)
    res.status(200).json({ received: true });

    // Check idempotency
    if (await isEventProcessed(eventId)) {
      console.log('♻️ Webhook already processed:', eventId);
      return;
    }

    // Process event asynchronously
    try {
      console.log('📥 Processing webhook event:', {
        event_id: eventId,
        event_type: eventType,
      });

      switch (eventType) {
        case 'payment.captured':
          await handlePaymentCaptured(event.payload);
          break;

        case 'payment.failed':
          await handlePaymentFailed(event.payload);
          break;

        case 'refund.created':
          await handleRefundCreated(event.payload);
          break;

        case 'refund.failed':
          await handleRefundFailed(event.payload);
          break;

        case 'payment.dispute.created':
          await handleDisputeCreated(event.payload);
          break;

        default:
          console.log('ℹ️ Unhandled webhook event:', eventType);
      }

      // Mark event as processed
      await markEventProcessed(eventId, eventType);

      console.log('✅ Webhook processed successfully:', eventId);
    } catch (error) {
      console.error('❌ Webhook processing error:', {
        event_id: eventId,
        error: error instanceof Error ? error.message : error,
      });
      // Don't throw - we already sent 200 response
    }
  }
);

export default router;
