import React, { useState, useEffect } from 'react';

interface CategoryPageProps {
  categoryName: string;
  icon: string;
}

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
            <span
              key={star}
              className={`${sizeClasses[size]} ${
                filled
                  ? 'text-yellow-400'
                  : partiallyFilled
                  ? 'text-yellow-300'
                  : 'text-gray-300'
              }`}
            >
              ★
            </span>
          );
        })}
      </div>
    );
  };

  // NEW SERVICE DETAIL PAGE WITH FLEXBOX LAYOUT
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Navigation Bar */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigateToHome()}
                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
              >
                ← Home
              </button>
              <span className="text-gray-400">/</span>
              <button 
                onClick={() => navigateToCategory('Plumbing')}
                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
              >
                🔧 Plumbing
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-700 text-sm font-medium">🚿 {serviceName}</span>
            </div>
          </div>
        </div>

        {/* Main Content - Using Flexbox Layout */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap lg:flex-nowrap gap-8">
            
            {/* Left Column - Images (25% width) */}
            <div className="w-full lg:w-1/4 flex-shrink-0">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-4">Service Images</h3>
                
                {/* Main Image */}
                <div className="mb-4">
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-6xl border shadow-md">
                    {serviceData.images[selectedImageIndex]}
                  </div>
                  <div className="text-center mt-2 text-sm text-gray-500">
                    {selectedImageIndex + 1} / {serviceData.images.length}
                  </div>
                </div>
                
                {/* Thumbnails */}
                <div className="flex flex-wrap gap-2">
                  {serviceData.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg border-2 transition-all ${
                        selectedImageIndex === index 
                          ? 'bg-blue-500 border-blue-400 text-white shadow-lg' 
                          : 'bg-gray-100 border-gray-300 hover:border-blue-300 text-gray-600'
                      }`}
                    >
                      {image}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Column - Service Details (50% width) */}
            <div className="w-full lg:w-1/2 flex-grow">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                {/* Service Header */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">{serviceData.name}</h1>
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-lg">
                      {renderStars(serviceData.rating, 'sm')}
                      <span className="font-bold text-gray-800">{serviceData.rating}</span>
                      <button 
                        onClick={() => setCurrentPage('plumbing-bath-fittings-reviews')}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        ({serviceData.reviewCount.toLocaleString()} reviews)
                      </button>
                    </div>
                  </div>
                  <div className="text-green-600 text-sm font-medium">
                    📅 {serviceData.monthlyBookings} booked last month
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-6 bg-green-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl font-bold text-green-600">₹{currentVariant.price}</div>
                    <div>
                      <div className="text-gray-500 line-through">MRP ₹{serviceData.originalPrice}</div>
                      <div className="text-sm font-bold text-green-600">
                        {Math.round(((serviceData.originalPrice - currentVariant.price) / serviceData.originalPrice) * 100)}% OFF
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-600 text-sm mt-2">{currentVariant.description}</div>
                </div>

                {/* Service Guarantees */}
                <div className="mb-6">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 p-3 rounded-xl text-center border border-blue-200">
                      <div className="text-xl mb-1">🛡️</div>
                      <div className="font-bold text-sm">{serviceData.warranty}</div>
                      <div className="text-xs text-gray-600">Warranty</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl text-center border border-green-200">
                      <div className="text-xl mb-1">🔒</div>
                      <div className="font-bold text-sm">{serviceData.protection}</div>
                      <div className="text-xs text-gray-600">Protection</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-xl text-center border border-purple-200">
                      <div className="text-xl mb-1">✅</div>
                      <div className="font-bold text-sm">Verified</div>
                      <div className="text-xs text-gray-600">Quality</div>
                    </div>
                  </div>
                </div>

                {/* Service Details Tabs */}
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  {/* Tab Headers */}
                  <div className="flex bg-gray-100">
                    {['type', 'inclusion', 'notes'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`flex-1 px-4 py-3 text-sm font-semibold capitalize transition-all ${
                          selectedTab === tab
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-blue-500'
                        }`}
                      >
                        {tab === 'type' ? '🔧 Type' : tab === 'inclusion' ? '✅ Inclusion' : '📝 Notes'}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-4 bg-white">
                    <ul className="space-y-3">
                      {(currentTabs[selectedTab as keyof typeof currentTabs] || []).map((item: string, index: number) => (
                        <li key={index} className="flex items-start bg-gray-50 p-3 rounded-lg">
                          <span className="text-green-500 mr-2 mt-0.5">✓</span>
                          <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Booking Panel (25% width) */}
            <div className="w-full lg:w-1/4 flex-shrink-0">
              <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-6">
                
                {/* Variant Selection */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3">Choose Package</h3>
                  <div className="space-y-3">
                    {Object.entries(serviceData.variants).map(([variantKey, variantData]) => (
                      <button
                        key={variantKey}
                        onClick={() => setSelectedVariant(variantKey)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          selectedVariant === variantKey
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-bold capitalize">{variantKey}</div>
                        <div className="text-2xl font-bold">₹{variantData.price}</div>
                        <div className="text-sm text-gray-600">{variantData.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Quantity</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-3 bg-red-500 text-white font-bold hover:bg-red-600"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center py-3 bg-blue-50 font-bold text-gray-800">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-3 bg-green-500 text-white font-bold hover:bg-green-600"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-6 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">📍</span>
                    <div>
                      <div className="text-sm font-bold">Services to</div>
                      <div className="text-xs text-gray-600">Bhubaneswar, Odisha</div>
                    </div>
                  </div>
                </div>

                {/* Coupon */}
                <div className="mb-6">
                  <button className="w-full p-3 bg-orange-100 text-orange-700 rounded-xl border border-orange-200 font-semibold text-sm hover:bg-orange-200">
                    🎫 Apply Coupon
                  </button>
                </div>

                {/* Add to Cart */}
                <button className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-all text-lg shadow-lg">
                  🛒 Add to Cart
                </button>

                {/* Promises */}
                <div className="mt-6 bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-3 text-center">HH Promises</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-green-500 mr-2">👨‍🔧</span>
                      <span className="text-gray-700">Trained Professional</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-blue-500 mr-2">⚡</span>
                      <span className="text-gray-700">Quick Response</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-purple-500 mr-2">💰</span>
                      <span className="text-gray-700">Best Pricing</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-pink-500 mr-2">🏠</span>
                      <span className="text-gray-700">Quality Service</span>
                    </div>
                  </div>
                </div>

                {/* Social Share */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-3 text-center">Share & Connect</h4>
                  <div className="flex justify-center space-x-3">
                    <a 
                      href="https://wa.me/919876543210?text=Hi%20I%20want%20to%20book%20Bath%20Fittings%20service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600"
                      title="WhatsApp"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </a>
                    <a 
                      href="https://www.facebook.com/sharer/sharer.php?u=happyhomes.com/bath-fittings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700"
                      title="Facebook"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                    <a 
                      href="https://twitter.com/intent/tweet?text=Great%20Bath%20Fittings%20service%20by%20Happy%20Homes&url=happyhomes.com/bath-fittings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-sky-500 text-white rounded-lg flex items-center justify-center hover:bg-sky-600"
                      title="Twitter"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
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
            <p className="text-xs text-gray-600 mb-2">Wiring, Fans, Lights & more</p>
            <div className="flex flex-wrap gap-1">
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Wiring</span>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Lights</span>
            </div>
          </div>
          <div 
            onClick={() => navigateToCategory('Cleaning')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-gray-900 mb-2">🧹 Cleaning</h3>
            <p className="text-xs text-gray-600 mb-2">Deep cleaning for home & office</p>
            <div className="flex flex-wrap gap-1">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Bathroom</span>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">AC</span>
            </div>
          </div>
          <div 
            onClick={() => navigateToCategory('Call A Service')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-gray-900 mb-2">📞 Call A Service</h3>
            <p className="text-xs text-gray-600 mb-2">Courier, CAB, Photography</p>
            <div className="flex flex-wrap gap-1">
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Courier</span>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">CAB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {icon} {categoryName}
            </h1>
            <p className="text-lg text-gray-600">
              Professional {categoryName.toLowerCase()} services for your home
            </p>
          </div>

          {/* Subcategories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subcategories.map((subcategory: any, index: any) => (
              <div
                key={index}
                onClick={() => navigateToSubcategory(categoryName, subcategory)}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-100"
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">
                    <span className="text-2xl">{getSubcategoryIcon(subcategory)}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {subcategory}
                  </h3>
                  <div className="text-sm text-green-600 font-medium mb-2">
                    Available
                  </div>
                  <div className="text-xs text-gray-500">
                    Book Now
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Need Expert Help?
            </h2>
            <p className="text-gray-600 mb-6">
              Our certified professionals are ready to help with your {categoryName.toLowerCase()} needs
            </p>
            <a
              href="tel:+919876543210"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              📞 Call Expert: +91 98765 43210
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
      </main>
    </div>
  );
};

export default App;