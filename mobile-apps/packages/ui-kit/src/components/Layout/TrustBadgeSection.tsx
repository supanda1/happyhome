/**
 * Happy Homes Trust Badge Section Component
 * 
 * Trust badges section matching the web UI design
 * showcasing company reliability and service quality.
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { theme, APP_CONSTANTS } from '@happyhomes/shared';

const { width: screenWidth } = Dimensions.get('window');

interface TrustBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface TrustBadgeSectionProps {
  /** Array of trust badges */
  badges?: TrustBadge[];
  
  /** Section title */
  title?: string;
  
  /** Section subtitle */
  subtitle?: string;
  
  /** Number of columns */
  numColumns?: number;
  
  /** Custom container style */
  containerStyle?: ViewStyle;
  
  /** Background variant */
  variant?: 'default' | 'light' | 'primary';
}

export const TrustBadgeSection: React.FC<TrustBadgeSectionProps> = ({
  badges = Object.values(APP_CONSTANTS.TRUST_BADGES),
  title = 'Why Choose Us',
  subtitle = 'We are committed to providing the best service experience',
  numColumns = 2,
  containerStyle,
  variant = 'light',
}) => {
  const itemWidth = (screenWidth - (theme.semanticSpacing.containerPadding.md * 2) - theme.spacing[4]) / numColumns;

  const getBackgroundColor = () => {
    switch (variant) {
      case 'light':
        return theme.colors.background.secondary;
      case 'primary':
        return theme.colors.primary[50];
      case 'default':
      default:
        return theme.colors.background.primary;
    }
  };

  const renderBadgeItem = ({ item: badge, index }: { item: TrustBadge; index: number }) => (
    <View
      style={{
        width: itemWidth,
        marginBottom: theme.spacing[6],
        marginRight: index % numColumns === numColumns - 1 ? 0 : theme.spacing[4],
        alignItems: 'center',
      }}
    >
      {/* Badge Icon Container */}
      <View
        style={{
          width: 80,
          height: 80,
          backgroundColor: theme.colors.primary[100],
          borderRadius: theme.borderRadius['2xl'],
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing[4],
          ...theme.shadows.md,
        }}
      >
        <Text style={{ fontSize: 36 }}>{badge.icon}</Text>
      </View>

      {/* Badge Content */}
      <View style={{ alignItems: 'center' }}>
        <Text
          style={[
            theme.typography.heading.h6,
            {
              color: theme.colors.text.primary,
              textAlign: 'center',
              marginBottom: theme.spacing[2],
            },
          ]}
        >
          {badge.title}
        </Text>

        <Text
          style={[
            theme.typography.body.sm,
            {
              color: theme.colors.text.secondary,
              textAlign: 'center',
            },
          ]}
        >
          {badge.description}
        </Text>
      </View>
    </View>
  );

  return (
    <View
      style={[
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: theme.semanticSpacing.sectionSpacing.lg,
        },
        containerStyle,
      ]}
    >
      {/* Section Header */}
      {title && (
        <View style={{ paddingHorizontal: theme.semanticSpacing.containerPadding.md, marginBottom: theme.spacing[8] }}>
          <Text
            style={[
              theme.typography.heading.h2,
              {
                color: theme.colors.text.primary,
                textAlign: 'center',
                marginBottom: theme.spacing[3],
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
                  color: theme.colors.text.secondary,
                  textAlign: 'center',
                },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* Badge Grid */}
      <View style={{ paddingHorizontal: theme.semanticSpacing.containerPadding.md }}>
        <FlatList
          data={badges}
          renderItem={renderBadgeItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          scrollEnabled={false}
        />
      </View>
    </View>
  );
};

// Horizontal Trust Badges (for compact layouts)
export interface HorizontalTrustBadgesProps {
  /** Array of trust badges */
  badges?: TrustBadge[];
  
  /** Custom container style */
  containerStyle?: ViewStyle;
  
  /** Show only icons */
  iconsOnly?: boolean;
}

export const HorizontalTrustBadges: React.FC<HorizontalTrustBadgesProps> = ({
  badges = Object.values(APP_CONSTANTS.TRUST_BADGES),
  containerStyle,
  iconsOnly = false,
}) => {
  const renderHorizontalBadge = ({ item: badge }: { item: TrustBadge }) => (
    <View
      style={{
        alignItems: 'center',
        marginRight: theme.spacing[6],
        minWidth: iconsOnly ? 60 : 100,
      }}
    >
      {/* Badge Icon */}
      <View
        style={{
          width: iconsOnly ? 50 : 60,
          height: iconsOnly ? 50 : 60,
          backgroundColor: theme.colors.primary[100],
          borderRadius: theme.borderRadius.xl,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: iconsOnly ? 0 : theme.spacing[2],
        }}
      >
        <Text style={{ fontSize: iconsOnly ? 24 : 28 }}>{badge.icon}</Text>
      </View>

      {/* Badge Text */}
      {!iconsOnly && (
        <Text
          style={[
            theme.typography.caption.sm,
            {
              color: theme.colors.text.secondary,
              textAlign: 'center',
            },
          ]}
          numberOfLines={2}
        >
          {badge.title}
        </Text>
      )}
    </View>
  );

  return (
    <View style={containerStyle}>
      <FlatList
        data={badges}
        renderItem={renderHorizontalBadge}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.semanticSpacing.containerPadding.md,
        }}
      />
    </View>
  );
};

// Compact Trust Summary (for cards/modals)
export interface CompactTrustSummaryProps {
  /** Custom container style */
  containerStyle?: ViewStyle;
  
  /** Selected trust points to highlight */
  highlights?: string[];
}

export const CompactTrustSummary: React.FC<CompactTrustSummaryProps> = ({
  containerStyle,
  highlights = ['expert-professionals', 'same-day-service', 'insured-bonded'],
}) => {
  const badges = Object.values(APP_CONSTANTS.TRUST_BADGES);
  const highlightedBadges = badges.filter(badge => highlights.includes(badge.id));

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.primary[50],
          borderRadius: theme.borderRadius.lg,
          padding: theme.semanticSpacing.cardPadding.md,
          borderLeftWidth: 3,
          borderLeftColor: theme.colors.primary[500],
        },
        containerStyle,
      ]}
    >
      {highlightedBadges.map((badge, index) => (
        <View
          key={badge.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: index === highlightedBadges.length - 1 ? 0 : theme.spacing[3],
          }}
        >
          {/* Badge Icon */}
          <View
            style={{
              width: 32,
              height: 32,
              backgroundColor: theme.colors.primary[100],
              borderRadius: theme.borderRadius.md,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing[3],
            }}
          >
            <Text style={{ fontSize: 16 }}>{badge.icon}</Text>
          </View>

          {/* Badge Text */}
          <View style={{ flex: 1 }}>
            <Text
              style={[
                theme.typography.body.sm,
                {
                  color: theme.colors.primary[700],
                  fontWeight: '600',
                },
              ]}
            >
              {badge.title}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default TrustBadgeSection;