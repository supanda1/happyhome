/**
 * Application configuration
 */

export interface AppConfig {
  apiBaseUrl: string;
  apiTimeout: number;
  appName: string;
  environment: string;
  enableQueryDevtools: boolean;
  defaultStaleTime: number;
  defaultCacheTime: number;
  maxRetries: number;
  jwtSecret: string;
  tokenRefreshThreshold: number;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue!;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

export const config: AppConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL'),
  apiTimeout: getEnvNumber('VITE_API_TIMEOUT', 30000),
  appName: getEnvVar('VITE_APP_NAME', 'Happy Homes Services'),
  environment: getEnvVar('VITE_NODE_ENV', 'development'),
  enableQueryDevtools: getEnvBoolean('VITE_ENABLE_QUERY_DEVTOOLS', true),
  defaultStaleTime: getEnvNumber('VITE_DEFAULT_STALE_TIME', 300000), // 5 minutes
  defaultCacheTime: getEnvNumber('VITE_DEFAULT_CACHE_TIME', 600000), // 10 minutes
  maxRetries: getEnvNumber('VITE_MAX_RETRIES', 3),
  jwtSecret: getEnvVar('VITE_JWT_SECRET', 'dev-jwt-secret'),
  tokenRefreshThreshold: getEnvNumber('VITE_TOKEN_REFRESH_THRESHOLD', 300000), // 5 minutes
};

// Validate required configuration
if (config.environment === 'production') {
  if (config.jwtSecret === 'dev-jwt-secret') {
    throw new Error('JWT secret must be set in production');
  }
  if (config.apiBaseUrl.includes('localhost')) {
    console.warn('Warning: Using localhost API URL in production');
  }
}

export default config;