/**
 * Coupons API service
 */

import { apiClient } from '../api-client';
import type { Coupon, CouponType, PaginatedResponse, ApiResponse } from '../../types/index.ts';

interface GetCouponsParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  type?: CouponType;
  serviceId?: string;
  categoryId?: string;
  sortBy?: 'createdAt' | 'validUntil' | 'usedCount';
  sortOrder?: 'asc' | 'desc';
}

interface CreateCouponRequest {
  code: string;
  name: string;
  description: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit: number;
  validFrom: string;
  validUntil: string;
  applicableServices: string[];
  applicableCategories: string[];
  isActive: boolean;
}

interface UpdateCouponRequest extends Partial<CreateCouponRequest> {}

interface ValidateCouponRequest {
  code: string;
  serviceId?: string;
  orderAmount?: number;
}

interface ValidateCouponResponse {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  message?: string;
  errors?: string[];
}

interface CouponUsageStats {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalUsage: number;
  totalDiscountGiven: number;
  topCoupons: Array<{
    coupon: Coupon;
    usageCount: number;
    discountGiven: number;
  }>;
}

export const couponsService = {
  /**
   * Get all coupons with filtering and pagination (Admin only)
   */
  async getCoupons(params: GetCouponsParams = {}): Promise<PaginatedResponse<Coupon>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<PaginatedResponse<Coupon>>(
      `/coupons?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Get available coupons for customers
   */
  async getAvailableCoupons(serviceId?: string): Promise<Coupon[]> {
    const params = serviceId ? `?serviceId=${serviceId}` : '';
    const response = await apiClient.get<ApiResponse<Coupon[]>>(`/coupons/available${params}`);
    return response.data;
  },

  /**
   * Get coupon by ID (Admin only)
   */
  async getCoupon(id: string): Promise<Coupon> {
    const response = await apiClient.get<ApiResponse<Coupon>>(`/coupons/${id}`);
    return response.data;
  },

  /**
   * Get coupon by code
   */
  async getCouponByCode(code: string): Promise<Coupon> {
    const response = await apiClient.get<ApiResponse<Coupon>>(`/coupons/code/${code}`);
    return response.data;
  },

  /**
   * Validate coupon
   */
  async validateCoupon(request: ValidateCouponRequest): Promise<ValidateCouponResponse> {
    const response = await apiClient.post<ApiResponse<ValidateCouponResponse>>(
      '/coupons/validate',
      request
    );
    return response.data;
  },

  /**
   * Apply coupon to get discount amount
   */
  async applyCoupon(request: {
    code: string;
    serviceId: string;
    orderAmount: number;
  }): Promise<{
    discountAmount: number;
    finalAmount: number;
    coupon: Coupon;
  }> {
    const response = await apiClient.post<ApiResponse<any>>('/coupons/apply', request);
    return response.data;
  },

  /**
   * Create new coupon (Admin only)
   */
  async createCoupon(couponData: CreateCouponRequest): Promise<Coupon> {
    const response = await apiClient.post<ApiResponse<Coupon>>('/coupons', couponData);
    return response.data;
  },

  /**
   * Update coupon (Admin only)
   */
  async updateCoupon(id: string, updates: UpdateCouponRequest): Promise<Coupon> {
    const response = await apiClient.patch<ApiResponse<Coupon>>(`/coupons/${id}`, updates);
    return response.data;
  },

  /**
   * Delete coupon (Admin only)
   */
  async deleteCoupon(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/coupons/${id}`);
  },

  /**
   * Toggle coupon active status (Admin only)
   */
  async toggleCouponStatus(id: string): Promise<Coupon> {
    const response = await apiClient.patch<ApiResponse<Coupon>>(`/coupons/${id}/toggle-status`);
    return response.data;
  },

  /**
   * Duplicate coupon (Admin only)
   */
  async duplicateCoupon(id: string, newCode: string): Promise<Coupon> {
    const response = await apiClient.post<ApiResponse<Coupon>>(`/coupons/${id}/duplicate`, {
      code: newCode,
    });
    return response.data;
  },

  /**
   * Get coupon usage statistics (Admin only)
   */
  async getCouponUsageStats(couponId: string): Promise<{
    usageCount: number;
    totalDiscountGiven: number;
    uniqueUsers: number;
    usageHistory: Array<{
      date: string;
      count: number;
      discountGiven: number;
    }>;
  }> {
    const response = await apiClient.get<ApiResponse<any>>(`/coupons/${couponId}/stats`);
    return response.data;
  },

  /**
   * Get overall coupon statistics (Admin only)
   */
  async getOverallCouponStats(): Promise<CouponUsageStats> {
    const response = await apiClient.get<ApiResponse<CouponUsageStats>>('/coupons/statistics');
    return response.data;
  },

  /**
   * Get coupons expiring soon (Admin only)
   */
  async getExpiringSoonCoupons(days: number = 7): Promise<Coupon[]> {
    const response = await apiClient.get<ApiResponse<Coupon[]>>(
      `/coupons/expiring-soon?days=${days}`
    );
    return response.data;
  },

  /**
   * Get user's available coupons
   */
  async getMyAvailableCoupons(serviceId?: string): Promise<Coupon[]> {
    const params = serviceId ? `?serviceId=${serviceId}` : '';
    const response = await apiClient.get<ApiResponse<Coupon[]>>(`/coupons/my-available${params}`);
    return response.data;
  },

  /**
   * Get user's used coupons
   */
  async getMyUsedCoupons(): Promise<Array<{
    coupon: Coupon;
    usedAt: string;
    discountAmount: number;
    orderId: string;
  }>> {
    const response = await apiClient.get<ApiResponse<any>>('/coupons/my-used');
    return response.data;
  },

  /**
   * Check if user can use a specific coupon
   */
  async canUseCoupon(couponId: string, serviceId?: string): Promise<{
    canUse: boolean;
    reason?: string;
  }> {
    const params = serviceId ? `?serviceId=${serviceId}` : '';
    const response = await apiClient.get<ApiResponse<{ canUse: boolean; reason?: string }>>(
      `/coupons/${couponId}/can-use${params}`
    );
    return response.data;
  },

  /**
   * Generate coupon code suggestion (Admin only)
   */
  async generateCouponCode(prefix?: string): Promise<{ code: string }> {
    const params = prefix ? `?prefix=${prefix}` : '';
    const response = await apiClient.get<ApiResponse<{ code: string }>>(
      `/coupons/generate-code${params}`
    );
    return response.data;
  },

  /**
   * Bulk create coupons (Admin only)
   */
  async bulkCreateCoupons(coupons: CreateCouponRequest[]): Promise<{
    created: Coupon[];
    failed: Array<{
      coupon: CreateCouponRequest;
      error: string;
    }>;
  }> {
    const response = await apiClient.post<ApiResponse<any>>('/coupons/bulk-create', {
      coupons,
    });
    return response.data;
  },

  /**
   * Export coupons to CSV (Admin only)
   */
  async exportCoupons(filters?: GetCouponsParams): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`/coupons/export?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response as Blob;
  },
};

export default couponsService;