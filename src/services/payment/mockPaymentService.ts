/**
 * Mock Payment Service Implementation
 * 
 * Simulates real payment gateway behavior for development and testing.
 * Follows the same patterns as real gateways for easy replacement.
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
  PaymentError,
  PaymentStatus,
  PaymentMethod,
  NextAction,
} from '../../types/payment';

import { CURRENT_PAYMENT_CONFIG, MOCK_CARD_NUMBERS, MOCK_UPI_IDS } from '../../config/payment.config';

export class MockPaymentService implements PaymentService {
  private paymentIntents: Map<string, PaymentIntent> = new Map();
  private refunds: Map<string, Refund> = new Map();

  // ========== Core Payment Operations ==========

  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    // Simulate API delay
    await this.delay(500, 1500);

    const paymentIntent: PaymentIntent = {
      id: this.generateId('pi_'),
      amount: request.amount,
      currency: request.currency,
      status: 'pending',
      provider: 'mock',
      clientSecret: this.generateId('pi_') + '_secret_' + this.generateSecret(),
      metadata: request.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      
      // Customer info
      customerId: request.customerId,
      customerEmail: request.customerEmail,
      customerPhone: request.customerPhone,
      
      // Order info
      orderId: request.orderId,
      description: request.description,
      
      // Gateway specific
      providerTransactionId: this.generateId('mock_txn_'),
      providerData: {
        merchantId: 'mock_merchant_123',
        terminalId: 'mock_terminal_456',
      },
    };

    this.paymentIntents.set(paymentIntent.id, paymentIntent);

    console.log('🔄 Mock Payment Created:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

    return {
      paymentIntent,
      clientSecret: paymentIntent.clientSecret,
    };
  }

  async confirmPayment(request: ConfirmPaymentRequest): Promise<PaymentIntentResponse> {
    // Simulate processing delay
    await this.delay(1000, 3000);

    const paymentIntent = this.paymentIntents.get(request.paymentIntentId);
    if (!paymentIntent) {
      throw this.createError('payment_intent_not_found', 'Payment intent not found');
    }

    // Update payment method
    paymentIntent.paymentMethod = request.paymentMethod.type;
    paymentIntent.updatedAt = new Date();

    // Simulate different outcomes based on payment method
    const outcome = this.simulatePaymentOutcome(request.paymentMethod);
    
    paymentIntent.status = outcome.status;
    if ('failureReason' in outcome) {
      paymentIntent.failureReason = outcome.failureReason as string;
    }
    if ('failureCode' in outcome) {
      paymentIntent.failureCode = outcome.failureCode as string;
    }

    let nextAction: NextAction | undefined;

    // Handle different payment flows
    switch (outcome.status) {
      case 'processing':
        console.log('⏳ Mock Payment Processing...');
        // Simulate async completion after delay
        setTimeout(() => {
          this.completePayment(paymentIntent.id, 'succeeded');
        }, 3000);
        break;

      case 'requires_action':
        console.log('🔐 Mock Payment Requires Action (3DS/OTP)');
        if ('nextAction' in outcome) {
          nextAction = outcome.nextAction as NextAction;
        }
        // Simulate successful completion after action
        setTimeout(() => {
          this.completePayment(paymentIntent.id, 'succeeded');
        }, 5000);
        break;

      case 'succeeded':
        console.log('✅ Mock Payment Successful!');
        break;

      case 'failed':
        console.log('❌ Mock Payment Failed:', ('failureReason' in outcome) ? outcome.failureReason : 'Unknown error');
        break;
    }

    this.paymentIntents.set(paymentIntent.id, paymentIntent);

    return {
      paymentIntent,
      nextAction,
    };
  }

  async getPaymentIntent(id: string): Promise<PaymentIntent> {
    await this.delay(200, 500);
    
    const paymentIntent = this.paymentIntents.get(id);
    if (!paymentIntent) {
      throw this.createError('payment_intent_not_found', 'Payment intent not found');
    }
    
    return paymentIntent;
  }

  async cancelPaymentIntent(id: string): Promise<PaymentIntent> {
    await this.delay(300, 700);
    
    const paymentIntent = this.paymentIntents.get(id);
    if (!paymentIntent) {
      throw this.createError('payment_intent_not_found', 'Payment intent not found');
    }

    if (paymentIntent.status === 'succeeded') {
      throw this.createError('payment_intent_not_cancelable', 'Cannot cancel succeeded payment');
    }

    paymentIntent.status = 'cancelled';
    paymentIntent.updatedAt = new Date();
    
    this.paymentIntents.set(id, paymentIntent);
    
    console.log('🚫 Mock Payment Cancelled:', id);
    
    return paymentIntent;
  }

  // ========== Refund Operations ==========

  async createRefund(request: CreateRefundRequest): Promise<Refund> {
    await this.delay(800, 1500);
    
    const paymentIntent = this.paymentIntents.get(request.paymentIntentId);
    if (!paymentIntent) {
      throw this.createError('payment_intent_not_found', 'Payment intent not found');
    }

    if (paymentIntent.status !== 'succeeded') {
      throw this.createError('payment_not_refundable', 'Payment not in refundable state');
    }

    const refundAmount = request.amount || paymentIntent.amount;
    
    if (refundAmount > paymentIntent.amount) {
      throw this.createError('invalid_refund_amount', 'Refund amount exceeds payment amount');
    }

    const refund: Refund = {
      id: this.generateId('re_'),
      paymentIntentId: request.paymentIntentId,
      amount: refundAmount,
      currency: paymentIntent.currency,
      status: 'pending',
      reason: request.reason,
      metadata: request.metadata,
      createdAt: new Date(),
    };

    this.refunds.set(refund.id, refund);

    // Simulate refund processing
    setTimeout(() => {
      refund.status = 'succeeded';
      this.refunds.set(refund.id, refund);
      
      // Update payment intent status
      if (refundAmount === paymentIntent.amount) {
        paymentIntent.status = 'refunded';
      } else {
        paymentIntent.status = 'partially_refunded';
      }
      paymentIntent.updatedAt = new Date();
      this.paymentIntents.set(paymentIntent.id, paymentIntent);
      
      console.log('💰 Mock Refund Processed:', refund.id, `₹${refund.amount}`);
    }, 2000);

    console.log('🔄 Mock Refund Created:', refund.id);
    
    return refund;
  }

  async getRefund(id: string): Promise<Refund> {
    await this.delay(200, 400);
    
    const refund = this.refunds.get(id);
    if (!refund) {
      throw this.createError('refund_not_found', 'Refund not found');
    }
    
    return refund;
  }

  // ========== Webhook Operations ==========

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Mock signature verification
    // In real implementation, this would verify the HMAC signature
    const expectedSignature = `mock_signature_${payload.length}`;
    return signature === expectedSignature;
  }

  async handleWebhook(payload: string): Promise<PaymentWebhookEvent> {
    const webhookData = JSON.parse(payload);
    
    return {
      id: this.generateId('evt_'),
      type: webhookData.type,
      data: webhookData.data,
      timestamp: new Date(),
      provider: 'mock',
      signature: `mock_signature_${payload.length}`,
    };
  }

  // ========== Utility Methods ==========

  isConfigured(): boolean {
    return CURRENT_PAYMENT_CONFIG.provider === 'mock';
  }

  getSupportedPaymentMethods(): PaymentMethod[] {
    return ['card', 'upi', 'netbanking', 'wallet', 'emi', 'cash_on_delivery'];
  }

  // ========== Private Helper Methods ==========

  private simulatePaymentOutcome(paymentMethod: any) {
    const { type } = paymentMethod;

    switch (type) {
      case 'card':
        return this.simulateCardPayment(paymentMethod.card);
      case 'upi':
        return this.simulateUPIPayment(paymentMethod.upi);
      case 'wallet':
        return this.simulateWalletPayment(paymentMethod.wallet);
      case 'netbanking':
        return this.simulateNetBankingPayment();
      case 'emi':
        return this.simulateEMIPayment();
      default:
        return { status: 'succeeded' as PaymentStatus };
    }
  }

  private simulateCardPayment(card: any) {
    const cardNumber = card.number || '4242424242424242';

    // Test specific card behaviors
    if (cardNumber === MOCK_CARD_NUMBERS.visa_decline) {
      return {
        status: 'failed' as PaymentStatus,
        failureReason: 'Your card was declined.',
        failureCode: 'card_declined',
      };
    }

    if (cardNumber === MOCK_CARD_NUMBERS.visa_insufficient_funds) {
      return {
        status: 'failed' as PaymentStatus,
        failureReason: 'Your card has insufficient funds.',
        failureCode: 'insufficient_funds',
      };
    }

    if (cardNumber === MOCK_CARD_NUMBERS.visa_3d_secure) {
      return {
        status: 'requires_action' as PaymentStatus,
        nextAction: {
          type: 'use_3d_secure' as const,
          redirectUrl: 'https://mock-3ds.example.com/authenticate',
        },
      };
    }

    // Random failures for realism (5% failure rate)
    if (Math.random() < 0.05) {
      const failures = [
        { reason: 'Card expired', code: 'expired_card' },
        { reason: 'Invalid CVC', code: 'invalid_cvc' },
        { reason: 'Processing error', code: 'processing_error' },
      ];
      const failure = failures[Math.floor(Math.random() * failures.length)];
      
      return {
        status: 'failed' as PaymentStatus,
        failureReason: failure.reason,
        failureCode: failure.code,
      };
    }

    return { status: 'succeeded' as PaymentStatus };
  }

  private simulateUPIPayment(upi: any) {
    const vpa = upi.vpa;

    if (vpa === MOCK_UPI_IDS.failure) {
      return {
        status: 'failed' as PaymentStatus,
        failureReason: 'UPI transaction failed',
        failureCode: 'upi_declined',
      };
    }

    if (vpa === MOCK_UPI_IDS.timeout) {
      return {
        status: 'requires_action' as PaymentStatus,
        nextAction: {
          type: 'verify_with_otp' as const,
          otpLength: 6,
        },
      };
    }

    // UPI usually requires some form of authentication
    return {
      status: 'processing' as PaymentStatus,
    };
  }

  private simulateWalletPayment(wallet: any) {
    // Wallet payments usually redirect to wallet app
    return {
      status: 'requires_action' as PaymentStatus,
      nextAction: {
        type: 'redirect_to_url' as const,
        redirectUrl: `https://mock-${wallet.provider}.com/pay?amount=1000`,
      },
    };
  }

  private simulateNetBankingPayment() {
    // Net banking usually redirects to bank
    return {
      status: 'requires_action' as PaymentStatus,
      nextAction: {
        type: 'redirect_to_url' as const,
        redirectUrl: 'https://mock-netbanking.bank.com/login',
      },
    };
  }

  private simulateEMIPayment() {
    // EMI payments usually succeed but take longer
    return {
      status: 'processing' as PaymentStatus,
    };
  }

  private completePayment(paymentId: string, status: PaymentStatus) {
    const paymentIntent = this.paymentIntents.get(paymentId);
    if (paymentIntent) {
      paymentIntent.status = status;
      paymentIntent.updatedAt = new Date();
      this.paymentIntents.set(paymentId, paymentIntent);
      
      console.log(`✨ Mock Payment ${status}:`, paymentId);
    }
  }

  private generateId(prefix: string): string {
    return prefix + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateSecret(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private async delay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private createError(code: string, message: string): PaymentError {
    return {
      code,
      type: 'api_error',
      message,
    };
  }

  // ========== Development/Testing Utilities ==========

  // Clear all stored data (useful for testing)
  clearAllData(): void {
    this.paymentIntents.clear();
    this.refunds.clear();
    console.log('🧹 Mock payment data cleared');
  }

  // Get all stored payments (useful for debugging)
  getAllPayments(): PaymentIntent[] {
    return Array.from(this.paymentIntents.values());
  }

  // Get all refunds (useful for debugging)
  getAllRefunds(): Refund[] {
    return Array.from(this.refunds.values());
  }

  // Force payment status (useful for testing)
  forcePaymentStatus(paymentId: string, status: PaymentStatus): void {
    const payment = this.paymentIntents.get(paymentId);
    if (payment) {
      payment.status = status;
      payment.updatedAt = new Date();
      this.paymentIntents.set(paymentId, payment);
      console.log(`🔧 Force updated payment ${paymentId} to ${status}`);
    }
  }
}

// Export singleton instance
export const mockPaymentService = new MockPaymentService();