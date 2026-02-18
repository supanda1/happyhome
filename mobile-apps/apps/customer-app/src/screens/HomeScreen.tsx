/**
 * Customer App - Home Screen
 * 
 * Main home screen matching the web UI layout exactly.
 * Features hero section, service categories, trust badges, and how it works.
 */

import React from 'react';
import {
  ScrollView,
  View,
  SafeAreaView,
  StatusBar,
  Text,
  RefreshControl,
} from 'react-native';
import {
  HeroSection,
  ServiceCategoryGrid,
  TrustBadgeSection,
  HowItWorksSection,
  Button,
  theme,
} from '@household-services/ui-kit';
import { useServiceData, usePullToRefresh } from '@household-services/shared';
import { TabScreenProps } from '../types/navigation';

export const HomeScreen: React.FC<TabScreenProps<'Home'>> = ({ navigation }) => {
  // Use sync hooks for data management
  const { categories, services, banners, loading, error, refreshAll } = useServiceData();
  const { refreshing, onRefresh } = usePullToRefresh(['categories', 'services', 'banners']);

  const handleExploreServices = () => {
    navigation.navigate('Services');
  };

  const handleLearnMore = () => {
    // Navigate to a settings or about screen for now
    navigation.navigate('Settings');
  };

  const handleCategoryPress = (category: any) => {
    navigation.navigate('CategoryServices', { 
      categoryId: category.id,
      categoryName: category.name 
    });
  };

  const handleRefresh = async () => {
    await Promise.all([onRefresh(), refreshAll()]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.primary[500]} 
        translucent
      />
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
        {/* Hero Section */}
        <HeroSection
          onPrimaryPress={handleExploreServices}
          onSecondaryPress={handleLearnMore}
          secondaryButtonText="Learn More"
          style={{ marginTop: -StatusBar.currentHeight }}
        />

        {/* Service Categories Section */}
        <ServiceCategoryGrid
          title="Our Services"
          subtitle="Choose from our wide range of professional home services"
          onCategoryPress={handleCategoryPress}
          containerStyle={{
            backgroundColor: theme.colors.background.primary,
          }}
        />

        {/* Trust Badges Section */}
        <TrustBadgeSection
          title="Why Choose Happy Homes"
          subtitle="We are committed to providing the best service experience"
          variant="light"
        />

        {/* How It Works Section */}
        <HowItWorksSection
          title="How It Works"
          subtitle="Get your service in 3 simple steps"
          orientation="vertical"
          variant="default"
        />

        {/* Bottom CTA Section */}
        <View
          style={{
            backgroundColor: theme.colors.primary[500],
            paddingVertical: theme.semanticSpacing.sectionSpacing.md,
            paddingHorizontal: theme.semanticSpacing.containerPadding.md,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Text
              style={[
                theme.typography.heading.h3,
                {
                  color: theme.colors.white,
                  textAlign: 'center',
                  marginBottom: theme.spacing[3],
                },
              ]}
            >
              Ready to Get Started?
            </Text>
            
            <Text
              style={[
                theme.typography.body.base,
                {
                  color: 'rgba(255, 255, 255, 0.9)',
                  textAlign: 'center',
                  marginBottom: theme.spacing[6],
                },
              ]}
            >
              Book your first service and experience the difference
            </Text>

            <Button
              variant="secondary"
              size="lg"
              onPress={handleExploreServices}
              style={{
                width: '80%',
                ...theme.shadows.lg,
              }}
            >
              Browse All Services
            </Button>
          </View>
        </View>

        {/* Footer Spacer */}
        <View style={{ height: theme.spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;