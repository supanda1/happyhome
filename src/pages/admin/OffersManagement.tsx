import React, { useState, useEffect } from 'react';
import {
  getOfferPlans,
  createOfferPlan,
  updateOfferPlan,
  deleteOfferPlan,
  initializeAllAdminData,
  type OfferPlan
} from '../../utils/adminDataManager';

interface OffersManagementProps {
  onOfferChange?: () => void;
}

interface OfferFormData {
  title: string;
  description: string;
  duration_months: number;
  discount_percentage: number;
  combo_coupon_code: string;
  is_active: boolean;
  sort_order: number;
  benefits: string[];
  terms_conditions: string[];
}

const OffersManagement: React.FC<OffersManagementProps> = ({ onOfferChange }) => {
  const [offers, setOffers] = useState<OfferPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'benefits' | 'terms'>('basic');

  const [formData, setFormData] = useState<OfferFormData>({
    title: '',
    description: '',
    duration_months: 3,
    discount_percentage: 30,
    combo_coupon_code: '',
    is_active: true,
    sort_order: 1,
    benefits: ['Savings on all selected services'],
    terms_conditions: ['Services must be used within the plan duration']
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await initializeAllAdminData(); // SECURITY: Proper async initialization
      const offerData = await getOfferPlans(); // SECURITY: Proper async handling
      // SECURITY: Ensure offerData is always an array to prevent filter errors
      setOffers(Array.isArray(offerData) ? offerData : []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]); // Ensure state remains as empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const cleanFormData = {
        ...formData,
        benefits: formData.benefits.filter(item => item.trim()),
        terms_conditions: formData.terms_conditions.filter(item => item.trim())
      };

      if (editingOffer) {
        const updatedOffer = updateOfferPlan(editingOffer.id, cleanFormData);
        if (updatedOffer) {
          await fetchData(); // SECURITY: Proper async handling
          onOfferChange?.();
          resetForm();
          alert('Offer plan updated successfully!');
        } else {
          alert('Error: Offer plan not found');
        }
      } else {
        await createOfferPlan(cleanFormData); // SECURITY: Proper async handling
        await fetchData(); // SECURITY: Proper async handling
        onOfferChange?.();
        resetForm();
        alert('Offer plan created successfully!');
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      alert('Error saving offer plan');
    }
  };

  const handleDelete = (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer plan? This action cannot be undone.')) {
      return;
    }

    try {
      const success = deleteOfferPlan(offerId);
      if (success) {
        fetchData();
        onOfferChange?.();
        alert('Offer plan deleted successfully!');
      } else {
        alert('Failed to delete offer plan');
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Error deleting offer plan');
    }
  };

  const handleToggleStatus = (offer: OfferPlan) => {
    try {
      const updatedOffer = updateOfferPlan(offer.id, {
        is_active: !offer.is_active
      });
      
      if (updatedOffer) {
        fetchData();
        onOfferChange?.();
        alert(`Offer plan ${!offer.is_active ? 'enabled' : 'disabled'} successfully!`);
      } else {
        alert('Failed to update offer plan status');
      }
    } catch (error) {
      console.error('Error updating offer status:', error);
      alert('Error updating offer plan status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      duration_months: 3,
      discount_percentage: 30,
      combo_coupon_code: '',
      is_active: true,
      sort_order: 1,
      benefits: ['Savings on all selected services'],
      terms_conditions: ['Services must be used within the plan duration']
    });
    setEditingOffer(null);
    setShowForm(false);
    setActiveTab('basic');
  };

  const startEdit = (offer: OfferPlan) => {
    setFormData({
      title: offer.title,
      description: offer.description,
      duration_months: offer.duration_months,
      discount_percentage: offer.discount_percentage,
      combo_coupon_code: offer.combo_coupon_code,
      is_active: offer.is_active,
      sort_order: offer.sort_order,
      benefits: offer.benefits.length ? offer.benefits : ['30% savings on all selected services'],
      terms_conditions: offer.terms_conditions.length ? offer.terms_conditions : ['Services must be used within the plan duration']
    });
    setEditingOffer(offer);
    setShowForm(true);
  };

  const addArrayItem = (field: keyof OfferFormData, index: number) => {
    const newArray = [...(formData[field] as string[])];
    newArray.splice(index + 1, 0, '');
    setFormData({ ...formData, [field]: newArray });
  };

  const removeArrayItem = (field: keyof OfferFormData, index: number) => {
    const newArray = [...(formData[field] as string[])];
    if (newArray.length > 1) {
      newArray.splice(index, 1);
      setFormData({ ...formData, [field]: newArray });
    }
  };

  const updateArrayItem = (field: keyof OfferFormData, index: number, value: string) => {
    const newArray = [...(formData[field] as string[])];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">🎁 Offers Management Dashboard</h1>
        <p className="text-purple-100">Create and manage subscription plans and combo offers for customer savings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Offers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-blue-100 mb-2">Total Offers</p>
            <p className="text-4xl font-bold text-white">{Array.isArray(offers) ? offers.length : 0}</p>
            <p className="text-xs text-blue-200 mt-2">Plans Available</p>
          </div>
        </div>

        {/* Active Offers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-100 mb-2">Active Offers</p>
            <p className="text-4xl font-bold text-white">{Array.isArray(offers) ? offers.filter(o => o.is_active).length : 0}</p>
            <p className="text-xs text-green-200 mt-2">Live & Bookable</p>
          </div>
        </div>

        {/* Average Discount */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-purple-100 mb-2">Avg Discount</p>
            <p className="text-4xl font-bold text-white">
              {Array.isArray(offers) && offers.length > 0 ? Math.round(offers.reduce((sum, o) => sum + o.discount_percentage, 0) / offers.length) : 0}%
            </p>
            <p className="text-xs text-purple-200 mt-2">Customer Savings</p>
          </div>
        </div>

        {/* Total Duration Range */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-orange-100 mb-2">Max Duration</p>
            <p className="text-4xl font-bold text-white">{Array.isArray(offers) && offers.length > 0 ? Math.max(...offers.map(o => o.duration_months), 0) : 0}M</p>
            <p className="text-xs text-orange-200 mt-2">Months</p>
          </div>
        </div>

      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Offer Plan Operations</h2>
          <p className="text-gray-600 text-sm">Create and manage subscription plans with combo offers and discounts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
        >
          <span>🎁</span>
          <span>Add New Offer Plan</span>
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {editingOffer ? 'Edit Offer Plan' : 'Create New Offer Plan'}
                </h3>
                <p className="text-gray-600 mt-1">
                  {editingOffer ? 'Update offer plan information' : 'Add a new subscription offer plan for customers'}
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
                  { id: 'benefits', name: 'Benefits', icon: '🎁' },
                  { id: 'terms', name: 'Terms & Conditions', icon: '📋' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
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
                
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Plan Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          placeholder="e.g., 3 Months Essential Plan"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Duration (Months) *
                        </label>
                        <select
                          required
                          value={formData.duration_months}
                          onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        >
                          <option value={3}>3 Months</option>
                          <option value={6}>6 Months</option>
                          <option value={12}>12 Months</option>
                          <option value={24}>24 Months</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Discount Percentage (%) *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={formData.discount_percentage}
                          onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Combo Coupon Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.combo_coupon_code}
                          onChange={(e) => setFormData({ ...formData, combo_coupon_code: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          placeholder="e.g., COMBO30-3M"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Sort Order
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.sort_order}
                          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the offer list</p>
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
                            Active Offer Plan
                          </label>
                        </div>
                        <p className="text-xs text-gray-600 ml-8 mt-1">When enabled, this offer will be visible to customers</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Plan Description *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                        placeholder="Perfect for getting started with regular home maintenance"
                      />
                    </div>
                  </div>
                )}

                {/* Benefits Tab */}
                {activeTab === 'benefits' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Plan Benefits *
                      </label>
                      {formData.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-3">
                          <input
                            type="text"
                            value={benefit}
                            onChange={(e) => updateArrayItem('benefits', index, e.target.value)}
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                            placeholder="e.g., 30% savings on all selected services"
                          />
                          <button
                            type="button"
                            onClick={() => addArrayItem('benefits', index)}
                            className="px-4 py-3 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-lg hover:from-green-200 hover:to-emerald-200 transition-colors font-medium"
                          >
                            +
                          </button>
                          {formData.benefits.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayItem('benefits', index)}
                              className="px-4 py-3 bg-gradient-to-r from-red-100 to-rose-100 text-red-700 rounded-lg hover:from-red-200 hover:to-rose-200 transition-colors font-medium"
                            >
                              -
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Terms & Conditions Tab */}
                {activeTab === 'terms' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Terms & Conditions *
                      </label>
                      {formData.terms_conditions.map((term, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-3">
                          <input
                            type="text"
                            value={term}
                            onChange={(e) => updateArrayItem('terms_conditions', index, e.target.value)}
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                            placeholder="e.g., Services must be used within the plan duration"
                          />
                          <button
                            type="button"
                            onClick={() => addArrayItem('terms_conditions', index)}
                            className="px-4 py-3 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-lg hover:from-green-200 hover:to-emerald-200 transition-colors font-medium"
                          >
                            +
                          </button>
                          {formData.terms_conditions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayItem('terms_conditions', index)}
                              className="px-4 py-3 bg-gradient-to-r from-red-100 to-rose-100 text-red-700 rounded-lg hover:from-red-200 hover:to-rose-200 transition-colors font-medium"
                            >
                              -
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg font-semibold"
                >
                  {editingOffer ? 'Update Offer Plan' : 'Create Offer Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offers List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">All Offer Plans</h3>
              <p className="text-gray-600 mt-1">{Array.isArray(offers) ? offers.length : 0} offers • {Array.isArray(offers) ? offers.filter(o => o.is_active).length : 0} active</p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                {Array.isArray(offers) ? offers.filter(o => o.is_active).length : 0} Active
              </div>
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium">
                {Array.isArray(offers) ? offers.filter(o => !o.is_active).length : 0} Inactive
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Plan Details
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Duration & Discount
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Coupon Code
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
              {Array.isArray(offers) ? offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300">
                  <td className="px-8 py-6">
                    <div>
                      <div className="text-base font-bold text-gray-900 mb-1">
                        {offer.title}
                      </div>
                      <div className="text-sm text-gray-700 max-w-xs">
                        {offer.description}
                      </div>
                      <div className="flex space-x-3 mt-2">
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          Benefits: {offer.benefits.length}
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          Terms: {offer.terms_conditions.length}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">
                        {offer.duration_months} months
                      </div>
                      <div className="inline-flex items-center justify-center w-16 h-8 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 font-bold text-sm rounded-full mt-1">
                        {offer.discount_percentage}% OFF
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 shadow-sm">
                      {offer.combo_coupon_code}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${
                      offer.is_active 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white ring-2 ring-green-200' 
                        : 'bg-gradient-to-r from-red-500 to-rose-600 text-white ring-2 ring-red-200'
                    }`}>
                      {offer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => startEdit(offer)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(offer)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md ${
                        offer.is_active
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                      }`}
                    >
                      {offer.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(offer.id)}
                      className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>

        {(!Array.isArray(offers) || offers.length === 0) && (
          <div className="text-center py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white text-3xl font-bold">+</span>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">No offer plans found</h3>
            <p className="text-gray-600 mb-6 text-lg">Get started by creating your first subscription offer plan for customer savings</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Add First Offer Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersManagement;