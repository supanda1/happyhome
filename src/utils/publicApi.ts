/**
 * Public API Functions - No Authentication Required
 * 
 * These functions fetch public data that should be accessible to all users
 * without requiring authentication (services, categories, etc.)
 */

// API Configuration  
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Public API Helper Function - No authentication required
const publicApiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions: RequestInit = {
    // Note: No credentials: 'include' - this is for public access
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    if (!response.ok) {
      // Try to get the error message from the response body
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        console.error(`🚨 Public API error:`, errorData);
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    
    // Handle both formats: { success: true, data: {...} } and direct data
    if (data.success !== undefined) {
      if (!data.success) {
        throw new Error(data.error || 'API call failed');
      }
      return data.data;
    }
    
    return data;
  } catch (error) {
    console.error(`Public API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// Type Definitions - Match backend database schema
interface PublicService {
  id: string;
  name: string;
  category_id: string;
  subcategory_id: string;
  description: string;
  short_description: string;
  base_price: number;
  discounted_price?: number;
  duration: number;
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  rating: number;
  review_count: number;
  booking_count: number;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  notes: string;
  image_paths?: string[];
  created_at: string;
  updated_at: string;
}

interface PublicCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  image_path?: string;
  image_paths?: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface PublicSubcategory {
  id: string;
  category_id: string;
  name: string;
  icon: string;
  description: string;
  image_paths?: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all active services from PostgreSQL database - Public access
 */
export const getPublicServices = async (): Promise<PublicService[]> => {
  try {
    // Use existing working endpoint directly
    const response = await publicApiCall('/services');
    const services = Array.isArray(response) ? response : (response?.data || []);
    console.log(`✅ Services loaded:`, services.length);
    return services;
  } catch (error) {
    console.error('❌ Failed to load services:', error);
    return [];
  }
};

/**
 * Get single service by ID from PostgreSQL database - Public access
 */
export const getPublicServiceById = async (serviceId: string): Promise<PublicService | null> => {
  try {
    // Use existing working endpoint directly
    const response = await publicApiCall(`/services/${serviceId}`);
    const service = response?.data || response;
    console.log(`✅ Service ${serviceId} loaded:`, service);
    return service;
  } catch (error) {
    console.error(`❌ Failed to load service ${serviceId}:`, error);
    return null;
  }
};

/**
 * Get all active categories from PostgreSQL database - Public access
 */
export const getPublicCategories = async (): Promise<PublicCategory[]> => {
  try {
    // Use existing working endpoint directly
    const response = await publicApiCall('/categories');
    const categories = Array.isArray(response) ? response : (response?.data || []);
    console.log(`✅ Categories loaded:`, categories.length);
    return categories;
  } catch (error) {
    console.error('❌ Failed to load categories:', error);
    return [];
  }
};

/**
 * Get all active subcategories from PostgreSQL database - Public access
 */
export const getPublicSubcategories = async (): Promise<PublicSubcategory[]> => {
  try {
    // Use existing working endpoint directly
    const response = await publicApiCall('/subcategories');
    const subcategories = Array.isArray(response) ? response : (response?.data || []);
    console.log(`✅ Subcategories loaded:`, subcategories.length);
    return subcategories;
  } catch (error) {
    console.error('❌ Failed to load subcategories:', error);
    return [];
  }
};

export type { PublicService, PublicCategory, PublicSubcategory };