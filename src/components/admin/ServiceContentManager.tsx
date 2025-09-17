import React, { useState } from 'react';

interface ServiceVariant {
  price: number;
  description: string;
  tabs: {
    type: string[];
    inclusion: string[];
    notes: string[];
  };
}

interface ServiceData {
  name: string;
  rating: number;
  reviewCount: number;
  monthlyBookings: number;
  originalPrice: number;
  discount: number;
  description: string;
  images: string[];
  warranty: string;
  protection: string;
  variants: {
    classic: ServiceVariant;
    premium: ServiceVariant;
  };
}

export const ServiceContentManager: React.FC = () => {
  const [selectedService, setSelectedService] = useState('bath-fittings');
  const [selectedVariant, setSelectedVariant] = useState<'classic' | 'premium'>('classic');
  const [selectedTab, setSelectedTab] = useState<'type' | 'inclusion' | 'notes'>('type');
  
  // Mock service data structure for admin editing
  const [serviceData, setServiceData] = useState<ServiceData>({
    name: "Bath Fittings Installation & Repair",
    rating: 4.8,
    reviewCount: 1247,
    monthlyBookings: 324,
    originalPrice: 149,
    discount: 26,
    description: "Professional installation and repair of bathroom fittings including taps, shower heads, towel holders, soap dispensers, and other bathroom accessories.",
    images: ["🚿", "🚰", "🛁", "🔧", "💧"],
    warranty: "30 Days",
    protection: "₹10,000",
    variants: {
      classic: {
        price: 99,
        description: "Standard installation service",
        tabs: {
          type: [
            "Basic Tap Installation & Repair",
            "Standard Shower Head Installation",
            "Simple Towel Holder Mounting"
          ],
          inclusion: [
            "Professional technician visit",
            "Basic tools and equipment",
            "Installation of 1-2 fittings"
          ],
          notes: [
            "Customer to provide fittings/accessories",
            "Additional charges for drilling in tiles",
            "Service time: 1-2 hours typically"
          ]
        }
      },
      premium: {
        price: 149,
        description: "Premium service with 1-year warranty",
        tabs: {
          type: [
            "Premium Tap Installation & Repair with Sealing",
            "High-End Shower Head Installation with Testing",
            "Professional Towel Holder Mounting with Alignment"
          ],
          inclusion: [
            "Expert certified technician visit",
            "Professional grade tools and equipment",
            "Installation of up to 5 fittings"
          ],
          notes: [
            "Premium fittings available for purchase",
            "Free drilling in tiles (up to 6 holes)",
            "Service time: 2-3 hours for thorough work"
          ]
        }
      }
    }
  });

  const updateTabContent = (tabType: 'type' | 'inclusion' | 'notes', content: string[]) => {
    setServiceData(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        [selectedVariant]: {
          ...prev.variants[selectedVariant],
          tabs: {
            ...prev.variants[selectedVariant].tabs,
            [tabType]: content
          }
        }
      }
    }));
  };

  const updateVariantPrice = (price: number) => {
    setServiceData(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        [selectedVariant]: {
          ...prev.variants[selectedVariant],
          price
        }
      }
    }));
  };

  const updateVariantDescription = (description: string) => {
    setServiceData(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        [selectedVariant]: {
          ...prev.variants[selectedVariant],
          description
        }
      }
    }));
  };

  const addTabItem = () => {
    const currentContent = serviceData.variants[selectedVariant].tabs[selectedTab];
    updateTabContent(selectedTab, [...currentContent, 'New item']);
  };

  const removeTabItem = (index: number) => {
    const currentContent = serviceData.variants[selectedVariant].tabs[selectedTab];
    updateTabContent(selectedTab, currentContent.filter((_, i) => i !== index));
  };

  const updateTabItem = (index: number, value: string) => {
    const currentContent = serviceData.variants[selectedVariant].tabs[selectedTab];
    const updatedContent = [...currentContent];
    updatedContent[index] = value;
    updateTabContent(selectedTab, updatedContent);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Content Manager</h1>
          <p className="text-gray-600">Manage service details, variants, pricing, and content for all subcategories</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Service Selection & Variant Settings */}
          <div className="space-y-6">
            {/* Service Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Selection</h2>
              <select 
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bath-fittings">Bath Fittings</option>
                <option value="basin-sink">Basin, Sink & Drainage</option>
                <option value="grouting">Grouting</option>
                <option value="toilets">Toilet Services (Classic)</option>
                <option value="pipes">Pipe & Connector</option>
                <option value="water-tank">Water Tank</option>
                <option value="others">Others</option>
              </select>
            </div>

            {/* Variant Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Variant</h2>
              <div className="space-y-3">
                {Object.entries(serviceData.variants).map(([variantKey, variant]) => (
                  <button
                    key={variantKey}
                    onClick={() => setSelectedVariant(variantKey as 'classic' | 'premium')}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      selectedVariant === variantKey
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium capitalize">{variantKey}</div>
                    <div className="text-sm text-gray-600">₹{variant.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Variant Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedVariant.charAt(0).toUpperCase() + selectedVariant.slice(1)} Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    value={serviceData.variants[selectedVariant].price}
                    onChange={(e) => updateVariantPrice(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={serviceData.variants[selectedVariant].description}
                    onChange={(e) => updateVariantDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Center & Right Panel - Tab Content Management */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tab Content Management - {selectedVariant.charAt(0).toUpperCase() + selectedVariant.slice(1)}
              </h2>

              {/* Tab Selection */}
              <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                {(['type', 'inclusion', 'notes'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium capitalize transition-all ${
                      selectedTab === tab
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content Editor */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-medium text-gray-900 capitalize">
                    {selectedTab} Content
                  </h3>
                  <button
                    onClick={addTabItem}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Item
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {serviceData.variants[selectedVariant].tabs[selectedTab].map((item, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <textarea
                          value={item}
                          onChange={(e) => updateTabItem(index, e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Enter content item..."
                        />
                      </div>
                      <button
                        onClick={() => removeTabItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h2>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{serviceData.name}</h3>
              <p className="text-sm text-gray-600">
                {selectedVariant.charAt(0).toUpperCase() + selectedVariant.slice(1)} - ₹{serviceData.variants[selectedVariant].price}
              </p>
              <p className="text-sm text-gray-500">{serviceData.variants[selectedVariant].description}</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg">
              <div className="border-b border-gray-200 p-3 bg-gray-100">
                <span className="font-medium capitalize">{selectedTab}</span>
              </div>
              <div className="p-3">
                <ul className="space-y-2">
                  {serviceData.variants[selectedVariant].tabs[selectedTab].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2 mt-0.5">•</span>
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};