import { useState, useEffect } from 'react';
import type { PaymentIntent, PaymentError } from '../../types/payment';
import type { CreateOrderRequest } from '../../types/api';
import { usePayment } from '../../contexts/PaymentContext';
import { PaymentForm } from './PaymentForm';
import { UPIQRCode } from './UPIQRCode';
import { formatPrice } from '../../utils/priceFormatter';
import { ordersAPI } from '../../services/api';
import { clearCart, getServiceById } from '../../utils/adminDataManager';

const IS_BACKEND_MODE = (import.meta.env.VITE_PAYMENT_PROVIDER ?? 'mock') === 'razorpay';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
const MERCHANT_UPI_ID = import.meta.env.VITE_MERCHANT_UPI_ID || 'happyhomes@upi';
const MERCHANT_NAME = import.meta.env.VITE_MERCHANT_NAME || 'Happy Homes Services';
const API_BASE = import.meta.env.VITE_API_URL || 'https://happyhomesworld.com';

// Razorpay type declarations
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface CheckoutPaymentProps {
  cart: any;
  selectedAddress: any;
  customerNotes: string;
  selectedDate?: string;
  selectedTimeSlot?: string;
  user: any;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  updateCartCount?: () => void;
}

type Step = 'payment' | 'upi-qr' | 'processing';

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as any;
    if (typeof e.message === 'string' && e.message) return e.message;
    if (typeof e.error === 'string' && e.error) return e.error;
  }
  if (typeof error === 'string' && error) return error;
  return 'An unexpected error occurred. Please try again.';
}

