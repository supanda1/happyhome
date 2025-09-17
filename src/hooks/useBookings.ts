/**
 * Bookings hooks using React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsService } from '../utils/services';
import { queryKeys, invalidateQueries } from '../utils/query-client';
import type { Booking, BookingStatus, TimeSlot } from '../types/index.ts';
import { useNotify } from '../contexts/NotificationContext';

// ============= Query Hooks =============

/**
 * Get bookings with pagination and filtering
 */
export const useBookings = (params: Parameters<typeof bookingsService.getBookings>[0] = {}) => {
  return useQuery({
    queryKey: queryKeys.bookings.list(params),
    queryFn: () => bookingsService.getBookings(params),
    keepPreviousData: true, // For pagination
  });
};

/**
 * Get single booking
 */
export const useBooking = (id: string) => {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingsService.getBooking(id),
    enabled: !!id,
  });
};

/**
 * Get current user's bookings
 */
export const useMyBookings = (params: Parameters<typeof bookingsService.getMyBookings>[0] = {}) => {
  return useQuery({
    queryKey: [...queryKeys.bookings.all, 'my-bookings', params],
    queryFn: () => bookingsService.getMyBookings(params),
    keepPreviousData: true,
  });
};

/**
 * Get user's bookings by user ID (Admin only)
 */
export const useUserBookings = (userId: string, params: Parameters<typeof bookingsService.getUserBookings>[1] = {}) => {
  return useQuery({
    queryKey: queryKeys.bookings.user(userId),
    queryFn: () => bookingsService.getUserBookings(userId, params),
    enabled: !!userId,
    keepPreviousData: true,
  });
};

/**
 * Calculate booking price with coupon
 */
export const useCalculateBookingPrice = (serviceId: string, couponCode?: string) => {
  return useQuery({
    queryKey: [...queryKeys.bookings.all, 'calculate-price', serviceId, couponCode],
    queryFn: () => bookingsService.calculateBookingPrice({ serviceId, couponCode }),
    enabled: !!serviceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get available time slots for booking
 */
export const useAvailableTimeSlots = (serviceId: string, date: string) => {
  return useQuery({
    queryKey: [...queryKeys.bookings.all, 'available-slots', serviceId, date],
    queryFn: () => bookingsService.getAvailableTimeSlots(serviceId, date),
    enabled: !!serviceId && !!date,
    staleTime: 1000 * 60 * 2, // 2 minutes (more frequent updates for availability)
  });
};

/**
 * Get booking statistics (Admin only)
 */
export const useBookingStatistics = (params: Parameters<typeof bookingsService.getBookingStatistics>[0] = {}) => {
  return useQuery({
    queryKey: [...queryKeys.bookings.all, 'statistics', params],
    queryFn: () => bookingsService.getBookingStatistics(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// ============= Mutation Hooks =============

/**
 * Create booking mutation
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: bookingsService.createBooking,
    onSuccess: (newBooking) => {
      // Add to my bookings cache
      queryClient.invalidateQueries({ queryKey: [...queryKeys.bookings.all, 'my-bookings'] });
      // Invalidate availability for the service
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.services.all, newBooking.serviceId, 'availability'] 
      });
      invalidateQueries.bookings();
      notify.success('Booking created successfully!');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to create booking');
    },
  });
};

/**
 * Update booking mutation
 */
export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Parameters<typeof bookingsService.updateBooking>[1]) => 
      bookingsService.updateBooking(id, updates),
    onSuccess: (updatedBooking) => {
      // Update the specific booking in cache
      queryClient.setQueryData(
        queryKeys.bookings.detail(updatedBooking.id),
        updatedBooking
      );
      invalidateQueries.bookings();
      notify.success('Booking updated successfully!');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to update booking');
    },
  });
};

/**
 * Cancel booking mutation
 */
export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      bookingsService.cancelBooking(id, reason),
    onSuccess: (cancelledBooking) => {
      queryClient.setQueryData(
        queryKeys.bookings.detail(cancelledBooking.id),
        cancelledBooking
      );
      invalidateQueries.bookings();
      // Invalidate availability since slot is now free
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.services.all, cancelledBooking.serviceId, 'availability'] 
      });
      notify.success('Booking cancelled successfully');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to cancel booking');
    },
  });
};

/**
 * Confirm booking mutation (Admin only)
 */
export const useConfirmBooking = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: bookingsService.confirmBooking,
    onSuccess: (confirmedBooking) => {
      queryClient.setQueryData(
        queryKeys.bookings.detail(confirmedBooking.id),
        confirmedBooking
      );
      invalidateQueries.bookings();
      notify.success('Booking confirmed successfully!');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to confirm booking');
    },
  });
};

/**
 * Start booking mutation (Admin only)
 */
export const useStartBooking = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: bookingsService.startBooking,
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(
        queryKeys.bookings.detail(updatedBooking.id),
        updatedBooking
      );
      invalidateQueries.bookings();
      notify.success('Booking started successfully!');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to start booking');
    },
  });
};

