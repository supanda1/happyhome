/**
 * Services Screen
 * Browse all services with search, filters, and categories
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button, Card, theme, Loading } from '@household-services/ui-kit';
import { useServiceData, usePullToRefresh } from '@household-services/shared';
import { TabScreenProps } from '../types/navigation';

export const ServicesScreen: React.FC<TabScreenProps<'Services'>> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Use sync hooks for data management
  const { categories, services, loading, error, refreshAll } = useServiceData();
  const { refreshing, onRefresh } = usePullToRefresh(['categories', 'services']);

  // Filter services based on search and category
  const filteredServices = useMemo(() => {
    let filtered = services || [];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.category?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(service => 
        service.categoryId === selectedCategory
      );
    }

    return filtered;
  }, [services, searchQuery, selectedCategory]);

  const handleServicePress = (serviceId: string) => {
    navigation.navigate('ServiceDetail', { serviceId });
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null); // Deselect if already selected
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([onRefresh(), refreshAll()]);
  };

  const renderServiceCard = ({ item: service }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleServicePress(service.id)}
      style={{ marginBottom: theme.spacing[4] }}
    >
      <Card
        style={{
          padding: theme.spacing[4],
          marginHorizontal: theme.spacing[4],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Service Icon */}
          <View style={{
            backgroundColor: theme.colors.primary[50],
            borderRadius: 12,
            width: 48,
            height: 48,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: theme.spacing[3],
          }}>
            <Icon
              name={service.icon || 'wrench'}
              size={24}
              color={theme.colors.primary[600]}
            />
          </View>

          {/* Service Info */}
          <View style={{ flex: 1 }}>
            <Text style={[
              theme.typography.body.lg,
              {
                fontWeight: '600',
                color: theme.colors.gray[900],
                marginBottom: theme.spacing[1],
              }
            ]}>
              {service.name}
            </Text>
            
            {service.description && (
              <Text style={[
                theme.typography.body.sm,
                {
                  color: theme.colors.gray[600],
                  marginBottom: theme.spacing[2],
                }
              ]} numberOfLines={2}>
                {service.description}
              </Text>
            )}

            {/* Pricing */}
            {service.pricing && (
              <Text style={[
                theme.typography.body.base,
                {
                  color: theme.colors.primary[600],
                  fontWeight: '600',
                }
              ]}>
                Starting from ${service.pricing.basePrice}
              </Text>
            )}
          </View>

          {/* Arrow */}
          <Icon
            name="chevron-right"
            size={20}
            color={theme.colors.gray[400]}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderCategoryFilter = ({ item: category }: { item: any }) => {
    const isSelected = selectedCategory === category.id;
    
    return (
      <TouchableOpacity
        onPress={() => handleCategoryPress(category.id, category.name)}
        style={{
          backgroundColor: isSelected ? theme.colors.primary[500] : theme.colors.gray[100],
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[2],
          borderRadius: 20,
          marginRight: theme.spacing[3],
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Icon
          name={category.icon || 'wrench'}
          size={16}
          color={isSelected ? theme.colors.white : theme.colors.gray[600]}
          style={{ marginRight: theme.spacing[2] }}
        />
        <Text style={[
          theme.typography.body.sm,
          {
            color: isSelected ? theme.colors.white : theme.colors.gray[700],
            fontWeight: '600',
          }
        ]}>
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading && !services?.length) {
    return <Loading message="Loading services..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[3],
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
      }}>
        <Text style={[
          theme.typography.heading.h2,
          {
            color: theme.colors.gray[900],
            marginBottom: theme.spacing[4],
          }
        ]}>
          Our Services
        </Text>

        {/* Search Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.gray[50],
          borderRadius: 12,
          paddingHorizontal: theme.spacing[3],
          marginBottom: theme.spacing[4],
        }}>
          <Icon
            name="magnify"
            size={20}
            color={theme.colors.gray[500]}
          />
          <TextInput
            placeholder="Search services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              paddingVertical: theme.spacing[3],
              paddingLeft: theme.spacing[2],
              fontSize: 16,
              color: theme.colors.gray[900],
            }}
            placeholderTextColor={theme.colors.gray[500]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon
                name="close-circle"
                size={20}
                color={theme.colors.gray[400]}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters */}
        {categories && categories.length > 0 && (
          <View>
            <Text style={[
              theme.typography.body.sm,
              {
                color: theme.colors.gray[600],
                marginBottom: theme.spacing[3],
                fontWeight: '600',
              }
            ]}>
              Categories
            </Text>
            
            <FlatList
              data={categories}
              renderItem={renderCategoryFilter}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingRight: theme.spacing[4],
              }}
            />
          </View>
        )}
      </View>

      {/* Services List */}
      <FlatList
        data={filteredServices}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[8],
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
        ListEmptyComponent={
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: theme.spacing[12],
            paddingHorizontal: theme.spacing[6],
          }}>
            <Icon
              name="wrench"
              size={48}
              color={theme.colors.gray[400]}
              style={{ marginBottom: theme.spacing[4] }}
            />
            <Text style={[
              theme.typography.heading.h4,
              {
                color: theme.colors.gray[600],
                textAlign: 'center',
                marginBottom: theme.spacing[2],
              }
            ]}>
              {searchQuery || selectedCategory ? 'No services found' : 'No services available'}
            </Text>
            <Text style={[
              theme.typography.body.base,
              {
                color: theme.colors.gray[500],
                textAlign: 'center',
              }
            ]}>
              {searchQuery || selectedCategory
                ? 'Try adjusting your search or filter criteria'
                : 'Services will be available soon'
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default ServicesScreen;