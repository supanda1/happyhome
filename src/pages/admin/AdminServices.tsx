import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useServices } from '../../contexts/ServiceContext';
import { Service, ServiceCategory, ServiceFormData } from '../../types';
import { Button, Input, Select, Card, CardHeader, CardContent, Modal, ModalHeader, ModalBody, ModalFooter, Badge, PhotoUpload, PhotoFile } from '../../components/ui';

const AdminServices: React.FC = () => {
  const {
    services,
    categories,
    loading,
    loadServices,
    loadCategories,
    createService,
    updateService,
    deleteService
  } = useServices();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<ServiceFormData>();

  const watchedInclusions = watch('inclusions', []);
  const watchedExclusions = watch('exclusions', []);
  const watchedTags = watch('tags', []);

  useEffect(() => {
    loadServices();
    loadCategories();
  }, [loadServices, loadCategories]);

  // Filter services based on search and category
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || service.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openCreateModal = () => {
    setEditingService(null);
    reset({
      name: '',
      categoryId: '',
      description: '',
      shortDescription: '',
      basePrice: 0,
      discountedPrice: undefined,
      duration: 60,
      inclusions: [],
      exclusions: [],
      tags: [],
      isActive: true,
      isFeatured: false
    });
    setPhotos([]);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    reset({
      name: service.name,
      categoryId: service.categoryId,
      description: service.description,
      shortDescription: service.shortDescription,
      basePrice: service.basePrice,
      discountedPrice: service.discountedPrice,
      duration: service.duration,
      inclusions: service.inclusions,
      exclusions: service.exclusions,
      tags: service.tags,
      isActive: service.isActive,
      isFeatured: service.isFeatured
    });
    
    // Convert existing service photos to PhotoFile format
    const existingPhotos: PhotoFile[] = service.photos.map(photo => ({
      id: photo.id,
      file: new File([], photo.url.split('/').pop() || 'image.jpg'), // Placeholder file
      url: photo.url,
      altText: photo.altText,
      isPrimary: photo.isPrimary,
      sortOrder: photo.sortOrder
    }));
    setPhotos(existingPhotos);
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    reset();
    // Clean up photo URLs to prevent memory leaks
    photos.forEach(photo => {
      if (photo.url.startsWith('blob:')) {
        URL.revokeObjectURL(photo.url);
      }
    });
    setPhotos([]);
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      // Process photos - in a real app, you would upload to a cloud service
      const processedPhotos = await Promise.all(
        photos.map(async (photo, index) => {
          // In a real app, you would upload the file to AWS S3 or similar
          // For now, we'll simulate this by keeping the existing URL
          let photoUrl = photo.url;
          
          // For new photos (blob URLs), simulate upload
          if (photo.url.startsWith('blob:')) {
            // Simulate upload delay
            await new Promise(resolve => setTimeout(resolve, 100));
            // In production, replace this with actual upload to S3
            photoUrl = `https://images.unsplash.com/photo-${Date.now()}-${index}?w=800`;
          }
          
          return {
            id: photo.id,
            serviceId: editingService?.id || 'new-service',
            url: photoUrl,
            altText: photo.altText || `${data.name} photo ${index + 1}`,
            isPrimary: photo.isPrimary,
            sortOrder: photo.sortOrder
          };
        })
      );

      if (editingService) {
        const updatedService: Service = {
          ...editingService,
          ...data,
          photos: processedPhotos,
          discountPercentage: data.discountedPrice && data.basePrice ? 
            Math.round(((data.basePrice - data.discountedPrice) / data.basePrice) * 100) : undefined
        };
        await updateService(updatedService);
      } else {
        const category = categories.find(c => c.id === data.categoryId);
        if (!category) throw new Error('Invalid category');
        
        const newService = {
          ...data,
          category,
          photos: processedPhotos,
          reviews: [],
          rating: 0,
          reviewCount: 0,
          availability: {
            isAvailable: true,
            timeSlots: [
              { startTime: '08:00', endTime: '10:00', isAvailable: true },
              { startTime: '10:00', endTime: '12:00', isAvailable: true },
              { startTime: '14:00', endTime: '16:00', isAvailable: true },
              { startTime: '16:00', endTime: '18:00', isAvailable: true },
            ],
            blackoutDates: []
          },
          discountPercentage: data.discountedPrice && data.basePrice ? 
            Math.round(((data.basePrice - data.discountedPrice) / data.basePrice) * 100) : undefined
        };
        await createService(newService);
      }
      closeModal();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      setIsDeleting(serviceId);
      try {
        await deleteService(serviceId);
      } catch (error) {
        console.error('Error deleting service:', error);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const addListItem = (type: 'inclusions' | 'exclusions' | 'tags', value: string) => {
    if (!value.trim()) return;
    
    const currentItems = type === 'inclusions' ? watchedInclusions : 
                        type === 'exclusions' ? watchedExclusions : watchedTags;
    
    if (!currentItems.includes(value.trim())) {
      setValue(type, [...currentItems, value.trim()]);
    }
  };

  const removeListItem = (type: 'inclusions' | 'exclusions' | 'tags', index: number) => {
    const currentItems = type === 'inclusions' ? watchedInclusions : 
                        type === 'exclusions' ? watchedExclusions : watchedTags;
    setValue(type, currentItems.filter((_, i) => i !== index));
  };

  const ListInput: React.FC<{
    label: string;
    type: 'inclusions' | 'exclusions' | 'tags';
    placeholder: string;
  }> = ({ label, type, placeholder }) => {
    const [inputValue, setInputValue] = useState('');
    const items = type === 'inclusions' ? watchedInclusions : 
                 type === 'exclusions' ? watchedExclusions : watchedTags;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addListItem(type, inputValue);
                  setInputValue('');
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder={placeholder}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => {
                addListItem(type, inputValue);
                setInputValue('');
              }}
            >
              Add
            </Button>
          </div>
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeListItem(type, index)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
          <p className="text-gray-600 mt-2">Loading services...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
          <p className="text-gray-600 mt-2">Manage all services and categories</p>
        </div>
        <Button onClick={openCreateModal}>
          Add New Service
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
            <Select
              placeholder="All Categories"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat.id, label: cat.name }))
              ]}
            />
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Total: {filteredServices.length} services</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow">
            <CardContent>
              <div className="space-y-4">
                {/* Service Image */}
                <div className="h-48 bg-gray-200 rounded-lg overflow-hidden">
                  {service.photos.length > 0 ? (
                    <img
                      src={service.photos[0].url}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                  )}
                </div>

                {/* Service Info */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{service.name}</h3>
                    <div className="flex space-x-1">
                      {service.isFeatured && (
                        <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                      )}
                      <Badge className={service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.shortDescription}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      {service.discountedPrice ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-primary-600">${service.discountedPrice}</span>
                          <span className="text-sm text-gray-500 line-through">${service.basePrice}</span>
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            {service.discountPercentage}% OFF
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">${service.basePrice}</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{service.duration} min</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {service.rating > 0 ? (
                      <span>{service.rating} ({service.reviewCount} reviews)</span>
                    ) : (
                      <span>No reviews yet</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(service)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(service.id)}
                    loading={isDeleting === service.id}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Service Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            <h2 className="text-xl font-semibold">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Service Name"
                  {...register('name', { required: 'Service name is required' })}
                  error={errors.name?.message}
                />
                <Select
                  label="Category"
                  {...register('categoryId', { required: 'Category is required' })}
                  options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                  error={errors.categoryId?.message}
                  placeholder="Select category"
                />
              </div>

              <Input
                label="Short Description"
                {...register('shortDescription', { required: 'Short description is required' })}
                error={errors.shortDescription?.message}
                helperText="Brief one-line description for service cards"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Description</label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                  placeholder="Detailed description of the service..."
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Pricing & Duration */}
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Base Price ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('basePrice', { 
                    required: 'Base price is required',
                    min: { value: 0, message: 'Price must be positive' }
                  })}
                  error={errors.basePrice?.message}
                />
                <Input
                  label="Discounted Price ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('discountedPrice')}
                  helperText="Leave empty if no discount"
                />
                <Input
                  label="Duration (minutes)"
                  type="number"
                  min="15"
                  step="15"
                  {...register('duration', { 
                    required: 'Duration is required',
                    min: { value: 15, message: 'Minimum 15 minutes' }
                  })}
                  error={errors.duration?.message}
                />
              </div>

              {/* Lists */}
              <div className="space-y-4">
                <ListInput
                  label="Inclusions"
                  type="inclusions"
                  placeholder="What's included in this service..."
                />
                <ListInput
                  label="Exclusions"
                  type="exclusions"
                  placeholder="What's not included..."
                />
                <ListInput
                  label="Tags"
                  type="tags"
                  placeholder="Service tags for search..."
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Service Photos</label>
                <PhotoUpload
                  photos={photos}
                  onPhotosChange={setPhotos}
                  maxPhotos={10}
                  maxFileSize={5}
                />
              </div>

              {/* Settings */}
              <div className="grid md:grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Service is active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('isFeatured')}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured service</span>
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {editingService ? 'Update Service' : 'Create Service'}
              </Button>
            </div>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default AdminServices;