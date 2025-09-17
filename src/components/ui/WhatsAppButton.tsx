import React, { useMemo, useCallback, useState, useEffect } from 'react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
  variant?: 'floating' | 'inline' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  disabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber,
  message = 'Hi, I need help with household services',
  className = '',
  variant = 'inline',
  size = 'md',
  children,
  disabled = false,
  onError,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [backendPhone, setBackendPhone] = useState<string>('9437341234'); // fallback

  // Fetch WhatsApp number from backend ContactSettings - Production Integration
  useEffect(() => {
    let isMounted = true; // Cleanup flag to prevent state updates after unmount
    
    const fetchWhatsAppNumber = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const response = await fetch('/api/contact-settings', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok && isMounted) {
          const data = await response.json();
          if (data.success && data.data?.whatsappNumber) {
            setBackendPhone(data.data.whatsappNumber);
            console.log('✅ WhatsApp number loaded from backend:', data.data.whatsappNumber);
          }
        }
      } catch (error) {
        if (isMounted && error.name !== 'AbortError') {
          console.warn('⚠️ Failed to fetch WhatsApp number from backend, using fallback:', error);
        }
      }
    };

    // Only fetch if no phoneNumber prop provided
    if (!phoneNumber) {
      fetchWhatsAppNumber();
    }
    
    return () => {
      isMounted = false; // Cleanup: prevent state updates after unmount
    };
  }, [phoneNumber]);

  // Analytics tracking for WhatsApp interactions - Simple logging for now
  const trackWhatsAppInteraction = useCallback((action: string) => {
    // Simple console logging until analytics endpoint is implemented
    console.log('📊 WhatsApp Analytics:', {
      event: 'whatsapp_interaction',
      action,
      variant,
      phoneNumber: phoneNumber || backendPhone,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
    });
    
    // TODO: Implement proper analytics tracking when /api/analytics/events endpoint is created
  }, [variant, phoneNumber, backendPhone]);

  // Validate phone number (Indian mobile number format)
  const validatePhoneNumber = useCallback((phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    // Indian mobile: 10 digits starting with 6,7,8,9
    return /^[6-9]\d{9}$/.test(cleanPhone);
  }, []);

  // Format and validate message (max 2000 chars for WhatsApp)
  const formatMessage = useCallback((text: string): string => {
    if (!text || text.trim().length === 0) {
      return encodeURIComponent('Hi, I need help with household services');
    }
    
    // Limit message length for WhatsApp compatibility
    const truncated = text.length > 2000 ? text.substring(0, 1997) + '...' : text;
    return encodeURIComponent(truncated);
  }, []);

  // Memoized WhatsApp URL generation - Uses backend phone number
  const whatsAppUrl = useMemo(() => {
    const activePhone = phoneNumber || backendPhone;
    const cleanPhone = activePhone.replace(/\D/g, '');
    
    if (!validatePhoneNumber(cleanPhone)) {
      console.warn(`Invalid phone number: ${activePhone}. Using fallback.`);
      return `https://wa.me/919437341234?text=${formatMessage(message)}`;
    }
    
    return `https://wa.me/91${cleanPhone}?text=${formatMessage(message)}`;
  }, [phoneNumber, backendPhone, message, validatePhoneNumber, formatMessage]);

  const handleClick = useCallback(async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    const activePhone = phoneNumber || backendPhone;

    // Track WhatsApp interaction for analytics
    trackWhatsAppInteraction('click_initiated');

    try {
      // Check if we're on mobile and WhatsApp app might be available
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Construct proper WhatsApp app URL
        const cleanPhoneForApp = activePhone.replace(/\D/g, '');
        const encodedMessage = formatMessage(message);
        const whatsAppAppUrl = `whatsapp://send?phone=91${cleanPhoneForApp}&text=${encodedMessage}`;
        
        // Try to open WhatsApp app first, with web fallback
        let appOpened = false;
        
        try {
          // Create a temporary link to try opening the app
          const link = document.createElement('a');
          link.href = whatsAppAppUrl;
          link.style.display = 'none';
          document.body.appendChild(link);
          
          // Set up fallback to web version after delay
          const fallbackTimeout = setTimeout(() => {
            if (!appOpened) {
              window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
              trackWhatsAppInteraction('opened_web_fallback');
            }
          }, 1500);
          
          // Try to open the app
          link.click();
          document.body.removeChild(link);
          
          // Assume app opened (we can't detect this reliably)
          setTimeout(() => {
            appOpened = true;
            clearTimeout(fallbackTimeout);
            trackWhatsAppInteraction('attempted_mobile_app');
          }, 100);
          
        } catch (error) {
          // If app URL fails, open web version directly
          window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
          trackWhatsAppInteraction('opened_web_direct');
        }
        
      } else {
        // Desktop - open web WhatsApp
        const opened = window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
        
        if (!opened || opened.closed || typeof opened.closed === 'undefined') {
          throw new Error('Popup blocked or failed to open WhatsApp');
        }
        
        trackWhatsAppInteraction('opened_web_desktop');
      }

      onSuccess?.();
      
    } catch (error) {
      console.error('WhatsApp open failed:', error);
      trackWhatsAppInteraction('failed_to_open');
      
      // Fallback: copy to clipboard and show instructions
      try {
        await navigator.clipboard.writeText(`WhatsApp: +91${activePhone}\nMessage: ${message}`);
        alert(`WhatsApp couldn't open automatically. Contact details copied to clipboard!\n\nPhone: +91${activePhone}\nMessage: ${message}`);
        trackWhatsAppInteraction('copied_to_clipboard');
      } catch (clipboardError) {
        alert(`WhatsApp couldn't open. Please contact us at:\nPhone: +91${activePhone}\nMessage: ${message}`);
        trackWhatsAppInteraction('showed_manual_instructions');
      }
      
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [disabled, isLoading, whatsAppUrl, phoneNumber, backendPhone, message, onSuccess, onError, trackWhatsAppInteraction]);

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
      : 'hover:bg-green-600 transform hover:scale-105 cursor-pointer';
    
    const loadingClasses = isLoading ? 'animate-pulse' : '';

    switch (variant) {
      case 'floating':
        return `fixed bottom-6 right-6 ${getSizeClasses()} bg-green-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center ${baseClasses} ${loadingClasses}`;
      case 'icon':
        return `${getSizeClasses()} bg-green-500 text-white rounded-lg flex items-center justify-center hover:shadow-lg transition-all duration-200 ${baseClasses} ${loadingClasses}`;
      default:
        return `inline-flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg ${baseClasses} ${loadingClasses}`;
    }
  };

  const WhatsAppIcon = () => (
    <svg 
      className={`${variant === 'floating' ? 'w-6 h-6' : variant === 'icon' ? 'w-5 h-5' : 'w-4 h-4'} text-white`} 
      fill="currentColor" 
      viewBox="0 0 24 24"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
    </svg>
  );

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`${getVariantClasses()} ${className}`}
      title={isLoading ? 'Opening WhatsApp...' : 'Contact us on WhatsApp'}
      aria-label={isLoading ? 'Opening WhatsApp...' : 'Contact us on WhatsApp'}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        <>
          {variant === 'floating' || variant === 'icon' ? (
            <WhatsAppIcon />
          ) : (
            <div className="flex items-center space-x-2">
              <WhatsAppIcon />
              {children || <span>WhatsApp</span>}
            </div>
          )}
        </>
      )}
    </button>
  );
};

export default WhatsAppButton;