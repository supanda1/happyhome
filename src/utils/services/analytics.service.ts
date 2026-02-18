/**
 * Analytics API service for revenue and performance data
 * Now using adminDataManager for all backend operations
 */

import {
  getAnalyticsOverview as getAdminAnalyticsOverview,
  exportAnalyticsData,
  type TimePeriod as AdminTimePeriod
} from '../adminDataManager';

export interface RevenueByCategory {
  category_id: string;
  category_name: string;
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  growth_percentage: number;
  subcategories: RevenueBySubcategory[];
}

export interface RevenueBySubcategory {
  subcategory_id: string;
  subcategory_name: string;
  revenue: number;
  orders: number;
  avg_order_value: number;
  growth_percentage: number;
}

export interface TimeSeriesPoint {
  date: string;
  revenue: number;
  orders: number;
  avg_order_value: number;
}

export interface AnalyticsOverview {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  growth_percentage: number;
  top_performing_category: string;
  revenue_by_category: RevenueByCategory[];
  time_series_data: TimeSeriesPoint[];
}

export type TimePeriod = AdminTimePeriod;
export type DateRange = {
  start_date: string;
  end_date: string;
};

export const analyticsService = {
  /**
   * Get analytics overview for a specific time period
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAnalyticsOverview(period: TimePeriod = 'monthly', _dateRange?: DateRange): Promise<AnalyticsOverview> {
    const adminAnalytics = await getAdminAnalyticsOverview(period);
    
    // Convert from admin format to service format
    return {
      total_revenue: adminAnalytics.totalRevenue,
      total_orders: adminAnalytics.totalOrders,
      avg_order_value: adminAnalytics.totalRevenue / (adminAnalytics.totalOrders || 1),
      growth_percentage: adminAnalytics.revenueGrowth,
      top_performing_category: adminAnalytics.topCategories[0]?.categoryName || '',
      revenue_by_category: adminAnalytics.topCategories.map(cat => ({
        category_id: cat.categoryId,
        category_name: cat.categoryName,
        total_revenue: cat.revenue,
        total_orders: cat.orders,
        avg_order_value: cat.revenue / (cat.orders || 1),
        growth_percentage: 0, // Not available in admin format
        subcategories: [] // Would need separate API call
      })),
      time_series_data: adminAnalytics.revenueTimeSeries.map(point => ({
        date: point.date,
        revenue: point.value,
        orders: 0, // Not available in current format
        avg_order_value: 0 // Not available in current format
      }))
    };
  },

  /**
   * Get revenue breakdown by categories
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getRevenueByCategories(period: TimePeriod = 'monthly', _dateRange?: DateRange): Promise<RevenueByCategory[]> {
    const adminAnalytics = await getAdminAnalyticsOverview(period);
    
    return adminAnalytics.topCategories.map(cat => ({
      category_id: cat.categoryId,
      category_name: cat.categoryName,
      total_revenue: cat.revenue,
      total_orders: cat.orders,
      avg_order_value: cat.revenue / (cat.orders || 1),
      growth_percentage: 0, // Not available in admin format
      subcategories: [] // Would need separate API call
    }));
  },

  /**
   * Get revenue breakdown for a specific category by subcategories
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getRevenueBySubcategories(categoryId: string, _period: TimePeriod = 'monthly', _dateRange?: DateRange): Promise<RevenueBySubcategory[]> {
    // TODO: This would require more detailed analytics from adminDataManager
    // For now, return empty array
    console.warn(`Revenue by subcategories for category ${categoryId} not yet implemented in adminDataManager`);
    return [];
  },

  /**
   * Get time series data for revenue trends
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getTimeSeriesData(period: TimePeriod = 'daily', _dateRange?: DateRange): Promise<TimeSeriesPoint[]> {
    const adminAnalytics = await getAdminAnalyticsOverview(period);
    
    return adminAnalytics.revenueTimeSeries.map(point => ({
      date: point.date,
      revenue: point.value,
      orders: 0, // Not available in current admin format
      avg_order_value: 0 // Not available in current admin format
    }));
  },

  /**
   * Get top performing services
   */
  async getTopServices(limit: number = 10, period: TimePeriod = 'monthly'): Promise<{
    service_id: string;
    service_name: string;
    category_name: string;
    subcategory_name: string;
    revenue: number;
    orders: number;
    growth_percentage: number;
  }[]> {
    const adminAnalytics = await getAdminAnalyticsOverview(period);
    
    return adminAnalytics.topServices.slice(0, limit).map(service => ({
      service_id: service.serviceId,
      service_name: service.serviceName,
      category_name: '', // Not available in current admin format
      subcategory_name: '', // Not available in current admin format
      revenue: service.revenue,
      orders: service.orders,
      growth_percentage: 0 // Not available in current admin format
    }));
  },

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(period: TimePeriod = 'monthly'): Promise<{
    total_customers: number;
    new_customers: number;
    returning_customers: number;
    customer_retention_rate: number;
    avg_customer_lifetime_value: number;
    customer_acquisition_cost: number;
  }> {
    const adminAnalytics = await getAdminAnalyticsOverview(period);
    
    // Return basic customer data from admin analytics
    return {
      total_customers: adminAnalytics.totalCustomers,
      new_customers: Math.floor(adminAnalytics.totalCustomers * 0.3), // Estimated
      returning_customers: Math.floor(adminAnalytics.totalCustomers * 0.7), // Estimated
      customer_retention_rate: 0.75, // Default value
      avg_customer_lifetime_value: adminAnalytics.totalRevenue / (adminAnalytics.totalCustomers || 1),
      customer_acquisition_cost: 0 // Not available in current admin format
    };
  },

  /**
   * Export analytics data as CSV or Excel
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async exportAnalytics(format: 'csv' | 'excel', period: TimePeriod = 'monthly', _dateRange?: DateRange): Promise<Blob> {
    return await exportAnalyticsData(format, period);
  }
};

export default analyticsService;