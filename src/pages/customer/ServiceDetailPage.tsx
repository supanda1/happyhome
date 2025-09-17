import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useServices } from '../../contexts/ServiceContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, Button, Badge } from '../../components/ui';
import { formatPriceWithDiscount } from '../../utils/priceFormatter';
import WhatsAppButton from '../../components/ui/WhatsAppButton';
import FacebookButton from '../../components/ui/FacebookButton';

const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getServiceById, loadServices } = useServices();
  const { isAuthenticated } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllInclusions, setShowAllInclusions] = useState(false);
  const [showAllExclusions, setShowAllExclusions] = useState(false);

  const service = id ? getServiceById(id) : null;

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleBookService = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/services/${id}` } });
      return;
    }
    navigate(`/booking/${id}`);
  };

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h2>
          <p className="text-gray-600 mb-4">The service you're looking for doesn't exist.</p>
          <Link to="/services">
            <Button>Browse All Services</Button>
          </Link>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <span className="text-yellow-600 font-semibold">
        {rating.toFixed(1)} stars
      </span>
    );
  };

  const displayedInclusions = showAllInclusions ? service.inclusions : service.inclusions.slice(0, 5);
  const displayedExclusions = showAllExclusions ? service.exclusions : service.exclusions.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <span>›</span>
          <Link to="/services" className="hover:text-primary-600">Services</Link>
          <span>›</span>
          <Link to={`/services?category=${service.category.id}`} className="hover:text-primary-600">
            {service.category.name}
          </Link>
          <span>›</span>
          <span className="text-gray-900">{service.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images Section */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden mb-6">
              <div className="aspect-w-16 aspect-h-9">
                {service.photos.length > 0 ? (
                  <img
                    src={service.photos[selectedImageIndex]?.url || service.photos[0].url}
                    alt={service.photos[selectedImageIndex]?.altText || service.photos[0].altText}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-700">{service.category.name}</span>
                  </div>
                )}
              </div>
              
              {/* Image Thumbnails */}
              {service.photos.length > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2 overflow-x-auto">
                    {service.photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImageIndex === index
                            ? 'border-primary-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={photo.altText}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Service Description */}
            <Card>
              <CardHeader title="Service Description" />
              <CardContent>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {service.description}
                </p>

                {/* Tags */}
                {service.tags.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {service.tags.map((tag) => (
                        <Badge key={tag} variant="info" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* What's Included */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">What's Included</h4>
                  <ul className="space-y-2">
                    {displayedInclusions.map((inclusion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2 mt-0.5">✓</span>
                        <span className="text-gray-700">{inclusion}</span>
                      </li>
                    ))}
                  </ul>
                  {service.inclusions.length > 5 && (
                    <button
                      onClick={() => setShowAllInclusions(!showAllInclusions)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2"
                    >
                      {showAllInclusions ? 'Show Less' : `Show ${service.inclusions.length - 5} More`}
                    </button>
                  )}
                </div>

                {/* What's Not Included */}
                {service.exclusions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">What's Not Included</h4>
                    <ul className="space-y-2">
                      {displayedExclusions.map((exclusion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-500 mr-2 mt-0.5">✗</span>
                          <span className="text-gray-700">{exclusion}</span>
                        </li>
                      ))}
                    </ul>
                    {service.exclusions.length > 3 && (
                      <button
                        onClick={() => setShowAllExclusions(!showAllExclusions)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2"
                      >
                        {showAllExclusions ? 'Show Less' : `Show ${service.exclusions.length - 3} More`}
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-primary-600 font-medium">
                      {service.category.name}
                    </span>
                    {service.isFeatured && (
                      <Badge variant="warning" size="sm">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {service.name}
                  </h1>
                  
                  {/* Rating */}
                  {service.rating > 0 && (
                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        {renderStars(service.rating)}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {service.rating} ({service.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Service Price</span>
                    {service.discountedPrice && (
                      <Badge variant="success" size="sm">
                        {formatPriceWithDiscount(service.basePrice, service.discountedPrice).discountPercentage}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    {service.discountedPrice ? (
                      <>
                        <span className="text-3xl font-bold text-primary-600">
                          {formatPriceWithDiscount(service.basePrice, service.discountedPrice).discountedPrice}
                        </span>
                        <span className="text-lg text-gray-500 line-through">
                          {formatPriceWithDiscount(service.basePrice, service.discountedPrice).originalPrice}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-primary-600">
                        {formatPriceWithDiscount(service.basePrice).displayPrice}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Duration: {service.duration} minutes
                  </div>
                </div>

                {/* Availability Status */}
                <div className="mb-6">
                  {service.availability.isAvailable ? (
                    <div className="flex items-center text-green-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-sm font-medium">Available for booking</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      <span className="text-sm font-medium">Currently unavailable</span>
                    </div>
                  )}
                </div>

                {/* Book Service Button */}
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleBookService}
                  disabled={!service.availability.isAvailable}
                  className="mb-3"
                >
                  {isAuthenticated ? 'Book This Service' : 'Login to Book'}
                </Button>

                {/* WhatsApp Contact Button */}
                <div className="mb-4">
                  <WhatsAppButton
                    message={`Hi! I'm interested in ${service.name}. Can you help me with booking and pricing details?`}
                    className="w-full justify-center"
                  >
                    Get Help on WhatsApp
                  </WhatsAppButton>
                </div>

                {/* Facebook Share Button */}
                <div className="mb-4">
                  <FacebookButton
                    variant="share"
                    shareUrl={window.location.href}
                    message={`Check out ${service.name} service on Happy Homes! Great pricing and professional service.`}
                    className="w-full justify-center"
                  >
                    Share on Facebook
                  </FacebookButton>
                </div>

                {/* Additional Info */}
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center">
                    <span className="w-4 h-4 mr-2">📞</span>
                    <span>Free consultation call</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4 h-4 mr-2">🛡️</span>
                    <span>Insured professionals</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4 h-4 mr-2">⏰</span>
                    <span>Same-day service available</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4 h-4 mr-2">💯</span>
                    <span>100% satisfaction guarantee</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        {service.reviews.length > 0 && (
          <div className="mt-12">
            <Card>
              <CardHeader 
                title={`Customer Reviews (${service.reviewCount})`}
                subtitle={`Average rating: ${service.rating}/5`}
              />
              <CardContent>
                <div className="space-y-6">
                  {service.reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-primary-600 font-medium">
                              {review.user.firstName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {review.user.firstName} {review.user.lastName}
                            </p>
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                              <span className="ml-2 text-sm text-gray-600">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {review.isVerified && (
                          <Badge variant="success" size="sm">
                            Verified
                          </Badge>
                        )}
                      </div>
                      {review.title && (
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {review.title}
                        </h4>
                      )}
                      <p className="text-gray-700">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
                
                {service.reviews.length > 3 && (
                  <div className="text-center mt-6">
                    <Button variant="outline">
                      View All Reviews ({service.reviewCount})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetailPage;