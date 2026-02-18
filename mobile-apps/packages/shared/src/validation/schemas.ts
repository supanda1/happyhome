import { z } from 'zod';
import { APP_CONSTANTS } from '../constants/app';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(APP_CONSTANTS.VALIDATION.PHONE_REGEX, 'Please enter a valid phone number'),
  password: z.string().regex(APP_CONSTANTS.VALIDATION.PASSWORD_REGEX, 'Password must meet security requirements'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Address schema
export const addressSchema = z.object({
  label: z.string().min(1, 'Address label is required'),
  addressLine1: z.string().min(5, 'Address must be at least 5 characters'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(APP_CONSTANTS.VALIDATION.PINCODE_REGEX, 'Please enter a valid pincode'),
});

// Booking schema
export const bookingSchema = z.object({
  serviceId: z.string().min(1, 'Please select a service'),
  addressId: z.string().min(1, 'Please select an address'),
  scheduledDate: z.string().min(1, 'Please select a date'),
  scheduledTime: z.string().min(1, 'Please select a time'),
  specialInstructions: z.string().optional(),
});

// Review schema
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Please provide a rating').max(5),
  review: z.string().min(10, 'Review must be at least 10 characters').optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;