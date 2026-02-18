/**
 * Admin Coupons - Backend API Integration
 * 
 * SECURITY: Fully integrated with backend API - NO mock data
 * - Fetches real coupon data from database via /api/admin/coupons
 * - Uses HTTP-only cookies for secure admin authentication
 * - Proper CRUD operations with error handling and loading states
 * - Real-time coupon management with database persistence
 * 
 * API Endpoints:
 * - GET /api/admin/coupons - Fetch all coupons
 * - POST /api/admin/coupons - Create new coupon
 * - PUT /api/admin/coupons/{id} - Update existing coupon
 * - DELETE /api/admin/coupons/{id} - Delete coupon
 * - PATCH /api/admin/coupons/{id}/toggle - Toggle coupon status
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { useServices } from '../../contexts/ServiceContext';
import { useBooking } from '../../contexts/BookingContext';
import type { Coupon, CouponType } from '../../types';
import { Button, Input, Select, Card, CardContent, Modal, ModalHeader, ModalBody, ModalFooter, Badge } from '../../components/ui';

interface CouponFormData {
  code: string;
  name: string;
  description: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit: number;
  validFrom: string;
  validUntil: string;
  applicableServices: string[];
  applicableCategories: string[];
  isActive: boolean;
}

const AdminCoupons: React.FC = () => {
  const { services, categories, loadServices, loadCategories } = useServices();
  const { loadCoupons } = useBooking();
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<CouponFormData>();

  const watchedType = watch('type');
  const watchedServices = watch('applicableServices', []);
  const watchedCategories = watch('applicableCategories', []);

  // Fetch coupons from backend database API
  const fetchCoupons = async (): Promise<Coupon[]> => {
    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SECURITY: Include HTTP-only cookies for admin authentication
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login as admin.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error(`Coupons API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Coupons loaded from backend API');
      return data;
    } catch (fetchError) {
      console.error('🚫 Coupons API fetch failed:', fetchError);
      throw fetchError;
    }
  };

  // Create new coupon
  const createCoupon = async (couponData: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Promise<Coupon> => {
    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create coupon: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Coupon created successfully');
      return data;
    } catch (error) {
      console.error('🚫 Create coupon failed:', error);
      throw error;
    }
  };

  // Update existing coupon
  const updateCoupon = async (couponId: string, couponData: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Promise<Coupon> => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update coupon: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Coupon updated successfully');
      return data;
    } catch (error) {
      console.error('🚫 Update coupon failed:', error);
      throw error;
    }
  };

  // Delete coupon
  const deleteCoupon = async (couponId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete coupon: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Coupon deleted successfully');
      return true;
    } catch (error) {
      console.error('🚫 Delete coupon failed:', error);
      return false;
    }
  };

  // Toggle coupon status
  const toggleCouponStatusAPI = async (couponId: string): Promise<Coupon | null> => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle coupon status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Coupon status toggled successfully');
      return data;
    } catch (error) {
      console.error('🚫 Toggle coupon status failed:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeCoupons = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadServices(),
          loadCategories(),
          loadCoupons()
        ]);
        
        const couponsData = await fetchCoupons();
        setCoupons(couponsData);
      } catch (error) {
        console.error('Error loading coupons data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load coupons');
      } finally {
        setLoading(false);
      }
    };

    initializeCoupons();
  }, [loadServices, loadCategories, loadCoupons]);

  // Filter coupons based on search and status
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         coupon.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    switch (statusFilter) {
      case 'active':
        matchesStatus = coupon.isActive && now >= validFrom && now <= validUntil;
        break;
      case 'inactive':
        matchesStatus = !coupon.isActive;
        break;
      case 'expired':
        matchesStatus = now > validUntil;
        break;
      default:
        matchesStatus = true;
    }
    
    return matchesSearch && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingCoupon(null);
    reset({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minimumOrderAmount: undefined,
      maximumDiscountAmount: undefined,
      usageLimit: 100,
      validFrom: format(new Date(), 'yyyy-MM-dd'),
      validUntil: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      applicableServices: [],
      applicableCategories: [],
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    reset({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minimumOrderAmount: coupon.minimumOrderAmount,
      maximumDiscountAmount: coupon.maximumDiscountAmount,
      usageLimit: coupon.usageLimit,
      validFrom: format(new Date(coupon.validFrom), 'yyyy-MM-dd'),
      validUntil: format(new Date(coupon.validUntil), 'yyyy-MM-dd'),
      applicableServices: coupon.applicableServices,
      applicableCategories: coupon.applicableCategories,
      isActive: coupon.isActive
    });
    setIsModalOpen(true);
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const couponsData = await fetchCoupons();
      setCoupons(couponsData);
      console.log('🔄 Coupons refreshed successfully');
    } catch (error) {
      console.error('Error refreshing coupons:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh coupons');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setError(null); // Clear any existing errors
    reset();
  };

  const onSubmit = async (data: CouponFormData) => {
    setActionLoading('form');
    try {
      const couponData: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'> = {
        ...data,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil)
      };

      if (editingCoupon) {
        // Update existing coupon via backend API
        const updatedCoupon = await updateCoupon(editingCoupon.id, couponData);
        setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? updatedCoupon : c));
        alert('Coupon updated successfully!');
      } else {
        // Create new coupon via backend API
        const newCoupon = await createCoupon(couponData);
        setCoupons(prev => [newCoupon, ...prev]);
        alert('Coupon created successfully!');
      }
      closeModal();
    } catch (error) {
      console.error('Error saving coupon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save coupon';
      setError(`Error saving coupon: ${errorMessage}`);
      alert(`Error saving coupon: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (window.confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      setIsDeleting(couponId);
      setActionLoading(couponId);
      
      try {
        const success = await deleteCoupon(couponId);
        
        if (success) {
          setCoupons(prev => prev.filter(c => c.id !== couponId));
          alert('Coupon deleted successfully!');
        } else {
          alert('Failed to delete coupon. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting coupon:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete coupon';
        setError(`Error deleting coupon: ${errorMessage}`);
        alert(`Error deleting coupon: ${errorMessage}`);
      } finally {
        setIsDeleting(null);
        setActionLoading(null);
      }
    }
  };

  const toggleCouponStatus = async (couponId: string) => {
    setActionLoading(couponId);
    
    try {
      const updatedCoupon = await toggleCouponStatusAPI(couponId);
      
      if (updatedCoupon) {
        setCoupons(prev => prev.map(coupon => 
          coupon.id === couponId ? updatedCoupon : coupon
        ));
        alert(`Coupon ${updatedCoupon.isActive ? 'activated' : 'deactivated'} successfully!`);
      } else {
        alert('Failed to update coupon status. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update coupon status';
      setError(`Error updating coupon status: ${errorMessage}`);
      alert(`Error updating coupon status: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    if (!coupon.isActive) return { status: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    if (now < validFrom) return { status: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    if (now > validUntil) return { status: 'Expired', color: 'bg-red-100 text-red-800' };
    if (coupon.usedCount >= coupon.usageLimit) return { status: 'Used Up', color: 'bg-orange-100 text-orange-800' };
    return { status: 'Active', color: 'bg-green-100 text-green-800' };
  };

  const getUsagePercentage = (coupon: Coupon) => {
    return Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100);
  };

  // Loading state
  if (loading) {
    return (
      <div>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coupons Management</h1>
            <p className="text-gray-600 mt-2">Loading coupons data...</p>
          </div>
          <Button disabled>
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coupons Management</h1>
            <p className="text-gray-600 mt-2">Error loading coupons data</p>
          </div>
          <Button onClick={handleRefresh}>
            Retry
          </Button>
        </div>
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Coupons Management Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={handleRefresh}>
            Retry Loading Coupons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupons Management</h1>
          <p className="text-gray-600 mt-2">Create and manage discount coupons from database</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading || actionLoading !== null}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            disabled={actionLoading !== null}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Coupon
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <Input
              placeholder="Search coupons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
            <Select
              placeholder="All Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'expired')}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'expired', label: 'Expired' }
              ]}
            />
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Total: {filteredCoupons.length} coupons</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Active: {filteredCoupons.filter(c => getCouponStatus(c).status === 'Active').length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoupons.map((coupon) => {
          const status = getCouponStatus(coupon);
          const usagePercentage = getUsagePercentage(coupon);
          
          return (
            <Card key={coupon.id} className="hover:shadow-lg transition-shadow">
              <CardContent>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{coupon.code}</h3>
                      <p className="text-gray-600 text-sm">{coupon.name}</p>
                    </div>
                    <Badge className={status.color}>
                      {status.status}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm line-clamp-2">{coupon.description}</p>

                  {/* Discount Info */}
                  <div className="bg-primary-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Discount:</span>
                      <span className="font-bold text-primary-600">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`} OFF
                      </span>
                    </div>
                    {coupon.minimumOrderAmount && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Min Order:</span>
                        <span className="text-sm font-medium">${coupon.minimumOrderAmount}</span>
                      </div>
                    )}
                    {coupon.maximumDiscountAmount && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Max Discount:</span>
                        <span className="text-sm font-medium">${coupon.maximumDiscountAmount}</span>
                      </div>
                    )}
                  </div>

                  {/* Usage Stats */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Usage:</span>
                      <span className="text-sm font-medium">
                        {coupon.usedCount} / {coupon.usageLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${usagePercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Validity */}
                  <div className="text-xs text-gray-500">
                    <div>Valid: {format(new Date(coupon.validFrom), 'MMM d, yyyy')} - {format(new Date(coupon.validUntil), 'MMM d, yyyy')}</div>
                  </div>

                  {/* Applicable To */}
                  {(coupon.applicableServices.length > 0 || coupon.applicableCategories.length > 0) && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Applicable to:</span>
                      {coupon.applicableCategories.length > 0 && (
                        <div>Categories: {coupon.applicableCategories.length} selected</div>
                      )}
                      {coupon.applicableServices.length > 0 && (
                        <div>Services: {coupon.applicableServices.length} selected</div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(coupon)}
                      disabled={actionLoading !== null}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={coupon.isActive ? 'ghost' : 'outline'}
                      onClick={() => toggleCouponStatus(coupon.id)}
                      disabled={actionLoading === coupon.id}
                      className="flex-1"
                    >
                      {actionLoading === coupon.id ? 'Updating...' : (coupon.isActive ? 'Deactivate' : 'Activate')}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(coupon.id)}
                      loading={isDeleting === coupon.id || actionLoading === coupon.id}
                      disabled={actionLoading === coupon.id}
                    >
                      {actionLoading === coupon.id ? '...' : '×'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCoupons.length === 0 && coupons.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No coupons found</h3>
          <p className="text-gray-600 mb-6">Create your first discount coupon to start offering promotions to your customers.</p>
          <Button onClick={openCreateModal}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create First Coupon
          </Button>
        </div>
      )}

      {filteredCoupons.length === 0 && coupons.length > 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons match your criteria</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Coupon Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            <h2 className="text-xl font-semibold">
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Coupon Code"
                  {...register('code', { 
                    required: 'Coupon code is required',
                    pattern: {
                      value: /^[A-Z0-9]+$/,
                      message: 'Coupon code must be uppercase letters and numbers only'
                    }
                  })}
                  error={errors.code?.message}
                  placeholder="SAVE20"
                  style={{ textTransform: 'uppercase' }}
                />
                <Input
                  label="Coupon Name"
                  {...register('name', { required: 'Coupon name is required' })}
                  error={errors.name?.message}
                  placeholder="Summer Sale"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Describe the coupon offer..."
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Discount Settings */}
              <div className="grid md:grid-cols-3 gap-4">
                <Select
                  label="Discount Type"
                  {...register('type', { required: 'Discount type is required' })}
                  options={[
                    { value: 'percentage', label: 'Percentage (%)' },
                    { value: 'fixed', label: 'Fixed Amount ($)' }
                  ]}
                  error={errors.type?.message}
                />
                <Input
                  label={`Discount ${watchedType === 'percentage' ? 'Percentage' : 'Amount'}`}
                  type="number"
                  step={watchedType === 'percentage' ? '1' : '0.01'}
                  min="0"
                  max={watchedType === 'percentage' ? '100' : undefined}
                  {...register('value', { 
                    required: 'Discount value is required',
                    min: { value: 0, message: 'Value must be positive' },
                    max: watchedType === 'percentage' ? { value: 100, message: 'Percentage cannot exceed 100%' } : undefined
                  })}
                  error={errors.value?.message}
                />
                <Input
                  label="Usage Limit"
                  type="number"
                  min="1"
                  {...register('usageLimit', { 
                    required: 'Usage limit is required',
                    min: { value: 1, message: 'Must allow at least 1 use' }
                  })}
                  error={errors.usageLimit?.message}
                />
              </div>

              {/* Order Constraints */}
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Minimum Order Amount ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('minimumOrderAmount')}
                  helperText="Leave empty for no minimum"
                />
                {watchedType === 'percentage' && (
                  <Input
                    label="Maximum Discount Amount ($)"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('maximumDiscountAmount')}
                    helperText="Leave empty for no limit"
                  />
                )}
              </div>

              {/* Validity Period */}
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Valid From"
                  type="date"
                  {...register('validFrom', { required: 'Start date is required' })}
                  error={errors.validFrom?.message}
                />
                <Input
                  label="Valid Until"
                  type="date"
                  {...register('validUntil', { required: 'End date is required' })}
                  error={errors.validUntil?.message}
                />
              </div>

              {/* Applicable Services/Categories */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Applicable Categories</label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          value={category.id}
                          checked={watchedCategories?.includes(category.id) || false}
                          onChange={(e) => {
                            const current = watchedCategories || [];
                            if (e.target.checked) {
                              setValue('applicableCategories', [...current, category.id]);
                            } else {
                              setValue('applicableCategories', current.filter(id => id !== category.id));
                            }
                          }}
                          className="mr-2 rounded border-gray-300 text-primary-600"
                        />
                        <span className="text-sm">{category.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all categories</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Applicable Services</label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                    {services.map(service => (
                      <label key={service.id} className="flex items-center">
                        <input
                          type="checkbox"
                          value={service.id}
                          checked={watchedServices?.includes(service.id) || false}
                          onChange={(e) => {
                            const current = watchedServices || [];
                            if (e.target.checked) {
                              setValue('applicableServices', [...current, service.id]);
                            } else {
                              setValue('applicableServices', current.filter(id => id !== service.id));
                            }
                          }}
                          className="mr-2 rounded border-gray-300 text-primary-600"
                        />
                        <span className="text-sm">{service.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all services</p>
                </div>
              </div>

              {/* Settings */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Coupon is active</span>
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={isSubmitting || actionLoading === 'form'}
                disabled={actionLoading === 'form'}
              >
                {actionLoading === 'form' ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  editingCoupon ? 'Update Coupon' : 'Create Coupon'
                )}
              </Button>
            </div>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCoupons;