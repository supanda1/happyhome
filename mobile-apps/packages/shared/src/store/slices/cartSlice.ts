import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Service, Address } from '../../types';

interface CartState {
  items: CartItem[];
  totalAmount: number;
  discountAmount: number;
  couponCode: string | null;
  couponDiscount: number;
  estimatedDuration: number;
  selectedAddress: Address | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  totalAmount: 0,
  discountAmount: 0,
  couponCode: null,
  couponDiscount: 0,
  estimatedDuration: 0,
  selectedAddress: null,
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Add item to cart
    addItem: (state, action: PayloadAction<{
      service: Service;
      quantity?: number;
      selectedDate?: string;
      selectedTime?: string;
      specialInstructions?: string;
    }>) => {
      const { service, quantity = 1, selectedDate, selectedTime, specialInstructions } = action.payload;
      
      const existingItemIndex = state.items.findIndex(item => item.service_id === service.id);
      
      if (existingItemIndex !== -1) {
        // Update existing item
        state.items[existingItemIndex].quantity += quantity;
        if (selectedDate) state.items[existingItemIndex].selected_date = selectedDate;
        if (selectedTime) state.items[existingItemIndex].selected_time = selectedTime;
        if (specialInstructions) state.items[existingItemIndex].special_instructions = specialInstructions;
      } else {
        // Add new item
        const newItem: CartItem = {
          service_id: service.id,
          service,
          quantity,
          selected_date: selectedDate,
          selected_time: selectedTime,
          special_instructions: specialInstructions,
        };
        state.items.push(newItem);
      }
      
      cartSlice.caseReducers.calculateTotals(state);
    },

    // Remove item from cart
    removeItem: (state, action: PayloadAction<string>) => {
      const serviceId = action.payload;
      state.items = state.items.filter(item => item.service_id !== serviceId);
      cartSlice.caseReducers.calculateTotals(state);
    },

    // Update item quantity
    updateItemQuantity: (state, action: PayloadAction<{ serviceId: string; quantity: number }>) => {
      const { serviceId, quantity } = action.payload;
      const itemIndex = state.items.findIndex(item => item.service_id === serviceId);
      
      if (itemIndex !== -1) {
        if (quantity <= 0) {
          state.items.splice(itemIndex, 1);
        } else {
          state.items[itemIndex].quantity = quantity;
        }
        cartSlice.caseReducers.calculateTotals(state);
      }
    },

    // Update item details
    updateItem: (state, action: PayloadAction<{
      serviceId: string;
      selectedDate?: string;
      selectedTime?: string;
      specialInstructions?: string;
      addressId?: string;
    }>) => {
      const { serviceId, ...updates } = action.payload;
      const itemIndex = state.items.findIndex(item => item.service_id === serviceId);
      
      if (itemIndex !== -1) {
        Object.assign(state.items[itemIndex], updates);
      }
    },

    // Clear cart
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.discountAmount = 0;
      state.couponCode = null;
      state.couponDiscount = 0;
      state.estimatedDuration = 0;
      state.error = null;
    },

    // Apply coupon
    applyCoupon: (state, action: PayloadAction<{
      code: string;
      discount: number;
      discountType: 'percentage' | 'fixed';
    }>) => {
      const { code, discount, discountType } = action.payload;
      state.couponCode = code;
      
      if (discountType === 'percentage') {
        state.couponDiscount = (state.totalAmount * discount) / 100;
      } else {
        state.couponDiscount = discount;
      }
      
      state.discountAmount = state.couponDiscount;
    },

    // Remove coupon
    removeCoupon: (state) => {
      state.couponCode = null;
      state.couponDiscount = 0;
      state.discountAmount = 0;
    },

    // Set selected address
    setSelectedAddress: (state, action: PayloadAction<Address>) => {
      state.selectedAddress = action.payload;
    },

    // Calculate totals
    calculateTotals: (state) => {
      state.totalAmount = state.items.reduce((total, item) => {
        const price = item.service.discount_price || item.service.price;
        return total + (price * item.quantity);
      }, 0);

      state.estimatedDuration = state.items.reduce((total, item) => {
        return total + (item.service.duration_minutes * item.quantity);
      }, 0);

      // Recalculate discount if coupon is applied
      if (state.couponCode && state.couponDiscount > 0) {
        // Keep the existing discount calculation logic
        state.discountAmount = state.couponDiscount;
      }
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Sync cart with server response
    syncCart: (state, action: PayloadAction<{
      items: CartItem[];
      totalAmount: number;
      discountAmount: number;
      couponCode?: string;
    }>) => {
      const { items, totalAmount, discountAmount, couponCode } = action.payload;
      state.items = items;
      state.totalAmount = totalAmount;
      state.discountAmount = discountAmount;
      state.couponCode = couponCode || null;
    },

    // Reset cart state
    resetCart: () => initialState,
  },
});

export const {
  addItem,
  removeItem,
  updateItemQuantity,
  updateItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  setSelectedAddress,
  calculateTotals,
  setLoading,
  setError,
  syncCart,
  resetCart,
} = cartSlice.actions;

export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotal = (state: { cart: CartState }) => state.cart.totalAmount;
export const selectCartDiscount = (state: { cart: CartState }) => state.cart.discountAmount;
export const selectCartItemCount = (state: { cart: CartState }) => 
  state.cart.items.reduce((count, item) => count + item.quantity, 0);
export const selectCartFinalAmount = (state: { cart: CartState }) => 
  state.cart.totalAmount - state.cart.discountAmount;
export const selectCartEstimatedDuration = (state: { cart: CartState }) => state.cart.estimatedDuration;
export const selectSelectedAddress = (state: { cart: CartState }) => state.cart.selectedAddress;
export const selectCartLoading = (state: { cart: CartState }) => state.cart.isLoading;
export const selectCartError = (state: { cart: CartState }) => state.cart.error;
export const selectAppliedCoupon = (state: { cart: CartState }) => state.cart.couponCode;