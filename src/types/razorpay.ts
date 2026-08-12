/**
 * Razorpay Checkout TypeScript Definitions
 * 
 * Types for Razorpay Checkout.js SDK integration
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
 */

// ========== Razorpay Checkout Options ==========

export interface RazorpayOptions {
  /** Razorpay Key ID (public key) */
  key: string;
  
  /** Amount in smallest currency unit (paise for INR) */
  amount: number;
  
  /** Currency code (e.g., 'INR') */
  currency: string;
  
  /** Your business/company name */
  name: string;
  
  /** Description of the purchase */
  description?: string;
  
  /** Order ID created via Razorpay Orders API */
  order_id: string;
  
  /** URL of your logo */
  image?: string;
  
  /** Prefill customer information */
  prefill?: RazorpayPrefill;
  
  /** Additional notes (key-value pairs) */
  notes?: Record<string, string>;
  
  /** Theme customization */
  theme?: RazorpayTheme;
  
  /** Modal behavior options */
  modal?: RazorpayModal;
  
  /** Callback URL for redirect flow */
  callback_url?: string;
  
  /** URL to redirect on payment dismissal */
  redirect?: boolean;
  
  /** Handler for successful payment */
  handler?: (response: RazorpaySuccessResponse) => void;
  
  /** Customer ID for saved cards */
  customer_id?: string;
  
  /** Remember customer for future payments */
  remember_customer?: boolean;
  
  /** Timeout in seconds (default: 180) */
  timeout?: number;
  
  /** Restrict payment methods */
  method?: RazorpayMethodConfig;
  
  /** Recurring payment config */
  recurring?: boolean;
  
  /** Subscription ID for recurring */
  subscription_id?: string;
}

// ========== Prefill Options ==========

export interface RazorpayPrefill {
  /** Customer name */
  name?: string;
  
  /** Customer email */
  email?: string;
  
  /** Customer phone (10 digits for India) */
  contact?: string;
  
  /** Pre-select payment method */
  method?: 'card' | 'netbanking' | 'wallet' | 'emi' | 'upi';
  
  /** Pre-fill VPA for UPI */
  vpa?: string;
  
  /** Pre-fill bank for netbanking */
  bank?: string;
}

// ========== Theme Options ==========

export interface RazorpayTheme {
  /** Primary color (hex) */
  color?: string;
  
  /** Backdrop color (hex with alpha) */
  backdrop_color?: string;
  
  /** Hide top bar */
  hide_topbar?: boolean;
}

// ========== Modal Options ==========

export interface RazorpayModal {
  /** Confirm before closing */
  confirm_close?: boolean;
  
  /** Callback when modal is dismissed */
  ondismiss?: () => void;
  
  /** Animation (slide/fade) */
  animation?: boolean;
  
  /** Allow escape key to close */
  escape?: boolean;
  
  /** Callback on payment failure */
  onerror?: (error: RazorpayError) => void;
}

// ========== Method Configuration ==========

export interface RazorpayMethodConfig {
  /** Enable/disable netbanking */
  netbanking?: boolean | RazorpayNetbankingConfig;
  
  /** Enable/disable cards */
  card?: boolean | RazorpayCardConfig;
  
  /** Enable/disable UPI */
  upi?: boolean | RazorpayUPIConfig;
  
  /** Enable/disable wallets */
  wallet?: boolean | RazorpayWalletConfig;
  
  /** Enable/disable EMI */
  emi?: boolean;
  
  /** Enable/disable Pay Later */
  paylater?: boolean;
}

export interface RazorpayNetbankingConfig {
  /** List of allowed bank codes */
  banks?: string[];
}

export interface RazorpayCardConfig {
  /** Enable credit cards */
  credit?: boolean;
  
  /** Enable debit cards */
  debit?: boolean;
  
  /** Enable prepaid cards */
  prepaid?: boolean;
  
  /** Enable EMI on cards */
  emi?: boolean;
}

export interface RazorpayUPIConfig {
  /** Enable UPI QR */
  flow?: 'collect' | 'intent' | 'qr';
}

export interface RazorpayWalletConfig {
  /** List of allowed wallets */
  wallets?: ('paytm' | 'phonepe' | 'amazonpay' | 'mobikwik' | 'freecharge' | 'airtelmoney' | 'jiomoney')[];
}

// ========== Response Types ==========

export interface RazorpaySuccessResponse {
  /** Razorpay Payment ID */
  razorpay_payment_id: string;
  
  /** Razorpay Order ID */
  razorpay_order_id: string;
  
  /** Signature for verification */
  razorpay_signature: string;
}

export interface RazorpayError {
  /** Error code */
  code: string;
  
  /** Error description */
  description: string;
  
  /** Error source */
  source: string;
  
  /** Error step */
  step: string;
  
  /** Error reason */
  reason: string;
  
  /** Additional metadata */
  metadata?: {
    order_id?: string;
    payment_id?: string;
  };
}

// ========== Razorpay Instance ==========

export interface RazorpayInstance {
  /** Open the checkout modal */
  open(): void;
  
  /** Close the checkout modal */
  close(): void;
  
  /** Subscribe to events */
  on(event: string, callback: (response: unknown) => void): void;
}

// ========== Razorpay Constructor ==========

export interface RazorpayCheckout {
  new (options: RazorpayOptions): RazorpayInstance;
}

// ========== Window Global ==========

declare global {
  interface Window {
    Razorpay: RazorpayCheckout;
  }
}

// ========== API Response Types ==========

export interface RazorpayOrderResponse {
  id: string;
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPaymentResponse {
  id: string;
  entity: 'payment';
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  customer_id: string | null;
  notes: Record<string, string>;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  acquirer_data: {
    auth_code?: string;
    rrn?: string;
    upi_transaction_id?: string;
  };
  created_at: number;
}

export interface RazorpayRefundResponse {
  id: string;
  entity: 'refund';
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, string>;
  receipt: string | null;
  acquirer_data: {
    arn?: string;
  };
  created_at: number;
  status: 'pending' | 'processed' | 'failed';
  speed_requested: 'normal' | 'optimum';
  speed_processed: 'normal' | 'optimum';
}

// ========== Webhook Event Types ==========

export interface RazorpayWebhookEvent {
  entity: 'event';
  account_id: string;
  event: RazorpayWebhookEventType;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayPaymentResponse;
    };
    order?: {
      entity: RazorpayOrderResponse;
    };
    refund?: {
      entity: RazorpayRefundResponse;
    };
  };
  created_at: number;
}

export type RazorpayWebhookEventType =
  | 'payment.authorized'
  | 'payment.captured'
  | 'payment.failed'
  | 'payment.pending'
  | 'order.paid'
  | 'refund.created'
  | 'refund.processed'
  | 'refund.failed';

export default RazorpayOptions;
