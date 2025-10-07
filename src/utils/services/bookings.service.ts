/**
 * Bookings API service
 * Now using adminDataManager for all backend operations
 */

import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getServiceById,
  validateCoupon
} from '../adminDataManager';
import type { 
  Booking, 
  BookingStatus, 
  Address,
  TimeSlot,
  PaginatedResponse,
  Order,
  Service
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
    // Get all orders from adminDataManager (orders are bookings in the backend)
    let orders = await getOrders();
    
    // Apply filters
    if (params.status) {
      orders = orders.filter(order => order.status === params.status);
    }
    if (params.serviceId) {
      orders = orders.filter(order => order.items.some(item => item.service_id === params.serviceId));
    }
    if (params.userId) {
      orders = orders.filter(order => order.customer_id === params.userId);
    }
    // TODO: Add date range filtering when available in admin data manager
    
    // Apply sorting
    if (params.sortBy) {
      orders.sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';
        
        switch (params.sortBy) {
          case 'createdAt':
            aVal = new Date(a.created_at).getTime();
            bVal = new Date(b.created_at).getTime();
            break;
          case 'totalAmount':
            aVal = a.total_amount;
            bVal = b.total_amount;
            break;
          case 'scheduledDate':
            aVal = new Date(a.items[0]?.scheduled_date || a.created_at).getTime();
            bVal = new Date(b.items[0]?.scheduled_date || b.created_at).getTime();
            break;
        }
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return params.sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        } else {
          return params.sortOrder === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
        }
      });
    }
    
    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = orders.slice(startIndex, endIndex);
    
    // Convert orders to bookings format
    const bookings = await Promise.all(paginatedOrders.map(this.convertOrderToBooking));
    
    return {
      data: bookings,
      pagination: {
        page,
        limit,
        total: orders.length,
        totalPages: Math.ceil(orders.length / limit)
      }
    };
  },

  /**
   * Get booking by ID
   */
  async getBooking(id: string): Promise<Booking> {
    const order = await getOrderById(id);
    if (!order) {
      throw new Error(`Booking ${id} not found`);
    }
    return await this.convertOrderToBooking(order);
  },

  /**
   * Get current user's bookings
   */
  async getMyBookings(params: Omit<GetBookingsParams, 'userId'> = {}): Promise<PaginatedResponse<Booking>> {
    // TODO: Filter by current user when user context is available
    console.warn('Current user filtering not yet implemented in adminDataManager');
    return await this.getBookings(params);
  },

  /**
   * Get user's bookings by user ID (Admin only)
   */
  async getUserBookings(userId: string, params: GetBookingsParams = {}): Promise<PaginatedResponse<Booking>> {
    return await this.getBookings({ ...params, userId });
  },

  /**
   * Calculate booking price with coupon
   */
  async calculateBookingPrice(request: {
    serviceId: string;
    couponCode?: string;
  }): Promise<BookingCalculation> {
    const service = await getServiceById(request.serviceId);
    if (!service) {
      throw new Error(`Service ${request.serviceId} not found`);
    }
    
    const basePrice = service.discounted_price || service.base_price;
    let couponDiscount = 0;
    const discountAmount = service.discounted_price ? service.base_price - service.discounted_price : 0;
    
    // Apply coupon if provided
    if (request.couponCode) {
      const couponValidation = await validateCoupon(request.couponCode);
      if (couponValidation.valid && couponValidation.discount) {
        couponDiscount = couponValidation.discount;
      }
    }
    
    const totalAmount = Math.max(0, basePrice - couponDiscount);
    
    return {
      basePrice: service.base_price,
      discountAmount,
      couponDiscount,
      totalAmount,
      couponCode: request.couponCode
    };
  },

  /**
   * Create new booking
   */
  async createBooking(bookingData: CreateBookingRequest): Promise<Booking> {
    // TODO: Implement booking creation via adminDataManager
    console.warn(`Booking creation not yet implemented for service ${bookingData.serviceId}`);
    throw new Error('Booking creation not yet implemented');
  },

  /**
   * Update booking
   */
  async updateBooking(id: string, updates: UpdateBookingRequest): Promise<Booking> {
    if (updates.status) {
      const updatedOrder = await updateOrderStatus(id, updates.status, updates.adminNotes);
      if (updatedOrder) {
        return await this.convertOrderToBooking(updatedOrder);
      }
    }
    
    // TODO: Implement other booking updates via adminDataManager
    console.warn('Full booking updates not yet implemented in adminDataManager');
    throw new Error('Booking update not fully implemented');
  },

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    const updatedOrder = await updateOrderStatus(id, 'cancelled', reason);
    if (!updatedOrder) {
      throw new Error('Failed to cancel booking');
    }
    return await this.convertOrderToBooking(updatedOrder);
  },

  /**
   * Confirm booking (Admin only)
   */
  async confirmBooking(id: string): Promise<Booking> {
    const updatedOrder = await updateOrderStatus(id, 'confirmed');
    if (!updatedOrder) {
      throw new Error('Failed to confirm booking');
    }
    return await this.convertOrderToBooking(updatedOrder);
  },

  /**
   * Start booking service (Admin only)
   */
  async startBooking(id: string): Promise<Booking> {
    const updatedOrder = await updateOrderStatus(id, 'in_progress');
    if (!updatedOrder) {
      throw new Error('Failed to start booking');
    }
    return await this.convertOrderToBooking(updatedOrder);
  },

  /**
   * Complete booking (Admin only)
   */
  async completeBooking(id: string, completionNotes?: string): Promise<Booking> {
    const updatedOrder = await updateOrderStatus(id, 'completed', completionNotes);
    if (!updatedOrder) {
      throw new Error('Failed to complete booking');
    }
    return await this.convertOrderToBooking(updatedOrder);
  },

  /**
   * Request refund for booking
   */
  async requestRefund(id: string, reason: string): Promise<Booking> {
    const updatedOrder = await updateOrderStatus(id, 'refund_requested', reason);
    if (!updatedOrder) {
      throw new Error('Failed to request refund');
    }
    return await this.convertOrderToBooking(updatedOrder);
  },

  /**
   * Process refund (Admin only)
   */
  async processRefund(id: string, approved: boolean, adminNotes?: string): Promise<Booking> {
    const status = approved ? 'refunded' : 'cancelled';
    const updatedOrder = await updateOrderStatus(id, status, adminNotes);
    if (!updatedOrder) {
      throw new Error('Failed to process refund');
    }
    return await this.convertOrderToBooking(updatedOrder);
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
    // TODO: Implement rescheduling via adminDataManager
    console.warn(`Booking rescheduling not yet implemented for booking ${id} to ${newDate} ${newTimeSlot.startTime}${reason ? ` (${reason})` : ''}`);
    throw new Error('Booking rescheduling not yet implemented');
  },

  /**
   * Add admin notes to booking (Admin only)
   */
  async addAdminNotes(id: string, notes: string): Promise<Booking> {
    // Get current order to preserve status
    const currentOrder = await getOrderById(id);
    if (!currentOrder) {
      throw new Error(`Booking ${id} not found`);
    }
    
    const updatedOrder = await updateOrderStatus(id, currentOrder.status, notes);
    if (!updatedOrder) {
      throw new Error('Failed to add admin notes');
    }
    return await this.convertOrderToBooking(updatedOrder);
  },

  /**
   * Get booking statistics (Admin only)
   */
  async getBookingStatistics(params: {
    startDate?: string;
    endDate?: string;
    serviceId?: string;
    status?: BookingStatus;
  } = {}): Promise<{
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const orders = await getOrders();
    
    // Apply filters
    let filteredOrders = orders;
    if (params.serviceId) {
      filteredOrders = filteredOrders.filter(order => order.items.some(item => item.service_id === params.serviceId));
    }
    if (params.status) {
      filteredOrders = filteredOrders.filter(order => order.status === params.status);
    }
    // TODO: Add date filtering when available
    
    const totalBookings = filteredOrders.length;
    const completedBookings = filteredOrders.filter(order => order.status === 'completed').length;
    const cancelledBookings = filteredOrders.filter(order => order.status === 'cancelled').length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const averageOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    
    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      averageOrderValue
    };
  },

  /**
   * Get available time slots for a service on a specific date
   */
  async getAvailableTimeSlots(serviceId: string, date: string): Promise<TimeSlot[]> {
    // TODO: Implement time slot availability via adminDataManager
    console.warn(`Time slot availability not yet implemented for service ${serviceId} on ${date}`);
    
    // Return default time slots for now
    return [
      { startTime: '09:00', endTime: '10:00', isAvailable: true },
      { startTime: '10:00', endTime: '11:00', isAvailable: true },
      { startTime: '11:00', endTime: '12:00', isAvailable: true },
      { startTime: '14:00', endTime: '15:00', isAvailable: true },
      { startTime: '15:00', endTime: '16:00', isAvailable: true },
      { startTime: '16:00', endTime: '17:00', isAvailable: true }
    ];
  },

  /**
   * Send booking confirmation email
   */
  async sendConfirmationEmail(bookingId: string): Promise<void> {
    // TODO: Implement email sending via adminDataManager or backend
    console.warn(`Confirmation email sending not yet implemented for booking ${bookingId}`);
  },

  /**
   * Send booking reminder email
   */
  async sendReminderEmail(bookingId: string): Promise<void> {
    // TODO: Implement email sending via adminDataManager or backend
    console.warn(`Reminder email sending not yet implemented for booking ${bookingId}`);
  },

  /**
   * Helper method to convert admin order format to frontend booking format
   */
  async convertOrderToBooking(order: Order): Promise<Booking> {
    // Get the first item (assuming single service bookings for now)
    const firstItem = order.items[0];
    const serviceId = firstItem?.service_id || '';
    
    // Get service details
    const service = serviceId ? await getServiceById(serviceId) : null;
    
    return {
      id: order.id,
      userId: order.customer_id,
      user: {
        id: order.customer_id,
        email: order.customer_email,
        firstName: order.customer_name.split(' ')[0] || '',
        lastName: order.customer_name.split(' ').slice(1).join(' ') || '',
        phone: order.customer_phone,
        role: 'customer' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      serviceId: serviceId,
      service: service ? {
        id: service.id,
        name: service.name,
        categoryId: service.category_id,
        category: {
          id: service.category_id,
          name: '',
          description: '',
          icon: '',
          isActive: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        description: service.description,
        shortDescription: service.short_description,
        basePrice: service.base_price,
        discountedPrice: service.discounted_price,
        discountPercentage: service.discounted_price ? 
          Math.round((1 - service.discounted_price / service.base_price) * 100) : undefined,
        duration: service.duration,
        inclusions: service.inclusions,
        exclusions: service.exclusions,
        photos: [],
        reviews: [],
        rating: service.rating,
        reviewCount: service.review_count,
        isActive: service.is_active,
        isFeatured: service.is_featured,
        tags: service.tags,
        availability: {
          isAvailable: service.is_active,
          timeSlots: [],
          blackoutDates: []
        },
        createdAt: new Date(service.created_at),
        updatedAt: new Date(service.updated_at)
      } : undefined as unknown as Service,
      scheduledDate: new Date(firstItem?.scheduled_date || order.created_at),
      timeSlot: {
        startTime: firstItem?.scheduled_time_slot?.split('-')[0] || '09:00',
        endTime: firstItem?.scheduled_time_slot?.split('-')[1] || '10:00',
        isAvailable: true
      },
      status: order.status as BookingStatus,
      totalAmount: order.total_amount,
      discountAmount: order.discount_amount || 0,
      couponCode: undefined, // Not available in Order interface
      customerAddress: {
        street: order.service_address?.street || '',
        city: order.service_address?.city || '',
        state: order.service_address?.state || '',
        zipCode: order.service_address?.pincode || '',
        landmark: order.service_address?.landmark
      },
      customerNotes: order.notes,
      adminNotes: order.admin_notes,
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at)
    };
  }
};

export default bookingsService;