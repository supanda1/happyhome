/**
 * Razorpay Payment Service
 * 
 * Frontend service implementing PaymentService interface for Razorpay integration.
 * Communicates with backend API for order creation and verification.
 */

import type {
  PaymentService,
  PaymentIntent,
  PaymentIntentResponse,
  CreatePaymentIntentRequest,
  ConfirmPaymentRequest,
  Refund,
  CreateRefundRequest,
  PaymentWebhookEvent,
  PaymentMethod,
  PaymentStatus,
} from '../../types/payment';
import type { RazorpaySuccessResponse } from '../../types/razorpay';
import { getPaymentConfig } from '../../config/payment.config';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

/**
 * Map Razorpay status to our PaymentStatus
 */
function mapRazorpayStatus(status: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    created: 'pending',
    attempted: 'processing',
    paid: 'succeeded',
    authorized: 'requires_action',
    captured: 'succeeded',
    refunded: 'refunded',
    failed: 'failed',
  };
  return statusMap[status] || 'pending';
}

/**
 * Razorpay Payment Service Implementation
 */
class RazorpayPaymentService implements PaymentService {
  private keyId: string;

  constructor() {
    const config = getPaymentConfig('razorpay');
    this.keyId = config.razorpay?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '';
  }

  /**
   * Create a payment intent (Razorpay Order)
   */
  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/razorpay/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency,
          orderId: request.orderId,
          customerId: request.customerId,
          customerEmail: request.customerEmail,
          customerPhone: request.customerPhone,
          notes: request.metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Razorpay order');
      }

      const data = await response.json();

      const paymentIntent: PaymentIntent = {
        id: data.data.id,
        amount: data.data.amount / 100, // Convert from paise to rupees
        currency: data.data.currency as 'INR',
        status: mapRazorpayStatus(data.data.status),
        provider: 'razorpay',
        orderId: request.orderId,
        createdAt: new Date(data.data.created_at * 1000),
        updatedAt: new Date(),
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        providerTransactionId: data.data.id,
        providerData: data.data,
      };

      return {
        paymentIntent,
        clientSecret: data.data.id, // Razorpay uses order_id as the "client secret"
      };
    } catch (error) {
      console.error('Razorpay createPaymentIntent error:', error);
      throw error;
    }
  }

  /**
   * Confirm payment after Razorpay Checkout success
   * This verifies the payment signature with the backend
   */
  async confirmPayment(request: ConfirmPaymentRequest): Promise<PaymentIntentResponse> {
    try {
      // Extract Razorpay response from the request's providerData
      const razorpayResponse = request.paymentMethod as unknown as RazorpaySuccessResponse;

      const response = await fetch(`${API_BASE_URL}/api/razorpay/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment verification failed');
      }

      const data = await response.json();

      const paymentIntent: PaymentIntent = {
        id: razorpayResponse.razorpay_order_id,
        amount: data.data.payment?.amount ? data.data.payment.amount / 100 : 0,
        currency: 'INR',
        status: data.data.verified ? 'succeeded' : 'failed',
        provider: 'razorpay',
        orderId: data.data.orderId || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        providerTransactionId: razorpayResponse.razorpay_payment_id,
        providerData: data.data,
      };

      return { paymentIntent };
    } catch (error) {
      console.error('Razorpay confirmPayment error:', error);
      throw error;
    }
  }

  /**
   * Get payment intent status
   */
  async getPaymentIntent(id: string): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/razorpay/payments/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get payment status');
      }

      const data = await response.json();

      return {
        id: data.data.id,
        amount: data.data.amount / 100,
        currency: data.data.currency as 'INR',
        status: mapRazorpayStatus(data.data.status),
        provider: 'razorpay',
        orderId: data.data.order_id || '',
        createdAt: new Date(data.data.created_at * 1000),
        updatedAt: new Date(),
        providerTransactionId: data.data.id,
        customerEmail: data.data.email,
        customerPhone: data.data.contact,
        paymentMethod: data.data.method as PaymentMethod,
        providerData: data.data,
      };
    } catch (error) {
      console.error('Razorpay getPaymentIntent error:', error);
      throw error;
    }
  }

  /**
   * Cancel payment intent
   * Note: Razorpay doesn't support canceling orders directly,
   * but we can mark it as cancelled in our system
   */
  async cancelPaymentIntent(id: string): Promise<PaymentIntent> {
    console.warn('Razorpay does not support order cancellation. Marking as cancelled locally.');
    
    return {
      id,
      amount: 0,
      currency: 'INR',
      status: 'cancelled',
      provider: 'razorpay',
      orderId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create a refund
   */
  async createRefund(request: CreateRefundRequest): Promise<Refund> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/razorpay/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentId: request.paymentIntentId,
          amount: request.amount ? request.amount * 100 : undefined, // Convert to paise
          notes: request.metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create refund');
      }

      const data = await response.json();

      return {
        id: data.data.id,
        paymentIntentId: data.data.payment_id,
        amount: data.data.amount / 100,
        currency: data.data.currency as 'INR',
        status: data.data.status === 'processed' ? 'succeeded' : 'pending',
        reason: request.reason,
        metadata: data.data.notes,
        createdAt: new Date(data.data.created_at * 1000),
      };
    } catch (error) {
      console.error('Razorpay createRefund error:', error);
      throw error;
    }
  }

  /**
   * Get refund status
   */
  async getRefund(id: string): Promise<Refund> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/razorpay/refunds/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get refund status');
      }

      const data = await response.json();

      return {
        id: data.data.id,
        paymentIntentId: data.data.payment_id,
        amount: data.data.amount / 100,
        currency: data.data.currency as 'INR',
        status: data.data.status === 'processed' ? 'succeeded' : 'pending',
        metadata: data.data.notes,
        createdAt: new Date(data.data.created_at * 1000),
      };
    } catch (error) {
      console.error('Razorpay getRefund error:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   * Note: This is handled server-side, frontend just validates the structure
   */
  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    console.warn('Webhook signature verification should be done server-side');
    return false;
  }

  /**
   * Handle webhook event
   * Note: Webhooks are processed server-side
   */
  async handleWebhook(_payload: string): Promise<PaymentWebhookEvent> {
    throw new Error('Webhook handling should be done server-side');
  }

  /**
   * Check if Razorpay is configured
   */
  isConfigured(): boolean {
    return Boolean(this.keyId && this.keyId !== 'rzp_test_...');
  }

  /**
   * Get supported payment methods for Razorpay
   */
  getSupportedPaymentMethods(): PaymentMethod[] {
    return ['card', 'upi', 'netbanking', 'wallet', 'emi'];
  }

  /**
   * Get the Razorpay Key ID for frontend checkout
   */
  getKeyId(): string {
    return this.keyId;
  }
}

// Export singleton instance
export const razorpayPaymentService = new RazorpayPaymentService();

export default razorpayPaymentService;
