import React, { useState, useEffect } from 'react';

interface CategoryPageProps {
  categoryName: string;
  icon: string;
}

// Enhanced service categories with subcategories
const serviceCategories = {
  'All Services': [],
  'Plumbing': [
    'Bath Fittings',
    'Basin, Sink & Drainage', 
    'Grouting',
    'Toilets',
    'Pipe & Connector',
    'Water Tank',
    'Others'
  ],
  'Electrical': [
    'Wiring & Installation',
    'Appliance Repair',
    'Switch & Socket',
    'Fan Installation',
    'Lighting Solutions',
    'Electrical Safety Check'
  ],
  'Cleaning': [
    'Bathroom Cleaning',
    'AC Cleaning',
    'Water Tank Cleaning',
    'Septic Tank Cleaning', 
    'Water Purifier Cleaning',
    'Car Wash'
  ],
  'Call A Service': [
    'Inter/Intra City Courier',
    'CAB Booking', 
    'Vehicle Breakdown Service',
    'Photographer'
  ],
  'Finance & Insurance': [
    'GST Registration and Filing',
    'PAN Card Application',
    'ITR Filing',
    'Stamp Paper Agreement'
  ],
  'Personal Care': [
    'Medicine Delivery',
    'Salon at Door'
  ],
  'Civil Work': [
    'House Painting',
    'Tile/Granite/Marble Works',
    'House Repair'
  ]
};

// Function to get icons for subcategories
const getSubcategoryIcon = (subcategory: string): string => {
  const iconMap: { [key: string]: string } = {
    // Plumbing
    'Bath Fittings': '🚿',
    'Basin, Sink & Drainage': '🚰',
    'Grouting': '🔧',
    'Toilets': '🚽',
    'Pipe & Connector': '🔗',
    'Water Tank': '🪣',
    'Others': '⚙️',
    
    // Electrical
    'Wiring & Installation': '⚡',
    'Appliance Repair': '🔌',
    'Switch & Socket': '💡',
    'Fan Installation': '🌀',
    'Lighting Solutions': '💡',
    'Electrical Safety Check': '⚠️',
    
    // Cleaning
    'Bathroom Cleaning': '🛁',
    'AC Cleaning': '❄️',
    'Water Tank Cleaning': '🪣',
    'Septic Tank Cleaning': '🏠',
    'Water Purifier Cleaning': '💧',
    'Car Wash': '🚗',
    
    // Call A Service
    'Inter/Intra City Courier': '📦',
    'CAB Booking': '🚕',
    'Vehicle Breakdown Service': '🔧',
    'Photographer': '📸',
    
    // Finance & Insurance
    'GST Registration and Filing': '📋',
    'PAN Card Application': '🆔',
    'ITR Filing': '📊',
    'Stamp Paper Agreement': '📄',
    
    // Personal Care
    'Medicine Delivery': '💊',
    'Salon at Door': '💅',
    
    // Civil Work
    'House Painting': '🎨',
    'Tile/Granite/Marble Works': '🧱',
    'House Repair': '🔨'
  };
  
  return iconMap[subcategory] || '🔧';
};

