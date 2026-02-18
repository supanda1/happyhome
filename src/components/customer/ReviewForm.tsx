import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { useServices } from '../../contexts/ServiceContext';
import { Button, Input, Card, CardHeader, CardContent } from '../ui';
import { formatPriceWithDiscount } from '../../utils/priceFormatter';

interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
}

interface ReviewFormProps {
  serviceId: string;
  onSubmit?: (success: boolean) => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ serviceId, onSubmit, onCancel }) => {
  const { user } = useAuth();
  const { addReview, getServiceById } = useServices();
  const [hoverRating, setHoverRating] = useState(0);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const service = getServiceById(serviceId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<ReviewFormData>({
    defaultValues: {
      rating: 0,
      title: '',
      comment: ''
    }
  });

  const watchedRating = watch('rating');

  const handleRatingClick = (rating: number) => {
    setValue('rating', rating);
  };

  const onFormSubmit = async (data: ReviewFormData) => {
    if (!user || !service) return;

    try {
      const reviewData = {
        serviceId,
        userId: user.id,
        user: {
          firstName: user.firstName,
          lastName: user.lastName
        },
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        isVerified: true, // Assuming verified users
        isApproved: false // Needs admin approval
      };

      const success = await addReview(serviceId, reviewData);
      
      if (success) {
        setSubmitSuccess(true);
        reset();
        onSubmit?.(true);
      } else {
        onSubmit?.(false);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      onSubmit?.(false);
    }
  };

  const renderStars = (interactive: boolean = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = interactive 
            ? (hoverRating || watchedRating) >= star
            : watchedRating >= star;
          
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && handleRatingClick(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${
                interactive 
                  ? 'hover:scale-110 transition-transform cursor-pointer'
                  : 'cursor-default'
              }`}
            >
              <svg
                className={`w-8 h-8 ${
                  isActive ? 'text-yellow-400' : 'text-gray-300'
                } ${interactive ? 'hover:text-yellow-400' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          );
        })}
        {interactive && (
          <span className="ml-2 text-sm text-gray-600">
            {hoverRating || watchedRating ? `${hoverRating || watchedRating} star${(hoverRating || watchedRating) !== 1 ? 's' : ''}` : 'Rate this service'}
          </span>
        )}
      </div>
    );
  };

  if (submitSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent>
          <div className="text-center py-8">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h3>
            <p className="text-gray-600 mb-6">
              Thank you for your feedback. Your review is being reviewed by our team and will be published shortly.
            </p>
            <div className="space-x-4">
              <Button onClick={() => setSubmitSuccess(false)}>Write Another Review</Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>Close</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!service) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Service not found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader 
        title="Write a Review"
        subtitle={`Share your experience with ${service.name}`}
      />
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Service Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            {service.photos.length > 0 && (
              <img
                src={service.photos[0].url}
                alt={service.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{service.name}</h3>
              <p className="text-sm text-gray-600">{service.category.name}</p>
              <p className="text-sm text-gray-500">{formatPriceWithDiscount(service.basePrice, service.discountedPrice).displayPrice}</p>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you rate this service? *
            </label>
            <div className="flex items-center space-x-4">
              {renderStars(true)}
            </div>
            {errors.rating && (
              <p className="text-red-600 text-sm mt-1">Please select a rating</p>
            )}
            <input
              type="hidden"
              {...register('rating', { 
                required: 'Please select a rating',
                min: { value: 1, message: 'Please select a rating' }
              })}
            />
          </div>

          {/* Review Title */}
          <Input
            label="Review Title *"
            placeholder="Summarize your experience in a few words..."
            {...register('title', { 
              required: 'Review title is required',
              minLength: { value: 5, message: 'Title must be at least 5 characters' },
              maxLength: { value: 100, message: 'Title must be less than 100 characters' }
            })}
            error={errors.title?.message}
          />

          {/* Review Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              {...register('comment', { 
                required: 'Review comment is required',
                minLength: { value: 20, message: 'Review must be at least 20 characters' },
                maxLength: { value: 1000, message: 'Review must be less than 1000 characters' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              rows={5}
              placeholder="Tell others about your experience with this service. What went well? What could be improved?"
            />
            {errors.comment && (
              <p className="text-red-600 text-sm mt-1">{errors.comment.message}</p>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Review Guidelines:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Be honest and constructive in your feedback</li>
              <li>• Focus on your experience with the service</li>
              <li>• Avoid personal attacks or inappropriate language</li>
              <li>• Reviews are moderated and may take time to appear</li>
            </ul>
          </div>

          {/* Reviewer Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Reviewing as:</h4>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">
                  {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-gray-600">Verified Customer</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              loading={isSubmitting}
              disabled={!watchedRating}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;