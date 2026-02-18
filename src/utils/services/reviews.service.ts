/**
 * Reviews API service
 */

import { apiClient } from '../api-client';
import type { Review, PaginatedResponse, ApiResponse } from '../../types/index.ts';

interface GetReviewsParams {
  page?: number;
  limit?: number;
  serviceId?: string;
  userId?: string;
  rating?: number;
  isApproved?: boolean;
  isVerified?: boolean;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

interface CreateReviewRequest {
  serviceId: string;
  rating: number;
  title: string;
  comment: string;
  photos?: File[];
}

interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
  photos?: File[];
}

interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

export const reviewsService = {
  /**
   * Get all reviews with filtering and pagination
   */
  async getReviews(params: GetReviewsParams = {}): Promise<PaginatedResponse<Review>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<PaginatedResponse<Review>>(
      `/reviews?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Get review by ID
   */
  async getReview(id: string): Promise<Review> {
    const response = await apiClient.get<ApiResponse<Review>>(`/reviews/${id}`);
    if (!response.data) {
      throw new Error(`Review ${id} not found`);
    }
    return response.data;
  },

  /**
   * Get reviews for a specific service
   */
  async getServiceReviews(serviceId: string, params: Omit<GetReviewsParams, 'serviceId'> = {}): Promise<PaginatedResponse<Review>> {
    const queryParams = new URLSearchParams({ serviceId });
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<PaginatedResponse<Review>>(
      `/reviews/service/${serviceId}?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Get current user's reviews
   */
  async getMyReviews(params: Omit<GetReviewsParams, 'userId'> = {}): Promise<PaginatedResponse<Review>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<PaginatedResponse<Review>>(
      `/reviews/my-reviews?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Get user's reviews by user ID (Admin only)
   */
  async getUserReviews(userId: string, params: GetReviewsParams = {}): Promise<PaginatedResponse<Review>> {
    const queryParams = new URLSearchParams({ userId });
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'userId') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<PaginatedResponse<Review>>(
      `/reviews/user/${userId}?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Create new review
   */
  async createReview(reviewData: CreateReviewRequest): Promise<Review> {
    // If photos are included, upload them first
    if (reviewData.photos && reviewData.photos.length > 0) {
      const photoUrls = await this.uploadReviewPhotos(reviewData.photos);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { photos, ...reviewWithoutPhotos } = reviewData;
      
      const response = await apiClient.post<ApiResponse<Review>>('/reviews', {
        ...reviewWithoutPhotos,
        photos: photoUrls,
      });
      if (!response.data) {
        throw new Error('Failed to create review with photos');
      }
      return response.data;
    }

    const response = await apiClient.post<ApiResponse<Review>>('/reviews', {
      serviceId: reviewData.serviceId,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment
    });
    if (!response.data) {
      throw new Error('Failed to create review');
    }
    return response.data;
  },

  /**
   * Update review (own review only)
   */
  async updateReview(id: string, updates: UpdateReviewRequest): Promise<Review> {
    // If photos are included, upload them first
    if (updates.photos && updates.photos.length > 0) {
      const photoUrls = await this.uploadReviewPhotos(updates.photos);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { photos, ...updatesWithoutPhotos } = updates;
      
      const response = await apiClient.patch<ApiResponse<Review>>(`/reviews/${id}`, {
        ...updatesWithoutPhotos,
        photos: photoUrls,
      });
      if (!response.data) {
        throw new Error(`Failed to update review ${id} with photos`);
      }
      return response.data;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { photos, ...updatesWithoutPhotos } = updates;
    const response = await apiClient.patch<ApiResponse<Review>>(`/reviews/${id}`, updatesWithoutPhotos);
    if (!response.data) {
      throw new Error(`Failed to update review ${id}`);
    }
    return response.data;
  },

  /**
   * Delete review (own review only or Admin)
   */
  async deleteReview(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/reviews/${id}`);
  },

  /**
   * Approve review (Admin only)
   */
  async approveReview(id: string): Promise<Review> {
    const response = await apiClient.patch<ApiResponse<Review>>(`/reviews/${id}/approve`);
    if (!response.data) {
      throw new Error(`Failed to approve review ${id}`);
    }
    return response.data;
  },

  /**
   * Reject review (Admin only)
   */
  async rejectReview(id: string, reason?: string): Promise<Review> {
    const response = await apiClient.patch<ApiResponse<Review>>(`/reviews/${id}/reject`, {
      reason,
    });
    if (!response.data) {
      throw new Error(`Failed to reject review ${id}`);
    }
    return response.data;
  },

  /**
   * Mark review as verified (Admin only)
   */
  async verifyReview(id: string): Promise<Review> {
    const response = await apiClient.patch<ApiResponse<Review>>(`/reviews/${id}/verify`);
    if (!response.data) {
      throw new Error(`Failed to verify review ${id}`);
    }
    return response.data;
  },

  /**
   * Unverify review (Admin only)
   */
  async unverifyReview(id: string): Promise<Review> {
    const response = await apiClient.patch<ApiResponse<Review>>(`/reviews/${id}/unverify`);
    if (!response.data) {
      throw new Error(`Failed to unverify review ${id}`);
    }
    return response.data;
  },

  /**
   * Get review statistics for a service
   */
  async getServiceReviewStatistics(serviceId: string): Promise<ReviewStatistics> {
    const response = await apiClient.get<ApiResponse<ReviewStatistics>>(
      `/reviews/service/${serviceId}/statistics`
    );
    if (!response.data) {
      throw new Error(`Failed to get review statistics for service ${serviceId}`);
    }
    return response.data;
  },

  /**
   * Get overall review statistics (Admin only)
   */
  async getOverallReviewStatistics(): Promise<{
    totalReviews: number;
    averageRating: number;
    pendingReviews: number;
    approvedReviews: number;
    rejectedReviews: number;
  }> {
    const response = await apiClient.get<ApiResponse<{
      totalReviews: number;
      averageRating: number;
      pendingReviews: number;
      approvedReviews: number;
      rejectedReviews: number;
    }>>('/reviews/statistics');
    return response.data || {
      totalReviews: 0,
      averageRating: 0,
      pendingReviews: 0,
      approvedReviews: 0,
      rejectedReviews: 0
    };
  },

  /**
   * Upload review photos
   */
  async uploadReviewPhotos(photos: File[]): Promise<string[]> {
    const uploadPromises = photos.map(photo => 
      apiClient.uploadFile<ApiResponse<{ url: string }>>('/upload/review-photo', photo)
    );
    
    const responses = await Promise.all(uploadPromises);
    return responses.map(response => response.data?.url || '');
  },

  /**
   * Report inappropriate review
   */
  async reportReview(id: string, reason: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(`/reviews/${id}/report`, {
      reason,
    });
  },

  /**
   * Like review
   */
  async likeReview(id: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(`/reviews/${id}/like`);
  },

  /**
   * Unlike review
   */
  async unlikeReview(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/reviews/${id}/like`);
  },

  /**
   * Check if user can review a service (has completed booking)
   */
  async canReviewService(serviceId: string): Promise<{ canReview: boolean; reason?: string }> {
    const response = await apiClient.get<ApiResponse<{ canReview: boolean; reason?: string }>>(
      `/reviews/can-review/${serviceId}`
    );
    return response.data || { canReview: false, reason: 'Unable to determine eligibility' };
  },
};

export default reviewsService;