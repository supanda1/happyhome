import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
// import { useServices } from './hooks/useBackendData'; // Disabled to prevent conflicts with adminDataManager
import LoginPage from './pages/customer/LoginPage';
import RegisterPage from './pages/customer/RegisterPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import AddAddressPage from './pages/customer/AddAddressPage';
import MyBookingsPage from './pages/customer/MyBookingsPage';
import ProfilePage from './pages/customer/ProfilePage';
import OfferPage from './pages/customer/OfferPage';
// Removed incorrect import - ServiceDetailPageRoute will be defined inline
import AdminPanel from './pages/admin/AdminPanel';
// Import Dynamic Image component for backend-driven images
import DynamicImage from './components/ui/DynamicImage';
// Import ServiceImage component for subcategory images
import { ServiceImage } from './components/ui/SmartImage';
// Import CartSidebar component
import CartSidebarFixed from './components/cart/CartSidebarFixed';
// Import WhatsApp component
import WhatsAppButton from './components/ui/WhatsAppButton';
// Import Facebook component  
// import FacebookButton from './components/ui/FacebookButton'; // TODO: Add Facebook integration when needed
// Import required utilities (keeping existing working functionality)
import { 
  getCategories, // Using async API for real-time admin sync
  getSubcategories, // Using async API for real-time admin sync  
  getServices, // Using async API for real-time admin sync
  initializeAllAdminData,
  addToCart,
  getCart,
  getContactSettings,
  type Category, 
  type Subcategory,
  // type Service, // TODO: Add when needed
  type ContactSettings
} from './utils/adminDataManager';
import { formatPrice } from './utils/priceFormatter';

// Define backend service interface based on actual API response
interface BackendService {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  subcategory_name?: string;
  description: string;
  short_description?: string;
  base_price: number;
  discounted_price?: number;
  rating?: number;
  review_count?: number;
  booking_count?: number;
  is_active: boolean;
  tags?: string[];
  inclusions?: string[];
  exclusions?: string[];
  requirements?: string[];
  services?: string[];
  notes?: string;
  warranty?: string;
  gallery_images?: string[];
  images?: string[];
  faq?: Array<{ question: string; answer: string }>;
}

// Use existing working types from adminDataManager

interface CategoryPageProps {
  categoryName: string;
}

