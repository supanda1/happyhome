import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Disabled due to Vite cache issue
import { AuthProvider } from './AuthContext';
import { ServiceProvider } from './ServiceContext';
import { BookingProvider } from './BookingContext';
import { NotificationProvider } from './NotificationContext';
import { ErrorBoundary } from '../components/ui';
import { queryClient } from '../utils/query-client';
import { config } from '../utils/config';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        // In production, you might want to send this to an error reporting service
        console.error('Application Error:', error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <AuthProvider>
            <ServiceProvider>
              <BookingProvider>
                {children}
                {/* React Query DevTools - disabled due to Vite cache issue
                {config.enableQueryDevtools && config.environment === 'development' && (
                  <ReactQueryDevtools initialIsOpen={false} />
                )}
                */}
              </BookingProvider>
            </ServiceProvider>
          </AuthProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default AppProvider;