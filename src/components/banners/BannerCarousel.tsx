import React, { useState, useEffect } from 'react';
import { Button } from '../ui';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  image_url: string | null;
  background_color: string;
  text_color: string;
  position: 'hero' | 'secondary' | 'promotional';
  is_active: boolean;
  sort_order: number;
}

interface BannerCarouselProps {
  position?: 'hero' | 'secondary' | 'promotional';
  className?: string;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ position = 'hero', className = '' }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch(`/api/banners/position/${position}`);
        if (!response.ok) {
          throw new Error('Failed to fetch banners');
        }
        const data = await response.json();
        
        if (data.success) {
          // Banners are already filtered by position and active status from the backend
          const sortedBanners = data.data.sort((a: Banner, b: Banner) => a.sort_order - b.sort_order);
          setBanners(sortedBanners);
        } else {
          setError(data.message || 'Failed to load banners');
        }
      } catch (err) {
        console.error('Error fetching banners:', err);
        setError(err instanceof Error ? err.message : 'Failed to load banners');
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [position]);

  // Auto-slide functionality for hero banners
  useEffect(() => {
    if (banners.length > 1 && position === 'hero') {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [banners.length, position]);

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-orange-500 via-purple-600 to-blue-600 text-white ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded mb-4 max-w-md mx-auto"></div>
              <div className="h-6 bg-white/20 rounded mb-6 max-w-lg mx-auto"></div>
              <div className="h-4 bg-white/20 rounded mb-8 max-w-2xl mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || banners.length === 0) {
    // Fallback to default hero section if no banners or error
    return (
      <section className={`bg-gradient-to-br from-orange-500 via-purple-600 to-blue-600 text-white ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Professional Home Services
              <span className="block text-orange-200">At Your Doorstep</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-orange-100 max-w-3xl mx-auto">
              Get reliable, professional services for your home. From plumbing to cleaning, 
              we connect you with trusted professionals in your area.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Browse Services
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-orange-600">
                How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <section 
      className={`relative overflow-hidden ${className}`}
      style={{
        background: (currentBanner.image_url && currentBanner.image_url.trim()) 
          ? `url(${currentBanner.image_url})` 
          : 'linear-gradient(to bottom right, #f97316 0%, #9333ea 50%, #2563eb 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: currentBanner.text_color
      }}
    >
      {/* Background Image */}
      {currentBanner.image_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${currentBanner.image_url})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {currentBanner.title}
            {currentBanner.subtitle && (
              <span className="block text-lg md:text-2xl font-normal mt-2 opacity-90">
                {currentBanner.subtitle}
              </span>
            )}
          </h1>
          
          {currentBanner.description && (
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              {currentBanner.description}
            </p>
          )}
          
          {currentBanner.button_text && currentBanner.button_link && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="w-full sm:w-auto"
                onClick={() => window.location.href = currentBanner.button_link}
              >
                {currentBanner.button_text}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Carousel Indicators (for multiple banners) */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows (for multiple banners) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prevIndex) => 
              prevIndex === 0 ? banners.length - 1 : prevIndex - 1
            )}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 z-20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={() => setCurrentIndex((prevIndex) => 
              (prevIndex + 1) % banners.length
            )}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 z-20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </section>
  );
};

export default BannerCarousel;