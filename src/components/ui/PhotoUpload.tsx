import React, { useState, useRef, useCallback } from 'react';
import Button from './Button';

export interface PhotoFile {
  id: string;
  file: File;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface PhotoUploadProps {
  photos: PhotoFile[];
  onPhotosChange: (photos: PhotoFile[]) => void;
  maxPhotos?: number;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  className?: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxFileSize = 5, // 5MB default
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use: ${acceptedTypes.join(', ')}`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    
    return null;
  };

  const handleFiles = useCallback((files: FileList) => {
    setUploadError(null);
    
    const newPhotos: PhotoFile[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file, index) => {
      if (photos.length + newPhotos.length >= maxPhotos) {
        errors.push(`Maximum ${maxPhotos} photos allowed`);
        return;
      }

      const error = validateFile(file);
      if (error) {
        errors.push(error);
        return;
      }

      const photoId = `photo-${Date.now()}-${index}`;
      const url = URL.createObjectURL(file);
      
      newPhotos.push({
        id: photoId,
        file,
        url,
        altText: file.name.replace(/\.[^/.]+$/, ''),
        isPrimary: photos.length === 0 && newPhotos.length === 0, // First photo is primary
        sortOrder: photos.length + newPhotos.length
      });
    });

    if (errors.length > 0) {
      setUploadError(errors[0]);
    }

    if (newPhotos.length > 0) {
      onPhotosChange([...photos, ...newPhotos]);
    }
  }, [photos, onPhotosChange, maxPhotos, maxFileSize, acceptedTypes]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const removePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    // Clean up object URL to prevent memory leaks
    const photoToRemove = photos.find(p => p.id === photoId);
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.url);
    }
    
    // If we removed the primary photo, make the first remaining photo primary
    if (updatedPhotos.length > 0 && !updatedPhotos.some(p => p.isPrimary)) {
      updatedPhotos[0].isPrimary = true;
    }
    
    onPhotosChange(updatedPhotos);
  };

  const setPrimaryPhoto = (photoId: string) => {
    const updatedPhotos = photos.map(photo => ({
      ...photo,
      isPrimary: photo.id === photoId
    }));
    onPhotosChange(updatedPhotos);
  };

  const updateAltText = (photoId: string, altText: string) => {
    const updatedPhotos = photos.map(photo =>
      photo.id === photoId ? { ...photo, altText } : photo
    );
    onPhotosChange(updatedPhotos);
  };

  const movePhoto = (photoId: string, direction: 'up' | 'down') => {
    const currentIndex = photos.findIndex(p => p.id === photoId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    const updatedPhotos = [...photos];
    [updatedPhotos[currentIndex], updatedPhotos[newIndex]] = [updatedPhotos[newIndex], updatedPhotos[currentIndex]];
    
    // Update sort orders
    updatedPhotos.forEach((photo, index) => {
      photo.sortOrder = index;
    });

    onPhotosChange(updatedPhotos);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {photos.length < maxPhotos && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-2">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="text-gray-600">
                Drag and drop images here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  browse files
                </button>
              </p>
              <p className="text-sm text-gray-500">
                Maximum {maxPhotos} photos, up to {maxFileSize}MB each. Supported: JPG, PNG, WebP
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Files
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 text-sm">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Uploaded Photos ({photos.length}/{maxPhotos})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={`relative bg-white border rounded-lg overflow-hidden ${
                  photo.isPrimary ? 'ring-2 ring-primary-500' : 'border-gray-200'
                }`}
              >
                {/* Image */}
                <div className="aspect-video bg-gray-100">
                  <img
                    src={photo.url}
                    alt={photo.altText}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Primary Badge */}
                {photo.isPrimary && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </span>
                  </div>
                )}

                {/* Controls */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => movePhoto(photo.id, 'up')}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 p-1 rounded"
                      title="Move up"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  )}
                  {index < photos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => movePhoto(photo.id, 'down')}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 p-1 rounded"
                      title="Move down"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="bg-red-600 bg-opacity-90 hover:bg-opacity-100 text-white p-1 rounded"
                    title="Remove photo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Photo Info */}
                <div className="p-3 space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Alt Text</label>
                    <input
                      type="text"
                      value={photo.altText}
                      onChange={(e) => updateAltText(photo.id, e.target.value)}
                      className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Describe this image..."
                    />
                  </div>
                  {!photo.isPrimary && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPrimaryPhoto(photo.id)}
                      fullWidth
                    >
                      Set as Primary
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;