import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../../contexts/ServiceContext';
import { Card, CardContent, Button } from '../../components/ui';
import { formatPriceWithDiscount } from '../../utils/priceFormatter';

const HomePage: React.FC = () => {
  const { categories, services, loadCategories, loadServices, loading } = useServices();
  const featuredServices = services.filter(service => service.isFeatured).slice(0, 6);

  useEffect(() => {
    loadCategories();
    loadServices();
  }, [loadCategories, loadServices]);

  return (
    <div className="min-h-screen">
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
              <Link to="/services">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Browse Services
                </Button>
              </Link>
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
                <Link
                  key={category.id}
                  to={`/services?category=${category.id}`}
                  className="group"
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
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 bg-gray-50">
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
                          {service.rating} stars ({service.reviewCount})
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {service.shortDescription}
                  </p>
                  
                  <div className="flex items-center justify-between">
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
                    <Link to={`/services/${service.id}`}>
                      <Button size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/services">
              <Button size="lg" variant="outline">
                View All Services
              </Button>
            </Link>
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

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us with their home services.
          </p>
          <Link to="/services">
            <Button size="lg" variant="secondary">
              Book a Service Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;