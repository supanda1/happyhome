/**
 * Happy Homes Loading Component
 * 
 * Loading components matching web UI with shimmer effects,
 * spinners, and skeleton screens for mobile.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Animated,
  ViewStyle,
  Dimensions,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '@happyhomes/shared';

const { width: screenWidth } = Dimensions.get('window');

export interface LoadingProps {
  /** Loading variant */
  variant?: 'spinner' | 'dots' | 'shimmer' | 'skeleton';
  
  /** Loading size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Loading color */
  color?: string;
  
  /** Show loading text */
  text?: string;
  
  /** Custom container style */
  style?: ViewStyle;
  
  /** Full screen overlay */
  overlay?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  color = theme.colors.primary[500],
  text,
  style,
  overlay = false,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant === 'dots') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [variant, animatedValue]);

  const getSpinnerSize = (): 'small' | 'large' => {
    switch (size) {
      case 'xs':
      case 'sm':
        return 'small';
      case 'md':
      case 'lg':
      case 'xl':
        return 'large';
      default:
        return 'small';
    }
  };

  const getContainerStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (overlay) {
      return {
        ...baseStyle,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.background.overlay,
        zIndex: theme.zIndex.overlay,
      };
    }

    return baseStyle;
  };

  const renderSpinner = () => (
    <View style={getContainerStyles()}>
      <ActivityIndicator size={getSpinnerSize()} color={color} />
      {text && (
        <View style={{ marginTop: theme.spacing[3] }}>
          <Text style={[theme.typography.body.sm, { color: theme.colors.text.secondary }]}>
            {text}
          </Text>
        </View>
      )}
    </View>
  );

  const renderDots = () => {
    const dotSize = size === 'xs' ? 4 : size === 'sm' ? 6 : size === 'md' ? 8 : size === 'lg' ? 10 : 12;
    
    return (
      <View style={[getContainerStyles(), { flexDirection: 'row' }]}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
              marginHorizontal: theme.spacing[1],
              opacity: animatedValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: index === 0 ? [0.3, 1, 0.3] : index === 1 ? [0.3, 0.3, 1] : [1, 0.3, 0.3],
              }),
            }}
          />
        ))}
      </View>
    );
  };

  const renderShimmer = () => {
    return <ShimmerEffect style={style} />;
  };

  const renderSkeleton = () => {
    return <SkeletonLoader style={style} />;
  };

  switch (variant) {
    case 'spinner':
      return renderSpinner();
    case 'dots':
      return renderDots();
    case 'shimmer':
      return renderShimmer();
    case 'skeleton':
      return renderSkeleton();
    default:
      return renderSpinner();
  }
};

// Shimmer Effect Component
export interface ShimmerEffectProps {
  /** Custom style */
  style?: ViewStyle;
  
  /** Shimmer width */
  width?: number;
  
  /** Shimmer height */
  height?: number;
}

export const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  style,
  width = screenWidth - 32,
  height = 20,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: theme.colors.secondary[100],
          borderRadius: theme.borderRadius.md,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          transform: [
            {
              translateX: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-width, width],
              }),
            },
          ],
        }}
      >
        <LinearGradient
          colors={[
            'transparent',
            theme.colors.white,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

// Skeleton Loader Component (for card layouts)
export interface SkeletonLoaderProps {
  /** Custom style */
  style?: ViewStyle;
  
  /** Skeleton variant */
  variant?: 'card' | 'list' | 'profile' | 'text';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  style,
  variant = 'card',
}) => {
  const renderCardSkeleton = () => (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface.primary,
          borderRadius: theme.borderRadius.xl,
          padding: theme.semanticSpacing.cardPadding.md,
          ...theme.shadows.md,
        },
        style,
      ]}
    >
      {/* Image placeholder */}
      <ShimmerEffect
        width={screenWidth - 64}
        height={120}
        style={{ marginBottom: theme.spacing[3] }}
      />
      
      {/* Title placeholder */}
      <ShimmerEffect
        width={screenWidth - 100}
        height={20}
        style={{ marginBottom: theme.spacing[2] }}
      />
      
      {/* Description placeholder */}
      <ShimmerEffect
        width={screenWidth - 120}
        height={16}
        style={{ marginBottom: theme.spacing[1] }}
      />
      
      <ShimmerEffect
        width={screenWidth - 140}
        height={16}
      />
    </View>
  );

  const renderListSkeleton = () => (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {/* Avatar */}
      <ShimmerEffect
        width={40}
        height={40}
        style={{ borderRadius: 20, marginRight: theme.spacing[3] }}
      />
      
      <View style={{ flex: 1 }}>
        {/* Title */}
        <ShimmerEffect
          width={150}
          height={16}
          style={{ marginBottom: theme.spacing[1] }}
        />
        
        {/* Subtitle */}
        <ShimmerEffect
          width={100}
          height={14}
        />
      </View>
    </View>
  );

  const renderProfileSkeleton = () => (
    <View style={[{ alignItems: 'center' }, style]}>
      {/* Profile image */}
      <ShimmerEffect
        width={80}
        height={80}
        style={{ borderRadius: 40, marginBottom: theme.spacing[3] }}
      />
      
      {/* Name */}
      <ShimmerEffect
        width={120}
        height={20}
        style={{ marginBottom: theme.spacing[1] }}
      />
      
      {/* Email */}
      <ShimmerEffect
        width={160}
        height={16}
      />
    </View>
  );

  const renderTextSkeleton = () => (
    <View style={style}>
      <ShimmerEffect
        width={screenWidth - 64}
        height={16}
        style={{ marginBottom: theme.spacing[2] }}
      />
      <ShimmerEffect
        width={screenWidth - 100}
        height={16}
        style={{ marginBottom: theme.spacing[2] }}
      />
      <ShimmerEffect
        width={screenWidth - 80}
        height={16}
      />
    </View>
  );

  switch (variant) {
    case 'card':
      return renderCardSkeleton();
    case 'list':
      return renderListSkeleton();
    case 'profile':
      return renderProfileSkeleton();
    case 'text':
      return renderTextSkeleton();
    default:
      return renderCardSkeleton();
  }
};

// Full Screen Loading Component
export interface FullScreenLoadingProps {
  /** Loading message */
  message?: string;
  
  /** Show company logo */
  showLogo?: boolean;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  message = 'Loading...',
  showLogo = true,
}) => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background.primary,
        paddingHorizontal: theme.spacing[8],
      }}
    >
      {showLogo && (
        <View
          style={{
            width: 80,
            height: 80,
            backgroundColor: theme.colors.primary[100],
            borderRadius: theme.borderRadius.xl,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing[6],
          }}
        >
          {/* Logo placeholder - replace with actual logo */}
          <Text style={{ fontSize: 32, color: theme.colors.primary[600] }}>🏠</Text>
        </View>
      )}
      
      <Loading variant="spinner" size="lg" />
      
      <View style={{ marginTop: theme.spacing[4] }}>
        <Text
          style={[
            theme.typography.body.base,
            { color: theme.colors.text.secondary, textAlign: 'center' },
          ]}
        >
          {message}
        </Text>
      </View>
    </View>
  );
};

export default Loading;