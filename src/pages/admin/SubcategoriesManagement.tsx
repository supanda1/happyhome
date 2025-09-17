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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full transform -translate-x-12 translate-y-12"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-3 tracking-tight">Subcategories Management</h1>
          <p className="text-purple-100 text-lg leading-relaxed">Organize and manage service subcategories for better customer navigation</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Subcategories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-blue-100 mb-2">Total Subcategories</p>
            <p className="text-4xl font-bold text-white">{subcategories.length}</p>
            <p className="text-xs text-blue-200 mt-2">Available</p>
          </div>
        </div>

        {/* Active Subcategories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-100 mb-2">Active</p>
            <p className="text-4xl font-bold text-white">{subcategories.filter(s => s.is_active).length}</p>
            <p className="text-xs text-green-200 mt-2">Live</p>
          </div>
        </div>

        {/* Parent Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-purple-100 mb-2">Parent Categories</p>
            <p className="text-4xl font-bold text-white">{categories.length}</p>
            <p className="text-xs text-purple-200 mt-2">Main Groups</p>
          </div>
        </div>

        {/* Average per Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-orange-100 mb-2">Avg per Category</p>
            <p className="text-4xl font-bold text-white">{categories.length > 0 ? Math.round(subcategories.length / categories.length) : 0}</p>
            <p className="text-xs text-orange-200 mt-2">Sub-Items</p>
          </div>
        </div>

      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Subcategory Operations</h2>
          <p className="text-gray-600 text-sm">Create and manage subcategories to organize your service offerings</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50"
          disabled={categories.length === 0}
        >
          <span>Add Subcategory</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear Filter
            </button>
          )}
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
  );
};

export default SubcategoriesManagement;