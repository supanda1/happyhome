/**
 * Happy Homes Design System - Typography
 * 
 * Typography system matching the web UI's Inter font family
 * with proper scaling for mobile devices.
 */

import { Platform } from 'react-native';

// Font family configuration
const fontFamily = {
  regular: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter-Regular',
    default: 'Inter, system-ui, -apple-system, sans-serif'
  }),
  medium: Platform.select({
    ios: 'Inter-Medium', 
    android: 'Inter-Medium',
    default: 'Inter, system-ui, -apple-system, sans-serif'
  }),
  semiBold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter-SemiBold', 
    default: 'Inter, system-ui, -apple-system, sans-serif'
  }),
  bold: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter-Bold',
    default: 'Inter, system-ui, -apple-system, sans-serif'
  }),
  extraBold: Platform.select({
    ios: 'Inter-ExtraBold',
    android: 'Inter-ExtraBold',
    default: 'Inter, system-ui, -apple-system, sans-serif'
  }),
  black: Platform.select({
    ios: 'Inter-Black',
    android: 'Inter-Black',
    default: 'Inter, system-ui, -apple-system, sans-serif'
  })
};

// Font weights (matching web UI)
const fontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
};

// Font sizes (responsive for mobile)
const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16, // Base font size
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
  '8xl': 96,
  '9xl': 128,
};

// Line heights (relative to font size)
const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

// Letter spacing
const letterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
  widest: 1,
};

