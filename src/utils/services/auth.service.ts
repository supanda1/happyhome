/**
 * Authentication API service
 */

import { apiClient } from '../api-client';
import type { User, ApiResponse } from '../../types/index.ts';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: 'customer' | 'admin'; // Make role optional, defaults to customer
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export const authService = {
  /**
   * User login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials
    );
    
    // Store tokens in the API client
    if (!response.data) {
      throw new Error('Failed to login: No response data received');
    }
    const { accessToken, refreshToken } = response.data;
    apiClient.setTokens(accessToken, refreshToken);
    
    return response.data;
  },

  /**
   * User registration
   */
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    // Convert camelCase to snake_case for backend
    const backendData = {
      email: userData.email,
      password: userData.password,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
      role: userData.role || 'customer'
    };
    
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/register',
      backendData
    );
    
    // Store tokens in the API client
    if (!response.data) {
      throw new Error('Failed to register user: No response data received');
    }
    const { accessToken, refreshToken } = response.data;
    apiClient.setTokens(accessToken, refreshToken);
    
    return response.data;
  },

  /**
   * User logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      console.warn('Logout request failed:', error);
    } finally {
      apiClient.clearTokens();
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenValue: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
      '/auth/refresh',
      { refresh_token: refreshTokenValue }
    );
    
    // Update tokens in the API client
    if (!response.data) {
      throw new Error('Failed to refresh token: No response data received');
    }
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    apiClient.setTokens(accessToken, newRefreshToken);
    
    return response.data;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
    if (!response.data) {
      throw new Error('Failed to get user profile: No response data received');
    }
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: UpdateProfileRequest): Promise<User> {
    // Convert camelCase to snake_case for backend
    const backendUpdates: {
      first_name?: string;
      last_name?: string;
      phone?: string;
    } = {};
    if (updates.firstName !== undefined) backendUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) backendUpdates.last_name = updates.lastName;
    if (updates.phone !== undefined) backendUpdates.phone = updates.phone;
    
    const response = await apiClient.patch<ApiResponse<User>>(
      '/auth/profile',
      backendUpdates
    );
    if (!response.data) {
      throw new Error('Failed to update user profile: No response data received');
    }
    return response.data;
  },

  /**
   * Change password
   */
  async changePassword(passwords: ChangePasswordRequest): Promise<void> {
    // Convert camelCase to snake_case for backend
    const backendData = {
      current_password: passwords.currentPassword,
      new_password: passwords.newPassword
    };
    
    await apiClient.post<ApiResponse<void>>('/auth/change-password', backendData);
  },

  /**
   * Request password reset
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/auth/forgot-password', request);
  },

  /**
   * Reset password with token
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/auth/reset-password', request);
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/auth/verify-email', { token });
  },

  /**
   * Resend email verification
   */
  async resendVerification(): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/auth/resend-verification');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  },

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return apiClient.getAccessToken();
  },
};

export default authService;