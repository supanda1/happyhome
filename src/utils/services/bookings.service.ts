/**
 * Bookings API service
 */

import { apiClient } from '../api-client';
import type { 
  Booking, 
  BookingStatus, 
  BookingFormData, 
  Address,
  TimeSlot,
  ApiResponse, 
  PaginatedResponse 
} from '../../types/index.ts';

interface GetBookingsParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  userId?: string;
  serviceId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'scheduledDate' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

interface CreateBookingRequest {
  serviceId: string;
  scheduledDate: string;
  timeSlot: TimeSlot;
  customerAddress: Address;
  customerNotes?: string;
  couponCode?: string;
}

interface UpdateBookingRequest {
  scheduledDate?: string;
  timeSlot?: TimeSlot;
  customerAddress?: Address;
  customerNotes?: string;
  adminNotes?: string;
  status?: BookingStatus;
}

interface BookingCalculation {
  basePrice: number;
  discountAmount: number;
  couponDiscount: number;
  totalAmount: number;
  couponCode?: string;
}

export const bookingsService = {
  /**
   * Get all bookings with filtering and pagination
   */
  async getBookings(params: GetBookingsParams = {}): Promise<PaginatedResponse<Booking>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<PaginatedResponse<Booking>>(
      `/bookings?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Get booking by ID
   */
  async getBooking(id: string): Promise<Booking> {
    const response = await apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`);
    return response.data;
  },

  /**
   * Get current user's bookings
   */
  async getMyBookings(params: Omit<GetBookingsParams, 'userId'> = {}): Promise<PaginatedResponse<Booking>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<PaginatedResponse<Booking>>(
      `/bookings/my-bookings?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Get user's bookings by user ID (Admin only)
   */
  async getUserBookings(userId: string, params: GetBookingsParams = {}): Promise<PaginatedResponse<Booking>> {
    const queryParams = new URLSearchParams({ userId });
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'userId') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<PaginatedResponse<Booking>>(
      `/bookings/user/${userId}?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Calculate booking price with coupon
   */
  async calculateBookingPrice(request: {
    serviceId: string;
    couponCode?: string;
  }): Promise<BookingCalculation> {
    const response = await apiClient.post<ApiResponse<BookingCalculation>>(
      '/bookings/calculate-price',
      request
    );
    return response.data;
  },

  /**
   * Create new booking
   */
  async createBooking(bookingData: CreateBookingRequest): Promise<Booking> {
    const response = await apiClient.post<ApiResponse<Booking>>('/bookings', bookingData);
    return response.data;
  },

  /**
   * Update booking
   */
  async updateBooking(id: string, updates: UpdateBookingRequest): Promise<Booking> {
    const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}`, updates);
    return response.data;
  },

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  /**
   * Confirm booking (Admin only)
   */
  async confirmBooking(id: string): Promise<Booking> {
    const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/confirm`);
    return response.data;
  },

  /**
   * Start booking service (Admin only)
   */
  async startBooking(id: string): Promise<Booking> {
    const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/start`);
    return response.data;
  },

  /**
   * Complete booking (Admin only)
   */
  async completeBooking(id: string, completionNotes?: string): Promise<Booking> {
    const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/complete`, {
      completionNotes,
    });
    return response.data;
  },

  /**
   * Request refund for booking
   */
  async requestRefund(id: string, reason: string): Promise<Booking> {
    const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/refund`, {
      reason,
    });
    return response.data;
  },

  /**
   * Process refund (Admin only)
   */
  async processRefund(id: string, approved: boolean, adminNotes?: string): Promise<Booking> {
    const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/process-refund`, {
      approved,
      adminNotes,
    });
    return response.data;
  },

  /**
   * Reschedule booking
   */
  async rescheduleBooking(
    id: string, 
    newDate: string, 
    newTimeSlot: TimeSlot, 
    reason?: string
  ): Promise<Booking> {
    const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/reschedule`, {
      scheduledDate: newDate,
      timeSlot: newTimeSlot,
      reason,
    });
    return response.data;
  },

  /**
   * Add admin notes to booking (Admin only)
   */
  async addAdminNotes(id: string, notes: string): Promise<Booking> {
    const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/admin-notes`, {
      adminNotes: notes,
    });
    return response.data;
  },

  /**
   * Get booking statistics (Admin only)
   */
  async getBookingStatistics(params: {
    startDate?: string;
    endDate?: string;
    serviceId?: string;
    status?: BookingStatus;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<ApiResponse<any>>(
      `/bookings/statistics?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get available time slots for a service on a specific date
   */
  async getAvailableTimeSlots(serviceId: string, date: string): Promise<TimeSlot[]> {
    const response = await apiClient.get<ApiResponse<TimeSlot[]>>(
      `/bookings/available-slots?serviceId=${serviceId}&date=${date}`
    );
    return response.data;
  },

  /**
   * Send booking confirmation email
   */
  async sendConfirmationEmail(bookingId: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(`/bookings/${bookingId}/send-confirmation`);
  },

  /**
   * Send booking reminder email
   */
  async sendReminderEmail(bookingId: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(`/bookings/${bookingId}/send-reminder`);
  },
};

export default bookingsService;