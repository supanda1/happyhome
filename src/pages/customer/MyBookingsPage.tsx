/**
 * My Bookings Page - Backend API Integration
 * 
 * SECURITY: Fully integrated with backend API - NO mock data
 * - Fetches real-time user bookings from /api/customer/bookings
 * - Uses HTTP-only cookies for secure authentication
 * - Proper error handling with user-friendly fallbacks
 * - Loading states and booking management functionality
 * 
 * API Endpoints:
 * - GET /api/orders/my - Fetch user's orders
 * - DELETE /api/orders/{id} - Cancel an order
 * - POST /api/orders - Create new order (rebook service)
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, BookingStatus } from '../../types';
import { formatPrice, formatExactPrice } from '../../utils/priceFormatter';
import { getEffectiveOrderStatus, getStatusDisplayName, getStatusColor } from '../../utils/adminDataManager';
import { cartService } from '../../utils/services/cart.service';

const MyBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>('');
  const [customCancelReason, setCustomCancelReason] = useState<string>('');
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);
  
  // Rating states
  const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [ratingLoading, setRatingLoading] = useState<boolean>(false);

  // Predefined cancellation reasons
  const cancelReasons = [
    'Change of mind',
    'Found a better alternative',
    'Service no longer needed',
    'Emergency/Urgent situation',
    'Pricing concerns',
    'Scheduling conflict',
    'Moving to a different location',
    'Unsatisfied with previous service',
    'Other (please specify)'
  ];

  // Fetch user's bookings from backend API
  const fetchBookings = async (forceRefresh = false): Promise<Booking[]> => {
    try {
      // Add timestamp to prevent caching issues and ensure real-time sync
      const timestamp = Date.now();
      const url = `/api/orders/my?t=${timestamp}${forceRefresh ? '&force=true' : ''}`;
      
      console.log('🔍 Customer Orders Fetch Details:');
      console.log('   - URL:', url);
      console.log('   - Method: GET');
      console.log('   - Force Refresh:', forceRefresh);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include', // SECURITY: Include HTTP-only cookies for authentication
      });

      console.log('🔍 Customer Orders Response:');
      console.log('   - Status:', response.status);
      console.log('   - Status Text:', response.statusText);
      console.log('   - OK:', response.ok);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to view your bookings.');
        }
        if (response.status === 404) {
          console.log('ℹ️ No orders found (404) - returning empty array');
          return []; // No bookings found - return empty array
        }
        throw new Error(`Bookings API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Customer Orders Raw Result:', result);
      
      // Handle the API response format from Node.js backend
      if (result.success && result.data) {
        console.log('🔍 Customer Orders Data:', {
          type: typeof result.data,
          isArray: Array.isArray(result.data),
          length: result.data?.length || 0,
          sample: result.data?.[0]
        });
        
        if (Array.isArray(result.data) && result.data.length > 0) {
          console.log('🔍 Customer Order Status Distribution:');
          const statusCounts = result.data.reduce((acc: any, order: any) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
          }, {});
          console.log('   - Status counts:', statusCounts);
          
          // Debug specific orders like HH018, HH017, HH016
          result.data.forEach((order: any) => {
            if (order.orderNumber && ['HH018', 'HH017', 'HH016'].includes(order.orderNumber)) {
              console.log(`🔍 Debug ${order.orderNumber}:`, {
                orderStatus: order.status,
                itemStatus: order.itemStatus,
                items: order.items,
                rawOrder: order
              });
            }
          });
        }
        
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch orders');
      }
    } catch (fetchError) {
      console.error('🚫 Bookings API fetch failed:', fetchError);
      throw fetchError;
    }
  };

  // Cancel a booking
  const cancelBooking = async (bookingId: string, reason: string = 'Cancelled by customer'): Promise<boolean> => {
    try {
      console.log('🔍 Customer Cancellation Details:');
      console.log('   - Order ID:', bookingId);
      console.log('   - URL:', `/api/orders/${bookingId}/cancel`);
      console.log('   - Method: PUT');
      console.log('   - Reason:', reason);
      
      const response = await fetch(`/api/orders/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      console.log('🔍 Cancellation Response:');
      console.log('   - Status:', response.status);
      console.log('   - Status Text:', response.statusText);
      console.log('   - OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Cancellation failed:', errorText);
        throw new Error(`Failed to cancel booking: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Cancellation Success:', result);
      return true;
    } catch (error) {
      console.error('🚫 Cancel booking failed:', error);
      return false;
    }
  };

  // Book again functionality - add service to cart
  const bookAgain = async (booking: Booking): Promise<boolean> => {
    try {
      console.log('🛒 Adding service to cart:', {
        serviceId: booking.service.id,
        serviceName: booking.service.name,
        bookingId: booking.id
      });

      // Add service to cart with quantity 1
      await cartService.addToCart({
        serviceId: booking.service.id,
        quantity: 1
      });

      console.log('✅ Service added to cart successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to add service to cart:', error);
      return false;
    }
  };

  // Submit rating and review
  const submitRating = async (bookingId: string): Promise<boolean> => {
    try {
      console.log('🔍 Submitting rating:', {
        bookingId,
        rating,
        comment: reviewComment
      });

      const response = await fetch(`/api/orders/${bookingId}/rate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          customer_rating: rating,
          customer_review: reviewComment.trim() || null
        }),
      });

      console.log('🔍 Rating Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Rating submission failed:', errorText);
        throw new Error(`Failed to submit rating: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Rating submitted successfully:', result);
      return true;
    } catch (error) {
      console.error('🚫 Submit rating failed:', error);
      return false;
    }
  };

  // Handle rating submission
  const handleRatingSubmit = async (bookingId: string) => {
    if (rating === 0) {
      setNotification({type: 'error', message: 'Please select a rating before submitting.'});
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setRatingLoading(true);
    const success = await submitRating(bookingId);
    
    if (success) {
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, customerRating: rating, customerReview: reviewComment }
          : booking
      ));
      
      // Close modal and reset form
      setShowRatingModal(null);
      setRating(0);
      setHoverRating(0);
      setReviewComment('');
      
      setNotification({type: 'success', message: 'Thank you for your rating! Your feedback helps us improve.'});
      setTimeout(() => setNotification(null), 4000);
      
      // Force refresh to get updated data
      setTimeout(async () => {
        try {
          const refreshedData = await fetchBookings(true);
          setBookings(refreshedData);
        } catch (error) {
          console.warn('⚠️ Failed to refresh after rating:', error);
        }
      }, 1000);
    } else {
      setNotification({type: 'error', message: 'Failed to submit rating. Please try again.'});
      setTimeout(() => setNotification(null), 4000);
    }
    
    setRatingLoading(false);
  };

  // Open rating modal
  const openRatingModal = (bookingId: string) => {
    setShowRatingModal(bookingId);
    setRating(0);
    setHoverRating(0);
    setReviewComment('');
  };

  // Load bookings on component mount and set up auto-sync
  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const bookingsData = await fetchBookings();
        setBookings(bookingsData);
      } catch (error) {
        console.error('Error loading bookings:', error);
        setError(error instanceof Error ? error.message : 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadBookings();

      // Set up auto-sync every 30 seconds to stay in sync with admin changes
      const syncInterval = setInterval(async () => {
        try {
          setIsAutoSyncing(true);
          console.log('🔄 Auto-syncing orders with admin changes...');
          const refreshedData = await fetchBookings(true);
          setBookings(prevBookings => {
            // Only update if there are actual changes to avoid unnecessary re-renders
            const hasChanges = JSON.stringify(prevBookings) !== JSON.stringify(refreshedData);
            if (hasChanges) {
              console.log('✅ Orders updated from auto-sync');
              setNotification({type: 'info', message: 'Orders synchronized - status updated!'});
              // Auto-clear notification after 3 seconds
              setTimeout(() => setNotification(null), 3000);
            }
            return refreshedData;
          });
        } catch (error) {
          console.warn('⚠️ Auto-sync failed:', error);
        } finally {
          setIsAutoSyncing(false);
        }
      }, 30000); // Sync every 30 seconds

      return () => {
        clearInterval(syncInterval);
      };
    } else {
      setLoading(false);
      setError('Please login to view your bookings.');
    }
  }, [user]);

  // Handle booking actions
  const handleCancelBooking = async (bookingId: string) => {
    setShowCancelModal(bookingId);
    setSelectedCancelReason('');
    setCustomCancelReason('');
  };

  const confirmCancelBooking = async (bookingId: string) => {
    // Get the final reason (custom or selected)
    const finalReason = selectedCancelReason === 'Other (please specify)' 
      ? customCancelReason.trim() || 'Other reason' 
      : selectedCancelReason;
    
    if (!finalReason) {
      setNotification({type: 'error', message: 'Please select a cancellation reason.'});
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    setShowCancelModal(null);
    setActionLoading(bookingId);
    const success = await cancelBooking(bookingId, finalReason);
    
    if (success) {
      // Update local state immediately
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' as BookingStatus }
          : booking
      ));
      setNotification({type: 'success', message: 'Booking cancelled successfully!'});
      setTimeout(() => setNotification(null), 3000);
      
      // Force refresh data from backend to ensure consistency
      setTimeout(async () => {
        try {
          const refreshedData = await fetchBookings(true);
          setBookings(refreshedData);
          console.log('🔄 Orders force refreshed after cancellation');
        } catch (error) {
          console.warn('⚠️ Failed to refresh orders after cancellation:', error);
        }
      }, 1000);
      
    } else {
      setNotification({type: 'error', message: 'Failed to cancel booking. Please try again.'});
      setTimeout(() => setNotification(null), 4000);
    }
    
    setActionLoading(null);
  };

  const handleBookAgain = async (booking: Booking) => {
    setActionLoading(booking.id);
    const success = await bookAgain(booking);
    
    if (success) {
      setNotification({type: 'success', message: `${booking.service.name} booked again successfully!`});
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({type: 'error', message: 'Failed to book service again. Please try again.'});
    }
    
    setActionLoading(null);
  };

  // Helper function to get effective status for customer orders
  const getEffectiveBookingStatus = (booking: any): string => {
    // Handle both new and legacy backend data formats
    let orderData;
    
    if (booking.items && Array.isArray(booking.items) && booking.items.length > 0) {
      // New backend format with embedded items array
      orderData = {
        status: booking.status,
        items: booking.items
      };
    } else if (booking.itemStatus) {
      // New backend format with separate itemStatus field
      orderData = {
        status: booking.status,
        items: [{
          id: '1',
          item_status: booking.itemStatus,
          status: booking.itemStatus
        }]
      };
    } else {
      // Legacy format fallback
      orderData = {
        status: booking.status,
        items: [{
          id: '1',
          item_status: booking.status,
          status: booking.status
        }]
      };
    }
    
    return getEffectiveOrderStatus(orderData);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 rounded-xl p-8 text-white shadow-2xl">
              <h1 className="text-3xl font-bold mb-3">Your Orders</h1>
              <p className="text-orange-100 text-lg">Loading your service bookings...</p>
            </div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-25 to-cyan-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Bookings Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to safely format dates
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date not available';
      }
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return 'Date not available';
    }
  };

  // Helper function to format address with fallbacks
  const formatAddress = (address: Booking['customerAddress']) => {
    if (!address) return 'Address not provided';
    
    const parts = [];
    if (address.street && address.street !== 'Address not provided') parts.push(address.street);
    if (address.city && address.city !== 'City not specified') parts.push(address.city);
    if (address.state && address.state !== 'State not specified') parts.push(address.state);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not provided';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Main Container with Better Spacing */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        
        {/* Floating Notification */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className={`rounded-2xl p-4 shadow-2xl border backdrop-blur-sm ${
              notification.type === 'success' ? 'bg-green-50/95 border-green-200 text-green-800' :
              notification.type === 'error' ? 'bg-red-50/95 border-red-200 text-red-800' :
              'bg-blue-50/95 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center justify-between max-w-sm">
                <div className="flex items-center">
                  <span className="mr-3 text-lg">
                    {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
                  </span>
                  <span className="font-semibold text-sm">{notification.message}</span>
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className="ml-4 p-1 hover:bg-black/10 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compact Header Section */}
        <div className="mb-6 lg:mb-8">
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl card-3d">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 rounded-xl p-2 icon-3d">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                        {user?.firstName ? `${user.firstName}'s Orders` : 'Your Orders'}
                      </h1>
                      {isAutoSyncing && (
                        <div className="flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-lg">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-white/90">Syncing...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-white/90 text-sm sm:text-base">Track and manage your service bookings • Auto-sync enabled</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const refreshedData = await fetchBookings(true);
                      setBookings(refreshedData);
                      setNotification({type: 'success', message: 'Orders refreshed successfully!'});
                      setTimeout(() => setNotification(null), 3000);
                    } catch (error) {
                      setNotification({type: 'error', message: 'Failed to refresh orders. Please try again.'});
                      setTimeout(() => setNotification(null), 4000);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white p-2 rounded-xl transition-colors duration-200 flex items-center space-x-2 shadow-lg backdrop-blur-sm border border-white/20"
                >
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="font-medium text-sm hidden sm:block">{loading ? 'Syncing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-xl border border-gray-100">
            <div className="mx-auto w-32 h-32 bg-gradient-to-br from-orange-100 to-purple-100 rounded-full flex items-center justify-center mb-8 shadow-lg">
              <svg className="w-16 h-16 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">No orders yet</h3>
            <p className="text-gray-600 mb-8 text-lg max-w-lg mx-auto">Start your journey with Happy Homes! When you book services, they'll appear here for easy tracking and management.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <>
            {/* Enhanced Statistics Cards */}
            <div className="mb-8 lg:mb-10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {/* Completed Orders */}
                <div className="stats-3d rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-2 icon-3d">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-emerald-700">
                      {bookings.filter(b => getEffectiveBookingStatus(b) === 'completed').length}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-emerald-600">Completed</div>
                </div>

                {/* Active Orders */}
                <div className="stats-3d rounded-xl p-4 border border-orange-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-2 icon-3d">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-orange-700">
                      {bookings.filter(b => ['confirmed', 'in_progress'].includes(getEffectiveBookingStatus(b))).length}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-orange-600">Active</div>
                </div>

                {/* Pending Orders */}
                <div className="stats-3d rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-2 icon-3d">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-blue-700">
                      {bookings.filter(b => getEffectiveBookingStatus(b) === 'pending').length}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">Pending</div>
                </div>

                {/* Total Spent */}
                <div className="stats-3d rounded-xl p-4 border border-purple-100 col-span-2 lg:col-span-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-2 icon-3d">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="text-xl lg:text-2xl font-bold text-purple-700">
                      {formatExactPrice(bookings.reduce((sum, b) => sum + b.totalAmount, 0))}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-purple-600">Total Spent</div>
                </div>
              </div>
            </div>
            {/* Enhanced Orders List */}
            <div className="space-y-4 lg:space-y-6">
              {bookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 lg:p-6 group card-3d"
                >
                  {/* Compact Order Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-2 icon-3d">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg lg:text-xl font-bold text-gray-900 truncate mb-1">
                          {booking.service.name}
                        </h3>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                            #{booking.orderNumber || booking.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            {formatPrice(booking.totalAmount)}
                          </span>
                          {booking.paymentId && (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                              💳 {booking.paymentMethod || 'Card'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Inline Status and Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(getEffectiveBookingStatus(booking))}`}>
                        {getStatusDisplayName(getEffectiveBookingStatus(booking))}
                      </span>
                      
                      {/* Inline Action Buttons */}
                      {(['confirmed', 'pending', 'in_progress'].includes(getEffectiveBookingStatus(booking) as string)) && (
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium py-1 px-3 rounded-full transition-colors duration-200 text-xs flex items-center space-x-1"
                        >
                          {actionLoading === booking.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Cancel</span>
                            </>
                          )}
                        </button>
                      )}
                      
                      {getEffectiveBookingStatus(booking) === 'completed' && (
                        <button 
                          onClick={() => handleBookAgain(booking)}
                          disabled={actionLoading === booking.id}
                          className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white font-medium py-1 px-3 rounded-full transition-colors duration-200 text-xs flex items-center space-x-1"
                        >
                          {actionLoading === booking.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                              </svg>
                              <span>Book Again</span>
                            </>
                          )}
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setShowDetails(showDetails === booking.id ? null : booking.id)}
                        className="bg-violet-500 hover:bg-violet-600 text-white font-medium py-1 px-3 rounded-full transition-colors duration-200 text-xs flex items-center space-x-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Details</span>
                      </button>
                    </div>
                  </div>

                  {/* Compact Service Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {/* Service Date */}
                    <div className="panel-3d rounded-lg p-3 border border-violet-200">
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-violet-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8h6M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold text-violet-800 text-xs">Date</span>
                      </div>
                      <div className="text-violet-700 font-bold text-sm">{formatDate(booking.scheduledDate instanceof Date ? booking.scheduledDate.toISOString() : booking.scheduledDate)}</div>
                    </div>
                    
                    {/* Technician */}
                    <div className="panel-3d rounded-lg p-3 border border-fuchsia-200">
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-fuchsia-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-semibold text-fuchsia-800 text-xs">Staff</span>
                      </div>
                      <div className="text-fuchsia-700 font-bold text-sm">
                        {booking.assignedTechnician || 
                         (['confirmed', 'in_progress', 'completed'].includes(getEffectiveBookingStatus(booking)) 
                          ? 'Assigned' 
                          : 'Pending')}
                      </div>
                    </div>
                    
                    {/* Amount */}
                    <div className="panel-3d rounded-lg p-3 border border-cyan-200">
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-cyan-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className="font-semibold text-cyan-800 text-xs">Amount</span>
                      </div>
                      <div className="text-emerald-600 font-bold text-sm">{formatPrice(booking.totalAmount)}</div>
                    </div>
                    
                    {/* Address */}
                    <div className="panel-3d rounded-lg p-3 border border-indigo-200">
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="font-semibold text-indigo-800 text-xs">Location</span>
                      </div>
                      <div className="text-indigo-700 font-bold text-xs leading-relaxed">
                        {formatAddress(booking.customerAddress)}
                      </div>
                    </div>
                  </div>

                  {/* Service Completion Status */}
                  {getEffectiveBookingStatus(booking) === 'completed' && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-4 border border-amber-200 shadow-md mb-4 transform perspective-1000 rotateX-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-amber-800 font-semibold text-sm mb-2">Service completed successfully!</div>
                          
                          {/* Show existing rating if available */}
                          {booking.customerRating ? (
                            <div className="bg-white/70 rounded-lg p-3 mb-2">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= (booking.customerRating || 0)
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                      fill={star <= (booking.customerRating || 0) ? 'currentColor' : 'none'}
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                      />
                                    </svg>
                                  ))}
                                  <span className="text-sm font-medium text-gray-700 ml-1">
                                    ({booking.customerRating || 0}/5)
                                  </span>
                                </div>
                              </div>
                              {booking.customerReview && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Your Review:</span>
                                  <p className="text-sm text-gray-600 mt-1 italic">"{booking.customerReview}"</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Show rating button if no rating exists */
                            <button 
                              onClick={() => openRatingModal(booking.id)}
                              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 flex items-center space-x-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              <span>Rate this service</span>
                            </button>
                          )}
                        </div>
                        <div className="text-2xl">✅</div>
                      </div>
                    </div>
                  )}

                  {getEffectiveBookingStatus(booking) === 'cancelled' && (
                    <div className="bg-gradient-to-r from-gray-50 to-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm font-medium mb-4 transform perspective-1000 rotateX-6">
                      ✅ Order Cancelled Successfully
                    </div>
                  )}

                  {/* Inline Details Section */}
                  {showDetails === booking.id && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="panel-3d rounded-xl p-4 space-y-4">
                        <h4 className="text-base font-bold text-gray-800 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Order Details
                        </h4>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Order Information */}
                          <div className="bg-white rounded-xl p-4 shadow-md">
                            <h5 className="font-semibold text-gray-800 mb-3">Order Information</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Order Number:</span>
                                <span className="font-medium">#{booking.orderNumber || booking.id.slice(0, 8).toUpperCase()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium">{getStatusDisplayName(getEffectiveBookingStatus(booking))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Amount:</span>
                                <span className="font-bold text-emerald-600">{formatPrice(booking.totalAmount)}</span>
                              </div>
                              {booking.assignedTechnician && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Technician:</span>
                                  <span className="font-medium">{booking.assignedTechnician}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Schedule & Payment */}
                          <div className="bg-white rounded-xl p-4 shadow-md">
                            <h5 className="font-semibold text-gray-800 mb-3">Schedule & Payment</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Scheduled:</span>
                                <span className="font-medium">{formatDate(booking.scheduledDate instanceof Date ? booking.scheduledDate.toISOString() : booking.scheduledDate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Created:</span>
                                <span className="font-medium">{new Date(booking.createdAt).toLocaleDateString()}</span>
                              </div>
                              {booking.paymentId && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Payment ID:</span>
                                    <span className="font-medium">{booking.paymentId}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Method:</span>
                                    <span className="font-medium">{booking.paymentMethod || 'N/A'}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Notes Section */}
                        {(booking.customerNotes || booking.adminNotes) && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {booking.customerNotes && (
                              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                <h5 className="font-semibold text-blue-800 mb-2">Your Notes</h5>
                                <p className="text-blue-700 text-sm leading-relaxed">{booking.customerNotes}</p>
                              </div>
                            )}
                            {booking.adminNotes && (
                              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                                <h5 className="font-semibold text-emerald-800 mb-2">Service Notes</h5>
                                <p className="text-emerald-700 text-sm leading-relaxed">{booking.adminNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Simplified Cancellation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.346 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Booking</h3>
                  <p className="text-gray-600">Please let us know why you're cancelling this booking. Your feedback helps us improve our services.</p>
                </div>

                {/* Reason Selection */}
                <div className="space-y-3 mb-6">
                  {cancelReasons.map((reason) => (
                    <label key={reason} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason}
                        checked={selectedCancelReason === reason}
                        onChange={(e) => setSelectedCancelReason(e.target.value)}
                        className="mr-3 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-gray-700 font-medium">{reason}</span>
                    </label>
                  ))}
                </div>

                {/* Custom Reason Textarea */}
                {selectedCancelReason === 'Other (please specify)' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Please specify your reason:</label>
                    <textarea
                      value={customCancelReason}
                      onChange={(e) => setCustomCancelReason(e.target.value)}
                      placeholder="Enter your reason for cancellation..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {customCancelReason.length}/500 characters
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCancelModal(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={() => confirmCancelBooking(showCancelModal)}
                    disabled={!selectedCancelReason || (selectedCancelReason === 'Other (please specify)' && !customCancelReason.trim())}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Rate Your Service</h3>
                  <p className="text-gray-600">How was your experience? Your feedback helps us improve our services.</p>
                </div>

                {/* Star Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Rating *</label>
                  <div className="flex justify-center items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-all duration-150 hover:scale-110"
                      >
                        <svg 
                          className={`w-8 h-8 transition-colors duration-150 ${
                            star <= (hoverRating || rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                          fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={1.5} 
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-sm text-gray-500">
                      {rating === 0 && 'Click to rate'}
                      {rating === 1 && '⭐ Poor'}
                      {rating === 2 && '⭐⭐ Fair'}
                      {rating === 3 && '⭐⭐⭐ Good'}
                      {rating === 4 && '⭐⭐⭐⭐ Very Good'}
                      {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
                    </span>
                  </div>
                </div>

                {/* Review Comment */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share your experience (optional)
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about the service quality, technician's professionalism, timeliness, or any other feedback..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {reviewComment.length}/1000 characters
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowRatingModal(null);
                      setRating(0);
                      setHoverRating(0);
                      setReviewComment('');
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                    disabled={ratingLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRatingSubmit(showRatingModal)}
                    disabled={rating === 0 || ratingLoading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    {ratingLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Submit Rating</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compact Call to Action */}
        <div className="mt-12">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-6 text-white card-3d">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10 blur-lg"></div>
            
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-4 icon-3d">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-3">
                Need More Services?
              </h2>
              <p className="text-white/90 text-sm lg:text-base mb-6 max-w-xl mx-auto">
                Discover our comprehensive range of professional home services.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-50 flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Browse Services</span>
                </button>
                <button 
                  onClick={() => window.location.href = '/contact'}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold text-sm backdrop-blur-sm border border-white/20 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Contact</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookingsPage;