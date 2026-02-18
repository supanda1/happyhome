/**
 * Payment Status Component
 * 
 * Displays payment progress, results, and handles different payment states.
 * Shows appropriate UI for processing, success, failure, and action-required states.
 */

import React from 'react';
import type { PaymentStatusProps, PaymentStatus } from '../../types/payment';

export function PaymentStatus({
  payment,
  showDetails = false,
  onRetry,
  onGoBack,
}: PaymentStatusProps) {
  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: '⏳',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Payment Initiated',
          description: 'Your payment has been initiated and is being processed.',
          spinning: true,
        };

      case 'processing':
        return {
          icon: '🔄',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'Processing Payment',
          description: 'Please wait while we process your payment. This may take a few moments.',
          spinning: true,
        };

      case 'requires_action':
        return {
          icon: '🔐',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          title: 'Authentication Required',
          description: 'Please complete the authentication process to proceed with your payment.',
          spinning: false,
        };

      case 'succeeded':
        return {
          icon: '✅',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Payment Successful!',
          description: 'Your payment has been completed successfully.',
          spinning: false,
        };

      case 'failed':
        return {
          icon: '❌',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Payment Failed',
          description: payment.failureReason || 'Something went wrong with your payment.',
          spinning: false,
        };

      case 'cancelled':
        return {
          icon: '🚫',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'Payment Cancelled',
          description: 'You have cancelled the payment.',
          spinning: false,
        };

      case 'refunded':
        return {
          icon: '💰',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          title: 'Payment Refunded',
          description: 'Your payment has been refunded.',
          spinning: false,
        };

      default:
        return {
          icon: '❓',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'Unknown Status',
          description: 'Payment status is unknown.',
          spinning: false,
        };
    }
  };

  const statusConfig = getStatusConfig(payment.status);

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatAmount = () => {
    const symbol = payment.currency === 'INR' ? '₹' : '$';
    return `${symbol}${payment.amount}`;
  };

  const getPaymentMethodDisplay = () => {
    if (!payment.paymentMethod) return 'Not specified';
    
    const methodNames: Record<string, string> = {
      card: 'Credit/Debit Card',
      upi: 'UPI',
      netbanking: 'Net Banking',
      wallet: 'Digital Wallet',
      emi: 'EMI',
      cash_on_delivery: 'Cash on Delivery',
      bank_transfer: 'Bank Transfer',
    };

    return methodNames[payment.paymentMethod] || payment.paymentMethod;
  };

  return (
    <div className={`p-6 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
      {/* Status Header */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${statusConfig.bgColor} ${statusConfig.borderColor} border-2 mb-4`}>
          <span className={`text-2xl ${statusConfig.spinning ? 'animate-spin' : ''}`}>
            {statusConfig.icon}
          </span>
        </div>
        
        <h3 className={`text-xl font-semibold ${statusConfig.color} mb-2`}>
          {statusConfig.title}
        </h3>
        
        <p className="text-gray-600 max-w-md mx-auto">
          {statusConfig.description}
        </p>
      </div>

      {/* Payment Amount */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-gray-900">
          {formatAmount()}
        </div>
        <div className="text-sm text-gray-500">
          Transaction ID: {payment.id}
        </div>
      </div>

      {/* Payment Details */}
      {showDetails && (
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Payment Details</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Order ID:</span>
              <div className="font-medium">{payment.orderId}</div>
            </div>
            
            <div>
              <span className="text-gray-600">Payment Method:</span>
              <div className="font-medium">{getPaymentMethodDisplay()}</div>
            </div>
            
            <div>
              <span className="text-gray-600">Amount:</span>
              <div className="font-medium">{formatAmount()}</div>
            </div>
            
            <div>
              <span className="text-gray-600">Currency:</span>
              <div className="font-medium">{payment.currency}</div>
            </div>
            
            <div>
              <span className="text-gray-600">Created:</span>
              <div className="font-medium">{formatDateTime(payment.createdAt)}</div>
            </div>
            
            <div>
              <span className="text-gray-600">Updated:</span>
              <div className="font-medium">{formatDateTime(payment.updatedAt)}</div>
            </div>

            {payment.providerTransactionId && (
              <div className="sm:col-span-2">
                <span className="text-gray-600">Provider Transaction ID:</span>
                <div className="font-medium font-mono text-xs break-all">
                  {payment.providerTransactionId}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Failure Details */}
      {payment.status === 'failed' && payment.failureCode && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-red-900 mb-2">Failure Details</h4>
          <div className="text-sm text-red-700">
            <div><strong>Code:</strong> {payment.failureCode}</div>
            {payment.failureReason && (
              <div><strong>Reason:</strong> {payment.failureReason}</div>
            )}
          </div>
        </div>
      )}

      {/* Action Required */}
      {payment.status === 'requires_action' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-purple-900 mb-2">Action Required</h4>
          <div className="text-sm text-purple-700 space-y-2">
            <p>Additional authentication is required to complete your payment.</p>
            
            {payment.paymentMethod === 'card' && (
              <div className="flex items-center space-x-2">
                <span className="text-purple-600">🔐</span>
                <span>Complete 3D Secure authentication</span>
              </div>
            )}
            
            {payment.paymentMethod === 'upi' && (
              <div className="flex items-center space-x-2">
                <span className="text-purple-600">📱</span>
                <span>Approve the payment in your UPI app</span>
              </div>
            )}
            
            {payment.paymentMethod === 'netbanking' && (
              <div className="flex items-center space-x-2">
                <span className="text-purple-600">🏦</span>
                <span>Complete login and payment on your bank's website</span>
              </div>
            )}
            
            {payment.paymentMethod === 'wallet' && (
              <div className="flex items-center space-x-2">
                <span className="text-purple-600">💰</span>
                <span>Authorize the payment in your wallet app</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Processing Status */}
      {(payment.status === 'processing' || payment.status === 'pending') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 font-medium">
              {payment.status === 'processing' 
                ? 'Processing your payment...' 
                : 'Waiting for payment confirmation...'
              }
            </span>
          </div>
          <div className="text-sm text-blue-600 text-center mt-2">
            This usually takes 1-2 minutes. Please don't refresh this page.
          </div>
        </div>
      )}

      {/* Success Message */}
      {payment.status === 'succeeded' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="text-green-700 font-medium mb-2">
              🎉 Payment completed successfully!
            </div>
            <div className="text-sm text-green-600">
              You will receive a confirmation email shortly.
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {/* Retry button for failed payments */}
        {payment.status === 'failed' && onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        )}

        {/* Back button */}
        {onGoBack && (payment.status === 'failed' || payment.status === 'cancelled') && (
          <button
            onClick={onGoBack}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Change Payment Method
          </button>
        )}

        {/* Continue/Done button for successful payments */}
        {payment.status === 'succeeded' && (
          <button
            onClick={() => window.location.href = '/orders'}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            View Order
          </button>
        )}
      </div>

      {/* Additional Help */}
      {(payment.status === 'failed' || payment.status === 'requires_action') && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <div className="text-sm text-gray-600">
            Need help? Contact our{' '}
            <a href="/support" className="text-blue-600 hover:text-blue-700 underline">
              customer support
            </a>
          </div>
        </div>
      )}
    </div>
  );
}