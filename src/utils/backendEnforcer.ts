// Backend Enforcer - Ensures all critical data goes through backend API
// This replaces localStorage with backend API calls for critical operations

import { APP_CONFIG } from '../config/app.config';

// List of localStorage keys that should be blocked in favor of backend API
const BLOCKED_LOCALSTORAGE_KEYS = [
  'happyhomes_users',           // Users should come from backend auth API
  'happyhomes_categories',      // Categories should come from backend API
  'happyhomes_subcategories',   // Subcategories should come from backend API
  'happyhomes_services',        // Services should come from backend API
  'happyhomes_orders',         // Orders should use backend API
  'happyhomes_employees',      // Employees should come from backend API
  'happyhomes_coupons',        // Coupons should come from backend API
  'happyhomes_addresses',      // Addresses should use backend API
];

// List of allowed localStorage keys (authentication tokens, temporary UI state)
const ALLOWED_LOCALSTORAGE_KEYS = [
  'happyhomes_token',          // Authentication tokens are OK
  'accessToken',               // API client access token
  'refreshToken',              // API client refresh token
  'happyhomes_cart',           // Guest cart storage is OK
  'cart',                      // Generic cart storage is OK
  'happyhomes_theme',          // UI preferences are OK
  'happyhomes_language',       // Language preferences are OK
];

// Initialize backend enforcement
export const initializeBackendEnforcer = () => {
  if (!APP_CONFIG.FORCE_BACKEND_API) {
    return;
  }

  console.log('🛡️ Backend Enforcer: Blocking localStorage for backend-managed data');

  // Store original localStorage methods
  // eslint-disable-next-line no-restricted-globals, no-restricted-syntax
  const originalSetItem = localStorage.setItem;
  // eslint-disable-next-line no-restricted-globals, no-restricted-syntax
  const originalGetItem = localStorage.getItem;
  // eslint-disable-next-line no-restricted-globals, no-restricted-syntax
  const originalRemoveItem = localStorage.removeItem;

  // Override localStorage.setItem
  // eslint-disable-next-line no-restricted-globals, no-restricted-syntax
  localStorage.setItem = function(key: string, value: string) {
    if (BLOCKED_LOCALSTORAGE_KEYS.includes(key)) {
      console.warn(`🚫 BLOCKED localStorage.setItem('${key}') - This data should use backend API`);
      console.warn(`💡 Use appropriate API service instead:
        - Users: /api/auth/* endpoints
        - Categories: /api/categories endpoints  
        - Services: /api/services endpoints
        - Cart: /api/cart/* endpoints
        - Orders: /api/orders endpoints`);
      return;
    }
    return originalSetItem.call(this, key, value);
  };

  // Override localStorage.getItem  
  // eslint-disable-next-line no-restricted-globals, no-restricted-syntax
  localStorage.getItem = function(key: string): string | null {
    if (BLOCKED_LOCALSTORAGE_KEYS.includes(key)) {
      console.warn(`🚫 BLOCKED localStorage.getItem('${key}') - This data should come from backend API`);
      return null;
    }
    return originalGetItem.call(this, key);
  };

  // Override localStorage.removeItem
  // eslint-disable-next-line no-restricted-globals, no-restricted-syntax
  localStorage.removeItem = function(key: string) {
    if (BLOCKED_LOCALSTORAGE_KEYS.includes(key)) {
      console.warn(`🚫 BLOCKED localStorage.removeItem('${key}') - Use backend API to delete`);
      return;
    }
    return originalRemoveItem.call(this, key);
  };

  console.log('✅ Backend Enforcer: localStorage blocking active for', BLOCKED_LOCALSTORAGE_KEYS.length, 'keys');
};

// Clean up any existing blocked localStorage data
export const cleanupBlockedLocalStorage = () => {
  console.log('🧹 Cleaning up blocked localStorage keys...');
  
  BLOCKED_LOCALSTORAGE_KEYS.forEach(key => {
    // eslint-disable-next-line no-restricted-globals, no-restricted-syntax
    if (localStorage.getItem(key)) {
      console.log(`🗑️ Removing localStorage key: ${key}`);
      // eslint-disable-next-line no-restricted-globals, no-restricted-syntax
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ Cleanup completed');
};

// Helper function to show backend API usage status
export const showBackendStatus = () => {
  console.group('🔍 Backend API Status');
  console.log('Force Backend API:', APP_CONFIG.FORCE_BACKEND_API);
  console.log('API Base URL:', APP_CONFIG.API_BASE_URL);
  console.log('Data Sources:', APP_CONFIG.DATA_SOURCES);
  console.log('Blocked localStorage keys:', BLOCKED_LOCALSTORAGE_KEYS);
  console.log('Allowed localStorage keys:', ALLOWED_LOCALSTORAGE_KEYS);
  console.groupEnd();
};

// Check if a specific data type should use backend
export const shouldUseBackend = (dataType: keyof typeof APP_CONFIG.DATA_SOURCES): boolean => {
  return APP_CONFIG.DATA_SOURCES[dataType] === 'backend';
};

// Get backend API URL for specific endpoint
export const getBackendURL = (endpoint: string): string => {
  return `${APP_CONFIG.API_BASE_URL}${endpoint}`;
};

export default {
  initializeBackendEnforcer,
  cleanupBlockedLocalStorage,
  showBackendStatus,
  shouldUseBackend,
  getBackendURL
};