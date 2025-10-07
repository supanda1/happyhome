/**
 * Cart API service
 */

import { apiClient } from '../api-client';
import type { ApiResponse } from '../../types/index.ts';

export interface CartItem {
  id: string;
  serviceId: string;
  serviceName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  basePrice: number;
  discountedPrice?: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCartRequest {
  serviceId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export const cartService = {
  /**
   * Get user's cart
   */
  async getCart(): Promise<Cart> {
    const response = await apiClient.get<ApiResponse<Cart>>('/cart');
    return response.data!;
  },

  /**
   * Add item to cart
   */
  async addToCart(item: AddToCartRequest): Promise<CartItem> {
    const response = await apiClient.post<ApiResponse<CartItem>>('/cart/items', item);
    return response.data!;
  },

  /**
   * Update cart item quantity
   */
  async updateCartItem(itemId: string, updates: UpdateCartItemRequest): Promise<CartItem> {
    const response = await apiClient.put<ApiResponse<CartItem>>(`/cart/items/${itemId}`, updates);
    return response.data!;
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(itemId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/cart/items/${itemId}`);
  },

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<void> {
    await apiClient.delete<ApiResponse<void>>('/cart');
  },

  /**
   * Get cart item count
   */
  async getCartCount(): Promise<number> {
    const cart = await this.getCart();
    return cart.totalItems;
  },

  /**
   * Apply coupon to cart
   */
  async applyCoupon(couponCode: string): Promise<Cart> {
    const response = await apiClient.post<ApiResponse<Cart>>('/cart/apply-coupon', { 
      couponCode 
    });
    return response.data!;
  },

  /**
   * Remove coupon from cart
   */
  async removeCoupon(): Promise<Cart> {
    const response = await apiClient.delete<ApiResponse<Cart>>('/cart/coupon');
    return response.data!;
  },
};

export default cartService;