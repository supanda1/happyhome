/**
 * Category Services Screen
 * Display services filtered by category with search and filtering options
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button, Card, Badge, theme, Loading } from '@household-services/ui-kit';
import { useDataSync, usePullToRefresh } from '@household-services/shared';
import { MainScreenProps } from '../types/navigation';

interface Service {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  icon: string;
  pricing: {
    basePrice: number;
    currency: string;
    priceType: 'fixed' | 'hourly' | 'custom';
  };
  rating: number;
  reviewCount: number;
  duration?: number;
  features: string[];
}

type SortOption = 'popular' | 'price_low' | 'price_high' | 'rating' | 'newest';

const SORT_OPTIONS = [
  { value: 'popular' as SortOption, label: 'Most Popular' },
  { value: 'price_low' as SortOption, label: 'Price: Low to High' },
  { value: 'price_high' as SortOption, label: 'Price: High to Low' },
  { value: 'rating' as SortOption, label: 'Highest Rated' },
  { value: 'newest' as SortOption, label: 'Newest' },
];

export const CategoryServicesScreen: React.FC<MainScreenProps<'CategoryServices'>> = ({ 
  navigation, 
  route 
}) => {
  const { categoryId, categoryName } = route.params;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<SortOption>('popular');
  const [showSortModal, setShowSortModal] = useState(false);
  const [priceFilter, setPriceFilter] = useState<'all' | 'under_100' | '100_200' | 'over_200'>('all');
  
  // Use sync hooks for data management
  const { data: services, loading, error, refresh } = useDataSync<Service[]>(`category-services-${categoryId}`);
  const { refreshing, onRefresh } = usePullToRefresh([`category-services-${categoryId}`]);

  // Mock services data for demonstration
  const mockServices: Service[] = [
    {
      id: '1',
      name: 'Leak Detection & Repair',
      description: 'Professional leak detection and repair services for pipes and fixtures',
      categoryId,
      icon: 'pipe-leak',
      pricing: { basePrice: 85, currency: 'USD', priceType: 'fixed' },
      rating: 4.9,
      reviewCount: 89,
      duration: 90,
      features: ['Emergency Service', 'Licensed', 'Warranty'],
    },
    {
      id: '2',
      name: 'Drain Cleaning',
      description: 'Complete drain cleaning and unclogging services',
      categoryId,
      icon: 'water',
      pricing: { basePrice: 120, currency: 'USD', priceType: 'fixed' },
      rating: 4.7,
      reviewCount: 156,
      duration: 60,
      features: ['Same Day', '24/7 Available', 'Eco-Friendly'],
    },
    {
      id: '3',
      name: 'Pipe Installation',
      description: 'New pipe installation and replacement services',
      categoryId,
      icon: 'pipe',
      pricing: { basePrice: 200, currency: 'USD', priceType: 'hourly' },
      rating: 4.8,
      reviewCount: 234,
      duration: 180,
      features: ['Licensed', 'Insured', 'Quality Materials'],
    },
    {
      id: '4',
      name: 'Fixture Replacement',
      description: 'Kitchen and bathroom fixture installation and replacement',
      categoryId,
      icon: 'faucet',
      pricing: { basePrice: 95, currency: 'USD', priceType: 'fixed' },
      rating: 4.6,
      reviewCount: 78,
      duration: 120,
      features: ['Professional', 'Clean Work', 'Warranty'],
    },
  ];

  const displayServices = services || mockServices;

  // Filter and sort services
  const filteredAndSortedServices = useMemo(() => {
    let filtered = [...displayServices];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query)
      );
    }

    // Filter by price range
    if (priceFilter !== 'all') {
      filtered = filtered.filter(service => {
        const price = service.pricing.basePrice;
        switch (priceFilter) {
          case 'under_100':
            return price < 100;
          case '100_200':
            return price >= 100 && price <= 200;
          case 'over_200':
            return price > 200;
          default:
            return true;
        }
      });
    }

    // Sort services
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'price_low':
          return a.pricing.basePrice - b.pricing.basePrice;
        case 'price_high':
          return b.pricing.basePrice - a.pricing.basePrice;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return 0; // Would sort by creation date in real app
        case 'popular':
        default:
          return b.reviewCount - a.reviewCount;
      }
    });

    return filtered;
  }, [displayServices, searchQuery, selectedSort, priceFilter]);

  const handleServicePress = (serviceId: string) => {
    navigation.navigate('ServiceDetail', { serviceId });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRefresh = async () => {
    await Promise.all([onRefresh(), refresh()]);
  };

  const renderServiceCard = ({ item: service }: { item: Service }) => (
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
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
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
            {/* Name and Rating */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: theme.spacing[1],
            }}>
              <Text style={[
                theme.typography.body.lg,
                {
                  fontWeight: '600',
                  color: theme.colors.gray[900],
                  flex: 1,
                  marginRight: theme.spacing[2],
                }
              ]}>
                {service.name}
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="star" size={14} color={theme.colors.warning[500]} />
                <Text style={[
                  theme.typography.body.sm,
                  { color: theme.colors.gray[600], marginLeft: 4 }
                ]}>
                  {service.rating}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text style={[
              theme.typography.body.sm,
              {
                color: theme.colors.gray[600],
                marginBottom: theme.spacing[3],
              }
            ]} numberOfLines={2}>
              {service.description}
            </Text>

            {/* Features */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginBottom: theme.spacing[3],
            }}>
              {service.features.slice(0, 3).map((feature, index) => (
                <Badge
                  key={index}
                  variant="info"
                  size="xs"
                  style={{
                    marginRight: theme.spacing[2],
                    marginBottom: theme.spacing[1],
                  }}
                >
                  {feature}
                </Badge>
              ))}
            </View>

            {/* Price and Duration */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={[
                theme.typography.body.lg,
                {
                  color: theme.colors.primary[600],
                  fontWeight: '700',
                }
              ]}>
                ${service.pricing.basePrice}
                {service.pricing.priceType === 'hourly' && (
                  <Text style={[
                    theme.typography.body.sm,
                    { fontWeight: 'normal' }
                  ]}>
                    /hr
                  </Text>
                )}
              </Text>

              {service.duration && (
                <Text style={[
                  theme.typography.body.sm,
                  { color: theme.colors.gray[500] }
                ]}>
                  {Math.floor(service.duration / 60)}h{' '}
                  {service.duration % 60 > 0 && `${service.duration % 60}m`}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderPriceFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: theme.spacing[4] }}
      style={{ marginBottom: theme.spacing[4] }}
    >
      {[
        { value: 'all' as const, label: 'All Prices' },
        { value: 'under_100' as const, label: 'Under $100' },
        { value: '100_200' as const, label: '$100 - $200' },
        { value: 'over_200' as const, label: 'Over $200' },
      ].map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => setPriceFilter(option.value)}
          style={{
            backgroundColor: priceFilter === option.value 
              ? theme.colors.primary[500] 
              : theme.colors.gray[100],
            paddingHorizontal: theme.spacing[4],
            paddingVertical: theme.spacing[2],
            borderRadius: 20,
            marginRight: theme.spacing[3],
          }}
        >
          <Text style={[
            theme.typography.body.sm,
            {
              color: priceFilter === option.value 
                ? theme.colors.white 
                : theme.colors.gray[700],
              fontWeight: '600',
            }
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (loading && !displayServices?.length) {
    return <Loading message="Loading services..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
      }}>
        <TouchableOpacity onPress={handleGoBack} style={{ marginRight: theme.spacing[4] }}>
          <Icon name="arrow-left" size={24} color={theme.colors.gray[700]} />
        </TouchableOpacity>
        
        <View style={{ flex: 1 }}>
          <Text style={[
            theme.typography.heading.h3,
            { color: theme.colors.gray[900] }
          ]}>
            {categoryName}
          </Text>
          <Text style={[
            theme.typography.body.sm,
            { color: theme.colors.gray[600] }
          ]}>
            {filteredAndSortedServices.length} services available
          </Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={{
        backgroundColor: theme.colors.white,
        paddingVertical: theme.spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
      }}>
        {/* Search Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.gray[50],
          borderRadius: 12,
          marginHorizontal: theme.spacing[4],
          paddingHorizontal: theme.spacing[3],
          marginBottom: theme.spacing[3],
        }}>
          <Icon name="magnify" size={20} color={theme.colors.gray[500]} />
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
              <Icon name="close-circle" size={20} color={theme.colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort and Filter Controls */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing[4],
        }}>
          <TouchableOpacity
            onPress={() => setShowSortModal(!showSortModal)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.gray[100],
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[2],
              borderRadius: 8,
              marginRight: theme.spacing[3],
            }}
          >
            <Icon name="sort" size={16} color={theme.colors.gray[600]} />
            <Text style={[
              theme.typography.body.sm,
              { color: theme.colors.gray[700], marginLeft: theme.spacing[2] }
            ]}>
              {SORT_OPTIONS.find(opt => opt.value === selectedSort)?.label}
            </Text>
          </TouchableOpacity>

          <Text style={[
            theme.typography.body.sm,
            { color: theme.colors.gray[600] }
          ]}>
            {filteredAndSortedServices.length} results
          </Text>
        </View>

        {/* Sort Options */}
        {showSortModal && (
          <View style={{
            backgroundColor: theme.colors.white,
            marginHorizontal: theme.spacing[4],
            marginTop: theme.spacing[3],
            borderRadius: 8,
            ...theme.shadows.sm,
          }}>
            {SORT_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setSelectedSort(option.value);
                  setShowSortModal(false);
                }}
                style={{
                  padding: theme.spacing[3],
                  borderBottomWidth: index < SORT_OPTIONS.length - 1 ? 1 : 0,
                  borderBottomColor: theme.colors.gray[200],
                }}
              >
                <Text style={[
                  theme.typography.body.base,
                  {
                    color: selectedSort === option.value 
                      ? theme.colors.primary[600] 
                      : theme.colors.gray[700],
                    fontWeight: selectedSort === option.value ? '600' : 'normal',
                  }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Price Filters */}
        {renderPriceFilter()}
      </View>

      {/* Services List */}
      <FlatList
        data={filteredAndSortedServices}
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
              No services found
            </Text>
            <Text style={[
              theme.typography.body.base,
              {
                color: theme.colors.gray[500],
                textAlign: 'center',
              }
            ]}>
              Try adjusting your search or filter criteria
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default CategoryServicesScreen;