// Star Rating Helper Function
const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg', 
    lg: 'text-xl'
  };
  
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const partiallyFilled = rating > star - 1 && rating < star;
        
        return (
          <span key={star} className={`${sizeClasses[size]} relative`}>
            {partiallyFilled ? (
              <span className="relative">
                <span className="text-gray-300">★</span>
                <span 
                  className="absolute top-0 left-0 text-yellow-400 overflow-hidden"
                  style={{ width: `${(rating - (star - 1)) * 100}%` }}
                >
                  ★
                </span>
              </span>
            ) : (
              <span className={filled ? 'text-yellow-400' : 'text-gray-300'}>★</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

const App: React.FC = () => {
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Services');
  const [currentPage, setCurrentPage] = useState('home');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowServicesDropdown(false);
    };

    if (showServicesDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showServicesDropdown]);

  // Navigation functions
  const navigateToHome = () => {
    setCurrentPage('home');
    setShowServicesDropdown(false);
  };

  const navigateToCategory = (category: string) => {
    setCurrentPage(category.toLowerCase().replace(/\s+/g, '-'));
    setShowServicesDropdown(false);
  };

  const navigateToSubcategory = (category: string, subcategory: string) => {
    setCurrentPage(`${category.toLowerCase().replace(/\s+/g, '-')}-${subcategory.toLowerCase().replace(/\s+/g, '-')}`);
    setShowServicesDropdown(false);
  };


  // Customer Review Section component
  const CustomerReviewSection = ({ serviceName }: { serviceName: string }) => {
    const reviewData = {
      averageRating: 4.8,
      totalReviews: 1247,
      ratingBreakdown: {
        5: 856,
        4: 298,
        3: 67,
        2: 18,
        1: 8
      },
      reviews: [
        {
          id: 1,
          name: "Rajesh Kumar",
          rating: 5,
          date: "2024-08-20",
          comment: "Excellent service! The technician was very professional and completed the bath fittings installation perfectly. All accessories were properly aligned and sealed.",
          verified: true,
          helpful: 24
        },
        {
          id: 2,
          name: "Priya Sharma",
          rating: 5,
          date: "2024-08-18",
          comment: "Quick and efficient service. Premium package was worth it - got 1-year warranty and follow-up service. Highly recommended for bathroom fittings work.",
          verified: true,
          helpful: 18
        },
        {
          id: 3,
          name: "Amit Patel",
          rating: 4,
          date: "2024-08-15",
          comment: "Good service overall. Classic package worked well for basic installation. Only minor issue was slight delay in arrival time but work quality was satisfactory.",
          verified: true,
          helpful: 12
        },
        {
          id: 4,
          name: "Sunita Reddy",
          rating: 5,
          date: "2024-08-12",
          comment: "Outstanding experience! Premium service included deep cleaning after work and follow-up call. Technician explained everything clearly and fixed old leakage issue too.",
          verified: true,
          helpful: 31
        },
        {
          id: 5,
          name: "Vikram Singh",
          rating: 4,
          date: "2024-08-10",
          comment: "Professional service with quality work. Appreciated the transparent pricing and no hidden charges. Will definitely book again for other home services.",
          verified: true,
          helpful: 15
        }
      ]
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative" style={{backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(59, 130, 246, 0.04) 0%, transparent 60%), radial-gradient(circle at 70% 30%, rgba(14, 165, 233, 0.05) 0%, transparent 60%)'}}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button 
              onClick={() => navigateToSubcategory('Plumbing', 'Bath Fittings')}
              className="text-blue-600 hover:text-blue-800 text-sm mb-2"
            >
              ← Back to Bath Fittings
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Customer Reviews - {serviceName}</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Rating Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Summary</h2>
                
                {/* Overall Rating */}
                <div className="text-center mb-6 pb-6 border-b border-gray-200">
                  <div className="text-4xl font-bold text-gray-900 mb-2">{reviewData.averageRating}</div>
                  <div className="flex justify-center items-center mb-2">
                    {renderStars(reviewData.averageRating, 'lg')}
                  </div>
                  <div className="text-sm text-gray-600">{reviewData.totalReviews} reviews</div>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-2">
                  {[5,4,3,2,1].map((rating) => (
                    <div key={rating} className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600 w-6">{rating}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${(reviewData.ratingBreakdown[rating] / reviewData.totalReviews) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12">{reviewData.ratingBreakdown[rating]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Reviews List */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {reviewData.reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{review.name}</div>
                          <div className="flex items-center space-x-2">
                            {renderStars(review.rating, 'sm')}
                            {review.verified && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Verified</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</div>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <button className="text-sm text-gray-600 hover:text-blue-600 flex items-center space-x-1">
                        <span>👍</span>
                        <span>Helpful ({review.helpful})</span>
                      </button>
                      <button className="text-sm text-gray-600 hover:text-blue-600">
                        Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              <div className="text-center mt-8">
                <button className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  Load More Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // Service detail page component  
  const ServiceDetailPage = ({ categoryName, serviceName, icon }: { categoryName: string; serviceName: string; icon: string }) => {
    const [selectedTab, setSelectedTab] = useState('type');
    const [selectedVariant, setSelectedVariant] = useState('classic');
    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Mock service data for Bath Fittings with variant-specific content
    const serviceData = {
      name: "Bath Fittings Installation & Repair",
      rating: 4.8,
      reviewCount: 1247,
      monthlyBookings: 324,
      originalPrice: 149,
      discountedPrice: 99,
      discount: 26,
      description: "Professional installation and repair of bathroom fittings including taps, shower heads, towel holders, soap dispensers, and other bathroom accessories. Our certified technicians ensure proper fitting and sealing.",
      images: [
        "🚿", "🚰", "🛁", "🔧", "💧"
      ],
      warranty: "30 Days",
      protection: "₹10,000",
      verified: true,
      variants: {
        classic: { 
          price: 99, 
          description: "Standard installation service",
          tabs: {
            type: [
              "Basic Tap Installation & Repair",
              "Standard Shower Head Installation", 
              "Simple Towel Holder Mounting",
              "Basic Soap Dispenser Setup",
              "Standard Bathroom Accessory Installation"
            ],
            inclusion: [
              "Professional technician visit",
              "Basic tools and equipment",
              "Installation of 1-2 fittings",
              "Quality check and testing",
              "30-day service warranty",
              "Basic clean-up after work"
            ],
            notes: [
              "Customer to provide fittings/accessories",
              "Additional charges for drilling in tiles",
              "Service time: 1-2 hours typically",
              "Rescheduling allowed up to 2 hours before",
              "Extra fittings charged at ₹50 each"
            ]
          }
        },
        premium: { 
          price: 149, 
          description: "Premium service with 1-year warranty",
          tabs: {
            type: [
              "Premium Tap Installation & Repair with Sealing",
              "High-End Shower Head Installation with Testing", 
              "Professional Towel Holder Mounting with Alignment",
              "Advanced Soap Dispenser Setup with Calibration",
              "Complete Bathroom Accessory Installation Suite",
              "Plumbing System Health Check"
            ],
            inclusion: [
              "Expert certified technician visit",
              "Professional grade tools and equipment",
              "Installation of up to 5 fittings",
              "Comprehensive quality check and testing",
              "1-year extended service warranty",
              "Complete deep cleaning after work",
              "Follow-up service call within 7 days"
            ],
            notes: [
              "Premium fittings available for purchase",
              "Free drilling in tiles (up to 6 holes)",
              "Service time: 2-3 hours for thorough work",
              "Free rescheduling anytime before service",
              "No extra charges for additional basic fittings",
              "Emergency same-day service available"
            ]
          }
        }
      } as const
    };

    // Get current variant data
    type VariantKey = keyof typeof serviceData.variants;
    const currentVariant = serviceData.variants[selectedVariant as VariantKey];
    const currentTabs = currentVariant.tabs;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 70%), radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 70%), radial-gradient(circle at 40% 40%, rgba(14, 165, 233, 0.08) 0%, transparent 70%)'
        }}>
        {/* Service Category Navigation - Plumbing Subcategories Only */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-blue-200/30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-6 h-12 overflow-x-auto">
              <button 
                onClick={() => navigateToHome()}
                className="text-slate-600 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap hover:bg-white/50 hover:shadow-lg hover:scale-105 transform backdrop-blur-sm"
              >
                ← Home
              </button>
              <span className="text-blue-300/50 font-light">|</span>
              <button 
                onClick={() => navigateToCategory('Plumbing')}
                className="text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                🔧 Plumbing
              </button>
              <span className="text-blue-400/60 font-light">{'>'}</span>
              {serviceCategories['Plumbing'].map((subcategory, index) => (
                <button
                  key={index}
                  onClick={() => navigateToSubcategory('Plumbing', subcategory)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap transform hover:scale-105 ${
                    serviceName === subcategory 
                      ? 'text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl ring-2 ring-purple-200 hover:from-indigo-600 hover:to-purple-700' 
                      : 'text-slate-600 hover:text-blue-600 hover:bg-white/60 hover:shadow-lg backdrop-blur-sm'
                  }`}
                >
                  {getSubcategoryIcon(subcategory)} {subcategory}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Debug Screen Width */}
        <div className="fixed top-0 left-0 bg-black text-white p-2 z-50 text-sm">
          Screen: <span id="width">...</span>px | Grid: 3-6-3
        </div>
        <script dangerouslySetInnerHTML={{
          __html: `
            function updateWidth() {
              const el = document.getElementById('width');
              if (el) el.textContent = window.innerWidth;
            }
            updateWidth();
            window.addEventListener('resize', updateWidth);
          `
        }} />

        {/* Service Detail Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-12 gap-4 md:gap-6 lg:gap-8" style={{border: '3px solid red', backgroundColor: 'rgba(255,255,0,0.1)'}}>
            
            {/* Left Column - Images (Amazon-style Layout) */}
            <div className="col-span-3" style={{border: '2px solid blue', backgroundColor: 'rgba(0,0,255,0.1)', minHeight: '200px'}}>
              <div style={{color: 'blue', fontWeight: 'bold', padding: '5px'}}>LEFT (3 cols)</div>
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-2xl border border-white/20">
                <div className="flex gap-4">
                  {/* Thumbnail Images - Left Side */}
                  <div className="flex flex-col space-y-3 w-16">
                    {serviceData.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg border-2 transition-all duration-300 transform hover:scale-110 ${
                          selectedImageIndex === index 
                            ? 'bg-gradient-to-br from-blue-400 to-indigo-500 border-blue-300 shadow-xl text-white' 
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 hover:border-blue-300 hover:shadow-lg text-gray-600'
                        }`}
                      >
                        {image}
                      </button>
                    ))}
                  </div>
                  
                  {/* Main Image - Right Side */}
                  <div className="flex-1">
                    <div className="aspect-square bg-gradient-to-br from-blue-100 via-white to-indigo-100 rounded-2xl flex items-center justify-center text-8xl border-2 border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10"></div>
                      <span className="relative z-10 drop-shadow-lg">{serviceData.images[selectedImageIndex]}</span>
                    </div>
                  
                  {/* Image Counter */}
                  <div className="text-center mt-2 text-sm text-gray-500">
                    {selectedImageIndex + 1} / {serviceData.images.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Center Column - Service Details */}
            <div className="col-span-6" style={{border: '2px solid green', backgroundColor: 'rgba(0,255,0,0.1)', minHeight: '200px'}}>
              <div style={{color: 'green', fontWeight: 'bold', padding: '5px'}}>CENTER (6 cols)</div>
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 md:p-6 lg:p-8 shadow-2xl border border-white/30">
                {/* Service Name & Rating */}
                <div className="mb-8">
                  <h1 className="text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4 leading-tight">{serviceData.name}</h1>
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-xl border border-yellow-200/50 shadow-lg">
                      {renderStars(serviceData.rating, 'md')}
                      <span className="text-xl font-bold text-slate-800 ml-2">{serviceData.rating}</span>
                      <button 
                        onClick={() => setCurrentPage('plumbing-bath-fittings-reviews')}
                        className="text-blue-600 underline ml-2 hover:text-blue-800 cursor-pointer transition-all duration-300 font-semibold hover:scale-105 transform"
                      >
                        ({serviceData.reviewCount} reviews)
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-slate-600 text-sm font-medium">{serviceData.monthlyBookings} booked last month</p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200/50 shadow-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">₹{currentVariant.price}</span>
                    <span className="text-xl text-slate-500 line-through font-semibold">MRP ₹{serviceData.originalPrice}</span>
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      {Math.round((serviceData.originalPrice - currentVariant.price) / serviceData.originalPrice * 100)}% OFF
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-slate-600 font-medium">{currentVariant.description}</span>
                  </div>
                </div>

                {/* About Service Tab */}
                <div className="mb-8 bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-2xl border border-slate-200/50 shadow-lg">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent mb-4 flex items-center">
                    <span className="mr-2">📋</span> About Service
                  </h3>
                  <p className="text-slate-700 leading-relaxed font-medium">{serviceData.description}</p>
                </div>

                {/* Service Guarantees with Icons */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-blue-200/50">
                    <div className="text-blue-600 text-3xl mb-3 drop-shadow-lg">🛡️</div>
                    <div className="text-blue-700 text-xl font-bold mb-1">{serviceData.warranty}</div>
                    <div className="text-sm text-blue-600 font-semibold mb-1">Warranty</div>
                    <div className="text-xs text-slate-500 font-medium">Service guarantee coverage</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl hover:from-green-100 hover:to-emerald-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-green-200/50">
                    <div className="text-green-600 text-3xl mb-3 drop-shadow-lg">🔒</div>
                    <div className="text-green-700 text-xl font-bold mb-1">{serviceData.protection}</div>
                    <div className="text-sm text-green-600 font-semibold mb-1">Protection</div>
                    <div className="text-xs text-slate-500 font-medium">Damage protection fund</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl hover:from-purple-100 hover:to-violet-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-purple-200/50">
                    <div className="text-purple-600 text-3xl mb-3 drop-shadow-lg">✅</div>
                    <div className="text-purple-700 text-xl font-bold mb-1">HH</div>
                    <div className="text-sm text-purple-600 font-semibold mb-1">Verified Service</div>
                    <div className="text-xs text-slate-500 font-medium">Quality assured by Happy Homes</div>
                  </div>
                </div>

                {/* Service Details Tabs */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/30 shadow-2xl overflow-hidden">
                  {/* Tab Headers */}
                  <div className="flex bg-gradient-to-r from-slate-100 to-gray-100 border-b border-slate-200/50">
                    {['type', 'inclusion', 'notes'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`flex-1 px-6 py-4 text-sm font-bold capitalize transition-all duration-300 transform hover:scale-105 ${
                          selectedTab === tab 
                            ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl border-b-4 border-blue-400' 
                            : 'text-slate-600 hover:text-blue-600 hover:bg-white/50'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                
                  {/* Tab Content */}
                  <div className="p-6 bg-gradient-to-br from-white/80 to-slate-50/80">
                    <ul className="space-y-4">
                      {(currentTabs[selectedTab as keyof typeof currentTabs] || []).map((item: string, index: number) => (
                        <li key={index} className="flex items-start bg-white/60 p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-white/40">
                          <span className="text-green-500 mr-3 mt-1 text-lg">✓</span>
                          <span className="text-slate-700 text-sm font-medium leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Booking Panel */}
            <div className="col-span-3" style={{border: '2px solid orange', backgroundColor: 'rgba(255,165,0,0.1)', minHeight: '200px'}}>
              <div style={{color: 'orange', fontWeight: 'bold', padding: '5px'}}>RIGHT (3 cols)</div>
              <div className="sm:sticky sm:top-6">
                <div className="bg-white/95 backdrop-blur-xl border border-white/30 rounded-3xl p-4 md:p-6 lg:p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
                  
                  {/* Service Variant Selection - Side by Side */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent mb-4 text-center">✨ Choose Service Package</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(serviceData.variants).map(([variantKey, variantData]) => (
                        <button
                          key={variantKey}
                          onClick={() => setSelectedVariant(variantKey)}
                          className={`px-4 py-6 rounded-2xl text-sm font-bold border-2 transition-all duration-300 transform hover:scale-110 text-center relative overflow-hidden ${
                            selectedVariant === variantKey
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-400 shadow-2xl scale-110 ring-4 ring-blue-200/50'
                              : 'bg-gradient-to-br from-white to-gray-50 text-slate-700 border-gray-200 hover:border-blue-300 hover:shadow-xl'
                          }`}
                        >
                          <div className="relative z-10">
                            <div className="font-black capitalize mb-2 text-base">{variantKey}</div>
                            <div className="text-2xl font-black mb-3">₹{variantData.price}</div>
                            <div className={`text-xs leading-tight font-semibold ${selectedVariant === variantKey ? 'text-blue-100' : 'text-slate-600'}`}>
                              {variantData.description}
                            </div>
                          </div>
                          {selectedVariant === variantKey && (
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-600/20"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-3">📦 Quantity</label>
                    <div className="flex items-center bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-5 py-4 bg-gradient-to-br from-red-500 to-red-600 text-white font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-110 shadow-lg"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center py-4 bg-gradient-to-r from-blue-50 to-indigo-50 font-black text-xl text-slate-800">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-5 py-4 bg-gradient-to-br from-green-500 to-green-600 text-white font-bold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-110 shadow-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Address Display */}
                  <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-200/50 shadow-lg">
                    <div className="text-sm font-semibold text-purple-600 mb-1 flex items-center">
                      <span className="mr-2">📍</span> Services to
                    </div>
                    <div className="text-sm font-bold text-slate-800">Bhubaneswar, Odisha 751001</div>
                  </div>

                  {/* Coupon Section */}
                  <div className="mb-8">
                    <button className="w-full border-2 border-dashed border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl px-6 py-4 text-orange-600 hover:border-orange-400 hover:text-orange-700 transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105">
                      🎟️ + Apply Coupon
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-5 px-6 rounded-2xl font-black text-lg mb-8 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:rotate-1">
                    🛒 Add to Cart
                  </button>

                  {/* HH Promises */}
                  <div className="mb-8 bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-2xl border border-teal-200/50 shadow-lg">
                    <h4 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 text-center">🌟 HH Promises</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center bg-white/60 backdrop-blur-sm p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                        <span className="text-green-500 mr-3 text-lg">🎓</span>
                        <span className="text-sm font-semibold text-slate-700">Trained Professional</span>
                      </li>
                      <li className="flex items-center bg-white/60 backdrop-blur-sm p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                        <span className="text-blue-500 mr-3 text-lg">⚡</span>
                        <span className="text-sm font-semibold text-slate-700">Quick Response</span>
                      </li>
                      <li className="flex items-center bg-white/60 backdrop-blur-sm p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                        <span className="text-purple-500 mr-3 text-lg">💰</span>
                        <span className="text-sm font-semibold text-slate-700">Competitive Pricing</span>
                      </li>
                      <li className="flex items-center bg-white/60 backdrop-blur-sm p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                        <span className="text-pink-500 mr-3 text-lg">🏠</span>
                        <span className="text-sm font-semibold text-slate-700">Homely Services</span>
                      </li>
                    </ul>
                  </div>

                  {/* Social Media Icons */}
                  <div className="border-t-2 border-gradient-to-r from-blue-200 to-purple-200 pt-6">
                    <h4 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 text-center">🚀 Share & Connect</h4>
                    <div className="flex justify-center space-x-4">
                      <a 
                        href="https://wa.me/919876543210?text=Hi%20I%20want%20to%20book%20Bath%20Fittings%20service"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-2xl flex items-center justify-center hover:from-green-500 hover:to-green-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-110 hover:rotate-3 ring-4 ring-green-200/50"
                        title="Share on WhatsApp"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                      </a>
                      <a 
                        href="https://www.facebook.com/sharer/sharer.php?u=happyhomes.com/bath-fittings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl flex items-center justify-center hover:from-blue-600 hover:to-blue-800 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-110 hover:rotate-3 ring-4 ring-blue-200/50"
                        title="Share on Facebook"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                      <a 
                        href="https://twitter.com/intent/tweet?text=Great%20Bath%20Fittings%20service%20by%20Happy%20Homes&url=happyhomes.com/bath-fittings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-600 text-white rounded-2xl flex items-center justify-center hover:from-sky-500 hover:to-sky-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-110 hover:rotate-3 ring-4 ring-sky-200/50"
                        title="Share on Twitter"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  };


  // Category Page Components
  const CategoryPage = ({ categoryName, icon }: CategoryPageProps) => {
    const subcategories = serviceCategories[categoryName as keyof typeof serviceCategories] || [];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 relative" style={{backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(168, 85, 247, 0.04) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.04) 0%, transparent 60%)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <button 
              onClick={navigateToHome}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Home
            </button>
            <span className="mx-2 text-gray-500">/</span>
            <span className="text-gray-700 text-sm">{categoryName}</span>
          </nav>

          {/* Category Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {icon} {categoryName}
            </h1>
            <p className="text-lg text-gray-600">
              Choose from our professional {categoryName.toLowerCase()} services
            </p>
          </div>

          {/* Subcategory Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subcategories.map((subcategory, index) => (
              <div 
                key={index}
                onClick={() => navigateToSubcategory(categoryName, subcategory)}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200 group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all">
                    <span className="text-2xl">{getSubcategoryIcon(subcategory)}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {subcategory}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Professional {subcategory.toLowerCase()} services
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600 font-medium">Available</span>
                    <span className="text-gray-500">Book Now →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <div className="bg-blue-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Need Help Choosing?
              </h2>
              <p className="text-gray-600 mb-6">
                Our experts are here to help you find the perfect service for your needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Call Expert: +91-9876543210
                </button>
                <button className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors">
                  Get Free Consultation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // Home Page Component
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center relative" style={{backgroundImage: 'radial-gradient(circle at 15% 85%, rgba(16, 185, 129, 0.05) 0%, transparent 60%), radial-gradient(circle at 85% 15%, rgba(20, 184, 166, 0.04) 0%, transparent 60%), linear-gradient(45deg, rgba(34, 197, 94, 0.02) 0%, transparent 50%)'}}>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Happy Homes
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your trusted partner for home maintenance and services
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div 
            onClick={() => navigateToCategory('Plumbing')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-gray-900 mb-2">🔧 Plumbing</h3>
            <p className="text-xs text-gray-600 mb-2">Bath Fittings, Toilets, Pipes & more</p>
            <div className="flex flex-wrap gap-1">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Bath Fittings</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Toilets</span>
            </div>
          </div>
          <div 
            onClick={() => navigateToCategory('Electrical')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-gray-900 mb-2">⚡ Electrical</h3>
            <p className="text-xs text-gray-600 mb-2">Wiring, Appliances, Safety Checks</p>
            <div className="flex flex-wrap gap-1">
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Wiring</span>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Repair</span>
            </div>
          </div>
          <div 
            onClick={() => navigateToCategory('Cleaning')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-gray-900 mb-2">🧹 Cleaning</h3>
            <p className="text-xs text-gray-600 mb-2">Bathroom, AC, Water Tank & Car Wash</p>
            <div className="flex flex-wrap gap-1">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">AC Clean</span>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Car Wash</span>
            </div>
          </div>
          <div 
            onClick={() => navigateToCategory('Call A Service')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-gray-900 mb-2">📞 Call A Service</h3>
            <p className="text-xs text-gray-600 mb-2">Courier, CAB, Photography</p>
            <div className="flex flex-wrap gap-1">
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">CAB</span>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Courier</span>
            </div>
          </div>
          <div 
            onClick={() => navigateToCategory('Finance & Insurance')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-gray-900 mb-2">💰 Finance & Insurance</h3>
            <p className="text-xs text-gray-600 mb-2">GST, PAN, ITR, Documentation</p>
            <div className="flex flex-wrap gap-1">
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">GST</span>
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">ITR</span>
            </div>
          </div>
          <div 
            onClick={() => navigateToCategory('Personal Care')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-gray-900 mb-2">💄 Personal Care</h3>
            <p className="text-xs text-gray-600 mb-2">Medicine Delivery, Salon at Door</p>
            <div className="flex flex-wrap gap-1">
              <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">Medicine</span>
              <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">Salon</span>
            </div>
          </div>
          <div 
            onClick={() => navigateToCategory('Civil Work')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-gray-900 mb-2">🏗️ Civil Work</h3>
            <p className="text-xs text-gray-600 mb-2">Painting, Tiles, House Repair</p>
            <div className="flex flex-wrap gap-1">
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Painting</span>
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Tiles</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-orange-200">
            <h3 className="font-semibold text-orange-600 mb-2">⭐ View All Services</h3>
            <p className="text-xs text-gray-600">Browse our complete service catalog</p>
            <div className="mt-2">
              <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full">50+ Services</span>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Book a Service
          </button>
        </div>
      </div>
    </div>
  );

  // Function to get category icon
  const getCategoryIcon = (category: string): string => {
    const iconMap: { [key: string]: string } = {
      'plumbing': '🔧',
      'electrical': '⚡',
      'cleaning': '🧹',
      'call-a-service': '📞',
      'finance-&-insurance': '💰',
      'personal-care': '💄',
      'civil-work': '🏗️'
    };
    return iconMap[category] || '🔧';
  };

  // Function to get category name from URL slug
  const getCategoryName = (slug: string): string => {
    const nameMap: { [key: string]: string } = {
      'plumbing': 'Plumbing',
      'electrical': 'Electrical',
      'cleaning': 'Cleaning',
      'call-a-service': 'Call A Service',
      'finance-&-insurance': 'Finance & Insurance',
      'personal-care': 'Personal Care',
      'civil-work': 'Civil Work'
    };
    return nameMap[slug] || 'Services';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100" style={{backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.04) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(99, 102, 241, 0.03) 0%, transparent 50%)'}}>
      {/* Simplified Header */}
      <header className="bg-white shadow-md">
        {/* Top Header Bar */}
        <div className="bg-blue-900 text-white text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-10">
              <div className="flex items-center space-x-6">
                <span>📞 Contact Us: 9437341234</span>
                <span>✉️ support@happyhomes.com</span>
              </div>
              <div className="flex items-center space-x-4">
                <a href="#" className="hover:underline">Login/Register</a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              
              {/* Logo Section */}
              <button 
                onClick={navigateToHome}
                className="flex items-center space-x-3 flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">HH</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-2xl font-bold text-blue-900">Happy Homes</h1>
                  <p className="text-xs text-gray-500">Your Trusted Home Service Partner</p>
                </div>
              </button>

              {/* Location & Search Section */}
              <div className="flex-1 max-w-2xl mx-4 lg:mx-8">
                
                {/* Location Display */}
                <div className="hidden lg:flex items-center mb-2">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-500">Deliver to</div>
                      <div className="text-sm font-medium text-gray-900 truncate max-w-40">
                        Bhubaneswar, Odisha 751001
                      </div>
                    </div>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="flex">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="hidden md:block bg-gray-100 border border-r-0 border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.keys(serviceCategories).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search for services (plumbing, cleaning, etc.)"
                      className="w-full px-4 py-2 md:py-3 border border-gray-300 md:border-l-0 md:rounded-l-none rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  
                  <button
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-r-md transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right Section - Cart & User Menu */}
              <div className="flex items-center space-x-4 flex-shrink-0">
                
                {/* Cart */}
                <a href="#" className="relative flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 4.22a1 1 0 00.95 1.28h9.46a1 1 0 00.95-1.28L15 13M9 19a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    2
                  </span>
                  <span className="hidden lg:block text-sm font-medium">Cart</span>
                </a>

                {/* User Menu */}
                <div className="flex items-center space-x-2">
                  <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Login
                  </a>
                  <a href="#" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                    Sign Up
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-4 h-12 overflow-x-auto">
              <button 
                onClick={navigateToHome}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  currentPage === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                🏠 Home
              </button>
              
              <button 
                onClick={() => navigateToCategory('Plumbing')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentPage === 'plumbing' || currentPage.startsWith('plumbing-') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                🔧 Plumbing
              </button>
              <button 
                onClick={() => navigateToCategory('Electrical')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentPage === 'electrical' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                ⚡ Electrical
              </button>
              <button 
                onClick={() => navigateToCategory('Cleaning')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentPage === 'cleaning' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                🧹 Cleaning
              </button>
              <button 
                onClick={() => navigateToCategory('Call A Service')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentPage === 'call-a-service' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                📞 Call A Service
              </button>
              <button 
                onClick={() => navigateToCategory('Finance & Insurance')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentPage === 'finance-&-insurance' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                💰 Finance & Insurance
              </button>
              <button 
                onClick={() => navigateToCategory('Personal Care')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentPage === 'personal-care' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                💄 Personal Care
              </button>
              <button 
                onClick={() => navigateToCategory('Civil Work')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentPage === 'civil-work' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                🏗️ Civil Work
              </button>
              <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap">
                🏆 Top Rated
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap">
                💰 Offers
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap">
                🚨 Emergency Services
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'plumbing' && (
          <CategoryPage categoryName="Plumbing" icon="🔧" />
        )}
        {currentPage === 'electrical' && (
          <CategoryPage categoryName="Electrical" icon="⚡" />
        )}
        {currentPage === 'cleaning' && (
          <CategoryPage categoryName="Cleaning" icon="🧹" />
        )}
        {currentPage === 'call-a-service' && (
          <CategoryPage categoryName="Call A Service" icon="📞" />
        )}
        {currentPage === 'finance-&-insurance' && (
          <CategoryPage categoryName="Finance & Insurance" icon="💰" />
        )}
        {currentPage === 'personal-care' && (
          <CategoryPage categoryName="Personal Care" icon="💄" />
        )}
        {currentPage === 'civil-work' && (
          <CategoryPage categoryName="Civil Work" icon="🏗️" />
        )}
        {currentPage === 'plumbing-bath-fittings' && (
          <ServiceDetailPage categoryName="Plumbing" serviceName="Bath Fittings" icon="🚿" />
        )}
        {currentPage === 'plumbing-bath-fittings-reviews' && (
          <CustomerReviewSection serviceName="Bath Fittings" />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HH</span>
                </div>
                <span className="text-xl font-bold">Happy Homes</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Your trusted partner for all household services. Professional, reliable, and affordable solutions for your home.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Plumbing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Electrical</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cleaning</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AC Repair</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8">
            <p className="text-center text-gray-400 text-sm">
              © 2024 Happy Homes. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;