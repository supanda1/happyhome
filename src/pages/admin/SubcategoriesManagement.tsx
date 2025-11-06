import React, { useState, useEffect } from 'react';
import { 
  getCategories, 
  getSubcategories,
  createSubcategory, 
  updateSubcategory, 
  deleteSubcategory, 
  initializeAdminData,
  type Category,
  type Subcategory
} from '../../utils/adminDataManager';

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

interface SubcategoryFormData {
  category_id: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

interface FormErrors {
  category_id?: string;
  name?: string;
  description?: string;
  sort_order?: string;
  general?: string;
}

interface SubcategoriesManagementProps {
  onCategoryChange?: () => void;
}

const SubcategoriesManagement: React.FC<SubcategoriesManagementProps> = ({ onCategoryChange }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [formData, setFormData] = useState<SubcategoryFormData>({
    category_id: '',
    name: '',
    description: '',
    is_active: true,
    sort_order: 0
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories and subcategories from API
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Initialize data if first time
      initializeAdminData();
      
      // Get categories and subcategories from API
      const categoriesData = await getCategories();
      const subcategoriesData = await getSubcategories();
      
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error to prevent filter issues
      setCategories([]);
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter subcategories by category
  useEffect(() => {
    if (selectedCategoryFilter) {
      setFilteredSubcategories(
        subcategories.filter(sub => sub.category_id === selectedCategoryFilter)
      );
    } else {
      setFilteredSubcategories(subcategories);
    }
  }, [subcategories, selectedCategoryFilter]);

  // Parse validation errors from API response
  const parseValidationErrors = (errorMessage: string): FormErrors => {
    const errors: FormErrors = {};
    
    if (errorMessage.includes('Validation Error:')) {
      const errorPart = errorMessage.split('Validation Error:')[1];
      if (errorPart.includes('description:')) {
        errors.description = errorPart.split('description:')[1].trim();
      }
      if (errorPart.includes('name:')) {
        errors.name = errorPart.split('name:')[1].split(',')[0].trim();
      }
      if (errorPart.includes('category_id:')) {
        errors.category_id = errorPart.split('category_id:')[1].split(',')[0].trim();
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
      if (editingSubcategory) {
        // Update existing subcategory
        const updatedSubcategory = await updateSubcategory(editingSubcategory.id, formData);
        if (updatedSubcategory) {
          await fetchData();
          onCategoryChange?.(); // Notify parent of subcategory changes
          resetForm();
        } else {
          setErrors({ general: 'Subcategory not found' });
        }
      } else {
        // Create new subcategory
        await createSubcategory({ ...formData, icon: '' });
        await fetchData();
        onCategoryChange?.(); // Notify parent of subcategory changes
        resetForm();
      }
    } catch (error) {
      console.error('Error saving subcategory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const validationErrors = parseValidationErrors(errorMessage);
      setErrors(validationErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle subcategory deletion
  const handleDelete = async (subcategoryId: string) => {
    if (!confirm('Are you sure you want to delete this subcategory? This will also delete all associated services.')) {
      return;
    }

    try {
      const success = await deleteSubcategory(subcategoryId);
      if (success) {
        await fetchData();
        onCategoryChange?.(); // Notify parent of subcategory changes
      }
    } catch (error) {
      console.error('Error deleting subcategory:', error);
    }
  };

  // Handle enable/disable toggle
  const handleToggleStatus = async (subcategory: Subcategory) => {
    try {
      const updatedSubcategory = await updateSubcategory(subcategory.id, {
        is_active: !subcategory.is_active
      });
      
      if (updatedSubcategory) {
        await fetchData();
        onCategoryChange?.(); // Notify parent of subcategory changes
      }
    } catch (error) {
      console.error('Error updating subcategory status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      name: '',
      description: '',
      is_active: true,
      sort_order: 0
    });
    setEditingSubcategory(null);
    setShowForm(false);
    setErrors({});
    setIsSubmitting(false);
  };

  const startEdit = (subcategory: Subcategory) => {
    setFormData({
      category_id: subcategory.category_id,
      name: subcategory.name,
      description: subcategory.description,
      is_active: subcategory.is_active,
      sort_order: subcategory.sort_order
    });
    setEditingSubcategory(subcategory);
    setShowForm(true);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  if (loading) {
    return (
      <>
        <style>{customStyles}</style>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center animate-fade-in">
          <div className="text-center animate-bounce-in">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 bg-clip-border mx-auto"></div>
              <div className="absolute inset-3 bg-white rounded-full"></div>
              <div className="absolute inset-4 animate-pulse bg-gradient-to-r from-purple-400 via-indigo-500 to-blue-500 rounded-full"></div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl border border-white/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
                  Loading Subcategories
                </h3>
                <p className="text-gray-600 font-medium">Fetching service subcategories and hierarchy data...</p>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
          <div className="relative overflow-hidden mb-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="mb-6 lg:mb-0">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold mb-2 tracking-tight">Subcategories Management</h1>
                        <p className="text-white/80 text-lg">Organize service hierarchy and improve customer navigation</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center min-w-[140px]">
                      <div className="text-3xl font-bold text-white mb-1">{subcategories.length}</div>
                      <div className="text-white/80 text-sm font-medium uppercase tracking-wide">Total Subcategories</div>
                    </div>
                    <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center min-w-[140px]">
                      <div className="text-3xl font-bold text-white mb-1">{subcategories.filter(s => s.is_active).length}</div>
                      <div className="text-white/80 text-sm font-medium uppercase tracking-wide">Active Subcategories</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            
            {/* Total Subcategories */}
            <div className="group cursor-pointer">
              <div className="relative bg-white rounded-3xl shadow-lg border border-gray-100 p-8 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                    </div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-4xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                      {subcategories.length}
                    </p>
                    <p className="text-lg font-semibold text-gray-700">Total Subcategories</p>
                    <p className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full inline-block">
                      Available items
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Subcategories */}
            <div className="group cursor-pointer">
              <div className="relative bg-white rounded-3xl shadow-lg border border-gray-100 p-8 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-4xl font-extrabold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                      {subcategories.filter(s => s.is_active).length}
                    </p>
                    <p className="text-lg font-semibold text-gray-700">Active Subcategories</p>
                    <p className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full inline-block">
                      Live & visible
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Categories */}
            <div className="group cursor-pointer">
              <div className="relative bg-white rounded-3xl shadow-lg border border-gray-100 p-8 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-4xl font-extrabold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                      {categories.length}
                    </p>
                    <p className="text-lg font-semibold text-gray-700">Parent Categories</p>
                    <p className="text-sm text-purple-600 font-medium bg-purple-50 px-3 py-1 rounded-full inline-block">
                      Main groups
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Average per Category */}
            <div className="group cursor-pointer">
              <div className="relative bg-white rounded-3xl shadow-lg border border-gray-100 p-8 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-4xl font-extrabold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                      {categories.length > 0 ? Math.round(subcategories.length / categories.length) : 0}
                    </p>
                    <p className="text-lg font-semibold text-gray-700">Avg per Category</p>
                    <p className="text-sm text-orange-600 font-medium bg-orange-50 px-3 py-1 rounded-full inline-block">
                      Sub-items
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Enhanced Subcategory Operations Section */}
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
                        Subcategory Operations
                      </h2>
                      <p className="text-lg text-gray-600 font-medium">Organize service hierarchy with precision and ease</p>
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
                        <span className="text-gray-700 font-medium">Hierarchical structure</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-gray-700 font-medium">Category filtering</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setShowForm(true)}
                    disabled={categories.length === 0}
                    className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl font-bold flex items-center justify-center space-x-3 overflow-hidden min-w-[180px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <svg className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="relative z-10 text-lg">Add Subcategory</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Category Filter */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">Filter by Category</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">Show subcategories for:</label>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors font-medium"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {selectedCategoryFilter && (
                  <button
                    onClick={() => setSelectedCategoryFilter('')}
                    className="group relative px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg font-medium text-sm overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10">Clear Filter</span>
                  </button>
                )}
              </div>
            </div>
          </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
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
                      {editingSubcategory ? 'Edit Subcategory' : 'Create New Subcategory'}
                    </h3>
                    <p className="text-white/90 text-lg font-medium mt-1">
                      {editingSubcategory ? 'Update subcategory information and settings' : 'Add a new service subcategory to organize your offerings'}
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

            {/* Form Content - Scrollable */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-8">
                
                  {/* General Error Message */}
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.general}
                      </div>
                    </div>
                  )}

                  {/* Parent Category Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                      <label className="text-lg font-semibold text-gray-800">
                        Parent Category *
                      </label>
                    </div>
                    <div className="relative">
                      <select
                        required
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className={`w-full px-4 py-4 bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-200 text-lg font-medium ${
                          errors.category_id 
                            ? 'border-red-300 focus:ring-red-100 focus:border-red-500' 
                            : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-500 hover:border-gray-300'
                        }`}
                      >
                        <option value="">Choose main service category...</option>
                        {categories.filter(c => c.is_active).map((category) => (
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
                    <p className="text-sm text-gray-600 ml-1">Select the main category this subcategory belongs to</p>
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

                  {/* Subcategory Name */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                      <label className="text-lg font-semibold text-gray-800">
                        Subcategory Name *
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
                        placeholder="e.g., Bath Fittings, Kitchen Appliances"
                      />
                    </div>
                    <p className="text-sm text-gray-600 ml-1">Be specific about the type of service subcategory</p>
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

                  {/* Description */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                      <label className="text-lg font-semibold text-gray-800">
                        Description *
                      </label>
                    </div>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      className={`w-full px-4 py-4 bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-200 text-lg resize-none ${
                        errors.description 
                          ? 'border-red-300 focus:ring-red-100 focus:border-red-500' 
                          : 'border-gray-200 focus:ring-green-100 focus:border-green-500 hover:border-gray-300'
                      }`}
                      placeholder="Professional installation and repair services for bathroom fittings including taps, shower heads, and accessories. Our experts ensure proper water pressure and leak-free connections."
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 ml-1">Minimum 5 characters required</p>
                      <p className="text-xs text-gray-500">Current length: {formData.description.length}</p>
                    </div>
                    {errors.description && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-red-700 text-sm flex items-center">
                          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sort Order and Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Sort Order */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="bg-orange-100 text-orange-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                        <label className="text-lg font-semibold text-gray-800">
                          Sort Order
                        </label>
                      </div>
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-4 bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-200 text-lg font-medium border-gray-200 focus:ring-orange-100 focus:border-orange-500 hover:border-gray-300"
                        placeholder="0"
                      />
                      <p className="text-sm text-gray-600 ml-1">Lower numbers appear first in the list</p>
                    </div>

                    {/* Active Status */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</div>
                        <label className="text-lg font-semibold text-gray-800">
                          Status
                        </label>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-200">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-purple-800">Active Subcategory</div>
                            <div className="text-xs text-purple-600 mt-1">When enabled, this subcategory will be visible to customers</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                          {editingSubcategory ? 'Updating Subcategory...' : 'Creating Subcategory...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {editingSubcategory ? 'Update Subcategory' : 'Create Subcategory'}
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

      {/* Subcategories List */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-8">
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Subcategory Catalog</h3>
                </div>
                <p className="text-white/90 text-lg font-medium">
                  {filteredSubcategories.length} subcategories • {filteredSubcategories.filter(s => s.is_active).length} active
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white/20 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm font-semibold border border-white/30 text-center">
                  <div className="text-xl font-bold">{filteredSubcategories.filter(s => s.is_active).length}</div>
                  <div className="text-white/80 text-xs uppercase tracking-wide">Active</div>
                </div>
                <div className="bg-white/20 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm font-semibold border border-white/30 text-center">
                  <div className="text-xl font-bold">{filteredSubcategories.filter(s => !s.is_active).length}</div>
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
                  Subcategory Details
                </th>
                <th className="px-8 py-6 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Parent Category
                </th>
                <th className="px-8 py-6 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-8 py-6 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-8 py-6 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="px-8 py-6 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredSubcategories.map((subcategory, index) => (
                <tr key={subcategory.id} className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300 group">
                  <td className="px-8 py-8">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:from-indigo-200 group-hover:to-purple-200 transition-all duration-300">
                        <span className="text-lg font-bold text-indigo-600">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-300">
                          {subcategory.name}
                        </div>
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          ID: {subcategory.id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 whitespace-nowrap">
                    <div className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300">
                      <span className="text-sm font-semibold text-gray-800">
                        {getCategoryName(subcategory.category_id)}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="text-sm text-gray-700 max-w-md leading-relaxed">
                      {subcategory.description}
                    </div>
                  </td>
                  <td className="px-8 py-8 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 ${
                      subcategory.is_active 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200' 
                        : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-200'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${subcategory.is_active ? 'bg-green-200' : 'bg-red-200'}`}></div>
                      {subcategory.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-8 py-8 whitespace-nowrap text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 font-bold text-xl rounded-2xl shadow-lg">
                      {subcategory.sort_order}
                    </div>
                  </td>
                  <td className="px-8 py-8 whitespace-nowrap text-center">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => startEdit(subcategory)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        Edit Subcategory
                      </button>
                      <button
                        onClick={() => handleToggleStatus(subcategory)}
                        className={`px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${
                          subcategory.is_active
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                        }`}
                      >
                        {subcategory.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(subcategory.id)}
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

        {filteredSubcategories.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white text-3xl font-bold">+</span>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
              {categories.length === 0 ? 'Create categories first' : 'No subcategories found'}
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              {categories.length === 0 
                ? 'You need to create categories first before adding subcategories'
                : selectedCategoryFilter 
                  ? 'This category doesn\'t have any subcategories yet' 
                  : 'Get started by creating your first subcategory to organize your services'
              }
            </p>
            {categories.length > 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Add First Subcategory
              </button>
            )}
          </div>
        )}
      </div>

        </div>
      </div>
    </>
  );
};

export default SubcategoriesManagement;