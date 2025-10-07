/**
 * Services hooks using React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servicesService } from '../utils/services';
import { queryKeys, invalidateQueries } from '../utils/query-client';
import type { ServiceFilters } from '../types/index.ts';
import { useNotify } from '../contexts/NotificationContext';

// ============= Categories Query Hooks =============

/**
 * Get all service categories
 */
export const useServiceCategories = () => {
  return useQuery({
    queryKey: queryKeys.services.categories(),
    queryFn: servicesService.getCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Get single category
 */
export const useServiceCategory = (id: string) => {
  return useQuery({
    queryKey: [...queryKeys.services.categories(), id],
    queryFn: () => servicesService.getCategory(id),
    enabled: !!id,
  });
};

// ============= Services Query Hooks =============

/**
 * Get services with pagination and filtering
 */
export const useServices = (params: Parameters<typeof servicesService.getServices>[0] = {}) => {
  return useQuery({
    queryKey: queryKeys.services.list(params),
    queryFn: () => servicesService.getServices(params),
    keepPreviousData: true, // For pagination
  });
};

/**
 * Get single service
 */
export const useService = (id: string) => {
  return useQuery({
    queryKey: queryKeys.services.detail(id),
    queryFn: () => servicesService.getService(id),
    enabled: !!id,
  });
};

/**
 * Search services
 */
export const useSearchServices = (query: string, filters?: ServiceFilters) => {
  return useQuery({
    queryKey: queryKeys.services.search(query),
    queryFn: () => servicesService.searchServices(query, filters),
    enabled: !!query && query.length > 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get featured services
 */
export const useFeaturedServices = (limit: number = 6) => {
  return useQuery({
    queryKey: [...queryKeys.services.all, 'featured', limit],
    queryFn: () => servicesService.getFeaturedServices(limit),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

/**
 * Get services by category
 */
export const useServicesByCategory = (categoryId: string, params: Parameters<typeof servicesService.getServicesByCategory>[1] = {}) => {
  return useQuery({
    queryKey: [...queryKeys.services.lists(), 'category', categoryId, params],
    queryFn: () => servicesService.getServicesByCategory(categoryId, params),
    enabled: !!categoryId,
    keepPreviousData: true,
  });
};

/**
 * Get service availability
 */
export const useServiceAvailability = (serviceId: string, date?: string) => {
  return useQuery({
    queryKey: [...queryKeys.services.detail(serviceId), 'availability', date],
    queryFn: () => servicesService.getServiceAvailability(serviceId, date),
    enabled: !!serviceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// ============= Category Mutation Hooks (Admin) =============

/**
 * Create category mutation
 */
export const useCreateCategory = () => {
  const notify = useNotify();

  return useMutation({
    mutationFn: servicesService.createCategory,
    onSuccess: () => {
      invalidateQueries.services();
      notify.success('Category created successfully!');
    },
    onError: (error: Error) => {
      notify.error(error.message || 'Failed to create category');
    },
  });
};

/**
 * Update category mutation
 */
export const useUpdateCategory = () => {
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Parameters<typeof servicesService.updateCategory>[1]) => 
      servicesService.updateCategory(id, updates),
    onSuccess: () => {
      invalidateQueries.services();
      notify.success('Category updated successfully!');
    },
    onError: (error: Error) => {
      notify.error(error.message || 'Failed to update category');
    },
  });
};

/**
 * Delete category mutation
 */
export const useDeleteCategory = () => {
  const notify = useNotify();

  return useMutation({
    mutationFn: servicesService.deleteCategory,
    onSuccess: () => {
      invalidateQueries.services();
      notify.success('Category deleted successfully!');
    },
    onError: (error: Error) => {
      notify.error(error.message || 'Failed to delete category');
    },
  });
};

// ============= Service Mutation Hooks (Admin) =============

/**
 * Create service mutation
 */
export const useCreateService = () => {
  const notify = useNotify();

  return useMutation({
    mutationFn: servicesService.createService,
    onSuccess: () => {
      invalidateQueries.services();
      notify.success('Service created successfully!');
    },
    onError: (error: Error) => {
      notify.error(error.message || 'Failed to create service');
    },
  });
};

/**
 * Update service mutation
 */
export const useUpdateService = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Parameters<typeof servicesService.updateService>[1]) => 
      servicesService.updateService(id, updates),
    onSuccess: (updatedService) => {
      // Update the specific service in cache
      queryClient.setQueryData(
        queryKeys.services.detail(updatedService.id),
        updatedService
      );
      // Invalidate lists to refresh
      invalidateQueries.services();
      notify.success('Service updated successfully!');
    },
    onError: (error: Error) => {
      notify.error(error.message || 'Failed to update service');
    },
  });
};

/**
 * Delete service mutation
 */
export const useDeleteService = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: servicesService.deleteService,
    onSuccess: (_, serviceId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.services.detail(serviceId) });
      invalidateQueries.services();
      notify.success('Service deleted successfully!');
    },
    onError: (error: Error) => {
      notify.error(error.message || 'Failed to delete service');
    },
  });
};

/**
 * Toggle service status mutation
 */
export const useToggleServiceStatus = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: servicesService.toggleServiceStatus,
    onSuccess: (updatedService) => {
      // Update the specific service in cache
      queryClient.setQueryData(
        queryKeys.services.detail(updatedService.id),
        updatedService
      );
      invalidateQueries.services();
      notify.success(
        `Service ${updatedService.isActive ? 'activated' : 'deactivated'} successfully!`
      );
    },
    onError: (error: Error) => {
      notify.error(error.message || 'Failed to update service status');
    },
  });
};

/**
 * Update service availability mutation
 */
export const useUpdateServiceAvailability = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ serviceId, availability }: { serviceId: string; availability: { isAvailable: boolean; timeSlots: string[] } }) => 
      servicesService.updateServiceAvailability(serviceId, availability),
    onSuccess: (_, { serviceId }) => {
      // Invalidate availability queries for this service
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.services.detail(serviceId), 'availability'] 
      });
      notify.success('Service availability updated successfully!');
    },
    onError: (error: Error) => {
      notify.error(error.message || 'Failed to update service availability');
    },
  });
};

/**
 * Upload service photos mutation
 */
export const useUploadServicePhotos = () => {
  const notify = useNotify();

  return useMutation({
    mutationFn: servicesService.uploadServicePhotos,
    onError: (error: Error) => {
      notify.error(error.message || 'Failed to upload photos');
    },
  });
};

// ============= Utility Hooks =============

/**
 * Get services for a specific category (with caching)
 */
export const useServicesForCategory = (categoryId: string) => {
  return useServices({ categoryId, limit: 100 });
};

/**
 * Prefetch service details
 */
export const usePrefetchService = () => {
  const queryClient = useQueryClient();

  return (serviceId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.services.detail(serviceId),
      queryFn: () => servicesService.getService(serviceId),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };
};

// Export all services hooks
export const servicesHooks = {
  // Categories
  useServiceCategories,
  useServiceCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  
  // Services
  useServices,
  useService,
  useSearchServices,
  useFeaturedServices,
  useServicesByCategory,
  useServiceAvailability,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useToggleServiceStatus,
  useUpdateServiceAvailability,
  useUploadServicePhotos,
  
  // Utilities
  useServicesForCategory,
  usePrefetchService,
};