import React, { useState, useEffect } from 'react';
import {
  getOfferPlans,
  getServices,
  getCategories,
  calculateOfferTotals,
  initializeAllAdminData,
  addToCart,
  createCoupon,
  applyCouponToCart,
  type OfferPlan,
  type Service,
  type Category
} from '../../utils/adminDataManager';
import { formatPrice } from '../../utils/priceFormatter';

interface OfferPageProps {
  navigateHome?: () => void;
  navigateToLogin?: () => void;
  navigateToCheckout?: () => void;
  navigateToCart?: () => void;
}

const OfferPage: React.FC<OfferPageProps> = ({
  navigateToCart = () => window.location.href = '/#cart'
}) => {
  const [offerPlans, setOfferPlans] = useState<OfferPlan[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<OfferPlan | null>(null);
  const [selectedServices, setSelectedServices] = useState<{[serviceId: string]: number}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState<{
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    monthlyAmount: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Calculate totals when plan or services change
  useEffect(() => {
    const calculateTotals = async () => {
      if (selectedPlan && Object.keys(selectedServices).length > 0) {
        try {
          const result = await calculateOfferTotals(
            selectedPlan.id, 
            Object.keys(selectedServices), 
            selectedServices
          );
          setTotals(result);
        } catch (error) {
          console.error('Error calculating totals:', error);
          setTotals(null);
        }
      } else {
        setTotals(null);
      }
    };

    calculateTotals();
  }, [selectedPlan, selectedServices]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // SECURITY: Services data comes from backend - no localStorage clearing needed
      await initializeAllAdminData();
      
      // Load offer plans
      const allPlans = await getOfferPlans();
      const plans = Array.isArray(allPlans) ? allPlans.filter(plan => plan.is_active) : [];
      
      // Load services with proper async handling
      const allServicesRaw = await getServices();
      
      const activeServices = Array.isArray(allServicesRaw) 
        ? allServicesRaw.filter(service => service.is_active && service.is_combo_eligible)
        : [];
      
      // Load categories with proper async handling
      const allCategoriesRaw = await getCategories();
      const allCategories = Array.isArray(allCategoriesRaw) 
        ? allCategoriesRaw.filter(cat => cat.is_active)
        : [];
      
      setOfferPlans(plans);
      setServices(activeServices); // Only show combo-eligible services
      setCategories(allCategories);
      
      // Auto-select first plan
      if (plans.length > 0) {
        setSelectedPlan(plans[0]);
      } else {
        console.warn('⚠️ No active offer plans found');
      }
    } catch (error) {
      console.error('❌ Error loading offer data:', error);
      // Ensure we set empty arrays on error
      setOfferPlans([]);
      setServices([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceIncrement = (serviceId: string) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: (prev[serviceId] || 0) + 1
    }));
  };

  const handleServiceDecrement = (serviceId: string) => {
    setSelectedServices(prev => {
      const currentQty = prev[serviceId] || 0;
      if (currentQty <= 1) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [serviceId]: _removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [serviceId]: currentQty - 1
      };
    });
  };

  const handleProceedToCheckout = async () => {
    const selectedServiceIds = Object.keys(selectedServices);
    if (!selectedPlan || selectedServiceIds.length === 0) {
      alert('Please select a plan and at least one service');
      return;
    }

    // Add each selected service to cart using the regular cart system
    selectedServiceIds.forEach(serviceId => {
      const quantity = selectedServices[serviceId];
      const service = services.find(s => s.id === serviceId);
      
      if (service && quantity > 0) {
        // Add to cart with the quantity
        for (let i = 0; i < quantity; i++) {
          addToCart(serviceId, undefined, 1);
        }
      }
    });

    // Create and apply an offer coupon automatically
    const offerCouponCode = `OFFER${selectedPlan.discount_percentage}`;
    
    try {
      // Create a dynamic coupon for this offer
      createCoupon({
        code: offerCouponCode,
        name: `${selectedPlan.title} - ${selectedPlan.discount_percentage}% OFF`,
        description: `Special combo offer: ${selectedPlan.description}`,
        type: 'percentage',
        value: selectedPlan.discount_percentage,
        minimum_order_amount: 0,
        maximum_discount_amount: 1000,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        usage_limit: 1000,
        used_count: 0,
        is_active: true,
        applicable_categories: [],
        applicable_services: []
      });

      // Auto-apply the coupon to cart
      await applyCouponToCart(offerCouponCode);
      
    } catch {
      // Try to apply existing coupon anyway
      await applyCouponToCart(offerCouponCode);
    }
    
    // Navigate to cart to show added items with discount
    navigateToCart();
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎁 Special Combo Offers
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Save up to 30% with our combo plans! Choose your favorite services and enjoy regular home maintenance at unbeatable prices.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Offer Plans Section */}
          <div className="lg:col-span-2">
            
            {/* Plan Selection Cards */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Choose Your Plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {offerPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      selectedPlan?.id === plan.id
                        ? 'bg-gradient-to-br from-orange-500 via-purple-600 to-blue-600 text-white ring-4 ring-orange-300 shadow-2xl'
                        : 'bg-white border-2 border-gray-200 hover:border-orange-300 shadow-lg hover:shadow-xl'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {plan.duration_months === 12 && (
                      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        BEST VALUE
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${selectedPlan?.id === plan.id ? 'text-white' : 'text-orange-600'}`}>
                        {plan.duration_months} Months
                      </div>
                      <div className={`text-lg font-semibold mb-3 ${selectedPlan?.id === plan.id ? 'text-orange-100' : 'text-gray-900'}`}>
                        {plan.title}
                      </div>
                      <div className={`text-sm mb-4 ${selectedPlan?.id === plan.id ? 'text-orange-100' : 'text-gray-600'}`}>
                        {plan.description}
                      </div>
                      
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                        selectedPlan?.id === plan.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                      }`}>
                        🎉 {plan.discount_percentage}% OFF
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Select Services</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {services.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No combo-eligible services found. Check admin settings.
                  </div>
                )}
                {services.map((service) => {
                  const quantity = selectedServices[service.id] || 0;
                  const originalPrice = service.discounted_price || service.base_price;
                  const discountedPrice = selectedPlan ? Math.round(originalPrice * (1 - selectedPlan.discount_percentage / 100)) : originalPrice;
                  
                  return (
                    <div
                      key={service.id}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        quantity > 0
                          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center space-x-2 mt-0.5">
                          <button
                            onClick={() => handleServiceDecrement(service.id)}
                            disabled={quantity === 0}
                            className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-colors disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 enabled:border-red-500 enabled:text-red-500 enabled:hover:bg-red-50"
                          >
                            -
                          </button>
                          
                          <div className="w-12 h-8 flex items-center justify-center bg-gray-100 rounded border font-medium text-sm">
                            {quantity}
                          </div>
                          
                          <button
                            onClick={() => handleServiceIncrement(service.id)}
                            className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-colors border-green-500 text-green-500 hover:bg-green-50"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{service.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{service.short_description}</div>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-lg font-bold text-green-600">{formatPrice(discountedPrice)}</span>
                            {quantity > 1 && (
                              <span className="text-sm font-medium text-orange-600">x{quantity} = {formatPrice(discountedPrice * quantity)}</span>
                            )}
                            <span className="text-sm text-gray-500 line-through">{formatPrice(originalPrice)}</span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                              {selectedPlan ? `${selectedPlan.discount_percentage}% OFF` : '30% OFF'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

              {selectedPlan && (
                <>
                  {/* Selected Plan */}
                  <div className="bg-gradient-to-br from-orange-100 via-purple-100 to-blue-100 rounded-lg p-4 mb-4">
                    <div className="text-sm font-medium text-orange-800 mb-1">Selected Plan</div>
                    <div className="font-semibold text-purple-900">{selectedPlan.title}</div>
                    <div className="text-sm text-purple-700 mt-1">
                      {selectedPlan.duration_months} months • {selectedPlan.discount_percentage}% discount
                    </div>
                  </div>

                  {/* Selected Services Count */}
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selected Services</span>
                      <span className="font-medium">{Object.keys(selectedServices).length} services</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500 text-sm">Total Quantity</span>
                      <span className="text-sm font-medium">{Object.values(selectedServices).reduce((sum, qty) => sum + qty, 0)} items</span>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  {totals && Object.keys(selectedServices).length > 0 && (
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Original Amount</span>
                        <span className="font-medium">{formatPrice(totals.originalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Combo Discount ({selectedPlan?.discount_percentage || 30}%)</span>
                        <span className="font-medium">-{formatPrice(totals.discountAmount)}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount</span>
                        <span className="text-purple-600">{formatPrice(totals.finalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Monthly Amount</span>
                        <span className="font-medium text-gray-700">{formatPrice(totals.monthlyAmount)}/month</span>
                      </div>
                    </div>
                  )}

                  {/* Benefits */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Plan Benefits</h4>
                    <div className="space-y-2">
                      {selectedPlan.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start space-x-2 text-sm">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span className="text-gray-600">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleProceedToCheckout}
                    disabled={Object.keys(selectedServices).length === 0}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {Object.keys(selectedServices).length === 0 
                      ? 'Buy Now'
                      : `Buy Now - ${formatPrice(totals?.finalAmount || 0)}`
                    }
                  </button>

                  {/* Terms & Conditions */}
                  <div className="mt-4 text-xs text-gray-500">
                    <div className="font-medium mb-2">Terms & Conditions:</div>
                    <ul className="space-y-1 list-disc list-inside">
                      {selectedPlan.terms_conditions.slice(0, 3).map((term, index) => (
                        <li key={index}>{term}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Security Badge */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center text-xs text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure payment powered by Happy Homes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferPage;