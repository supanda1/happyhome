/**
 * Pexels Image Service - Download License-Free Images Locally
 * 
 * Downloads high-quality, license-free images from Pexels API and stores them locally
 * for service categories and individual services. All images are saved to local folders
 * and served from the backend.
 */


// Configuration - TODO: Implement when Pexels integration is needed
// const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
// const PEXELS_API_URL = 'https://api.pexels.com/v1';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Image storage configuration - TODO: Implement when needed
// const IMAGES_BASE_PATH = '/public/images/services';
// const IMAGE_QUALITIES = {
//   thumbnail: 'small',    // 280x200
//   medium: 'medium',      // 350x230  
//   large: 'large',        // 940x650
//   original: 'original'   // Full size
// } as const;

// Pexels API Types
interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

// Service-specific search queries for better image matching
const SERVICE_SEARCH_QUERIES: Record<string, string[]> = {
  // Plumbing services
  'plumbing-bath-fittings': ['bathroom fixtures', 'bath fittings', 'bathroom taps', 'shower fixtures', 'bathroom hardware'],
  'plumbing-basin-sink-and-drainage': ['kitchen sink', 'bathroom basin', 'drain cleaning', 'sink installation', 'plumbing repair'],
  'plumbing-grouting': ['tile grouting', 'bathroom tiles', 'grout repair', 'tile installation', 'bathroom renovation'],
  'plumbing-toilets': ['toilet installation', 'bathroom toilet', 'toilet repair', 'bathroom fixtures', 'plumbing work'],
  'plumbing-pipe-connector': ['plumbing pipes', 'pipe installation', 'water pipes', 'plumbing repair', 'pipe fitting'],
  'plumbing-water-tank': ['water tank', 'water storage', 'tank installation', 'water system', 'plumbing tank'],
  'plumbing-others': ['plumber working', 'plumbing tools', 'pipe repair', 'bathroom plumbing', 'water leak repair'],

  // Electrical services
  'electrical-wiring-installation': ['electrical wiring', 'electrician work', 'house wiring', 'electrical installation', 'wire installation'],
  'electrical-appliance-repair': ['appliance repair', 'electrical appliances', 'home appliances', 'repair service', 'electrical maintenance'],
  'electrical-switch-socket': ['light switch', 'electrical socket', 'wall switch', 'electrical outlet', 'switch installation'],
  'electrical-fan-installation': ['ceiling fan', 'fan installation', 'electrical fan', 'home ventilation', 'fan repair'],
  'electrical-lighting-solutions': ['home lighting', 'LED lights', 'light installation', 'interior lighting', 'electrical lighting'],
  'electrical-safety-check': ['electrical safety', 'electrical inspection', 'safety check', 'electrical testing', 'electrical maintenance'],
  'electrical-others': ['electrician', 'electrical work', 'electrical tools', 'electrical repair', 'electrical service'],

  // Cleaning services
  'cleaning-bathroom-cleaning': ['bathroom cleaning', 'clean bathroom', 'bathroom maintenance', 'deep cleaning', 'bathroom hygiene'],
  'cleaning-ac-cleaning': ['air conditioner cleaning', 'AC maintenance', 'HVAC cleaning', 'air conditioning service', 'AC repair'],
  'cleaning-water-tank-cleaning': ['water tank cleaning', 'tank maintenance', 'water storage cleaning', 'tank disinfection', 'water hygiene'],
  'cleaning-septic-tank-cleaning': ['septic tank', 'sewage cleaning', 'waste management', 'sanitation service', 'septic maintenance'],
  'cleaning-water-purifier-cleaning': ['water purifier', 'water filter', 'RO service', 'water treatment', 'filter cleaning'],
  'cleaning-car-wash': ['car wash', 'vehicle cleaning', 'car detailing', 'auto cleaning', 'car maintenance'],
  'cleaning-others': ['house cleaning', 'deep cleaning', 'professional cleaning', 'home maintenance', 'cleaning service'],

  // Call A Service
  'call-a-service-cab-booking': ['taxi service', 'cab booking', 'transportation', 'ride service', 'vehicle hire'],
  'call-a-service-courier': ['courier service', 'package delivery', 'logistics', 'shipping service', 'delivery'],
  'call-a-service-vehicle-breakdown': ['roadside assistance', 'vehicle repair', 'car breakdown', 'auto service', 'emergency repair'],
  'call-a-service-photographer': ['photographer', 'photography service', 'professional photography', 'event photography', 'portrait photography'],
  'call-a-service-others': ['service provider', 'professional service', 'home service', 'maintenance service', 'repair service'],

  // Finance & Insurance
  'finance-insurance-gst': ['GST filing', 'tax preparation', 'financial documents', 'accounting service', 'tax consultant'],
  'finance-insurance-pan': ['PAN card', 'identity documents', 'financial paperwork', 'document service', 'government forms'],
  'finance-insurance-itr': ['income tax', 'tax filing', 'financial planning', 'tax consultant', 'accounting'],
  'finance-insurance-stamp-paper': ['legal documents', 'stamp paper', 'official documents', 'legal service', 'documentation'],
  'finance-insurance-others': ['financial planning', 'insurance service', 'financial consultant', 'money management', 'financial advice'],

  // Personal Care
  'personal-care-medicine-delivery': ['medicine delivery', 'pharmacy service', 'medical supplies', 'healthcare', 'prescription delivery'],
  'personal-care-salon-at-door': ['home salon', 'beauty service', 'personal grooming', 'beauty treatment', 'salon service'],
  'personal-care-others': ['personal care', 'wellness service', 'health service', 'beauty care', 'self care'],

  // Civil Work
  'civil-work-house-painting': ['house painting', 'interior painting', 'wall painting', 'home renovation', 'paint service'],
  'civil-work-tile-granite-marble': ['tile installation', 'marble flooring', 'granite work', 'flooring service', 'stone work'],
  'civil-work-house-repair': ['home repair', 'house maintenance', 'building repair', 'construction work', 'renovation'],
  'civil-work-others': ['construction work', 'building maintenance', 'civil engineering', 'structural repair', 'home improvement']
};

