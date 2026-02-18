import { createApi, fetchBaseQuery, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { getConfig } from '../../config/environment';
import { AuthTokens, ApiResponse } from '../../types';
import { RootState } from '../index';

interface CustomError {
  status: number;
  type: string;
  message: string;
  errors?: Record<string, string[]>;
}

// Base query with auth and error handling
const baseQuery = fetchBaseQuery({
  baseUrl: getConfig().api_base_url,
  prepareHeaders: (headers, { getState }) => {
    // Get token from Redux state
    const token = (getState() as RootState).auth.tokens?.access_token;
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    // Add common headers
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('X-Client-Platform', 'mobile');
    headers.set('X-Client-Version', '1.0.0');
    
    return headers;
  },
});

// Base query with re-auth logic
const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Try to get a new token
    const refreshToken = (api.getState() as RootState).auth.tokens?.refresh_token;
    
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions
      );
      
      if (refreshResult.data) {
        // Store the new token
        const response = refreshResult.data as ApiResponse<{ tokens: AuthTokens }>;
        api.dispatch({
          type: 'auth/setTokens',
          payload: response.data?.tokens,
        });
        
        // Retry the original query
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed, logout
        api.dispatch({ type: 'auth/logout' });
      }
    } else {
      // No refresh token, logout
      api.dispatch({ type: 'auth/logout' });
    }
  }
  
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Service',
    'Category',
    'Subcategory',
    'Booking',
    'Order',
    'Payment',
    'Engineer',
    'Review',
    'Cart',
    'Notification',
    'Coupon',
    'Analytics',
  ],
  endpoints: () => ({}),
});

// Export hooks
export const {} = apiSlice;