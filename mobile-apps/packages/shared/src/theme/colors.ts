/**
 * Happy Homes Design System - Color Palette
 * 
 * This file contains the exact color palette from the web UI
 * to ensure perfect consistency across platforms.
 */

export const colors = {
  // Primary Orange Palette (from web UI)
  primary: {
    50: '#fff7ed',
    100: '#ffedd5', 
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Main primary color
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407'
  },

  // Secondary Gray Palette (from web UI)  
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  },

  // Status Colors (from web UI)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main success color
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main warning color
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },

  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main danger color
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },

  // Neutral Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Gray Scale (using secondary palette)
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },

  // Gradient Colors (from web hero sections)
  gradients: {
    hero: ['#f97316', '#9333ea', '#2563eb'], // orange-500 -> purple-600 -> blue-600
    primaryLight: ['#fed7aa', '#f97316'], // primary-200 -> primary-500
    success: ['#bbf7d0', '#22c55e'], // success-200 -> success-500
    warning: ['#fde68a', '#f59e0b'], // warning-200 -> warning-500
    danger: ['#fecaca', '#ef4444'], // danger-200 -> danger-500
  },

  // Theme-specific colors
  text: {
    primary: '#0f172a', // secondary-900
    secondary: '#475569', // secondary-600
    muted: '#94a3b8', // secondary-400
    disabled: '#cbd5e1', // secondary-300
    inverse: '#ffffff',
  },

  background: {
    primary: '#ffffff',
    secondary: '#f8fafc', // secondary-50
    tertiary: '#f1f5f9', // secondary-100
    dark: '#0f172a', // secondary-900
    overlay: 'rgba(15, 23, 42, 0.5)', // secondary-900 with opacity
  },

  border: {
    light: '#e2e8f0', // secondary-200
    medium: '#cbd5e1', // secondary-300
    dark: '#94a3b8', // secondary-400
  },

  surface: {
    primary: '#ffffff',
    secondary: '#f8fafc', // secondary-50
    elevated: '#ffffff',
    overlay: 'rgba(255, 255, 255, 0.9)',
  },

  // Glass morphism colors (from web UI)
  glass: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.2)',
    backdrop: 'rgba(15, 23, 42, 0.8)',
  },

  // Shadow colors
  shadow: {
    light: 'rgba(15, 23, 42, 0.04)',
    medium: 'rgba(15, 23, 42, 0.1)',
    dark: 'rgba(15, 23, 42, 0.25)',
  }
} as const;

export type Colors = typeof colors;
export type ColorKey = keyof Colors;