// Category-level search queries
const CATEGORY_SEARCH_QUERIES: Record<string, string[]> = {
  'plumbing': ['plumbing', 'plumber', 'water pipes', 'bathroom repair', 'plumbing tools'],
  'electrical': ['electrician', 'electrical work', 'wiring', 'electrical repair', 'electrical tools'],
  'cleaning': ['cleaning service', 'house cleaning', 'professional cleaning', 'deep cleaning', 'maintenance'],
  'call-a-service': ['service provider', 'professional service', 'customer service', 'home service', 'maintenance'],
  'finance-insurance': ['financial service', 'accounting', 'tax preparation', 'financial planning', 'documents'],
  'personal-care': ['personal care', 'wellness', 'beauty service', 'health care', 'self care'],
  'civil-work': ['construction', 'home improvement', 'renovation', 'building work', 'house repair']
};

/**
 * Download image from URL and save locally
 */
const downloadImageLocally = async (imageUrl: string, filename: string, folder: string): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/images/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        imageUrl,
        filename,
        folder
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.success) {
      return result.data.localPath;
    } else {
      throw new Error(result.error || 'Failed to download image');
    }
  } catch (error) {
    console.error('❌ Failed to download image locally:', error);
    return null;
  }
};

/**
 * Search Pexels for images based on query
 */
const searchPexelsImages = async (
  query: string, 
  count: number = 5, 
  page: number = 1
): Promise<PexelsPhoto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/images/search-pexels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        query,
        per_page: count,
        page
      })
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.success) {
      return result.data.photos || [];
    } else {
      throw new Error(result.error || 'Failed to search Pexels');
    }
  } catch (error) {
    console.error('❌ Failed to search Pexels:', error);
    return [];
  }
};

/**
 * Generate local filename for image
 */
const generateImageFilename = (serviceId: string, imageIndex: number, photographer: string): string => {
  const cleanPhotographer = photographer.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  return `${serviceId}-${imageIndex + 1}-${cleanPhotographer}-${timestamp}.jpg`;
};

/**
 * Download images for a specific service
 */
