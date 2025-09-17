import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { initializeAllAdminData } from '../../utils/adminDataManager';

// Admin Management Components
import CategoriesManagement from './CategoriesManagement';
import SubcategoriesManagement from './SubcategoriesManagement';
import ServicesManagement from './ServicesManagement';
import BulkUploadManagement from './BulkUploadManagement';
import BannerManagement from './BannerManagement';
import ReviewSettings from './ReviewSettings';
import CouponsManagement from './CouponsManagement';
import ContactSettings from './ContactSettings';
import DashboardStats from './DashboardStats';
import AnalyticsDashboard from './AnalyticsDashboard';
import OffersManagement from './OffersManagement';
import EmployeesManagement from './EmployeesManagement';
import OrdersManagement from './OrdersManagement';
import EngineersWorkloadDashboard from './EngineersWorkloadDashboard';
import NotificationsManagement from './NotificationsManagement';
import ImageManagement from './ImageManagement';
import SMSProviders from './SMSProviders';
import SMSConfiguration from './SMSConfiguration';
import SuperAdminUserManagement from './SuperAdminUserManagement';
import SystemHealthDashboard from './SystemHealthDashboard';

interface AdminPanelProps {
  onCategoryChange?: () => void;
  onContactChange?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onCategoryChange, onContactChange }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [customOrder, setCustomOrder] = useState<string[]>([]);

  const getActiveColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-500 shadow-lg scale-125',
      green: 'bg-green-500 shadow-lg scale-125',
      purple: 'bg-purple-500 shadow-lg scale-125',
      indigo: 'bg-indigo-500 shadow-lg scale-125',
      violet: 'bg-violet-500 shadow-lg scale-125',
      cyan: 'bg-cyan-500 shadow-lg scale-125',
      amber: 'bg-amber-500 shadow-lg scale-125',
      emerald: 'bg-emerald-500 shadow-lg scale-125',
      rose: 'bg-rose-500 shadow-lg scale-125',
      orange: 'bg-orange-500 shadow-lg scale-125',
      yellow: 'bg-yellow-500 shadow-lg scale-125',
      pink: 'bg-pink-500 shadow-lg scale-125',
      teal: 'bg-teal-500 shadow-lg scale-125',
      slate: 'bg-slate-500 shadow-lg scale-125',
      sky: 'bg-sky-500 shadow-lg scale-125',
      red: 'bg-red-500 shadow-lg scale-125',
      lime: 'bg-lime-500 shadow-lg scale-125',
    };
    return colorMap[color] || 'bg-gray-500 shadow-lg scale-125';
  };

  const getInactiveColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-400 group-hover:bg-blue-500 group-hover:scale-110',
      green: 'bg-green-400 group-hover:bg-green-500 group-hover:scale-110',
      purple: 'bg-purple-400 group-hover:bg-purple-500 group-hover:scale-110',
      indigo: 'bg-indigo-400 group-hover:bg-indigo-500 group-hover:scale-110',
      violet: 'bg-violet-400 group-hover:bg-violet-500 group-hover:scale-110',
      cyan: 'bg-cyan-400 group-hover:bg-cyan-500 group-hover:scale-110',
      amber: 'bg-amber-400 group-hover:bg-amber-500 group-hover:scale-110',
      emerald: 'bg-emerald-400 group-hover:bg-emerald-500 group-hover:scale-110',
      rose: 'bg-rose-400 group-hover:bg-rose-500 group-hover:scale-110',
      orange: 'bg-orange-400 group-hover:bg-orange-500 group-hover:scale-110',
      yellow: 'bg-yellow-400 group-hover:bg-yellow-500 group-hover:scale-110',
      pink: 'bg-pink-400 group-hover:bg-pink-500 group-hover:scale-110',
      teal: 'bg-teal-400 group-hover:bg-teal-500 group-hover:scale-110',
      slate: 'bg-slate-400 group-hover:bg-slate-500 group-hover:scale-110',
      sky: 'bg-sky-400 group-hover:bg-sky-500 group-hover:scale-110',
      red: 'bg-red-400 group-hover:bg-red-500 group-hover:scale-110',
    };
    return colorMap[color] || 'bg-gray-400 group-hover:bg-gray-500 group-hover:scale-110';
  };

  // Load custom order from backend
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch('/api/admin/user-preferences', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.menu_order) {
            setCustomOrder(data.data.menu_order);
          }
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };
    
    loadUserPreferences();
  }, [user?.id]);

  // Initialize admin data and redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin' && (user.role as string) !== 'super_admin') {
      alert('Access denied. Admin privileges required.');
      window.location.href = '/';
    } else if (user && (user.role === 'admin' || (user.role as string) === 'super_admin')) {
      // Initialize admin data when admin or super admin logs in
      initializeAllAdminData();
    }
  }, [user]);

  const baseMenuItems = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      color: 'blue', 
      component: DashboardStats,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: 'system-health', 
      name: 'System Health', 
      color: 'red', 
      component: SystemHealthDashboard,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'analytics', 
      name: 'Dashboard Analytics', 
      color: 'violet', 
      component: AnalyticsDashboard,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: 'contact', 
      name: 'Contact Settings', 
      color: 'green', 
      component: ContactSettings,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    },
    { 
      id: 'orders', 
      name: 'Orders', 
      color: 'indigo', 
      component: OrdersManagement,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    { 
      id: 'notifications', 
      name: 'Notifications', 
      color: 'red', 
      component: NotificationsManagement,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a7 7 0 11-9.9-9.9m0 0L4 14h7v7M9 1l6 6-6 6" />
        </svg>
      )
    },
    { 
      id: 'sms-config', 
      name: 'SMS Configuration', 
      color: 'orange', 
      component: SMSConfiguration,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    { 
      id: 'sms-providers', 
      name: 'SMS Providers', 
      color: 'lime', 
      component: SMSProviders,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      )
    },
    { 
      id: 'categories', 
      name: 'Categories', 
      color: 'purple', 
      component: CategoriesManagement,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    { 
      id: 'subcategories', 
      name: 'Subcategories', 
      color: 'cyan', 
      component: SubcategoriesManagement,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      )
    },
    { 
      id: 'services', 
      name: 'Services', 
      color: 'teal', 
      component: ServicesManagement,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      )
    },
    { 
      id: 'employees', 
      name: 'Employees', 
      color: 'amber', 
      component: EmployeesManagement,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      )
    },
    { 
      id: 'workload', 
      name: 'Engineer Workload', 
      color: 'emerald', 
      component: EngineersWorkloadDashboard,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    { 
      id: 'bulk-upload', 
      name: 'Bulk Upload', 
      color: 'rose', 
      component: BulkUploadManagement,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    },
    { 
      id: 'images', 
      name: 'Image Management', 
      color: 'sky', 
      component: ImageManagement,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: 'banners', 
      name: 'Home Banners', 
      color: 'slate', 
      component: BannerManagement,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 12l2 2 4-4" />
        </svg>
      )
    },
    { 
      id: 'reviews', 
      name: 'Review Settings', 
      color: 'yellow', 
      component: ReviewSettings,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    { 
      id: 'coupons', 
      name: 'Coupons', 
      color: 'pink', 
      component: CouponsManagement,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      )
    },
    { 
      id: 'offers', 
      name: 'Offers Management', 
      color: 'violet', 
      component: OffersManagement,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  // Add Super Admin menu items for super_admin users only
  const superAdminItems = (user?.role as string) === 'super_admin' ? [
    { 
      id: 'user-management', 
      name: 'Super Admin', 
      color: 'red', 
      component: SuperAdminUserManagement,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
  ] : [];

  // Apply custom ordering if available
  const applyCustomOrder = (items: any[]) => {
    if (customOrder.length === 0) return items;
    
    // Create a map for quick lookup
    const itemMap = new Map(items.map(item => [item.id, item]));
    
    // First, add items in custom order
    const orderedItems = customOrder
      .map(id => itemMap.get(id))
      .filter(Boolean);
    
    // Then add any new items that weren't in the custom order
    const remainingItems = items.filter(item => !customOrder.includes(item.id));
    
    return [...orderedItems, ...remainingItems];
  };

  const allMenuItems = [...baseMenuItems, ...superAdminItems];
  const menuItems = applyCustomOrder(allMenuItems);

  // Save custom order to backend
  const saveCustomOrder = async (newOrder: string[]) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/admin/user-preferences', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menu_order: newOrder
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomOrder(newOrder);
          console.log('✅ Menu order saved successfully');
        } else {
          console.error('❌ Failed to save menu order:', data.error);
        }
      } else {
        console.error('❌ Failed to save menu order: HTTP', response.status);
      }
    } catch (error) {
      console.error('❌ Error saving menu order:', error);
    }
  };

  // Move item up in order
  const moveItemUp = async (index: number) => {
    if (index > 0) {
      const newOrder = [...menuItems.map(item => item.id)];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      await saveCustomOrder(newOrder);
    }
  };

  // Move item down in order
  const moveItemDown = async (index: number) => {
    if (index < menuItems.length - 1) {
      const newOrder = [...menuItems.map(item => item.id)];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      await saveCustomOrder(newOrder);
    }
  };

  // Reset to default order
  const resetToDefaultOrder = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/admin/user-preferences', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menu_order: [] // Empty array resets to default
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomOrder([]);
          setShowOrderModal(false);
          console.log('✅ Menu order reset to default');
        } else {
          console.error('❌ Failed to reset menu order:', data.error);
        }
      } else {
        console.error('❌ Failed to reset menu order: HTTP', response.status);
      }
    } catch (error) {
      console.error('❌ Error resetting menu order:', error);
    }
  };

  const ActiveComponent = menuItems.find(item => item.id === activeTab)?.component || DashboardStats;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Please Login</h2>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin' && (user.role as string) !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Admin privileges required to access this panel</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-gradient-to-b from-white to-gray-50 shadow-2xl transition-all duration-300 relative border-r border-gray-100 ${sidebarOpen ? 'w-72' : 'w-20'}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-purple-50">
          {/* Title Section */}
          {sidebarOpen && (
            <div className="mb-4">
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 tracking-tight">Happy Homes</h1>
              <p className="text-sm font-bold text-gray-600 tracking-widest uppercase">Admin Panel</p>
            </div>
          )}
          
          {/* Control Buttons Section */}
          <div className="flex items-center justify-center space-x-2">
            {/* Health Status Indicator */}
            <div className="relative group">
              <button 
                onClick={() => setActiveTab('system-health')}
                className="flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all transform hover:scale-105 shadow-lg"
                title="System Health"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-bold whitespace-nowrap">Healthy</span>
              </button>
            </div>
            
            {/* Menu Order Button - Super Admin Only */}
            {(user?.role as string) === 'super_admin' && (
              <div className="relative group">
                <button 
                  onClick={() => setShowOrderModal(true)}
                  className="flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white transition-all transform hover:scale-105 shadow-lg"
                  title="Customize menu order"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-bold whitespace-nowrap">Order</span>
                </button>
              </div>
            )}
            
            {/* Sidebar Toggle Button */}
            <div className="relative group">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white transition-all transform hover:scale-105 shadow-lg"
                title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              >
                {sidebarOpen ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                    <span className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-bold whitespace-nowrap">Hide</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    <span className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-bold whitespace-nowrap">Show</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-6 flex-1 pb-32">
          <ul className="space-y-3">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-orange-50 to-purple-50 text-orange-700 border-l-4 border-orange-600 shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-orange-50 hover:text-gray-900 hover:shadow-md'
                  }`}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <div className="flex items-center space-x-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 transition-all duration-200 ${
                      activeTab === item.id ? 'text-orange-600' : 'text-gray-500 group-hover:text-orange-500'
                    }`}>
                      {item.icon}
                    </div>
                    
                    {/* Text - only show when sidebar is open */}
                    {sidebarOpen && (
                      <span className="font-semibold tracking-wide truncate">{item.name}</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500 font-medium tracking-wide">
                    {(user?.role as string) === 'super_admin' ? 'SUPER ADMINISTRATOR' : 'ADMINISTRATOR'}
                  </p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="px-3 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md font-bold text-xs tracking-wide"
                title="Logout"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <button 
                onClick={logout}
                className="px-2 py-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg transition-all transform hover:scale-110 shadow-md font-bold text-xs"
                title="Logout"
              >
                OUT
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Top Header Bar */}
        <div className="bg-white shadow-sm border-b border-gray-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">{activeTab.replace('-', ' ')}</h2>
              <p className="text-gray-600 text-sm font-medium">Manage your {activeTab.replace('-', ' ')} efficiently</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-medium">System Online</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'orders' ? (
              <OrdersManagement />
            ) : activeTab === 'categories' ? (
              <CategoriesManagement onCategoryChange={onCategoryChange} />
            ) : activeTab === 'subcategories' ? (
              <SubcategoriesManagement onCategoryChange={onCategoryChange} />
            ) : activeTab === 'services' ? (
              <ServicesManagement onServiceChange={onCategoryChange} />
            ) : activeTab === 'employees' ? (
              <EmployeesManagement />
            ) : activeTab === 'contact' ? (
              <ContactSettings onContactChange={onContactChange} />
            ) : activeTab === 'notifications' ? (
              <NotificationsManagement onNavigate={setActiveTab} />
            ) : activeTab === 'sms-config' ? (
              <SMSConfiguration />
            ) : (
              <ActiveComponent />
            )}
          </div>
        </div>
      </div>

      {/* Customize Order Modal */}
      {showOrderModal && (user?.role as string) === 'super_admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Customize Menu Order
                </h3>
                <p className="text-gray-600 mt-1">
                  Reorder admin panel menu items to your preference
                </p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-3">
                {menuItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 text-gray-600 ${item.color === 'blue' ? 'text-blue-600' : 
                        item.color === 'green' ? 'text-green-600' : 
                        item.color === 'purple' ? 'text-purple-600' :
                        item.color === 'indigo' ? 'text-indigo-600' :
                        item.color === 'violet' ? 'text-violet-600' :
                        item.color === 'cyan' ? 'text-cyan-600' :
                        item.color === 'amber' ? 'text-amber-600' :
                        item.color === 'emerald' ? 'text-emerald-600' :
                        item.color === 'rose' ? 'text-rose-600' :
                        item.color === 'orange' ? 'text-orange-600' :
                        item.color === 'yellow' ? 'text-yellow-600' :
                        item.color === 'pink' ? 'text-pink-600' :
                        item.color === 'teal' ? 'text-teal-600' :
                        item.color === 'slate' ? 'text-slate-600' :
                        item.color === 'sky' ? 'text-sky-600' :
                        item.color === 'red' ? 'text-red-600' :
                        item.color === 'lime' ? 'text-lime-600' : 'text-gray-600'
                      }`}>
                        <div className="w-5 h-5">
                          {item.icon}
                        </div>
                      </div>
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveItemUp(index)}
                        disabled={index === 0}
                        className={`px-3 py-1 rounded-md text-sm font-semibold transition-all ${
                          index === 0 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transform hover:scale-105'
                        }`}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveItemDown(index)}
                        disabled={index === menuItems.length - 1}
                        className={`px-3 py-1 rounded-md text-sm font-semibold transition-all ${
                          index === menuItems.length - 1
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transform hover:scale-105'
                        }`}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between">
              <button
                onClick={resetToDefaultOrder}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-200 mr-3"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setShowOrderModal(false)}
                className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                Save Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;