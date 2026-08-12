/**
 * Payment Service Factory
 * 
 * Factory pattern to create appropriate payment service based on configuration.
 * Enables easy switching between mock and real payment gateways.
 */

import type { PaymentService, PaymentProvider } from '../../types/payment';
import { getCurrentPaymentProvider, getPaymentConfig } from '../../config/payment.config';

import { mockPaymentService } from './mockPaymentService';
import { backendPaymentService } from './backendPaymentService';
import { razorpayPaymentService } from './razorpayPaymentService';

/**
 * Create payment service instance based on provider
 */
export function createPaymentService(provider?: PaymentProvider): PaymentService {
  const currentProvider = provider || getCurrentPaymentProvider();
  const config = getPaymentConfig(currentProvider);

  console.log(`🏭 Creating payment service for provider: ${currentProvider}`);

  switch (currentProvider) {
    case 'backend':
      return backendPaymentService;

    case 'mock':
      return mockPaymentService;

    case 'stripe':
      // TODO: Implement Stripe service
      // return new StripePaymentService(config);
      console.warn('⚠️ Stripe service not implemented yet, falling back to mock');
      return mockPaymentService;

    case 'razorpay':
      return razorpayPaymentService;

    case 'paypal':
      // TODO: Implement PayPal service
      // return new PayPalPaymentService(config);
      console.warn('⚠️ PayPal service not implemented yet, falling back to mock');
      return mockPaymentService;

    case 'square':
      // TODO: Implement Square service
      console.warn('⚠️ Square service not implemented yet, falling back to mock');
      return mockPaymentService;

    case 'paytm':
      // TODO: Implement Paytm service
      console.warn('⚠️ Paytm service not implemented yet, falling back to mock');
      return mockPaymentService;

    case 'phonepe':
      // TODO: Implement PhonePe service
      console.warn('⚠️ PhonePe service not implemented yet, falling back to mock');
      return mockPaymentService;

    case 'gpay':
      // TODO: Implement Google Pay service
      console.warn('⚠️ Google Pay service not implemented yet, falling back to mock');
      return mockPaymentService;

    default:
      console.error(`❌ Unknown payment provider: ${currentProvider}, falling back to mock`);
      return mockPaymentService;
  }
}

// Singleton instance of current payment service
let paymentServiceInstance: PaymentService | null = null;

/**
 * Get singleton payment service instance
 */
export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    paymentServiceInstance = createPaymentService();
  }
  return paymentServiceInstance;
}

/**
 * Reset payment service instance (useful for testing or config changes)
 */
export function resetPaymentService(): void {
  paymentServiceInstance = null;
  console.log('🔄 Payment service instance reset');
}

/**
 * Switch to a different payment provider
 */
export function switchPaymentProvider(provider: PaymentProvider): PaymentService {
  console.log(`🔄 Switching payment provider to: ${provider}`);
  paymentServiceInstance = createPaymentService(provider);
  return paymentServiceInstance;
}

// Export current service for convenience
export const paymentService = getPaymentService();