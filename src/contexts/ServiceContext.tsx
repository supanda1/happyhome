import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Service, ServiceCategory, ServiceFilters, Review } from '../types/index.ts';
import { servicesService, reviewsService } from '../utils/services';

// Service State
interface ServiceState {
  services: Service[];
  categories: ServiceCategory[];
  filteredServices: Service[];
  filters: ServiceFilters;
  loading: boolean;
  error: string | null;
}

// Service Actions
type ServiceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SERVICES'; payload: Service[] }
  | { type: 'SET_CATEGORIES'; payload: ServiceCategory[] }
  | { type: 'SET_FILTERS'; payload: ServiceFilters }
  | { type: 'ADD_SERVICE'; payload: Service }
  | { type: 'UPDATE_SERVICE'; payload: Service }
  | { type: 'DELETE_SERVICE'; payload: string }
  | { type: 'ADD_REVIEW'; payload: { serviceId: string; review: Review } }
  | { type: 'FILTER_SERVICES' };

// Service Context Type
interface ServiceContextType extends ServiceState {
  loadServices: () => Promise<void>;
  loadCategories: () => Promise<void>;
  createService: (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateService: (service: Service) => Promise<boolean>;
  deleteService: (serviceId: string) => Promise<boolean>;
  applyFilters: (filters: Partial<ServiceFilters>) => void;
  clearFilters: () => void;
  getServiceById: (id: string) => Service | undefined;
  getCategoryById: (id: string) => ServiceCategory | undefined;
  addReview: (serviceId: string, review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
}

// Initial Filters
const initialFilters: ServiceFilters = {
  categoryIds: [],
  priceRange: { min: 0, max: 1000 },
  rating: 0,
  sortBy: 'name',
  sortOrder: 'asc',
  searchQuery: '',
};

// Initial State
const initialState: ServiceState = {
  services: [],
  categories: [],
  filteredServices: [],
  filters: initialFilters,
  loading: false,
  error: null,
};

// Helper function to filter services
const filterServices = (services: Service[], filters: ServiceFilters): Service[] => {
  let filtered = [...services];

  // Search query filter
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(service =>
      service.name.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query) ||
      service.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Category filter
  if (filters.categoryIds.length > 0) {
    filtered = filtered.filter(service =>
      filters.categoryIds.includes(service.categoryId)
    );
  }

  // Price range filter
  filtered = filtered.filter(service => {
    const price = service.discountedPrice || service.basePrice;
    return price >= filters.priceRange.min && price <= filters.priceRange.max;
  });

  // Rating filter
  if (filters.rating > 0) {
    filtered = filtered.filter(service => service.rating >= filters.rating);
  }

  // Sort services
  filtered.sort((a, b) => {
    let aValue: any, bValue: any;

    switch (filters.sortBy) {
      case 'price':
        aValue = a.discountedPrice || a.basePrice;
        bValue = b.discountedPrice || b.basePrice;
        break;
      case 'rating':
        aValue = a.rating;
        bValue = b.rating;
        break;
      case 'newest':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'name':
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
    }

    if (filters.sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });

  return filtered;
};

// Service Reducer
const serviceReducer = (state: ServiceState, action: ServiceAction): ServiceState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_SERVICES':
      return {
        ...state,
        services: action.payload,
        filteredServices: filterServices(action.payload, state.filters),
        loading: false,
        error: null,
      };
    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
        loading: false,
        error: null,
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload,
        filteredServices: filterServices(state.services, action.payload),
      };
    case 'ADD_SERVICE':
      const servicesWithNew = [...state.services, action.payload];
      return {
        ...state,
        services: servicesWithNew,
        filteredServices: filterServices(servicesWithNew, state.filters),
      };
    case 'UPDATE_SERVICE':
      const updatedServices = state.services.map(service =>
        service.id === action.payload.id ? action.payload : service
      );
      return {
        ...state,
        services: updatedServices,
        filteredServices: filterServices(updatedServices, state.filters),
      };
    case 'DELETE_SERVICE':
      const remainingServices = state.services.filter(service => service.id !== action.payload);
      return {
        ...state,
        services: remainingServices,
        filteredServices: filterServices(remainingServices, state.filters),
      };
    case 'ADD_REVIEW':
      const servicesWithReview = state.services.map(service => {
        if (service.id === action.payload.serviceId) {
          const updatedReviews = [...service.reviews, action.payload.review];
          const totalRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
          const avgRating = totalRating / updatedReviews.length;
          
          return {
            ...service,
            reviews: updatedReviews,
            rating: Math.round(avgRating * 10) / 10,
            reviewCount: updatedReviews.length,
          };
        }
        return service;
      });
      return {
        ...state,
        services: servicesWithReview,
        filteredServices: filterServices(servicesWithReview, state.filters),
      };
    case 'FILTER_SERVICES':
      return {
        ...state,
        filteredServices: filterServices(state.services, state.filters),
      };
    default:
      return state;
  }
};

