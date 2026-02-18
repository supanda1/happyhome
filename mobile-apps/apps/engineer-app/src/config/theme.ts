/**
 * Engineer App Theme
 * 
 * Uses the Happy Homes design system for consistent branding
 * while maintaining engineer-specific customizations.
 */

import { theme as baseTheme } from '@household-services/shared/theme';

// Engineer app specific theme customizations
export const engineerTheme = {
  ...baseTheme,
  
  // Engineer-specific color variations
  colors: {
    ...baseTheme.colors,
    
    // Engineer role-specific colors
    engineer: {
      primary: baseTheme.colors.success[500],   // Green for availability/active
      secondary: baseTheme.colors.warning[500], // Orange for pending jobs
      accent: baseTheme.colors.primary[500],    // Brand orange for highlights
    },
    
    // Job status colors
    jobStatus: {
      pending: baseTheme.colors.warning[500],
      accepted: baseTheme.colors.primary[500],
      inProgress: baseTheme.colors.success[500],
      completed: baseTheme.colors.success[600],
      cancelled: baseTheme.colors.danger[500],
    },
    
    // Earnings and financial colors
    earnings: {
      positive: baseTheme.colors.success[500],
      neutral: baseTheme.colors.secondary[500],
      pending: baseTheme.colors.warning[500],
    },
  },
  
  // Engineer-specific component overrides
  components: {
    ...baseTheme.components,
    
    JobCard: {
      borderRadius: baseTheme.borderRadius.lg,
      shadow: baseTheme.shadows.md,
      backgroundColor: baseTheme.colors.surface.primary,
      padding: baseTheme.semanticSpacing.cardPadding.md,
    },
    
    StatusIndicator: {
      size: 12,
      borderRadius: 6,
    },
    
    EarningsCard: {
      borderRadius: baseTheme.borderRadius.xl,
      shadow: baseTheme.shadows.lg,
      backgroundColor: baseTheme.colors.success[50],
      borderColor: baseTheme.colors.success[200],
    },
  },
};

// Legacy theme for React Native Paper compatibility
export const theme = {
  colors: {
    primary: engineerTheme.colors.primary[500],
    accent: engineerTheme.colors.engineer.primary,
    surface: engineerTheme.colors.surface.primary,
    background: engineerTheme.colors.background.primary,
    text: engineerTheme.colors.text.primary,
    disabled: engineerTheme.colors.text.disabled,
    placeholder: engineerTheme.colors.text.muted,
    backdrop: engineerTheme.colors.background.overlay,
    error: engineerTheme.colors.danger[500],
    success: engineerTheme.colors.success[500],
    warning: engineerTheme.colors.warning[500],
    info: engineerTheme.colors.primary[500],
  },
  
  // Maintain existing structure for compatibility
  roundness: engineerTheme.borderRadius.md,
  fonts: {
    regular: {
      fontFamily: 'Inter-Regular',
      fontWeight: 'normal' as const,
    },
    medium: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'Inter-Light',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'Inter-Light',
      fontWeight: '100' as const,
    },
  },
};

export default engineerTheme;