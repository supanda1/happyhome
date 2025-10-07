// API Types for Frontend - Clean Version

export interface CreateOrderRequest {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_address: {
    house_number: string;
    area: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: {
    service_id: string;
    service_name: string;
    variant_id?: string;
    variant_name?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    category_id: string;
    subcategory_id: string;
    assigned_engineer_id?: string;
    assigned_engineer_name?: string;
    item_status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
    scheduled_date?: string;
    scheduled_time_slot?: string;
    completion_date?: string;
    item_notes?: string;
    item_rating?: number;
    item_review?: string;
  }[];
  total_amount: number;
  discount_amount: number;
  gst_amount: number;
  service_charge: number;
  final_amount: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export interface OrderItem {
  id: string;
  service_id: string;
  service_name: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category_id: string;
  subcategory_id: string;
  assigned_engineer_id?: string;
  assigned_engineer_name?: string;
  item_status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  scheduled_date?: string;
  scheduled_time_slot?: string;
  completion_date?: string;
  item_notes?: string;
  item_rating?: number;
  item_review?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_address: {
    house_number?: string;
    area?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    street?: string;
  };
  items: OrderItem[];
  total_amount: number;
  discount_amount: number;
  gst_amount: number;
  service_charge: number;
  final_amount: number;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  admin_notes?: string;
  customer_rating?: number;
  customer_review?: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  timestamp: string;
  event_type: 'order_created' | 'status_change' | 'engineer_assigned' | 'service_scheduled' | 'service_completed';
  title: string;
  description: string;
  details?: Record<string, any>;
}

export interface OrderSummary {
  order_number: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
  total_amount: string;
  items_count: number;
  assigned_items: number;
  completed_items: number;
}

export interface OrderHistory {
  summary: OrderSummary;
  timeline: TimelineEvent[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UpdateOrderRequest {
  status?: Order['status'];
  priority?: Order['priority'];
  admin_notes?: string;
  customer_rating?: number;
  customer_review?: string;
}

export interface UpdateOrderItemRequest {
  assigned_engineer_id?: string;
  item_status?: OrderItem['item_status'];
  scheduled_date?: string;
  scheduled_time_slot?: string;
  item_notes?: string;
  item_rating?: number;
  item_review?: string;
}

export interface AssignEngineerRequest {
  engineer_id: string;
  notes?: string;
  scheduled_date?: string;
  scheduled_time_slot?: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  expert: string; // Legacy field for backward compatibility
  expertise_areas?: string[]; // New multi-expertise field (optional for backward compatibility)
  manager: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Type definition for expertise areas - actual data should come from backend
export type ExpertiseArea = string;

export interface AssignmentHistory {
  id: string;
  order_id: string;
  item_id: string;
  engineer_id: string;
  engineer_name: string;
  engineer_expertise?: string;
  action_type: 'assigned' | 'reassigned' | 'unassigned';
  notes?: string;
  created_by: string;
  created_at: string;
}

// Category expertise mapping type - actual mappings should come from backend
export type CategoryExpertiseMapping = Record<string, string>;

// Cart to Order transformation helper
export interface CartToOrderMapper {
  transformCartToOrder: (cartItems: CartItem[], customerInfo: CustomerInfo, address: CustomerAddress) => CreateOrderRequest;
}

// Supporting types for CartToOrderMapper
export interface CartItem {
  id: string;
  serviceId: string;
  quantity: number;
  unitPrice: number;
}

export interface CustomerInfo {
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}