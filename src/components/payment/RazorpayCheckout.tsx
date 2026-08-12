import { useCallback, useEffect, useState } from 'react';
import type { RazorpayOptions, RazorpaySuccessResponse, RazorpayError } from '../../types/razorpay';
import type { PaymentIntent } from '../../types/payment';
import { razorpayPaymentService } from '../../services/payment/razorpayPaymentService';
import { formatPrice } from '../../utils/priceFormatter';

interface RazorpayCheckoutProps {
  amount: number;
  currency?: string;
  orderId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  notes?: Record<string, string>;
  onSuccess: (payment: PaymentIntent, response: RazorpaySuccessResponse) => void;
  onError: (error: RazorpayError | Error) => void;
  onCancel?: () => void;
  autoOpen?: boolean;
  buttonText?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

type CheckoutState = 'idle' | 'creating_order' | 'checkout_open' | 'verifying' | 'success' | 'error';

export function RazorpayCheckout({
  amount,
  currency = 'INR',
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  description = 'Payment for Happy Homes Services',
  notes,
  onSuccess,
  onError,
  onCancel,
  autoOpen = false,
  buttonText,
  buttonClassName,
  disabled = false,
}: RazorpayCheckoutProps) {
  const [state, setState] = useState<CheckoutState>('idle');
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const keyId = razorpayPaymentService.getKeyId();

  const isRazorpayLoaded = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.Razorpay !== 'undefined';
  }, []);

  const createOrder = useCallback(async () => {
    if (!isRazorpayLoaded()) {
      const error = new Error('Razorpay SDK not loaded. Please refresh the page.');
      setErrorMessage(error.message);
      onError(error);
      return null;
    }

    setState('creating_order');
    setErrorMessage(null);

    try {
      const response = await razorpayPaymentService.createPaymentIntent({
        amount,
        currency: currency as 'INR',
        orderId,
        customerEmail,
        customerPhone,
        metadata: notes,
      });

      const rzpOrderId = response.paymentIntent.providerTransactionId || response.clientSecret;
      if (!rzpOrderId) {
        throw new Error('Failed to create Razorpay order');
      }

      setRazorpayOrderId(rzpOrderId);
      return rzpOrderId;
    } catch (error) {
      setState('error');
      const err = error instanceof Error ? error : new Error('Failed to create order');
      setErrorMessage(err.message);
      onError(err);
      return null;
    }
  }, [amount, currency, orderId, customerEmail, customerPhone, notes, onError, isRazorpayLoaded]);

  const openCheckout = useCallback(async (rzpOrderId?: string) => {
    const orderIdToUse = rzpOrderId || razorpayOrderId;

    if (!orderIdToUse) {
      const createdOrderId = await createOrder();
      if (!createdOrderId) return;
      openCheckout(createdOrderId);
      return;
    }

    if (!isRazorpayLoaded()) {
      const error = new Error('Razorpay SDK not loaded');
      onError(error);
      return;
    }

    setState('checkout_open');

    const options: RazorpayOptions = {
      key: keyId,
      amount: amount * 100,
      currency,
      name: 'Happy Homes Services',
      description,
      order_id: orderIdToUse,
      image: '/logo.png',
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      notes: {
        order_id: orderId,
        ...notes,
      },
      theme: {
        color: '#EA580C',
      },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          setState('idle');
          onCancel?.();
        },
      },
      handler: async (response: RazorpaySuccessResponse) => {
        setState('verifying');

        try {
          const verifyResponse = await razorpayPaymentService.confirmPayment({
            paymentIntentId: response.razorpay_order_id,
            paymentMethod: response as unknown as any,
          });

          if (verifyResponse.paymentIntent.status === 'succeeded') {
            setState('success');
            onSuccess(verifyResponse.paymentIntent, response);
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (error) {
          setState('error');
          const err = error instanceof Error ? error : new Error('Payment verification failed');
          setErrorMessage(err.message);
          onError(err);
        }
      },
    };

    try {
      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', (response: { error: RazorpayError }) => {
        setState('error');
        setErrorMessage(response.error.description);
        onError(response.error);
      });

      razorpay.open();
    } catch (error) {
      setState('error');
      const err = error instanceof Error ? error : new Error('Failed to open Razorpay checkout');
      setErrorMessage(err.message);
      onError(err);
    }
  }, [
    razorpayOrderId,
    createOrder,
    isRazorpayLoaded,
    keyId,
    amount,
    currency,
    description,
    customerName,
    customerEmail,
    customerPhone,
    orderId,
    notes,
    onCancel,
    onSuccess,
    onError,
  ]);

  useEffect(() => {
    if (autoOpen && state === 'idle') {
      openCheckout();
    }
  }, [autoOpen, state, openCheckout]);

  const handleClick = () => {
    if (state === 'idle' || state === 'error') {
      openCheckout();
    }
  };

  const getButtonText = () => {
    if (buttonText) return buttonText;

    switch (state) {
      case 'creating_order':
        return 'Creating Order...';
      case 'checkout_open':
        return 'Complete Payment...';
      case 'verifying':
        return 'Verifying Payment...';
      case 'success':
        return 'Payment Successful!';
      case 'error':
        return 'Retry Payment';
      default:
        return `Pay ${formatPrice(amount)}`;
    }
  };

  const isButtonDisabled = disabled || state === 'creating_order' || state === 'verifying' || state === 'success';

  const defaultButtonClass = `
    w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200
    ${isButtonDisabled
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : state === 'error'
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'bg-orange-600 hover:bg-orange-700 text-white'
    }
  `;

  if (!keyId || keyId === 'rzp_test_...') {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          Razorpay is not configured. Please add VITE_RAZORPAY_KEY_ID to your environment.
        </p>
      </div>
    );
  }

  return (
    <div className="razorpay-checkout">
      {errorMessage && state === 'error' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        onClick={handleClick}
        disabled={isButtonDisabled}
        className={buttonClassName || defaultButtonClass}
      >
        {(state === 'creating_order' || state === 'verifying') && (
          <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {getButtonText()}
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        🔒 Secured by Razorpay · PCI DSS Compliant
      </p>
    </div>
  );
}

export default RazorpayCheckout;
