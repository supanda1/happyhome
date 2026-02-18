/**
 * Hooks index - Export all custom hooks
 */

// Comprehensive API hooks (new implementation with all services)
export * from './useAPI';

// Legacy hooks (kept for backward compatibility, but prefer useAPI hooks)
export { authHooks } from './useAuth';
export { servicesHooks } from './useServices';
export { bookingsHooks } from './useBookings';

// Re-export commonly used React Query hooks for convenience
export { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';