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


  // Custom CSS for enhanced animations
  const customStyles = `
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
      50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.6); }
    }
    
    @keyframes bounce-in {
      0% { transform: translateY(-100px); opacity: 0; }
      50% { transform: translateY(0px); opacity: 1; }
      65% { transform: translateY(-10px); }
      81% { transform: translateY(0px); }
      100% { transform: translateY(0px); opacity: 1; }
    }
    
    .animate-fade-in {
      animation: fade-in 0.8s ease-out;
    }
    
    .animate-pulse-glow {
      animation: pulse-glow 2s infinite;
    }
    
    .animate-bounce-in {
      animation: bounce-in 0.8s ease-out;
    }
  `;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-border mx-auto mb-6"></div>
            <div className="absolute inset-2 bg-white rounded-full"></div>
            <div className="absolute inset-3 animate-pulse bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
          </div>
          <div className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
            Loading Contact Settings...
          </div>
          <div className="text-sm text-gray-500 mt-2">Fetching company information</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="space-y-8 animate-fade-in p-6">
          {/* Welcome Section - Enhanced Design */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2 tracking-tight">Contact Settings</h1>
                  <p className="text-white/80 text-lg">Manage company contact information, emergency numbers, and business details</p>
                </div>
              </div>
              
              {lastSaved && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50/20 to-emerald-50/20 border border-green-200/30 text-white rounded-xl flex items-center space-x-3 shadow-sm animate-bounce-in backdrop-blur-sm">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Settings Saved Successfully</p>
                    <p className="text-sm text-white/90">Last saved: {lastSaved}</p>
                  </div>
                </div>
              )}
              
              {/* Quick Stats Bar */}
              <div className="flex items-center space-x-6 mt-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/90">Live Configuration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-white/90">Backend Integration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-white/90">Real-time Updates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Overview - Enhanced Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Company Info - Enhanced */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl p-6 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M8 7h8M8 11h8m-8 4h8" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-blue-100 mb-2">Company</p>
                  <p className="text-xl font-bold text-white mb-2 animate-pulse truncate">{formData.companyName || 'Happy Homes'}</p>
                  <p className="text-xs text-blue-200">Business Name</p>
                </div>
              </div>
            </div>

            {/* Primary Contact - Enhanced */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-xl p-6 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-emerald-100 mb-2">Primary Phone</p>
                  <p className="text-xl font-bold text-white mb-2 animate-pulse">{formData.phone || '📞'}</p>
                  <p className="text-xs text-emerald-200">Main Number</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact - Enhanced */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-pink-600 rounded-xl p-6 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-red-100 mb-2">Emergency</p>
                  <p className="text-xl font-bold text-white mb-2 animate-pulse">{formData.emergencyPhone || '🚨'}</p>
                  <p className="text-xs text-red-200">24/7 Support</p>
                </div>
              </div>
            </div>

            {/* WhatsApp - Enhanced */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-xl p-6 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-green-100 mb-2">WhatsApp</p>
                  <p className="text-xl font-bold text-white mb-2 animate-pulse">{formData.whatsappNumber || 'Not Set'}</p>
                  <p className="text-xs text-green-200">Chat Support</p>
                </div>
              </div>
            </div>

          </div>

          {/* Header Actions - Enhanced */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Contact Information Management</h2>
                  <p className="text-gray-500 mt-1">Update company details, phone numbers, and business information</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-orange-400' : 'bg-green-400'}`}></div>
                      <span className="text-xs">
                        {hasUnsavedChanges ? 'Unsaved changes' : 'All saved'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Settings Form - Enhanced */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-indigo-700 bg-clip-text text-transparent">Company Contact Information</h3>
                  <p className="text-gray-500 text-sm mt-1">Configure all company contact details and business information</p>
                </div>
              </div>
            </div>
        
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              
              {/* Company Information - Enhanced */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <div className="p-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M8 7h8M8 11h8m-8 4h8" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-indigo-700 bg-clip-text text-transparent">Company Information</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Company Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 group-hover:border-gray-300 bg-white/50 backdrop-blur-sm"
                        placeholder="Happy Homes"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Company Tagline *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.tagline}
                        onChange={(e) => handleInputChange('tagline', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 group-hover:border-gray-300 bg-white/50 backdrop-blur-sm"
                        placeholder="Your Trusted Home Service Partner"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Numbers - Enhanced */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <div className="p-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-emerald-700 bg-clip-text text-transparent">Contact Numbers</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Primary Phone Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 group-hover:border-gray-300 bg-white/50 backdrop-blur-sm"
                        placeholder="9437341234"
                        pattern="[0-9]{10}"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>10-digit mobile number</span>
                    </p>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Emergency Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={formData.emergencyPhone}
                        onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 group-hover:border-gray-300 bg-white/50 backdrop-blur-sm"
                        placeholder="9437341234"
                        pattern="[0-9]{10}"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>24/7 emergency contact</span>
                    </p>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      WhatsApp Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={formData.whatsappNumber}
                        onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 group-hover:border-gray-300 bg-white/50 backdrop-blur-sm"
                        placeholder="9437341234"
                        pattern="[0-9]{10}"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      <span>WhatsApp business number</span>
                    </p>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Facebook Page URL *
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        required
                        value={formData.facebookUrl}
                        onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 group-hover:border-gray-300 bg-white/50 backdrop-blur-sm"
                        placeholder="https://www.facebook.com/happyhomes.official"
                        pattern="https?://(www\.)?facebook\.com/.+"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Facebook business page URL</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Email and Address - Enhanced */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <div className="p-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-purple-700 bg-clip-text text-transparent">Email & Address</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Support Email *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 group-hover:border-gray-300 bg-white/50 backdrop-blur-sm"
                        placeholder="care@happyhomesworld.com"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Customer support email</span>
                    </p>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Business Address *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 group-hover:border-gray-300 bg-white/50 backdrop-blur-sm"
                        placeholder="Bhubaneswar, Odisha 751001"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Service area/location</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Unsaved changes indicator - Enhanced */}
              {hasUnsavedChanges && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 rounded-xl flex items-center space-x-3 shadow-sm animate-bounce-in">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">You have unsaved changes</p>
                    <p className="text-sm text-amber-600">Remember to save your changes before leaving this page</p>
                  </div>
                </div>
              )}

              {/* Form Actions - Enhanced */}
              <div className="flex justify-between items-center pt-8 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasUnsavedChanges || saving}
                  className={`group relative px-6 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center space-x-2 overflow-hidden ${
                    hasUnsavedChanges && !saving
                      ? 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border border-gray-300'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed transform-none'
                  }`}
                >
                  {hasUnsavedChanges && !saving && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  )}
                  <span className="relative z-10">🔄</span>
                  <span className="relative z-10">Reset Changes</span>
                </button>
                
                <button
                  type="submit"
                  disabled={saving || !hasUnsavedChanges}
                  className={`group relative px-8 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-2xl flex items-center space-x-2 overflow-hidden ${
                    hasUnsavedChanges && !saving
                      ? 'bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed transform-none'
                  }`}
                >
                  {hasUnsavedChanges && !saving && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  )}
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">💾</span>
                      <span className="relative z-10">{hasUnsavedChanges ? 'Save Contact Settings' : 'No Changes to Save'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Current Database Status - Enhanced */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-600 rounded-xl shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-slate-700 bg-clip-text text-transparent">Current Database Values</h3>
                    <p className="text-gray-500 text-sm mt-1">Live data from PostgreSQL database</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loadContactSettings}
                  disabled={loading}
                  className="group relative px-4 py-2 bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 border border-gray-300 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative z-10">🔄</span>
                  <span className="relative z-10 font-semibold text-sm">{loading ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="flex items-center space-x-2 font-medium text-gray-700">
                      <span>📞</span>
                      <span>Primary:</span>
                    </span>
                    <span className={`font-mono px-2 py-1 rounded ${
                      formData.phone !== (contactSettings?.phone || '') 
                        ? 'text-orange-600 font-bold bg-orange-50 border border-orange-200' 
                        : 'text-gray-700 bg-white'
                    }`}>
                      {contactSettings?.phone || 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="flex items-center space-x-2 font-medium text-gray-700">
                      <span>✉️</span>
                      <span>Email:</span>
                    </span>
                    <span className={`font-mono text-xs px-2 py-1 rounded truncate max-w-40 ${
                      formData.email !== (contactSettings?.email || '') 
                        ? 'text-orange-600 font-bold bg-orange-50 border border-orange-200' 
                        : 'text-gray-700 bg-white'
                    }`}>
                      {contactSettings?.email || 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="flex items-center space-x-2 font-medium text-gray-700">
                      <span>🏢</span>
                      <span>Company:</span>
                    </span>
                    <span className={`font-mono px-2 py-1 rounded ${
                      formData.companyName !== (contactSettings?.companyName || '') 
                        ? 'text-orange-600 font-bold bg-orange-50 border border-orange-200' 
                        : 'text-gray-700 bg-white'
                    }`}>
                      {contactSettings?.companyName || 'Not set'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="flex items-center space-x-2 font-medium text-gray-700">
                      <span>📘</span>
                      <span>Facebook:</span>
                    </span>
                    <span className={`font-mono text-xs px-2 py-1 rounded truncate max-w-40 ${
                      formData.facebookUrl !== (contactSettings?.facebookUrl || '') 
                        ? 'text-orange-600 font-bold bg-orange-50 border border-orange-200' 
                        : 'text-gray-700 bg-white'
                    }`}>
                      {contactSettings?.facebookUrl || 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="flex items-center space-x-2 font-medium text-gray-700">
                      <span>❌</span>
                      <span>X (Twitter):</span>
                    </span>
                    <span className={`font-mono text-xs px-2 py-1 rounded truncate max-w-40 ${
                      formData.twitterUrl !== (contactSettings?.twitterUrl || '') 
                        ? 'text-orange-600 font-bold bg-orange-50 border border-orange-200' 
                        : 'text-gray-700 bg-white'
                    }`}>
                      {contactSettings?.twitterUrl || 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="flex items-center space-x-2 font-medium text-gray-700">
                      <span>📍</span>
                      <span>Address:</span>
                    </span>
                    <span className={`font-mono text-xs px-2 py-1 rounded truncate max-w-40 ${
                      formData.address !== (contactSettings?.address || '') 
                        ? 'text-orange-600 font-bold bg-orange-50 border border-orange-200' 
                        : 'text-gray-700 bg-white'
                    }`}>
                      {contactSettings?.address || 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between text-xs">
                <div className="text-gray-500 flex items-center space-x-2">
                  {lastSaved && (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Last saved: {lastSaved}</span>
                    </>
                  )}
                  {contactSettings?.updated_at && !lastSaved && (
                    <span>Database updated: {new Date(contactSettings.updated_at).toLocaleString()}</span>
                  )}
                </div>
                {hasUnsavedChanges && (
                  <span className="text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-lg border border-orange-200">
                    ⚠️ Form has unsaved changes (highlighted above)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Preview Section - Enhanced */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-emerald-700 bg-clip-text text-transparent">Live Preview</h3>
                  <p className="text-gray-500 text-sm mt-1">How this information appears to customers</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Contact Preview - Enhanced */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900">Contact Information</h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <span className="text-lg">📞</span>
                      <span className="font-medium">Phone: +91-{formData.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      <span className="font-medium">WhatsApp: +91-{formData.whatsappNumber}</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <span className="text-lg">📘</span>
                      <span className="font-medium truncate">Facebook: {formData.facebookUrl || 'Not set'}</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <span className="text-lg">❌</span>
                      <span className="font-medium truncate">X (Twitter): {formData.twitterUrl || 'Not set'}</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <span className="text-lg">📍</span>
                      <span className="font-medium">{formData.address}</span>
                    </div>
                  </div>
                </div>

                {/* Usage Information - Enhanced */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900">Usage Information</h4>
                  </div>
                  <div className="text-sm text-gray-600 space-y-3">
                    <div className="flex items-start space-x-2 p-2 bg-blue-50 rounded-lg">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Phone number appears in customer calls and SMS</span>
                    </div>
                    <div className="flex items-start space-x-2 p-2 bg-purple-50 rounded-lg">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>Email used for support communications</span>
                    </div>
                    <div className="flex items-start space-x-2 p-2 bg-green-50 rounded-lg">
                      <span className="text-green-500 mt-1">•</span>
                      <span>WhatsApp for quick customer support</span>
                    </div>
                    <div className="flex items-start space-x-2 p-2 bg-red-50 rounded-lg">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Emergency number for 24/7 service requests</span>
                    </div>
                    <div className="flex items-start space-x-2 p-2 bg-indigo-50 rounded-lg">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span>Address shown in location displays</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactSettings;