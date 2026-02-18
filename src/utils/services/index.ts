/**
 * API Services index - Export all service modules
 */

export { authService } from './auth.service';
export { servicesService } from './services.service';
export { bookingsService } from './bookings.service';
export { reviewsService } from './reviews.service';
export { couponsService } from './coupons.service';
export { dashboardService } from './dashboard.service';
export { cartService } from './cart.service';
export { usersService } from './users.service';

// Export types for convenience
export type {
  // Auth types would be defined in individual service files if needed
  // Add any additional service-specific types here
} from '../types/index.ts';

// Re-export API client for advanced usage
export { apiClient } from '../api-client';
export { queryClient, queryKeys, invalidateQueries } from '../query-client';
export { config } from '../config';
export * from '../errors';