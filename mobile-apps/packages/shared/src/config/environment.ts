export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export interface EnvironmentConfig {
  environment: Environment;
  api_base_url: string;
  api_timeout: number;
  websocket_url?: string;
  
  // Feature flags
  features: {
    biometric_auth: boolean;
    push_notifications: boolean;
    analytics: boolean;
    crash_reporting: boolean;
    debug_mode: boolean;
    offline_mode: boolean;
  };

  // Third-party service configs
  services: {
    analytics?: {
      google_analytics_id?: string;
      firebase_analytics: boolean;
    };
    maps?: {
      google_maps_api_key?: string;
    };
    payment?: {
      razorpay_key?: string;
      icici_key?: string;
    };
    notifications?: {
      firebase_config?: Record<string, any>;
    };
  };

  // Security configs
  security: {
    token_storage_key: string;
    biometric_storage_key: string;
    encryption_key: string;
    certificate_pinning: boolean;
  };

  // Performance configs
  performance: {
    image_cache_size: number;
    api_cache_duration: number;
    retry_attempts: number;
    request_timeout: number;
  };
}

// Default configuration
export const defaultConfig: EnvironmentConfig = {
  environment: Environment.DEVELOPMENT,
  api_base_url: 'http://localhost:3000/api',
  api_timeout: 30000,
  
  features: {
    biometric_auth: true,
    push_notifications: true,
    analytics: false,
    crash_reporting: false,
    debug_mode: true,
    offline_mode: false,
  },

  services: {
    analytics: {
      firebase_analytics: false,
    },
    notifications: {},
  },

  security: {
    token_storage_key: 'household_auth_tokens',
    biometric_storage_key: 'household_biometric_key',
    encryption_key: 'household_encryption_key',
    certificate_pinning: false,
  },

  performance: {
    image_cache_size: 100 * 1024 * 1024, // 100MB
    api_cache_duration: 5 * 60 * 1000, // 5 minutes
    retry_attempts: 3,
    request_timeout: 30000, // 30 seconds
  },
};

// Configuration for different environments
export const configurations: Record<Environment, Partial<EnvironmentConfig>> = {
  [Environment.DEVELOPMENT]: {
    api_base_url: 'http://localhost:3000/api',
    features: {
      biometric_auth: true,
      push_notifications: false,
      analytics: false,
      crash_reporting: false,
      debug_mode: true,
      offline_mode: false,
    },
    security: {
      certificate_pinning: false,
    },
  },

  [Environment.STAGING]: {
    api_base_url: 'https://staging-api.householdservices.com/api',
    features: {
      biometric_auth: true,
      push_notifications: true,
      analytics: true,
      crash_reporting: true,
      debug_mode: false,
      offline_mode: false,
    },
    security: {
      certificate_pinning: true,
    },
  },

  [Environment.PRODUCTION]: {
    api_base_url: 'https://api.householdservices.com/api',
    features: {
      biometric_auth: true,
      push_notifications: true,
      analytics: true,
      crash_reporting: true,
      debug_mode: false,
      offline_mode: true,
    },
    security: {
      certificate_pinning: true,
    },
    performance: {
      image_cache_size: 200 * 1024 * 1024, // 200MB
      api_cache_duration: 10 * 60 * 1000, // 10 minutes
    },
  },
};

let currentConfig: EnvironmentConfig = defaultConfig;

export const getConfig = (): EnvironmentConfig => currentConfig;

export const setEnvironment = (env: Environment): void => {
  const envConfig = configurations[env];
  currentConfig = {
    ...defaultConfig,
    ...envConfig,
    environment: env,
  };
};

// Initialize with development environment by default
setEnvironment(Environment.DEVELOPMENT);