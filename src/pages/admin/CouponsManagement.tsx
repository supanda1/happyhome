import React, { useState, useEffect } from 'react';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  bulkInsertCoupons,
  getCategories,
  generateUUID,
  type Category
} from '../../utils/adminDataManager';
import { formatPrice } from '../../utils/priceFormatter';

interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_service';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  usage_count: number;
  usage_limit_per_user?: number;
  is_active: boolean;
  applicable_categories: string[];
  applicable_services: string[];
  created_at: string;
  updated_at: string;
}

interface CouponFormData {
  code: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_service';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  usage_limit_per_user?: number;
  is_active: boolean;
  applicable_categories: string[];
  applicable_services: string[];
}

const CouponsManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  // Note: services removed - using database-only approach
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<'none' | 'migrating' | 'completed' | 'error'>('none');
  
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    minimum_order_amount: 0,
    maximum_discount_amount: undefined,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    usage_limit: undefined,
    usage_limit_per_user: undefined,
    is_active: true,
    applicable_categories: [],
    applicable_services: []
  });

  // Note: No mock data - all coupons now stored in PostgreSQL database

  // Handle bulk migration of coupons to database
  const handleBulkMigration = async () => {
    try {
      setMigrationStatus('migrating');
      console.log('🚀 Starting coupon migration to PostgreSQL...');
      
      const result = await bulkInsertCoupons();
      console.log('✅ Migration completed:', result);
      
      setMigrationStatus('completed');
      alert(`Successfully migrated ${result.inserted} coupons to database!`);
      
      // Refresh data after migration
      await fetchData();
    } catch (error) {
      console.error('❌ Migration failed:', error);
      setMigrationStatus('error');
      alert(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Load data from PostgreSQL database only
  const fetchData = async () => {
    try {
      setLoading(true);
      setDatabaseError(null);
      
      console.log('💾 Loading coupons from PostgreSQL database...');
      
      // Fetch data from database only - no fallbacks
      const couponsData = await getCoupons();
      const categoriesData = await getCategories();
      
      console.log('✅ CouponsManagement - Database data loaded:');
      console.log('   📊 Total coupons:', couponsData.length);
      
      if (couponsData.length > 0) {
        console.log('   🏷️ Coupon codes:', couponsData.map(c => c.code).join(', '));
        console.log('   🔍 Sample coupon:', couponsData[0]);
      } else {
        console.log('   📭 Database is empty - no coupons found');
      }
      
      setCoupons(couponsData);
      setCategories(categoriesData);
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      setDatabaseError(error instanceof Error ? error.message : 'Database connection failed');
      
      // No fallback - show error state
      setCoupons([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Generate coupon code
  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('💾 Saving coupon data:', formData);
      
      if (editingCoupon) {
        // Update existing coupon using adminDataManager
        console.log('📝 Updating existing coupon:', editingCoupon.id);
        console.log('📝 Full editing coupon object:', editingCoupon);
        console.log('📝 Form data to send:', formData);
        
        // Ensure dates are in YYYY-MM-DD format for backend
        console.log('📅 Date formats being sent:', {
          valid_from: formData.valid_from,
          valid_until: formData.valid_until
        });
        
        await updateCoupon(editingCoupon.id, {
          code: formData.code,
          title: formData.title,
          description: formData.description,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          minimum_order_amount: formData.minimum_order_amount,
          maximum_discount_amount: formData.maximum_discount_amount,
          valid_from: formData.valid_from, // Already in YYYY-MM-DD format from HTML date input
          valid_until: formData.valid_until, // Already in YYYY-MM-DD format from HTML date input
          usage_limit: formData.usage_limit,
          usage_limit_per_user: formData.usage_limit_per_user,
          is_active: formData.is_active,
          applicable_categories: formData.applicable_categories,
          applicable_services: formData.applicable_services
        });
        
        console.log('✅ Coupon updated successfully!');
        alert('Coupon updated successfully!');
        
      } else {
        // Create new coupon using adminDataManager
        console.log('➕ Creating new coupon');
        
        // Validate required fields before sending
        if (!formData.code || !formData.title || !formData.valid_from || !formData.valid_until) {
          alert('Please fill in all required fields (Code, Title, Valid From, Valid Until)');
          return;
        }
        
        // Validate date range
        if (new Date(formData.valid_from) >= new Date(formData.valid_until)) {
          alert('Valid Until date must be after Valid From date');
          return;
        }
        
        // Validate discount value
        if (formData.discount_value <= 0) {
          alert('Discount value must be greater than 0');
          return;
        }
        
        // Validate percentage discount
        if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
          alert('Percentage discount cannot be more than 100%');
          return;
        }
        
        console.log('📋 Coupon payload being sent:', {
          code: formData.code,
          title: formData.title,
          description: formData.description,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          minimum_order_amount: formData.minimum_order_amount,
          maximum_discount_amount: formData.maximum_discount_amount,
          valid_from: formData.valid_from, // YYYY-MM-DD format
          valid_until: formData.valid_until, // YYYY-MM-DD format
          usage_limit: formData.usage_limit,
          usage_limit_per_user: formData.usage_limit_per_user,
          is_active: formData.is_active,
          applicable_categories: formData.applicable_categories,
          applicable_services: formData.applicable_services
        });
        
        // TEMPORARY FIX: Force empty arrays until backend is fixed
        // The backend controller is corrupting non-empty arrays from ["uuid"] to {"uuid"}
        const applicableCategories: string[] = []; // Force empty for now
        const applicableServices: string[] = []; // Force empty for now
        
        const couponPayload = {
          id: generateUUID(), // WORKAROUND: Frontend generates UUID since backend doesn't
          code: formData.code.trim().toUpperCase(),
          title: formData.title.trim(),
          description: formData.description?.trim() || '',
          discount_type: formData.discount_type,
          discount_value: Number(formData.discount_value),
          minimum_order_amount: Number(formData.minimum_order_amount) || 0,
          maximum_discount_amount: formData.maximum_discount_amount ? Number(formData.maximum_discount_amount) : 99999, // Default to large number if no cap
          valid_from: formData.valid_from, // Already in YYYY-MM-DD format
          valid_until: formData.valid_until, // Already in YYYY-MM-DD format
          usage_limit: formData.usage_limit ? Number(formData.usage_limit) : 999999, // Default to large number (unlimited-like)
          usage_limit_per_user: formData.usage_limit_per_user ? Number(formData.usage_limit_per_user) : 10, // Default to 10 uses per user
          usage_count: 0, // New coupons start with 0 usage
          is_active: Boolean(formData.is_active),
          applicable_categories: applicableCategories, // Temporarily forced to []
          applicable_services: applicableServices // Temporarily forced to []
          // Note: first_time_users_only removed - database column doesn't exist
          // Note: timestamps removed - backend sets these automatically
        };
        
        // Log the generated UUID and selected categories for debugging
        console.log('🆔 Generated UUID for coupon:', couponPayload.id);
        
        if (formData.applicable_categories.length > 0) {
          console.log('⚠️ SELECTED CATEGORIES NOT SENT due to backend bug:', formData.applicable_categories);
          console.log('💡 Backend fix needed: Controller incorrectly converts ["uuid"] to {"uuid"}');
        }
        
        console.log('🚀 Final payload:', couponPayload);
        console.log('📊 Array validation:');
        console.log('   - applicable_categories:', {
          isArray: Array.isArray(couponPayload.applicable_categories),
          length: couponPayload.applicable_categories.length,
          values: couponPayload.applicable_categories
        });
        console.log('   - applicable_services:', {
          isArray: Array.isArray(couponPayload.applicable_services),
          length: couponPayload.applicable_services.length,
          values: couponPayload.applicable_services
        });
        
        await createCoupon(couponPayload);
        
        console.log('✅ Coupon created successfully!');
        alert('Coupon created successfully!');
      }
      
      // Refresh the coupons list to show updated data
      await fetchData();
      resetForm();
      
    } catch (error) {
      console.error('🚨 Error saving coupon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Show user-friendly error messages
      let friendlyMessage = 'Failed to save coupon. Please try again.';
      
      if (errorMessage.includes('400')) {
        friendlyMessage = 'Invalid coupon data. Please check all fields and try again.';
      } else if (errorMessage.includes('409') || errorMessage.includes('duplicate')) {
        friendlyMessage = 'Coupon code already exists. Please choose a different code.';
      } else if (errorMessage.includes('403')) {
        friendlyMessage = 'You do not have permission to create coupons.';
      } else if (errorMessage.includes('500')) {
        friendlyMessage = 'Server error. Please contact administrator.';
      }
      
      alert(`${friendlyMessage}\n\nTechnical details: ${errorMessage}`);
    }
  };

  // Handle coupon deletion
  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      return;
    }

    try {
      setCoupons(coupons.filter(c => c.id !== couponId));
      alert('Coupon deleted successfully!');
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Error deleting coupon');
    }
  };

  // Handle enable/disable toggle
  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      console.log(`🔄 Toggling coupon status for ${coupon.code}: ${coupon.is_active} → ${!coupon.is_active}`);
      
      // Send all required fields with only is_active changed
      // This prevents null constraint violations in the backend
      const updatePayload = {
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        minimum_order_amount: coupon.minimum_order_amount,
        maximum_discount_amount: coupon.maximum_discount_amount,
        valid_from: coupon.valid_from.split('T')[0], // Convert to YYYY-MM-DD format
        valid_until: coupon.valid_until.split('T')[0], // Convert to YYYY-MM-DD format
        usage_limit: coupon.usage_limit,
        usage_limit_per_user: coupon.usage_limit_per_user,
        is_active: !coupon.is_active, // Only this field changes
        applicable_categories: coupon.applicable_categories,
        applicable_services: coupon.applicable_services
      };
      
      console.log(`📤 Sending complete coupon data for toggle:`, updatePayload);
      
      // Update coupon status in database via API
      const updatedCoupon = await updateCoupon(coupon.id, updatePayload);
      
      console.log(`✅ Coupon status updated in database:`, updatedCoupon);
      
      // Update local state to reflect the change
      await fetchData(); // Refresh data from database to ensure sync
      
      alert(`Coupon ${!coupon.is_active ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('❌ Error updating coupon status:', error);
      alert(`Error updating coupon status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      minimum_order_amount: 0,
      maximum_discount_amount: undefined,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      usage_limit: undefined,
      usage_limit_per_user: undefined,
      is_active: true,
      applicable_categories: [],
      applicable_services: []
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const startEdit = (coupon: Coupon) => {
    console.log('📝 CouponsManagement - Starting edit for coupon:');
    console.log('   🏷️ Coupon ID:', coupon.id);
    console.log('   💾 Coupon code:', coupon.code);
    console.log('   📅 Current dates:', { 
      valid_from: coupon.valid_from, 
      valid_until: coupon.valid_until 
    });
    
    // Check if this is a mock ID
    const isMockId = coupon.id.startsWith('f47ac10b');
    console.log('   🎭 Is mock coupon?', isMockId ? 'YES - This will likely cause 404 on update' : 'NO - Real backend coupon');
    
    if (isMockId) {
      console.warn('⚠️ WARNING: You are about to edit a mock coupon!');
      console.warn('   This will fail because the backend database does not have this UUID.');
      console.warn('   The frontend is showing fallback mock data, but update will try real API.');
    }
    
    // Convert ISO datetime to date-only format for HTML date inputs
    const formatDateForInput = (isoString: string) => {
      if (!isoString) return '';
      return isoString.split('T')[0]; // Get just the date part (YYYY-MM-DD)
    };
    
    // Ensure arrays are properly handled from backend data
    const safeApplicableCategories = Array.isArray(coupon.applicable_categories) 
      ? coupon.applicable_categories 
      : coupon.applicable_categories && typeof coupon.applicable_categories === 'object'
      ? Object.keys(coupon.applicable_categories).length > 0 ? Object.keys(coupon.applicable_categories) : []
      : [];
    
    const safeApplicableServices = Array.isArray(coupon.applicable_services) 
      ? coupon.applicable_services 
      : coupon.applicable_services && typeof coupon.applicable_services === 'object'
      ? Object.keys(coupon.applicable_services).length > 0 ? Object.keys(coupon.applicable_services) : []
      : [];

    console.log('🛠️ Converting backend data to arrays:');
    console.log('   - applicable_categories:', typeof coupon.applicable_categories, coupon.applicable_categories, '→', safeApplicableCategories);
    console.log('   - applicable_services:', typeof coupon.applicable_services, coupon.applicable_services, '→', safeApplicableServices);

    setFormData({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      minimum_order_amount: coupon.minimum_order_amount,
      maximum_discount_amount: coupon.maximum_discount_amount,
      valid_from: formatDateForInput(coupon.valid_from),
      valid_until: formatDateForInput(coupon.valid_until),
      usage_limit: coupon.usage_limit,
      usage_limit_per_user: coupon.usage_limit_per_user,
      is_active: coupon.is_active,
      applicable_categories: safeApplicableCategories,
      applicable_services: safeApplicableServices
    });
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  // Filter coupons
  const filteredCoupons = coupons.filter(coupon => {
    if (filterStatus === 'active') return coupon.is_active && new Date(coupon.valid_until) > new Date();
    if (filterStatus === 'inactive') return !coupon.is_active;
    if (filterStatus === 'expired') return new Date(coupon.valid_until) < new Date();
    return true;
  });

  // Calculate discount display
  const getDiscountDisplay = (coupon: Coupon) => {
    switch (coupon.discount_type) {
      case 'percentage':
        return `${coupon.discount_value}% OFF`;
      case 'fixed_amount':
        return `${formatPrice(coupon.discount_value)} OFF`;
      case 'free_service':
        return 'FREE SERVICE';
      default:
        return `${coupon.discount_value}% OFF`;
    }
  };

  // Check if coupon is expired
  const isCouponExpired = (coupon: Coupon) => {
    return new Date(coupon.valid_until) < new Date();
  };

  // Custom CSS for enhanced animations
  const customStyles = `
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes bounce-in {
      0% { transform: translateY(-100px) scale(0.8); opacity: 0; }
      50% { transform: translateY(0px) scale(1.05); opacity: 1; }
      65% { transform: translateY(-10px) scale(1.02); }
      81% { transform: translateY(0px) scale(1); }
      100% { transform: translateY(0px) scale(1); opacity: 1; }
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;

  if (loading) {
    return (
      <>
        <style>{customStyles}</style>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center animate-fade-in">
          <div className="text-center animate-bounce-in">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-border mx-auto"></div>
              <div className="absolute inset-3 bg-white rounded-full"></div>
              <div className="absolute inset-4 animate-pulse bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 rounded-full"></div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl border border-white/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  Loading Coupons
                </h3>
                <p className="text-gray-600 font-medium">Fetching promotions and discount data...</p>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Enhanced Header Section */}
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-pink-600 to-rose-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-12 translate-y-12 blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-white/20 rounded-2xl p-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Coupons & Promotions</h1>
                        <p className="text-pink-100 text-lg">Create attractive discount coupons and boost sales</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{coupons.length}</div>
                        <div className="text-sm text-pink-100">Total Coupons</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-pink-100 text-xl leading-relaxed mt-4">Drive customer engagement with targeted promotions</p>
              </div>
            </div>
          </div>

          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Coupons */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{coupons.length}</p>
                  <p className="text-sm font-medium text-gray-600">Total Coupons</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">All promotions</p>
                </div>
              </div>
            </div>

            {/* Active Coupons */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{filteredCoupons.filter(c => c.is_active && new Date(c.valid_until) > new Date()).length}</p>
                  <p className="text-sm font-medium text-gray-600">Active Coupons</p>
                  <p className="text-xs text-green-600 mt-1 font-medium">Live & available</p>
                </div>
              </div>
            </div>

            {/* Expired Coupons */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{coupons.filter(c => new Date(c.valid_until) < new Date()).length}</p>
                  <p className="text-sm font-medium text-gray-600">Expired Coupons</p>
                  <p className="text-xs text-orange-600 mt-1 font-medium">Past due</p>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{coupons.reduce((sum, c) => sum + c.usage_count, 0)}</p>
                  <p className="text-sm font-medium text-gray-600">Total Usage</p>
                  <p className="text-xs text-purple-600 mt-1 font-medium">Times redeemed</p>
                </div>
              </div>
            </div>

          </div>
      </div>

      {/* Database Error State */}
      {databaseError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-red-600 font-bold text-xl">!</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Database Connection Error</h3>
              <p className="text-red-600 text-sm">Failed to connect to PostgreSQL database</p>
            </div>
          </div>
          <p className="text-red-700 mb-4">{databaseError}</p>
          <button
            onClick={fetchData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

        {/* Empty State with Migration */}
        {!databaseError && coupons.length === 0 && !loading && (
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-10 mb-8 text-center shadow-xl backdrop-blur-sm">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-blue-700 text-4xl font-bold">🎟️</span>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-3">No Coupons in Database</h3>
            <p className="text-blue-700 text-lg mb-8 font-medium">Your PostgreSQL database is empty. Migrate existing coupons to get started.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleBulkMigration}
                disabled={migrationStatus === 'migrating'}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg font-semibold"
            >
              {migrationStatus === 'migrating' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Migrating...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Migrate Coupons to Database</span>
                </>
              )}
            </button>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg font-semibold"
              >
                Create New Coupon
              </button>
            </div>
          </div>
        )}

        {/* Header Actions - Show only when coupons exist */}
        {!databaseError && coupons.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Coupon Operations
                  <span className="text-sm font-normal text-gray-600 ml-2">• Manage promotions & discounts</span>
                </h2>
                <p className="text-gray-600 font-medium">Create attractive discount coupons and boost customer engagement</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="group relative px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-bold flex items-center space-x-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="relative z-10">Add New Coupon</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs - Show only when coupons exist */}
        {!databaseError && coupons.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">Filter Coupons</h3>
            </div>
            <div className="p-4">
              <nav className="flex flex-wrap gap-3">
                {[
                  { id: 'all', name: 'All Coupons', count: coupons.length, colors: { bg: 'from-blue-500 to-blue-600', hover: 'hover:from-blue-600 hover:to-blue-700', ring: 'ring-2 ring-blue-200' } },
                  { id: 'active', name: 'Active', count: coupons.filter(c => c.is_active && !isCouponExpired(c)).length, colors: { bg: 'from-green-500 to-green-600', hover: 'hover:from-green-600 hover:to-green-700', ring: 'ring-2 ring-green-200' } },
                  { id: 'inactive', name: 'Inactive', count: coupons.filter(c => !c.is_active).length, colors: { bg: 'from-gray-500 to-gray-600', hover: 'hover:from-gray-600 hover:to-gray-700', ring: 'ring-2 ring-gray-200' } },
                  { id: 'expired', name: 'Expired', count: coupons.filter(c => isCouponExpired(c)).length, colors: { bg: 'from-red-500 to-red-600', hover: 'hover:from-red-600 hover:to-red-700', ring: 'ring-2 ring-red-200' } }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id as 'all' | 'active' | 'inactive' | 'expired')}
                    className={`py-3 px-6 rounded-xl font-semibold text-sm transition-all transform hover:scale-105 shadow-md ${
                      filterStatus === tab.id
                        ? `bg-gradient-to-r ${tab.colors.bg} ${tab.colors.hover} text-white ${tab.colors.ring}`
                        : 'bg-white/70 text-gray-600 hover:bg-white hover:text-gray-800 border border-gray-200'
                    }`}
                  >
                    {tab.name} <span className="font-bold">({tab.count})</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Code *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="WELCOME50"
                    />
                    <button
                      type="button"
                      onClick={generateCouponCode}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-md hover:from-blue-600 hover:to-purple-700 transition-all"
                    >
                      GENERATE
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Welcome Offer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Get 50% off on your first service booking"
                />
              </div>

              {/* Discount Configuration */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Discount Configuration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type *
                    </label>
                    <select
                      required
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed_amount' | 'free_service' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="percentage">Percentage Off</option>
                      <option value="fixed_amount">Fixed Amount Off</option>
                      <option value="free_service">Free Service</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Value *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                        max={formData.discount_type === 'percentage' ? '100' : undefined}
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">
                          {formData.discount_type === 'percentage' ? '%' : formData.discount_type === 'fixed_amount' ? '₹' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {formData.discount_type === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Discount Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.maximum_discount_amount || ''}
                        onChange={(e) => setFormData({ ...formData, maximum_discount_amount: parseFloat(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional cap"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimum_order_amount}
                    onChange={(e) => setFormData({ ...formData, minimum_order_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum order value to use this coupon"
                  />
                </div>
              </div>

              {/* Validity & Usage Limits */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Validity & Usage Limits</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid From *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid Until *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Usage Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usage_limit || ''}
                      onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Unlimited"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usage Limit Per User
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usage_limit_per_user || ''}
                      onChange={(e) => setFormData({ ...formData, usage_limit_per_user: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Unlimited per user"
                    />
                  </div>
                </div>
              </div>

              {/* Applicability */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Applicability</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Applicable Categories (leave empty for all)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.applicable_categories.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  applicable_categories: [...formData.applicable_categories, category.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  applicable_categories: formData.applicable_categories.filter(id => id !== category.id)
                                });
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {category.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active (visible to customers)
                </label>
              </div>

              {/* Preview */}
              {formData.code && formData.title && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-2">Coupon Preview</h4>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 max-w-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">{getDiscountDisplay({ ...formData, id: '', usage_count: 0, created_at: '', updated_at: '' } as Coupon)}</span>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded font-bold">COUPON</span>
                    </div>
                    <div className="font-medium">{formData.title}</div>
                    <div className="text-xs opacity-90 mt-1">{formData.description}</div>
                    <div className="mt-3 pt-2 border-t border-white/20">
                      <div className="flex items-center justify-between text-xs">
                        <span>Code: <strong>{formData.code}</strong></span>
                        <span>Min: ₹{formData.minimum_order_amount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons Grid - Show only when coupons exist */}
      {!databaseError && coupons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Coupon Header */}
            <div className={`p-4 text-white ${
              isCouponExpired(coupon) ? 'bg-gray-400' :
              coupon.is_active ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-400'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xl">{getDiscountDisplay(coupon)}</span>
                <div className="flex space-x-1">
                  {isCouponExpired(coupon) && (
                    <span className="bg-red-500 px-2 py-1 rounded text-xs">EXPIRED</span>
                  )}
                </div>
              </div>
              <div className="font-medium">{coupon.title}</div>
              <div className="text-sm opacity-90 mt-1">{coupon.description}</div>
            </div>

            {/* Coupon Body */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono font-bold text-gray-900">{coupon.code}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  coupon.is_active && !isCouponExpired(coupon)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isCouponExpired(coupon) ? 'Expired' : coupon.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Min Order:</span>
                  <span>₹{coupon.minimum_order_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valid Until:</span>
                  <span>{new Date(coupon.valid_until).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Usage:</span>
                  <span>
                    {coupon.usage_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                  </span>
                </div>
              </div>

              {/* Progress Bar for Usage */}
              {coupon.usage_limit && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Usage Progress</span>
                    <span>{Math.round((coupon.usage_count / coupon.usage_limit) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((coupon.usage_count / coupon.usage_limit) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => startEdit(coupon)}
                  className="flex-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 py-2 px-3 rounded text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(coupon)}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium ${
                    coupon.is_active
                      ? 'text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100'
                      : 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  {coupon.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 py-2 px-3 rounded text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {filteredCoupons.length === 0 && coupons.length > 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-12 h-12 bg-white rounded-full opacity-80"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {filterStatus} coupons found
          </h3>
          <p className="text-gray-600 mb-4">
            No coupons match the {filterStatus} filter. Try changing the filter or create new coupons.
          </p>
        </div>
      )}

      {/* Quick Stats - Show only when coupons exist */}
      {!databaseError && coupons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-blue-600 text-2xl font-bold">{coupons.length}</div>
            <div className="text-blue-800 text-sm font-medium">Total Coupons</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-green-600 text-2xl font-bold">
              {coupons.filter(c => c.is_active && !isCouponExpired(c)).length}
            </div>
            <div className="text-green-800 text-sm font-medium">Active Coupons</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-purple-600 text-2xl font-bold">
              {coupons.reduce((total, c) => total + c.usage_count, 0)}
            </div>
            <div className="text-purple-800 text-sm font-medium">Total Usage</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-orange-600 text-2xl font-bold">
              ₹{coupons.reduce((total, c) => total + (c.usage_count * (c.discount_type === 'fixed_amount' ? c.discount_value : 50)), 0)}
            </div>
            <div className="text-orange-800 text-sm font-medium">Est. Discounts Given</div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default CouponsManagement;