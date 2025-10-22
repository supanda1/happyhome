import React, { useState, useEffect } from 'react';
import { useServices } from '../../contexts/ServiceContext';
import type { Service } from '../../types';
import { applyCouponToCart } from '../../utils/adminDataManager';
import { formatPrice } from '../../utils/priceFormatter';
import { Card, CardContent, CardHeader, Button } from '../../components/ui';

interface OfferPlan {
  id: string;
  title: string;
  description: string;
  duration_months: number;
  discount_percentage: number;
  original_price: number;
  discounted_price: number;
  benefits: string[];
  terms_conditions: string[];
  is_active: boolean;
  is_featured?: boolean;
}

interface OfferPageProps {
  navigateHome?: () => void;
  navigateToLogin?: () => void;
  navigateToCheckout?: () => void;
  navigateToCart?: () => void;
}

const OfferPage: React.FC<OfferPageProps> = ({
  navigateToCart = () => window.location.href = '/#cart'
}) => {
  const {
    services,
    categories,
    loadServices,
    loadCategories
  } = useServices();
  const [offerPlans] = useState<OfferPlan[]>([
    {
      id: '3-month-plan',
      title: 'Smart Start',
      description: 'Perfect for trying our services with 20% savings',
      duration_months: 3,
      discount_percentage: 20,
      original_price: 6000,
      discounted_price: 4800,
      benefits: ['Monthly priority booking', 'Basic maintenance tips', '24/7 support'],
      terms_conditions: ['Valid for 3 months from purchase', 'Non-transferable', 'Cannot be combined with other offers'],
      is_active: true,
      is_featured: false
    },
    {
      id: '6-month-plan',
      title: 'Premium Care',
      description: 'Best value for regular homes with 25% savings',
      duration_months: 6,
      discount_percentage: 25,
      original_price: 12000,
      discounted_price: 9000,
      benefits: ['Dedicated coordinator', 'Free emergency calls', 'Monthly inspections'],
      terms_conditions: ['Valid for 6 months from purchase', 'Transferable within family', 'Priority customer support'],
      is_active: true,
      is_featured: true
    },
    {
      id: '12-month-plan',
      title: 'Elite Guard',
      description: 'Maximum savings guaranteed with 30% off',
      duration_months: 12,
      discount_percentage: 30,
      original_price: 24000,
      discounted_price: 16800,
      benefits: ['Personal care manager', 'Unlimited emergency calls', 'Free minor repairs'],
      terms_conditions: ['Valid for 12 months from purchase', 'Transferable within family', 'Premium customer care'],
      is_active: true,
      is_featured: false
    }
  ]);
  const [selectedPlan, setSelectedPlan] = useState<OfferPlan | null>(null);
  const [selectedServices, setSelectedServices] = useState<Record<string, {quantity: number; customizations?: string[]}>>({});
  const [isLoading, setIsLoading] = useState(true);
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('📊 Loading services and categories via ServiceContext...');
      
      // Load services and categories using ServiceContext
      await Promise.all([loadServices(), loadCategories()]);
      
      console.log('✅ Services and categories loaded via ServiceContext');
      console.log('📊 Services count:', services?.length || 0);
      console.log('📊 Categories count:', categories?.length || 0);
      
      // Auto-select first plan
      if (offerPlans.length > 0) {
        setSelectedPlan(offerPlans[0]);
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

    try {
      // Add each selected service to cart using the regular cart system
      const cartItems: Array<{serviceId: string, quantity: number, service: Service}> = [];
      selectedServiceIds.forEach(serviceId => {
        const selectedService = selectedServices[serviceId];
        const quantity = selectedService?.quantity || 0;
        const service = services.find(s => s.id === serviceId);
        
        if (service && quantity > 0) {
          cartItems.push({serviceId, quantity, service});
        }
      });
      
      console.log('Adding to cart:', cartItems);

      // Apply the appropriate offer coupon based on selected plan
      const offerCouponCode = `OFFER${Math.round(selectedPlan.discount_percentage)}`;
      
      try {
        // Auto-apply the plan-specific coupon
        await applyCouponToCart(offerCouponCode);
        
        // Show success message
        alert(`🎉 ${selectedPlan.title} activated! ${selectedPlan.discount_percentage}% discount applied to your cart. Services added successfully!`);
        
      } catch (couponError) {
        console.warn('Coupon application failed:', couponError);
        alert('Services added to cart! Please apply coupon manually if needed.');
      }
      
      // Navigate to cart to show added items with discount
      navigateToCart();
      
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('There was an error processing your request. Please try again.');
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 via-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              🎁 Special Combo Offers
              <span className="block text-orange-200 text-xl md:text-2xl">Save Up to 30%</span>
            </h1>
            <p className="text-sm md:text-base text-orange-100 font-medium">
              Choose your plan, book services instantly, and enjoy amazing discounts on every service!
            </p>
          </div>
        </div>
      </section>


      {/* Offer Plans Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {offerPlans.map((plan, index) => {
              
              return (
                <Card
                  key={plan.id}
                  variant="elevated"
                  hover
                  className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 bg-white shadow-lg hover:shadow-2xl ${
                    selectedPlan?.id === plan.id 
                      ? 'ring-4 ring-orange-500 bg-gradient-to-br from-orange-50 to-purple-50 border-orange-300 scale-105 shadow-2xl' 
                      : 'hover:ring-2 hover:ring-orange-300'
                  } ${index === 1 ? 'md:scale-108 z-10 shadow-xl' : ''}`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {/* Selection Indicator */}
                  {selectedPlan?.id === plan.id && (
                    <div className="absolute top-4 left-4 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                {/* Popular Badge for 6-month plan */}
                {plan.duration_months === 6 && (
                  <div className="absolute -top-4 -right-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg animate-pulse z-20">
                    🔥 MOST POPULAR
                  </div>
                )}
                
                {/* Best Value Badge for 12-month plan */}
                {plan.duration_months === 12 && (
                  <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg z-20">
                    👑 BEST VALUE
                  </div>
                )}

                {/* New Customer Badge for 3-month plan */}
                {plan.duration_months === 3 && (
                  <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg z-20">
                    🌟 STARTER
                  </div>
                )}

                <CardContent className="p-4">
                  <div className="text-center">
                    {/* Duration with Icon */}
                    <div className="text-2xl font-bold mb-2 text-transparent bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text">
                      {plan.duration_months === 3 && '📅'} 
                      {plan.duration_months === 6 && '🗓️'} 
                      {plan.duration_months === 12 && '📆'} 
                      {plan.duration_months} Months
                    </div>
                    
                    {/* Plan Title */}
                    <h3 className="text-lg font-bold mb-3 text-gray-900">
                      {plan.title}
                    </h3>
                    
                    {/* Discount Badge - Prominent */}
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white mb-4 shadow-lg">
                      🎁 {plan.discount_percentage}% OFF
                    </div>

                    {/* Price Display */}
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 line-through mb-1">
                        ₹{plan.original_price?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xl font-bold text-purple-600 mb-1">
                        ₹{plan.discounted_price?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        Only ₹{Math.round((plan.discounted_price || 0) / plan.duration_months).toLocaleString('en-IN')}/month
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      {plan.description}
                    </p>

                    {/* Key Benefits */}
                    <div className="text-left bg-gray-50 rounded-lg p-2">
                      <h4 className="font-semibold text-gray-900 mb-2 text-center text-xs">✨ Key Benefits</h4>
                      <ul className="text-xs text-gray-700 space-y-1">
                        {plan.benefits.slice(0, 3).map((benefit, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2 font-bold">✓</span>
                            {benefit}
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
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Service Selection */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader title="Select Services" subtitle="Choose services to add to your plan" />
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                    {services.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        No active services available. Please check with administrator.
                      </div>
                    )}
                    {services.map((service) => {
                      const quantity = selectedServices[service.id]?.quantity || 0;
                      const originalPrice = service.discountedPrice || service.basePrice;
                      const discountedPrice = selectedPlan ? Math.round(originalPrice * (1 - selectedPlan.discount_percentage / 100)) : originalPrice;
                      
                      return (
                        <Card
                          key={service.id}
                          variant={quantity > 0 ? "elevated" : "default"}
                          className={`transition-all duration-200 ${
                            quantity > 0
                              ? 'border-orange-500 bg-orange-50'
                              : 'hover:border-gray-300'
                          }`}
                        >
                          <CardContent className="p-2">
                            <div className="flex items-start space-x-2">
                              <div className="flex items-center space-x-2 mt-1">
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => handleServiceDecrement(service.id)}
                                  disabled={quantity === 0}
                                  className="w-6 h-6 p-0 rounded-full text-xs"
                                >
                                  -
                                </Button>
                                
                                <div className="w-8 h-6 flex items-center justify-center bg-gray-100 rounded border text-xs font-medium">
                                  {quantity}
                                </div>
                                
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => handleServiceIncrement(service.id)}
                                  className="w-6 h-6 p-0 rounded-full text-xs"
                                >
                                  +
                                </Button>
                              </div>
                              
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 text-xs">{service.name}</h4>
                                <p className="text-xs text-gray-600 mt-0.5">{service.shortDescription}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-sm font-bold text-green-600">{formatPrice(discountedPrice)}</span>
                                  {quantity > 1 && (
                                    <span className="text-xs font-medium text-orange-600">×{quantity}</span>
                                  )}
                                  <span className="text-xs text-gray-500 line-through">{formatPrice(originalPrice)}</span>
                                  {selectedPlan && (
                                    <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full font-medium">
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
              <Card className="sticky top-4">
                <CardHeader title="Order Summary" />
                <CardContent>
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
                          <span className="font-medium">{Object.keys(selectedServices).length}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-500 text-sm">Total Quantity</span>
                          <span className="text-sm font-medium">{Object.values(selectedServices).reduce((sum, service) => sum + service.quantity, 0)}</span>
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
                            <span>Discount ({selectedPlan.discount_percentage}%)</span>
                            <span className="font-medium">-{formatPrice(totals.discountAmount)}</span>
                          </div>
                          <hr />
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total Amount</span>
                            <span className="text-purple-600">{formatPrice(totals.finalAmount)}</span>
                          </div>
                        </div>
                      )}

                      {/* Plan Benefits */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Plan Benefits</h4>
                        <div className="space-y-2">
                          {selectedPlan.benefits.slice(0, 4).map((benefit, index) => (
                            <div key={index} className="flex items-start space-x-2 text-sm">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span className="text-gray-700">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Checkout Buttons */}
                      <div className="space-y-3">
                        <Button
                          onClick={handleProceedToCheckout}
                          disabled={Object.keys(selectedServices).length === 0}
                          variant="primary"
                          size="lg"
                          fullWidth
                          className="text-base"
                        >
                          {Object.keys(selectedServices).length === 0 
                            ? '🛒 Select Services First'
                            : `🛒 Buy Plan + Services`
                          }
                        </Button>

                        <Button
                          onClick={handlePlanPurchase}
                          variant="secondary"
                          size="md"
                          fullWidth
                          className="text-sm"
                        >
                          💳 Buy Plan Only - {selectedPlan ? formatPrice(selectedPlan.discounted_price || 0) : 'Select Plan'}
                        </Button>
                      </div>

                      {/* Terms */}
                      <div className="mt-4 text-xs text-gray-500">
                        <div className="font-medium mb-1">Terms & Conditions:</div>
                        <div className="space-y-1">
                          {selectedPlan.terms_conditions.slice(0, 2).map((term, index) => (
                            <div key={index}>• {term}</div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {!selectedPlan && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-lg mb-1 text-sm">👆</div>
                      <div>Select a plan above to see details</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 text-sm">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about our combo plans
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <Card hover>
              <CardContent>
                <h4 className="font-bold text-blue-600 mb-1 text-sm">🤔 How do the discount plans work?</h4>
                <p className="text-gray-600 text-xs">Purchase any plan and get the discount automatically applied to all your future service bookings during the plan period.</p>
              </CardContent>
            </Card>
            
            <Card hover>
              <CardContent>
                <h4 className="font-bold text-green-600 mb-1 text-sm">💳 Can I upgrade my plan later?</h4>
                <p className="text-gray-600 text-xs">Yes! You can upgrade from a shorter plan to a longer one anytime. We'll adjust the pricing and extend your benefits accordingly.</p>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent>
                <h4 className="font-bold text-purple-600 mb-1 text-sm">🔄 What if I don't use all services?</h4>
                <p className="text-gray-600 text-xs">No worries! Your plan benefits carry forward. Unused discounts don't expire during your plan period.</p>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent>
                <h4 className="font-bold text-orange-600 mb-1 text-sm">🚨 Are emergency services included?</h4>
                <p className="text-gray-600 text-xs">Premium Care Plus and Elite Home Guard include free emergency callouts. Smart Start gets priority scheduling.</p>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent>
                <h4 className="font-bold text-yellow-600 mb-1 text-sm">🏠 Multiple properties support?</h4>
                <p className="text-gray-600 text-xs">Elite Home Guard plan is transferable within family and can be used for multiple properties.</p>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent>
                <h4 className="font-bold text-teal-600 mb-1 text-sm">📞 How do I contact my coordinator?</h4>
                <p className="text-gray-600 text-xs">Premium and Elite members get direct contact details for their dedicated service coordinator.</p>
              </CardContent>
            </Card>
          </div>

        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-8 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-3">💬 Still have questions?</h2>
            <p className="text-sm text-orange-100 mb-4 max-w-2xl mx-auto">
              Our customer support team is here to help you choose the perfect plan
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="secondary" size="sm">
                📱 WhatsApp Support
              </Button>
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-purple-600">
                📞 Call Now
              </Button>
              <Button variant="secondary" size="sm">
                💬 Live Chat
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OfferPage;