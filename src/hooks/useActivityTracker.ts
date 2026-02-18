import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Activity types mapping to session extension values (in seconds)
const ACTIVITY_EXTENSIONS = {
  // User interactions that extend session
  BROWSING_ACTIVITY: {
    click: 30 * 60,        // 30 minutes
    scroll: 10 * 60,       // 10 minutes
    search: 60 * 60,       // 1 hour
    navigation: 15 * 60,   // 15 minutes
  },
  
  BOOKING_ACTIVITY: {
    add_to_cart: 2 * 60 * 60,     // 2 hours
    service_selection: 60 * 60,    // 1 hour
    date_selection: 4 * 60 * 60,   // 4 hours
    payment_started: 24 * 60 * 60, // 24 hours
    form_interaction: 30 * 60,     // 30 minutes
  },

  ADMIN_ACTIVITY: {
    dashboard_view: 30 * 60,       // 30 minutes
    data_export: 2 * 60 * 60,     // 2 hours  
    bulk_operation: 4 * 60 * 60,   // 4 hours
    form_edit: 45 * 60,           // 45 minutes
  }
} as const;

interface UseActivityTrackerOptions {
  // Enable automatic tracking of common activities
  trackClicks?: boolean;
  trackScrolling?: boolean;
  trackNavigation?: boolean;
  trackForms?: boolean;
  // Custom activity types to track
  customActivities?: string[];
  // Debounce time for tracking (milliseconds)
  debounceMs?: number;
}

export const useActivityTracker = (options: UseActivityTrackerOptions = {}) => {
  const { trackActivity, isAuthenticated, user, sessionInfo } = useAuth();
  
  const {
    trackClicks = true,
    trackScrolling = true,
    trackNavigation = true,
    trackForms = true,
    debounceMs = 1000
  } = options;

  // Debounced activity tracking
  const debouncedTrackActivity = useCallback(
    debounce((activityType: string) => {
      if (isAuthenticated) {
        trackActivity(activityType);
      }
    }, debounceMs),
    [trackActivity, isAuthenticated, debounceMs]
  );

  // Track click activities
  useEffect(() => {
    if (!trackClicks || !isAuthenticated) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Determine activity type based on what was clicked
      if (target.closest('button[type="submit"]')) {
        debouncedTrackActivity('form_interaction');
      } else if (target.closest('.cart-button, [data-cart]')) {
        debouncedTrackActivity('add_to_cart');
      } else if (target.closest('.search-button, [data-search]')) {
        debouncedTrackActivity('search');
      } else if (target.closest('a[href], button')) {
        debouncedTrackActivity('click');
      }
    };

    document.addEventListener('click', handleClick, { passive: true });
    return () => document.removeEventListener('click', handleClick);
  }, [trackClicks, isAuthenticated, debouncedTrackActivity]);

  // Track scroll activities
  useEffect(() => {
    if (!trackScrolling || !isAuthenticated) return;

    const handleScroll = () => {
      debouncedTrackActivity('scroll');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackScrolling, isAuthenticated, debouncedTrackActivity]);

  // Track navigation activities
  useEffect(() => {
    if (!trackNavigation || !isAuthenticated) return;

    const handleNavigation = () => {
      debouncedTrackActivity('navigation');
    };

    // Track browser navigation events
    window.addEventListener('popstate', handleNavigation);
    
    // Track programmatic navigation (React Router)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleNavigation();
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleNavigation();
    };

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [trackNavigation, isAuthenticated, debouncedTrackActivity]);

  // Track form interactions
  useEffect(() => {
    if (!trackForms || !isAuthenticated) return;

    const handleFormActivity = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (target.matches('input, textarea, select')) {
        debouncedTrackActivity('form_interaction');
      }
    };

    document.addEventListener('input', handleFormActivity, { passive: true });
    document.addEventListener('change', handleFormActivity, { passive: true });
    
    return () => {
      document.removeEventListener('input', handleFormActivity);
      document.removeEventListener('change', handleFormActivity);
    };
  }, [trackForms, isAuthenticated, debouncedTrackActivity]);

  // Manual activity tracking function
  const trackManualActivity = useCallback((activityType: string) => {
    if (isAuthenticated) {
      trackActivity(activityType);
    }
  }, [trackActivity, isAuthenticated]);

  // Get session extension time for activity
  const getSessionExtension = useCallback((activityType: string): number => {
    const role = user?.role;
    
    if (role === 'admin' || role === 'super_admin') {
      return ACTIVITY_EXTENSIONS.ADMIN_ACTIVITY[activityType as keyof typeof ACTIVITY_EXTENSIONS.ADMIN_ACTIVITY] || 0;
    }
    
    // Check booking activities first (higher priority)
    if (ACTIVITY_EXTENSIONS.BOOKING_ACTIVITY[activityType as keyof typeof ACTIVITY_EXTENSIONS.BOOKING_ACTIVITY]) {
      return ACTIVITY_EXTENSIONS.BOOKING_ACTIVITY[activityType as keyof typeof ACTIVITY_EXTENSIONS.BOOKING_ACTIVITY];
    }
    
    // Fall back to browsing activities
    return ACTIVITY_EXTENSIONS.BROWSING_ACTIVITY[activityType as keyof typeof ACTIVITY_EXTENSIONS.BROWSING_ACTIVITY] || 0;
  }, [user?.role]);

  return {
    trackManualActivity,
    getSessionExtension,
    sessionInfo,
    isTracking: isAuthenticated,
    activityExtensions: ACTIVITY_EXTENSIONS
  };
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default useActivityTracker;