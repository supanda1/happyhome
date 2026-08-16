// Image Configuration for Happy Homes
// This file manages all image mappings for the application  
// Following hybrid approach: Pexels stock photos for categories, Pexels/stock photos for services

export interface ImageConfig {
  id: string;
  src: string;
  alt: string;
  type: 'pexels-stock' | 'stock-photo' | 'placeholder';
  fallbackEmoji: string;
  pexelsId?: string; // Optional Pexels photo ID for reference
}

// Category Images (Pexels Stock Photos - for professional appearance)
export const categoryImages: Record<string, ImageConfig> = {
  'plumbing': {
    id: 'category-plumbing',
    src: '/src/assets/images/categories/plumbing-hero.jpg', // Pexels: Professional plumber working on pipes/fixtures
    alt: 'Professional Plumbing Services - Bath fittings, repairs, and installations',
    type: 'pexels-stock',
    fallbackEmoji: '🔧',
    pexelsId: '2108845' // Example: Pexels plumbing photo ID
  },
  'electrical': {
    id: 'category-electrical',
    src: '/src/assets/images/categories/electrical-hero.jpg', // Pexels: Professional electrician working with wires
    alt: 'Professional Electrical Services - Wiring, repairs, and smart home installations',
    type: 'pexels-stock',
    fallbackEmoji: '⚡',
    pexelsId: '834892' // Example: Pexels electrical work photo
  },
  'cleaning': {
    id: 'category-cleaning',
    src: '/src/assets/images/categories/cleaning-hero.jpg', // Pexels: Professional cleaning supplies and equipment
    alt: 'Professional Cleaning Services - Deep cleaning, sanitization, and maintenance',
    type: 'pexels-stock',
    fallbackEmoji: '🧽',
    pexelsId: '4099290' // Example: Pexels cleaning supplies photo
  },
  'call-a-service': {
    id: 'category-call-a-service',
    src: '/src/assets/images/categories/call-service-hero.jpg', // Pexels: Professional service delivery and logistics
    alt: 'Call A Service - Courier, cab booking, breakdown assistance, and more',
    type: 'pexels-stock',
    fallbackEmoji: '📞',
    pexelsId: '6169668' // Example: Pexels delivery service photo
  },
  'finance-insurance': {
    id: 'category-finance',
    src: '/src/assets/images/categories/finance-hero.jpg', // Pexels: Professional financial documents and calculator
    alt: 'Finance & Insurance Services - GST, PAN, ITR filing, and documentation',
    type: 'pexels-stock',
    fallbackEmoji: '💼',
    pexelsId: '164527' // Example: Pexels finance/accounting photo
  },
  'personal-care': {
    id: 'category-personal-care',
    src: '/src/assets/images/categories/personal-care-hero.jpg', // Pexels: Beauty and wellness products
    alt: 'Personal Care Services - Medicine delivery, salon services, and wellness',
    type: 'pexels-stock',
    fallbackEmoji: '💄',
    pexelsId: '3992204' // Example: Pexels beauty/wellness photo
  },
  'civil-work': {
    id: 'category-civil-work',
    src: '/src/assets/images/categories/civil-work-hero.jpg', // Pexels: Construction tools and home renovation
    alt: 'Civil Work Services - House painting, tile work, and home repairs',
    type: 'pexels-stock',
    fallbackEmoji: '🏗️',
    pexelsId: '1216589' // Example: Pexels construction/renovation photo
  }
};

