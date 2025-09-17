/**
 * Configuration API utilities for dynamic system settings
 * 
 * This module provides functions to fetch dynamic configuration data
 * from the backend instead of using hardcoded values.
 */

const CONFIG_API_BASE = `${import.meta.env.VITE_API_BASE_URL}/config`;

// API helper function with credentials
const configAPICall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${CONFIG_API_BASE}${endpoint}`;
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Configuration API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// ============================================================================
// TIME SLOTS API
// ============================================================================

export interface TimeSlot {
  start_time: string;
  end_time: string;
  display: string;
}

/**
 * Get available time slots for booking
 */
export const getTimeSlots = async (date?: string, serviceId?: string): Promise<TimeSlot[]> => {
  try {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (serviceId) params.append('service_id', serviceId);
    
    const endpoint = `/time-slots${params.toString() ? '?' + params.toString() : ''}`;
    const response = await configAPICall(endpoint);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch time slots:', error);
    return [];
  }
};

// ============================================================================
// IMAGE CONFIGURATION API
// ============================================================================

export interface ImageConfig {
  primary_image?: string;
  hero_image?: string;
  thumbnail: string;
  icon: string;
  gallery: string[];
}

/**
 * Get image configuration for a category
 */
export const getCategoryImages = async (categoryId: string): Promise<ImageConfig | null> => {
  try {
    const response = await configAPICall(`/images/categories/${categoryId}`);
    
    if (response.success && response.data && response.data.images) {
      return response.data.images;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch category images:', error);
    return null;
  }
};

/**
 * Get image configuration for a subcategory
 */
export const getSubcategoryImages = async (subcategoryId: string): Promise<ImageConfig | null> => {
  try {
    const response = await configAPICall(`/images/subcategories/${subcategoryId}`);
    
    if (response.success && response.data && response.data.images) {
      return response.data.images;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch subcategory images:', error);
    return null;
  }
};

/**
 * Get image configuration for a service
 */
export const getServiceImages = async (serviceId: string): Promise<{url: string, alt_text: string, is_primary: boolean}[]> => {
  try {
    const response = await configAPICall(`/images/services/${serviceId}`);
    
    if (response.success && response.data && response.data.images) {
      return response.data.images;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch service images:', error);
    return [];
  }
};

// ============================================================================
// SERVICE/CATEGORY RESOLUTION API
// ============================================================================

export interface ResolvedService {
  id: string;
  name: string;
  category?: {
    id: string;
    name: string;
  };
  subcategory?: {
    id: string;
    name: string;
  };
  base_price: number;
  discounted_price?: number;
  rating: number;
  is_active: boolean;
}

export interface ResolvedCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
}

/**
 * Resolve service identifier to service data
 */
export const resolveService = async (serviceIdentifier: string): Promise<ResolvedService | null> => {
  try {
    const response = await configAPICall(`/resolve/service/${encodeURIComponent(serviceIdentifier)}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to resolve service:', error);
    return null;
  }
};

/**
 * Resolve category identifier to category data
 */
export const resolveCategory = async (categoryIdentifier: string): Promise<ResolvedCategory | null> => {
  try {
    const response = await configAPICall(`/resolve/category/${encodeURIComponent(categoryIdentifier)}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to resolve category:', error);
    return null;
  }
};

// ============================================================================
// SYSTEM SETTINGS API
// ============================================================================

export interface SystemSettings {
  business_hours: {
    start: string;
    end: string;
    timezone: string;
  };
  booking_settings: {
    advance_booking_days: number;
    min_booking_hours: number;
    cancellation_hours: number;
  };
  service_settings: {
    default_service_duration: number;
    emergency_service_available: boolean;
    weekend_service_available: boolean;
  };
  pricing_settings: {
    currency: string;
    tax_rate: number;
    service_charge_rate: number;
  };
}

/**
 * Get system-wide configuration settings
 */
export const getSystemSettings = async (): Promise<SystemSettings | null> => {
  try {
    const response = await configAPICall('/system-settings');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch system settings:', error);
    return null;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate fallback image URL based on category and item name
 */
export const generateImageURL = (categoryName: string, itemName: string, type: 'category' | 'subcategory' | 'service' = 'subcategory'): string => {
  const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim();
  const itemSlug = itemName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim();
  
  switch (type) {
    case 'category':
      return `/images/categories/${categorySlug}-hero.jpg`;
    case 'service':
      return `/images/services/${categorySlug}/${itemSlug}-1.jpg`;
    case 'subcategory':
    default:
      return `/images/subcategories/${categorySlug}/${itemSlug}.jpg`;
  }
};

/**
 * Cache for image configurations to avoid repeated API calls
 */
const imageCache = new Map<string, ImageConfig>();

/**
 * Get cached image configuration or fetch from API
 */
export const getCachedImageConfig = async (type: 'category' | 'subcategory' | 'service', id: string): Promise<ImageConfig | null> => {
  const cacheKey = `${type}-${id}`;
  
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey) || null;
  }
  
  let imageConfig: ImageConfig | null = null;
  
  try {
    switch (type) {
      case 'category':
        imageConfig = await getCategoryImages(id);
        break;
      case 'subcategory':
        imageConfig = await getSubcategoryImages(id);
        break;
      case 'service':
        const serviceImages = await getServiceImages(id);
        if (serviceImages.length > 0) {
          imageConfig = {
            primary_image: serviceImages.find(img => img.is_primary)?.url || serviceImages[0]?.url,
            thumbnail: serviceImages[0]?.url,
            icon: serviceImages[0]?.url,
            gallery: serviceImages.map(img => img.url)
          };
        }
        break;
    }
    
    if (imageConfig) {
      imageCache.set(cacheKey, imageConfig);
    }
    
    return imageConfig;
  } catch (error) {
    console.error(`Failed to get cached image config for ${type} ${id}:`, error);
    return null;
  }
};