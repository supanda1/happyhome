import React, { useState, useEffect } from 'react';
import {
  getContactSettings,
  updateContactSettings,
  type ContactSettings as ContactSettingsType
} from '../../utils/adminDataManager';

interface ContactSettingsProps {
  onContactChange?: () => void;
}

const ContactSettings: React.FC<ContactSettingsProps> = ({ onContactChange }) => {
  const [contactSettings, setContactSettings] = useState<ContactSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    emergencyPhone: '',
    whatsappNumber: '',
    facebookUrl: 'https://www.facebook.com/happyhomes.official',
    twitterUrl: 'https://x.com/happyhomes_in',
    companyName: 'Happy Homes',
    tagline: 'Your trusted home service partner',
    address: ''
  });

  // Load contact settings - Backend API Integration
  const loadContactSettings = async () => {
    try {
      setLoading(true);
      // SECURITY: Now using backend API instead of localStorage
      const settings = await getContactSettings();
      setContactSettings(settings);
      
      // Populate form with current values from database
      setFormData({
        phone: settings.phone || '',
        email: settings.email || '',
        emergencyPhone: settings.emergencyPhone || '',
        whatsappNumber: settings.whatsappNumber || '',
        facebookUrl: settings.facebookUrl || '',
        twitterUrl: settings.twitterUrl || '',
        companyName: settings.companyName || '',
        tagline: settings.tagline || '',
        address: settings.address || ''
      });
    } catch (error) {
      console.error('Error loading contact settings:', error);
      alert('Error loading contact settings. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContactSettings();
  }, []);

  // Handle form submission - Backend API Integration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = {
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      companyName: formData.companyName.trim(),
      emergencyPhone: formData.emergencyPhone.trim(),
      whatsappNumber: formData.whatsappNumber.trim(),
      address: formData.address.trim()
    };
    
    const missingFields = [];
    if (!requiredFields.phone) missingFields.push('Primary Phone');
    if (!requiredFields.email) missingFields.push('Support Email');
    if (!requiredFields.companyName) missingFields.push('Company Name');
    if (!requiredFields.emergencyPhone) missingFields.push('Emergency Phone');
    if (!requiredFields.whatsappNumber) missingFields.push('WhatsApp Number');
    if (!requiredFields.address) missingFields.push('Business Address');
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields:\n\n${missingFields.join('\n')}`);
      return;
    }
    
    // Email validation
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(requiredFields.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      setSaving(true);
      
      // SECURITY: Update contact settings via backend API
      const updatedSettings = await updateContactSettings(formData, 'admin');
      
      setContactSettings(updatedSettings);
      setLastSaved(new Date().toLocaleString());
      
      // Notify parent component of changes
      onContactChange?.();
      
      alert('Contact settings updated successfully!');
      
    } catch (error) {
      console.error('Error updating contact settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error updating contact settings: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset form to current saved values
  const handleReset = () => {
    if (contactSettings) {
      setFormData({
        phone: contactSettings.phone || '',
        email: contactSettings.email || '',
        emergencyPhone: contactSettings.emergencyPhone || '',
        whatsappNumber: contactSettings.whatsappNumber || '',
        facebookUrl: contactSettings.facebookUrl || '',
        twitterUrl: contactSettings.twitterUrl || '',
        companyName: contactSettings.companyName || '',
        tagline: contactSettings.tagline || '',
        address: contactSettings.address || ''
      });
    }
  };

  // Check if form has unsaved changes
  const hasUnsavedChanges = contactSettings && (
    formData.phone !== (contactSettings.phone || '') ||
    formData.email !== (contactSettings.email || '') ||
    formData.emergencyPhone !== (contactSettings.emergencyPhone || '') ||
    formData.whatsappNumber !== (contactSettings.whatsappNumber || '') ||
    formData.facebookUrl !== (contactSettings.facebookUrl || '') ||
    formData.twitterUrl !== (contactSettings.twitterUrl || '') ||
    formData.companyName !== (contactSettings.companyName || '') ||
    formData.tagline !== (contactSettings.tagline || '') ||
    formData.address !== (contactSettings.address || '')
  );


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
      <div className="bg-gradient-to-r from-teal-600 to-green-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">📞 Contact Settings</h1>
        <p className="text-teal-100">Manage company contact information, emergency numbers, and business details</p>
        {lastSaved && (
          <div className="mt-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2 text-teal-50 text-sm">
            ✅ Last saved: {lastSaved}
          </div>
        )}
      </div>

      {/* Contact Information Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Company Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-blue-100 mb-2">Company</p>
            <p className="text-lg font-bold text-white truncate">{formData.companyName || 'Happy Homes'}</p>
            <p className="text-xs text-blue-200 mt-2">Business Name</p>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-100 mb-2">Primary Phone</p>
            <p className="text-lg font-bold text-white">{formData.phone || '📞'}</p>
            <p className="text-xs text-green-200 mt-2">Main Number</p>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-red-100 mb-2">Emergency</p>
            <p className="text-lg font-bold text-white">{formData.emergencyPhone || '🚨'}</p>
            <p className="text-xs text-red-200 mt-2">24/7 Support</p>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-white mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <p className="text-sm font-medium text-green-100">WhatsApp</p>
            </div>
            <p className="text-lg font-bold text-white">{formData.whatsappNumber || 'Not Set'}</p>
            <p className="text-xs text-green-200 mt-2">Chat Support</p>
          </div>
        </div>

      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contact Information Management</h2>
          <p className="text-gray-600 text-sm">Update company details, phone numbers, and business information</p>
        </div>
      </div>

      {/* Contact Settings Form */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Company Contact Information</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Company Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Happy Homes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Tagline *
              </label>
              <input
                type="text"
                required
                value={formData.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your Trusted Home Service Partner"
              />
            </div>
          </div>

          {/* Contact Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="9437341234"
                pattern="[0-9]{10}"
              />
              <p className="text-xs text-gray-500 mt-1">10-digit mobile number</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Number *
              </label>
              <input
                type="tel"
                required
                value={formData.emergencyPhone}
                onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="9437341234"
                pattern="[0-9]{10}"
              />
              <p className="text-xs text-gray-500 mt-1">24/7 emergency contact</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                value={formData.whatsappNumber}
                onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="9437341234"
                pattern="[0-9]{10}"
              />
              <p className="text-xs text-gray-500 mt-1">WhatsApp business number</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook Page URL *
              </label>
              <input
                type="url"
                required
                value={formData.facebookUrl}
                onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.facebook.com/happyhomes.official"
                pattern="https?://(www\.)?facebook\.com/.+"
              />
              <p className="text-xs text-gray-500 mt-1">Facebook business page URL</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                X (Twitter) Page URL *
              </label>
              <input
                type="url"
                required
                value={formData.twitterUrl}
                onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://x.com/happyhomes_in"
                pattern="https?://(www\.)?(twitter\.com|x\.com)/.+"
              />
              <p className="text-xs text-gray-500 mt-1">X (formerly Twitter) business account URL</p>
            </div>
          </div>

          {/* Email and Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="care@happyhomesworld.com"
              />
              <p className="text-xs text-gray-500 mt-1">Customer support email</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Bhubaneswar, Odisha 751001"
              />
              <p className="text-xs text-gray-500 mt-1">Service area/location</p>
            </div>
          </div>

          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center space-x-2">
              <span className="text-amber-600">⚠️</span>
              <span className="text-amber-700 text-sm">You have unsaved changes</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasUnsavedChanges || saving}
              className={`px-4 py-2 border rounded-md transition-colors flex items-center space-x-2 ${
                hasUnsavedChanges && !saving
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>🔄</span>
              <span>Reset Changes</span>
            </button>
            
            <button
              type="submit"
              disabled={saving || !hasUnsavedChanges}
              className={`px-6 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                hasUnsavedChanges && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>{hasUnsavedChanges ? 'Save Contact Settings' : 'No Changes to Save'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Current Database Status */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">📊 Current Database Values</h3>
          <button
            type="button"
            onClick={loadContactSettings}
            disabled={loading}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-1"
          >
            <span>🔄</span>
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span>📞</span>
                <span>Primary:</span>
              </span>
              <span className={`font-mono ${
                formData.phone !== (contactSettings?.phone || '') ? 'text-orange-600 font-bold' : ''
              }`}>
                {contactSettings?.phone || 'Not set'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span>✉️</span>
                <span>Email:</span>
              </span>
              <span className={`font-mono text-xs ${
                formData.email !== (contactSettings?.email || '') ? 'text-orange-600 font-bold' : ''
              }`}>
                {contactSettings?.email || 'Not set'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span>🏢</span>
                <span>Company:</span>
              </span>
              <span className={`font-mono ${
                formData.companyName !== (contactSettings?.companyName || '') ? 'text-orange-600 font-bold' : ''
              }`}>
                {contactSettings?.companyName || 'Not set'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span>📘</span>
                <span>Facebook:</span>
              </span>
              <span className={`font-mono text-xs truncate max-w-40 ${
                formData.facebookUrl !== (contactSettings?.facebookUrl || '') ? 'text-orange-600 font-bold' : ''
              }`}>
                {contactSettings?.facebookUrl || 'Not set'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span>❌</span>
                <span>X (Twitter):</span>
              </span>
              <span className={`font-mono text-xs truncate max-w-40 ${
                formData.twitterUrl !== (contactSettings?.twitterUrl || '') ? 'text-orange-600 font-bold' : ''
              }`}>
                {contactSettings?.twitterUrl || 'Not set'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span>📍</span>
                <span>Address:</span>
              </span>
              <span className={`font-mono text-xs truncate max-w-40 ${
                formData.address !== (contactSettings?.address || '') ? 'text-orange-600 font-bold' : ''
              }`}>
                {contactSettings?.address || 'Not set'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs">
          <div className="text-gray-500">
            {lastSaved && <span>✅ Last saved: {lastSaved}</span>}
            {contactSettings?.updatedAt && !lastSaved && (
              <span>Database updated: {new Date(contactSettings.updatedAt).toLocaleString()}</span>
            )}
          </div>
          {hasUnsavedChanges && (
            <span className="text-orange-600 font-medium">
              ⚠️ Form has unsaved changes (highlighted in orange above)
            </span>
          )}
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
          <p className="text-sm text-gray-600">How this information appears to customers</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Contact Preview */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span>📞</span>
                  <span>Phone: +91-{formData.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  <span>WhatsApp: +91-{formData.whatsappNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📘</span>
                  <span>Facebook: {formData.facebookUrl || 'Not set'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>❌</span>
                  <span>X (Twitter): {formData.twitterUrl || 'Not set'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📍</span>
                  <span>{formData.address}</span>
                </div>
              </div>
            </div>

            {/* Usage Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Usage Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Phone number appears in customer calls and SMS</p>
                <p>• Email used for support communications</p>
                <p>• WhatsApp for quick customer support</p>
                <p>• Emergency number for 24/7 service requests</p>
                <p>• Address shown in location displays</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSettings;