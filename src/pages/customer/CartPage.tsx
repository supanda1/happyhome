import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getCart, 
  removeFromCart, 
  updateCartItemQuantity, 
  clearCart, 
  applyCouponToCart, 
  removeCouponFromCart,
  getActiveCoupons,
  getContactSettings,
  type Cart, 
  type ContactSettings,
  type Coupon
} from '../../utils/adminDataManager';
import { formatPrice } from '../../utils/priceFormatter';
import WhatsAppButton from '../../components/ui/WhatsAppButton';

interface CartPageProps {
  navigateHome?: () => void;
  navigateToLogin?: () => void;
  navigateToCheckout?: () => void;
  updateCartCount?: () => void;
}

const CartPage: React.FC<CartPageProps> = ({ 
  navigateHome = () => window.location.href = '/', 
  navigateToLogin = () => window.location.href = '/#login',
  navigateToCheckout = () => window.location.href = '/#checkout',
  updateCartCount
}) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [selectedCouponOption, setSelectedCouponOption] = useState('manual');
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [contactSettings, setContactSettings] = useState<ContactSettings | null>(null);

  // Load available coupons from database API
  const loadAvailableCoupons = async () => {
    try {
      const coupons = await getActiveCoupons();
      const currentDate = new Date();
      
      // Filter out expired and inactive coupons (same logic as CheckoutPage)
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
      
      // Transform API format to match CartPage display format
      const formattedCoupons = validCoupons.map((coupon: Coupon) => ({
        code: coupon.code,
        title: (coupon as any).title || (coupon as any).name,
        description: coupon.description,
        discount: ((coupon as any).discount_type || (coupon as any).type) === 'percentage' 
          ? `${(coupon as any).discount_value || (coupon as any).value}% OFF`
          : ((coupon as any).discount_type || (coupon as any).type) === 'fixed_amount'
          ? `${formatPrice((coupon as any).discount_value || (coupon as any).value)} OFF`
          : 'FREE SERVICE'
      }));
      
      setAvailableCoupons(formattedCoupons as any);
      
    } catch (error) {
      console.error('🛒 CartPage - Failed to load coupons:', error);
      // Fallback to empty array if API fails
      setAvailableCoupons([]);
    }
  };

  // Handle coupon option selection
  const handleCouponOptionChange = (option: string, code?: string) => {
    setSelectedCouponOption(option);
    setCouponError('');
    
    if (option === 'manual') {
      setCouponCode('');
    } else if (code) {
      setCouponCode(code);
    }
  };

  // Load contact settings
  const loadContactSettings = async () => {
    try {
      const settings = await getContactSettings();
      setContactSettings(settings);
    } catch (error) {
      console.error('Error loading contact settings:', error);
    }
  };

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const cartData = await getCart();
      setCart(cartData);
      
      // Update cart count in header if updateCartCount function is provided
      if (updateCartCount) {
        updateCartCount();
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      // Set empty cart on error
      setCart({
        id: `cart-${Date.now()}`,
        userId: 'guest',
        items: [],
        totalItems: 0,
        totalAmount: 0,
        subtotal: 0,
        discountAmount: 0,
        gstAmount: 0,
        serviceChargeAmount: 0,
        finalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateCartCount]);

  // Load cart data on component mount
  useEffect(() => {
    loadCart();
    loadAvailableCoupons();
    loadContactSettings();
  }, [loadCart]);

  const updateQuantity = async (id: string, newQuantity: number) => {
    try {
      if (newQuantity === 0) {
        await handleRemoveItem(id);
      } else {
        const success = await updateCartItemQuantity(id, newQuantity);
        if (success) {
          await loadCart(); // Reload cart to show updated data
          updateCartCount?.(); // Update header cart count
        }
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      const success = await removeFromCart(id);
      if (success) {
        await loadCart(); // Reload cart to show updated data
        updateCartCount?.(); // Update header cart count
      }
    } catch (error) {
      console.error('Failed to remove cart item:', error);
    }
  };

  // Handle manual coupon code input
  const handleManualCouponChange = (value: string) => {
    setCouponCode(value.toUpperCase());
    setCouponError('');
    setCouponSuccess('');
    
    // Check if the entered code matches any available coupon
    const matchedCoupon = availableCoupons.find(coupon => coupon.code === value.toUpperCase());
    if (matchedCoupon) {
      setSelectedCouponOption(matchedCoupon.code);
    } else {
      setSelectedCouponOption('manual');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      // Apply coupon to cart
      const result = await applyCouponToCart(couponCode);
      
      if (result.success) {
        setCouponCode('');
        setCouponError('');
        setCouponSuccess(result.message || 'Coupon applied successfully!');
        setSelectedCouponOption('manual');
        loadCart(); // Reload cart to show updated totals
        updateCartCount?.(); // Update header cart count
      } else {
        setCouponError(result.message || 'Unknown error occurred');
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
      setCouponSuccess(''); // Clear any success messages
      const success = await removeCouponFromCart();
      if (success) {
        loadCart(); // Reload cart to show updated totals
        updateCartCount?.(); // Update header cart count
      }
    } catch (error) {
      console.error('Failed to remove coupon:', error);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        const success = await clearCart();
        if (success) {
          await loadCart(); // Reload to show empty cart
          updateCartCount?.(); // Update header cart count
        }
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    // Check if user is authenticated before proceeding to checkout
    if (!user) {
      alert('Please log in to proceed with checkout');
      navigateToLogin();
      return;
    }

    navigateToCheckout();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Show empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Start shopping to add items to your cart!</p>
          <button 
            onClick={navigateHome}
            className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Cart Items Section */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Shopping Cart ({cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'})
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={navigateHome}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Continue Shopping
                    </button>
                    <button
                      onClick={handleClearCart}
                      className="px-3 py-1.5 border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                      title="Clear all items from cart"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </div>

              {cart.items.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 mb-6">Add some services to get started!</p>
                  <button
                    onClick={navigateHome}
                    className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Browse Services
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {cart.items.map((item) => (
                    <div key={(item as any).id || item.serviceId} className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Service Image/Icon */}
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                          🔧
                        </div>

                        {/* Service Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{item.serviceName}</h3>
                              <div className="flex items-center space-x-2 mt-2">
                                {(item as any).variantName && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {(item as any).variantName}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveItem((item as any).id || item.serviceId)}
                              className="text-gray-400 hover:text-red-500 p-1"
                              title="Remove item"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          {/* Price and Quantity */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl font-bold text-gray-900">{formatPrice(item.discountedPrice || item.basePrice)}</span>
                              {item.discountedPrice && (
                                <span className="text-sm text-gray-500 line-through">{formatPrice(item.basePrice)}</span>
                              )}
                              {item.discountedPrice && (
                                <span className="text-sm text-green-600 font-medium">
                                  {Math.round(((item.basePrice - item.discountedPrice) / item.basePrice) * 100)}% OFF
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => updateQuantity((item as any).id || item.serviceId, item.quantity - 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity((item as any).id || item.serviceId, item.quantity + 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="w-full lg:w-96">
            <div className="bg-white rounded-lg shadow-sm sticky top-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

                {/* Price Breakdown - Moved to top */}
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal ({cart.totalItems} items)</span>
                    <span>{formatPrice(cart.subtotal)}</span>
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
                  <div className="flex justify-between text-sm">
                    <span>GST (18%)</span>
                    <span>{formatPrice(cart.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      Service charge
                      {cart.serviceChargeAmount > 0 && (
                        <span className="text-xs text-gray-400 ml-1">
                          (₹79 × {Math.ceil(cart.serviceChargeAmount / 79)} categories)
                        </span>
                      )}
                    </span>
                    <span className={cart.serviceChargeAmount > 0 ? 'text-gray-900' : 'text-green-600'}>
                      {cart.serviceChargeAmount > 0 ? formatPrice(cart.serviceChargeAmount) : 'FREE'}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(cart.finalAmount)}</span>
                  </div>
                </div>

                {/* Checkout Button - Moved after pricing */}
                <button
                  onClick={handleCheckout}
                  disabled={cart.totalItems === 0}
                  className="w-full mb-6 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg text-lg font-semibold hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Proceed to Checkout
                </button>

                {/* Applied Coupon Display - Moved after checkout */}
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
                        className="flex items-center space-x-1 text-red-500 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors border border-red-200 hover:border-red-300 text-sm font-medium"
                        title="Remove coupon"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Remove</span>
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
                              This coupon only applies to certain services in your cart. 
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

                {/* Coupon Selection Section - Moved to bottom */}
                {!cart.appliedCoupon && (
                  <div className="mb-6">
                    <label className="block text-xs font-medium text-gray-700 mb-3">Select or Enter Coupon Code</label>
                    
                    {/* Available Coupons as Radio Options */}
                    <div className="space-y-2 mb-3">
                      {availableCoupons.map((coupon) => (
                        <div
                          key={coupon.code}
                          className={`border rounded-lg p-3 cursor-pointer transition-all duration-300 transform hover:scale-102 ${
                            selectedCouponOption === coupon.code
                              ? 'bg-gradient-to-br from-purple-200 via-blue-200 to-indigo-300 border-purple-300 ring-1 ring-purple-200 shadow-md'
                              : 'border-purple-200 hover:border-purple-300 bg-gradient-to-br from-white to-purple-50 shadow-sm hover:shadow-md'
                          }`}
                          onClick={() => handleCouponOptionChange(coupon.code, coupon.code)}
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="couponOption"
                              checked={selectedCouponOption === coupon.code}
                              onChange={() => handleCouponOptionChange(coupon.code, coupon.code)}
                              className="w-3 h-3 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-bold bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    {coupon.code}
                                  </div>
                                  <div className="text-xs text-gray-600 leading-tight">{coupon.description}</div>
                                </div>
                                <div className="text-right ml-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 shadow-sm">
                                    {(coupon as any).discount}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Manual Entry Option */}
                      <div
                        className={`border rounded-lg p-3 cursor-pointer transition-all duration-300 transform hover:scale-102 ${
                          selectedCouponOption === 'manual'
                            ? 'bg-gradient-to-br from-purple-200 via-blue-200 to-indigo-300 border-purple-300 ring-1 ring-purple-200 shadow-md'
                            : 'border-purple-200 hover:border-purple-300 bg-gradient-to-br from-white to-purple-50 shadow-sm hover:shadow-md'
                        }`}
                        onClick={() => handleCouponOptionChange('manual')}
                      >
                        <div className="flex items-start space-x-2">
                          <input
                            type="radio"
                            name="couponOption"
                            checked={selectedCouponOption === 'manual'}
                            onChange={() => handleCouponOptionChange('manual')}
                            className="mt-0.5 w-3 h-3 text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-semibold bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                              Enter Custom Coupon Code
                            </div>
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => handleManualCouponChange(e.target.value)}
                              placeholder="Enter coupon code"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || cart.totalItems === 0 || isApplyingCoupon}
                      className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white text-lg font-semibold rounded-lg hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      {isApplyingCoupon ? (
                        <>
                          <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Applying Coupon...
                        </>
                      ) : (
                        `Apply${couponCode ? ` ${couponCode}` : ' Coupon'}`
                      )}
                    </button>
                    
                    {/* Error Message */}
                    {couponError && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-xs text-red-600">{couponError}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Success Message */}
                    {couponSuccess && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-xs text-green-600">{couponSuccess}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* WhatsApp Support */}
                <div className="mt-4 mb-4">
                  <WhatsAppButton
                    phoneNumber={contactSettings?.whatsappNumber || '9437341234'}
                    message={`Hi! I need help with my cart (${cart.totalItems} items, total: ₹${cart.finalAmount}). Can you assist me with checkout?`}
                    className="w-full justify-center bg-green-500 hover:bg-green-600"
                    variant="inline"
                  >
                    Get Cart Help on WhatsApp
                  </WhatsAppButton>
                </div>


                {/* Security Note */}
                <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Secure checkout powered by Happy Homes
                </div>

              </div>
            </div>

            {/* Service Guarantees */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Happy Homes Promises</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Professional & Verified Technicians</span>
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
                  <span>Same Day Service Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;