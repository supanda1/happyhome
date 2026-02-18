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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
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
      
      // Get data from API (include inactive services for admin)
      const categoriesData = await getCategories();
      const subcategoriesData = await getSubcategories();
      const servicesData = await getServices(true);
      
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

  // Filter services by category and status
  const filteredServices = services.filter(service => {
    const categoryMatch = !selectedCategory || service.category_id === selectedCategory;
    const statusMatch = statusFilter === 'all' || 
                       (statusFilter === 'active' && service.is_active) ||
                       (statusFilter === 'inactive' && !service.is_active);
    return categoryMatch && statusMatch;
  });

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
      // Ensure array fields are safely handled
      const safeInclusions = Array.isArray(formData.inclusions) ? formData.inclusions : [formData.inclusions || ''];
      const safeExclusions = Array.isArray(formData.exclusions) ? formData.exclusions : [formData.exclusions || ''];
      const safeRequirements = Array.isArray(formData.requirements) ? formData.requirements : [formData.requirements || ''];
      const safeTags = Array.isArray(formData.tags) ? formData.tags : [formData.tags || ''];
      const safeImages = Array.isArray(formData.images) ? formData.images : [formData.images || ''];
      
      const cleanFormData = {
        ...formData,
        discounted_price: discountedPrice,
        inclusions: safeInclusions.filter(item => item && typeof item === 'string' && item.trim()),
        exclusions: safeExclusions.filter(item => item && typeof item === 'string' && item.trim()),
        requirements: safeRequirements.filter(item => item && typeof item === 'string' && item.trim()),
        tags: safeTags.filter(item => item && typeof item === 'string' && item.trim()),
        image_paths: safeImages.filter(item => item && typeof item === 'string' && item.trim()), // Map images to image_paths for backend
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
    
    // Ensure array fields are properly converted to arrays
    const safeInclusions = Array.isArray(service.inclusions) ? service.inclusions : (service.inclusions ? [service.inclusions] : ['']);
    const safeExclusions = Array.isArray(service.exclusions) ? service.exclusions : (service.exclusions ? [service.exclusions] : ['']);
    const safeRequirements = Array.isArray(service.requirements) ? service.requirements : (service.requirements ? [service.requirements] : ['']);
    const safeTags = Array.isArray(service.tags) ? service.tags : (service.tags ? [service.tags] : ['']);
    const safeImages = Array.isArray(service.image_paths) ? service.image_paths : (service.image_paths ? [service.image_paths] : []);
    
    setFormData({
      name: service.name,
      category_id: service.category_id,
      subcategory_id: service.subcategory_id,
      description: service.description,
      short_description: service.short_description,
      base_price: service.base_price,
      discount_percentage: discountPercentage,
      duration: service.duration,
      inclusions: safeInclusions.length ? safeInclusions : [''],
      exclusions: safeExclusions.length ? safeExclusions : [''],
      requirements: safeRequirements.length ? safeRequirements : [''],
      is_active: service.is_active,
      is_featured: service.is_featured,
      is_combo_eligible: service.is_combo_eligible,
      tags: safeTags.length ? safeTags : [''],
      gst_percentage: service.gst_percentage || 18,
      service_charge: service.service_charge || 79,
      notes: service.notes || '',
      images: safeImages
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
        <div className="relative overflow-hidden mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-6 lg:mb-0">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold mb-2 tracking-tight">Services Management</h1>
                      <p className="text-white/80 text-lg">Create, manage, and optimize your service offerings</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center min-w-[140px]">
                    <div className="text-3xl font-bold text-white mb-1">{services.length}</div>
                    <div className="text-white/80 text-sm font-medium uppercase tracking-wide">Total Services</div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center min-w-[140px]">
                    <div className="text-3xl font-bold text-white mb-1">{services.filter(s => s.is_active).length}</div>
                    <div className="text-white/80 text-sm font-medium uppercase tracking-wide">Active Services</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Total Services */}
          <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl p-6 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-blue-100 mb-2">Total Services</p>
                <p className="text-2xl font-bold text-white mb-2 animate-pulse">{services.length}</p>
                <p className="text-xs text-blue-200">All catalog items</p>
              </div>
            </div>
          </div>

          {/* Active Services */}
          <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
            <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-xl p-6 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-green-100 mb-2">Active Services</p>
                <p className="text-2xl font-bold text-white mb-2 animate-pulse">{services.filter(s => s.is_active).length}</p>
                <p className="text-xs text-green-200">Live & bookable</p>
              </div>
            </div>
          </div>

          {/* Featured Services */}
          <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-xl p-6 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-purple-100 mb-2">Featured Services</p>
                <p className="text-2xl font-bold text-white mb-2 animate-pulse">{services.filter(s => s.is_featured).length}</p>
                <p className="text-xs text-purple-200">Promoted items</p>
              </div>
            </div>
          </div>

          {/* Categories Covered */}
          <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-xl p-6 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-orange-100 mb-2">Categories Covered</p>
                <p className="text-2xl font-bold text-white mb-2 animate-pulse">{new Set(services.map(s => s.category_id)).size}</p>
                <p className="text-xs text-orange-200">Service types</p>
              </div>
            </div>
          </div>

        </div>

        {/* Enhanced Service Operations Section */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100 mb-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-blue-50/30"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-36 translate-x-36"></div>
          
          <div className="relative z-10 p-8">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-3 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                      Service Operations
                    </h2>
                    <p className="text-lg text-gray-600 font-medium">Manage your service catalog with precision and ease</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-gray-700 font-medium">Real-time updates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-gray-700 font-medium">Advanced filtering</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-gray-700 font-medium">Bulk operations</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => forceRefreshAdminData()}
                  className="group relative px-6 py-4 bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center space-x-3 overflow-hidden min-w-[140px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <svg className="w-5 h-5 relative z-10 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="relative z-10">Refresh Data</span>
                </button>
                
                <button
                  onClick={() => setShowForm(true)}
                  className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl font-bold flex items-center justify-center space-x-3 overflow-hidden min-w-[180px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <svg className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="relative z-10 text-lg">Add New Service</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} {!category.is_active ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            >
              <option value="all">All Services</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
            {/* Modal Header - Fixed */}
            <div className="flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
              
              <div className="relative z-10 flex items-center justify-between p-6 sm:p-8">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/30">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {editingService ? 'Edit Service' : 'Create New Service'}
                    </h3>
                    <p className="text-white/90 text-lg font-medium mt-1">
                      {editingService ? 'Update service information and pricing' : 'Add a new service offering to your platform'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={resetForm}
                  className="flex-shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-2xl p-3 transition-all duration-200 hover:scale-105"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tab Navigation - Fixed */}
            <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
              <div className="px-6 sm:px-8 py-4">
                <nav className="flex space-x-2 overflow-x-auto">
                  {[
                    { id: 'basic', name: 'Basic Info' },
                    { id: 'pricing', name: 'Pricing & GST' },
                    { id: 'services', name: 'Services' },
                    { id: 'included', name: 'Included' },
                    { id: 'notes', name: 'Notes' },
                    { id: 'images', name: 'Service Images' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as 'basic' | 'pricing' | 'services' | 'included' | 'notes' | 'images')}
                      className={`flex-shrink-0 px-6 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200'
                          : 'bg-white text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 shadow-md hover:shadow-lg border border-gray-200'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Form Content - Scrollable */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-6">
                
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-8">
                    {/* Service Creation Guide */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border border-indigo-200 rounded-2xl p-6 shadow-lg">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                      <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="bg-indigo-500 rounded-xl p-2">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-indigo-800">Service Creation Guide</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                              <span className="font-semibold text-indigo-800">Choose Category</span>
                            </div>
                            <p className="text-sm text-indigo-600">Ex: Plumbing, Electrical, Cleaning</p>
                          </div>
                          
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                              <span className="font-semibold text-purple-800">Choose Subcategory</span>
                            </div>
                            <p className="text-sm text-purple-600">Ex: Tap Installation, Pipe Repair</p>
                          </div>
                          
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                              <span className="font-semibold text-blue-800">Enter Service Name</span>
                            </div>
                            <p className="text-sm text-blue-600">Ex: "Kitchen Tap Installation"</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Category Selection */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                          <label className="text-lg font-semibold text-gray-800">
                            Category *
                          </label>
                        </div>
                        <div className="relative">
                          <select
                            required
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}
                            className={`w-full px-4 py-4 bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-200 text-lg font-medium ${
                              errors.category_id 
                                ? 'border-red-300 focus:ring-red-100 focus:border-red-500' 
                                : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-500 hover:border-gray-300'
                            }`}
                          >
                            <option value="">Choose main service category...</option>
                            {categories.filter(cat => cat.is_active).map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 ml-1">Main service type (e.g., Plumbing, Electrical)</p>
                        {errors.category_id && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <p className="text-red-700 text-sm flex items-center">
                              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.category_id}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Subcategory Selection */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                          <label className="text-lg font-semibold text-gray-800">
                            Subcategory
                          </label>
                        </div>
                        <div className="relative">
                          <select
                            value={formData.subcategory_id}
                            onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                            className={`w-full px-4 py-4 bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-200 text-lg font-medium ${
                              !formData.category_id 
                                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                : errors.subcategory_id 
                                  ? 'border-red-300 focus:ring-red-100 focus:border-red-500' 
                                  : 'border-gray-200 focus:ring-purple-100 focus:border-purple-500 hover:border-gray-300'
                            }`}
                            disabled={!formData.category_id}
                          >
                            <option value="">
                              {formData.category_id 
                                ? "Select specific area (optional)..." 
                                : "First select a category"
                              }
                            </option>
                            {filteredSubcategories.filter(sub => sub.is_active).map((subcategory) => (
                              <option key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 ml-1">Specific area (e.g., Tap Installation, Pipe Repair)</p>
                        {errors.subcategory_id && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <p className="text-red-700 text-sm flex items-center">
                              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.subcategory_id}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Service Name */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                        <label className="text-lg font-semibold text-gray-800">
                          Service Name *
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={`w-full px-4 py-4 bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-200 text-lg font-medium ${
                            errors.name 
                              ? 'border-red-300 focus:ring-red-100 focus:border-red-500' 
                              : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300'
                          }`}
                          placeholder="e.g., Kitchen Tap Installation, Emergency Pipe Leak Repair"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 ml-1">Be specific about what service you're offering</p>
                      {errors.name && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                          <p className="text-red-700 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.name}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Service Duration */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                        <label className="text-lg font-semibold text-gray-800">
                          Service Duration *
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="15"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                          className={`w-full px-4 py-4 bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-200 text-lg font-medium ${
                            errors.duration 
                              ? 'border-red-300 focus:ring-red-100 focus:border-red-500' 
                              : 'border-gray-200 focus:ring-green-100 focus:border-green-500 hover:border-gray-300'
                          }`}
                          placeholder="60"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <div className="flex items-center space-x-2 text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">mins</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 ml-1">Duration in minutes (minimum 15 minutes)</p>
                      {errors.duration && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                          <p className="text-red-700 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.duration}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Short Description * <span className="text-red-500 font-bold">(Required - Min 10 chars)</span>
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
                        Detailed Description * <span className="text-red-500 font-bold">(Required - Min 10 chars, Max 255 chars)</span>
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

                    {/* Service Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">⚙</div>
                        <h3 className="text-lg font-semibold text-gray-800">Service Settings</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="relative">
                          <label className="flex items-center p-4 bg-white border-2 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md hover:border-green-300 has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                            <input
                              type="checkbox"
                              id="is_active"
                              checked={formData.is_active}
                              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mr-3 transition-all duration-200 ${
                              formData.is_active 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-gray-300 hover:border-green-400'
                            }`}>
                              {formData.is_active && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">Active Service</div>
                              <div className="text-sm text-gray-600">Visible to customers</div>
                            </div>
                          </label>
                        </div>

                        <div className="relative">
                          <label className="flex items-center p-4 bg-white border-2 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md hover:border-yellow-300 has-[:checked]:border-yellow-500 has-[:checked]:bg-yellow-50">
                            <input
                              type="checkbox"
                              id="is_featured"
                              checked={formData.is_featured}
                              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mr-3 transition-all duration-200 ${
                              formData.is_featured 
                                ? 'bg-yellow-500 border-yellow-500' 
                                : 'border-gray-300 hover:border-yellow-400'
                            }`}>
                              {formData.is_featured && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">Featured Service</div>
                              <div className="text-sm text-gray-600">Highlighted display</div>
                            </div>
                          </label>
                        </div>

                        <div className="relative">
                          <label className="flex items-center p-4 bg-white border-2 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md hover:border-purple-300 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50">
                            <input
                              type="checkbox"
                              id="is_combo_eligible"
                              checked={formData.is_combo_eligible}
                              onChange={(e) => setFormData({ ...formData, is_combo_eligible: e.target.checked })}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mr-3 transition-all duration-200 ${
                              formData.is_combo_eligible 
                                ? 'bg-purple-500 border-purple-500' 
                                : 'border-gray-300 hover:border-purple-400'
                            }`}>
                              {formData.is_combo_eligible && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">Combo Eligible</div>
                              <div className="text-sm text-gray-600">Available in offers</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing Tab */}
                {activeTab === 'pricing' && (
                  <div className="space-y-8">
                    {/* Pricing Header */}
                    <div className="text-center">
                      <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl px-6 py-3 border border-green-200">
                        <div className="bg-green-500 rounded-xl p-2">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-green-800">Service Pricing & Taxes</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Base Price */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">₹</div>
                          <label className="text-lg font-semibold text-gray-800">
                            Base Price *
                          </label>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <span className="text-gray-500 text-lg font-semibold">₹</span>
                          </div>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.base_price}
                            onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                            className={`w-full pl-12 pr-4 py-4 bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-200 text-lg font-medium ${
                              errors.base_price 
                                ? 'border-red-300 focus:ring-red-100 focus:border-red-500' 
                                : 'border-gray-200 focus:ring-green-100 focus:border-green-500 hover:border-gray-300'
                            }`}
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-sm text-gray-600 ml-1">The main service charge</p>
                        {errors.base_price && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <p className="text-red-700 text-sm flex items-center">
                              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.base_price}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Discount Percentage */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">%</div>
                          <label className="text-lg font-semibold text-gray-800">
                            Discount Percentage
                          </label>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            step="1"
                            value={formData.discount_percentage || ''}
                            onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-4 bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-200 text-lg font-medium border-gray-200 focus:ring-red-100 focus:border-red-500 hover:border-gray-300"
                            placeholder="e.g., 20 for 20% off"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <span className="text-gray-500 text-lg font-semibold">%</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 ml-1">Optional discount (0-99%)</p>
                      </div>

                      {/* Service Charge */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">+</div>
                          <label className="text-lg font-semibold text-gray-800">
                            Service Charge *
                          </label>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <span className="text-gray-500 text-lg font-semibold">₹</span>
                          </div>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.service_charge}
                            onChange={(e) => setFormData({ ...formData, service_charge: parseFloat(e.target.value) || 79 })}
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-200 text-lg font-medium border-gray-200 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300"
                            placeholder="79.00"
                          />
                        </div>
                        <p className="text-sm text-gray-600 ml-1">Per category charge</p>
                      </div>

                      {/* GST Percentage */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">T</div>
                          <label className="text-lg font-semibold text-gray-800">
                            GST Rate *
                          </label>
                        </div>
                        <div className="relative">
                          <select
                            value={formData.gst_percentage}
                            onChange={(e) => setFormData({ ...formData, gst_percentage: parseFloat(e.target.value) })}
                            className="w-full px-4 py-4 bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-200 text-lg font-medium border-gray-200 focus:ring-purple-100 focus:border-purple-500 hover:border-gray-300 appearance-none"
                          >
                            <option value={0}>0% (Exempt)</option>
                            <option value={5}>5% (Low Rate)</option>
                            <option value={12}>12% (Medium Rate)</option>
                            <option value={18}>18% (Standard Rate)</option>
                            <option value={28}>28% (High Rate)</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 ml-1">Government tax rate</p>
                      </div>
                    </div>

                    {/* Pricing Summary */}
                    {formData.base_price > 0 && (
                      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="bg-blue-500 rounded-xl p-2">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h4 className="text-xl font-bold text-blue-800">Pricing Summary</h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700 font-medium">Base Price</span>
                                <span className="font-bold text-lg text-gray-900">{formatPrice(formData.base_price)}</span>
                              </div>
                            </div>
                            
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700 font-medium">Service Charge</span>
                                <span className="font-bold text-lg text-orange-600">{formatPrice(formData.service_charge)}</span>
                              </div>
                            </div>
                            
                            {formData.discount_percentage && formData.discount_percentage > 0 && (
                              <>
                                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-700 font-medium">Discount ({formData.discount_percentage}%)</span>
                                    <span className="font-bold text-lg text-red-600">-{formatPrice(formData.base_price * formData.discount_percentage / 100)}</span>
                                  </div>
                                </div>
                                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-700 font-medium">After Discount</span>
                                    <span className="font-bold text-lg text-green-600">{formatPrice(formData.base_price * (1 - formData.discount_percentage / 100))}</span>
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {(() => {
                              const finalPrice = formData.discount_percentage && formData.discount_percentage > 0 
                                ? formData.base_price * (1 - formData.discount_percentage / 100)
                                : formData.base_price;
                              const gstAmount = finalPrice * formData.gst_percentage / 100;
                              
                              return (
                                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-700 font-medium">GST ({formData.gst_percentage}%)</span>
                                    <span className="font-bold text-lg text-purple-600">{formatPrice(gstAmount)}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          
                          {(() => {
                            const finalPrice = formData.discount_percentage && formData.discount_percentage > 0 
                              ? formData.base_price * (1 - formData.discount_percentage / 100)
                              : formData.base_price;
                            const gstAmount = finalPrice * formData.gst_percentage / 100;
                            const totalPrice = finalPrice + gstAmount + formData.service_charge;
                            
                            return (
                              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="bg-white/20 rounded-full p-2">
                                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                      </svg>
                                    </div>
                                    <span className="text-xl font-semibold">Customer Pays</span>
                                  </div>
                                  <span className="font-bold text-3xl">{formatPrice(totalPrice)}</span>
                                </div>
                              </div>
                            );
                          })()}
                          
                          <div className="bg-blue-100 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start space-x-3">
                              <div className="bg-blue-500 rounded-full p-1 mt-0.5">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-blue-800 mb-1">Price Calculation</p>
                                <p className="text-sm text-blue-700">
                                  Base Price {formData.discount_percentage && formData.discount_percentage > 0 ? `- Discount (${formData.discount_percentage}%)` : ''} + GST ({formData.gst_percentage}%) + Service Charge (₹{formData.service_charge})
                                </p>
                              </div>
                            </div>
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
                            ✕
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
                      <h5 className="font-medium text-blue-900 mb-2">Image Tips</h5>
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
              </div>

              {/* General Error Message - Above Footer */}
              {errors.general && (
                <div className="flex-shrink-0 p-4 sm:p-6 pt-0">
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{errors.general}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer - Fixed */}
              <div className="flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-blue-50"></div>
                <div className="relative z-10 border-t border-gray-200 p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-4 px-8 rounded-2xl transition-all duration-200 font-semibold border-2 border-gray-200 hover:border-gray-300 text-lg shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex-1 text-white py-4 px-8 rounded-2xl transition-all duration-200 transform shadow-xl font-bold flex items-center justify-center text-lg ${
                        isSubmitting 
                          ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 hover:scale-105 hover:shadow-2xl'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {editingService ? 'Updating Service...' : 'Creating Service...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {editingService ? 'Update Service' : 'Create Service'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-8">
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Service Catalog</h3>
                </div>
                <p className="text-white/90 text-lg font-medium">
                  {filteredServices.length} services • {filteredServices.filter(s => s.is_active).length} active
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white/20 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm font-semibold border border-white/30 text-center">
                  <div className="text-xl font-bold">{filteredServices.filter(s => s.is_active).length}</div>
                  <div className="text-white/80 text-xs uppercase tracking-wide">Active</div>
                </div>
                <div className="bg-white/20 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm font-semibold border border-white/30 text-center">
                  <div className="text-xl font-bold">{filteredServices.filter(s => !s.is_active).length}</div>
                  <div className="text-white/80 text-xs uppercase tracking-wide">Inactive</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto bg-gray-50/50">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200">
              <tr>
                <th className="px-8 py-6 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Service Details
                </th>
                <th className="px-8 py-6 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-8 py-6 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-8 py-6 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-8 py-6 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredServices.map((service, index) => (
                <tr key={service.id} className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300 group">
                  <td className="px-8 py-8">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:from-indigo-200 group-hover:to-purple-200 transition-all duration-300">
                        <span className="text-lg font-bold text-indigo-600">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-300">
                          {service.name}
                        </div>
                        <div className="text-sm text-gray-600 mb-3 max-w-md leading-relaxed">
                          {service.short_description}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {service.duration} min
                          </div>
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {service.rating}★
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 whitespace-nowrap">
                    <div className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300">
                      <span className="text-sm font-semibold text-gray-800">
                        {getCategoryName(service.category_id)}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-8 whitespace-nowrap text-center">
                    <div className="space-y-1">
                      {service.discounted_price ? (
                        <div>
                          <div className="text-2xl font-bold text-green-600">{formatPrice(service.discounted_price)}</div>
                          <div className="text-sm text-gray-400 line-through">{formatPrice(service.base_price)}</div>
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
                            {Math.round(((service.base_price - service.discounted_price) / service.base_price) * 100)}% OFF
                          </div>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-gray-900">{formatPrice(service.base_price)}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-8 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <span className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 ${
                        service.is_active 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200' 
                          : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-200'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${service.is_active ? 'bg-green-200' : 'bg-red-200'}`}></div>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {service.is_featured && (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-8 whitespace-nowrap text-center">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => startEdit(service)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        Edit Service
                      </button>
                      <button
                        onClick={() => handleToggleStatus(service)}
                        className={`px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${
                          service.is_active
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                        }`}
                      >
                        {service.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        Delete
                      </button>
                    </div>
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