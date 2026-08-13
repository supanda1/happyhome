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


const initialState: PaymentContextState = {
  currentPayment: null,
  isProcessing: false,
  error: null,
  config: CURRENT_PAYMENT_CONFIG,
};


type PaymentAction = 
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_CURRENT_PAYMENT'; payload: PaymentIntent | null }
  | { type: 'SET_ERROR'; payload: PaymentError | null }
  | { type: 'UPDATE_PAYMENT_STATUS'; payload: { id: string; status: PaymentIntent['status'] } }
  | { type: 'RESET_PAYMENT' };

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

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

interface PaymentProviderProps {
  children: React.ReactNode;
}

export function PaymentProvider({ children }: PaymentProviderProps) {
  const [state, dispatch] = useReducer(paymentReducer, initialState);
  const notify = useNotify();

  useEffect(() => {
    const validation = getCurrentConfigValidation();
    if (!validation.isValid && process.env.NODE_ENV === 'production') {
      notify.error('Payment system configuration error');
    }
  }, [notify]);

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

      switch (response.paymentIntent.status) {
        case 'succeeded':
          dispatch({ type: 'SET_PROCESSING', payload: false });
          notify.success('Payment successful!');
          break;

        case 'processing':
          notify.info('Payment is being processed...');
          break;

        case 'requires_action':
          dispatch({ type: 'SET_PROCESSING', payload: false });
          notify.info('Additional authentication required');
          break;

        case 'failed': {
          dispatch({ type: 'SET_PROCESSING', payload: false });
          const errorMessage = response.paymentIntent.failureReason || 'Payment failed';
          notify.error(errorMessage);
          break;
        }

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

  useEffect(() => {
    if (state.currentPayment?.status === 'processing') {
      let pollErrorCount = 0;
      const MAX_POLL_ERRORS = 3;

      const pollInterval = setInterval(async () => {
        try {
          const paymentService = getPaymentService();
          const updatedPayment = await paymentService.getPaymentIntent(state.currentPayment!.id);
          pollErrorCount = 0;

          if (updatedPayment.status !== 'processing') {
            dispatch({ type: 'SET_CURRENT_PAYMENT', payload: updatedPayment });

            if (updatedPayment.status === 'succeeded') {
              notify.success('Payment completed successfully!');
              dispatch({ type: 'SET_PROCESSING', payload: false });
            } else if (updatedPayment.status === 'failed') {
              notify.error(updatedPayment.failureReason || 'Payment failed. Please try again.');
              dispatch({ type: 'SET_PROCESSING', payload: false });
            }

            clearInterval(pollInterval);
          }
        } catch {
          pollErrorCount += 1;
          if (pollErrorCount >= MAX_POLL_ERRORS) {
            clearInterval(pollInterval);
            dispatch({
              type: 'SET_ERROR',
              payload: {
                code: 'poll_failed',
                type: 'api_error',
                message: 'Unable to verify payment status. Please check your order history or contact support.',
              },
            });
            notify.error('Unable to verify payment status. Please check your order history or contact support.');
          }
        }
      }, 2000);

      const timeoutId = setTimeout(() => {
        clearInterval(pollInterval);
        if (state.currentPayment?.status === 'processing') {
          dispatch({
            type: 'SET_ERROR',
            payload: {
              code: 'poll_timeout',
              type: 'api_error',
              message: 'Payment verification timed out. Please check your order history to confirm payment status.',
            },
          });
          notify.error('Payment verification timed out. Please check your order history to confirm payment status.');
        }
      }, 5 * 60 * 1000);

      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeoutId);
      };
    }
  }, [state.currentPayment?.status, notify]);

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

export function usePayment(): PaymentContextType {
  const context = useContext(PaymentContext);
  
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  
  return context;
}

export function usePaymentReady(): boolean {
  const { config } = usePayment();
  const validation = getCurrentConfigValidation();
  return config !== null && validation.isValid;
}

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