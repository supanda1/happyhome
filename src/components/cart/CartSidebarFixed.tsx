import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCart, applyCouponToCart, removeCouponFromCart, updateCartItemQuantity, removeFromCart, getActiveCoupons, type Cart, type Coupon } from '../../utils/adminDataManager';
import { formatPrice } from '../../utils/priceFormatter';

// Interface for formatted coupon display
interface FormattedCoupon {
  code: string;
  title: string;
  description: string;
  discount: string;
}


interface CartSidebarFixedProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCheckout: () => void;
  onCartUpdate?: () => void;
  refreshTrigger?: number; // Add refresh trigger prop
  isOfferPage?: boolean; // Flag to determine if we're on the offer page
}

export const CartSidebarFixed: React.FC<CartSidebarFixedProps> = ({ 
  isCollapsed,
  onToggleCollapse,
  onCheckout, 
  onCartUpdate,
  refreshTrigger,
  isOfferPage = false
}) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [selectedCouponOption, setSelectedCouponOption] = useState('manual');
  const [availableCoupons, setAvailableCoupons] = useState<FormattedCoupon[]>([]);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Load cart data
  const loadCart = useCallback(async () => {
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
  }, []);

  // Load available coupons from database API
  const loadAvailableCoupons = useCallback(async () => {
    try {
      const coupons = await getActiveCoupons();
      const currentDate = new Date();
      
      // Debug: Log all raw coupons from database
      console.log('🔍 CartSidebarFixed - Raw coupons from database:', coupons.map(c => ({ code: c.code, name: c.name, is_active: c.is_active })));
      
      // Filter out expired and inactive coupons
      const validCoupons = coupons.filter((coupon: Coupon) => {
        console.log('🔍 CartSidebarFixed - Processing coupon:', { code: coupon.code, is_active: coupon.is_active, isOfferPage });
        
        if (!coupon.is_active) {
          console.log('❌ CartSidebarFixed - Coupon inactive:', coupon.code);
          return false;
        }
        
        // Check if coupon has not expired
        const expiryDate = new Date(coupon.valid_until);
        const isNotExpired = currentDate <= expiryDate;
        
        // Check if coupon is already started (valid_from)
        const startDate = new Date(coupon.valid_from);
        const hasStarted = currentDate >= startDate;
        
        if (!isNotExpired || !hasStarted) {
          console.log('❌ CartSidebarFixed - Coupon expired or not started:', coupon.code);
          return false;
        }
        
        // Filter offer-specific coupons based on page context
        // These are the EXACT offer plan coupons that should only appear on OfferPage
        const offerOnlyCoupons = ['STARTER20', 'PREMIUM25', 'ELITE30'];
        
        // General coupons that should appear on ALL pages
        const generalCoupons = ['WELCOME50', 'NEWUSER25', 'PLUMBING20'];
        
        const couponCodeUpper = coupon.code.toUpperCase();
        const isOfferOnlyCoupon = offerOnlyCoupons.includes(couponCodeUpper);
        const isGeneralCoupon = generalCoupons.includes(couponCodeUpper);
        
        console.log('🔍 CartSidebarFixed - Coupon analysis:', {
          code: coupon.code,
          isOfferOnlyCoupon,
          isGeneralCoupon,
          isOfferPage,
          shouldExclude: isOfferOnlyCoupon && !isOfferPage
        });
        
        // Logic: 
        // 1. Always show general coupons (WELCOME50, SAVE100, etc.) on ALL pages
        // 2. Only show offer coupons (STARTER20, PREMIUM25, ELITE30) on OfferPage
        // 3. Hide offer coupons on non-offer pages
        
        if (isGeneralCoupon) {
          console.log('✅ CartSidebarFixed - Including general coupon on all pages:', coupon.code);
          return true;
        }
        
        if (isOfferOnlyCoupon) {
          if (!isOfferPage) {
            console.log('❌ CartSidebarFixed - Excluding offer coupon on non-offer page:', coupon.code);
            return false;
          } else {
            console.log('✅ CartSidebarFixed - Including offer coupon on offer page:', coupon.code);
            return true;
          }
        }
        
        // For any other coupons not in our lists, show them on all pages by default
        console.log('✅ CartSidebarFixed - Including unknown coupon (default behavior):', coupon.code);
        return true;
      });
      
      // Transform API format to match display format
      const formattedCoupons = validCoupons.map((coupon: Coupon) => ({
        code: coupon.code,
        title: coupon.name,
        description: coupon.description,
        discount: coupon.type === 'percentage' 
          ? `${coupon.value}% OFF`
          : coupon.type === 'fixed'
          ? `${formatPrice(coupon.value)} OFF`
          : 'FREE SERVICE'
      }));
      
      setAvailableCoupons(formattedCoupons);
      console.log('🛒 CartSidebarFixed - Available coupons loaded:', formattedCoupons.length);
      console.log('🛒 CartSidebarFixed - Coupon details:', formattedCoupons);
      console.log('🛒 CartSidebarFixed - Is offer page:', isOfferPage);
      
    } catch (error) {
      console.error('🛒 CartSidebarFixed - Failed to load coupons:', error);
      setAvailableCoupons([]);
    }
  }, []);

  // Load cart and coupons on component mount and when user changes
  useEffect(() => {
    loadCart();
    loadAvailableCoupons();
  }, [user, loadCart, loadAvailableCoupons]); // Add user as dependency to reload cart when user logs in/out

  // Reload cart when refreshTrigger changes (external cart updates)
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      loadCart();
    }
  }, [refreshTrigger, loadCart]);

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
      console.log('🛒 CartSidebarFixed - Updating quantity:', { itemId, newQuantity });
      
      const success = await updateCartItemQuantity(itemId, newQuantity);
      
      if (success) {
        console.log('✅ CartSidebarFixed - Quantity updated successfully');
        await loadCart(); // Refresh cart data
        onCartUpdate?.(); // Update global cart count
      } else {
        console.error('❌ CartSidebarFixed - Failed to update quantity');
        throw new Error('Failed to update quantity');
      }
    } catch (error) {
      console.error('❌ CartSidebarFixed - Error updating quantity:', error);
      // Could add a toast notification here for user feedback
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
      console.log('🗑️ CartSidebarFixed - Removing item:', itemId);
      
      const success = await removeFromCart(itemId);
      
      if (success) {
        console.log('✅ CartSidebarFixed - Item removed successfully');
        await loadCart(); // Refresh cart data
        onCartUpdate?.(); // Update global cart count
      } else {
        console.error('❌ CartSidebarFixed - Failed to remove item');
        throw new Error('Failed to remove item');
      }
    } catch (error) {
      console.error('❌ CartSidebarFixed - Error removing item:', error);
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
                  {cart.items.map((item) => {
                    console.log('📋 CartSidebarFixed - Cart item:', { item, itemId: item.id });
                    
                    return (
                    <div key={item.id} className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border border-purple-200 rounded-lg p-2 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 pr-2">
                          <h4 className="text-xs font-medium text-purple-900 leading-tight">{item.serviceName}</h4>
                          <div className="text-xs text-purple-600">{formatPrice(item.basePrice)} each</div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={updatingItems.has(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 text-xs transition-all"
                        >
                          ×
                        </button>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              console.log('➖ CartSidebarFixed - Decrease quantity clicked:', { itemId: item.id, currentQuantity: item.quantity });
                              handleQuantityUpdate(item.id, item.quantity - 1);
                            }}
                            disabled={updatingItems.has(item.id) || item.quantity <= 1}
                            className="w-6 h-6 rounded border border-purple-300 bg-purple-50 flex items-center justify-center hover:bg-purple-100 disabled:opacity-50 text-xs text-purple-700 transition-all"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-xs font-medium text-purple-900">
                            {updatingItems.has(item.id) ? '...' : item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              console.log('➕ CartSidebarFixed - Increase quantity clicked:', { itemId: item.id, currentQuantity: item.quantity });
                              handleQuantityUpdate(item.id, item.quantity + 1);
                            }}
                            disabled={updatingItems.has(item.id)}
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
                    );
                  })}
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
                    
                    {/* Remove hardcoded offer plan discount - should only come from backend */}
                    
                    {cart.discountAmount > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>Discount</span>
                        <span>-{formatPrice(cart.discountAmount)}</span>
                      </div>
                    )}
                    
{(() => {
                      // Use backend-calculated values only - no frontend discount calculations
                      const calculatedGST = cart.gstAmount;
                      const calculatedTotal = cart.finalAmount;
                      
                      return (
                        <>
                          <div className="flex justify-between text-purple-800">
                            <span>GST (18%)</span>
                            <span>{formatPrice(calculatedGST)}</span>
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
                            <span>{formatPrice(calculatedTotal)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {cart && cart.items.length > 0 && (
            <div className="border-t bg-gray-50 p-2">
{(() => {
                // Use backend-calculated total only - no frontend discount calculations
                const calculatedTotal = cart.finalAmount;
                
                return (
                  <button
                    onClick={onCheckout}
                    className="w-full bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white py-2 rounded-lg text-xs font-semibold hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                  >
                    Checkout - {formatPrice(calculatedTotal)}
                  </button>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CartSidebarFixed;