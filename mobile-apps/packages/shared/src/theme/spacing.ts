/**
 * Happy Homes Design System - Spacing & Sizing
 * 
 * Consistent spacing and sizing tokens that match the web UI
 * while being optimized for mobile touch interfaces.
 */

// Base spacing unit (in pixels)
const baseUnit = 4;

// Spacing scale (matching Tailwind CSS scale from web)
export const spacing = {
  0: 0,
  px: 1,
  0.5: baseUnit * 0.5,  // 2px
  1: baseUnit * 1,      // 4px
  1.5: baseUnit * 1.5,  // 6px
  2: baseUnit * 2,      // 8px
  2.5: baseUnit * 2.5,  // 10px
  3: baseUnit * 3,      // 12px
  3.5: baseUnit * 3.5,  // 14px
  4: baseUnit * 4,      // 16px
  5: baseUnit * 5,      // 20px
  6: baseUnit * 6,      // 24px
  7: baseUnit * 7,      // 28px
  8: baseUnit * 8,      // 32px
  9: baseUnit * 9,      // 36px
  10: baseUnit * 10,    // 40px
  11: baseUnit * 11,    // 44px
  12: baseUnit * 12,    // 48px
  14: baseUnit * 14,    // 56px
  16: baseUnit * 16,    // 64px
  20: baseUnit * 20,    // 80px
  24: baseUnit * 24,    // 96px
  28: baseUnit * 28,    // 112px
  32: baseUnit * 32,    // 128px
  36: baseUnit * 36,    // 144px
  40: baseUnit * 40,    // 160px
  44: baseUnit * 44,    // 176px
  48: baseUnit * 48,    // 192px
  52: baseUnit * 52,    // 208px
  56: baseUnit * 56,    // 224px
  60: baseUnit * 60,    // 240px
  64: baseUnit * 64,    // 256px
  72: baseUnit * 72,    // 288px
  80: baseUnit * 80,    // 320px
  96: baseUnit * 96,    // 384px
} as const;

// Semantic spacing for common UI patterns
export const semanticSpacing = {
  // Touch targets (iOS Human Interface Guidelines)
  minTouchTarget: 44,
  
  // Container padding
  containerPadding: {
    xs: spacing[4],      // 16px
    sm: spacing[6],      // 24px
    md: spacing[8],      // 32px
    lg: spacing[12],     // 48px
    xl: spacing[16],     // 64px
  },

  // Card padding
  cardPadding: {
    xs: spacing[3],      // 12px
    sm: spacing[4],      // 16px
    md: spacing[6],      // 24px
    lg: spacing[8],      // 32px
  },

  // Component spacing
  componentSpacing: {
    xs: spacing[2],      // 8px
    sm: spacing[3],      // 12px
    md: spacing[4],      // 16px
    lg: spacing[6],      // 24px
    xl: spacing[8],      // 32px
  },

  // Section spacing
  sectionSpacing: {
    xs: spacing[8],      // 32px
    sm: spacing[12],     // 48px
    md: spacing[16],     // 64px
    lg: spacing[20],     // 80px
    xl: spacing[24],     // 96px
  },

  // Button padding
  buttonPadding: {
    xs: { vertical: spacing[1.5], horizontal: spacing[3] },     // 6px, 12px
    sm: { vertical: spacing[2], horizontal: spacing[4] },       // 8px, 16px
    md: { vertical: spacing[3], horizontal: spacing[6] },       // 12px, 24px
    lg: { vertical: spacing[4], horizontal: spacing[8] },       // 16px, 32px
  },

  // Input padding
  inputPadding: {
    xs: { vertical: spacing[2], horizontal: spacing[3] },       // 8px, 12px
    sm: { vertical: spacing[2.5], horizontal: spacing[3.5] },   // 10px, 14px
    md: { vertical: spacing[3], horizontal: spacing[4] },       // 12px, 16px
    lg: { vertical: spacing[4], horizontal: spacing[5] },       // 16px, 20px
  },

  // List item spacing
  listSpacing: {
    compact: spacing[2],    // 8px
    comfortable: spacing[4], // 16px
    spacious: spacing[6],   // 24px
  },

  // Icon spacing
  iconSpacing: {
    xs: spacing[1],         // 4px
    sm: spacing[2],         // 8px
    md: spacing[3],         // 12px
    lg: spacing[4],         // 16px
  },

  // Navigation spacing
  navSpacing: {
    tabBar: spacing[2],     // 8px
    drawer: spacing[4],     // 16px
    header: spacing[4],     // 16px
  }
} as const;

// Border radius values (matching web UI)
export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
} as const;

// Common sizing for UI elements
export const sizing = {
  // Icon sizes
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
  },

  // Avatar sizes
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
    '3xl': 96,
  },

  // Button heights
  button: {
    xs: 32,
    sm: 40,
    md: 48,
    lg: 56,
    xl: 64,
  },

  // Input heights
  input: {
    xs: 32,
    sm: 40,
    md: 48,
    lg: 56,
  },

  // Card dimensions
  card: {
    minHeight: 120,
    maxWidth: 400,
  },

  // Modal dimensions
  modal: {
    maxWidth: 480,
    maxHeight: '90%' as const,
  },

  // Bottom sheet
  bottomSheet: {
    handleHeight: 4,
    handleWidth: 36,
  },

  // Tab bar
  tabBar: {
    height: 80,
    iconSize: 24,
  },

  // Header
  header: {
    height: 56,
    iconSize: 24,
  },

  // Service category card (matching web layout)
  categoryCard: {
    width: 160,
    height: 120,
    imageHeight: 80,
  },

  // Service card (matching web layout)
  serviceCard: {
    width: 300,
    height: 200,
    imageHeight: 120,
  },

  // Profile image
  profileImage: {
    xs: 32,
    sm: 40,
    md: 48,
    lg: 64,
    xl: 80,
  }
} as const;

// Z-index values for layering
export const zIndex = {
  hide: -1,
  auto: 'auto' as const,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Export types
export type Spacing = typeof spacing;
export type SemanticSpacing = typeof semanticSpacing;
export type BorderRadius = typeof borderRadius;
export type Sizing = typeof sizing;
export type ZIndex = typeof zIndex;