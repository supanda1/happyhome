/**
 * Payment Webhook Handlers
 * 
 * Handles webhook events from payment providers to update payment status.
 * Compatible with real payment gateway webhook patterns.
 */

import type {
  PaymentWebhookEvent,
  PaymentWebhookEventType,
  PaymentIntent,
  PaymentProvider,
} from '../types/payment';

import { getPaymentService } from '../services/payment/paymentServiceFactory';
import { getCurrentPaymentProvider } from '../config/payment.config';

// ========== Webhook Event Handlers ==========

export class PaymentWebhookHandler {
  private static instance: PaymentWebhookHandler | null = null;
  private eventHandlers: Map<PaymentWebhookEventType, Array<(event: PaymentWebhookEvent) => Promise<void>>> = new Map();

  static getInstance(): PaymentWebhookHandler {
    if (!PaymentWebhookHandler.instance) {
      PaymentWebhookHandler.instance = new PaymentWebhookHandler();
    }
    return PaymentWebhookHandler.instance;
  }

  // ========== Event Registration ==========

  /**
   * Register a handler for specific webhook event types
   */
  on(eventType: PaymentWebhookEventType, handler: (event: PaymentWebhookEvent) => Promise<void>): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove all handlers for an event type
   */
  off(eventType: PaymentWebhookEventType): void {
    this.eventHandlers.delete(eventType);
  }

  // ========== Webhook Processing ==========

  /**
   * Process incoming webhook payload
   */
  async processWebhook(
    payload: string,
    signature: string,
    provider?: PaymentProvider
  ): Promise<PaymentWebhookEvent> {
    const currentProvider = provider || getCurrentPaymentProvider();
    const paymentService = getPaymentService();

    // Verify webhook signature
    const isValidSignature = paymentService.verifyWebhookSignature(payload, signature);
    if (!isValidSignature) {
      throw new Error('Invalid webhook signature');
    }

    // Handle webhook event
    const event = await paymentService.handleWebhook(payload);
    
    console.log('📨 Processing webhook event:', {
      id: event.id,
      type: event.type,
      provider: event.provider,
      paymentId: event.data.id,
    });

    // Emit to registered handlers
    await this.emitEvent(event);

    return event;
  }

  /**
   * Emit event to all registered handlers
   */
  private async emitEvent(event: PaymentWebhookEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) || [];
    
    // Execute all handlers in parallel
    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Webhook handler error for ${event.type}:`, error);
      }
    });

    await Promise.all(promises);
  }
}

// ========== Default Event Handlers ==========

/**
 * Default handler for payment success events
 */
export const handlePaymentSuccess = async (event: PaymentWebhookEvent): Promise<void> => {
  const payment = event.data;
  
  console.log('✅ Payment successful webhook:', {
    paymentId: payment.id,
    amount: payment.amount,
    orderId: payment.orderId,
  });

  // Update order status in database
  try {
    // This would typically update your order status
    // await ordersAPI.updatePaymentStatus(payment.orderId, {
    //   status: 'paid',
    //   paymentId: payment.id,
    //   paidAt: new Date(),
    // });

    // Send confirmation email/SMS
    // await notificationService.sendPaymentConfirmation(payment);

    // Update inventory or trigger fulfillment
    // await fulfillmentService.processOrder(payment.orderId);

    console.log('💫 Payment success processing completed');
  } catch (error) {
    console.error('Error processing payment success:', error);
  }
};

/**
 * Default handler for payment failure events
 */
export const handlePaymentFailure = async (event: PaymentWebhookEvent): Promise<void> => {
  const payment = event.data;
  
  console.log('❌ Payment failed webhook:', {
    paymentId: payment.id,
    orderId: payment.orderId,
    reason: payment.failureReason,
  });

  try {
    // Update order status
    // await ordersAPI.updatePaymentStatus(payment.orderId, {
    //   status: 'payment_failed',
    //   paymentId: payment.id,
    //   failureReason: payment.failureReason,
    // });

    // Send failure notification
    // await notificationService.sendPaymentFailureNotification(payment);

    console.log('💫 Payment failure processing completed');
  } catch (error) {
    console.error('Error processing payment failure:', error);
  }
};

/**
 * Default handler for refund events
 */
export const handleRefundCreated = async (event: PaymentWebhookEvent): Promise<void> => {
  const payment = event.data;
  
  console.log('💰 Refund created webhook:', {
    paymentId: payment.id,
    orderId: payment.orderId,
  });

  try {
    // Update order status to refunded
    // await ordersAPI.updatePaymentStatus(payment.orderId, {
    //   status: 'refunded',
    //   refundedAt: new Date(),
    // });

    // Send refund notification
    // await notificationService.sendRefundNotification(payment);

    console.log('💫 Refund processing completed');
  } catch (error) {
    console.error('Error processing refund:', error);
  }
};

// ========== Webhook Router for Express.js Backend ==========

/**
 * Express.js webhook route handler
 * Usage: app.post('/api/webhooks/payment', handlePaymentWebhookRoute);
 */
export const handlePaymentWebhookRoute = async (req: any, res: any) => {
  try {
    const signature = req.headers['x-webhook-signature'] || req.headers['stripe-signature'] || '';
    const payload = JSON.stringify(req.body);
    
    const webhookHandler = PaymentWebhookHandler.getInstance();
    const event = await webhookHandler.processWebhook(payload, signature);
    
    res.status(200).json({
      success: true,
      eventId: event.id,
      processed: true,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed',
    });
  }
};

// ========== Setup Default Handlers ==========

/**
 * Initialize default webhook event handlers
 */
export const initializeWebhookHandlers = (): void => {
  const handler = PaymentWebhookHandler.getInstance();
  
  // Register default handlers
  handler.on('payment_intent.succeeded', handlePaymentSuccess);
  handler.on('payment_intent.payment_failed', handlePaymentFailure);
  handler.on('refund.created', handleRefundCreated);
  
  console.log('🔗 Payment webhook handlers initialized');
};

// ========== Real-time Payment Status Updates ==========

/**
 * Service to track payment status in real-time
 */
export class PaymentStatusTracker {
  private static instance: PaymentStatusTracker | null = null;
  private activePayments: Map<string, NodeJS.Timeout> = new Map();
  private statusCallbacks: Map<string, Array<(payment: PaymentIntent) => void>> = new Map();

  static getInstance(): PaymentStatusTracker {
    if (!PaymentStatusTracker.instance) {
      PaymentStatusTracker.instance = new PaymentStatusTracker();
    }
    return PaymentStatusTracker.instance;
  }

  /**
   * Start tracking a payment
   */
  startTracking(paymentId: string, callback: (payment: PaymentIntent) => void): void {
    // Register callback
    if (!this.statusCallbacks.has(paymentId)) {
      this.statusCallbacks.set(paymentId, []);
    }
    this.statusCallbacks.get(paymentId)!.push(callback);

    // Start polling if not already tracking
    if (!this.activePayments.has(paymentId)) {
      const intervalId = setInterval(async () => {
        await this.checkPaymentStatus(paymentId);
      }, 2000); // Poll every 2 seconds

      this.activePayments.set(paymentId, intervalId);

      // Auto-cleanup after 10 minutes
      setTimeout(() => {
        this.stopTracking(paymentId);
      }, 10 * 60 * 1000);
    }
  }

  /**
   * Stop tracking a payment
   */
  stopTracking(paymentId: string): void {
    const intervalId = this.activePayments.get(paymentId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activePayments.delete(paymentId);
    }
    
    this.statusCallbacks.delete(paymentId);
    console.log('🛑 Stopped tracking payment:', paymentId);
  }

  /**
   * Check payment status and notify callbacks
   */
  private async checkPaymentStatus(paymentId: string): Promise<void> {
    try {
      const paymentService = getPaymentService();
      const payment = await paymentService.getPaymentIntent(paymentId);
      
      // If payment is in final state, stop tracking
      if (['succeeded', 'failed', 'cancelled'].includes(payment.status)) {
        const callbacks = this.statusCallbacks.get(paymentId) || [];
        callbacks.forEach(callback => callback(payment));
        this.stopTracking(paymentId);
        return;
      }

      // Notify callbacks of status update
      const callbacks = this.statusCallbacks.get(paymentId) || [];
      callbacks.forEach(callback => callback(payment));
      
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  }

  /**
   * Get all currently tracked payments
   */
  getActivePayments(): string[] {
    return Array.from(this.activePayments.keys());
  }

  /**
   * Stop tracking all payments
   */
  stopAll(): void {
    this.activePayments.forEach((intervalId, paymentId) => {
      clearInterval(intervalId);
    });
    this.activePayments.clear();
    this.statusCallbacks.clear();
    console.log('🛑 Stopped tracking all payments');
  }
}

// ========== Utility Functions ==========

/**
 * Generate webhook signature for testing
 */
export const generateMockWebhookSignature = (payload: string): string => {
  return `mock_signature_${payload.length}`;
};

/**
 * Create mock webhook event for testing
 */
export const createMockWebhookEvent = (
  type: PaymentWebhookEventType,
  paymentData: Partial<PaymentIntent>
): PaymentWebhookEvent => {
  return {
    id: `evt_${Date.now()}`,
    type,
    data: {
      id: 'pi_test',
      amount: 1000,
      currency: 'INR',
      status: 'succeeded',
      provider: 'mock',
      orderId: 'test_order',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...paymentData,
    } as PaymentIntent,
    timestamp: new Date(),
    provider: 'mock',
    signature: generateMockWebhookSignature('test'),
  };
};

// ========== Export Instances ==========

export const webhookHandler = PaymentWebhookHandler.getInstance();
export const paymentTracker = PaymentStatusTracker.getInstance();

// Initialize default handlers
initializeWebhookHandlers();