/**
 * Price Formatting Utilities
 * 
 * Handles proper Indian Rupee formatting for all price displays
 * Ensures no prices are shown in paisa format (like 1200.00)
 */

/**
 * Format price in Indian Rupees with proper currency symbol
 * @param price - Price value (can be string or number)
 * @param showSymbol - Whether to show ₹ symbol (default: true)
 * @returns Formatted price string
 */
export const formatPrice = (price: number | string, showSymbol: boolean = true): string => {
  if (!price && price !== 0) return showSymbol ? '₹0' : '0';
  
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) return showSymbol ? '₹0' : '0';
  
  // Round to nearest rupee (no decimal places)
  const roundedPrice = Math.round(numericPrice);
  
  // Format with Indian number system (crores, lakhs, etc.)
  const formattedNumber = roundedPrice.toLocaleString('en-IN');
  
  return showSymbol ? `₹${formattedNumber}` : formattedNumber;
};

/**
 * Format price range (min - max)
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price  
 * @param showSymbol - Whether to show ₹ symbol (default: true)
 * @returns Formatted price range string
 */
export const formatPriceRange = (
  minPrice: number | string, 
  maxPrice: number | string, 
  showSymbol: boolean = true
): string => {
  const min = formatPrice(minPrice, showSymbol);
  const max = formatPrice(maxPrice, false); // Don't repeat symbol
  return `${min} - ${showSymbol ? '₹' : ''}${max.replace(/₹/, '')}`;
};

/**
 * Calculate and format discount percentage
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Formatted discount percentage (e.g., "20% OFF")
 */
export const calculateDiscountPercentage = (
  originalPrice: number | string, 
  discountedPrice: number | string
): string => {
  const original = typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice;
  const discounted = typeof discountedPrice === 'string' ? parseFloat(discountedPrice) : discountedPrice;
  
  if (!original || !discounted || original <= discounted) return '';
  
  const discount = Math.round(((original - discounted) / original) * 100);
  return `${discount}% OFF`;
};

/**
 * Format price with discount display
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price (optional)
 * @returns Object with formatted prices and discount info
 */
export const formatPriceWithDiscount = (
  originalPrice: number | string,
  discountedPrice?: number | string
) => {
  const original = formatPrice(originalPrice);
  
  if (!discountedPrice) {
    return {
      displayPrice: original,
      originalPrice: original,
      discountedPrice: null,
      discountPercentage: null,
      hasDiscount: false
    };
  }
  
  const discounted = formatPrice(discountedPrice);
  const discountPercentage = calculateDiscountPercentage(originalPrice, discountedPrice);
  
  return {
    displayPrice: discounted,
    originalPrice: original,
    discountedPrice: discounted,
    discountPercentage,
    hasDiscount: true
  };
};

/**
 * Format currency for form inputs (numbers only, no symbols)
 * @param value - Input value
 * @returns Clean numeric string
 */
export const formatCurrencyInput = (value: string): string => {
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  return cleaned;
};

/**
 * Parse currency input to number
 * @param value - Currency input string
 * @returns Parsed number value
 */
export const parseCurrencyInput = (value: string): number => {
  const cleaned = formatCurrencyInput(value);
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format large numbers in Indian format (Lakhs, Crores)
 * @param num - Number to format
 * @param showSymbol - Whether to show ₹ symbol
 * @returns Formatted number with Indian units
 */
export const formatIndianCurrency = (num: number | string, showSymbol: boolean = true): string => {
  const numericValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numericValue)) return showSymbol ? '₹0' : '0';
  
  const absNum = Math.abs(numericValue);
  const prefix = showSymbol ? '₹' : '';
  const sign = numericValue < 0 ? '-' : '';
  
  if (absNum >= 10000000) { // 1 Crore
    return `${sign}${prefix}${(absNum / 10000000).toFixed(1)}Cr`;
  } else if (absNum >= 100000) { // 1 Lakh
    return `${sign}${prefix}${(absNum / 100000).toFixed(1)}L`;
  } else if (absNum >= 1000) { // 1 Thousand
    return `${sign}${prefix}${(absNum / 1000).toFixed(1)}K`;
  } else {
    return `${sign}${prefix}${Math.round(absNum).toLocaleString('en-IN')}`;
  }
};

/**
 * Format price for display in tables/lists (compact format)
 * @param price - Price value
 * @returns Compact formatted price
 */
export const formatCompactPrice = (price: number | string): string => {
  return formatIndianCurrency(price, true);
};

/**
 * Format price with exact decimals (for totals/revenue)
 * @param price - Price value (can be string or number)
 * @param showSymbol - Whether to show ₹ symbol (default: true)
 * @returns Formatted price string with decimals
 */
export const formatExactPrice = (price: number | string, showSymbol: boolean = true): string => {
  if (!price && price !== 0) return showSymbol ? '₹0.00' : '0.00';
  
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) return showSymbol ? '₹0.00' : '0.00';
  
  // Keep exact decimals (up to 2 decimal places)
  const exactPrice = parseFloat(numericPrice.toFixed(2));
  
  // Format with Indian number system (crores, lakhs, etc.)
  const formattedNumber = exactPrice.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return showSymbol ? `₹${formattedNumber}` : formattedNumber;
};

/**
 * Default export for common usage
 */
export default formatPrice;