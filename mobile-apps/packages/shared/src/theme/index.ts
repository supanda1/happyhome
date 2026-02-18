/**
 * Happy Homes Design System - Main Theme
 * 
 * Complete theme system that matches the web UI exactly.
 * Provides consistent styling across both customer and engineer apps.
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing, semanticSpacing, borderRadius, sizing, zIndex } from './spacing';
import { shadows, gradients, glassMorphism, animations, blur } from './effects';

// Main theme object
export const theme = {
  colors,
  typography,
  spacing,
  semanticSpacing,
  borderRadius,
  sizing,
  zIndex,
  shadows,
  gradients,
  glassMorphism,
  animations,
  blur,

  // Theme variants
  mode: 'light' as const, // For future dark mode support

  // Breakpoints for responsive design
  breakpoints: {
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
  },

  // Component-specific defaults
  components: {
    Button: {
      borderRadius: borderRadius.lg,
      minHeight: sizing.button.md,
      shadow: shadows.sm,
    },
    
    Card: {
      borderRadius: borderRadius.xl,
      shadow: shadows.md,
      backgroundColor: colors.surface.primary,
    },

    Input: {
      borderRadius: borderRadius.md,
      minHeight: sizing.input.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },

    Modal: {
      borderRadius: borderRadius['2xl'],
      backgroundColor: colors.surface.primary,
      shadow: shadows['2xl'],
    },

    Header: {
      height: sizing.header.height,
      backgroundColor: colors.surface.primary,
      shadow: shadows.sm,
    },

    TabBar: {
      height: sizing.tabBar.height,
      backgroundColor: colors.surface.primary,
      shadow: shadows.md,
    },
  },
} as const;

// Light theme (current default)
export const lightTheme = {
  ...theme,
  mode: 'light' as const,
};

// Dark theme configuration (for future implementation)
export const darkTheme = {
  ...theme,
  mode: 'dark' as const,
  colors: {
    ...colors,
    // Override colors for dark mode
    text: {
      primary: colors.white,
      secondary: colors.secondary[300],
      muted: colors.secondary[400],
      disabled: colors.secondary[600],
      inverse: colors.secondary[900],
    },
    background: {
      primary: colors.secondary[900],
      secondary: colors.secondary[800],
      tertiary: colors.secondary[700],
      dark: colors.white,
      overlay: 'rgba(255, 255, 255, 0.1)',
    },
    surface: {
      primary: colors.secondary[800],
      secondary: colors.secondary[700],
      elevated: colors.secondary[700],
      overlay: 'rgba(0, 0, 0, 0.9)',
    },
    border: {
      light: colors.secondary[700],
      medium: colors.secondary[600],
      dark: colors.secondary[500],
    },
  },
};

// Theme context type
export interface ThemeContextType {
  theme: typeof theme;
  isDark: boolean;
  toggleTheme: () => void;
}

// Brand constants (matching web UI exactly)
export const brand = {
  name: 'Happy Homes',
  tagline: 'Professional Home Services At Your Doorstep',
  heroMessage: 'Get reliable, professional services for your home. From plumbing to cleaning, we connect you with trusted professionals in your area.',
  
  // Service categories (matching web content exactly)
  categories: [
    {
      id: 'plumbing',
      name: 'Plumbing',
      description: 'Professional plumbing services for your home',
      icon: '🔧',
      gradient: gradients.primary.medium,
    },
    {
      id: 'electrical',
      name: 'Electrical',
      description: 'Safe and reliable electrical solutions',
      icon: '⚡',
      gradient: gradients.warning,
    },
    {
      id: 'cleaning',
      name: 'Cleaning',
      description: 'Professional cleaning services',
      icon: '✨',
      gradient: gradients.success,
    },
    {
      id: 'civil-work',
      name: 'Civil Work',
      description: 'Construction and renovation services',
      icon: '🏗️',
      gradient: gradients.primary.dark,
    },
    {
      id: 'personal-care',
      name: 'Personal Care',
      description: 'Beauty and wellness services at home',
      icon: '💆',
      gradient: gradients.danger,
    },
    {
      id: 'finance-insurance',
      name: 'Finance & Insurance',
      description: 'Financial and documentation services',
      icon: '📋',
      gradient: gradients.primary.light,
    },
  ],

  // Trust badges (matching web content exactly)
  features: [
    {
      id: 'expert-professionals',
      title: 'Expert Professionals',
      description: 'Verified & experienced',
      icon: '🔧',
    },
    {
      id: 'same-day-service',
      title: 'Same Day Service',
      description: 'Quick & efficient',
      icon: '⚡',
    },
    {
      id: 'insured-bonded',
      title: 'Insured & Bonded',
      description: 'Safe & secure',
      icon: '🛡️',
    },
    {
      id: '100-guarantee',
      title: '100% Guarantee',
      description: 'Satisfaction assured',
      icon: '💯',
    },
  ],

  // Contact information
  contact: {
    phone: '+91-8000000000',
    email: 'support@happyhomes.com',
    website: 'https://happyhomes.com',
    address: 'Professional Home Services, India',
  },

  // Social media (placeholders)
  social: {
    facebook: 'https://facebook.com/happyhomes',
    instagram: 'https://instagram.com/happyhomes',
    twitter: 'https://twitter.com/happyhomes',
    whatsapp: 'https://wa.me/918000000000',
  },
} as const;

// Export individual theme parts
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './effects';

// Export the complete theme as default
export default theme;

// Type definitions
export type Theme = typeof theme;
export type ThemeMode = 'light' | 'dark';
export type Brand = typeof brand;