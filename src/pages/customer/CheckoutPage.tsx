import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getCart, 
  applyCouponToCart, 
  removeCouponFromCart, 
  getActiveCoupons,
  getUserAddresses,
  getDefaultUserAddress,
  getContactSettings,
  type Cart,
  type UserAddress,
  type ContactSettings,
  type Coupon
} from '../../utils/adminDataManager';
import { formatPrice } from '../../utils/priceFormatter';
import WhatsAppButton from '../../components/ui/WhatsAppButton';
import { CheckoutPayment } from '../../components/payment';


interface CheckoutPageProps {
  navigateHome?: () => void;
  navigateToCart?: () => void;
  navigateToLogin?: () => void;
  navigateToAddAddress?: () => void;
  navigateToMyBookings?: () => void;
  updateCartCount?: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ 
  navigateHome = () => window.location.href = '/', 
  navigateToCart = () => window.location.href = '/#cart',
  navigateToLogin = () => window.location.href = '/#login',
  navigateToAddAddress = () => window.location.href = '/#add-address',
  navigateToMyBookings = () => window.location.href = '/#my-bookings',
  updateCartCount
}) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [showPayment, setShowPayment] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    amount: number;
  } | null>(null);
  
  const { user } = useAuth();

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showCouponDropdown, setShowCouponDropdown] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [contactSettings, setContactSettings] = useState<ContactSettings | null>(null);

  // Load addresses function (defined early to avoid hoisting issues)
  const loadAddresses = useCallback(async () => {
    try {
      const userAddresses = await getUserAddresses();
      setAddresses(userAddresses);
      
      // Auto-select default address if available (only if no address is currently selected)
      const defaultAddress = await getDefaultUserAddress();
      if (defaultAddress) {
        setSelectedAddress(prev => prev || defaultAddress.id);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  }, []); // Remove selectedAddress dependency to break the loop

  // Load cart, coupons, addresses, and time slots on component mount
  const initializeCheckout = useCallback(async () => {
    // Check authentication first
    if (!user) {
      const shouldLogin = confirm('🔐 Login Required\n\nYou need to be logged in to access checkout.\n\nWould you like to login now?');
      
      if (shouldLogin) {
        navigateToLogin();
      } else {
        navigateToCart(); // Redirect back to cart if they don't want to login
      }
      return;
    }
    
    // Add small delay to ensure session is fully established after login
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await loadCart();
    loadAvailableCoupons();
    await loadAddresses();
    loadTimeSlots(); // Load time slots from backend
    loadContactSettings();
  }, [user, navigateToLogin, navigateToCart, loadAddresses]);

  useEffect(() => {
    initializeCheckout();
  }, [initializeCheckout]);

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const cartData = await getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAvailableCoupons = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    try {
      const coupons = await getActiveCoupons();
      const currentDate = new Date();
      
      // Filter out expired and inactive coupons
      const validCoupons = coupons.filter((coupon: Coupon) => {
        if (!coupon.is_active) {
          return false;
        }
        
        // Check if coupon has not expired
        const expiryDate = new Date(coupon.valid_until);
        const isNotExpired = currentDate <= expiryDate;
        
        // Check if coupon is already started (valid_from)
        const startDate = new Date(coupon.valid_from);
        const hasStarted = currentDate >= startDate;
        
        if (!isNotExpired) {
          return false;
        }
        
        if (!hasStarted) {
          return false;
        }
        
        return true;
      });
      
      setAvailableCoupons(validCoupons);
      
    } catch (error) {
      console.error('Failed to load coupons:', error);
      // Retry with exponential backoff, but limit retries to prevent infinite loops
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying coupons load (${retryCount + 1}/${MAX_RETRIES}) in ${1000 * (retryCount + 1)}ms`);
        setTimeout(() => loadAvailableCoupons(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      // Set empty array on final failure
      setAvailableCoupons([]);
    }
  }, []);

  const loadContactSettings = useCallback(async () => {
    try {
      const settings = await getContactSettings();
      setContactSettings(settings);
    } catch (error) {
      console.error('Failed to load contact settings:', error);
    }
  }, []);

  // Coupon handling functions
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');

    try {
      // First validate if coupon exists and is not expired
      const allCoupons = await getActiveCoupons();
      const coupon = allCoupons.find((c: Coupon) => c.code.toUpperCase() === couponCode.toUpperCase());
      
      if (!coupon) {
        setCouponError('Invalid coupon code');
        return;
      }
      
      if (!coupon.is_active) {
        setCouponError('This coupon is no longer active');
        return;
      }
      
      const currentDate = new Date();
      const expiryDate = new Date(coupon.valid_until);
      const startDate = new Date(coupon.valid_from);
      
      if (currentDate > expiryDate) {
        setCouponError('This coupon has expired');
        return;
      }
      
      if (currentDate < startDate) {
        setCouponError('This coupon is not yet valid');
        return;
      }
      
      const result = await applyCouponToCart(couponCode);
      
      if (result.success) {
        setCouponCode('');
        setCouponError('');
        setShowCouponDropdown(false);
        loadCart(); // Reload cart to show updated totals
      } else {
        setCouponError(result.error || 'Failed to apply coupon');
      }
    } catch (error) {
      setCouponError('Failed to apply coupon');
      console.error('Coupon application error:', error);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      const success = await removeCouponFromCart();
      if (success) {
        loadCart(); // Reload cart to show updated totals
      }
    } catch (error) {
      console.error('Failed to remove coupon:', error);
    }
  };

  const handleCouponSelect = (selectedCoupon: Coupon) => {
    setCouponCode(selectedCoupon.code);
    setShowCouponDropdown(false);
    setCouponError('');
  };

  // Load time slots from backend API
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  const loadTimeSlots = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    setLoadingTimeSlots(true);
    try {
      // Use the backend API endpoint for time slots - NO HARDCODED FALLBACKS
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/config/time-slots`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && Array.isArray(data.data)) {
          // Use the display format from backend API
          const slots = data.data.map((slot: Record<string, unknown>) => 
            slot.display || `${slot.start_time} - ${slot.end_time}`
          ).filter(Boolean); // Remove any empty slots
          setTimeSlots(slots);
        } else {
          console.error('Backend API returned invalid time slots data:', data);
          setTimeSlots([]);
        }
      } else {
        console.error('Failed to fetch time slots from backend API:', response.status);
        setTimeSlots([]);
      }
    } catch (error) {
      console.error('Failed to load time slots from backend:', error);
      // Retry with exponential backoff, but limit retries to prevent infinite loops
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying time slots load (${retryCount + 1}/${MAX_RETRIES}) in ${1000 * (retryCount + 1)}ms`);
        setTimeout(() => loadTimeSlots(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      setTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  }, []);


  // Generate date options (next 7 days)
  const generateDateOptions = () => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    return dates;
  };

  const dateOptions = generateDateOptions();

  const handlePaymentSuccess = (orderId: string) => {
    // Clear cart after successful order
    updateCartCount?.();
    
    // Set order success state to show proper success message
    setOrderSuccess({
      orderId,
      amount: cart?.finalAmount || 0
    });
    
    // Clear other states
    setShowPayment(false);
  };

  const handlePaymentError = (error: string) => {
    alert(`❌ Payment Failed: ${error}\n\nPlease try again or contact support if the issue persists.`);
    setShowPayment(false);
  };

  const handleBackToSummary = () => {
    setShowPayment(false);
  };

  const handleProceedToPayment = () => {
    if (!user) {
      alert('Please log in to place an order');
      navigateToLogin();
      return;
    }

    if (!selectedAddress) {
      alert('Please select a delivery address to proceed');
      return;
    }

    setShowPayment(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading checkout...</span>
        </div>
      </div>
    );
  }

  // Show order success state or empty cart state
  if (!cart || cart.items.length === 0) {
    // If we have order success details, show success message
    if (orderSuccess) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              {/* Success Icon */}
              <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Success Message */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                🎉 Order Placed Successfully!
              </h1>
              
              <div className="mb-6">
                <div className="text-base text-gray-700 mb-2">
                  <span className="font-medium">Order ID:</span> 
                  <span className="ml-2 font-bold text-green-700 bg-green-50 px-2 py-1 rounded text-sm">
                    {orderSuccess.orderId}
                  </span>
                </div>
                <div className="text-base text-gray-700">
                  <span className="font-medium">Amount Paid:</span> 
                  <span className="ml-2 font-semibold">₹{orderSuccess.amount}</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Thank you for choosing Happy Homes! Our team will reach out to you soon to schedule your service.
              </p>

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
                <ul className="text-left space-y-2 text-sm text-blue-800">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    You will receive an SMS confirmation shortly
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    Our team will contact you within 30 minutes to schedule the service
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    Track your order status in "My Bookings"
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    Need help? Contact us via WhatsApp
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={navigateHome}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Browse More Services
                </button>
                
                <button
                  onClick={navigateToMyBookings}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  View My Bookings
                </button>
              </div>

              {/* WhatsApp Support */}
              <div className="mt-6">
                <WhatsAppButton
                  phoneNumber={contactSettings?.whatsappNumber || '9437341234'}
                  message={`Hi! I just placed an order (ID: ${orderSuccess.orderId}) for ₹${orderSuccess.amount}. Can you help me with the next steps?`}
                  className="w-full justify-center bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                  variant="inline"
                >
                  Contact Support on WhatsApp
                </WhatsAppButton>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Show empty cart state if no order success
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Add some services to proceed with checkout!</p>
          <button 
            onClick={navigateHome}
            className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Browse Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-1">Complete your service booking</p>
        </div>

        <div className={`grid grid-cols-1 ${showPayment ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8`}>
          
          {/* Main Checkout Content */}
          <div className={`${showPayment ? '' : 'lg:col-span-2'} space-y-6`}>
            
            {/* Cart Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Selected Services</h2>
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.serviceId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-purple-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                        🔧
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.serviceName}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                              <span className="text-sm text-gray-500">₹{item.basePrice} each</span>
                            </div>
                            {item.discountedPrice && (
                              <div className="text-sm text-green-600 mt-1">
                                Discounted: ₹{item.discountedPrice}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{formatPrice(item.totalPrice)}</div>
                            {item.discountedPrice && item.discountedPrice < item.basePrice && (
                              <div className="text-sm text-gray-500 line-through">{formatPrice(item.basePrice * item.quantity)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Section */}
            {showPayment ? (
              <div>
                <div className="mb-4">
                  <button
                    onClick={handleBackToSummary}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Order Summary
                  </button>
                </div>
                <CheckoutPayment
                  cart={cart}
                  selectedAddress={addresses.find(addr => addr.id === selectedAddress)}
                  customerNotes={customerNotes}
                  selectedDate={selectedDate}
                  selectedTimeSlot={selectedTimeSlot}
                  user={user}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  updateCartCount={updateCartCount}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>
                <p className="text-gray-600 mb-4">
                  Complete your service details above, then proceed to payment.
                </p>
                <button
                  onClick={handleProceedToPayment}
                  disabled={!selectedAddress}
                  className="w-full bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg text-lg font-semibold hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Proceed to Payment • {cart ? formatPrice(cart.finalAmount) : '₹0'}
                </button>
              </div>
            )}

            {/* Scheduling */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Schedule Your Service <span className="text-sm font-normal text-gray-500">(Optional)</span></h2>
                <p className="text-sm text-gray-600 mt-1">Skip scheduling if you prefer - our agent will call to arrange a convenient time</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Choose a date</option>
                    {dateOptions.map((date) => (
                      <option key={date.value} value={date.value}>
                        {date.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot</label>
                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    disabled={loadingTimeSlots}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingTimeSlots ? 'Loading time slots...' : 'Choose a time slot'}
                    </option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions (Optional)</label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any specific instructions for the service professional..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Coupon Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Coupon Code Applied</h2>
              
              {/* Applied Coupon Display */}
              {cart.appliedCoupon && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-green-800">
                          Coupon Applied: {cart.appliedCoupon}
                        </div>
                        {cart.couponDetails && (
                          <div className="text-sm text-green-600">
                            {cart.couponDetails.isPartiallyApplied ? (
                              `Applied to ${cart.couponDetails.eligibleItemsCount} of ${cart.couponDetails.eligibleItemsCount + cart.couponDetails.ineligibleItemsCount} items`
                            ) : (
                              `Applied to all ${cart.couponDetails.eligibleItemsCount} items`
                            )}
                            {cart.couponDetails.eligibleAmount > 0 && (
                              <span> • Eligible amount: {formatPrice(cart.couponDetails.eligibleAmount)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-green-600 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                      title="Remove coupon"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Partial Application Warning */}
                  {cart.couponDetails?.isPartiallyApplied && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-start space-x-2">
                        <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="text-sm">
                          <div className="font-medium text-yellow-800">Partial Discount Applied</div>
                          <div className="text-yellow-700 mt-1">
                            This coupon only applies to certain services in your order. 
                            {cart.couponDetails.ineligibleItemsCount > 0 && (
                              <span> {cart.couponDetails.ineligibleItemsCount} items are not eligible for this discount.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Coupon Input Section */}
              {!cart.appliedCoupon && (
                <div>
                  {/* Manual Entry + Dropdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Manual Text Entry */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enter Coupon Code</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={!couponCode || cart.items.length === 0 || isApplyingCoupon}
                          className="px-4 py-2 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white text-sm font-medium rounded-md hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          {isApplyingCoupon ? 'Applying...' : 'Apply'}
                        </button>
                      </div>
                    </div>

                    {/* Dropdown Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Or Select from Available Coupons</label>
                      <div className="relative">
                        <button
                          onClick={() => setShowCouponDropdown(!showCouponDropdown)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white hover:bg-gray-50 transition-colors"
                        >
                          {availableCoupons.length > 0 ? 'Choose a coupon...' : 'No coupons available'}
                          <svg className="w-4 h-4 float-right mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {showCouponDropdown && availableCoupons.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            {availableCoupons.map((coupon) => (
                              <button
                                key={coupon.id}
                                onClick={() => handleCouponSelect(coupon)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold text-orange-600 text-sm">{coupon.code}</div>
                                    <div className="text-xs text-gray-600 mt-1">{coupon.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">{coupon.description}</div>
                                  </div>
                                  <div className="text-right">
                                    {coupon.type === 'percentage' && (
                                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                                        {coupon.value}% OFF
                                      </span>
                                    )}
                                    {coupon.type === 'fixed' && (
                                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">
                                        {formatPrice(coupon.value)} OFF
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {couponError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-start space-x-2">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-red-600">{couponError}</div>
                      </div>
                    </div>
                  )}

                  {/* Available Coupons Info */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-900 mb-2">Available Offers ({availableCoupons.length}):</h4>
                    <div className="space-y-1 text-sm text-orange-700">
                      {availableCoupons.length > 0 ? (
                        availableCoupons.slice(0, 3).map((coupon: Coupon) => (
                          <div key={coupon.id}>
                            • {coupon.code} - {coupon.name}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">No active coupons available at the moment</div>
                      )}
                      {availableCoupons.length > 3 && (
                        <div className="text-orange-600 font-medium">+{availableCoupons.length - 3} more coupons available</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Order Summary Sidebar */}
          {!showPayment && (
            <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({cart.totalItems} items)</span>
                  <span className="font-medium">{formatPrice(cart.subtotal)}</span>
                </div>
                
                {cart.discountAmount > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount ({cart.appliedCoupon})
                        {cart.couponDetails?.isPartiallyApplied && (
                          <span className="text-xs text-gray-500 ml-1">
                            (Partial)
                          </span>
                        )}
                      </span>
                      <span>-{formatPrice(cart.discountAmount)}</span>
                    </div>
                    {cart.couponDetails?.isPartiallyApplied && (
                      <div className="text-xs text-gray-500 flex justify-between pl-2">
                        <span>Applied on {formatPrice(cart.couponDetails.eligibleAmount)}</span>
                        <span>{cart.couponDetails.ineligibleItemsCount} items excluded</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">GST ({cart.gstAmount > 0 ? '18%' : 'Included'})</span>
                  <span className="font-medium">{formatPrice(cart.gstAmount)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Service charge 
                    {cart.serviceChargeAmount > 0 && (
                      <span className="text-xs text-gray-400 ml-1">
                        (₹79 × {Math.ceil(cart.serviceChargeAmount / 79)} categories)
                      </span>
                    )}
                  </span>
                  <span className={`font-medium ${cart.serviceChargeAmount > 0 ? 'text-gray-900' : 'text-green-600'}`}>
                    {cart.serviceChargeAmount > 0 ? formatPrice(cart.serviceChargeAmount) : 'FREE'}
                  </span>
                </div>
                
                <hr />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span>{formatPrice(cart.finalAmount)}</span>
                </div>
              </div>

              {!showPayment && (
                <button
                  onClick={handleProceedToPayment}
                  disabled={!selectedAddress}
                  className="w-full mt-6 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg text-lg font-semibold hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Proceed to Payment • {formatPrice(cart.finalAmount)}
                </button>
              )}

              {/* WhatsApp Support */}
              <div className="mt-4">
                <WhatsAppButton
                  phoneNumber={contactSettings?.whatsappNumber || '9437341234'}
                  message={`Hi! I need help with my checkout. Order total: ${formatPrice(cart.finalAmount)}. Can you assist me?`}
                  className="w-full justify-center bg-green-500 hover:bg-green-600"
                  variant="inline"
                >
                  Get Checkout with WhatsApp
                </WhatsAppButton>
              </div>


              {/* Service Address */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Service Address</h4>
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        selectedAddress === addr.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAddress(addr.id)}
                    >
                      <div className="flex items-start space-x-2">
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddress === addr.id}
                          onChange={() => setSelectedAddress(addr.id)}
                          className="mt-1 w-3 h-3 text-orange-600 focus:ring-orange-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {addr.addressType.charAt(0).toUpperCase() + addr.addressType.slice(1)}
                            </span>
                            {addr.isDefault && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}
                          </p>
                          {addr.landmark && (
                            <p className="text-xs text-gray-500 mt-0.5">Near {addr.landmark}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={navigateToAddAddress}
                    className="w-full mt-2 border border-dashed border-gray-300 rounded-lg p-2 text-center text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm"
                  >
                    + Add New Address
                  </button>
                </div>
              </div>

              {/* Service Guarantees */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Service Guarantees</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Verified & Trained Professionals</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>30-Day Service Warranty</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>₹10,000 Damage Protection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Flexible Rescheduling</span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure payment powered by Happy Homes
              </div>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;