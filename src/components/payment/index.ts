/**
 * Payment Components Barrel Export
 * 
 * Centralized exports for all payment-related components.
 */

// Core payment components
export { PaymentForm } from './PaymentForm';
export { PaymentMethodSelector } from './PaymentMethodSelector';
export { PaymentStatus } from './PaymentStatus';

// Payment method forms
export {
  CardPaymentForm,
  UPIPaymentForm,
  WalletPaymentForm,
  NetBankingPaymentForm,
  CashOnDeliveryForm,
} from './PaymentMethodForms';

// Integration components
export { CheckoutPayment } from './CheckoutPayment';

// Re-export payment context and hooks
export { usePayment, usePaymentReady, usePaymentStatus } from '../../contexts/PaymentContext';

// Re-export payment service factory
export { getPaymentService, paymentService } from '../../services/payment/paymentServiceFactory';

// Re-export payment configuration
export {
  getCurrentPaymentProvider,
  getPaymentConfig,
  getSupportedMethods,
  isPaymentMethodSupported,
  isFeatureEnabled,
} from '../../config/payment.config';