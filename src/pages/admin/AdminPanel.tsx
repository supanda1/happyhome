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
import AssignmentManagement from './AssignmentManagement';

interface MenuItem {
  id: string;
  name: string;
  color: string;
  component: React.ComponentType<Record<string, unknown>>;
  icon: React.ReactNode;
}

interface MenuCategory {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
  items: MenuItem[];
}

interface AdminPanelProps {
  onCategoryChange?: () => void;
  onContactChange?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onCategoryChange, onContactChange }) => {
  const { user, logout } = useAuth();
  const [activeCategory, setActiveCategory] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Color class functions removed - unused


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

  const menuCategories: MenuCategory[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      color: 'blue',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      items: [
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
        }
      ]
    },
    {
      id: 'order-management',
      name: 'Order Management',
      color: 'indigo',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      items: [
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
          name: 'Employee Workload', 
          color: 'emerald', 
          component: EngineersWorkloadDashboard,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )
        }
      ]
    },
    {
      id: 'super-admin',
      name: 'Super Admin',
      color: 'purple',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      items: [
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
          id: 'assignments', 
          name: 'Auto Assignment', 
          color: 'cyan', 
          component: AssignmentManagement,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
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
        }
      ]
    }
  ];

  // Add Super Admin User Management for super_admin users only
  if ((user?.role as string) === 'super_admin') {
    const superAdminCategory = menuCategories.find(cat => cat.id === 'super-admin');
    if (superAdminCategory) {
      superAdminCategory.items.push({
        id: 'user-management', 
        name: 'User Management', 
        color: 'red', 
        component: SuperAdminUserManagement,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        )
      });
    }
  }

  // Get current category and its items
  const currentCategory = menuCategories.find(cat => cat.id === activeCategory);
  const currentItems = currentCategory?.items || [];
  
  // Find all menu items across all categories for navigation purposes
  const allMenuItems: MenuItem[] = menuCategories.flatMap(category => category.items);
  
  // Handle category switching
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    const category = menuCategories.find(cat => cat.id === categoryId);
    if (category && category.items.length > 0) {
      setActiveTab(category.items[0].id);
    }
  };
  
  // Handle tab switching within category
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const ActiveComponent = allMenuItems.find(item => item.id === activeTab)?.component || DashboardStats;

  // Custom CSS for enhanced animations
  const customStyles = `
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
      50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.6); }
    }
    
    @keyframes bounce-in {
      0% { transform: translateY(-100px) scale(0.8); opacity: 0; }
      50% { transform: translateY(0px) scale(1.05); opacity: 1; }
      65% { transform: translateY(-10px) scale(1.02); }
      81% { transform: translateY(0px) scale(1); }
      100% { transform: translateY(0px) scale(1); opacity: 1; }
    }
    
    @keyframes slide-in-left {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    .animate-fade-in {
      animation: fade-in 0.8s ease-out;
    }
    
    .animate-pulse-glow {
      animation: pulse-glow 2s infinite;
    }
    
    .animate-bounce-in {
      animation: bounce-in 0.8s ease-out;
    }
    
    .animate-slide-in-left {
      animation: slide-in-left 0.6s ease-out;
    }
  `;

  if (!user) {
    return (
      <>
        <style>{customStyles}</style>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/50 animate-bounce-in">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent mb-2">Please Login</h2>
                <p className="text-gray-600">Admin access required to continue</p>
              </div>
              <button 
                onClick={() => window.location.href = '/login'}
                className="group relative px-8 py-3 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10">Go to Login</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (user.role !== 'admin' && (user.role as string) !== 'super_admin') {
    return (
      <>
        <style>{customStyles}</style>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/50 animate-bounce-in">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-4">Admin privileges required to access this panel</p>
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="group relative px-8 py-3 bg-gradient-to-r from-red-500 via-pink-600 to-rose-600 hover:from-red-600 hover:via-pink-700 hover:to-rose-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10">Go to Home</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex animate-fade-in">
        {/* Sidebar */}
        <div className={`bg-white/80 backdrop-blur-sm shadow-2xl transition-all duration-500 relative border-r border-white/50 ${sidebarOpen ? 'w-72' : 'w-20'} hover:shadow-3xl`}>
        {/* Header */}
        <div className="p-6 border-b border-white/20 bg-gradient-to-r from-orange-50/80 to-purple-50/80 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-r from-orange-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-1 -left-1 w-12 h-12 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-lg"></div>
          {/* Title Section */}
          {sidebarOpen && (
            <div className="mb-4 relative z-10">
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 tracking-tight animate-pulse">Happy Homes</h1>
              <p className="text-base font-bold text-gray-600 tracking-widest uppercase">Admin Panel</p>
            </div>
          )}
          
          {/* Control Buttons Section */}
          <div className="flex items-center justify-center space-x-2 relative z-10">
            {/* Health Status Indicator */}
            <div className="relative group">
              <button 
                onClick={() => setActiveTab('system-health')}
                className="flex items-center px-3 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-2xl overflow-hidden"
                title="System Health"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm font-bold whitespace-nowrap relative z-10">Healthy</span>
              </button>
            </div>
            
            
            {/* Sidebar Toggle Button */}
            <div className="relative group">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-2xl overflow-hidden"
                title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {sidebarOpen ? (
                  <>
                    <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                    <span className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm font-bold whitespace-nowrap relative z-10">Hide</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    <span className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm font-bold whitespace-nowrap relative z-10">Show</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-6 flex-1 pb-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none"></div>
          
          {/* Category Selection */}
          <div className="mb-6 relative z-10">
            {sidebarOpen && (
              <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Categories</h3>
            )}
            <div className="space-y-2">
              {menuCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`w-full flex items-center px-4 py-2 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-blue-100/80 to-indigo-100/80 backdrop-blur-sm text-blue-700 border-l-4 border-blue-600 shadow-lg transform scale-105'
                      : 'text-gray-600 hover:bg-gradient-to-r hover:from-white/60 hover:to-blue-50/60 hover:text-gray-800 hover:shadow-md hover:transform hover:scale-105'
                  }`}
                  title={!sidebarOpen ? category.name : undefined}
                >
                  {activeCategory === category.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 animate-pulse"></div>
                  )}
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className={`flex-shrink-0 transition-all duration-300 transform ${
                      activeCategory === category.id 
                        ? 'text-blue-600 scale-110' 
                        : 'text-gray-400 group-hover:text-blue-500 group-hover:scale-110'
                    }`}>
                      {category.icon}
                    </div>
                    {sidebarOpen && (
                      <span className="font-semibold tracking-wide truncate text-sm animate-fade-in">{category.name}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Category Items */}
          <div className="relative z-10">
            {sidebarOpen && (
              <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">
                {currentCategory?.name || 'Items'}
              </h3>
            )}
            <ul className="space-y-2">
              {currentItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-orange-100/80 to-purple-100/80 backdrop-blur-sm text-orange-700 border-l-4 border-orange-600 shadow-xl transform scale-105 hover:scale-110'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-white/60 hover:to-orange-50/60 hover:text-gray-900 hover:shadow-lg hover:transform hover:scale-105 hover:-translate-y-1 backdrop-blur-sm'
                    }`}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    {activeTab === item.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-purple-50/50 animate-pulse"></div>
                    )}
                    <div className="flex items-center space-x-3 relative z-10">
                      <div className={`flex-shrink-0 transition-all duration-300 transform ${
                        activeTab === item.id 
                          ? 'text-orange-600 scale-110' 
                          : 'text-gray-500 group-hover:text-orange-500 group-hover:scale-110'
                      }`}>
                        {item.icon}
                      </div>
                      {sidebarOpen && (
                        <span className="font-bold tracking-wide truncate text-base animate-fade-in">{item.name}</span>
                      )}
                    </div>
                    {activeTab === item.id && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/20 bg-gradient-to-r from-gray-50/80 to-orange-50/80 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute -top-1 -left-1 w-12 h-12 bg-gradient-to-r from-orange-400/20 to-pink-400/20 rounded-full blur-lg animate-pulse"></div>
          <div className="absolute -bottom-1 -right-1 w-16 h-16 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
          {sidebarOpen ? (
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-purple-600 rounded-xl shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-base">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-gray-500 font-medium tracking-wide">
                    ADMINISTRATOR
                  </p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="group relative px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-2xl font-bold text-sm tracking-wide overflow-hidden"
                title="Logout"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10">LOGOUT</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3 relative z-10">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full shadow-lg animate-pulse">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <button 
                onClick={logout}
                className="group relative px-3 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-2xl font-bold text-sm overflow-hidden"
                title="Logout"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10">OUT</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-100/40">
        {/* Top Header Bar */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/50 px-8 py-6 relative overflow-hidden">
          <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute -bottom-1 -left-1 w-16 h-16 bg-gradient-to-r from-orange-400/10 to-pink-400/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-blue-700 to-purple-700 bg-clip-text text-transparent capitalize animate-fade-in">{activeTab.replace('-', ' ')}</h2>
              <p className="text-gray-600 text-base font-medium mt-1">Manage your {activeTab.replace('-', ' ')} efficiently</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm rounded-xl border border-green-200/50 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-base text-green-700 font-medium">System Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 animate-fade-in">
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
      </div>

    </>
  );
};

export default AdminPanel;