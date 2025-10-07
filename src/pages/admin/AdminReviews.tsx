/**
 * Admin Reviews - Backend API Integration
 * 
 * SECURITY: Fully integrated with backend API - NO mock data
 * - Fetches real review data from database via /api/admin/reviews
 * - Uses HTTP-only cookies for secure admin authentication
 * - Proper CRUD operations with error handling and loading states
 * - Real-time review management with database persistence
 * 
 * API Endpoints:
 * - GET /api/admin/reviews - Fetch all reviews
 * - PATCH /api/admin/reviews/{id}/approve - Approve review
 * - DELETE /api/admin/reviews/{id} - Reject/delete review
 */
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useServices } from '../../contexts/ServiceContext';
import type { Review } from '../../types';
import { Button, Input, Select, Card, CardContent, Badge } from '../../components/ui';

const AdminReviews: React.FC = () => {
  const { services, loadServices } = useServices();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [serviceFilter, setServiceFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch reviews from backend database API
  const fetchReviews = async (): Promise<Review[]> => {
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SECURITY: Include HTTP-only cookies for admin authentication
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login as admin.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error(`Reviews API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Reviews loaded from backend API');
      return data;
    } catch (fetchError) {
      console.error('🚫 Reviews API fetch failed:', fetchError);
      throw fetchError;
    }
  };

  useEffect(() => {
    const initializeReviews = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadServices(),
        ]);
        
        const reviewsData = await fetchReviews();
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error loading reviews data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    initializeReviews();
  }, [loadServices]);

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         `${review.user.firstName} ${review.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    switch (statusFilter) {
      case 'pending':
        matchesStatus = !review.isApproved;
        break;
      case 'approved':
        matchesStatus = review.isApproved;
        break;
      case 'rejected':
        // In a real app, you'd have a rejected status
        matchesStatus = false;
        break;
      default:
        matchesStatus = true;
    }
    
    const matchesService = !serviceFilter || review.serviceId === serviceFilter;
    const matchesRating = !ratingFilter || review.rating.toString() === ratingFilter;
    
    return matchesSearch && matchesStatus && matchesService && matchesRating;
  });

  // Approve review via backend API
  const approveReviewAPI = async (reviewId: string): Promise<Review | null> => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to approve review: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Review approved successfully');
      return data;
    } catch (error) {
      console.error('🚫 Approve review failed:', error);
      return null;
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    setActionLoading(reviewId);
    
    try {
      const updatedReview = await approveReviewAPI(reviewId);
      
      if (updatedReview) {
        setReviews(prev => prev.map(review => 
          review.id === reviewId ? updatedReview : review
        ));
        alert('Review approved successfully!');
      } else {
        alert('Failed to approve review. Please try again.');
      }
    } catch (error) {
      console.error('Error approving review:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve review';
      setError(`Error approving review: ${errorMessage}`);
      alert(`Error approving review: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete/reject review via backend API
  const deleteReviewAPI = async (reviewId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete review: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Review deleted successfully');
      return true;
    } catch (error) {
      console.error('🚫 Delete review failed:', error);
      return false;
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to reject this review? This action cannot be undone.')) {
      setActionLoading(reviewId);
      
      try {
        const success = await deleteReviewAPI(reviewId);
        
        if (success) {
          setReviews(prev => prev.filter(review => review.id !== reviewId));
          alert('Review rejected and deleted successfully!');
        } else {
          alert('Failed to reject review. Please try again.');
        }
      } catch (error) {
        console.error('Error rejecting review:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to reject review';
        setError(`Error rejecting review: ${errorMessage}`);
        alert(`Error rejecting review: ${errorMessage}`);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Unknown Service';
  };

  const getReviewStatus = (review: Review) => {
    if (review.isApproved) {
      return { status: 'Approved', color: 'bg-green-100 text-green-800' };
    }
    return { status: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const getStats = () => {
    const totalReviews = reviews.length;
    const pendingReviews = reviews.filter(r => !r.isApproved).length;
    const approvedReviews = reviews.filter(r => r.isApproved).length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;
    
    return { totalReviews, pendingReviews, approvedReviews, averageRating };
  };

  const stats = getStats();

  // Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const reviewsData = await fetchReviews();
      setReviews(reviewsData);
      console.log('🔄 Reviews refreshed successfully');
    } catch (error) {
      console.error('Error refreshing reviews:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh reviews');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
            <p className="text-gray-600 mt-2">Loading reviews data...</p>
          </div>
          <Button disabled>
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
            <p className="text-gray-600 mt-2">Error loading reviews data</p>
          </div>
          <Button onClick={handleRefresh}>
            Retry
          </Button>
        </div>
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Reviews Management Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={handleRefresh}>
            Retry Loading Reviews
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
          <p className="text-gray-600 mt-2">Moderate and manage customer reviews from database</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading || actionLoading !== null}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingReviews}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvedReviews}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
            <Select
              placeholder="All Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' }
              ]}
            />
            <Select
              placeholder="All Services"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              options={[
                { value: '', label: 'All Services' },
                ...services.map(service => ({ value: service.id, label: service.name }))
              ]}
            />
            <Select
              placeholder="All Ratings"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              options={[
                { value: '', label: 'All Ratings' },
                { value: '5', label: '5 Stars' },
                { value: '4', label: '4 Stars' },
                { value: '3', label: '3 Stars' },
                { value: '2', label: '2 Stars' },
                { value: '1', label: '1 Star' }
              ]}
            />
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Total: {filteredReviews.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((review) => {
          const status = getReviewStatus(review);
          
          return (
            <Card key={review.id} className="hover:shadow-lg transition-shadow">
              <CardContent>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-semibold text-sm">
                          {review.user.firstName.charAt(0)}{review.user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {review.user.firstName} {review.user.lastName}
                          </h3>
                          {review.isVerified && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Verified</Badge>
                          )}
                          <Badge className={status.color}>{status.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{getServiceName(review.serviceId)}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(review.createdAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  {/* Review Content */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>

                  {/* Actions */}
                  {!review.isApproved && (
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectReview(review.id)}
                        loading={actionLoading === review.id}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === review.id ? 'Rejecting...' : 'Reject'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveReview(review.id)}
                        loading={actionLoading === review.id}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === review.id ? 'Approving...' : 'Approve'}
                      </Button>
                    </div>
                  )}
                  
                  {review.isApproved && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center text-sm text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Review approved and published
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredReviews.length === 0 && reviews.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No reviews found</h3>
          <p className="text-gray-600 mb-6">No customer reviews have been submitted yet. Reviews will appear here once customers start submitting feedback.</p>
          <Button onClick={handleRefresh}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Reviews
          </Button>
        </div>
      )}

      {filteredReviews.length === 0 && reviews.length > 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews match your criteria</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;