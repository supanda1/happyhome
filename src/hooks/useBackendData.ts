// Custom hooks to replace localStorage with backend API calls
import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config/app.config';

// Categories Hook - Replace localStorage categories with backend
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            { id: 'b181c7f3-03cd-43ea-9fcd-85368fbfa628', name: 'Plumbing', icon: '🔧' },
            { id: '5750b6f5-0a36-4839-8b5d-783aa5f4a40a', name: 'Electrical', icon: '⚡' },
            { id: '48857699-7785-4875-a787-d1f0b7d2f28c', name: 'Cleaning', icon: '🧹' },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        // Use minimal fallback for functionality
        setCategories([
          { id: 'b181c7f3-03cd-43ea-9fcd-85368fbfa628', name: 'Plumbing', icon: '🔧' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

// Services Hook - Replace localStorage services with backend
export const useServices = () => {
  const [services, setServices] = useState([]);
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
              category_id: 'b181c7f3-03cd-43ea-9fcd-85368fbfa628',
              subcategory_id: '75b29657-b107-4fa4-a4df-563e388911ad',
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

  const addToCart = async (serviceData: any) => {
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

// Block localStorage usage globally
export const blockLocalStorage = () => {
  if (APP_CONFIG.DEVELOPMENT.WARN_ON_LOCALSTORAGE_USE) {
    // Override localStorage methods to show warnings
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    
    localStorage.setItem = function(key: string, value: string) {
      if (key.includes('happyhomes') && key !== 'happyhomes_token') {
        console.warn(`🚫 BLOCKED: localStorage.setItem('${key}') - Use backend API instead`);
        return;
      }
      originalSetItem.call(this, key, value);
    };
    
    localStorage.getItem = function(key: string) {
      if (key.includes('happyhomes') && key !== 'happyhomes_token') {
        console.warn(`🚫 BLOCKED: localStorage.getItem('${key}') - Use backend API instead`);
        return null;
      }
      return originalGetItem.call(this, key);
    };
  }
};

export default {
  useCategories,
  useServices,
  useCart,
  blockLocalStorage
};