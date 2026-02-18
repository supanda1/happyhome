/**
 * Happy Homes Badge Component
 * 
 * Badge component matching web UI styling for status indicators,
 * categories, and other labeling needs.
 */

import React from 'react';
import {
  View,
  Text,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '@happyhomes/shared';

export interface BadgeProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Badge variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'gradient';
  
  /** Badge size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  
  /** Badge content */
  children: React.ReactNode;
  
  /** Enable press functionality */
  pressable?: boolean;
  
  /** Show dot indicator */
  showDot?: boolean;
  
  /** Custom dot color */
  dotColor?: string;
  
  /** Custom style override */
  style?: ViewStyle;
  
  /** Custom text style */
  textStyle?: TextStyle;
  
  /** Left icon */
  leftIcon?: React.ReactNode;
  
  /** Right icon */
  rightIcon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  pressable = false,
  showDot = false,
  dotColor,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  disabled = false,
  onPress,
  ...props
}) => {
  const getBadgeStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: getBorderRadius(),
      paddingHorizontal: getHorizontalPadding(),
      paddingVertical: getVerticalPadding(),
      minHeight: getMinHeight(),
    };

    switch (variant) {
      case 'default':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.secondary[100],
          borderWidth: 1,
          borderColor: theme.colors.border.light,
        };

      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary[500],
        };

      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.secondary[500],
        };

      case 'success':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.success[500],
        };

      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.warning[500],
        };

      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.danger[500],
        };

      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.primary[500],
        };

      case 'gradient':
        return baseStyle; // Handled by gradient wrapper

      default:
        return baseStyle;
    }
  };

  const getTextStyles = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      ...getTypographyForSize(),
      fontWeight: '500',
      textAlign: 'center',
    };

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'success':
      case 'warning':
      case 'danger':
        return {
          ...baseTextStyle,
          color: theme.colors.white,
        };

      case 'default':
        return {
          ...baseTextStyle,
          color: theme.colors.text.primary,
        };

      case 'outline':
        return {
          ...baseTextStyle,
          color: theme.colors.primary[600],
        };

      case 'gradient':
        return {
          ...baseTextStyle,
          color: theme.colors.white,
        };

      default:
        return baseTextStyle;
    }
  };

  const getBorderRadius = (): number => {
    switch (size) {
      case 'xs': return theme.borderRadius.sm;
      case 'sm': return theme.borderRadius.md;
      case 'md': return theme.borderRadius.lg;
      case 'lg': return theme.borderRadius.xl;
      default: return theme.borderRadius.md;
    }
  };

  const getHorizontalPadding = (): number => {
    switch (size) {
      case 'xs': return theme.spacing[2];
      case 'sm': return theme.spacing[3];
      case 'md': return theme.spacing[4];
      case 'lg': return theme.spacing[5];
      default: return theme.spacing[3];
    }
  };

  const getVerticalPadding = (): number => {
    switch (size) {
      case 'xs': return theme.spacing[1];
      case 'sm': return theme.spacing[1.5];
      case 'md': return theme.spacing[2];
      case 'lg': return theme.spacing[2.5];
      default: return theme.spacing[1.5];
    }
  };

  const getMinHeight = (): number => {
    switch (size) {
      case 'xs': return 20;
      case 'sm': return 24;
      case 'md': return 28;
      case 'lg': return 32;
      default: return 24;
    }
  };

  const getTypographyForSize = () => {
    switch (size) {
      case 'xs': return theme.typography.caption.sm;
      case 'sm': return theme.typography.label.sm;
      case 'md': return theme.typography.label.base;
      case 'lg': return theme.typography.label.lg;
      default: return theme.typography.label.base;
    }
  };

  const getDotSize = (): number => {
    switch (size) {
      case 'xs': return 4;
      case 'sm': return 6;
      case 'md': return 8;
      case 'lg': return 10;
      default: return 6;
    }
  };

  const badgeStyles = getBadgeStyles();
  const textStyles = getTextStyles();

  const renderBadgeContent = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {/* Dot Indicator */}
      {showDot && (
        <View
          style={{
            width: getDotSize(),
            height: getDotSize(),
            borderRadius: getDotSize() / 2,
            backgroundColor: dotColor || theme.colors.success[500],
            marginRight: leftIcon ? theme.spacing[1] : theme.spacing[2],
          }}
        />
      )}

      {/* Left Icon */}
      {leftIcon && (
        <View style={{ marginRight: theme.spacing[1] }}>
          {leftIcon}
        </View>
      )}

      {/* Badge Text */}
      <Text style={[textStyles, textStyle]} numberOfLines={1}>
        {children}
      </Text>

      {/* Right Icon */}
      {rightIcon && (
        <View style={{ marginLeft: theme.spacing[1] }}>
          {rightIcon}
        </View>
      )}
    </View>
  );

  // Gradient badge
  if (variant === 'gradient') {
    const Wrapper = pressable && onPress ? TouchableOpacity : View;
    
    return (
      <Wrapper
        disabled={disabled}
        activeOpacity={0.8}
        onPress={onPress}
        style={[{ opacity: disabled ? 0.6 : 1 }, style]}
        {...(pressable ? props : {})}
      >
        <LinearGradient
          colors={[theme.colors.primary[400], theme.colors.primary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={badgeStyles}
        >
          {renderBadgeContent()}
        </LinearGradient>
      </Wrapper>
    );
  }

  // Pressable badge
  if (pressable && onPress) {
    return (
      <TouchableOpacity
        disabled={disabled}
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          badgeStyles,
          { opacity: disabled ? 0.6 : 1 },
          style,
        ]}
        {...props}
      >
        {renderBadgeContent()}
      </TouchableOpacity>
    );
  }

  // Static badge
  return (
    <View
      style={[
        badgeStyles,
        { opacity: disabled ? 0.6 : 1 },
        style,
      ]}
    >
      {renderBadgeContent()}
    </View>
  );
};

// Status Badge (specialized component)
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  /** Status type */
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'verified' | 'unverified';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  const getVariantForStatus = (): BadgeProps['variant'] => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'verified':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'inactive':
      case 'unverified':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'verified': return 'Verified';
      case 'unverified': return 'Unverified';
      default: return status;
    }
  };

  return (
    <Badge
      variant={getVariantForStatus()}
      showDot
      {...props}
    >
      {getStatusText()}
    </Badge>
  );
};

// Rating Badge (specialized component)
export interface RatingBadgeProps extends Omit<BadgeProps, 'children'> {
  /** Rating value */
  rating: number;
  
  /** Maximum rating */
  maxRating?: number;
  
  /** Show star icon */
  showStar?: boolean;
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  maxRating = 5,
  showStar = true,
  ...props
}) => {
  const getVariantForRating = (): BadgeProps['variant'] => {
    if (rating >= 4.5) return 'success';
    if (rating >= 3.5) return 'warning';
    if (rating >= 2.5) return 'primary';
    return 'danger';
  };

  return (
    <Badge
      variant={getVariantForRating()}
      leftIcon={showStar ? (
        <Text style={{ color: theme.colors.white, fontSize: 12 }}>★</Text>
      ) : undefined}
      {...props}
    >
      {rating.toFixed(1)}
    </Badge>
  );
};

export default Badge;