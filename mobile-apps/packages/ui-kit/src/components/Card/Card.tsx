/**
 * Happy Homes Card Component
 * 
 * Modern card design matching the web UI with press effects
 * for mobile interaction. Supports various card types and layouts.
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ViewStyle,
  TouchableOpacityProps,
  Animated,
  Text,
} from 'react-native';
import { theme } from '@happyhomes/shared';

export interface CardProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Card variant */
  variant?: 'default' | 'elevated' | 'outlined' | 'flat' | 'glass';
  
  /** Card padding size */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  
  /** Enable press animations */
  animated?: boolean;
  
  /** Custom style override */
  style?: ViewStyle;
  
  /** Card content */
  children: React.ReactNode;
  
  /** Enable press effect */
  pressable?: boolean;
  
  /** Custom border radius */
  borderRadius?: keyof typeof theme.borderRadius;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  animated = true,
  style,
  children,
  pressable = false,
  borderRadius = 'xl',
  disabled = false,
  onPress,
  ...props
}) => {
  const [scaleAnimation] = useState(new Animated.Value(1));

  // Get card styles based on variant
  const getCardStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius[borderRadius],
      padding: getPaddingForSize(),
      overflow: 'hidden',
    };

    switch (variant) {
      case 'default':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface.primary,
          ...theme.shadows.md,
        };

      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface.primary,
          ...theme.shadows.lg,
        };

      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface.primary,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          ...theme.shadows.xs,
        };

      case 'flat':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.background.secondary,
          ...theme.shadows.none,
        };

      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.glass.background,
          borderWidth: 1,
          borderColor: theme.colors.glass.border,
          // Note: For actual glass morphism, wrap with BlurView
        };

      default:
        return baseStyle;
    }
  };

  const getPaddingForSize = (): number => {
    switch (padding) {
      case 'none': return 0;
      case 'xs': return theme.semanticSpacing.cardPadding.xs;
      case 'sm': return theme.semanticSpacing.cardPadding.sm;
      case 'md': return theme.semanticSpacing.cardPadding.md;
      case 'lg': return theme.semanticSpacing.cardPadding.lg;
      default: return theme.semanticSpacing.cardPadding.md;
    }
  };

  const handlePressIn = () => {
    if (animated && pressable && !disabled) {
      Animated.spring(scaleAnimation, {
        toValue: theme.animations.transform.scale.active,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (animated && pressable && !disabled) {
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const cardStyles = getCardStyles();

  // If pressable, wrap in TouchableOpacity
  if (pressable || onPress) {
    return (
      <TouchableOpacity
        disabled={disabled}
        activeOpacity={0.95}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[{ opacity: disabled ? 0.6 : 1 }, style]}
        {...props}
      >
        <Animated.View
          style={[
            cardStyles,
            animated && { transform: [{ scale: scaleAnimation }] },
          ]}
        >
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // Static card
  return (
    <View
      style={[
        cardStyles,
        { opacity: disabled ? 0.6 : 1 },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Service Category Card (matching web layout)
export interface ServiceCategoryCardProps extends Omit<CardProps, 'children'> {
  /** Category data */
  category: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    imageUrl?: string;
  };
  
  /** Show category description */
  showDescription?: boolean;
}

export const ServiceCategoryCard: React.FC<ServiceCategoryCardProps> = ({
  category,
  showDescription = true,
  style,
  ...props
}) => {
  return (
    <Card
      variant="elevated"
      padding="md"
      pressable
      animated
      style={[
        {
          width: theme.sizing.categoryCard.width,
          height: theme.sizing.categoryCard.height,
          margin: theme.spacing[2],
        },
        style,
      ]}
      {...props}
    >
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        {/* Category Icon/Image */}
        <View
          style={{
            height: theme.sizing.categoryCard.imageHeight,
            backgroundColor: theme.colors.primary[50],
            borderRadius: theme.borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing[3],
          }}
        >
          {category.icon && (
            <View style={{ fontSize: 32 }}>
              {/* This would be replaced with actual icon component */}
            </View>
          )}
        </View>

        {/* Category Info */}
        <View>
          <Text
            style={[
              theme.typography.heading.h6,
              { 
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[1],
                textAlign: 'center',
              },
            ]}
          >
            {category.name}
          </Text>
          
          {showDescription && category.description && (
            <Text
              style={[
                theme.typography.body.xs,
                { 
                  color: theme.colors.text.secondary,
                  textAlign: 'center',
                },
              ]}
              numberOfLines={2}
            >
              {category.description}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
};

// Service Card (matching web layout)
export interface ServiceCardProps extends Omit<CardProps, 'children'> {
  /** Service data */
  service: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    rating?: number;
    imageUrl?: string;
    category?: string;
  };
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  style,
  ...props
}) => {
  return (
    <Card
      variant="elevated"
      padding="none"
      pressable
      animated
      style={[
        {
          width: theme.sizing.serviceCard.width,
          height: theme.sizing.serviceCard.height,
          margin: theme.spacing[2],
        },
        style,
      ]}
      {...props}
    >
      {/* Service Image */}
      <View
        style={{
          height: theme.sizing.serviceCard.imageHeight,
          backgroundColor: theme.colors.secondary[100],
          borderTopLeftRadius: theme.borderRadius.xl,
          borderTopRightRadius: theme.borderRadius.xl,
        }}
      >
        {/* This would contain the actual image component */}
      </View>

      {/* Service Info */}
      <View style={{ padding: theme.semanticSpacing.cardPadding.md, flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View>
            <Text
              style={[
                theme.typography.heading.h6,
                { 
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[1],
                },
              ]}
              numberOfLines={1}
            >
              {service.name}
            </Text>
            
            {service.description && (
              <Text
                style={[
                  theme.typography.body.sm,
                  { color: theme.colors.text.secondary },
                ]}
                numberOfLines={2}
              >
                {service.description}
              </Text>
            )}
          </View>

          {/* Price and Rating */}
          <View 
            style={{ 
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: theme.spacing[3],
            }}
          >
            {service.price && (
              <Text
                style={[
                  theme.typography.numeric.base,
                  { color: theme.colors.primary[600] },
                ]}
              >
                ₹{service.price}
              </Text>
            )}
            
            {service.rating && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={[
                    theme.typography.body.sm,
                    { color: theme.colors.warning[600] },
                  ]}
                >
                  ★ {service.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
};

export default Card;