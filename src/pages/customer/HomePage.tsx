import React, { useEffect, useState } from 'react';
import { useServices } from '../../contexts/ServiceContext';
import { Card, CardContent, Button } from '../../components/ui';
import { formatPriceWithDiscount } from '../../utils/priceFormatter';
import { cartService } from '../../utils/services/cart.service';

interface HomePageProps {
  navigateToServiceDetail: (serviceId: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ navigateToServiceDetail }) => {
  const { categories, services, loadCategories, loadServices, loading } = useServices();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [cartMessages, setCartMessages] = useState<{[serviceId: string]: string}>({});
  
  const featuredServices = services.filter(service => service.isFeatured).slice(0, 6);
  const allServices = services.slice(0, 12); // Show first 12 services in the all services section

  useEffect(() => {
    loadCategories();
    loadServices();
  }, [loadCategories, loadServices]);

  const handleAddToCart = async (serviceId: string, serviceName: string) => {
    try {
      setAddingToCart(serviceId);
      await cartService.addToCart({
        serviceId,
        quantity: 1
      });
      
      setCartMessages(prev => ({
        ...prev,
        [serviceId]: `${serviceName} added to cart!`
      }));
      
      // Clear message after 2 seconds
      setTimeout(() => {
        setCartMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[serviceId];
          return newMessages;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setCartMessages(prev => ({
        ...prev,
        [serviceId]: 'Failed to add to cart'
      }));
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* ULTRA MEGA OBVIOUS TEST BANNER - IMPOSSIBLE TO MISS */}
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-8 text-3xl font-black z-[9999] animate-pulse border-8 border-yellow-400">
        🚨🚨🚨 URGENT TEST: IF YOU SEE THIS, CHANGES ARE WORKING! 🚨🚨🚨
        <div className="text-yellow-300 text-xl mt-2">
          📍 You're on HomePage - This proves file changes are being served! 📍
        </div>
      </div>
      
      {/* Push content down */}
      <div className="pt-32"></div>
      
      {/* SECONDARY TEST BANNER */}
      <div className="bg-green-500 text-white text-center py-4 text-xl font-bold z-50 relative animate-bounce">
        ✅ HOMEPAGE LOADED WITH CHANGES! Navigation should be visible on other pages! ✅
      </div>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 via-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Professional Home Services
              <span className="block text-orange-200">At Your Doorstep</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-orange-100 max-w-3xl mx-auto">
              Get reliable, professional services for your home. From plumbing to cleaning, 
              we connect you with trusted professionals in your area.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Browse Services
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-orange-600">
                How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Service Categories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from our wide range of professional home services
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600 font-semibold">Loading categories...</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.slice(0, 8).map((category) => (
                <div
                  key={category.id}
                  className="group cursor-pointer"
                >
                  <Card hover className="text-center h-full transition-transform group-hover:scale-105">
                    <CardContent>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {category.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* All Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional home services at your fingertips
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600 font-semibold">Loading services...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allServices.map((service) => (
                <Card key={service.id} hover className="overflow-hidden relative">
                  {/* Cart Success Message */}
                  {cartMessages[service.id] && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                        {cartMessages[service.id]}
                      </div>
                    </div>
                  )}
                  
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                    {service.photos[0] ? (
                      <img
                        src={service.photos[0].url}
                        alt={service.photos[0].altText}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-purple-200 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-700">{service.category.name}</span>
                      </div>
                    )}
                  </div>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-orange-600 font-medium">
                        {service.category.name}
                      </span>
                      {service.rating > 0 && (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600">
                            ⭐ {service.rating} ({service.reviewCount})
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {service.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {service.shortDescription || service.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {service.discountedPrice ? (
                          <>
                            <span className="text-lg font-bold text-orange-600">
                              {formatPriceWithDiscount(service.basePrice, service.discountedPrice).discountedPrice}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              {formatPriceWithDiscount(service.basePrice, service.discountedPrice).originalPrice}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-orange-600">
                            {formatPriceWithDiscount(service.basePrice).displayPrice}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          console.log('🔍 View Details clicked for service:', service.name, 'ID:', service.id);
                          navigateToServiceDetail(service.id);
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddToCart(service.id, service.name)}
                        disabled={addingToCart === service.id}
                      >
                        {addingToCart === service.id ? 'Adding...' : 'Add to Cart'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" variant="outline">
              View All Services
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our most popular and highly-rated services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredServices.map((service) => (
              <Card key={service.id} hover className="overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  {service.photos[0] ? (
                    <img
                      src={service.photos[0].url}
                      alt={service.photos[0].altText}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-purple-200 flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-700">{service.category.name}</span>
                    </div>
                  )}
                </div>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-orange-600 font-medium">
                      {service.category.name}
                    </span>
                    {service.rating > 0 && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600">
                          ⭐ {service.rating} ({service.reviewCount})
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {service.shortDescription || service.description}
                  </p>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        console.log('🔍 View Details clicked for service:', service.name, 'ID:', service.id);
                        navigateToServiceDetail(service.id);
                      }}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToCart(service.id, service.name)}
                      disabled={addingToCart === service.id}
                    >
                      {addingToCart === service.id ? 'Adding...' : 'Add to Cart'}
                    </Button>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {service.discountedPrice ? (
                        <>
                          <span className="text-lg font-bold text-orange-600">
                            {formatPriceWithDiscount(service.basePrice, service.discountedPrice).discountedPrice}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPriceWithDiscount(service.basePrice, service.discountedPrice).originalPrice}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-orange-600">
                          {formatPriceWithDiscount(service.basePrice).displayPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Getting professional help for your home is easy with our simple process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: 'Choose Your Service',
                description: 'Browse our services and select what you need for your home.',
              },
              {
                step: 2,
                title: 'Book Appointment',
                description: 'Schedule a convenient time and provide your location details.',
              },
              {
                step: 3,
                title: 'Get It Done',
                description: 'Our verified professionals will complete the job to your satisfaction.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Happy Homes - Small Icons Section */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Why Choose Happy Homes?
            </h3>
            <p className="text-gray-600">
              Professional, reliable, and trusted service
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl text-white">🔧</span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Expert Professionals</h4>
              <p className="text-xs text-gray-600">Verified & experienced</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl text-white">⚡</span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Same Day Service</h4>
              <p className="text-xs text-gray-600">Quick & efficient</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl text-white">🛡️</span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Insured & Bonded</h4>
              <p className="text-xs text-gray-600">Safe & secure</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl text-white">💯</span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">100% Guarantee</h4>
              <p className="text-xs text-gray-600">Satisfaction assured</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us with their home services.
          </p>
          <Button size="lg" variant="secondary">
            Book a Service Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;