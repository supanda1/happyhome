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
 * - GET /api/customer/bookings - Fetch user's bookings
 * - PUT /api/bookings/{id}/cancel - Cancel a booking
 * - POST /api/bookings/{id}/book-again - Rebook a service
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, BookingStatus } from '../../types';
import { formatPrice } from '../../utils/priceFormatter';

const MyBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch user's bookings from backend API
  const fetchBookings = async (): Promise<Booking[]> => {
    try {
      const response = await fetch('/api/customer/bookings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SECURITY: Include HTTP-only cookies for authentication
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to view your bookings.');
        }
        if (response.status === 404) {
          return []; // No bookings found - return empty array
        }
        throw new Error(`Bookings API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Bookings loaded from backend API');
      return data;
    } catch (fetchError) {
      console.error('🚫 Bookings API fetch failed:', fetchError);
      throw fetchError;
    }
  };

  // Cancel a booking
  const cancelBooking = async (bookingId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel booking: ${response.status}`);
      }

      console.log('✅ Booking cancelled successfully');
      return true;
    } catch (error) {
      console.error('🚫 Cancel booking failed:', error);
      return false;
    }
  };

  // Book again functionality
  const bookAgain = async (bookingId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/book-again`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to rebook service: ${response.status}`);
      }

      console.log('✅ Service rebooked successfully');
      return true;
    } catch (error) {
      console.error('🚫 Rebook service failed:', error);
      return false;
    }
  };

  // Load bookings on component mount
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
    } else {
      setLoading(false);
      setError('Please login to view your bookings.');
    }
  }, [user]);

  // Handle booking actions
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setActionLoading(bookingId);
    const success = await cancelBooking(bookingId);
    
    if (success) {
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' as BookingStatus }
          : booking
      ));
      alert('Booking cancelled successfully!');
    } else {
      alert('Failed to cancel booking. Please try again.');
    }
    
    setActionLoading(null);
  };

  const handleBookAgain = async (bookingId: string) => {
    setActionLoading(bookingId);
    const success = await bookAgain(bookingId);
    
    if (success) {
      alert('Service rebooked successfully! You will be redirected to checkout.');
      // Redirect to checkout or booking confirmation
      window.location.href = '/checkout';
    } else {
      alert('Failed to rebook service. Please try again.');
    }
    
    setActionLoading(null);
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-gradient-to-r from-green-50 to-emerald-100 border-green-200';
      case 'confirmed': return 'text-orange-700 bg-gradient-to-r from-orange-50 to-purple-100 border-orange-200';
      case 'pending': return 'text-blue-700 bg-gradient-to-r from-blue-50 to-cyan-100 border-blue-200';
      case 'in_progress': return 'text-amber-700 bg-gradient-to-r from-yellow-50 to-amber-100 border-amber-200';
      case 'cancelled': return 'text-red-700 bg-gradient-to-r from-red-50 to-pink-100 border-red-200';
      case 'refunded': return 'text-purple-700 bg-gradient-to-r from-purple-50 to-violet-100 border-purple-200';
      default: return 'text-gray-700 bg-gradient-to-r from-gray-50 to-slate-100 border-gray-200';
    }
  };

  const getStatusDisplayName = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'refunded': return 'Refunded';
      default: return status;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-25 to-cyan-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 rounded-lg p-6 text-white">
              <h1 className="text-2xl font-semibold mb-2">Your Orders</h1>
              <p className="text-violet-100">Loading your service bookings...</p>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md border border-violet-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-25 to-cyan-50 relative" style={{backgroundImage: 'radial-gradient(circle at 15% 85%, rgba(139, 69, 199, 0.08) 0%, transparent 70%), radial-gradient(circle at 85% 15%, rgba(59, 130, 246, 0.06) 0%, transparent 70%), radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 60%), linear-gradient(45deg, rgba(236, 72, 153, 0.03) 0%, transparent 50%)'}}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold mb-2">
                  {user?.firstName ? `${user.firstName}'s Orders` : 'Your Orders'}
                </h1>
                <p className="text-violet-100">Track and manage all your service bookings with Happy Homes</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-gradient-to-br from-violet-50 via-pink-50 to-cyan-50 rounded-lg p-8 text-center border border-violet-200 shadow-lg">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start your journey with Happy Homes! When you book services, they'll appear here for easy tracking and management.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <>
            {/* Booking Statistics */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-700">{bookings.filter(b => b.status === 'completed').length}</div>
                <div className="text-sm text-green-600 font-medium">Completed</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg p-4 border border-orange-200">
                <div className="text-2xl font-bold text-orange-700">{bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length}</div>
                <div className="text-sm text-orange-600 font-medium">Active</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{bookings.filter(b => b.status === 'pending').length}</div>
                <div className="text-sm text-blue-600 font-medium">Pending</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">{formatPrice(bookings.reduce((sum, b) => sum + b.totalAmount, 0))}</div>
                <div className="text-sm text-purple-600 font-medium">Total Spent</div>
              </div>
            </div>
            <div className="space-y-4">
            {bookings.map((booking) => (
              <div 
                key={booking.id} 
                className="bg-white rounded-lg shadow-md border border-violet-200 p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.service.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusDisplayName(booking.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-violet-50 rounded-lg p-3 border border-violet-100">
                        <span className="font-medium text-violet-800 text-sm">Service Date</span>
                        <div className="mt-1 text-violet-700 font-medium">{new Date(booking.scheduledDate).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}</div>
                      </div>
                      
                      <div className="bg-fuchsia-50 rounded-lg p-3 border border-fuchsia-100">
                        <span className="font-medium text-fuchsia-800 text-sm">Technician</span>
                        <div className="mt-1 text-fuchsia-700 font-medium">
                          {booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'completed' 
                            ? 'Assigned Technician' 
                            : 'To be assigned'}
                        </div>
                      </div>
                      
                      <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100">
                        <span className="font-medium text-cyan-800 text-sm">Amount</span>
                        <div className="mt-1 text-lg font-semibold text-emerald-600">{formatPrice(booking.totalAmount)}</div>
                        {booking.discountAmount > 0 && (
                          <div className="text-xs text-cyan-600 mt-1">Discount: {formatPrice(booking.discountAmount)}</div>
                        )}
                      </div>
                      
                      <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                        <span className="font-medium text-indigo-800 text-sm">Address</span>
                        <div className="mt-1 text-indigo-700 font-medium text-sm">
                          {booking.customerAddress.street}, {booking.customerAddress.city}
                        </div>
                        <div className="text-xs text-indigo-600 mt-1">
                          {booking.customerAddress.state} - {booking.customerAddress.zipCode}
                        </div>
                      </div>
                    </div>

                    {booking.customerNotes && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-4">
                        <span className="font-medium text-gray-800 text-sm">Your Notes:</span>
                        <div className="mt-1 text-gray-700 text-sm">{booking.customerNotes}</div>
                      </div>
                    )}

                    {booking.adminNotes && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 mb-4">
                        <span className="font-medium text-blue-800 text-sm">Service Notes:</span>
                        <div className="mt-1 text-blue-700 text-sm">{booking.adminNotes}</div>
                      </div>
                    )}

                    {booking.status === 'completed' && (
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                        <span className="font-medium text-amber-800 text-sm">Service completed successfully!</span>
                        <div className="mt-2">
                          <button className="text-sm text-amber-700 hover:text-amber-900 font-medium">
                            Rate this service
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6 flex flex-col space-y-2">
                    {booking.status === 'completed' && (
                      <button 
                        onClick={() => handleBookAgain(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                      >
                        {actionLoading === booking.id ? 'Booking...' : 'Book Again'}
                      </button>
                    )}
                    {(booking.status === 'confirmed' || booking.status === 'pending') && (
                      <button 
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                      >
                        {actionLoading === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    )}
                    <button 
                      onClick={() => alert(`Booking ID: ${booking.id}\nCreated: ${new Date(booking.createdAt).toLocaleString()}\nLast Updated: ${new Date(booking.updatedAt).toLocaleString()}`)}
                      className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </>
        )}

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-br from-violet-50 via-pink-50 to-cyan-50 rounded-lg p-6 border border-violet-200 shadow-md text-center">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Need More Services?
          </h2>
          <p className="text-gray-600 mb-4">
            Explore our wide range of professional home services and book your next appointment.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
          >
            Browse All Services
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyBookingsPage;