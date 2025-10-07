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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSubcategory) {
        // Update existing subcategory
        const updatedSubcategory = await updateSubcategory(editingSubcategory.id, formData);
        if (updatedSubcategory) {
          await fetchData();
          onCategoryChange?.(); // Notify parent of subcategory changes
          resetForm();
          alert('Subcategory updated successfully!');
        } else {
          alert('Error: Subcategory not found');
        }
      } else {
        // Create new subcategory
        await createSubcategory(formData);
        await fetchData();
        onCategoryChange?.(); // Notify parent of subcategory changes
        resetForm();
        alert('Subcategory created successfully!');
      }
    } catch (error) {
      console.error('Error saving subcategory:', error);
      alert('Error saving subcategory');
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
        alert('Subcategory deleted successfully!');
      } else {
        alert('Failed to delete subcategory');
      }
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      alert('Error deleting subcategory');
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
        alert(`Subcategory ${!subcategory.is_active ? 'enabled' : 'disabled'} successfully!`);
      } else {
        alert('Failed to update subcategory status');
      }
    } catch (error) {
      console.error('Error updating subcategory status:', error);
      alert('Error updating subcategory status');
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
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-12 translate-y-12 blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-white/20 rounded-2xl p-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Subcategories Management</h1>
                        <p className="text-purple-100 text-lg">Organize service hierarchy and improve customer navigation</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{subcategories.length}</div>
                        <div className="text-sm text-purple-100">Total Subcategories</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-purple-100 text-xl leading-relaxed mt-4">Create and manage subcategories to organize your service offerings effectively</p>
              </div>
            </div>
          </div>

          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Subcategories */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{subcategories.length}</p>
                  <p className="text-sm font-medium text-gray-600">Total Subcategories</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">Available items</p>
                </div>
              </div>
            </div>

            {/* Active Subcategories */}
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
                  <p className="text-3xl font-bold text-gray-900 mb-1">{subcategories.filter(s => s.is_active).length}</p>
                  <p className="text-sm font-medium text-gray-600">Active Subcategories</p>
                  <p className="text-xs text-green-600 mt-1 font-medium">Live & visible</p>
                </div>
              </div>
            </div>

            {/* Parent Categories */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{categories.length}</p>
                  <p className="text-sm font-medium text-gray-600">Parent Categories</p>
                  <p className="text-xs text-purple-600 mt-1 font-medium">Main groups</p>
                </div>
              </div>
            </div>

            {/* Average per Category */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{categories.length > 0 ? Math.round(subcategories.length / categories.length) : 0}</p>
                  <p className="text-sm font-medium text-gray-600">Avg per Category</p>
                  <p className="text-xs text-orange-600 mt-1 font-medium">Sub-items</p>
                </div>
              </div>
            </div>

          </div>

          {/* Enhanced Header Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Subcategory Operations
                  <span className="text-sm font-normal text-gray-600 ml-2">• Organize service hierarchy</span>
                </h2>
                <p className="text-gray-600 font-medium">Create and manage subcategories to organize your service offerings effectively</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowForm(true)}
                  disabled={categories.length === 0}
                  className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-bold flex items-center space-x-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="relative z-10">Add Subcategory</span>
                </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {editingSubcategory ? 'Edit Subcategory' : 'Create New Subcategory'}
                </h3>
                <p className="text-gray-600 mt-1">
                  {editingSubcategory ? 'Update subcategory information' : 'Add a new service subcategory to your platform'}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parent Category *
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="">Select a category</option>
                  {categories.filter(c => c.is_active).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subcategory Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="e.g., Bath Fittings"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                  placeholder="Professional installation and repair services for bathroom fittings including taps, shower heads, and accessories. Our experts ensure proper water pressure and leak-free connections."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the subcategory list</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-gray-700">
                    Active Subcategory
                  </label>
                </div>
                <p className="text-xs text-gray-600 ml-8 mt-1">When enabled, this subcategory will be visible to customers</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg font-semibold"
                >
                  {editingSubcategory ? 'Update Subcategory' : 'Create Subcategory'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategories List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">All Subcategories</h3>
              <p className="text-gray-600 mt-1">{filteredSubcategories.length} subcategories • {filteredSubcategories.filter(s => s.is_active).length} active</p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                {filteredSubcategories.filter(s => s.is_active).length} Active
              </div>
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium">
                {filteredSubcategories.filter(s => !s.is_active).length} Inactive
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Subcategory Name
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Parent Category
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredSubcategories.map((subcategory) => (
                <tr key={subcategory.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div>
                      <div className="text-base font-bold text-gray-900 mb-1">
                        {subcategory.name}
                      </div>
                      <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                        ID: {subcategory.id.slice(-8)}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {getCategoryName(subcategory.category_id)}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm text-gray-700 max-w-md leading-relaxed">
                      {subcategory.description}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${
                      subcategory.is_active 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white ring-2 ring-green-200' 
                        : 'bg-gradient-to-r from-red-500 to-rose-600 text-white ring-2 ring-red-200'
                    }`}>
                      {subcategory.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 font-bold text-lg rounded-full">
                        {subcategory.sort_order}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => startEdit(subcategory)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(subcategory)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md ${
                        subcategory.is_active
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                      }`}
                    >
                      {subcategory.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(subcategory.id)}
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