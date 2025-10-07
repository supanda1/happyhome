/**
 * Checkout Payment Integration Component
 * 
 * Integrates the payment system with the existing checkout flow.
 * Replaces the simple "Pay" button with the full payment gateway.
 */

import { useState, useEffect } from 'react';
import type { PaymentIntent, PaymentError } from '../../types/payment';
import type { CreateOrderRequest } from '../../types/api';
import { usePayment } from '../../contexts/PaymentContext';
import { PaymentForm } from './PaymentForm';
import { ordersAPI, handleAPIError } from '../../services/api';
import { clearCart, getServiceById } from '../../utils/adminDataManager';

interface CheckoutPaymentProps {
  cart: any; // Cart data from adminDataManager
  selectedAddress: any; // Address data
  customerNotes: string;
  selectedDate?: string;
  selectedTimeSlot?: string;
  user: any; // User from auth context
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  updateCartCount?: () => void;
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
  const [step, setStep] = useState<'summary' | 'payment' | 'processing'>('payment');
  const [orderData, setOrderData] = useState<CreateOrderRequest | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { resetPayment } = usePayment();

  // Generate unique order ID
  const generateOrderId = () => {
    return `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
  };

  const orderId = generateOrderId();

  // Helper functions to ensure valid IDs from service data
  const getValidServiceId = async (serviceId: string) => serviceId;
  
  const getValidCategoryId = async (categoryId: string | null, serviceId: string): Promise<string> => {
    if (categoryId) return categoryId;
    // If categoryId is missing, fetch from service
    try {
      const service = await getServiceById(serviceId);
      return service?.category_id || '';
    } catch {
      return '';
    }
  };
  
  const getValidSubcategoryId = async (subcategoryId: string | null, serviceId: string): Promise<string> => {
    if (subcategoryId) return subcategoryId;
    // If subcategoryId is missing, fetch from service
    try {
      const service = await getServiceById(serviceId);
      return service?.subcategory_id || '';
    } catch {
      return '';
    }
  };

  const prepareOrderData = async (): Promise<CreateOrderRequest> => {
    // Create order items from cart items with proper field mapping
    const orderItems = await Promise.all(cart.items.map(async (cartItem: any) => ({
      service_id: await getValidServiceId(cartItem.serviceId),
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
    })));

    const orderData: CreateOrderRequest = {
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
        pincode: selectedAddress.pincode
      },
      items: orderItems,
      total_amount: cart.subtotal,
      discount_amount: cart.discountAmount || 0,
      gst_amount: cart.gstAmount || 0,
      service_charge: cart.serviceChargeAmount || 0,
      final_amount: cart.finalAmount,
      priority: 'medium',
      notes: customerNotes ? `${customerNotes}\nOrder Number: ${orderId}` : `Order Number: ${orderId}`,
    };

    return orderData;
  };

  // Prepare order data immediately when component mounts
  useEffect(() => {
    const initializeOrderData = async () => {
      try {
        setIsInitializing(true);
        const orderData = await prepareOrderData();
        setOrderData(orderData);
        setStep('payment'); // Ensure we're in payment mode after initialization
      } catch (error) {
        console.error('Error preparing order data:', error);
        onError('Failed to prepare order data');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeOrderData();
  }, []); // Empty dependency array to run only once on mount

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Preparing Your Order</h3>
          <p className="text-gray-600">
            Please wait while we prepare your payment options...
          </p>
        </div>
      </div>
    );
  }

  const handlePaymentSuccess = async (payment: PaymentIntent) => {
    try {
      setStep('processing');

      if (!orderData) {
        throw new Error('Order data not prepared');
      }

      // Create the order in the backend
      // Create order with payment information in notes since API doesn't have payment fields yet
      const orderWithPayment = {
        ...orderData,
        notes: `${orderData.notes || ''}\nPayment ID: ${payment.id}, Method: ${payment.paymentMethod}, Provider: ${payment.provider}`.trim()
      };
      
      const response = await ordersAPI.create(orderWithPayment);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create order');
      }

      const createdOrder = response.data;

      // Clear cart after successful order creation
      clearCart();
      updateCartCount?.();

      // Immediately notify parent of success so it can show the success page
      onSuccess(createdOrder.order_number);

    } catch (error) {
      console.error('Order creation failed after payment:', error);
      const errorMessage = handleAPIError(error);
      onError(`Payment successful but order creation failed: ${errorMessage}`);
    }
  };

  const handlePaymentError = (error: PaymentError) => {
    console.error('Payment failed:', error);
    onError(error.message);
    // Stay on payment step to allow retry
  };

  const handleBackToCheckout = () => {
    resetPayment();
    // This will be handled by parent component to go back to checkout
    onError('Payment cancelled'); // This triggers going back to checkout
  };

  if (step === 'payment') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Back Button */}
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

        {/* Payment Form */}
        <PaymentForm
          amount={cart.finalAmount}
          currency="INR"
          orderId={orderId}
          onSuccess={handlePaymentSuccess}
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

  if (step === 'processing') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Your Order</h3>
          <p className="text-gray-600">
            Please wait while we create your order and confirm your payment...
          </p>
          <div className="mt-4 text-sm text-gray-500">
            This usually takes just a few moments
          </div>
        </div>
      </div>
    );
  }


  return null;
}