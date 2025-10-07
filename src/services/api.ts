// API Service Layer for Backend Communication
import type { 
  Order, 
  OrderItem, 
  Employee,
  CreateOrderRequest,
  UpdateOrderRequest,
  UpdateOrderItemRequest,
  AssignEngineerRequest,
  ApiResponse
} from '../types/api';

// Assignment history type
type AssignmentHistory = {
  id: string;
  orderId: string;
  itemId: string;
  assignedTo: string;
  assignedAt: string;
  assignedBy: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Generic API request function - Session-based authentication
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // SECURITY: Use session-based auth with HTTP-only cookies
  // No localStorage token handling - backend manages authentication via cookies
  
  const defaultOptions: RequestInit = {
    credentials: 'include', // SECURITY: Include HTTP-only cookies automatically
    headers: {
      'Content-Type': 'application/json',
      // No manual Authorization header - HTTP-only cookies handle auth
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// Orders API
export const ordersAPI = {
  // Get all orders with optional filtering
  getAll: async (params?: {
    status?: Order['status'];
    priority?: Order['priority'];
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Order[]>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/orders/?${queryString}` : '/orders/';
    
    return apiRequest<Order[]>(endpoint);
  },

  // Get single order by ID
  getById: async (id: string): Promise<ApiResponse<Order>> => {
    return apiRequest<Order>(`/orders/${id}`);
  },

  // Create new order (from checkout)
  create: async (orderData: CreateOrderRequest): Promise<ApiResponse<Order>> => {
    return apiRequest<Order>('/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Update order (status, priority, notes)
  update: async (id: string, updates: UpdateOrderRequest): Promise<ApiResponse<Order>> => {
    return apiRequest<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Update order item
  updateItem: async (
    orderId: string, 
    itemId: string, 
    updates: UpdateOrderItemRequest
  ): Promise<ApiResponse<OrderItem>> => {
    return apiRequest<OrderItem>(`/orders/${orderId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Assign engineer to order item
  assignEngineer: async (
    orderId: string, 
    itemId: string, 
    assignment: AssignEngineerRequest
  ): Promise<ApiResponse<OrderItem>> => {
    return apiRequest<OrderItem>(`/orders/${orderId}/items/${itemId}/assign`, {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  },

  // Bulk assign engineers to multiple items
  bulkAssignEngineers: async (
    assignments: Array<{
      orderId: string;
      itemId: string;
      engineer_id: string;
      notes?: string;
      scheduled_date?: string;
      scheduled_time_slot?: string;
    }>
  ): Promise<ApiResponse<{ assignments: string[] }>> => {
    return apiRequest<{ assignments: string[] }>('/orders/bulk-assign', {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    });
  },

  // Get assignment history for order or item
  getAssignmentHistory: async (
    orderId: string, 
    itemId?: string
  ): Promise<ApiResponse<AssignmentHistory[]>> => {
    const endpoint = itemId 
      ? `/orders/${orderId}/items/${itemId}/assignments/history`
      : `/orders/${orderId}/assignments/history`;
    
    return apiRequest<AssignmentHistory[]>(endpoint);
  },

  // Auto-assign engineers based on expertise and workload
  autoAssignEngineers: async (orderId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiRequest<{ success: boolean; message: string }>(`/orders/${orderId}/auto-assign`, {
      method: 'POST',
    });
  },

  // Delete order
  delete: async (id: string): Promise<ApiResponse<null>> => {
    return apiRequest<null>(`/orders/${id}`, {
      method: 'DELETE',
    });
  },

  // Get engineer workload statistics
  getEngineerWorkloadStats: async (): Promise<ApiResponse<{
    summary: {
      total_engineers: number;
      active_engineers: number;
      idle_engineers: number;
      total_active_tasks: number;
      average_tasks_per_active_engineer: number;
      busiest_engineer: string | null;
      max_tasks: number;
    };
    engineers: Array<{
      id: string;
      employee_id: string;
      name: string;
      expert: string;
      expertise_areas: string[] | null;
      phone: string;
      email: string;
      is_active: boolean;
      active_tasks: number;
      pending_tasks: number;
      scheduled_tasks: number;
      in_progress_tasks: number;
      completed_tasks: number;
      active_assignments: Array<{
        order_id: string;
        order_number: string;
        service_name: string;
        item_status: string;
        scheduled_date: string | null;
        customer_name: string;
        customer_phone: string;
        priority: string;
      }>;
    }>;
  }>> => {
    return apiRequest<{
      success: boolean;
      data: Array<{
        id: string;
        name: string;
        workload: {
          active_orders: number;
          pending_assignments: number;
          priority: string;
        };
      }>;
    }>('/orders/workload/engineers');
  },
};

// Employees API
export const employeesAPI = {
  // Get all employees with optional filtering
  getAll: async (params?: {
    active_only?: boolean;
    expert?: string;
  }): Promise<ApiResponse<Employee[]>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/employees?${queryString}` : '/employees';
    
    return apiRequest<Employee[]>(endpoint);
  },

  // Get single employee by ID
  getById: async (id: string): Promise<ApiResponse<Employee>> => {
    return apiRequest<Employee>(`/employees/${id}`);
  },

  // Get employees by expertise
  getByExpertise: async (expertise: string): Promise<ApiResponse<Employee[]>> => {
    return apiRequest<Employee[]>(`/employees/expertise/${expertise}`);
  },

  // Get available expertise areas
  getExpertiseAreas: async (): Promise<ApiResponse<string[]>> => {
    return apiRequest<string[]>('/employees/expertise-areas');
  },

  // Create new employee
  create: async (employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Employee>> => {
    return apiRequest<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  },

  // Update employee
  update: async (id: string, updates: Partial<Employee>): Promise<ApiResponse<Employee>> => {
    return apiRequest<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete employee
  delete: async (id: string): Promise<ApiResponse<null>> => {
    return apiRequest<null>(`/employees/${id}`, {
      method: 'DELETE',
    });
  },
};

// Health Check API
export const healthAPI = {
  // Check API health
  checkAPI: async (): Promise<ApiResponse<{ status: string; timestamp: string }>> => {
    return apiRequest<{ status: string; timestamp: string }>('/health');
  },

  // Check database health
  checkDatabase: async (): Promise<ApiResponse<{ status: string; connection: boolean }>> => {
    return apiRequest<{ status: string; connection: boolean }>('/health/readiness');
  },
};

// Error handling helper
export const handleAPIError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

// Connection status checker
export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    await healthAPI.checkAPI();
    return true;
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
};

// Development helper: Test if backend is running
export const testBackendConnection = async (): Promise<void> => {
  try {
    await healthAPI.checkAPI();
    await healthAPI.checkDatabase();
  } catch (error) {
    console.error('❌ Backend connection test failed:', error);
  }
};

export default {
  orders: ordersAPI,
  employees: employeesAPI,
  health: healthAPI,
  handleError: handleAPIError,
  checkConnection: checkBackendConnection,
  testConnection: testBackendConnection,
};