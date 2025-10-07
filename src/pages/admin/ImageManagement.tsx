/**
 * Admin Image Management Component
 * 
 * Handles bulk downloading and management of service and category images
 * from Pexels API with local storage integration.
 */

import React, { useState, useEffect } from 'react';
import { FiDownload, FiImage, FiTrash2, FiCheck, FiX, FiRefreshCw, FiSettings } from 'react-icons/fi';
import { 
  bulkDownloadAllServiceImages, 
  bulkDownloadAllCategoryImages, 
  downloadServiceImages,
  downloadCategoryImages,
  cleanupUnusedImages,
  getServices,
  getCategories,
  getImageUrl,
  type Service,
  type Category
} from '../../utils/adminDataManager';

interface ImageDownloadResult {
  serviceId?: string;
  categoryId?: string;
  serviceName?: string;
  categoryName?: string;
  images: string[];
  success: boolean;
}

interface BulkDownloadStats {
  success: number;
  failed: number;
  results: ImageDownloadResult[];
}

const ImageManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [bulkStats, setBulkStats] = useState<BulkDownloadStats | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'categories' | 'bulk' | 'cleanup'>('bulk');
  const [imageCount, setImageCount] = useState(5);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [servicesData, categoriesData] = await Promise.all([
        getServices(),
        getCategories()
      ]);
      setServices(servicesData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleBulkDownloadServices = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setDownloadProgress('Starting bulk download for all services...');
    setBulkStats(null);

    try {
      const result = await bulkDownloadAllServiceImages(imageCount);
      setBulkStats(result);
      setDownloadProgress(`Bulk download completed: ${result.success} successful, ${result.failed} failed`);
      
      // Refresh services data to show updated images
      await loadData();
    } catch (error) {
      console.error('Bulk download failed:', error);
      setDownloadProgress('Bulk download failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDownloadCategories = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setDownloadProgress('Starting bulk download for all categories...');
    setBulkStats(null);

    try {
      const result = await bulkDownloadAllCategoryImages(3);
      setBulkStats(result);
      setDownloadProgress(`Category bulk download completed: ${result.success} successful, ${result.failed} failed`);
      
      // Refresh categories data to show updated images
      await loadData();
    } catch (error) {
      console.error('Category bulk download failed:', error);
      setDownloadProgress('Category bulk download failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadServiceImages = async (serviceId: string, serviceName: string, categoryId: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setDownloadProgress(`Downloading images for ${serviceName}...`);

    try {
      const imagePaths = await downloadServiceImages(serviceId, serviceName, categoryId, imageCount);
      if (imagePaths.length > 0) {
        setDownloadProgress(`Downloaded ${imagePaths.length} images for ${serviceName}`);
        await loadData(); // Refresh data
      } else {
        setDownloadProgress(`No images found for ${serviceName}`);
      }
    } catch (error) {
      console.error('Service image download failed:', error);
      setDownloadProgress(`Failed to download images for ${serviceName}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCategoryImages = async (categoryId: string, categoryName: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setDownloadProgress(`Downloading images for ${categoryName} category...`);

    try {
      const imagePaths = await downloadCategoryImages(categoryId, categoryName, 3);
      if (imagePaths.length > 0) {
        setDownloadProgress(`Downloaded ${imagePaths.length} images for ${categoryName} category`);
        await loadData(); // Refresh data
      } else {
        setDownloadProgress(`No images found for ${categoryName} category`);
      }
    } catch (error) {
      console.error('Category image download failed:', error);
      setDownloadProgress(`Failed to download images for ${categoryName} category`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupImages = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setDownloadProgress('Cleaning up unused images...');

    try {
      const result = await cleanupUnusedImages();
      setDownloadProgress(`Cleanup completed: ${result.deleted} files deleted, ${result.freed_space} freed`);
    } catch (error) {
      console.error('Image cleanup failed:', error);
      setDownloadProgress('Image cleanup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderServiceItem = (service: Service) => {
    const hasImages = service.image_paths && service.image_paths.length > 0;
    
    return (
      <div key={service.id} className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{service.name}</h4>
            <p className="text-sm text-gray-500">Category: {service.category?.name || 'Unknown'}</p>
            <div className="flex items-center mt-2">
              {hasImages ? (
                <div className="flex items-center text-green-600">
                  <FiCheck className="w-4 h-4 mr-1" />
                  <span className="text-sm">{service.image_paths?.length || 0} images</span>
                </div>
              ) : (
                <div className="flex items-center text-gray-400">
                  <FiX className="w-4 h-4 mr-1" />
                  <span className="text-sm">No images</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {hasImages && (
              <div className="flex space-x-1">
                {(service.image_paths as string[])?.slice(0, 3).map((imagePath: string, index: number) => (
                  <img
                    key={index}
                    src={getImageUrl(imagePath)}
                    alt={`${service.name} ${index + 1}`}
                    className="w-8 h-8 rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ))}
                {(service.image_paths as string[])?.length > 3 && (
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    +{((service.image_paths as string[])?.length || 0) - 3}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => handleDownloadServiceImages(service.id, service.name, service.category_id)}
              disabled={isLoading}
              className="btn-sm btn-secondary flex items-center"
            >
              <FiDownload className="w-4 h-4 mr-1" />
              {hasImages ? 'Refresh' : 'Download'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryItem = (category: Record<string, unknown>) => {
    const hasImages = category.image_paths && (category.image_paths as string[])?.length > 0;
    
    return (
      <div key={category.id} className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{category.name}</h4>
            <p className="text-sm text-gray-500">{category.description}</p>
            <div className="flex items-center mt-2">
              {hasImages ? (
                <div className="flex items-center text-green-600">
                  <FiCheck className="w-4 h-4 mr-1" />
                  <span className="text-sm">{(category.image_paths as string[])?.length || 0} images</span>
                </div>
              ) : (
                <div className="flex items-center text-gray-400">
                  <FiX className="w-4 h-4 mr-1" />
                  <span className="text-sm">No images</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {hasImages && (
              <div className="flex space-x-1">
                {(category.image_paths as string[])?.slice(0, 3).map((imagePath: string, index: number) => (
                  <img
                    key={index}
                    src={getImageUrl(imagePath)}
                    alt={`${category.name} ${index + 1}`}
                    className="w-8 h-8 rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ))}
                {(category.image_paths as string[])?.length > 3 && (
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    +{((category.image_paths as string[])?.length || 0) - 3}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => handleDownloadCategoryImages(category.id, category.name)}
              disabled={isLoading}
              className="btn-sm btn-secondary flex items-center"
            >
              <FiDownload className="w-4 h-4 mr-1" />
              {hasImages ? 'Refresh' : 'Download'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Image Management</h1>
        <p className="text-gray-600">
          Download and manage license-free images from Pexels for services and categories
        </p>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center mb-4">
          <FiSettings className="w-5 h-5 mr-2" />
          <h3 className="font-medium">Download Settings</h3>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <span className="text-sm text-gray-700 mr-2">Images per service:</span>
            <select
              value={imageCount}
              onChange={(e) => setImageCount(Number(e.target.value))}
              className="form-select text-sm w-20"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
            </select>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'bulk', label: 'Bulk Operations', icon: FiDownload },
          { key: 'services', label: 'Services', icon: FiImage },
          { key: 'categories', label: 'Categories', icon: FiImage },
          { key: 'cleanup', label: 'Cleanup', icon: FiTrash2 }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'services' | 'categories' | 'bulk' | 'cleanup')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Progress */}
      {(isLoading || downloadProgress) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            {isLoading && <FiRefreshCw className="w-4 h-4 mr-2 animate-spin text-blue-600" />}
            <span className="text-blue-800">{downloadProgress || 'Processing...'}</span>
          </div>
        </div>
      )}

      {/* Bulk Stats */}
      {bulkStats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-green-800 mb-2">Bulk Download Results</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-600">✓ Successful: {bulkStats.success}</span>
            </div>
            <div>
              <span className="text-red-600">✗ Failed: {bulkStats.failed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">Bulk Download Operations</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Download All Service Images</h4>
                  <p className="text-sm text-gray-600">
                    Download {imageCount} images for each service from Pexels ({services.length} services)
                  </p>
                </div>
                <button
                  onClick={handleBulkDownloadServices}
                  disabled={isLoading}
                  className="btn-primary flex items-center"
                >
                  <FiDownload className="w-4 h-4 mr-2" />
                  Download All Services
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Download All Category Images</h4>
                  <p className="text-sm text-gray-600">
                    Download 3 images for each category from Pexels ({categories.length} categories)
                  </p>
                </div>
                <button
                  onClick={handleBulkDownloadCategories}
                  disabled={isLoading}
                  className="btn-primary flex items-center"
                >
                  <FiDownload className="w-4 h-4 mr-2" />
                  Download All Categories
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Service Images ({services.length} services)</h3>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="btn-secondary btn-sm flex items-center"
            >
              <FiRefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          <div className="space-y-3">
            {services.map(renderServiceItem)}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Category Images ({categories.length} categories)</h3>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="btn-secondary btn-sm flex items-center"
            >
              <FiRefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          <div className="space-y-3">
            {categories.map(renderCategoryItem)}
          </div>
        </div>
      )}

      {activeTab === 'cleanup' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">Image Cleanup</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Clean Up Unused Images</h4>
                  <p className="text-sm text-gray-600">
                    Remove images from local storage that are no longer referenced by services or categories
                  </p>
                </div>
                <button
                  onClick={handleCleanupImages}
                  disabled={isLoading}
                  className="btn-secondary flex items-center"
                >
                  <FiTrash2 className="w-4 h-4 mr-2" />
                  Clean Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageManagement;