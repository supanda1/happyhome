import React, { useState, useEffect } from 'react';
import {
  getCategories,
  getSubcategories, 
  getServices,
  createService,
  updateService,
  deleteService,
  initializeAdminData,
  forceRefreshAdminData,
  type Category,
  type Subcategory,
  type Service,
} from '../../utils/adminDataManager';
import { formatPrice } from '../../utils/priceFormatter';

interface ServiceFormData {
  name: string;
  category_id: string;
  subcategory_id: string;
  description: string;
  short_description: string;
  base_price: number;
  discount_percentage?: number;
  duration: number;
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  is_active: boolean;
  is_featured: boolean;
  is_combo_eligible: boolean;
  tags: string[];
  gst_percentage: number;
  service_charge: number;
  notes: string;
  images: string[]; // Array of image URLs for the service
}

interface FormErrors {
  name?: string;
  category_id?: string;
  subcategory_id?: string;
  description?: string;
  short_description?: string;
  base_price?: string;
  duration?: string;
  general?: string;
}

interface ServicesManagementProps {
  onServiceChange?: () => void;
}

const ServicesManagement: React.FC<ServicesManagementProps> = ({ onServiceChange }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'services' | 'included' | 'notes' | 'images'>('basic');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    category_id: '',
    subcategory_id: '',
    description: '',
    short_description: '',
    base_price: 0,
    discount_percentage: 0,
    duration: 60,
    inclusions: [''],
    exclusions: [''],
    requirements: [''],
    is_active: true,
    is_featured: false,
    is_combo_eligible: true,
    tags: [''],
    gst_percentage: 18,
    service_charge: 79,
    notes: '',
    images: []
  });

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Initialize admin data if not exists
      initializeAdminData();
      
      // Get data from API
      const categoriesData = await getCategories();
      const subcategoriesData = await getSubcategories();
      const servicesData = await getServices();
      
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
      setServices(servicesData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error to prevent filter issues
      setCategories([]);
      setSubcategories([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Force refresh to ensure latest default services with variants are loaded
    forceRefreshAdminData();
    fetchData();
  }, []);

  // Filter subcategories by selected category
  const filteredSubcategories = subcategories.filter(
    sub => sub.category_id === formData.category_id
  );

  // Parse validation errors from API response
  const parseValidationErrors = (errorMessage: string): FormErrors => {
    const errors: FormErrors = {};
    
    if (errorMessage.includes('Validation Error:')) {
      const errorPart = errorMessage.split('Validation Error:')[1];
      
      // Handle multiple errors for the same field by collecting all description errors
      const descriptionErrors: string[] = [];
      const shortDescriptionErrors: string[] = [];
      const nameErrors: string[] = [];
      const categoryErrors: string[] = [];
      const basePriceErrors: string[] = [];
      const durationErrors: string[] = [];
      
      // Split by comma but be careful about field names
      const fieldErrors = errorPart.split(',').map(err => err.trim());
      
      fieldErrors.forEach(fieldError => {
        if (fieldError.includes('description:') && !fieldError.includes('short_description:')) {
          const errorMsg = fieldError.split('description:')[1].trim();
          if (errorMsg) {
            descriptionErrors.push(errorMsg);
          }
        } else if (fieldError.includes('short_description:')) {
          const errorMsg = fieldError.split('short_description:')[1].trim();
          if (errorMsg) {
            shortDescriptionErrors.push(errorMsg);
          }
        } else if (fieldError.includes('name:')) {
          const errorMsg = fieldError.split('name:')[1].trim();
          if (errorMsg) {
            nameErrors.push(errorMsg);
          }
        } else if (fieldError.includes('category_id:')) {
          const errorMsg = fieldError.split('category_id:')[1].trim();
          if (errorMsg) {
            categoryErrors.push(errorMsg);
          }
        } else if (fieldError.includes('base_price:')) {
          const errorMsg = fieldError.split('base_price:')[1].trim();
          if (errorMsg) {
            basePriceErrors.push(errorMsg);
          }
        } else if (fieldError.includes('duration:')) {
          const errorMsg = fieldError.split('duration:')[1].trim();
          if (errorMsg) {
            durationErrors.push(errorMsg);
          }
        }
      });
      
      // Combine errors for each field
      if (descriptionErrors.length > 0) {
        errors.description = descriptionErrors.join('. ');
      }
      if (shortDescriptionErrors.length > 0) {
        errors.short_description = shortDescriptionErrors.join('. ');
      }
      if (nameErrors.length > 0) {
        errors.name = nameErrors.join('. ');
      }
      if (categoryErrors.length > 0) {
        errors.category_id = categoryErrors.join('. ');
      }
      if (basePriceErrors.length > 0) {
        errors.base_price = basePriceErrors.join('. ');
      }
      if (durationErrors.length > 0) {
        errors.duration = durationErrors.join('. ');
      }
    } else {
      errors.general = errorMessage;
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    
    try {
      // Calculate discounted_price from discount_percentage
      let discountedPrice = undefined;
      if (formData.discount_percentage && formData.discount_percentage > 0 && formData.discount_percentage < 100) {
        discountedPrice = formData.base_price * (1 - formData.discount_percentage / 100);
      }
      
      // Clean up form data and convert discount_percentage to discounted_price for API
      const cleanFormData = {
        ...formData,
        discounted_price: discountedPrice,
        inclusions: formData.inclusions.filter(item => item.trim()),
        exclusions: formData.exclusions.filter(item => item.trim()),
        requirements: formData.requirements.filter(item => item.trim()),
        tags: formData.tags.filter(item => item.trim()),
        image_paths: formData.images, // Map images to image_paths for backend
        rating: 0,
        review_count: 0,
        booking_count: 0,
      };
      
      // Remove frontend-only fields that are not expected by the API
      delete (cleanFormData as any).discount_percentage;
      delete (cleanFormData as any).images;

      if (editingService) {
        // Update existing service
        const updatedService = await updateService(editingService.id, cleanFormData);
        if (updatedService) {
          await fetchData();
          onServiceChange?.();
          resetForm();
        } else {
          setErrors({ general: 'Service not found' });
        }
      } else {
        // Create new service
        await createService(cleanFormData);
        await fetchData();
        onServiceChange?.();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving service:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const validationErrors = parseValidationErrors(errorMessage);
      setErrors(validationErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle service deletion
  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await deleteService(serviceId);
      if (success) {
        await fetchData();
        onServiceChange?.();
        alert('Service deleted successfully!');
      } else {
        alert('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service');
    }
  };

  // Handle enable/disable toggle
  const handleToggleStatus = async (service: Service) => {
    try {
      const updatedService = await updateService(service.id, {
        is_active: !service.is_active
      });
      
      if (updatedService) {
        await fetchData();
        onServiceChange?.();
        alert(`Service ${!service.is_active ? 'enabled' : 'disabled'} successfully!`);
      } else {
        alert('Failed to update service status');
      }
    } catch (error) {
      console.error('Error updating service status:', error);
      alert('Error updating service status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: '',
      subcategory_id: '',
      description: '',
      short_description: '',
      base_price: 0,
      discount_percentage: 0,
      duration: 60,
      inclusions: [''],
      exclusions: [''],
      requirements: [''],
      is_active: true,
      is_featured: false,
      is_combo_eligible: true,
      tags: [''],
      gst_percentage: 18,
      service_charge: 79,
      notes: '',
      images: []
    });
    setEditingService(null);
    setShowForm(false);
    setActiveTab('basic');
    setErrors({});
    setIsSubmitting(false);
  };

  const startEdit = (service: Service) => {
    // Calculate discount percentage from existing discounted_price
    let discountPercentage = 0;
    if (service.discounted_price && service.base_price && service.discounted_price < service.base_price) {
      discountPercentage = Math.round(((service.base_price - service.discounted_price) / service.base_price) * 100);
    }
    
    setFormData({
      name: service.name,
      category_id: service.category_id,
      subcategory_id: service.subcategory_id,
      description: service.description,
      short_description: service.short_description,
      base_price: service.base_price,
      discount_percentage: discountPercentage,
      duration: service.duration,
      inclusions: service.inclusions.length ? service.inclusions : [''],
      exclusions: service.exclusions.length ? service.exclusions : [''],
      requirements: service.requirements.length ? service.requirements : [''],
      is_active: service.is_active,
      is_featured: service.is_featured,
      is_combo_eligible: service.is_combo_eligible,
      tags: service.tags.length ? service.tags : [''],
      gst_percentage: service.gst_percentage || 18,
      service_charge: service.service_charge || 79,
      notes: service.notes || '',
      images: service.image_paths || []
    });
    setEditingService(service);
    setShowForm(true);
  };

  // Helper functions for dynamic form arrays
  const addArrayItem = (field: keyof ServiceFormData, index: number) => {
    const newArray = [...(formData[field] as string[])];
    newArray.splice(index + 1, 0, '');
    setFormData({ ...formData, [field]: newArray });
  };

  const removeArrayItem = (field: keyof ServiceFormData, index: number) => {
    const newArray = [...(formData[field] as string[])];
    if (newArray.length > 1) {
      newArray.splice(index, 1);
      setFormData({ ...formData, [field]: newArray });
    }
  };

  const updateArrayItem = (field: keyof ServiceFormData, index: number, value: string) => {
    const newArray = [...(formData[field] as string[])];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
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
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 bg-clip-border mx-auto"></div>
              <div className="absolute inset-3 bg-white rounded-full"></div>
              <div className="absolute inset-4 animate-pulse bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 rounded-full"></div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl border border-white/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  Loading Services
                </h3>
                <p className="text-gray-600 font-medium">Fetching service catalog and management tools...</p>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
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
        {/* Back to Home Navigation */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back to Home</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 rounded-3xl p-8 shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-white/20 rounded-2xl p-3">
                      <span className="text-3xl">🛠️</span>
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold text-white">Services Management</h1>
                      <p className="text-orange-100 text-lg">Create, manage, and optimize your service offerings</p>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{services.length}</div>
                      <div className="text-sm text-orange-100">Total Services</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
          </div>
        </div>

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Services */}
          <div className="group">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{services.length}</p>
                <p className="text-sm font-medium text-gray-600">Total Services</p>
                <p className="text-xs text-blue-600 mt-1 font-medium">All catalog items</p>
              </div>
            </div>
          </div>

          {/* Active Services */}
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
                <p className="text-3xl font-bold text-gray-900 mb-1">{services.filter(s => s.is_active).length}</p>
                <p className="text-sm font-medium text-gray-600">Active Services</p>
                <p className="text-xs text-green-600 mt-1 font-medium">Live & bookable</p>
              </div>
            </div>
          </div>

          {/* Featured Services */}
          <div className="group">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{services.filter(s => s.is_featured).length}</p>
                <p className="text-sm font-medium text-gray-600">Featured Services</p>
                <p className="text-xs text-purple-600 mt-1 font-medium">Promoted items</p>
              </div>
            </div>
          </div>

          {/* Categories Covered */}
          <div className="group">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{new Set(services.map(s => s.category_id)).size}</p>
                <p className="text-sm font-medium text-gray-600">Categories Covered</p>
                <p className="text-xs text-orange-600 mt-1 font-medium">Service types</p>
              </div>
            </div>
          </div>

        </div>

        {/* Enhanced Header Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Service Operations
                <span className="text-sm font-normal text-gray-600 ml-2">• Manage your service catalog</span>
              </h2>
              <p className="text-gray-600 font-medium">Create, edit, and optimize your service offerings for customers</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => forceRefreshAdminData()}
                className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium text-sm flex items-center space-x-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <svg className="w-4 h-4 relative z-10 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="relative z-10">Refresh</span>
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-bold flex items-center space-x-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="relative z-10">Add New Service</span>
              </button>
            </div>
          </div>
        </div>

      {/* Filter by Category */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-semibold text-gray-700">Filter by Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          >
            <option value="">All Categories</option>
            {categories.filter(cat => cat.is_active).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl min-h-[80vh] max-h-[95vh] overflow-hidden flex flex-col shadow-2xl my-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {editingService ? 'Edit Service' : 'Create New Service'}
                </h3>
                <p className="text-gray-600 mt-1">
                  {editingService ? 'Update service information and pricing' : 'Add a new service offering to your platform'}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 px-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'basic', name: 'Basic Info', icon: '📝' },
                  { id: 'pricing', name: 'Pricing & GST', icon: '💰' },
                  { id: 'services', name: 'Services', icon: '🛠️' },
                  { id: 'included', name: 'Included', icon: '✅' },
                  { id: 'notes', name: 'Notes', icon: '📋' },
                  { id: 'images', name: 'Service Images', icon: '📸' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'basic' | 'pricing' | 'services' | 'included' | 'notes' | 'images')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon} {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto h-full">
                
                {/* Required Fields Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-amber-800">Required Fields</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Please fill all required fields marked with <span className="text-red-500 font-bold">*</span>. 
                        The <strong>Short Description</strong> and <strong>Detailed Description</strong> are both required and must be at least 10 characters long.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    {/* Service Hierarchy Guide */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                        <span className="mr-2">📋</span> Service Creation Guide
                      </h4>
                      <div className="text-sm text-blue-700 space-y-2">
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-600 font-medium">Step 1:</span>
                          <div>
                            <span className="font-medium">Choose Category</span> - Main service type
                            <div className="text-xs text-blue-600 mt-1">Examples: Plumbing, Electrical, Cleaning, Repair & Maintenance</div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-600 font-medium">Step 2:</span>
                          <div>
                            <span className="font-medium">Choose Subcategory</span> - Specific service area (optional)
                            <div className="text-xs text-blue-600 mt-1">Examples: Tap Installation, Pipe Repair, AC Installation</div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-600 font-medium">Step 3:</span>
                          <div>
                            <span className="font-medium">Enter Service Name</span> - Exact service offering
                            <div className="text-xs text-blue-600 mt-1">Examples: "Kitchen Tap Installation", "Emergency Pipe Leak Repair", "Split AC Installation with Gas Filling"</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📂 1. Category * <span className="text-xs text-gray-500">(Main service type)</span>
                        </label>
                        <select
                          required
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}
                          className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 transition-colors ${
                            errors.category_id 
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        >
                          <option value="">Select a category...</option>
                          {categories.filter(cat => cat.is_active).map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        {errors.category_id && (
                          <p className="text-red-600 text-sm mt-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.category_id}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📁 2. Subcategory <span className="text-xs text-gray-500">(Specific area, optional)</span>
                        </label>
                        <select
                          value={formData.subcategory_id}
                          onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                          className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 transition-colors ${
                            errors.subcategory_id 
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                          disabled={!formData.category_id}
                        >
                          <option value="">
                            {formData.category_id 
                              ? "Select subcategory (optional)..." 
                              : "First select a category"
                            }
                          </option>
                          {filteredSubcategories.filter(sub => sub.is_active).map((subcategory) => (
                            <option key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </option>
                          ))}
                        </select>
                        {errors.subcategory_id && (
                          <p className="text-red-600 text-sm mt-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.subcategory_id}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📄 3. Service Name * <span className="text-xs text-gray-500">(Exact service offering)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 transition-colors ${
                          errors.name 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        placeholder="e.g., Kitchen Tap Installation, Emergency Pipe Leak Repair, Complete Toilet Installation"
                      />
                      {errors.name && (
                        <p className="text-red-600 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1 flex items-start">
                        <span className="mr-1">💡</span>
                        <span>Be specific about what service you're offering. This will appear in customer search results.</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ⏱️ Service Duration *
                      </label>
                      <input
                        type="number"
                        required
                        min="15"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                        className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 transition-colors ${
                          errors.duration 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        placeholder="60"
                      />
                      {errors.duration && (
                        <p className="text-red-600 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.duration}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Duration in minutes (minimum 15 minutes)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔸 Short Description * <span className="text-red-500 font-bold">(Required - Min 10 chars)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.short_description}
                        onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                        className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 transition-colors ${
                          errors.short_description 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        placeholder="Professional bathroom fittings installation and repair service"
                      />
                      {errors.short_description && (
                        <p className="text-red-600 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.short_description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          Current length: {formData.short_description.length} characters
                        </p>
                        {formData.short_description.length >= 10 ? (
                          <span className="text-xs text-green-600 font-medium flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Valid
                          </span>
                        ) : (
                          <span className="text-xs text-orange-600 font-medium">
                            Need {10 - formData.short_description.length} more chars
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔸 Detailed Description * <span className="text-red-500 font-bold">(Required - Min 10 chars, Max 255 chars)</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 transition-colors resize-none ${
                          errors.description 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        placeholder="Professional installation and repair of bathroom fittings including taps, shower heads, towel holders, soap dispensers, and other bathroom accessories."
                      />
                      {errors.description && (
                        <p className="text-red-600 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          Current length: {formData.description.length}/255 characters
                        </p>
                        {formData.description.length >= 10 && formData.description.length <= 255 ? (
                          <span className="text-xs text-green-600 font-medium flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Valid
                          </span>
                        ) : formData.description.length < 10 ? (
                          <span className="text-xs text-orange-600 font-medium">
                            Need {10 - formData.description.length} more chars
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 font-medium">
                            Too long! Reduce by {formData.description.length - 255} chars
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_featured"
                          checked={formData.is_featured}
                          onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
                          Featured service (highlighted display)
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_combo_eligible"
                          checked={formData.is_combo_eligible}
                          onChange={(e) => setFormData({ ...formData, is_combo_eligible: e.target.checked })}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_combo_eligible" className="ml-2 block text-sm text-gray-700">
                          Combo eligible (available in offer plans)
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing Tab */}
                {activeTab === 'pricing' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Base Price (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.base_price}
                          onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                          className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 transition-colors ${
                            errors.base_price 
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        {errors.base_price && (
                          <p className="text-red-600 text-sm mt-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.base_price}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          💰 Discount Percentage (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          step="1"
                          value={formData.discount_percentage || ''}
                          onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 20 for 20% off"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Optional: Enter percentage off from base price (0-99%)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Service Charge (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.service_charge}
                          onChange={(e) => setFormData({ ...formData, service_charge: parseFloat(e.target.value) || 79 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Per category charge</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GST Percentage (%) *
                        </label>
                        <select
                          value={formData.gst_percentage}
                          onChange={(e) => setFormData({ ...formData, gst_percentage: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={0}>0% (Exempt)</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </div>
                    </div>

                    {/* Pricing Summary */}
                    {formData.base_price > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Pricing Summary</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Base Price:</span>
                            <span className="font-medium ml-2">{formatPrice(formData.base_price)}</span>
                          </div>
                          
                          {formData.discount_percentage && formData.discount_percentage > 0 && (
                            <>
                              <div>
                                <span className="text-gray-600">Discount ({formData.discount_percentage}%):</span>
                                <span className="font-medium ml-2 text-red-600">-{formatPrice(formData.base_price * formData.discount_percentage / 100)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Discounted Price:</span>
                                <span className="font-medium ml-2 text-green-600">{formatPrice(formData.base_price * (1 - formData.discount_percentage / 100))}</span>
                              </div>
                            </>
                          )}
                          
                          <div>
                            <span className="text-gray-600">Service Charge:</span>
                            <span className="font-medium ml-2 text-orange-600">{formatPrice(formData.service_charge)}</span>
                          </div>
                          
                          {(() => {
                            const finalPrice = formData.discount_percentage && formData.discount_percentage > 0 
                              ? formData.base_price * (1 - formData.discount_percentage / 100)
                              : formData.base_price;
                            const gstAmount = finalPrice * formData.gst_percentage / 100;
                            const totalPrice = finalPrice + gstAmount + formData.service_charge;
                            
                            return (
                              <>
                                <div>
                                  <span className="text-gray-600">GST ({formData.gst_percentage}%):</span>
                                  <span className="font-medium ml-2">{formatPrice(gstAmount)}</span>
                                </div>
                                <div className="border-t pt-2">
                                  <span className="text-gray-600">Total Price:</span>
                                  <span className="font-bold ml-2 text-lg text-blue-600">{formatPrice(totalPrice)}</span>
                                </div>
                              </>
                            );
                          })()}
                          
                          <div className="text-xs text-gray-500 mt-2 bg-blue-50 p-2 rounded">
                            💡 <strong>Price Breakdown:</strong> Base Price {formData.discount_percentage && formData.discount_percentage > 0 ? `- Discount (${formData.discount_percentage}%)` : ''} + GST ({formData.gst_percentage}%) + Service Charge (₹{formData.service_charge})
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Services Tab */}
                {activeTab === 'services' && (
                  <div className="space-y-6">
                    {/* Requirements */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Requirements
                      </label>
                      {formData.requirements.map((requirement, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={requirement}
                            onChange={(e) => updateArrayItem('requirements', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Customer to provide access to work area"
                          />
                          <button
                            type="button"
                            onClick={() => addArrayItem('requirements', index)}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                          >
                            +
                          </button>
                          {formData.requirements.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayItem('requirements', index)}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                            >
                              -
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (for search and filtering)
                      </label>
                      {formData.tags.map((tag, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={tag}
                            onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="plumbing, installation, repair"
                          />
                          <button
                            type="button"
                            onClick={() => addArrayItem('tags', index)}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                          >
                            +
                          </button>
                          {formData.tags.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayItem('tags', index)}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                            >
                              -
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Included Tab */}
                {activeTab === 'included' && (
                  <div className="space-y-6">
                    {/* Inclusions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What's Included *
                      </label>
                      {formData.inclusions.map((inclusion, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={inclusion}
                            onChange={(e) => updateArrayItem('inclusions', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Professional technician visit"
                          />
                          <button
                            type="button"
                            onClick={() => addArrayItem('inclusions', index)}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                          >
                            +
                          </button>
                          {formData.inclusions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayItem('inclusions', index)}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                            >
                              -
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Exclusions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What's Excluded *
                      </label>
                      {formData.exclusions.map((exclusion, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={exclusion}
                            onChange={(e) => updateArrayItem('exclusions', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Cost of fittings/accessories"
                          />
                          <button
                            type="button"
                            onClick={() => addArrayItem('exclusions', index)}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                          >
                            +
                          </button>
                          {formData.exclusions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayItem('exclusions', index)}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                            >
                              -
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        rows={6}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any additional information or special instructions for this service"
                      />
                    </div>
                  </div>
                )}


                {/* Service Images Tab */}
                {activeTab === 'images' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Service Images</h4>
                      <p className="text-sm text-gray-600 mb-4">Add professional images to showcase this service. These images will appear in the service detail page gallery.</p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image URLs (one per line)
                      </label>
                      {formData.images.map((imageUrl, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="flex-1">
                            <input
                              type="url"
                              value={imageUrl}
                              onChange={(e) => {
                                const newImages = [...formData.images];
                                newImages[index] = e.target.value;
                                setFormData(prev => ({ ...prev, images: newImages }));
                              }}
                              placeholder={`Image ${index + 1} URL (e.g., /images/subcategories/plumbing/basin-sink-${index + 1}.jpg)`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = formData.images.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, images: newImages }));
                            }}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove Image"
                          >
                            🗑️
                          </button>
                          {imageUrl && (
                            <div className="w-12 h-12 border rounded-lg overflow-hidden">
                              <img 
                                src={imageUrl} 
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZCNzI4MCIgZm9udC1zaXplPSIxMiI+4p2M77iPPC90ZXh0Pgo8L3N2Zz4K';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
                        }}
                        className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-colors"
                      >
                        + Add Image URL
                      </button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-2">💡 Image Tips</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Use relative URLs: /images/subcategories/[category]/[service-name]-1.jpg</li>
                        <li>• First image will be the main display image on category pages</li>
                        <li>• All images will appear in the service detail gallery</li>
                        <li>• Recommended size: 400x300px, optimized JPEG format</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* General Error Message */}
              {errors.general && (
                <div className="px-6 pb-4">
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.general}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-200 mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 text-white py-3 px-6 rounded-lg transition-all transform shadow-lg font-semibold flex items-center justify-center ${
                    isSubmitting 
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:scale-105'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingService ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingService ? 'Update Service' : 'Create Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">All Services</h3>
              <p className="text-gray-600 mt-1">{services.filter(s => !selectedCategory || s.category_id === selectedCategory).length} services • {services.filter(s => s.is_active && (!selectedCategory || s.category_id === selectedCategory)).length} active</p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                {services.filter(s => s.is_active && (!selectedCategory || s.category_id === selectedCategory)).length} Active
              </div>
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium">
                {services.filter(s => !s.is_active && (!selectedCategory || s.category_id === selectedCategory)).length} Inactive
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Service Name
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {services
                .filter(service => !selectedCategory || service.category_id === selectedCategory)
                .map((service) => (
                <tr key={service.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300">
                  <td className="px-8 py-6">
                    <div>
                      <div className="text-base font-bold text-gray-900 mb-1">
                        {service.name}
                      </div>
                      <div className="text-sm text-gray-700 max-w-xs">
                        {service.short_description}
                      </div>
                      <div className="flex space-x-3 mt-2">
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          Duration: {service.duration} min
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          Rating: {service.rating}★
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {getCategoryName(service.category_id)}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-center">
                      {service.discounted_price ? (
                        <div>
                          <div className="text-lg font-bold text-green-600">{formatPrice(service.discounted_price)}</div>
                          <div className="text-sm text-gray-400 line-through">{formatPrice(service.base_price)}</div>
                          <div className="text-xs text-red-500 font-medium">
                            {Math.round(((service.base_price - service.discounted_price) / service.base_price) * 100)}% OFF
                          </div>
                        </div>
                      ) : (
                        <div className="text-lg font-bold text-gray-900">{formatPrice(service.base_price)}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex flex-col space-y-2">
                      <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${
                        service.is_active 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white ring-2 ring-green-200' 
                          : 'bg-gradient-to-r from-red-500 to-rose-600 text-white ring-2 ring-red-200'
                      }`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {service.is_featured && (
                        <span className="inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => startEdit(service)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(service)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md ${
                        service.is_active
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                      }`}
                    >
                      {service.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {services.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white text-3xl font-bold">+</span>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">No services found</h3>
            <p className="text-gray-600 mb-6 text-lg">Get started by creating your first service offering for customers</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Add First Service
            </button>
          </div>
        )}
        </div>
      </div>

        {/* Back to Home Button at Bottom */}
        <div className="mt-8 text-center pb-8">
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    </>
  );
};

export default ServicesManagement;