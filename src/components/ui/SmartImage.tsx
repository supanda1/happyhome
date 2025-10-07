import React, { useState, useEffect } from 'react';

// Local interface definition to avoid import issues
interface ImageConfig {
  id: string;
  src: string;
  alt: string;
  type: 'pexels-stock' | 'stock-photo' | 'placeholder';
  fallbackEmoji: string;
  pexelsId?: string; // Optional Pexels photo ID for reference
}

// Local utility functions
const getImageSrc = (imageConfig: ImageConfig): string => {
  return imageConfig.src || '';
};

// Utility function to check if image exists (currently unused but kept for future use)
// const imageExists = (src: string): boolean => {
//   if (!src) return false;
//   
//   // Return true for all our valid image paths
//   const validPaths = [
//     '/images/categories/',
//     '/images/subcategories/'
//   ];
//   
//   // Allow all images that start with valid paths
//   return validPaths.some(path => src.startsWith(path));
// };

interface SmartImageProps {
  imageConfig: ImageConfig;
  className?: string;
  fallbackClassName?: string;
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
}

/**
 * SmartImage Component - Handles image loading with emoji fallback
 * 
 * This component implements the hybrid photo approach:
 * 1. Attempts to load the configured image (AI-generated or stock photo)
 * 2. Falls back to emoji if image is not available
 * 3. Provides loading states and error handling
 */
