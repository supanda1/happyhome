// Custom hooks to replace localStorage with backend API calls
import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config/app.config';
import type { AddToCartRequest } from '../utils/services/cart.service';
import type { ServiceCategory, Service } from '../types';

// Categories Hook - Replace localStorage categories with backend
export const useCategories = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!APP_CONFIG.FORCE_BACKEND_API) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${APP_CONFIG.API_BASE_URL}/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.data || []);
        } else {
          console.warn('Categories API failed, using fallback data');
          // Fallback to essential categories for functionality
          setCategories([
            {
              id: 'b181c7f3-03cd-43ea-9fcd-85368fbfa628',
              name: 'Plumbing',
              description: 'Plumbing repair and installation services',
              icon: '🔧',
              isActive: true,
              sortOrder: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: '5750b6f5-0a36-4839-8b5d-783aa5f4a40a',
              name: 'Electrical',
              description: 'Electrical repair and installation services',
              icon: '⚡',
              isActive: true,
              sortOrder: 2,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: '48857699-7785-4875-a787-d1f0b7d2f28c',
              name: 'Cleaning',
              description: 'Professional cleaning services',
              icon: '🧹',
              isActive: true,
              sortOrder: 3,
              createdAt: new Date(),
              updatedAt: new Date()
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        // Use minimal fallback for functionality
        setCategories([
          {
            id: 'b181c7f3-03cd-43ea-9fcd-85368fbfa628',
            name: 'Plumbing',
            description: 'Plumbing repair and installation services',
            icon: '🔧',
            isActive: true,
            sortOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading };
};

// Services Hook - Replace localStorage services with backend
export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchServices = async () => {
      if (!APP_CONFIG.FORCE_BACKEND_API) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${APP_CONFIG.API_BASE_URL}/services`);
        if (response.ok) {
          const data = await response.json();
          setServices(data.data || []);
        } else {
          console.warn('Services API failed, using fallback');
          // Minimal fallback service
          setServices([
            {
              id: '459218e6-b7c6-4200-a556-e3234b90bc3f',
              name: 'Bath Fittings Installation & Repair',
              categoryId: 'b181c7f3-03cd-43ea-9fcd-85368fbfa628',
              category: {
                id: 'b181c7f3-03cd-43ea-9fcd-85368fbfa628',
                name: 'Plumbing',
                description: 'Plumbing repair and installation services',
                icon: '🔧',
                isActive: true,
                sortOrder: 1,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              description: 'Professional bath fittings installation and repair service',
              shortDescription: 'Bath fittings installation & repair',
              basePrice: 200,
              duration: 120,
              inclusions: ['Installation', 'Basic repair'],
              exclusions: ['Materials cost'],
              photos: [],
              reviews: [],
              rating: 4.5,
              reviewCount: 0,
              isActive: true,
              isFeatured: false,
              tags: ['plumbing', 'fittings'],
              availability: {
                isAvailable: true,
                timeSlots: [],
                blackoutDates: []
              },
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, loading };
};

// Cart Hook - Replace localStorage cart with backend
export const useCart = (userId?: string) => {
  const [cart, setCart] = useState({ items: [], subtotal: 0, finalAmount: 0 });
  const [loading, setLoading] = useState(false);

  const addToCart = async (serviceData: AddToCartRequest) => {
    if (!APP_CONFIG.FORCE_BACKEND_API || !userId) {
      console.warn('Cart add blocked - no backend API or user ID');
      return false;
    }

    try {
      setLoading(true);
      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/cart/${userId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCart(data.data || cart);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to add to cart:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCartData = async () => {
    if (!APP_CONFIG.FORCE_BACKEND_API || !userId) {
      return cart;
    }

    try {
      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/cart/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCart(data.data || cart);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
    return cart;
  };

  return { cart, addToCart, getCartData, loading };
};

// localStorage usage is completely blocked - use safeLocalStorage from app.config.ts instead

export default {
  useCategories,
  useServices,
  useCart
};