export function CheckoutPayment({
  cart,
  selectedAddress,
  customerNotes,
  selectedDate,
  selectedTimeSlot,
  user,
  onSuccess,
  onError,
  updateCartCount,
}: CheckoutPaymentProps) {
  const [step, setStep] = useState<Step>('payment');
  const [orderData, setOrderData] = useState<CreateOrderRequest | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [payButtonDisabled, setPayButtonDisabled] = useState(false);
  const { resetPayment } = usePayment();

  const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

  const getValidCategoryId = async (categoryId: string | null, serviceId: string): Promise<string> => {
    if (categoryId) return categoryId;
    try {
      const service = await getServiceById(serviceId);
      return service?.category_id || '';
    } catch {
      return '';
    }
  };

  const getValidSubcategoryId = async (subcategoryId: string | null, serviceId: string): Promise<string> => {
    if (subcategoryId) return subcategoryId;
    try {
      const service = await getServiceById(serviceId);
      return service?.subcategory_id || '';
    } catch {
      return '';
    }
  };

  const prepareOrderData = async (): Promise<CreateOrderRequest> => {
    if (!cart?.items?.length) {
      throw new Error('Your cart is empty. Please add services before proceeding to payment.');
    }
    if (!selectedAddress) {
      throw new Error('Please select a delivery address before proceeding to payment.');
    }
    if (!cart.finalAmount || cart.finalAmount <= 0) {
      throw new Error('Invalid order amount. Please refresh and try again.');
    }

    const orderItems = await Promise.all(
      cart.items.map(async (cartItem: any) => ({
        service_id: cartItem.serviceId,
        service_name: cartItem.serviceName || 'Service',
        variant_id: cartItem.variantId || undefined,
        variant_name: cartItem.variantName || undefined,
        quantity: cartItem.quantity,
        unit_price: cartItem.discountedPrice || cartItem.basePrice,
        total_price: cartItem.totalPrice,
        category_id: await getValidCategoryId(cartItem.categoryId, cartItem.serviceId),
        subcategory_id: await getValidSubcategoryId(cartItem.subcategoryId, cartItem.serviceId),
        item_status: 'pending' as const,
        scheduled_date: selectedDate || undefined,
        scheduled_time_slot: selectedTimeSlot || undefined,
      }))
    );

    return {
      customer_id: user?.id || '',
      customer_name: user ? `${user.firstName} ${user.lastName}` : selectedAddress.fullName,
      customer_phone: user?.phone || selectedAddress.mobileNumber || '',
      customer_email: user?.email || '',
      service_address: {
        house_number: selectedAddress.houseNumber,
        area: selectedAddress.area,
        landmark: selectedAddress.landmark || '',
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
      },
      items: orderItems,
      total_amount: cart.subtotal,
      discount_amount: cart.discountAmount || 0,
      gst_amount: cart.gstAmount || 0,
      service_charge: cart.serviceChargeAmount || 0,
      final_amount: cart.finalAmount,
      priority: 'medium',
      notes: customerNotes
        ? `${customerNotes}\nOrder Number: ${orderId}`
        : `Order Number: ${orderId}`,
    };
  };

  useEffect(() => {
    (async () => {
      try {
        setIsInitializing(true);
        setInitError(null);
        const data = await prepareOrderData();
        setOrderData(data);
        setStep('payment');
      } catch (error) {
        const msg = extractErrorMessage(error);
        setInitError(msg);
        onError(msg);
      } finally {
        setIsInitializing(false);
      }
    })();
  }, []);

  const createOrderInBackend = async (payment: PaymentIntent): Promise<string> => {
    if (!orderData) {
      throw new Error('Order details are missing. Please go back and try again.');
    }

    const orderWithPayment = {
      ...orderData,
      notes: `${orderData.notes || ''}\nPayment ID: ${payment.id}, Method: ${payment.paymentMethod}, Provider: ${payment.provider}`.trim(),
    };

    const response = await ordersAPI.create(orderWithPayment);
    if (!response.success || !response.data) {
      throw new Error(
        response.error || 'Order could not be created after payment. Please contact support with your payment reference.'
      );
    }

    try {
      clearCart();
      updateCartCount?.();
    } catch {
      // Cart clear is non-critical — order is already confirmed
    }

    return response.data.order_number;
  };

  const handleRazorpayPayment = async (method: string) => {
    if (!orderData || payButtonDisabled) return;
    setPayButtonDisabled(true);

    try {
      const backendOrderResponse = await ordersAPI.create(orderData);
      if (!backendOrderResponse.success || !backendOrderResponse.data) {
        throw new Error(
          backendOrderResponse.error || 'Could not create your order. Please try again.'
        );
      }

      const backendOrder = backendOrderResponse.data;

      const razorpayOrderResponse = await fetch(`${API_BASE}/api/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          order_id: backendOrder.id,
          amount: cart.finalAmount,
          currency: 'INR',
        }),
      });

      if (!razorpayOrderResponse.ok) {
        const errorData = await razorpayOrderResponse.json();
        throw new Error(errorData.error || 'Failed to initialize payment. Please try again.');
      }

      const razorpayData = await razorpayOrderResponse.json();

      if (!razorpayData.success || !razorpayData.razorpay_order_id) {
        throw new Error('Failed to create payment order. Please try again.');
      }

      openRazorpayCheckout({
        razorpayOrderId: razorpayData.razorpay_order_id,
        amount: razorpayData.amount,
        backendOrderId: backendOrder.id,
        backendOrderNumber: backendOrder.order_number,
        customerName: razorpayData.customer?.name || user?.firstName || '',
        customerEmail: razorpayData.customer?.email || user?.email || '',
        customerPhone: razorpayData.customer?.phone || user?.phone || '',
        preferedMethod: method,
      });

    } catch (error) {
      setStep('payment');
      setPayButtonDisabled(false);
      onError(extractErrorMessage(error));
    }
  };

  const openRazorpayCheckout = ({
    razorpayOrderId,
    amount,
    backendOrderId,
    backendOrderNumber,
    customerName,
    customerEmail,
    customerPhone,
    preferedMethod,
  }: {
    razorpayOrderId: string;
    amount: number;
    backendOrderId: string;
    backendOrderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    preferedMethod: string;
  }) => {
    if (!window.Razorpay) {
      onError('Payment system not loaded. Please refresh the page and try again.');
      setPayButtonDisabled(false);
      return;
    }

    const options: RazorpayOptions = {
      key: RAZORPAY_KEY_ID,
      amount: amount,
      currency: 'INR',
      name: MERCHANT_NAME,
      description: `Order #${backendOrderNumber}`,
      order_id: razorpayOrderId,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      notes: {
        order_id: backendOrderId,
        order_number: backendOrderNumber,
        preferred_method: preferedMethod,
      },
      theme: {
        color: '#ea580c',
      },
      handler: async (response: RazorpayResponse) => {
        await handleRazorpaySuccess(response, backendOrderId, backendOrderNumber);
      },
      modal: {
        ondismiss: () => {
          setPayButtonDisabled(false);
          setStep('payment');
        },
      },
    };

    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  };

  const handleRazorpaySuccess = async (
    response: RazorpayResponse,
    backendOrderId: string,
    backendOrderNumber: string
  ) => {
    setStep('processing');

    try {
      const verifyResponse = await fetch(`${API_BASE}/api/razorpay/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          order_id: backendOrderId,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed. Please contact support.');
      }

      try {
        clearCart();
        updateCartCount?.();
      } catch {
        // Cart clear is non-critical
      }

      onSuccess(backendOrderNumber);

    } catch (error) {
      setStep('payment');
      setPayButtonDisabled(false);
      onError(extractErrorMessage(error));
    }
  };

  const handleUPIVerify = async () => {
    if (!orderData) {
      onError('Order data is missing. Please go back and try again.');
      return;
    }
    setStep('processing');

    try {
      const upiPayment: PaymentIntent = {
        id: `upi_${Date.now()}`,
        amount: cart.finalAmount,
        currency: 'INR',
        status: 'succeeded',
        provider: 'backend' as any,
        paymentMethod: 'upi',
        orderId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const orderNumber = await createOrderInBackend(upiPayment);
      onSuccess(orderNumber);
    } catch (error) {
      setStep('upi-qr');
      onError(extractErrorMessage(error));
    }
  };

  const handleMockPaymentSuccess = async (payment: PaymentIntent) => {
    setStep('processing');
    try {
      const orderNumber = await createOrderInBackend(payment);
      onSuccess(orderNumber);
    } catch (error) {
      setStep('payment');
      onError(extractErrorMessage(error));
    }
  };

  const handlePaymentError = (error: PaymentError) => {
    onError(error.message || 'Payment failed. Please try again.');
  };

  const handleBackToCheckout = () => {
    resetPayment();
    onError('Payment cancelled');
  };

  if (isInitializing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Preparing Your Order</h3>
          <p className="text-gray-600">Please wait while we prepare your payment options…</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">Could Not Load Payment</h3>
          <p className="text-gray-600 mb-6">{initError}</p>
          <button
            onClick={handleBackToCheckout}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Checkout
          </button>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirming Your Order</h3>
          <p className="text-gray-600">Please wait — do not close this page.</p>
        </div>
      </div>
    );
  }

  if (step === 'upi-qr') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4">
          <button
            onClick={() => setStep('payment')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Payment Methods
          </button>
        </div>
        <UPIQRCode
          merchantUpiId={MERCHANT_UPI_ID}
          merchantName={MERCHANT_NAME}
          amount={cart.finalAmount}
          orderId={orderId}
          onVerify={handleUPIVerify}
        />
      </div>
    );
  }

  if (IS_BACKEND_MODE) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4">
          <button
            onClick={handleBackToCheckout}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Checkout
          </button>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-1">Choose Payment Method</h3>
        <p className="text-sm text-gray-500 mb-5">All payments secured by Razorpay</p>

        <div className="text-center mb-5">
          <p className="text-2xl font-bold text-gray-900">{formatPrice(cart.finalAmount)}</p>
        </div>

        <div className="space-y-3">
          {[
            { id: 'card', label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, RuPay, Amex' },
            { id: 'upi', label: 'UPI / QR Code', icon: '📱', desc: 'PhonePe, GPay, Paytm, BHIM — scan & pay instantly' },
            { id: 'netbanking', label: 'Net Banking', icon: '🏦', desc: '50+ banks supported' },
            { id: 'wallet', label: 'Digital Wallet', icon: '👛', desc: 'Paytm, MobiKwik, Amazon Pay' },
            { id: 'emi', label: 'EMI', icon: '📅', desc: 'Credit card & cardless EMI options' },
          ].map(({ id, label, icon, desc }) => (
            <button
              key={id}
              onClick={() => setSelectedPaymentMethod(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                selectedPaymentMethod === id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              {selectedPaymentMethod === id && (
                <span className="ml-auto text-orange-500">●</span>
              )}
            </button>
          ))}
        </div>

        <button
          disabled={payButtonDisabled}
          onClick={() => {
            if (selectedPaymentMethod === 'upi') {
              setStep('upi-qr');
            } else {
              handleRazorpayPayment(selectedPaymentMethod);
            }
          }}
          className="mt-5 w-full py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {payButtonDisabled ? 'Processing…' : `Pay ${formatPrice(cart.finalAmount)} →`}
        </button>

        <p className="mt-3 text-center text-xs text-gray-400">
          🔒 Bank-grade encryption · 3D Secure · Fraud Protection
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <button
          onClick={handleBackToCheckout}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Checkout
        </button>
      </div>
      <PaymentForm
        amount={cart.finalAmount}
        currency="INR"
        orderId={orderId}
        onSuccess={handleMockPaymentSuccess}
        onError={handlePaymentError}
        onCancel={handleBackToCheckout}
        allowedMethods={['card', 'upi', 'wallet', 'netbanking', 'cash_on_delivery']}
        showSavedCards={true}
        collectBilling={true}
        theme="light"
      />
    </div>
  );
}