// Service Images (Stock Photos - for realistic service representation)
export const serviceImages: Record<string, ImageConfig[]> = {
  // Plumbing Services
  'plumbing-bath-fittings': [
    {
      id: 'bath-fittings-1',
      src: '/images/subcategories/plumbing/bath-fittings/bath-fittings-1.jpg',
      alt: 'Professional bath fittings installation - taps, shower heads, and accessories',
      type: 'pexels-stock',
      fallbackEmoji: '🚿'
    },
    {
      id: 'bath-fittings-2',
      src: '/images/subcategories/plumbing/bath-fittings/bath-fittings-2.jpg',
      alt: 'Modern bathroom fixtures and hardware installation',
      type: 'pexels-stock',
      fallbackEmoji: '🔧'
    },
    {
      id: 'bath-fittings-3',
      src: '/images/subcategories/plumbing/bath-fittings/bath-fittings-3.jpg',
      alt: 'Beautiful modern bathroom with professionally installed fittings',
      type: 'pexels-stock',
      fallbackEmoji: '🛁'
    },
    {
      id: 'bath-fittings-4',
      src: '/images/subcategories/plumbing/bath-fittings/bath-fittings-4.jpg',
      alt: 'Quality bathroom fittings and accessories installation',
      type: 'pexels-stock',
      fallbackEmoji: '✅'
    },
    {
      id: 'bath-fittings-5',
      src: '/images/subcategories/plumbing/bath-fittings/bath-fittings-5.jpg',
      alt: 'Professional bathroom renovation and fittings service',
      type: 'pexels-stock',
      fallbackEmoji: '🛡️'
    }
  ],
  
  'plumbing-basin-sink-drainage': [
    {
      id: 'basin-sink-1',
      src: '/images/subcategories/plumbing/basin-sink/pexels-aj-ahamad-767001191-32168954.jpg',
      alt: 'Professional basin and sink installation services',
      type: 'pexels-stock',
      fallbackEmoji: '🚰'
    },
    {
      id: 'basin-sink-2',
      src: '/images/subcategories/plumbing/basin-sink/pexels-pu-ca-adryan-163345030-29399427.jpg',
      alt: 'Kitchen sink installation and repair services',
      type: 'pexels-stock',
      fallbackEmoji: '🪠'
    },
    {
      id: 'basin-sink-3',
      src: '/images/subcategories/plumbing/basin-sink/pexels-artbovich-6782575.jpg',
      alt: 'Bathroom basin and drainage solutions',
      type: 'pexels-stock',
      fallbackEmoji: '🚿'
    },
    {
      id: 'basin-sink-4',
      src: '/images/subcategories/plumbing/basin-sink/pexels-artbovich-7031908.jpg',
      alt: 'Professional drainage cleaning and maintenance',
      type: 'pexels-stock',
      fallbackEmoji: '🔧'
    },
    {
      id: 'basin-sink-5',
      src: '/images/subcategories/plumbing/basin-sink/pexels-artbovich-6899441.jpg',
      alt: 'Complete plumbing solutions for sinks and basins',
      type: 'pexels-stock',
      fallbackEmoji: '✅'
    }
  ],

  'plumbing-grouting': [
    {
      id: 'grouting-1',
      src: '/images/subcategories/plumbing/grouting/grouting-1.jpg',
      alt: 'Professional tile grouting and sealing services',
      type: 'pexels-stock',
      fallbackEmoji: '🧱'
    },
    {
      id: 'grouting-2',
      src: '/images/subcategories/plumbing/grouting/grouting-2.jpg',
      alt: 'Bathroom tile grouting and waterproofing',
      type: 'pexels-stock',
      fallbackEmoji: '🚿'
    },
    {
      id: 'grouting-3',
      src: '/images/subcategories/plumbing/grouting/grouting-3.jpg',
      alt: 'Kitchen tile grouting and maintenance',
      type: 'pexels-stock',
      fallbackEmoji: '🏠'
    },
    {
      id: 'grouting-4',
      src: '/images/subcategories/plumbing/grouting/grouting-4.jpg',
      alt: 'Professional grout repair and restoration',
      type: 'pexels-stock',
      fallbackEmoji: '🔧'
    },
    {
      id: 'grouting-5',
      src: '/images/subcategories/plumbing/grouting/grouting-5.jpg',
      alt: 'Quality tile work and sealing services',
      type: 'pexels-stock',
      fallbackEmoji: '✅'
    }
  ],

  'plumbing-toilets': [
    {
      id: 'toilet-1',
      src: '/images/subcategories/plumbing/toilet-services/toilet-service-1.jpg',
      alt: 'Professional toilet installation services',
      type: 'pexels-stock',
      fallbackEmoji: '🚽'
    },
    {
      id: 'toilet-2',
      src: '/images/subcategories/plumbing/toilet-services/toilet-service-2.jpg',
      alt: 'Toilet repair and maintenance services',
      type: 'pexels-stock',
      fallbackEmoji: '🔧'
    },
    {
      id: 'toilet-3',
      src: '/images/subcategories/plumbing/toilet-services/toilet-service-3.jpg',
      alt: 'Modern toilet installation and upgrade',
      type: 'pexels-stock',
      fallbackEmoji: '🚿'
    },
    {
      id: 'toilet-4',
      src: '/images/subcategories/plumbing/toilet-services/toilet-service-4.jpg',
      alt: 'Flush mechanism repair and installation',
      type: 'pexels-stock',
      fallbackEmoji: '⚙️'
    },
    {
      id: 'toilet-5',
      src: '/images/subcategories/plumbing/toilet-services/toilet-service-5.jpg',
      alt: 'Complete toilet services and solutions',
      type: 'pexels-stock',
      fallbackEmoji: '✅'
    }
  ],

  'plumbing-pipe-connector': [
    {
      id: 'pipe-connector-1',
      src: '/images/subcategories/plumbing/pipe-connector/pipe-connector-1.jpg',
      alt: 'Professional pipe installation services',
      type: 'pexels-stock',
      fallbackEmoji: '🔗'
    },
    {
      id: 'pipe-connector-2',
      src: '/images/subcategories/plumbing/pipe-connector/pipe-connector-2.jpg',
      alt: 'Pipe connector and fitting installation',
      type: 'pexels-stock',
      fallbackEmoji: '🔧'
    },
    {
      id: 'pipe-connector-3',
      src: '/images/subcategories/plumbing/pipe-connector/pipe-connector-3.jpg',
      alt: 'Water pipe system installation and repair',
      type: 'pexels-stock',
      fallbackEmoji: '💧'
    },
    {
      id: 'pipe-connector-4',
      src: '/images/subcategories/plumbing/pipe-connector/pipe-connector-4.jpg',
      alt: 'Professional plumbing pipe work',
      type: 'pexels-stock',
      fallbackEmoji: '⚙️'
    },
    {
      id: 'pipe-connector-5',
      src: '/images/subcategories/plumbing/pipe-connector/pipe-connector-5.jpg',
      alt: 'Complete pipe and connector solutions',
      type: 'pexels-stock',
      fallbackEmoji: '✅'
    }
  ],

  'plumbing-water-tank': [
    {
      id: 'water-tank-1',
      src: '/images/subcategories/plumbing/water-tank/water-tank-1.jpg',
      alt: 'Professional water tank installation',
      type: 'pexels-stock',
      fallbackEmoji: '💧'
    },
    {
      id: 'water-tank-2',
      src: '/images/subcategories/plumbing/water-tank/water-tank-2.jpg',
      alt: 'Water tank repair and maintenance',
      type: 'pexels-stock',
      fallbackEmoji: '🔧'
    },
    {
      id: 'water-tank-3',
      src: '/images/subcategories/plumbing/water-tank/water-tank-3.jpg',
      alt: 'Overhead water tank installation',
      type: 'pexels-stock',
      fallbackEmoji: '🏠'
    },
    {
      id: 'water-tank-4',
      src: '/images/subcategories/plumbing/water-tank/water-tank-4.jpg',
      alt: 'Water storage system solutions',
      type: 'pexels-stock',
      fallbackEmoji: '⚙️'
    },
    {
      id: 'water-tank-5',
      src: '/images/subcategories/plumbing/water-tank/water-tank-5.jpg',
      alt: 'Complete water tank services',
      type: 'pexels-stock',
      fallbackEmoji: '✅'
    }
  ],

  'plumbing-others': [
    {
      id: 'plumbing-others-1',
      src: '/images/subcategories/plumbing/bath-fittings/pexels-artbovich-6934233.jpg',
      alt: 'General plumbing services and repairs',
      type: 'pexels-stock',
      fallbackEmoji: '🔧'
    },
    {
      id: 'plumbing-others-2',
      src: '/images/subcategories/plumbing/pipes/pexels-maotuizhutuzi-4432160.jpg',
      alt: 'Professional plumbing maintenance',
      type: 'pexels-stock',
      fallbackEmoji: '⚙️'
    },
    {
      id: 'plumbing-others-3',
      src: '/images/subcategories/plumbing/basin-sink/pexels-artbovich-6782575.jpg',
      alt: 'Custom plumbing solutions',
      type: 'pexels-stock',
      fallbackEmoji: '🏠'
    }
  ],

  // Electrical Services
  'electrical-wiring-installation': [
    {
      id: 'electrical-wiring-main',
      src: '/src/assets/images/services/electrical/wiring-installation.jpg',
      alt: 'Professional electrical wiring and installation services',
      type: 'stock-photo',
      fallbackEmoji: '⚡'
    },
    {
      id: 'electrical-safety',
      src: '/src/assets/images/services/electrical/safety-check.jpg',
      alt: 'Electrical safety inspection and testing',
      type: 'stock-photo',
      fallbackEmoji: '🔍'
    }
  ],

  // Cleaning Services
  'cleaning-bathroom-cleaning': [
    {
      id: 'bathroom-cleaning-main',
      src: '/src/assets/images/services/cleaning/bathroom-deep-clean.jpg',
      alt: 'Professional bathroom deep cleaning services',
      type: 'stock-photo',
      fallbackEmoji: '🛁'
    },
    {
      id: 'cleaning-supplies',
      src: '/src/assets/images/services/cleaning/eco-supplies.jpg',
      alt: 'Eco-friendly cleaning supplies and equipment',
      type: 'stock-photo',
      fallbackEmoji: '🧴'
    }
  ]
};

