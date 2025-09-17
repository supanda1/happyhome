/**
 * Services and Categories API service
 */

import { apiClient } from '../api-client';
import type { 
  Service, 
  ServiceCategory, 
  ServiceFilters, 
  ServiceFormData,
  ApiResponse, 
  PaginatedResponse 
} from '../../types/index.ts';

interface GetServicesParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'name' | 'price' | 'rating' | 'newest';
  sortOrder?: 'asc' | 'desc';
  featured?: boolean;
}

interface CreateServiceRequest extends ServiceFormData {
  photos?: File[];
}

interface UpdateServiceRequest extends Partial<ServiceFormData> {
  photos?: File[];
}

export const servicesService = {
  // ============= Service Categories =============
  
  /**
   * Get all service categories
   */
  async getCategories(): Promise<ServiceCategory[]> {
    const response = await apiClient.get<ApiResponse<ServiceCategory[]>>('/services/categories');
    return response.data;
  },

  /**
   * Get subcategories by category
   */
  async getSubcategories(categoryId?: string): Promise<any[]> {
    const params = categoryId ? `?category_id=${categoryId}` : '';
    const response = await apiClient.get<ApiResponse<any[]>>(`/services/subcategories${params}`);
    return response.data;
  },

  /**
   * Get category by ID
   */
  async getCategory(id: string): Promise<ServiceCategory> {
    const response = await apiClient.get<ApiResponse<ServiceCategory>>(`/services/categories/${id}`);
    return response.data;
  },

  /**
   * Create new category (Admin only)
   */
  async createCategory(category: Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceCategory> {
    const response = await apiClient.post<ApiResponse<ServiceCategory>>('/services/categories', category);
    return response.data;
  },

  /**
   * Update category (Admin only)
   */
  async updateCategory(id: string, updates: Partial<ServiceCategory>): Promise<ServiceCategory> {
    const response = await apiClient.put<ApiResponse<ServiceCategory>>(`/services/categories/${id}`, updates);
    return response.data;
  },

  /**
   * Delete category (Admin only)
   */
  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/services/categories/${id}`);
  },

  // ============= Services =============
  
  /**
   * Get all services with filtering and pagination
   */
  async getServices(params: GetServicesParams = {}): Promise<PaginatedResponse<Service>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<PaginatedResponse<Service>>(
      `/services?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Get service by ID
   */
  async getService(id: string): Promise<Service> {
    const response = await apiClient.get<ApiResponse<Service>>(`/services/${id}`);
    return response.data;
  },

  /**
   * Search services
   */
  async searchServices(query: string, filters?: ServiceFilters): Promise<Service[]> {
    const params = new URLSearchParams({ q: query });
    
    if (filters) {
      if (filters.categoryIds.length > 0) {
        params.append('categoryIds', filters.categoryIds.join(','));
      }
      if (filters.priceRange) {
        params.append('minPrice', filters.priceRange.min.toString());
        params.append('maxPrice', filters.priceRange.max.toString());
      }
      if (filters.rating) {
        params.append('rating', filters.rating.toString());
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy);
        params.append('sortOrder', filters.sortOrder);
      }
    }

    const response = await apiClient.get<ApiResponse<Service[]>>(
      `/services/search?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get featured services
   */
  async getFeaturedServices(limit: number = 6): Promise<Service[]> {
    const response = await apiClient.get<ApiResponse<Service[]>>(
      `/services/featured?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Get service variants
   */
  async getServiceVariants(serviceId: string): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(`/services/${serviceId}/variants`);
    return response.data;
  },

  /**
   * Get services by category
   */
  async getServicesByCategory(categoryId: string, params: GetServicesParams = {}): Promise<PaginatedResponse<Service>> {
    const queryParams = new URLSearchParams({ category_id: categoryId });
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<PaginatedResponse<Service>>(
      `/services?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Create new service (Admin only)
   */
  async createService(serviceData: CreateServiceRequest): Promise<Service> {
    // If photos are included, upload them first
    if (serviceData.photos && serviceData.photos.length > 0) {
      const photoUrls = await this.uploadServicePhotos(serviceData.photos);
      const { photos, ...serviceWithoutPhotos } = serviceData;
      
      const response = await apiClient.post<ApiResponse<Service>>('/services', {
        ...serviceWithoutPhotos,
        photoUrls,
      });
      return response.data;
    }

    const { photos, ...serviceWithoutPhotos } = serviceData;
    const response = await apiClient.post<ApiResponse<Service>>('/services', serviceWithoutPhotos);
    return response.data;
  },

  /**
   * Update service (Admin only)
   */
  async updateService(id: string, updates: UpdateServiceRequest): Promise<Service> {
    // If photos are included, upload them first
    if (updates.photos && updates.photos.length > 0) {
      const photoUrls = await this.uploadServicePhotos(updates.photos);
      const { photos, ...updatesWithoutPhotos } = updates;
      
      const response = await apiClient.patch<ApiResponse<Service>>(`/services/${id}`, {
        ...updatesWithoutPhotos,
        photoUrls,
      });
      return response.data;
    }

    const { photos, ...updatesWithoutPhotos } = updates;
    const response = await apiClient.patch<ApiResponse<Service>>(`/services/${id}`, updatesWithoutPhotos);
    return response.data;
  },

  /**
   * Delete service (Admin only)
   */
  async deleteService(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/services/${id}`);
  },

  /**
   * Toggle service active status (Admin only)
   */
  async toggleServiceStatus(id: string): Promise<Service> {
    const response = await apiClient.patch<ApiResponse<Service>>(`/services/${id}/toggle-status`);
    return response.data;
  },

  /**
   * Upload service photos
   */
  async uploadServicePhotos(photos: File[]): Promise<string[]> {
    const uploadPromises = photos.map(photo => 
      apiClient.uploadFile<ApiResponse<{ url: string }>>('/upload/service-photo', photo)
    );
    
    const responses = await Promise.all(uploadPromises);
    return responses.map(response => response.data.url);
  },

  /**
   * Get service availability
   */
  async getServiceAvailability(serviceId: string, date?: string): Promise<any> {
    const params = date ? `?date=${date}` : '';
    const response = await apiClient.get<ApiResponse<any>>(`/services/${serviceId}/availability${params}`);
    return response.data;
  },

  /**
   * Update service availability (Admin only)
   */
  async updateServiceAvailability(serviceId: string, availability: any): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(
      `/services/${serviceId}/availability`, 
      availability
    );
    return response.data;
  },
};

export default servicesService;