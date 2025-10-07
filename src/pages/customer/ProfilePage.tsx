import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usersService, type UserAddress, type UpdateProfileRequest, type CreateAddressRequest, type UpdateAddressRequest } from '../../utils/services/users.service';

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  bookingReminders: boolean;
  promotionalEmails: boolean;
}

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profile form state
  const [profileData, setProfileData] = useState<UpdateProfileRequest>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });
  
  // Addresses state
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddressData, setNewAddressData] = useState<CreateAddressRequest>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    landmark: '',
    addressType: 'home',
    isDefault: false
  });
  
  // Edit address state
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editAddressData, setEditAddressData] = useState<UpdateAddressRequest>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    landmark: '',
    addressType: 'home',
    isDefault: false
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    bookingReminders: true,
    promotionalEmails: false
  });

  // Load user data on component mount
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email
      });
    }
    loadAddresses();
    loadNotificationSettings();
  }, [user]);

  const loadAddresses = async () => {
    try {
      setAddressesLoading(true);
      const userAddresses = await usersService.getAddresses();
      setAddresses(userAddresses);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setAddressesLoading(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const preferences = await usersService.getPreferences();
      if (preferences) {
        setNotificationSettings(preferences as any);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await usersService.updateProfile(profileData);
      await refreshUser(); // Refresh user data in auth context
      showMessage('success', 'Profile updated successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      showMessage('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await usersService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', 'Password changed successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      showMessage('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setLoading(true);
      await usersService.updatePreferences(notificationSettings as any);
      showMessage('success', 'Notification settings updated successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification settings';
      showMessage('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await usersService.deleteAddress(addressId);
      setAddresses(addresses.filter(addr => addr.id !== addressId));
      showMessage('success', 'Address deleted successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete address';
      showMessage('error', errorMessage);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAddressData.street || !newAddressData.city || !newAddressData.state || !newAddressData.zipCode) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const newAddress = await usersService.addAddress(newAddressData);
      setAddresses([...addresses, newAddress]);
      setNewAddressData({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        landmark: '',
        addressType: 'home',
        isDefault: false
      });
      setShowAddAddressForm(false);
      showMessage('success', 'Address added successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add address';
      showMessage('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (address: UserAddress) => {
    setEditingAddressId(address.id);
    setEditAddressData({
      street: address.street, // Use correct property names
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      landmark: address.landmark || '',
      addressType: address.addressType,
      isDefault: address.isDefault
    });
  };

  const handleEditAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingAddressId) return;
    
    if (!editAddressData.street || !editAddressData.city || !editAddressData.state || !editAddressData.zipCode) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const updatedAddress = await usersService.updateAddress(editingAddressId, editAddressData);
      
      // Update the address in the local state
      setAddresses(addresses.map(addr => 
        addr.id === editingAddressId ? updatedAddress : addr
      ));
      
      // Clear edit state
      setEditingAddressId(null);
      setEditAddressData({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        landmark: '',
        addressType: 'home',
        isDefault: false
      });
      
      showMessage('success', 'Address updated successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update address';
      showMessage('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAddressId(null);
    setEditAddressData({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      landmark: '',
      addressType: 'home',
      isDefault: false
    });
  };

  const tabs = [
    { id: 'profile', name: 'Personal Information' },
    { id: 'addresses', name: 'Addresses' },
    { id: 'password', name: 'Password & Security' },
    { id: 'notifications', name: 'Notifications' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 rounded-xl p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">⚙️ Account Settings</h1>
            <p className="text-orange-100">Manage your personal information, addresses, and preferences</p>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 mb-1 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-orange-50 to-purple-50 text-purple-700 border-l-4 border-orange-500 shadow-md'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600 hover:shadow-sm'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
              
              {/* Personal Information Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input
                          type="text"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input
                          type="text"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {loading ? 'Updating...' : 'Update Profile'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
                    <button 
                      onClick={() => setShowAddAddressForm(true)}
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      Add New Address
                    </button>
                  </div>

                  {/* Add Address Form */}
                  {showAddAddressForm && (
                    <div className="mb-6 bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-200 rounded-lg p-6 shadow-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Add New Address</h3>
                        <button 
                          onClick={() => {
                            setShowAddAddressForm(false);
                            setNewAddressData({
                              street: '',
                              city: '',
                              state: '',
                              zipCode: '',
                              landmark: '',
                              addressType: 'home',
                              isDefault: false
                            });
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <form onSubmit={handleAddAddress} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                          <input
                            type="text"
                            value={newAddressData.street}
                            onChange={(e) => setNewAddressData({ ...newAddressData, street: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            required
                            placeholder="Enter your street address"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                            <input
                              type="text"
                              value={newAddressData.city}
                              onChange={(e) => setNewAddressData({ ...newAddressData, city: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              required
                              placeholder="City"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                            <input
                              type="text"
                              value={newAddressData.state}
                              onChange={(e) => setNewAddressData({ ...newAddressData, state: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              required
                              placeholder="State"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                            <input
                              type="text"
                              value={newAddressData.zipCode}
                              onChange={(e) => setNewAddressData({ ...newAddressData, zipCode: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              required
                              placeholder="ZIP Code"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Landmark (Optional)</label>
                          <input
                            type="text"
                            value={newAddressData.landmark}
                            onChange={(e) => setNewAddressData({ ...newAddressData, landmark: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Nearby landmark"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Address Type</label>
                          <select
                            value={newAddressData.addressType}
                            onChange={(e) => setNewAddressData({ ...newAddressData, addressType: e.target.value as 'home' | 'work' | 'other' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={newAddressData.isDefault}
                            onChange={(e) => setNewAddressData({ ...newAddressData, isDefault: e.target.checked })}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                            Set as default address
                          </label>
                        </div>
                        
                        <div className="flex space-x-3 pt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            {loading ? 'Adding...' : 'Add Address'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddAddressForm(false);
                              setNewAddressData({
                                street: '',
                                city: '',
                                state: '',
                                zipCode: '',
                                landmark: '',
                                addressType: 'home',
                                isDefault: false
                              });
                            }}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {/* Edit Address Form */}
                  {editingAddressId && (
                    <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 shadow-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Edit Address</h3>
                        <button 
                          onClick={handleCancelEdit}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <form onSubmit={handleEditAddress} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                          <input
                            type="text"
                            value={editAddressData.street}
                            onChange={(e) => setEditAddressData({ ...editAddressData, street: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            required
                            placeholder="Enter your street address"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                            <input
                              type="text"
                              value={editAddressData.city}
                              onChange={(e) => setEditAddressData({ ...editAddressData, city: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              required
                              placeholder="City"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                            <input
                              type="text"
                              value={editAddressData.state}
                              onChange={(e) => setEditAddressData({ ...editAddressData, state: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              required
                              placeholder="State"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                            <input
                              type="text"
                              value={editAddressData.zipCode}
                              onChange={(e) => setEditAddressData({ ...editAddressData, zipCode: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              required
                              placeholder="ZIP Code"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Landmark (Optional)</label>
                          <input
                            type="text"
                            value={editAddressData.landmark}
                            onChange={(e) => setEditAddressData({ ...editAddressData, landmark: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Nearby landmark"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Address Type</label>
                          <select
                            value={editAddressData.addressType}
                            onChange={(e) => setEditAddressData({ ...editAddressData, addressType: e.target.value as 'home' | 'work' | 'other' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isDefaultEdit"
                            checked={editAddressData.isDefault}
                            onChange={(e) => setEditAddressData({ ...editAddressData, isDefault: e.target.checked })}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isDefaultEdit" className="ml-2 text-sm text-gray-700">
                            Set as default address
                          </label>
                        </div>
                        
                        <div className="flex space-x-3 pt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            {loading ? 'Updating...' : 'Update Address'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {addressesLoading ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">Loading addresses...</div>
                    </div>
                  ) : addresses.length > 0 ? (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-medium text-gray-900 capitalize">{address.addressType}</span>
                                {address.isDefault && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Default</span>
                                )}
                              </div>
                              <p className="text-gray-700">{address.street}</p>
                              <p className="text-gray-600 text-sm">{address.city}, {address.state} {address.zipCode}</p>
                              {address.landmark && (
                                <p className="text-gray-600 text-sm">Landmark: {address.landmark}</p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleStartEdit(address)}
                                className="text-purple-600 hover:text-purple-700 text-sm font-medium bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg transition-all duration-200"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteAddress(address.id)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-all duration-200"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">No addresses saved yet</p>
                      <button 
                        onClick={() => setShowAddAddressForm(true)}
                        className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Add Your First Address
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Password & Security Tab */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Password & Security</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                        minLength={6}
                      />
                      <p className="text-sm text-gray-500 mt-1">Password must be at least 6 characters long</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                        minLength={6}
                      />
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {loading ? 'Changing Password...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Receive updates and notifications via email</p>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          notificationSettings.emailNotifications ? 'bg-gradient-to-r from-orange-500 to-purple-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                        <p className="text-sm text-gray-500">Receive updates via text message</p>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, smsNotifications: !prev.smsNotifications }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          notificationSettings.smsNotifications ? 'bg-gradient-to-r from-orange-500 to-purple-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="font-medium text-gray-900">Booking Reminders</h3>
                        <p className="text-sm text-gray-500">Get reminded about upcoming service appointments</p>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, bookingReminders: !prev.bookingReminders }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          notificationSettings.bookingReminders ? 'bg-gradient-to-r from-orange-500 to-purple-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.bookingReminders ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="font-medium text-gray-900">Promotional Emails</h3>
                        <p className="text-sm text-gray-500">Receive offers, discounts, and promotional content</p>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, promotionalEmails: !prev.promotionalEmails }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          notificationSettings.promotionalEmails ? 'bg-gradient-to-r from-orange-500 to-purple-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.promotionalEmails ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="pt-4">
                      <button
                        onClick={handleNotificationUpdate}
                        disabled={loading}
                        className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 hover:from-orange-600 hover:via-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {loading ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;