// Utility function to get category image
export const getCategoryImage = (categoryName: string): ImageConfig => {
  const key = categoryName.toLowerCase().replace(/\s+/g, '-').replace('&', '');
  return categoryImages[key] || {
    id: 'category-default',
    src: '',
    alt: `${categoryName} Services`,
    type: 'placeholder',
    fallbackEmoji: '🏠'
  };
};

// Utility function to get service images
export const getServiceImages = (categoryName: string, serviceName: string): ImageConfig[] => {
  const key = `${categoryName.toLowerCase().replace(/\s+/g, '-').replace('&', '')}-${serviceName.toLowerCase().replace(/\s+/g, '-').replace('&', '')}`;
  return serviceImages[key] || [
    {
      id: 'service-default',
      src: '',
      alt: `${serviceName} Service`,
      type: 'placeholder',
      fallbackEmoji: '🔧'
    }
  ];
};

// Utility function to get image source with fallback
export const getImageSrc = (imageConfig: ImageConfig): string => {
  // For now, return empty string to use fallback emoji
  // In production, this would check if the image exists
  return imageConfig.src || '';
};

// Utility function to check if image exists (placeholder for actual implementation)
export function imageExists(src: string) {
  if (!src) return false;
  // For now, return false to always use fallback emoji
  // In production, implement actual image existence checking
  return false;
}

