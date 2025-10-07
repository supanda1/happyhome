import React, { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Disabled due to Vite cache issue
import { AuthProvider } from './AuthContext';
import { ServiceProvider } from './ServiceContext';
import { BookingProvider } from './BookingContext';
import { NotificationProvider } from './NotificationContext';
import { PaymentProvider } from './PaymentContext';
import { ErrorBoundary } from '../components/ui';
import { queryClient } from '../utils/query-client';

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
                <PaymentProvider>
                  {children}
                  {/* React Query DevTools - disabled due to Vite cache issue
                  {false && (
                    <ReactQueryDevtools initialIsOpen={false} />
                  )}
                  */}
                </PaymentProvider>
              </BookingProvider>
            </ServiceProvider>
          </AuthProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default AppProvider;