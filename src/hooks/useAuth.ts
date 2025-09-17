/**
 * Authentication hooks using React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../utils/services';
import { queryKeys, invalidateQueries } from '../utils/query-client';
import type { User } from '../types/index.ts';
import { useNotify } from '../contexts/NotificationContext';

// ============= Query Hooks =============

/**
 * Get current user profile
 */
export const useProfile = () => {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: authService.getProfile,
    enabled: authService.isAuthenticated(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if user is not authenticated
      if (error?.status === 401) return false;
      return failureCount < 3;
    },
  });
};

/**
 * Check if user is authenticated
 */
export const useIsAuthenticated = () => {
  const { data: user, isLoading } = useProfile();
  return {
    isAuthenticated: !!user && authService.isAuthenticated(),
    user,
    isLoading,
  };
};

// ============= Mutation Hooks =============

/**
 * Login mutation
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Update user data in cache
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      notify.success('Login successful!');
      
      // Invalidate and refetch user-specific data
      invalidateQueries.bookings();
    },
    onError: (error: any) => {
      notify.error(error.message || 'Login failed');
    },
  });
};

/**
 * Register mutation
 */
export const useRegister = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      // Update user data in cache
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      notify.success('Registration successful!');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Registration failed');
    },
  });
};

/**
 * Logout mutation
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      notify.success('Logged out successfully');
    },
    onError: (error: any) => {
      // Even if logout fails on server, clear local data
      queryClient.clear();
      notify.info('Logged out');
    },
  });
};

/**
 * Update profile mutation
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (updatedUser) => {
      // Update user data in cache
      queryClient.setQueryData(queryKeys.auth.user, updatedUser);
      notify.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to update profile');
    },
  });
};

/**
 * Change password mutation
 */
export const useChangePassword = () => {
  const notify = useNotify();

  return useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      notify.success('Password changed successfully!');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to change password');
    },
  });
};

/**
 * Forgot password mutation
 */
export const useForgotPassword = () => {
  const notify = useNotify();

  return useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      notify.success('Password reset email sent!');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to send reset email');
    },
  });
};

/**
 * Reset password mutation
 */
export const useResetPassword = () => {
  const notify = useNotify();

  return useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      notify.success('Password reset successfully!');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to reset password');
    },
  });
};

/**
 * Verify email mutation
 */
export const useVerifyEmail = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: authService.verifyEmail,
    onSuccess: () => {
      // Refetch user profile to get updated verification status
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
      notify.success('Email verified successfully!');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to verify email');
    },
  });
};

/**
 * Resend verification email mutation
 */
export const useResendVerification = () => {
  const notify = useNotify();

  return useMutation({
    mutationFn: authService.resendVerification,
    onSuccess: () => {
      notify.success('Verification email sent!');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to send verification email');
    },
  });
};

// ============= Utility Hooks =============

/**
 * Get current user data from cache without triggering a request
 */
export const useCurrentUser = (): User | undefined => {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<User>(queryKeys.auth.user);
};

/**
 * Check if current user has specific role
 */
export const useHasRole = (role: 'admin' | 'customer'): boolean => {
  const user = useCurrentUser();
  return user?.role === role;
};

/**
 * Check if current user is admin
 */
export const useIsAdmin = (): boolean => {
  return useHasRole('admin');
};

/**
 * Check if current user is customer
 */
export const useIsCustomer = (): boolean => {
  return useHasRole('customer');
};

// Export all auth hooks
export const authHooks = {
  // Queries
  useProfile,
  useIsAuthenticated,
  
  // Mutations
  useLogin,
  useRegister,
  useLogout,
  useUpdateProfile,
  useChangePassword,
  useForgotPassword,
  useResetPassword,
  useVerifyEmail,
  useResendVerification,
  
  // Utilities
  useCurrentUser,
  useHasRole,
  useIsAdmin,
  useIsCustomer,
};