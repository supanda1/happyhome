import React, { useState, useEffect } from 'react';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  type Category 
} from '../../utils/adminDataManager';

interface CategoryFormData {
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

interface CategoriesManagementProps {
  onCategoryChange?: () => void;
}

const CategoriesManagement: React.FC<CategoriesManagementProps> = ({ onCategoryChange }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    is_active: true,
    sort_order: 0
  });

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      console.log('🔄 CategoriesManagement: Setting loading to true');
      setLoading(true);
      console.log('🔄 Fetching categories from database...');
      
      const categoriesData = await getCategories();
      console.log('✅ Categories loaded:', categoriesData.length);
      setCategories(categoriesData);
      console.log('🔄 CategoriesManagement: Setting loading to false');
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      alert('Failed to load categories from database. Please check your connection.');
    } finally {
      setLoading(false);
      console.log('✅ CategoriesManagement: Loading state set to FALSE - should show content now');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id, formData);
        await fetchCategories();
        onCategoryChange?.(); // Notify parent of category changes
        resetForm();
        alert('Category updated successfully!');
      } else {
        // Create new category
        await createCategory(formData);
        await fetchCategories();
        onCategoryChange?.(); // Notify parent of category changes
        resetForm();
        alert('Category created successfully!');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  };

  // Handle category deletion
  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all associated subcategories and services.')) {
      return;
    }

    try {
      await deleteCategory(categoryId);
      await fetchCategories();
      onCategoryChange?.(); // Notify parent of category changes
      alert('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(`Error deleting category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle enable/disable toggle
  const handleToggleStatus = async (category: Category) => {
    try {
      await updateCategory(category.id, {
        is_active: !category.is_active
      });
      
      await fetchCategories();
      onCategoryChange?.(); // Notify parent of category changes
      alert(`Category ${!category.is_active ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error updating category status:', error);
      alert(`Error updating category status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
      sort_order: 0
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const startEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description,
      is_active: category.is_active,
      sort_order: category.sort_order
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  console.log('🔍 CategoriesManagement render - loading state:', loading, 'categories count:', categories.length);
  
  if (loading) {
    console.log('🔄 CategoriesManagement: Still loading - showing spinner');
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-blue-600 font-semibold">Loading categories...</span>
      </div>
    );
  }
  
  console.log('✅ CategoriesManagement: Loading complete - showing content with', categories.length, 'categories');

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full transform -translate-x-12 translate-y-12"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-3 tracking-tight">Categories Management</h1>
          <p className="text-purple-100 text-lg leading-relaxed">Organize and manage your service categories - the foundation of your customer portal</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-blue-100 mb-2">Total Categories</p>
            <p className="text-4xl font-bold text-white">{categories.length}</p>
            <p className="text-xs text-blue-200 mt-2">Service Groups</p>
          </div>
        </div>

        {/* Active Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-100 mb-2">Active Categories</p>
            <p className="text-4xl font-bold text-white">{categories.filter(c => c.is_active).length}</p>
            <p className="text-xs text-green-200 mt-2">Live & Visible</p>
          </div>
        </div>

        {/* Customer Portal Sync */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-purple-100 mb-2">Portal Sync</p>
            <p className="text-2xl font-bold text-white">LIVE</p>
            <p className="text-xs text-purple-200 mt-2">Real-time</p>
          </div>
        </div>

        {/* Sort Order Range */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-orange-100 mb-2">Display Order</p>
            <p className="text-4xl font-bold text-white">{Math.max(...categories.map(c => c.sort_order), 0)}</p>
            <p className="text-xs text-orange-200 mt-2">Max Position</p>
          </div>
        </div>

      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Category Operations</h2>
          <p className="text-gray-600 text-sm">Manage service categories visible in customer portal - changes sync instantly</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg font-semibold"
        >
          <span>Add New Category</span>
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                <p className="text-gray-600 mt-1">
                  {editingCategory ? 'Update category information' : 'Add a new service category to your platform'}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded px-3 py-1 transition-colors text-sm font-medium"
              >
                CLOSE
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="e.g., Plumbing Services"
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
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                  placeholder="Professional services for all your household needs..."
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
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the category list</p>
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
                    Active Category
                  </label>
                </div>
                <p className="text-xs text-gray-600 ml-8 mt-1">When enabled, this category will be visible to customers</p>
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg font-semibold"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
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

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">All Categories</h3>
              <p className="text-gray-600 mt-1">{categories.length} categories • {categories.filter(c => c.is_active).length} active</p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                {categories.filter(c => c.is_active).length} Active
              </div>
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium">
                {categories.filter(c => !c.is_active).length} Inactive
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Category Name
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
              {categories.map((category, index) => (
                <tr key={category.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div>
                      <div className="text-base font-bold text-gray-900 mb-1">
                        {category.name}
                      </div>
                      <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                        ID: {category.id.slice(-8)}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm text-gray-700 max-w-xs">
                      {category.description}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${
                      category.is_active 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white ring-2 ring-green-200' 
                        : 'bg-gradient-to-r from-red-500 to-rose-600 text-white ring-2 ring-red-200'
                    }`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 font-bold text-lg rounded-full">
                        {category.sort_order}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => startEdit(category)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(category)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md ${
                        category.is_active
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                      }`}
                    >
                      {category.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
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

        {categories.length === 0 && (
          <div className="text-center py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">No categories found</h3>
            <p className="text-gray-600 text-xl leading-relaxed max-w-lg mx-auto mb-8">Get started by creating your first service category to organize your services beautifully</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl tracking-wide"
            >
              ADD FIRST CATEGORY
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesManagement;