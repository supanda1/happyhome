// Database model interfaces matching frontend types

export interface Order {
  id: string;
  order_number: string;
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
  items: OrderItem[];
  total_amount: number;
  discount_amount: number;
  gst_amount: number;
  service_charge: number;
  final_amount: number;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  admin_notes?: string;
  customer_rating?: number;
  customer_review?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id?: string; // Only used in database
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

// Available expertise areas aligned with service categories and subcategories
export const EXPERTISE_AREAS = [
  // Plumbing expertise (Category 1)
  'Bath Fittings',
  'Basin & Drainage',
  'Grouting & Sealing', 
  'Toilet Installation',
  'Pipe & Connector',
  'Water Tank Services',
  'General Plumbing',
  
  // Electrical expertise (Category 2)
  'Wiring & Installation',
  'Appliance Repair',
  'Switch & Socket',
  'Fan Installation', 
  'Lighting Solutions',
  'Electrical Safety',
  'General Electrical',
  
  // Cleaning expertise (Category 3)
  'Bathroom Cleaning',
  'AC Cleaning',
  'Water Tank Cleaning',
  'Septic Tank Cleaning',
  'Water Purifier Cleaning',
  'Car Wash',
  'General Cleaning',
  
  // Call A Service expertise (Category 4)
  'Courier Services',
  'CAB Booking',
  'Vehicle Breakdown',
  'Photography',
  'Logistics',
  
  // Finance & Insurance expertise (Category 5)
  'GST Services',
  'PAN Card Services',
  'ITR Filing',
  'Legal Documentation',
  'Financial Services',
  
  // Personal Care expertise (Category 6)
  'Medicine Delivery',
  'Beauty & Salon',
  'Health Services',
  
  // Civil Work expertise (Category 7)
  'House Painting',
  'Tile & Marble Work',
  'House Repair',
  'Construction',
  'Civil Engineering'
] as const;

export type ExpertiseArea = typeof EXPERTISE_AREAS[number];

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  icon: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
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
  is_combo_eligible: boolean;
  tags: string[];
  gst_percentage: number;
  service_charge: number;
  notes: string;
  variants?: ServiceVariant[];
  created_at: string;
  updated_at: string;
}

export interface ServiceVariant {
  id: string;
  service_id: string;
  name: string;
  description: string;
  base_price: number;
  discounted_price?: number;
  duration: number;
  inclusions: string[];
  exclusions: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_service';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  usage_count: number;
  usage_limit_per_user?: number;
  is_active: boolean;
  applicable_categories: string[];
  applicable_services: string[];
  first_time_users_only: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  address_type: 'home' | 'office' | 'other';
  full_name: string;
  mobile_number: string;
  pincode: string;
  house_number: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Request body types
export interface CreateOrderRequest {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_address: Order['service_address'];
  items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[];
  total_amount: number;
  discount_amount: number;
  gst_amount: number;
  service_charge: number;
  final_amount: number;
  priority?: Order['priority'];
  notes?: string;
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

export interface BulkAssignEngineerRequest {
  assignments: Array<{
    orderId: string;
    itemId: string;
    engineer_id: string;
    notes?: string;
    scheduled_date?: string;
    scheduled_time_slot?: string;
  }>;
}

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

export interface AutoAssignmentResult {
  itemId: string;
  service_name: string;
  engineer_name?: string;
  engineer_expertise?: string;
  current_load?: number;
  reason?: string;
}

export interface EngineerWorkload {
  id: string;
  name: string;
  expert: string;
  current_assignments: number;
  expertise_match: boolean;
  workload_status: 'low' | 'normal' | 'high' | 'overloaded';
}