import React, { useState } from 'react';

interface DynamicImageProps {
  src?: string | string[];
  alt: string;
  className?: string;
  fallbackEmoji?: string;
  onClick?: () => void;
  imageIndex?: number;
}

/**
 * Dynamic Image Component
 * - Uses backend-provided image paths
 * - Checks if image files exist before displaying
 * - Falls back to emoji if image not found
 * - NO HARDCODED IMAGE MAPPINGS
 */
const DynamicImage: React.FC<DynamicImageProps> = ({
  src,
  alt,
  className = 'w-full h-48 object-cover',
  fallbackEmoji = '📋',
  onClick,
  imageIndex = 0
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get the actual image source to use
  const getImageSrc = (): string | null => {
    if (!src) return null;
    
    if (Array.isArray(src)) {
      if (src.length === 0) return null;
      const index = Math.min(imageIndex, src.length - 1);
      return src[index];
    }
    
    return src;
  };

  const imageSrc = getImageSrc();
  const shouldShowImage = imageSrc && !imageError;

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    console.warn(`Image failed to load: ${imageSrc}`);
  };

  // If no image source provided or image failed to load, show emoji fallback
  if (!shouldShowImage) {
    return (
      <div 
        className={`${className} flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-gray-300 cursor-pointer hover:from-blue-100 hover:to-purple-100 transition-colors`}
        onClick={onClick}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">{fallbackEmoji}</div>
          <div className="text-sm text-gray-500 font-medium">{alt}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        onClick={onClick}
      />
      
      {/* Loading placeholder */}
      {!imageLoaded && (
        <div 
          className={`${className} absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse`}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-xs text-gray-500">Loading...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicImage;