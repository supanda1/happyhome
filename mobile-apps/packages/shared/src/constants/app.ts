export const APP_CONSTANTS = {
  // App Metadata
  APP_NAME: 'Happy Homes',
  COMPANY_NAME: 'Happy Homes',
  TAGLINE: 'Professional Home Services At Your Doorstep',
  HERO_MESSAGE: 'Get reliable, professional services for your home. From plumbing to cleaning, we connect you with trusted professionals in your area.',
  SUPPORT_EMAIL: 'support@happyhomes.com',
  SUPPORT_PHONE: '+91-8000000000',
  WEBSITE_URL: 'https://happyhomes.com',

  // Deep Links
  DEEP_LINKS: {
    CUSTOMER: {
      SCHEME: 'householdservices',
      HOST: 'customer',
    },
    ENGINEER: {
      SCHEME: 'householdservices',
      HOST: 'engineer',
    },
  },

  // Date/Time Formats
  DATE_FORMATS: {
    DISPLAY: 'DD MMM YYYY',
    INPUT: 'YYYY-MM-DD',
    TIME: 'HH:mm',
    DATETIME: 'DD MMM YYYY, HH:mm',
    API: 'YYYY-MM-DD HH:mm:ss',
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    INFINITE_SCROLL_THRESHOLD: 0.7,
  },

  // Location
  LOCATION: {
    DEFAULT_LATITUDE: 28.6139, // Delhi
    DEFAULT_LONGITUDE: 77.2090,
    LOCATION_ACCURACY: 100, // meters
    MAX_AGE: 300000, // 5 minutes
    TIMEOUT: 10000, // 10 seconds
  },

  // Images
  IMAGES: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    QUALITY: 0.8,
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    THUMBNAIL_SIZE: 200,
    PLACEHOLDER: 'https://via.placeholder.com/400x300?text=No+Image',
  },

  // Cache
  CACHE: {
    DURATION: {
      SHORT: 5 * 60 * 1000, // 5 minutes
      MEDIUM: 30 * 60 * 1000, // 30 minutes
      LONG: 24 * 60 * 60 * 1000, // 24 hours
    },
    KEYS: {
      SERVICES: 'services_cache',
      CATEGORIES: 'categories_cache',
      USER_PROFILE: 'user_profile_cache',
      RECENT_SEARCHES: 'recent_searches_cache',
    },
  },

  // Validation
  VALIDATION: {
    PHONE_REGEX: /^[6-9]\d{9}$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    PINCODE_REGEX: /^\d{6}$/,
    AADHAR_REGEX: /^\d{12}$/,
    PAN_REGEX: /^[A-Z]{5}\d{4}[A-Z]$/,
  },

  // Permissions
  PERMISSIONS: {
    LOCATION: 'ACCESS_FINE_LOCATION',
    CAMERA: 'CAMERA',
    GALLERY: 'READ_EXTERNAL_STORAGE',
    NOTIFICATIONS: 'POST_NOTIFICATIONS',
    PHONE: 'CALL_PHONE',
  },

  // Animation Durations
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    SPLASH: 2000,
  },

  // Error Codes
  ERROR_CODES: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    PARSE_ERROR: 'PARSE_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  },

  // Feature Flags
  FEATURES: {
    BIOMETRIC_AUTH: 'biometric_auth',
    PUSH_NOTIFICATIONS: 'push_notifications',
    LOCATION_TRACKING: 'location_tracking',
    ANALYTICS: 'analytics',
    CRASH_REPORTING: 'crash_reporting',
    OFFLINE_MODE: 'offline_mode',
    DARK_MODE: 'dark_mode',
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    BOOKING_CONFIRMED: 'booking_confirmed',
    BOOKING_CANCELLED: 'booking_cancelled',
    ENGINEER_ASSIGNED: 'engineer_assigned',
    JOB_STARTED: 'job_started',
    JOB_COMPLETED: 'job_completed',
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILED: 'payment_failed',
    NEW_JOB: 'new_job',
    JOB_REMINDER: 'job_reminder',
    PROMOTION: 'promotion',
  },

  // Payment Methods
  PAYMENT_METHODS: {
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    NET_BANKING: 'net_banking',
    UPI: 'upi',
    WALLET: 'wallet',
    COD: 'cash_on_delivery',
  },

  // Booking Time Slots
  TIME_SLOTS: [
    { label: '9:00 AM - 12:00 PM', value: '09:00-12:00' },
    { label: '12:00 PM - 3:00 PM', value: '12:00-15:00' },
    { label: '3:00 PM - 6:00 PM', value: '15:00-18:00' },
    { label: '6:00 PM - 9:00 PM', value: '18:00-21:00' },
  ],

  // Service Categories (matching web UI exactly)
  SERVICE_CATEGORIES: {
    PLUMBING: {
      id: 'plumbing',
      name: 'Plumbing',
      description: 'Professional plumbing services for your home',
      icon: '🔧',
    },
    ELECTRICAL: {
      id: 'electrical',
      name: 'Electrical',
      description: 'Safe and reliable electrical solutions',
      icon: '⚡',
    },
    CLEANING: {
      id: 'cleaning',
      name: 'Cleaning',
      description: 'Professional cleaning services',
      icon: '✨',
    },
    CIVIL_WORK: {
      id: 'civil-work',
      name: 'Civil Work',
      description: 'Construction and renovation services',
      icon: '🏗️',
    },
    PERSONAL_CARE: {
      id: 'personal-care',
      name: 'Personal Care',
      description: 'Beauty and wellness services at home',
      icon: '💆',
    },
    FINANCE: {
      id: 'finance-insurance',
      name: 'Finance & Insurance',
      description: 'Financial and documentation services',
      icon: '📋',
    },
  },

  // Trust badges (matching web UI exactly)
  TRUST_BADGES: {
    EXPERT_PROFESSIONALS: {
      id: 'expert-professionals',
      title: 'Expert Professionals',
      description: 'Verified & experienced',
      icon: '🔧',
    },
    SAME_DAY_SERVICE: {
      id: 'same-day-service',
      title: 'Same Day Service',
      description: 'Quick & efficient',
      icon: '⚡',
    },
    INSURED_BONDED: {
      id: 'insured-bonded',
      title: 'Insured & Bonded',
      description: 'Safe & secure',
      icon: '🛡️',
    },
    HUNDRED_GUARANTEE: {
      id: '100-guarantee',
      title: '100% Guarantee',
      description: 'Satisfaction assured',
      icon: '💯',
    },
  },

  // How it works (3-step process from web UI)
  HOW_IT_WORKS: [
    {
      step: 1,
      title: 'Choose Service',
      description: 'Select from our wide range of home services',
      icon: '🎯',
    },
    {
      step: 2,
      title: 'Book Appointment',
      description: 'Schedule at your convenient time',
      icon: '📅',
    },
    {
      step: 3,
      title: 'Get It Done',
      description: 'Expert professionals complete the job',
      icon: '✅',
    },
  ],

  // Rating System
  RATING: {
    MIN: 1,
    MAX: 5,
    DEFAULT: 3,
    DECIMAL_PLACES: 1,
  },

  // Security
  SECURITY: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    TOKEN_REFRESH_THRESHOLD: 15 * 60 * 1000, // 15 minutes before expiry
  },
} as const;

export type AppConstants = typeof APP_CONSTANTS;