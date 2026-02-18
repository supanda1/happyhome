export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    CHANGE_PASSWORD: '/auth/change-password',
    PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile/update',
  },

  // User Management
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile/update',
    ADDRESSES: '/user/addresses',
    ADD_ADDRESS: '/user/addresses/add',
    UPDATE_ADDRESS: '/user/addresses/:id',
    DELETE_ADDRESS: '/user/addresses/:id',
    SET_DEFAULT_ADDRESS: '/user/addresses/:id/default',
    NOTIFICATIONS: '/user/notifications',
    NOTIFICATION_PREFERENCES: '/user/notification-preferences',
    DELETE_ACCOUNT: '/user/delete-account',
  },

  // Services
  SERVICES: {
    LIST: '/services',
    DETAIL: '/services/:id',
    SEARCH: '/services/search',
    FEATURED: '/services/featured',
    BY_CATEGORY: '/services/category/:categoryId',
    BY_SUBCATEGORY: '/services/subcategory/:subcategoryId',
    NEARBY: '/services/nearby',
  },

  // Categories
  CATEGORIES: {
    LIST: '/categories',
    DETAIL: '/categories/:id',
    SERVICES: '/categories/:id/services',
  },

  // Subcategories
  SUBCATEGORIES: {
    LIST: '/subcategories',
    DETAIL: '/subcategories/:id',
    BY_CATEGORY: '/subcategories/category/:categoryId',
    SERVICES: '/subcategories/:id/services',
  },

  // Cart
  CART: {
    GET: '/cart',
    ADD_ITEM: '/cart/add',
    UPDATE_ITEM: '/cart/update/:itemId',
    REMOVE_ITEM: '/cart/remove/:itemId',
    CLEAR: '/cart/clear',
    APPLY_COUPON: '/cart/apply-coupon',
    REMOVE_COUPON: '/cart/remove-coupon',
  },

  // Bookings
  BOOKINGS: {
    LIST: '/bookings',
    CREATE: '/bookings',
    DETAIL: '/bookings/:id',
    UPDATE: '/bookings/:id',
    CANCEL: '/bookings/:id/cancel',
    RESCHEDULE: '/bookings/:id/reschedule',
    RATE: '/bookings/:id/rate',
    HISTORY: '/bookings/history',
  },

  // Orders
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    DETAIL: '/orders/:id',
    UPDATE_STATUS: '/orders/:id/status',
    CANCEL: '/orders/:id/cancel',
    HISTORY: '/orders/history',
  },

  // Payments
  PAYMENTS: {
    METHODS: '/payments/methods',
    CREATE: '/payments',
    VERIFY: '/payments/:id/verify',
    REFUND: '/payments/:id/refund',
    HISTORY: '/payments/history',
    WEBHOOKS: '/payments/webhooks',
  },

  // Engineers (for Engineer App)
  ENGINEERS: {
    PROFILE: '/engineers/profile',
    UPDATE_PROFILE: '/engineers/profile/update',
    JOBS: '/engineers/jobs',
    JOB_DETAIL: '/engineers/jobs/:id',
    ACCEPT_JOB: '/engineers/jobs/:id/accept',
    START_JOB: '/engineers/jobs/:id/start',
    COMPLETE_JOB: '/engineers/jobs/:id/complete',
    UPDATE_LOCATION: '/engineers/location',
    AVAILABILITY: '/engineers/availability',
    EARNINGS: '/engineers/earnings',
    DOCUMENTS: '/engineers/documents',
    UPLOAD_DOCUMENT: '/engineers/documents/upload',
  },

  // Reviews
  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
    DETAIL: '/reviews/:id',
    BY_SERVICE: '/reviews/service/:serviceId',
    BY_ENGINEER: '/reviews/engineer/:engineerId',
    UPDATE: '/reviews/:id',
    DELETE: '/reviews/:id',
  },

  // Coupons
  COUPONS: {
    LIST: '/coupons',
    DETAIL: '/coupons/:id',
    VALIDATE: '/coupons/validate',
    APPLY: '/coupons/apply',
  },

  // Analytics (for Admin/Engineer Dashboard)
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    BOOKINGS: '/analytics/bookings',
    REVENUE: '/analytics/revenue',
    ENGINEERS: '/analytics/engineers',
    SERVICES: '/analytics/services',
    CUSTOMERS: '/analytics/customers',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: '/notifications/:id',
    PREFERENCES: '/notifications/preferences',
    REGISTER_DEVICE: '/notifications/register-device',
    UNREGISTER_DEVICE: '/notifications/unregister-device',
  },

  // Configuration
  CONFIG: {
    APP: '/config/app',
    BANNER: '/config/banners',
    SETTINGS: '/config/settings',
    CONTACT: '/config/contact',
    TERMS: '/config/terms',
    PRIVACY: '/config/privacy',
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_CONCURRENT_REQUESTS: 5,
} as const;