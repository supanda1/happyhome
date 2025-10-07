import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { format, addDays } from 'date-fns';
import { useServices } from '../../contexts/ServiceContext';
import { useBooking } from '../../contexts/BookingContext';
import { useAuth } from '../../contexts/AuthContext';
import type { BookingFormData, Service, TimeSlot } from '../../types';
import { Button, Input, Select, Card, CardHeader, CardContent } from '../../components/ui';

interface BookingFormFields extends BookingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const BookingPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getServiceById } = useServices();
  const { 
    createBooking, 
    validateCoupon, 
    calculateDiscount, 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon,
    loading 
  } = useBooking();

  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<BookingFormFields>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      customerAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        landmark: ''
      },
      customerNotes: '',
      couponCode: ''
    }
  });

  const watchedTimeSlot = watch('timeSlot');

  // Load service data
  useEffect(() => {
    if (serviceId) {
      const foundService = getServiceById(serviceId);
      if (foundService) {
        setService(foundService);
        setValue('serviceId', serviceId);
        
        // Generate available dates (next 30 days, excluding blackout dates)
        const dates: string[] = [];
        for (let i = 1; i <= 30; i++) {
          const date = addDays(new Date(), i);
          const dateStr = format(date, 'yyyy-MM-dd');
          
          if (!foundService.availability.blackoutDates.includes(dateStr)) {
            dates.push(dateStr);
          }
        }
        setAvailableDates(dates);
      } else {
        navigate('/services');
      }
    }
  }, [serviceId, getServiceById, setValue, navigate]);

  // Update available time slots when date changes
  useEffect(() => {
    if (selectedDate && service) {
      setAvailableTimeSlots(service.availability.timeSlots.filter(slot => slot.isAvailable));
    }
  }, [selectedDate, service]);

  // Calculate pricing
  const basePrice = service?.discountedPrice || service?.basePrice || 0;
  const discountAmount = calculateDiscount(basePrice, appliedCoupon);
  const finalPrice = basePrice - discountAmount;

  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !service) return;
    
    setIsApplyingCoupon(true);
    setCouponError('');
    
    try {
      const validation = await validateCoupon(couponCode, service.id, basePrice);
      
      if (validation.valid) {
        const success = await applyCoupon(couponCode);
        if (success) {
          setValue('couponCode', couponCode);
        }
      } else {
        setCouponError(validation.error || 'Invalid coupon code');
      }
    } catch {
      setCouponError('Failed to validate coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Handle coupon removal
  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    setCouponError('');
    setValue('couponCode', '');
  };

  // Handle form submission
  const onSubmit = async (data: BookingFormFields) => {
    if (!service) return;

    const bookingData: BookingFormData = {
      serviceId: data.serviceId,
      scheduledDate: data.scheduledDate,
      timeSlot: data.timeSlot,
      customerAddress: data.customerAddress,
      customerNotes: data.customerNotes,
      couponCode: appliedCoupon?.code
    };

    const success = await createBooking(bookingData);
    
    if (success) {
      setBookingSuccess(true);
      reset();
      setSelectedDate('');
      setCouponCode('');
      removeCoupon();
    }
  };

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto text-center">
          <CardContent>
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Your booking for {service.name} has been successfully submitted. 
              You will receive a confirmation email shortly.
            </p>
            <div className="space-x-4">
              <Button onClick={() => navigate('/my-bookings')}>View My Bookings</Button>
              <Button variant="outline" onClick={() => navigate('/services')}>Browse More Services</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Book Service</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Service Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader title="Service Summary" />
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <img 
                      src={service.photos[0]?.url} 
                      alt={service.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{service.shortDescription}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Price:</span>
                      <span className="font-semibold">${basePrice}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({appliedCoupon.code}):</span>
                        <span>-${discountAmount}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>${finalPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader title="Personal Information" />
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      {...register('firstName', { required: 'First name is required' })}
                      error={errors.firstName?.message}
                    />
                    <Input
                      label="Last Name"
                      {...register('lastName', { required: 'Last name is required' })}
                      error={errors.lastName?.message}
                    />
                    <Input
                      label="Email"
                      type="email"
                      {...register('email', { required: 'Email is required' })}
                      error={errors.email?.message}
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      {...register('phone', { required: 'Phone number is required' })}
                      error={errors.phone?.message}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Date & Time Selection */}
              <Card>
                <CardHeader title="Select Date & Time" />
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Select
                      label="Select Date"
                      placeholder="Choose a date"
                      options={availableDates.map(date => ({
                        value: date,
                        label: format(new Date(date), 'EEEE, MMMM d, yyyy')
                      }))}
                      {...register('scheduledDate', { required: 'Please select a date' })}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setValue('scheduledDate', e.target.value);
                      }}
                      error={errors.scheduledDate?.message}
                    />
                    <Select
                      label="Select Time"
                      placeholder="Choose a time slot"
                      disabled={!selectedDate}
                      options={availableTimeSlots.map(slot => ({
                        value: slot.startTime,
                        label: `${slot.startTime} - ${slot.endTime}`
                      }))}
                      {...register('timeSlot', { required: 'Please select a time slot' })}
                      error={errors.timeSlot?.message}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Service Address */}
              <Card>
                <CardHeader title="Service Address" />
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      label="Street Address"
                      {...register('customerAddress.street', { required: 'Street address is required' })}
                      error={errors.customerAddress?.street?.message}
                    />
                    <div className="grid md:grid-cols-3 gap-4">
                      <Input
                        label="City"
                        {...register('customerAddress.city', { required: 'City is required' })}
                        error={errors.customerAddress?.city?.message}
                      />
                      <Input
                        label="State"
                        {...register('customerAddress.state', { required: 'State is required' })}
                        error={errors.customerAddress?.state?.message}
                      />
                      <Input
                        label="ZIP Code"
                        {...register('customerAddress.zipCode', { required: 'ZIP code is required' })}
                        error={errors.customerAddress?.zipCode?.message}
                      />
                    </div>
                    <Input
                      label="Landmark (Optional)"
                      {...register('customerAddress.landmark')}
                      helperText="Any nearby landmark to help locate your address"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Coupon Code */}
              <Card>
                <CardHeader title="Coupon Code" />
                <CardContent>
                  {appliedCoupon ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-green-800">{appliedCoupon.code} Applied!</p>
                          <p className="text-sm text-green-600">{appliedCoupon.description}</p>
                          <p className="text-sm text-green-600">You save ${discountAmount}</p>
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={handleRemoveCoupon}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          error={couponError}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        loading={isApplyingCoupon}
                        disabled={!couponCode.trim()}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card>
                <CardHeader title="Additional Notes" />
                <CardContent>
                  <textarea
                    {...register('customerNotes')}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    rows={4}
                    placeholder="Any special instructions or requirements for the service provider..."
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  loading={isSubmitting || loading}
                  disabled={!watchedTimeSlot || !selectedDate}
                >
                  Confirm Booking - ${finalPrice}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;