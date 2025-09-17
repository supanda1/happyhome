// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'customer' | 'admin' | 'super_admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Service Category Types
export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  categoryId: string;
  category: ServiceCategory;
  description: string;
  shortDescription: string;
  basePrice: number;
  discountedPrice?: number;
  discountPercentage?: number;
  duration: number; // in minutes
  inclusions: string[];
  exclusions: string[];
  photos: ServicePhoto[];
  reviews: Review[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  availability: ServiceAvailability;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServicePhoto {
  id: string;
  serviceId: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ServiceAvailability {
  isAvailable: boolean;
  timeSlots: TimeSlot[];
  blackoutDates: string[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// Review Types
export interface Review {
  id: string;
  serviceId: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
  };
  rating: number;
  title: string;
  comment: string;
  photos?: string[];
  isVerified: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Booking Types
export interface Booking {
  id: string;
  userId: string;
  user: User;
  serviceId: string;
  service: Service;
  scheduledDate: Date;
  timeSlot: TimeSlot;
  status: BookingStatus;
  totalAmount: number;
  discountAmount: number;
  couponCode?: string;
  customerAddress: Address;
  customerNotes?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
}

// Coupon Types
export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: CouponType;
  value: number; // percentage or fixed amount
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  applicableServices: string[]; // service IDs
  applicableCategories: string[]; // category IDs
  createdAt: Date;
  updatedAt: Date;
}

export type CouponType = 'percentage' | 'fixed';

// Filter and Search Types
export interface ServiceFilters {
  categoryIds: string[];
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  sortBy: 'name' | 'price' | 'rating' | 'newest';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
}

// API Response Types - Import from api.ts for backend compatibility
export { 
  type ApiResponse, 
  type Order, 
  type OrderItem, 
  type CreateOrderRequest, 
  type UpdateOrderRequest, 
  type UpdateOrderItemRequest, 
  type AssignEngineerRequest, 
  type Employee,
  type CartToOrderMapper,
  type CategoryExpertiseMapping 
} from './api';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface BookingFormData {
  serviceId: string;
  scheduledDate: string;
  timeSlot: string;
  customerAddress: Address;
  customerNotes?: string;
  couponCode?: string;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
}

export interface ServiceFormData {
  name: string;
  categoryId: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  discountedPrice?: number;
  duration: number;
  inclusions: string[];
  exclusions: string[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
}

// Dashboard Types
export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalServices: number;
  totalCustomers: number;
  recentBookings: Booking[];
  topServices: Service[];
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
}