// Create Context
const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

// Service Provider Component
interface ServiceProviderProps {
  children: ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(serviceReducer, initialState);

  // Load services
  const loadServices = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await servicesService.getServices();
      dispatch({ type: 'SET_SERVICES', payload: response.data });
    } catch (error) {
      console.error('Failed to load services:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load services' });
    }
  };

  // Load categories
  const loadCategories = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const categories = await servicesService.getCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
    } catch (error) {
      console.error('Failed to load categories:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load categories' });
    }
  };

  // Create service
  const createService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const newService = await servicesService.createService(serviceData);
      dispatch({ type: 'ADD_SERVICE', payload: newService });
      return true;
    } catch (error) {
      console.error('Failed to create service:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create service' });
      return false;
    }
  };

  // Update service
  const updateService = async (service: Service): Promise<boolean> => {
    try {
      const updatedService = await servicesService.updateService(service.id, service);
      dispatch({ type: 'UPDATE_SERVICE', payload: updatedService });
      return true;
    } catch (error) {
      console.error('Failed to update service:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update service' });
      return false;
    }
  };

  // Delete service
  const deleteService = async (serviceId: string): Promise<boolean> => {
    try {
      await servicesService.deleteService(serviceId);
      dispatch({ type: 'DELETE_SERVICE', payload: serviceId });
      return true;
    } catch (error) {
      console.error('Failed to delete service:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete service' });
      return false;
    }
  };

  // Apply filters
  const applyFilters = (newFilters: Partial<ServiceFilters>): void => {
    const updatedFilters = { ...state.filters, ...newFilters };
    dispatch({ type: 'SET_FILTERS', payload: updatedFilters });
  };

  // Clear filters
  const clearFilters = (): void => {
    dispatch({ type: 'SET_FILTERS', payload: initialFilters });
  };

  // Get service by ID
  const getServiceById = (id: string): Service | undefined => {
    return state.services.find(service => service.id === id);
  };

  // Get category by ID
  const getCategoryById = (id: string): ServiceCategory | undefined => {
    return state.categories.find(category => category.id === id);
  };

  // Add review
  const addReview = async (serviceId: string, reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const reviewRequest = {
        serviceId: reviewData.serviceId,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
      };
      const newReview = await reviewsService.createReview(reviewRequest);
      dispatch({ type: 'ADD_REVIEW', payload: { serviceId, review: newReview } });
      return true;
    } catch (error) {
      console.error('Failed to add review:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add review' });
      return false;
    }
  };

  const value: ServiceContextType = {
    ...state,
    loadServices,
    loadCategories,
    createService,
    updateService,
    deleteService,
    applyFilters,
    clearFilters,
    getServiceById,
    getCategoryById,
    addReview,
  };

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
};

// Custom hook to use service context
export const useServices = (): ServiceContextType => {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};

export default ServiceContext;