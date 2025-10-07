/**
 * Banner Management - Backend API Integration
 * 
 * SECURITY: Fully integrated with backend API - NO mock data
 * - Fetches real banner data from database via /api/admin/banners
 * - Uses HTTP-only cookies for secure admin authentication
 * - Proper CRUD operations with error handling and loading states
 * - Real-time banner management with database persistence
 * 
 * API Endpoints:
 * - GET /api/admin/banners - Fetch all banners
 * - POST /api/admin/banners - Create new banner
 * - PUT /api/admin/banners/{id} - Update existing banner
 * - DELETE /api/admin/banners/{id} - Delete banner
 * - PATCH /api/admin/banners/{id}/toggle - Toggle banner status
 */
import React, { useState, useEffect } from 'react';

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

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  is_active: boolean;
  sort_order: number;
  background_color: string;
  text_color: string;
  position: 'hero' | 'secondary' | 'promotional';
  created_at: string;
  updated_at: string;
}

interface BannerFormData {
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  is_active: boolean;
  sort_order: number;
  background_color: string;
  text_color: string;
  position: 'hero' | 'secondary' | 'promotional';
}

const BannerManagement: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    cta_text: '',
    cta_link: '',
    is_active: true,
    sort_order: 0,
    background_color: '#3B82F6',
    text_color: '#FFFFFF',
    position: 'hero'
  });

  // Fetch banners from backend database API
  const fetchBanners = async (): Promise<{ success: boolean; data: Banner[] }> => {
    try {
      const response = await fetch('/api/admin/banners', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SECURITY: Include HTTP-only cookies for admin authentication
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login as admin.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error(`Banners API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Banners loaded from backend API');
      return data;
    } catch (fetchError) {
      console.error('🚫 Banners API fetch failed:', fetchError);
      throw fetchError;
    }
  };

  // Create new banner
  const createBanner = async (bannerData: BannerFormData): Promise<Banner> => {
    try {
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create banner: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Banner created successfully');
      return data;
    } catch (error) {
      console.error('🚫 Create banner failed:', error);
      throw error;
    }
  };

  // Update existing banner
  const updateBanner = async (bannerId: string, bannerData: BannerFormData): Promise<Banner> => {
    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update banner: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Banner updated successfully');
      return data;
    } catch (error) {
      console.error('🚫 Update banner failed:', error);
      throw error;
    }
  };

  // Delete banner
  const deleteBanner = async (bannerId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete banner: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Banner deleted successfully');
      return true;
    } catch (error) {
      console.error('🚫 Delete banner failed:', error);
      return false;
    }
  };

  // Toggle banner status
  const toggleBannerStatus = async (bannerId: string): Promise<Banner | null> => {
    try {
      const response = await fetch(`/api/admin/banners/${bannerId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle banner status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Banner status toggled successfully');
      return data;
    } catch (error) {
      console.error('🚫 Toggle banner status failed:', error);
      return null;
    }
  };

  // Load banners from database on component mount
  useEffect(() => {
    const loadBanners = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchBanners();
        setBanners(response.success ? response.data : []);
      } catch (error) {
        console.error('Error loading banners:', error);
        setError(error instanceof Error ? error.message : 'Failed to load banners');
      } finally {
        setLoading(false);
      }
    };

    loadBanners();
  }, []);

  // Handle form submission with backend API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('form');
    
    try {
      let savedBanner: Banner;
      
      if (editingBanner) {
        // Update existing banner
        savedBanner = await updateBanner(editingBanner.id, formData);
        setBanners(banners.map(b => b.id === editingBanner.id ? savedBanner : b));
        alert('Banner updated successfully!');
      } else {
        // Create new banner
        savedBanner = await createBanner(formData);
        setBanners([...banners, savedBanner]);
        alert('Banner created successfully!');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving banner:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save banner';
      setError(`Error saving banner: ${errorMessage}`);
      alert(`Error saving banner: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle banner deletion with backend API
  const handleDelete = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner? This action cannot be undone.')) {
      return;
    }

    setActionLoading(bannerId);
    
    try {
      const success = await deleteBanner(bannerId);
      
      if (success) {
        setBanners(banners.filter(b => b.id !== bannerId));
        alert('Banner deleted successfully!');
      } else {
        alert('Failed to delete banner. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete banner';
      setError(`Error deleting banner: ${errorMessage}`);
      alert(`Error deleting banner: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle enable/disable toggle with backend API
  const handleToggleStatus = async (banner: Banner) => {
    setActionLoading(banner.id);
    
    try {
      const updatedBanner = await toggleBannerStatus(banner.id);
      
      if (updatedBanner) {
        setBanners(banners.map(b => b.id === banner.id ? updatedBanner : b));
        alert(`Banner ${updatedBanner.is_active ? 'enabled' : 'disabled'} successfully!`);
      } else {
        alert('Failed to update banner status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating banner status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update banner status';
      setError(`Error updating banner status: ${errorMessage}`);
      alert(`Error updating banner status: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      cta_text: '',
      cta_link: '',
      is_active: true,
      sort_order: 0,
      background_color: '#3B82F6',
      text_color: '#FFFFFF',
      position: 'hero'
    });
    setEditingBanner(null);
    setShowForm(false);
    setError(null); // Clear any existing errors
  };

  const startEdit = (banner: Banner) => {
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      image_url: banner.image_url,
      cta_text: banner.cta_text,
      cta_link: banner.cta_link,
      is_active: banner.is_active,
      sort_order: banner.sort_order,
      background_color: banner.background_color,
      text_color: banner.text_color,
      position: banner.position
    });
    setEditingBanner(banner);
    setShowForm(true);
    setError(null); // Clear any existing errors
  };

  const BannerPreview: React.FC<{ banner: BannerFormData }> = ({ banner }) => (
    <div 
      className="relative rounded-lg p-8 text-center"
      style={{ 
        backgroundColor: banner.background_color,
        color: banner.text_color
      }}
    >
      <h2 className="text-3xl font-bold mb-2">{banner.title || 'Your Title Here'}</h2>
      <h3 className="text-xl mb-4 opacity-90">{banner.subtitle || 'Your Subtitle'}</h3>
      <p className="text-lg mb-6 opacity-80">{banner.description || 'Your description here'}</p>
      {banner.cta_text && (
        <button 
          className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          {banner.cta_text}
        </button>
      )}
    </div>
  );

  // Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchBanners();
      setBanners(response.success ? response.data : []);
      console.log('🔄 Banners refreshed successfully');
    } catch (error) {
      console.error('Error refreshing banners:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh banners');
    } finally {
      setLoading(false);
    }
  };

  // Loading state with enhanced animation
  if (loading) {
    return (
      <>
        <style>{customStyles}</style>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center animate-fade-in">
          <div className="text-center animate-bounce-in">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 bg-clip-border mx-auto"></div>
              <div className="absolute inset-3 bg-white rounded-full"></div>
              <div className="absolute inset-4 animate-pulse bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full"></div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl border border-white/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">
                  Loading Banners
                </h3>
                <p className="text-gray-600 font-medium">Fetching banner content and management tools...</p>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-700 rounded-xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-3">Banner Management</h1>
          <p className="text-cyan-100">Error loading banner data</p>
        </div>
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Banner Management Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Enhanced Header Section */}
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-12 translate-y-12 blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-white/20 rounded-2xl p-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Banner Management</h1>
                        <p className="text-cyan-100 text-lg">Create stunning visual experiences and promotional content</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{banners.length}</div>
                        <div className="text-sm text-cyan-100">Total Banners</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-cyan-100 text-xl leading-relaxed mt-4">Design homepage heroes, promotional banners, and engaging visual content</p>
              </div>
            </div>
          </div>

          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Banners */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{banners.length}</p>
                  <p className="text-sm font-medium text-gray-600">Total Banners</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">Content pieces</p>
                </div>
              </div>
            </div>

            {/* Active Banners */}
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
                  <p className="text-3xl font-bold text-gray-900 mb-1">{banners.filter(b => b.is_active).length}</p>
                  <p className="text-sm font-medium text-gray-600">Active Banners</p>
                  <p className="text-xs text-green-600 mt-1 font-medium">Live & visible</p>
                </div>
              </div>
            </div>

            {/* Hero Banners */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{banners.filter(b => b.position === 'hero').length}</p>
                  <p className="text-sm font-medium text-gray-600">Hero Banners</p>
                  <p className="text-xs text-purple-600 mt-1 font-medium">Main display</p>
                </div>
              </div>
            </div>

            {/* Promotional */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{banners.filter(b => b.position === 'promotional').length}</p>
                  <p className="text-sm font-medium text-gray-600">Promotional</p>
                  <p className="text-xs text-orange-600 mt-1 font-medium">Marketing content</p>
                </div>
              </div>
            </div>

          </div>

          {/* Enhanced Header Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Banner Operations
                  <span className="text-sm font-normal text-gray-600 ml-2">• Manage visual content</span>
                </h2>
                <p className="text-gray-600 font-medium">Design homepage banners, hero sections, and promotional visual experiences</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="group relative px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium text-sm flex items-center space-x-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="relative z-10">{previewMode ? 'Edit Mode' : 'Preview Mode'}</span>
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  disabled={actionLoading !== null}
                  className="group relative px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-bold flex items-center space-x-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="relative z-10">Add New Banner</span>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Banner Position Filter */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">Filter by Position</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'All', name: 'All Banners', count: banners.length, colors: { bg: 'from-blue-500 to-blue-600', hover: 'hover:from-blue-600 hover:to-blue-700', ring: 'ring-2 ring-blue-200' } },
                  { id: 'Hero', name: 'Hero', count: banners.filter(b => b.position === 'hero').length, colors: { bg: 'from-purple-500 to-purple-600', hover: 'hover:from-purple-600 hover:to-purple-700', ring: 'ring-2 ring-purple-200' } },
                  { id: 'Secondary', name: 'Secondary', count: banners.filter(b => b.position === 'secondary').length, colors: { bg: 'from-green-500 to-green-600', hover: 'hover:from-green-600 hover:to-green-700', ring: 'ring-2 ring-green-200' } },
                  { id: 'Promotional', name: 'Promotional', count: banners.filter(b => b.position === 'promotional').length, colors: { bg: 'from-orange-500 to-orange-600', hover: 'hover:from-orange-600 hover:to-orange-700', ring: 'ring-2 ring-orange-200' } }
                ].map((position) => (
                  <button
                    key={position.id}
                    className={`py-3 px-6 rounded-xl font-semibold text-sm transition-all transform hover:scale-105 shadow-md bg-gradient-to-r ${position.colors.bg} ${position.colors.hover} text-white ${position.colors.ring}`}
                  >
                    {position.name} <span className="font-bold">({position.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
            {/* Form Panel */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banner Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Professional Home Services"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your Trusted Partner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Get expert plumbing, electrical, cleaning and more services at your doorstep"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Call-to-Action Text
                    </label>
                    <input
                      type="text"
                      value={formData.cta_text}
                      onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Book Now"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CTA Link
                    </label>
                    <input
                      type="text"
                      value={formData.cta_link}
                      onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="/services"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banner Position *
                    </label>
                    <select
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value as 'hero' | 'secondary' | 'promotional' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="hero">Hero Banner</option>
                      <option value="secondary">Secondary Banner</option>
                      <option value="promotional">Promotional Banner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background Color
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text Color
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                      Active (visible on website)
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={actionLoading === 'form'}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    {actionLoading === 'form' ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      editingBanner ? 'Update Banner' : 'Create Banner'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={actionLoading === 'form'}
                    className="flex-1 bg-gray-300 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Panel */}
            <div className="w-1/2 bg-gray-50 p-6 border-l border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Live Preview</h4>
              <div className="space-y-4">
                <BannerPreview banner={formData} />
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Position:</strong> {formData.position}</p>
                  <p><strong>Colors:</strong> Background {formData.background_color}, Text {formData.text_color}</p>
                  {formData.image_url && <p><strong>Image:</strong> {formData.image_url}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banners List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">All Banners</h3>
              <p className="text-gray-600 mt-1">{banners.length} banners • {banners.filter(b => b.is_active).length} active</p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                {banners.filter(b => b.is_active).length} Active
              </div>
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium">
                {banners.filter(b => !b.is_active).length} Inactive
              </div>
              <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-medium">
                {banners.filter(b => b.position === 'hero').length} Hero
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Banner Details
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Position & Type
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
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300">
                  <td className="px-8 py-6">
                    <div className="flex items-center">
                      <div 
                        className="w-16 h-12 rounded-lg mr-4 flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-gray-300"
                        style={{ 
                          backgroundColor: banner.background_color,
                          color: banner.text_color
                        }}
                      >
                        Banner
                      </div>
                      <div>
                        <div className="text-base font-bold text-gray-900 mb-1">
                          {banner.title}
                        </div>
                        <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                          {banner.subtitle || 'No subtitle'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1 max-w-md truncate">
                          {banner.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div>
                        <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${
                          banner.position === 'hero' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white ring-2 ring-purple-200' :
                          banner.position === 'promotional' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white ring-2 ring-red-200' :
                          'bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-2 ring-blue-200'
                        }`}>
                          {banner.position}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 font-bold text-lg rounded-full">
                          {banner.sort_order}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${
                      banner.is_active 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white ring-2 ring-green-200' 
                        : 'bg-gradient-to-r from-red-500 to-rose-600 text-white ring-2 ring-red-200'
                    }`}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => startEdit(banner)}
                      disabled={actionLoading !== null}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(banner)}
                      disabled={actionLoading === banner.id}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md disabled:cursor-not-allowed ${
                        actionLoading === banner.id
                          ? 'bg-gray-400 text-white'
                          : banner.is_active
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                      }`}
                    >
                      {actionLoading === banner.id ? 'Updating...' : (banner.is_active ? 'Disable' : 'Enable')}
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      disabled={actionLoading === banner.id}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                    >
                      {actionLoading === banner.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {banners.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">No banners found</h3>
            <p className="text-gray-600 mb-6">Create engaging banners to showcase your services and promotions on the homepage. Get started by adding your first banner!</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create First Banner</span>
            </button>
          </div>
        )}
      </div>

      {/* Banner Types Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Banner Position Guide</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Hero Banner:</strong> Main banner displayed prominently on the home page</p>
          <p><strong>Secondary Banner:</strong> Supporting banners for additional content</p>
          <p><strong>Promotional Banner:</strong> Special offers, discounts, and promotional content</p>
        </div>
      </div>
        </div>
      </div>
    </>
  );
};

export default BannerManagement;