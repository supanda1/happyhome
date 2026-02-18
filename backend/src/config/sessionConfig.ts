/**
 * Session Management Configuration for E-commerce Model
 * 
 * Implements tiered session durations based on user activity and security requirements
 * Following Amazon-style session management patterns for optimal UX
 */

export interface SessionType {
  accessTokenDuration: string;
  refreshTokenDuration: string;
  maxAge: number; // in seconds, for cookies
  description: string;
}

export const SESSION_TYPES = {
  // Customer sessions - optimized for user experience
  BROWSING: {
    accessTokenDuration: '24h',          // Long access for browsing
    refreshTokenDuration: '30d',         // 30-day refresh for convenience
    maxAge: 30 * 24 * 60 * 60,          // 30 days in seconds
    description: 'Browse services and general site usage'
  },
  
  BOOKING: {
    accessTokenDuration: '8h',           // Medium duration for booking flow
    refreshTokenDuration: '24h',         // 24-hour refresh for active bookings
    maxAge: 24 * 60 * 60,               // 24 hours in seconds
    description: 'Active booking process and cart management'
  },
  
  PROFILE_VIEW: {
    accessTokenDuration: '4h',           // Medium security for viewing profile
    refreshTokenDuration: '7d',          // 7-day refresh for profile access
    maxAge: 7 * 24 * 60 * 60,           // 7 days in seconds
    description: 'View account information and order history'
  },
  
  PROFILE_EDIT: {
    accessTokenDuration: '2h',           // Higher security for editing
    refreshTokenDuration: '2h',          // Short refresh for sensitive operations
    maxAge: 2 * 60 * 60,                // 2 hours in seconds
    description: 'Edit profile, payment methods, and sensitive account data'
  },

  // Admin sessions - balanced security and productivity
  ADMIN_READ: {
    accessTokenDuration: '8h',           // Full work day access
    refreshTokenDuration: '8h',          // Work session duration
    maxAge: 8 * 60 * 60,                // 8 hours in seconds
    description: 'View dashboards, reports, and admin data'
  },
  
  ADMIN_WRITE: {
    accessTokenDuration: '2h',           // Medium security for admin changes
    refreshTokenDuration: '2h',          // Short refresh for write operations
    maxAge: 2 * 60 * 60,                // 2 hours in seconds  
    description: 'Modify system data, manage content'
  },
  
  ADMIN_SENSITIVE: {
    accessTokenDuration: '30m',          // High security for sensitive ops
    refreshTokenDuration: '30m',         // Very short refresh
    maxAge: 30 * 60,                    // 30 minutes in seconds
    description: 'User management, system settings, security operations'
  },

  // Fallback for unknown operations
  DEFAULT: {
    accessTokenDuration: '1h',           // Conservative default
    refreshTokenDuration: '24h',         // Reasonable refresh window
    maxAge: 24 * 60 * 60,               // 24 hours in seconds
    description: 'Default session for unspecified operations'
  }
} as const;

export type SessionTypeName = keyof typeof SESSION_TYPES;

/**
 * Determine session type based on user role and operation
 */
export function getSessionType(
  userRole: string, 
  operation: string = 'default',
  isWriteOperation: boolean = false,
  isSensitiveOperation: boolean = false
): SessionType {
  
  // Admin/SuperAdmin session logic
  if (userRole === 'admin' || userRole === 'super_admin') {
    if (isSensitiveOperation) {
      return SESSION_TYPES.ADMIN_SENSITIVE;
    }
    if (isWriteOperation) {
      return SESSION_TYPES.ADMIN_WRITE;
    }
    return SESSION_TYPES.ADMIN_READ;
  }

  // Customer session logic
  switch (operation.toLowerCase()) {
    case 'login':
    case 'browse':
    case 'view_services':
    case 'search':
      return SESSION_TYPES.BROWSING;

    case 'booking':
    case 'cart':
    case 'checkout':
    case 'payment':
      return SESSION_TYPES.BOOKING;

    case 'profile_view':
    case 'order_history':
    case 'view_account':
      return SESSION_TYPES.PROFILE_VIEW;

    case 'profile_edit':
    case 'update_profile':
    case 'change_password':
    case 'update_payment':
      return SESSION_TYPES.PROFILE_EDIT;

    default:
      return SESSION_TYPES.DEFAULT;
  }
}

/**
 * Activity-based session extension logic
 */
export const ACTIVITY_EXTENSIONS = {
  // User interactions that extend session
  BROWSING_ACTIVITY: {
    click: 30 * 60,        // 30 minutes
    scroll: 10 * 60,       // 10 minutes
    search: 60 * 60,       // 1 hour
  },
  
  BOOKING_ACTIVITY: {
    add_to_cart: 2 * 60 * 60,     // 2 hours
    service_selection: 60 * 60,    // 1 hour
    date_selection: 4 * 60 * 60,   // 4 hours
    payment_started: 24 * 60 * 60, // 24 hours
  },

  ADMIN_ACTIVITY: {
    dashboard_view: 30 * 60,       // 30 minutes
    data_export: 2 * 60 * 60,     // 2 hours  
    bulk_operation: 4 * 60 * 60,   // 4 hours
  }
};

/**
 * Session security levels for different operations
 */
export const SECURITY_LEVELS = {
  PUBLIC: ['browse', 'search', 'view_services'],
  LOW: ['view_profile', 'order_history'],
  MEDIUM: ['booking', 'cart', 'checkout'],
  HIGH: ['profile_edit', 'payment', 'admin_write'],
  CRITICAL: ['change_password', 'user_management', 'system_settings']
};

/**
 * Helper to check if operation requires re-authentication
 */
export function requiresReAuth(operation: string, lastAuthTime: Date): boolean {
  const now = new Date();
  const timeSinceAuth = now.getTime() - lastAuthTime.getTime();
  
  // Critical operations require auth within 30 minutes
  if (SECURITY_LEVELS.CRITICAL.includes(operation)) {
    return timeSinceAuth > 30 * 60 * 1000;
  }
  
  // High security operations require auth within 2 hours
  if (SECURITY_LEVELS.HIGH.includes(operation)) {
    return timeSinceAuth > 2 * 60 * 60 * 1000;
  }
  
  return false;
}

/**
 * Cookie options generator for different session types
 */
export function getCookieOptions(sessionType: SessionType, isProduction: boolean = false) {
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: 'lax' as const,
    maxAge: sessionType.maxAge,
    path: '/'
  };
}

export default {
  SESSION_TYPES,
  getSessionType,
  ACTIVITY_EXTENSIONS,
  SECURITY_LEVELS,
  requiresReAuth,
  getCookieOptions
};