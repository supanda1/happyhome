import { useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Session type mappings based on user actions and routes
const SESSION_TYPE_MAPPINGS = {
  // Customer session mappings
  customer: {
    // Browsing activities (long session)
    browsing: {
      routes: ['/', '/services', '/about', '/contact'],
      actions: ['search', 'scroll', 'click', 'navigation'],
      sessionType: 'BROWSING'
    },
    
    // Booking activities (medium session)  
    booking: {
      routes: ['/booking', '/cart', '/checkout', '/service-detail'],
      actions: ['add_to_cart', 'service_selection', 'date_selection', 'payment_started'],
      sessionType: 'BOOKING'
    },
    
    // Profile viewing (medium security)
    profile_view: {
      routes: ['/profile', '/my-bookings', '/order-history'],
      actions: ['profile_view', 'order_history'],
      sessionType: 'PROFILE_VIEW'
    },
    
    // Profile editing (high security)
    profile_edit: {
      routes: ['/profile/edit', '/profile/password'],
      actions: ['profile_edit', 'update_profile', 'change_password'],
      sessionType: 'PROFILE_EDIT'
    }
  },
  
  // Admin session mappings
  admin: {
    // Read-only admin operations
    admin_read: {
      routes: ['/admin', '/admin/dashboard', '/admin/analytics'],
      actions: ['dashboard_view', 'report_view'],
      sessionType: 'ADMIN_READ'
    },
    
    // Admin write operations
    admin_write: {
      routes: ['/admin/services', '/admin/categories', '/admin/orders'],
      actions: ['form_edit', 'data_update', 'bulk_operation'],
      sessionType: 'ADMIN_WRITE'
    },
    
    // Sensitive admin operations
    admin_sensitive: {
      routes: ['/admin/users', '/admin/settings', '/admin/contact'],
      actions: ['user_management', 'system_settings', 'security_operations'],
      sessionType: 'ADMIN_SENSITIVE'
    }
  }
} as const;

export interface UseSessionManagerOptions {
  // Enable automatic session type detection
  autoDetect?: boolean;
  // Custom session type detection rules
  customRules?: Record<string, any>;
  // Current pathname (optional, for use without router)
  currentPath?: string;
}

export const useSessionManager = (options: UseSessionManagerOptions = {}) => {
  const { user, isAuthenticated, sessionInfo, trackActivity } = useAuth();
  
  const { autoDetect = true, currentPath = '/' } = options;

  // Determine session type based on current route and user role
  const detectSessionTypeFromRoute = useCallback((currentPath: string): string | null => {
    if (!user || !isAuthenticated) return null;

    const userRole = user.role === 'super_admin' ? 'admin' : user.role;
    const roleMappings = SESSION_TYPE_MAPPINGS[userRole as keyof typeof SESSION_TYPE_MAPPINGS];
    
    if (!roleMappings) return null;

    // Check each session type mapping for the current route
    for (const [sessionKey, config] of Object.entries(roleMappings)) {
      if (config.routes.some(route => {
        // Exact match or path starts with route (for nested routes)
        return currentPath === route || currentPath.startsWith(route + '/');
      })) {
        return config.sessionType;
      }
    }

    // Default session types
    return userRole === 'admin' ? 'ADMIN_READ' : 'BROWSING';
  }, [user, isAuthenticated]);

  // Determine session type based on user action
  const detectSessionTypeFromAction = useCallback((action: string): string | null => {
    if (!user || !isAuthenticated) return null;

    const userRole = user.role === 'super_admin' ? 'admin' : user.role;
    const roleMappings = SESSION_TYPE_MAPPINGS[userRole as keyof typeof SESSION_TYPE_MAPPINGS];
    
    if (!roleMappings) return null;

    // Check each session type mapping for the current action
    for (const [sessionKey, config] of Object.entries(roleMappings)) {
      if (config.actions.includes(action)) {
        return config.sessionType;
      }
    }

    return null;
  }, [user, isAuthenticated]);

  // Update session type on backend
  const updateSessionType = useCallback(async (sessionType: string, operation: string = 'auto_detect') => {
    if (!isAuthenticated) return false;

    try {
      const response = await fetch('/api/auth/update-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionType,
          operation,
          currentRoute: currentPath
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`🔄 Session updated to ${sessionType} for operation: ${operation}`);
        
        // Track the session change activity
        trackActivity(`session_change_${sessionType.toLowerCase()}`);
        
        return true;
      } else {
        console.warn('Failed to update session type:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error updating session type:', error);
      return false;
    }
  }, [isAuthenticated, currentPath, trackActivity]);

  // Handle route-based session type detection
  useEffect(() => {
    if (!autoDetect || !isAuthenticated) return;

    const detectedSessionType = detectSessionTypeFromRoute(currentPath);
    
    if (detectedSessionType && sessionInfo?.type !== detectedSessionType.toLowerCase()) {
      console.log(`🎯 Route-based session detection: ${currentPath} -> ${detectedSessionType}`);
      updateSessionType(detectedSessionType, 'route_navigation');
    }
  }, [currentPath, autoDetect, isAuthenticated, detectSessionTypeFromRoute, sessionInfo?.type, updateSessionType]);

  // Manual session type update based on action
  const updateSessionForAction = useCallback((action: string) => {
    if (!autoDetect || !isAuthenticated) return;

    const detectedSessionType = detectSessionTypeFromAction(action);
    
    if (detectedSessionType && sessionInfo?.type !== detectedSessionType.toLowerCase()) {
      console.log(`🎯 Action-based session detection: ${action} -> ${detectedSessionType}`);
      updateSessionType(detectedSessionType, action);
    }
  }, [autoDetect, isAuthenticated, detectSessionTypeFromAction, sessionInfo?.type, updateSessionType]);

  // Get current session type info
  const getCurrentSessionInfo = useCallback(() => {
    return {
      currentType: sessionInfo?.type || 'unknown',
      description: sessionInfo?.description || 'No session info',
      lastActivity: sessionInfo?.lastActivity,
      isActive: isAuthenticated
    };
  }, [sessionInfo, isAuthenticated]);

  // Check if current session needs elevation for sensitive operations
  const needsSessionElevation = useCallback((targetOperation: string): boolean => {
    if (!isAuthenticated || !sessionInfo) return true;

    const targetSessionType = detectSessionTypeFromAction(targetOperation);
    const currentType = sessionInfo.type;

    // Define session hierarchy (lower number = higher security)
    const sessionHierarchy: Record<string, number> = {
      'admin_sensitive': 1,
      'admin_write': 2, 
      'admin_read': 3,
      'profile_edit': 2,
      'profile_view': 3,
      'booking': 4,
      'browsing': 5
    };

    const currentLevel = sessionHierarchy[currentType] || 5;
    const targetLevel = sessionHierarchy[targetSessionType?.toLowerCase() || ''] || 1;

    return currentLevel > targetLevel;
  }, [isAuthenticated, sessionInfo, detectSessionTypeFromAction]);

  return {
    // Session type detection
    detectSessionTypeFromRoute,
    detectSessionTypeFromAction,
    
    // Session management
    updateSessionType,
    updateSessionForAction,
    getCurrentSessionInfo,
    
    // Security checks
    needsSessionElevation,
    
    // Current session info
    currentSessionType: sessionInfo?.type,
    isSessionActive: isAuthenticated,
    
    // Constants
    sessionMappings: SESSION_TYPE_MAPPINGS
  };
};

export default useSessionManager;