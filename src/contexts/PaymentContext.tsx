/**
 * Payment Context
 * 
 * Centralized payment state management for the application.
 * Handles payment flow state, configuration, and service integration.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type {
  PaymentContextType,
  PaymentContextState,
  PaymentIntent,
  PaymentError,
  CreatePaymentIntentRequest,
  ConfirmPaymentRequest,
  PaymentIntentResponse,
  PaymentConfig,
} from '../types/payment';

import { getPaymentService } from '../services/payment/paymentServiceFactory';
import { CURRENT_PAYMENT_CONFIG, getCurrentConfigValidation } from '../config/payment.config';
import { useNotify } from './NotificationContext';

// ========== Initial State ==========

const initialState: PaymentContextState = {
  currentPayment: null,
  isProcessing: false,
  error: null,
  config: CURRENT_PAYMENT_CONFIG,
};

// ========== Action Types ==========

type PaymentAction = 
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_CURRENT_PAYMENT'; payload: PaymentIntent | null }
  | { type: 'SET_ERROR'; payload: PaymentError | null }
  | { type: 'UPDATE_PAYMENT_STATUS'; payload: { id: string; status: PaymentIntent['status'] } }
  | { type: 'RESET_PAYMENT' };

// ========== Reducer ==========

function paymentReducer(state: PaymentContextState, action: PaymentAction): PaymentContextState {
  switch (action.type) {
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };

    case 'SET_CURRENT_PAYMENT':
      return { ...state, currentPayment: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isProcessing: false };

    case 'UPDATE_PAYMENT_STATUS':
      if (state.currentPayment?.id === action.payload.id) {
        return {
          ...state,
          currentPayment: {
            ...state.currentPayment,
            status: action.payload.status,
            updatedAt: new Date(),
          },
        };
      }
      return state;

    case 'RESET_PAYMENT':
      return { ...state, currentPayment: null, error: null, isProcessing: false };

    default:
      return state;
  }
}

// ========== Context ==========

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

// ========== Provider Component ==========

interface PaymentProviderProps {
  children: React.ReactNode;
}

export function PaymentProvider({ children }: PaymentProviderProps) {
  const [state, dispatch] = useReducer(paymentReducer, initialState);
  const notify = useNotify();

  // Validate configuration on mount
  useEffect(() => {
    const validation = getCurrentConfigValidation();
    if (!validation.isValid) {
      console.warn('⚠️ Payment configuration issues:', validation.errors);
      // Don't show user notification for config issues in development
      if (process.env.NODE_ENV === 'production') {
        notify.error('Payment system configuration error');
      }
    }
  }, [notify]);

  // ========== Actions ==========

  const initializePayment = useCallback(async (request: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> => {
    try {
      dispatch({ type: 'SET_PROCESSING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('🚀 Initializing payment:', {
        amount: request.amount,
        currency: request.currency,
        orderId: request.orderId,
      });

      const paymentService = getPaymentService();
      const response = await paymentService.createPaymentIntent(request);

      dispatch({ type: 'SET_CURRENT_PAYMENT', payload: response.paymentIntent });
      dispatch({ type: 'SET_PROCESSING', payload: false });

      console.log('✅ Payment initialized:', response.paymentIntent.id);

      return response;
    } catch (error) {
      const paymentError: PaymentError = {
        code: 'payment_initialization_failed',
        type: 'api_error',
        message: error instanceof Error ? error.message : 'Failed to initialize payment',
      };

      dispatch({ type: 'SET_ERROR', payload: paymentError });
      notify.error(paymentError.message);
      
      console.error('❌ Payment initialization failed:', error);
      throw paymentError;
    }
  }, [notify]);

  const confirmPayment = useCallback(async (request: ConfirmPaymentRequest): Promise<PaymentIntentResponse> => {
    try {
      dispatch({ type: 'SET_PROCESSING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('⚡ Confirming payment:', request.paymentIntentId);

      const paymentService = getPaymentService();
      const response = await paymentService.confirmPayment(request);

      dispatch({ type: 'SET_CURRENT_PAYMENT', payload: response.paymentIntent });

      // Handle different payment outcomes
      switch (response.paymentIntent.status) {
        case 'succeeded':
          dispatch({ type: 'SET_PROCESSING', payload: false });
          notify.success('Payment successful!');
          console.log('🎉 Payment successful:', response.paymentIntent.id);
          break;

        case 'processing':
          // Keep processing state, will be updated via webhook/polling
          notify.info('Payment is being processed...');
          console.log('⏳ Payment processing:', response.paymentIntent.id);
          break;

        case 'requires_action':
          dispatch({ type: 'SET_PROCESSING', payload: false });
          notify.info('Additional authentication required');
          console.log('🔐 Payment requires action:', response.paymentIntent.id);
          break;

        case 'failed':
          dispatch({ type: 'SET_PROCESSING', payload: false });
          const errorMessage = response.paymentIntent.failureReason || 'Payment failed';
          notify.error(errorMessage);
          console.log('💥 Payment failed:', response.paymentIntent.id, errorMessage);
          break;

        default:
          dispatch({ type: 'SET_PROCESSING', payload: false });
          break;
      }

      return response;
    } catch (error) {
      const paymentError: PaymentError = {
        code: 'payment_confirmation_failed',
        type: 'api_error',
        message: error instanceof Error ? error.message : 'Failed to confirm payment',
      };

      dispatch({ type: 'SET_ERROR', payload: paymentError });
      notify.error(paymentError.message);
      
      console.error('❌ Payment confirmation failed:', error);
      throw paymentError;
    }
  }, [notify]);

  const cancelPayment = useCallback(async (paymentId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_PROCESSING', payload: true });

      console.log('🚫 Cancelling payment:', paymentId);

      const paymentService = getPaymentService();
      const cancelledPayment = await paymentService.cancelPaymentIntent(paymentId);

      dispatch({ type: 'SET_CURRENT_PAYMENT', payload: cancelledPayment });
      dispatch({ type: 'SET_PROCESSING', payload: false });

      notify.info('Payment cancelled');
      console.log('✅ Payment cancelled:', paymentId);
    } catch (error) {
      const paymentError: PaymentError = {
        code: 'payment_cancellation_failed',
        type: 'api_error',
        message: error instanceof Error ? error.message : 'Failed to cancel payment',
      };

      dispatch({ type: 'SET_ERROR', payload: paymentError });
      notify.error(paymentError.message);
      
      console.error('❌ Payment cancellation failed:', error);
    }
  }, [notify]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const resetPayment = useCallback(() => {
    dispatch({ type: 'RESET_PAYMENT' });
    console.log('🧹 Payment state reset');
  }, []);

  // ========== Payment Status Polling (for processing payments) ==========

  useEffect(() => {
    if (state.currentPayment?.status === 'processing') {
      const pollInterval = setInterval(async () => {
        try {
          const paymentService = getPaymentService();
          const updatedPayment = await paymentService.getPaymentIntent(state.currentPayment.id);
          
          if (updatedPayment.status !== 'processing') {
            dispatch({ type: 'SET_CURRENT_PAYMENT', payload: updatedPayment });
            
            if (updatedPayment.status === 'succeeded') {
              notify.success('Payment completed successfully!');
              dispatch({ type: 'SET_PROCESSING', payload: false });
            } else if (updatedPayment.status === 'failed') {
              notify.error(updatedPayment.failureReason || 'Payment failed');
              dispatch({ type: 'SET_PROCESSING', payload: false });
            }
            
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error('Error polling payment status:', error);
          // Don't clear interval on polling errors, just log them
        }
      }, 2000); // Poll every 2 seconds

      // Clear interval after 5 minutes to avoid infinite polling
      const timeoutId = setTimeout(() => {
        clearInterval(pollInterval);
        console.warn('⚠️ Payment status polling timeout');
      }, 5 * 60 * 1000);

      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeoutId);
      };
    }
  }, [state.currentPayment?.status, notify]);

  // ========== Context Value ==========

  const contextValue: PaymentContextType = {
    ...state,
    initializePayment,
    confirmPayment,
    cancelPayment,
    clearError,
    resetPayment,
  };

  return (
    <PaymentContext.Provider value={contextValue}>
      {children}
    </PaymentContext.Provider>
  );
}

// ========== Hook ==========

export function usePayment(): PaymentContextType {
  const context = useContext(PaymentContext);
  
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  
  return context;
}

// ========== Utility Hooks ==========

/**
 * Hook to check if payment system is ready
 */
export function usePaymentReady(): boolean {
  const { config } = usePayment();
  const validation = getCurrentConfigValidation();
  return config !== null && validation.isValid;
}

/**
 * Hook to get current payment status
 */
export function usePaymentStatus() {
  const { currentPayment, isProcessing, error } = usePayment();
  
  return {
    payment: currentPayment,
    status: currentPayment?.status || null,
    isInitialized: currentPayment !== null,
    isProcessing,
    isSuccessful: currentPayment?.status === 'succeeded',
    isFailed: currentPayment?.status === 'failed',
    isRequiresAction: currentPayment?.status === 'requires_action',
    error,
  };
}