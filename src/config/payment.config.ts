/**
 * Payment Gateway Configuration
 * 
 * Centralized configuration for all payment providers.
 * Easy switching between mock and real gateways.
 */

import type { PaymentConfig, PaymentProvider, PaymentMethod } from '../types/payment';

// ========== Environment Variables ==========

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue;
  if (!value && !defaultValue) {
    console.warn(`Missing environment variable: ${key}`);
  }
  return value || '';
};

// ========== Payment Provider Configurations ==========

export const PAYMENT_PROVIDERS: Record<PaymentProvider, PaymentConfig> = {
  // Mock Gateway (for development/testing)
  mock: {
    provider: 'mock',
    publicKey: 'pk_mock_test_key',
    secretKey: 'sk_mock_test_key',
    webhookSecret: 'whsec_mock_webhook_secret',
    environment: 'sandbox',
    currency: 'INR',
    country: 'IN',
    features: {
      saveCards: true,
      subscriptions: true,
      refunds: true,
      webhooks: true,
    },
  },

  // Stripe Configuration
  stripe: {
    provider: 'stripe',
    publicKey: getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_...'),
    secretKey: getEnvVar('STRIPE_SECRET_KEY', 'sk_test_...'),
    webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET'),
    environment: (getEnvVar('VITE_STRIPE_ENVIRONMENT', 'sandbox') as 'sandbox' | 'production'),
    currency: 'INR',
    country: 'IN',
    stripe: {
      publishableKey: getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_...'),
      webhookEndpoint: getEnvVar('STRIPE_WEBHOOK_ENDPOINT', '/api/webhooks/stripe'),
    },
    features: {
      saveCards: true,
      subscriptions: true,
      refunds: true,
      webhooks: true,
    },
  },

  // Razorpay Configuration (Popular in India)
  razorpay: {
    provider: 'razorpay',
    publicKey: getEnvVar('VITE_RAZORPAY_KEY_ID', 'rzp_test_...'),
    secretKey: getEnvVar('RAZORPAY_KEY_SECRET', 'rzp_test_secret_...'),
    webhookSecret: getEnvVar('RAZORPAY_WEBHOOK_SECRET'),
    environment: (getEnvVar('VITE_RAZORPAY_ENVIRONMENT', 'sandbox') as 'sandbox' | 'production'),
    currency: 'INR',
    country: 'IN',
    razorpay: {
      keyId: getEnvVar('VITE_RAZORPAY_KEY_ID', 'rzp_test_...'),
      webhookSecret: getEnvVar('RAZORPAY_WEBHOOK_SECRET', ''),
    },
    features: {
      saveCards: true,
      subscriptions: true,
      refunds: true,
      webhooks: true,
    },
  },

  // PayPal Configuration
  paypal: {
    provider: 'paypal',
    publicKey: getEnvVar('VITE_PAYPAL_CLIENT_ID', 'paypal_client_id'),
    secretKey: getEnvVar('PAYPAL_CLIENT_SECRET', 'paypal_client_secret'),
    environment: (getEnvVar('VITE_PAYPAL_ENVIRONMENT', 'sandbox') as 'sandbox' | 'production'),
    currency: 'USD',
    country: 'US',
    features: {
      saveCards: false,
      subscriptions: true,
      refunds: true,
      webhooks: true,
    },
  },

  // Square Configuration  
  square: {
    provider: 'square',
    publicKey: getEnvVar('VITE_SQUARE_APPLICATION_ID', 'square_app_id'),
    secretKey: getEnvVar('SQUARE_ACCESS_TOKEN', 'square_access_token'),
    environment: (getEnvVar('VITE_SQUARE_ENVIRONMENT', 'sandbox') as 'sandbox' | 'production'),
    currency: 'USD',
    country: 'US',
    features: {
      saveCards: true,
      subscriptions: false,
      refunds: true,
      webhooks: true,
    },
  },

  // Paytm Configuration (India)
  paytm: {
    provider: 'paytm',
    publicKey: getEnvVar('VITE_PAYTM_MERCHANT_ID', 'paytm_merchant_id'),
    secretKey: getEnvVar('PAYTM_MERCHANT_KEY', 'paytm_merchant_key'),
    environment: (getEnvVar('VITE_PAYTM_ENVIRONMENT', 'sandbox') as 'sandbox' | 'production'),
    currency: 'INR',
    country: 'IN',
    features: {
      saveCards: false,
      subscriptions: false,
      refunds: true,
      webhooks: true,
    },
  },

  // PhonePe Configuration (India)
  phonepe: {
    provider: 'phonepe',
    publicKey: getEnvVar('VITE_PHONEPE_MERCHANT_ID', 'phonepe_merchant_id'),
    secretKey: getEnvVar('PHONEPE_SALT_KEY', 'phonepe_salt_key'),
    environment: (getEnvVar('VITE_PHONEPE_ENVIRONMENT', 'sandbox') as 'sandbox' | 'production'),
    currency: 'INR',
    country: 'IN',
    features: {
      saveCards: false,
      subscriptions: false,
      refunds: true,
      webhooks: true,
    },
  },

  // Google Pay Configuration
  gpay: {
    provider: 'gpay',
    publicKey: getEnvVar('VITE_GPAY_GATEWAY_MERCHANT_ID', 'gpay_merchant_id'),
    secretKey: getEnvVar('GPAY_MERCHANT_PRIVATE_KEY', 'gpay_private_key'),
    environment: (getEnvVar('VITE_GPAY_ENVIRONMENT', 'sandbox') as 'sandbox' | 'production'),
    currency: 'INR',
    country: 'IN',
    features: {
      saveCards: false,
      subscriptions: false,
      refunds: false,
      webhooks: false,
    },
  },
};

