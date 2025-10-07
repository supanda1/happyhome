/**
 * Payment Gateway Types and Interfaces
 * 
 * Designed to be compatible with major payment gateways like:
 * - Stripe
 * - Razorpay  
 * - PayPal
 * - Square
 * - Paytm
 */

// ========== Core Payment Types ==========

export type PaymentStatus = 
  | 'pending'           // Payment initiated
  | 'processing'        // Payment being processed
  | 'requires_action'   // Requires 3DS or OTP
  | 'succeeded'         // Payment successful
  | 'failed'            // Payment failed
  | 'cancelled'         // Payment cancelled
  | 'refunded'          // Payment refunded
  | 'partially_refunded'; // Partial refund

export type PaymentMethod = 
  | 'card'              // Credit/Debit cards
  | 'upi'               // UPI (India)
  | 'netbanking'        // Net banking
  | 'wallet'            // Digital wallets
  | 'emi'               // EMI options
  | 'cash_on_delivery'  // COD
  | 'bank_transfer';    // Direct bank transfer

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export type PaymentProvider = 
  | 'mock'              // Mock for testing
  | 'stripe'            // Stripe
  | 'razorpay'          // Razorpay (India)
  | 'paypal'            // PayPal
  | 'square'            // Square
  | 'paytm'             // Paytm (India)
  | 'phonepe'           // PhonePe (India)
  | 'gpay';             // Google Pay

// ========== Payment Intent Types ==========

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  provider: PaymentProvider;
  clientSecret?: string;          // For frontend SDK
  metadata?: Record<string, any>; // Custom data
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;              // Payment expiry
  
  // Customer info
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // Order info  
  orderId: string;
  description?: string;
  
  // Gateway specific
  providerTransactionId?: string;
  providerData?: Record<string, any>;
  
  // Failure info
  failureReason?: string;
  failureCode?: string;
}

// ========== Payment Method Details ==========

export interface CardPaymentMethod {
  type: 'card';
  card: {
    last4: string;
    brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'rupay' | 'maestro';
    expMonth: number;
    expYear: number;
    fingerprint?: string;
    country?: string;
  };
  billingDetails?: BillingDetails;
}

export interface UPIPaymentMethod {
  type: 'upi';
  upi: {
    vpa?: string;              // Virtual Payment Address
    flow: 'collect' | 'intent' | 'qr';
  };
}

export interface WalletPaymentMethod {
  type: 'wallet';
  wallet: {
    provider: 'paytm' | 'phonepe' | 'gpay' | 'amazonpay' | 'mobikwik' | 'freecharge';
    phone?: string;
  };
}

export interface NetBankingPaymentMethod {
  type: 'netbanking';
  netbanking: {
    bank: string;
    bankCode: string;
  };
}

export interface EMIPaymentMethod {
  type: 'emi';
  emi: {
    duration: number;          // months
    interestRate: number;      // %
    monthlyAmount: number;
    totalAmount: number;
    bank?: string;
  };
}

export type PaymentMethodDetails = 
  | CardPaymentMethod
  | UPIPaymentMethod 
  | WalletPaymentMethod
  | NetBankingPaymentMethod
  | EMIPaymentMethod;

// ========== Address and Billing ==========

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface BillingDetails {
  name?: string;
  email?: string;
  phone?: string;
  address?: Address;
}

// ========== Payment Configuration ==========

export interface PaymentConfig {
  provider: PaymentProvider;
  publicKey: string;
  secretKey: string;
  webhookSecret?: string;
  environment: 'sandbox' | 'production';
  currency: Currency;
  country: string;
  
  // Provider specific settings
  stripe?: {
    publishableKey: string;
    webhookEndpoint?: string;
  };
  
  razorpay?: {
    keyId: string;
    webhookSecret: string;
  };
  
  // Feature flags
  features: {
    saveCards: boolean;
    subscriptions: boolean;
    refunds: boolean;
    webhooks: boolean;
  };
}