export const SmartImage: React.FC<SmartImageProps> = ({
  imageConfig,
  className = '',
  fallbackClassName = '',
  loading = 'lazy',
  onClick
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageSrc = getImageSrc(imageConfig);

  useEffect(() => {
    if (!imageSrc) {
      setImageError(true);
      setIsLoading(false);
      return;
    }

    // For development, allow all images to attempt loading
    setImageError(false);
    setIsLoading(true);
  }, [imageSrc]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    setIsLoading(false);
  };

  // If no image source or image failed to load, show emoji fallback
  if (!imageSrc || imageError) {
    return (
      <div 
        className={`flex items-center justify-center ${fallbackClassName} ${className}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <span className="text-4xl md:text-6xl animate-pulse">
          {imageConfig.fallbackEmoji}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <span className="text-2xl opacity-50">
            {imageConfig.fallbackEmoji}
          </span>
        </div>
      )}
      
      {/* Actual image */}
      <img
        src={imageSrc}
        alt={imageConfig.alt}
        loading={loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
    </div>
  );
};

// Component for category hero images
interface CategoryImageProps {
  categoryName: string;
  className?: string;
  showTitle?: boolean;
  onClick?: () => void;
}

export const CategoryImage: React.FC<CategoryImageProps> = ({
  categoryName,
  className = 'w-full h-48 rounded-lg',
  showTitle = false,
  onClick
}) => {
  // Get the actual image path based on category name
  const getImagePath = (categoryName: string): string => {
    const categoryKey = categoryName.toLowerCase().replace(/\s+/g, '-').replace('&', '');
    const imageMap: Record<string, string> = {
      'plumbing': '/images/categories/plumbing-hero.jpg',
      'electrical': '/images/categories/electrical-hero.jpg',
      'cleaning': '/images/categories/cleaning-hero.jpg',
      'call-a-service': '/images/categories/call-service-hero.jpg',
      'finance-insurance': '/images/categories/finance-hero.jpg',
      'personal-care': '/images/categories/personal-care-hero.jpg',
      'civil-work': '/images/categories/civil-work-hero.jpg'
    };
    return imageMap[categoryKey] || '';
  };

  const imageConfig = {
    id: `category-${categoryName.toLowerCase()}`,
    src: getImagePath(categoryName), // ✅ Now using real Pexels images!
    alt: `${categoryName} Services - Professional home services`,
    type: 'pexels-stock' as const,
    fallbackEmoji: getCategoryEmoji(categoryName)
  };

  return (
    <div className="relative">
      <SmartImage
        imageConfig={imageConfig}
        className={className}
        fallbackClassName="bg-gradient-to-br from-blue-100 to-purple-100"
        onClick={onClick}
      />
      {showTitle && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white font-bold text-lg">
            {categoryName}
          </h3>
        </div>
      )}
    </div>
  );
};

// Component for service detail images
interface ServiceImageProps {
  categoryName: string;
  serviceName: string;
  imageIndex?: number;
  className?: string;
  onClick?: () => void;
}

export const ServiceImage: React.FC<ServiceImageProps> = ({
  categoryName,
  serviceName,
  imageIndex = 0,
  className = 'w-full h-48 rounded-lg',
  onClick
}) => {
  // Get all images for this service/subcategory
  // Note: This now uses the database-driven approach with newly downloaded images
  const getSubcategoryImages = (subcategoryName: string): string[] => {
    // Updated plumbing services with 5 professional images each
    const imageArrayMap: { [key: string]: string[] } = {
      // Plumbing Subcategories - Now with 5 high-quality images each
      'Bath Fittings': [
        '/images/subcategories/plumbing/bath-fittings/bath-fittings-1.jpg',
        '/images/subcategories/plumbing/bath-fittings/bath-fittings-2.jpg',
        '/images/subcategories/plumbing/bath-fittings/bath-fittings-3.jpg',
        '/images/subcategories/plumbing/bath-fittings/bath-fittings-4.jpg',
        '/images/subcategories/plumbing/bath-fittings/bath-fittings-5.jpg'
      ],
      'Basin, Sink & Drainage': [
        '/images/subcategories/plumbing/basin-sink-drainage-1.jpg',
        '/images/subcategories/plumbing/basin-sink-drainage-2.jpg',
        '/images/subcategories/plumbing/basin-sink-drainage-3.jpg',
        '/images/subcategories/plumbing/basin-sink-drainage-4.jpg',
        '/images/subcategories/plumbing/basin-sink-drainage-5.jpg'
      ], 
      'Grouting': [
        '/images/subcategories/plumbing/grouting/grouting-1.jpg',
        '/images/subcategories/plumbing/grouting/grouting-2.jpg',
        '/images/subcategories/plumbing/grouting/grouting-3.jpg',
        '/images/subcategories/plumbing/grouting/grouting-4.jpg',
        '/images/subcategories/plumbing/grouting/grouting-5.jpg'
      ],
      'Toilets': [
        '/images/subcategories/plumbing/toilet-services/toilet-service-1.jpg',
        '/images/subcategories/plumbing/toilet-services/toilet-service-2.jpg',
        '/images/subcategories/plumbing/toilet-services/toilet-service-3.jpg',
        '/images/subcategories/plumbing/toilet-services/toilet-service-4.jpg',
        '/images/subcategories/plumbing/toilet-services/toilet-service-5.jpg'
      ],
      'Toilet Services (Classic)': [
        '/images/subcategories/plumbing/toilet-services/toilet-service-1.jpg',
        '/images/subcategories/plumbing/toilet-services/toilet-service-2.jpg',
        '/images/subcategories/plumbing/toilet-services/toilet-service-3.jpg',
        '/images/subcategories/plumbing/toilet-services/toilet-service-4.jpg',
        '/images/subcategories/plumbing/toilet-services/toilet-service-5.jpg'
      ],
      'Toilet Services (Premium)': [
        '/images/subcategories/plumbing/toilet-services/toilet-service-1.jpg',
        '/images/subcategories/plumbing/toilet-services/toilet-service-2.jpg',
        '/images/subcategories/plumbing/toilet-services/toilet-service-3.jpg',
        '/images/subcategories/plumbing/toilet-services/toilet-service-4.jpg',
        '/images/subcategories/plumbing/toilet-services/toilet-service-5.jpg'
      ],
      'Pipe & Connector': [
        '/images/subcategories/plumbing/pipe-connector/pipe-connector-1.jpg',
        '/images/subcategories/plumbing/pipe-connector/pipe-connector-2.jpg',
        '/images/subcategories/plumbing/pipe-connector/pipe-connector-3.jpg',
        '/images/subcategories/plumbing/pipe-connector/pipe-connector-4.jpg',
        '/images/subcategories/plumbing/pipe-connector/pipe-connector-5.jpg'
      ],
      'Water Tank': [
        '/images/subcategories/plumbing/water-tank/water-tank-1.jpg',
        '/images/subcategories/plumbing/water-tank/water-tank-2.jpg',
        '/images/subcategories/plumbing/water-tank/water-tank-3.jpg',
        '/images/subcategories/plumbing/water-tank/water-tank-4.jpg',
        '/images/subcategories/plumbing/water-tank/water-tank-5.jpg'
      ],
      'Others': [
        '/images/subcategories/plumbing/others/others-1.jpg',
        '/images/subcategories/plumbing/others/others-2.jpg',
        '/images/subcategories/plumbing/others/others-3.jpg',
        '/images/subcategories/plumbing/others/others-4.jpg',
        '/images/subcategories/plumbing/others/others-5.jpg'
      ],
      
      // Electrical Subcategories (4 images each)
      'Wiring & Installation': [
        '/images/subcategories/electrical/wiring-installation-1.jpg',
        '/images/subcategories/electrical/wiring-installation-2.jpg',
        '/images/subcategories/electrical/wiring-installation-3.jpg',
        '/images/subcategories/electrical/wiring-installation-4.jpg'
      ],
      'Appliance Repair': [
        '/images/subcategories/electrical/appliance-repair-1.jpg',
        '/images/subcategories/electrical/appliance-repair-2.jpg',
        '/images/subcategories/electrical/appliance-repair-3.jpg',
        '/images/subcategories/electrical/appliance-repair-4.jpg'
      ],
      'Switch & Socket': [
        '/images/subcategories/electrical/switch-socket-1.jpg',
        '/images/subcategories/electrical/switch-socket-2.jpg',
        '/images/subcategories/electrical/switch-socket-3.jpg',
        '/images/subcategories/electrical/switch-socket-4.jpg'
      ],
      'Fan Installation': [
        '/images/subcategories/electrical/fan-installation-1.jpg',
        '/images/subcategories/electrical/fan-installation-2.jpg',
        '/images/subcategories/electrical/fan-installation-3.jpg',
        '/images/subcategories/electrical/fan-installation-4.jpg'
      ],
      'Lighting Solutions': [
        '/images/subcategories/electrical/lighting-solutions-1.jpg',
        '/images/subcategories/electrical/lighting-solutions-2.jpg',
        '/images/subcategories/electrical/lighting-solutions-3.jpg',
        '/images/subcategories/electrical/lighting-solutions-4.jpg'
      ],
      'Electrical Safety Check': [
        '/images/subcategories/electrical/electrical-safety-check-1.jpg',
        '/images/subcategories/electrical/electrical-safety-check-2.jpg',
        '/images/subcategories/electrical/electrical-safety-check-3.jpg',
        '/images/subcategories/electrical/electrical-safety-check-4.jpg'
      ],
      
      // Cleaning Subcategories (4 images each)
      'Bathroom Cleaning': [
        '/images/subcategories/cleaning/bathroom-cleaning-1.jpg',
        '/images/subcategories/cleaning/bathroom-cleaning-2.jpg',
        '/images/subcategories/cleaning/bathroom-cleaning-3.jpg',
        '/images/subcategories/cleaning/bathroom-cleaning-4.jpg'
      ],
      'AC Cleaning': [
        '/images/subcategories/cleaning/ac-cleaning-1.jpg',
        '/images/subcategories/cleaning/ac-cleaning-2.jpg',
        '/images/subcategories/cleaning/ac-cleaning-3.jpg',
        '/images/subcategories/cleaning/ac-cleaning-4.jpg'
      ],
      'Water Tank Cleaning': [
        '/images/subcategories/cleaning/water-tank-cleaning-1.jpg',
        '/images/subcategories/cleaning/water-tank-cleaning-2.jpg',
        '/images/subcategories/cleaning/water-tank-cleaning-3.jpg',
        '/images/subcategories/cleaning/water-tank-cleaning-4.jpg'
      ],
      'Septic Tank Cleaning': [
        '/images/subcategories/cleaning/septic-tank-cleaning-1.jpg',
        '/images/subcategories/cleaning/septic-tank-cleaning-2.jpg',
        '/images/subcategories/cleaning/septic-tank-cleaning-3.jpg',
        '/images/subcategories/cleaning/septic-tank-cleaning-4.jpg'
      ],
      'Water Purifier Cleaning': [
        '/images/subcategories/cleaning/water-purifier-cleaning-1.jpg',
        '/images/subcategories/cleaning/water-purifier-cleaning-2.jpg',
        '/images/subcategories/cleaning/water-purifier-cleaning-3.jpg',
        '/images/subcategories/cleaning/water-purifier-cleaning-4.jpg'
      ],
      'Car Wash': [
        '/images/subcategories/cleaning/car-wash-1.jpg',
        '/images/subcategories/cleaning/car-wash-2.jpg',
        '/images/subcategories/cleaning/car-wash-3.jpg',
        '/images/subcategories/cleaning/car-wash-4.jpg'
      ],
      
      // Call A Service Subcategories
      'Inter/Intra City Courier': [
        '/images/subcategories/call-a-service/courier-service-1.jpg',
        '/images/subcategories/call-a-service/courier-service-2.jpg',
        '/images/subcategories/call-a-service/courier-service-3.jpg',
        '/images/subcategories/call-a-service/courier-service-4.jpg'
      ],
      'CAB Booking': [
        '/images/subcategories/call-a-service/cab-booking-1.jpg',
        '/images/subcategories/call-a-service/cab-booking-2.jpg',
        '/images/subcategories/call-a-service/cab-booking-3.jpg',
        '/images/subcategories/call-a-service/cab-booking-4.jpg'
      ],
      'Vehicle Breakdown Service': [
        '/images/subcategories/call-a-service/vehicle-breakdown-1.jpg',
        '/images/subcategories/call-a-service/vehicle-breakdown-2.jpg',
        '/images/subcategories/call-a-service/vehicle-breakdown-3.jpg',
        '/images/subcategories/call-a-service/vehicle-breakdown-4.jpg'
      ],
      'Photographer': [
        '/images/subcategories/call-a-service/photographer-1.jpg',
        '/images/subcategories/call-a-service/photographer-2.jpg',
        '/images/subcategories/call-a-service/photographer-3.jpg',
        '/images/subcategories/call-a-service/photographer-4.jpg',
        '/images/subcategories/call-a-service/photographer-5.jpg'
      ],
      
      // Finance & Insurance Subcategories
      'GST Registration and Filing': [
        '/images/subcategories/finance-insurance/gst-registration-1.jpg',
        '/images/subcategories/finance-insurance/gst-registration-2.jpg'
      ],
      'PAN Card Application': ['/images/subcategories/finance-insurance/gst-registration-1.jpg'],
      'ITR Filing': [
        '/images/subcategories/finance-insurance/itr-filing-1.jpg',
        '/images/subcategories/finance-insurance/itr-filing-2.jpg',
        '/images/subcategories/finance-insurance/itr-filing-3.jpg',
        '/images/subcategories/finance-insurance/itr-filing-4.jpg'
      ],
      'Stamp Paper Agreement': [
        '/images/subcategories/finance-insurance/stamp-paper-agreement-1.jpg',
        '/images/subcategories/finance-insurance/stamp-paper-agreement-2.jpg',
        '/images/subcategories/finance-insurance/stamp-paper-agreement-3.jpg',
        '/images/subcategories/finance-insurance/stamp-paper-agreement-4.jpg'
      ],
      
      // Personal Care Subcategories (fallback)
      'Medicine Delivery': ['/images/categories/personal-care-hero.jpg'],
      'Salon at Door': ['/images/categories/personal-care-hero.jpg'],
      
      // Civil Work Subcategories
      'House Painting': [
        '/images/subcategories/civil-work/house-painting-1.jpg',
        '/images/subcategories/civil-work/house-painting-2.jpg',
        '/images/subcategories/civil-work/house-painting-3.jpg',
        '/images/subcategories/civil-work/house-painting-4.jpg'
      ],
      'Tile/Granite/Marble Works': ['/images/subcategories/civil-work/house-painting-1.jpg'],
      'House Repair': ['/images/subcategories/civil-work/house-painting-1.jpg'],
    };
    
    return imageArrayMap[subcategoryName] || ['/images/subcategories/plumbing/bath-fittings/bath-fittings-1.jpg'];
  };

  const serviceKey = `${categoryName.toLowerCase().replace(/\s+/g, '-')}-${serviceName.toLowerCase().replace(/\s+/g, '-')}`;
  const availableImages = getSubcategoryImages(serviceName);
  const selectedImageSrc = availableImages[imageIndex] || availableImages[0] || '/images/subcategories/plumbing/pipes.jpg';
  
  const imageConfig = {
    id: `service-${serviceKey}-${imageIndex}`,
    src: selectedImageSrc,
    alt: `${serviceName} - ${categoryName} Service`,
    type: 'stock-photo' as const,
    fallbackEmoji: getServiceEmoji(serviceName)
  };

  return (
    <SmartImage
      imageConfig={imageConfig}
      className={className}
      fallbackClassName="bg-gradient-to-br from-gray-100 to-blue-100"
      onClick={onClick}
    />
  );
};

// Utility functions for emoji fallbacks
function getCategoryEmoji(categoryName: string): string {
  const emojiMap: Record<string, string> = {
    'plumbing': '🔧',
    'electrical': '⚡',
    'cleaning': '🧽',
    'call a service': '📞',
    'finance & insurance': '💼',
    'personal care': '💄',
    'civil work': '🏗️'
  };
  return emojiMap[categoryName.toLowerCase()] || '🏠';
}

function getServiceEmoji(serviceName: string): string {
  const emojiMap: Record<string, string> = {
    'bath fittings': '🚿',
    'basin, sink & drainage': '🚰',
    'grouting': '🔧',
    'toilets': '🚽',
    'toilet services (classic)': '🚽',
    'toilet services (premium)': '🚽',
    'pipe & connector': '🔗',
    'water tank': '🪣',
    'wiring & installation': '⚡',
    'appliance repair': '🔌',
    'switch & socket': '💡',
    'fan installation': '🌀',
    'lighting solutions': '💡',
    'electrical safety check': '⚠️',
    'bathroom cleaning': '🛁',
    'ac cleaning': '❄️',
    'water tank cleaning': '🪣',
    'septic tank cleaning': '🏠',
    'water purifier cleaning': '💧',
    'car wash': '🚗'
  };
  return emojiMap[serviceName.toLowerCase()] || '🔧';
}

export default SmartImage;