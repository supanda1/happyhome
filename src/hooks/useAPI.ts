/**
 * React Query hooks for API services
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { 
  authService, 
  servicesService, 
  bookingsService, 
  cartService, 
  usersService, 
  couponsService,
  dashboardService,
  reviewsService
} from '../utils/services';
import { queryKeys, invalidateQueries } from '../utils/query-client';
import type { 
  Service, 
  ServiceCategory, 
  ServiceFilters 
} from '../types/index.ts';
import type { AddToCartRequest, UpdateCartItemRequest } from '../utils/services/cart.service.ts';
import type { CreateAddressRequest, UpdateAddressRequest } from '../utils/services/users.service.ts';

// ============= Authentication Hooks =============

export const useAuth = () => {
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login({ email, password }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: Parameters<typeof authService.register>[0]) =>
      authService.register(userData),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
  };
};

// ============= Services Hooks =============

export const useServiceCategories = (options?: UseQueryOptions<ServiceCategory[]>) => {
  return useQuery({
    queryKey: queryKeys.services.categories(),
    queryFn: servicesService.getCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
};

export const useServices = (params: Parameters<typeof servicesService.getServices>[0] = {}) => {
  return useQuery({
    queryKey: queryKeys.services.list(params as Record<string, unknown>),
    queryFn: () => servicesService.getServices(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useService = (id: string, options?: UseQueryOptions<Service>) => {
  return useQuery({
    queryKey: queryKeys.services.detail(id),
    queryFn: () => servicesService.getService(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

export const useServiceVariants = (serviceId: string) => {
  return useQuery({
    queryKey: [...queryKeys.services.detail(serviceId), 'variants'],
    queryFn: () => servicesService.getServiceVariants(serviceId),
    enabled: !!serviceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSearchServices = (query: string, filters?: ServiceFilters) => {
  return useQuery({
    queryKey: queryKeys.services.search(query),
    queryFn: () => servicesService.searchServices(query, filters),
    enabled: !!query && query.length > 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useFeaturedServices = (limit: number = 6) => {
  return useQuery({
    queryKey: [...queryKeys.services.all, 'featured', limit],
    queryFn: () => servicesService.getFeaturedServices(limit),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// ============= Cart Hooks =============

export const useCart = () => {
  return useQuery({
    queryKey: queryKeys.cart.items(),
    queryFn: cartService.getCart,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCartCount = () => {
  return useQuery({
    queryKey: queryKeys.cart.count(),
    queryFn: cartService.getCartCount,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCartActions = () => {
  const addToCartMutation = useMutation({
    mutationFn: (item: AddToCartRequest) => cartService.addToCart(item),
    onSuccess: () => {
      invalidateQueries.cart();
    },
  });

  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: UpdateCartItemRequest }) =>
      cartService.updateCartItem(itemId, updates),
    onSuccess: () => {
      invalidateQueries.cart();
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: string) => cartService.removeFromCart(itemId),
    onSuccess: () => {
      invalidateQueries.cart();
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: () => {
      invalidateQueries.cart();
    },
  });

  const applyCouponMutation = useMutation({
    mutationFn: (couponCode: string) => cartService.applyCoupon(couponCode),
    onSuccess: () => {
      invalidateQueries.cart();
    },
  });

  return {
    addToCart: addToCartMutation.mutateAsync,
    updateCartItem: updateCartItemMutation.mutateAsync,
    removeFromCart: removeFromCartMutation.mutateAsync,
    clearCart: clearCartMutation.mutateAsync,
    applyCoupon: applyCouponMutation.mutateAsync,
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingCart: updateCartItemMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending,
    addToCartError: addToCartMutation.error,
  };
};

// ============= Bookings Hooks =============

export const useBookings = (params: Parameters<typeof bookingsService.getBookings>[0] = {}) => {
  return useQuery({
    queryKey: queryKeys.bookings.list(params as Record<string, unknown>),
    queryFn: () => bookingsService.getBookings(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useMyBookings = (params: Parameters<typeof bookingsService.getMyBookings>[0] = {}) => {
  return useQuery({
    queryKey: [...queryKeys.bookings.all, 'my-bookings', params],
    queryFn: () => bookingsService.getMyBookings(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useBooking = (id: string) => {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingsService.getBooking(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useAvailableTimeSlots = (serviceId: string, date: string) => {
  return useQuery({
    queryKey: [...queryKeys.services.detail(serviceId), 'time-slots', date],
    queryFn: () => bookingsService.getAvailableTimeSlots(serviceId, date),
    enabled: !!serviceId && !!date,
    staleTime: 1000 * 60 * 1, // 1 minute (time slots change frequently)
  });
};

export const useBookingActions = () => {
  const queryClient = useQueryClient();

  const createBookingMutation = useMutation({
    mutationFn: (bookingData: Parameters<typeof bookingsService.createBooking>[0]) =>
      bookingsService.createBooking(bookingData),
    onSuccess: () => {
      invalidateQueries.bookings();
      invalidateQueries.cart(); // Clear cart after successful booking
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof bookingsService.updateBooking>[1] }) =>
      bookingsService.updateBooking(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
      invalidateQueries.bookings();
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      bookingsService.cancelBooking(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
      invalidateQueries.bookings();
    },
  });

  const rescheduleBookingMutation = useMutation({
    mutationFn: ({ id, newDate, newTimeSlot, reason }: { 
      id: string; 
      newDate: string; 
      newTimeSlot: { startTime: string; endTime: string; isAvailable: boolean }; 
      reason?: string 
    }) => bookingsService.rescheduleBooking(id, newDate, newTimeSlot, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
      invalidateQueries.bookings();
    },
  });

  return {
    createBooking: createBookingMutation.mutateAsync,
    updateBooking: updateBookingMutation.mutateAsync,
    cancelBooking: cancelBookingMutation.mutateAsync,
    rescheduleBooking: rescheduleBookingMutation.mutateAsync,
    isCreatingBooking: createBookingMutation.isPending,
    isUpdatingBooking: updateBookingMutation.isPending,
    isCancellingBooking: cancelBookingMutation.isPending,
    createBookingError: createBookingMutation.error,
  };
};

// ============= Users Hooks =============

export const useUserProfile = () => {
  return useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: usersService.getProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUserAddresses = () => {
  return useQuery({
    queryKey: queryKeys.users.addresses(),
    queryFn: usersService.getAddresses,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useUserAddress = (id: string) => {
  return useQuery({
    queryKey: queryKeys.users.address(id),
    queryFn: () => usersService.getAddress(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useUserActions = () => {
  const updateProfileMutation = useMutation({
    mutationFn: (updates: Parameters<typeof usersService.updateProfile>[0]) =>
      usersService.updateProfile(updates),
    onSuccess: () => {
      invalidateQueries.users();
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: (addressData: CreateAddressRequest) => usersService.addAddress(addressData),
    onSuccess: () => {
      invalidateQueries.userAddresses();
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateAddressRequest }) =>
      usersService.updateAddress(id, updates),
    onSuccess: () => {
      invalidateQueries.userAddresses();
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => usersService.deleteAddress(id),
    onSuccess: () => {
      invalidateQueries.userAddresses();
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: (id: string) => usersService.setDefaultAddress(id),
    onSuccess: () => {
      invalidateQueries.userAddresses();
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      usersService.changePassword(currentPassword, newPassword),
  });

  return {
    updateProfile: updateProfileMutation.mutateAsync,
    addAddress: addAddressMutation.mutateAsync,
    updateAddress: updateAddressMutation.mutateAsync,
    deleteAddress: deleteAddressMutation.mutateAsync,
    setDefaultAddress: setDefaultAddressMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    isAddingAddress: addAddressMutation.isPending,
    isUpdatingAddress: updateAddressMutation.isPending,
    isDeletingAddress: deleteAddressMutation.isPending,
    updateProfileError: updateProfileMutation.error,
  };
};

// ============= Coupons Hooks =============

export const useAvailableCoupons = (serviceId?: string) => {
  return useQuery({
    queryKey: [...queryKeys.coupons.all, 'available', serviceId],
    queryFn: () => couponsService.getAvailableCoupons(serviceId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCoupons = (params: Parameters<typeof couponsService.getCoupons>[0] = {}) => {
  return useQuery({
    queryKey: queryKeys.coupons.list(params as Record<string, unknown>),
    queryFn: () => couponsService.getCoupons(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useValidateCoupon = () => {
  const validateCouponMutation = useMutation({
    mutationFn: (request: Parameters<typeof couponsService.validateCoupon>[0]) =>
      couponsService.validateCoupon(request),
  });

  return {
    validateCoupon: validateCouponMutation.mutateAsync,
    isValidating: validateCouponMutation.isPending,
    validationError: validateCouponMutation.error,
    validationResult: validateCouponMutation.data,
  };
};

// ============= Reviews Hooks =============

export const useServiceReviews = (serviceId: string) => {
  return useQuery({
    queryKey: queryKeys.reviews.service(serviceId),
    queryFn: () => reviewsService.getServiceReviews(serviceId),
    enabled: !!serviceId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// ============= Dashboard Hooks (Admin) =============

export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.getDashboardStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useDashboardAnalytics = (period: string) => {
  return useQuery({
    queryKey: queryKeys.dashboard.analytics(period),
    queryFn: () => dashboardService.getRevenueAnalytics({
      groupBy: period as 'day' | 'week' | 'month'
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};