// ========== Current Provider Configuration ==========

// Default to mock for development, but can be overridden via environment
const DEFAULT_PROVIDER: PaymentProvider = (getEnvVar('VITE_PAYMENT_PROVIDER', 'mock') as PaymentProvider);

export const CURRENT_PAYMENT_CONFIG: PaymentConfig = PAYMENT_PROVIDERS[DEFAULT_PROVIDER];

// ========== Supported Payment Methods by Provider ==========

export const SUPPORTED_PAYMENT_METHODS: Record<PaymentProvider, PaymentMethod[]> = {
  mock: ['card', 'upi', 'netbanking', 'wallet', 'emi', 'cash_on_delivery'],
  
  stripe: ['card'], // Stripe primarily handles cards
  
  razorpay: ['card', 'upi', 'netbanking', 'wallet', 'emi'], // Full Indian payment ecosystem
  
  paypal: ['card', 'bank_transfer'], // PayPal methods
  
  square: ['card'], // Square primarily handles cards
  
  paytm: ['card', 'upi', 'netbanking', 'wallet'], // Paytm ecosystem
  
  phonepe: ['upi', 'card', 'wallet'], // PhonePe methods
  
  gpay: ['upi', 'card'], // Google Pay methods
};

// ========== Utility Functions ==========

export const getCurrentPaymentProvider = (): PaymentProvider => {
  return CURRENT_PAYMENT_CONFIG.provider;
};

export const getPaymentConfig = (provider?: PaymentProvider): PaymentConfig => {
  return provider ? PAYMENT_PROVIDERS[provider] : CURRENT_PAYMENT_CONFIG;
};

export const getSupportedMethods = (provider?: PaymentProvider): PaymentMethod[] => {
  const currentProvider = provider || getCurrentPaymentProvider();
  return SUPPORTED_PAYMENT_METHODS[currentProvider] || [];
};

export const isPaymentMethodSupported = (method: PaymentMethod, provider?: PaymentProvider): boolean => {
  const supportedMethods = getSupportedMethods(provider);
  return supportedMethods.includes(method);
};

export const isFeatureEnabled = (feature: keyof PaymentConfig['features'], provider?: PaymentProvider): boolean => {
  const config = getPaymentConfig(provider);
  return config.features[feature];
};

export const getWebhookEndpoint = (provider?: PaymentProvider): string => {
  const currentProvider = provider || getCurrentPaymentProvider();
  
  const endpoints = {
    mock: '/api/webhooks/mock',
    stripe: '/api/webhooks/stripe',
    razorpay: '/api/webhooks/razorpay', 
    paypal: '/api/webhooks/paypal',
    square: '/api/webhooks/square',
    paytm: '/api/webhooks/paytm',
    phonepe: '/api/webhooks/phonepe',
    gpay: '/api/webhooks/gpay',
  };
  
  return endpoints[currentProvider];
};

// ========== Environment Validation ==========

export const validatePaymentConfig = (config: PaymentConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!config.publicKey || config.publicKey.includes('...')) {
    errors.push(`Missing or invalid public key for ${config.provider}`);
  }
  
  if (!config.secretKey || config.secretKey.includes('...')) {
    errors.push(`Missing or invalid secret key for ${config.provider}`);
  }
  
  if (config.features.webhooks && !config.webhookSecret) {
    errors.push(`Webhook secret required for ${config.provider} with webhooks enabled`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getCurrentConfigValidation = () => {
  return validatePaymentConfig(CURRENT_PAYMENT_CONFIG);
};

// ========== Development/Testing Utilities ==========

export const MOCK_CARD_NUMBERS = {
  visa_success: '4242424242424242',
  visa_decline: '4000000000000002',
  visa_insufficient_funds: '4000000000009995',
  visa_lost_card: '4000000000009987',
  visa_stolen_card: '4000000000009979',
  mastercard_success: '5555555555554444',
  amex_success: '378282246310005',
  rupay_success: '6076595000000008',
  // 3D Secure cards for testing
  visa_3d_secure: '4000000000003220',
  mastercard_3d_secure: '5200828282828210',
};

export const MOCK_UPI_IDS = {
  success: 'success@upi',
  failure: 'failure@upi',
  timeout: 'timeout@upi',
};

// ========== Provider-Specific Configurations ==========

export const getProviderSpecificConfig = (provider: PaymentProvider) => {
  const config = getPaymentConfig(provider);
  
  switch (provider) {
    case 'stripe':
      return {
        publishableKey: config.stripe?.publishableKey,
        apiVersion: '2023-10-16',
        locale: 'en',
      };
      
    case 'razorpay':
      return {
        key: config.razorpay?.keyId,
        currency: config.currency,
        name: 'Happy Homes Services',
        description: 'Payment for household services',
        theme: { color: '#3399cc' },
      };
      
    case 'paypal':
      return {
        clientId: config.publicKey,
        currency: config.currency,
        intent: 'capture',
        vault: config.features.saveCards,
      };
      
    default:
      return {};
  }
};

// Export current configuration for easy access
export default CURRENT_PAYMENT_CONFIG;