const App: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Services');
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [serviceCategories, setServiceCategories] = useState<Record<string, string[]>>({});
  const [globalCartCount, setGlobalCartCount] = useState(0);
  const [cartRefreshTrigger, setCartRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All Services');
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [contactSettings, setContactSettings] = useState<ContactSettings | null>(null);
  const [cartSuccessMessages, setCartSuccessMessages] = useState<{[serviceId: string]: string}>({});
  const [isCartCollapsed, setIsCartCollapsed] = useState(false);

  // Get real backend services data (disabled to prevent conflicts with adminDataManager)
  // const { services, loading: servicesLoading } = useServices();
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Memoized helper function to convert Service[] to BackendService[]
  const convertedBackendServices = useMemo(() => {
    if (!services || !Array.isArray(services)) {
      return [];
    }
    
    try {
      const filteredServices = services.filter(service => {
        return service && 
               typeof service === 'object' && 
               (service as any).category_name && 
               (service as any).id;
      });
      
      const convertedServices = filteredServices.map(service => {      
        const apiService = service as any; // Type assertion for API response structure
        return {
          id: apiService.id || '',
          name: apiService.name || 'Unnamed Service',
          category_id: apiService.category_id || '',
          category_name: apiService.category_name || '',
          subcategory_name: apiService.subcategory_name || '',
          description: apiService.description || '',
          short_description: apiService.short_description || '',
          base_price: Number(apiService.base_price) || 0,
          discounted_price: apiService.discounted_price ? Number(apiService.discounted_price) : undefined,
          rating: apiService.rating ? Number(apiService.rating) : undefined,
          review_count: apiService.review_count ? Number(apiService.review_count) : undefined,
          booking_count: apiService.booking_count ? Number(apiService.booking_count) : undefined,
          is_active: Boolean(apiService.is_active),
          tags: apiService.tags,
          inclusions: apiService.inclusions,
          exclusions: apiService.exclusions,
          requirements: apiService.requirements,
          services: apiService.services,
          notes: apiService.notes,
          warranty: apiService.warranty,
          gallery_images: apiService.gallery_images,
          images: apiService.images,
          faq: apiService.faq
        };
      });
      
      // Log only when services array changes
      if (convertedServices.length > 0) {
        console.log('✅ Services converted successfully:', convertedServices.length);
      }
      
      return convertedServices;
    } catch (error) {
      console.error('❌ Error converting backend services:', error);
      return [];
    }
  }, [services]); // Only recalculate when services array changes

  // Helper function for backward compatibility
  const convertToBackendServices = (frontendServices: typeof services): BackendService[] => {
    // Use memoized version when possible, fallback for direct calls
    if (frontendServices === services) {
      return convertedBackendServices;
    }
    
    // For direct calls with different data, do minimal conversion without logging
    if (!frontendServices || !Array.isArray(frontendServices)) {
      return [];
    }
    
    return frontendServices
      .filter(service => service && typeof service === 'object' && (service as any).category_name && (service as any).id)
      .map(service => {
        const apiService = service as any;
        return {
          id: apiService.id || '',
          name: apiService.name || 'Unnamed Service',
          category_id: apiService.category_id || '',
          category_name: apiService.category_name || '',
          subcategory_name: apiService.subcategory_name || '',
          description: apiService.description || '',
          short_description: apiService.short_description || '',
          base_price: Number(apiService.base_price) || 0,
          discounted_price: apiService.discounted_price ? Number(apiService.discounted_price) : undefined,
          rating: apiService.rating ? Number(apiService.rating) : undefined,
          review_count: apiService.review_count ? Number(apiService.review_count) : undefined,
          booking_count: apiService.booking_count ? Number(apiService.booking_count) : undefined,
          is_active: Boolean(apiService.is_active),
          tags: apiService.tags,
          inclusions: apiService.inclusions,
          exclusions: apiService.exclusions,
          requirements: apiService.requirements,
          services: apiService.services,
          notes: apiService.notes,
          warranty: apiService.warranty,
          gallery_images: apiService.gallery_images,
          images: apiService.images,
          faq: apiService.faq
        };
      });
  };

  // Helper function to show success message for a specific service and expand cart sidebar
  const showCartSuccessMessage = (serviceId: string, message: string) => {
    setCartSuccessMessages(prev => {
      const newState = { ...prev, [serviceId]: message };
      return newState;
    });
    
    // Expand cart sidebar when item is added
    setIsCartCollapsed(false);
    
    setTimeout(() => {
      setCartSuccessMessages(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [serviceId]: _removed, ...rest } = prev;
        return rest;
      });
    }, 3000);
  };

  // Initialize admin data and load categories
  useEffect(() => {
    const initializeData = async () => {
      
      // Check if backend is running
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/health`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log('Backend health check passed');
        } else {
          console.warn('Backend health check failed with status:', response.status);
        }
      } catch (error) {
        console.error('Backend health check error:', error);
      }
      
      
      await initializeAllAdminData(); // This already loads categories, subcategories, services, coupons
      await loadCategoriesAndServices(); // Load and set categories and services state
      await loadContactSettings();
      await updateGlobalCartCount();
    };
    
    initializeData();
  }, []);

  // Update cart count when user authentication state changes
  useEffect(() => {
    updateGlobalCartCount();
  }, [user]); // Reload cart count when user logs in/out

  // Load contact settings
  const loadContactSettings = async () => {
    try {
      const settings = await getContactSettings();
      setContactSettings(settings);
    } catch (error) {
      console.error('Failed to load contact settings:', error);
    }
  };

  // Update global cart count from backend API
  const updateGlobalCartCount = useCallback(async () => {
    try {
      const cart = await getCart();
      setGlobalCartCount(cart?.totalItems || 0);
      // Trigger cart sidebar refresh
      setCartRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating cart count:', error);
      setGlobalCartCount(0);
    }
  }, []);

  // Load categories, subcategories and services from admin data (REAL-TIME API)
  const loadCategoriesAndServices = async (forceRefresh = false) => {
    try {
      setServicesLoading(true);
      console.log('🔄 Loading categories and services...', { forceRefresh });
      
      const allCategories = await getCategories();
      const allSubcategories = await getSubcategories();
      const allServices = await getServices();
      
      console.log('📊 Raw API data:', {
        categories: allCategories?.length || 0,
        subcategories: allSubcategories?.length || 0,
        services: allServices?.length || 0,
        sampleService: allServices?.[0]
      });
      
      // Check if we received valid arrays
      if (!Array.isArray(allCategories)) {
        throw new Error('Invalid categories data received from API');
      }
      
      if (!Array.isArray(allSubcategories)) {
        throw new Error('Invalid subcategories data received from API');
      }

      if (!Array.isArray(allServices)) {
        throw new Error('Invalid services data received from API');
      }
      
      // Filter only active data with better error handling
      const activeCategories = allCategories.filter(cat => cat && typeof cat === 'object' && cat.is_active);
      const activeSubcategories = allSubcategories.filter(sub => sub && typeof sub === 'object' && sub.is_active);
      const activeServices = allServices.filter(service => service && typeof service === 'object' && service.is_active);
      
      console.log('✅ Filtered active data:', {
        activeCategories: activeCategories.length,
        activeSubcategories: activeSubcategories.length,  
        activeServices: activeServices.length
      });
      
      setCategories(activeCategories);
      setSubcategories(activeSubcategories);
      setServices(activeServices);
      setServicesLoading(false);
      
      // Build service categories object
      const serviceCategoriesObj: Record<string, string[]> = {
        'All Services': []
      };
      
      activeCategories.forEach(category => {
        if (category && category.id && category.name) {
          const categorySubcategories = activeSubcategories
            .filter(sub => sub && sub.category_id === category.id && sub.name)
            .map(sub => sub.name);
          serviceCategoriesObj[category.name] = categorySubcategories;
        }
      });
      
      setServiceCategories(serviceCategoriesObj);
      
    } catch (error) {
      console.error('❌ Failed to load categories from API:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Fallback to empty state for now
      setCategories([]);
      setSubcategories([]);
      setServices([]);
      setServicesLoading(false);
      setServiceCategories({ 'All Services': [] });
    }
  };

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

  const navigateToCategory = useCallback((category: string) => {
    setCurrentPage(category.toLowerCase().replace(/\s+/g, '-'));
    setShowServicesDropdown(false);
  }, []);

  const navigateToSubcategory = useCallback((category: string, subcategory: string) => {
    setCurrentPage(`${category.toLowerCase().replace(/\s+/g, '-').replace('&', '&').replace('/', '')}-${subcategory.toLowerCase().replace(/\s+/g, '-').replace('&', '&').replace('/', '')}`);
    setShowServicesDropdown(false);
  }, []);

  const navigateToLogin = () => {
    setCurrentPage('login');
    setShowServicesDropdown(false);
  };

  const navigateToSignup = () => {
    setCurrentPage('signup');
    setShowServicesDropdown(false);
  };

  const navigateToCart = () => {
    setCurrentPage('cart');
    setShowServicesDropdown(false);
  };

  const navigateToCheckout = () => {
    setCurrentPage('checkout');
    setShowServicesDropdown(false);
  };

  const navigateToAddAddress = () => {
    setCurrentPage('add-address');
    setShowServicesDropdown(false);
  };

  const navigateToServiceDetail = useCallback((serviceId: string) => {
    console.log('🚀 Navigation triggered to service detail:', serviceId);
    console.log('🚀 Current page before change:', currentPage);
    console.log('🚀 Service ID type:', typeof serviceId);
    console.log('🚀 Service ID length:', serviceId?.length);
    
    // Check if this service exists in our current services array
    const serviceExists = convertedBackendServices?.find(s => s.id === serviceId);
    console.log('🚀 Service exists in current data:', !!serviceExists);
    console.log('🚀 Total services available:', convertedBackendServices?.length || 0);
    
    setSelectedServiceId(serviceId);
    setCurrentPage('service-detail');
    setShowServicesDropdown(false);
    console.log('📄 Page changed to: service-detail');
    console.log('📄 Selected service ID set to:', serviceId);
  }, [currentPage, services]);


  const navigateToMyBookings = () => {
    setCurrentPage('my-bookings');
    setShowServicesDropdown(false);
  };

  const navigateToAdmin = () => {
    setCurrentPage('admin');
    setShowServicesDropdown(false);
  };


  const navigateToSearch = (query: string, category: string) => {
    setSearchQuery(query);
    setSearchCategory(category);
    setCurrentPage('search-results');
    setShowServicesDropdown(false);
  };

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToSearch(headerSearchQuery.trim(), selectedCategory);
  };

  // Function to refresh categories data (call when returning from admin)
  const refreshCategoriesData = async () => {
    await loadCategoriesAndServices();
  };

  // Function to refresh contact settings (call when updated from admin)
  const refreshContactSettings = () => {
    loadContactSettings();
  };

  // Search function - use real backend services from useServices hook
  const searchServices = (query: string, category: string): BackendService[] => {
    // Use memoized backend services for better performance
    const allServices = convertedBackendServices || [];
    let filteredServices = allServices.filter((service) => service.is_active);

    // Filter by category if not "All Services"
    if (category !== 'All Services') {
      const categoryObj = categories.find(cat => cat.name === category);
      if (categoryObj) {
        filteredServices = filteredServices.filter(service => service.category_id === categoryObj.id);
      }
    }

    // Filter by search query
    if (query.trim()) {
      const searchTerms = query.toLowerCase().trim().split(' ');
      filteredServices = filteredServices.filter(service => {
        const searchableText = [
          service.name,
          service.description,
          service.short_description,
          ...(service.tags || []),
          ...(service.inclusions || []),
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    return filteredServices;
  };



  // PDF Export Function for Admin
  const handlePDFExport = (categoryName: string) => {
    // Get all services for this category
    const categoryServices = serviceCategories[categoryName as keyof typeof serviceCategories] || [];
    
    // Generate PDF data structure
    const pdfData = {
      category: categoryName,
      totalServices: categoryServices.length,
      services: categoryServices,
      exportDate: new Date().toLocaleDateString(),
      exportTime: new Date().toLocaleTimeString(),
      categoryType: getCategoryType(categoryName)
    };

    // Show comprehensive alert with PDF info (will be replaced with actual PDF generation)
    alert(`
📄 ${categoryName} Services - Admin PDF Export Report

📊 CATEGORY OVERVIEW:
Category: ${pdfData.category}
Category Type: ${pdfData.categoryType}
Total Services: ${pdfData.totalServices}

📋 SERVICES LIST:
${pdfData.services.map((service, index) => `${index + 1}. ${service}`).join('\n')}

🕒 EXPORT INFO:
Generated: ${pdfData.exportDate} at ${pdfData.exportTime}

📄 This report will be formatted as PDF in the Admin Panel with:
• Complete service details and pricing
• Performance analytics and statistics  
• Customer reviews and ratings
• Business insights and metrics
• Booking patterns and trends
    `);

    // TODO: Integrate with admin panel for actual PDF generation
  };

  // Backend API function to get category type
  const getCategoryType = (categoryName: string): string => {
    // Find the category from backend data
    const category = categories.find(cat => cat.name === categoryName);
    
    // Note: category_type and metadata are not available in current Category interface
    // Using category name to determine type for now
    
    // Fallback: derive from category description or use generic
    if (category?.description) {
      // Try to extract type info from description
      if (category.description.toLowerCase().includes('technical')) return 'Technical Services';
      if (category.description.toLowerCase().includes('cleaning')) return 'Maintenance & Sanitization';
      if (category.description.toLowerCase().includes('financial')) return 'Documentation & Compliance';
      if (category.description.toLowerCase().includes('construction')) return 'Construction & Renovation';
    }
    
    return 'Professional Services';
  };


  // Search Results Page Component  
  const SearchResultsPage = () => {
    // Don't perform search if services are still loading
    const searchResults = servicesLoading ? [] : searchServices(searchQuery, searchCategory);
    
    const getCategoryName = (categoryId: string) => {
      const category = categories.find(cat => cat.id === categoryId);
      return category ? category.name : 'Unknown';
    };


    return (
      <div className="min-h-screen bg-gray-50">
        {/* Enhanced Back to Home Navigation */}
        <div className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 mb-6">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={navigateToHome}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Home</span>
              </button>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Search Results</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Header */}
          <div className="mb-8">
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Query: <strong>"{searchQuery || 'All Services'}"</strong></span>
              <span>Category: <strong>{searchCategory}</strong></span>
              <span>Results: <strong>{searchResults.length} services found</strong></span>
            </div>
          </div>

          {/* Search Results */}
          {servicesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading services...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((service, index) => (
                <div key={service.id || index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                  {/* Service Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {getCategoryName(service.category_id)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium">{service.rating || 4.5}</span>
                    </div>
                  </div>

                  {/* Service Details */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.short_description}</p>

                  {/* Pricing */}
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice(service.discounted_price || service.base_price)}
                    </span>
                    {service.discounted_price && service.discounted_price < service.base_price && (
                      <>
                        <span className="text-gray-400 line-through">{formatPrice(service.base_price)}</span>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          {Math.round((1 - service.discounted_price / service.base_price) * 100)}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {/* Service Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {service.tags?.slice(0, 3).map((tag, tagIndex) => (
                      <span key={tagIndex} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button 
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
                      onClick={async () => {
                        // Validate service ID before adding to cart
                        if (!service.id || typeof service.id !== 'string') {
                          console.warn('🚫 Invalid service ID:', service.id);
                          alert('This service is not available for booking at the moment.');
                          return;
                        }

                        // Validate UUID format
                        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                        if (!uuidRegex.test(service.id)) {
                          console.warn('🚫 Invalid service ID format. Expected UUID, got:', service.id);
                          alert('This service is not available for booking at the moment.');
                          return;
                        }

                        // Add to cart logic
                        const cartItem = await addToCart(service.id, 1);
                        if (cartItem) {
                          updateGlobalCartCount();
                          showCartSuccessMessage(service.id, 'Service added to cart!');
                        } else {
                          console.error('Failed to add service to cart');
                        }
                      }}
                    >
                      Add to Cart
                    </button>
                    <button 
                      className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm"
                      onClick={() => {
                        console.log('🔍 View Details clicked in search results for:', service.name, 'ID:', service.id);
                        navigateToServiceDetail(service.id);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                  
                  {/* Success Message */}
                  {cartSuccessMessages[service.id] && (
                    <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded-md">
                      <p className="text-green-800 text-sm font-medium">✓ {cartSuccessMessages[service.id]}</p>
                    </div>
                  )}
                  {/* Debug: Always show if there are any messages */}
                  {Object.keys(cartSuccessMessages).length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      Debug: Messages exist for services: {Object.keys(cartSuccessMessages).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* No Results */
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or browse our categories
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchCategory('All Services');
                    navigateToSearch('', 'All Services');
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Show All Services
                </button>
                <button
                  onClick={navigateToHome}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Back to Home Link */}
        <div className="px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto text-center">
            <button onClick={navigateToHome} className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm font-medium mx-auto">
              <span>←</span>
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
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

  // Function to get backend service data for customer display
  const getServiceForCustomer = (categoryName: string, serviceName: string): BackendService | null => {
    // Use real backend services from the useServices hook
    if (!services || servicesLoading) return null;
    
    // Find matching service by category and service name
    const matchingService = convertedBackendServices.find((service) => {
      const categoryMatch = service.category_name?.toLowerCase() === categoryName.toLowerCase();
      const serviceNameMatch = service.name?.toLowerCase().includes(serviceName.toLowerCase()) ||
                             service.subcategory_name?.toLowerCase().includes(serviceName.toLowerCase());
      return categoryMatch && serviceNameMatch && service.is_active;
    });
    
    return matchingService || null;
  };

  // REMOVED: Massive hardcoded service data - now using backend PostgreSQL API
  // All service data now comes from adminDataManager.ts backend APIs

  // Helper function to safely parse JSON arrays from backend
  const parseJsonArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [value]; // If not JSON, treat as single string
      }
    }
    return [];
  };

  // ServiceDetailPageRoute component - works with adminDataManager system
  const ServiceDetailPageRoute = ({ serviceId }: { serviceId: string }) => {
    // Find the service from the loaded services
    const service = convertedBackendServices?.find(s => s.id === serviceId);
    
    // Debug logging for service detail issues
    console.log('🔍 ServiceDetailPageRoute Debug:', {
      serviceId,
      servicesLoading,
      totalServices: services?.length || 0,
      convertedServicesCount: convertedBackendServices?.length || 0,
      serviceFound: !!service,
      allServiceIds: convertedBackendServices?.map(s => ({ id: s.id, name: s.name })) || [],
      matchingService: service ? { id: service.id, name: service.name } : null
    });
    
    if (!service || servicesLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">🔄</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {servicesLoading ? 'Loading Service...' : 'Service Not Found'}
            </h2>
            <p className="text-gray-600">
              {servicesLoading 
                ? 'Please wait while we load the service details.' 
                : `Service with ID ${serviceId} could not be found.`
              }
            </p>
            {!servicesLoading && (
              <div className="mt-4 text-sm text-gray-500">
                <p>Available services: {convertedBackendServices?.length || 0}</p>
                <div className="flex gap-2 justify-center mt-2">
                  <button 
                    onClick={() => loadCategoriesAndServices(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Refresh Data
                  </button>
                  <button 
                    onClick={navigateToHome}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Find category and subcategory names
    const category = categories.find(cat => cat.id === service.category_id);
    const categoryName = category?.name || 'General Services';
    
    // Use the existing ServiceDetailPage component with the found service data
    return (
      <ServiceDetailPage 
        categoryName={categoryName} 
        serviceName={service.name}
      />
    );
  };

  // PRODUCTION-GRADE SERVICE DETAIL PAGE WITH ENHANCED STYLING
  const ServiceDetailPage = ({ categoryName, serviceName }: { categoryName: string; serviceName: string }) => {
    const [selectedTab, setSelectedTab] = useState('services');
    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
    
    // Cart state (for local display only)
    const [, setCartCount] = useState(0);
    const [clickCount, setClickCount] = useState(0);
    const [addToCartSuccess, setAddToCartSuccess] = useState(false);

    // Use services from main component (passed as prop or accessed from parent scope)

    // Auto-hide success message after 3 seconds - moved to top to fix hooks order
    useEffect(() => {
      if (clickCount > 0) {
        const timer = setTimeout(() => {
          setClickCount(0);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [clickCount]);
    
    // Find the real backend service that matches this page (only when not loading)
    const adminService: BackendService | null = !servicesLoading ? (
      convertedBackendServices?.find((service) => {
        // Match by service name and category
        const nameMatch = service.name?.toLowerCase().includes(serviceName.toLowerCase());
        const subcategoryMatch = service.subcategory_name?.toLowerCase().includes(serviceName.toLowerCase());
        const exactSubcategoryMatch = service.subcategory_name?.toLowerCase() === serviceName.toLowerCase();
        const categoryMatch = service.category_name?.toLowerCase() === categoryName.toLowerCase();
        
        // If serviceName matches a subcategory name exactly, get the first service from that subcategory
        if (exactSubcategoryMatch && categoryMatch && service.is_active) {
          return true;
        }
        
        // Otherwise, match by service name or subcategory name containing the service name
        return (nameMatch || subcategoryMatch) && categoryMatch && service.is_active;
      }) || getServiceForCustomer(categoryName, serviceName) // Try to find from backend
    ) : null;
    
    
    // Find the corresponding subcategory for this service to get images
    const serviceSubcategory = subcategories.find(sub => 
      sub.name.toLowerCase().includes(serviceName.toLowerCase()) ||
      serviceName.toLowerCase().includes(sub.name.toLowerCase())
    );
    
    // Convert admin service data to customer display format or fallback to generic data
    const serviceData = adminService ? {
      name: adminService.name || serviceName,
      rating: adminService.rating || 4.5,
      reviewCount: adminService.review_count || 100,
      monthlyBookings: adminService.booking_count || 50,
      originalPrice: adminService.base_price || 299,
      discountedPrice: adminService.discounted_price || adminService.base_price || 299,
      discount: adminService.discounted_price ? Math.round((1 - adminService.discounted_price / adminService.base_price) * 100) : 0,
      description: adminService.description || `Professional ${serviceName.toLowerCase()} service for your home.`,
      images: serviceSubcategory?.image_paths || adminService.gallery_images || adminService.images || [],
      warranty: adminService.warranty || "30 Days", 
      protection: "₹10,000", 
      verified: true,
      services: parseJsonArray(adminService.requirements || adminService.services).length > 0 ? parseJsonArray(adminService.requirements || adminService.services) : [`Professional ${serviceName.toLowerCase()} service`, "Quality workmanship", "Timely completion"],
      included: parseJsonArray(adminService.inclusions).length > 0 ? parseJsonArray(adminService.inclusions) : ["Expert technician visit", "Standard tools and materials", "Service warranty", "Quality assurance"],
      notes: parseJsonArray(adminService.notes).length > 0 ? parseJsonArray(adminService.notes) : ["Service availability subject to location", "Additional charges may apply for complex work", "Customer satisfaction guaranteed"],
      faq: adminService?.faq || [
        { question: "What's included in this service?", answer: parseJsonArray(adminService.inclusions).join(', ') || 'Professional service with expert technician and quality assurance.' },
        { question: "What's excluded?", answer: parseJsonArray(adminService.exclusions).join(', ') || 'Additional materials and complex modifications may incur extra charges.' },
        { question: "Any special requirements?", answer: parseJsonArray(adminService.requirements).join(', ') || 'Basic access to service area required.' }
      ]
    } : {
      // Default service data when backend service not found
      name: `${serviceName} Service`,
      rating: 4.5,
      reviewCount: 100,
      monthlyBookings: 50,
      originalPrice: 299,
      discountedPrice: 199,
      discount: 33,
      description: `Professional ${serviceName.toLowerCase()} service for your home.`,
      images: serviceSubcategory?.image_paths || [],
      warranty: "30 Days", 
      protection: "₹10,000", 
      verified: true,
      services: [`Professional ${serviceName.toLowerCase()} service`, "Quality workmanship", "Timely completion"],
      included: ["Expert technician visit", "Standard tools and materials", "Service warranty", "Quality assurance"],
      notes: ["Service availability subject to location", "Additional charges may apply for complex work", "Customer satisfaction guaranteed"],
      faq: [
        { question: "What's included in this service?", answer: "Professional service with expert technician and quality assurance." },
        { question: "How long does the service take?", answer: "Service duration depends on the complexity of work required." },
        { question: "Do you provide warranty?", answer: "Yes, we provide service warranty as per our terms and conditions." }
      ]
    };

    // Get service data tabs
    const currentTabs = {
      services: serviceData.services || [],
      included: serviceData.included || [],
      notes: serviceData.notes || ['No additional information available']
    };

    // Toggle FAQ expansion
    const toggleFAQ = (index: number) => {
      setExpandedFAQ(expandedFAQ === index ? null : index);
    };

    // Load cart count on component mount and update cart count display
    const updateCartDisplay = async () => {
      try {
        const cart = await getCart();
        setCartCount(cart?.totalItems || 0);
      } catch (error) {
        console.error('Error updating cart display:', error);
        setCartCount(0);
      }
    };


    // Add to cart functionality
    const handleAddToCart = async () => {
      if (!adminService || !adminService.id || typeof adminService.id !== 'string') {
        console.warn('🚫 No valid backend service found for Add to Cart. Service must be loaded from backend.');
        // Show user-friendly message instead of trying to add to cart
        setAddToCartSuccess(false);
        // Could show an error message here if needed
        alert('This service is not available for booking at the moment. Please try another service or contact support.');
        return;
      }

      // Validate that this is a real UUID from backend (not mock data)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(adminService.id)) {
        console.warn('🚫 Invalid service ID format. Expected UUID from backend, got:', adminService.id);
        alert('This service is not available for booking at the moment. Please try another service or contact support.');
        return;
      }


      // Add item to cart
      const cartItem = await addToCart(adminService.id, quantity);
      
      if (cartItem) {
        updateCartDisplay();
        updateGlobalCartCount(); // Update global cart count in header
        
        // Show inline success message
        setAddToCartSuccess(true);
        setTimeout(() => {
          setAddToCartSuccess(false);
        }, 3000); // Hide after 3 seconds
      }
    };

    // Calculate price
    const basePrice = serviceData.discountedPrice;
    const subtotal = basePrice * quantity;

    // Show loading state while services are being fetched
    if (servicesLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-blue-50 relative flex items-center justify-center" style={{backgroundImage: 'radial-gradient(circle at 15% 85%, rgba(139, 69, 199, 0.08) 0%, transparent 70%), radial-gradient(circle at 85% 15%, rgba(59, 130, 246, 0.06) 0%, transparent 70%), radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 60%), linear-gradient(45deg, rgba(236, 72, 153, 0.03) 0%, transparent 50%)'}}>
          <div className="text-center">
            <div className="text-2xl mb-4">🔄</div>
            <div className="text-orange-600">Loading service details...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-blue-50 relative overflow-y-auto pb-20" style={{backgroundImage: 'radial-gradient(circle at 15% 85%, rgba(139, 69, 199, 0.08) 0%, transparent 70%), radial-gradient(circle at 85% 15%, rgba(59, 130, 246, 0.06) 0%, transparent 70%), radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 60%), linear-gradient(45deg, rgba(236, 72, 153, 0.03) 0%, transparent 50%)'}}>
        {/* Enhanced Navigation Bar */}
        <div className="bg-white/95 backdrop-blur-md shadow-lg border-b border-orange-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center space-x-3 text-base font-medium">
              <button 
                onClick={() => navigateToHome()}
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-semibold tracking-wide">Home</span>
              </button>
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <button 
                onClick={() => navigateToCategory(categoryName)}
                className="text-purple-600 hover:text-purple-700 transition-all duration-200 hover:scale-105"
              >
                <span className="font-semibold tracking-wide">{categoryName}</span>
              </button>
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-purple-700 bg-gradient-to-r from-orange-100 to-purple-100 px-3 py-1.5 rounded-full">{serviceName}</span>
            </div>
          </div>
        </div>

        {/* Back to Category Button */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <button 
              onClick={() => navigateToCategory(categoryName)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-all duration-200 hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to {categoryName}</span>
            </button>
          </div>
        </div>

        {/* Main Content - Using Flexbox Layout */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap lg:flex-nowrap gap-8">
            
            {/* Left Column - Premium Image Gallery (25% width) */}
            <div className="w-full lg:w-1/4 flex-shrink-0">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-orange-200/60 hover:shadow-3xl transition-all duration-300">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl text-purple-800">Service Gallery</h3>
                </div>
                
                {/* Main Image */}
                <div className="mb-6">
                  <div className="aspect-square rounded-2xl border-2 border-orange-200 shadow-lg overflow-hidden group relative">
                    <ServiceImage
                      categoryName={categoryName}
                      serviceName={serviceName}
                      imageIndex={selectedImageIndex}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="text-center mt-3 text-sm text-purple-600 font-medium">
                    <span className="bg-gradient-to-r from-orange-100 to-purple-100 px-3 py-1 rounded-full">
                      {selectedImageIndex + 1} of 5 photos
                    </span>
                  </div>
                </div>
                
                {/* Enhanced Thumbnails */}
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-lg border-2 transition-all duration-200 overflow-hidden hover:scale-105 ${
                        selectedImageIndex === index 
                          ? 'border-purple-500 shadow-lg ring-2 ring-purple-200 scale-105' 
                          : 'border-orange-300 hover:border-purple-400'
                      }`}
                    >
                      <ServiceImage
                        categoryName={categoryName}
                        serviceName={serviceName}
                        imageIndex={index}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Column - Premium Service Details (50% width) */}
            <div className="w-full lg:w-1/2 flex-grow">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-orange-200/60 hover:shadow-3xl transition-all duration-300">
                {/* Enhanced Service Header */}
                <div className="mb-8">
                  <div className="flex items-start justify-between mb-4">
                    <h1 className="text-4xl bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 leading-tight">{serviceData.name}</h1>
                    <div className="flex items-center space-x-1 bg-purple-50 px-3 py-1.5 rounded-full">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-purple-700 text-xs font-bold">Verified</span>
                    </div>
                  </div>
                  
                  {/* Rating & Reviews */}
                  <div className="flex items-center space-x-6 mb-4">
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-3 rounded-2xl shadow-sm border border-amber-200">
                      {renderStars(serviceData.rating, 'sm')}
                      <span className="text-purple-800 text-lg">{serviceData.rating}</span>
                      <button 
                        onClick={() => setCurrentPage('plumbing-bath-fittings-reviews')}
                        className="text-purple-600 hover:text-purple-700 text-sm transition-colors duration-200"
                      >
                        ({serviceData.reviewCount.toLocaleString()} reviews)
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-purple-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">{serviceData.monthlyBookings} booked this month</span>
                    </div>
                  </div>
                </div>

                {/* Premium Pricing Section */}
                <div className="mb-8 bg-gradient-to-br from-orange-50 via-purple-50 to-blue-50 p-8 rounded-3xl border-2 border-orange-200/50 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-16 translate-x-16" />
                  
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-baseline space-x-4">
                      <span className="text-5xl bg-gradient-to-r from-orange-600 via-purple-700 to-blue-600 bg-clip-text text-transparent">{formatPrice(serviceData.discountedPrice)}</span>
                      <div className="space-y-1">
                        <div className="text-purple-500 line-through text-lg">MRP {formatPrice(serviceData.originalPrice)}</div>
                        <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1.5 rounded-full text-sm shadow-lg">
                          {Math.round(((serviceData.originalPrice - serviceData.discountedPrice) / serviceData.originalPrice) * 100)}% OFF
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-purple-600 mb-1">Starting from</div>
                      <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-orange-200">
                        <span className="text-purple-700">All inclusive</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-purple-200/50">
                    <p className="text-purple-800 text-base leading-relaxed">
                      {serviceData.description}
                    </p>
                  </div>
                </div>

                {/* Premium Service Features */}
                <div className="mb-8 bg-gradient-to-br from-orange-50 to-purple-50 p-6 rounded-2xl border border-orange-200">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <h3 className="text-xl text-purple-900">Why Choose This Service</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-xl">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-purple-700">Expert Technicians</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-xl">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-purple-700">Quality Materials</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-xl">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-purple-700">Timely Completion</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-xl">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-purple-700">24/7 Support</span>
                    </div>
                  </div>
                </div>

                {/* Premium Service Guarantees */}
                <div className="mb-8">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-amber-200/50 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="text-purple-900 mb-2">{serviceData.warranty}</div>
                      <div className="text-sm text-purple-600">Service Warranty</div>
                    </div>
                    
                    <div className="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-200/50 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="text-purple-900 mb-2">{serviceData.protection}</div>
                      <div className="text-sm text-purple-600">Damage Coverage</div>
                    </div>
                    
                    <div className="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-200/50 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="text-purple-900 mb-2">HH Verified</div>
                      <div className="text-sm text-purple-600">Quality Assured</div>
                    </div>
                  </div>
                </div>

                {/* Premium Service Details Tabs */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-orange-200/60">
                  {/* Modern Tab Headers */}
                  <div className="flex bg-gradient-to-r from-orange-50 to-purple-50 p-3 gap-2">
                    {['services', 'included', 'notes'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`flex-1 px-6 py-4 text-sm capitalize transition-all duration-300 rounded-2xl ${
                          selectedTab === tab
                            ? 'bg-gradient-to-br from-orange-500 via-purple-600 to-blue-600 text-white shadow-2xl shadow-purple-500/30 scale-105'
                            : 'bg-white/80 backdrop-blur-sm text-purple-700 shadow-lg hover:shadow-xl border border-orange-200 hover:border-purple-300 hover:scale-102'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className={`text-xl ${selectedTab === tab ? 'text-orange-100' : 'text-purple-600'}`}>
                            {tab === 'services' ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            ) : tab === 'included' ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            )}
                          </div>
                          <span className="text-xs">
                            {tab === 'services' ? 'What We Do' : tab === 'included' ? "What's Included" : 'Important Notes'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Enhanced Tab Content */}
                  <div className="p-8 bg-gradient-to-br from-white to-purple-50/30">
                    <ul className="space-y-4">
                      {(currentTabs[selectedTab as keyof typeof currentTabs] || []).map((item: string, index: number) => (
                        <li key={index} className="group flex items-start bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-200/50 hover:border-purple-300/50 hover:scale-102">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-shadow">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-purple-800 text-base leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Collapsible FAQ Section */}
                <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800 text-lg">Frequently Asked Questions</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {serviceData.faq.map((faqItem: { question: string; answer: string }, index: number) => (
                      <div key={index} className="p-4">
                        <button
                          onClick={() => toggleFAQ(index)}
                          className="w-full flex justify-between items-center text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded-lg p-2 -m-2 hover:bg-gray-50 transition-all duration-200"
                        >
                          <h4 className="font-semibold text-gray-800 text-sm pr-4">
                            {faqItem.question}
                          </h4>
                          <div className={`flex-shrink-0 transition-transform duration-200 ${
                            expandedFAQ === index ? 'transform rotate-180' : ''
                          }`}>
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                        
                        <div className={`mt-3 overflow-hidden transition-all duration-300 ease-in-out ${
                          expandedFAQ === index 
                            ? 'max-h-96 opacity-100' 
                            : 'max-h-0 opacity-0'
                        }`}>
                          <div className="pb-2">
                            <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                              {faqItem.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column - Premium Booking Panel (25% width) */}
            <div className="w-full lg:w-1/4 flex-shrink-0">
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-orange-200/60 sticky top-6 hover:shadow-3xl transition-all duration-300">
                
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 4.22a1 1 0 00.95 1.28h9.46a1 1 0 00.95-1.28L15 13M9 19a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl text-purple-900">Book This Service</h3>
                  <p className="text-sm text-purple-600 mt-1">Professional service at your doorstep</p>
                </div>

                {/* Premium Quantity Selector */}
                <div className="mb-8">
                  <label className="block text-base text-purple-800 mb-4">Select Quantity</label>
                  <div className="flex items-center bg-orange-50 border-2 border-orange-200 rounded-2xl overflow-hidden shadow-inner">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-6 py-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="flex-1 text-center py-4 bg-white text-xl text-purple-900 border-x border-orange-200">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-6 py-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Premium Add to Cart Button */}
                <button 
                  onClick={() => {
                    handleAddToCart();
                    setClickCount(prev => prev + 1);
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white py-5 px-8 rounded-2xl transition-all duration-300 text-lg mb-6 shadow-2xl hover:shadow-3xl transform hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 4.22a1 1 0 00.95 1.28h9.46a1 1 0 00.95-1.28L15 13M9 19a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Add to Cart • {formatPrice(subtotal)}</span>
                  </div>
                </button>

                {/* Premium Success Message */}
                {addToCartSuccess && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 text-emerald-800 rounded-2xl flex items-center shadow-lg animate-bounce">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="">Successfully Added to Cart!</span>
                  </div>
                )}

                {/* Premium Info Cards */}
                <div className="space-y-4 mb-8">
                  {/* Location */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-purple-800 text-sm mb-1">Service Area</div>
                        <div className="text-purple-700 text-sm">Bhubaneswar, Odisha</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Trust Badges */}
                <div className="bg-gradient-to-br from-orange-50 to-purple-50 p-6 rounded-2xl border border-orange-200">
                  <h4 className="text-purple-900 mb-4 text-center">Why Choose Happy Homes</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-purple-800 text-sm">Certified Professionals</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-purple-800 text-sm">Same Day Service</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-purple-800 text-sm">Transparent Pricing</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-purple-800 text-sm">Quality Guarantee</span>
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

  // Home Page Component
  const HomePage = ({ 
    navigateToServiceDetail, 
    navigateToCheckout 
  }: { 
    navigateToServiceDetail: (serviceId: string) => void;
    navigateToCheckout: () => void;
  }) => {
    // Get all active categories (show all, even if no services yet) - memoized to prevent re-renders
    const activeCategories = useMemo(() => categories.filter(cat => cat.is_active), [categories]);
    
    // Get featured services for display on homepage
    const featuredServices = useMemo(() => {
      return convertedBackendServices
        ?.filter(service => service.is_active && (service as any).is_featured)
        ?.slice(0, 6) || [];
    }, [convertedBackendServices]);
    
    // Get all services for the new all services section
    const allServices = useMemo(() => {
      return convertedBackendServices
        ?.filter(service => service.is_active)
        ?.slice(0, 12) || [];
    }, [convertedBackendServices]);
    
    // Cart functionality state
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    const [cartMessages, setCartMessages] = useState<{[serviceId: string]: string}>({});
    const [isCartCollapsed, setIsCartCollapsed] = useState(false);
    const [cartRefreshTrigger, setCartRefreshTrigger] = useState(0);
    
    // Handle add to cart
    const handleAddToCart = async (serviceId: string, serviceName: string) => {
      try {
        setAddingToCart(serviceId);
        await addToCart(serviceId, 1);
        
        setCartMessages(prev => ({
          ...prev,
          [serviceId]: `${serviceName} added to cart!`
        }));
        
        // Trigger cart refresh
        setCartRefreshTrigger(prev => prev + 1);
        
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
    
    const updateCartCount = () => {
      // Trigger cart refresh
      setCartRefreshTrigger(prev => prev + 1);
    };
    
    return (
      <div className="flex min-h-screen">
        <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        
        
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                <span className="block">Professional Home</span>
                <span className="block text-yellow-300">Services</span>
              </h1>
              <p className="text-base md:text-lg mb-8 text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Expert technicians for all your home service needs. From plumbing to electrical work, 
                we connect you with trusted professionals in your area.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setCurrentPage('all-services')}
                  className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold py-3 px-6 rounded-lg text-sm transition-all duration-200"
                >
                  Browse Services
                </button>
                <button 
                  onClick={() => setCurrentPage('offers')}
                  className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-semibold py-3 px-6 rounded-lg text-sm transition-all duration-200"
                >
                  View Offers
                </button>
              </div>
            </div>
          </div>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 rounded-full translate-y-32 -translate-x-32"></div>
        </section>

        {/* All Services Section */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Our Services</h2>
              <p className="text-base text-gray-600 max-w-2xl mx-auto">
                Professional home services at your fingertips
              </p>
            </div>
            
            {servicesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600 font-semibold">Loading services...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {allServices.map((service, index) => (
                  <div 
                    key={service.id || index}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group relative border border-gray-100"
                  >
                    {/* Cart Success Message */}
                    {cartMessages[service.id] && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium shadow-md">
                          Added!
                        </div>
                      </div>
                    )}
                    
                    <div className="h-32 bg-gradient-to-br from-orange-100 via-purple-100 to-blue-100 flex items-center justify-center relative overflow-hidden border-b border-purple-200">
                      <span className="text-sm font-semibold text-purple-900 text-center px-3 leading-tight bg-white/80 backdrop-blur-sm rounded-md py-1 shadow-sm">
                        {service.category_name}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        {service.rating && service.rating > 0 && (
                          <div className="flex items-center">
                            <span className="text-sm text-amber-500">★</span>
                            <span className="text-sm text-gray-600 ml-1">{service.rating}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-purple-600">
                            ₹{service.discounted_price || service.base_price}
                          </span>
                          {service.discounted_price && service.discounted_price < service.base_price && (
                            <span className="text-sm text-gray-400 line-through ml-2">
                              ₹{service.base_price}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight">
                        {service.name}
                      </h3>
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => navigateToServiceDetail(service.id)}
                          className="flex-1 bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => handleAddToCart(service.id, service.name)}
                          disabled={addingToCart === service.id}
                          className="flex-1 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                        >
                          {addingToCart === service.id ? 'Adding...' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-6">
              <button 
                onClick={() => setCurrentPage('all-services')}
                className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white font-medium py-3 px-8 rounded-lg text-base transition-colors duration-200"
              >
                View All Services
              </button>
            </div>
          </div>
        </section>


        {/* Featured Services Section */}
        {featuredServices.length > 0 && (
          <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Services</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Popular services chosen by our customers
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredServices.map((service, index) => (
                  <div 
                    key={service.id || index}
                    onClick={() => navigateToServiceDetail(service.id)}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden group"
                  >
                    <div className="h-20 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
                      <span className="text-xs font-medium text-gray-600 text-center px-2 leading-tight">
                        {service.category_name}
                      </span>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                        {service.name}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {service.short_description || service.description || 'Professional service for your home'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-green-600">
                            ₹{service.discounted_price || service.base_price}
                          </span>
                          {service.discounted_price && service.discounted_price < service.base_price && (
                            <span className="text-lg text-gray-500 line-through ml-2">
                              ₹{service.base_price}
                            </span>
                          )}
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300">
                          View Details
                        </button>
                      </div>
                      
                      {service.rating && service.rating > 0 && (
                        <div className="flex items-center mt-3 text-sm text-gray-600">
                          <span className="text-yellow-500">★★★★★</span>
                          <span className="ml-2">{service.rating} ({service.review_count || 0} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categories Section - Matching Services Design */}
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Our Categories</h2>
              <p className="text-base text-gray-600 max-w-2xl mx-auto">
                Professional services for every corner of your home
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeCategories.map((category, categoryIndex) => {
                // Check if this category has services
                const hasServices = convertedBackendServices?.some((service) => 
                  service.category_name === category.name && service.is_active
                );
                
                // Get first 2 subcategories for display
                const categorySubcategories = subcategories.filter(sub => 
                  sub.category_id === category.id && sub.is_active
                ).slice(0, 2);

                return (
                  <div 
                    key={category.id || categoryIndex}
                    onClick={() => hasServices ? navigateToCategory(category.name) : null}
                    className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group relative border border-gray-100 ${
                      hasServices ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                    }`}
                  >
                    {/* Category Header with same styling as services */}
                    <div className="h-32 bg-gradient-to-br from-orange-100 via-purple-100 to-blue-100 flex items-center justify-center relative overflow-hidden border-b border-purple-200">
                      <span className="text-sm font-semibold text-purple-900 text-center px-3 leading-tight bg-white/80 backdrop-blur-sm rounded-md py-1 shadow-sm">
                        {category.name}
                      </span>
                      {!hasServices && (
                        <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          Soon
                        </span>
                      )}
                    </div>
                    
                    <div className="p-4">
                      {/* Category description replacing price section */}
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 line-clamp-2 leading-tight">
                          {category.description}
                        </p>
                      </div>
                      
                      {/* Category Name */}
                      <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-1 leading-tight">
                        {category.name}
                      </h3>
                      
                      {/* Subcategories or Action */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {hasServices ? (
                          categorySubcategories.slice(0, 2).map((sub, subIndex) => (
                            <span 
                              key={subIndex} 
                              className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full font-medium"
                            >
                              {sub.name}
                            </span>
                          ))
                        ) : (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasServices) navigateToCategory(category.name);
                        }}
                        disabled={!hasServices}
                        className={`w-full px-2 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                          hasServices
                            ? 'bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {hasServices ? 'Browse Services' : 'Coming Soon'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Choose Happy Homes - Compact Section */}
        <section className="py-6 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Why Choose Happy Homes?
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm text-white">🔧</span>
                </div>
                <h4 className="font-medium text-gray-900 text-xs mb-1">Expert Professionals</h4>
                <p className="text-xs text-gray-500">Verified & experienced</p>
              </div>
              
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm text-white">⚡</span>
                </div>
                <h4 className="font-medium text-gray-900 text-xs mb-1">Same Day Service</h4>
                <p className="text-xs text-gray-500">Quick & efficient</p>
              </div>
              
              <div className="text-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm text-white">🛡️</span>
                </div>
                <h4 className="font-medium text-gray-900 text-xs mb-1">Insured & Bonded</h4>
                <p className="text-xs text-gray-500">Safe & secure</p>
              </div>
              
              <div className="text-center">
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm text-white">💯</span>
                </div>
                <h4 className="font-medium text-gray-900 text-xs mb-1">100% Guarantee</h4>
                <p className="text-xs text-gray-500">Satisfaction assured</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Home?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
              Join thousands of satisfied customers who trust us with their home service needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                onClick={() => setCurrentPage('all-services')}
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                Book Service Now
              </button>
              <WhatsAppButton
                phoneNumber="9437341234"
                message="Hi! I'm interested in your home services. Can you help me?"
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 shadow-xl"
                variant="inline"
              >
                Get Help on WhatsApp
              </WhatsAppButton>
            </div>
          </div>
        </section>
        </div>
        
        {/* Cart Sidebar */}
        <CartSidebarFixed
          isCollapsed={isCartCollapsed}
          onToggleCollapse={() => setIsCartCollapsed(!isCartCollapsed)}
          onCheckout={navigateToCheckout}
          onCartUpdate={updateCartCount}
          refreshTrigger={cartRefreshTrigger}
          isOfferPage={false}
        />
      </div>
    );
  };

  // All Services Page Component
  const AllServicesPage = () => {
    // Get all active services
    const allActiveServices = useMemo(() => {
      return convertedBackendServices
        ?.filter(service => service.is_active) || [];
    }, [convertedBackendServices]);
    
    // Cart functionality state
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    const [cartMessages, setCartMessages] = useState<{[serviceId: string]: string}>({});
    
    // Handle add to cart
    const handleAddToCart = async (serviceId: string, serviceName: string) => {
      try {
        setAddingToCart(serviceId);
        await addToCart(serviceId, 1);
        
        setCartMessages(prev => ({
          ...prev,
          [serviceId]: `${serviceName} added to cart!`
        }));
        
        updateGlobalCartCount();
        
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
      <div className="min-h-screen bg-gray-50">
        {/* Enhanced Back to Home Navigation */}
        <div className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 mb-6">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={navigateToHome}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Home</span>
              </button>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">All Services</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">All Services</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Browse all our professional home services in one place
            </p>
          </div>

          {/* Services Grid */}
          {servicesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading services...</span>
            </div>
          ) : allActiveServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allActiveServices.map((service, index) => (
                <div 
                  key={service.id || index}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group relative border border-gray-100"
                >
                  {/* Cart Success Message */}
                  {cartMessages[service.id] && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium shadow-md">
                        Added!
                      </div>
                    </div>
                  )}
                  
                  {/* Category Header */}
                  <div className="h-32 bg-gradient-to-br from-orange-100 via-purple-100 to-blue-100 flex items-center justify-center relative overflow-hidden border-b border-purple-200">
                    <span className="text-sm font-semibold text-purple-900 text-center px-3 leading-tight bg-white/80 backdrop-blur-sm rounded-md py-1 shadow-sm">
                      {service.category_name}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    {/* Rating and Price */}
                    <div className="flex items-center justify-between mb-3">
                      {service.rating && service.rating > 0 && (
                        <div className="flex items-center">
                          <span className="text-sm text-amber-500">★</span>
                          <span className="text-sm text-gray-600 ml-1">{service.rating}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-purple-600">
                          ₹{service.discounted_price || service.base_price}
                        </span>
                        {service.discounted_price && service.discounted_price < service.base_price && (
                          <span className="text-sm text-gray-400 line-through ml-2">
                            ₹{service.base_price}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Service Name */}
                    <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight">
                      {service.name}
                    </h3>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => navigateToServiceDetail(service.id)}
                        className="flex-1 bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleAddToCart(service.id, service.name)}
                        disabled={addingToCart === service.id}
                        className="flex-1 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                      >
                        {addingToCart === service.id ? 'Adding...' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* No Services */
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No services available</h3>
              <p className="text-gray-600 mb-6">
                We're working on adding more services. Please check back later.
              </p>
              <button
                onClick={navigateToHome}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Back to Home
              </button>
            </div>
          )}

          {/* Service Count */}
          {allActiveServices.length > 0 && (
            <div className="text-center mt-8">
              <p className="text-gray-600">
                Showing {allActiveServices.length} service{allActiveServices.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Back to Home Link */}
        <div className="px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto text-center">
            <button onClick={navigateToHome} className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm font-medium mx-auto">
              <span>←</span>
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  };


  // Category Page Components  
  const CategoryPage = ({ categoryName }: CategoryPageProps) => {
    // Get active subcategories for this category
    const currentCategory = categories.find(cat => cat.name === categoryName);
    const allCategorySubcategories = currentCategory 
      ? subcategories.filter(sub => 
          sub.category_id === currentCategory.id && sub.is_active
        )
      : [];
    
    // Show all active subcategories for this category (whether they have services or not)
    const categorySubcategories = allCategorySubcategories;

    // Enhanced color scheme to match home banner's vibrant violet-fuchsia-cyan theme
    const getCategoryPageColors = () => {
      // Match home banner's vibrant color combination
      return {
        bgGradient: 'from-orange-50 via-purple-50 to-blue-50',
        bgRadial: 'radial-gradient(circle at 15% 85%, rgba(139, 69, 199, 0.08) 0%, transparent 70%), radial-gradient(circle at 85% 15%, rgba(59, 130, 246, 0.06) 0%, transparent 70%), radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 60%), linear-gradient(45deg, rgba(236, 72, 153, 0.03) 0%, transparent 50%)',
        breadcrumbColor: 'text-orange-700 hover:text-purple-900',
        headerGradient: 'bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent',
        descColor: 'text-purple-800',
        exportButton: 'bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700',
        cardGradient: 'bg-gradient-to-br from-orange-50 via-purple-50 to-blue-50',
        cardBorder: 'border-orange-200 hover:border-purple-300',
        cardShadow: 'shadow-lg hover:shadow-xl',
        cardBgHover: 'hover:bg-gradient-to-br hover:from-orange-100 hover:via-purple-50 hover:to-blue-100',
        availableText: 'text-orange-700',
        subcategoryIcon: 'text-purple-600',
        priceText: 'text-purple-800',
        addToCartButton: 'bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white',
        quantityButton: 'border-orange-300 bg-orange-50 hover:bg-purple-100 text-orange-700'
      };
    };

    const colors = getCategoryPageColors();
    
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colors.bgGradient} py-8 relative overflow-y-auto`} style={{backgroundImage: colors.bgRadial}}>
        {/* Enhanced Back to Home Navigation */}
        <div className="bg-white/95 backdrop-blur-md shadow-lg border-b border-orange-200 mb-6">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={navigateToHome}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Home</span>
              </button>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{categoryName}</span> Services
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Enhanced Breadcrumb */}
          <nav className="mb-8">
            <div className="flex items-center space-x-2">
              <button 
                onClick={navigateToHome}
                className={`${colors.breadcrumbColor} text-base font-semibold hover:scale-105 transition-all duration-200 flex items-center space-x-1`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-bold tracking-wide">Home</span>
              </button>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className={`${colors.descColor} text-base font-bold tracking-wide`}>{categoryName}</span>
            </div>
          </nav>

          {/* Enhanced Category Header */}
          <div className="mb-16">
            {/* Welcome Section with Gradient Background - Match Home Banner */}
            <div className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 rounded-xl p-8 text-white relative overflow-hidden mb-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full transform -translate-x-12 translate-y-12"></div>
              <div className="relative z-10 text-center">
                <h1 className="text-4xl font-bold mb-3 tracking-tight">{categoryName}</h1>
                <p className="text-orange-100 text-lg leading-relaxed">Professional {categoryName.toLowerCase()} services for your home - the foundation of reliable household maintenance</p>
              </div>
            </div>
            
            {/* Admin PDF Export Option - Only visible to admin users */}
            {isAuthenticated && user && (user.role === 'admin' || user.role === 'super_admin') && (
              <div className="flex justify-center mb-8">
                <button
                  onClick={() => handlePDFExport(categoryName)}
                  className={`inline-flex items-center px-8 py-4 ${colors.exportButton} text-white font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-110`}
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  📄 Export {categoryName} Services PDF (Admin)
                </button>
              </div>
            )}
          </div>

          {/* Subcategories Grid - Matching Homepage Services Design */}
          {categorySubcategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categorySubcategories.map((subcategory, subcategoryIndex) => {
                // Find the service for this subcategory
                const subcategoryService = convertedBackendServices?.find((service) => 
                  service.subcategory_name === subcategory.name && 
                  service.category_name === categoryName &&
                  service.is_active
                );

                return (
                  <div 
                    key={subcategory.id || subcategoryIndex}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group relative border border-gray-100"
                  >
                    {/* Cart Success Message */}
                    {subcategoryService && subcategoryService.id && cartSuccessMessages[subcategoryService.id] && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium shadow-md">
                          Added!
                        </div>
                      </div>
                    )}
                    
                    {/* Category Header with same styling as homepage */}
                    <div className="h-32 bg-gradient-to-br from-orange-100 via-purple-100 to-blue-100 flex items-center justify-center relative overflow-hidden border-b border-purple-200">
                      <span className="text-sm font-semibold text-purple-900 text-center px-3 leading-tight bg-white/80 backdrop-blur-sm rounded-md py-1 shadow-sm">
                        {categoryName}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      {/* Rating and Price - matching homepage layout */}
                      <div className="flex items-center justify-between mb-3">
                        {subcategoryService?.rating && subcategoryService.rating > 0 && (
                          <div className="flex items-center">
                            <span className="text-sm text-amber-500">★</span>
                            <span className="text-sm text-gray-600 ml-1">{subcategoryService.rating}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          {subcategoryService ? (
                            <>
                              <span className="text-lg font-bold text-purple-600">
                                ₹{subcategoryService.discounted_price || subcategoryService.base_price}
                              </span>
                              {subcategoryService.discounted_price && subcategoryService.discounted_price < subcategoryService.base_price && (
                                <span className="text-sm text-gray-400 line-through ml-2">
                                  ₹{subcategoryService.base_price}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">Call for Price</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Service Name */}
                      <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight">
                        {subcategory.name === 'Toilets' ? 'Toilet Services (Classic)' : subcategory.name}
                      </h3>
                      
                      {/* Action Buttons - same layout as homepage */}
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            
                            // Handle toilet service variants
                            if (subcategory.name === 'Toilets' || 
                                subcategory.name.includes('Toilet Service') || 
                                subcategory.name.includes('toilet')) {
                              
                              // If it's already Premium, go directly to Premium page
                              if (subcategory.name.includes('Premium')) {
                                setCurrentPage('plumbing-toilets-premium');
                                return;
                              }
                              
                              // If it's Classic or generic Toilets, show choice dialog
                              const choice = window.confirm(
                                '🚽 Toilet Services - Choose Your Package:\n\n' +
                                '✅ CLASSIC Package - ₹199 (25% OFF from ₹299)\n' +
                                '   • Standard toilet repair & installation\n' +
                                '   • Basic warranty coverage\n\n' +
                                '⭐ PREMIUM Package - ₹299 (25% OFF from ₹399)\n' +
                                '   • Enhanced toilet services\n' +
                                '   • Premium warranty & support\n\n' +
                                'Click OK for PREMIUM (₹299) or Cancel for CLASSIC (₹199)'
                              );
                              if (choice) {
                                setCurrentPage('plumbing-toilets-premium');
                              } else {
                                setCurrentPage('plumbing-toilets');
                              }
                            } else {
                              // For regular services, navigate to service detail if available
                              if (subcategoryService && subcategoryService.id) {
                                console.log('🔍 Navigating to service detail for:', subcategoryService.name, 'ID:', subcategoryService.id);
                                navigateToServiceDetail(subcategoryService.id);
                              } else {
                                // Fallback to subcategory page for services without specific service data
                                console.log('🔍 No service found, navigating to subcategory page:', categoryName, subcategory.name);
                                navigateToSubcategory(categoryName, subcategory.name);
                              }
                            }
                          }}
                          className="flex-1 bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (subcategoryService && subcategoryService.id) {
                              try {
                                const cartItem = await addToCart(subcategoryService.id, 1);
                                if (cartItem) {
                                  updateGlobalCartCount();
                                  showCartSuccessMessage(subcategoryService.id, `${subcategory.name === 'Toilets' ? 'Toilet Services (Classic)' : subcategory.name} added to cart!`);
                                }
                              } catch (error) {
                                console.error('Error adding to cart:', error);
                              }
                            } else {
                              // For subcategories without services, show a message or redirect to contact
                              alert(`${subcategory.name === 'Toilets' ? 'Toilet Services (Classic)' : subcategory.name} service will be available soon! Call +91${contactSettings?.emergencyPhone || '9437341234'} for immediate assistance.`);
                            }
                          }}
                          className="flex-1 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* No Services Available Message */
            <div className="text-center py-16">
              <div className="text-6xl mb-6 text-gray-400 animate-bounce">🚧</div>
              <h2 className={`text-3xl font-bold ${colors.headerGradient} mb-4`}>
                {categoryName} Services Coming Soon!
              </h2>
              <p className={`text-lg ${colors.descColor} mb-8 max-w-2xl mx-auto opacity-90`}>
                We're working hard to bring you the best {categoryName.toLowerCase()} services. 
                Our team is setting up partnerships with certified professionals in your area.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
                {allCategorySubcategories.slice(0, 8).map((sub, index) => (
                  <div key={index} className={`${colors.cardGradient} rounded-lg p-4 text-center border ${colors.cardBorder} ${colors.cardShadow} transform hover:scale-105 transition-all duration-300`}>
                    <div className={`text-sm ${colors.subcategoryIcon} font-medium`}>{sub.name}</div>
                    <div className={`text-xs ${colors.availableText} bg-white/40 rounded-full px-2 py-1 mt-2 inline-block`}>⏳ Coming Soon</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={navigateToHome}
                  className={`${colors.exportButton} text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
                >
                  Browse Available Services
                </button>
                <a
                  href={`tel:+91${contactSettings?.emergencyPhone || '9437341234'}`}
                  className={`${colors.cardGradient} ${colors.subcategoryIcon} px-6 py-3 rounded-lg font-medium border-2 ${colors.cardBorder} hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
                >
                  📞 Call for Updates: +91 {contactSettings?.emergencyPhone || '9437341234'}
                </a>
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className={`mt-16 text-center ${colors.cardGradient} rounded-2xl p-8 ${colors.cardShadow} border-2 ${colors.cardBorder}`}>
            <h2 className={`text-2xl font-bold ${colors.subcategoryIcon} mb-4`}>
              Need Expert Help?
            </h2>
            <p className={`${colors.descColor} mb-6 opacity-90`}>
              Our certified professionals are ready to help with your {categoryName.toLowerCase()} needs
            </p>
            <a
              href={`tel:+91${contactSettings?.emergencyPhone || '9437341234'}`}
              className={`inline-flex items-center px-6 py-3 ${colors.exportButton} text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl`}
            >
              📞 Call Expert: +91 {contactSettings?.emergencyPhone || '9437341234'}
            </a>
          </div>
          
        </div>

        {/* Bottom Back to Home Link */}
        <div className="px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto text-center">
            <button onClick={navigateToHome} className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm font-medium mx-auto">
              <span>←</span>
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        {/* Main Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              
              {/* Logo Section */}
              <button 
                onClick={navigateToHome}
                className="flex items-center space-x-3 flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                  <img src="/happy-homes-logo.png" alt="Happy Homes Logo" className="w-12 h-12 rounded-xl object-contain" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {contactSettings?.companyName || 'Happy Homes'}
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">
                    {contactSettings?.tagline || 'Your Trusted Home Service Partner'}
                  </p>
                </div>
              </button>

              {/* Location & Search Section */}
              <div className="flex-1 max-w-2xl mx-4 lg:mx-8">
                
                {/* Location Display */}
                <div className="hidden lg:flex items-center mb-2">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <div className="text-sm font-medium text-gray-900 truncate max-w-48">
                      {contactSettings?.address || 'Bhubaneswar, Odisha 751001'}
                    </div>
                  </button>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleHeaderSearch} className="flex">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="hidden md:block bg-gray-100 border border-r-0 border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="All Services">All Services</option>
                    {categories.filter(cat => cat.is_active).map(category => {
                      const hasServices = convertedBackendServices?.some((service) => 
                        service.category_name === category.name && service.is_active
                      );
                      return (
                        <option key={category.id} value={category.name}>
                          {category.name}{!hasServices ? ' (Coming Soon)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={headerSearchQuery}
                      onChange={(e) => setHeaderSearchQuery(e.target.value)}
                      placeholder="Search for services (plumbing, cleaning, etc.)"
                      className="w-full px-4 py-2 md:py-3 border border-gray-300 md:border-l-0 md:rounded-l-none rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-r-md transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
                    </svg>
                  </button>
                </form>
              </div>

              {/* Right Section - Cart & User Menu */}
              <div className="flex items-center space-x-4 flex-shrink-0">
                
                {/* Cart */}
                <div className="flex items-center space-x-2">
                  {/* Mobile Cart Button - visible only on small screens */}
                  <button onClick={navigateToCart} className="sm:hidden relative flex items-center space-x-1 text-gray-700 hover:text-purple-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 4.22a1 1 0 00.95 1.28h9.46a1 1 0 00.95-1.28L15 13M9 19a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    {globalCartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {globalCartCount}
                      </span>
                    )}
                  </button>

                  {/* Desktop Cart Button - hidden on small screens */}
                  <button onClick={navigateToCart} className="hidden sm:flex relative items-center space-x-1 text-gray-700 hover:text-purple-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 4.22a1 1 0 00.95 1.28h9.46a1 1 0 00.95-1.28L15 13M9 19a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    {globalCartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {globalCartCount}
                      </span>
                    )}
                    <span className="hidden lg:block text-sm font-medium">Cart</span>
                  </button>
                </div>

                {/* Checkout */}
                <button onClick={navigateToCheckout} className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="hidden lg:block text-sm font-medium">Checkout</span>
                </button>

                {/* User Menu - Amazon Style */}
                {isAuthenticated && user ? (
                  <div className="relative group">
                    <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.firstName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="hidden lg:block text-left">
                        <div className="text-xs text-gray-500">Hello, {user.firstName}</div>
                        <div className="text-sm font-medium">Account & Lists</div>
                      </div>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 10l5 5 5-5z"/>
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
                      <div className="py-2">
                        {/* Your Account Section */}
                        <div className="px-4 py-1">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Account</div>
                        </div>
                        <button 
                          onClick={navigateToMyBookings}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                        >
                          Your Orders
                        </button>
                        {(user.role === 'admin' || user.role === 'super_admin') && (
                          <button 
                            onClick={navigateToAdmin}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600 font-medium"
                          >
                            Admin Panel
                          </button>
                        )}
                        <button 
                          onClick={() => setCurrentPage('profile')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        >
                          Account Settings
                        </button>
                        <button 
                          onClick={() => setCurrentPage('favorites')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        >
                          Your Favorites
                        </button>
                        <hr className="my-2 border-gray-100" />
                        
                        {/* Other Actions */}
                        <button 
                          onClick={() => setCurrentPage('help')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        >
                          Help & Support
                        </button>
                        <hr className="my-2 border-gray-100" />
                        <button 
                          onClick={() => {
                            logout();
                            setCurrentPage('home');
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button onClick={navigateToLogin} className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 transition-all">
                      Login
                    </button>
                    <button onClick={navigateToSignup} className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 transition-all">
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced 3D Navigation Bar */}
        <div className="bg-gradient-to-r from-orange-50 to-purple-50 border-b border-orange-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-3 h-16 overflow-x-auto py-2">
              <button 
                onClick={navigateToHome}
                className={`px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  currentPage === 'home' 
                    ? 'bg-gradient-to-br from-orange-500 via-purple-600 to-blue-600 text-white shadow-2xl shadow-orange-300/50 ring-2 ring-orange-200 scale-105'
                    : 'bg-gradient-to-br from-white to-orange-50 text-gray-700 shadow-lg hover:shadow-xl border border-orange-200 hover:border-purple-300'
                } hover:rotate-1`}
                style={{
                  boxShadow: currentPage === 'home'
                    ? '0 20px 25px -5px rgba(139, 69, 199, 0.3), inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)' 
                    : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 2px 4px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                <span className={`font-semibold tracking-wide ${currentPage === 'home' ? 'text-white' : 'text-gray-700'}`}>Home</span>
              </button>
              
              {/* Render all active categories in navigation */}
              {categories.filter(cat => cat.is_active).map(category => {
                const hasServices = convertedBackendServices?.some((service) => 
                  service.category_name === category.name && service.is_active
                );
                const categoryPageName = category.name.toLowerCase().replace(/\s+/g, '-').replace('&', '&');
                const isActive = currentPage === categoryPageName || currentPage.startsWith(categoryPageName + '-');
                
                return (
                  <button 
                    key={category.id}
                    onClick={() => hasServices ? navigateToCategory(category.name) : null}
                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap transform hover:scale-105 active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-br from-orange-500 via-purple-600 to-blue-600 text-white shadow-2xl shadow-orange-300/50 ring-2 ring-orange-200 scale-105'
                        : hasServices
                          ? 'bg-gradient-to-br from-white to-orange-50 text-gray-700 shadow-lg hover:shadow-xl border border-orange-200 hover:border-purple-300'
                          : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 shadow-lg border border-gray-300 cursor-not-allowed opacity-60'
                    } hover:rotate-1`}
                    style={{
                      boxShadow: isActive
                        ? '0 20px 25px -5px rgba(139, 69, 199, 0.3), inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)' 
                        : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 2px 4px 0 rgba(255, 255, 255, 0.3)'
                    }}
                    disabled={!hasServices}
                  >
                    <span className="flex items-center space-x-1">
                      <span className="tracking-wide">{category.name === 'Finance & Insurance' ? 'Finance' : category.name}</span>
                      {!hasServices && <span className="text-xs">🔒</span>}
                    </span>
                  </button>
                );
              })}
              
              <button 
                onClick={() => setCurrentPage('offers')} 
                className="px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap transform hover:scale-105 active:scale-95 bg-gradient-to-br from-white to-orange-50 text-gray-700 shadow-lg hover:shadow-xl border border-orange-200 hover:border-purple-300 hover:rotate-1"
                style={{
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 2px 4px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                <span>🎁 Offers</span>
              </button>
              
              
              
            </nav>
          </div>
        </div>
      </header>

      {/* Conditional Layout: Flex for Category Pages, Normal for Others */}
      {(() => {
        // Check if current page is a category page or service detail page
        const isCategoryPage = categories.some(cat => {
          const categoryPageName = cat.name.toLowerCase().replace(/\s+/g, '-').replace('&', '&');
          return currentPage === categoryPageName || currentPage.startsWith(categoryPageName + '-');
        });

        if (isCategoryPage) {
          // Show cart sidebar only on category pages
          return (
            <div className="flex">
              {/* Main Content */}
              <main className="flex-1 transition-all duration-300">
                {currentPage === 'search-results' && <SearchResultsPage />}
                {/* Render category pages dynamically - for all active categories */}
                {categories.filter(cat => cat.is_active).map(category => {
                  const categoryPageName = category.name.toLowerCase().replace(/\s+/g, '-').replace('&', '&');
                  if (currentPage === categoryPageName) {
                    return (
                      <CategoryPage 
                        key={category.id}
                        categoryName={category.name} 
                      />
                    );
                  }
                  return null;
                })}
                {/* Plumbing Service Detail Pages */}
                {currentPage === 'plumbing-bath-fittings' && (
                  <ServiceDetailPage categoryName="Plumbing" serviceName="Bath Fitting Installation" />
                )}
                {currentPage === 'plumbing-basin,-sink-&-drainage' && (
                  <ServiceDetailPage categoryName="Plumbing" serviceName="Basin & Sink Installation" />
                )}
                {currentPage === 'plumbing-basin-&-sink' && (
                  <ServiceDetailPage categoryName="Plumbing" serviceName="Basin & Sink" />
                )}
                {currentPage === 'plumbing-grouting' && (
                  <ServiceDetailPage categoryName="Plumbing" serviceName="Professional Grouting Service" />
                )}
                {currentPage === 'plumbing-toilets' && (
                  <ServiceDetailPage categoryName="Plumbing" serviceName="Toilet Installation & Repair" />
                )}
                {currentPage === 'plumbing-toilets-premium' && (
                  <ServiceDetailPage categoryName="Plumbing" serviceName="Toilet Services (Premium)" />
                )}
                {currentPage === 'plumbing-pipe-&-connector' && (
                  <ServiceDetailPage categoryName="Plumbing" serviceName="Pipe & Connector Installation" />
                )}
                {currentPage === 'plumbing-pipes' && (
                  <ServiceDetailPage categoryName="Plumbing" serviceName="Pipes" />
                )}
                {currentPage === 'plumbing-water-tank' && (
                  <ServiceDetailPage categoryName="Plumbing" serviceName="Water Tank Installation" />
                )}
                {currentPage === 'plumbing-others' && (
                  <ServiceDetailPage categoryName="Plumbing" serviceName="Others" />
                )}

                {/* Electrical Service Detail Pages */}
                {currentPage === 'electrical-wiring-&-installation' && (
                  <ServiceDetailPage categoryName="Electrical" serviceName="House Wiring" />
                )}
                {currentPage === 'electrical-wiring-installation' && (
                  <ServiceDetailPage categoryName="Electrical" serviceName="Wiring Installation" />
                )}
                {currentPage === 'electrical-appliance-repair' && (
                  <ServiceDetailPage categoryName="Electrical" serviceName="Home Appliance Repair" />
                )}
                {currentPage === 'electrical-switch-&-socket' && (
                  <ServiceDetailPage categoryName="Electrical" serviceName="Switch & Socket Installation" />
                )}
                {currentPage === 'electrical-fan-installation' && (
                  <ServiceDetailPage categoryName="Electrical" serviceName="Fan Installation Service" />
                )}
                {currentPage === 'electrical-lighting-solutions' && (
                  <ServiceDetailPage categoryName="Electrical" serviceName="Lighting Solutions" />
                )}
                {currentPage === 'electrical-lighting-solution' && (
                  <ServiceDetailPage categoryName="Electrical" serviceName="Lighting Solution" />
                )}
                {currentPage === 'electrical-electrical-safety-check' && (
                  <ServiceDetailPage categoryName="Electrical" serviceName="Electrical Safety Check" />
                )}

                {/* Cleaning Service Detail Pages */}
                {currentPage === 'cleaning-bathroom-cleaning' && (
                  <ServiceDetailPage categoryName="Cleaning" serviceName="Deep Bathroom Cleaning" />
                )}
                {currentPage === 'cleaning-ac-cleaning' && (
                  <ServiceDetailPage categoryName="Cleaning" serviceName="AC Cleaning" />
                )}
                {currentPage === 'cleaning-water-tank-cleaning' && (
                  <ServiceDetailPage categoryName="Cleaning" serviceName="Water Tank Cleaning" />
                )}
                {currentPage === 'cleaning-septic-tank-cleaning' && (
                  <ServiceDetailPage categoryName="Cleaning" serviceName="Septic Tank Cleaning" />
                )}
                {currentPage === 'cleaning-water-purifier-cleaning' && (
                  <ServiceDetailPage categoryName="Cleaning" serviceName="Water Purifier Cleaning" />
                )}
                {currentPage === 'cleaning-car-wash' && (
                  <ServiceDetailPage categoryName="Cleaning" serviceName="Car Wash" />
                )}

                {/* Call A Service Detail Pages */}
                {currentPage === 'call-a-service-interintra-city-courier' && (
                  <ServiceDetailPage categoryName="Call A Service" serviceName="Courier Pickup & Delivery" />
                )}
                {currentPage === 'call-a-service-courier-services' && (
                  <ServiceDetailPage categoryName="Call A Service" serviceName="Courier Services" />
                )}
                {currentPage === 'call-a-service-courier-service' && (
                  <ServiceDetailPage categoryName="Call A Service" serviceName="Courier Service" />
                )}
                {currentPage === 'call-a-service-cab-booking' && (
                  <ServiceDetailPage categoryName="Call A Service" serviceName="CAB Booking" />
                )}
                {currentPage === 'call-a-service-vehicle-breakdown-service' && (
                  <ServiceDetailPage categoryName="Call A Service" serviceName="Vehicle Breakdown Service" />
                )}
                {currentPage === 'call-a-service-vehicle-breakdown' && (
                  <ServiceDetailPage categoryName="Call A Service" serviceName="Vehicle Breakdown" />
                )}
                {currentPage === 'call-a-service-photographer' && (
                  <ServiceDetailPage categoryName="Call A Service" serviceName="Photographer" />
                )}
                {currentPage === 'call-a-service-photography' && (
                  <ServiceDetailPage categoryName="Call A Service" serviceName="Photography" />
                )}
                {currentPage === 'call-a-service-logistics' && (
                  <ServiceDetailPage categoryName="Call A Service" serviceName="Logistics" />
                )}

                {/* Finance & Insurance Service Detail Pages */}
                {currentPage === 'finance-&-insurance-gst-registration-and-filing' && (
                  <ServiceDetailPage categoryName="Finance & Insurance" serviceName="GST Registration Service" />
                )}
                {currentPage === 'finance-&-insurance-gst-registration' && (
                  <ServiceDetailPage categoryName="Finance & Insurance" serviceName="GST Registration" />
                )}
                {currentPage === 'finance-&-insurance-gst-services' && (
                  <ServiceDetailPage categoryName="Finance & Insurance" serviceName="GST Services" />
                )}
                {currentPage === 'finance-&-insurance-pan-card-application' && (
                  <ServiceDetailPage categoryName="Finance & Insurance" serviceName="PAN Card Application" />
                )}
                {currentPage === 'finance-&-insurance-pan-card-services' && (
                  <ServiceDetailPage categoryName="Finance & Insurance" serviceName="PAN Card Services" />
                )}
                {currentPage === 'finance-&-insurance-itr-filing' && (
                  <ServiceDetailPage categoryName="Finance & Insurance" serviceName="ITR Filing" />
                )}
                {currentPage === 'finance-&-insurance-stamp-paper-agreement' && (
                  <ServiceDetailPage categoryName="Finance & Insurance" serviceName="Stamp Paper Agreement" />
                )}
                {currentPage === 'finance-&-insurance-stamp-paper-&-agreement' && (
                  <ServiceDetailPage categoryName="Finance & Insurance" serviceName="Stamp Paper & Agreement" />
                )}
                {currentPage === 'finance-&-insurance-legal-documentation' && (
                  <ServiceDetailPage categoryName="Finance & Insurance" serviceName="Legal Documentation" />
                )}
                {currentPage === 'finance-&-insurance-financial-services' && (
                  <ServiceDetailPage categoryName="Finance & Insurance" serviceName="Financial Services" />
                )}

                {/* Personal Care Service Detail Pages */}
                {currentPage === 'personal-care-medicine-delivery' && (
                  <ServiceDetailPage categoryName="Personal Care" serviceName="Medicine Home Delivery" />
                )}
                {currentPage === 'personal-care-salon-at-door' && (
                  <ServiceDetailPage categoryName="Personal Care" serviceName="Salon at Door" />
                )}
                {currentPage === 'personal-care-salon-at-home' && (
                  <ServiceDetailPage categoryName="Personal Care" serviceName="Salon at Home" />
                )}
                {currentPage === 'personal-care-beauty-&-salon' && (
                  <ServiceDetailPage categoryName="Personal Care" serviceName="Beauty & Salon" />
                )}
                {currentPage === 'personal-care-health-services' && (
                  <ServiceDetailPage categoryName="Personal Care" serviceName="Health Services" />
                )}
                {currentPage === 'personal-care-health-checkup' && (
                  <ServiceDetailPage categoryName="Personal Care" serviceName="Health Checkup" />
                )}

                {/* Civil Work Service Detail Pages */}
                {currentPage === 'civil-work-house-painting' && (
                  <ServiceDetailPage categoryName="Civil Work" serviceName="Interior House Painting" />
                )}
                {currentPage === 'civil-work-tilegraniemarble-works' && (
                  <ServiceDetailPage categoryName="Civil Work" serviceName="Tile/Granite/Marble Works" />
                )}
                {currentPage === 'civil-work-tile-&-marble-work' && (
                  <ServiceDetailPage categoryName="Civil Work" serviceName="Tile & Marble Work" />
                )}
                {currentPage === 'civil-work-tile-work' && (
                  <ServiceDetailPage categoryName="Civil Work" serviceName="Tile Work" />
                )}
                {currentPage === 'civil-work-house-repair' && (
                  <ServiceDetailPage categoryName="Civil Work" serviceName="House Repair" />
                )}
                {currentPage === 'civil-work-home-repairs' && (
                  <ServiceDetailPage categoryName="Civil Work" serviceName="Home Repairs" />
                )}
                {currentPage === 'civil-work-construction' && (
                  <ServiceDetailPage categoryName="Civil Work" serviceName="Construction" />
                )}
                {currentPage === 'civil-work-civil-engineering' && (
                  <ServiceDetailPage categoryName="Civil Work" serviceName="Civil Engineering" />
                )}

                {/* Others Service Detail Pages */}
                {currentPage === 'plumbing-others' && (
                  <ServiceDetailPage categoryName="Plumbing" serviceName="Others" />
                )}
                {currentPage === 'electrical-others' && (
                  <ServiceDetailPage categoryName="Electrical" serviceName="Others" />
                )}
                {currentPage === 'cleaning-others' && (
                  <ServiceDetailPage categoryName="Cleaning" serviceName="Others" />
                )}
                {currentPage === 'call-a-service-others' && (
                  <ServiceDetailPage categoryName="Call A Service" serviceName="Others" />
                )}
                {currentPage === 'finance-&-insurance-others' && (
                  <ServiceDetailPage categoryName="Finance & Insurance" serviceName="Others" />
                )}
                {currentPage === 'personal-care-others' && (
                  <ServiceDetailPage categoryName="Personal Care" serviceName="Others" />
                )}
                {currentPage === 'civil-work-others' && (
                  <ServiceDetailPage categoryName="Civil Work" serviceName="Others" />
                )}
              </main>

              {/* Integrated Cart Sidebar - Only on Category Pages */}
              <CartSidebarFixed
                isCollapsed={isCartCollapsed}
                onToggleCollapse={() => setIsCartCollapsed(!isCartCollapsed)}
                onCheckout={navigateToCheckout}
                onCartUpdate={updateGlobalCartCount}
                refreshTrigger={cartRefreshTrigger}
                isOfferPage={false}
              />
            </div>
          );
        } else {
          // Normal layout for non-category pages (Home, Login, Cart, etc.)
          return (
            <main className="transition-all duration-300">
              {currentPage === 'home' && (
                <HomePage 
                  navigateToServiceDetail={navigateToServiceDetail} 
                  navigateToCheckout={navigateToCheckout}
                />
              )}
              {currentPage === 'all-services' && <AllServicesPage />}
              {currentPage === 'search-results' && <SearchResultsPage />}
              {currentPage === 'login' && <LoginPage navigateHome={navigateToHome} navigateToSignup={navigateToSignup} />}
              {currentPage === 'signup' && <RegisterPage navigateHome={navigateToHome} navigateToLogin={navigateToLogin} />}
              {currentPage === 'cart' && <CartPage navigateHome={navigateToHome} navigateToLogin={navigateToLogin} navigateToCheckout={navigateToCheckout} updateCartCount={updateGlobalCartCount} />}
              {currentPage === 'checkout' && <CheckoutPage navigateHome={navigateToHome} navigateToCart={navigateToCart} navigateToLogin={navigateToLogin} navigateToAddAddress={navigateToAddAddress} navigateToMyBookings={navigateToMyBookings} updateCartCount={updateGlobalCartCount} />}
              {currentPage === 'add-address' && <AddAddressPage navigateHome={navigateToHome} navigateToCheckout={navigateToCheckout} />}
              {currentPage === 'my-bookings' && <MyBookingsPage />}
              {currentPage === 'profile' && <ProfilePage />}
              {currentPage === 'offers' && <OfferPage navigateHome={navigateToHome} navigateToLogin={navigateToLogin} navigateToCheckout={navigateToCheckout} navigateToCart={navigateToCart} />}
              {currentPage === 'service-detail' && selectedServiceId && (
                <ServiceDetailPageRoute serviceId={selectedServiceId} />
              )}
              {currentPage === 'admin' && (
                <AdminPanel 
                  onCategoryChange={refreshCategoriesData} 
                  onContactChange={refreshContactSettings}
                />
              )}
            </main>
          );
        }
      })()}

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HH</span>
                </div>
                <span className="text-xl font-bold">Happy Homes</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Your trusted partner for all household services. Professional, reliable, and affordable solutions for your home.
              </p>
              
              {/* Company Information Links */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href="https://happyhomes.com/about" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-gray-400 hover:text-white transition-colors group"
                  >
                    <span className="mr-2 group-hover:scale-110 transition-transform">ℹ️</span>
                    About Us
                  </a>
                  <a 
                    href="https://happyhomes.com/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-gray-400 hover:text-white transition-colors group"
                  >
                    <span className="mr-2 group-hover:scale-110 transition-transform">📄</span>
                    Terms & Conditions
                  </a>
                  <a 
                    href="https://happyhomes.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-gray-400 hover:text-white transition-colors group"
                  >
                    <span className="mr-2 group-hover:scale-110 transition-transform">🔒</span>
                    Privacy Policy
                  </a>
                  <a 
                    href="https://happyhomes.com/careers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-gray-400 hover:text-white transition-colors group"
                  >
                    <span className="mr-2 group-hover:scale-110 transition-transform">💼</span>
                    Careers
                  </a>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Plumbing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Electrical</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cleaning</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Call A Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Finance & Insurance</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Personal Care</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Civil Work</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <ul className="space-y-2 text-sm mb-6">
                <li className="text-gray-400">📞 {contactSettings?.phone || '9437341234'}</li>
                <li className="text-gray-400">✉️ {contactSettings?.email || 'care@happyhomesworld.com'}</li>
                <li className="text-gray-400">📍 {contactSettings?.address || 'Bhubaneswar, Odisha'}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Share & Connect</h3>
              <div className="flex space-x-3 mb-4">
                <a 
                  href={`https://wa.me/91${contactSettings?.whatsappNumber || '9437341234'}?text=Hi%20I%20want%20to%20book%20service`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center hover:bg-green-700 transition-all duration-200 transform hover:scale-110"
                  title="WhatsApp"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </a>
                <a 
                  href={contactSettings?.facebookUrl || "https://www.facebook.com/happyhomes.official"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white rounded-lg flex items-center justify-center hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-110"
                  title="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href="https://x.com/happyhomes_in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-sky-500 text-white rounded-lg flex items-center justify-center hover:bg-sky-600 transition-all duration-200 transform hover:scale-110"
                  title="X (formerly Twitter)"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
              <p className="text-xs text-gray-500">Follow us for updates and offers</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8">
            <p className="text-center text-gray-400 text-sm">
              © 2024 Happy Homes. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <WhatsAppButton
        variant="floating"
        phoneNumber={contactSettings?.whatsappNumber || '9437341234'}
        message="Hi! I need help with household services. Can you assist me?"
      />

    </div>
  );
};

export default App;