import React, { useMemo, useCallback, useState } from 'react';

interface FacebookButtonProps {
  facebookUrl?: string;
  shareUrl?: string;
  message?: string;
  className?: string;
  variant?: 'share' | 'page' | 'messenger' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  disabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

const FacebookButton: React.FC<FacebookButtonProps> = ({
  facebookUrl = 'https://www.facebook.com/happyhomes.official',
  shareUrl = window.location.href,
  message = 'Check out Happy Homes for household services!',
  className = '',
  variant = 'page',
  size = 'md',
  children,
  disabled = false,
  onError,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Validate Facebook URL format
  const validateFacebookUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'www.facebook.com' || urlObj.hostname === 'facebook.com';
    } catch {
      return false;
    }
  }, []);

  // Generate Facebook URLs based on variant
  const facebookUrls = useMemo(() => {
    const cleanFacebookUrl = facebookUrl.startsWith('http') ? facebookUrl : `https://${facebookUrl}`;
    const encodedShareUrl = encodeURIComponent(shareUrl);
    const encodedMessage = encodeURIComponent(message);

    return {
      page: cleanFacebookUrl,
      share: `https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`,
      messenger: `https://www.messenger.com/new/?link=${encodedShareUrl}&text=${encodedMessage}`,
      icon: cleanFacebookUrl
    };
  }, [facebookUrl, shareUrl, message]);

  // Get appropriate URL based on variant
  const targetUrl = useMemo(() => {
    if (!validateFacebookUrl(facebookUrls.page) && variant === 'page') {
      console.warn(`Invalid Facebook URL: ${facebookUrl}. Using default.`);
      return 'https://www.facebook.com/happyhomes.official';
    }
    
    return facebookUrls[variant] || facebookUrls.page;
  }, [variant, facebookUrls, facebookUrl, validateFacebookUrl]);

  const handleClick = useCallback(async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      // Check if we're on mobile for better Facebook app integration
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (variant === 'share' && navigator.share) {
        // Use native sharing on mobile devices when available
        try {
          await navigator.share({
            title: 'Happy Homes - Household Services',
            text: message,
            url: shareUrl,
          });
          onSuccess?.();
          return;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_shareError) {
          // Fall through to Facebook sharing if native sharing is cancelled
        }
      }

      // Open Facebook URL
      const opened = window.open(
        targetUrl,
        '_blank',
        'noopener,noreferrer,width=600,height=400'
      );

      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        throw new Error('Popup blocked or failed to open Facebook');
      }

      // For Facebook pages on mobile, try to open Facebook app
      if (isMobile && variant === 'page') {
        // Try Facebook app deep link
        const fbAppUrl = facebookUrl.replace('https://www.facebook.com/', 'fb://profile/');
        const fallbackTimeout = setTimeout(() => {
          // If app doesn't open, the web version is already open
        }, 1000);
        
        try {
          const link = document.createElement('a');
          link.href = fbAppUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          clearTimeout(fallbackTimeout);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_appError) {
          // Web version already opened, ignore app error
        }
      }

      onSuccess?.();
      
    } catch (error) {
      console.error('Facebook open failed:', error);
      
      // Fallback: copy to clipboard and show instructions
      try {
        await navigator.clipboard.writeText(`Facebook: ${facebookUrl}\nShare: ${shareUrl}`);
        alert(`Facebook couldn't open automatically. Link copied to clipboard!\n\nFacebook: ${facebookUrl}\nShare: ${shareUrl}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_clipboardError) {
        alert(`Facebook couldn't open. Please visit:\n\nFacebook: ${facebookUrl}\nShare: ${shareUrl}`);
      }
      
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [disabled, isLoading, targetUrl, variant, facebookUrl, shareUrl, message, onSuccess, onError]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-14 h-14 text-xl';
      default:
        return 'w-12 h-12 text-lg';
    }
  };

  const getVariantClasses = () => {
    const baseClasses = disabled 
      ? 'opacity-50 cursor-not-allowed' 
      : 'hover:bg-blue-700 transform hover:scale-105 cursor-pointer';
    
    const loadingClasses = isLoading ? 'animate-pulse' : '';

    switch (variant) {
      case 'icon':
        return `${getSizeClasses()} bg-blue-600 text-white rounded-lg flex items-center justify-center hover:shadow-lg transition-all duration-200 ${baseClasses} ${loadingClasses}`;
      default:
        return `inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg ${baseClasses} ${loadingClasses}`;
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Opening...';
    
    switch (variant) {
      case 'share':
        return children || 'Share on Facebook';
      case 'messenger':
        return children || 'Message on Facebook';
      case 'page':
        return children || 'Visit Facebook Page';
      case 'icon':
        return '';
      default:
        return children || 'Facebook';
    }
  };

  const getAriaLabel = () => {
    if (isLoading) return 'Opening Facebook...';
    
    switch (variant) {
      case 'share':
        return 'Share this page on Facebook';
      case 'messenger':
        return 'Send message via Facebook Messenger';
      case 'page':
        return 'Visit our Facebook page';
      case 'icon':
        return 'Visit our Facebook page';
      default:
        return 'Visit our Facebook page';
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`${getVariantClasses()} ${className}`}
      title={isLoading ? 'Opening Facebook...' : getAriaLabel()}
      aria-label={getAriaLabel()}
      aria-busy={isLoading}
    >
      {!isLoading && variant !== 'icon' && (
        <span className="text-white font-semibold">FB</span>
      )}
      {variant !== 'icon' && <span>{getButtonText()}</span>}
    </button>
  );
};

export default FacebookButton;