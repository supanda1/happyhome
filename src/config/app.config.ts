// Application Configuration - Force Backend API Usage
// This configuration disables localStorage and forces all data through backend API

export const APP_CONFIG = {
  // Disable all localStorage usage
  USE_LOCAL_STORAGE: false,
  
  // Force backend API for all data operations
  FORCE_BACKEND_API: true,
  
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  
  // Disable mock data
  USE_MOCK_DATA: false,
  
  // Authentication config
  AUTH: {
    USE_BACKEND_AUTH: true,
    TOKEN_STORAGE_KEY: 'happyhomes_token',
  },
  
  // Data source configuration
  DATA_SOURCES: {
    USERS: 'backend',           // 'backend' | 'localStorage' | 'mock'
    CATEGORIES: 'backend',      // 'backend' | 'localStorage' | 'mock'  
    SERVICES: 'backend',        // 'backend' | 'localStorage' | 'mock'
    CART: 'backend',           // 'backend' | 'localStorage' | 'mock'
    ORDERS: 'backend',         // 'backend' | 'localStorage' | 'mock'
    EMPLOYEES: 'backend',      // 'backend' | 'localStorage' | 'mock'
    COUPONS: 'backend',        // 'backend' | 'localStorage' | 'mock'
    REVIEWS: 'backend',        // 'backend' | 'localStorage' | 'mock'
    ADDRESSES: 'backend',      // 'backend' | 'localStorage' | 'mock'
  },
  
  // Error handling
  ERROR_HANDLING: {
    FALLBACK_TO_LOCAL: false,  // Never fall back to localStorage
    SHOW_BACKEND_ERRORS: true, // Show clear error messages for backend failures
  },
  
  // Development settings
  DEVELOPMENT: {
    LOG_API_CALLS: true,
    WARN_ON_LOCALSTORAGE_USE: true,
  }
};

// Helper function to check if localStorage usage is allowed
export const isLocalStorageAllowed = (): boolean => {
  return APP_CONFIG.USE_LOCAL_STORAGE;
};

// Helper function to check if backend API should be used
export const shouldUseBackendAPI = (): boolean => {
  return APP_CONFIG.FORCE_BACKEND_API;
};

// Helper function to get data source for a specific entity
export const getDataSource = (entity: keyof typeof APP_CONFIG.DATA_SOURCES): string => {
  return APP_CONFIG.DATA_SOURCES[entity];
};

// SECURITY: Backend-only storage - NO localStorage usage allowed
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    // SECURITY: Always block localStorage access - use backend API only
    if (APP_CONFIG.DEVELOPMENT.WARN_ON_LOCALSTORAGE_USE) {
      console.warn(`🚫 SECURITY: LocalStorage access completely blocked for key: ${key}. Use backend API instead.`);
    }
    return null;
  },
  
  setItem: (key: string, value: string): void => {
    // SECURITY: Always block localStorage writes - use backend API only
    if (APP_CONFIG.DEVELOPMENT.WARN_ON_LOCALSTORAGE_USE) {
      console.warn(`🚫 SECURITY: LocalStorage write completely blocked for key: ${key}. Use backend API instead.`);
    }
    return;
  },
  
  removeItem: (key: string): void => {
    // SECURITY: Always block localStorage removal - use backend API only
    if (APP_CONFIG.DEVELOPMENT.WARN_ON_LOCALSTORAGE_USE) {
      console.warn(`🚫 SECURITY: LocalStorage remove completely blocked for key: ${key}. Use backend API instead.`);
    }
    return;
  },
  
  clear: (): void => {
    // SECURITY: Always block localStorage clear - use backend API only
    if (APP_CONFIG.DEVELOPMENT.WARN_ON_LOCALSTORAGE_USE) {
      console.warn(`🚫 SECURITY: LocalStorage clear completely blocked. Use backend API instead.`);
    }
    return;
  }
};

export default APP_CONFIG;