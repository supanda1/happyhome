import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCart, applyCouponToCart, removeCouponFromCart, updateCartItemQuantity, removeFromCart, getCoupons, type Cart } from '../../utils/adminDataManager';
import { formatPrice } from '../../utils/priceFormatter';


interface CartSidebarFixedProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCheckout: () => void;
  onCartUpdate?: () => void;
}

export const CartSidebarFixed: React.FC<CartSidebarFixedProps> = ({ 
  isCollapsed,
  onToggleCollapse,
  onCheckout, 
  onCartUpdate
}) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [selectedCouponOption, setSelectedCouponOption] = useState('manual');
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Load cart data
  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  // Load available coupons from database API
  const loadAvailableCoupons = async () => {
    try {
      const coupons = await getCoupons();
      const currentDate = new Date();
      
      // Filter out expired and inactive coupons
      const validCoupons = coupons.filter((coupon: any) => {
        if (!coupon.is_active) return false;
        
        // Check if coupon has not expired
        const expiryDate = new Date(coupon.valid_until);
        const isNotExpired = currentDate <= expiryDate;
        
        // Check if coupon is already started (valid_from)
        const startDate = new Date(coupon.valid_from);
        const hasStarted = currentDate >= startDate;
        
        return isNotExpired && hasStarted;
      });
      
      // Transform API format to match display format
      const formattedCoupons = validCoupons.map((coupon: any) => ({
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discount: coupon.discount_type === 'percentage' 
          ? `${coupon.discount_value}% OFF`
          : coupon.discount_type === 'fixed_amount'
          ? `${formatPrice(coupon.discount_value)} OFF`
          : 'FREE SERVICE'
      }));
      
      setAvailableCoupons(formattedCoupons);
      console.log('🛒 CartSidebarFixed - Available coupons loaded:', formattedCoupons.length);
      
    } catch (error) {
      console.error('🛒 CartSidebarFixed - Failed to load coupons:', error);
      setAvailableCoupons([]);
    }
  };

  // Load cart and coupons on component mount and when user changes
  useEffect(() => {
    loadCart();
    loadAvailableCoupons();
  }, [user]); // Add user as dependency to reload cart when user logs in/out

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

  // Handle coupon option change
  const handleCouponOptionChange = (option: string) => {
    setSelectedCouponOption(option);
    setCouponError('');
    setCouponSuccess('');
    
    if (option !== 'manual') {
      setCouponCode(option);
    }
  };

  // Handle quantity update
  const handleQuantityUpdate = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await handleRemoveItem(itemId);
      return;
    }

    try {
      setUpdatingItems(prev => new Set(prev).add(itemId));
      await updateCartItemQuantity(itemId, newQuantity);
      await loadCart(); // Refresh cart data
      onCartUpdate?.(); // Update global cart count
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Handle item removal
  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdatingItems(prev => new Set(prev).add(itemId));
      await removeFromCart(itemId);
      await loadCart(); // Refresh cart data
      onCartUpdate?.(); // Update global cart count
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      // Apply coupon to cart
      const result = await applyCouponToCart(couponCode);
      
      if (result.success) {
        setCouponCode('');
        setCouponError('');
        setCouponSuccess('Coupon applied successfully!');
        setSelectedCouponOption('manual');
        await loadCart(); // Reload cart to show updated totals
        onCartUpdate?.(); // Update header cart count
      } else {
        setCouponError(result.error || 'Failed to apply coupon');
      }
    } catch (error) {
      setCouponError('Failed to apply coupon');
      console.error('Coupon application error:', error);
    } finally {
      setCouponLoading(false);
    }
  };

  // Handle coupon removal
  const handleRemoveCoupon = async () => {
    try {
      setCouponSuccess(''); // Clear any success messages
      const success = await removeCouponFromCart();
      if (success) {
        await loadCart(); // Reload cart to show updated totals
        onCartUpdate?.(); // Update header cart count
      }
    } catch (error) {
      console.error('Failed to remove coupon:', error);
    }
  };

  return (
    <div className={`flex-shrink-0 min-h-screen transition-all duration-300 ${
      isCollapsed ? 'w-12' : 'w-80'
    } bg-white shadow-xl border-l border-gray-200 rounded-tl-lg hidden sm:block`}>
      
      {/* Collapsed State - Show only toggle button and cart count */}
      {isCollapsed ? (
        <div className="p-2 min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-purple-50 to-white rounded-tl-lg">
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white rounded-lg flex items-center justify-center hover:shadow-lg transition-all mb-3 shadow-md"
            title="Expand Cart"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {cart && cart.totalItems > 0 && (
            <div className="text-center">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white text-xs rounded-full flex items-center justify-center mx-auto font-bold animate-pulse mb-4 shadow-sm">
                {cart.totalItems}
              </div>
              <div className="text-xs text-purple-600 font-medium" style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)'
              }}>
                {formatPrice(cart.finalAmount)}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Expanded State - Show full cart */
        <>
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 p-2 text-white rounded-tl-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">🛒 Your Cart</h2>
              <button 
                onClick={onToggleCollapse}
                className="text-white hover:text-gray-200 transition-colors"
                title="Collapse Cart"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            {cart && (
              <div className="text-xs text-violet-100 mt-1">
                {cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''} • {formatPrice(cart.finalAmount)}
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-8 bg-gradient-to-br from-purple-25 to-blue-25 rounded-lg shadow-sm m-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-purple-600 text-xs">Loading...</span>
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="text-center py-8 px-4 bg-gradient-to-br from-purple-25 to-blue-25 rounded-lg shadow-sm m-3">
                <div className="text-4xl mb-3">🛒</div>
                <h3 className="text-sm font-medium text-purple-900 mb-2">Cart is empty</h3>
                <p className="text-xs text-purple-600">Add services to get started!</p>
              </div>
            ) : (
              <div className="p-3">
                {/* Cart Items */}
                <div className="space-y-3 mb-4">
                  <h3 className="text-xs font-semibold text-purple-900">Items</h3>
                  {cart.items.map((item) => (
                    <div key={item.serviceId} className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border border-purple-200 rounded-lg p-2 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 pr-2">
                          <h4 className="text-xs font-medium text-purple-900 leading-tight">{item.serviceName}</h4>
                          <div className="text-xs text-purple-600">{formatPrice(item.basePrice)} each</div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.serviceId)}
                          disabled={updatingItems.has(item.serviceId)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 text-xs transition-all"
                        >
                          ×
                        </button>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleQuantityUpdate(item.serviceId, item.quantity - 1)}
                            disabled={updatingItems.has(item.serviceId) || item.quantity <= 1}
                            className="w-6 h-6 rounded border border-purple-300 bg-purple-50 flex items-center justify-center hover:bg-purple-100 disabled:opacity-50 text-xs text-purple-700 transition-all"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-xs font-medium text-purple-900">
                            {updatingItems.has(item.serviceId) ? '...' : item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityUpdate(item.serviceId, item.quantity + 1)}
                            disabled={updatingItems.has(item.serviceId)}
                            className="w-6 h-6 rounded border border-purple-300 bg-purple-50 flex items-center justify-center hover:bg-purple-100 disabled:opacity-50 text-xs text-purple-700 transition-all"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-xs font-semibold text-purple-700">
                          {formatPrice(item.totalPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Applied Coupon Display */}
                {cart.appliedCoupon && (
                  <div className="mb-4">
                    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border border-purple-200 rounded-lg p-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-4 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-purple-800">
                              {cart.appliedCoupon} Applied
                            </div>
                            <div className="text-xs text-purple-600">
                              Saved {formatPrice(cart.discountAmount)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full px-2 py-1 text-xs transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Coupon Section */}
                {!cart.appliedCoupon && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-purple-900 mb-2">Coupons</h3>
                    
                    {/* Available Coupons */}
                    {availableCoupons.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {availableCoupons.map((coupon) => (
                          <div
                            key={coupon.code}
                            className={`p-1 border rounded cursor-pointer transition-all text-xs shadow-sm ${
                              selectedCouponOption === coupon.code
                                ? 'border-purple-400 bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100'
                                : 'border-purple-200 bg-gradient-to-br from-white to-purple-50 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50'
                            }`}
                            onClick={() => handleCouponOptionChange(coupon.code)}
                          >
                            <div className="flex items-start space-x-1">
                              <input
                                type="radio"
                                name="couponOption"
                                checked={selectedCouponOption === coupon.code}
                                onChange={() => handleCouponOptionChange(coupon.code)}
                                className="mt-0.5 w-2 h-2 text-purple-600"
                              />
                              <div className="flex-1">
                                <div className="text-xs font-semibold text-purple-700">
                                  {coupon.code} • {coupon.discount}
                                </div>
                                <div className="text-xs text-purple-600 leading-tight">
                                  {coupon.title}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Manual Input */}
                    <div
                      className={`p-1 border rounded cursor-pointer transition-all text-xs shadow-sm ${
                        selectedCouponOption === 'manual'
                          ? 'border-purple-400 bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100'
                          : 'border-purple-200 bg-gradient-to-br from-white to-purple-50 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50'
                      }`}
                      onClick={() => handleCouponOptionChange('manual')}
                    >
                      <div className="flex items-start space-x-1">
                        <input
                          type="radio"
                          name="couponOption"
                          checked={selectedCouponOption === 'manual'}
                          onChange={() => handleCouponOptionChange('manual')}
                          className="mt-0.5 w-2 h-2 text-purple-600"
                        />
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-purple-700 mb-1">
                            Enter Coupon Code
                          </div>
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => handleManualCouponChange(e.target.value)}
                            placeholder="Enter code"
                            className="w-full px-1 py-1 border border-purple-300 bg-white rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || cart.totalItems === 0 || couponLoading}
                      className="w-full mt-2 px-2 py-1 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white text-xs font-semibold rounded hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                    >
                      {couponLoading ? 'Applying...' : `Apply${couponCode ? ` ${couponCode}` : ' Coupon'}`}
                    </button>
                    
                    {/* Error/Success Messages */}
                    {couponError && (
                      <div className="mt-1 p-1 bg-red-50 border border-red-200 rounded shadow-sm">
                        <div className="text-xs text-red-600">{couponError}</div>
                      </div>
                    )}
                    
                    {couponSuccess && (
                      <div className="mt-1 p-1 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded shadow-sm">
                        <div className="text-xs text-purple-700">{couponSuccess}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Order Summary */}
                <div className="border-t border-purple-200 pt-3 space-y-2 bg-gradient-to-br from-purple-25 to-blue-25 p-2 rounded-lg shadow-sm">
                  <h3 className="text-xs font-semibold text-purple-900 mb-2">Order Summary</h3>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-purple-800">
                      <span>Subtotal ({cart.totalItems} items)</span>
                      <span>{formatPrice(cart.subtotal || cart.totalAmount)}</span>
                    </div>
                    
                    {cart.discountAmount > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>Discount ({cart.appliedCoupon})</span>
                        <span>-{formatPrice(cart.discountAmount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-purple-800">
                      <span>GST (18%)</span>
                      <span>{formatPrice(cart.gstAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between text-purple-800">
                      <span>Service charge</span>
                      <span className={cart.serviceChargeAmount > 0 ? 'text-purple-900' : 'text-purple-600'}>
                        {cart.serviceChargeAmount > 0 ? formatPrice(cart.serviceChargeAmount) : 'FREE'}
                      </span>
                    </div>
                    
                    <hr className="my-1 border-purple-300" />
                    <div className="flex justify-between font-bold text-purple-900">
                      <span>Total</span>
                      <span>{formatPrice(cart.finalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {cart && cart.items.length > 0 && (
            <div className="border-t bg-gray-50 p-2">
              <button
                onClick={onCheckout}
                className="w-full bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white py-2 rounded-lg text-xs font-semibold hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                Checkout - {formatPrice(cart.finalAmount)}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CartSidebarFixed;