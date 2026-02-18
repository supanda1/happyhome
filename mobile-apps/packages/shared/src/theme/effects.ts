/**
 * Happy Homes Design System - Effects
 * 
 * Shadow and gradient utilities matching the web UI's modern effects.
 * Includes glass morphism, 3D shadows, and gradient definitions.
 */

import { ViewStyle } from 'react-native';
import { colors } from './colors';

// Shadow definitions (matching web UI shadow layers)
export const shadows = {
  // Basic shadows
  xs: {
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,

  sm: {
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  } as ViewStyle,

  md: {
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  } as ViewStyle,

  lg: {
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  } as ViewStyle,

  xl: {
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 12,
  } as ViewStyle,

  '2xl': {
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 1,
    shadowRadius: 50,
    elevation: 16,
  } as ViewStyle,

  // Colored shadows for interactive elements
  primary: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  success: {
    shadowColor: colors.success[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  warning: {
    shadowColor: colors.warning[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  danger: {
    shadowColor: colors.danger[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  // Special effects
  inner: {
    // Note: Inner shadow is not directly supported in React Native
    // This can be achieved with overlay components
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: -1, // Negative elevation for inner effect
  } as ViewStyle,

  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,
} as const;

// Gradient configurations (matching web UI gradients)
export const gradients = {
  // Hero gradients (from web UI)
  hero: {
    colors: colors.gradients.hero,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    locations: [0, 0.5, 1],
  },

  // Primary gradients
  primary: {
    light: {
      colors: [colors.primary[200], colors.primary[400]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    },
    medium: {
      colors: [colors.primary[400], colors.primary[600]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    },
    dark: {
      colors: [colors.primary[600], colors.primary[800]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    },
  },

  // Status gradients
  success: {
    colors: colors.gradients.success,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },

  warning: {
    colors: colors.gradients.warning,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },

  danger: {
    colors: colors.gradients.danger,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },

  // Directional gradients
  vertical: {
    primary: {
      colors: [colors.primary[400], colors.primary[600]],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
    secondary: {
      colors: [colors.secondary[100], colors.secondary[300]],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
  },

  diagonal: {
    primary: {
      colors: [colors.primary[400], colors.primary[600]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    hero: {
      colors: colors.gradients.hero,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      locations: [0, 0.5, 1],
    },
  },

  // Subtle gradients for backgrounds
  subtle: {
    light: {
      colors: [colors.secondary[50], colors.secondary[100]],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
    warm: {
      colors: [colors.primary[50], colors.primary[100]],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
  },

  // Glass morphism effect
  glass: {
    colors: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

// Glass morphism style helper
export const glassMorphism = {
  light: {
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.border,
    // Note: backdrop-filter is not directly supported in React Native
    // Use BlurView component for actual blur effect
  } as ViewStyle,

  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  } as ViewStyle,

  dark: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
} as const;

// Animation and transition configurations
export const animations = {
  // Duration constants (matching web UI)
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 700,
  },

  // Easing curves
  easing: {
    ease: 'ease' as const,
    easeIn: 'ease-in' as const,
    easeOut: 'ease-out' as const,
    easeInOut: 'ease-in-out' as const,
    linear: 'linear' as const,
  },

  // Transform presets
  transform: {
    scale: {
      hover: 1.05,    // Matching web hover:scale-105
      active: 0.95,   // Touch feedback
      disabled: 0.9,
    },
    translate: {
      slideUp: -10,
      slideDown: 10,
      slideLeft: -10,
      slideRight: 10,
    },
  },
} as const;

// Blur configurations (for use with BlurView)
export const blur = {
  light: {
    blurType: 'light' as const,
    blurAmount: 10,
  },
  dark: {
    blurType: 'dark' as const,
    blurAmount: 10,
  },
  xlight: {
    blurType: 'xlight' as const,
    blurAmount: 5,
  },
  prominent: {
    blurType: 'prominent' as const,
    blurAmount: 15,
  },
} as const;

// Export types
export type Shadows = typeof shadows;
export type Gradients = typeof gradients;
export type GlassMorphism = typeof glassMorphism;
export type Animations = typeof animations;
export type Blur = typeof blur;