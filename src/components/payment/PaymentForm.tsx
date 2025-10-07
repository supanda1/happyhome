/**
 * Main Payment Form Component
 * 
 * Orchestrates the complete payment flow including method selection,
 * form handling, and payment processing.
 */

import { useState, useEffect, useCallback } from 'react';
import type { PaymentFormProps, PaymentMethod, PaymentMethodDetails } from '../../types/payment';
import { usePayment } from '../../contexts/PaymentContext';
import { getSupportedMethods } from '../../config/payment.config';

// Import payment components
import { PaymentMethodSelector } from './PaymentMethodSelector';
import {
  CardPaymentForm,
  UPIPaymentForm,
  WalletPaymentForm,
  NetBankingPaymentForm,
  CashOnDeliveryForm,
} from './PaymentMethodForms';
import { PaymentStatus } from './PaymentStatus';

export function PaymentForm({
  amount,
  currency,
  orderId,
  onSuccess,
  onError,
  onCancel,
  allowedMethods,
  showSavedCards = true,
  collectBilling = true,
  theme = 'light',
  className = '',
}: PaymentFormProps) {
  const {
    currentPayment,
    isProcessing,
    error,
    initializePayment,
    confirmPayment,
    clearError,
    resetPayment,
  } = usePayment();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [step, setStep] = useState<'select' | 'form' | 'processing' | 'result'>('select');
  const [autoSelectProcessed, setAutoSelectProcessed] = useState(false);

  // Get available payment methods
  const supportedMethods = getSupportedMethods();
  const availableMethods = allowedMethods 
    ? allowedMethods.filter(method => supportedMethods.includes(method))
    : supportedMethods;

  // Initialize payment when method is selected
  const handleMethodSelect = useCallback(async (method: PaymentMethod) => {
    setSelectedMethod(method);
    
    try {
      await initializePayment({
        amount,
        currency,
        orderId,
        paymentMethod: method,
        description: `Payment for order ${orderId}`,
      });
      
      setStep('form');
    } catch (err) {
      console.error('Failed to initialize payment:', err);
    }
  }, [amount, currency, orderId, initializePayment]);

  // Reset form when component mounts
  useEffect(() => {
    resetPayment();
    setStep('select');
    setSelectedMethod(null);
    setAutoSelectProcessed(false);
  }, [resetPayment]);

  // Auto-select the first payment method to skip selection step
  useEffect(() => {
    if (availableMethods.length > 0 && !selectedMethod && !autoSelectProcessed) {
      setAutoSelectProcessed(true);
      
      // Priority order: upi, card, cash_on_delivery, others
      const priorityOrder = ['upi', 'card', 'cash_on_delivery'];
      const preferredMethod = priorityOrder.find(method => 
        availableMethods.includes(method as PaymentMethod)
      ) || availableMethods[0];
      
      // Auto-select the preferred method
      handleMethodSelect(preferredMethod as PaymentMethod);
    }
  }, [availableMethods, selectedMethod, autoSelectProcessed, handleMethodSelect]);

  // Handle payment state changes
  useEffect(() => {
    if (currentPayment) {
      switch (currentPayment.status) {
        case 'succeeded':
          setStep('result');
          onSuccess(currentPayment);
          break;
        case 'failed':
          setStep('result');
          if (currentPayment.failureReason) {
            onError({
              code: currentPayment.failureCode || 'payment_failed',
              type: 'card_error',
              message: currentPayment.failureReason,
            });
          }
          break;
        case 'requires_action':
          setStep('processing');
          break;
        case 'processing':
          setStep('processing');
          break;
      }
    }

    if (error) {
      setStep('form');
      onError(error);
    }
  }, [currentPayment, error, onSuccess, onError]);

  // Handle payment method form submission
  const handlePaymentSubmit = async (paymentMethod: PaymentMethodDetails, billingDetails?: any) => {
    if (!currentPayment) {
      onError({
        code: 'no_payment_intent',
        type: 'api_error',
        message: 'No payment initialized',
      });
      return;
    }

    try {
      setStep('processing');
      
      await confirmPayment({
        paymentIntentId: currentPayment.id,
        paymentMethod,
        billingDetails,
      });
    } catch (err) {
      setStep('form');
      console.error('Payment confirmation failed:', err);
    }
  };

  // Handle Cash on Delivery
  const handleCODSubmit = () => {
    // For COD, we create a "fake" payment method and mark it as succeeded
    const codPaymentMethod: PaymentMethodDetails = {
      type: 'cash_on_delivery' as any,
    };
    
    handlePaymentSubmit(codPaymentMethod);
  };

  // Handle back to method selection
  const handleBackToSelection = () => {
    clearError();
    setSelectedMethod(null);
    setStep('select');
    resetPayment();
  };

  // Handle cancel
  const handleCancel = () => {
    resetPayment();
    setSelectedMethod(null);
    setStep('select');
    onCancel?.();
  };

  // Render payment method form based on selection
  const renderPaymentMethodForm = () => {
    if (!selectedMethod) return null;

    const commonProps = {
      isLoading: isProcessing,
    };

    switch (selectedMethod) {
      case 'card':
        return (
          <CardPaymentForm
            {...commonProps}
            onSubmit={handlePaymentSubmit}
          />
        );

      case 'upi':
        return (
          <UPIPaymentForm
            {...commonProps}
            onSubmit={handlePaymentSubmit}
          />
        );

      case 'wallet':
        return (
          <WalletPaymentForm
            {...commonProps}
            onSubmit={handlePaymentSubmit}
          />
        );

      case 'netbanking':
        return (
          <NetBankingPaymentForm
            {...commonProps}
            onSubmit={handlePaymentSubmit}
          />
        );

      case 'cash_on_delivery':
        return (
          <CashOnDeliveryForm
            {...commonProps}
            amount={amount}
            onSubmit={handleCODSubmit}
          />
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            Payment method not yet implemented
          </div>
        );
    }
  };

  return (
    <div className={`payment-form ${theme} ${className}`}>
      {/* Payment Header */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Complete Payment
            </h3>
            <p className="text-sm text-gray-600">
              Order #{orderId}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {currency === 'INR' ? '₹' : '$'}{amount}
            </div>
            <div className="text-sm text-gray-600">
              {currency}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-red-800">
                Payment Error
              </h4>
              <p className="text-sm text-red-700">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      {step === 'select' && (
        <div>
          <PaymentMethodSelector
            availableMethods={availableMethods}
            selectedMethod={selectedMethod}
            onMethodSelect={handleMethodSelect}
            disabled={isProcessing}
          />
        </div>
      )}

      {step === 'form' && selectedMethod && (
        <div>
          {/* Payment Method Selector - Always visible for easy switching */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {availableMethods.map((method) => {
                const methodInfo = {
                  card: { name: 'Credit/Debit Card', icon: '💳', description: 'Visa, MasterCard, RuPay' },
                  upi: { name: 'UPI Payment', icon: '📱', description: 'GPay, PhonePe, Paytm UPI' },
                  netbanking: { name: 'Net Banking', icon: '🏦', description: 'Direct bank transfer' },
                  wallet: { name: 'Digital Wallet', icon: '💰', description: 'Paytm, PhonePe, Amazon Pay' },
                  cash_on_delivery: { name: 'Cash on Delivery', icon: '💵', description: 'Pay when service is delivered' },
                  bank_transfer: { name: 'Bank Transfer', icon: '🏧', description: 'Direct account transfer' },
                  emi: { name: 'EMI Options', icon: '📊', description: 'Easy monthly installments' },
                }[method] || { name: method, icon: '💳', description: 'Payment method' };

                const isSelected = selectedMethod === method;
                
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => handleMethodSelect(method)}
                    disabled={isProcessing}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all duration-300 transform hover:scale-102 text-left
                      ${isSelected 
                        ? 'bg-gradient-to-br from-purple-200 via-blue-200 to-indigo-300 border-purple-300 ring-1 ring-purple-200 shadow-md' 
                        : 'border-purple-200 hover:border-purple-300 bg-gradient-to-br from-white to-purple-50 shadow-sm hover:shadow-md'
                      }
                      ${isProcessing 
                        ? 'opacity-50 cursor-not-allowed transform-none' 
                        : ''
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl flex-shrink-0">
                        {methodInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent text-sm">
                              {methodInfo.name}
                            </div>
                            <div className="text-xs text-gray-600 leading-tight mt-1">
                              {methodInfo.description}
                            </div>
                          </div>
                          {/* Selection indicator */}
                          {isSelected && (
                            <div className="text-purple-600 ml-2">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment form */}
          {renderPaymentMethodForm()}

          {/* Cancel button */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              disabled={isProcessing}
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}

      {(step === 'processing' || step === 'result') && currentPayment && (
        <PaymentStatus
          payment={currentPayment}
          showDetails={true}
          onRetry={() => setStep('form')}
          onGoBack={handleBackToSelection}
        />
      )}

      {/* Security Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>PCI DSS Compliant</span>
          </div>
          <div className="flex items-center">
            <span>🛡️</span>
            <span className="ml-1">Bank Level Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}