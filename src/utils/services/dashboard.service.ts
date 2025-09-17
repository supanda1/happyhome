/**
 * Dashboard API service
 */

import { apiClient } from '../api-client';
import type { DashboardStats, Booking, Service, ApiResponse } from '../../types/index.ts';

interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

interface RevenueData {
  date: string;
  revenue: number;
  bookingsCount: number;
}

interface ServicePerformance {
  service: Service;
  bookingsCount: number;
  revenue: number;
  averageRating: number;
  reviewsCount: number;
}

interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerGrowth: number;
  topCustomers: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    totalBookings: number;
    totalSpent: number;
  }>;
}

interface BookingAnalytics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  completionRate: number;
  cancellationRate: number;
  averageBookingValue: number;
  bookingsByStatus: Record<string, number>;
  bookingsByTimeSlot: Record<string, number>;
}

interface FinancialAnalytics {
  totalRevenue: number;
  netRevenue: number;
  discountGiven: number;
  averageOrderValue: number;
  revenueGrowth: number;
  monthlyRevenue: RevenueData[];
  revenueByCategory: Array<{
    categoryName: string;
    revenue: number;
    percentage: number;
  }>;
}

export const dashboardService = {
  /**
   * Get overall dashboard statistics
   */
  async getDashboardStats(params: DateRangeParams = {}): Promise<DashboardStats> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<ApiResponse<DashboardStats>>(
      `/dashboard/stats?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(params: DateRangeParams & {
    groupBy?: 'day' | 'week' | 'month';
  } = {}): Promise<FinancialAnalytics> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<ApiResponse<FinancialAnalytics>>(
      `/dashboard/revenue?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get booking analytics
   */
  async getBookingAnalytics(params: DateRangeParams = {}): Promise<BookingAnalytics> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<ApiResponse<BookingAnalytics>>(
      `/dashboard/bookings?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(params: DateRangeParams = {}): Promise<CustomerAnalytics> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<ApiResponse<CustomerAnalytics>>(
      `/dashboard/customers?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get service performance analytics
   */
  async getServicePerformance(params: DateRangeParams & {
    limit?: number;
    sortBy?: 'bookings' | 'revenue' | 'rating';
  } = {}): Promise<ServicePerformance[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<ApiResponse<ServicePerformance[]>>(
      `/dashboard/service-performance?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get recent bookings
   */
  async getRecentBookings(limit: number = 10): Promise<Booking[]> {
    const response = await apiClient.get<ApiResponse<Booking[]>>(
      `/dashboard/recent-bookings?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Get top services by bookings
   */
  async getTopServices(params: DateRangeParams & {
    limit?: number;
    sortBy?: 'bookings' | 'revenue';
  } = {}): Promise<ServicePerformance[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<ApiResponse<ServicePerformance[]>>(
      `/dashboard/top-services?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get monthly revenue trend
   */
  async getMonthlyRevenue(months: number = 12): Promise<RevenueData[]> {
    const response = await apiClient.get<ApiResponse<RevenueData[]>>(
      `/dashboard/monthly-revenue?months=${months}`
    );
    return response.data;
  },

  /**
   * Get booking trends by time periods
   */
  async getBookingTrends(params: DateRangeParams & {
    groupBy?: 'hour' | 'day' | 'week' | 'month';
  } = {}): Promise<Array<{
    period: string;
    bookings: number;
    revenue: number;
  }>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<ApiResponse<any>>(
      `/dashboard/booking-trends?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get geographic analytics (if location data is available)
   */
  async getGeographicAnalytics(params: DateRangeParams = {}): Promise<Array<{
    location: string;
    bookings: number;
    revenue: number;
    customers: number;
  }>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<ApiResponse<any>>(
      `/dashboard/geographic?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(): Promise<{
    activeBookings: number;
    todayBookings: number;
    todayRevenue: number;
    onlineCustomers: number;
    pendingReviews: number;
    lowStockAlerts: number;
  }> {
    const response = await apiClient.get<ApiResponse<any>>('/dashboard/real-time');
    return response.data;
  },

  /**
   * Get alerts and notifications for admin
   */
  async getAdminAlerts(): Promise<Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    createdAt: string;
    isRead: boolean;
  }>> {
    const response = await apiClient.get<ApiResponse<any>>('/dashboard/alerts');
    return response.data;
  },

  /**
   * Mark alert as read
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    await apiClient.patch<ApiResponse<void>>(`/dashboard/alerts/${alertId}/read`);
  },

  /**
   * Get performance metrics comparison
   */
  async getPerformanceComparison(params: {
    currentPeriod: DateRangeParams;
    comparisonPeriod: DateRangeParams;
  }): Promise<{
    current: {
      revenue: number;
      bookings: number;
      customers: number;
      averageOrderValue: number;
    };
    comparison: {
      revenue: number;
      bookings: number;
      customers: number;
      averageOrderValue: number;
    };
    growth: {
      revenue: number;
      bookings: number;
      customers: number;
      averageOrderValue: number;
    };
  }> {
    const response = await apiClient.post<ApiResponse<any>>('/dashboard/performance-comparison', params);
    return response.data;
  },

  /**
   * Export dashboard data to CSV
   */
  async exportDashboardData(params: DateRangeParams & {
    type: 'revenue' | 'bookings' | 'customers' | 'services';
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/dashboard/export?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response as Blob;
  },
};

export default dashboardService;