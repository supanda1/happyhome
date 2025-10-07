/**
 * React Query client configuration
 */

import { QueryClient } from '@tanstack/react-query';
import { config } from './config';
import { AppError, isRetryableError } from './errors';

const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time - how long data is considered fresh
        staleTime: config.defaultStaleTime, // 5 minutes
        
        // Cache time - how long data stays in memory after component unmount
        gcTime: config.defaultCacheTime, // 10 minutes (formerly cacheTime)
        
        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry more than maxRetries times
          if (failureCount >= config.maxRetries) {
            return false;
          }
          
          // Only retry if it's a retryable error
          if (error instanceof AppError) {
            return isRetryableError(error);
          }
          
          // For unknown errors, retry up to maxRetries
          return true;
        },
        
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch on window focus in development only
        refetchOnWindowFocus: config.environment === 'development',
        
        // Refetch on reconnect
        refetchOnReconnect: true,
        
        // Don't refetch on mount if data exists and is not stale
        refetchOnMount: true,
      },
      mutations: {
        // Retry mutations on network errors
        retry: (failureCount, error) => {
          if (failureCount >= 2) return false;
          
          if (error instanceof AppError) {
            // Only retry network errors and 5xx server errors
            return error.status === 0 || error.status >= 500;
          }
          
          return false;
        },
        
        // Retry delay for mutations
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  });
};

// Create singleton query client
export const queryClient = createQueryClient();

// Query keys factory
export const queryKeys = {
  // Authentication
  auth: {
    user: ['auth', 'user'],
    profile: (userId: string) => ['auth', 'profile', userId],
  },
  
  // Services
  services: {
    all: ['services'],
    lists: () => [...queryKeys.services.all, 'list'],
    list: (filters: Record<string, unknown>) => [...queryKeys.services.lists(), filters],
    details: () => [...queryKeys.services.all, 'detail'],
    detail: (id: string) => [...queryKeys.services.details(), id],
    categories: () => [...queryKeys.services.all, 'categories'],
    search: (query: string) => [...queryKeys.services.all, 'search', query],
  },
  
  // Bookings
  bookings: {
    all: ['bookings'],
    lists: () => [...queryKeys.bookings.all, 'list'],
    list: (filters: Record<string, unknown>) => [...queryKeys.bookings.lists(), filters],
    details: () => [...queryKeys.bookings.all, 'detail'],
    detail: (id: string) => [...queryKeys.bookings.details(), id],
    user: (userId: string) => [...queryKeys.bookings.all, 'user', userId],
  },
  
  // Reviews
  reviews: {
    all: ['reviews'],
    lists: () => [...queryKeys.reviews.all, 'list'],
    list: (filters: Record<string, unknown>) => [...queryKeys.reviews.lists(), filters],
    service: (serviceId: string) => [...queryKeys.reviews.all, 'service', serviceId],
    user: (userId: string) => [...queryKeys.reviews.all, 'user', userId],
  },
  
  // Coupons
  coupons: {
    all: ['coupons'],
    lists: () => [...queryKeys.coupons.all, 'list'],
    list: (filters: Record<string, unknown>) => [...queryKeys.coupons.lists(), filters],
    validate: (code: string) => [...queryKeys.coupons.all, 'validate', code],
  },
  
  // Cart
  cart: {
    all: ['cart'],
    items: () => [...queryKeys.cart.all, 'items'],
    count: () => [...queryKeys.cart.all, 'count'],
  },
  
  // Users
  users: {
    all: ['users'],
    profile: () => [...queryKeys.users.all, 'profile'],
    addresses: () => [...queryKeys.users.all, 'addresses'],
    address: (id: string) => [...queryKeys.users.addresses(), id],
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'],
    stats: () => [...queryKeys.dashboard.all, 'stats'],
    analytics: (period: string) => [...queryKeys.dashboard.all, 'analytics', period],
  },
} as const;

// Utility function to invalidate related queries
export const invalidateQueries = {
  // Invalidate all service-related queries
  services: () => queryClient.invalidateQueries({ queryKey: queryKeys.services.all }),
  
  // Invalidate specific service
  service: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.services.detail(id) }),
  
  // Invalidate all booking-related queries
  bookings: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
  
  // Invalidate user's bookings
  userBookings: (userId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.bookings.user(userId) }),
  
  // Invalidate all review-related queries
  reviews: () => queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all }),
  
  // Invalidate service reviews
  serviceReviews: (serviceId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.reviews.service(serviceId) }),
  
  // Invalidate cart data
  cart: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.all }),
  
  // Invalidate user data
  users: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  userAddresses: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.addresses() }),
  
  // Invalidate dashboard data
  dashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
};

export default queryClient;