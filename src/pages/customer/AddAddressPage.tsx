import React, { useState } from 'react';
import { usersService, type CreateAddressRequest } from '../../utils/services/users.service';

interface AddAddressPageProps {
  navigateHome?: () => void;
  navigateToCheckout?: () => void;
}

const AddAddressPage: React.FC<AddAddressPageProps> = ({ 
  navigateHome = () => window.location.href = '/', 
  navigateToCheckout = () => window.location.href = '/#checkout'
}) => {
  const [formData, setFormData] = useState({
    addressType: 'home',
    fullName: '',
    mobileNumber: '',
    pincode: '',
    houseNumber: '',
    area: '',
    landmark: '',
    city: 'Bhubaneswar',
    state: 'Odisha'
  });

  const [isDefault, setIsDefault] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.fullName || !formData.mobileNumber || !formData.pincode || 
        !formData.houseNumber || !formData.area) {
      alert('Please fill all required fields');
      return;
    }

    // Mobile number validation
    if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    // Pincode validation
    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      alert('Please enter a valid 6-digit pincode');
      return;
    }

    try {
      // Map frontend form data to backend API format  
      const addressData: CreateAddressRequest = {
        street: `${formData.houseNumber}, ${formData.area}`, // Combine for backend compatibility
        city: formData.city,
        state: formData.state,
        zipCode: formData.pincode,
        landmark: formData.landmark,
        addressType: formData.addressType as 'home' | 'work' | 'other',
        isDefault
      };
      
      console.log('🏠 FRONTEND - Saving address:', addressData);
      const savedAddress = await usersService.addAddress(addressData);
      console.log('✅ FRONTEND - Address saved successfully:', savedAddress);
      
      alert('Address added successfully!');
      navigateToCheckout();
    } catch (error) {
      console.error('❌ FRONTEND - Failed to save address:', error);
      alert('Failed to save address. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={navigateHome} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">HH</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">Happy Homes</h1>
                <p className="text-xs text-gray-500">Add New Address</p>
              </div>
            </button>
            <nav className="text-sm text-gray-600">
              <button onClick={navigateHome} className="hover:text-blue-600">Home</button>
              <span className="mx-2">/</span>
              <button onClick={navigateToCheckout} className="hover:text-blue-600">Checkout</button>
              <span className="mx-2">/</span>
              <span className="text-blue-600 font-medium">Add Address</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Add New Address</h2>
            <p className="text-gray-600 mt-1">Please provide complete address details for service delivery</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Address Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Address Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'home', name: 'Home', icon: '🏠' },
                  { id: 'office', name: 'Office', icon: '🏢' },
                  { id: 'other', name: 'Other', icon: '📍' }
                ].map((type) => (
                  <div
                    key={type.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      formData.addressType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, addressType: type.id }))}
                  >
                    <input
                      type="radio"
                      name="addressType"
                      value={type.id}
                      checked={formData.addressType === type.id}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-sm font-medium text-gray-900">{type.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="6-digit pincode"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                />
              </div>
              <div>
                <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  House/Flat/Building No. *
                </label>
                <input
                  type="text"
                  id="houseNumber"
                  name="houseNumber"
                  value={formData.houseNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="House/Flat number"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                Area/Locality/Sector *
              </label>
              <input
                type="text"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Area, Locality, Sector"
                required
              />
            </div>

            <div>
              <label htmlFor="landmark" className="block text-sm font-medium text-gray-700 mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                id="landmark"
                name="landmark"
                value={formData.landmark}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nearby landmark for easy identification"
              />
            </div>

            {/* City and State */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Bhubaneswar">Bhubaneswar</option>
                  <option value="Cuttack">Cuttack</option>
                  <option value="Puri">Puri</option>
                  <option value="Rourkela">Rourkela</option>
                </select>
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Odisha">Odisha</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="West Bengal">West Bengal</option>
                </select>
              </div>
            </div>

            {/* Default Address Checkbox */}
            <div className="flex items-center">
              <input
                id="isDefault"
                name="isDefault"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                Make this my default address
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={navigateToCheckout}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
              >
                Save Address
              </button>
            </div>

          </form>

          {/* Address Guidelines */}
          <div className="p-6 bg-blue-50 border-t border-gray-200">
            <h4 className="font-medium text-blue-900 mb-2">Address Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Provide accurate address details for smooth service delivery</li>
              <li>• Include landmark information for easy location identification</li>
              <li>• Ensure mobile number is active for delivery coordination</li>
              <li>• You can set this address as default for future orders</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAddressPage;