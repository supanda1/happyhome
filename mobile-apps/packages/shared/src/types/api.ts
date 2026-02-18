import {
  BaseEntity,
  Location,
  ServiceStatus,
  BookingStatus,
  OrderStatus,
  PaymentStatus,
  UserRole,
} from './common';

// User Types
export interface User extends BaseEntity {
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  profile_image?: string;
  is_active: boolean;
  is_verified: boolean;
  addresses?: Address[];
}

export interface Address extends BaseEntity {
  user_id: string;
  label: string; // home, work, other
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  pincode: string;
  location?: Location;
  is_default: boolean;
}

// Engineer Types
export interface Engineer extends BaseEntity {
  user_id: string;
  user: User;
  employee_id: string;
  skills: string[];
  experience_years: number;
  rating: number;
  total_jobs: number;
  location?: Location;
  is_available: boolean;
  shift_start?: string;
  shift_end?: string;
  documents: EngineerDocument[];
}

export interface EngineerDocument extends BaseEntity {
  engineer_id: string;
  document_type: string;
  document_url: string;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
}

// Service Types
export interface Category extends BaseEntity {
  name: string;
  description?: string;
  image_url?: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
}

export interface Subcategory extends BaseEntity {
  category_id: string;
  category: Category;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
}

export interface Service extends BaseEntity {
  subcategory_id: string;
  subcategory: Subcategory;
  name: string;
  description: string;
  short_description?: string;
  image_url?: string;
  images?: string[];
  price: number;
  discount_price?: number;
  duration_minutes: number;
  status: ServiceStatus;
  requirements?: string[];
  inclusions?: string[];
  exclusions?: string[];
  terms_conditions?: string[];
  is_featured: boolean;
  rating: number;
  review_count: number;
  tags?: string[];
}

// Booking Types
export interface Booking extends BaseEntity {
  user_id: string;
  user: User;
  service_id: string;
  service: Service;
  engineer_id?: string;
  engineer?: Engineer;
  address_id: string;
  address: Address;
  scheduled_at: string;
  status: BookingStatus;
  notes?: string;
  special_instructions?: string;
  estimated_duration: number;
  actual_start_time?: string;
  actual_end_time?: string;
  completion_notes?: string;
  customer_rating?: number;
  customer_review?: string;
  engineer_notes?: string;
  images_before?: string[];
  images_after?: string[];
  total_amount: number;
  discount_amount?: number;
  final_amount: number;
}

// Order Types
export interface Order extends BaseEntity {
  user_id: string;
  user: User;
  order_number: string;
  booking_ids: string[];
  bookings: Booking[];
  status: OrderStatus;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  payment_method?: string;
  payment_status: PaymentStatus;
  payment_id?: string;
  payment_details?: Record<string, any>;
  coupon_code?: string;
  notes?: string;
}

// Payment Types
export interface Payment extends BaseEntity {
  order_id: string;
  order: Order;
  payment_method: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway_payment_id?: string;
  gateway_response?: Record<string, any>;
  failure_reason?: string;
  refund_amount?: number;
  refund_reason?: string;
  refunded_at?: string;
}

// Cart Types
export interface CartItem {
  service_id: string;
  service: Service;
  quantity: number;
  selected_date?: string;
  selected_time?: string;
  address_id?: string;
  special_instructions?: string;
}

export interface Cart {
  items: CartItem[];
  total_amount: number;
  discount_amount: number;
  coupon_code?: string;
  estimated_duration: number;
}

// Review Types
export interface Review extends BaseEntity {
  booking_id: string;
  booking: Booking;
  user_id: string;
  user: User;
  engineer_id: string;
  engineer: Engineer;
  service_id: string;
  service: Service;
  rating: number;
  review_text?: string;
  images?: string[];
  is_featured: boolean;
  admin_response?: string;
  admin_response_at?: string;
}

// Coupon Types
export interface Coupon extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  user_usage_limit?: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  applicable_services?: string[];
  applicable_categories?: string[];
}

// Analytics Types
export interface DashboardStats {
  total_bookings: number;
  pending_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  monthly_revenue: number;
  total_customers: number;
  active_engineers: number;
  average_rating: number;
  popular_services: Array<{
    service_id: string;
    service_name: string;
    booking_count: number;
  }>;
}