// ========== Payment Requests ==========

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: Currency;
  orderId: string;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
  
  // Auto-confirm settings
  confirmationMethod?: 'automatic' | 'manual';
  
  // Return URLs for redirect flows
  returnUrl?: string;
  cancelUrl?: string;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
  paymentMethod: PaymentMethodDetails;
  billingDetails?: BillingDetails;
  savePaymentMethod?: boolean;
}

// ========== Payment Responses ==========

export interface PaymentIntentResponse {
  paymentIntent: PaymentIntent;
  clientSecret?: string;
  nextAction?: NextAction;
}

export interface NextAction {
  type: 'redirect_to_url' | 'use_3d_secure' | 'verify_with_otp' | 'display_qr_code';
  redirectUrl?: string;
  qrCodeData?: string;
  otpLength?: number;
}

// ========== Webhook Types ==========

export interface PaymentWebhookEvent {
  id: string;
  type: PaymentWebhookEventType;
  data: PaymentIntent;
  timestamp: Date;
  provider: PaymentProvider;
  signature?: string;
}

export type PaymentWebhookEventType = 
  | 'payment_intent.created'
  | 'payment_intent.processing'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.canceled'
  | 'refund.created'
  | 'refund.succeeded';

// ========== Refund Types ==========

export interface Refund {
  id: string;
  paymentIntentId: string;
  amount: number;
  currency: Currency;
  status: 'pending' | 'succeeded' | 'failed';
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CreateRefundRequest {
  paymentIntentId: string;
  amount?: number;              // Partial refund if less than total
  reason?: string;
  metadata?: Record<string, any>;
}

// ========== Error Types ==========

export interface PaymentError {
  code: string;
  type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error';
  message: string;
  param?: string;
  declineCode?: string;
}

// ========== Service Interface ==========

export interface PaymentService {
  // Core payment operations
  createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResponse>;
  confirmPayment(request: ConfirmPaymentRequest): Promise<PaymentIntentResponse>;
  getPaymentIntent(id: string): Promise<PaymentIntent>;
  cancelPaymentIntent(id: string): Promise<PaymentIntent>;
  
  // Refund operations
  createRefund(request: CreateRefundRequest): Promise<Refund>;
  getRefund(id: string): Promise<Refund>;
  
  // Webhook handling
  verifyWebhookSignature(payload: string, signature: string): boolean;
  handleWebhook(payload: string): Promise<PaymentWebhookEvent>;
  
  // Utility methods
  isConfigured(): boolean;
  getSupportedPaymentMethods(): PaymentMethod[];
}

// ========== Payment Context Types ==========

export interface PaymentContextState {
  currentPayment: PaymentIntent | null;
  isProcessing: boolean;
  error: PaymentError | null;
  config: PaymentConfig | null;
}

export interface PaymentContextActions {
  initializePayment: (request: CreatePaymentIntentRequest) => Promise<PaymentIntentResponse>;
  confirmPayment: (request: ConfirmPaymentRequest) => Promise<PaymentIntentResponse>;
  cancelPayment: (paymentId: string) => Promise<void>;
  clearError: () => void;
  resetPayment: () => void;
}

export type PaymentContextType = PaymentContextState & PaymentContextActions;

// ========== Component Props ==========

export interface PaymentFormProps {
  amount: number;
  currency: Currency;
  orderId: string;
  onSuccess: (payment: PaymentIntent) => void;
  onError: (error: PaymentError) => void;
  onCancel?: () => void;
  
  // Customization
  allowedMethods?: PaymentMethod[];
  showSavedCards?: boolean;
  collectBilling?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

export interface PaymentMethodSelectorProps {
  availableMethods: PaymentMethod[];
  selectedMethod: PaymentMethod | null;
  onMethodSelect: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export interface PaymentStatusProps {
  payment: PaymentIntent;
  showDetails?: boolean;
  onRetry?: () => void;
  onGoBack?: () => void;
}