/**
 * Complete booking mutation (Admin only)
 */
export const useCompleteBooking = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ id, completionNotes }: { id: string; completionNotes?: string }) => 
      bookingsService.completeBooking(id, completionNotes),
    onSuccess: (completedBooking) => {
      queryClient.setQueryData(
        queryKeys.bookings.detail(completedBooking.id),
        completedBooking
      );
      invalidateQueries.bookings();
      notify.success('Booking completed successfully!');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to complete booking');
    },
  });
};

/**
 * Reschedule booking mutation
 */
export const useRescheduleBooking = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ id, newDate, newTimeSlot, reason }: { 
      id: string; 
      newDate: string; 
      newTimeSlot: TimeSlot; 
      reason?: string;
    }) => bookingsService.rescheduleBooking(id, newDate, newTimeSlot, reason),
    onSuccess: (rescheduledBooking) => {
      queryClient.setQueryData(
        queryKeys.bookings.detail(rescheduledBooking.id),
        rescheduledBooking
      );
      invalidateQueries.bookings();
      // Invalidate availability for both old and new dates
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.services.all, rescheduledBooking.serviceId, 'availability'] 
      });
      notify.success('Booking rescheduled successfully!');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to reschedule booking');
    },
  });
};

/**
 * Request refund mutation
 */
export const useRequestRefund = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      bookingsService.requestRefund(id, reason),
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(
        queryKeys.bookings.detail(updatedBooking.id),
        updatedBooking
      );
      invalidateQueries.bookings();
      notify.success('Refund request submitted successfully');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to request refund');
    },
  });
};

/**
 * Process refund mutation (Admin only)
 */
export const useProcessRefund = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ id, approved, adminNotes }: { id: string; approved: boolean; adminNotes?: string }) => 
      bookingsService.processRefund(id, approved, adminNotes),
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(
        queryKeys.bookings.detail(updatedBooking.id),
        updatedBooking
      );
      invalidateQueries.bookings();
      notify.success(
        `Refund ${updatedBooking.status === 'refunded' ? 'approved' : 'rejected'} successfully`
      );
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to process refund');
    },
  });
};

/**
 * Add admin notes mutation (Admin only)
 */
export const useAddAdminNotes = () => {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => 
      bookingsService.addAdminNotes(id, notes),
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(
        queryKeys.bookings.detail(updatedBooking.id),
        updatedBooking
      );
      notify.success('Admin notes added successfully');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to add admin notes');
    },
  });
};

/**
 * Send confirmation email mutation
 */
export const useSendConfirmationEmail = () => {
  const notify = useNotify();

  return useMutation({
    mutationFn: bookingsService.sendConfirmationEmail,
    onSuccess: () => {
      notify.success('Confirmation email sent successfully');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to send confirmation email');
    },
  });
};

/**
 * Send reminder email mutation
 */
export const useSendReminderEmail = () => {
  const notify = useNotify();

  return useMutation({
    mutationFn: bookingsService.sendReminderEmail,
    onSuccess: () => {
      notify.success('Reminder email sent successfully');
    },
    onError: (error: any) => {
      notify.error(error.message || 'Failed to send reminder email');
    },
  });
};

// ============= Utility Hooks =============

/**
 * Get bookings by status
 */
export const useBookingsByStatus = (status: BookingStatus) => {
  return useBookings({ status, limit: 100 });
};

/**
 * Check if user can reschedule booking
 */
export const useCanRescheduleBooking = (booking: Booking | undefined) => {
  if (!booking) return false;
  
  const now = new Date();
  const scheduledDate = new Date(booking.scheduledDate);
  const hoursUntilBooking = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Can reschedule if booking is pending/confirmed and more than 24 hours away
  return (
    (booking.status === 'pending' || booking.status === 'confirmed') &&
    hoursUntilBooking > 24
  );
};

/**
 * Check if user can cancel booking
 */
export const useCanCancelBooking = (booking: Booking | undefined) => {
  if (!booking) return false;
  
  const now = new Date();
  const scheduledDate = new Date(booking.scheduledDate);
  const hoursUntilBooking = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Can cancel if booking is pending/confirmed and more than 2 hours away
  return (
    (booking.status === 'pending' || booking.status === 'confirmed') &&
    hoursUntilBooking > 2
  );
};

// Export all booking hooks
export const bookingsHooks = {
  // Queries
  useBookings,
  useBooking,
  useMyBookings,
  useUserBookings,
  useCalculateBookingPrice,
  useAvailableTimeSlots,
  useBookingStatistics,
  
  // Mutations
  useCreateBooking,
  useUpdateBooking,
  useCancelBooking,
  useConfirmBooking,
  useStartBooking,
  useCompleteBooking,
  useRescheduleBooking,
  useRequestRefund,
  useProcessRefund,
  useAddAdminNotes,
  useSendConfirmationEmail,
  useSendReminderEmail,
  
  // Utilities
  useBookingsByStatus,
  useCanRescheduleBooking,
  useCanCancelBooking,
};