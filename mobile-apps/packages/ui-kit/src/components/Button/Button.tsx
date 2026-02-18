/**
 * Happy Homes Button Component
 * 
 * Matches the exact styling and variants from the web UI.
 * Supports all button types: Primary, Secondary, Outline, Accent, Danger, Ghost
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '@happyhomes/shared';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Button variant matching web UI */
  variant?: 'primary' | 'secondary' | 'outline' | 'accent' | 'danger' | 'ghost';
  
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Button text */
  children: React.ReactNode;
  
  /** Loading state */
  loading?: boolean;
  
  /** Icon before text */
  startIcon?: React.ReactNode;
  
  /** Icon after text */
  endIcon?: React.ReactNode;
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Custom style override */
  style?: ViewStyle;
  
  /** Custom text style */
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  startIcon,
  endIcon,
  fullWidth = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  // Get button styles based on variant and size
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      minHeight: getSizeHeight(),
      paddingHorizontal: getSizePadding(),
      ...theme.shadows.sm,
      opacity: disabled || loading ? 0.6 : 1,
    };

    if (fullWidth) {
      baseStyle.alignSelf = 'stretch';
    }

    // Variant-specific styles
    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary[500],
          // Primary uses gradient in web, we'll simulate with solid color
          // and enhanced shadow for depth
          ...theme.shadows.primary,
        };

      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.white,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
        };

      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: theme.colors.primary[500],
          ...theme.shadows.none,
        };

      case 'accent':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.success[500],
          ...theme.shadows.success,
        };

      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.danger[500],
          ...theme.shadows.danger,
        };

      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          ...theme.shadows.none,
        };

      default:
        return baseStyle;
    }
  };

  const getTextStyles = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      ...getTypographyForSize(),
      textAlign: 'center',
    };

    // Variant-specific text colors
    switch (variant) {
      case 'primary':
      case 'accent':
      case 'danger':
        return {
          ...baseTextStyle,
          color: theme.colors.white,
        };

      case 'secondary':
        return {
          ...baseTextStyle,
          color: theme.colors.text.primary,
        };

      case 'outline':
        return {
          ...baseTextStyle,
          color: theme.colors.primary[600],
        };

      case 'ghost':
        return {
          ...baseTextStyle,
          color: theme.colors.primary[500],
        };

      default:
        return baseTextStyle;
    }
  };

  const getSizeHeight = (): number => {
    switch (size) {
      case 'xs': return theme.sizing.button.xs;
      case 'sm': return theme.sizing.button.sm;
      case 'md': return theme.sizing.button.md;
      case 'lg': return theme.sizing.button.lg;
      case 'xl': return theme.sizing.button.xl;
      default: return theme.sizing.button.md;
    }
  };

  const getSizePadding = (): number => {
    switch (size) {
      case 'xs': return theme.semanticSpacing.buttonPadding.xs.horizontal;
      case 'sm': return theme.semanticSpacing.buttonPadding.sm.horizontal;
      case 'md': return theme.semanticSpacing.buttonPadding.md.horizontal;
      case 'lg': return theme.semanticSpacing.buttonPadding.lg.horizontal;
      case 'xl': return theme.semanticSpacing.buttonPadding.lg.horizontal * 1.25;
      default: return theme.semanticSpacing.buttonPadding.md.horizontal;
    }
  };

  const getTypographyForSize = () => {
    switch (size) {
      case 'xs':
      case 'sm':
        return theme.typography.button.sm;
      case 'md':
        return theme.typography.button.base;
      case 'lg':
      case 'xl':
        return theme.typography.button.lg;
      default:
        return theme.typography.button.base;
    }
  };

  const getIconSize = (): number => {
    switch (size) {
      case 'xs': return theme.sizing.icon.xs;
      case 'sm': return theme.sizing.icon.sm;
      case 'md': return theme.sizing.icon.md;
      case 'lg': return theme.sizing.icon.lg;
      case 'xl': return theme.sizing.icon.xl;
      default: return theme.sizing.icon.md;
    }
  };

  const buttonStyles = getButtonStyles();
  const textStyles = getTextStyles();

  // Render primary button with gradient effect (enhanced version)
  if (variant === 'primary' && !disabled && !loading) {
    return (
      <TouchableOpacity
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[{ borderRadius: theme.borderRadius.lg }, style]}
        {...props}
      >
        <LinearGradient
          colors={[theme.colors.primary[400], theme.colors.primary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={buttonStyles}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {loading && (
              <ActivityIndicator
                size="small"
                color={theme.colors.white}
                style={{ marginRight: theme.spacing[2] }}
              />
            )}
            
            {startIcon && !loading && (
              <View style={{ marginRight: theme.spacing[2] }}>
                {startIcon}
              </View>
            )}
            
            <Text style={[textStyles, textStyle]} numberOfLines={1}>
              {children}
            </Text>
            
            {endIcon && !loading && (
              <View style={{ marginLeft: theme.spacing[2] }}>
                {endIcon}
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Standard button implementation
  return (
    <TouchableOpacity
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[buttonStyles, style]}
      {...props}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'accent' || variant === 'danger' 
              ? theme.colors.white 
              : theme.colors.primary[500]
            }
            style={{ marginRight: theme.spacing[2] }}
          />
        )}
        
        {startIcon && !loading && (
          <View style={{ marginRight: theme.spacing[2] }}>
            {startIcon}
          </View>
        )}
        
        <Text style={[textStyles, textStyle]} numberOfLines={1}>
          {children}
        </Text>
        
        {endIcon && !loading && (
          <View style={{ marginLeft: theme.spacing[2] }}>
            {endIcon}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default Button;