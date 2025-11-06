import React, { useState, useEffect } from 'react';
import { useServices } from '../../contexts/ServiceContext';
import type { Service } from '../../types';
import { addToCart } from '../../utils/adminDataManager';
import { formatPrice } from '../../utils/priceFormatter';
import { Card, CardContent, CardHeader, Button } from '../../components/ui';
import CartSidebarFixed from '../../components/cart/CartSidebarFixed';

interface OfferPlan {
  id: string;
  title: string;
  description: string;
  duration_months: number;
  discount_percentage: number;
  combo_coupon_code: string; // Backend field name
  is_active: boolean;
  sort_order: number;
  benefits: string[];
  terms_conditions: string[];
  created_at?: string;
  updated_at?: string;
  // Computed fields for UI compatibility
  original_price?: number;
  discounted_price?: number;
  is_featured?: boolean;
  coupon_code?: string; // Alias for combo_coupon_code
}

interface OfferPageProps {
  navigateHome?: () => void;
  navigateToLogin?: () => void;
  navigateToCheckout?: () => void;
  navigateToCart?: () => void;
}

const OfferPage: React.FC<OfferPageProps> = ({
  navigateHome = () => window.location.href = '/',
  navigateToCart = () => window.location.href = '/#cart',
  navigateToCheckout = () => window.location.href = '/#checkout'
}) => {
  const {
    services,
    categories,
    loadServices,
    loadCategories
  } = useServices();
  const [offerPlans, setOfferPlans] = useState<OfferPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<OfferPlan | null>(null);
  const [selectedServices, setSelectedServices] = useState<Record<string, {quantity: number; customizations?: string[]}>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isCartCollapsed, setIsCartCollapsed] = useState(false);
  const [cartRefreshTrigger, setCartRefreshTrigger] = useState(0);
  const [totals, setTotals] = useState<{
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    monthlyAmount: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [loadServices, loadCategories]);

  // Calculate totals when plan or services change
  useEffect(() => {
    const calculateTotals = () => {
      if (selectedPlan && Object.keys(selectedServices).length > 0) {
        try {
          let originalAmount = 0;
          Object.keys(selectedServices).forEach(serviceId => {
            const service = services.find(s => s.id === serviceId);
            if (service) {
              const quantity = selectedServices[serviceId]?.quantity || 1;
              const price = service.discountedPrice || service.basePrice;
              originalAmount += price * quantity;
            }
          });
          
          const discountAmount = Math.round(originalAmount * (selectedPlan.discount_percentage / 100));
          const finalAmount = originalAmount - discountAmount;
          const monthlyAmount = Math.round(finalAmount / selectedPlan.duration_months);
          
          setTotals({
            originalAmount,
            discountAmount,
            finalAmount,
            monthlyAmount
          });
        } catch (error) {
          console.error('Error calculating totals:', error);
          setTotals(null);
        }
      } else {
        setTotals(null);
      }
    };

    calculateTotals();
  }, [selectedPlan, selectedServices, services]);

  // Fetch offer plans from API
  const fetchOfferPlans = async (): Promise<OfferPlan[]> => {
    try {
      console.log('📊 Fetching offer plans from API...');
      
      const response = await fetch('/api/offer-plans/active');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch offer plans');
      }
      
      console.log('✅ Offer plans fetched successfully:', data.data?.length || 0, 'plans');
      
      // Transform and enrich offer plans with computed fields for UI compatibility
      const enrichedPlans = data.data.map((plan: any, index: number) => ({
        ...plan,
        // Add UI compatibility fields
        coupon_code: plan.combo_coupon_code, // Alias for existing code
        is_featured: plan.duration_months === 6, // Mark 6-month plan as featured
        original_price: plan.duration_months * 2000, // Compute original price based on duration
        discounted_price: Math.round((plan.duration_months * 2000) * (1 - plan.discount_percentage / 100)), // Apply discount
      }));
      
      console.log('📊 Enriched offer plans:', enrichedPlans);
      return enrichedPlans;
      
    } catch (error) {
      console.error('❌ Error fetching offer plans:', error);
      
      // Return fallback plans if API fails
      console.warn('⚠️ Using fallback offer plans due to API error');
      return [
        {
          id: 'fallback-3-month',
          title: 'Smart Start (Fallback)',
          description: 'API unavailable - contact support',
          duration_months: 3,
          discount_percentage: 20,
          combo_coupon_code: 'STARTER20',
          is_active: true,
          sort_order: 1,
          benefits: ['API connection required'],
          terms_conditions: ['Contact support for current plans'],
          original_price: 6000,
          discounted_price: 4800,
          is_featured: false,
          coupon_code: 'STARTER20'
        }
      ];
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('📊 Loading services, categories, and offer plans...');
      
      // Load all data in parallel
      const [, , fetchedPlans] = await Promise.all([
        loadServices(),
        loadCategories(),
        fetchOfferPlans()
      ]);
      
      console.log('✅ Data loaded successfully');
      console.log('📊 Services count:', services?.length || 0);
      console.log('📊 Categories count:', categories?.length || 0);
      console.log('📊 Offer plans count:', fetchedPlans.length);
      
      // Set offer plans
      setOfferPlans(fetchedPlans);
      
      // Auto-select first active plan
      if (fetchedPlans.length > 0) {
        const firstPlan = fetchedPlans[0];
        setSelectedPlan(firstPlan);
        console.log('✅ Auto-selected first plan:', firstPlan.title, `(${firstPlan.discount_percentage}%)`);
      } else {
        console.warn('⚠️ No active offer plans found');
      }
    } catch (error) {
      console.error('❌ Error loading offer data:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Show user-friendly error if needed
      if (error instanceof Error && error.message.includes('fetch')) {
        console.warn('⚠️ Backend API connection issue detected');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceIncrement = (serviceId: string) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        quantity: ((prev[serviceId]?.quantity || 0) + 1),
        customizations: prev[serviceId]?.customizations || []
      }
    }));
  };

  const handleServiceDecrement = (serviceId: string) => {
    setSelectedServices(prev => {
      const currentQty = prev[serviceId]?.quantity || 0;
      if (currentQty <= 1) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [serviceId]: _removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [serviceId]: {
          quantity: currentQty - 1,
          customizations: prev[serviceId]?.customizations || []
        }
      };
    });
  };

  const handleProceedToCheckout = async () => {
    if (!selectedPlan) {
      alert('Please select a plan to continue');
      return;
    }

    const selectedServiceIds = Object.keys(selectedServices);
    if (selectedServiceIds.length === 0) {
      alert('Please select at least one service to add to your plan');
      return;
    }

    setIsAddingToCart(true);
    
    try {
      // First, add each selected service to cart
      console.log('🛒 Adding services to cart...');
      
      for (const serviceId of selectedServiceIds) {
        const selectedService = selectedServices[serviceId];
        const quantity = selectedService?.quantity || 0;
        const service = services.find(s => s.id === serviceId);
        
        if (service && quantity > 0) {
          console.log(`Adding ${service.name} (${quantity}x) to cart...`);
          
          // Add item to cart with the specified quantity
          await addToCart(serviceId, quantity);
          
          console.log(`✅ Added ${service.name} to cart`);
        }
      }

      // Store the selected plan info for checkout to apply the specific coupon
      // The checkout page will automatically apply the plan coupon and disable other coupon options
      localStorage.setItem('selectedOfferPlan', JSON.stringify({
        id: selectedPlan.id,
        title: selectedPlan.title,
        coupon_code: selectedPlan.combo_coupon_code,
        discount_percentage: selectedPlan.discount_percentage,
        duration_months: selectedPlan.duration_months
      }));
      
      console.log(`✅ Services added to cart. Checkout will apply ${selectedPlan.title} coupon: ${selectedPlan.combo_coupon_code} (${selectedPlan.discount_percentage}%)`);      
      // Trigger cart refresh
      setCartRefreshTrigger(prev => prev + 1);
      
      // Navigate to checkout to show added items with discount
      console.log('🧭 Navigating to checkout...');
      navigateToCheckout();
      
    } catch (error) {
      console.error('❌ Error during checkout:', error);
      alert('There was an error processing your request. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle direct plan purchase (without specific services)
  const handlePlanPurchase = async () => {
    if (!selectedPlan) {
      alert('Please select a plan to purchase');
      return;
    }

    // For direct plan purchase, we can add a "subscription" item to cart
    // This represents the plan itself rather than specific services
    try {
      // Add plan to cart (this would need to be handled by your cart system)
      // For now, let's show an informative message
      alert(`🎯 Ready to purchase ${selectedPlan.title}!\n\nPrice: ₹${selectedPlan.discounted_price?.toLocaleString('en-IN')} (${selectedPlan.discount_percentage}% off)\nDuration: ${selectedPlan.duration_months} months\n\nClick "Buy Now" with services selected, or contact us to purchase the plan directly.`);
      
    } catch (error) {
      console.error('Error purchasing plan:', error);
      alert('There was an error. Please try again or contact support.');
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const updateCartCount = () => {
    // Trigger cart refresh
    setCartRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 min-h-screen">
      {/* Hero Section with Back Navigation */}
      <section className="bg-gradient-to-br from-orange-500 via-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Back to Home - Integrated into Hero */}
          <div className="mb-8">
            <button onClick={navigateHome} className="text-orange-100 hover:text-white flex items-center space-x-2 text-sm font-medium transition-colors duration-200">
              <span className="text-lg">←</span>
              <span>Back to Home</span>
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              🎁 Special Combo Offers
              <span className="block text-orange-200 text-3xl md:text-4xl mt-2">Save Up to 30%</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-orange-100 max-w-3xl mx-auto">
              Choose your plan, book services instantly, and enjoy amazing discounts on every service!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                View All Plans
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-orange-600">
                How Plans Work
              </Button>
            </div>
          </div>
        </div>
      </section>


      {/* Offer Plans Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Perfect Plan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select the best plan for your needs and start saving on all services
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {offerPlans.map((plan, index) => {
              
              return (
                <Card
                  key={plan.id}
                  hover
                  className={`relative cursor-pointer transition-all duration-500 transform ${
                    selectedPlan?.id === plan.id 
                      ? 'ring-4 ring-orange-500 bg-gradient-to-br from-orange-50 to-purple-50 border-orange-300 scale-105 shadow-card-elevated' 
                      : 'hover:ring-2 hover:ring-orange-300 hover:scale-105'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {/* Selection Indicator */}
                  {selectedPlan?.id === plan.id && (
                    <div className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center shadow-soft">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                {/* Popular Badge for 6-month plan */}
                {plan.duration_months === 6 && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-soft animate-pulse z-20">
                    🔥 MOST POPULAR
                  </div>
                )}
                
                {/* Best Value Badge for 12-month plan */}
                {plan.duration_months === 12 && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-soft z-20">
                    👑 BEST VALUE
                  </div>
                )}

                {/* New Customer Badge for 3-month plan */}
                {plan.duration_months === 3 && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-soft z-20">
                    🌟 STARTER
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="text-center">
                    {/* Duration with Icon */}
                    <div className="text-3xl font-bold mb-3 bg-gradient-to-r from-orange-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {plan.duration_months === 3 && '📅'} 
                      {plan.duration_months === 6 && '🗓️'} 
                      {plan.duration_months === 12 && '📆'} 
                      {plan.duration_months} Months
                    </div>
                    
                    {/* Plan Title */}
                    <h3 className="text-xl font-bold mb-4 text-gray-900">
                      {plan.title}
                    </h3>
                    
                    {/* Discount Badge - Prominent */}
                    <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white mb-4 shadow-soft">
                      🎁 {plan.discount_percentage}% OFF
                    </div>

                    {/* Price Display */}
                    <div className="mb-6">
                      <div className="text-sm text-gray-500 line-through mb-1">
                        ₹{plan.original_price?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-1">
                        ₹{plan.discounted_price?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        Only ₹{Math.round((plan.discounted_price || 0) / plan.duration_months).toLocaleString('en-IN')}/month
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      {plan.description}
                    </p>

                    {/* Key Benefits */}
                    <div className="text-left bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 text-center text-sm">✨ Key Benefits</h4>
                      <ul className="text-sm text-gray-700 space-y-2">
                        {plan.benefits.slice(0, 3).map((benefit, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-orange-500 mr-2 font-bold text-base">✓</span>
                            <span className="leading-relaxed">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>

        </div>
      </section>


      {/* Service Selection & Order Summary */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Service Selection */}
            <div className="lg:col-span-2">
              <Card className="h-fit">
                <CardHeader>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Services</h3>
                  <p className="text-gray-600">Choose services to add to your plan and see instant pricing</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {services.length === 0 && (
                      <div className="col-span-2 text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">😕</div>
                        <div className="text-lg font-medium">No active services available</div>
                        <div className="text-sm">Please check with administrator.</div>
                      </div>
                    )}
                    {services.map((service) => {
                      const quantity = selectedServices[service.id]?.quantity || 0;
                      const originalPrice = service.discountedPrice || service.basePrice;
                      const discountedPrice = selectedPlan ? Math.round(originalPrice * (1 - selectedPlan.discount_percentage / 100)) : originalPrice;
                      
                      return (
                        <Card
                          key={service.id}
                          hover
                          className={`transition-all duration-300 transform ${
                            quantity > 0
                              ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-purple-50 scale-102 shadow-card-elevated'
                              : 'hover:border-orange-300 hover:scale-102'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className="flex items-center space-x-2 mt-1">
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => handleServiceDecrement(service.id)}
                                  disabled={quantity === 0}
                                  className="w-8 h-8 p-0 rounded-full text-sm font-medium border-2 border-orange-500 text-orange-600 bg-transparent hover:bg-orange-50 hover:border-orange-600"
                                >
                                  -
                                </Button>
                                
                                <div className="w-10 h-8 flex items-center justify-center bg-white rounded-lg border-2 border-gray-200 text-sm font-bold shadow-soft">
                                  {quantity}
                                </div>
                                
                                <Button
                                  size="xs"
                                  onClick={() => handleServiceIncrement(service.id)}
                                  className="w-8 h-8 p-0 rounded-full text-sm font-medium bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 border-none text-white shadow-soft hover:shadow-button-hover transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                                >
                                  +
                                </Button>
                              </div>
                              
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm mb-1">{service.name}</h4>
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{service.shortDescription}</p>
                                <div className="flex items-center flex-wrap gap-2">
                                  <span className="text-lg font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">{formatPrice(discountedPrice)}</span>
                                  {quantity > 1 && (
                                    <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">×{quantity}</span>
                                  )}
                                  <span className="text-sm text-gray-500 line-through">{formatPrice(originalPrice)}</span>
                                  {selectedPlan && (
                                    <span className="text-xs bg-gradient-to-r from-orange-100 to-purple-100 text-orange-800 px-2 py-1 rounded-full font-medium shadow-soft">
                                      {selectedPlan.discount_percentage}% OFF
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4 shadow-card-elevated">
                <CardHeader>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Order Summary</h3>
                  <p className="text-sm text-gray-600">Review your selected plan and services</p>
                </CardHeader>
                <CardContent>
                  {selectedPlan && (
                    <>
                      {/* Selected Plan */}
                      <div className="bg-gradient-to-br from-orange-50 via-purple-50 to-blue-50 rounded-xl p-6 mb-6 border border-orange-200">
                        <div className="text-sm font-semibold text-orange-800 mb-2">✨ Selected Plan</div>
                        <div className="text-xl font-bold text-gray-900 mb-1">{selectedPlan.title}</div>
                        <div className="text-sm text-gray-700 mb-3">
                          {selectedPlan.duration_months} months • {selectedPlan.discount_percentage}% discount at checkout
                        </div>
                        <div className="text-sm bg-gradient-to-r from-orange-100 to-purple-100 text-orange-800 px-3 py-2 rounded-full font-medium shadow-soft inline-flex items-center">
                          🎯 Discount applied automatically
                        </div>
                      </div>

                      {/* Selected Services Count */}
                      <div className="border-b border-gray-200 pb-4 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Selected Services</span>
                          <span className="font-medium">{Object.keys(selectedServices).length}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-500 text-sm">Total Quantity</span>
                          <span className="text-sm font-medium">{Object.values(selectedServices).reduce((sum, service) => sum + service.quantity, 0)}</span>
                        </div>
                      </div>

                      {/* Pricing Breakdown */}
                      {totals && Object.keys(selectedServices).length > 0 && (
                        <div className="space-y-4 mb-8">
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-gray-700 font-medium">Services Subtotal</span>
                              <span className="text-lg font-bold text-gray-900">{formatPrice(totals.originalAmount)}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-orange-700 font-semibold">Plan Discount ({selectedPlan.discount_percentage}%)</span>
                                <span className="text-orange-600 font-bold">-{formatPrice(totals.discountAmount)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-orange-50 to-purple-50 border-2 border-orange-200 rounded-xl p-4">
                            <div className="text-center">
                              <div className="text-sm text-orange-700 font-medium mb-1">💰 Final Amount</div>
                              <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                {formatPrice(totals.finalAmount)}
                              </div>
                              <div className="text-xs text-orange-600">
                                🎉 You save {formatPrice(totals.discountAmount)} with this plan!
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Plan Benefits */}
                      <div className="mb-8">
                        <h4 className="font-bold text-gray-900 mb-4 text-lg">✨ Plan Benefits</h4>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-3">
                          {selectedPlan.benefits.slice(0, 4).map((benefit, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-sm text-gray-700 leading-relaxed">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Checkout Buttons */}
                      <div className="space-y-4">
                        <Button
                          onClick={handleProceedToCheckout}
                          disabled={Object.keys(selectedServices).length === 0 || isAddingToCart}
                          size="lg"
                          fullWidth
                          className="text-base font-bold bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white border-none px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-lg hover:shadow-xl"
                        >
                          {isAddingToCart
                            ? '🔄 Adding to Cart...'
                            : Object.keys(selectedServices).length === 0 
                            ? '🛍 Select Services First'
                            : `🛍 Proceed to Checkout (${selectedPlan.discount_percentage}% OFF)`
                          }
                        </Button>

                        <Button
                          onClick={handlePlanPurchase}
                          size="lg"
                          fullWidth
                          className="text-base font-bold bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white border-none px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-lg hover:shadow-xl"
                        >
                          💳 Buy Plan Only - {selectedPlan ? formatPrice(selectedPlan.discounted_price || 0) : 'Select Plan'}
                        </Button>
                      </div>

                      {/* Terms */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="text-sm font-semibold text-gray-700 mb-3">📄 Plan Details</div>
                        <div className="space-y-2 text-xs text-gray-600">
                          <div className="flex items-start space-x-2">
                            <span className="text-orange-500 font-bold">•</span>
                            <span>{selectedPlan.discount_percentage}% discount applied automatically at checkout</span>
          

                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-purple-500 font-bold">•</span>
                            <span>Cannot be combined with other coupons</span>
                          </div>
                          {selectedPlan.terms_conditions.slice(0, 1).map((term, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <span className="text-blue-500 font-bold">•</span>
                              <span>{term}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {!selectedPlan && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">👆</div>
                      <div className="text-lg font-medium mb-2">Choose Your Plan</div>
                      <div className="text-sm">Select a plan above to see pricing and benefits</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about our combo plans
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card hover className="transition-transform duration-300 hover:scale-105">
              <CardContent className="p-6">
                <h4 className="font-bold text-orange-600 mb-3 text-base">🤔 How do the discount plans work?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">Purchase any plan and get the discount automatically applied to all your future service bookings during the plan period.</p>
              </CardContent>
            </Card>
            
            <Card hover className="transition-transform duration-300 hover:scale-105">
              <CardContent className="p-6">
                <h4 className="font-bold text-purple-600 mb-3 text-base">💳 Can I upgrade my plan later?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">Yes! You can upgrade from a shorter plan to a longer one anytime. We'll adjust the pricing and extend your benefits accordingly.</p>
              </CardContent>
            </Card>

            <Card hover className="transition-transform duration-300 hover:scale-105">
              <CardContent className="p-6">
                <h4 className="font-bold text-purple-600 mb-3 text-base">🔄 What if I don't use all services?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">No worries! Your plan benefits carry forward. Unused discounts don't expire during your plan period.</p>
              </CardContent>
            </Card>

            <Card hover className="transition-transform duration-300 hover:scale-105">
              <CardContent className="p-6">
                <h4 className="font-bold text-orange-600 mb-3 text-base">🚨 Are emergency services included?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">Premium Care and Elite Guard include free emergency callouts. Smart Start gets priority scheduling.</p>
              </CardContent>
            </Card>

            <Card hover className="transition-transform duration-300 hover:scale-105">
              <CardContent className="p-6">
                <h4 className="font-bold text-purple-600 mb-3 text-base">🏠 Multiple properties support?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">Elite Guard plan is transferable within family and can be used for multiple properties.</p>
              </CardContent>
            </Card>

            <Card hover className="transition-transform duration-300 hover:scale-105">
              <CardContent className="p-6">
                <h4 className="font-bold text-orange-600 mb-3 text-base">📞 How do I contact my coordinator?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">Premium and Elite members get direct contact details for their dedicated service coordinator.</p>
              </CardContent>
            </Card>
          </div>

        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">💬 Still have questions?</h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Our customer support team is here to help you choose the perfect plan
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                📱 WhatsApp Support
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-purple-600">
                📞 Call Now
              </Button>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                💬 Live Chat
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Navigation */}
      <div className="px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <button onClick={navigateHome} className="inline-flex items-center space-x-2 text-orange-600 hover:text-orange-800 font-semibold transition-colors duration-200 group">
            <span className="text-lg transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
            <span>Back to Home</span>
          </button>
        </div>
      </div>
      </div>
      
      {/* Cart Sidebar */}
      <CartSidebarFixed
        isCollapsed={isCartCollapsed}
        onToggleCollapse={() => setIsCartCollapsed(!isCartCollapsed)}
        onCheckout={navigateToCheckout}
        onCartUpdate={updateCartCount}
        refreshTrigger={cartRefreshTrigger}
        isOfferPage={true}
      />
    </div>
  );
};

export default OfferPage;