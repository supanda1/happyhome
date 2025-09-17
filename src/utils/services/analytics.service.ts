/**
 * Analytics API service for revenue and performance data
 */

import { apiClient } from '../api-client';
import type { ApiResponse } from '../../types/index';

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

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type DateRange = {
  start_date: string;
  end_date: string;
};

export const analyticsService = {
  /**
   * Get analytics overview for a specific time period
   */
  async getAnalyticsOverview(period: TimePeriod = 'monthly', dateRange?: DateRange): Promise<AnalyticsOverview> {
    const params = new URLSearchParams({
      period,
      ...(dateRange && {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      })
    });

    const response = await apiClient.get<ApiResponse<AnalyticsOverview>>(`/analytics/overview?${params}`);
    return response.data;
  },

  /**
   * Get revenue breakdown by categories
   */
  async getRevenueByCategories(period: TimePeriod = 'monthly', dateRange?: DateRange): Promise<RevenueByCategory[]> {
    const params = new URLSearchParams({
      period,
      ...(dateRange && {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      })
    });

    const response = await apiClient.get<ApiResponse<RevenueByCategory[]>>(`/analytics/revenue-by-category?${params}`);
    return response.data;
  },

  /**
   * Get revenue breakdown for a specific category by subcategories
   */
  async getRevenueBySubcategories(categoryId: string, period: TimePeriod = 'monthly', dateRange?: DateRange): Promise<RevenueBySubcategory[]> {
    const params = new URLSearchParams({
      period,
      category_id: categoryId,
      ...(dateRange && {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      })
    });

    const response = await apiClient.get<ApiResponse<RevenueBySubcategory[]>>(`/analytics/revenue-by-subcategory?${params}`);
    return response.data;
  },

  /**
   * Get time series data for revenue trends
   */
  async getTimeSeriesData(period: TimePeriod = 'daily', dateRange?: DateRange): Promise<TimeSeriesPoint[]> {
    const params = new URLSearchParams({
      period,
      ...(dateRange && {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      })
    });

    const response = await apiClient.get<ApiResponse<TimeSeriesPoint[]>>(`/analytics/time-series?${params}`);
    return response.data;
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
    const params = new URLSearchParams({
      limit: limit.toString(),
      period
    });

    const response = await apiClient.get<ApiResponse<any[]>>(`/analytics/top-services?${params}`);
    return response.data;
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
    const response = await apiClient.get<ApiResponse<any>>(`/analytics/customers?period=${period}`);
    return response.data;
  },

  /**
   * Export analytics data as CSV or Excel
   */
  async exportAnalytics(format: 'csv' | 'excel', period: TimePeriod = 'monthly', dateRange?: DateRange): Promise<Blob> {
    const params = new URLSearchParams({
      format,
      period,
      ...(dateRange && {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      })
    });

    const response = await fetch(`/api/analytics/export?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to export analytics data');
    }

    return await response.blob();
  }
};

export default analyticsService;