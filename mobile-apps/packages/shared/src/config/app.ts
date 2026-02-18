export const APP_CONFIG = {
  // App Information
  app: {
    name: 'Household Services',
    version: '1.0.0',
    build_number: '1',
    bundle_id: {
      customer: 'com.householdservices.customer',
      engineer: 'com.householdservices.engineer',
    },
  },

  // API Configuration
  api: {
    version: 'v1',
    endpoints: {
      auth: '/auth',
      services: '/services',
      bookings: '/bookings',
      orders: '/orders',
      payments: '/payments',
      engineers: '/engineers',
      user: '/user',
      categories: '/categories',
      subcategories: '/subcategories',
      reviews: '/reviews',
      analytics: '/analytics',
      coupons: '/coupons',
      cart: '/cart',
    },
  },

  // Storage Keys
  storage: {
    keys: {
      auth_tokens: 'household_auth_tokens',
      user_data: 'household_user_data',
      biometric_enabled: 'household_biometric_enabled',
      app_settings: 'household_app_settings',
      cart_data: 'household_cart_data',
      search_history: 'household_search_history',
      recent_addresses: 'household_recent_addresses',
      notification_preferences: 'household_notification_preferences',
    },
  },

  // Navigation
  navigation: {
    initial_route: {
      customer: 'Home',
      engineer: 'Dashboard',
    },
    auth_routes: ['Login', 'Register', 'ForgotPassword'],
  },

  // UI Constants
  ui: {
    colors: {
      primary: '#007AFF',
      secondary: '#34C759',
      error: '#FF3B30',
      warning: '#FF9500',
      info: '#5AC8FA',
      success: '#34C759',
      text: {
        primary: '#000000',
        secondary: '#8E8E93',
        light: '#FFFFFF',
      },
      background: {
        primary: '#FFFFFF',
        secondary: '#F2F2F7',
        card: '#FFFFFF',
      },
    },
    fonts: {
      regular: 'System',
      medium: 'System-Medium',
      semibold: 'System-Semibold',
      bold: 'System-Bold',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
  },

  // Business Rules
  business: {
    booking: {
      advance_booking_days: 30,
      cancellation_hours: 24,
      reschedule_hours: 12,
      max_services_per_booking: 10,
    },
    payment: {
      supported_methods: ['card', 'upi', 'netbanking', 'wallet'],
      refund_processing_days: 7,
      payment_timeout_minutes: 15,
    },
    location: {
      max_service_radius_km: 50,
      location_update_interval_ms: 30000,
    },
  },

  // Validation Rules
  validation: {
    phone: {
      min_length: 10,
      max_length: 10,
      pattern: /^[6-9]\d{9}$/,
    },
    password: {
      min_length: 8,
      max_length: 128,
      require_uppercase: true,
      require_lowercase: true,
      require_number: true,
      require_special: true,
    },
    otp: {
      length: 6,
      expiry_minutes: 10,
    },
  },

  // File Upload
  upload: {
    max_file_size_mb: 10,
    allowed_image_types: ['image/jpeg', 'image/png', 'image/webp'],
    allowed_document_types: ['application/pdf', 'image/jpeg', 'image/png'],
    max_images_per_upload: 5,
  },

  // Notifications
  notifications: {
    channels: {
      booking: {
        id: 'booking_notifications',
        name: 'Booking Updates',
        importance: 'high',
      },
      order: {
        id: 'order_notifications',
        name: 'Order Updates',
        importance: 'high',
      },
      payment: {
        id: 'payment_notifications',
        name: 'Payment Updates',
        importance: 'high',
      },
      promotional: {
        id: 'promotional_notifications',
        name: 'Offers & Promotions',
        importance: 'default',
      },
    },
  },

  // Analytics Events
  analytics: {
    events: {
      // Authentication
      login: 'user_login',
      logout: 'user_logout',
      register: 'user_register',
      
      // Service Discovery
      search: 'service_search',
      service_view: 'service_view',
      category_view: 'category_view',
      
      // Booking Flow
      add_to_cart: 'add_to_cart',
      remove_from_cart: 'remove_from_cart',
      checkout_start: 'checkout_start',
      booking_create: 'booking_create',
      booking_cancel: 'booking_cancel',
      
      // Payment
      payment_start: 'payment_start',
      payment_success: 'payment_success',
      payment_failure: 'payment_failure',
      
      // Engineer Actions
      job_accept: 'job_accept',
      job_start: 'job_start',
      job_complete: 'job_complete',
    },
  },

  // Error Messages
  errors: {
    network: 'Please check your internet connection and try again.',
    server: 'Something went wrong on our end. Please try again later.',
    validation: 'Please check your input and try again.',
    authentication: 'Please log in again to continue.',
    permission: 'You do not have permission to perform this action.',
    not_found: 'The requested resource was not found.',
    timeout: 'Request timed out. Please try again.',
  },
} as const;

export type AppConfig = typeof APP_CONFIG;