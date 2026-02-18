/**
 * Services and Categories API service
 * Now using adminDataManager for all backend operations
 */

import {
  getCategories as getAdminCategories,
  getSubcategories as getAdminSubcategories,
  createCategory as createAdminCategory,
  updateCategory as updateAdminCategory,
  deleteCategory as deleteAdminCategory,
  getServicesFromAPI,
  getServiceById,
  createService as createAdminService,
  updateService as updateAdminService,
  deleteService as deleteAdminService,
  toggleServiceStatus as toggleAdminServiceStatus,
  type Category,
  type Service as AdminService,
  type Subcategory
} from '../adminDataManager';
import type { 
  Service, 
  ServiceCategory, 
  ServiceFilters, 
  ServiceFormData,
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
    const categories = await getAdminCategories();
    // Map from admin format to service format
    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      isActive: cat.is_active,
      sortOrder: cat.sort_order,
      createdAt: new Date(cat.created_at),
      updatedAt: new Date(cat.updated_at)
    }));
  },

  /**
   * Get subcategories by category
   */
  async getSubcategories(categoryId?: string): Promise<Subcategory[]> {
    // TODO: Filter subcategories by categoryId when backend supports it
    if (categoryId) {
      console.log(`Filtering subcategories for category: ${categoryId}`);
    }
    return await getAdminSubcategories();
  },

  /**
   * Get category by ID
   */
  async getCategory(id: string): Promise<ServiceCategory> {
    const categories = await getAdminCategories();
    const category = categories.find(cat => cat.id === id);
    if (!category) {
      throw new Error(`Category ${id} not found`);
    }
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      isActive: category.is_active,
      sortOrder: category.sort_order,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    };
  },

  /**
   * Create new category (Admin only)
   */
  async createCategory(category: Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceCategory> {
    const adminCategory = {
      name: category.name,
      description: category.description,
      icon: category.icon,
      is_active: category.isActive,
      sort_order: category.sortOrder,
      image_path: '',
      image_paths: []
    };
    const newCategory = await createAdminCategory(adminCategory);
    return {
      id: newCategory.id,
      name: newCategory.name,
      description: newCategory.description,
      icon: newCategory.icon,
      isActive: newCategory.is_active,
      sortOrder: newCategory.sort_order,
      createdAt: new Date(newCategory.created_at),
      updatedAt: new Date(newCategory.updated_at)
    };
  },

  /**
   * Update category (Admin only)
   */
  async updateCategory(id: string, updates: Partial<ServiceCategory>): Promise<ServiceCategory> {
    const adminUpdates: Partial<Category> = {};
    if (updates.name !== undefined) adminUpdates.name = updates.name;
    if (updates.description !== undefined) adminUpdates.description = updates.description;
    if (updates.icon !== undefined) adminUpdates.icon = updates.icon;
    if (updates.isActive !== undefined) adminUpdates.is_active = updates.isActive;
    if (updates.sortOrder !== undefined) adminUpdates.sort_order = updates.sortOrder;
    
    const updatedCategory = await updateAdminCategory(id, adminUpdates);
    return {
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description,
      icon: updatedCategory.icon,
      isActive: updatedCategory.is_active,
      sortOrder: updatedCategory.sort_order,
      createdAt: new Date(updatedCategory.created_at),
      updatedAt: new Date(updatedCategory.updated_at)
    };
  },

  /**
   * Delete category (Admin only)
   */
  async deleteCategory(id: string): Promise<void> {
    const success = await deleteAdminCategory(id);
    if (!success) {
      throw new Error(`Failed to delete category ${id}`);
    }
  },

  // ============= Services =============
  
  /**
   * Get all services with filtering and pagination
   */
  async getServices(params: GetServicesParams = {}): Promise<PaginatedResponse<Service>> {
    // Get all services from admin data manager
    let services = await getServicesFromAPI();
    
    // Apply filters
    if (params.categoryId) {
      services = services.filter(service => service.category_id === params.categoryId);
    }
    if (params.searchQuery) {
      const query = params.searchQuery.toLowerCase();
      services = services.filter(service => 
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query)
      );
    }
    if (params.minPrice !== undefined) {
      services = services.filter(service => service.base_price >= params.minPrice!);
    }
    if (params.maxPrice !== undefined) {
      services = services.filter(service => service.base_price <= params.maxPrice!);
    }
    if (params.rating !== undefined) {
      services = services.filter(service => service.rating >= params.rating!);
    }
    if (params.featured !== undefined) {
      services = services.filter(service => service.is_featured === params.featured);
    }
    
    // Apply sorting
    if (params.sortBy) {
      services.sort((a, b) => {
        let aVal: number | string = 0;
        let bVal: number | string = 0;
        
        switch (params.sortBy) {
          case 'name':
            aVal = a.name;
            bVal = b.name;
            break;
          case 'price':
            aVal = a.base_price;
            bVal = b.base_price;
            break;
          case 'rating':
            aVal = a.rating;
            bVal = b.rating;
            break;
          case 'newest':
            aVal = new Date(a.created_at).getTime();
            bVal = new Date(b.created_at).getTime();
            break;
        }
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return params.sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        } else {
          return params.sortOrder === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
        }
      });
    }
    
    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedServices = services.slice(startIndex, endIndex);
    
    // Convert to frontend format
    const convertedServices = paginatedServices.map(this.convertAdminServiceToService);
    
    return {
      data: convertedServices,
      pagination: {
        page,
        limit,
        total: services.length,
        totalPages: Math.ceil(services.length / limit)
      }
    };
  },

  /**
   * Get service by ID
   */
  async getService(id: string): Promise<Service> {
    const adminService = await getServiceById(id);
    if (!adminService) {
      throw new Error(`Service ${id} not found`);
    }
    return this.convertAdminServiceToService(adminService);
  },

  /**
   * Search services
   */
  async searchServices(query: string, filters?: ServiceFilters): Promise<Service[]> {
    const searchParams: GetServicesParams = {
      searchQuery: query
    };
    
    if (filters) {
      if (filters.categoryIds.length > 0) {
        // For simplicity, use the first category ID
        searchParams.categoryId = filters.categoryIds[0];
      }
      if (filters.priceRange) {
        searchParams.minPrice = filters.priceRange.min;
        searchParams.maxPrice = filters.priceRange.max;
      }
      if (filters.rating) {
        searchParams.rating = filters.rating;
      }
      if (filters.sortBy) {
        searchParams.sortBy = filters.sortBy;
        searchParams.sortOrder = filters.sortOrder;
      }
    }
    
    const result = await this.getServices(searchParams);
    return result.data;
  },

  /**
   * Get featured services
   */
  async getFeaturedServices(limit: number = 6): Promise<Service[]> {
    const result = await this.getServices({ featured: true, limit });
    return result.data;
  },

  /**
   * Get service variants
   */
  async getServiceVariants(serviceId: string): Promise<AdminService[]> {
    // TODO: Implement service variants via admin data manager
    console.log(`Getting variants for service: ${serviceId}`);
    return [];
  },

  /**
   * Get services by category
   */
  async getServicesByCategory(categoryId: string, params: GetServicesParams = {}): Promise<PaginatedResponse<Service>> {
    return this.getServices({ ...params, categoryId });
  },

  /**
   * Create new service (Admin only)
   */
  async createService(serviceData: CreateServiceRequest): Promise<Service> {
    const { photos, ...serviceWithoutPhotos } = serviceData;
    
    // Convert to admin format
    const adminServiceData = {
      name: serviceWithoutPhotos.name,
      category_id: serviceWithoutPhotos.categoryId,
      subcategory_id: '', // Will need to be set if subcategory is provided
      description: serviceWithoutPhotos.description,
      short_description: serviceWithoutPhotos.shortDescription,
      base_price: serviceWithoutPhotos.basePrice,
      discounted_price: serviceWithoutPhotos.discountedPrice,
      duration: serviceWithoutPhotos.duration,
      inclusions: serviceWithoutPhotos.inclusions,
      exclusions: serviceWithoutPhotos.exclusions,
      requirements: [],
      rating: 0,
      review_count: 0,
      booking_count: 0,
      is_active: serviceWithoutPhotos.isActive,
      is_featured: serviceWithoutPhotos.isFeatured,
      is_combo_eligible: false,
      tags: serviceWithoutPhotos.tags,
      gst_percentage: 18,
      service_charge: 0,
      notes: '',
      image_paths: photos ? [] : [] // TODO: Handle photo upload if needed
    };
    
    const newService = await createAdminService(adminServiceData);
    return this.convertAdminServiceToService(newService);
  },

  /**
   * Update service (Admin only)
   */
  async updateService(id: string, updates: UpdateServiceRequest): Promise<Service> {
    const { photos: _photos, ...updatesWithoutPhotos } = updates;
    // TODO: Handle photo updates when implemented
    if (_photos) {
      console.log('Photo updates not yet implemented');
    }
    
    // Convert to admin format
    const adminUpdates: Partial<AdminService> = {};
    if (updatesWithoutPhotos.name !== undefined) adminUpdates.name = updatesWithoutPhotos.name;
    if (updatesWithoutPhotos.categoryId !== undefined) adminUpdates.category_id = updatesWithoutPhotos.categoryId;
    if (updatesWithoutPhotos.description !== undefined) adminUpdates.description = updatesWithoutPhotos.description;
    if (updatesWithoutPhotos.shortDescription !== undefined) adminUpdates.short_description = updatesWithoutPhotos.shortDescription;
    if (updatesWithoutPhotos.basePrice !== undefined) adminUpdates.base_price = updatesWithoutPhotos.basePrice;
    if (updatesWithoutPhotos.discountedPrice !== undefined) adminUpdates.discounted_price = updatesWithoutPhotos.discountedPrice;
    if (updatesWithoutPhotos.duration !== undefined) adminUpdates.duration = updatesWithoutPhotos.duration;
    if (updatesWithoutPhotos.inclusions !== undefined) adminUpdates.inclusions = updatesWithoutPhotos.inclusions;
    if (updatesWithoutPhotos.exclusions !== undefined) adminUpdates.exclusions = updatesWithoutPhotos.exclusions;
    if (updatesWithoutPhotos.isActive !== undefined) adminUpdates.is_active = updatesWithoutPhotos.isActive;
    if (updatesWithoutPhotos.isFeatured !== undefined) adminUpdates.is_featured = updatesWithoutPhotos.isFeatured;
    if (updatesWithoutPhotos.tags !== undefined) adminUpdates.tags = updatesWithoutPhotos.tags;
    
    const updatedService = await updateAdminService(id, adminUpdates);
    return this.convertAdminServiceToService(updatedService);
  },

  /**
   * Delete service (Admin only)
   */
  async deleteService(id: string): Promise<void> {
    const success = await deleteAdminService(id);
    if (!success) {
      throw new Error(`Failed to delete service ${id}`);
    }
  },

  /**
   * Toggle service active status (Admin only)
   */
  async toggleServiceStatus(id: string): Promise<Service> {
    const updatedService = await toggleAdminServiceStatus(id);
    if (!updatedService) {
      throw new Error(`Failed to toggle service status for ${id}`);
    }
    return this.convertAdminServiceToService(updatedService);
  },

  /**
   * Upload service photos
   */
  async uploadServicePhotos(photos: File[]): Promise<string[]> {
    // TODO: Implement photo upload via admin data manager or backend API
    console.warn(`Photo upload not yet implemented for ${photos.length} files`);
    return [];
  },

  /**
   * Get service availability
   */
  async getServiceAvailability(serviceId: string, date?: string): Promise<{ isAvailable: boolean; timeSlots: string[] }> {
    // TODO: Implement availability check via admin data manager
    console.log(`Checking availability for service ${serviceId}${date ? ` on ${date}` : ''}`);
    return {
      isAvailable: true,
      timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
    };
  },

  /**
   * Update service availability (Admin only)
   */
  async updateServiceAvailability(serviceId: string, availability: { isAvailable: boolean; timeSlots: string[] }): Promise<{ isAvailable: boolean; timeSlots: string[] }> {
    // TODO: Implement availability update via admin data manager
    console.warn(`Service availability update not yet implemented for service ${serviceId}`);
    return availability;
  },

  /**
   * Helper method to convert admin service format to frontend service format
   */
  convertAdminServiceToService(adminService: AdminService): Service {
    return {
      id: adminService.id,
      name: adminService.name,
      categoryId: adminService.category_id,
      category: {
        id: adminService.category_id,
        name: '', // Would need to fetch category details
        description: '',
        icon: '',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      description: adminService.description,
      shortDescription: adminService.short_description,
      basePrice: adminService.base_price,
      discountedPrice: adminService.discounted_price,
      discountPercentage: adminService.discounted_price ? 
        Math.round((1 - adminService.discounted_price / adminService.base_price) * 100) : undefined,
      duration: adminService.duration,
      inclusions: adminService.inclusions,
      exclusions: adminService.exclusions,
      photos: [], // Would need to convert image_paths to ServicePhoto format
      reviews: [], // Would need to fetch reviews
      rating: adminService.rating,
      reviewCount: adminService.review_count,
      isActive: adminService.is_active,
      isFeatured: adminService.is_featured,
      tags: adminService.tags,
      availability: {
        isAvailable: adminService.is_active,
        timeSlots: [],
        blackoutDates: []
      },
      createdAt: new Date(adminService.created_at),
      updatedAt: new Date(adminService.updated_at)
    };
  }
};

export default servicesService;