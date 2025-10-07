import React, { useState } from 'react';
import { format } from 'date-fns';
import type { Review } from '../../types/index.ts';
import { Button, Card, CardContent, Badge } from '../ui';

interface ReviewsListProps {
  reviews: Review[];
  showAll?: boolean;
  onShowAll?: () => void;
  className?: string;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ 
  reviews, 
  showAll = false, 
  onShowAll,
  className = '' 
}) => {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  
  // Filter only approved reviews
  const approvedReviews = reviews.filter(review => review.isApproved);
  
  // Sort reviews
  const sortedReviews = [...approvedReviews].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Limit reviews if not showing all
  const displayReviews = showAll ? sortedReviews : sortedReviews.slice(0, 3);

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
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const getRatingStats = () => {
    if (approvedReviews.length === 0) return null;
    
    const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / approvedReviews.length;
    
    const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: approvedReviews.filter(r => r.rating === rating).length
    }));
    
    return { averageRating, ratingCounts, totalReviews: approvedReviews.length };
  };

  const stats = getRatingStats();

  if (approvedReviews.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
        <p className="text-gray-600">Be the first to share your experience with this service!</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Rating Overview */}
      {stats && (
        <Card className="mb-6">
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center mb-2">
                  {renderStars(Math.round(stats.averageRating))}
                </div>
                <p className="text-sm text-gray-600">
                  Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
              
              {/* Rating Distribution */}
              <div className="space-y-2">
                {stats.ratingCounts.map(({ rating, count }) => {
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center space-x-3">
                      <span className="text-sm font-medium w-4">{rating}</span>
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sort Options */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Customer Reviews ({approvedReviews.length})
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'highest' | 'lowest')}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {displayReviews.map((review) => (
          <Card key={review.id}>
            <CardContent>
              <div className="space-y-4">
                {/* Review Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold text-sm">
                        {review.user.firstName.charAt(0)}{review.user.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900">
                          {review.user.firstName} {review.user.lastName.charAt(0)}.
                        </h4>
                        {review.isVerified && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(new Date(review.createdAt), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {renderStars(review.rating)}
                  </div>
                </div>

                {/* Review Content */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>

                {/* Review Photos (if any) */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex space-x-2 overflow-x-auto">
                    {review.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Review photo ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ))}
                  </div>
                )}

                {/* Helpful Button (placeholder for future feature) */}
                <div className="flex items-center space-x-4 pt-3 border-t border-gray-100">
                  <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span>Helpful</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Show More Button */}
      {!showAll && approvedReviews.length > 3 && (
        <div className="text-center mt-6">
          <Button variant="outline" onClick={onShowAll}>
            Show All {approvedReviews.length} Reviews
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;