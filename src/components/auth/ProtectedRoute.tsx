/**
 * Protected Route component for authentication and role-based access control
 */

import React, { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../ui';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'customer';
  fallbackPath?: string;
  showLoading?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath,
  showLoading = true,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to={fallbackPath || '/login'} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

/**
 * Admin-only protected route
 */
export const AdminRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole'>> = (props) => {
  return <ProtectedRoute {...props} requiredRole="admin" fallbackPath="/admin/login" />;
};

/**
 * Customer-only protected route
 */
export const CustomerRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole'>> = (props) => {
  return <ProtectedRoute {...props} requiredRole="customer" fallbackPath="/login" />;
};

/**
 * Public route that redirects authenticated users
 */
export const PublicRoute: React.FC<{
  children: ReactNode;
  redirectPath?: string;
}> = ({ children, redirectPath }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Don't redirect while loading
  if (isLoading) {
    return <>{children}</>;
  }

  // Redirect authenticated users
  if (isAuthenticated && user) {
    const defaultRedirect = user.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={redirectPath || defaultRedirect} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;