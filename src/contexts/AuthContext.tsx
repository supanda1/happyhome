import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, AuthState } from '../types';
import { queryKeys } from '../utils/query-client';
import { AppError } from '../utils/errors';

// Auth Actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User | null };

// Registration Request Type (matches backend)
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: 'customer' | 'admin' | 'super_admin';
}

// Auth Context Type
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  updateProfile: (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
};

// Backend-only authentication - no mock accounts
const initializeBackendAuth = async () => {
  console.log('🛡️ Backend-only session authentication initialized');
  console.log('📧 Use real accounts created through registration or contact admin for access');
};

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();

  // Check authentication status using session-based backend API only
  const checkAuthStatus = useCallback(async () => {
    // SECURITY: No localStorage token checking - use session-based auth
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Check if user is authenticated via HTTP-only cookies
      const response = await fetch(`/api/auth/me`, {
        method: 'GET',
        credentials: 'include', // Include session cookies
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const user = data.success ? data.data : data; // Handle different response formats
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      queryClient.setQueryData(queryKeys.auth.user, user);
    } catch (error) {
      console.warn('Session authentication check failed:', error);
      // Session expired or user not authenticated
      dispatch({ type: 'LOGIN_FAILURE' });
    }
  }, [queryClient]);

  // Initialize auth state on mount
  useEffect(() => {
    initializeBackendAuth();
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Listen for session expiry events (from session refresh failures)
  useEffect(() => {
    const handleSessionExpired = () => {
      dispatch({ type: 'LOGOUT' });
      queryClient.clear();
    };

    // SECURITY: Listen for session expiry instead of manual logout events
    window.addEventListener('auth:session_expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session_expired', handleSessionExpired);
  }, [queryClient]);

  // Login function using backend API only
  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include', // SECURITY: Include HTTP-only cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const user = data.success ? data.data.user : data.user; // Handle different response formats
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      queryClient.setQueryData(queryKeys.auth.user, user);
      return true;
    } catch (error) {
      console.warn('Login failed:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
  };

  // Logout function - session-based
  const logout = async (): Promise<void> => {
    try {
      // SECURITY: Backend logout clears HTTP-only cookies
      await fetch(`/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include session cookies
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // No localStorage to clear - sessions managed by backend
      dispatch({ type: 'LOGOUT' });
      queryClient.clear();
    }
  };

  // Register function using backend API only
  const register = async (userData: RegisterRequest): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        credentials: 'include', // SECURITY: Include HTTP-only cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const user = data.success ? data.data.user : data.user; // Handle different response formats
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      queryClient.setQueryData(queryKeys.auth.user, user);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
  };

  // Update profile function
  const updateProfile = async (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/auth/profile`, {
        method: 'PATCH',
        credentials: 'include', // Include session cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const updatedUser = data.success ? data.data : data; // Handle different response formats
      
      dispatch({ type: 'SET_USER', payload: updatedUser });
      // Update cache
      queryClient.setQueryData(queryKeys.auth.user, updatedUser);
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/auth/change-password`, {
        method: 'POST',
        credentials: 'include', // Include session cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/auth/me`, {
        method: 'GET',
        credentials: 'include', // Include session cookies
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // User is not authenticated, logout
          dispatch({ type: 'LOGOUT' });
          queryClient.clear();
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const user = data.success ? data.data : data; // Handle different response formats
      
      dispatch({ type: 'SET_USER', payload: user });
      queryClient.setQueryData(queryKeys.auth.user, user);
    } catch (error) {
      console.error('Refresh user error:', error);
      // If refresh fails, user might be logged out
      dispatch({ type: 'LOGOUT' });
      queryClient.clear();
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    refreshUser,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;