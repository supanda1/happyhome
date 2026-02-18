/**
 * Happy Homes Hero Section Component
 * 
 * Hero section layout matching the web UI's gradient background
 * and brand messaging for mobile apps.
 */

import React from 'react';
import {
  View,
  Text,
  ViewStyle,
  ScrollView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme, brand } from '@happyhomes/shared';
import { Button } from '../Button';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface HeroSectionProps {
  /** Custom title (overrides default brand tagline) */
  title?: string;
  
  /** Custom message (overrides default hero message) */
  message?: string;
  
  /** Primary CTA button text */
  primaryButtonText?: string;
  
  /** Secondary CTA button text */
  secondaryButtonText?: string;
  
  /** Primary button callback */
  onPrimaryPress?: () => void;
  
  /** Secondary button callback */
  onSecondaryPress?: () => void;
  
  /** Custom style override */
  style?: ViewStyle;
  
  /** Show scroll indicator */
  showScrollIndicator?: boolean;
  
  /** Minimum height */
  minHeight?: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title = brand.tagline,
  message = brand.heroMessage,
  primaryButtonText = 'Explore Services',
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
  style,
  showScrollIndicator = true,
  minHeight = screenHeight * 0.6,
}) => {
  return (
    <View style={[{ minHeight }, style]}>
      <LinearGradient
        colors={theme.gradients.hero.colors}
        start={theme.gradients.hero.start}
        end={theme.gradients.hero.end}
        locations={theme.gradients.hero.locations}
        style={{
          flex: 1,
          paddingHorizontal: theme.semanticSpacing.containerPadding.md,
          paddingVertical: theme.semanticSpacing.sectionSpacing.md,
          justifyContent: 'center',
        }}
      >
        <View style={{ alignItems: 'center', maxWidth: screenWidth - 64, alignSelf: 'center' }}>
          {/* Company Logo/Icon */}
          <View
            style={{
              width: 80,
              height: 80,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: theme.borderRadius['2xl'],
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing[8],
            }}
          >
            <Text style={{ fontSize: 40, color: theme.colors.white }}>🏠</Text>
          </View>

          {/* Brand Name */}
          <Text
            style={[
              theme.typography.display.lg,
              {
                color: theme.colors.white,
                textAlign: 'center',
                marginBottom: theme.spacing[4],
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              },
            ]}
          >
            {brand.name}
          </Text>

          {/* Tagline */}
          <Text
            style={[
              theme.typography.heading.h2,
              {
                color: theme.colors.white,
                textAlign: 'center',
                marginBottom: theme.spacing[6],
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              },
            ]}
          >
            {title}
          </Text>

          {/* Hero Message */}
          <Text
            style={[
              theme.typography.body.lg,
              {
                color: theme.colors.white,
                textAlign: 'center',
                marginBottom: theme.spacing[8],
                opacity: 0.9,
                lineHeight: theme.typography.body.lg.lineHeight * 1.2,
              },
            ]}
          >
            {message}
          </Text>

          {/* CTA Buttons */}
          <View style={{ width: '100%', alignItems: 'center' }}>
            {onPrimaryPress && (
              <Button
                variant="secondary"
                size="lg"
                onPress={onPrimaryPress}
                style={{
                  width: '80%',
                  marginBottom: theme.spacing[4],
                  ...theme.shadows.lg,
                }}
              >
                {primaryButtonText}
              </Button>
            )}

            {onSecondaryPress && secondaryButtonText && (
              <Button
                variant="ghost"
                size="lg"
                onPress={onSecondaryPress}
                style={{
                  width: '80%',
                }}
                textStyle={{
                  color: theme.colors.white,
                }}
              >
                {secondaryButtonText}
              </Button>
            )}
          </View>
        </View>

        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <View
            style={{
              position: 'absolute',
              bottom: theme.spacing[8],
              left: 0,
              right: 0,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 30,
                height: 50,
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.6)',
                borderRadius: theme.borderRadius.xl,
                alignItems: 'center',
                paddingTop: theme.spacing[2],
              }}
            >
              <View
                style={{
                  width: 4,
                  height: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: 2,
                }}
              />
            </View>
            <Text
              style={[
                theme.typography.caption.sm,
                {
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginTop: theme.spacing[2],
                },
              ]}
            >
              Scroll down
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

// Compact Hero Section (for inner pages)
export interface CompactHeroProps {
  /** Page title */
  title: string;
  
  /** Page subtitle */
  subtitle?: string;
  
  /** Back button callback */
  onBackPress?: () => void;
  
  /** Custom style override */
  style?: ViewStyle;
}

export const CompactHero: React.FC<CompactHeroProps> = ({
  title,
  subtitle,
  onBackPress,
  style,
}) => {
  return (
    <View style={style}>
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.primary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: theme.semanticSpacing.containerPadding.md,
          paddingVertical: theme.semanticSpacing.componentSpacing.lg,
          paddingTop: theme.semanticSpacing.componentSpacing.xl,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[4] }}>
          {onBackPress && (
            <Button
              variant="ghost"
              size="sm"
              onPress={onBackPress}
              style={{ marginRight: theme.spacing[3] }}
              textStyle={{ color: theme.colors.white }}
            >
              ← Back
            </Button>
          )}
        </View>

        <Text
          style={[
            theme.typography.heading.h1,
            {
              color: theme.colors.white,
              marginBottom: subtitle ? theme.spacing[2] : 0,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={[
              theme.typography.body.base,
              {
                color: 'rgba(255, 255, 255, 0.9)',
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </LinearGradient>
    </View>
  );
};

export default HeroSection;