// Image loading configuration
export const imageLoadingConfig = {
  lazy: true,
  placeholder: true,
  fallbackToEmoji: true,
  quality: {
    category: 'high', // AI-generated images should be high quality
    service: 'medium', // Stock photos can be medium quality
    thumbnail: 'low'
  }
};

// Recommended image sources for future implementation
export const recommendedImageSources = {
  stockPhotos: [
    'Unsplash (unsplash.com) - High quality, free photos',
    'Pexels (pexels.com) - Excellent for service imagery',
    'Pixabay (pixabay.com) - Good selection, includes vectors',
    'StockVault (stockvault.net) - Technical/equipment photos'
  ],
  aiGenerated: [
    'Midjourney - Highest quality for brand consistency',
    'DALL-E 3 - Excellent for specific service scenarios',
    'Stable Diffusion - Free/open source option',
    'Leonardo.ai - Good free tier for business use'
  ],
  aiPromptExamples: {
    plumbing: 'Professional plumber working on modern bathroom fixtures, clean corporate style, bright professional lighting',
    electrical: 'Certified electrician installing smart home switches, modern home interior, professional equipment',
    cleaning: 'Professional cleaning team in modern home, bright and clean environment, eco-friendly products'
  }
};

export default {
  categoryImages,
  serviceImages,
  getCategoryImage,
  getServiceImages,
  getImageSrc,
  imageExists,
  imageLoadingConfig,
  recommendedImageSources
};