// Typography variants (matching web UI hierarchy)
export const typography = {
  // Display headings (for hero sections)
  display: {
    '2xl': {
      fontFamily: fontFamily.black,
      fontWeight: fontWeights.black,
      fontSize: fontSizes['6xl'], // 60px
      lineHeight: lineHeights.tight * fontSizes['6xl'],
      letterSpacing: letterSpacing.tight,
    },
    xl: {
      fontFamily: fontFamily.extraBold,
      fontWeight: fontWeights.extraBold,
      fontSize: fontSizes['5xl'], // 48px
      lineHeight: lineHeights.tight * fontSizes['5xl'],
      letterSpacing: letterSpacing.tight,
    },
    lg: {
      fontFamily: fontFamily.bold,
      fontWeight: fontWeights.bold,
      fontSize: fontSizes['4xl'], // 36px
      lineHeight: lineHeights.snug * fontSizes['4xl'],
      letterSpacing: letterSpacing.normal,
    },
  },

  // Regular headings
  heading: {
    h1: {
      fontFamily: fontFamily.bold,
      fontWeight: fontWeights.bold,
      fontSize: fontSizes['3xl'], // 30px
      lineHeight: lineHeights.snug * fontSizes['3xl'],
      letterSpacing: letterSpacing.normal,
    },
    h2: {
      fontFamily: fontFamily.bold,
      fontWeight: fontWeights.bold,
      fontSize: fontSizes['2xl'], // 24px
      lineHeight: lineHeights.snug * fontSizes['2xl'],
      letterSpacing: letterSpacing.normal,
    },
    h3: {
      fontFamily: fontFamily.semiBold,
      fontWeight: fontWeights.semiBold,
      fontSize: fontSizes.xl, // 20px
      lineHeight: lineHeights.normal * fontSizes.xl,
      letterSpacing: letterSpacing.normal,
    },
    h4: {
      fontFamily: fontFamily.semiBold,
      fontWeight: fontWeights.semiBold,
      fontSize: fontSizes.lg, // 18px
      lineHeight: lineHeights.normal * fontSizes.lg,
      letterSpacing: letterSpacing.normal,
    },
    h5: {
      fontFamily: fontFamily.medium,
      fontWeight: fontWeights.medium,
      fontSize: fontSizes.base, // 16px
      lineHeight: lineHeights.normal * fontSizes.base,
      letterSpacing: letterSpacing.normal,
    },
    h6: {
      fontFamily: fontFamily.medium,
      fontWeight: fontWeights.medium,
      fontSize: fontSizes.sm, // 14px
      lineHeight: lineHeights.normal * fontSizes.sm,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Body text
  body: {
    xl: {
      fontFamily: fontFamily.regular,
      fontWeight: fontWeights.regular,
      fontSize: fontSizes.xl, // 20px
      lineHeight: lineHeights.relaxed * fontSizes.xl,
      letterSpacing: letterSpacing.normal,
    },
    lg: {
      fontFamily: fontFamily.regular,
      fontWeight: fontWeights.regular,
      fontSize: fontSizes.lg, // 18px
      lineHeight: lineHeights.relaxed * fontSizes.lg,
      letterSpacing: letterSpacing.normal,
    },
    base: {
      fontFamily: fontFamily.regular,
      fontWeight: fontWeights.regular,
      fontSize: fontSizes.base, // 16px
      lineHeight: lineHeights.normal * fontSizes.base,
      letterSpacing: letterSpacing.normal,
    },
    sm: {
      fontFamily: fontFamily.regular,
      fontWeight: fontWeights.regular,
      fontSize: fontSizes.sm, // 14px
      lineHeight: lineHeights.normal * fontSizes.sm,
      letterSpacing: letterSpacing.normal,
    },
    xs: {
      fontFamily: fontFamily.regular,
      fontWeight: fontWeights.regular,
      fontSize: fontSizes.xs, // 12px
      lineHeight: lineHeights.normal * fontSizes.xs,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Labels and captions
  label: {
    lg: {
      fontFamily: fontFamily.medium,
      fontWeight: fontWeights.medium,
      fontSize: fontSizes.base, // 16px
      lineHeight: lineHeights.normal * fontSizes.base,
      letterSpacing: letterSpacing.normal,
    },
    base: {
      fontFamily: fontFamily.medium,
      fontWeight: fontWeights.medium,
      fontSize: fontSizes.sm, // 14px
      lineHeight: lineHeights.normal * fontSizes.sm,
      letterSpacing: letterSpacing.normal,
    },
    sm: {
      fontFamily: fontFamily.medium,
      fontWeight: fontWeights.medium,
      fontSize: fontSizes.xs, // 12px
      lineHeight: lineHeights.normal * fontSizes.xs,
      letterSpacing: letterSpacing.wide,
    },
  },

  // Button text
  button: {
    lg: {
      fontFamily: fontFamily.semiBold,
      fontWeight: fontWeights.semiBold,
      fontSize: fontSizes.lg, // 18px
      lineHeight: lineHeights.normal * fontSizes.lg,
      letterSpacing: letterSpacing.normal,
    },
    base: {
      fontFamily: fontFamily.semiBold,
      fontWeight: fontWeights.semiBold,
      fontSize: fontSizes.base, // 16px
      lineHeight: lineHeights.normal * fontSizes.base,
      letterSpacing: letterSpacing.normal,
    },
    sm: {
      fontFamily: fontFamily.medium,
      fontWeight: fontWeights.medium,
      fontSize: fontSizes.sm, // 14px
      lineHeight: lineHeights.normal * fontSizes.sm,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Caption and small text
  caption: {
    base: {
      fontFamily: fontFamily.regular,
      fontWeight: fontWeights.regular,
      fontSize: fontSizes.sm, // 14px
      lineHeight: lineHeights.normal * fontSizes.sm,
      letterSpacing: letterSpacing.normal,
    },
    sm: {
      fontFamily: fontFamily.regular,
      fontWeight: fontWeights.regular,
      fontSize: fontSizes.xs, // 12px
      lineHeight: lineHeights.normal * fontSizes.xs,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Numeric values and prices
  numeric: {
    lg: {
      fontFamily: fontFamily.bold,
      fontWeight: fontWeights.bold,
      fontSize: fontSizes.xl, // 20px
      lineHeight: lineHeights.normal * fontSizes.xl,
      letterSpacing: letterSpacing.normal,
    },
    base: {
      fontFamily: fontFamily.semiBold,
      fontWeight: fontWeights.semiBold,
      fontSize: fontSizes.base, // 16px
      lineHeight: lineHeights.normal * fontSizes.base,
      letterSpacing: letterSpacing.normal,
    },
    sm: {
      fontFamily: fontFamily.medium,
      fontWeight: fontWeights.medium,
      fontSize: fontSizes.sm, // 14px
      lineHeight: lineHeights.normal * fontSizes.sm,
      letterSpacing: letterSpacing.normal,
    },
  },
} as const;

// Export individual parts for flexibility
export { fontFamily, fontWeights, fontSizes, lineHeights, letterSpacing };

export type Typography = typeof typography;
export type TypographyVariant = keyof Typography;