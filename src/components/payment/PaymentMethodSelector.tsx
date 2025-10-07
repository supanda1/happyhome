/**
 * Payment Method Selector Component
 * 
 * Allows users to choose from available payment methods.
 * Displays payment method icons and handles selection.
 */

import type { PaymentMethodSelectorProps, PaymentMethod } from '../../types/payment';

interface PaymentMethodInfo {
  type: PaymentMethod;
  name: string;
  icon: string;
  description: string;
  popular?: boolean;
}

const PAYMENT_METHOD_INFO: Record<PaymentMethod, PaymentMethodInfo> = {
  card: {
    type: 'card',
    name: 'Card',
    icon: '💳',
    description: 'Credit/Debit Cards',
    popular: true,
  },
  upi: {
    type: 'upi',
    name: 'UPI',
    icon: '📱',
    description: 'Pay with UPI ID',
    popular: true,
  },
  netbanking: {
    type: 'netbanking',
    name: 'Net Banking',
    icon: '🏦',
    description: 'Direct bank transfer',
  },
  wallet: {
    type: 'wallet',
    name: 'Wallet',
    icon: '💰',
    description: 'Digital wallets',
  },
  emi: {
    type: 'emi',
    name: 'EMI',
    icon: '📊',
    description: 'Easy monthly installments',
  },
  cash_on_delivery: {
    type: 'cash_on_delivery',
    name: 'Cash on Delivery',
    icon: '💵',
    description: 'Pay when service is delivered',
  },
  bank_transfer: {
    type: 'bank_transfer',
    name: 'Bank Transfer',
    icon: '🏧',
    description: 'Direct bank account transfer',
  },
};

export function PaymentMethodSelector({
  availableMethods,
  selectedMethod,
  onMethodSelect,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const handleMethodClick = (method: PaymentMethod) => {
    if (!disabled) {
      onMethodSelect(method);
    }
  };

  // Sort methods by popularity and alphabetically
  const sortedMethods = [...availableMethods].sort((a, b) => {
    const aInfo = PAYMENT_METHOD_INFO[a];
    const bInfo = PAYMENT_METHOD_INFO[b];
    
    // Popular methods first
    if (aInfo.popular && !bInfo.popular) return -1;
    if (!aInfo.popular && bInfo.popular) return 1;
    
    // Then alphabetically
    return aInfo.name.localeCompare(bInfo.name);
  });

  if (availableMethods.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
        No payment methods available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">
        Select Payment Method
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedMethods.map((method) => {
          const methodInfo = PAYMENT_METHOD_INFO[method];
          const isSelected = selectedMethod === method;
          
          return (
            <button
              key={method}
              type="button"
              onClick={() => handleMethodClick(method)}
              disabled={disabled}
              className={`
                relative p-4 border-2 rounded-lg text-left transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
                ${disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              {/* Popular badge */}
              {methodInfo.popular && (
                <div className="absolute -top-2 -right-2">
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    Popular
                  </span>
                </div>
              )}
              
              {/* Method icon and info */}
              <div className="flex items-start space-x-3">
                <div className="text-2xl flex-shrink-0">
                  {methodInfo.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900">
                      {methodInfo.name}
                    </h4>
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="text-blue-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {methodInfo.description}
                  </p>
                </div>
              </div>
              
              {/* Method-specific indicators */}
              {method === 'card' && (
                <div className="flex space-x-1 mt-2">
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded">Visa</div>
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded">MC</div>
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded">RuPay</div>
                </div>
              )}
              
              {method === 'upi' && (
                <div className="flex space-x-1 mt-2">
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded">GPay</div>
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded">PhonePe</div>
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded">Paytm</div>
                </div>
              )}
              
              {method === 'wallet' && (
                <div className="flex space-x-1 mt-2">
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded">Paytm</div>
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded">PhonePe</div>
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded">Amazon Pay</div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Help text */}
      <div className="text-sm text-gray-500 mt-4">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Your payment information is secure and encrypted</span>
        </div>
      </div>
    </div>
  );
}