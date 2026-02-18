/**
 * Happy Homes Service Category Grid Component
 * 
 * Grid layout for service categories matching the web UI design
 * with proper spacing, animations, and mobile optimizations.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ViewStyle,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme, APP_CONSTANTS } from '@happyhomes/shared';

const { width: screenWidth } = Dimensions.get('window');

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient?: {
    colors: string[];
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
}

export interface ServiceCategoryGridProps {
  /** Array of service categories */
  categories?: ServiceCategory[];
  
  /** Number of columns */
  numColumns?: number;
  
  /** Grid item spacing */
  spacing?: number;
  
  /** Section title */
  title?: string;
  
  /** Section subtitle */
  subtitle?: string;
  
  /** Category press callback */
  onCategoryPress?: (category: ServiceCategory) => void;
  
  /** Custom container style */
  containerStyle?: ViewStyle;
  
  /** Show as horizontal scroll instead of grid */
  horizontal?: boolean;
  
  /** Show category descriptions */
  showDescriptions?: boolean;
}

export const ServiceCategoryGrid: React.FC<ServiceCategoryGridProps> = ({
  categories = Object.values(APP_CONSTANTS.SERVICE_CATEGORIES),
  numColumns = 2,
  spacing = theme.spacing[4],
  title = 'Our Services',
  subtitle = 'Choose from our wide range of home services',
  onCategoryPress,
  containerStyle,
  horizontal = false,
  showDescriptions = true,
}) => {
  const itemWidth = horizontal 
    ? theme.sizing.categoryCard.width 
    : (screenWidth - (theme.semanticSpacing.containerPadding.md * 2) - (spacing * (numColumns - 1))) / numColumns;

  const getCategoryGradient = (categoryId: string) => {
    const gradientMap: Record<string, string[]> = {
      'plumbing': [theme.colors.primary[400], theme.colors.primary[600]],
      'electrical': [theme.colors.warning[400], theme.colors.warning[600]],
      'cleaning': [theme.colors.success[400], theme.colors.success[600]],
      'civil-work': [theme.colors.secondary[400], theme.colors.secondary[600]],
      'personal-care': [theme.colors.danger[400], theme.colors.danger[600]],
      'finance-insurance': [theme.colors.primary[300], theme.colors.primary[500]],
    };

    return gradientMap[categoryId] || [theme.colors.primary[400], theme.colors.primary[600]];
  };

  const renderCategoryItem = ({ item: category, index }: { item: ServiceCategory; index: number }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onCategoryPress?.(category)}
      style={{
        width: itemWidth,
        marginBottom: spacing,
        marginRight: horizontal ? spacing : (index % numColumns === numColumns - 1 ? 0 : spacing),
      }}
    >
      <View
        style={{
          borderRadius: theme.borderRadius.xl,
          overflow: 'hidden',
          ...theme.shadows.md,
        }}
      >
        <LinearGradient
          colors={getCategoryGradient(category.id)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: theme.sizing.categoryCard.height,
            padding: theme.semanticSpacing.cardPadding.md,
            justifyContent: 'space-between',
          }}
        >
          {/* Category Icon */}
          <View
            style={{
              width: 50,
              height: 50,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: theme.borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>{category.icon}</Text>
          </View>

          {/* Category Info */}
          <View>
            <Text
              style={[
                theme.typography.heading.h6,
                {
                  color: theme.colors.white,
                  marginBottom: showDescriptions && category.description ? theme.spacing[1] : 0,
                },
              ]}
              numberOfLines={1}
            >
              {category.name}
            </Text>

            {showDescriptions && category.description && (
              <Text
                style={[
                  theme.typography.caption.sm,
                  {
                    color: 'rgba(255, 255, 255, 0.9)',
                  },
                ]}
                numberOfLines={2}
              >
                {category.description}
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  if (horizontal) {
    return (
      <View style={[{ paddingVertical: theme.spacing[6] }, containerStyle]}>
        {/* Section Header */}
        {title && (
          <View style={{ paddingHorizontal: theme.semanticSpacing.containerPadding.md, marginBottom: theme.spacing[6] }}>
            <Text
              style={[
                theme.typography.heading.h2,
                {
                  color: theme.colors.text.primary,
                  textAlign: 'center',
                  marginBottom: theme.spacing[2],
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

        {/* Horizontal Scroll */}
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: theme.semanticSpacing.containerPadding.md,
          }}
        />
      </View>
    );
  }

  // Grid Layout
  return (
    <View style={[{ paddingVertical: theme.spacing[6] }, containerStyle]}>
      {/* Section Header */}
      {title && (
        <View style={{ paddingHorizontal: theme.semanticSpacing.containerPadding.md, marginBottom: theme.spacing[6] }}>
          <Text
            style={[
              theme.typography.heading.h2,
              {
                color: theme.colors.text.primary,
                textAlign: 'center',
                marginBottom: theme.spacing[2],
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

      {/* Grid */}
      <View style={{ paddingHorizontal: theme.semanticSpacing.containerPadding.md }}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          scrollEnabled={false}
        />
      </View>
    </View>
  );
};

// Compact Category List (for drawer/sidebar)
export interface CompactCategoryListProps {
  /** Array of service categories */
  categories?: ServiceCategory[];
  
  /** Category press callback */
  onCategoryPress?: (category: ServiceCategory) => void;
  
  /** Selected category ID */
  selectedCategoryId?: string;
  
  /** Custom container style */
  containerStyle?: ViewStyle;
}

export const CompactCategoryList: React.FC<CompactCategoryListProps> = ({
  categories = Object.values(APP_CONSTANTS.SERVICE_CATEGORIES),
  onCategoryPress,
  selectedCategoryId,
  containerStyle,
}) => {
  const renderCompactItem = ({ item: category }: { item: ServiceCategory }) => {
    const isSelected = selectedCategoryId === category.id;
    
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onCategoryPress?.(category)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: theme.semanticSpacing.componentSpacing.md,
          marginBottom: theme.spacing[1],
          backgroundColor: isSelected ? theme.colors.primary[50] : 'transparent',
          borderRadius: theme.borderRadius.md,
          borderLeftWidth: 3,
          borderLeftColor: isSelected ? theme.colors.primary[500] : 'transparent',
        }}
      >
        {/* Category Icon */}
        <View
          style={{
            width: 36,
            height: 36,
            backgroundColor: isSelected ? theme.colors.primary[100] : theme.colors.secondary[100],
            borderRadius: theme.borderRadius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing[3],
          }}
        >
          <Text style={{ fontSize: 18 }}>{category.icon}</Text>
        </View>

        {/* Category Name */}
        <Text
          style={[
            theme.typography.body.base,
            {
              color: isSelected ? theme.colors.primary[700] : theme.colors.text.primary,
              fontWeight: isSelected ? '600' : '400',
            },
          ]}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={containerStyle}>
      <FlatList
        data={categories}
        renderItem={renderCompactItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

export default ServiceCategoryGrid;