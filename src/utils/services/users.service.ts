/**
 * Users API service
 */

import { apiClient } from '../api-client';
import type { User, Address, ApiResponse } from '../../types/index.ts';

export interface UserAddress extends Address {
  id: string;
  userId: string;
  isDefault: boolean;
  addressType: 'home' | 'work' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAddressRequest {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
  addressType: 'home' | 'work' | 'other';
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  landmark?: string;
  addressType?: 'home' | 'work' | 'other';
  isDefault?: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export const usersService = {
  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: UpdateProfileRequest): Promise<User> {
    // Convert camelCase to snake_case for backend
    const backendUpdates: any = {};
    if (updates.firstName !== undefined) backendUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) backendUpdates.last_name = updates.lastName;
    if (updates.phone !== undefined) backendUpdates.phone = updates.phone;
    
    const response = await apiClient.patch<ApiResponse<User>>('/auth/profile', backendUpdates);
    return response.data;
  },

  /**
   * Get user addresses
   */
  async getAddresses(): Promise<UserAddress[]> {
    const response = await apiClient.get<ApiResponse<UserAddress[]>>('/users/addresses');
    return response.data;
  },

  /**
   * Get address by ID
   */
  async getAddress(id: string): Promise<UserAddress> {
    const response = await apiClient.get<ApiResponse<UserAddress>>(`/users/addresses/${id}`);
    return response.data;
  },

  /**
   * Add new address
   */
  async addAddress(addressData: CreateAddressRequest): Promise<UserAddress> {
    const response = await apiClient.post<ApiResponse<UserAddress>>('/users/addresses', addressData);
    return response.data;
  },

  /**
   * Update address
   */
  async updateAddress(id: string, updates: UpdateAddressRequest): Promise<UserAddress> {
    const response = await apiClient.put<ApiResponse<UserAddress>>(`/users/addresses/${id}`, updates);
    return response.data;
  },

  /**
   * Delete address
   */
  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/users/addresses/${id}`);
  },

  /**
   * Set default address
   */
  async setDefaultAddress(id: string): Promise<UserAddress> {
    const response = await apiClient.patch<ApiResponse<UserAddress>>(`/users/addresses/${id}/set-default`);
    return response.data;
  },

  /**
   * Get default address
   */
  async getDefaultAddress(): Promise<UserAddress | null> {
    try {
      const addresses = await this.getAddresses();
      return addresses.find(addr => addr.isDefault) || null;
    } catch (error) {
      console.error('Error getting default address:', error);
      return null;
    }
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // Convert camelCase to snake_case for backend
    await apiClient.post<ApiResponse<void>>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  },

  /**
   * Upload profile photo
   */
  async uploadProfilePhoto(file: File): Promise<string> {
    const response = await apiClient.uploadFile<ApiResponse<{ url: string }>>(
      '/users/profile/photo',
      file
    );
    return response.data.url;
  },

  /**
   * Delete account
   */
  async deleteAccount(password: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/users/delete-account', { password });
  },

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/users/preferences');
    return response.data;
  },

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: any): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>('/users/preferences', preferences);
    return response.data;
  },
};

export default usersService;