export const downloadServiceImages = async (
  serviceId: string,
  serviceName: string,
  categoryId: string,
  imageCount: number = 5
): Promise<string[]> => {
  try {
    console.log(`🖼️ Downloading ${imageCount} images for service: ${serviceName}`);

    // Get search queries for this service
    const searchQueries = SERVICE_SEARCH_QUERIES[serviceId] || [serviceName];
    const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];

    // Search for images on Pexels
    const photos = await searchPexelsImages(randomQuery, imageCount);
    
    if (photos.length === 0) {
      console.warn(`⚠️ No images found for service: ${serviceName}`);
      return [];
    }

    // Download each image locally
    const downloadPromises = photos.slice(0, imageCount).map(async (photo, index) => {
      const filename = generateImageFilename(serviceId, index, photo.photographer);
      const folder = `services/${categoryId}/${serviceId}`;
      
      // Use medium quality for better balance of size and quality
      const imageUrl = photo.src.medium;
      
      const localPath = await downloadImageLocally(imageUrl, filename, folder);
      
      if (localPath) {
        console.log(`✅ Downloaded image ${index + 1}/${imageCount} for ${serviceName}: ${filename}`);
        return localPath;
      } else {
        console.error(`❌ Failed to download image ${index + 1} for ${serviceName}`);
        return null;
      }
    });

    const downloadedPaths = await Promise.all(downloadPromises);
    const successfulDownloads = downloadedPaths.filter(path => path !== null) as string[];

    console.log(`✅ Successfully downloaded ${successfulDownloads.length}/${imageCount} images for ${serviceName}`);
    return successfulDownloads;

  } catch (error) {
    console.error(`❌ Failed to download images for service ${serviceName}:`, error);
    return [];
  }
};

/**
 * Download images for a category
 */
export const downloadCategoryImages = async (
  categoryId: string,
  categoryName: string,
  imageCount: number = 3
): Promise<string[]> => {
  try {
    console.log(`🖼️ Downloading ${imageCount} images for category: ${categoryName}`);

    // Get search queries for this category
    const searchQueries = CATEGORY_SEARCH_QUERIES[categoryId] || [categoryName];
    const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];

    // Search for images on Pexels
    const photos = await searchPexelsImages(randomQuery, imageCount);
    
    if (photos.length === 0) {
      console.warn(`⚠️ No images found for category: ${categoryName}`);
      return [];
    }

    // Download each image locally
    const downloadPromises = photos.slice(0, imageCount).map(async (photo, index) => {
      const filename = generateImageFilename(categoryId, index, photo.photographer);
      const folder = `categories/${categoryId}`;
      
      // Use large quality for category images
      const imageUrl = photo.src.large;
      
      const localPath = await downloadImageLocally(imageUrl, filename, folder);
      
      if (localPath) {
        console.log(`✅ Downloaded category image ${index + 1}/${imageCount} for ${categoryName}: ${filename}`);
        return localPath;
      } else {
        console.error(`❌ Failed to download category image ${index + 1} for ${categoryName}`);
        return null;
      }
    });

    const downloadedPaths = await Promise.all(downloadPromises);
    const successfulDownloads = downloadedPaths.filter(path => path !== null) as string[];

    console.log(`✅ Successfully downloaded ${successfulDownloads.length}/${imageCount} images for category ${categoryName}`);
    return successfulDownloads;

  } catch (error) {
    console.error(`❌ Failed to download images for category ${categoryName}:`, error);
    return [];
  }
};

/**
 * Bulk download images for all services
 */
export const bulkDownloadAllServiceImages = async (): Promise<{
  success: number;
  failed: number;
  results: Array<{
    serviceId: string;
    serviceName: string;
    images: string[];
    success: boolean;
  }>;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/images/bulk-download-services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Bulk download failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || 'Bulk download failed');
    }
  } catch (error) {
    console.error('❌ Failed to bulk download service images:', error);
    return { success: 0, failed: 0, results: [] };
  }
};

/**
 * Get image URL for serving from backend
 */
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Convert local path to backend served URL
  const cleanPath = imagePath.replace(/^\/+/, '');
  return `${API_BASE_URL}/images/${cleanPath}`;
};

/**
 * Get thumbnail URL for image
 */
export const getThumbnailUrl = (imagePath: string): string => {
  const fullUrl = getImageUrl(imagePath);
  return fullUrl.replace(/\.(jpg|jpeg|png)$/i, '_thumb.$1');
};

/**
 * Validate image file exists locally
 */
export const validateImageExists = async (imagePath: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/images/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ imagePath })
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.success && result.data.exists;
  } catch (error) {
    console.error('❌ Failed to validate image:', error);
    return false;
  }
};

/**
 * Clean up unused images
 */
export const cleanupUnusedImages = async (): Promise<{
  deleted: number;
  freed_space: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/images/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Cleanup failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || 'Cleanup failed');
    }
  } catch (error) {
    console.error('❌ Failed to cleanup unused images:', error);
    return { deleted: 0, freed_space: '0 MB' };
  }
};

// Export types
export type { PexelsPhoto, PexelsSearchResponse };